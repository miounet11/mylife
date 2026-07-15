#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const Database = require('better-sqlite3');
const { loadEnvConfig } = require('@next/env');
const { runPredictionsAuthE2e } = require('./smoke-predictions-auth-e2e');
const { runDimensionsE2e } = require('./smoke-dimensions-e2e');
const { runPredictionDueEmailCronSmoke } = require('./smoke-prediction-due-email-cron');

loadEnvConfig(process.cwd());

function loadPm2FallbackEnv() {
  try {
    const ecosystem = require('../ecosystem.config.js');
    const apps = Array.isArray(ecosystem?.apps) ? ecosystem.apps : [];
    const primaryApp = apps.find((app) => app?.name === 'life-kline-next') || apps[0];
    return primaryApp?.env && typeof primaryApp.env === 'object' ? primaryApp.env : {};
  } catch {
    return {};
  }
}

const pm2Env = loadPm2FallbackEnv();

function readEnv(name, fallback = '') {
  return process.env[name] || pm2Env[name] || fallback;
}

function readPositiveInteger(name, fallback, options = {}) {
  const min = Number.isInteger(options.min) ? options.min : 1;
  const max = Number.isInteger(options.max) ? options.max : Number.MAX_SAFE_INTEGER;
  const raw = `${readEnv(name, fallback)}`.trim();
  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
    return fallback;
  }
  return parsed;
}

function readCsv(name, fallback) {
  const raw = `${readEnv(name, '')}`.trim();
  if (!raw) return fallback;
  return raw.split(',').map((item) => item.trim()).filter(Boolean);
}

function parseArgs(argv) {
  const result = {};
  for (const arg of argv) {
    if (!arg.startsWith('--')) continue;
    const body = arg.slice(2);
    const eqIndex = body.indexOf('=');
    if (eqIndex >= 0) {
      result[body.slice(0, eqIndex)] = body.slice(eqIndex + 1);
    } else {
      result[body] = true;
    }
  }
  return result;
}

const args = parseArgs(process.argv.slice(2));
const requestTimeoutMs = readPositiveInteger('OPS_SMOKE_TIMEOUT_MS', 15000, { min: 2000, max: 120000 });
const publicOrigin = readEnv('OPS_PUBLIC_ORIGIN', 'https://www.life-kline.com');
const internalOrigin = readEnv('OPS_INTERNAL_ORIGIN', 'http://127.0.0.1:8080');
const internalHealthUrl = readEnv('SYSTEM_HEALTH_RUN_URL', `${internalOrigin}/api/admin/system/health`);
const systemHealthToken = readEnv('SYSTEM_HEALTH_TOKEN')
  || readEnv('KNOWLEDGE_ACQUISITION_CRON_TOKEN')
  || readEnv('CONTENT_RADAR_CRON_TOKEN')
  || readEnv('CONTENT_SCHEDULER_CRON_TOKEN')
  || '';
const requiredPm2Processes = readCsv('OPS_REQUIRED_PM2', ['life-kline-next']);
const optionalPm2Processes = readCsv('OPS_OPTIONAL_PM2', ['life-kline-user-tier-watchdog', 'forum-daemon']);
const resultSnippets = readCsv('OPS_RESULT_SNIPPET', ['先看核心结论', '个人结构总览']);
const cronMatchPattern = readEnv('OPS_CRON_MATCH_PATTERN', 'life-kline|lifekline|forum|content|scheduler|radar|knowledge');
const cronPattern = new RegExp(cronMatchPattern, 'i');
const requireCron = readEnv('OPS_REQUIRE_CRON', '0') === '1';
const forumActivityMaxAgeHours = readPositiveInteger('OPS_FORUM_ACTIVITY_MAX_AGE_HOURS', 24, { min: 1, max: 720 });
const contentActivityMaxAgeHours = readPositiveInteger('OPS_CONTENT_ACTIVITY_MAX_AGE_HOURS', 72, { min: 1, max: 720 });
const forumTitlePoolMinFresh = readPositiveInteger('OPS_FORUM_TITLE_POOL_MIN_FRESH', 1, { min: 0, max: 5000 });
const forumTitlePoolWarnFresh = readPositiveInteger('OPS_FORUM_TITLE_POOL_WARN_FRESH', 10, { min: 1, max: 5000 });
const strictMode = Boolean(args.strict);

