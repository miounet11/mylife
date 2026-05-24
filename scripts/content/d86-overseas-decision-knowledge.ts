// v5-D86 (2026-05-24): 海外华人决策语义簇 SEO 长文批量生产
//
// 复用 D75 keyword-knowledge 模式（引擎事实包 + LLM 修饰），针对当前已验证 top 流量场景：
//   - world-yi-global-chinese-decision-map  (90 sessions/7d)
//   - world-yi-overseas-career-reset        (47)
//   - overseas-chinese-true-solar-time-...  (45)
//   - world-yi-overseas-chinese / partner-selection / wealth-retention-discipline (30+)
//
// 把"海外华人 × 决策场景"语义簇按城市/语种/场景三维扩展，新增 ~80 个长尾关键词。
// slug 用英文 ASCII，避免 D75 中文 encodeURIComponent 在英文 SEO 表现不佳的问题。
//
// 用法：
//   npx tsx scripts/content/d86-overseas-decision-knowledge.ts
//   只跑某个 keyword 调试：DRY=1 ONLY="us-canada-chinese-bazi-career-reset" npx tsx scripts/content/d86-overseas-decision-knowledge.ts

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

// 4 个城市/区域池（已验证流量来源）
const REGIONS = [
  { key: 'us-canada', label: '北美华人', enLabel: 'US/Canada Chinese' },
  { key: 'uk-europe', label: '英国欧洲华人', enLabel: 'UK/Europe Chinese' },
  { key: 'australia-nz', label: '澳新华人', enLabel: 'Australia/NZ Chinese' },
  { key: 'singapore-malaysia', label: '新马华人', enLabel: 'Singapore/Malaysia Chinese' },
];

// 决策场景池 — 全部基于命理判断 × 现实生活决策
const SCENARIOS = [
  // 事业重启簇
  { key: 'career-reset-after-relocation', label: '海外迁移后事业重启', q: '搬到海外后事业卡住，为什么旧打法在新环境失灵？什么阶段适合重启？', topic: '事业' },
  { key: 'career-promotion-window', label: '海外职业晋升窗口', q: '在海外公司想冲晋升，什么时间窗口最容易突破？日主与流年怎么配合？', topic: '事业' },
  { key: 'career-role-fit-cross-culture', label: '跨文化职业角色匹配', q: '同一个人在不同文化环境里，适合的角色密度和推进方式会变吗？', topic: '事业' },
  { key: 'career-startup-vs-employed', label: '海外华人创业还是打工', q: '身份未稳的海外华人，命盘怎么判断更适合创业还是稳定打工？', topic: '事业' },

  // 财富簇
  { key: 'wealth-retention-discipline', label: '海外华人守财纪律', q: '汇率、税务、家庭汇款多重压力下，海外华人如何把财富留住？', topic: '财富' },
  { key: 'wealth-cross-border-investing', label: '跨境投资节奏', q: '什么命格的人适合跨境投资？流年财官印组合怎么看入场时机？', topic: '财富' },
  { key: 'wealth-remit-home-balance', label: '汇钱回家与自身底盘', q: '长期汇钱回家但自己没存下钱，命盘是不是也指向"用神耗损"？', topic: '财富' },
  { key: 'wealth-property-buying-window', label: '海外置业择时', q: '海外华人买房，什么流年组合最容易踩到长期增值的窗口？', topic: '财富' },

  // 关系簇
  { key: 'partner-selection-cross-culture', label: '跨文化伴侣选择', q: '海外华人择偶，文化差异之外，命理上的节奏与边界怎么看？', topic: '关系' },
  { key: 'marriage-timing-overseas', label: '海外结婚择时', q: '身份未明阶段是否该结婚？命盘里的婚姻宫与流年是怎么提示的？', topic: '关系' },
  { key: 'long-distance-relationship-pace', label: '跨国异地关系节奏', q: '为什么有的异地关系能稳几年，有的撑不过半年？命盘节奏怎么看？', topic: '关系' },
  { key: 'relationship-conflict-repair-immigrant', label: '移民家庭关系修复', q: '移民后家人之间消耗加剧，命理与现实结构怎么共同导致？', topic: '关系' },

  // 健康簇
  { key: 'health-recovery-after-migration', label: '迁移后健康恢复', q: '搬到不同纬度、气候、饮食结构后，身体哪些信号最值得关注？', topic: '健康' },
  { key: 'health-stress-overload-overseas', label: '海外华人过劳信号', q: '日主过弱时长期工作压力会先击穿哪个系统？怎么提前识别？', topic: '健康' },

  // 家庭簇
  { key: 'eldercare-distance-decision', label: '海外照护父母决策', q: '父母年迈而自己在海外，回国照护还是远程支持？命理与现实如何同步判断？', topic: '家庭' },
  { key: 'child-education-bilingual', label: '双语教育路径选择', q: '孩子双语成长，什么节奏的家庭最容易陪伴稳定？日主与子女宫怎么读？', topic: '家庭' },
  { key: 'family-role-rebalance-overseas', label: '海外家庭角色重排', q: '搬到海外后家里谁扛得多谁扛得少会变，命盘里"主与从"如何提示？', topic: '家庭' },

  // 迁移簇
  { key: 'return-or-stay-decision', label: '回国还是留下', q: '事业、家庭、身份三方拉扯时，命盘的迁移宫与大运怎样综合判断？', topic: '迁移' },
  { key: 'second-migration-stage', label: '第二次迁移决策', q: '第一次迁移已稳定，是否要再换城市/国家？什么是"过早第二次迁移"？', topic: '迁移' },
  { key: 'migration-environment-fit', label: '迁移环境匹配', q: '同一个命局在不同环境会被放大或抑制，迁移时怎么挑放大器？', topic: '迁移' },

  // 时区/真太阳时簇（顶流）
  { key: 'true-solar-time-error-types', label: '真太阳时常见误算', q: '海外华人排盘真太阳时为什么频繁算错？三种最常见的错怎么排查？', topic: '校准' },
  { key: 'dst-timezone-bazi-mistakes', label: '夏令时与时区八字误差', q: '夏令时切换、时区跨度大、出生地错记，三种典型场景下怎么补救命盘？', topic: '校准' },
];

