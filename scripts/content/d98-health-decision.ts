// v5-D98 (2026-05-24): 健康 × 命理决策 SEO 长文批量生产
//
// 复用 D96 模板（引擎事实包 + LLM 修饰）。
// 8 个健康场景 × 6 个核心决策 = 48 篇中文 published；后续 D99 跑多语种翻译。
//
// 用法：
//   npx tsx scripts/content/d98-health-decision.ts
//   DRY=1 ONLY="chronic-fatigue-go-or-rest" npx tsx scripts/content/d98-health-decision.ts

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

// 8 个健康场景（覆盖慢性病/睡眠/情绪/重大手术/生育/老年/运动/亚健康）
const SCENES = [
  { key: 'chronic-fatigue', label: '慢性疲劳与亚健康', shortLabel: '慢性疲劳', focus: '长期低能量、夜寝不安、肝胆肠胃信号、隐性消耗' },
  { key: 'sleep-disorder', label: '失眠与睡眠紊乱', shortLabel: '失眠', focus: '入睡难、易醒、多梦、夜间焦虑、节律错乱' },
  { key: 'emotional-distress', label: '情绪与心理压力', shortLabel: '情绪困扰', focus: '抑郁倾向、焦虑、惊恐、内耗、躯体化' },
  { key: 'major-surgery', label: '重大手术与重病决断', shortLabel: '重病决断', focus: '是否手术、术式选择、择医、术后恢复、家庭支持' },
  { key: 'fertility-health', label: '生育与备孕健康', shortLabel: '备孕健康', focus: '受孕窗口、调理周期、试管选择、孕期风险' },
  { key: 'eldercare-health', label: '老年慢病与照护', shortLabel: '老年照护', focus: '高血压糖尿病、跌倒、记忆衰退、长期用药、家属代决' },
  { key: 'fitness-rhythm', label: '运动与体能管理', shortLabel: '运动节奏', focus: '锻炼方式、强度、季节性、伤病预防、肝肾保护' },
  { key: 'preventive-checkup', label: '体检与早筛择时', shortLabel: '体检择时', focus: '年度体检、肿瘤筛查、影像项目、家族史指引' },
];

