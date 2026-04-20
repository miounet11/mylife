import fs from 'fs';
import path from 'path';

const STATE_DIR = path.join(process.cwd(), 'data', 'runtime');
const OPEN_AGENT_REVIEW_SNAPSHOT_FILE = path.join(STATE_DIR, 'world-yi-open-agent-review.snapshot.json');
const OPEN_AGENT_REVIEW_BACKLOG_FILE = path.join(STATE_DIR, 'world-yi-open-agent-review.backlog.json');
const OPEN_AGENT_CONTENT_ANALYSIS_SNAPSHOT_FILE = path.join(STATE_DIR, 'world-yi-open-agent-content-analysis.snapshot.json');
const OPEN_AGENT_OPS_TRIAGE_SNAPSHOT_FILE = path.join(STATE_DIR, 'world-yi-open-agent-ops-triage.snapshot.json');
const OPEN_AGENT_REPORT_RELIABILITY_SNAPSHOT_FILE = path.join(STATE_DIR, 'world-yi-open-agent-report-reliability.snapshot.json');
const OPEN_AGENT_SITE_GOVERNOR_SNAPSHOT_FILE = path.join(STATE_DIR, 'world-yi-open-agent-site-governor.snapshot.json');
const AUTONOMOUS_CYCLE_LEDGER_FILE = path.join(STATE_DIR, 'world-yi-autonomous-cycle-ledger.json');
const AUTONOMY_POLICY_FILE = path.join(STATE_DIR, 'world-yi-autonomy-policy.json');
const CONTENT_DECISION_LEDGER_FILE = path.join(STATE_DIR, 'world-yi-content-decision-ledger.json');

export type OpenAgentReviewItemPriority = 'P0' | 'P1' | 'P2';
export type OpenAgentReviewItemStatus = 'pending' | 'active' | 'done' | 'dismissed';

export interface OpenAgentAutonomyReviewItem {
  id: string;
  title: string;
  target: string;
  affectedStages: string[];
  affectedStagesText: string;
  whyNow: string;
  priority: OpenAgentReviewItemPriority;
  status: OpenAgentReviewItemStatus;
  source: 'open_agent_review';
  createdAt: string;
  lastSeenAt: string;
}

export interface OpenAgentAutonomyReviewSnapshot {
  status: 'idle' | 'success' | 'error';
  runId?: string;
  startedAt?: string;
  finishedAt?: string;
  durationMs?: number;
  answer?: string;
  usedTools?: string[];
  numTurns?: number;
  error?: string;
  items: OpenAgentAutonomyReviewItem[];
  updatedAt: string;
}

export interface OpenAgentContentAnalysisLaneContract {
  lane: 'main' | 'wave2' | 'global';
  sourceType: 'public-growth' | 'public-growth-wave2' | 'public-growth-global';
  targetKeys: string[];
  reason: string;
}

export interface OpenAgentContentAnalysisQueueOverride {
  key: string;
  reason: string;
  priority: 'critical' | 'high' | 'medium';
}

export interface OpenAgentContentAnalysisPlan {
  summary: string;
  laneContracts: OpenAgentContentAnalysisLaneContract[];
  queueOverrides: OpenAgentContentAnalysisQueueOverride[];
  blockedPatterns: string[];
  policySignals: string[];
}

export interface OpenAgentContentAnalysisSnapshot {
  status: 'idle' | 'success' | 'error';
  runId?: string;
  startedAt?: string;
  finishedAt?: string;
  durationMs?: number;
  answer?: string;
  usedTools?: string[];
  numTurns?: number;
  error?: string;
  plan: OpenAgentContentAnalysisPlan;
  updatedAt: string;
}

export interface OpenAgentOpsTriageAlert {
  severity: 'critical' | 'warning' | 'info';
  title: string;
  detail: string;
  source: string;
}

export interface OpenAgentOpsTriageAction {
  kind: 'observe' | 'run_validation' | 'run_full_cycle' | 'tighten_block_patterns' | 'focus_lane' | 'keep_policy' | 'investigate';
  title: string;
  reason: string;
  autoExecutable: boolean;
}

export interface OpenAgentOpsTriagePolicyDiff {
  path: string;
  before: string;
  after: string;
  reason: string;
}

export interface OpenAgentOpsTriagePlan {
  summary: string;
  alerts: OpenAgentOpsTriageAlert[];
  recommendedActions: OpenAgentOpsTriageAction[];
  policyDiffs: OpenAgentOpsTriagePolicyDiff[];
}

export interface OpenAgentOpsTriageSnapshot {
  status: 'idle' | 'success' | 'error';
  runId?: string;
  startedAt?: string;
  finishedAt?: string;
  durationMs?: number;
  answer?: string;
  usedTools?: string[];
  numTurns?: number;
  error?: string;
  plan: OpenAgentOpsTriagePlan;
  updatedAt: string;
}

export interface OpenAgentReportReliabilityAlert {
  severity: 'critical' | 'warning' | 'info';
  title: string;
  detail: string;
  source: string;
}

export interface OpenAgentReportReliabilityTarget {
  reportId: string;
  name: string;
  action: 'upgrade' | 'observe' | 'feedback_sync' | 'recompute';
  reason: string;
  qualityScore?: number;
  deliveryTier?: 'basic' | 'enhanced' | 'expert';
}

export interface OpenAgentReportReliabilityAction {
  kind: 'sync_feedback' | 'upgrade_reports' | 'tighten_guard' | 'observe' | 'investigate' | 'recompute' | 'keep_delivery';
  title: string;
  reason: string;
  autoExecutable: boolean;
}

export interface OpenAgentReportReliabilityQueuedJob {
  reportId: string;
  action: 'upgrade' | 'recompute';
  status: 'queued' | 'skipped';
  reason: string;
  jobStatus?: string;
}

export interface OpenAgentReportReliabilitySkippedAction {
  reportId?: string;
  action?: string;
  reason: string;
}

export interface OpenAgentReportReliabilityApplication {
  autoExecuted: boolean;
  appliedAt?: string;
  queuedJobs: OpenAgentReportReliabilityQueuedJob[];
  syncedReportIds: string[];
  skipped: OpenAgentReportReliabilitySkippedAction[];
  notes: string[];
}

