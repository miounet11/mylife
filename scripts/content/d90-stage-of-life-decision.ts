// v5-D90 (2026-05-24): 人生阶段 × 命理决策 SEO 长文批量生产
//
// 复用 D86 模板（引擎事实包 + LLM 修饰）。
// 6 个人生阶段 × 8 个核心决策 = 48 篇中文 published。后续 D91 跑多语种翻译。
//
// 用法：
//   npx tsx scripts/content/d90-stage-of-life-decision.ts
//   DRY=1 ONLY="adulthood-career-startup-vs-employed" npx tsx scripts/content/d90-stage-of-life-decision.ts

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

// 6 个人生阶段（明确年龄区间，便于 SEO 命中长尾）
const STAGES = [
  { key: 'youth', label: '青年初定型期 18-25', shortLabel: '青年' , ageBand: '18-25 岁', focus: '自我认同、专业方向、第一段独立生活' },
  { key: 'early-adulthood', label: '择业关键期 25-32', shortLabel: '择业期', ageBand: '25-32 岁', focus: '第一次职业路径定位、跳槽、深造、城市选择' },
  { key: 'partnership', label: '婚恋成家期 28-36', shortLabel: '婚恋期', ageBand: '28-36 岁', focus: '伴侣选择、婚姻择时、首套房、人生伴侣谈判' },
  { key: 'parenthood', label: '为人父母期 30-42', shortLabel: '父母期', ageBand: '30-42 岁', focus: '生育时机、抚养、家庭节奏、双线职业' },
  { key: 'midlife', label: '中年转折期 38-52', shortLabel: '中年', ageBand: '38-52 岁', focus: '事业天花板、健康警号、二次方向、亲子关系成熟' },
  { key: 'late-life', label: '半退休/晚年 55+', shortLabel: '晚年', ageBand: '55 岁后', focus: '退休节奏、健康管理、隔代关系、传承与放手' },
];

// 8 个核心决策（每阶段都共用，但内容会被阶段语境塑形）
const DECISIONS = [
  { key: 'career-startup-vs-employed', label: '创业还是打工', topic: '事业', q: '在这个人生阶段，命盘怎么判断更适合自己开局还是稳定推进？' },
  { key: 'home-buying-window', label: '买房择时', topic: '财富', q: '这个阶段买房的最佳窗口与最坏窗口分别是什么样的命局组合？' },
  { key: 'partner-selection', label: '伴侣选择', topic: '关系', q: '当前阶段择偶时，命盘里的节奏与边界提示哪些是该聚焦的信号？' },
  { key: 'fertility-timing', label: '生育时机', topic: '家庭', q: '什么时间窗口、什么命盘组合下生育对夫妻双方负担最小？' },
  { key: 'parenting-rhythm', label: '抚养节奏', topic: '家庭', q: '不同日主父母在这个阶段对孩子要松还是要紧？' },
  { key: 'health-warning-signal', label: '健康警号识别', topic: '健康', q: '这个阶段身体最容易先击穿哪个系统，命理与现实信号怎么对照？' },
  { key: 'eldercare-or-distance', label: '赡养与距离', topic: '家庭', q: '在父母年长、自己事业上升期之间，什么样的命局更适合贴身照护？' },
  { key: 'second-direction-pivot', label: '二次方向转向', topic: '事业', q: '想换赛道时，命盘怎么提示是真的"该换"还是只是阶段性疲倦？' },
];

interface Spec {
  stage: typeof STAGES[number];
  decision: typeof DECISIONS[number];
  slug: string;
  keyword: string;
}

