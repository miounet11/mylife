// v5-D102 (2026-05-24): 法律纠纷 × 命理决策 SEO 长文批量生产
//
// 复用 D100 模板。
// 8 个法律场景 × 6 个核心决策 = 48 篇中文 published；后续 D103 跑多语种翻译。
//
// 用法：
//   npx tsx scripts/content/d102-legal-decision.ts
//   DRY=1 ONLY="labor-dispute-go-or-wait" npx tsx scripts/content/d102-legal-decision.ts

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

// 8 个法律纠纷场景
const SCENES = [
  { key: 'labor-dispute', label: '劳动纠纷', shortLabel: '劳动纠纷', focus: '加班/裁员/竞业/N+1、工伤、社保欠缴、签订或解除合同' },
  { key: 'divorce-litigation', label: '离婚诉讼与财产分割', shortLabel: '离婚诉讼', focus: '协议 vs 诉讼、抚养权、共同财产、隐匿资产、家暴举证' },
  { key: 'inheritance-dispute', label: '遗产与继承纠纷', shortLabel: '继承纠纷', focus: '遗嘱有效性、兄弟姐妹分割、再婚配偶、未成年继承、企业接班' },
  { key: 'real-estate-dispute', label: '房产纠纷', shortLabel: '房产纠纷', focus: '买卖违约、装修维权、邻里、产权登记、共有析产' },
  { key: 'partnership-dispute', label: '合伙与股权纠纷', shortLabel: '合伙纠纷', focus: '股权稀释、利润分配、退伙清算、隐名股东、对赌条款' },
  { key: 'consumer-rights', label: '消费者维权', shortLabel: '消费维权', focus: '产品瑕疵、培训退费、医美事故、网购维权、12315' },
  { key: 'criminal-risk', label: '刑事风险与辩护', shortLabel: '刑事风险', focus: '取保候审、缓刑、量刑情节、与企业经营涉刑、信用边界' },
  { key: 'civil-tort', label: '民事侵权与赔偿', shortLabel: '民事侵权', focus: '交通事故、人身损害、名誉权、医疗事故、保险博弈' },
];

