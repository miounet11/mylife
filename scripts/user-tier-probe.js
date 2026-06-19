#!/usr/bin/env node
/**
 * Multi-round probe for user测算 path (3000 + nginx admin routing).
 * Usage: node scripts/user-tier-probe.js [--rounds=12] [--interval=15]
 */

const http = require('http');
const { readPositiveIntegerEnv, readPositiveIntegerValue } = require('./ops-env.js');

const args = process.argv.slice(2);
const readFlagValue = (name) => args.find((arg) => arg.startsWith(`--${name}=`))?.split('=')[1];
const rounds = readPositiveIntegerValue(readFlagValue('rounds'), 12, { min: 1, max: 120 });
const intervalSec = readPositiveIntegerValue(readFlagValue('interval'), 15, { min: 1, max: 300 });
const timeoutMs = readPositiveIntegerEnv('PROBE_TIMEOUT_MS', 5000, { min: 1000, max: 60000 });

function request(opts, body) {
  return new Promise((resolve) => {
    const payload = body ? JSON.stringify(body) : null;
    const req = http.request(
      { ...opts, timeout: timeoutMs },
      (res) => {
        res.resume();
        resolve({ status: res.statusCode || 0, ok: true });
      },
    );
    req.on('timeout', () => {
      req.destroy();
      resolve({ status: 0, ok: false, error: 'timeout' });
    });
    req.on('error', (e) => resolve({ status: 0, ok: false, error: e.message }));
    if (payload) {
      req.setHeader('Content-Type', 'application/json');
      req.setHeader('Content-Length', Buffer.byteLength(payload));
      req.write(payload);
    }
    req.end();
  });
}

const checks = [
  {
    name: 'user:3000/robots',
    run: () => request({ hostname: '127.0.0.1', port: 3000, path: '/robots.txt', method: 'GET' }),
    pass: (r) => r.ok && r.status >= 200 && r.status < 500,
  },
  {
    name: 'user:3000/api/analyze',
    run: () =>
      request({ hostname: '127.0.0.1', port: 3000, path: '/api/analyze', method: 'POST' }, {}),
    pass: (r) =>
      r.ok && (r.status === 429 || r.status === 400 || (r.status >= 200 && r.status < 500)),
  },
  {
    name: 'nginx:443/',
    run: () => {
      const https = require('https');
      return new Promise((resolve) => {
        const req = https.request(
          {
            hostname: '127.0.0.1',
            port: 443,
            path: '/',
            method: 'GET',
            headers: { Host: 'www.life-kline.com' },
            timeout: timeoutMs,
            rejectUnauthorized: false,
          },
          (res) => {
            res.resume();
            resolve({ status: res.statusCode || 0, ok: true });
          },
        );
        req.on('timeout', () => {
          req.destroy();
          resolve({ status: 0, ok: false, error: 'timeout' });
        });
        req.on('error', (e) => resolve({ status: 0, ok: false, error: e.message }));
        req.end();
      });
    },
    pass: (r) => r.ok && r.status >= 200 && r.status < 500,
  },
  {
    name: 'nginx:443/api/analyze',
    run: () => {
      const https = require('https');
      return new Promise((resolve) => {
        const payload = '{}';
        const req = https.request(
          {
            hostname: '127.0.0.1',
            port: 443,
            path: '/api/analyze',
            method: 'POST',
            headers: {
              Host: 'www.life-kline.com',
              'Content-Type': 'application/json',
              'Content-Length': Buffer.byteLength(payload),
            },
            timeout: timeoutMs,
            rejectUnauthorized: false,
          },
          (res) => {
            res.resume();
            resolve({ status: res.statusCode || 0, ok: true });
          },
        );
        req.on('timeout', () => {
          req.destroy();
          resolve({ status: 0, ok: false, error: 'timeout' });
        });
        req.on('error', (e) => resolve({ status: 0, ok: false, error: e.message }));
        req.write(payload);
        req.end();
      });
    },
    pass: (r) =>
      r.ok && (r.status === 429 || r.status === 400 || (r.status >= 200 && r.status < 500)),
  },
  {
    name: 'cron:3004/robots',
    run: () => request({ hostname: '127.0.0.1', port: 3004, path: '/robots.txt', method: 'GET' }),
    pass: (r) => r.ok && r.status >= 200 && r.status < 500,
    optional: true,
  },
];

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function runRound(n) {
  const results = [];
  for (const check of checks) {
    const r = await check.run();
    const ok = check.pass(r);
    results.push({ name: check.name, ok, status: r.status, error: r.error });
    // 避免同轮连打触发 analyze 限流
    await sleep(400);
  }
  const line = results.map((x) => `${x.name}=${x.ok ? x.status : `FAIL(${x.error || x.status})`}`).join(' ');
  const allUserOk = results
    .filter((x) => {
      const check = checks.find((c) => c.name === x.name);
      return !check?.optional;
    })
    .every((x) => x.ok);
  console.log(`[round ${n}/${rounds}] ${allUserOk ? 'PASS' : 'FAIL'} ${line}`);
  return allUserOk;
}

async function warmupUserTier() {
  console.log('warmup: waiting for life-kline-next (3000) to accept traffic…');
  for (let attempt = 1; attempt <= 10; attempt += 1) {
    const r = await request({ hostname: '127.0.0.1', port: 3000, path: '/robots.txt', method: 'GET' });
    if (r.ok && r.status >= 200 && r.status < 500) {
      console.log(`warmup: ok on attempt ${attempt} (status ${r.status})`);
      return;
    }
    await sleep(3000);
  }
  console.warn('warmup: 3000 still slow — continuing probe anyway');
}

async function main() {
  console.log(`user-tier-probe rounds=${rounds} interval=${intervalSec}s timeout=${timeoutMs}ms`);
  await warmupUserTier();
  let passed = 0;
  for (let i = 1; i <= rounds; i += 1) {
    if (await runRound(i)) passed += 1;
    if (i < rounds) await sleep(intervalSec * 1000);
  }
  console.log(`\nSummary: ${passed}/${rounds} rounds passed (user path)`);
  if (passed < rounds) {
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