function gatherSpecs(): Spec[] {
  const out: Spec[] = [];
  for (const stage of STAGES) {
    for (const decision of DECISIONS) {
      const slug = `${stage.key}-${decision.key}`;
      if (ONLY && slug !== ONLY) continue;
      out.push({
        stage,
        decision,
        slug,
        keyword: `${stage.shortLabel}${decision.label}`,
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

const SYSTEM_PROMPT = `你是世界易学（World Yi）资深主编。给你一个【人生阶段 + 决策类型】组合 + 3 个引擎跑出的真实虚拟命盘事实包，请产出一篇高质量长篇 SEO 知识词条。

【铁律】
1. 关于命理判断（日主/格局/用神/大运/流年/十神/宫位），只能引用我提供的"命盘事实清单"，不允许编造清单外的命理结论。
2. 提到具体四柱/格局/用神时必须与清单对得上，不能换字。
3. 这是"人生阶段 × 决策"主题，行文要兼顾 (a) 该阶段普遍现实困境（身份、亲密关系、身体、责任、社会期待）和 (b) 命理判断如何在这个阶段被放大或抑制。

【输出 JSON 结构】
{
  "title": "20-32 字，命中关键词，体现人生阶段 + 决策类型，专业不浮夸",
  "excerpt": "80-140 字摘要，第一句直接回答这个阶段做这种决策的核心难点",
  "seoTitle": "≤56 字 SEO 标题，命中阶段 + 决策关键词",
  "seoDescription": "120-160 字 SEO 描述",
  "tags": ["人生阶段","年龄段","决策主题","命理工具","世界易"],
  "sections": [
    { "title": "为什么这个决策在这个人生阶段尤其难", "paragraphs": ["...3-4 段：阶段性现实约束 + 社会期待 + 命理结构同时叠加..."] },
    { "title": "命理判断的三个核心维度", "paragraphs": ["...3-4 段：日主/格局/用神 / 流年大运 / 宫位环境..."] },
    { "title": "三个真实命盘案例", "paragraphs": ["案例 1（基于事实包1）...","案例 2（基于事实包2）...","案例 3（基于事实包3）..."] },
    { "title": "这个阶段常见的误判与盲点", "paragraphs": ["...2-4 段..."] },
    { "title": "实操判断顺序", "paragraphs": ["...2-3 段：怎么排查、什么时候适合行动、什么时候等待..."] },
    { "title": "FAQ", "paragraphs": ["问题 1：...\\n答：...","问题 2：...\\n答：...","问题 3：...\\n答：..."] }
  ]
}

每段 paragraph 100-220 字，整篇 1800-2800 字。中文行文平实专业，避免营销腔，避免 markdown 加粗，避免无序列表，整段中文行文。

【输出格式】只输出 JSON，不要 markdown 代码块包裹。`;

function buildUserPrompt(spec: Spec, facts: VirtualBaziFact[]): string {
  const factBlock = facts.map((f, i) => `## 命盘事实包 ${i + 1}\n${formatFactPackForPrompt(f)}`).join('\n\n');
  return `人生阶段：${spec.stage.label}（${spec.stage.ageBand}）
阶段焦点：${spec.stage.focus}
决策类型：${spec.decision.label}（主题：${spec.decision.topic}）
核心问题：${spec.decision.q}

${factBlock}

请产出一篇围绕"${spec.keyword}"的长篇 SEO 知识文。"三个真实命盘案例"段必须分别对应事实包 1/2/3，每个案例：
1. 简述事实包给出的日主/格局/用神/当前大运
2. 把这个命盘放进"${spec.stage.label}"的阶段现实约束里
3. 解释命盘特征如何在"${spec.decision.label}"这个决策里被放大或被对冲
4. 给出一条具体的判断顺序建议（不是占卜结论）

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
  if (!apiKey) { console.error('[d90] API_KEY missing'); process.exit(1); }
  const model = getModelFallbackChain(undefined, 'content')[0];
  if (!model) { console.error('[d90] no model'); process.exit(1); }

  const dbPath = path.join(process.cwd(), 'data/lifekline.db');
  const db = new Database(dbPath, { readonly: true });
  const existing = new Set(db.prepare("SELECT slug FROM content_entries WHERE content_type='knowledge'").all().map((r: { slug: string }) => r.slug));
  db.close();

  const allSpecs = gatherSpecs();
  const specs = allSpecs.filter(s => !existing.has(s.slug));
  console.log(`[d90] specs total=${allSpecs.length} skip_existing=${allSpecs.length - specs.length} todo=${specs.length} model=${model} concurrency=${CONCURRENCY} dry=${DRY}`);
  if (!specs.length) { console.log('[d90] nothing to do'); return; }

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
        subtype: 'stage-of-life-decision',
        slug: r.spec.slug,
        title: r.payload.title,
        name: null,
        excerpt: r.payload.excerpt,
        category: r.spec.decision.topic,
        readTime: `${Math.max(8, Math.min(18, Math.ceil(r.payload.sections.flatMap(s => s.paragraphs).join('').length / 250)))} 分钟阅读`,
        tags: r.payload.tags.length ? r.payload.tags : [r.spec.stage.shortLabel, r.spec.decision.topic, '人生阶段', '世界易'],
        featured: false,
        seoTitle: r.payload.seoTitle || `${r.spec.keyword} | 世界易学`,
        seoDescription: r.payload.seoDescription || r.payload.excerpt,
        sections: r.payload.sections,
        status: 'published',
        source: 'engine-llm:stage-of-life-decision',
        meta: {
          stage: r.spec.stage.key,
          stageLabel: r.spec.stage.label,
          ageBand: r.spec.stage.ageBand,
          decision: r.spec.decision.key,
          decisionLabel: r.spec.decision.label,
          topic: r.spec.decision.topic,
          keyword: r.spec.keyword,
          generationVersion: 'v5-D90',
        },
      }, 'system:d90');
      saved += 1;
    } catch (err) {
      console.error(`  save fail [${r.spec.slug}]:`, (err as Error).message.slice(0, 200));
    }
  }

  console.log(`[d90] ok=${ok} fail=${fail} saved=${saved} / ${specs.length} in ${(elapsed / 1000).toFixed(1)}s`);
}

main().catch((err) => {
  console.error('[d90] fatal:', err);
  process.exit(1);
});
