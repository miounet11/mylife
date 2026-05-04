const fs = require('fs');
const path = require('path');

const runtimeDir = path.join(process.cwd(), 'data', 'runtime');
const targetFile = path.join(runtimeDir, 'site-quality-validation-checks.snapshot.json');

function normalizeStatus(value) {
  const status = `${value || ''}`.trim().toLowerCase();
  if (status === 'passed' || status === 'failed' || status === 'unknown') {
    return status;
  }
  return 'unknown';
}

function normalizeCheck(input) {
  const key = `${input?.key || ''}`.trim();
  if (!key) {
    return null;
  }

  return {
    key,
    label: `${input?.label || key}`.trim() || key,
    status: normalizeStatus(input?.status),
    detail: typeof input?.detail === 'string' ? input.detail.trim() : undefined,
    checkedAt: typeof input?.checkedAt === 'string' && input.checkedAt.trim()
      ? input.checkedAt.trim()
      : new Date().toISOString(),
  };
}

function main() {
  const raw = process.argv[2];
  if (!raw) {
    console.error('[site-quality-validation-checks] missing JSON payload argument');
    process.exitCode = 1;
    return;
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    console.error('[site-quality-validation-checks] invalid JSON payload:', error instanceof Error ? error.message : error);
    process.exitCode = 1;
    return;
  }

  const inputChecks = Array.isArray(parsed)
    ? parsed
    : Array.isArray(parsed?.checks)
      ? parsed.checks
      : [];
  const checks = inputChecks
    .map(normalizeCheck)
    .filter(Boolean);

  fs.mkdirSync(runtimeDir, { recursive: true });
  fs.writeFileSync(targetFile, `${JSON.stringify({
    generatedAt: new Date().toISOString(),
    checks,
  }, null, 2)}\n`, 'utf8');
  process.stdout.write(`${targetFile}\n`);
}

main();