// 6 个核心决策
const DECISIONS = [
  { key: 'go-or-wait', label: '起诉还是和解', topic: '法律', q: '在这个法律场景下，命盘里的哪些组合是"该立刻走法律程序"信号？哪些是"该再谈一谈"信号？' },
  { key: 'best-timing', label: '最佳时机与节奏', topic: '法律', q: '什么大运/流年/月支组合下，这个法律决策（提诉/调解/上诉）成功率显著高？' },
  { key: 'risk-assessment', label: '胜诉与风险评估', topic: '法律', q: '命盘里的哪些组合提示当事人在这场博弈里相对处于上风？哪些提示主要风险点？' },
  { key: 'lawyer-and-counsel', label: '律师与外援选择', topic: '法律', q: '命盘怎么辅助判断什么类型的律师/调解人/中间人最匹配这个案子？' },
  { key: 'red-flag-signal', label: '危险信号识别', topic: '法律', q: '出现什么命盘组合或现实信号时，这个法律决策应该立刻调整策略或停手？' },
  { key: 'long-term-impact', label: '长期影响与重启', topic: '法律', q: '案件了结后，命盘里什么样的组合提示该如何重建职业/家庭/财务？' },
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

const SYSTEM_PROMPT = `你是世界易学（World Yi）资深主编，特别擅长把命理判断接到中国法律纠纷的真实博弈里。给你一个【法律场景 × 决策类型】组合 + 3 个引擎跑出的真实虚拟命盘事实包，请产出一篇高质量长篇 SEO 知识词条。

【铁律】
1. 关于命理判断（日主/格局/用神/大运/流年/十神 — 尤其官杀/伤官/比劫对纠纷的影响），只能引用我提供的"命盘事实清单"，不允许编造清单外的命理结论。
2. 提到具体四柱/格局/用神时必须与清单对得上，不能换字。
3. 这是"法律 × 决策"主题，行文要兼顾 (a) 中国法律实务现实（民诉时效/调解优先/律师收费/取证难度/执行难）和 (b) 命理结构如何提示当事人的应对节奏。
4. 绝对不能说"必胜诉""必败诉"，要用"在这种结构下，X 类信号出现时该怎么准备"的判断顺序语言。
5. 必须明确：法律纠纷必须以正规律师与法定程序为主，命理只是辅助节律参考。

【输出 JSON 结构】
{
  "title": "20-32 字，命中关键词，体现法律场景 + 决策类型，专业不浮夸",
  "excerpt": "80-140 字摘要，第一句直接说这个场景做这种决策的核心难点",
  "seoTitle": "≤56 字 SEO 标题，命中场景 + 决策关键词",
  "seoDescription": "120-160 字 SEO 描述",
  "tags": ["法律场景","决策主题","命理工具","世界易"],
  "sections": [
    { "title": "为什么这个决策在这个法律场景尤其难", "paragraphs": ["...3-4 段：阶段性现实约束 + 程序成本 + 命理结构同时叠加..."] },
    { "title": "命理判断的三个核心维度", "paragraphs": ["...3-4 段：日主与官杀 / 伤官与表达对抗 / 流年大运冲合..."] },
    { "title": "三个真实命盘案例", "paragraphs": ["案例 1（基于事实包1）...","案例 2（基于事实包2）...","案例 3（基于事实包3）..."] },
    { "title": "这个场景常见的误判与盲点", "paragraphs": ["...2-4 段..."] },
    { "title": "实操判断顺序", "paragraphs": ["...2-3 段：怎么排查、什么时候该走法律程序、什么时候应当先谈..."] },
    { "title": "FAQ", "paragraphs": ["问题 1：...\\n答：...","问题 2：...\\n答：...","问题 3：...\\n答：..."] }
  ]
}

每段 paragraph 100-220 字，整篇 1800-2800 字。中文行文平实专业，避免营销腔，避免 markdown 加粗，避免无序列表，整段中文行文。

【输出格式】只输出 JSON，不要 markdown 代码块包裹。`;

function buildUserPrompt(spec: Spec, facts: VirtualBaziFact[]): string {
  const factBlock = facts.map((f, i) => `## 命盘事实包 ${i + 1}\n${formatFactPackForPrompt(f)}`).join('\n\n');
  return `法律场景：${spec.scene.label}
该场景典型现实焦点：${spec.scene.focus}
决策类型：${spec.decision.label}（主题：${spec.decision.topic}）
核心问题：${spec.decision.q}

${factBlock}

请产出一篇围绕"${spec.keyword}"的长篇 SEO 知识文。"三个真实命盘案例"段必须分别对应事实包 1/2/3，每个案例：
1. 简述事实包给出的日主/格局/用神/当前大运（特别注意官杀/伤官/比劫组合对纠纷的影响）
2. 把这个命盘放进"${spec.scene.label}"的真实法律博弈里
3. 解释命盘特征如何在"${spec.decision.label}"这个决策里被放大或被对冲
4. 给出一条具体的判断顺序建议（不是占卜结论，必须配合正规法律建议）

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
  if (!apiKey) { console.error('[d102] API_KEY missing'); process.exit(1); }
  const model = getModelFallbackChain(undefined, 'content')[0];
  if (!model) { console.error('[d102] no model'); process.exit(1); }

  const dbPath = path.join(process.cwd(), 'data/lifekline.db');
  const db = new Database(dbPath, { readonly: true });
  const existing = new Set((db.prepare("SELECT slug FROM content_entries WHERE content_type='knowledge'").all() as Array<{ slug: string }>).map((r) => r.slug));
  db.close();

  const allSpecs = gatherSpecs();
  const specs = allSpecs.filter(s => !existing.has(s.slug));
  console.log(`[d102] specs total=${allSpecs.length} skip_existing=${allSpecs.length - specs.length} todo=${specs.length} model=${model} concurrency=${CONCURRENCY} dry=${DRY}`);
  if (!specs.length) { console.log('[d102] nothing to do'); return; }

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
        subtype: 'legal-decision',
        slug: r.spec.slug,
        title: r.payload.title,
        name: null,
        excerpt: r.payload.excerpt,
        category: r.spec.decision.topic,
        readTime: `${Math.max(8, Math.min(18, Math.ceil(r.payload.sections.flatMap(s => s.paragraphs).join('').length / 250)))} 分钟阅读`,
        tags: r.payload.tags.length ? r.payload.tags : [r.spec.scene.shortLabel, r.spec.decision.topic, '法律', '世界易'],
        featured: false,
        seoTitle: r.payload.seoTitle || `${r.spec.keyword} | 世界易学`,
        seoDescription: r.payload.seoDescription || r.payload.excerpt,
        sections: r.payload.sections,
        status: 'published',
        source: 'engine-llm:legal-decision',
        meta: {
          scene: r.spec.scene.key,
          sceneLabel: r.spec.scene.label,
          decision: r.spec.decision.key,
          decisionLabel: r.spec.decision.label,
          topic: r.spec.decision.topic,
          keyword: r.spec.keyword,
          generationVersion: 'v5-D102',
        },
      }, 'system:d102');
      saved += 1;
    } catch (err) {
      console.error(`  save fail [${r.spec.slug}]:`, (err as Error).message.slice(0, 200));
    }
  }

  console.log(`[d102] ok=${ok} fail=${fail} saved=${saved} / ${specs.length} in ${(elapsed / 1000).toFixed(1)}s`);
}

main().catch((err) => {
  console.error('[d102] fatal:', err);
  process.exit(1);
});
