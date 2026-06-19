#!/usr/bin/env node
/**
 * Build ID drift watchdog.
 *
 * Verifies every local Next PM2 tier serves the same process buildId as .next/BUILD_ID.
 * Default behavior is alert-only: exit 2 on drift, no restart.
 */
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { readNonEmptyCsvEnv, readPositiveIntegerEnv, readPositiveIntegerValue } = require('./ops-env.js');

const BUILD_ID_PATH = path.join(process.cwd(), '.next', 'BUILD_ID');
const BUILD_ENDPOINT_PATH = '/api/runtime/build';
const TIMEOUT_MS = readPositiveIntegerEnv('BUILD_ID_WATCHDOG_TIMEOUT_MS', 8000, { min: 1000, max: 60000 });
const DEFAULT_PORTS = ['3000', '3001', '3002', '3004'];
const PORTS = readNonEmptyCsvEnv('BUILD_ID_WATCHDOG_PORTS', DEFAULT_PORTS)
  .map((value, index) => readPositiveIntegerValue(value, Number(DEFAULT_PORTS[index] || DEFAULT_PORTS[0]), {
    min: 1,
    max: 65535,
  }));

function readExpectedBuildId() {
  if (!fs.existsSync(BUILD_ID_PATH)) {
    throw new Error('.next/BUILD_ID 不存在；先 build');
  }
  const buildId = fs.readFileSync(BUILD_ID_PATH, 'utf8').trim();
  if (!buildId) {
    throw new Error('.next/BUILD_ID 为空；build 产物损坏');
  }
  return buildId;
}

function probeBuildId(port) {
  return new Promise((resolve) => {
    const req = http.request(
      { host: '127.0.0.1', port, path: BUILD_ENDPOINT_PATH, method: 'GET', timeout: TIMEOUT_MS },
      (res) => {
        let body = '';
        res.setEncoding('utf8');
        res.on('data', (chunk) => {
          body += chunk;
        });
        res.on('end', () => {
          if (res.statusCode !== 200) {
            resolve({ port, ok: false, statusCode: res.statusCode || 0, buildId: '', error: `HTTP ${res.statusCode || 0}` });
            return;
          }
          try {
            const data = JSON.parse(body);
            resolve({
              port,
              ok: Boolean(data?.success && data?.buildId),
              statusCode: res.statusCode,
              buildId: `${data?.buildId || ''}`.trim(),
              source: `${data?.source || ''}`.trim(),
              filesystemBuildId: `${data?.filesystemBuildId || ''}`.trim(),
              error: '',
            });
          } catch (err) {
            resolve({ port, ok: false, statusCode: res.statusCode, buildId: '', source: '', filesystemBuildId: '', error: `invalid JSON: ${err.message}` });
          }
        });
      },
    );
    req.on('error', (err) => resolve({ port, ok: false, statusCode: 0, buildId: '', source: '', filesystemBuildId: '', error: err.message }));
    req.on('timeout', () => {
      req.destroy();
      resolve({ port, ok: false, statusCode: 0, buildId: '', source: '', filesystemBuildId: '', error: 'timeout' });
    });
    req.end();
  });
}

async function main() {
  if (!PORTS.length) {
    throw new Error('BUILD_ID_WATCHDOG_PORTS 为空');
  }

  const expectedBuildId = readExpectedBuildId();
  const results = await Promise.all(PORTS.map((port) => probeBuildId(port)));
  let hasDrift = false;

  console.log(`[build-id-watchdog] expected=${expectedBuildId}`);
  for (const result of results) {
    const ok = result.ok && result.buildId === expectedBuildId && result.source === 'process-env';
    hasDrift = hasDrift || !ok;
    console.log(
      `[build-id-watchdog] port=${result.port} status=${result.statusCode} buildId=${result.buildId || '<empty>'} source=${result.source || '<empty>'} fs=${result.filesystemBuildId || '<empty>'} ${ok ? 'OK' : 'DRIFT'}${result.error ? ` error=${result.error}` : ''}`,
    );
  }

  if (hasDrift) {
    console.error('[build-id-watchdog] buildId drift detected');
    process.exit(2);
  }
}

main().catch((err) => {
  console.error('[build-id-watchdog] fatal:', err instanceof Error ? err.message : err);
  process.exit(1);
});
