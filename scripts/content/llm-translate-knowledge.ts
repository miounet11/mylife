// v5-D80 多语种翻译试点：D77 53 条命理百科 → 英文
// slug 加 -en 后缀，meta.locale=en，路由零改动；hreflang 互链通过 meta.alternateLanguages 实现
//
// 用法: npx tsx scripts/content/llm-translate-knowledge.ts [source?] [targetLocale?] [contentType?]
//   source: 默认 engine-llm:encyclopedia
//   targetLocale: 默认 en
//   contentType: 默认 knowledge（可选 case）

import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd());

import OpenAI from 'openai';
import { db } from '@/lib/database';
import { saveManagedContentEntry } from '@/lib/content-store';
import { getApiBaseUrl, getApiKey } from '@/lib/env';
import { getModelFallbackChain } from '@/lib/llm-model-fallback';
import type { ContentSection } from '@/lib/content';

const SOURCE = process.argv[2] || 'engine-llm:encyclopedia';
const TARGET_LOCALE = process.argv[3] || 'en';
const CONTENT_TYPE = (process.argv[4] || 'knowledge') as 'knowledge' | 'case' | 'insight';
const CONCURRENCY = Math.max(1, Math.min(50, Number(process.env.FORUM_LLM_CONCURRENCY) || 50));

interface SrcEntry {
  id: string;
  slug: string;
  subtype: string | null;
  title: string;
  excerpt: string;
  category: string | null;
  read_time: string | null;
  tags: string;
  seo_title: string;
  seo_description: string;
  sections: string;
  meta: string;
}

function listSrcEntries(): SrcEntry[] {
  return db.prepare(
    `SELECT id, slug, subtype, title, excerpt, category, read_time, tags, seo_title, seo_description, sections, meta
     FROM content_entries WHERE source = ? AND status = 'published'`,
  ).all(SOURCE) as SrcEntry[];
}

const LOCALE_LABEL: Record<string, string> = {
  en: 'English',
  ja: 'Japanese',
  'zh-Hant': 'Traditional Chinese',
};

const SYSTEM_PROMPT = (locale: string) => `You are a senior bilingual content editor specializing in Chinese metaphysics (BaZi / Five Elements / Eight Trigrams).
Translate the given Chinese article into ${LOCALE_LABEL[locale] || locale}.

Strict rules:
1. Keep all metaphysics facts unchanged: pillars (干支), Day Master, Five Elements (Wood/Fire/Earth/Metal/Water), pattern names, Yong Shen / Ji Shen, Da Yun / Liu Nian. Do not invent new metaphysics claims.
2. For Chinese metaphysics terms, use the standard transliterations and add brief explanations in parentheses where needed:
   - 天干 = Heavenly Stems
   - 地支 = Earthly Branches
   - 日主 = Day Master
   - 用神 = Yong Shen (favorable element)
   - 忌神 = Ji Shen (unfavorable element)
   - 大运 = Da Yun (decade luck cycle)
   - 流年 = Liu Nian (annual fortune)
   - 比肩/劫财/食神/伤官/偏财/正财/七杀/正官/偏印/正印 = Bi Jian / Jie Cai / Shi Shen / Shang Guan / Pian Cai / Zheng Cai / Qi Sha / Zheng Guan / Pian Yin / Zheng Yin
   - For specific stems/branches like 甲乙丙丁戊己庚辛壬癸/子丑寅卯辰巳午未申酉戌亥, keep the Chinese character with pinyin in parentheses on first use, e.g. "甲 (Jia)".
3. Preserve all section titles and paragraph counts. Do not merge or split paragraphs.
4. Translate seoTitle (≤60 chars), seoDescription (120-160 chars in target language).
5. Output natural professional ${LOCALE_LABEL[locale] || locale}, not robotic literal translation.

Output JSON only, no markdown wrapper:
{
  "title": "translated title",
  "excerpt": "translated excerpt",
  "seoTitle": "translated seo title",
  "seoDescription": "translated seo description",
  "tags": ["tag1","tag2"],
  "sections": [
    { "title": "translated section title", "paragraphs": ["translated paragraph 1", "..."] }
  ]
}`;

function buildUserPrompt(src: SrcEntry, sections: ContentSection[]): string {
  return `Title: ${src.title}
Excerpt: ${src.excerpt}
SEO Title: ${src.seo_title}
SEO Description: ${src.seo_description}
Tags: ${src.tags}

Sections (JSON):
${JSON.stringify(sections, null, 2)}

Translate following the rules. Output JSON only.`;
}

interface Result {
  src: SrcEntry;
  ok: boolean;
  error?: string;
  payload?: { title: string; excerpt: string; seoTitle: string; seoDescription: string; tags: string[]; sections: ContentSection[] };
}

function tryParseObject(raw: string): unknown {
  let s = raw.trim();
  if (s.startsWith('```')) s = s.replace(/^```(?:json)?/i, '').replace(/```\s*$/, '').trim();
  const lo = s.indexOf('{');
  const hi = s.lastIndexOf('}');
  if (lo < 0 || hi < 0 || hi <= lo) return null;
  try { return JSON.parse(s.slice(lo, hi + 1)); } catch { return null; }
}

