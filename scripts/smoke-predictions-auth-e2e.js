#!/usr/bin/env node
/**
 * Logged-in predictions E2E: POST sync → GET hydrate → PATCH feedback → GET persist.
 * Runs on production server against internal nginx (127.0.0.1:8080) with session cookie.
 */
const fs = require('node:fs');
const path = require('node:path');
const Database = require('better-sqlite3');
const { loadEnvConfig } = require('@next/env');

loadEnvConfig(process.cwd());

const SESSION_COOKIE_NAME = 'life_kline_session_id';
const USER_AGENT = 'life-kline-predictions-auth-e2e/1.0';
const SMOKE_REPORT_ID = 'smoke-report-e2e';

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

function buildSmokePrediction(predictionId) {
  const dueDate = new Date();
  dueDate.setMonth(dueDate.getMonth() + 3);
  return {
    id: predictionId,
    reportId: SMOKE_REPORT_ID,
    birthSignature: 'smoke-e2e',
    category: 'career',
    statement: 'Smoke E2E prediction — safe to delete',
    confidence: 0.75,
    dueDate: dueDate.toISOString().slice(0, 10),
    window: '2026 Q4',
    evidence: 'post-deploy smoke',
    verifyChecklist: ['smoke-check'],
    outcome: 'pending',
    createdAt: new Date().toISOString(),
  };
}

function sessionHeaders(userId) {
  return {
    'content-type': 'application/json',
    'user-agent': USER_AGENT,
    cookie: `${SESSION_COOKIE_NAME}=${encodeURIComponent(userId)}`,
  };
}

function cleanupPrediction(dbPath, predictionId) {
  if (!predictionId || !dbPath || !fs.existsSync(dbPath)) return;
  let db;
  try {
    db = new Database(dbPath);
    db.prepare('DELETE FROM report_predictions WHERE id = ?').run(predictionId);
  } catch {
    // best-effort cleanup
  } finally {
    if (db) db.close();
  }
}

/**
 * @param {object} [options]
 * @param {string} [options.origin]
 * @param {string} [options.dbPath]
 * @param {string} [options.userId]
 * @param {number} [options.requestTimeoutMs]
 */
