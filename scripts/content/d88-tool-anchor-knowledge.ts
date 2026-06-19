// v5-D88 (2026-05-24): 工具锚点 SEO knowledge 长文。
//
// 思路：每个 top 流量工具配一篇深度 knowledge 文，
//      "命盘解读 + 工具使用场景"，挂回工具 CTA，
//      把搜索来的人沿 knowledge → tool → analyze 漏斗推进。
//
// 顶流工具（7d sessions）：
//   application-home-order 381  / migration-stay-or-leave 310 / palmistry 153
//   migration-city-fit 146 / migration-overseas-window 126 / health-recovery 124
//   timing-yearly-window 85 / career-role-fit 83 / timing-monthly-rhythm 75
//   relationship-pace-fit 73 / application-timing-selection 56
//   relationship-boundary-conflict 46 / career-promotion-window 43
//   timing-decision-day 35 / relationship-reconciliation 35
//
// slug 格式：tool-anchor-{toolSlug}
// 每篇绑 toolSlug，前端可以从 meta.anchorToolSlug 拿 CTA。

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

interface ToolSpec {
  slug: string;
  toolSlug: string;
  toolLabel: string;
  scenario: string;
  question: string;
  topic: string;
}

const TOOL_SPECS: ToolSpec[] = [
  { slug: 'tool-anchor-application-home-order', toolSlug: 'application-home-order', toolLabel: '家宅秩序检测', scenario: '家宅磁场与生活秩序', question: '家里总觉得静不下来或恢复不过来，命理上是哪些信号在提示？', topic: '家庭' },
  { slug: 'tool-anchor-migration-stay-or-leave', toolSlug: 'migration-stay-or-leave', toolLabel: '留下还是离开', scenario: '迁移留与回决策', question: '当事业、家庭、身份三方拉扯，命理判断该留还是该走？', topic: '迁移' },
  { slug: 'tool-anchor-application-palmistry-reading', toolSlug: 'application-palmistry-reading', toolLabel: '手相图解', scenario: '手相判断', question: '手相能不能看婚姻、事业、健康？哪些线是关系信号，哪些是消耗信号？', topic: '校准' },
  { slug: 'tool-anchor-migration-city-fit', toolSlug: 'migration-city-fit', toolLabel: '城市匹配度', scenario: '换城决策', question: '同一个人在不同城市为什么状态完全不同？命盘里看的是什么？', topic: '迁移' },
  { slug: 'tool-anchor-migration-overseas-window', toolSlug: 'migration-overseas-window', toolLabel: '海外迁移窗口', scenario: '出国时间窗口', question: '什么命盘组合 + 流年组合最适合出国？什么状态下推一年再走？', topic: '迁移' },
  { slug: 'tool-anchor-health-recovery-window', toolSlug: 'health-recovery-window', toolLabel: '健康恢复窗口', scenario: '恢复周期判断', question: '日主弱、用神冲、伤官见官，对身体哪个系统消耗最快？怎么留出恢复窗口？', topic: '健康' },
  { slug: 'tool-anchor-timing-yearly-window', toolSlug: 'timing-yearly-window', toolLabel: '年度窗口', scenario: '年度运势节奏', question: '怎么读年度流年才不会被"凶年"吓到也不会错过"用神年"？', topic: '时位' },
  { slug: 'tool-anchor-career-role-fit', toolSlug: 'career-role-fit', toolLabel: '职业角色适配', scenario: '岗位与命盘适配', question: '命盘里看一个人适合"主推"还是"配合"？为什么相同能力的人在不同角色里命运差很多？', topic: '事业' },
  { slug: 'tool-anchor-timing-monthly-rhythm', toolSlug: 'timing-monthly-rhythm', toolLabel: '月度节奏', scenario: '月度行动节奏', question: '每个月的"主推"和"收敛"窗口怎么判断？月节奏跟流年怎么叠加读？', topic: '时位' },
  { slug: 'tool-anchor-relationship-pace-fit', toolSlug: 'relationship-pace-fit', toolLabel: '关系节奏匹配', scenario: '关系推进节奏', question: '为什么相同感情有人推进顺利有人卡死？关系节奏不匹配在命理上怎么看？', topic: '关系' },
  { slug: 'tool-anchor-application-timing-selection', toolSlug: 'application-timing-selection', toolLabel: '择日选时', scenario: '关键日子择时', question: '什么是"真择日"什么是"通用黄历"？命理择日要看哪几个层面？', topic: '时位' },
  { slug: 'tool-anchor-relationship-boundary-conflict', toolSlug: 'relationship-boundary-conflict', toolLabel: '关系边界冲突', scenario: '边界冲突修复', question: '为什么有的关系冲突一次就翻篇，有的反复消耗到失温？命理上边界结构怎么看？', topic: '关系' },
  { slug: 'tool-anchor-career-promotion-window', toolSlug: 'career-promotion-window', toolLabel: '事业晋升窗口', scenario: '晋升时机判断', question: '什么命盘 + 流年组合最容易冲到晋升？什么时候宁可不动也不要硬推？', topic: '事业' },
  { slug: 'tool-anchor-timing-decision-day', toolSlug: 'timing-decision-day', toolLabel: '决策日选择', scenario: '重大决策当日', question: '签合同、提辞职、谈合作，怎么挑那一天才不撞冲日忌神？', topic: '时位' },
  { slug: 'tool-anchor-relationship-reconciliation', toolSlug: 'relationship-reconciliation', toolLabel: '关系修复', scenario: '关系断裂后的修复', question: '关系崩了之后能不能修？什么命理信号说该尝试，什么信号说该止损？', topic: '关系' },
];

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

