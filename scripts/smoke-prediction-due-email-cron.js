#!/usr/bin/env node
/**
 * Prediction due email cron smoke:
 * - POST without token -> 403
 * - POST with token -> 200 + success (sentCount may be 0)
 */
const { loadEnvConfig } = require('@next/env');

loadEnvConfig(process.cwd());

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
        json: null,
        error: 'invalid JSON response',
      };
    }
    return { ok: true, status: response.status, json, error: '' };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      json: null,
      error: error instanceof Error ? error.message : String(error),
    };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * @param {object} [options]
 * @param {string} [options.origin]
 * @param {string} [options.token]
 * @param {number} [options.requestTimeoutMs]
 */
async function runPredictionDueEmailCronSmoke(options = {}) {
  const origin = options.origin || readEnv('OPS_INTERNAL_ORIGIN', 'http://127.0.0.1:8080');
  const token = options.token
    || readEnv('PREDICTION_EMAIL_CRON_TOKEN')
    || readEnv('TIMING_EMAIL_CRON_TOKEN');
  const requestTimeoutMs = options.requestTimeoutMs
    || readPositiveInteger('OPS_SMOKE_TIMEOUT_MS', 15000, { min: 2000, max: 120000 });
  const url = new URL('/api/admin/predictions/email/cron?limit=1', origin).toString();
  const steps = [];

  const unauthorized = await fetchJson(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
  }, requestTimeoutMs);
  steps.push({
    step: 'post-unauthorized',
    ok: unauthorized.ok && unauthorized.status === 403,
    status: unauthorized.status,
    error: unauthorized.error || (unauthorized.status === 403 ? '' : 'expected HTTP 403'),
  });
  if (!steps[steps.length - 1].ok) {
    return {
      ok: false,
      origin,
      url,
      steps,
      error: steps[steps.length - 1].error || 'unauthorized guard failed',
    };
  }

  if (!token) {
    return {
      ok: false,
      origin,
      url,
      steps,
      error: 'missing PREDICTION_EMAIL_CRON_TOKEN or TIMING_EMAIL_CRON_TOKEN',
    };
  }

  const authorized = await fetchJson(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-prediction-email-cron-token': token,
    },
  }, requestTimeoutMs);
  steps.push({
    step: 'post-authorized',
    ok: authorized.ok
      && authorized.status === 200
      && authorized.json?.success === true,
    status: authorized.status,
    campaign: authorized.json?.campaign,
    sentCount: authorized.json?.sentCount,
    candidateRows: authorized.json?.candidateRows,
    error: authorized.error || (authorized.json?.success === false ? authorized.json.error : ''),
  });
  if (!steps[steps.length - 1].ok) {
    return {
      ok: false,
      origin,
      url,
      steps,
      error: steps[steps.length - 1].error || 'authorized cron failed',
    };
  }

  return {
    ok: true,
    origin,
    url,
    steps,
    campaign: authorized.json?.campaign,
    sentCount: authorized.json?.sentCount,
    candidateRows: authorized.json?.candidateRows,
    error: '',
  };
}

async function main() {
  const result = await runPredictionDueEmailCronSmoke();
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
  runPredictionDueEmailCronSmoke,
};