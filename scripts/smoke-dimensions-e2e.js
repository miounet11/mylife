#!/usr/bin/env node
/**
 * Dimensions E2E smoke:
 * - POST /api/dimensions/[slug] (anonymous) for all MVP slugs
 * - Logged-in: generate report → sync predictions → GET hydrate → cleanup
 * - Auto-starts Next.js on the target port when OPS_INTERNAL_ORIGIN is unreachable
 *   (disable with SMOKE_AUTO_START=0)
 */
const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');
const Database = require('better-sqlite3');
const { loadEnvConfig } = require('@next/env');

loadEnvConfig(process.cwd());

const SESSION_COOKIE_NAME = 'life_kline_session_id';
const USER_AGENT = 'life-kline-dimensions-e2e/1.0';

const MVP_DIMENSION_SLUGS = [
  'naming',
  'career-industry',
  'health',
  'study-career',
  'investment',
  'marriage',
  'fortune-rhythm',
  'partnership',
  'living-environment',
  'timing-selection',
];

const SAMPLE_BIRTH = {
  birthDate: '1990-06-15',
  birthTime: '08:30',
  birthPlace: '北京',
  birthAccuracy: 'exact',
  gender: 'male',
  name: 'Smoke',
  llmEnhance: false,
};

const AUTH_SMOKE_SLUG = 'fortune-rhythm';

function readEnv(name, fallback = '') {
  return `${process.env[name] || ''}`.trim() || fallback;
}

function readPositiveInteger(name, fallback, options = {}) {
  const min = Number.isInteger(options.min) ? options.min : 1;
  const max = Number.isInteger(options.max) ? options.max : Number.MAX_SAFE_INTEGER;
  const raw = readEnv(name, `${fallback}`);
  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
    return fallback;
  }
  return parsed;
}

async function fetchJson(url, options = {}, timeoutMs = 15000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      ...options,
      redirect: 'follow',
      signal: controller.signal,
    });
    const text = await response.text();
    let json = null;
    try {
      json = JSON.parse(text || '{}');
    } catch {
      return {
        ok: false,
        status: response.status,
        text,
        json: null,
        error: 'invalid JSON response',
      };
    }
    return { ok: true, status: response.status, text, json, error: '' };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      text: '',
      json: null,
      error: error instanceof Error ? error.message : String(error),
    };
  } finally {
    clearTimeout(timer);
  }
}

function resolveDbPath(explicitPath) {
  if (explicitPath) return explicitPath;
  return path.join(process.cwd(), 'data', 'lifekline.db');
}

function resolveVerifiedUserId(db, explicitUserId) {
  if (explicitUserId) return explicitUserId;
  const row = db
    .prepare(`
      SELECT id
      FROM users
      WHERE email IS NOT NULL
        AND TRIM(email) != ''
        AND email_verified = 1
      ORDER BY COALESCE(updated_at, created_at) DESC
      LIMIT 1
    `)
    .get();
  return row?.id || '';
}

function sessionHeaders(userId) {
  return {
    'content-type': 'application/json',
    'user-agent': USER_AGENT,
    cookie: `${SESSION_COOKIE_NAME}=${encodeURIComponent(userId)}`,
  };
}

function validateDimensionReport(report, slug) {
  if (!report || typeof report !== 'object') return 'missing report object';
  if (report.slug !== slug) return `slug mismatch: ${report.slug}`;
  if (!Array.isArray(report.sections) || report.sections.length < 4) {
    return `sections.length=${report.sections?.length ?? 0}, expected >= 4`;
  }
  if (!report.sections.some((item) => item?.key === 'core')) return 'missing core section';
  if (!Array.isArray(report.predictions) || report.predictions.length !== 3) {
    return `predictions.length=${report.predictions?.length ?? 0}, expected 3`;
  }
  if (!report.birthSignature) return 'missing birthSignature';
  if (!report.generatedAt) return 'missing generatedAt';
  for (const prediction of report.predictions) {
    if (!prediction?.id || !prediction?.statement || !prediction?.dueDate) {
      return 'invalid prediction shape';
    }
  }
  return '';
}

function cleanupPredictions(dbPath, predictionIds) {
  if (!dbPath || !fs.existsSync(dbPath) || !Array.isArray(predictionIds) || !predictionIds.length) {
    return;
  }
  let db;
  try {
    db = new Database(dbPath);
    const stmt = db.prepare('DELETE FROM report_predictions WHERE id = ?');
    for (const id of predictionIds) {
      if (id) stmt.run(id);
    }
  } catch {
    // best-effort cleanup
  } finally {
    if (db) db.close();
  }
}

