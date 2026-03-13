import type { DayunResult } from '@/lib/dayun-calculator';
import type { FortuneAnalysisResult, Pillar } from '@/lib/user-types';

export type EngineStrength = 'strong' | 'weak' | 'follow' | 'balanced';
export type ContextDirection = 'supportive' | 'neutral' | 'pressured';
export type IndustryDirection = 'up' | 'flat' | 'down';
export type MacroDirection = 'expansion' | 'transition' | 'contraction';
export type LifeStage = 'early' | 'rising' | 'prime' | 'transition' | 'later';

export interface EngineGroundTruth {
  version: string;
  generatedAt: string;
  constitution: {
    dayMaster: string;
    strength: EngineStrength;
    patternType: string;
    yongShen: string[];
    xiShen: string[];
    jiShen: string[];
    seasonContext: string;
  };
  pillars: {
    year: string;
    month: string;
    day: string;
    hour: string;
    details: Pillar[];
  };
  tenGodsTable: Array<{
    pillar: 'year' | 'month' | 'day' | 'hour';
    stem: string;
    branch: string;
    stemShiShen?: string;
    hiddenShiShen?: string[];
  }>;
  dayun: {
    startAge: number;
    direction: 'forward' | 'backward' | 'unknown';
    currentDayun?: string;
    currentRange?: string;
    windows: Array<{
      label: string;
      startAge: number;
      endAge: number;
      startYear: number;
      endYear: number;
      ganZhi: string;
      quality?: string;
      yongShenMatch?: string;
      isCurrent: boolean;
    }>;
  };
  shenSha: {
    list: Array<{
      name: string;
      pillar?: string;
      impact: 'positive' | 'negative' | 'neutral';
    }>;
  };
  kline: {
    version: string;
    points: KlineStructuredPoint[];
    anchorPoints: KlineAnchorPoint[];
    phases: KlinePhase[];
    windows: TimeWindowSummary[];
  };
  timeWindows: {
    career: TimeWindowSummary[];
    wealth: TimeWindowSummary[];
    relationship: TimeWindowSummary[];
    health: TimeWindowSummary[];
  };
  derivedFacts: {
    currentAge: number;
    currentYear: number;
    currentScore: number | null;
    peakScore: number | null;
    troughScore: number | null;
  };
}

export interface KlineStructuredPoint {
  year: number;
  age: number;
  score: number;
  open: number;
  close: number;
  high: number;
  low: number;
  career: number;
  wealth: number;
  marriage: number;
  health: number;
  reason: string;
}

export interface KlineAnchorPoint {
  year: number;
  age: number;
  score: number;
  type: 'peak' | 'trough' | 'turning' | 'stable';
  reason: string;
}

export interface KlinePhase {
  label: string;
  startYear: number;
  endYear: number;
  startAge: number;
  endAge: number;
  averageScore: number;
  trend: 'up' | 'down' | 'stable';
}

export interface TimeWindowSummary {
  startYear: number;
  endYear: number;
  startAge: number;
  endAge: number;
  label: string;
  score: number;
}

export interface ContextSignalPack {
  version: string;
  generatedAt: string;
  temporal: {
    currentDate: string;
    currentYear: number;
    currentMonth: number;
    currentSolarTerm?: string;
    nextSolarTerm?: string;
    isBeforeLichun: boolean;
    currentLunarYear?: string;
    currentLiuNian?: string;
    currentDaYun?: string;
    currentPhaseLabel?: string;
  };
  macroCycles: {
    nationalCycle?: {
      label: string;
      direction: ContextDirection;
      reason: string;
    };
    economicCycle?: {
      label: string;
      direction: MacroDirection;
      reason: string;
    };
    industryCycle?: Array<{
      industry: string;
      direction: IndustryDirection;
      confidence: number;
      reason: string;
    }>;
  };
  geoClimate: {
    birthPlace?: string;
    currentPlace?: string;
    targetPlaces?: string[];
    climateBias?: string[];
    geographyPreference?: string[];
    cityEnergyTags?: string[];
  };
  spatialFactors: {
    favorableDirections: string[];
    unfavorableDirections: string[];
    movementAdvice?: string[];
    environmentAdvice?: string[];
  };
  humanFactors: {
    lifeStage: LifeStage;
    relationshipFocus?: string;
    familyRolePressure?: string[];
    collaborationMode?: string[];
  };
}

export interface AgentExecutionContext {
  reportId?: string;
  userId?: string;
  timeoutMs?: number;
}

export interface AgentTask<TInput = unknown, TOutput = unknown> {
  key: string;
  input: TInput;
  execute: (input: TInput) => Promise<TOutput>;
  timeoutMs?: number;
}

export interface AgentTaskResult<TOutput = unknown> {
  key: string;
  ok: boolean;
  output?: TOutput;
  error?: string;
  startedAt: string;
  finishedAt: string;
  durationMs: number;
}

export interface ParallelAgentRunResult {
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  results: Record<string, AgentTaskResult>;
  succeeded: string[];
  failed: string[];
}

export interface AgentPromptModule {
  label: string;
  content: string;
}

export interface BuildGroundTruthInput {
  birthDate: Date;
  report: Pick<
    FortuneAnalysisResult,
    'basic' | 'pattern' | 'advice' | 'tenGods' | 'klineData' | 'dayun' | 'shenSha'
  > & {
    advice?: FortuneAnalysisResult['advice'] & {
      yongShen?: string[];
      xiShen?: string[];
      jiShen?: string[];
    };
  };
  version?: string;
}

export interface BuildContextSignalsInput {
  birthDate: Date;
  birthPlace?: string;
  currentPlace?: string;
  targetPlaces?: string[];
  industries?: string[];
  engine: EngineGroundTruth;
  report?: {
    advice?: FortuneAnalysisResult['advice'];
    fortune?: FortuneAnalysisResult['fortune'];
  };
  now?: Date;
  version?: string;
}

export interface StructuredAgenticContext {
  engine: EngineGroundTruth;
  context: ContextSignalPack;
  report?: {
    advice?: FortuneAnalysisResult['advice'];
    fortune?: FortuneAnalysisResult['fortune'];
  };
}

export type CurrentDayunLike = DayunResult['currentDayun'];