const SYSTEM_PROMPT = `你是世界易学（World Yi）资深主编。给你一个【工具锚点 + 场景问题】+ 3 个引擎命盘事实包，请产出一篇高质量长篇 SEO 知识词条。

【铁律】
1. 关于命理判断（日主/格局/用神/大运/流年/十神/宫位），只能引用我提供的"命盘事实清单"，不允许编造清单外的命理结论。
2. 提到具体四柱/格局/用神时必须与清单对得上。
3. 文末有"工具锚点"段，必须自然引导读者到对应工具页（不要写成广告腔，要写成"判断顺序的下一步"）。

【输出 JSON 结构】
{
  "title": "20-32 字，命中场景关键词 + 工具锚点暗示",
  "excerpt": "80-140 字摘要，第一句直接回答场景核心",
  "seoTitle": "≤56 字 SEO 标题",
  "seoDescription": "120-160 字 SEO 描述",
  "tags": ["主题","工具锚点","世界易","..."],
  "sections": [
    { "title": "这个场景在判断什么", "paragraphs": ["...3-4 段拆解问题..."] },
    { "title": "命盘里看的三个核心维度", "paragraphs": ["...3-4 段..."] },
    { "title": "三个真实命盘案例", "paragraphs": ["案例 1...","案例 2...","案例 3..."] },
    { "title": "常见误区", "paragraphs": ["...2-4 段..."] },
    { "title": "判断顺序与工具锚点", "paragraphs": ["...2-3 段：先看 a，再看 b，到这一步可以用工具 X 校准..."] },
    { "title": "FAQ", "paragraphs": ["问题1...答..","问题2...答..","问题3...答.."] }
  ]
}

每段 100-220 字，整篇 1800-2800 字。中文行文平实专业，避免营销腔，避免 markdown 加粗，整段中文行文。

【输出格式】只输出 JSON，不要 markdown 代码块包裹。`;

function buildUserPrompt(spec: ToolSpec, facts: VirtualBaziFact[]): string {
  const factBlock = facts.map((f, i) => `## 命盘事实包 ${i + 1}\n${formatFactPackForPrompt(f)}`).join('\n\n');
  return `工具锚点：${spec.toolLabel}（slug: ${spec.toolSlug}）
场景：${spec.scenario}
核心问题：${spec.question}
主题分类：${spec.topic}

${factBlock}

"三个真实命盘案例"段必须对应事实包 1/2/3，每个案例：
1. 引用事实包给出的日主/格局/用神/当前大运
2. 把命盘特征放到"${spec.scenario}"的场景里读
3. 给出一条具体的判断顺序（不是占卜结论）

"判断顺序与工具锚点"段：先讲清判断步骤，再说到第 X 步可以用"${spec.toolLabel}"工具进一步校准，但不要写工具页 URL，让读者自然点 CTA。

请严格按 system JSON 格式输出。`;
}