export interface OpenAgentReportReliabilityPlan {
  summary: string;
  alerts: OpenAgentReportReliabilityAlert[];
  priorityReports: OpenAgentReportReliabilityTarget[];
  recommendedActions: OpenAgentReportReliabilityAction[];
}

export interface OpenAgentReportReliabilitySnapshot {
  status: 'idle' | 'success' | 'error';
  runId?: string;
  startedAt?: string;
  finishedAt?: string;
  durationMs?: number;
  answer?: string;
  usedTools?: string[];
  numTurns?: number;
  error?: string;
  plan: OpenAgentReportReliabilityPlan;
  application?: OpenAgentReportReliabilityApplication;
  updatedAt: string;
}

export interface OpenAgentSiteGovernorAlert {
  severity: 'critical' | 'warning' | 'info';
  title: string;
  detail: string;
  source: string;
}

export interface OpenAgentSiteGovernorWorkstream {
  area: 'seo' | 'content' | 'feedback' | 'performance' | 'conversion' | 'feature';
  target: string;
  issue: string;
  action: string;
  priority: 'P0' | 'P1' | 'P2';
}

export interface OpenAgentSiteGovernorPlan {
  summary: string;
  alerts: OpenAgentSiteGovernorAlert[];
  workstreams: OpenAgentSiteGovernorWorkstream[];
}

export interface OpenAgentSiteGovernorSnapshot {
  status: 'idle' | 'success' | 'error';
  runId?: string;
  startedAt?: string;
  finishedAt?: string;
  durationMs?: number;
  answer?: string;
  usedTools?: string[];
  numTurns?: number;
  error?: string;
  plan: OpenAgentSiteGovernorPlan;
  updatedAt: string;
}

export interface WorldYiAutonomousCycleLedgerEntry {
  id: string;
  trigger: 'cron' | 'manual';
  mode?: 'full' | 'validation';
  success: boolean;
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  phaseKeys: string[];
  failedPhaseKeys: string[];
  skippedPhaseKeys: string[];
  summary: string;
  openAgentBacklogTargets: string[];
  openAgentFocusKeys?: string[];
  phaseSummaries?: Array<{
    key: string;
    title: string;
    success: boolean;
    skipped?: boolean;
    reason?: string;
    durationMs?: number;
    details?: Record<string, unknown>;
  }>;
  decisionLog?: Array<{
    key: string;
    decision: string;
    reason: string;
  }>;
  updatedAt: string;
}

export type WorldYiContentDecision = 'publish' | 'hold' | 'revise' | 'blocked';

export interface OpenAgentAutonomyBacklogFocus {
  focusKeys: string[];
  qualityGate: boolean;
  laneReserve: boolean;
  decisionLedger: boolean;
  topTargets: string[];
}

export interface WorldYiAutonomyPolicy {
  version: 1;
  source: 'default' | 'open_agent_backlog';
  focusKeys: string[];
  topTargets: string[];
  publishGate: {
    minScore: number;
    requireLlmSource: boolean;
    requireGrowthPublicationReady: boolean;
    blockLowPerformanceTypes: boolean;
    blockLowPerformanceRadarSources: boolean;
    lowPerformanceTypeMinPublishedCount: number;
    lowPerformanceRadarSourceMinPublishedCount: number;
    laneGapBoost: number;
    weakLaneBoost: number;
    backlogLaneReserveBoost: number;
  };
  queueWeights: {
    laneGapBaseBoost: number;
    weakLaneBoost: number;
    backlogLaneReserveBoost: number;
    perLaneQuota: number;
    radarQuota: number;
    clusterQuota: number;
  };
  validationMode: {
    skipKnowledgeAcquisition: boolean;
    skipReportUpgrade: boolean;
    skipMonthlyDigest: boolean;
    skipEmailRetry: boolean;
    skipOpenAgentReview: boolean;
  };
  updatedAt: string;
}

type AutonomyPolicySignalRule = {
  section: 'publishGate' | 'queueWeights';
  key: string;
  kind: 'number' | 'boolean';
  min?: number;
  max?: number;
};

const AUTONOMY_POLICY_SIGNAL_RULES: Record<string, AutonomyPolicySignalRule> = {
  'publishGate.minScore': {
    section: 'publishGate',
    key: 'minScore',
    kind: 'number',
    min: 160,
    max: 280,
  },
  'publishGate.requireLlmSource': {
    section: 'publishGate',
    key: 'requireLlmSource',
    kind: 'boolean',
  },
  'publishGate.requireGrowthPublicationReady': {
    section: 'publishGate',
    key: 'requireGrowthPublicationReady',
    kind: 'boolean',
  },
  'publishGate.blockLowPerformanceTypes': {
    section: 'publishGate',
    key: 'blockLowPerformanceTypes',
    kind: 'boolean',
  },
  'publishGate.blockLowPerformanceRadarSources': {
    section: 'publishGate',
    key: 'blockLowPerformanceRadarSources',
    kind: 'boolean',
  },
  'publishGate.laneGapBoost': {
    section: 'publishGate',
    key: 'laneGapBoost',
    kind: 'number',
    min: 0,
    max: 120,
  },
  'publishGate.weakLaneBoost': {
    section: 'publishGate',
    key: 'weakLaneBoost',
    kind: 'number',
    min: 0,
    max: 80,
  },
  'publishGate.backlogLaneReserveBoost': {
    section: 'publishGate',
    key: 'backlogLaneReserveBoost',
    kind: 'number',
    min: 0,
    max: 60,
  },
  'queueWeights.laneGapBaseBoost': {
    section: 'queueWeights',
    key: 'laneGapBaseBoost',
    kind: 'number',
    min: 0,
    max: 240,
  },
  'queueWeights.weakLaneBoost': {
    section: 'queueWeights',
    key: 'weakLaneBoost',
    kind: 'number',
    min: 0,
    max: 120,
  },
  'queueWeights.backlogLaneReserveBoost': {
    section: 'queueWeights',
    key: 'backlogLaneReserveBoost',
    kind: 'number',
    min: 0,
    max: 80,
  },
  'queueWeights.perLaneQuota': {
    section: 'queueWeights',
    key: 'perLaneQuota',
    kind: 'number',
    min: 1,
    max: 5,
  },
  'queueWeights.radarQuota': {
    section: 'queueWeights',
    key: 'radarQuota',
    kind: 'number',
    min: 0,
    max: 5,
  },
  'queueWeights.clusterQuota': {
    section: 'queueWeights',
    key: 'clusterQuota',
    kind: 'number',
    min: 0,
    max: 5,
  },
};

