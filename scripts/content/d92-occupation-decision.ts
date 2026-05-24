// v5-D92 (2026-05-24): 行业职业 × 命理决策 SEO 长文批量生产
//
// 复用 D90 模板（引擎事实包 + LLM 修饰）。
// 12 个职业 × 4 个决策 = 48 篇中文 published；后续 D93 跑多语种翻译。
//
// 用法：
//   npx tsx scripts/content/d92-occupation-decision.ts
//   DRY=1 ONLY="programmer-fit-with-bazi" npx tsx scripts/content/d92-occupation-decision.ts

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

// 12 个核心行业（覆盖技术/医疗/法律/金融/创意/教育/政务/服务/制造）
const OCCUPATIONS = [
  { key: 'programmer', label: '程序员', shortLabel: '程序员', tenGod: '偏印/食神', traits: '逻辑闭环、独处续航、长链思考、版本节奏、夜班高峰' },
  { key: 'doctor', label: '医生', shortLabel: '医生', tenGod: '正印/七杀', traits: '高责任、值夜班、应激判断、伦理压力、长期培训' },
  { key: 'teacher', label: '教师', shortLabel: '教师', tenGod: '正印/伤官', traits: '稳定节奏、表达输出、情绪劳动、寒暑假节律、群体管理' },
  { key: 'lawyer', label: '律师', shortLabel: '律师', tenGod: '七杀/伤官', traits: '高强度对抗、卷宗细节、客户压力、口才表达、风险敏感' },
  { key: 'finance', label: '金融从业', shortLabel: '金融', tenGod: '正财/偏财', traits: '数字敏感、风险胃口、客户关系、波动期心态、合规约束' },
  { key: 'designer', label: '设计师', shortLabel: '设计师', tenGod: '伤官/食神', traits: '审美直觉、客户反复、加班集中、自由职业波动、灵感周期' },
  { key: 'salesperson', label: '销售', shortLabel: '销售', tenGod: '正财/七杀', traits: '业绩硬指标、客户拒绝、人际能耗、出差节奏、收入波动' },
  { key: 'entrepreneur', label: '创业者', shortLabel: '创业者', tenGod: '七杀/偏财', traits: '资金压力、招人留人、政策风险、家庭兼顾、个人英雄期' },
  { key: 'civil-servant', label: '公务员', shortLabel: '公务员', tenGod: '正官/正印', traits: '稳定与上升慢、组织内政、考核排队、地域绑定、福利结构' },
  { key: 'media-creator', label: '媒体内容创作者', shortLabel: '内容创作者', tenGod: '伤官/食神', traits: '流量周期、平台依赖、个人 IP、起伏剧烈、表达边界' },
  { key: 'engineer', label: '工程师', shortLabel: '工程师', tenGod: '偏印/正官', traits: '现场作业、项目周期、安全红线、工地家两地、晋升结构' },
  { key: 'caregiver', label: '护理/养老/服务行业', shortLabel: '护理服务', tenGod: '正印/食神', traits: '情绪劳动、轮班、低单价高频次、人际倦怠、女性占比' },
];

// 4 个核心决策（每职业都共用）
const DECISIONS = [
  { key: 'fit-with-bazi', label: '行业适配性', topic: '事业', q: '这种命盘做这一行真的合适吗？哪些结构特征是天然加分、哪些是消耗？' },
  { key: 'pivot-timing', label: '跳槽与转型时机', topic: '事业', q: '什么大运/流年组合下这一行的人转型成功率显著高？什么组合下应该熬住？' },
  { key: 'startup-vs-employed', label: '自立门户 vs 留组织', topic: '事业', q: '对于这一行的从业者，命盘里什么样的组合更适合自立门户？什么组合更适合在体制内深耕？' },
  { key: 'side-hustle-direction', label: '副业方向', topic: '财富', q: '这一行的人发展副业时，命盘里的食伤/财星/印星结构如何提示主攻方向？' },
];

interface Spec {
  occupation: typeof OCCUPATIONS[number];
  decision: typeof DECISIONS[number];
  slug: string;
  keyword: string;
}

