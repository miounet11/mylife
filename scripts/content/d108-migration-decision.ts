// v5-D108 (2026-05-25): 海外移民/置业 × 命理决策 SEO 长文批量生产
//
// 8 移民/海居目的地 × 6 决策 = 48 篇中文 published；后续 D109 跑多语种翻译。
//
// 用法：
//   npx tsx scripts/content/d108-migration-decision.ts
//   DRY=1 ONLY="us-go-or-wait" npx tsx scripts/content/d108-migration-decision.ts

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

// 8 个目的地（覆盖华人主要外迁/海居路径）
const DESTINATIONS = [
  { key: 'us', label: '美国（工作签证 / 投资移民 / 学签转身份）', shortLabel: '美国', focus: '签证排期、税法穿透、医疗自费、枪支治安、教育阶层、政治不确定' },
  { key: 'canada', label: '加拿大（技术移民 / 团聚 / 留学转 PR）', shortLabel: '加拿大', focus: '高税负、冬季漫长、医疗排队、产业单薄、房价分化' },
  { key: 'australia', label: '澳大利亚（189/190/482 工作签）', shortLabel: '澳洲', focus: '资源经济周期、地理孤立、签证清单变动、配偶就业难' },
  { key: 'singapore', label: '新加坡（EP/PR / 家族办公室）', shortLabel: '新加坡', focus: '税友好但生活费高、教育竞争、组屋限制、政策收紧' },
  { key: 'japan', label: '日本（经营管理签 / 高度人才 / 留学转工作）', shortLabel: '日本', focus: '语言门槛、长期签到入籍周期、社会融入慢、地震/老龄化' },
  { key: 'europe', label: '欧洲（葡西希黄金签 / 德法工签 / 英 Sponsor）', shortLabel: '欧洲', focus: '税务复杂、语言碎片、身份层级、脱欧/政策摇摆' },
  { key: 'middle-east', label: '中东（迪拜/沙特工作居留 / 自贸区）', shortLabel: '中东', focus: '免税但生活成本高、宗教文化、雇主依附、长期身份难' },
  { key: 'southeast-asia', label: '东南亚（泰马印越数字游民 / 第二居所）', shortLabel: '东南亚', focus: '签证灰区、医疗参差、汇率波动、子女教育衔接' },
];

// 6 个核心决策
const DECISIONS = [
  { key: 'go-or-wait', label: '现在该走还是再等', topic: '迁徙', q: '命盘里的哪些组合是"该出门"信号？哪些是"该再扎根本地"信号？' },
  { key: 'best-timing', label: '最佳出境与递件节奏', topic: '迁徙', q: '什么大运/流年/月支组合下，办理签证、递件、登陆的成功率显著高？' },
  { key: 'family-or-solo', label: '一人先行还是举家同行', topic: '迁徙', q: '命盘里的比劫/财星/官杀结构怎么提示这个目的地适合一人探路、举家同迁还是分居两地？' },
  { key: 'asset-allocation', label: '资产搬运规模与节奏', topic: '迁徙', q: '出现什么命盘组合时该轻装走？什么组合可以承受重资产搬运/海外置业？' },
  { key: 'persist-or-return', label: '坚持留下还是回流', topic: '迁徙', q: '在这个国家撞墙时，命盘里什么组合提示该熬过去，什么组合提示必须回头？' },
  { key: 'identity-strategy', label: '身份路径与转换时机', topic: '迁徙', q: '命盘怎么提示从工作签 → PR → 入籍这条路径上的关键窗口和代价？' },
];

interface Spec {
  destination: typeof DESTINATIONS[number];
  decision: typeof DECISIONS[number];
  slug: string;
  keyword: string;
}

