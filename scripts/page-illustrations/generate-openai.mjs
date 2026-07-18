#!/usr/bin/env node
/**
 * Optional batch generator via OpenAI Images API (gpt-image-2).
 * Requires OPENAI_API_KEY in env. Never commit keys.
 *
 *   OPENAI_API_KEY=... node scripts/page-illustrations/generate-openai.mjs --concurrency 5 --limit 10
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../..');
const outDir = path.join(root, 'public/images/page-illustrations/raw');
const model = process.env.PAGE_ILLUST_OPENAI_MODEL || 'gpt-image-2';
const apiKey = process.env.OPENAI_API_KEY || process.env.PAGE_ILLUST_OPENAI_KEY || '';

const concurrency = Number(
  process.argv.includes('--concurrency')
    ? process.argv[process.argv.indexOf('--concurrency') + 1]
    : 5,
);
const limit = Number(
  process.argv.includes('--limit')
    ? process.argv[process.argv.indexOf('--limit') + 1]
    : 10,
);

const STYLE = [
  'Editorial product diagram for Life K-Line (人生K线), Chinese decision-support app.',
  'Clean Linear UI aesthetic, soft paper background, muted ink blue accents, geometric diagrams,',
  'minimal icons, high readability, no crystal ball, no horror, no superstition marketing slogans,',
  'no watermark. Clear Chinese labels where text appears.',
].join(' ');

// Keep in sync with lib/page-illustrations/catalog.ts (subset for script portability)
const CATALOG = JSON.parse(
  fs.readFileSync(path.join(root, 'lib/page-illustrations/catalog.export.json'), 'utf8'),
);

async function generateOne(entry) {
  const prompt = `${entry.prompt}\n\n${STYLE}\nAspect ${entry.aspectRatio || '16:9'}.`;
  const res = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      prompt,
      size: '1536x1024',
      n: 1,
    }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`${entry.id} ${res.status} ${t.slice(0, 400)}`);
  }
  const data = await res.json();
  const b64 = data.data?.[0]?.b64_json;
  const url = data.data?.[0]?.url;
  fs.mkdirSync(outDir, { recursive: true });
  const rawName = entry.filename.replace(/\.webp$/i, '.png');
  const dest = path.join(outDir, rawName);
  if (b64) {
    fs.writeFileSync(dest, Buffer.from(b64, 'base64'));
  } else if (url) {
    const img = await fetch(url);
    fs.writeFileSync(dest, Buffer.from(await img.arrayBuffer()));
  } else {
    throw new Error(`${entry.id} no image payload`);
  }
  console.log('ok', entry.id, dest);
}

async function pool(items, size, worker) {
  let i = 0;
  const runners = Array.from({ length: size }, async () => {
    while (i < items.length) {
      const idx = i++;
      await worker(items[idx]);
    }
  });
  await Promise.all(runners);
}

async function main() {
  if (!apiKey) {
    console.error('Set OPENAI_API_KEY (or PAGE_ILLUST_OPENAI_KEY)');
    process.exit(1);
  }
  const pending = CATALOG.filter((e) => !e.ready).slice(0, limit);
  console.log('model', model, 'concurrency', concurrency, 'count', pending.length);
  await pool(pending, Math.max(1, concurrency), generateOne);
  console.log('done — run: node scripts/page-illustrations/optimize.mjs');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