async function runPredictionsAuthE2e(options = {}) {
  const origin = options.origin || readEnv('OPS_INTERNAL_ORIGIN', 'http://127.0.0.1:8080');
  const dbPath = resolveDbPath(options.dbPath);
  const requestTimeoutMs = options.requestTimeoutMs || readPositiveInteger('OPS_SMOKE_TIMEOUT_MS', 15000, { min: 2000, max: 120000 });
  const predictionId = `smoke-pred-${Date.now()}`;
  const steps = [];

  if (!fs.existsSync(dbPath)) {
    return {
      ok: false,
      origin,
      dbPath,
      predictionId,
      steps,
      error: `database not found: ${dbPath}`,
    };
  }

  let db;
  let userId = '';
  try {
    db = new Database(dbPath, { readonly: true, fileMustExist: true });

    userId = resolveVerifiedUserId(db, options.userId);
    if (!userId) {
      return {
        ok: false,
        origin,
        dbPath,
        predictionId,
        steps,
        error: 'no email_verified user found for session smoke',
      };
    }
  } catch (error) {
    return {
      ok: false,
      origin,
      dbPath,
      predictionId,
      steps,
      error: error instanceof Error ? error.message : String(error),
    };
  } finally {
    if (db) db.close();
  }

  const smokePrediction = buildSmokePrediction(predictionId);
  const postUrl = new URL('/api/predictions', origin).toString();
  const getUrl = postUrl;
  const patchUrl = new URL(`/api/predictions/${encodeURIComponent(predictionId)}`, origin).toString();
  const headers = sessionHeaders(userId);

  try {
    const postResult = await fetchJson(
      postUrl,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({ predictions: [smokePrediction] }),
      },
      requestTimeoutMs,
    );
    steps.push({
      step: 'post',
      ok: postResult.ok && postResult.status === 200 && postResult.json?.success === true,
      status: postResult.status,
      saved: postResult.json?.saved,
      error: postResult.error || (postResult.json?.success === false ? postResult.json.error : ''),
    });
    if (!steps[steps.length - 1].ok || Number(postResult.json?.saved) < 1) {
      return {
        ok: false,
        origin,
        dbPath,
        userId,
        predictionId,
        steps,
        error: steps[steps.length - 1].error
          || `POST saved=${postResult.json?.saved ?? 'n/a'}, expected >= 1 (check predictionOperations patch)`,
      };
    }

    const getAfterPost = await fetchJson(
      getUrl,
      { method: 'GET', headers: { ...headers, 'content-type': undefined } },
      requestTimeoutMs,
    );
    const hydrated = Array.isArray(getAfterPost.json?.predictions)
      ? getAfterPost.json.predictions.find((item) => item?.id === predictionId)
      : null;
    steps.push({
      step: 'get-hydrate',
      ok: getAfterPost.ok
        && getAfterPost.status === 200
        && getAfterPost.json?.authenticated === true
        && Boolean(hydrated),
      status: getAfterPost.status,
      authenticated: getAfterPost.json?.authenticated,
      predictionCount: Array.isArray(getAfterPost.json?.predictions) ? getAfterPost.json.predictions.length : 0,
      error: getAfterPost.error || (hydrated ? '' : 'prediction not found after POST'),
    });
    if (!steps[steps.length - 1].ok) {
      return {
        ok: false,
        origin,
        dbPath,
        userId,
        predictionId,
        steps,
        error: steps[steps.length - 1].error || 'GET hydrate failed',
      };
    }

    const patchResult = await fetchJson(
      patchUrl,
      {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ outcome: 'fulfilled', feedback: 'smoke e2e feedback' }),
      },
      requestTimeoutMs,
    );
    const patched = patchResult.json?.prediction;
    steps.push({
      step: 'patch',
      ok: patchResult.ok
        && patchResult.status === 200
        && patchResult.json?.success === true
        && patched?.outcome === 'fulfilled',
      status: patchResult.status,
      outcome: patched?.outcome,
      error: patchResult.error || (patchResult.json?.success === false ? patchResult.json.error : ''),
    });
    if (!steps[steps.length - 1].ok) {
      return {
        ok: false,
        origin,
        dbPath,
        userId,
        predictionId,
        steps,
        error: steps[steps.length - 1].error || 'PATCH feedback failed',
      };
    }

    const getAfterPatch = await fetchJson(
      getUrl,
      { method: 'GET', headers: { ...headers, 'content-type': undefined } },
      requestTimeoutMs,
    );
    const persisted = Array.isArray(getAfterPatch.json?.predictions)
      ? getAfterPatch.json.predictions.find((item) => item?.id === predictionId)
      : null;
    steps.push({
      step: 'get-persist',
      ok: getAfterPatch.ok
        && getAfterPatch.status === 200
        && getAfterPatch.json?.authenticated === true
        && persisted?.outcome === 'fulfilled'
        && persisted?.userFeedback === 'smoke e2e feedback',
      status: getAfterPatch.status,
      outcome: persisted?.outcome,
      userFeedback: persisted?.userFeedback,
      error: getAfterPatch.error || (persisted?.outcome === 'fulfilled' ? '' : 'outcome not persisted'),
    });
    if (!steps[steps.length - 1].ok) {
      return {
        ok: false,
        origin,
        dbPath,
        userId,
        predictionId,
        steps,
        error: steps[steps.length - 1].error || 'GET persist failed',
      };
    }

    return {
      ok: true,
      origin,
      dbPath,
      userId,
      predictionId,
      steps,
      error: '',
    };
  } finally {
    cleanupPrediction(dbPath, predictionId);
    steps.push({ step: 'cleanup', ok: true });
  }
}

async function main() {
  const result = await runPredictionsAuthE2e();
  console.log(JSON.stringify(result, null, 2));
  if (!result.ok) {
    process.exit(1);
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
  runPredictionsAuthE2e,
  SESSION_COOKIE_NAME,
};