function gatherSpecs(): Spec[] {
  const out: Spec[] = [];
  for (const a of DESTINATIONS) {
    for (const d of DECISIONS) {
      const slug = `${a.key}-${d.key}`;
      if (ONLY && slug !== ONLY) continue;
      out.push({
        destination: a,
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

const SYSTEM_PROMPT = `你是世界易学（World Yi）资深主编，特别擅长把命理判断接到具体海外迁徙/置业决策里。给你一个【目的地 × 决策类型】组合 + 3 个引擎跑出的真实虚拟命盘事实包，请产出一篇高质量长篇 SEO 知识词条。

【铁律】
1. 关于命理判断（日主/格局/用神/大运/流年/十神 — 尤其财星/比劫/官杀/印星/驿马组合），只能引用我提供的"命盘事实清单"，不允许编造清单外的命理结论。
2. 提到具体四柱/格局/用神时必须与清单对得上，不能换字。
3. 这是"目的地 × 决策"主题，行文要兼顾 (a) 该目的地真实迁徙结构（签证/税务/教育/医疗/文化）和 (b) 命理结构如何在每个决策点放大或抑制风险。
4. 绝对不能给出"必成必败"的预言，要用"在这种结构下，X 类信号出现时该怎么响应"的判断顺序语言。
5. 必须明确：跨境迁徙涉及法律、税务、签证、外汇合规，命理只是节律辅助参考，不能代替专业移民/法税/财务建议。

【输出 JSON 结构】
{
  "title": "20-32 字，命中关键词，体现目的地 + 决策类型，专业不浮夸",
  "excerpt": "80-140 字摘要，第一句直接说去这个目的地做这种决策的核心难点",
  "seoTitle": "≤56 字 SEO 标题，命中目的地 + 决策关键词",
  "seoDescription": "120-160 字 SEO 描述",
  "tags": ["目的地","决策主题","命理工具","世界易"],
  "sections": [
    { "title": "为什么这个决策在这个目的地尤其难", "paragraphs": ["...3-4 段：迁徙结构 + 心理偏差 + 命理结构同时叠加..."] },
    { "title": "命理判断的三个核心维度", "paragraphs": ["...3-4 段：日主与驿马 / 财星与异乡谋财 / 官杀与外籍身份压力 / 流年大运冲合..."] },
    { "title": "三个真实命盘案例", "paragraphs": ["案例 1（基于事实包1）...","案例 2（基于事实包2）...","案例 3（基于事实包3）..."] },
    { "title": "这个目的地常见的误判与盲点", "paragraphs": ["...2-4 段..."] },
    { "title": "实操判断顺序", "paragraphs": ["...2-3 段：怎么排查、什么时候适合行动、什么时候等待..."] },
    { "title": "FAQ", "paragraphs": ["问题 1：...\\n答：...","问题 2：...\\n答：...","问题 3：...\\n答：..."] }
  ]
}

每段 paragraph 100-220 字，整篇 1800-2800 字。中文行文平实专业，避免营销腔，避免 markdown 加粗，避免无序列表，整段中文行文。

【输出格式】只输出 JSON，不要 markdown 代码块包裹。`;

function buildUserPrompt(spec: Spec, facts: VirtualBaziFact[]): string {
  const factBlock = facts.map((f, i) => `## 命盘事实包 ${i + 1}\n${formatFactPackForPrompt(f)}`).join('\n\n');
  return `目的地：${spec.destination.label}
该目的地典型迁徙焦点：${spec.destination.focus}
决策类型：${spec.decision.label}（主题：${spec.decision.topic}）
核心问题：${spec.decision.q}

${factBlock}

请产出一篇围绕"${spec.keyword}"的长篇 SEO 知识文。"三个真实命盘案例"段必须分别对应事实包 1/2/3，每个案例：
1. 简述事实包给出的日主/格局/用神/当前大运（特别注意财星/比劫/官杀/印星/驿马组合）
2. 把这个命盘放进"${spec.destination.label}"的真实迁徙博弈里
3. 解释命盘特征如何在"${spec.decision.label}"这个决策里被放大或被对冲
4. 给出一条具体的判断顺序建议（不是占卜结论，必须配合专业移民/法税/财务建议）

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
  if (!apiKey) { console.error('[d108] API_KEY missing'); process.exit(1); }
  const model = getModelFallbackChain(undefined, 'content')[0];
  if (!model) { console.error('[d108] no model'); process.exit(1); }

  const dbPath = path.join(process.cwd(), 'data/lifekline.db');
  const db = new Database(dbPath, { readonly: true });
  const existing = new Set((db.prepare("SELECT slug FROM content_entries WHERE content_type='knowledge'").all() as Array<{ slug: string }>).map((r) => r.slug));
  db.close();

  const allSpecs = gatherSpecs();
  const specs = allSpecs.filter(s => !existing.has(s.slug));
  console.log(`[d108] specs total=${allSpecs.length} skip_existing=${allSpecs.length - specs.length} todo=${specs.length} model=${model} concurrency=${CONCURRENCY} dry=${DRY}`);
  if (!specs.length) { console.log('[d108] nothing to do'); return; }

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
        subtype: 'migration-decision',
        slug: r.spec.slug,
        title: r.payload.title,
        name: null,
        excerpt: r.payload.excerpt,
        category: r.spec.decision.topic,
        readTime: `${Math.max(8, Math.min(18, Math.ceil(r.payload.sections.flatMap(s => s.paragraphs).join('').length / 250)))} 分钟阅读`,
        tags: r.payload.tags.length ? r.payload.tags : [r.spec.destination.shortLabel, r.spec.decision.topic, '迁徙', '世界易'],
        featured: false,
        seoTitle: r.payload.seoTitle || `${r.spec.keyword} | 世界易学`,
        seoDescription: r.payload.seoDescription || r.payload.excerpt,
        sections: r.payload.sections,
        status: 'published',
        source: 'engine-llm:migration-decision',
        meta: {
          destination: r.spec.destination.key,
          destinationLabel: r.spec.destination.label,
          decision: r.spec.decision.key,
          decisionLabel: r.spec.decision.label,
          topic: r.spec.decision.topic,
          keyword: r.spec.keyword,
          generationVersion: 'v5-D108',
        },
      }, 'system:d108');
      saved += 1;
    } catch (err) {
      console.error(`  save fail [${r.spec.slug}]:`, (err as Error).message.slice(0, 200));
    }
  }

  console.log(`[d108] ok=${ok} fail=${fail} saved=${saved} / ${specs.length} in ${(elapsed / 1000).toFixed(1)}s`);
}

main().catch((err) => {
  console.error('[d108] fatal:', err);
  process.exit(1);
});
