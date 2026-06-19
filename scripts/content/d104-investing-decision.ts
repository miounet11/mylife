// v5-D104 (2026-05-24): 投资品类 × 命理决策 SEO 长文批量生产
//
// 8 投资品类 × 6 决策 = 48 篇中文 published；后续 D105 跑多语种翻译。
//
// 用法：
//   npx tsx scripts/content/d104-investing-decision.ts
//   DRY=1 ONLY="gold-go-or-wait" npx tsx scripts/content/d104-investing-decision.ts

import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd());

import OpenAI from 'openai';
import { saveManagedContentEntry } from '@/lib/content-store';
import { getApiBaseUrl, getApiKey } from '@/lib/env';
import { getModelFallbackChain } from '@/lib/llm-model-fallback';
import { buildVirtualBaziFact, formatFactPackForPrompt, VirtualBaziFact } from '@/lib/forum/virtual-bazi-fact';
import Database from 'better-sqlite3';
import path from 'node:path';

const DRY = process.env.DRY === '1';
const ONLY = process.env.ONLY || '';
const CONCURRENCY = Math.max(1, Math.min(30, Number(process.env.CONCURRENCY) || 20));

// 8 个投资品类
const ASSETS = [
  { key: 'gold', label: '黄金与贵金属', shortLabel: '黄金', focus: '避险定位、央行购金周期、纸黄金 vs 实物、波段 vs 长持' },
  { key: 'reits', label: 'REITs 与房地产基金', shortLabel: 'REITs', focus: '现金流分红、利率敏感、底层资产、海外 REITs vs 国内' },
  { key: 'bonds', label: '债券与利率产品', shortLabel: '债券', focus: '国债/企业债/可转债、久期、信用风险、利率周期' },
  { key: 'crypto', label: '数字货币', shortLabel: '数字货币', focus: '高波动、合约爆仓、合规边界、长期配置 vs 投机、家庭资产比例' },
  { key: 'overseas-assets', label: '海外资产配置', shortLabel: '海外资产', focus: '汇率、税务、QDII/港美股、分散风险、家族资产传承' },
  { key: 'insurance', label: '保险与年金', shortLabel: '保险', focus: '重疾/医疗/意外/年金、保额测算、退保陷阱、家庭主力险' },
  { key: 'forex', label: '外汇与杠杆', shortLabel: '外汇', focus: '高杠杆、平台风险、跨周期持仓、心理强度、家庭资金红线' },
  { key: 'collectibles', label: '收藏品与另类投资', shortLabel: '收藏品', focus: '艺术品/古董/手表、流动性差、鉴定风险、文化偏好' },
];

// 6 个核心决策
const DECISIONS = [
  { key: 'go-or-wait', label: '入场还是观望', topic: '财富', q: '在这个投资品类下，命盘里的哪些组合是"该建仓"信号？哪些是"该再等等"信号？' },
  { key: 'best-timing', label: '最佳节奏与周期', topic: '财富', q: '什么大运/流年/月支组合下，这种品类的进出场成功率显著高？' },
  { key: 'allocation-ratio', label: '配置比例与家庭仓位', topic: '财富', q: '命盘里的财星/比劫/印星结构怎么提示这个品类应该占家庭资产的多少？' },
  { key: 'risk-control', label: '风险控制与止损', topic: '财富', q: '出现什么命盘组合或市场信号时，这个品类应该立刻减仓或离场？' },
  { key: 'partner-or-alone', label: '独立操作 vs 听从顾问', topic: '财富', q: '命盘里什么组合提示当事人这个品类适合自己研究，什么组合提示必须找专业顾问？' },
  { key: 'long-term-strategy', label: '长期持有策略', topic: '财富', q: '抛开短期波动，命盘怎么提示这个品类对当事人的长期角色（核心 vs 卫星）？' },
];

interface Spec {
  asset: typeof ASSETS[number];
  decision: typeof DECISIONS[number];
  slug: string;
  keyword: string;
}

