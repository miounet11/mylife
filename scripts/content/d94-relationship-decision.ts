// v5-D94 (2026-05-24): 婚恋 × 命理决策 SEO 长文批量生产
//
// 复用 D92 模板（引擎事实包 + LLM 修饰）。
// 8 个婚恋场景 × 6 个核心决策 = 48 篇中文 published；后续 D95 跑多语种翻译。
//
// 用法：
//   npx tsx scripts/content/d94-relationship-decision.ts
//   DRY=1 ONLY="dating-early-stage-fit-or-pass" npx tsx scripts/content/d94-relationship-decision.ts

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

// 8 个婚恋场景（覆盖单身→相亲→恋爱→订婚→结婚→婚后→冲突→离婚）
const SCENES = [
  { key: 'long-single', label: '长期单身', shortLabel: '长期单身', focus: '社交圈固定、择偶标准漂移、被动期 vs 主动期判断' },
  { key: 'blind-date', label: '相亲', shortLabel: '相亲', focus: '父母介入、效率压力、第一面信号、家境匹配' },
  { key: 'dating-early', label: '恋爱初期', shortLabel: '恋爱初期', focus: '情绪激活、合不合适未定、推进节奏、原生家庭对照' },
  { key: 'dating-stable', label: '稳定恋爱', shortLabel: '稳定恋爱', focus: '是否要进婚姻、磨合疲劳、双方家庭见面、买房与城市' },
  { key: 'engagement', label: '订婚与彩礼', shortLabel: '订婚', focus: '彩礼金额博弈、双方家庭压力、订婚到婚礼时间窗' },
  { key: 'marriage-newlywed', label: '婚后磨合', shortLabel: '婚后磨合', focus: '生活习惯冲击、姻缘宫位变动、第一年最易爆发' },
  { key: 'marriage-conflict', label: '婚姻冲突期', shortLabel: '婚姻冲突', focus: '七年之痒、子女牵绊、第三方信号、修复 vs 撤离' },
  { key: 'divorce-or-stay', label: '离婚与挽回', shortLabel: '离婚挽回', focus: '财产分割、孩子归属、二婚信号、挽回窗口' },
];

// 6 个核心决策（每场景共用）
const DECISIONS = [
  { key: 'fit-or-pass', label: '合适与否判断', topic: '关系', q: '在这个阶段，命盘里的哪些组合是"该推进"信号？哪些是"该停下"信号？' },
  { key: 'best-timing', label: '最佳推进时机', topic: '关系', q: '什么大运/流年/月支组合下，这个阶段的关键动作（表白/求婚/迁居/复合）成功率显著高？' },
  { key: 'family-pressure-handling', label: '父母与原生家庭压力', topic: '家庭', q: '父母反对或催促时，命盘里的印星/官杀结构怎么判断该听还是该顶？' },
  { key: 'money-and-marriage', label: '彩礼/嫁妆/共同财产', topic: '财富', q: '这个阶段的财务博弈，命盘里的财星/比劫结构怎么提示底线与让步？' },
  { key: 'red-flag-signal', label: '危险信号识别', topic: '关系', q: '这个阶段对方/自己的命盘里出现什么组合时，应该立刻警觉？' },
  { key: 'recovery-or-leave', label: '修复 vs 撤离', topic: '关系', q: '当前阶段已经出问题时，命盘怎么判断有修复空间还是该退？' },
];

interface Spec {
  scene: typeof SCENES[number];
  decision: typeof DECISIONS[number];
  slug: string;
  keyword: string;
}