async function postDimension(origin, slug, body, headers, timeoutMs) {
  const url = new URL(`/api/dimensions/${encodeURIComponent(slug)}`, origin).toString();
  return fetchJson(
    url,
    {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    },
    timeoutMs,
  );
}

/**
 * @param {object} [options]
 * @param {string} [options.origin]
 * @param {string} [options.dbPath]
 * @param {string} [options.userId]
 * @param {number} [options.requestTimeoutMs]
 * @param {boolean} [options.skipAuth]
 * @param {string[]} [options.slugs]
 */
async function runDimensionsE2e(options = {}) {
  const origin = options.origin || readEnv('OPS_INTERNAL_ORIGIN', 'http://127.0.0.1:8080');
  const dbPath = resolveDbPath(options.dbPath);
  const requestTimeoutMs = options.requestTimeoutMs
    || readPositiveInteger('OPS_SMOKE_TIMEOUT_MS', 15000, { min: 2000, max: 120000 });
  const slugs = Array.isArray(options.slugs) && options.slugs.length
    ? options.slugs
    : MVP_DIMENSION_SLUGS;
  const steps = [];
  const slugResults = [];

  const anonHeaders = {
    'content-type': 'application/json',
    'user-agent': USER_AGENT,
  };

  const badBirth = await postDimension(origin, AUTH_SMOKE_SLUG, { birthDate: '' }, anonHeaders, requestTimeoutMs);
  steps.push({
    step: 'post-missing-birth',
    ok: badBirth.ok && badBirth.status === 400,
    status: badBirth.status,
    error: badBirth.error || (badBirth.status === 400 ? '' : 'expected HTTP 400'),
  });
  if (!steps[steps.length - 1].ok) {
    return {
      ok: false,
      origin,
      dbPath,
      steps,
      slugResults,
      error: steps[steps.length - 1].error || 'missing birthDate guard failed',
    };
  }

  const unknownSlug = await postDimension(origin, 'not-a-dimension', SAMPLE_BIRTH, anonHeaders, requestTimeoutMs);
  steps.push({
    step: 'post-unknown-slug',
    ok: unknownSlug.ok && unknownSlug.status === 404,
    status: unknownSlug.status,
    error: unknownSlug.error || (unknownSlug.status === 404 ? '' : 'expected HTTP 404'),
  });
  if (!steps[steps.length - 1].ok) {
    return {
      ok: false,
      origin,
      dbPath,
      steps,
      slugResults,
      error: steps[steps.length - 1].error || 'unknown slug guard failed',
    };
  }

  for (const slug of slugs) {
    const result = await postDimension(origin, slug, SAMPLE_BIRTH, anonHeaders, requestTimeoutMs);
    const report = result.json?.report;
    const validationError = validateDimensionReport(report, slug);
    const entry = {
      slug,
      ok: result.ok
        && result.status === 200
        && result.json?.success === true
        && !validationError,
      status: result.status,
      sectionCount: Array.isArray(report?.sections) ? report.sections.length : 0,
      predictionCount: Array.isArray(report?.predictions) ? report.predictions.length : 0,
      birthSignature: report?.birthSignature || '',
      llmEnhanced: report?.meta?.llmEnhanced,
      error: result.error || validationError || (result.json?.success === false ? result.json.error : ''),
    };
    slugResults.push(entry);
    if (!entry.ok) {
      return {
        ok: false,
        origin,
        dbPath,
        steps,
        slugResults,
        error: `dimension ${slug}: ${entry.error}`,
      };
    }
  }

  steps.push({
    step: 'post-all-mvp-slugs',
    ok: true,
    slugCount: slugResults.length,
  });

  if (options.skipAuth) {
    return {
      ok: true,
      origin,
      dbPath,
      steps,
      slugResults,
      error: '',
    };
  }

  if (!fs.existsSync(dbPath)) {
    steps.push({
      step: 'auth-skip',
      ok: true,
      reason: `database not found: ${dbPath} (anonymous slug checks still pass)`,
    });
    return {
      ok: true,
      origin,
      dbPath,
      steps,
      slugResults,
      skippedAuth: true,
      error: '',
    };
  }

  let db;
  let userId = '';
  try {
    db = new Database(dbPath, { readonly: true, fileMustExist: true });
    const hasUsersTable = db
      .prepare(`SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'users'`)
      .get();
    if (!hasUsersTable) {
      steps.push({
        step: 'auth-skip',
        ok: true,
        reason: 'local sandbox db has no users table; skip auth hydrate path',
      });
      return {
        ok: true,
        origin,
        dbPath,
        steps,
        slugResults,
        skippedAuth: true,
        error: '',
      };
    }
    userId = resolveVerifiedUserId(db, options.userId);
    if (!userId) {
      steps.push({
        step: 'auth-skip',
        ok: true,
        reason: 'no email_verified user found; skip auth hydrate path',
      });
      return {
        ok: true,
        origin,
        dbPath,
        steps,
        slugResults,
        skippedAuth: true,
        error: '',
      };
    }
  } catch (error) {
    return {
      ok: false,
      origin,
      dbPath,
      steps,
      slugResults,
      error: error instanceof Error ? error.message : String(error),
    };
  } finally {
    if (db) db.close();
  }

  const authHeaders = sessionHeaders(userId);
  const predictionIds = [];

  try {
    const dimensionPost = await postDimension(
      origin,
      AUTH_SMOKE_SLUG,
      SAMPLE_BIRTH,
      authHeaders,
      requestTimeoutMs,
    );
    const report = dimensionPost.json?.report;
    const validationError = validateDimensionReport(report, AUTH_SMOKE_SLUG);
    steps.push({
      step: 'post-auth-dimension',
      ok: dimensionPost.ok
        && dimensionPost.status === 200
        && dimensionPost.json?.success === true
        && dimensionPost.json?.authenticated === true
        && !validationError,
      status: dimensionPost.status,
      authenticated: dimensionPost.json?.authenticated,
      error: dimensionPost.error || validationError || '',
    });
    if (!steps[steps.length - 1].ok) {
      return {
        ok: false,
        origin,
        dbPath,
        userId,
        steps,
        slugResults,
        error: steps[steps.length - 1].error || 'auth dimension POST failed',
      };
    }

    const predictions = report.predictions;
    predictionIds.push(...predictions.map((item) => item.id));

    const syncUrl = new URL('/api/predictions', origin).toString();
    const syncResult = await fetchJson(
      syncUrl,
      {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ predictions }),
      },
      requestTimeoutMs,
    );
    steps.push({
      step: 'post-predictions-sync',
      ok: syncResult.ok
        && syncResult.status === 200
        && syncResult.json?.success === true
        && Number(syncResult.json?.saved) >= 3,
      status: syncResult.status,
      saved: syncResult.json?.saved,
      error: syncResult.error || (syncResult.json?.success === false ? syncResult.json.error : ''),
    });
    if (!steps[steps.length - 1].ok) {
      return {
        ok: false,
        origin,
        dbPath,
        userId,
        predictionIds,
        steps,
        slugResults,
        error: steps[steps.length - 1].error || 'prediction sync failed',
      };
    }

    const hydrateResult = await fetchJson(
      syncUrl,
      { method: 'GET', headers: { ...authHeaders, 'content-type': undefined } },
      requestTimeoutMs,
    );
    const hydrated = Array.isArray(hydrateResult.json?.predictions)
      ? hydrateResult.json.predictions.filter((item) => predictionIds.includes(item?.id))
      : [];
    steps.push({
      step: 'get-predictions-hydrate',
      ok: hydrateResult.ok
        && hydrateResult.status === 200
        && hydrateResult.json?.authenticated === true
        && hydrated.length === predictionIds.length,
      status: hydrateResult.status,
      hydratedCount: hydrated.length,
      expectedCount: predictionIds.length,
      error: hydrateResult.error || (hydrated.length === predictionIds.length ? '' : 'predictions not hydrated'),
    });
    if (!steps[steps.length - 1].ok) {
      return {
        ok: false,
        origin,
        dbPath,
        userId,
        predictionIds,
        steps,
        slugResults,
        error: steps[steps.length - 1].error || 'prediction hydrate failed',
      };
    }

    return {
      ok: true,
      origin,
      dbPath,
      userId,
      predictionIds,
      steps,
      slugResults,
      error: '',
    };
  } finally {
    cleanupPredictions(dbPath, predictionIds);
    steps.push({ step: 'cleanup', ok: true, predictionIds });
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function originPort(origin) {
  try {
    const url = new URL(origin);
    if (url.port) return Number(url.port);
    return url.protocol === 'https:' ? 443 : 80;
  } catch {
    return 8080;
  }
}

async function isOriginReady(origin, timeoutMs = 2500) {
  // Prefer dimensions API probe so we don't treat an unrelated process as ready
  const probeUrl = new URL(`/api/dimensions/${AUTH_SMOKE_SLUG}`, origin).toString();
  const probe = await fetchJson(
    probeUrl,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'user-agent': USER_AGENT },
      body: JSON.stringify({ birthDate: '' }),
    },
    timeoutMs,
  );
  // Ready when the route exists and returns structured JSON (400 expected for empty birth)
  return Boolean(probe.json) && (probe.status === 400 || probe.status === 200 || probe.status === 501);
}