async function fetchText(url, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), requestTimeoutMs);
  try {
    const response = await fetch(url, {
      ...options,
      redirect: 'follow',
      signal: controller.signal,
    });
    const text = await response.text();
    return { ok: true, status: response.status, text };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      text: '',
      error: error instanceof Error ? error.message : String(error),
    };
  } finally {
    clearTimeout(timer);
  }
}

async function fetchJson(url, options = {}) {
  const result = await fetchText(url, options);
  if (!result.ok) {
    return result;
  }
  try {
    return {
      ...result,
      json: JSON.parse(result.text || '{}'),
    };
  } catch (error) {
    return {
      ok: false,
      status: result.status,
      text: result.text,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

function sliceJsonArray(output) {
  const start = output.indexOf('[');
  const end = output.lastIndexOf(']');
  if (start < 0 || end < start) {
    throw new Error('pm2 jlist missing JSON payload');
  }
  return output.slice(start, end + 1);
}

function readPm2Processes() {
  const raw = execFileSync('pm2', ['jlist'], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    timeout: 15000,
  });
  return JSON.parse(sliceJsonArray(raw));
}

function checkPm2() {
  try {
    const processes = readPm2Processes();
    const byName = new Map(processes.map((item) => [item.name, item]));
    const missing = [];
    const unhealthy = [];
    const summary = [];
    const optional = [];

    for (const name of requiredPm2Processes) {
      const processInfo = byName.get(name);
      if (!processInfo) {
        missing.push(name);
        continue;
      }
      const status = processInfo.pm2_env?.status || 'unknown';
      const pid = processInfo.pid || 0;
      const memoryMb = Math.round(((processInfo.monit?.memory || 0) / 1024 / 1024) * 10) / 10;
      summary.push({ name, status, pid, memoryMb, restarts: processInfo.pm2_env?.restart_time || 0, required: true });
      if (status !== 'online') {
        unhealthy.push(`${name}:${status}`);
      }
    }

    for (const name of optionalPm2Processes) {
      const processInfo = byName.get(name);
      if (!processInfo) {
        optional.push({ name, present: false, status: 'missing' });
        continue;
      }
      const status = processInfo.pm2_env?.status || 'unknown';
      const pid = processInfo.pid || 0;
      const memoryMb = Math.round(((processInfo.monit?.memory || 0) / 1024 / 1024) * 10) / 10;
      optional.push({
        name,
        present: true,
        status,
        pid,
        memoryMb,
        restarts: processInfo.pm2_env?.restart_time || 0,
      });
    }

    return {
      ok: missing.length === 0 && unhealthy.length === 0,
      data: summary,
      optional,
      error: missing.length || unhealthy.length
        ? `missing=${missing.join(',') || 'none'} unhealthy=${unhealthy.join(',') || 'none'}`
        : '',
    };
  } catch (error) {
    return {
      ok: false,
      data: [],
      optional: [],
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

function openDatabase() {
  const dbPath = path.join(process.cwd(), 'data', 'lifekline.db');
  return {
    dbPath,
    db: new Database(dbPath, { readonly: true, fileMustExist: true }),
  };
}

function resolveSampleResultId(db) {
  const explicit = `${args['result-id'] || readEnv('OPS_RESULT_ID', '')}`.trim();
  if (explicit) return explicit;
  const publicRow = db.prepare("SELECT id FROM fortunes WHERE COALESCE(is_public, 0) = 1 ORDER BY COALESCE(updated_at, created_at) DESC LIMIT 1").get();
  if (publicRow?.id) return publicRow.id;
  const anyRow = db.prepare('SELECT id FROM fortunes ORDER BY COALESCE(updated_at, created_at) DESC LIMIT 1').get();
  return anyRow?.id || '';
}

function checkSqlite(db) {
  try {
    const quickCheck = db.prepare('PRAGMA quick_check(1)').pluck().get();
    const fortunes = db.prepare('SELECT COUNT(*) FROM fortunes').pluck().get();
    const publicReports = db.prepare('SELECT COUNT(*) FROM fortunes WHERE COALESCE(is_public, 0) = 1').pluck().get();
    const analyticsEvents = db.prepare('SELECT COUNT(*) FROM analytics_events').pluck().get();
    const journalMode = db.prepare('PRAGMA journal_mode').pluck().get();
    const busyTimeout = db.prepare('PRAGMA busy_timeout').pluck().get();
    return {
      ok: quickCheck === 'ok',
      data: {
        quickCheck,
        fortunes,
        publicReports,
        analyticsEvents,
        journalMode,
        busyTimeout,
      },
      error: quickCheck === 'ok' ? '' : `quick_check=${quickCheck}`,
    };
  } catch (error) {
    return {
      ok: false,
      data: {},
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

function readTail(filePath, maxBytes = 120000) {
  const stat = fs.statSync(filePath);
  const length = Math.min(stat.size, maxBytes);
  const buffer = Buffer.alloc(length);
  const fd = fs.openSync(filePath, 'r');
  try {
    fs.readSync(fd, buffer, 0, length, Math.max(0, stat.size - length));
  } finally {
    fs.closeSync(fd);
  }
  return {
    text: buffer.toString('utf8'),
    mtimeMs: stat.mtimeMs,
  };
}


function parseTimestamp(value) {
  if (!value) return null;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : null;
}

function ageHoursFrom(value) {
  const timestamp = parseTimestamp(value);
  if (timestamp === null) return null;
  return Math.max(0, (Date.now() - timestamp) / (60 * 60 * 1000));
}

function roundNumber(value, digits = 1) {
  if (!Number.isFinite(value)) return null;
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function safeQueryOne(db, sql) {
  try {
    return db.prepare(sql).get();
  } catch {
    return null;
  }
}

function parseCronEntries(raw, source) {
  return `${raw || ''}`
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !line.startsWith('#'))
    .filter((line) => !/^[A-Z_][A-Z0-9_]*=/.test(line))
    .filter((line) => line.split(/\s+/).length >= 6)
    .map((line) => ({ source, line }));
}

function collectCronEntries() {
  const entries = [];
  const sources = [];
  try {
    const userCrontab = execFileSync('crontab', ['-l'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
      timeout: 10000,
    });
    entries.push(...parseCronEntries(userCrontab, 'crontab -l'));
    sources.push('crontab -l');
  } catch {
    // ignore missing user crontab
  }

  const systemCrontab = '/etc/crontab';
  if (fs.existsSync(systemCrontab)) {
    entries.push(...parseCronEntries(fs.readFileSync(systemCrontab, 'utf8'), systemCrontab));
    sources.push(systemCrontab);
  }

  const cronDir = '/etc/cron.d';
  if (fs.existsSync(cronDir)) {
    for (const entry of fs.readdirSync(cronDir, { withFileTypes: true })) {
      if (!entry.isFile()) continue;
      const filePath = path.join(cronDir, entry.name);
      entries.push(...parseCronEntries(fs.readFileSync(filePath, 'utf8'), filePath));
      sources.push(filePath);
    }
  }

  return { entries, sources };
}

function checkCron() {
  try {
    const { entries, sources } = collectCronEntries();
    const matchedEntries = entries.filter((entry) => cronPattern.test(entry.line));
    if (matchedEntries.length === 0) {
      const message = `no app-specific cron entries matched ${cronMatchPattern}`;
      return {
        ok: !requireCron,
        data: {
          totalEntries: entries.length,
          sources,
          matchedEntries: [],
        },
        error: requireCron ? message : '',
        warnings: requireCron ? [] : [message],
      };
    }
    return {
      ok: true,
      data: {
        totalEntries: entries.length,
        sources,
        matchedEntries,
      },
      error: '',
      warnings: [],
    };
  } catch (error) {
    return {
      ok: false,
      data: { totalEntries: 0, sources: [], matchedEntries: [] },
      error: error instanceof Error ? error.message : String(error),
      warnings: [],
    };
  }
}

function checkBuildId() {
  try {
    const buildIdPath = path.join(process.cwd(), '.next', 'BUILD_ID');
    if (!fs.existsSync(buildIdPath)) {
      return {
        ok: false,
        data: { expectedBuildId: '', processes: [] },
        error: '.next/BUILD_ID missing',
        warnings: [],
      };
    }
    const expectedBuildId = fs.readFileSync(buildIdPath, 'utf8').trim();
    if (!expectedBuildId) {
      return {
        ok: false,
        data: { expectedBuildId: '', processes: [] },
        error: '.next/BUILD_ID empty',
        warnings: [],
      };
    }
    const processes = readPm2Processes();
    const checks = [];
    const mismatches = [];
    const warnings = [];
    for (const name of requiredPm2Processes) {
      const processInfo = processes.find((item) => item.name === name);
      if (!processInfo) {
        mismatches.push(`${name}:missing`);
        checks.push({ name, status: 'missing', runtimeBuildId: '', expectedBuildId });
        continue;
      }
      const env = processInfo.pm2_env?.env && typeof processInfo.pm2_env.env === 'object'
        ? processInfo.pm2_env.env
        : {};
      const runtimeBuildId = `${env.LIFE_KLINE_BUILD_ID || env.BUILD_ID || ''}`.trim();
      checks.push({
        name,
        status: processInfo.pm2_env?.status || 'unknown',
        runtimeBuildId,
        expectedBuildId,
      });
      if (!runtimeBuildId) {
        warnings.push(`${name} missing LIFE_KLINE_BUILD_ID env`);
      } else if (runtimeBuildId != expectedBuildId) {
        mismatches.push(`${name}:${runtimeBuildId}`);
      }
    }
    return {
      ok: mismatches.length === 0,
      data: {
        expectedBuildId,
        processes: checks,
      },
      error: mismatches.length ? `mismatch=${mismatches.join(',')}` : '',
      warnings,
    };
  } catch (error) {
    return {
      ok: false,
      data: { expectedBuildId: '', processes: [] },
      error: error instanceof Error ? error.message : String(error),
      warnings: [],
    };
  }
}

function checkDaemonHealth(db) {
  try {
    const latestQuestion = safeQueryOne(db, "SELECT id, status, COALESCE(published_at, created_at) AS ts FROM forum_questions ORDER BY datetime(COALESCE(published_at, created_at)) DESC LIMIT 1");
    const latestAnswer = safeQueryOne(db, "SELECT id, status, COALESCE(published_at, created_at) AS ts FROM forum_answers ORDER BY datetime(COALESCE(published_at, created_at)) DESC LIMIT 1");
    const latestTitlePool = safeQueryOne(db, "SELECT id, status, created_at FROM forum_title_pool ORDER BY datetime(created_at) DESC LIMIT 1");
    const titlePoolFresh = safeQueryOne(db, "SELECT COUNT(*) AS count FROM forum_title_pool WHERE status='fresh'");
    const latestRadar = safeQueryOne(db, "SELECT id, status, created_at FROM content_radar_runs ORDER BY datetime(created_at) DESC LIMIT 1");
    const latestScheduler = safeQueryOne(db, "SELECT id, status, trigger, created_at FROM content_scheduler_runs ORDER BY datetime(created_at) DESC LIMIT 1");
    const forumDaemon = readPm2Processes().find((item) => item.name === 'forum-daemon');

    const warnings = [];
    const failures = [];

    const activityCandidates = [latestQuestion?.ts, latestAnswer?.ts]
      .map((value) => ({ value, ageHours: ageHoursFrom(value) }))
      .filter((item) => item.value && item.ageHours !== null)
      .sort((a, b) => (a.ageHours ?? Number.MAX_SAFE_INTEGER) - (b.ageHours ?? Number.MAX_SAFE_INTEGER));

    const latestForumActivity = activityCandidates[0] || null;
    if (!latestForumActivity) {
      failures.push('no recent forum question/answer timestamp found');
    } else if ((latestForumActivity.ageHours ?? Infinity) > forumActivityMaxAgeHours) {
      failures.push(`forum activity older than ${forumActivityMaxAgeHours}h`);
    }

    const freshCount = Number(titlePoolFresh?.count ?? 0);
    if (freshCount < forumTitlePoolMinFresh) {
      failures.push(`forum title pool fresh count ${freshCount} < ${forumTitlePoolMinFresh}`);
    } else if (freshCount < forumTitlePoolWarnFresh) {
      warnings.push(`forum title pool fresh count ${freshCount} < ${forumTitlePoolWarnFresh}`);
    }

    for (const [name, row] of [['content-radar', latestRadar], ['content-scheduler', latestScheduler]]) {
      if (!row?.created_at) {
        warnings.push(`${name} has not produced any run record yet`);
        continue;
      }
      const ageHours = ageHoursFrom(row.created_at);
      if (ageHours !== null && ageHours > contentActivityMaxAgeHours) {
        warnings.push(`${name} latest run is ${roundNumber(ageHours)}h old`);
      }
    }

    return {
      ok: failures.length === 0,
      data: {
        forumDaemon: forumDaemon
          ? {
              status: forumDaemon.pm2_env?.status || 'unknown',
              pid: forumDaemon.pid || 0,
              restartTime: forumDaemon.pm2_env?.restart_time || 0,
            }
          : null,
        latestQuestion,
        latestAnswer,
        latestForumActivity: latestForumActivity
          ? {
              timestamp: latestForumActivity.value,
              ageHours: roundNumber(latestForumActivity.ageHours ?? 0),
            }
          : null,
        latestTitlePool,
        titlePoolFreshCount: freshCount,
        latestRadar,
        latestScheduler,
      },
      error: failures.join('; '),
      warnings,
    };
  } catch (error) {
    return {
      ok: false,
      data: {},
      error: error instanceof Error ? error.message : String(error),
      warnings: [],
    };
  }
}

function collectErrorFingerprints() {
  const files = [
    '/root/.pm2/logs/life-kline-next-error.log',
    '/root/.pm2/logs/life-kline-user-tier-watchdog-error.log',
  ];
  const patterns = [
    { key: 'sqlite_busy', regex: /SQLITE_BUSY/g },
    { key: 'oom', regex: /JavaScript heap out of memory|Allocation failed - JavaScript heap out of memory/g },
    { key: 'enoent', regex: /ENOENT/g },
    { key: 'eaddrinuse', regex: /EADDRINUSE/g },
    { key: 'timeout', regex: /ETIMEDOUT|timeout/gi },
    { key: 'bad_gateway', regex: /502|Bad Gateway/g },
  ];
  const findings = [];
  const warnings = [];
  const recentThresholdMs = 30 * 60 * 1000;

  for (const filePath of files) {
    if (!fs.existsSync(filePath)) continue;
    const { text, mtimeMs } = readTail(filePath);
    const activeKeys = [];
    for (const pattern of patterns) {
      const matches = text.match(pattern.regex);
      if (matches?.length) {
        findings.push({ file: filePath, key: pattern.key, count: matches.length });
        activeKeys.push(pattern.key);
      }
    }
    if (activeKeys.length > 0 && Date.now() - mtimeMs <= recentThresholdMs) {
      warnings.push(`${path.basename(filePath)} 最近 30 分钟内出现 ${activeKeys.join(', ')}`);
    }
  }

  return { findings, warnings };
}

function readSystemHealthDirect() {
  try {
    const raw = execFileSync(
      'node',
      [
        '--import',
        'tsx',
        '-e',
        "import { getSystemOpsSnapshot } from './lib/system-ops.ts'; console.log(JSON.stringify({ success: true, snapshot: getSystemOpsSnapshot({ mode: 'summary' }) }));",
      ],
      {
        cwd: process.cwd(),
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
        timeout: 30000,
      },
    );
    const parsed = JSON.parse(raw.trim());
    return {
      ok: Boolean(parsed.success),
      data: parsed.snapshot || null,
      error: parsed.success ? '' : 'direct snapshot failed',
      source: 'direct-fallback',
    };
  } catch (error) {
    return {
      ok: false,
      data: null,
      error: error instanceof Error ? error.message : String(error),
      source: 'direct-fallback',
    };
  }
}

async function checkSystemHealth() {
  if (!systemHealthToken) {
    return readSystemHealthDirect();
  }
  const result = await fetchJson(internalHealthUrl, {
    headers: {
      'x-system-health-token': systemHealthToken,
    },
  });
  if (!result.ok) {
    if (result.status === 403) {
      return readSystemHealthDirect();
    }
    return {
      ok: false,
      data: null,
      error: result.error || `status=${result.status}`,
      source: 'http',
    };
  }
  const json = result.json || {};
  if (result.status === 403 || json.error === '无权限访问') {
    return readSystemHealthDirect();
  }
  return {
    ok: Boolean(json.success),
    data: json.snapshot || null,
    error: json.success ? '' : (json.error || 'unknown system health failure'),
    source: 'http',
  };
}

async function checkPredictionsPostRequiresAuth(origin) {
  const url = new URL('/api/predictions', origin).toString();
  const result = await fetchJson(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'user-agent': 'life-kline-release-smoke/1.0',
    },
    body: JSON.stringify({ predictions: [] }),
  });
  if (!result.ok && result.status === 0) {
    return {
      ok: false,
      status: 0,
      url,
      error: result.error || 'request failed',
    };
  }
  if (result.status >= 500) {
    return {
      ok: false,
      status: result.status,
      url,
      error: `HTTP ${result.status}`,
    };
  }
  if (result.status !== 401) {
    return {
      ok: false,
      status: result.status,
      url,
      error: `expected HTTP 401 for unauthenticated POST, got ${result.status}`,
    };
  }
  return {
    ok: true,
    status: result.status,
    url,
    error: '',
  };
}

async function checkPredictionsApi(origin) {
  const url = new URL('/api/predictions', origin).toString();
  const result = await fetchJson(url, {
    headers: {
      'user-agent': 'life-kline-release-smoke/1.0',
    },
  });
  if (!result.ok) {
    return {
      ok: false,
      status: result.status,
      url,
      error: result.error || 'request failed',
    };
  }
  if (result.status >= 500) {
    return {
      ok: false,
      status: result.status,
      url,
      error: `HTTP ${result.status}`,
    };
  }
  const json = result.json || {};
  if (typeof json.success !== 'boolean') {
    return {
      ok: false,
      status: result.status,
      url,
      error: 'response missing success boolean',
    };
  }
  if (!json.success) {
    return {
      ok: false,
      status: result.status,
      url,
      error: json.error || 'success=false',
    };
  }
  return {
    ok: true,
    status: result.status,
    url,
    authenticated: Boolean(json.authenticated),
    predictionCount: Array.isArray(json.predictions) ? json.predictions.length : 0,
    error: '',
  };
}

async function checkPublicRoute(name, url, requiredSnippets = [], options = {}) {
  const snippetMode = options.snippetMode === 'any' ? 'any' : 'all';
  const result = await fetchText(url, {
    headers: {
      'user-agent': 'life-kline-release-smoke/1.0',
    },
  });
  if (!result.ok) {
    return { ok: false, status: 0, url, error: result.error || 'request failed' };
  }
  if (result.status >= 500) {
    return { ok: false, status: result.status, url, error: `HTTP ${result.status}` };
  }
  let missing = [];
  if (requiredSnippets.length > 0) {
    if (snippetMode === 'any') {
      const matched = requiredSnippets.some((snippet) => result.text.includes(snippet));
      if (!matched) {
        missing = requiredSnippets;
      }
    } else {
      missing = requiredSnippets.filter((snippet) => !result.text.includes(snippet));
    }
  }
  return {
    ok: missing.length === 0,
    status: result.status,
    url,
    error: missing.length
      ? `missing snippets (${snippetMode}): ${missing.join(', ')}`
      : '',
  };
}

async function main() {
  const failures = [];
  const warnings = [];

  const pm2 = checkPm2();
  if (!pm2.ok) {
    failures.push(`pm2 ${pm2.error}`);
  }

  const { dbPath, db } = openDatabase();
  const sqlite = checkSqlite(db);
  if (!sqlite.ok) {
    failures.push(`sqlite ${sqlite.error}`);
  }

  const sampleResultId = resolveSampleResultId(db);
  if (!sampleResultId) {
    failures.push('unable to resolve sample public result id');
  }

  const systemHealth = await checkSystemHealth();
  if (!systemHealth.ok) {
    failures.push(`system-health ${systemHealth.error}`);
  } else if (systemHealth.data?.severity && systemHealth.data.severity !== 'healthy') {
    warnings.push(`system-health(${systemHealth.source}) severity=${systemHealth.data.severity}: ${systemHealth.data.summary || systemHealth.data.title || 'n/a'}`);
  }

  const cron = checkCron();
  if (!cron.ok) {
    failures.push(`cron ${cron.error}`);
  }
  warnings.push(...(cron.warnings || []));

  const daemonHealth = checkDaemonHealth(db);
  if (!daemonHealth.ok) {
    failures.push(`daemon-health ${daemonHealth.error}`);
  }
  warnings.push(...(daemonHealth.warnings || []));

  const buildId = checkBuildId();
  if (!buildId.ok) {
    failures.push(`build-id ${buildId.error}`);
  }
  warnings.push(...(buildId.warnings || []));

  const routeChecks = [];
  const apiChecks = [];

  const predictionsApi = await checkPredictionsApi(publicOrigin);
  apiChecks.push(predictionsApi);
  if (!predictionsApi.ok) {
    failures.push(`api predictions ${predictionsApi.error}`);
  }

  const predictionsPostAuth = await checkPredictionsPostRequiresAuth(publicOrigin);
  apiChecks.push({ name: 'predictions-post-auth', ...predictionsPostAuth });
  if (!predictionsPostAuth.ok) {
    failures.push(`api predictions-post ${predictionsPostAuth.error}`);
  }

  const predictionsAuthE2e = await runPredictionsAuthE2e({
    origin: internalOrigin,
    dbPath,
    requestTimeoutMs,
  });
  apiChecks.push({ name: 'predictions-auth-e2e', ...predictionsAuthE2e });
  if (!predictionsAuthE2e.ok) {
    failures.push(`api predictions-auth-e2e ${predictionsAuthE2e.error}`);
  }

  const dimensionsE2e = await runDimensionsE2e({
    origin: internalOrigin,
    dbPath,
    requestTimeoutMs,
  });
  apiChecks.push({ name: 'dimensions-e2e', ...dimensionsE2e });
  if (!dimensionsE2e.ok) {
    failures.push(`api dimensions-e2e ${dimensionsE2e.error}`);
  }

  const predictionDueEmailCron = await runPredictionDueEmailCronSmoke({
    origin: internalOrigin,
    token: readEnv('PREDICTION_EMAIL_CRON_TOKEN') || readEnv('TIMING_EMAIL_CRON_TOKEN'),
    requestTimeoutMs,
  });
  apiChecks.push({ name: 'prediction-due-email-cron', ...predictionDueEmailCron });
  if (!predictionDueEmailCron.ok) {
    failures.push(`api prediction-due-email-cron ${predictionDueEmailCron.error}`);
  }

  const routeDefinitions = [
    { name: 'home', url: new URL('/', publicOrigin).toString() },
    { name: 'analyze', url: new URL('/analyze', publicOrigin).toString() },
    { name: 'report', url: new URL('/report', publicOrigin).toString() },
    {
      name: 'dimensions',
      url: new URL('/dimensions', publicOrigin).toString(),
      snippets: ['十维度深度研判'],
    },
    {
      name: 'dimensions-fortune-rhythm',
      url: new URL('/dimensions/fortune-rhythm', publicOrigin).toString(),
      snippets: ['运势节奏'],
    },
  ];
  if (sampleResultId) {
    routeDefinitions.push({
      name: 'result-full',
      url: new URL(`/result/${encodeURIComponent(sampleResultId)}?view=full`, publicOrigin).toString(),
      snippets: resultSnippets,
      snippetMode: 'any',
    });
  }

  for (const route of routeDefinitions) {
    const result = await checkPublicRoute(route.name, route.url, route.snippets || [], {
      snippetMode: route.snippetMode,
    });
    routeChecks.push(result);
    if (!result.ok) {
      failures.push(`route ${route.name} ${result.error}`);
    }
  }

  const fingerprints = collectErrorFingerprints();
  warnings.push(...fingerprints.warnings);

  const output = {
    success: failures.length === 0 && (!strictMode || warnings.length === 0),
    checkedAt: new Date().toISOString(),
    strictMode,
    requestTimeoutMs,
    publicOrigin,
    internalOrigin,
    internalHealthUrl,
    dbPath,
    sampleResultId,
    pm2: pm2.data,
    pm2Optional: pm2.optional,
    sqlite: sqlite.data,
    cron: cron.data,
    daemonHealth: daemonHealth.data,
    buildId: buildId.data,
    systemHealth: systemHealth.data,
    systemHealthSource: systemHealth.source || null,
    publicRoutes: routeChecks,
    apiRoutes: apiChecks,
    errorFingerprints: fingerprints.findings,
    warnings,
    failures,
  };

  console.log(JSON.stringify(output, null, 2));

  if (!output.success) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(JSON.stringify({
    success: false,
    fatal: error instanceof Error ? error.message : String(error),
  }, null, 2));
  process.exit(1);
});
