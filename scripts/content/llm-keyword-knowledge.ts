// v5-D75 78 SEO_KEYWORDS 知识库长文（引擎驱动）
// 用法: npx tsx scripts/content/llm-keyword-knowledge.ts [keyword?]
//
// 流程：
//   1) 遍历 SEO_KEYWORDS（12 类目 × 6-10 词，共 78 个）
//   2) 每个关键词调 buildVirtualBaziFact 跑 3 个真实命盘做"案例演示"
//   3) prompt 注入：定义 + 引擎事实 + FAQ 框架，LLM 只产出长文 sections
//   4) 写入 content_entries（content_type=knowledge, source=engine-llm:keyword-knowledge）
//
// 30 并发 ~30s 跑完 78 篇

import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd());

import OpenAI from 'openai';
import { CATEGORIES, SEO_KEYWORDS, CATEGORY_FAQ } from '@/lib/forum/templates';
import { saveManagedContentEntry } from '@/lib/content-store';
import { getApiBaseUrl, getApiKey } from '@/lib/env';
import { getModelFallbackChain } from '@/lib/llm-model-fallback';
import { buildVirtualBaziFact, formatFactPackForPrompt, VirtualBaziFact } from '@/lib/forum/virtual-bazi-fact';

const ONLY_KEYWORD = process.argv[2] || '';
const CONCURRENCY = Math.max(1, Math.min(50, Number(process.env.FORUM_LLM_CONCURRENCY) || 50));

interface KeywordSpec {
  keyword: string;
  categoryKey: string;
  categoryLabel: string;
  faqs: Array<{ q: string; a: string }>;
}

function gatherSpecs(): KeywordSpec[] {
  const specs: KeywordSpec[] = [];
  for (const cat of CATEGORIES) {
    const kws = SEO_KEYWORDS[cat.key] || [];
    const faqs = CATEGORY_FAQ[cat.key] || [];
    for (const kw of kws) {
      if (ONLY_KEYWORD && kw !== ONLY_KEYWORD) continue;
      specs.push({ keyword: kw, categoryKey: cat.key, categoryLabel: cat.label, faqs });
    }
  }
  return specs;
}

function makeRng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const SYSTEM_PROMPT = `你是中文命理百科主编。给你一个核心关键词、所属类目、FAQ 草稿和 3 个引擎跑出的真实虚拟命盘事实包。请产出一篇长篇知识词条。

【铁律】
1. 关于命理判断（日主/格局/用神/大运/流年），只能引用我提供的"命盘事实清单"。不允许编造清单外的命理结论。
2. 提到具体四柱/格局/用神时必须与清单对得上，不能换字。
3. FAQ 部分基于我给的草稿润色扩写，不要新增矛盾观点。

【输出 JSON 结构】
{
  "title": "16-28 字，命中关键词，是百科 / 解读 / 入门 / 完全指南风格",
  "excerpt": "60-120 字摘要",
  "seoTitle": "≤56 字，命中关键词 + 站名暗示",
  "seoDescription": "120-160 字 SEO 描述",
  "tags": ["标签1","标签2","标签3","标签4"],
  "sections": [
    { "title": "什么是 X", "paragraphs": ["...3-5 段定义和起源..."] },
    { "title": "如何看 X：核心要素", "paragraphs": ["...3-5 段方法论..."] },
    { "title": "三个真实命盘案例", "paragraphs": ["案例 1（基于事实包1）...","案例 2（基于事实包2）...","案例 3（基于事实包3）..."] },
    { "title": "常见误区", "paragraphs": ["...2-4 段..."] },
    { "title": "实操建议", "paragraphs": ["...2-3 段..."] },
    { "title": "FAQ", "paragraphs": ["问题 1：xx？\\n答：...","问题 2：xx？\\n答：...","问题 3：xx？\\n答：..."] }
  ]
}

每段 paragraph 80-200 字，整篇控制在 1500-2400 字。中文行文平实专业，避免营销腔，避免 markdown 加粗，避免列表，整段中文行文。

【输出格式】只输出 JSON，不要 markdown 代码块包裹。`;