async function waitForOrigin(origin, options = {}) {
  const timeoutMs = options.timeoutMs || 90000;
  const intervalMs = options.intervalMs || 1500;
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    if (await isOriginReady(origin, 3000)) return true;
    await sleep(intervalMs);
  }
  return false;
}

/**
 * Start Next when target origin is down so smoke is self-contained.
 * Prefers `next start` when a production build exists; falls back to `next dev`.
 * @returns {Promise<{ child: import('node:child_process').ChildProcess | null, started: boolean, error: string }>}
 */
async function ensureServer(origin) {
  if (await isOriginReady(origin)) {
    return { child: null, started: false, error: '' };
  }

  const autoStart = readEnv('SMOKE_AUTO_START', '1') !== '0';
  if (!autoStart) {
    return {
      child: null,
      started: false,
      error: `origin unreachable: ${origin} (set SMOKE_AUTO_START=1 or start the server)`,
    };
  }

  const port = originPort(origin);
  const nextBin = path.join(process.cwd(), 'node_modules', 'next', 'dist', 'bin', 'next');
  const hasBuild = fs.existsSync(path.join(process.cwd(), '.next', 'BUILD_ID'));
  const mode = hasBuild ? 'start' : 'dev';
  const command = fs.existsSync(nextBin) ? process.execPath : 'npx';
  const args = fs.existsSync(nextBin)
    ? [nextBin, mode, '--port', String(port), '--hostname', '127.0.0.1']
    : ['next', mode, '--port', String(port), '--hostname', '127.0.0.1'];

  const child = spawn(command, args, {
    cwd: process.cwd(),
    env: { ...process.env, PORT: String(port) },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  let stderr = '';
  let stdout = '';
  child.stderr?.on('data', (chunk) => {
    stderr += chunk.toString();
    if (stderr.length > 4000) stderr = stderr.slice(-4000);
  });
  child.stdout?.on('data', (chunk) => {
    stdout += chunk.toString();
    if (stdout.length > 4000) stdout = stdout.slice(-4000);
  });

  const ready = await waitForOrigin(origin, { timeoutMs: mode === 'dev' ? 180000 : 90000 });
  if (!ready) {
    try {
      child.kill('SIGTERM');
    } catch {
      // ignore
    }
    return {
      child: null,
      started: false,
      error: `auto-start timeout waiting for ${origin} (mode=${mode}). stderr: ${stderr.slice(-600)} stdout: ${stdout.slice(-400)}`,
    };
  }

  return { child, started: true, error: '' };
}

function stopServer(child) {
  if (!child || child.killed) return;
  try {
    child.kill('SIGTERM');
  } catch {
    // ignore
  }
}

async function main() {
  const origin = readEnv('OPS_INTERNAL_ORIGIN', 'http://127.0.0.1:8080');
  const server = await ensureServer(origin);
  if (server.error) {
    console.log(JSON.stringify({ ok: false, origin, fatal: server.error }, null, 2));
    process.exit(1);
  }

  try {
    const result = await runDimensionsE2e({ origin });
    if (server.started) {
      result.autoStartedServer = true;
    }
    console.log(JSON.stringify(result, null, 2));
    if (!result.ok) {
      process.exitCode = 1;
    }
  } finally {
    stopServer(server.child);
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error(JSON.stringify({
      ok: false,
      fatal: error instanceof Error ? error.message : String(error),
    }, null, 2));
    process.exit(1);
  });
}

module.exports = {
  runDimensionsE2e,
  MVP_DIMENSION_SLUGS,
  validateDimensionReport,
  SESSION_COOKIE_NAME,
};