interface Spec {
  region: typeof REGIONS[number];
  scenario: typeof SCENARIOS[number];
  slug: string;
  keyword: string;
  enKeyword: string;
}

function gatherSpecs(): Spec[] {
  const out: Spec[] = [];
  for (const region of REGIONS) {
    for (const scenario of SCENARIOS) {
      const slug = `${region.key}-${scenario.key}`;
      if (ONLY && slug !== ONLY) continue;
      out.push({
        region,
        scenario,
        slug,
        keyword: `${region.label}${scenario.label}`,
        enKeyword: `${region.enLabel} ${scenario.label}`,
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

const SYSTEM_PROMPT = `你是世界易学（World Yi）的资深主编。给你一个【海外区域 + 决策场景】组合 + 3 个引擎跑出的真实虚拟命盘事实包，请产出一篇高质量长篇 SEO 知识词条。

【铁律】
1. 关于命理判断（日主/格局/用神/大运/流年/十神/宫位），只能引用我提供的"命盘事实清单"，不允许编造清单外的命理结论。
2. 提到具体四柱/格局/用神时必须与清单对得上，不能换字。
3. 这是"海外华人决策"主题，行文要兼顾 (a) 现实场景具体性（身份、税务、跨境、汇率、家庭距离）和 (b) 命理判断如何被环境放大或抑制。

【输出 JSON 结构】
{
  "title": "20-32 字，命中关键词，体现海外/区域 + 决策场景，专业不浮夸",
  "excerpt": "80-140 字摘要，第一句直接回答这个场景的核心难点",
  "seoTitle": "≤56 字 SEO 标题，命中区域 + 场景关键词",
  "seoDescription": "120-160 字 SEO 描述",
  "tags": ["海外华人","区域名","决策主题","命理工具","世界易"],
  "sections": [
    { "title": "为什么这个场景对海外华人尤其难", "paragraphs": ["...3-4 段：现实约束 + 文化差异 + 命理结构同时叠加..."] },
    { "title": "命理判断的三个核心维度", "paragraphs": ["...3-4 段：日主/格局/用神 / 流年大运 / 宫位环境..."] },
    { "title": "三个真实命盘案例", "paragraphs": ["案例 1（基于事实包1）...","案例 2（基于事实包2）...","案例 3（基于事实包3）..."] },
    { "title": "海外华人在这个场景的常见误区", "paragraphs": ["...2-4 段..."] },
    { "title": "实操判断顺序", "paragraphs": ["...2-3 段：怎么排查、什么时候适合行动、什么时候等待..."] },
    { "title": "FAQ", "paragraphs": ["问题 1：...\\n答：...","问题 2：...\\n答：...","问题 3：...\\n答：..."] }
  ]
}

每段 paragraph 100-220 字，整篇 1800-2800 字。中文行文平实专业，避免营销腔，避免 markdown 加粗，避免无序列表，整段中文行文。

【输出格式】只输出 JSON，不要 markdown 代码块包裹。`;

function buildUserPrompt(spec: Spec, facts: VirtualBaziFact[]): string {
  const factBlock = facts.map((f, i) => `## 命盘事实包 ${i + 1}\n${formatFactPackForPrompt(f)}`).join('\n\n');
  return `区域：${spec.region.label}（${spec.region.enLabel}）
决策场景：${spec.scenario.label}
核心问题：${spec.scenario.q}
主题分类：${spec.scenario.topic}

${factBlock}

请产出一篇围绕"${spec.keyword}"的长篇 SEO 知识文。"三个真实命盘案例"段必须分别对应事实包 1/2/3，每个案例：
1. 简述事实包给出的日主/格局/用神/当前大运
2. 把这个命盘放进"${spec.region.label}"的现实约束里
3. 解释命盘特征如何在"${spec.scenario.label}"这个决策场景里被放大或被对冲
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
  if (!apiKey) { console.error('[d86] API_KEY missing'); process.exit(1); }
  const model = getModelFallbackChain(undefined, 'content')[0];
  if (!model) { console.error('[d86] no model'); process.exit(1); }

  // 跳过已存在 slug
  const dbPath = path.join(process.cwd(), 'data/lifekline.db');
  const db = new Database(dbPath, { readonly: true });
  const existing = new Set(db.prepare("SELECT slug FROM content_entries WHERE content_type='knowledge'").all().map((r: { slug: string }) => r.slug));
  db.close();

  const allSpecs = gatherSpecs();
  const specs = allSpecs.filter(s => !existing.has(s.slug));
  console.log(`[d86] specs total=${allSpecs.length} skip_existing=${allSpecs.length - specs.length} todo=${specs.length} model=${model} concurrency=${CONCURRENCY} dry=${DRY}`);
  if (!specs.length) { console.log('[d86] nothing to do'); return; }

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
        subtype: 'overseas-decision',
        slug: r.spec.slug,
        title: r.payload.title,
        name: null,
        excerpt: r.payload.excerpt,
        category: r.spec.scenario.topic,
        readTime: `${Math.max(8, Math.min(18, Math.ceil(r.payload.sections.flatMap(s => s.paragraphs).join('').length / 250)))} 分钟阅读`,
        tags: r.payload.tags.length ? r.payload.tags : [r.spec.region.label, r.spec.scenario.topic, '海外华人', '世界易'],
        featured: false,
        seoTitle: r.payload.seoTitle || `${r.spec.keyword} | 世界易学`,
        seoDescription: r.payload.seoDescription || r.payload.excerpt,
        sections: r.payload.sections,
        status: 'draft',
        source: 'engine-llm:overseas-decision',
        meta: {
          region: r.spec.region.key,
          regionLabel: r.spec.region.label,
          scenario: r.spec.scenario.key,
          scenarioLabel: r.spec.scenario.label,
          topic: r.spec.scenario.topic,
          keyword: r.spec.keyword,
          enKeyword: r.spec.enKeyword,
          generationVersion: 'v5-D86',
        },
      }, 'system:d86');
      saved += 1;
    } catch (err) {
      console.error(`  save fail [${r.spec.slug}]:`, (err as Error).message.slice(0, 200));
    }
  }

  console.log(`[d86] ok=${ok} fail=${fail} saved=${saved} / ${specs.length} in ${(elapsed / 1000).toFixed(1)}s`);
}

main().catch((err) => {
  console.error('[d86] fatal:', err);
  process.exit(1);
});
