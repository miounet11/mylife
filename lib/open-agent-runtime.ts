import {
  getApiBaseUrl,
  getApiKey,
  getOpenAgentRuntimeMaxRetries,
  getOpenAgentRuntimeModel,
  getOpenAgentRuntimeRetryDelayMs,
  isOpenAgentRuntimeEnabled,
} from '@/lib/env';
import {
  buildOpenAiCompatibleChatCompletionBody,
  resolveReasoningEffortFromBudgetTokens,
} from '@/lib/openai-compatible-chat';
import {
  createOpenAgentContentAnalysisRunId,
  createOpenAgentOpsTriageRunId,
  createOpenAgentReportReliabilityRunId,
  createOpenAgentAutonomyReviewRunId,
  createOpenAgentSiteGovernorRunId,
  extractOpenAgentAutonomyReviewItems,
  readOpenAgentContentAnalysisSnapshot,
  readOpenAgentOpsTriageSnapshot,
  readOpenAgentReportReliabilitySnapshot,
  readOpenAgentSiteGovernorSnapshot,
  refreshWorldYiAutonomyPolicyFromBacklog,
  upsertOpenAgentAutonomyBacklog,
  writeOpenAgentContentAnalysisSnapshot,
  writeOpenAgentOpsTriageSnapshot,
  writeOpenAgentReportReliabilitySnapshot,
  writeOpenAgentAutonomyReviewSnapshot,
  writeOpenAgentSiteGovernorSnapshot,
  type OpenAgentContentAnalysisPlan,
  type OpenAgentOpsTriagePlan,
  type OpenAgentReportReliabilityPlan,
  type OpenAgentReportReliabilityApplication,
  type OpenAgentSiteGovernorPlan,
} from '@/lib/world-yi-autonomous-state';
import { refreshReportRetroSnapshot } from '@/lib/report-retro';
import { applyOpenAgentReportReliabilityPlan } from '@/lib/report-reliability-ops';

type OpenAgentSdkMessage = {
  type?: string;
  message?: {
    content?: Array<{
      type?: string;
      name?: string;
    }>;
  };
};

type OpenAgentQueryResult = {
  text: string;
  num_turns: number;
  duration_ms: number;
  messages: unknown[];
};

type OpenAgentInstance = {
  prompt: (text: string) => Promise<OpenAgentQueryResult>;
  close: () => Promise<void>;
};

type OpenAgentPromptAttempt = {
  result: OpenAgentQueryResult;
  attempts: number;
};

type ValidationRoundSpec = {
  key: string;
  prompt: string;
  expectedKeywords: string[];
};

export type OpenAgentValidationRoundResult = {
  key: string;
  success: boolean;
  answer: string;
  usedTools: string[];
  numTurns: number;
  durationMs: number;
  missingKeywords: string[];
};