async function translateOne(openai: OpenAI, model: string, src: SrcEntry): Promise<Result> {
  let sections: ContentSection[];
  try {
    sections = JSON.parse(src.sections);
  } catch {
    return { src, ok: false, error: 'sections parse fail' };
  }
  let raw = '';
  try {
    const resp = await openai.chat.completions.create({
      model,
      temperature: 0.4,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT(TARGET_LOCALE) },
        { role: 'user', content: buildUserPrompt(src, sections) },
      ],
    });
    raw = resp.choices?.[0]?.message?.content || '';
  } catch (err) {
    return { src, ok: false, error: 'llm err: ' + (err as Error).message.slice(0, 200) };
  }
  const parsed = tryParseObject(raw);
  if (!parsed || typeof parsed !== 'object') return { src, ok: false, error: 'parse fail' };
  const o = parsed as Record<string, unknown>;
  const title = typeof o.title === 'string' ? o.title.trim() : '';
  const excerpt = typeof o.excerpt === 'string' ? o.excerpt.trim() : '';
  const seoTitle = typeof o.seoTitle === 'string' ? o.seoTitle.trim() : '';
  const seoDescription = typeof o.seoDescription === 'string' ? o.seoDescription.trim() : '';
  const tags = Array.isArray(o.tags) ? (o.tags as unknown[]).filter((t) => typeof t === 'string').slice(0, 6) as string[] : [];
  const sectionsRaw = Array.isArray(o.sections) ? o.sections : [];
  const outSections: ContentSection[] = [];
  for (const s of sectionsRaw) {
    if (!s || typeof s !== 'object') continue;
    const so = s as Record<string, unknown>;
    const stitle = typeof so.title === 'string' ? so.title.trim() : '';
    const paragraphs = Array.isArray(so.paragraphs) ? (so.paragraphs as unknown[]).filter((p) => typeof p === 'string' && (p as string).trim().length > 0).map((p) => (p as string).trim()) : [];
    if (stitle && paragraphs.length) outSections.push({ title: stitle, paragraphs });
  }
  if (title.length < 4 || outSections.length < 3) return { src, ok: false, error: `validate fail title=${title.length} sections=${outSections.length}` };
  return { src, ok: true, payload: { title, excerpt, seoTitle, seoDescription, tags, sections: outSections } };
}

async function pool<T>(jobs: Array<() => Promise<T>>, concurrency: number): Promise<T[]> {
  const out: T[] = new Array(jobs.length);
  let cursor = 0;
  async function worker() {
    while (true) {
      const idx = cursor++;
      if (idx >= jobs.length) return;
      try { out[idx] = await jobs[idx](); }
      catch (err) { out[idx] = { ok: false, error: (err as Error).message } as unknown as T; }
    }
  }
  await Promise.all(new Array(Math.min(concurrency, jobs.length)).fill(0).map(() => worker()));
  return out;
}

async function main() {
  const apiKey = getApiKey();
  if (!apiKey) { console.error('[d80] API_KEY missing'); process.exit(1); }
  const model = getModelFallbackChain(undefined, 'content')[0];
  if (!model) { console.error('[d80] no model'); process.exit(1); }

  const entries = listSrcEntries();
  console.log(`[d80] source=${SOURCE} → locale=${TARGET_LOCALE}; entries=${entries.length} model=${model} concurrency=${CONCURRENCY}`);
  if (!entries.length) { console.log('[d80] nothing to do'); return; }

  // 跳过已翻译过的
  const existedSlugs = new Set(
    (db.prepare(`SELECT slug FROM content_entries WHERE source = ?`).all(`${SOURCE}:${TARGET_LOCALE}`) as Array<{ slug: string }>).map((r) => r.slug),
  );
  const todo = entries.filter((e) => !existedSlugs.has(`${e.slug}-${TARGET_LOCALE}`));
  console.log(`[d80] todo=${todo.length} (skipped existed=${entries.length - todo.length})`);
  if (!todo.length) return;

  const openai = new OpenAI({ apiKey, baseURL: getApiBaseUrl(), timeout: 60000, maxRetries: 1 });
  const t0 = Date.now();
  const jobs = todo.map((e) => () => translateOne(openai, model, e));
  const results = await pool(jobs, CONCURRENCY);
  const elapsed = Date.now() - t0;

  let ok = 0, fail = 0, saved = 0;
  for (const r of results) {
    if (!r.ok || !r.payload) {
      fail += 1;
      console.error(`  fail [${r.src?.slug}] ${r.error}`);
      continue;
    }
    ok += 1;
    let srcMeta: Record<string, unknown> = {};
    try { srcMeta = JSON.parse(r.src.meta || '{}'); } catch { /* ignore */ }
    const targetSlug = `${r.src.slug}-${TARGET_LOCALE}`;
    try {
      saveManagedContentEntry({
        contentType: CONTENT_TYPE,
        subtype: r.src.subtype || null,
        slug: targetSlug,
        title: r.payload.title,
        name: null,
        excerpt: r.payload.excerpt,
        category: r.src.category,
        readTime: r.src.read_time,
        tags: r.payload.tags.length ? r.payload.tags : [CONTENT_TYPE, TARGET_LOCALE],
        featured: false,
        seoTitle: r.payload.seoTitle || r.payload.title,
        seoDescription: r.payload.seoDescription || r.payload.excerpt,
        sections: r.payload.sections,
        status: 'published',  // 翻译质量已被 fact-pack 锁定，直接发
        source: `${SOURCE}:${TARGET_LOCALE}`,
        meta: {
          ...srcMeta,
          locale: TARGET_LOCALE,
          originalSlug: r.src.slug,
          generationVersion: 'v5-D80',
        },
      }, 'system:d80');
      saved += 1;
    } catch (err) {
      console.error(`  save fail [${targetSlug}]:`, (err as Error).message.slice(0, 200));
    }
  }
  console.log(`[d80] ok=${ok} fail=${fail} saved=${saved} / ${todo.length} in ${(elapsed / 1000).toFixed(1)}s`);
}

main().catch((err) => { console.error('[d80] FATAL:', err); process.exit(99); });