function buildUserPrompt(spec: KeywordSpec, facts: VirtualBaziFact[]): string {
  const factBlock = facts.map((f, i) => `## 命盘事实包 ${i + 1}\n${formatFactPackForPrompt(f)}`).join('\n\n');
  const faqBlock = spec.faqs.map((f, i) => `${i + 1}. Q: ${f.q}\n   A: ${f.a}`).join('\n');
  return `核心关键词：${spec.keyword}
所属类目：${spec.categoryKey}（${spec.categoryLabel}）

${factBlock}

【可参考 FAQ 草稿（润色用）】
${faqBlock || '（暂无，FAQ 部分自行写 3 条）'}

请基于以上输出符合 system 要求的 JSON。"三个真实命盘案例"段必须分别对应事实包 1/2/3，每个案例引用清单事实做命理判断（日主/格局/用神/当前大运），并解释这个判断对"${spec.keyword}"主题的意义。`;
}

interface DraftResult {
  spec: KeywordSpec;
  ok: boolean;
  error?: string;
  payload?: {
    title: string;
    excerpt: string;
    seoTitle: string;
    seoDescription: string;
    tags: string[];
    sections: Array<{ title: string; paragraphs: string[] }>;
  };
}

function tryParseObject(raw: string): unknown {
  let s = raw.trim();
  if (s.startsWith('```')) s = s.replace(/^```(?:json)?/i, '').replace(/```\s*$/, '').trim();
  const lo = s.indexOf('{');
  const hi = s.lastIndexOf('}');
  if (lo < 0 || hi < 0 || hi <= lo) return null;
  try {
    return JSON.parse(s.slice(lo, hi + 1));
  } catch {
    return null;
  }
}

function slugify(keyword: string): string {
  // 中文 keyword 直接 encode 不行，统一用 keyword 做 slug（已有 D64 中文 slug 经验）
  return encodeURIComponent(keyword.trim());
}

async function generateOne(openai: OpenAI, model: string, spec: KeywordSpec): Promise<DraftResult> {
  // 3 份引擎事实包
  const facts: VirtualBaziFact[] = [];
  let attempts = 0;
  const seed0 = Date.now() ^ Array.from(spec.keyword).reduce((s, c) => s + c.charCodeAt(0), 0);
  while (facts.length < 3 && attempts < 12) {
    const f = buildVirtualBaziFact(makeRng(seed0 + attempts * 7919));
    if (f) facts.push(f);
    attempts += 1;
  }
  if (facts.length < 3) return { spec, ok: false, error: 'engine fact pack 不足' };

  let raw = '';
  try {
    const resp = await openai.chat.completions.create({
      model,
      temperature: 0.7,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: buildUserPrompt(spec, facts) },
      ],
    });
    raw = resp.choices?.[0]?.message?.content || '';
  } catch (err) {
    return { spec, ok: false, error: 'llm err: ' + (err as Error).message.slice(0, 200) };
  }

  const parsed = tryParseObject(raw);
  if (!parsed || typeof parsed !== 'object') return { spec, ok: false, error: 'parse fail' };
  const o = parsed as Record<string, unknown>;
  const title = typeof o.title === 'string' ? o.title.trim() : '';
  const excerpt = typeof o.excerpt === 'string' ? o.excerpt.trim() : '';
  const seoTitle = typeof o.seoTitle === 'string' ? o.seoTitle.trim() : '';
  const seoDescription = typeof o.seoDescription === 'string' ? o.seoDescription.trim() : '';
  const tags = Array.isArray(o.tags) ? (o.tags as unknown[]).filter((t) => typeof t === 'string').slice(0, 6) as string[] : [];
  const sectionsRaw = Array.isArray(o.sections) ? o.sections : [];
  const sections: Array<{ title: string; paragraphs: string[] }> = [];
  for (const s of sectionsRaw) {
    if (!s || typeof s !== 'object') continue;
    const so = s as Record<string, unknown>;
    const stitle = typeof so.title === 'string' ? so.title.trim() : '';
    const paragraphs = Array.isArray(so.paragraphs)
      ? (so.paragraphs as unknown[]).filter((p) => typeof p === 'string' && (p as string).trim().length > 0).map((p) => (p as string).trim())
      : [];
    if (stitle && paragraphs.length) sections.push({ title: stitle, paragraphs });
  }
  if (title.length < 6 || sections.length < 4) return { spec, ok: false, error: `validate fail title=${title.length} sections=${sections.length}` };

  return {
    spec,
    ok: true,
    payload: { title, excerpt, seoTitle, seoDescription, tags, sections },
  };
}

