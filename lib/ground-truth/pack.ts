/**
 * Unified GroundTruthPack — single factory for engine facts consumed by
 * agentic agents, dimensions polish, chat teachers, and free-tool projectors.
 *
 * Principle: compute once from engine; LLM only narrates with locked facts.
 */

import { buildEngineGroundTruth, type GroundTruthInput } from '@/lib/agentic-report/build-ground-truth';
import type { EngineGroundTruth, LifeProfileContext } from '@/lib/agentic-report/types';
import type { FortuneAnalysisResult } from '@/lib/user-types';
import { flattenGroundTruthFromReport } from '@/lib/calculation-identity';
import { buildFortuneContextInput, type BirthInput } from '@/lib/fortune-context-builder';
import { buildBirthSignature } from '@/lib/profile-birth-signature';
import { lockedFactsToPreserveTokens } from '@/lib/ground-truth/preserve-tokens';

export const GROUND_TRUTH_PACK_VERSION = 'gt-v1' as const;

export interface LockedEngineFacts {
  dayMaster: string;
  strength: string;
  pattern: string;
  pillars: string[];
  yongShen: string[];
  xiShen: string[];
  jiShen: string[];
  currentDayun: {
    ganZhi: string;
    startAge: number;
    endAge: number;
    quality: string;
  } | null;
  dayunGanZhi: string[];
  anchorYears: number[];
  windowLabels: string[];
  currentScore: number;
  currentYear: number;
  currentAge: number;
  tenGodsStem: string[];
}

export interface GroundTruthPack {
  version: typeof GROUND_TRUTH_PACK_VERSION;
  birthSignature?: string;
  engine: EngineGroundTruth;
  lockedFacts: LockedEngineFacts;
  preserveTokens: string[];
  lifeProfile?: LifeProfileContext;
  /** Raw input used to rebuild agentic context if needed */
  truthInput: GroundTruthInput;
}

function asDate(value: unknown): Date {
  if (value instanceof Date && Number.isFinite(value.getTime())) return value;
  if (typeof value === 'string' || typeof value === 'number') {
    const d = new Date(value);
    if (Number.isFinite(d.getTime())) return d;
  }
  return new Date();
}

export function buildLockedFacts(engine: EngineGroundTruth): LockedEngineFacts {
  const current =
    engine.dayun.windows.find((w) => w.isCurrent) || engine.dayun.windows[0] || null;

  return {
    dayMaster: engine.constitution.dayMaster || '',
    strength: engine.constitution.strength || '',
    pattern: engine.constitution.patternType || '',
    pillars: (engine.pillars || []).map((p) => p.ganZhi).filter(Boolean),
    yongShen: [...(engine.constitution.yongShen || [])],
    xiShen: [...(engine.constitution.xiShen || [])],
    jiShen: [...(engine.constitution.jiShen || [])],
    currentDayun: current
      ? {
          ganZhi: current.ganZhi,
          startAge: current.startAge,
          endAge: current.endAge,
          quality: current.quality,
        }
      : null,
    dayunGanZhi: (engine.dayun.windows || []).map((w) => w.ganZhi).filter(Boolean),
    anchorYears: (engine.kline.anchorPoints || []).map((a) => a.year).filter((y) => Number.isFinite(y)),
    windowLabels: (engine.kline.windows || []).map((w) => w.label).filter(Boolean),
    currentScore: engine.derivedFacts.currentScore,
    currentYear: engine.derivedFacts.currentYear,
    currentAge: engine.derivedFacts.currentAge,
    tenGodsStem: (engine.tenGodsTable || [])
      .map((row) => row.stemShiShen)
      .filter((name) => name && name !== '日主'),
  };
}

export function buildGroundTruthPackFromTruthInput(
  truthInput: GroundTruthInput,
  options?: { birthSignature?: string },
): GroundTruthPack {
  const engine = buildEngineGroundTruth(truthInput);
  const lockedFacts = buildLockedFacts(engine);
  const preserveTokens = lockedFactsToPreserveTokens({
    dayMaster: lockedFacts.dayMaster,
    pillars: lockedFacts.pillars,
    yongShen: lockedFacts.yongShen,
    xiShen: lockedFacts.xiShen,
    jiShen: lockedFacts.jiShen,
    dayunGanZhi: lockedFacts.dayunGanZhi,
    anchorYears: lockedFacts.anchorYears,
    scores: [lockedFacts.currentScore, lockedFacts.currentYear],
  });

  return {
    version: GROUND_TRUTH_PACK_VERSION,
    birthSignature: options?.birthSignature,
    engine,
    lockedFacts,
    preserveTokens,
    lifeProfile: engine.lifeProfile,
    truthInput,
  };
}

/** From birth data (dimensions / tools path). */
export function buildGroundTruthPackFromBirth(input: BirthInput): GroundTruthPack {
  const ctx = buildFortuneContextInput(input);
  const signature =
    (ctx.reportRaw as { birthSignature?: string } | undefined)?.birthSignature ||
    buildBirthSignature({
      birthDate: input.birthDate,
      birthTime: input.birthTime,
      birthPlace: input.birthPlace,
      birthAccuracy: input.birthAccuracy,
      gender: input.gender,
    });

  return buildGroundTruthPackFromTruthInput(ctx.truthInput, { birthSignature: signature });
}

/** From full analyze FortuneAnalysisResult. */
export function buildGroundTruthPackFromReport(
  birthDate: Date | string,
  baseResult: FortuneAnalysisResult | null | undefined,
  extras?: { birthSignature?: string; lifeProfile?: GroundTruthInput['lifeProfile'] },
): GroundTruthPack {
  const date = asDate(birthDate);
  const flat = flattenGroundTruthFromReport(date, baseResult, {
    lifeProfile: extras?.lifeProfile,
  });

  const truthInput: GroundTruthInput = {
    birthDate: date,
    pillars: flat.pillars as GroundTruthInput['pillars'],
    yongShen: flat.yongShen as GroundTruthInput['yongShen'],
    dayun: flat.dayun as GroundTruthInput['dayun'],
    kline: flat.kline as GroundTruthInput['kline'],
    anchors: (flat.anchors || []) as GroundTruthInput['anchors'],
    shenSha: flat.shenSha as string[],
    pattern: flat.pattern as string | undefined,
    lifeProfile: extras?.lifeProfile ?? (flat as { lifeProfile?: GroundTruthInput['lifeProfile'] }).lifeProfile,
  };

  return buildGroundTruthPackFromTruthInput(truthInput, {
    birthSignature: extras?.birthSignature,
  });
}

/** Shape expected by createAgenticContext / runAgenticPipeline. */
export function packToAgenticGroundTruth(pack: GroundTruthPack) {
  return {
    birthDate: pack.truthInput.birthDate,
    pillars: pack.truthInput.pillars,
    yongShen: pack.truthInput.yongShen,
    dayun: pack.truthInput.dayun,
    kline: pack.truthInput.kline,
    anchors: pack.truthInput.anchors,
    shenSha: pack.truthInput.shenSha,
    pattern: pack.truthInput.pattern,
    lifeProfile: pack.truthInput.lifeProfile,
  };
}
