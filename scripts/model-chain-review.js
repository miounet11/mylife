const Database = require('better-sqlite3');

function resolveWindowArgs() {
  const rawSince = process.argv[2] || '2026-05-14T06:02:33.000Z';
  const rawUntil = process.argv[3] || new Date().toISOString();
  const windowMinutes = Number(rawSince);

  if (Number.isFinite(windowMinutes) && windowMinutes > 0) {
    const until = new Date(rawUntil);
    const untilMs = Number.isFinite(until.getTime()) ? until.getTime() : Date.now();
    return {
      since: new Date(untilMs - Math.round(windowMinutes) * 60_000).toISOString(),
      until: new Date(untilMs).toISOString(),
      windowMinutes: Math.round(windowMinutes),
    };
  }

  return {
    since: rawSince,
    until: rawUntil,
    windowMinutes: null,
  };
}

const windowArgs = resolveWindowArgs();
const sinceArg = windowArgs.since;
const untilArg = windowArgs.until;
const db = new Database('data/lifekline.db', { readonly: true });

function parseMeta(value) {
  if (!value) return {};
  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
}

function rate(successes, total) {
  return total > 0 ? Math.round((successes / total) * 100) : 0;
}

function addRouteHealth(map, key, eventName, meta) {
  const item = map.get(key) || {
    key,
    success: 0,
    failed: 0,
    fallbacks: 0,
    totalDurationMs: 0,
    maxDurationMs: 0,
  };
  const durationMs = typeof meta.durationMs === 'number' ? meta.durationMs : 0;

  if (eventName.endsWith('_completed')) {
    item.success += 1;
    if (meta.fallbackToEngine === true || meta.llmUsed === false) {
      item.fallbacks += 1;
    }
  } else {
    item.failed += 1;
  }

  item.totalDurationMs += durationMs;
  item.maxDurationMs = Math.max(item.maxDurationMs, durationMs);
  map.set(key, item);
}

const rows = db.prepare(`
  SELECT event_name, page, meta, created_at
  FROM analytics_events
  WHERE datetime(created_at) >= datetime(?)
    AND datetime(created_at) <= datetime(?)
  ORDER BY created_at ASC
`).all(sinceArg, untilArg);

const attemptsByModel = new Map();
const attemptsByScopeModel = new Map();
const circuitChanges = [];
const routeHealth = new Map();
const failureHotspots = new Map();
const eventCounts = new Map();

for (const row of rows) {
  eventCounts.set(row.event_name, (eventCounts.get(row.event_name) || 0) + 1);
  const meta = parseMeta(row.meta);

  if (row.event_name === 'llm_model_attempt') {
    const model = typeof meta.model === 'string' ? meta.model : 'unknown';
    const scope = typeof meta.scope === 'string' ? meta.scope : 'unknown';
    const success = meta.success === true;
    const latencyMs = typeof meta.latencyMs === 'number' ? meta.latencyMs : 0;
    const errorText = `${meta.errorType || ''} ${meta.errorMessage || ''}`.toLowerCase();

    for (const [key, store] of [
      [model, attemptsByModel],
      [`${scope}|${model}`, attemptsByScopeModel],
    ]) {
      const item = store.get(key) || {
        key,
        scope: store === attemptsByScopeModel ? scope : undefined,
        model,
        attempts: 0,
        successes: 0,
        failures: 0,
        aborts: 0,
        totalLatencyMs: 0,
        firstAt: row.created_at,
        lastAt: row.created_at,
      };
      item.attempts += 1;
      item.totalLatencyMs += latencyMs;
      item.lastAt = row.created_at;
      if (success) item.successes += 1;
      else item.failures += 1;
      if (errorText.includes('abort') || errorText.includes('timeout')) item.aborts += 1;
      store.set(key, item);
    }
  }

  if (row.event_name === 'llm_model_circuit_changed') {
    circuitChanges.push({
      createdAt: row.created_at,
      scope: meta.scope || 'unknown',
      model: meta.model || 'unknown',
      state: meta.state || 'unknown',
      reason: meta.reason || 'unknown',
      previousState: meta.previousState,
      reopenAt: meta.reopenAt,
    });
  }

  if (row.event_name === 'analyze_completed' || row.event_name === 'analyze_failed') {
    addRouteHealth(routeHealth, 'analyze', row.event_name, meta);
    if (row.event_name === 'analyze_failed') {
      const key = `analyze:${meta.stage || 'unknown'}:${meta.error || 'unknown'}`;
      failureHotspots.set(key, (failureHotspots.get(key) || 0) + 1);
    }
  }

  if (row.event_name === 'chat_completed' || row.event_name === 'chat_failed') {
    const action = typeof meta.action === 'string' ? meta.action : 'ask';
    addRouteHealth(routeHealth, `chat:${action}`, row.event_name, meta);
    if (row.event_name === 'chat_failed') {
      const key = `chat:${action}:${meta.error || 'unknown'}`;
      failureHotspots.set(key, (failureHotspots.get(key) || 0) + 1);
    }
  }
}

const upgradeRows = db.prepare(`
  SELECT status, last_error, COUNT(*) AS count
  FROM report_upgrade_jobs
  WHERE datetime(updated_at) >= datetime(?)
    AND datetime(updated_at) <= datetime(?)
  GROUP BY status, last_error
  ORDER BY count DESC
  LIMIT 20
`).all(sinceArg, untilArg);

function formatAttempt(item) {
  return {
    scope: item.scope,
    model: item.model,
    attempts: item.attempts,
    successes: item.successes,
    failures: item.failures,
    successRate: rate(item.successes, item.attempts),
    aborts: item.aborts,
    avgLatencyMs: item.attempts > 0 ? Math.round(item.totalLatencyMs / item.attempts) : 0,
    firstAt: item.firstAt,
    lastAt: item.lastAt,
  };
}

const output = {
  since: sinceArg,
  until: untilArg,
  windowMinutes: windowArgs.windowMinutes,
  totalEvents: rows.length,
  topEvents: [...eventCounts.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, 20)
    .map(([eventName, count]) => ({ eventName, count })),
  llmByModel: [...attemptsByModel.values()]
    .map(formatAttempt)
    .sort((left, right) => right.failures - left.failures),
  llmByScopeModel: [...attemptsByScopeModel.values()]
    .map(formatAttempt)
    .sort((left, right) => right.failures - left.failures),
  circuitChanges,
  routeHealth: [...routeHealth.values()]
    .map((item) => ({
      ...item,
      avgDurationMs: item.success + item.failed > 0
        ? Math.round(item.totalDurationMs / (item.success + item.failed))
        : 0,
    }))
    .sort((left, right) => left.key.localeCompare(right.key)),
  failureHotspots: [...failureHotspots.entries()]
    .sort((left, right) => right[1] - left[1])
    .map(([key, count]) => ({ key, count })),
  upgradeRows,
  verdict: {
    chatHealthy: [...routeHealth.values()].some((item) => item.key.startsWith('chat:') && item.success > 0 && item.failed === 0),
    reportModelSupplyStillWeak: [...attemptsByScopeModel.values()].some((item) => item.scope === 'report' && item.failures > item.successes),
    hasRecentCircuitOpen: circuitChanges.some((item) => item.state === 'open'),
  },
};

console.log(JSON.stringify(output, null, 2));
