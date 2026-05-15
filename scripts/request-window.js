const Database = require('better-sqlite3');

const minutes = Math.max(1, Number.parseInt(process.argv[2] || '60', 10) || 60);
const db = new Database('data/lifekline.db', { readonly: true });

function parseMeta(value) {
  if (!value) return {};
  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
}

const SYSTEM_EVENT_NAMES = new Set([
  'llm_model_attempt',
  'llm_model_circuit_changed',
]);

function getEventScope(eventName) {
  return SYSTEM_EVENT_NAMES.has(eventName) ? 'system' : 'product';
}

function topEntries(map, limit) {
  return [...map.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, limit)
    .map(([eventName, count]) => ({ eventName, count }));
}

const analyticsRows = db.prepare(`
  SELECT event_name, page, meta, created_at
  FROM analytics_events
  WHERE datetime(created_at) >= datetime('now', ?)
  ORDER BY created_at DESC
`).all(`-${minutes} minutes`);

const byEvent = new Map();
const productEvents = new Map();
const systemEvents = new Map();
const pageViews = new Map();
const routeHealth = new Map();
const failureHotspots = new Map();
const llmByModel = new Map();
let productEventCount = 0;
let systemEventCount = 0;

for (const row of analyticsRows) {
  byEvent.set(row.event_name, (byEvent.get(row.event_name) || 0) + 1);
  const scope = getEventScope(row.event_name);
  if (scope === 'system') {
    systemEventCount += 1;
    systemEvents.set(row.event_name, (systemEvents.get(row.event_name) || 0) + 1);
  } else {
    productEventCount += 1;
    productEvents.set(row.event_name, (productEvents.get(row.event_name) || 0) + 1);
  }
  const meta = parseMeta(row.meta);

  if (row.event_name.endsWith('_page_viewed') || row.event_name === 'report_viewed') {
    const key = row.page || row.event_name;
    pageViews.set(key, (pageViews.get(key) || 0) + 1);
  }

  if (row.event_name === 'analyze_completed' || row.event_name === 'analyze_failed') {
    const key = 'analyze';
    const item = routeHealth.get(key) || {
      key,
      success: 0,
      failed: 0,
      fallbacks: 0,
      totalDurationMs: 0,
      maxDurationMs: 0,
    };
    const durationMs = typeof meta.durationMs === 'number' ? meta.durationMs : 0;
    if (row.event_name === 'analyze_completed') {
      item.success += 1;
      if (meta.fallbackToEngine === true) {
        item.fallbacks += 1;
      }
    } else {
      item.failed += 1;
      const hotspotKey = `analyze:${meta.stage || 'unknown'}:${meta.error || 'unknown'}`;
      failureHotspots.set(hotspotKey, (failureHotspots.get(hotspotKey) || 0) + 1);
    }
    item.totalDurationMs += durationMs;
    item.maxDurationMs = Math.max(item.maxDurationMs, durationMs);
    routeHealth.set(key, item);
  }

  if (row.event_name === 'chat_completed' || row.event_name === 'chat_failed') {
    const action = typeof meta.action === 'string' ? meta.action : 'ask';
    const key = `chat:${action}`;
    const item = routeHealth.get(key) || {
      key,
      success: 0,
      failed: 0,
      fallbacks: 0,
      totalDurationMs: 0,
      maxDurationMs: 0,
    };
    const durationMs = typeof meta.durationMs === 'number' ? meta.durationMs : 0;
    if (row.event_name === 'chat_completed') {
      item.success += 1;
      if (meta.llmUsed === false) {
        item.fallbacks += 1;
      }
    } else {
      item.failed += 1;
      const hotspotKey = `${key}:${meta.error || 'unknown'}`;
      failureHotspots.set(hotspotKey, (failureHotspots.get(hotspotKey) || 0) + 1);
    }
    item.totalDurationMs += durationMs;
    item.maxDurationMs = Math.max(item.maxDurationMs, durationMs);
    routeHealth.set(key, item);
  }

  if (row.event_name === 'llm_model_attempt') {
    const model = typeof meta.model === 'string' ? meta.model : 'unknown';
    const scope = typeof meta.scope === 'string' ? meta.scope : 'unknown';
    const item = llmByModel.get(model) || {
      model,
      attempts: 0,
      successes: 0,
      failures: 0,
      totalLatencyMs: 0,
      scopes: new Map(),
    };
    item.attempts += 1;
    item.totalLatencyMs += typeof meta.latencyMs === 'number' ? meta.latencyMs : 0;
    if (meta.success === true) {
      item.successes += 1;
    } else {
      item.failures += 1;
    }
    item.scopes.set(scope, (item.scopes.get(scope) || 0) + 1);
    llmByModel.set(model, item);
  }
}

const recentUpgradeRows = db.prepare(`
  SELECT id, report_id, status, attempts, max_attempts, next_run_at, last_error, updated_at
  FROM report_upgrade_jobs
  WHERE datetime(updated_at) >= datetime('now', ?)
  ORDER BY updated_at DESC
  LIMIT 12
`).all(`-${minutes} minutes`);

const output = {
  windowMinutes: minutes,
  totalAnalyticsEvents: analyticsRows.length,
  productAnalyticsEvents: productEventCount,
  systemAnalyticsEvents: systemEventCount,
  systemEventShare: analyticsRows.length > 0 ? Math.round((systemEventCount / analyticsRows.length) * 100) : 0,
  topProductEvents: topEntries(productEvents, 15),
  topSystemEvents: topEntries(systemEvents, 10),
  topEvents: topEntries(byEvent, 15),
  topPages: [...pageViews.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, 12)
    .map(([page, count]) => ({ page, count })),
  routeHealth: [...routeHealth.values()]
    .map((item) => ({
      ...item,
      avgDurationMs: item.success + item.failed > 0
        ? Math.round(item.totalDurationMs / (item.success + item.failed))
        : 0,
    }))
    .sort((left, right) => (right.failed - right.success) - (left.failed - left.success)),
  failureHotspots: [...failureHotspots.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, 12)
    .map(([key, count]) => ({ key, count })),
  llmByModel: [...llmByModel.values()]
    .map((item) => ({
      model: item.model,
      attempts: item.attempts,
      successes: item.successes,
      failures: item.failures,
      successRate: item.attempts > 0 ? Math.round((item.successes / item.attempts) * 100) : 0,
      avgLatencyMs: item.attempts > 0 ? Math.round(item.totalLatencyMs / item.attempts) : 0,
      scopes: [...item.scopes.entries()]
        .sort((left, right) => right[1] - left[1])
        .map(([scope, count]) => ({ scope, count })),
    }))
    .sort((left, right) => right.failures - left.failures),
  recentUpgradeRows,
};

console.log(JSON.stringify(output, null, 2));
