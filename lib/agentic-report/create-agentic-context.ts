// ── Create Agentic Context V6 ──
// Accepts both local { truthInput, signalsInput } and production { groundTruth, context }.

import type { StructuredAgenticContext } from './types';
import { buildEngineGroundTruth } from './build-ground-truth';
import type { GroundTruthInput } from './build-ground-truth';
import { buildContextSignals } from './build-context-signals';
import type { LifeProfile } from '@/lib/life-profile/types';

export interface CreateContextInput {
  truthInput: GroundTruthInput;
  signalsInput: any;
  reportRaw?: any;
  lifeProfile?: LifeProfile | null;
}

function asDate(value: unknown): Date {
  if (value instanceof Date && Number.isFinite(value.getTime())) return value;
  if (typeof value === 'string' || typeof value === 'number') {
    const date = new Date(value);
    if (Number.isFinite(date.getTime())) return date;
  }
  return new Date();
}

function normalizeTruthInput(input: any): GroundTruthInput {
  const source = input?.truthInput || input?.groundTruth || {};
  // 兼容历史包装：{ report: baseResult } —— 必须展开，否则 Agent 收到空四柱/空用神
  const report = source.report && typeof source.report === 'object' ? source.report : null;
  const reportBasic = report?.basic || null;
  const reportContext = report?.analysis?.contextSignals || {};

  const pillars = Array.isArray(source.pillars) && source.pillars.length > 0
    ? source.pillars
    : Array.isArray(reportBasic?.pillars)
      ? reportBasic.pillars
      : [];

  const yongShen =
    source.yongShen ||
    source.yong_shen ||
    report?.yongShen ||
    reportContext?.yongShen ||
    null;

  const dayun = source.dayun || report?.dayun || null;

  const kline = Array.isArray(source.kline) && source.kline.length > 0
    ? source.kline
    : Array.isArray(source.klineData) && source.klineData.length > 0
      ? source.klineData
      : Array.isArray(report?.klineData)
        ? report.klineData
        : [];

  const shenShaRaw =
    source.shenSha ||
    source.shen_sha ||
    report?.shenSha ||
    null;
  const shenSha = Array.isArray(shenShaRaw)
    ? shenShaRaw
    : Array.isArray(shenShaRaw?.list)
      ? shenShaRaw.list.map((item: any) =>
          typeof item === 'string' ? item : item?.name || ''
        ).filter(Boolean)
      : [];

  const pattern =
    source.pattern ||
    source.patternType ||
    report?.pattern?.type ||
    report?.pattern?.name ||
    report?.pattern;

  return {
    birthDate: asDate(source.birthDate || source.birth_date || report?.birthDate),
    pillars,
    yongShen,
    dayun,
    kline,
    anchors: Array.isArray(source.anchors) ? source.anchors : [],
    shenSha,
    pattern,
    lifeProfile: source.lifeProfile || input?.lifeProfile || null,
  };
}

export function createAgenticContext(input: any): StructuredAgenticContext {
  const truthInput = normalizeTruthInput(input || {});
  const lifeProfile = input?.lifeProfile ?? truthInput.lifeProfile ?? null;
  truthInput.lifeProfile = lifeProfile ?? null;

  const engine = buildEngineGroundTruth(truthInput);

  const signalSource = input?.signalsInput || input?.context || {};
  const reportRaw = input?.reportRaw || signalSource?.report || null;

  // Production buildContextSignals requires engine + richer fields.
  // Local version accepts a thinner ContextSignalsInput — extra fields are ignored.
  let context: StructuredAgenticContext['context'];
  try {
    context = buildContextSignals({
      birthDate: asDate(signalSource.birthDate || truthInput.birthDate),
      elements: signalSource.elements || {},
      birthPlace: signalSource.birthPlace || signalSource.birth_place,
      currentPlace: signalSource.currentPlace,
      targetPlaces: signalSource.targetPlaces,
      industries: signalSource.industries,
      referenceCorpus: signalSource.referenceCorpus,
      engine,
      report: reportRaw,
      now: signalSource.now ? asDate(signalSource.now) : new Date(),
      version: signalSource.version,
      ...signalSource,
      birthDate: asDate(signalSource.birthDate || truthInput.birthDate),
      engine,
      report: reportRaw,
    } as any);
  } catch (error) {
    console.warn(
      '[createAgenticContext] buildContextSignals failed, using minimal context',
      error instanceof Error ? error.message : error,
    );
    context = {
      macro: null,
      solar: null,
      geo: null,
      spatial: null,
      industries: signalSource.industries || [],
      referenceCorpus: signalSource.referenceCorpus || null,
      report: reportRaw,
    } as any;
  }

  return {
    engine,
    context,
    report: {
      input: {},
      raw: reportRaw,
    },
    lifeProfile: engine?.lifeProfile ?? undefined,
  };
}
