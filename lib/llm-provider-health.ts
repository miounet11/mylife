import { analyticsOperations } from '@/lib/database';
import { generateId } from '@/lib/utils';

export type LlmScope = 'report' | 'agent' | 'chat';
export type LlmCircuitState = 'closed' | 'degraded' | 'half-open' | 'open';

export type ModelAttemptEvent = {
  model: string;
  scope: LlmScope;
  success: boolean;
  latencyMs: number;
  errorType?: string;
  errorMessage?: string;
  traceLabel?: string;
  createdAt: string;
};

export type ModelCircuitEvent = {
  model: string;
  state: LlmCircuitState;
  createdAt: string;
  reopenAt?: string;
  reason?: string;
};

export type ModelHealthSnapshot = {
  model: string;
  defaultOrder: number;
  state: LlmCircuitState;
  attempts: number;
  successes: number;
  failures: number;
  successRate: number;
  failureRate: number;
  avgLatencyMs: number;
  consecutiveFailures: number;
  reopenAt?: string;
  rankPenalty: number;
};

function formatRate(value: number) {
  return `${Math.round(value * 100)}%`;
}

function getIntEnv(name: string, fallback: number) {
  const value = Number(process.env[name] || '');
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function getFloatEnv(name: string, fallback: number) {
  const value = Number(process.env[name] || '');
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

const HEALTH_WINDOW_MINUTES = getIntEnv('LLM_HEALTH_WINDOW_MINUTES', 30);
const OPEN_FAILURE_RATE = getFloatEnv('LLM_CIRCUIT_OPEN_FAILURE_RATE', 0.7);
const DEGRADE_FAILURE_RATE = getFloatEnv('LLM_CIRCUIT_DEGRADE_FAILURE_RATE', 0.45);
const OPEN_MIN_ATTEMPTS = getIntEnv('LLM_CIRCUIT_OPEN_MIN_ATTEMPTS', 6);
const OPEN_CONSECUTIVE_FAILURES = getIntEnv('LLM_CIRCUIT_OPEN_CONSECUTIVE_FAILURES', 4);
const RECOVERY_SUCCESS_STREAK = getIntEnv('LLM_CIRCUIT_RECOVERY_SUCCESS_STREAK', 2);
const OPEN_COOLDOWN_MINUTES = getIntEnv('LLM_CIRCUIT_OPEN_COOLDOWN_MINUTES', 8);
const IMMEDIATE_OPEN_CONSECUTIVE_FAILURES = getIntEnv('LLM_CIRCUIT_IMMEDIATE_OPEN_CONSECUTIVE_FAILURES', 2);

function toIso(date: Date) {
  return date.toISOString();
}

function roundRate(value: number) {
  return Math.round(value * 1000) / 1000;
}

function isFreshCircuitTimestamp(value?: string, now: Date = new Date()) {
  if (!value) {
    return false;
  }

  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) {
    return false;
  }

  return now.getTime() - timestamp <= HEALTH_WINDOW_MINUTES * 60 * 1000;
}

function getAttemptEvents(models: string[], scope?: LlmScope) {
  if (!models.length) return [];

  const placeholders = models.map(() => '?').join(', ');
  const params: Array<string> = [`-${HEALTH_WINDOW_MINUTES} minutes`, ...models];
  let scopeClause = '';

  if (scope) {
    scopeClause = ` AND json_extract(meta, '$.scope') = ?`;
    params.push(scope);
  }

  return analyticsOperations.rawQuery(`
    SELECT created_at, meta
    FROM analytics_events
    WHERE event_name = 'llm_model_attempt'
      AND datetime(created_at) >= datetime('now', ?)
      AND json_extract(meta, '$.model') IN (${placeholders})
      ${scopeClause}
    ORDER BY created_at DESC
  `, params) as Array<{ created_at: string; meta?: string | null }>;
}

function getCircuitEvents(models: string[], scope?: LlmScope) {
  if (!models.length) return [];

  const placeholders = models.map(() => '?').join(', ');
  const params: Array<string> = [...models];
  let scopeClause = '';

  if (scope) {
    scopeClause = ` AND (json_extract(meta, '$.scope') = ? OR json_extract(meta, '$.scope') IS NULL)`;
    params.push(scope);
  }

  return analyticsOperations.rawQuery(`
    SELECT created_at, meta
    FROM analytics_events
    WHERE event_name = 'llm_model_circuit_changed'
      AND json_extract(meta, '$.model') IN (${placeholders})
      ${scopeClause}
    ORDER BY created_at DESC
  `, params) as Array<{ created_at: string; meta?: string | null }>;
}

function parseMeta<T>(value?: string | null) {
  if (!value) return {} as T;
  try {
    return JSON.parse(value) as T;
  } catch {
    return {} as T;
  }
}

export function isImmediateOpenFailure(errorType?: string, errorMessage?: string) {
  const normalizedType = `${errorType || ''}`.toLowerCase();
  const normalizedMessage = `${errorMessage || ''}`.toLowerCase();
  const combined = `${normalizedType} ${normalizedMessage}`;

  return (
    combined.includes('token_cooling')
    || combined.includes('upstream_forbidden')
    || combined.includes('blocked_user')
    || combined.includes('gateway_error')
    || normalizedType === 'aborterror'
    || combined.includes('request was aborted')
    || combined.includes('timed out')
    || combined.includes('timeout')
  );
}

function hasImmediateOpenFailureStreak(attempts: ModelAttemptEvent[]) {
  const recentFailures = attempts
    .filter((item) => !item.success)
    .slice(0, IMMEDIATE_OPEN_CONSECUTIVE_FAILURES);

  return recentFailures.length >= IMMEDIATE_OPEN_CONSECUTIVE_FAILURES
    && recentFailures.every((item) => isImmediateOpenFailure(item.errorType, item.errorMessage));
}

export function deriveModelHealthSnapshots(params: {
  models: string[];
  attempts: ModelAttemptEvent[];
  circuits: ModelCircuitEvent[];
  now?: Date;
}) {
  const now = params.now || new Date();

  return params.models.map((model, index) => {
    const attempts = params.attempts.filter((item) => item.model === model);
    const successes = attempts.filter((item) => item.success).length;
    const failures = attempts.length - successes;
    const failureRate = attempts.length ? failures / attempts.length : 0;
    const successRate = attempts.length ? successes / attempts.length : 1;
    const avgLatencyMs = attempts.length
      ? Math.round(attempts.reduce((sum, item) => sum + item.latencyMs, 0) / attempts.length)
      : 0;

    let consecutiveFailures = 0;
    for (const item of attempts) {
      if (!item.success) {
        consecutiveFailures += 1;
      } else {
        break;
      }
    }

    let recentSuccessStreak = 0;
    for (const item of attempts) {
      if (item.success) {
        recentSuccessStreak += 1;
      } else {
        break;
      }
    }

    const latestCircuit = params.circuits.find((item) => item.model === model);
    let state: LlmCircuitState = 'closed';
    let reopenAt = latestCircuit?.reopenAt;
    const latestCircuitFresh = isFreshCircuitTimestamp(latestCircuit?.createdAt, now);
    const reopenAtFresh = isFreshCircuitTimestamp(latestCircuit?.reopenAt, now);

    if (recentSuccessStreak >= RECOVERY_SUCCESS_STREAK) {
      state = 'closed';
      reopenAt = undefined;
    } else if (latestCircuit?.state === 'half-open' && latestCircuitFresh) {
      state = 'half-open';
    } else if (latestCircuit?.state === 'half-open') {
      state = 'closed';
      reopenAt = undefined;
    } else if (latestCircuit?.state === 'open' && latestCircuit.reopenAt) {
      if (new Date(latestCircuit.reopenAt).getTime() > now.getTime()) {
        state = 'open';
      } else if (reopenAtFresh || latestCircuitFresh) {
        state = 'half-open';
      } else {
        state = 'closed';
        reopenAt = undefined;
      }
    } else if (attempts.length >= OPEN_MIN_ATTEMPTS && failureRate >= DEGRADE_FAILURE_RATE) {
      state = 'degraded';
    }

    if (state === 'closed' && attempts.length >= OPEN_MIN_ATTEMPTS && failureRate >= OPEN_FAILURE_RATE && consecutiveFailures >= OPEN_CONSECUTIVE_FAILURES) {
      state = 'degraded';
    }

    const rankPenalty = state === 'open'
      ? 1000
      : state === 'half-open'
      ? 350
      : state === 'degraded'
      ? Math.round(failureRate * 100) + consecutiveFailures * 10
      : 0;

    return {
      model,
      defaultOrder: index,
      state,
      attempts: attempts.length,
      successes,
      failures,
      successRate: roundRate(successRate),
      failureRate: roundRate(failureRate),
      avgLatencyMs,
      consecutiveFailures,
      reopenAt,
      rankPenalty,
    } satisfies ModelHealthSnapshot;
  });
}

export function buildModelExecutionPlan(params: {
  models: string[];
  snapshots: ModelHealthSnapshot[];
  now?: Date;
}) {
  const now = params.now || new Date();
  const healthy = params.snapshots
    .filter((item) => item.state === 'closed')
    .sort((left, right) => left.rankPenalty - right.rankPenalty || left.defaultOrder - right.defaultOrder);
  const degraded = params.snapshots
    .filter((item) => item.state === 'degraded')
    .sort((left, right) => left.rankPenalty - right.rankPenalty || left.defaultOrder - right.defaultOrder);
  const probes = params.snapshots
    .filter((item) => item.state === 'half-open')
    .sort((left, right) => left.defaultOrder - right.defaultOrder);

  let ordered = [...healthy, ...degraded, ...probes];

  if (!ordered.length) {
    const fullyOpen = params.snapshots.every((item) => item.state === 'open');
    if (!fullyOpen) {
      ordered = [...params.snapshots]
        .sort((left, right) => {
          const leftTime = left.reopenAt ? new Date(left.reopenAt).getTime() : now.getTime();
          const rightTime = right.reopenAt ? new Date(right.reopenAt).getTime() : now.getTime();
          return left.defaultOrder - right.defaultOrder || leftTime - rightTime;
        });
    }
  }

  return {
    orderedModels: ordered.map((item) => item.model),
    snapshots: params.snapshots,
  };
}

function buildExecutionPlan(models: string[], scope?: LlmScope) {
  const attemptRows = getAttemptEvents(models, scope);
  const circuitRows = getCircuitEvents(models, scope);
  const attempts = attemptRows.map((row) => {
    const meta = parseMeta<Record<string, unknown>>(row.meta);
    return {
      model: typeof meta.model === 'string' ? meta.model : '',
      scope: typeof meta.scope === 'string' ? meta.scope as LlmScope : (scope || 'report'),
      success: meta.success === true,
      latencyMs: typeof meta.latencyMs === 'number' ? meta.latencyMs : 0,
      errorType: typeof meta.errorType === 'string' ? meta.errorType : undefined,
      errorMessage: typeof meta.errorMessage === 'string' ? meta.errorMessage : undefined,
      traceLabel: typeof meta.traceLabel === 'string' ? meta.traceLabel : undefined,
      createdAt: row.created_at,
    } satisfies ModelAttemptEvent;
  }).filter((item) => item.model);
  const circuits = circuitRows.map((row) => {
    const meta = parseMeta<Record<string, unknown>>(row.meta);
    return {
      model: typeof meta.model === 'string' ? meta.model : '',
      state: typeof meta.state === 'string' ? meta.state as LlmCircuitState : 'closed',
      createdAt: row.created_at,
      reopenAt: typeof meta.reopenAt === 'string' ? meta.reopenAt : undefined,
      reason: typeof meta.reason === 'string' ? meta.reason : undefined,
    } satisfies ModelCircuitEvent;
  }).filter((item) => item.model);

  const snapshots = deriveModelHealthSnapshots({
    models,
    attempts,
    circuits,
  });

  return buildModelExecutionPlan({
    models,
    snapshots,
  });
}

export function getDynamicModelExecutionPlan(models: string[], scope: LlmScope) {
  return buildExecutionPlan(models, scope);
}

export function summarizeModelExecutionPlan(plan: {
  orderedModels: string[];
  snapshots: ModelHealthSnapshot[];
}) {
  const snapshotMap = new Map(plan.snapshots.map((item) => [item.model, item]));
  const ordered = plan.orderedModels.map((model) => {
    const snapshot = snapshotMap.get(model);
    if (!snapshot) return model;
    return `${model}[${snapshot.state}|succ=${formatRate(snapshot.successRate)}|fail=${formatRate(snapshot.failureRate)}|n=${snapshot.attempts}|lat=${snapshot.avgLatencyMs}ms]`;
  });
  const skipped = plan.snapshots
    .filter((item) => !plan.orderedModels.includes(item.model))
    .map((item) => `${item.model}[${item.state}${item.reopenAt ? `|reopen=${item.reopenAt}` : ''}]`);

  return {
    ordered,
    skipped,
    label: `ordered=${ordered.join(' -> ') || 'none'}${skipped.length ? ` | skipped=${skipped.join(', ')}` : ''}`,
  };
}

export function computeAttemptTimeouts(totalBudgetMs: number, attemptCount: number) {
  if (attemptCount <= 0) return [];

  const weights = attemptCount === 1
    ? [1]
    : attemptCount === 2
    ? [0.78, 0.22]
    : [0.7, 0.2, 0.1];
  const fallbackWeight = 1 / attemptCount;
  const minBudget = Math.max(1200, Math.floor(totalBudgetMs * 0.1));
  const budgets: number[] = [];
  let consumed = 0;

  for (let index = 0; index < attemptCount; index += 1) {
    const remainingSlots = attemptCount - index;
    const remainingBudget = totalBudgetMs - consumed;
    if (index === attemptCount - 1) {
      budgets.push(Math.max(minBudget, remainingBudget));
      break;
    }

    const rawBudget = Math.floor(totalBudgetMs * (weights[index] || fallbackWeight));
    const reservedForTail = minBudget * (remainingSlots - 1);
    const budget = Math.max(minBudget, Math.min(rawBudget, remainingBudget - reservedForTail));
    budgets.push(budget);
    consumed += budget;
  }

  return budgets;
}

export function assessScopeProviderHealth(models: string[], scope: LlmScope) {
  const plan = buildExecutionPlan(models, scope);
  const globalPlan = buildExecutionPlan(models);
  return {
    shouldDefer: shouldDeferForScopeSnapshots(plan.snapshots || [], globalPlan.snapshots || []),
    snapshots: plan.snapshots || [],
  };
}

export function shouldDeferForProviderSnapshots(snapshots: ModelHealthSnapshot[]) {
  const closedCount = snapshots.filter((item) => item.state === 'closed').length;
  const viableCount = snapshots.filter((item) => item.state !== 'open').length;
  const successCapableCount = snapshots.filter((item) => item.successRate >= 0.15).length;
  const severeFailureCount = snapshots.filter((item) => item.attempts >= 6 && item.failureRate >= 0.85).length;
  const earlyFailureCount = snapshots.filter((item) => (
    item.attempts >= 4
    && item.failureRate >= 0.75
    && item.consecutiveFailures >= 3
  )).length;
  const unhealthyCount = snapshots.filter((item) => (
    item.state === 'open'
    || item.state === 'half-open'
    || (
      item.attempts >= 4
      && item.failureRate >= 0.75
      && item.successRate <= 0.1
    )
  )).length;
  const fullyOpen = snapshots.length > 0 && snapshots.every((item) => item.state === 'open');
  const probeExhausted = snapshots.length > 0
    && closedCount === 0
    && successCapableCount === 0
    && snapshots.every((item) => (
      item.attempts >= 2
      && item.failureRate >= 0.95
      && item.consecutiveFailures >= 2
      && item.state !== 'closed'
    ));

  return fullyOpen || probeExhausted || (
    snapshots.length > 0
    && closedCount <= 1
    && successCapableCount === 0
    && (
      (viableCount <= 1 && severeFailureCount >= Math.max(1, snapshots.length - 1))
      || (
        unhealthyCount >= Math.max(1, snapshots.length - 1)
        && earlyFailureCount >= Math.max(1, Math.ceil(snapshots.length / 2))
      )
    )
  );
}

export function shouldDeferForScopeSnapshots(
  localSnapshots: ModelHealthSnapshot[],
  globalSnapshots: ModelHealthSnapshot[] = []
) {
  if (shouldDeferForProviderSnapshots(localSnapshots)) {
    return true;
  }

  const localAttemptCount = localSnapshots.reduce((sum, item) => sum + item.attempts, 0);
  const localSampleThin = localAttemptCount < Math.max(6, localSnapshots.length * 3);
  if (!localSampleThin) {
    return false;
  }

  return shouldDeferForProviderSnapshots(globalSnapshots);
}

export function shouldConservativelyDeferForSnapshots(snapshots: ModelHealthSnapshot[]) {
  if (!snapshots.length) {
    return false;
  }

  const closedSnapshots = snapshots.filter((item) => item.state === 'closed');
  if (closedSnapshots.length === 0) {
    return true;
  }

  const healthyClosedCount = closedSnapshots.filter((item) => (
    item.attempts < 2
    || item.successRate >= 0.15
    || item.failures === 0
  )).length;

  return healthyClosedCount === 0;
}

export function hasRunnableModelsForSnapshots(snapshots: ModelHealthSnapshot[]) {
  if (!snapshots.length) {
    return true;
  }

  return snapshots.some((item) => item.state !== 'open');
}

export function recordModelAttempt(input: {
  model: string;
  scope: LlmScope;
  success: boolean;
  latencyMs: number;
  errorType?: string;
  errorMessage?: string;
  traceLabel?: string;
}) {
  analyticsOperations.create({
    id: `evt_${generateId()}`,
    eventName: 'llm_model_attempt',
    meta: {
      model: input.model,
      scope: input.scope,
      success: input.success,
      latencyMs: input.latencyMs,
      errorType: input.errorType,
      errorMessage: input.errorMessage,
      traceLabel: input.traceLabel,
    },
  });

  reconcileModelCircuitState(input.model, input.scope);
}

function reconcileModelCircuitState(model: string, scope: LlmScope) {
  const attempts = getAttemptEvents([model], scope).map((row) => {
    const meta = parseMeta<Record<string, unknown>>(row.meta);
    return {
      model,
      scope,
      success: meta.success === true,
      latencyMs: typeof meta.latencyMs === 'number' ? meta.latencyMs : 0,
      errorType: typeof meta.errorType === 'string' ? meta.errorType : undefined,
      errorMessage: typeof meta.errorMessage === 'string' ? meta.errorMessage : undefined,
      traceLabel: typeof meta.traceLabel === 'string' ? meta.traceLabel : undefined,
      createdAt: row.created_at,
    } satisfies ModelAttemptEvent;
  });
  const circuits = getCircuitEvents([model], scope).map((row) => {
    const meta = parseMeta<Record<string, unknown>>(row.meta);
    return {
      model,
      state: typeof meta.state === 'string' ? meta.state as LlmCircuitState : 'closed',
      createdAt: row.created_at,
      reopenAt: typeof meta.reopenAt === 'string' ? meta.reopenAt : undefined,
      reason: typeof meta.reason === 'string' ? meta.reason : undefined,
    } satisfies ModelCircuitEvent;
  });
  const snapshot = deriveModelHealthSnapshots({
    models: [model],
    attempts,
    circuits,
  })[0];
  const latestCircuit = circuits[0];
  const now = new Date();
  const recentSuccessStreak = attempts
    .slice(0, RECOVERY_SUCCESS_STREAK)
    .every((item) => item.success);

  if (
    hasImmediateOpenFailureStreak(attempts)
    && latestCircuit?.state !== 'open'
  ) {
    const reopenAt = new Date(now.getTime() + OPEN_COOLDOWN_MINUTES * 60 * 1000);
    analyticsOperations.create({
      id: `evt_${generateId()}`,
      eventName: 'llm_model_circuit_changed',
      meta: {
        model,
        scope,
        state: 'open',
        previousState: latestCircuit?.state || 'closed',
        reason: 'immediate_hard_failure_streak',
        reopenAt: toIso(reopenAt),
        attempts: snapshot.attempts,
        consecutiveFailures: snapshot.consecutiveFailures,
      },
    });
    return;
  }

  if (
    snapshot.attempts >= OPEN_MIN_ATTEMPTS &&
    snapshot.failureRate >= OPEN_FAILURE_RATE &&
    snapshot.consecutiveFailures >= OPEN_CONSECUTIVE_FAILURES &&
    latestCircuit?.state !== 'open'
  ) {
    const reopenAt = new Date(now.getTime() + OPEN_COOLDOWN_MINUTES * 60 * 1000);
    analyticsOperations.create({
      id: `evt_${generateId()}`,
      eventName: 'llm_model_circuit_changed',
      meta: {
        model,
        scope,
        state: 'open',
        previousState: latestCircuit?.state || 'closed',
        reason: `failure_rate_${snapshot.failureRate}`,
        reopenAt: toIso(reopenAt),
        attempts: snapshot.attempts,
        consecutiveFailures: snapshot.consecutiveFailures,
      },
    });
    return;
  }

  if (
    latestCircuit?.state === 'open' &&
    latestCircuit.reopenAt &&
    new Date(latestCircuit.reopenAt).getTime() <= now.getTime()
  ) {
    analyticsOperations.create({
      id: `evt_${generateId()}`,
      eventName: 'llm_model_circuit_changed',
      meta: {
        model,
        scope,
        state: 'half-open',
        previousState: 'open',
        reason: 'cooldown_elapsed',
      },
    });
    return;
  }

  if (
    (latestCircuit?.state === 'open' || latestCircuit?.state === 'half-open') &&
    recentSuccessStreak
  ) {
    analyticsOperations.create({
      id: `evt_${generateId()}`,
      eventName: 'llm_model_circuit_changed',
      meta: {
        model,
        scope,
        state: 'closed',
        previousState: latestCircuit.state,
        reason: 'recovered',
        attempts: snapshot.attempts,
        failureRate: snapshot.failureRate,
      },
    });
  }
}
