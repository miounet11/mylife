/**
 * Life K-Line Experience Kernel — shared types.
 * Progressive delivery, quality receipts, skill-bound dialogue.
 */

export type DeliveryTierCode = 'T0' | 'T1' | 'T2' | 'T3';

/** Usable-deep product bar (matches report-upgrade-jobs DELIVERED_AT_85 / plateau ≥83) */
export const USABLE_DEEP_SCORE = 83;

export type KernelReadiness = 'ready' | 'usable' | 'draft' | 'streaming';

export type AnalyzeStreamEventType = 'stage' | 'complete' | 'error';

export type ChatStreamEventType =
  | 'start'
  | 'delta'
  | 'final'
  | 'error'
  | 'meta';

export type ExperienceQualityReceipt = {
  readiness: KernelReadiness;
  badge: string;
  title: string;
  summary: string;
  editionLabel: string;
  confidenceScore: number | null;
  grade?: string | null;
  deliveryTier?: string | null;
  targetAchieved?: boolean;
  usableDeep: boolean;
  hasSevenDayActions: boolean;
  trustPoints: string[];
  cautionPoints: string[];
  progressLabel?: string;
  primaryActionLabel?: string;
  details: Array<{ label: string; value: string }>;
};

export type SkillCapabilityMode = 'read_chart' | 'write_events' | 'request_upgrade' | 'general';

export type ExperienceSkill = {
  id: string;
  name: string;
  tagline: string;
  capability: SkillCapabilityMode;
  contextSlots: Array<'report' | 'geo' | 'practice'>;
  starters: string[];
  /** Internal teacher id when mapped */
  teacherId?: string;
};

export type TruthAnchor = {
  reportId?: string | null;
  dayMaster?: string | null;
  yongShen?: string[] | null;
  currentDaYun?: string | null;
  patternType?: string | null;
  hasEngineLock: boolean;
};

export type KernelTurnBudget = {
  /** Prefer first token latency over multi-pass repair when streaming */
  streamMode: boolean;
  maxRepairPasses: number;
  maxTokens: number;
};