async function pool<T>(jobs: Array<() => Promise<T>>, concurrency: number): Promise<T[]> {
  const out: T[] = new Array(jobs.length);
  let cursor = 0;
  async function worker() {
    while (true) {
      const idx = cursor++;
      if (idx >= jobs.length) return;
      try {
        out[idx] = await jobs[idx]();
      } catch (err) {
        out[idx] = { ok: false, error: (err as Error).message } as unknown as T;
      }
    }
  }
  await Promise.all(new Array(Math.min(concurrency, jobs.length)).fill(0).map(() => worker()));
  return out;
}

async function main() {
  const apiKey = getApiKey();
  if (!apiKey) { console.error('[d75] API_KEY missing'); process.exit(1); }
  const model = getModelFallbackChain(undefined, 'content')[0];
  if (!model) { console.error('[d75] no model'); process.exit(1); }

  const specs = gatherSpecs();
  console.log(`[d75] specs=${specs.length} model=${model} concurrency=${CONCURRENCY}`);
  if (!specs.length) { console.log('[d75] nothing to do'); return; }

  const openai = new OpenAI({ apiKey, baseURL: getApiBaseUrl(), timeout: 60000, maxRetries: 1 });

  const t0 = Date.now();
  const jobs = specs.map((s) => () => generateOne(openai, model, s));
  const results = await pool(jobs, CONCURRENCY);
  const elapsed = Date.now() - t0;

  let ok = 0, fail = 0, saved = 0;
  for (const r of results) {
    if (!r.ok || !r.payload) {
      fail += 1;
      console.error(`  fail [${r.spec?.keyword}] ${r.error}`);
      continue;
    }
    ok += 1;
    const slug = slugify(r.spec.keyword);
    try {
      saveManagedContentEntry({
        contentType: 'knowledge',
        subtype: r.spec.categoryKey,
        slug,
        title: r.payload.title,
        name: null,
        excerpt: r.payload.excerpt,
        category: r.spec.categoryLabel,
        readTime: `${Math.max(6, Math.min(15, Math.ceil(r.payload.sections.flatMap(s => s.paragraphs).join('').length / 250)))} 分钟阅读`,
        tags: r.payload.tags.length ? r.payload.tags : [r.spec.keyword, r.spec.categoryLabel],
        featured: false,
        seoTitle: r.payload.seoTitle || `${r.spec.keyword} | 世界易学`,
        seoDescription: r.payload.seoDescription || r.payload.excerpt,
        sections: r.payload.sections,
        status: 'draft', // 安全起见入草稿，人工抽审后批量发
        source: 'engine-llm:keyword-knowledge',
        meta: {
          keyword: r.spec.keyword,
          categoryKey: r.spec.categoryKey,
          generationVersion: 'v5-D75',
        },
      }, 'system:d75');
      saved += 1;
    } catch (err) {
      console.error(`  save fail [${r.spec.keyword}]:`, (err as Error).message.slice(0, 200));
    }
  }

  console.log(`[d75] ok=${ok} fail=${fail} saved=${saved} / ${specs.length} in ${(elapsed / 1000).toFixed(1)}s`);
}

main().catch((err) => { console.error('[d75] FATAL:', err); process.exit(99); });
