/**
 * Section-level agent re-run (Experience Kernel).
 * Recompute only selected agent keys and merge into existing report —
 * never rewrite engine chart structure.
 */

import { runAgenticPipeline } from '@/lib/agentic-report';
import type { CoreAgentKey } from '@/lib/agentic-report/agent-definitions';
import {
  flattenGroundTruthFromReport,
} from '@/lib/calculation-identity';
import {
  buildGroundTruthPackFromReport,
  packToAgenticGroundTruth,
} from '@/lib/ground-truth/pack';
import { buildReportQualityAudit } from '@/lib/report-quality';
import type { FortuneAnalysisResult, FortuneRecord } from '@/lib/user-types';
import {
  normalizeSectionKeys,
  SECTION_RERUN_CATALOG,
} from '@/lib/experience-kernel/section-catalog';

export { normalizeSectionKeys, SECTION_RERUN_CATALOG, isCoreAgentKey } from '@/lib/experience-kernel/section-catalog';

function recordToBaseResult(record: FortuneRecord): FortuneAnalysisResult {
  return {
    basic: record.bazi as FortuneAnalysisResult['basic'],
    fiveElements: record.fiveElements,
    tenGods: record.tenGods,
    pattern: record.pattern,
    fortune: record.fortune,
    advice: record.advice as FortuneAnalysisResult['advice'],
    evidence: record.evidence,
    analysis: record.analysis,
    klineData: record.klineData || null,
    dayun: record.dayun,
    shenSha: record.shenSha,
  } as FortuneAnalysisResult;
}

/**
 * Run selected agents and merge results into the report analysis blob.
 * Returns updated analysis for the caller to persist.
 */
export async function rerunReportSections(params: {
  record: FortuneRecord;
  agentKeys: CoreAgentKey[];
}): Promise<{
  ok: boolean;
  analysis: FortuneAnalysisResult['analysis'];
  ran: CoreAgentKey[];
  succeeded: string[];
  failed: string[];
  durationMs: number;
  error?: string;
}> {
  const keys = normalizeSectionKeys(params.agentKeys);
  if (!keys.length) {
    return {
      ok: false,
      analysis: params.record.analysis,
      ran: [],
      succeeded: [],
      failed: [],
      durationMs: 0,
      error: 'NO_VALID_SECTION',
    };
  }

  const birthDate = new Date(params.record.birthDate);
  if (!Number.isFinite(birthDate.getTime())) {
    return {
      ok: false,
      analysis: params.record.analysis,
      ran: keys,
      succeeded: [],
      failed: keys,
      durationMs: 0,
      error: 'INVALID_BIRTH_DATE',
    };
  }

  const baseResult = recordToBaseResult(params.record);
  const pack = buildGroundTruthPackFromReport(birthDate, baseResult);
  const groundTruth = {
    ...flattenGroundTruthFromReport(birthDate, baseResult),
    ...packToAgenticGroundTruth(pack),
  };

  const started = Date.now();
  const agentic = await runAgenticPipeline({
    enabled: true,
    agentKeys: keys,
    enableRetry: true,
    groundTruth,
    context: {
      birthDate,
      birthPlace: params.record.birthPlace,
      currentPlace: params.record.birthPlace,
      report: {
        advice: baseResult.advice,
        fortune: baseResult.fortune,
      },
    },
  });

  const prevAnalysis = { ...(params.record.analysis || {}) } as NonNullable<
    FortuneAnalysisResult['analysis']
  >;
  const prevAgentResults =
    prevAnalysis.agentResults && typeof prevAnalysis.agentResults === 'object'
      ? { ...(prevAnalysis.agentResults as Record<string, unknown>) }
      : {};

  // Merge only requested section outputs; preserve other sections
  const nextAgentResults = {
    ...prevAgentResults,
    ...(agentic.agentResults || {}),
  };

  const prevOrch = (prevAnalysis.orchestration || {}) as Record<string, unknown>;
  const notes = Array.isArray(prevAnalysis.enhancementNotes)
    ? [...prevAnalysis.enhancementNotes]
    : [];
  notes.push(
    `section-rerun:${keys.join(',')}:${new Date().toISOString()}:ok=${agentic.orchestration?.succeeded?.join('|') || ''}`,
  );

  const draft = {
    ...baseResult,
    analysis: {
      ...prevAnalysis,
      agentResults: nextAgentResults,
      agenticUsed: true,
      verify: agentic.verify || prevAnalysis.verify,
      orchestration: {
        ...prevOrch,
        mode: 'section-rerun',
        lastSectionRerun: {
          keys,
          succeeded: agentic.orchestration?.succeeded || [],
          failed: agentic.orchestration?.failed || [],
          at: new Date().toISOString(),
          durationMs: Date.now() - started,
        },
        successRate: agentic.orchestration?.successRate,
      },
      enhancementNotes: notes.slice(-24),
    },
  } as FortuneAnalysisResult;

  draft.analysis.qualityAudit = buildReportQualityAudit(draft);

  return {
    ok: (agentic.orchestration?.succeeded?.length || 0) > 0 || agentic.used,
    analysis: draft.analysis,
    ran: keys,
    succeeded: agentic.orchestration?.succeeded || [],
    failed: agentic.orchestration?.failed || [],
    durationMs: Date.now() - started,
  };
}
