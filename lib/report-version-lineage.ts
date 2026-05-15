import type { FortuneAnalysisResult } from '@/lib/user-types';

export type ReportVersionLineageEntry = {
  version: string;
  generatedAt?: string;
  generatedFrom?: 'analyze' | 'upgrade';
  upgradedFromVersion?: string;
  reasoningMode?: 'engine' | 'deterministic-expert' | 'parallel-agents';
  llmUsed?: boolean;
  agenticUsed?: boolean;
  qualityScore?: number;
  qualityGrade?: 'S' | 'A' | 'B' | 'C';
  deliveryTier?: 'basic' | 'enhanced' | 'expert';
  targetAchieved?: boolean;
  summary?: string;
};

type AnalysisShape = FortuneAnalysisResult['analysis'];

export function withReportVersionLineage(params: {
  previousAnalysis?: AnalysisShape;
  previousReportVersion?: string;
  nextAnalysis: AnalysisShape;
  nextReportVersion: string;
}) {
  const previousEntries = normalizeLineageEntries(params.previousAnalysis?.versionLineage);
  const mergedEntries = dedupeLineageEntries([
    ...previousEntries,
    createLineageEntry(params.previousAnalysis, params.previousReportVersion),
    createLineageEntry(params.nextAnalysis, params.nextReportVersion),
  ]);

  return {
    ...params.nextAnalysis,
    versionLineage: mergedEntries.slice(0, 8),
  };
}

export function createLineageEntry(
  analysis?: AnalysisShape,
  reportVersion?: string
): ReportVersionLineageEntry | null {
  const version = `${reportVersion || analysis?.pipelineVersion || ''}`.trim();
  if (!version) {
    return null;
  }

  return {
    version,
    generatedAt: analysis?.generatedAt,
    generatedFrom: analysis?.generatedFrom,
    upgradedFromVersion: analysis?.upgradedFromVersion,
    reasoningMode: analysis?.reasoningMode,
    llmUsed: analysis?.llmUsed,
    agenticUsed: analysis?.agenticUsed,
    qualityScore: analysis?.qualityAudit?.overallScore,
    qualityGrade: analysis?.qualityAudit?.grade,
    deliveryTier: analysis?.qualityAudit?.deliveryTier,
    targetAchieved: analysis?.qualityAudit?.targetAchieved,
    summary: analysis?.qualityAudit?.summary || analysis?.opening,
  };
}

function normalizeLineageEntries(entries: unknown): ReportVersionLineageEntry[] {
  if (!Array.isArray(entries)) {
    return [];
  }

  const normalized: ReportVersionLineageEntry[] = [];

  entries.forEach((item) => {
    if (!item || typeof item !== 'object') {
      return;
    }

    const candidate = item as ReportVersionLineageEntry;
    if (!candidate.version) {
      return;
    }

    normalized.push({
      version: candidate.version,
      generatedAt: candidate.generatedAt,
      generatedFrom: candidate.generatedFrom,
      upgradedFromVersion: candidate.upgradedFromVersion,
      reasoningMode: candidate.reasoningMode,
      llmUsed: candidate.llmUsed,
      agenticUsed: candidate.agenticUsed,
      qualityScore: candidate.qualityScore,
      qualityGrade: candidate.qualityGrade,
      deliveryTier: candidate.deliveryTier,
      targetAchieved: candidate.targetAchieved,
      summary: candidate.summary,
    });
  });

  return normalized;
}

function dedupeLineageEntries(entries: Array<ReportVersionLineageEntry | null>) {
  const seen = new Set<string>();

  return entries
    .filter((item): item is ReportVersionLineageEntry => !!item)
    .sort((left, right) => {
      const leftTime = left.generatedAt ? new Date(left.generatedAt).getTime() : 0;
      const rightTime = right.generatedAt ? new Date(right.generatedAt).getTime() : 0;
      return rightTime - leftTime;
    })
    .filter((item) => {
      const key = [
        item.version,
        item.generatedAt || '',
        item.generatedFrom || '',
        item.qualityScore || '',
      ].join('|');
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
}
