const { readFileSync } = require('node:fs');
const path = require('node:path');

const requiredHeroFiles = [
  'app/analyze/page.tsx',
  'app/chat/page.tsx',
  'app/history/page.tsx',
  'app/tools/page.tsx',
  'app/tools/category/[category]/page.tsx',
  'app/updates/page.tsx',
  'app/knowledge/page.tsx',
  'app/knowledge/topics/page.tsx',
  'app/cases/page.tsx',
  'app/insights/page.tsx',
  'app/tools/[slug]/page.tsx',
];

const requiredArticleHeroFiles = [
  'app/knowledge/[slug]/page.tsx',
  'app/knowledge/topics/[topicSlug]/page.tsx',
  'app/cases/[slug]/page.tsx',
  'app/insights/[type]/[slug]/page.tsx',
];

const issues = [];

for (const relativePath of requiredHeroFiles) {
  const fullPath = path.join(process.cwd(), relativePath);
  const source = readFileSync(fullPath, 'utf8');
  if (!source.includes('PublicSurfaceHero')) {
    issues.push(`${relativePath}: missing PublicSurfaceHero`);
  }
}

for (const relativePath of requiredArticleHeroFiles) {
  const fullPath = path.join(process.cwd(), relativePath);
  const source = readFileSync(fullPath, 'utf8');
  if (!source.includes('PublicArticleHero')) {
    issues.push(`${relativePath}: missing PublicArticleHero`);
  }
}

if (issues.length > 0) {
  console.error('Public surface hero check failed:\n');
  for (const issue of issues) {
    console.error(`- ${issue}`);
  }
  process.exit(1);
}

console.log('Public surface hero check passed.');
