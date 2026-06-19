const { readdirSync, readFileSync, statSync } = require('node:fs');
const path = require('node:path');

const roots = ['app', 'components'].map((dir) => path.join(process.cwd(), dir));
const errors = [];
const warnings = [];

function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const fullPath = path.join(dir, entry);
    const stats = statSync(fullPath);
    if (stats.isDirectory()) {
      if (entry === 'node_modules' || entry === '.next') {
        continue;
      }
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

  if (source.includes('scroll-mt-24')) {
    errors.push(`${rel}: use scroll-mt-header instead of scroll-mt-24`);
  }
  if (source.includes('text-[9px]')) {
    errors.push(`${rel}: use text-xs instead of text-[9px]`);
  }
  if (source.includes('text-[10px]')) {
    errors.push(`${rel}: use text-xs instead of text-[10px]`);
  }
  if (source.includes('text-[11px]')) {
    warnings.push(`${rel}: prefer text-xs instead of text-[11px]`);
  }
}

for (const root of roots) {
  walk(root);
}

if (warnings.length > 0) {
  console.warn('Layout contract warnings:\n');
  for (const warning of warnings) {
    console.warn(`- ${warning}`);
  }
  console.warn('');
}

if (errors.length > 0) {
  console.error('Layout contract check failed:\n');
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log('Layout contract check passed.');