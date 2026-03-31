const { readdirSync, readFileSync, statSync } = require('node:fs');
const path = require('node:path');

const root = path.join(process.cwd(), 'app', 'world-yi');
const issues = [];

function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const fullPath = path.join(dir, entry);
    const stats = statSync(fullPath);
    if (stats.isDirectory()) {
      walk(fullPath);
      continue;
    }
    if (!fullPath.endsWith('.tsx')) {
      continue;
    }
    inspect(fullPath);
  }
}

function inspect(filePath) {
  const source = readFileSync(filePath, 'utf8');
  const rel = path.relative(process.cwd(), filePath);

  const hasLegacyActionLabel = source.includes('操作按钮') || source.includes('>Actions<');
  if (hasLegacyActionLabel) {
    issues.push(`${rel}: legacy action label found`);
  }

  const hasManualHero = source.includes('<main className="page-frame')
    && source.includes('section-label')
    && source.includes('action-strip')
    && !source.includes('WorldYiSurfaceHero');
  if (hasManualHero) {
    issues.push(`${rel}: manual hero detected, use WorldYiSurfaceHero`);
  }

  const hasLegacyMutedCopy = source.includes('text-xs leading-6 text-[color:var(--muted)]');
  if (hasLegacyMutedCopy) {
    issues.push(`${rel}: replace legacy muted body copy with intro-copy where appropriate`);
  }
}

walk(root);

if (issues.length > 0) {
  console.error('World Yi surface check failed:\n');
  for (const issue of issues) {
    console.error(`- ${issue}`);
  }
  process.exit(1);
}

console.log('World Yi surface check passed.');