function gatherSpecs(): Spec[] {
  const out: Spec[] = [];
  for (const sc of SCENES) {
    for (const dc of DECISIONS) {
      const slug = `${sc.key}-${dc.key}`;
      if (ONLY && slug !== ONLY) continue;
      out.push({
        scene: sc,
        decision: dc,
        slug,
        keyword: `${sc.shortLabel}${dc.label}`,
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

const SYSTEM_PROMPT = `你是世界易学（World Yi）资深主编，特别擅长婚恋命理判断的现实落地。给你一个【婚恋场景 × 决策类型】组合 + 3 个引擎跑出的真实虚拟命盘事实包，请产出一篇高质量长篇 SEO 知识词条。

【铁律】
1. 关于命理判断（日主/格局/用神/大运/流年/十神/宫位 — 尤其夫妻宫与配偶星），只能引用我提供的"命盘事实清单"，不允许编造清单外的命理结论。
2. 提到具体四柱/格局/用神时必须与清单对得上，不能换字。
3. 这是"婚恋 × 决策"主题，行文要兼顾 (a) 中国当代婚恋的真实社会压力（彩礼/房子/双方家庭/孩子归属/性别期待）和 (b) 命理结构如何在这个场景中放大或抑制冲突。
4. 不能用算命腔说"会离婚""必白头"，要用"在这种结构下，X 类信号出现时该怎么处理"的判断顺序语言。

【输出 JSON 结构】
{
  "title": "20-32 字，命中关键词，体现婚恋场景 + 决策类型，专业不浮夸",
  "excerpt": "80-140 字摘要，第一句直接说这个场景做这种决策的核心难点",
  "seoTitle": "≤56 字 SEO 标题，命中场景 + 决策关键词",
  "seoDescription": "120-160 字 SEO 描述",
  "tags": ["婚恋阶段","决策主题","命理工具","世界易"],
  "sections": [
    { "title": "为什么这个决策在这个婚恋阶段尤其难", "paragraphs": ["...3-4 段：阶段性现实约束 + 双方家庭立场 + 命理结构同时叠加..."] },
    { "title": "命理判断的三个核心维度", "paragraphs": ["...3-4 段：日主/夫妻宫 / 配偶星位置 / 流年大运冲合..."] },
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
  return `婚恋场景：${spec.scene.label}
该场景典型现实焦点：${spec.scene.focus}
决策类型：${spec.decision.label}（主题：${spec.decision.topic}）
核心问题：${spec.decision.q}

${factBlock}

请产出一篇围绕"${spec.keyword}"的长篇 SEO 知识文。"三个真实命盘案例"段必须分别对应事实包 1/2/3，每个案例：
1. 简述事实包给出的日主/格局/用神/当前大运（特别注意夫妻宫与配偶星）
2. 把这个命盘放进"${spec.scene.label}"的现实场景里
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
  if (!apiKey) { console.error('[d94] API_KEY missing'); process.exit(1); }
  const model = getModelFallbackChain(undefined, 'content')[0];
  if (!model) { console.error('[d94] no model'); process.exit(1); }

  const dbPath = path.join(process.cwd(), 'data/lifekline.db');
  const db = new Database(dbPath, { readonly: true });
  const existing = new Set((db.prepare("SELECT slug FROM content_entries WHERE content_type='knowledge'").all() as Array<{ slug: string }>).map((r) => r.slug));
  db.close();

  const allSpecs = gatherSpecs();
  const specs = allSpecs.filter(s => !existing.has(s.slug));
  console.log(`[d94] specs total=${allSpecs.length} skip_existing=${allSpecs.length - specs.length} todo=${specs.length} model=${model} concurrency=${CONCURRENCY} dry=${DRY}`);
  if (!specs.length) { console.log('[d94] nothing to do'); return; }

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
        subtype: 'relationship-decision',
        slug: r.spec.slug,
        title: r.payload.title,
        name: null,
        excerpt: r.payload.excerpt,
        category: r.spec.decision.topic,
        readTime: `${Math.max(8, Math.min(18, Math.ceil(r.payload.sections.flatMap(s => s.paragraphs).join('').length / 250)))} 分钟阅读`,
        tags: r.payload.tags.length ? r.payload.tags : [r.spec.scene.shortLabel, r.spec.decision.topic, '婚恋', '世界易'],
        featured: false,
        seoTitle: r.payload.seoTitle || `${r.spec.keyword} | 世界易学`,
        seoDescription: r.payload.seoDescription || r.payload.excerpt,
        sections: r.payload.sections,
        status: 'published',
        source: 'engine-llm:relationship-decision',
        meta: {
          scene: r.spec.scene.key,
          sceneLabel: r.spec.scene.label,
          decision: r.spec.decision.key,
          decisionLabel: r.spec.decision.label,
          topic: r.spec.decision.topic,
          keyword: r.spec.keyword,
          generationVersion: 'v5-D94',
        },
      }, 'system:d94');
      saved += 1;
    } catch (err) {
      console.error(`  save fail [${r.spec.slug}]:`, (err as Error).message.slice(0, 200));
    }
  }

  console.log(`[d94] ok=${ok} fail=${fail} saved=${saved} / ${specs.length} in ${(elapsed / 1000).toFixed(1)}s`);
}

main().catch((err) => {
  console.error('[d94] fatal:', err);
  process.exit(1);
});