function gatherSpecs(): Spec[] {
  const out: Spec[] = [];
  for (const a of ASSETS) {
    for (const d of DECISIONS) {
      const slug = `${a.key}-${d.key}`;
      if (ONLY && slug !== ONLY) continue;
      out.push({
        asset: a,
        decision: d,
        slug,
        keyword: `${a.shortLabel}${d.label}`,
      });
    }
  }
  return out;
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

const SYSTEM_PROMPT = `你是世界易学（World Yi）资深主编，特别擅长把命理判断接到具体投资品类决策里。给你一个【投资品类 × 决策类型】组合 + 3 个引擎跑出的真实虚拟命盘事实包，请产出一篇高质量长篇 SEO 知识词条。

【铁律】
1. 关于命理判断（日主/格局/用神/大运/流年/十神 — 尤其财星/比劫/印星组合），只能引用我提供的"命盘事实清单"，不允许编造清单外的命理结论。
2. 提到具体四柱/格局/用神时必须与清单对得上，不能换字。
3. 这是"投资品类 × 决策"主题，行文要兼顾 (a) 该品类真实市场结构（流动性/费率/税务/监管）和 (b) 命理结构如何在每个决策点放大或抑制风险。
4. 绝对不能给出"必涨必跌"的预言，要用"在这种结构下，X 类信号出现时该怎么响应"的判断顺序语言。
5. 必须明确：投资有风险，命理只是节律辅助参考，不能代替专业理财建议。

【输出 JSON 结构】
{
  "title": "20-32 字，命中关键词，体现品类 + 决策类型，专业不浮夸",
  "excerpt": "80-140 字摘要，第一句直接说这个品类做这种决策的核心难点",
  "seoTitle": "≤56 字 SEO 标题，命中品类 + 决策关键词",
  "seoDescription": "120-160 字 SEO 描述",
  "tags": ["投资品类","决策主题","命理工具","世界易"],
  "sections": [
    { "title": "为什么这个决策在这个品类尤其难", "paragraphs": ["...3-4 段：市场结构 + 心理偏差 + 命理结构同时叠加..."] },
    { "title": "命理判断的三个核心维度", "paragraphs": ["...3-4 段：日主与财星 / 比劫与共担 / 流年大运冲合..."] },
    { "title": "三个真实命盘案例", "paragraphs": ["案例 1（基于事实包1）...","案例 2（基于事实包2）...","案例 3（基于事实包3）..."] },
    { "title": "这个品类常见的误判与盲点", "paragraphs": ["...2-4 段..."] },
    { "title": "实操判断顺序", "paragraphs": ["...2-3 段：怎么排查、什么时候适合行动、什么时候等待..."] },
    { "title": "FAQ", "paragraphs": ["问题 1：...\\n答：...","问题 2：...\\n答：...","问题 3：...\\n答：..."] }
  ]
}

每段 paragraph 100-220 字，整篇 1800-2800 字。中文行文平实专业，避免营销腔，避免 markdown 加粗，避免无序列表，整段中文行文。

【输出格式】只输出 JSON，不要 markdown 代码块包裹。`;

function buildUserPrompt(spec: Spec, facts: VirtualBaziFact[]): string {
  const factBlock = facts.map((f, i) => `## 命盘事实包 ${i + 1}\n${formatFactPackForPrompt(f)}`).join('\n\n');
  return `投资品类：${spec.asset.label}
该品类典型市场焦点：${spec.asset.focus}
决策类型：${spec.decision.label}（主题：${spec.decision.topic}）
核心问题：${spec.decision.q}

${factBlock}

请产出一篇围绕"${spec.keyword}"的长篇 SEO 知识文。"三个真实命盘案例"段必须分别对应事实包 1/2/3，每个案例：
1. 简述事实包给出的日主/格局/用神/当前大运（特别注意财星/比劫/印星组合）
2. 把这个命盘放进"${spec.asset.label}"的真实市场博弈里
3. 解释命盘特征如何在"${spec.decision.label}"这个决策里被放大或被对冲
4. 给出一条具体的判断顺序建议（不是占卜结论，必须配合专业理财建议）

请严格按 system 要求输出 JSON。`;
}

interface DraftResult {
  spec: Spec;
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

async function generateOne(openai: OpenAI, model: string, spec: Spec): Promise<DraftResult> {
  const facts: VirtualBaziFact[] = [];
  let attempts = 0;
  const seed0 = Date.now() ^ Array.from(spec.slug).reduce((s, c) => s + c.charCodeAt(0), 0);
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
  if (title.length < 8 || sections.length < 4) return { spec, ok: false, error: `validate fail title=${title.length} sections=${sections.length}` };

  return { spec, ok: true, payload: { title, excerpt, seoTitle, seoDescription, tags, sections } };
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
  if (!apiKey) { console.error('[d104] API_KEY missing'); process.exit(1); }
  const model = getModelFallbackChain(undefined, 'content')[0];
  if (!model) { console.error('[d104] no model'); process.exit(1); }

  const dbPath = path.join(process.cwd(), 'data/lifekline.db');
  const db = new Database(dbPath, { readonly: true });
  const existing = new Set((db.prepare("SELECT slug FROM content_entries WHERE content_type='knowledge'").all() as Array<{ slug: string }>).map((r) => r.slug));
  db.close();

  const allSpecs = gatherSpecs();
  const specs = allSpecs.filter(s => !existing.has(s.slug));
  console.log(`[d104] specs total=${allSpecs.length} skip_existing=${allSpecs.length - specs.length} todo=${specs.length} model=${model} concurrency=${CONCURRENCY} dry=${DRY}`);
  if (!specs.length) { console.log('[d104] nothing to do'); return; }

  const openai = new OpenAI({ apiKey, baseURL: getApiBaseUrl(), timeout: 90000, maxRetries: 1 });

  const t0 = Date.now();
  const jobs = specs.map((s) => () => generateOne(openai, model, s));
  const results = await pool(jobs, CONCURRENCY);
  const elapsed = Date.now() - t0;

  let ok = 0, fail = 0, saved = 0;
  for (const r of results) {
    if (!r.ok || !r.payload) {
      fail += 1;
      console.error(`  fail [${r.spec?.slug}] ${r.error}`);
      continue;
    }
    ok += 1;
    if (DRY) {
      console.log(`  dry [${r.spec.slug}] title="${r.payload.title}" sections=${r.payload.sections.length}`);
      continue;
    }
    try {
      saveManagedContentEntry({
        contentType: 'knowledge',
        subtype: 'investing-decision',
        slug: r.spec.slug,
        title: r.payload.title,
        name: null,
        excerpt: r.payload.excerpt,
        category: r.spec.decision.topic,
        readTime: `${Math.max(8, Math.min(18, Math.ceil(r.payload.sections.flatMap(s => s.paragraphs).join('').length / 250)))} 分钟阅读`,
        tags: r.payload.tags.length ? r.payload.tags : [r.spec.asset.shortLabel, r.spec.decision.topic, '投资', '世界易'],
        featured: false,
        seoTitle: r.payload.seoTitle || `${r.spec.keyword} | 世界易学`,
        seoDescription: r.payload.seoDescription || r.payload.excerpt,
        sections: r.payload.sections,
        status: 'published',
        source: 'engine-llm:investing-decision',
        meta: {
          asset: r.spec.asset.key,
          assetLabel: r.spec.asset.label,
          decision: r.spec.decision.key,
          decisionLabel: r.spec.decision.label,
          topic: r.spec.decision.topic,
          keyword: r.spec.keyword,
          generationVersion: 'v5-D104',
        },
      }, 'system:d104');
      saved += 1;
    } catch (err) {
      console.error(`  save fail [${r.spec.slug}]:`, (err as Error).message.slice(0, 200));
    }
  }

  console.log(`[d104] ok=${ok} fail=${fail} saved=${saved} / ${specs.length} in ${(elapsed / 1000).toFixed(1)}s`);
}

main().catch((err) => {
  console.error('[d104] fatal:', err);
  process.exit(1);
});
