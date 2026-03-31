const { readdirSync, readFileSync, statSync } = require('node:fs');
const path = require('node:path');

const root = path.join(process.cwd(), 'app');
const issues = [];

function walk(dir) {
  for (const entry of readdirSync(dir)) {
    if (entry.startsWith('api')) {
      continue;
    }
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

  if (source.includes('操作按钮') || source.includes('>Actions<') || source.includes('核心操作按钮')) {
    issues.push(`${rel}: legacy action label found`);
  }
}

walk(root);

if (issues.length > 0) {
  console.error('Public surface label check failed:\n');
  for (const issue of issues) {
    console.error(`- ${issue}`);
  }
  process.exit(1);
}

console.log('Public surface label check passed.');