function normalizeAgentText(value: string) {
  return `${value || ''}`.replace(/\s+/g, ' ').trim();
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function isRetryableOpenAgentError(error: unknown) {
  const status = typeof error === 'object' && error && 'status' in error
    ? Number((error as { status?: unknown }).status)
    : NaN;

  if (status === 408 || status === 409 || status === 429 || status >= 500) {
    return true;
  }

  const message = `${error instanceof Error ? error.message : error || ''}`.toLowerCase();
  if (!message) {
    return false;
  }

  return [
    'timeout',
    'timed out',
    'fetch failed',
    'network error',
    'networkerror',
    'socket hang up',
    'connection reset',
    'connection aborted',
    'econnreset',
    'enotfound',
    'service unavailable',
    'temporarily unavailable',
    'gateway timeout',
    'bad gateway',
    'deadline exceeded',
    'overloaded',
    'rate limit',
    'too many requests',
    '429',
    '500',
    '502',
    '503',
    '504',
  ].some((token) => message.includes(token));
}

function collectUsedTools(messages: unknown[]) {
  const names = new Set<string>();

  for (const message of messages || []) {
    const typedMessage = message as OpenAgentSdkMessage;
    if (typedMessage?.type !== 'assistant') continue;
    for (const block of typedMessage.message?.content || []) {
      if (block?.type === 'tool_use' && block.name) {
        names.add(block.name);
      }
    }
  }

  return Array.from(names);
}

function createEmptyContentAnalysisPlan(): OpenAgentContentAnalysisPlan {
  return {
    summary: '',
    laneContracts: [],
    queueOverrides: [],
    blockedPatterns: [],
    policySignals: [],
  };
}

function createEmptyOpsTriagePlan(): OpenAgentOpsTriagePlan {
  return {
    summary: '',
    alerts: [],
    recommendedActions: [],
    policyDiffs: [],
  };
}

function createEmptyReportReliabilityPlan(): OpenAgentReportReliabilityPlan {
  return {
    summary: '',
    alerts: [],
    priorityReports: [],
    recommendedActions: [],
  };
}

function createEmptySiteGovernorPlan(): OpenAgentSiteGovernorPlan {
  return {
    summary: '',
    alerts: [],
    workstreams: [],
  };
}

function stripJsonFences(answer: string) {
  return `${answer || ''}`
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
}

function extractJsonObject(answer: string) {
  const stripped = stripJsonFences(answer);
  const direct = stripped.match(/\{[\s\S]*\}/);
  return direct?.[0] || '';
}

function extractTaggedContentAnalysisPlan(answer: string) {
  const lines = `${answer || ''}`
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const plan = createEmptyContentAnalysisPlan();
  const laneSourceTypeByKey = {
    main: 'public-growth',
    wave2: 'public-growth-wave2',
    global: 'public-growth-global',
  } as const;

  for (const line of lines) {
    if (line.startsWith('SUMMARY:')) {
      plan.summary = line.replace(/^SUMMARY:\s*/i, '').trim();
      continue;
    }

    if (line.startsWith('LANE_CONTRACT:')) {
      const payload = line.replace(/^LANE_CONTRACT:\s*/i, '');
      const parts = payload.split('|').map((item) => item.trim());
      const entries = Object.fromEntries(parts.map((item) => {
        const [key, ...rest] = item.split('=');
        return [key.trim(), rest.join('=').trim()];
      }));
      const lane = entries.lane === 'main' || entries.lane === 'wave2' || entries.lane === 'global'
        ? entries.lane
        : null;
      if (lane) {
        plan.laneContracts.push({
          lane,
          sourceType: entries.sourceType === laneSourceTypeByKey[lane]
            ? entries.sourceType
            : laneSourceTypeByKey[lane],
          targetKeys: `${entries.keys || ''}`.split(',').map((item) => item.trim()).filter(Boolean).slice(0, 5),
          reason: entries.reason || 'OpenAgent lane contract',
        });
      }
      continue;
    }

    if (line.startsWith('QUEUE_OVERRIDE:')) {
      const payload = line.replace(/^QUEUE_OVERRIDE:\s*/i, '');
      const parts = payload.split('|').map((item) => item.trim());
      const entries = Object.fromEntries(parts.map((item) => {
        const [key, ...rest] = item.split('=');
        return [key.trim(), rest.join('=').trim()];
      }));
      if (entries.key) {
        plan.queueOverrides.push({
          key: entries.key,
          priority: entries.priority === 'critical' || entries.priority === 'high' || entries.priority === 'medium'
            ? entries.priority
            : 'high',
          reason: entries.reason || 'OpenAgent queue override',
        });
      }
      continue;
    }

    if (line.startsWith('BLOCKED_PATTERN:')) {
      const value = line.replace(/^BLOCKED_PATTERN:\s*/i, '').trim();
      if (value) {
        plan.blockedPatterns.push(value);
      }
      continue;
    }

    if (line.startsWith('POLICY_SIGNAL:')) {
      const value = line.replace(/^POLICY_SIGNAL:\s*/i, '').trim();
      if (value) {
        plan.policySignals.push(value);
      }
    }
  }

  return normalizeContentAnalysisPlan(plan);
}

function normalizeContentAnalysisPlan(raw: unknown): OpenAgentContentAnalysisPlan {
  const payload = (raw && typeof raw === 'object') ? raw as Record<string, unknown> : {};
  const laneSourceTypeByKey = {
    main: 'public-growth',
    wave2: 'public-growth-wave2',
    global: 'public-growth-global',
  } as const;

  const laneContracts = Array.isArray(payload.laneContracts)
    ? payload.laneContracts
      .map((item) => {
        const value = item && typeof item === 'object' ? item as Record<string, unknown> : {};
        const lane = value.lane === 'main' || value.lane === 'wave2' || value.lane === 'global'
          ? value.lane
          : null;
        if (!lane) {
          return null;
        }

        const targetKeys = Array.isArray(value.targetKeys)
          ? value.targetKeys.map((entry) => `${entry || ''}`.trim()).filter(Boolean).slice(0, 5)
          : [];

        return {
          lane,
          sourceType: value.sourceType === laneSourceTypeByKey[lane]
            ? value.sourceType
            : laneSourceTypeByKey[lane],
          targetKeys,
          reason: `${value.reason || ''}`.trim() || 'OpenAgent prioritized this weak lane for replenishment.',
        };
      })
      .filter((item): item is OpenAgentContentAnalysisPlan['laneContracts'][number] => !!item)
    : [];

  const queueOverrides = Array.isArray(payload.queueOverrides)
    ? payload.queueOverrides
      .map((item) => {
        const value = item && typeof item === 'object' ? item as Record<string, unknown> : {};
        const key = `${value.key || ''}`.trim();
        if (!key) {
          return null;
        }

        const priority = value.priority === 'critical' || value.priority === 'high' || value.priority === 'medium'
          ? value.priority
          : 'high';

        return {
          key,
          reason: `${value.reason || ''}`.trim() || 'OpenAgent queue override',
          priority,
        };
      })
      .filter((item): item is OpenAgentContentAnalysisPlan['queueOverrides'][number] => !!item)
    : [];

  return {
    summary: `${payload.summary || ''}`.trim(),
    laneContracts,
    queueOverrides,
    blockedPatterns: Array.isArray(payload.blockedPatterns)
      ? payload.blockedPatterns.map((item) => `${item || ''}`.trim()).filter(Boolean).slice(0, 8)
      : [],
    policySignals: Array.isArray(payload.policySignals)
      ? payload.policySignals.map((item) => `${item || ''}`.trim()).filter(Boolean).slice(0, 8)
      : [],
  };
}

export function extractOpenAgentContentAnalysisPlan(answer: string) {
  const json = extractJsonObject(answer);
  if (json) {
    try {
      return normalizeContentAnalysisPlan(JSON.parse(json));
    } catch {
      return extractTaggedContentAnalysisPlan(answer);
    }
  }

  return extractTaggedContentAnalysisPlan(answer);
}

function extractTaggedOpsTriagePlan(answer: string) {
  const lines = `${answer || ''}`
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const plan = createEmptyOpsTriagePlan();

  for (const line of lines) {
    if (line.startsWith('SUMMARY:')) {
      plan.summary = line.replace(/^SUMMARY:\s*/i, '').trim();
      continue;
    }

    if (line.startsWith('ALERT:')) {
      const payload = line.replace(/^ALERT:\s*/i, '');
      const parts = payload.split('|').map((item) => item.trim());
      const entries = Object.fromEntries(parts.map((item) => {
        const [key, ...rest] = item.split('=');
        return [key.trim(), rest.join('=').trim()];
      }));
      if (entries.title && entries.detail) {
        plan.alerts.push({
          severity: entries.severity === 'critical' || entries.severity === 'warning' || entries.severity === 'info'
            ? entries.severity
            : 'warning',
          title: entries.title,
          detail: entries.detail,
          source: entries.source || 'OpenAgent ops triage',
        });
      }
      continue;
    }

    if (line.startsWith('ACTION:')) {
      const payload = line.replace(/^ACTION:\s*/i, '');
      const parts = payload.split('|').map((item) => item.trim());
      const entries = Object.fromEntries(parts.map((item) => {
        const [key, ...rest] = item.split('=');
        return [key.trim(), rest.join('=').trim()];
      }));
      if (entries.title && entries.reason) {
        plan.recommendedActions.push({
          kind: entries.kind === 'observe'
            || entries.kind === 'run_validation'
            || entries.kind === 'run_full_cycle'
            || entries.kind === 'tighten_block_patterns'
            || entries.kind === 'focus_lane'
            || entries.kind === 'keep_policy'
            || entries.kind === 'investigate'
            ? entries.kind
            : 'observe',
          title: entries.title,
          reason: entries.reason,
          autoExecutable: entries.autoExecutable === 'true',
        });
      }
      continue;
    }

    if (line.startsWith('POLICY_DIFF:')) {
      const payload = line.replace(/^POLICY_DIFF:\s*/i, '');
      const parts = payload.split('|').map((item) => item.trim());
      const entries = Object.fromEntries(parts.map((item) => {
        const [key, ...rest] = item.split('=');
        return [key.trim(), rest.join('=').trim()];
      }));
      if (entries.path && entries.before && entries.after) {
        plan.policyDiffs.push({
          path: entries.path,
          before: entries.before,
          after: entries.after,
          reason: entries.reason || 'OpenAgent policy diff',
        });
      }
    }
  }

  return normalizeOpsTriagePlan(plan);
}

function normalizeOpsTriagePlan(raw: unknown): OpenAgentOpsTriagePlan {
  const payload = (raw && typeof raw === 'object') ? raw as Record<string, unknown> : {};

  return {
    summary: `${payload.summary || ''}`.trim(),
    alerts: Array.isArray(payload.alerts)
      ? payload.alerts
        .map((item) => {
          const value = item && typeof item === 'object' ? item as Record<string, unknown> : {};
          const title = `${value.title || ''}`.trim();
          const detail = `${value.detail || ''}`.trim();
          if (!title || !detail) {
            return null;
          }

          return {
            severity: value.severity === 'critical' || value.severity === 'warning' || value.severity === 'info'
              ? value.severity
              : 'warning',
            title,
            detail,
            source: `${value.source || ''}`.trim() || 'OpenAgent ops triage',
          };
        })
        .filter((item): item is OpenAgentOpsTriagePlan['alerts'][number] => !!item)
        .slice(0, 8)
      : [],
    recommendedActions: Array.isArray(payload.recommendedActions)
      ? payload.recommendedActions
        .map((item) => {
          const value = item && typeof item === 'object' ? item as Record<string, unknown> : {};
          const title = `${value.title || ''}`.trim();
          const reason = `${value.reason || ''}`.trim();
          if (!title || !reason) {
            return null;
          }

          return {
            kind: value.kind === 'observe'
              || value.kind === 'run_validation'
              || value.kind === 'run_full_cycle'
              || value.kind === 'tighten_block_patterns'
              || value.kind === 'focus_lane'
              || value.kind === 'keep_policy'
              || value.kind === 'investigate'
              ? value.kind
              : 'observe',
            title,
            reason,
            autoExecutable: value.autoExecutable === true,
          };
        })
        .filter((item): item is OpenAgentOpsTriagePlan['recommendedActions'][number] => !!item)
        .slice(0, 6)
      : [],
    policyDiffs: Array.isArray(payload.policyDiffs)
      ? payload.policyDiffs
        .map((item) => {
          const value = item && typeof item === 'object' ? item as Record<string, unknown> : {};
          const path = `${value.path || ''}`.trim();
          const before = `${value.before || ''}`.trim();
          const after = `${value.after || ''}`.trim();
          if (!path || !before || !after) {
            return null;
          }

          return {
            path,
            before,
            after,
            reason: `${value.reason || ''}`.trim() || 'OpenAgent policy diff',
          };
        })
        .filter((item): item is OpenAgentOpsTriagePlan['policyDiffs'][number] => !!item)
        .slice(0, 12)
      : [],
  };
}

export function extractOpenAgentOpsTriagePlan(answer: string) {
  const json = extractJsonObject(answer);
  if (json) {
    try {
      return normalizeOpsTriagePlan(JSON.parse(json));
    } catch {
      return extractTaggedOpsTriagePlan(answer);
    }
  }

  return extractTaggedOpsTriagePlan(answer);
}

function extractTaggedReportReliabilityPlan(answer: string) {
  const lines = `${answer || ''}`
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const plan = createEmptyReportReliabilityPlan();

  for (const line of lines) {
    if (line.startsWith('SUMMARY:')) {
      plan.summary = line.replace(/^SUMMARY:\s*/i, '').trim();
      continue;
    }

    if (line.startsWith('ALERT:')) {
      const payload = line.replace(/^ALERT:\s*/i, '');
      const parts = payload.split('|').map((item) => item.trim());
      const entries = Object.fromEntries(parts.map((item) => {
        const [key, ...rest] = item.split('=');
        return [key.trim(), rest.join('=').trim()];
      }));
      if (entries.title && entries.detail) {
        plan.alerts.push({
          severity: entries.severity === 'critical' || entries.severity === 'warning' || entries.severity === 'info'
            ? entries.severity
            : 'warning',
          title: entries.title,
          detail: entries.detail,
          source: entries.source || 'OpenAgent report reliability',
        });
      }
      continue;
    }

    if (line.startsWith('REPORT:')) {
      const payload = line.replace(/^REPORT:\s*/i, '');
      const parts = payload.split('|').map((item) => item.trim());
      const entries = Object.fromEntries(parts.map((item) => {
        const [key, ...rest] = item.split('=');
        return [key.trim(), rest.join('=').trim()];
      }));
      if (entries.id && entries.name && entries.reason) {
        plan.priorityReports.push({
          reportId: entries.id,
          name: entries.name,
          action: entries.action === 'upgrade'
            || entries.action === 'observe'
            || entries.action === 'feedback_sync'
            || entries.action === 'recompute'
            ? entries.action
            : 'observe',
          reason: entries.reason,
          qualityScore: entries.score ? Number(entries.score) : undefined,
          deliveryTier: entries.deliveryTier === 'basic' || entries.deliveryTier === 'enhanced' || entries.deliveryTier === 'expert'
            ? entries.deliveryTier
            : undefined,
        });
      }
      continue;
    }

    if (line.startsWith('ACTION:')) {
      const payload = line.replace(/^ACTION:\s*/i, '');
      const parts = payload.split('|').map((item) => item.trim());
      const entries = Object.fromEntries(parts.map((item) => {
        const [key, ...rest] = item.split('=');
        return [key.trim(), rest.join('=').trim()];
      }));
      if (entries.title && entries.reason) {
        plan.recommendedActions.push({
          kind: entries.kind === 'sync_feedback'
            || entries.kind === 'upgrade_reports'
            || entries.kind === 'tighten_guard'
            || entries.kind === 'observe'
            || entries.kind === 'investigate'
            || entries.kind === 'recompute'
            || entries.kind === 'keep_delivery'
            ? entries.kind
            : 'observe',
          title: entries.title,
          reason: entries.reason,
          autoExecutable: entries.autoExecutable === 'true',
        });
      }
    }
  }

  return normalizeReportReliabilityPlan(plan);
}

function normalizeReportReliabilityPlan(raw: unknown): OpenAgentReportReliabilityPlan {
  const payload = (raw && typeof raw === 'object') ? raw as Record<string, unknown> : {};

  return {
    summary: `${payload.summary || ''}`.trim(),
    alerts: Array.isArray(payload.alerts)
      ? payload.alerts
        .map((item) => {
          const value = item && typeof item === 'object' ? item as Record<string, unknown> : {};
          const title = `${value.title || ''}`.trim();
          const detail = `${value.detail || ''}`.trim();
          if (!title || !detail) {
            return null;
          }

          return {
            severity: value.severity === 'critical' || value.severity === 'warning' || value.severity === 'info'
              ? value.severity
              : 'warning',
            title,
            detail,
            source: `${value.source || ''}`.trim() || 'OpenAgent report reliability',
          };
        })
        .filter((item): item is OpenAgentReportReliabilityPlan['alerts'][number] => !!item)
        .slice(0, 8)
      : [],
    priorityReports: Array.isArray(payload.priorityReports)
      ? payload.priorityReports.reduce<OpenAgentReportReliabilityPlan['priorityReports']>((items, item) => {
          const value = item && typeof item === 'object' ? item as Record<string, unknown> : {};
          const reportId = `${value.reportId || ''}`.trim();
          const name = `${value.name || ''}`.trim();
          const reason = `${value.reason || ''}`.trim();
          if (!reportId || !name || !reason) {
            return items;
          }

          const qualityScore = Number(value.qualityScore);
          items.push({
            reportId,
            name,
            action: value.action === 'upgrade'
              || value.action === 'observe'
              || value.action === 'feedback_sync'
              || value.action === 'recompute'
              ? value.action
              : 'observe',
            reason,
            qualityScore: Number.isFinite(qualityScore) ? qualityScore : undefined,
            deliveryTier: value.deliveryTier === 'basic' || value.deliveryTier === 'enhanced' || value.deliveryTier === 'expert'
              ? value.deliveryTier
              : undefined,
          });
          return items;
        }, []).slice(0, 6)
      : [],
    recommendedActions: Array.isArray(payload.recommendedActions)
      ? payload.recommendedActions
        .map((item) => {
          const value = item && typeof item === 'object' ? item as Record<string, unknown> : {};
          const title = `${value.title || ''}`.trim();
          const reason = `${value.reason || ''}`.trim();
          if (!title || !reason) {
            return null;
          }

          return {
            kind: value.kind === 'sync_feedback'
              || value.kind === 'upgrade_reports'
              || value.kind === 'tighten_guard'
              || value.kind === 'observe'
              || value.kind === 'investigate'
              || value.kind === 'recompute'
              || value.kind === 'keep_delivery'
              ? value.kind
              : 'observe',
            title,
            reason,
            autoExecutable: value.autoExecutable === true,
          };
        })
        .filter((item): item is OpenAgentReportReliabilityPlan['recommendedActions'][number] => !!item)
        .slice(0, 6)
      : [],
  };
}

export function extractOpenAgentReportReliabilityPlan(answer: string) {
  const json = extractJsonObject(answer);
  if (json) {
    try {
      return normalizeReportReliabilityPlan(JSON.parse(json));
    } catch {
      return extractTaggedReportReliabilityPlan(answer);
    }
  }

  return extractTaggedReportReliabilityPlan(answer);
}

function extractTaggedSiteGovernorPlan(answer: string) {
  const lines = `${answer || ''}`
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const plan = createEmptySiteGovernorPlan();

  for (const line of lines) {
    if (line.startsWith('SUMMARY:')) {
      plan.summary = line.replace(/^SUMMARY:\s*/i, '').trim();
      continue;
    }

    if (line.startsWith('ALERT:')) {
      const payload = line.replace(/^ALERT:\s*/i, '');
      const parts = payload.split('|').map((item) => item.trim());
      const entries = Object.fromEntries(parts.map((item) => {
        const [key, ...rest] = item.split('=');
        return [key.trim(), rest.join('=').trim()];
      }));
      if (entries.title && entries.detail) {
        plan.alerts.push({
          severity: entries.severity === 'critical' || entries.severity === 'warning' || entries.severity === 'info'
            ? entries.severity
            : 'warning',
          title: entries.title,
          detail: entries.detail,
          source: entries.source || 'OpenAgent site governor',
        });
      }
      continue;
    }

    if (line.startsWith('WORKSTREAM:')) {
      const payload = line.replace(/^WORKSTREAM:\s*/i, '');
      const parts = payload.split('|').map((item) => item.trim());
      const entries = Object.fromEntries(parts.map((item) => {
        const [key, ...rest] = item.split('=');
        return [key.trim(), rest.join('=').trim()];
      }));
      if (entries.area && entries.target && entries.issue && entries.action) {
        plan.workstreams.push({
          area: entries.area === 'seo'
            || entries.area === 'content'
            || entries.area === 'feedback'
            || entries.area === 'performance'
            || entries.area === 'conversion'
            || entries.area === 'feature'
            ? entries.area
            : 'feature',
          target: entries.target,
          issue: entries.issue,
          action: entries.action,
          priority: entries.priority === 'P0' || entries.priority === 'P1' || entries.priority === 'P2'
            ? entries.priority
            : 'P1',
        });
      }
    }
  }

  return normalizeSiteGovernorPlan(plan);
}

function normalizeSiteGovernorPlan(raw: unknown): OpenAgentSiteGovernorPlan {
  const payload = (raw && typeof raw === 'object') ? raw as Record<string, unknown> : {};

  return {
    summary: `${payload.summary || ''}`.trim(),
    alerts: Array.isArray(payload.alerts)
      ? payload.alerts
        .map((item) => {
          const value = item && typeof item === 'object' ? item as Record<string, unknown> : {};
          const title = `${value.title || ''}`.trim();
          const detail = `${value.detail || ''}`.trim();
          if (!title || !detail) {
            return null;
          }

          return {
            severity: value.severity === 'critical' || value.severity === 'warning' || value.severity === 'info'
              ? value.severity
              : 'warning',
            title,
            detail,
            source: `${value.source || ''}`.trim() || 'OpenAgent site governor',
          };
        })
        .filter((item): item is OpenAgentSiteGovernorPlan['alerts'][number] => !!item)
        .slice(0, 8)
      : [],
    workstreams: Array.isArray(payload.workstreams)
      ? payload.workstreams
        .map((item) => {
          const value = item && typeof item === 'object' ? item as Record<string, unknown> : {};
          const target = `${value.target || ''}`.trim();
          const issue = `${value.issue || ''}`.trim();
          const action = `${value.action || ''}`.trim();
          if (!target || !issue || !action) {
            return null;
          }

          return {
            area: value.area === 'seo'
              || value.area === 'content'
              || value.area === 'feedback'
              || value.area === 'performance'
              || value.area === 'conversion'
              || value.area === 'feature'
              ? value.area
              : 'feature',
            target,
            issue,
            action,
            priority: value.priority === 'P0' || value.priority === 'P1' || value.priority === 'P2'
              ? value.priority
              : 'P1',
          };
        })
        .filter((item): item is OpenAgentSiteGovernorPlan['workstreams'][number] => !!item)
        .slice(0, 12)
      : [],
  };
}

export function extractOpenAgentSiteGovernorPlan(answer: string) {
  const json = extractJsonObject(answer);
  if (json) {
    try {
      return normalizeSiteGovernorPlan(JSON.parse(json));
    } catch {
      return extractTaggedSiteGovernorPlan(answer);
    }
  }

  return extractTaggedSiteGovernorPlan(answer);
}

async function loadOpenAgentSdk() {
  try {
    const sdk = await import('@codeany/open-agent-sdk');
    patchOpenAgentSdkOpenAiProvider(sdk);
    return sdk;
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'unknown_error';
    throw new Error(`OPEN_AGENT_SDK_UNAVAILABLE:${detail}. Run npm run open-agent:prepare first.`);
  }
}

const OPEN_AGENT_PATCH_FLAG = Symbol.for('world_yi_open_agent_openai_compat');

function patchOpenAgentSdkOpenAiProvider(sdk: Record<string, unknown>) {
  const provider = sdk.OpenAIProvider as {
    prototype?: Record<string | symbol, unknown>;
  } | undefined;

  if (!provider?.prototype || provider.prototype[OPEN_AGENT_PATCH_FLAG]) {
    return;
  }

  provider.prototype.createMessage = async function createMessagePatched(params: {
    model: string;
    maxTokens: number;
    system: string;
    messages: Array<Record<string, unknown>>;
    tools?: Array<Record<string, unknown>>;
    thinking?: {
      budget_tokens?: number;
    };
  }) {
    const messages = (this as {
      convertMessages: (system: string, messages: Array<Record<string, unknown>>) => Array<Record<string, unknown>>;
    }).convertMessages(params.system, params.messages);
    const tools = params.tools
      ? (this as {
          convertTools: (tools: Array<Record<string, unknown>>) => Array<Record<string, unknown>>;
        }).convertTools(params.tools)
      : undefined;

    const body = buildOpenAiCompatibleChatCompletionBody({
      model: params.model,
      maxTokens: params.maxTokens,
      messages,
      tools,
      reasoningEffort: resolveReasoningEffortFromBudgetTokens(params.thinking?.budget_tokens),
    });

    const response = await fetch(`${(this as { baseURL: string }).baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${(this as { apiKey: string }).apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errBody = await response.text().catch(() => '');
      const err = new Error(`OpenAI API error: ${response.status} ${response.statusText}: ${errBody}`) as Error & { status?: number };
      err.status = response.status;
      throw err;
    }

    const data = await response.json();
    return (this as {
      convertResponse: (data: Record<string, unknown>) => unknown;
    }).convertResponse(data as Record<string, unknown>);
  };

  provider.prototype[OPEN_AGENT_PATCH_FLAG] = true;
}

export function isOpenAgentReady() {
  return Boolean(getApiKey() && getApiBaseUrl() && getOpenAgentRuntimeModel());
}

export async function createWorldYiOpenAgent(params?: {
  maxTurns?: number;
  allowedTools?: string[];
  appendSystemPrompt?: string;
}): Promise<OpenAgentInstance> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('OPEN_AGENT_API_KEY_MISSING');
  }

  const { createAgent } = await loadOpenAgentSdk();

  return createAgent({
    apiType: 'openai-completions',
    apiKey,
    baseURL: getApiBaseUrl(),
    model: getOpenAgentRuntimeModel(),
    cwd: process.cwd(),
    maxTurns: params?.maxTurns || 6,
    permissionMode: 'bypassPermissions',
    allowedTools: params?.allowedTools || ['Read', 'Glob', 'Grep'],
    appendSystemPrompt: [
      '你服务于 World Yi 自动增长系统。',
      '你的任务不是空谈，而是读取当前项目文件，给出对自动化、内容生产、质量闸门和持续发布有直接帮助的结论。',
      '优先引用本仓库真实文件，不要凭空编造。',
      '只输出任务结论，不要输出 Quick Actions、技能菜单、编号操作提示或交互引导。',
      params?.appendSystemPrompt || '',
    ].filter(Boolean).join('\n'),
    persistSession: false,
  });
}

async function promptWorldYiOpenAgent(params: {
  prompt: string;
  maxTurns?: number;
  allowedTools?: string[];
  appendSystemPrompt?: string;
  maxRetries?: number;
  retryDelayMs?: number;
}): Promise<OpenAgentPromptAttempt> {
  const maxRetries = Math.max(0, params.maxRetries ?? getOpenAgentRuntimeMaxRetries());
  const retryDelayMs = Math.max(0, params.retryDelayMs ?? getOpenAgentRuntimeRetryDelayMs());
  let lastError: unknown = null;

  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    const agent = await createWorldYiOpenAgent({
      maxTurns: params.maxTurns,
      allowedTools: params.allowedTools,
      appendSystemPrompt: params.appendSystemPrompt,
    });

    try {
      const result = await agent.prompt(params.prompt);
      return {
        result,
        attempts: attempt + 1,
      };
    } catch (error) {
      lastError = error;
      if (attempt >= maxRetries || !isRetryableOpenAgentError(error)) {
        throw error;
      }

      await sleep(retryDelayMs * (attempt + 1));
    } finally {
      await agent.close().catch(() => undefined);
    }
  }

  throw lastError instanceof Error ? lastError : new Error('open_agent_prompt_failed');
}

export async function runWorldYiOpenAgentContentAnalysis() {
  if (!isOpenAgentRuntimeEnabled()) {
    return {
      enabled: false,
      success: true,
      skipped: true,
      reason: 'disabled_by_env',
      plan: readOpenAgentContentAnalysisSnapshot()?.plan || createEmptyContentAnalysisPlan(),
    };
  }

  if (!isOpenAgentReady()) {
    writeOpenAgentContentAnalysisSnapshot({
      status: 'error',
      error: 'open_agent_not_configured',
      plan: createEmptyContentAnalysisPlan(),
    });
    return {
      enabled: true,
      success: false,
      reason: 'open_agent_not_configured',
      plan: createEmptyContentAnalysisPlan(),
    };
  }

  const prompts = [
    [
      '先用 Read / Glob / Grep 读取下列代码与运行态文件，然后输出严格 JSON。',
      '- world-yi-autonomous-runtime.md',
      '- lib/content-ops.ts',
      '- lib/world-yi-autonomous-engine.ts',
      '- lib/world-yi-publication-mechanism.ts',
      '- lib/world-yi-publication-lanes.ts',
      '- data/runtime/world-yi-content-decision-ledger.json',
      '- data/runtime/world-yi-autonomous-cycle-ledger.json',
      '- data/runtime/world-yi-autonomy-policy.json',
      '- data/runtime/world-yi-open-agent-review.backlog.json',
      'JSON schema:',
      '{',
      '  "summary": string,',
      '  "laneContracts": [{"lane":"main|wave2|global","sourceType":"public-growth|public-growth-wave2|public-growth-global","targetKeys":["..."],"reason":"..."}],',
      '  "queueOverrides": [{"key":"...","reason":"...","priority":"critical|high|medium"}],',
      '  "blockedPatterns": ["..."],',
      '  "policySignals": ["..."]',
      '}',
      '要求：',
      '- 只输出 JSON，不要 markdown，不要解释。',
      '- laneContracts 只保留最重要的 1-2 条弱 lane 补位合同。',
      '- queueOverrides 只保留最值得前置执行的 3-5 个 generation key。',
      '- blockedPatterns 必须是机器可执行的匹配模式，优先使用 field:glob 形式，例如 source:knowledge-synthesis:*:book-path、source:knowledge-synthesis:*:concept-glossary、key:diaspora-*、title:*书单路径*。',
      '- policySignals 必须是可直接执行的 key=value 赋值，且只允许这些键：publishGate.minScore、publishGate.requireLlmSource、publishGate.requireGrowthPublicationReady、publishGate.blockLowPerformanceTypes、publishGate.blockLowPerformanceRadarSources、publishGate.laneGapBoost、publishGate.weakLaneBoost、publishGate.backlogLaneReserveBoost、queueWeights.laneGapBaseBoost、queueWeights.weakLaneBoost、queueWeights.backlogLaneReserveBoost、queueWeights.perLaneQuota、queueWeights.radarQuota、queueWeights.clusterQuota。',
      '- 如果没有明确可执行的 blocked pattern 或 policy signal，就返回空数组，不要写解释型句子。',
    ].join('\n'),
    [
      '继续读取同一批文件，然后输出纯文本标签格式，不要 JSON，不要 markdown。',
      '格式严格如下：',
      'SUMMARY: ...',
      'LANE_CONTRACT: lane=global | sourceType=public-growth-global | keys=key-a,key-b | reason=...',
      'QUEUE_OVERRIDE: key=some-key | priority=critical | reason=...',
      'BLOCKED_PATTERN: source:knowledge-synthesis:*:book-path',
      'POLICY_SIGNAL: publishGate.minScore=210',
      '要求：',
      '- 最多 1 行 SUMMARY。',
      '- 最多 2 行 LANE_CONTRACT。',
      '- 最多 5 行 QUEUE_OVERRIDE。',
      '- 最多 5 行 BLOCKED_PATTERN。',
      '- 最多 5 行 POLICY_SIGNAL。',
      '- BLOCKED_PATTERN 继续遵守 field:glob 约定。',
      '- POLICY_SIGNAL 继续遵守 key=value 且必须来自允许键集合。',
    ].join('\n'),
  ];
  const runId = createOpenAgentContentAnalysisRunId();
  const startedAt = Date.now();
  let bestResult = {
    answer: '',
    usedTools: [] as string[],
    numTurns: 0,
    durationMs: 0,
    plan: createEmptyContentAnalysisPlan(),
  };

  for (const prompt of prompts) {
    const { result } = await promptWorldYiOpenAgent({
      prompt,
      maxTurns: 8,
      allowedTools: ['Read', 'Glob', 'Grep'],
      appendSystemPrompt: '你当前负责内容自动化分析。必须读取给定文件后，输出能直接驱动 World Yi 内容调度的结构化结果。',
    });
    const answer = normalizeAgentText(result.text);
    const usedTools = collectUsedTools(result.messages || []);
    const plan = extractOpenAgentContentAnalysisPlan(result.text);
    const success = usedTools.length > 0 && (
      plan.summary.length > 0
      || plan.laneContracts.length > 0
      || plan.queueOverrides.length > 0
      || plan.blockedPatterns.length > 0
    );

    if (
      answer.length > bestResult.answer.length
      || plan.laneContracts.length > bestResult.plan.laneContracts.length
      || plan.queueOverrides.length > bestResult.plan.queueOverrides.length
    ) {
      bestResult = {
        answer,
        usedTools,
        numTurns: result.num_turns,
        durationMs: result.duration_ms,
        plan,
      };
    }

    if (success) {
      writeOpenAgentContentAnalysisSnapshot({
        status: 'success',
        runId,
        startedAt: new Date(startedAt).toISOString(),
        finishedAt: new Date().toISOString(),
        durationMs: Date.now() - startedAt,
        answer,
        usedTools,
        numTurns: result.num_turns,
        plan,
      });

      return {
        enabled: true,
        success: true,
        reason: 'analyzed',
        answer,
        usedTools,
        numTurns: result.num_turns,
        durationMs: result.duration_ms,
        plan,
      };
    }
  }

  const previousSnapshot = readOpenAgentContentAnalysisSnapshot();
  if (previousSnapshot?.status === 'success' && (
    previousSnapshot.plan.summary
    || previousSnapshot.plan.laneContracts.length > 0
    || previousSnapshot.plan.queueOverrides.length > 0
  )) {
    writeOpenAgentContentAnalysisSnapshot({
      status: 'success',
      runId,
      startedAt: new Date(startedAt).toISOString(),
      finishedAt: new Date().toISOString(),
      durationMs: Date.now() - startedAt,
      answer: bestResult.answer,
      usedTools: bestResult.usedTools,
      numTurns: bestResult.numTurns,
      plan: previousSnapshot.plan,
    });

    return {
      enabled: true,
      success: true,
      reason: 'reused_last_successful_analysis_snapshot',
      answer: bestResult.answer,
      usedTools: bestResult.usedTools,
      numTurns: bestResult.numTurns,
      durationMs: bestResult.durationMs,
      plan: previousSnapshot.plan,
    };
  }

  writeOpenAgentContentAnalysisSnapshot({
    status: 'error',
    runId,
    startedAt: new Date(startedAt).toISOString(),
    finishedAt: new Date().toISOString(),
    durationMs: Date.now() - startedAt,
    answer: bestResult.answer,
    usedTools: bestResult.usedTools,
    numTurns: bestResult.numTurns,
    error: 'open_agent_content_analysis_parse_failed',
    plan: bestResult.plan,
  });

  return {
    enabled: true,
    success: false,
    reason: 'open_agent_content_analysis_parse_failed',
    answer: bestResult.answer,
    usedTools: bestResult.usedTools,
    numTurns: bestResult.numTurns,
    durationMs: bestResult.durationMs,
    plan: bestResult.plan,
  };
}

export async function runWorldYiOpenAgentOpsTriage() {
  if (!isOpenAgentRuntimeEnabled()) {
    return {
      enabled: false,
      success: true,
      skipped: true,
      reason: 'disabled_by_env',
      plan: readOpenAgentOpsTriageSnapshot()?.plan || createEmptyOpsTriagePlan(),
    };
  }

  if (!isOpenAgentReady()) {
    writeOpenAgentOpsTriageSnapshot({
      status: 'error',
      error: 'open_agent_not_configured',
      plan: createEmptyOpsTriagePlan(),
    });
    return {
      enabled: true,
      success: false,
      reason: 'open_agent_not_configured',
      plan: createEmptyOpsTriagePlan(),
    };
  }

  const prompts = [
    [
      '先用 Read / Glob / Grep 读取下列代码与运行态文件，然后输出严格 JSON。',
      '- world-yi-autonomous-runtime.md',
      '- lib/world-yi-autonomous-engine.ts',
      '- lib/content-ops.ts',
      '- data/runtime/world-yi-open-agent-content-analysis.snapshot.json',
      '- data/runtime/world-yi-open-agent-review.snapshot.json',
      '- data/runtime/world-yi-content-decision-ledger.json',
      '- data/runtime/world-yi-autonomous-cycle-ledger.json',
      '- data/runtime/world-yi-autonomy-policy.json',
      'JSON schema:',
      '{',
      '  "summary": string,',
      '  "alerts": [{"severity":"critical|warning|info","title":"...","detail":"...","source":"..."}],',
      '  "recommendedActions": [{"kind":"observe|run_validation|run_full_cycle|tighten_block_patterns|focus_lane|keep_policy|investigate","title":"...","reason":"...","autoExecutable":boolean}],',
      '  "policyDiffs": [{"path":"...","before":"...","after":"...","reason":"..."}]',
      '}',
      '要求：',
      '- 只输出 JSON，不要 markdown，不要解释。',
      '- alerts 只保留当前最关键的 3-6 条。',
      '- recommendedActions 只保留最值得执行的 2-5 条。',
      '- policyDiffs 只保留真实存在的 base/effective policy 变化；如果没有差异就返回空数组。',
      '- 必须基于当前 runtime evidence，不要复述抽象理念。',
    ].join('\n'),
    [
      '继续读取同一批文件，然后输出纯文本标签格式，不要 JSON，不要 markdown。',
      '格式严格如下：',
      'SUMMARY: ...',
      'ALERT: severity=warning | title=... | detail=... | source=...',
      'ACTION: kind=observe | title=... | reason=... | autoExecutable=false',
      'POLICY_DIFF: path=publishGate.minScore | before=220 | after=210 | reason=...',
      '要求：',
      '- 最多 1 行 SUMMARY。',
      '- 最多 6 行 ALERT。',
      '- 最多 5 行 ACTION。',
      '- 最多 8 行 POLICY_DIFF。',
    ].join('\n'),
  ];
  const runId = createOpenAgentOpsTriageRunId();
  const startedAt = Date.now();
  let bestResult = {
    answer: '',
    usedTools: [] as string[],
    numTurns: 0,
    durationMs: 0,
    plan: createEmptyOpsTriagePlan(),
  };

  for (const prompt of prompts) {
    const { result } = await promptWorldYiOpenAgent({
      prompt,
      maxTurns: 8,
      allowedTools: ['Read', 'Glob', 'Grep'],
      appendSystemPrompt: '你当前负责自治运行态分诊。必须读取给定文件后，输出能直接用于后台面板和下一轮自治判断的结构化结果。',
    });
    const answer = normalizeAgentText(result.text);
    const usedTools = collectUsedTools(result.messages || []);
    const plan = extractOpenAgentOpsTriagePlan(result.text);
    const success = usedTools.length > 0 && (
      plan.summary.length > 0
      || plan.alerts.length > 0
      || plan.recommendedActions.length > 0
    );

    if (
      answer.length > bestResult.answer.length
      || plan.alerts.length > bestResult.plan.alerts.length
      || plan.recommendedActions.length > bestResult.plan.recommendedActions.length
    ) {
      bestResult = {
        answer,
        usedTools,
        numTurns: result.num_turns,
        durationMs: result.duration_ms,
        plan,
      };
    }

    if (success) {
      writeOpenAgentOpsTriageSnapshot({
        status: 'success',
        runId,
        startedAt: new Date(startedAt).toISOString(),
        finishedAt: new Date().toISOString(),
        durationMs: Date.now() - startedAt,
        answer,
        usedTools,
        numTurns: result.num_turns,
        plan,
      });

      return {
        enabled: true,
        success: true,
        reason: 'triaged',
        answer,
        usedTools,
        numTurns: result.num_turns,
        durationMs: result.duration_ms,
        plan,
      };
    }
  }

  const previousSnapshot = readOpenAgentOpsTriageSnapshot();
  if (previousSnapshot?.status === 'success' && (
    previousSnapshot.plan.summary
    || previousSnapshot.plan.alerts.length > 0
    || previousSnapshot.plan.recommendedActions.length > 0
  )) {
    writeOpenAgentOpsTriageSnapshot({
      status: 'success',
      runId,
      startedAt: new Date(startedAt).toISOString(),
      finishedAt: new Date().toISOString(),
      durationMs: Date.now() - startedAt,
      answer: bestResult.answer,
      usedTools: bestResult.usedTools,
      numTurns: bestResult.numTurns,
      plan: previousSnapshot.plan,
    });

    return {
      enabled: true,
      success: true,
      reason: 'reused_last_successful_ops_triage_snapshot',
      answer: bestResult.answer,
      usedTools: bestResult.usedTools,
      numTurns: bestResult.numTurns,
      durationMs: bestResult.durationMs,
      plan: previousSnapshot.plan,
    };
  }

  writeOpenAgentOpsTriageSnapshot({
    status: 'error',
    runId,
    startedAt: new Date(startedAt).toISOString(),
    finishedAt: new Date().toISOString(),
    durationMs: Date.now() - startedAt,
    answer: bestResult.answer,
    usedTools: bestResult.usedTools,
    numTurns: bestResult.numTurns,
    error: 'open_agent_ops_triage_parse_failed',
    plan: bestResult.plan,
  });

  return {
    enabled: true,
    success: false,
    reason: 'open_agent_ops_triage_parse_failed',
    answer: bestResult.answer,
    usedTools: bestResult.usedTools,
    numTurns: bestResult.numTurns,
    durationMs: bestResult.durationMs,
    plan: bestResult.plan,
  };
}

export async function runWorldYiOpenAgentReportReliabilityReview(params?: {
  autoExecute?: boolean;
}) {
  if (!isOpenAgentRuntimeEnabled()) {
    return {
      enabled: false,
      success: true,
      skipped: true,
      reason: 'disabled_by_env',
      plan: readOpenAgentReportReliabilitySnapshot()?.plan || createEmptyReportReliabilityPlan(),
      application: readOpenAgentReportReliabilitySnapshot()?.application,
    };
  }

  if (!isOpenAgentReady()) {
    writeOpenAgentReportReliabilitySnapshot({
      status: 'error',
      error: 'open_agent_not_configured',
      plan: createEmptyReportReliabilityPlan(),
    });
    return {
      enabled: true,
      success: false,
      reason: 'open_agent_not_configured',
      plan: createEmptyReportReliabilityPlan(),
      application: undefined,
    };
  }

  try {
    refreshReportRetroSnapshot({
      windowMinutes: 24 * 60,
      sectionLimit: 12,
      syncFeedback: true,
      feedbackLimit: 50,
    });
  } catch {
    // Keep running against the last available runtime snapshot when refresh fails.
  }

  const prompts = [
    [
      '先用 Read / Glob / Grep 读取下列代码与运行态文件，然后输出严格 JSON。',
      '- world-yi-autonomous-runtime.md',
      '- lib/report-pipeline.ts',
      '- lib/report-reliability.ts',
      '- lib/report-quality.ts',
      '- lib/report-feedback-loop.ts',
      '- data/runtime/report-retro.snapshot.json',
      'JSON schema:',
      '{',
      '  "summary": string,',
      '  "alerts": [{"severity":"critical|warning|info","title":"...","detail":"...","source":"..."}],',
      '  "priorityReports": [{"reportId":"...","name":"...","action":"upgrade|observe|feedback_sync|recompute","reason":"...","qualityScore":number,"deliveryTier":"basic|enhanced|expert"}],',
      '  "recommendedActions": [{"kind":"sync_feedback|upgrade_reports|tighten_guard|observe|investigate|recompute|keep_delivery","title":"...","reason":"...","autoExecutable":boolean}]',
      '}',
      '要求：',
      '- 只输出 JSON，不要 markdown，不要解释。',
      '- alerts 只保留当前最关键的 3-6 条报告可靠性问题。',
      '- priorityReports 只保留最值得优先处理的 2-5 份真实报告；不要输出 likely test 样本。',
      '- recommendedActions 只保留最值得执行的 2-5 条。',
      '- 必须基于 report-retro snapshot 和真实代码逻辑，不要复述抽象理念。',
    ].join('\n'),
    [
      '继续读取同一批文件，然后输出纯文本标签格式，不要 JSON，不要 markdown。',
      '格式严格如下：',
      'SUMMARY: ...',
      'ALERT: severity=warning | title=... | detail=... | source=...',
      'REPORT: id=report_xxx | name=... | action=upgrade | reason=... | score=82 | deliveryTier=basic',
      'ACTION: kind=upgrade_reports | title=... | reason=... | autoExecutable=true',
      '要求：',
      '- 最多 1 行 SUMMARY。',
      '- 最多 6 行 ALERT。',
      '- 最多 5 行 REPORT。',
      '- 最多 5 行 ACTION。',
      '- REPORT 只能包含真实报告，不要输出 likely test 样本。',
    ].join('\n'),
  ];
  const runId = createOpenAgentReportReliabilityRunId();
  const startedAt = Date.now();
  const shouldAutoExecute = params?.autoExecute !== false;
  let bestResult = {
    answer: '',
    usedTools: [] as string[],
    numTurns: 0,
    durationMs: 0,
    plan: createEmptyReportReliabilityPlan(),
  };

  for (const prompt of prompts) {
    const { result } = await promptWorldYiOpenAgent({
      prompt,
      maxTurns: 8,
      allowedTools: ['Read', 'Glob', 'Grep'],
      appendSystemPrompt: '你当前负责测算结果可靠性复审。必须读取给定文件后，输出可直接用于后台面板和下一轮报告升级判断的结构化结果。',
    });
    const answer = normalizeAgentText(result.text);
    const usedTools = collectUsedTools(result.messages || []);
    const plan = extractOpenAgentReportReliabilityPlan(result.text);
    const success = usedTools.length > 0 && (
      plan.summary.length > 0
      || plan.alerts.length > 0
      || plan.priorityReports.length > 0
      || plan.recommendedActions.length > 0
    );

    if (
      answer.length > bestResult.answer.length
      || plan.alerts.length > bestResult.plan.alerts.length
      || plan.priorityReports.length > bestResult.plan.priorityReports.length
    ) {
      bestResult = {
        answer,
        usedTools,
        numTurns: result.num_turns,
        durationMs: result.duration_ms,
        plan,
      };
    }

    if (success) {
      const application: OpenAgentReportReliabilityApplication | undefined = shouldAutoExecute
        ? applyOpenAgentReportReliabilityPlan(plan, { trackEvent: false })
        : undefined;
      writeOpenAgentReportReliabilitySnapshot({
        status: 'success',
        runId,
        startedAt: new Date(startedAt).toISOString(),
        finishedAt: new Date().toISOString(),
        durationMs: Date.now() - startedAt,
        answer,
        usedTools,
        numTurns: result.num_turns,
        plan,
        application,
      });

      return {
        enabled: true,
        success: true,
        reason: 'report_reliability_reviewed',
        answer,
        usedTools,
        numTurns: result.num_turns,
        durationMs: result.duration_ms,
        plan,
        application,
      };
    }
  }

  const previousSnapshot = readOpenAgentReportReliabilitySnapshot();
  if (previousSnapshot?.status === 'success' && (
    previousSnapshot.plan.summary
    || previousSnapshot.plan.alerts.length > 0
    || previousSnapshot.plan.priorityReports.length > 0
    || previousSnapshot.plan.recommendedActions.length > 0
  )) {
    const application: OpenAgentReportReliabilityApplication | undefined = shouldAutoExecute
      ? applyOpenAgentReportReliabilityPlan(previousSnapshot.plan, { trackEvent: false })
      : previousSnapshot.application;
    writeOpenAgentReportReliabilitySnapshot({
      status: 'success',
      runId,
      startedAt: new Date(startedAt).toISOString(),
      finishedAt: new Date().toISOString(),
      durationMs: Date.now() - startedAt,
      answer: bestResult.answer,
      usedTools: bestResult.usedTools,
      numTurns: bestResult.numTurns,
      plan: previousSnapshot.plan,
      application,
    });

    return {
      enabled: true,
      success: true,
      reason: 'reused_last_successful_report_reliability_snapshot',
      answer: bestResult.answer,
      usedTools: bestResult.usedTools,
      numTurns: bestResult.numTurns,
      durationMs: bestResult.durationMs,
      plan: previousSnapshot.plan,
      application,
    };
  }

  writeOpenAgentReportReliabilitySnapshot({
    status: 'error',
    runId,
    startedAt: new Date(startedAt).toISOString(),
    finishedAt: new Date().toISOString(),
    durationMs: Date.now() - startedAt,
    answer: bestResult.answer,
    usedTools: bestResult.usedTools,
    numTurns: bestResult.numTurns,
    error: 'open_agent_report_reliability_parse_failed',
    plan: bestResult.plan,
  });

  return {
    enabled: true,
    success: false,
    reason: 'open_agent_report_reliability_parse_failed',
    answer: bestResult.answer,
    usedTools: bestResult.usedTools,
    numTurns: bestResult.numTurns,
    durationMs: bestResult.durationMs,
    plan: bestResult.plan,
    application: undefined,
  };
}

export async function runWorldYiOpenAgentSiteGovernorReview() {
  if (!isOpenAgentRuntimeEnabled()) {
    return {
      enabled: false,
      success: true,
      skipped: true,
      reason: 'disabled_by_env',
      plan: readOpenAgentSiteGovernorSnapshot()?.plan || createEmptySiteGovernorPlan(),
    };
  }

  if (!isOpenAgentReady()) {
    writeOpenAgentSiteGovernorSnapshot({
      status: 'error',
      error: 'open_agent_not_configured',
      plan: createEmptySiteGovernorPlan(),
    });
    return {
      enabled: true,
      success: false,
      reason: 'open_agent_not_configured',
      plan: createEmptySiteGovernorPlan(),
    };
  }

  const prompts = [
    [
      '先用 Read / Glob / Grep 读取下列代码与运行态文件，然后输出严格 JSON。',
      '- program.md',
      '- lib/admin-quality-workboard.ts',
      '- lib/report-feedback-loop.ts',
      '- lib/system-ops.ts',
      '- lib/analytics.ts',
      '- app/admin/analytics/page.tsx',
      '- app/api/admin/report-feedback-sync/route.ts',
      '- data/runtime/world-yi-open-agent-review.snapshot.json',
      '- data/runtime/world-yi-open-agent-report-reliability.snapshot.json',
      '- data/runtime/world-yi-open-agent-ops-triage.snapshot.json',
      'JSON schema:',
      '{',
      '  "summary": string,',
      '  "alerts": [{"severity":"critical|warning|info","title":"...","detail":"...","source":"..."}],',
      '  "workstreams": [{"area":"seo|content|feedback|performance|conversion|feature","target":"...","issue":"...","action":"...","priority":"P0|P1|P2"}]',
      '}',
      '要求：',
      '- 只输出 JSON，不要 markdown，不要解释。',
      '- 必须把站点问题归入 seo、content、feedback、performance、conversion、feature 这 6 类之一。',
      '- alerts 只保留最关键的 4-8 条。',
      '- workstreams 只保留最值得站长立即推动的 6-12 条。',
      '- 必须基于真实代码和 runtime evidence，不要空泛战略。',
    ].join('\n'),
    [
      '继续读取同一批文件，然后输出纯文本标签格式，不要 JSON，不要 markdown。',
      '格式严格如下：',
      'SUMMARY: ...',
      'ALERT: severity=warning | title=... | detail=... | source=...',
      'WORKSTREAM: area=performance | target=/tools/[slug] | issue=... | action=... | priority=P1',
      '要求：',
      '- 最多 1 行 SUMMARY。',
      '- 最多 8 行 ALERT。',
      '- 最多 12 行 WORKSTREAM。',
    ].join('\n'),
  ];
  const runId = createOpenAgentSiteGovernorRunId();
  const startedAt = Date.now();
  let bestResult = {
    answer: '',
    usedTools: [] as string[],
    numTurns: 0,
    durationMs: 0,
    plan: createEmptySiteGovernorPlan(),
  };

  for (const prompt of prompts) {
    const { result } = await promptWorldYiOpenAgent({
      prompt,
      maxTurns: 10,
      allowedTools: ['Read', 'Glob', 'Grep'],
      appendSystemPrompt: '你当前扮演站点站长。必须读取��定文件后，基于真实运行证据输出全站治理优先级，覆盖 SEO、内容质量、用户反馈、性能、转化和功能机会。',
    });
    const answer = normalizeAgentText(result.text);
    const usedTools = collectUsedTools(result.messages || []);
    const plan = extractOpenAgentSiteGovernorPlan(result.text);
    const success = usedTools.length > 0 && (
      plan.summary.length > 0
      || plan.alerts.length > 0
      || plan.workstreams.length > 0
    );

    if (
      answer.length > bestResult.answer.length
      || plan.alerts.length > bestResult.plan.alerts.length
      || plan.workstreams.length > bestResult.plan.workstreams.length
    ) {
      bestResult = {
        answer,
        usedTools,
        numTurns: result.num_turns,
        durationMs: result.duration_ms,
        plan,
      };
    }

    if (success) {
      writeOpenAgentSiteGovernorSnapshot({
        status: 'success',
        runId,
        startedAt: new Date(startedAt).toISOString(),
        finishedAt: new Date().toISOString(),
        durationMs: Date.now() - startedAt,
        answer,
        usedTools,
        numTurns: result.num_turns,
        plan,
      });

      return {
        enabled: true,
        success: true,
        reason: 'site_governor_reviewed',
        answer,
        usedTools,
        numTurns: result.num_turns,
        durationMs: result.duration_ms,
        plan,
      };
    }
  }

  const previousSnapshot = readOpenAgentSiteGovernorSnapshot();
  if (previousSnapshot?.status === 'success' && (
    previousSnapshot.plan.summary
    || previousSnapshot.plan.alerts.length > 0
    || previousSnapshot.plan.workstreams.length > 0
  )) {
    writeOpenAgentSiteGovernorSnapshot({
      status: 'success',
      runId,
      startedAt: new Date(startedAt).toISOString(),
      finishedAt: new Date().toISOString(),
      durationMs: Date.now() - startedAt,
      answer: bestResult.answer,
      usedTools: bestResult.usedTools,
      numTurns: bestResult.numTurns,
      plan: previousSnapshot.plan,
    });

    return {
      enabled: true,
      success: true,
      reason: 'reused_last_successful_site_governor_snapshot',
      answer: bestResult.answer,
      usedTools: bestResult.usedTools,
      numTurns: bestResult.numTurns,
      durationMs: bestResult.durationMs,
      plan: previousSnapshot.plan,
    };
  }

  writeOpenAgentSiteGovernorSnapshot({
    status: 'error',
    runId,
    startedAt: new Date(startedAt).toISOString(),
    finishedAt: new Date().toISOString(),
    durationMs: Date.now() - startedAt,
    answer: bestResult.answer,
    usedTools: bestResult.usedTools,
    numTurns: bestResult.numTurns,
    error: 'open_agent_site_governor_parse_failed',
    plan: bestResult.plan,
  });

  return {
    enabled: true,
    success: false,
    reason: 'open_agent_site_governor_parse_failed',
    answer: bestResult.answer,
    usedTools: bestResult.usedTools,
    numTurns: bestResult.numTurns,
    durationMs: bestResult.durationMs,
    plan: bestResult.plan,
  };
}

export async function runWorldYiOpenAgentValidationRounds() {
  if (!isOpenAgentReady()) {
    return {
      enabled: false,
      success: false,
      reason: 'open_agent_not_configured',
      rounds: [] as OpenAgentValidationRoundResult[],
    };
  }

  const rounds: ValidationRoundSpec[] = [
    {
      key: 'north_star_and_control_route',
      prompt: '读取 program.md 和 world-yi-autonomous-runtime.md。说明这个项目的北极星，以及现在统一的自治控制入口是什么。',
      expectedKeywords: ['自治', '入口', 'World Yi'],
    },
    {
      key: 'autonomous_cycle_order',
      prompt: '继续读取 lib/world-yi-autonomous-engine.ts。列出自治循环的执行顺序，并指出哪两个阶段可以通过环境变量关闭。',
      expectedKeywords: ['知识', '内容', '报告'],
    },
    {
      key: 'publication_and_quality_gate',
      prompt: '先读取 lib/world-yi-publication-mechanism.ts 中与 draft reserve、publish window、quality gate 相关的实现，再读取 lib/content-ops.ts 中与发布调度和质量检查相关的实现。用 3 句话说明草稿储备、自动发布窗口、质量闸门三者如何配合。答案必须包含“草稿”“发布”“质量”这三个词。',
      expectedKeywords: ['草稿', '发布', '质量'],
    },
  ];

  const results: OpenAgentValidationRoundResult[] = [];

  for (const round of rounds) {
    const startedAt = Date.now();
    const { result } = await promptWorldYiOpenAgent({
      prompt: round.prompt,
      maxTurns: 10,
      allowedTools: ['Read', 'Glob', 'Grep'],
      appendSystemPrompt: '回答使用简洁中文。每轮都先读取文件，再回答。不要输出菜单或额外操作选项。',
    });
    const answer = normalizeAgentText(result.text);
    const usedTools = collectUsedTools(result.messages || []);
    const missingKeywords = round.expectedKeywords.filter((keyword) => !answer.includes(keyword));
    const success = answer.length >= 24 && usedTools.length > 0 && missingKeywords.length <= 1;

    results.push({
      key: round.key,
      success,
      answer,
      usedTools,
      numTurns: result.num_turns,
      durationMs: result.duration_ms || (Date.now() - startedAt),
      missingKeywords,
    });
  }

  return {
    enabled: true,
    success: results.every((item) => item.success),
    reason: results.every((item) => item.success) ? 'validated' : 'validation_failed',
    rounds: results,
  };
}

export async function runWorldYiOpenAgentAutonomyReview() {
  if (!isOpenAgentRuntimeEnabled()) {
    return {
      enabled: false,
      success: true,
      skipped: true,
      reason: 'disabled_by_env',
    };
  }

  if (!isOpenAgentReady()) {
    writeOpenAgentAutonomyReviewSnapshot({
      status: 'error',
      error: 'open_agent_not_configured',
      items: [],
    });
    return {
      enabled: true,
      success: false,
      reason: 'open_agent_not_configured',
    };
  }

  const reviewFiles = [
    'world-yi-autonomous-runtime.md',
    'lib/world-yi-autonomous-engine.ts',
    'lib/world-yi-publication-mechanism.ts',
    'lib/content-ops.ts',
    'data/runtime/world-yi-open-agent-review.backlog.json',
    'data/runtime/world-yi-autonomy-policy.json',
    'data/runtime/world-yi-autonomous-cycle-ledger.json',
    'data/runtime/world-yi-content-decision-ledger.json',
  ];
  const prompts = [
    [
      '先用 Glob / Read 检查并读取下列代码与运行态文件，再给出 3 条最值得优先执行的自动化升级建议：',
      ...reviewFiles.map((file) => `- ${file}`),
      '要求：建议必须基于最新 runtime evidence，而不是只基于代码结构。',
      '如果某项能力已经落地，例如 backlog -> policy override 或 candidate decision ledger，就不要重复建议“先做这个”，而要指出它仍未覆盖的真实瓶颈。',
      '每条建议必须同时说明目标、受影响环节、为什么现在做。',
    ].join('\n'),
    [
      '再次读取以下文件并输出最终复审结果：',
      ...reviewFiles.map((file) => `- ${file}`),
      '优先根据 content decision ledger、autonomy policy、recent cycle ledger 里的真实阻断原因来判断最该解决的问题。',
      '要求：只输出 3 条建议，每条单独一段。',
      '每条必须使用固定标签：目标：... 受影响环节：... 为什么现在做：...',
      '不要输出菜单，不要追问，不要空答。',
    ].join('\n'),
  ];
  const reviewRunId = createOpenAgentAutonomyReviewRunId();
  const startedAt = Date.now();

  let bestResult: {
    answer: string;
    usedTools: string[];
    numTurns: number;
    durationMs: number;
  } = {
    answer: '',
    usedTools: [],
    numTurns: 0,
    durationMs: 0,
  };

  for (const prompt of prompts) {
    const { result } = await promptWorldYiOpenAgent({
      prompt,
      maxTurns: 10,
      allowedTools: ['Read', 'Glob', 'Grep'],
      appendSystemPrompt: '你当前负责自治系统复审。必须读取给定文件后，再输出最值得执行的自动化升级建议。优先使用标签“目标：”“受影响环节：”“为什么现在做：”。',
    });
    const answer = normalizeAgentText(result.text);
    const usedTools = collectUsedTools(result.messages || []);

    if (answer.length > bestResult.answer.length) {
      bestResult = {
        answer,
        usedTools,
        numTurns: result.num_turns,
        durationMs: result.duration_ms,
      };
    }

    if (answer.length > 20 && usedTools.length > 0) {
      const items = extractOpenAgentAutonomyReviewItems(answer);
      const backlog = upsertOpenAgentAutonomyBacklog(items);
      const policy = refreshWorldYiAutonomyPolicyFromBacklog(backlog);
      writeOpenAgentAutonomyReviewSnapshot({
        status: 'success',
        runId: reviewRunId,
        startedAt: new Date(startedAt).toISOString(),
        finishedAt: new Date().toISOString(),
        durationMs: Date.now() - startedAt,
        answer,
        usedTools,
        numTurns: result.num_turns,
        items,
      });

      return {
        enabled: true,
        success: true,
        answer,
        usedTools,
        numTurns: result.num_turns,
        durationMs: result.duration_ms,
        items,
        backlog: backlog.slice(0, 8),
        policy,
      };
    }
  }

  const bestItems = extractOpenAgentAutonomyReviewItems(bestResult.answer);
  if (bestResult.answer.length > 20) {
    const backlog = upsertOpenAgentAutonomyBacklog(bestItems);
    const policy = refreshWorldYiAutonomyPolicyFromBacklog(backlog);
    writeOpenAgentAutonomyReviewSnapshot({
      status: 'success',
      runId: reviewRunId,
      startedAt: new Date(startedAt).toISOString(),
      finishedAt: new Date().toISOString(),
      durationMs: Date.now() - startedAt,
      answer: bestResult.answer,
      usedTools: bestResult.usedTools,
      numTurns: bestResult.numTurns,
      items: bestItems,
    });
    return {
      enabled: true,
      success: true,
      answer: bestResult.answer,
      usedTools: bestResult.usedTools,
      numTurns: bestResult.numTurns,
      durationMs: bestResult.durationMs,
      items: bestItems,
      backlog: backlog.slice(0, 8),
      policy,
    };
  }

  writeOpenAgentAutonomyReviewSnapshot({
    status: 'error',
    runId: reviewRunId,
    startedAt: new Date(startedAt).toISOString(),
    finishedAt: new Date().toISOString(),
    durationMs: Date.now() - startedAt,
    answer: bestResult.answer,
    usedTools: bestResult.usedTools,
    numTurns: bestResult.numTurns,
    error: 'open_agent_review_empty_answer',
    items: bestItems,
  });

  return {
    enabled: true,
    success: false,
    answer: bestResult.answer,
    usedTools: bestResult.usedTools,
    numTurns: bestResult.numTurns,
    durationMs: bestResult.durationMs,
    items: bestItems,
    reason: 'open_agent_review_empty_answer',
  };
}