const AUTONOMY_POLICY_SIGNAL_REGEX = new RegExp(
  `\\b(${Object.keys(AUTONOMY_POLICY_SIGNAL_RULES).map(escapeRegex).join('|')})\\s*=\\s*([a-z0-9_.-]+)`,
  'gi'
);

export interface WorldYiAutonomyPolicySignalApplication {
  signal: string;
  path: string;
  previousValue: number | boolean;
  nextValue: number | boolean;
}

export interface WorldYiRuntimeAutonomyPolicyResolution {
  basePolicy: WorldYiAutonomyPolicy;
  effectivePolicy: WorldYiAutonomyPolicy;
  appliedSignals: WorldYiAutonomyPolicySignalApplication[];
  ignoredSignals: string[];
}

export interface WorldYiContentDecisionMix {
  publishCount: number;
  holdCount: number;
  reviseCount: number;
  blockedCount: number;
  totalCandidates: number;
  readyCount: number;
}

export interface WorldYiContentDecisionPreview {
  title: string;
  slug: string;
  score: number;
  laneLabel?: string;
  sourceType?: string;
  reasons?: string[];
  hardBlockReasons?: string[];
}

export interface WorldYiContentDecisionSample {
  id: string;
  entryId: string;
  slug: string;
  title: string;
  contentType: string;
  source: string;
  sourceType?: string;
  growthPlanKey?: string;
  laneKey?: string;
  laneLabel?: string;
  laneTargetKey?: string;
  laneNeedsCoverage: boolean;
  weakLane: boolean;
  decision: WorldYiContentDecision;
  score: number;
  reasons: string[];
  hardBlockReasons: string[];
  policySource: WorldYiAutonomyPolicy['source'];
  policyFocusKeys: string[];
  minimumScore: number;
  evaluatedAt: string;
}

export interface WorldYiContentDecisionEntrySummary {
  decisionMix: WorldYiContentDecisionMix;
  topBlockedReasons: Array<{
    reason: string;
    count: number;
  }>;
  topHeldCandidates: WorldYiContentDecisionPreview[];
  topReviseCandidates: WorldYiContentDecisionPreview[];
  lastPublishRationale: string[];
}

export interface WorldYiContentDecisionLedgerEntry {
  id: string;
  cycleRunId?: string;
  trigger: 'cron' | 'manual' | 'automation';
  mode: 'live' | 'validate';
  reason: string;
  publishWindowOpen: boolean;
  canPublishNow: boolean;
  generatedCount: number;
  publishedCount: number;
  publishedTitle?: string | null;
  publishedSlug?: string | null;
  radarRefreshed?: boolean;
  policySource: WorldYiAutonomyPolicy['source'];
  policyFocusKeys: string[];
  preview?: {
    wouldRefreshRadar: boolean;
    wouldGenerateCount: number;
    wouldPublishTitle: string | null;
    wouldPublishSlug: string | null;
  } | null;
  summary: WorldYiContentDecisionEntrySummary;
  decisions: WorldYiContentDecisionSample[];
  createdAt: string;
  updatedAt: string;
}

export interface WorldYiContentDecisionLedgerSummary {
  updatedAt?: string;
  latestRunId?: string;
  latestTrigger?: 'cron' | 'manual' | 'automation';
  latestMode?: 'live' | 'validate';
  latestReason?: string;
  latestPublishedTitle?: string | null;
  latestPublishedSlug?: string | null;
  latestDecisionMix: WorldYiContentDecisionMix;
  topBlockedReasons: Array<{
    reason: string;
    count: number;
  }>;
  topHeldCandidates: WorldYiContentDecisionPreview[];
  topReviseCandidates: WorldYiContentDecisionPreview[];
  lastPublishRationale: string[];
}

function ensureStateDir() {
  fs.mkdirSync(STATE_DIR, { recursive: true });
}

function readJsonFile<T>(filePath: string, fallback: T) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T;
  } catch {
    return fallback;
  }
}

function writeJsonFile(filePath: string, value: unknown) {
  ensureStateDir();
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2), 'utf8');
}

function normalizeWhitespace(value: string) {
  return `${value || ''}`.replace(/\s+/g, ' ').trim();
}

function createEmptyOpenAgentContentAnalysisPlan(): OpenAgentContentAnalysisPlan {
  return {
    summary: '',
    laneContracts: [],
    queueOverrides: [],
    blockedPatterns: [],
    policySignals: [],
  };
}

function createEmptyOpenAgentOpsTriagePlan(): OpenAgentOpsTriagePlan {
  return {
    summary: '',
    alerts: [],
    recommendedActions: [],
    policyDiffs: [],
  };
}

function createEmptyOpenAgentReportReliabilityPlan(): OpenAgentReportReliabilityPlan {
  return {
    summary: '',
    alerts: [],
    priorityReports: [],
    recommendedActions: [],
  };
}

function createEmptyOpenAgentSiteGovernorPlan(): OpenAgentSiteGovernorPlan {
  return {
    summary: '',
    alerts: [],
    workstreams: [],
  };
}

function createEmptyOpenAgentReportReliabilityApplication(): OpenAgentReportReliabilityApplication {
  return {
    autoExecuted: false,
    queuedJobs: [],
    syncedReportIds: [],
    skipped: [],
    notes: [],
  };
}

function cloneWorldYiAutonomyPolicy(policy: WorldYiAutonomyPolicy): WorldYiAutonomyPolicy {
  return {
    ...policy,
    focusKeys: [...policy.focusKeys],
    topTargets: [...policy.topTargets],
    publishGate: {
      ...policy.publishGate,
    },
    queueWeights: {
      ...policy.queueWeights,
    },
    validationMode: {
      ...policy.validationMode,
    },
  };
}

function normalizeReviewAnswer(answer: string) {
  return `${answer || ''}`
    .replace(/\r\n/g, '\n')
    .replace(/\*\*(Target|Goal|目标|Affected flow|Affected stages|Affected stage|受影响环节|Why now|为什么现在做|原因)\*\*/gi, '$1')
    .replace(/\*\*/g, '')
    .replace(/\s+(?=\d+[.)]\s+)/g, '\n')
    .trim();
}

