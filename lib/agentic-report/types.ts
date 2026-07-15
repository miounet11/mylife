// ── Agentic Report Types V6 ──
// Core types for the multi-agent orchestration pipeline

import type { KlinePointV6, KlineAnchorV6 } from '@/lib/kline-v6';

// ── Life Profile Context ──

export interface LifeProfileContext {
  hasPreviousReports: boolean;
  calibrationScore?: number;
  calibrationByCategory?: Record<string, number>;
  recentEvents: Array<{
    category: string;
    title: string;
    date: string;
    impact?: string;
  }>;
  focusAreas: string[];
  pastPredictionsSummary?: Array<{
    category: string;
    total: number;
    hitRate: number;
    pending: number;
  }>;
  preferredTone?: string;
  learningProgress?: Record<string, number>;
  uncertaintyNotes?: string[];
}

// ── Engine Ground Truth ──

export interface EngineGroundTruth {
  constitution: {
    dayMaster: string;
    strength: 'strong' | 'weak' | 'balanced' | 'follow';
    patternType: string;
    yongShen: string[];
    xiShen: string[];
    jiShen: string[];
    seasonContext: string;
  };
  pillars: Array<{
    label: string;
    ganZhi: string;
    celestialStem: string;
    earthlyBranch: string;
    nayin: string;
    hiddenStems: string[];
  }>;
  tenGodsTable: Array<{
    pillar: string;
    stemShiShen: string;
    branchShiShen: string;
    hiddenShiShen: string[];
  }>;
  kline: {
    points: KlinePointV6[];
    anchorPoints: KlineAnchorV6[];
    phases: Array<{
      label: string;
      startYear: number;
      endYear: number;
      trend: 'up' | 'down' | 'flat';
      avgScore: number;
    }>;
    windows: Array<{
      label: string;
      startYear: number;
      endYear: number;
      type: 'peak' | 'trough' | 'turning' | 'stable';
      score: number;
    }>;
  };
  timeWindows: {
    career: Array<{ label: string; startYear: number; endYear: number; score: number }>;
    wealth: Array<{ label: string; startYear: number; endYear: number; score: number }>;
    relationship: Array<{ label: string; startYear: number; endYear: number; score: number }>;
    health: Array<{ label: string; startYear: number; endYear: number; score: number }>;
  };
  dayun: {
    windows: Array<{
      ganZhi: string;
      startAge: number;
      endAge: number;
      quality: 'excellent' | 'good' | 'neutral' | 'poor';
      yongShenMatch: 'good' | 'neutral' | 'bad';
      isCurrent: boolean;
    }>;
    direction: string;
  };
  shenSha: Array<{
    name: string;
    pillar: string;
    impact: 'positive' | 'negative' | 'neutral';
  }>;
  derivedFacts: {
    currentAge: number;
    currentYear: number;
    currentScore: number;
    peakScore: number;
    troughScore: number;
  };
  lifeProfile?: LifeProfileContext;
}

// ── Context Signal Pack ──

export interface ContextSignalPack {
  temporal: {
    currentSolarTerm: string;
    nextSolarTerm: string;
    lunarYear: string;
    liuNian: string;
    season: string;
  };
  macroCycles: {
    nationalCycle: string;
    nationalStage: string;
    economicCycle: string;
    economicStage: string;
    industryCycle: string;
  };
  geoClimate: {
    climateBias: string;
    geographyPreference: string;
    cityEnergyTags: string[];
  };
  spatialFactors: {
    favorableDirections: string[];
    unfavorableDirections: string[];
    movementAdvice: string[];
    environmentAdvice: string[];
  };
  humanFactors: {
    lifeStage: string;
    relationshipFocus: string;
    familyRolePressure: string;
    collaborationMode: string;
  };
  worldState: {
    summary: string;
    priority: string;
    bias: string;
    guardrails: string[];
  };
}

// ── Structured Agentic Context ──

export interface StructuredAgenticContext {
  engine: EngineGroundTruth;
  context: ContextSignalPack;
  report: {
    input: Record<string, any>;
    raw: any;
  };
  lifeProfile?: LifeProfileContext;
}

// ── Agent Task & Result ──

export type CoreAgentKey =
  | 'core_constitution'
  | 'kline_narrative'
  | 'temporal_spatial_advisor'
  | 'career_wealth'
  | 'relationship_family'
  | 'health_lifestyle'
  | 'strategy_advisor';

export type GovernanceKey =
  | 'consensus_reviewer'
  | 'repair_executor'
  | 'verify_engine';

export type AgentRole = 'interpret' | 'synthesize' | 'decide' | 'review';

export interface AgentTask {
  id: string;
  key: CoreAgentKey | GovernanceKey;
  role: AgentRole;
  wave: number;
  dependsOn: CoreAgentKey[];
  run: (ctx: StructuredAgenticContext) => Promise<any>;
  timeoutMs?: number;
  retryable?: boolean;
}

export interface AgentTaskResult<T = any> {
  agentKey: string;
  status: 'ok' | 'error' | 'timeout' | 'empty';
  data: T | null;
  timing: { startMs: number; endMs: number; durationMs: number };
  model?: string;
  error?: string;
}

export interface AgentRun {
  tasks: AgentTaskResult[];
  successRate: number;
  durationMs: number;
}

export interface MergedAgentResults {
  merged: Record<string, any>;
  errors: Array<{ agentKey: string; error: string }>;
  successRate: number;
}

// ── Pipeline Result ──

export interface PipelineResult {
  context: StructuredAgenticContext;
  run: AgentRun;
  merged: MergedAgentResults;
  review?: ReviewResult;
  repair?: RepairResult;
  verify?: VerifyResult;
}

// ── Review / Repair / Verify ──

export interface ReviewResult {
  consistencyScore: number;
  hardIssues: string[];
  softIssues: string[];
  verdict: 'PASS' | 'WARN' | 'FAIL';
}

export interface RepairResult {
  repaired: string[];
  unchanged: string[];
}

export interface VerifyResult {
  rulesPassed: number;
  rulesFailed: number;
  totalRules: number;
  checks: Array<{ rule: string; passed: boolean; detail: string }>;
  verdict: 'PASS' | 'WARN' | 'FAIL';
}

// ── LLM Client Types ──

export interface LLMCallParams {
  system: string;
  user: string;
  temperature?: number;
  timeoutMs?: number;
  model?: string;
}

export interface LLMCallResult<T> {
  data: T | null;
  error?: string;
  model: string;
  durationMs: number;
}