interface DraftResult {
  spec: ToolSpec;
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
  try { return JSON.parse(s.slice(lo, hi + 1)); } catch { return null; }
}

async function generateOne(openai: OpenAI, model: string, spec: ToolSpec): Promise<DraftResult> {
  const facts: VirtualBaziFact[] = [];
  let attempts = 0;
  const seed0 = Date.now() ^ Array.from(spec.slug).reduce((s, c) => s + c.charCodeAt(0), 0);
  while (facts.length < 3 && attempts < 12) {
    const f = buildVirtualBaziFact(makeRng(seed0 + attempts * 7919));
    if (f) facts.push(f);
    attempts += 1;
  }
  if (facts.length < 3) return { spec, ok: false, error: 'fact 不足' };

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
  if (title.length < 8 || sections.length < 4) return { spec, ok: false, error: `validate fail` };

  return { spec, ok: true, payload: { title, excerpt, seoTitle, seoDescription, tags, sections } };
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
  if (!apiKey) { console.error('[d88] API_KEY missing'); process.exit(1); }
  const model = getModelFallbackChain(undefined, 'content')[0];
  if (!model) { console.error('[d88] no model'); process.exit(1); }

  const dbPath = path.join(process.cwd(), 'data/lifekline.db');
  const db = new Database(dbPath, { readonly: true });
  const existing = new Set((db.prepare("SELECT slug FROM content_entries WHERE content_type='knowledge'").all() as Array<{ slug: string }>).map((r) => r.slug));
  db.close();

  const allSpecs = TOOL_SPECS.filter(s => !ONLY || s.slug === ONLY);
  const specs = allSpecs.filter(s => !existing.has(s.slug));
  console.log(`[d88] total=${allSpecs.length} skip=${allSpecs.length - specs.length} todo=${specs.length} model=${model} concurrency=${CONCURRENCY} dry=${DRY}`);
  if (!specs.length) { console.log('[d88] nothing to do'); return; }

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
      console.log(`  dry [${r.spec.slug}] "${r.payload.title}"`);
      continue;
    }
    try {
      saveManagedContentEntry({
        contentType: 'knowledge',
        subtype: 'tool-anchor',
        slug: r.spec.slug,
        title: r.payload.title,
        name: null,
        excerpt: r.payload.excerpt,
        category: r.spec.topic,
        readTime: `${Math.max(8, Math.min(18, Math.ceil(r.payload.sections.flatMap(s => s.paragraphs).join('').length / 250)))} 分钟阅读`,
        tags: r.payload.tags.length ? r.payload.tags : [r.spec.topic, r.spec.toolLabel, '世界易'],
        featured: false,
        seoTitle: r.payload.seoTitle || `${r.spec.scenario} | 世界易学`,
        seoDescription: r.payload.seoDescription || r.payload.excerpt,
        sections: r.payload.sections,
        status: 'published',
        source: 'engine-llm:tool-anchor',
        meta: {
          anchorToolSlug: r.spec.toolSlug,
          anchorToolLabel: r.spec.toolLabel,
          scenario: r.spec.scenario,
          topic: r.spec.topic,
          generationVersion: 'v5-D88',
        },
      }, 'system:d88');
      saved += 1;
    } catch (err) {
      console.error(`  save fail [${r.spec.slug}]:`, (err as Error).message.slice(0, 200));
    }
  }

  console.log(`[d88] ok=${ok} fail=${fail} saved=${saved} / ${specs.length} in ${(elapsed / 1000).toFixed(1)}s`);
}

main().catch((err) => { console.error('[d88] fatal:', err); process.exit(1); });
