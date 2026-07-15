/**
 * forum/templates 对齐性校验
 *
 * 运行：node scripts/forum-consistency-check.js
 *
 * 检查 CATEGORIES / SEO_KEYWORDS / CATEGORY_FAQ / QUESTION_TEMPLATES 的 key 集合互相对齐。
 */
const fs = require('fs');
const path = require('path');

function extractKeysFromBlock(lines, blockStartPattern, isObjectArray = false) {
  const keys = new Set();
  let inBlock = false;
  for (const line of lines) {
    if (!inBlock) {
      if (line.includes(blockStartPattern)) inBlock = true;
      continue;
    }
    const stripped = line.trim();
    if (/^];?\s*$/.test(stripped) || /^};\s*$/.test(stripped)) break;
    if (isObjectArray) {
      const m = line.match(/key:\s*'(\w+)'/);
      if (m) keys.add(m[1]);
    } else {
      const m = stripped.match(/^['"]?(\w+)['"]?\s*:/);
      if (m) keys.add(m[1]);
    }
  }
  return keys;
}

function run() {
  const templatesPath = path.join(process.cwd(), 'lib', 'forum', 'templates.ts');
  const lines = fs.readFileSync(templatesPath, 'utf8').split(/\r?\n/);

  const seoKeys = extractKeysFromBlock(lines, 'export const SEO_KEYWORDS');
  const catKeys = extractKeysFromBlock(lines, 'export const CATEGORIES = [', true);
  const faqKeys = extractKeysFromBlock(lines, 'export const CATEGORY_FAQ');
  const qtKeys = extractKeysFromBlock(lines, 'export const QUESTION_TEMPLATES');

  // ELI5 is a non-category question template key — it's fine
  const nonCategoryKeys = new Set(['ELI5']);

  const failures = [];

  const checks = [
    ['SEO_KEYWORDS -> CATEGORIES', seoKeys, catKeys],
    ['CATEGORIES -> SEO_KEYWORDS', catKeys, seoKeys],
    ['SEO_KEYWORDS -> CATEGORY_FAQ', seoKeys, faqKeys],
    ['CATEGORIES -> CATEGORY_FAQ', catKeys, faqKeys],
    ['CATEGORIES -> QUESTION_TEMPLATES', catKeys, qtKeys],
    ['QUESTION_TEMPLATES -> CATEGORIES', qtKeys, catKeys],
    ['QUESTION_TEMPLATES -> SEO_KEYWORDS', qtKeys, seoKeys],
  ];

  for (const [label, source, target] of checks) {
    const missing = new Set();
    for (const key of source) {
      if (nonCategoryKeys.has(key)) continue;
      if (!target.has(key)) missing.add(key);
    }
    if (missing.size > 0) {
      failures.push(`${label}: missing ${[...missing].join(', ')}`);
    }
  }

  if (failures.length > 0) {
    console.error('FORUM CONSISTENCY CHECK FAILED');
    for (const f of failures) console.error('  -', f);
    process.exit(1);
  }

  console.log('FORUM CONSISTENCY CHECK PASSED');
  console.log(`  CATEGORIES: ${catKeys.size}`);
  console.log(`  SEO_KEYWORDS: ${seoKeys.size}`);
  console.log(`  CATEGORY_FAQ: ${faqKeys.size}`);
  console.log(`  QUESTION_TEMPLATES: ${qtKeys.size}`);
  process.exit(0);
}

run();