function gatherSpecs(): Spec[] {
  const out: Spec[] = [];
  for (const occ of OCCUPATIONS) {
    for (const dec of DECISIONS) {
      const slug = `${occ.key}-${dec.key}`;
      if (ONLY && slug !== ONLY) continue;
      out.push({
        occupation: occ,
        decision: dec,
        slug,
        keyword: `${occ.shortLabel}${dec.label}`,
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

const SYSTEM_PROMPT = `你是世界易学（World Yi）资深主编，特别擅长把命理判断接到具体职业语境里。给你一个【职业 × 决策类型】组合 + 3 个引擎跑出的真实虚拟命盘事实包，请产出一篇高质量长篇 SEO 知识词条。

【铁律】
1. 关于命理判断（日主/格局/用神/大运/流年/十神/宫位），只能引用我提供的"命盘事实清单"，不允许编造清单外的命理结论。
2. 提到具体四柱/格局/用神时必须与清单对得上，不能换字。
3. 这是"职业 × 决策"主题，行文要兼顾 (a) 该职业真实工作场景与压力（节奏/责任/收入结构/家庭冲突），和 (b) 命理结构如何在这个职业中被放大或抑制。

【输出 JSON 结构】
{
  "title": "20-32 字，命中关键词，体现职业 + 决策类型，专业不浮夸",
  "excerpt": "80-140 字摘要，第一句直接回答这个职业做这种决策的核心难点",
  "seoTitle": "≤56 字 SEO 标题，命中职业 + 决策关键词",
  "seoDescription": "120-160 字 SEO 描述",
  "tags": ["职业","行业","决策主题","命理工具","世界易"],
  "sections": [
    { "title": "为什么这个决策对这一行尤其难", "paragraphs": ["...3-4 段：行业现实约束 + 收入结构 + 命理结构同时叠加..."] },
    { "title": "命理判断的三个核心维度", "paragraphs": ["...3-4 段：日主/格局/用神 / 流年大运 / 十神组合..."] },
    { "title": "三个真实命盘案例", "paragraphs": ["案例 1（基于事实包1）...","案例 2（基于事实包2）...","案例 3（基于事实包3）..."] },
    { "title": "这一行常见的误判与盲点", "paragraphs": ["...2-4 段..."] },
    { "title": "实操判断顺序", "paragraphs": ["...2-3 段：怎么排查、什么时候适合行动、什么时候等待..."] },
    { "title": "FAQ", "paragraphs": ["问题 1：...\\n答：...","问题 2：...\\n答：...","问题 3：...\\n答：..."] }
  ]
}

每段 paragraph 100-220 字，整篇 1800-2800 字。中文行文平实专业，避免营销腔，避免 markdown 加粗，避免无序列表，整段中文行文。

【输出格式】只输出 JSON，不要 markdown 代码块包裹。`;

function buildUserPrompt(spec: Spec, facts: VirtualBaziFact[]): string {
  const factBlock = facts.map((f, i) => `## 命盘事实包 ${i + 1}\n${formatFactPackForPrompt(f)}`).join('\n\n');
  return `职业：${spec.occupation.label}
该职业常见十神主线：${spec.occupation.tenGod}
该职业典型工作特征：${spec.occupation.traits}
决策类型：${spec.decision.label}（主题：${spec.decision.topic}）
核心问题：${spec.decision.q}

${factBlock}

请产出一篇围绕"${spec.keyword}"的长篇 SEO 知识文。"三个真实命盘案例"段必须分别对应事实包 1/2/3，每个案例：
1. 简述事实包给出的日主/格局/用神/当前大运
2. 把这个命盘放进"${spec.occupation.label}"的真实工作场景里
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
  if (!apiKey) { console.error('[d92] API_KEY missing'); process.exit(1); }
  const model = getModelFallbackChain(undefined, 'content')[0];
  if (!model) { console.error('[d92] no model'); process.exit(1); }

  const dbPath = path.join(process.cwd(), 'data/lifekline.db');
  const db = new Database(dbPath, { readonly: true });
  const existing = new Set(db.prepare("SELECT slug FROM content_entries WHERE content_type='knowledge'").all().map((r: { slug: string }) => r.slug));
  db.close();

  const allSpecs = gatherSpecs();
  const specs = allSpecs.filter(s => !existing.has(s.slug));
  console.log(`[d92] specs total=${allSpecs.length} skip_existing=${allSpecs.length - specs.length} todo=${specs.length} model=${model} concurrency=${CONCURRENCY} dry=${DRY}`);
  if (!specs.length) { console.log('[d92] nothing to do'); return; }

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
        subtype: 'occupation-decision',
        slug: r.spec.slug,
        title: r.payload.title,
        name: null,
        excerpt: r.payload.excerpt,
        category: r.spec.decision.topic,
        readTime: `${Math.max(8, Math.min(18, Math.ceil(r.payload.sections.flatMap(s => s.paragraphs).join('').length / 250)))} 分钟阅读`,
        tags: r.payload.tags.length ? r.payload.tags : [r.spec.occupation.shortLabel, r.spec.decision.topic, '职业', '世界易'],
        featured: false,
        seoTitle: r.payload.seoTitle || `${r.spec.keyword} | 世界易学`,
        seoDescription: r.payload.seoDescription || r.payload.excerpt,
        sections: r.payload.sections,
        status: 'published',
        source: 'engine-llm:occupation-decision',
        meta: {
          occupation: r.spec.occupation.key,
          occupationLabel: r.spec.occupation.label,
          tenGodHint: r.spec.occupation.tenGod,
          decision: r.spec.decision.key,
          decisionLabel: r.spec.decision.label,
          topic: r.spec.decision.topic,
          keyword: r.spec.keyword,
          generationVersion: 'v5-D92',
        },
      }, 'system:d92');
      saved += 1;
    } catch (err) {
      console.error(`  save fail [${r.spec.slug}]:`, (err as Error).message.slice(0, 200));
    }
  }

  console.log(`[d92] ok=${ok} fail=${fail} saved=${saved} / ${specs.length} in ${(elapsed / 1000).toFixed(1)}s`);
}

main().catch((err) => {
  console.error('[d92] fatal:', err);
  process.exit(1);
});
