#!/usr/bin/env node
/**
 * Content OS CLI — destiny matrix generate / dry-run / coverage.
 *
 * Usage:
 *   node scripts/content-os-run.mjs --dry-run
 *   node scripts/content-os-run.mjs --limit 3 --locales zh-CN,en-US
 *   CONTENT_OS_API_KEY=sk-... node scripts/content-os-run.mjs --limit 2 --with-image
 *
 * Env:
 *   API_BASE_URL / CONTENT_OS_API_BASE_URL  default https://ttqq.inping.com/v1
 *   API_KEY / OPENAI_API_KEY / CONTENT_OS_API_KEY
 *   CONTENT_OS_TEXT_MODEL  default auto
 *   CONTENT_OS_IMAGE_MODEL default z-image-turbo
 */

import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const args = process.argv.slice(2);
const get = (name, fallback) => {
  const idx = args.indexOf(name);
  if (idx === -1) return fallback;
  return args[idx + 1] || fallback;
};
const has = (name) => args.includes(name);

const dryRun = has('--dry-run');
const withImage = has('--with-image');
const limit = Number(get('--limit', '4'));
const locales = get('--locales', 'zh-CN,en-US');
const concurrency = Number(get('--concurrency', '2'));

const runner = `
const {
  buildContentOsRunPlan,
  runContentOsCycle,
  summarizeContentOsMatrix,
  buildContentOsMatrix,
  resolveContentOsTextEndpoint,
} = require('./lib/content-os');

async function main() {
  const locales = ${JSON.stringify(locales)}.split(',').map((s) => s.trim()).filter(Boolean);
  const endpoint = resolveContentOsTextEndpoint();
  console.log(JSON.stringify({
    phase: 'endpoint',
    baseUrl: endpoint.baseUrl,
    model: endpoint.model,
    hasKey: Boolean(endpoint.apiKey),
  }, null, 2));

  const matrix = buildContentOsMatrix({ locales, includeSeasonal: true });
  console.log(JSON.stringify({ phase: 'matrix', ...summarizeContentOsMatrix(matrix) }, null, 2));

  if (${dryRun}) {
    const plan = buildContentOsRunPlan({ locales, limit: ${limit} });
    console.log(JSON.stringify({ phase: 'plan', plan }, null, 2));
    return;
  }

  if (!endpoint.apiKey) {
    console.error('Missing API key. Set CONTENT_OS_API_KEY or OPENAI_API_KEY / API_KEY.');
    process.exit(2);
  }

  const result = await runContentOsCycle({
    locales,
    limit: ${limit},
    withImage: ${withImage},
    concurrency: ${concurrency},
  });

  console.log(JSON.stringify({
    phase: 'result',
    coverage: result.plan.coverage,
    draftDir: result.draftDir,
    savedIds: result.savedIds,
    articles: result.articles.map((a) => ({
      slug: a.slug,
      title: a.title,
      locale: a.locale,
      llmUsed: a.llmUsed,
      model: a.model,
      quality: a.quality,
    })),
  }, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
`;

// Prefer tsx if available for TS path aliases
const tsxBin = path.join(root, 'node_modules', '.bin', 'tsx');
const child = spawn(
  tsxBin,
  ['-e', runner.replace(/require\('\.\/lib\/content-os'\)/, "require('./lib/content-os/index.ts')")],
  {
    cwd: root,
    env: process.env,
    stdio: 'inherit',
  },
);

child.on('exit', (code) => process.exit(code || 0));