function normalizeTargetKey(value: string) {
  return normalizeWhitespace(value).toLowerCase();
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function trimTrailingNumberedHeading(value: string) {
  return normalizeWhitespace(value.replace(/\s+\d+[.)]\s+[^:：\n]{2,160}\s*$/u, ''));
}

function extractLabeledField(params: {
  chunk: string;
  labels: string[];
  stopLabels: string[];
}) {
  const labelPattern = params.labels.map(escapeRegex).join('|');
  const stopPattern = params.stopLabels.map(escapeRegex).join('|');
  const numberedBoundary = '(?:\\d+[.)]\\s*(?:[^\\n]{0,160}?)?(?:Target|Goal|目标)\\s*[:：])';
  const regex = new RegExp(
    `(?:${labelPattern})\\s*[:：]\\s*([\\s\\S]*?)(?=(?:${stopPattern})\\s*[:：]|${numberedBoundary}|$)`,
    'i'
  );

  const matched = params.chunk.match(regex);
  return trimTrailingNumberedHeading(matched?.[1] || '');
}

function splitReviewChunks(answer: string) {
  const normalized = normalizeReviewAnswer(answer)
    .replace(/\s+(?=\d+[.)]\s+[^\n]{0,160}?(?:Target|Goal|目标)\s*[:：])/gi, '\n')
    .replace(/\s+(?=\d+[.)]\s*(?:Target|Goal|目标)\s*[:：])/g, '\n')
    .replace(/\s+(?=(?:Target|Goal|目标)\s*[:：])/g, '\n')
    .trim();

  const chunks = normalized
    .split(/\n(?=(?:\d+[.)]\s+[^\n]{0,160}?)?(?:Target|Goal|目标)\s*[:：])/i)
    .map((item) => item.trim())
    .filter(Boolean);

  if (chunks.length > 0) {
    return chunks;
  }

  return normalized
    .split(/\n(?=\d+[.)]\s+)/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function deriveAffectedStages(value: string) {
  const codeMatches = [...value.matchAll(/`([^`]+)`/g)]
    .map((match) => normalizeWhitespace(match[1] || ''))
    .filter(Boolean);

  if (codeMatches.length > 0) {
    return [...new Set(codeMatches)];
  }

  return value
    .split(/,|，|;|；|、|\band\b|\bwith\b|以及/g)
    .map((item) => normalizeWhitespace(item))
    .filter((item) => item.length >= 2 && item.length <= 120)
    .slice(0, 6);
}

function buildReviewItemId(index: number, seenAt: string) {
  const stamp = new Date(seenAt).getTime().toString(36);
  return `oa_review_${stamp}_${index + 1}`;
}

function createEmptyContentDecisionMix(): WorldYiContentDecisionMix {
  return {
    publishCount: 0,
    holdCount: 0,
    reviseCount: 0,
    blockedCount: 0,
    totalCandidates: 0,
    readyCount: 0,
  };
}

function buildContentDecisionPreview(sample: WorldYiContentDecisionSample): WorldYiContentDecisionPreview {
  return {
    title: sample.title,
    slug: sample.slug,
    score: sample.score,
    laneLabel: sample.laneLabel,
    sourceType: sample.sourceType,
    reasons: sample.reasons.slice(0, 4),
    hardBlockReasons: sample.hardBlockReasons.slice(0, 4),
  };
}

export function summarizeWorldYiContentDecisionSamples(
  samples: WorldYiContentDecisionSample[]
): WorldYiContentDecisionEntrySummary {
  const decisionMix = samples.reduce<WorldYiContentDecisionMix>((accumulator, sample) => {
    accumulator.totalCandidates += 1;

    if (sample.decision === 'publish') {
      accumulator.publishCount += 1;
      accumulator.readyCount += 1;
    } else if (sample.decision === 'hold') {
      accumulator.holdCount += 1;
      accumulator.readyCount += 1;
    } else if (sample.decision === 'revise') {
      accumulator.reviseCount += 1;
    } else {
      accumulator.blockedCount += 1;
    }

    return accumulator;
  }, createEmptyContentDecisionMix());

  const blockedReasonCounts = samples
    .filter((sample) => sample.decision === 'revise' || sample.decision === 'blocked')
    .flatMap((sample) => sample.hardBlockReasons)
    .reduce<Record<string, number>>((accumulator, reason) => {
      const normalizedReason = normalizeWhitespace(reason);
      if (!normalizedReason) {
        return accumulator;
      }

      accumulator[normalizedReason] = (accumulator[normalizedReason] || 0) + 1;
      return accumulator;
    }, {});

  const publishedSample = samples.find((sample) => sample.decision === 'publish');

  return {
    decisionMix,
    topBlockedReasons: Object.entries(blockedReasonCounts)
      .map(([reason, count]) => ({ reason, count }))
      .sort((left, right) => right.count - left.count || left.reason.localeCompare(right.reason))
      .slice(0, 6),
    topHeldCandidates: samples
      .filter((sample) => sample.decision === 'hold')
      .sort((left, right) => right.score - left.score || right.evaluatedAt.localeCompare(left.evaluatedAt))
      .slice(0, 4)
      .map(buildContentDecisionPreview),
    topReviseCandidates: samples
      .filter((sample) => sample.decision === 'revise')
      .sort((left, right) => right.score - left.score || right.evaluatedAt.localeCompare(left.evaluatedAt))
      .slice(0, 4)
      .map(buildContentDecisionPreview),
    lastPublishRationale: publishedSample?.reasons.slice(0, 6) || [],
  };
}

export function extractOpenAgentAutonomyReviewItems(answer: string, seenAt = new Date().toISOString()) {
  const chunks = splitReviewChunks(answer);

  return chunks.reduce<OpenAgentAutonomyReviewItem[]>((items, chunk, index) => {
      const target = extractLabeledField({
        chunk,
        labels: ['Target', 'Goal', '目标'],
        stopLabels: ['Affected flow', 'Affected stages', 'Affected stage', '受影响环节', 'Why now', '为什么现在做', '原因'],
      });
      const affectedStagesText = extractLabeledField({
        chunk,
        labels: ['Affected flow', 'Affected stages', 'Affected stage', '受影响环节'],
        stopLabels: ['Why now', '为什么现在做', '原因', 'Target', 'Goal', '目标'],
      });
      const whyNow = extractLabeledField({
        chunk,
        labels: ['Why now', '为什么现在做', '原因'],
        stopLabels: ['Target', 'Goal', '目标', 'Affected flow', 'Affected stages', 'Affected stage', '受影响环节'],
      });

      if (!target || !whyNow) {
        return items;
      }

      items.push({
        id: buildReviewItemId(index, seenAt),
        title: target.length > 72 ? `${target.slice(0, 72)}...` : target,
        target,
        affectedStages: deriveAffectedStages(affectedStagesText),
        affectedStagesText,
        whyNow,
        priority: index === 0 ? 'P0' : index === 1 ? 'P1' : 'P2',
        status: 'pending',
        source: 'open_agent_review' as const,
        createdAt: seenAt,
        lastSeenAt: seenAt,
      });

      return items;
    }, []);
}

export function readOpenAgentAutonomyReviewSnapshot() {
  return readJsonFile<OpenAgentAutonomyReviewSnapshot | null>(OPEN_AGENT_REVIEW_SNAPSHOT_FILE, null);
}

export function writeOpenAgentAutonomyReviewSnapshot(
  snapshot: Omit<OpenAgentAutonomyReviewSnapshot, 'updatedAt'>
) {
  const payload: OpenAgentAutonomyReviewSnapshot = {
    ...snapshot,
    updatedAt: new Date().toISOString(),
  };
  writeJsonFile(OPEN_AGENT_REVIEW_SNAPSHOT_FILE, payload);
  return payload;
}

export function readOpenAgentContentAnalysisSnapshot() {
  const snapshot = readJsonFile<Partial<OpenAgentContentAnalysisSnapshot> | null>(
    OPEN_AGENT_CONTENT_ANALYSIS_SNAPSHOT_FILE,
    null
  );

  if (!snapshot) {
    return null;
  }

  return {
    status: snapshot.status === 'success' || snapshot.status === 'error' ? snapshot.status : 'idle',
    runId: snapshot.runId,
    startedAt: snapshot.startedAt,
    finishedAt: snapshot.finishedAt,
    durationMs: snapshot.durationMs,
    answer: snapshot.answer,
    usedTools: Array.isArray(snapshot.usedTools) ? snapshot.usedTools : [],
    numTurns: snapshot.numTurns,
    error: snapshot.error,
    plan: {
      ...createEmptyOpenAgentContentAnalysisPlan(),
      ...(snapshot.plan || {}),
      laneContracts: Array.isArray(snapshot.plan?.laneContracts) ? snapshot.plan.laneContracts : [],
      queueOverrides: Array.isArray(snapshot.plan?.queueOverrides) ? snapshot.plan.queueOverrides : [],
      blockedPatterns: Array.isArray(snapshot.plan?.blockedPatterns) ? snapshot.plan.blockedPatterns : [],
      policySignals: Array.isArray(snapshot.plan?.policySignals) ? snapshot.plan.policySignals : [],
    },
    updatedAt: snapshot.updatedAt || new Date(0).toISOString(),
  } satisfies OpenAgentContentAnalysisSnapshot;
}

export function writeOpenAgentContentAnalysisSnapshot(
  snapshot: Omit<OpenAgentContentAnalysisSnapshot, 'updatedAt'>
) {
  const payload: OpenAgentContentAnalysisSnapshot = {
    ...snapshot,
    plan: {
      ...createEmptyOpenAgentContentAnalysisPlan(),
      ...(snapshot.plan || {}),
      laneContracts: Array.isArray(snapshot.plan?.laneContracts) ? snapshot.plan.laneContracts : [],
      queueOverrides: Array.isArray(snapshot.plan?.queueOverrides) ? snapshot.plan.queueOverrides : [],
      blockedPatterns: Array.isArray(snapshot.plan?.blockedPatterns) ? snapshot.plan.blockedPatterns : [],
      policySignals: Array.isArray(snapshot.plan?.policySignals) ? snapshot.plan.policySignals : [],
    },
    updatedAt: new Date().toISOString(),
  };
  writeJsonFile(OPEN_AGENT_CONTENT_ANALYSIS_SNAPSHOT_FILE, payload);
  return payload;
}

export function readOpenAgentOpsTriageSnapshot() {
  const snapshot = readJsonFile<Partial<OpenAgentOpsTriageSnapshot> | null>(
    OPEN_AGENT_OPS_TRIAGE_SNAPSHOT_FILE,
    null
  );

  if (!snapshot) {
    return null;
  }

  return {
    status: snapshot.status === 'success' || snapshot.status === 'error' ? snapshot.status : 'idle',
    runId: snapshot.runId,
    startedAt: snapshot.startedAt,
    finishedAt: snapshot.finishedAt,
    durationMs: snapshot.durationMs,
    answer: snapshot.answer,
    usedTools: Array.isArray(snapshot.usedTools) ? snapshot.usedTools : [],
    numTurns: snapshot.numTurns,
    error: snapshot.error,
    plan: {
      ...createEmptyOpenAgentOpsTriagePlan(),
      ...(snapshot.plan || {}),
      alerts: Array.isArray(snapshot.plan?.alerts) ? snapshot.plan.alerts : [],
      recommendedActions: Array.isArray(snapshot.plan?.recommendedActions) ? snapshot.plan.recommendedActions : [],
      policyDiffs: Array.isArray(snapshot.plan?.policyDiffs) ? snapshot.plan.policyDiffs : [],
    },
    updatedAt: snapshot.updatedAt || new Date(0).toISOString(),
  } satisfies OpenAgentOpsTriageSnapshot;
}

export function writeOpenAgentOpsTriageSnapshot(
  snapshot: Omit<OpenAgentOpsTriageSnapshot, 'updatedAt'>
) {
  const payload: OpenAgentOpsTriageSnapshot = {
    ...snapshot,
    plan: {
      ...createEmptyOpenAgentOpsTriagePlan(),
      ...(snapshot.plan || {}),
      alerts: Array.isArray(snapshot.plan?.alerts) ? snapshot.plan.alerts : [],
      recommendedActions: Array.isArray(snapshot.plan?.recommendedActions) ? snapshot.plan.recommendedActions : [],
      policyDiffs: Array.isArray(snapshot.plan?.policyDiffs) ? snapshot.plan.policyDiffs : [],
    },
    updatedAt: new Date().toISOString(),
  };
  writeJsonFile(OPEN_AGENT_OPS_TRIAGE_SNAPSHOT_FILE, payload);
  return payload;
}

export function readOpenAgentReportReliabilitySnapshot() {
  const snapshot = readJsonFile<Partial<OpenAgentReportReliabilitySnapshot> | null>(
    OPEN_AGENT_REPORT_RELIABILITY_SNAPSHOT_FILE,
    null
  );

  if (!snapshot) {
    return null;
  }

  return {
    status: snapshot.status === 'success' || snapshot.status === 'error' ? snapshot.status : 'idle',
    runId: snapshot.runId,
    startedAt: snapshot.startedAt,
    finishedAt: snapshot.finishedAt,
    durationMs: snapshot.durationMs,
    answer: snapshot.answer,
    usedTools: Array.isArray(snapshot.usedTools) ? snapshot.usedTools : [],
    numTurns: snapshot.numTurns,
    error: snapshot.error,
    plan: {
      ...createEmptyOpenAgentReportReliabilityPlan(),
      ...(snapshot.plan || {}),
      alerts: Array.isArray(snapshot.plan?.alerts) ? snapshot.plan.alerts : [],
      priorityReports: Array.isArray(snapshot.plan?.priorityReports) ? snapshot.plan.priorityReports : [],
      recommendedActions: Array.isArray(snapshot.plan?.recommendedActions) ? snapshot.plan.recommendedActions : [],
    },
    application: {
      ...createEmptyOpenAgentReportReliabilityApplication(),
      ...(snapshot.application || {}),
      queuedJobs: Array.isArray(snapshot.application?.queuedJobs) ? snapshot.application.queuedJobs : [],
      syncedReportIds: Array.isArray(snapshot.application?.syncedReportIds) ? snapshot.application.syncedReportIds : [],
      skipped: Array.isArray(snapshot.application?.skipped) ? snapshot.application.skipped : [],
      notes: Array.isArray(snapshot.application?.notes) ? snapshot.application.notes : [],
    },
    updatedAt: snapshot.updatedAt || new Date(0).toISOString(),
  } satisfies OpenAgentReportReliabilitySnapshot;
}

export function writeOpenAgentReportReliabilitySnapshot(
  snapshot: Omit<OpenAgentReportReliabilitySnapshot, 'updatedAt'>
) {
  const payload: OpenAgentReportReliabilitySnapshot = {
    ...snapshot,
    plan: {
      ...createEmptyOpenAgentReportReliabilityPlan(),
      ...(snapshot.plan || {}),
      alerts: Array.isArray(snapshot.plan?.alerts) ? snapshot.plan.alerts : [],
      priorityReports: Array.isArray(snapshot.plan?.priorityReports) ? snapshot.plan.priorityReports : [],
      recommendedActions: Array.isArray(snapshot.plan?.recommendedActions) ? snapshot.plan.recommendedActions : [],
    },
    application: {
      ...createEmptyOpenAgentReportReliabilityApplication(),
      ...(snapshot.application || {}),
      queuedJobs: Array.isArray(snapshot.application?.queuedJobs) ? snapshot.application.queuedJobs : [],
      syncedReportIds: Array.isArray(snapshot.application?.syncedReportIds) ? snapshot.application.syncedReportIds : [],
      skipped: Array.isArray(snapshot.application?.skipped) ? snapshot.application.skipped : [],
      notes: Array.isArray(snapshot.application?.notes) ? snapshot.application.notes : [],
    },
    updatedAt: new Date().toISOString(),
  };
  writeJsonFile(OPEN_AGENT_REPORT_RELIABILITY_SNAPSHOT_FILE, payload);
  return payload;
}

export function readOpenAgentSiteGovernorSnapshot() {
  const snapshot = readJsonFile<Partial<OpenAgentSiteGovernorSnapshot> | null>(
    OPEN_AGENT_SITE_GOVERNOR_SNAPSHOT_FILE,
    null
  );

  if (!snapshot) {
    return null;
  }

  return {
    status: snapshot.status === 'success' || snapshot.status === 'error' ? snapshot.status : 'idle',
    runId: snapshot.runId,
    startedAt: snapshot.startedAt,
    finishedAt: snapshot.finishedAt,
    durationMs: snapshot.durationMs,
    answer: snapshot.answer,
    usedTools: Array.isArray(snapshot.usedTools) ? snapshot.usedTools : [],
    numTurns: snapshot.numTurns,
    error: snapshot.error,
    plan: {
      ...createEmptyOpenAgentSiteGovernorPlan(),
      ...(snapshot.plan || {}),
      alerts: Array.isArray(snapshot.plan?.alerts) ? snapshot.plan.alerts : [],
      workstreams: Array.isArray(snapshot.plan?.workstreams) ? snapshot.plan.workstreams : [],
    },
    updatedAt: snapshot.updatedAt || new Date(0).toISOString(),
  } satisfies OpenAgentSiteGovernorSnapshot;
}

export function writeOpenAgentSiteGovernorSnapshot(
  snapshot: Omit<OpenAgentSiteGovernorSnapshot, 'updatedAt'>
) {
  const payload: OpenAgentSiteGovernorSnapshot = {
    ...snapshot,
    plan: {
      ...createEmptyOpenAgentSiteGovernorPlan(),
      ...(snapshot.plan || {}),
      alerts: Array.isArray(snapshot.plan?.alerts) ? snapshot.plan.alerts : [],
      workstreams: Array.isArray(snapshot.plan?.workstreams) ? snapshot.plan.workstreams : [],
    },
    updatedAt: new Date().toISOString(),
  };
  writeJsonFile(OPEN_AGENT_SITE_GOVERNOR_SNAPSHOT_FILE, payload);
  return payload;
}

export function readOpenAgentAutonomyBacklog(limit = 12) {
  return readJsonFile<OpenAgentAutonomyReviewItem[]>(OPEN_AGENT_REVIEW_BACKLOG_FILE, []).slice(0, limit);
}

export function summarizeOpenAgentAutonomyBacklogFocus(items = readOpenAgentAutonomyBacklog(12)): OpenAgentAutonomyBacklogFocus {
  const haystack = items.map((item) => [item.title, item.target, item.whyNow].join(' ')).join(' ').toLowerCase();
  const qualityGate = /质量闸门|quality gate|来源可信|历史转化|结构 \+|结构\+|自动发布/.test(haystack);
  const laneReserve = /lane reserve|保底|扩稿|补稿|under-covered lane|queued targets|weak lane/.test(haystack);
  const decisionLedger = /账本|ledger|决策|失败原因|回放|decision/.test(haystack);
  const focusKeys = [
    qualityGate ? 'publish_quality_gate' : null,
    laneReserve ? 'lane_reserve' : null,
    decisionLedger ? 'decision_ledger' : null,
  ].filter((item): item is string => !!item);

  return {
    focusKeys,
    qualityGate,
    laneReserve,
    decisionLedger,
    topTargets: items.slice(0, 5).map((item) => item.title),
  };
}

export function deriveWorldYiAutonomyPolicyFromBacklogFocus(
  focus: OpenAgentAutonomyBacklogFocus
): Omit<WorldYiAutonomyPolicy, 'updatedAt'> {
  return {
    version: 1,
    source: focus.focusKeys.length > 0 ? 'open_agent_backlog' : 'default',
    focusKeys: focus.focusKeys,
    topTargets: focus.topTargets,
    publishGate: {
      minScore: focus.qualityGate ? 220 : 200,
      requireLlmSource: true,
      requireGrowthPublicationReady: true,
      blockLowPerformanceTypes: focus.qualityGate,
      blockLowPerformanceRadarSources: focus.qualityGate,
      lowPerformanceTypeMinPublishedCount: 3,
      lowPerformanceRadarSourceMinPublishedCount: 2,
      laneGapBoost: focus.qualityGate ? 48 : 42,
      weakLaneBoost: focus.laneReserve ? 24 : 22,
      backlogLaneReserveBoost: focus.laneReserve ? 14 : 0,
    },
    queueWeights: {
      laneGapBaseBoost: 120,
      weakLaneBoost: focus.laneReserve ? 48 : 36,
      backlogLaneReserveBoost: focus.laneReserve ? 18 : 0,
      perLaneQuota: 2,
      radarQuota: 3,
      clusterQuota: 3,
    },
    validationMode: {
      skipKnowledgeAcquisition: true,
      skipReportUpgrade: true,
      skipMonthlyDigest: true,
      skipEmailRetry: true,
      skipOpenAgentReview: true,
    },
  };
}

export function writeWorldYiAutonomyPolicy(
  policy: Omit<WorldYiAutonomyPolicy, 'updatedAt'>
) {
  const payload: WorldYiAutonomyPolicy = {
    ...policy,
    updatedAt: new Date().toISOString(),
  };
  writeJsonFile(AUTONOMY_POLICY_FILE, payload);
  return payload;
}

export function readWorldYiAutonomyPolicy(fallbackFocus?: OpenAgentAutonomyBacklogFocus) {
  const fallback = deriveWorldYiAutonomyPolicyFromBacklogFocus(
    fallbackFocus || summarizeOpenAgentAutonomyBacklogFocus()
  );
  const stored = readJsonFile<Partial<WorldYiAutonomyPolicy> | null>(AUTONOMY_POLICY_FILE, null);

  if (!stored) {
    return {
      ...fallback,
      updatedAt: new Date(0).toISOString(),
    };
  }

  return {
    ...fallback,
    ...stored,
    focusKeys: Array.isArray(stored.focusKeys) ? stored.focusKeys : fallback.focusKeys,
    topTargets: Array.isArray(stored.topTargets) ? stored.topTargets : fallback.topTargets,
    publishGate: {
      ...fallback.publishGate,
      ...(stored.publishGate || {}),
    },
    queueWeights: {
      ...fallback.queueWeights,
      ...(stored.queueWeights || {}),
    },
    validationMode: {
      ...fallback.validationMode,
      ...(stored.validationMode || {}),
    },
    updatedAt: stored.updatedAt || new Date(0).toISOString(),
  };
}

export function refreshWorldYiAutonomyPolicyFromBacklog(items = readOpenAgentAutonomyBacklog(12)) {
  const focus = summarizeOpenAgentAutonomyBacklogFocus(items);
  return writeWorldYiAutonomyPolicy(deriveWorldYiAutonomyPolicyFromBacklogFocus(focus));
}

function parseAutonomyPolicySignalValue(rawValue: string, rule: AutonomyPolicySignalRule) {
  const normalized = `${rawValue || ''}`.trim().toLowerCase();

  if (rule.kind === 'boolean') {
    if (['true', '1', 'yes', 'on'].includes(normalized)) {
      return true;
    }
    if (['false', '0', 'no', 'off'].includes(normalized)) {
      return false;
    }
    return null;
  }

  const parsed = Number(normalized);
  if (!Number.isFinite(parsed)) {
    return null;
  }

  const rounded = Math.round(parsed);
  return Math.min(rule.max ?? rounded, Math.max(rule.min ?? rounded, rounded));
}

function readAutonomyPolicyValue(policy: WorldYiAutonomyPolicy, path: string) {
  const rule = AUTONOMY_POLICY_SIGNAL_RULES[path];
  if (!rule) {
    return null;
  }

  if (rule.section === 'publishGate') {
    return (policy.publishGate as Record<string, number | boolean>)[rule.key] ?? null;
  }

  return (policy.queueWeights as Record<string, number | boolean>)[rule.key] ?? null;
}

function writeAutonomyPolicyValue(
  policy: WorldYiAutonomyPolicy,
  path: string,
  value: number | boolean
) {
  const rule = AUTONOMY_POLICY_SIGNAL_RULES[path];
  if (!rule) {
    return;
  }

  if (rule.section === 'publishGate') {
    (policy.publishGate as Record<string, number | boolean>)[rule.key] = value;
    return;
  }

  (policy.queueWeights as Record<string, number | boolean>)[rule.key] = value;
}

export function applyWorldYiAutonomyPolicySignals(
  policy: WorldYiAutonomyPolicy,
  signals: string[]
): WorldYiRuntimeAutonomyPolicyResolution {
  const basePolicy = cloneWorldYiAutonomyPolicy(policy);
  const effectivePolicy = cloneWorldYiAutonomyPolicy(policy);
  const appliedSignals: WorldYiAutonomyPolicySignalApplication[] = [];
  const ignoredSignals: string[] = [];

  signals.forEach((signal) => {
    const matches = [...`${signal || ''}`.matchAll(AUTONOMY_POLICY_SIGNAL_REGEX)];
    let recognized = false;

    matches.forEach((match) => {
      const path = `${match[1] || ''}`.trim();
      const rawValue = `${match[2] || ''}`.trim();
      const rule = AUTONOMY_POLICY_SIGNAL_RULES[path];
      if (!rule) {
        return;
      }

      const nextValue = parseAutonomyPolicySignalValue(rawValue, rule);
      if (nextValue === null) {
        return;
      }

      recognized = true;

      const previousValue = readAutonomyPolicyValue(effectivePolicy, path);
      if (previousValue === null || previousValue === nextValue) {
        return;
      }

      writeAutonomyPolicyValue(effectivePolicy, path, nextValue);
      appliedSignals.push({
        signal,
        path,
        previousValue,
        nextValue,
      });
    });

    if (!recognized && `${signal || ''}`.trim()) {
      ignoredSignals.push(signal);
    }
  });

  return {
    basePolicy,
    effectivePolicy,
    appliedSignals,
    ignoredSignals,
  };
}

export function resolveWorldYiAutonomyRuntimePolicy(params?: {
  fallbackFocus?: OpenAgentAutonomyBacklogFocus;
  analysisPlan?: OpenAgentContentAnalysisPlan | null;
}) {
  const basePolicy = readWorldYiAutonomyPolicy(params?.fallbackFocus);
  return applyWorldYiAutonomyPolicySignals(basePolicy, params?.analysisPlan?.policySignals || []);
}

export function upsertOpenAgentAutonomyBacklog(items: OpenAgentAutonomyReviewItem[]) {
  const existing = readJsonFile<OpenAgentAutonomyReviewItem[]>(OPEN_AGENT_REVIEW_BACKLOG_FILE, []);
  const existingMap = new Map(existing.map((item) => [normalizeTargetKey(item.target), item]));
  const merged = items.map((item) => {
    const previous = existingMap.get(normalizeTargetKey(item.target));
    if (!previous) {
      return item;
    }

    return {
      ...item,
      id: previous.id,
      createdAt: previous.createdAt,
      status: previous.status,
      priority: previous.priority || item.priority,
    };
  });

  const untouchedExisting = existing.filter((item) => (
    !merged.some((next) => normalizeTargetKey(next.target) === normalizeTargetKey(item.target))
  ));

  const payload = [...merged, ...untouchedExisting]
    .sort((left, right) => {
      const leftRank = left.priority === 'P0' ? 0 : left.priority === 'P1' ? 1 : 2;
      const rightRank = right.priority === 'P0' ? 0 : right.priority === 'P1' ? 1 : 2;
      return leftRank - rightRank || right.lastSeenAt.localeCompare(left.lastSeenAt);
    })
    .slice(0, 24);

  writeJsonFile(OPEN_AGENT_REVIEW_BACKLOG_FILE, payload);
  return payload;
}

export function createOpenAgentAutonomyReviewRunId() {
  return `open_agent_review_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function createOpenAgentContentAnalysisRunId() {
  return `open_agent_content_analysis_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function createOpenAgentOpsTriageRunId() {
  return `open_agent_ops_triage_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function createOpenAgentReportReliabilityRunId() {
  return `open_agent_report_reliability_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function createOpenAgentSiteGovernorRunId() {
  return `open_agent_site_governor_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function createWorldYiAutonomousCycleRunId() {
  return `autonomous_cycle_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function readWorldYiAutonomousCycleLedger(limit = 12) {
  return readJsonFile<WorldYiAutonomousCycleLedgerEntry[]>(AUTONOMOUS_CYCLE_LEDGER_FILE, []).slice(0, limit);
}

export function writeWorldYiAutonomousCycleLedgerEntry(
  entry: Omit<WorldYiAutonomousCycleLedgerEntry, 'updatedAt'>
) {
  const existing = readJsonFile<WorldYiAutonomousCycleLedgerEntry[]>(AUTONOMOUS_CYCLE_LEDGER_FILE, []);
  const payload: WorldYiAutonomousCycleLedgerEntry = {
    ...entry,
    updatedAt: new Date().toISOString(),
  };
  const next = [payload, ...existing.filter((item) => item.id !== payload.id)].slice(0, 30);
  writeJsonFile(AUTONOMOUS_CYCLE_LEDGER_FILE, next);
  return payload;
}

export function readWorldYiContentDecisionLedger(limit = 12) {
  return readJsonFile<WorldYiContentDecisionLedgerEntry[]>(CONTENT_DECISION_LEDGER_FILE, []).slice(0, limit);
}

export function writeWorldYiContentDecisionLedgerEntry(
  entry: Omit<WorldYiContentDecisionLedgerEntry, 'updatedAt' | 'summary'> & {
    summary?: WorldYiContentDecisionEntrySummary;
  }
) {
  const existing = readJsonFile<WorldYiContentDecisionLedgerEntry[]>(CONTENT_DECISION_LEDGER_FILE, []);
  const payload: WorldYiContentDecisionLedgerEntry = {
    ...entry,
    summary: entry.summary || summarizeWorldYiContentDecisionSamples(entry.decisions),
    updatedAt: new Date().toISOString(),
  };
  const next = [payload, ...existing.filter((item) => item.id !== payload.id)].slice(0, 36);
  writeJsonFile(CONTENT_DECISION_LEDGER_FILE, next);
  return payload;
}

export function summarizeWorldYiContentDecisionLedger(
  entries = readWorldYiContentDecisionLedger(6)
): WorldYiContentDecisionLedgerSummary {
  const latest = entries[0];

  if (!latest) {
    return {
      latestDecisionMix: createEmptyContentDecisionMix(),
      topBlockedReasons: [],
      topHeldCandidates: [],
      topReviseCandidates: [],
      lastPublishRationale: [],
    };
  }

  return {
    updatedAt: latest.updatedAt,
    latestRunId: latest.id,
    latestTrigger: latest.trigger,
    latestMode: latest.mode,
    latestReason: latest.reason,
    latestPublishedTitle: latest.publishedTitle || null,
    latestPublishedSlug: latest.publishedSlug || null,
    latestDecisionMix: latest.summary.decisionMix,
    topBlockedReasons: latest.summary.topBlockedReasons,
    topHeldCandidates: latest.summary.topHeldCandidates,
    topReviseCandidates: latest.summary.topReviseCandidates,
    lastPublishRationale: latest.summary.lastPublishRationale,
  };
}
