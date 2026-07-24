#!/usr/bin/env node
/**
 * Batch page illustrations via inping OpenAI-compatible Images API.
 *
 * Models:
 *   - gpt-image-2     complex explainers / report diagrams (default for complex)
 *   - z-image-turbo   small icons / simple assets (~20x faster)
 *
 * Auth (never commit):
 *   PAGE_ILLUST_API_BASE=https://ttqq.inping.com
 *   PAGE_ILLUST_API_KEY=sk-...
 *
 *   node scripts/page-illustrations/generate.mjs --concurrency 5 --limit 10
 *   node scripts/page-illustrations/generate.mjs --model z-image-turbo --only PI-HOME-01
 *   node scripts/page-illustrations/generate.mjs --force   # regenerate even if ready
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../..');
const outDir = path.join(root, 'public/images/page-illustrations/raw');
const publicDir = path.join(root, 'public/images/page-illustrations');

const base = (process.env.PAGE_ILLUST_API_BASE || 'https://ttqq.inping.com').replace(/\/$/, '');
const apiKey =
  process.env.PAGE_ILLUST_API_KEY ||
  process.env.OPENAI_API_KEY ||
  process.env.PAGE_ILLUST_OPENAI_KEY ||
  '';

const MODEL_COMPLEX = process.env.PAGE_ILLUST_MODEL_COMPLEX || 'gpt-image-2';
// Aggregate gateway default: grok-imagine-image-lite (inping)
const MODEL_TURBO = process.env.PAGE_ILLUST_MODEL_TURBO || 'grok-imagine-image-lite';

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  if (i < 0) return fallback;
  return process.argv[i + 1] ?? fallback;
}
function flag(name) {
  return process.argv.includes(`--${name}`);
}

const concurrency = Math.max(1, Number(arg('concurrency', '5')));
const limit = Math.max(1, Number(arg('limit', '50')));
const force = flag('force');
const only = arg('only', '');
const forceModel = arg('model', ''); // gpt-image-2 | z-image-turbo | auto

const STYLE_ZH_CN = [
  'Editorial product diagram for Life K-Line (人生K线), Chinese decision-support app.',
  'Clean Linear UI aesthetic, soft paper background, muted ink blue accents, geometric diagrams,',
  'minimal icons, high readability, no crystal ball, no horror, no superstition marketing slogans,',
  'no watermark. Clear Simplified Chinese labels where text appears.',
].join(' ');

const STYLE_ZH_HANT = [
  'Editorial product diagram for Life K-Line (人生K線) for Traditional Chinese readers (Taiwan/HK).',
  'Clean Linear UI aesthetic, soft paper background, muted ink blue accents, geometric diagrams,',
  'minimal icons, high readability, no crystal ball, no horror, no superstition marketing slogans,',
  'no watermark. All UI labels MUST be Traditional Chinese (繁體中文) only.',
].join(' ');

const STYLE_EN = [
  'Editorial product diagram for Life K-Line for English and overseas Chinese users.',
  'Clean Linear UI aesthetic, soft paper background, muted ink blue accents, geometric diagrams,',
  'minimal icons, high readability, no crystal ball, no horror, no superstition marketing slogans,',
  'no watermark. All UI labels MUST be clear English (Birth form, Report, Advisor, Day master, Favorable window).',
  'SEO educational diagram: Bazi, Four Pillars of Destiny, life rhythm, decision support.',
].join(' ');

function styleFor(entry) {
  const loc = entry.locale || 'zh-CN';
  if (loc === 'en') return STYLE_EN;
  if (loc === 'zh-Hant') return STYLE_ZH_HANT;
  return STYLE_ZH_CN;
}

const CATALOG = JSON.parse(
  fs.readFileSync(path.join(root, 'lib/page-illustrations/catalog.export.json'), 'utf8'),
);

function pickModel(entry) {
  if (forceModel && forceModel !== 'auto') return forceModel;
  // catalog may set complexity: 'complex' | 'simple'
  if (entry.complexity === 'simple' || entry.model === MODEL_TURBO) return MODEL_TURBO;
  if (entry.complexity === 'complex' || entry.model === MODEL_COMPLEX) return MODEL_COMPLEX;
  // Heuristic: icon/1:1/small → turbo; full explainer → gpt-image-2
  if (entry.aspectRatio === '1:1' || entry.role === 'icon' || /icon|badge|chip/i.test(entry.id + entry.filename)) {
    return MODEL_TURBO;
  }
  return MODEL_COMPLEX;
}

function sizeFor(entry, model) {
  if (model === MODEL_TURBO) {
    if (entry.aspectRatio === '1:1') return '1024x1024';
    return '1024x1024'; // turbo often square-native; still ok for small assets
  }
  // gpt-image-2: prefer landscape for explainers
  if (entry.aspectRatio === '1:1') return '1024x1024';
  if (entry.aspectRatio === '3:2') return '1536x1024';
  return '1536x1024'; // 16:9-ish landscape
}

function publicExists(entry) {
  const baseName = entry.filename.replace(/\.(webp|png|jpe?g)$/i, '');
  return ['.jpg', '.jpeg', '.png', '.webp'].some((ext) =>
    fs.existsSync(path.join(publicDir, baseName + ext)),
  );
}

async function generateOne(entry) {
  const model = pickModel(entry);
  const style = styleFor(entry);
  const prompt = `${entry.prompt || entry.title}\n\n${style}\nAspect ${entry.aspectRatio || '16:9'}. Locale=${entry.locale || 'zh-CN'}.`;
  const size = sizeFor(entry, model);
  const started = Date.now();

  const res = await fetch(`${base}/v1/images/generations`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      prompt,
      size,
      n: 1,
      response_format: 'b64_json',
    }),
  });

  if (!res.ok) {
    const t = await res.text();
    throw new Error(`${entry.id} ${model} ${res.status} ${t.slice(0, 400)}`);
  }

  const data = await res.json();
  const b64 = data.data?.[0]?.b64_json;
  const url = data.data?.[0]?.url;
  fs.mkdirSync(outDir, { recursive: true });

  const rawName = (entry.filename || `${entry.id}.png`).replace(/\.(webp|jpe?g)$/i, '.png');
  const dest = path.join(outDir, rawName);

  if (b64) {
    fs.writeFileSync(dest, Buffer.from(b64, 'base64'));
  } else if (url) {
    // cluster-internal URLs may fail from laptop; prefer b64
    const img = await fetch(url);
    if (!img.ok) throw new Error(`${entry.id} url fetch ${img.status}`);
    fs.writeFileSync(dest, Buffer.from(await img.arrayBuffer()));
  } else {
    throw new Error(`${entry.id} no image payload`);
  }

  const ms = Date.now() - started;
  console.log(`ok ${entry.id} model=${model} ${ms}ms → ${path.relative(root, dest)}`);
  return { id: entry.id, model, ms, dest };
}

async function pool(items, size, worker) {
  let i = 0;
  const results = [];
  const runners = Array.from({ length: size }, async () => {
    while (i < items.length) {
      const idx = i++;
      results[idx] = await worker(items[idx]);
    }
  });
  await Promise.all(runners);
  return results;
}

async function main() {
  if (!apiKey) {
    console.error('Set PAGE_ILLUST_API_KEY (or OPENAI_API_KEY). Never commit secrets.');
    process.exit(1);
  }

  let pending = CATALOG.filter((e) => e.id && (e.prompt || e.title));
  if (only) {
    pending = pending.filter((e) => e.id === only || e.filename === only);
  }
  if (!force) {
    pending = pending.filter((e) => !e.ready || !publicExists(e));
  }
  pending = pending.slice(0, limit);

  console.log(
    JSON.stringify(
      {
        base,
        concurrency,
        limit: pending.length,
        force,
        modelDefault: forceModel || 'auto',
        complex: MODEL_COMPLEX,
        turbo: MODEL_TURBO,
      },
      null,
      0,
    ),
  );

  if (!pending.length) {
    console.log('nothing to generate');
    return;
  }

  const results = await pool(pending, concurrency, async (entry) => {
    try {
      return await generateOne(entry);
    } catch (err) {
      console.error('fail', entry.id, err.message || err);
      return { id: entry.id, error: String(err.message || err) };
    }
  });

  const ok = results.filter((r) => r && !r.error).length;
  const fail = results.filter((r) => r && r.error).length;
  console.log(`done ok=${ok} fail=${fail} — next: node scripts/page-illustrations/optimize.mjs`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