// 6 个核心决策（每场景共用）
const DECISIONS = [
  { key: 'go-or-rest', label: '硬扛还是停下来调', topic: '健康', q: '在这个健康场景下，命盘里的哪些组合是"该立刻减负"信号？哪些是"还能再撑"信号？' },
  { key: 'best-timing', label: '介入与就医时机', topic: '健康', q: '什么大运/流年/月支组合下，这个健康决策（手术/调理/换药）成功率显著高？' },
  { key: 'self-vs-pro', label: '自我调理 vs 专业医疗', topic: '健康', q: '命盘里的哪些组合提示这个阶段适合靠自我节律恢复，哪些必须立刻进系统医疗？' },
  { key: 'family-and-care', label: '家庭照护与代决', topic: '健康', q: '在这个场景里家人介入照护时，命盘怎么提示主照护人的体力上限与照护边界？' },
  { key: 'red-flag-signal', label: '危险信号识别', topic: '健康', q: '出现什么命盘组合或现实身体信号时，这个场景应该立刻升级到专业医疗或急诊？' },
  { key: 'long-term-strategy', label: '长期养护策略', topic: '健康', q: '这个场景过去后，命盘里什么样的组合提示要长期维持哪种生活节律？' },
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

const SYSTEM_PROMPT = `你是世界易学（World Yi）资深主编，特别擅长把命理判断与中医五行/脏腑/节气接到具体健康场景里。给你一个【健康场景 × 决策类型】组合 + 3 个引擎跑出的真实虚拟命盘事实包，请产出一篇高质量长篇 SEO 知识词条。

【铁律】
1. 关于命理判断（日主/格局/用神/大运/流年/十神/五行偏旺偏衰、对应脏腑），只能引用我提供的"命盘事实清单"，不允许编造清单外的命理结论。
2. 提到具体四柱/格局/用神/五行偏向时必须与清单对得上，不能换字。
3. 这是"健康 × 决策"主题，行文要兼顾 (a) 真实身体与心理症状（失眠/疲劳/疼痛/焦虑/术后等）和 (b) 五行/脏腑对照如何辅助判断节律。
4. 绝对不能给出医疗诊断或代替医生建议，遇到红线信号必须明确提示"请立即就医"；命理只是节律参考。

【输出 JSON 结构】
{
  "title": "20-32 字，命中关键词，体现健康场景 + 决策类型，专业不浮夸",
  "excerpt": "80-140 字摘要，第一句直接说这个场景做这种决策的核心难点",
  "seoTitle": "≤56 字 SEO 标题，命中场景 + 决策关键词",
  "seoDescription": "120-160 字 SEO 描述",
  "tags": ["健康场景","决策主题","命理工具","世界易"],
  "sections": [
    { "title": "为什么这个决策在这个健康场景尤其难", "paragraphs": ["...3-4 段：症状特征 + 生活节奏冲突 + 命理结构同时叠加..."] },
    { "title": "命理与五行脏腑对照", "paragraphs": ["...3-4 段：日主与五行偏向 / 对应脏腑 / 流年大运的冲合..."] },
    { "title": "三个真实命盘案例", "paragraphs": ["案例 1（基于事实包1）...","案例 2（基于事实包2）...","案例 3（基于事实包3）..."] },
    { "title": "这个场景常见的误判与盲点", "paragraphs": ["...2-4 段，包括"命理代替医生"的红线..."] },
    { "title": "实操判断顺序", "paragraphs": ["...2-3 段：怎么排查、什么时候必须就医、什么时候可以观察..."] },
    { "title": "FAQ", "paragraphs": ["问题 1：...\\n答：...","问题 2：...\\n答：...","问题 3：...\\n答：..."] }
  ]
}

每段 paragraph 100-220 字，整篇 1800-2800 字。中文行文平实专业，避免营销腔，避免 markdown 加粗，避免无序列表，整段中文行文。

【输出格式】只输出 JSON，不要 markdown 代码块包裹。`;

function buildUserPrompt(spec: Spec, facts: VirtualBaziFact[]): string {
  const factBlock = facts.map((f, i) => `## 命盘事实包 ${i + 1}\n${formatFactPackForPrompt(f)}`).join('\n\n');
  return `健康场景：${spec.scene.label}
该场景典型现实焦点：${spec.scene.focus}
决策类型：${spec.decision.label}（主题：${spec.decision.topic}）
核心问题：${spec.decision.q}

${factBlock}

请产出一篇围绕"${spec.keyword}"的长篇 SEO 知识文。"三个真实命盘案例"段必须分别对应事实包 1/2/3，每个案例：
1. 简述事实包给出的日主/格局/用神/当前大运（特别注意五行偏旺偏衰对应脏腑）
2. 把这个命盘放进"${spec.scene.label}"的真实症状现实里
3. 解释命盘特征如何在"${spec.decision.label}"这个决策里被放大或被对冲
4. 给出一条具体的判断顺序建议（绝不代替医生诊断）

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
  if (!apiKey) { console.error('[d98] API_KEY missing'); process.exit(1); }
  const model = getModelFallbackChain(undefined, 'content')[0];
  if (!model) { console.error('[d98] no model'); process.exit(1); }

  const dbPath = path.join(process.cwd(), 'data/lifekline.db');
  const db = new Database(dbPath, { readonly: true });
  const existing = new Set(db.prepare("SELECT slug FROM content_entries WHERE content_type='knowledge'").all().map((r: { slug: string }) => r.slug));
  db.close();

  const allSpecs = gatherSpecs();
  const specs = allSpecs.filter(s => !existing.has(s.slug));
  console.log(`[d98] specs total=${allSpecs.length} skip_existing=${allSpecs.length - specs.length} todo=${specs.length} model=${model} concurrency=${CONCURRENCY} dry=${DRY}`);
  if (!specs.length) { console.log('[d98] nothing to do'); return; }

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
        subtype: 'health-decision',
        slug: r.spec.slug,
        title: r.payload.title,
        name: null,
        excerpt: r.payload.excerpt,
        category: r.spec.decision.topic,
        readTime: `${Math.max(8, Math.min(18, Math.ceil(r.payload.sections.flatMap(s => s.paragraphs).join('').length / 250)))} 分钟阅读`,
        tags: r.payload.tags.length ? r.payload.tags : [r.spec.scene.shortLabel, r.spec.decision.topic, '健康', '世界易'],
        featured: false,
        seoTitle: r.payload.seoTitle || `${r.spec.keyword} | 世界易学`,
        seoDescription: r.payload.seoDescription || r.payload.excerpt,
        sections: r.payload.sections,
        status: 'published',
        source: 'engine-llm:health-decision',
        meta: {
          scene: r.spec.scene.key,
          sceneLabel: r.spec.scene.label,
          decision: r.spec.decision.key,
          decisionLabel: r.spec.decision.label,
          topic: r.spec.decision.topic,
          keyword: r.spec.keyword,
          generationVersion: 'v5-D98',
        },
      }, 'system:d98');
      saved += 1;
    } catch (err) {
      console.error(`  save fail [${r.spec.slug}]:`, (err as Error).message.slice(0, 200));
    }
  }

  console.log(`[d98] ok=${ok} fail=${fail} saved=${saved} / ${specs.length} in ${(elapsed / 1000).toFixed(1)}s`);
}

main().catch((err) => {
  console.error('[d98] fatal:', err);
  process.exit(1);
});
