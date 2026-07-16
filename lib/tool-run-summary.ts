/**
 * Engine-backed free-tool run summary.
 * Replaces report-opening rehash with GroundTruthPack projections.
 * Paths (in order):
 * 1. explicit pack
 * 2. pack from full report analysis
 * 3. pack rebuilt from report.birth* when analysis is thin / missing dayMaster
 * 4. pack from explicit birth input (no report)
 * 5. legacy opening rehash (last resort)
 */

import {
  buildGroundTruthPackFromBirth,
  buildGroundTruthPackFromReport,
  type GroundTruthPack,
} from '@/lib/ground-truth/pack';
import {
  projectToolEngineSummary,
  toolSlugToCategory,
  type ToolThemeCategory,
} from '@/lib/ground-truth/tool-projector';
import type { FortuneAnalysisResult } from '@/lib/user-types';
import type { BirthInput } from '@/lib/fortune-context-builder';
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
  /** Engine preserve tokens for optional LLM polish gate */
  preserveTokens?: string[];
  /** Which engine path produced this summary */
  engineSource?: 'pack' | 'report' | 'birth-from-report' | 'birth' | 'legacy';
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

export interface ToolRunReportLike {
  name?: string;
  birthDate?: string | Date;
  birthTime?: string;
  birthPlace?: string;
  birthAccuracy?: BirthInput['birthAccuracy'];
  gender?: 'male' | 'female' | string;
  result?: FortuneAnalysisResult | null;
  analysis?: FortuneAnalysisResult['analysis'] | null;
  pattern?: { type?: string } | null;
  advice?: FortuneAnalysisResult['advice'] | null;
  yongShen?: unknown;
  dayun?: unknown;
  klineData?: unknown;
  basic?: FortuneAnalysisResult['basic'];
  bazi?: FortuneAnalysisResult['basic'];
  reportVersion?: string;
  shenSha?: unknown;
  fiveElements?: unknown;
  tenGods?: unknown;
  fortune?: unknown;
  evidence?: unknown;
}

function isUsablePack(pack: GroundTruthPack | undefined | null): pack is GroundTruthPack {
  return Boolean(pack?.lockedFacts?.dayMaster);
}

function tryPackFromReport(report: ToolRunReportLike): GroundTruthPack | undefined {
  try {
    const birthDate = report.birthDate ? new Date(report.birthDate as string | Date) : new Date();
    if (!Number.isFinite(birthDate.getTime())) return undefined;
    const baseResult = (report.result || {
      basic: report.basic || report.bazi,
      fiveElements: report.fiveElements,
      tenGods: report.tenGods,
      pattern: report.pattern,
      fortune: report.fortune,
      advice: report.advice,
      evidence: report.evidence,
      analysis: report.analysis,
      klineData: report.klineData,
      dayun: report.dayun,
      shenSha: report.shenSha,
      yongShen: report.yongShen,
    }) as FortuneAnalysisResult;
    const pack = buildGroundTruthPackFromReport(birthDate, baseResult);
    return isUsablePack(pack) ? pack : undefined;
  } catch {
    return undefined;
  }
}

function tryPackFromBirth(input: BirthInput): GroundTruthPack | undefined {
  try {
    if (!input.birthDate) return undefined;
    const pack = buildGroundTruthPackFromBirth(input);
    return isUsablePack(pack) ? pack : undefined;
  } catch {
    return undefined;
  }
}

function birthInputFromReport(report: ToolRunReportLike): BirthInput | null {
  const birthDate = `${report.birthDate || ''}`.trim();
  if (!birthDate) return null;
  const gender =
    report.gender === 'female' || report.gender === 'male' ? report.gender : undefined;
  return {
    birthDate,
    birthTime: report.birthTime,
    birthPlace: report.birthPlace,
    birthAccuracy: report.birthAccuracy,
    gender,
    name: report.name,
  };
}

/**
 * Resolve engine pack for free tools — prefer report, rebuild from birth when thin.
 */
export function resolveToolEnginePack(params: {
  pack?: GroundTruthPack;
  report?: ToolRunReportLike | null;
  birth?: BirthInput | null;
}): { pack?: GroundTruthPack; source: ToolRunSummaryShape['engineSource'] } {
  if (isUsablePack(params.pack)) {
    return { pack: params.pack, source: 'pack' };
  }

  if (params.report) {
    const fromReport = tryPackFromReport(params.report);
    if (fromReport) return { pack: fromReport, source: 'report' };

    const birth = birthInputFromReport(params.report);
    if (birth) {
      const rebuilt = tryPackFromBirth(birth);
      if (rebuilt) return { pack: rebuilt, source: 'birth-from-report' };
    }
  }

  if (params.birth) {
    const fromBirth = tryPackFromBirth(params.birth);
    if (fromBirth) return { pack: fromBirth, source: 'birth' };
  }

  return { source: 'legacy' };
}

/**
 * Build free-tool summary from report / birth engine truth (preferred path).
 */
export function buildEngineToolRunSummary(params: {
  tool: ToolRunToolMeta;
  report?: ToolRunReportLike | null;
  birth?: BirthInput | null;
  recentSessions?: Array<{
    toolSlug?: string;
    meta?: Record<string, unknown>;
    result?: { headline?: string; recommendedAction?: string };
    createdAt?: string;
  } | null | undefined>;
  note?: string;
  pack?: GroundTruthPack;
}): ToolRunSummaryShape {
  const { tool, note } = params;
  const report = params.report || {};

  const { pack, source } = resolveToolEnginePack({
    pack: params.pack,
    report: params.report,
    birth: params.birth,
  });

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

    const sourceLabel =
      source === 'birth' || source === 'birth-from-report'
        ? '（由出生信息重算引擎）'
        : '';

    return {
      headline: projected.headline,
      summary: [
        projected.summary,
        tool.valuePromise ? `${tool.valuePromise}。` : '',
        memory ? memory.summary : '',
      ]
        .filter(Boolean)
        .join(''),
      confidenceLabel: `${projected.confidenceLabel}${sourceLabel}`,
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
      evidence: [...projected.evidence, ...(memory?.evidence || [])].filter(Boolean).slice(0, 6),
      premiumPreview: [
        '完整版本会展开具体窗口、风险触发点和优先动作顺序（仍锚定引擎真值）',
        tool.chatIntent ? '可继续进入专项追问，围绕这一类问题深问' : '可继续回到聊天页做结构追问',
        tool.premiumServiceKey ? '如需高价值判断，可直接升级到专项服务' : '可继续搭配阶段窗口与十维度使用',
      ],
      preserveTokens: projected.preserveTokens,
      engineSource: source,
    };
  }

  return {
    ...buildLegacyToolRunSummary({ tool, report, memory, note }),
    engineSource: 'legacy',
  };
}

function buildLegacyToolRunSummary(params: {
  tool: ToolRunToolMeta;
  report: ToolRunReportLike;
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
