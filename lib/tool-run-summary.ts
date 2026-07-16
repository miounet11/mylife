/**
 * Engine-backed free-tool run summary.
 * Replaces report-opening rehash with GroundTruthPack projections.
 * Production `lib/tools.ts` / ToolRunner should call this instead of
 * re-labeling analysis.opening.
 */

import {
  buildGroundTruthPackFromReport,
  type GroundTruthPack,
} from '@/lib/ground-truth/pack';
import {
  projectToolEngineSummary,
  toolSlugToCategory,
  type ToolThemeCategory,
} from '@/lib/ground-truth/tool-projector';
import type { FortuneAnalysisResult } from '@/lib/user-types';
import { summarizeToolSessions, type ToolMemorySummary } from '@/lib/tool-context';

export interface ToolRunSummaryShape {
  headline: string;
  summary: string;
  confidenceLabel: string;
  recommendedAction: string;
  riskReminder: string;
  whyItMatches: string;
  evidence: string[];
  premiumPreview: string[];
}

export interface ToolRunToolMeta {
  slug: string;
  shortTitle: string;
  title?: string;
  valuePromise?: string;
  relatedReportThemes?: string[];
  chatIntent?: string | null;
  premiumServiceKey?: string | null;
  category?: string;
}

/**
 * Build free-tool summary from report engine truth (preferred path).
 */
export function buildEngineToolRunSummary(params: {
  tool: ToolRunToolMeta;
  /** Full analyze result or nested under report.result */
  report: {
    name?: string;
    birthDate?: string | Date;
    result?: FortuneAnalysisResult | null;
    analysis?: FortuneAnalysisResult['analysis'] | null;
    pattern?: { type?: string } | null;
    advice?: FortuneAnalysisResult['advice'] | null;
    yongShen?: FortuneAnalysisResult extends { yongShen?: infer Y } ? Y : unknown;
    dayun?: unknown;
    klineData?: unknown;
    basic?: FortuneAnalysisResult['basic'];
    reportVersion?: string;
    shenSha?: unknown;
  };
  recentSessions?: Array<{
    toolSlug?: string;
    meta?: Record<string, unknown>;
    result?: { headline?: string; recommendedAction?: string };
    createdAt?: string;
  } | null | undefined>;
  note?: string;
  pack?: GroundTruthPack;
}): ToolRunSummaryShape {
  const { tool, report, note } = params;
  const birthDate = report.birthDate ? new Date(report.birthDate as string | Date) : new Date();
  const baseResult = (report.result || report) as FortuneAnalysisResult;

  let pack = params.pack;
  try {
    pack =
      pack ||
      buildGroundTruthPackFromReport(birthDate, baseResult, {
        birthSignature: undefined,
      });
  } catch {
    pack = undefined;
  }

  const category: ToolThemeCategory =
    (tool.category as ToolThemeCategory) || toolSlugToCategory(tool.slug);

  const memory = summarizeToolSessions(
    (params.recentSessions || []) as Parameters<typeof summarizeToolSessions>[0],
    null,
    4,
  );

  if (pack && pack.lockedFacts.dayMaster) {
    const projected = projectToolEngineSummary({
      pack,
      category,
      toolTitle: tool.title || tool.shortTitle,
      shortTitle: tool.shortTitle,
      note,
    });

    return {
      headline: projected.headline,
      summary: [
        projected.summary,
        tool.valuePromise ? `${tool.valuePromise}。` : '',
        memory ? memory.summary : '',
      ]
        .filter(Boolean)
        .join(''),
      confidenceLabel: projected.confidenceLabel,
      recommendedAction: projected.recommendedAction,
      riskReminder: projected.riskReminder,
      whyItMatches: [
        projected.whyItMatches,
        tool.relatedReportThemes?.length
          ? ` 主题对齐：${tool.relatedReportThemes.join(' / ')}。`
          : '',
        memory?.focusAreas?.length
          ? ` 近期工具关注：${memory.focusAreas.join(' / ')}。`
          : '',
      ]
        .filter(Boolean)
        .join(''),
      evidence: [
        ...projected.evidence,
        ...(memory?.evidence || []),
      ].filter(Boolean).slice(0, 6),
      premiumPreview: [
        '完整版本会展开具体窗口、风险触发点和优先动作顺序（仍锚定引擎真值）',
        tool.chatIntent ? '可继续进入专项追问，围绕这一类问题深问' : '可继续回到聊天页做结构追问',
        tool.premiumServiceKey ? '如需高价值判断，可直接升级到专项服务' : '可继续搭配阶段窗口与十维度使用',
      ],
    };
  }

  // Fallback when pack cannot be built (incomplete report)
  return buildLegacyToolRunSummary({ tool, report, memory, note });
}

function buildLegacyToolRunSummary(params: {
  tool: ToolRunToolMeta;
  report: {
    name?: string;
    analysis?: { opening?: string; explanation?: string } | null;
    pattern?: { type?: string } | null;
    advice?: {
      career?: { general?: string };
      wealth?: { general?: string };
      marriage?: { general?: string };
      health?: { general?: string };
      overall?: string;
    } | null;
    reportVersion?: string;
  };
  memory: ToolMemorySummary | null;
  note?: string;
}): ToolRunSummaryShape {
  const { tool, report, memory, note } = params;
  const opening =
    `${report.analysis?.opening || ''}`.trim() ||
    `${report.name || '当前'}已进入需要重新排顺序的阶段。`;
  const explanation =
    `${report.analysis?.explanation || ''}`.trim() ||
    '这份结果会优先围绕结构、阶段、环境和动作四层展开。';
  const adviceSignals = [
    report.advice?.career?.general,
    report.advice?.wealth?.general,
    report.advice?.marriage?.general,
    report.advice?.health?.general,
    report.advice?.overall,
  ]
    .map((value) => (typeof value === 'string' ? value.trim() : ''))
    .filter((value) => value.length > 0)
    .slice(0, 2);
  const patternLabel = report.pattern?.type || '当前格局';

  return {
    headline: `${tool.shortTitle}显示：${opening.replace(/[。！!]+$/g, '')}`,
    summary: `${tool.valuePromise || tool.shortTitle}。当前更值得先看的是「${patternLabel}」与阶段节奏。${note ? `补充：${note}` : explanation}${memory ? ` ${memory.summary}` : ''}`,
    confidenceLabel: report.reportVersion?.includes('agent') ? '多层增强' : '基础结构判断',
    recommendedAction:
      adviceSignals[0] ||
      memory?.recentSessions[0]?.recommendedAction ||
      `${tool.shortTitle}建议先围绕一个真实场景做缩窄。`,
    riskReminder: adviceSignals[1] || '信息还不完整时，短周期判断避免当成长期定论。',
    whyItMatches: `${tool.shortTitle}与当前档案相关。${memory ? `最近工具指向 ${memory.focusAreas.join(' / ')}。` : ''}`,
    evidence: [opening, explanation, `格局：${patternLabel}`, ...(memory?.evidence || [])].filter(Boolean),
    premiumPreview: [
      '完整版本会展开具体窗口、风险触发点和优先动作顺序',
      '可继续回到聊天页做结构追问',
      '可继续搭配十维度与事件验证使用',
    ],
  };
}
