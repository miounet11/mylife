const { readFileSync } = require('node:fs');
const path = require('node:path');

// 决策台风 hero 契约：每个公开 surface 页都必须有「决策台 hero」结构
// 满足以下任一即视为合规：
// 1) 显式使用 <PublicSurfaceHero /> 组件
// 2) 包含决策台 brand kicker（tracking-[0.14em] text-[color:var(--brand-strong)]）
//    + h1 + 该结构出现在 <main> 之后第一屏
// 3) 文件顶部有显式注释 marker：`{/* HERO 区 */}` 或 `{/* DECISION-TERMINAL HERO */}`
const HERO_MARKERS = [
  'PublicSurfaceHero',
  '{/* HERO 区 */}',
  '{/* HERO + ',
  '{/* DECISION-TERMINAL HERO */}',
  "tracking-[0.14em] text-[color:var(--brand-strong)]",
];

const ARTICLE_HERO_MARKERS = [
  'PublicArticleHero',
  '{/* ARTICLE HERO */}',
  // article 页通常用 BookOpenText / Layers3 + brand kicker + h1 inline，故复用相同 brand-strong tracking
  "tracking-[0.14em] text-[color:var(--brand-strong)]",
];

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

function hasAny(source, markers) {
  return markers.some((m) => source.includes(m));
}

const issues = [];

for (const relativePath of requiredHeroFiles) {
  const fullPath = path.join(process.cwd(), relativePath);
  const source = readFileSync(fullPath, 'utf8');
  if (!hasAny(source, HERO_MARKERS)) {
    issues.push(`${relativePath}: missing decision-terminal hero (need PublicSurfaceHero or inline brand kicker)`);
  }
}

for (const relativePath of requiredArticleHeroFiles) {
  const fullPath = path.join(process.cwd(), relativePath);
  const source = readFileSync(fullPath, 'utf8');
  if (!hasAny(source, ARTICLE_HERO_MARKERS)) {
    issues.push(`${relativePath}: missing decision-terminal article hero`);
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
