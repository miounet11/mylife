// v5-D76 引擎驱动案例库（300+ 篇 case）
// 每篇 = 引擎事实包（虚拟命盘）+ 具体问题主题（事业/婚姻/择日/搬家/学业/财运/健康/合伙/置业/移民）
// → LLM 扩写 800-1500 字案例叙事
//
// 用法: npx tsx scripts/content/llm-case-library.ts [count?]
//   count: 总条数（默认 300，最大 600）

import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd());

import OpenAI from 'openai';
import { saveManagedContentEntry } from '@/lib/content-store';
import { getApiBaseUrl, getApiKey } from '@/lib/env';
import { getModelFallbackChain } from '@/lib/llm-model-fallback';
import { buildVirtualBaziFact, formatFactPackForPrompt, VirtualBaziFact } from '@/lib/forum/virtual-bazi-fact';

const TARGET = Math.max(20, Math.min(600, Number(process.argv[2]) || 300));
const CONCURRENCY = Math.max(1, Math.min(30, Number(process.env.FORUM_LLM_CONCURRENCY) || 30));

// 10 个主题大类 × 8-10 个细化场景 = 80+ 题材
interface ScenarioTheme {
  key: string;
  label: string;
  scenarios: string[];
}

const THEMES: ScenarioTheme[] = [
  {
    key: 'career',
    label: '事业职业',
    scenarios: [
      '在大厂做了 8 年中层，想跳出来自己干，怕错过窗口',
      '体制内三年想转互联网，家里反对',
      '工作 3 年技术岗，要不要转管理',
      '创业 5 年遇到瓶颈，是继续融资还是转型',
      '被裁员后想 gap 一年学新技能',
      '副业月入超过主业，要不要 all in',
      '专业不对口想转行，30+ 还来得及吗',
      '海外公司本土总部要回国还是留外',
    ],
  },
  {
    key: 'marriage',
    label: '婚姻感情',
    scenarios: [
      '相处 5 年要不要结婚，对方家里催',
      '离婚一年带娃，要不要进入新关系',
      '异地恋 3 年，要不要为对方搬城市',
      '相亲对象条件好但没感觉，要不要继续',
      '婚后 3 年想要孩子，但担心时机',
      '另一半事业起飞自己停滞，关系出现裂痕',
      '父母反对的对象，要不要坚持',
      '中年危机，婚姻进入冷淡期怎么破局',
    ],
  },
  {
    key: 'date-selection',
    label: '择日吉日',
    scenarios: [
      '明年 5 月想结婚，怎么选最佳日子',
      '搬家进新房想挑入伙日',
      '开公司选注册日和挂牌日',
      '新店开业要不要避开月破日',
      '签长期合同避开冲日',
      '小孩满月酒挑哪天合适',
      '老人过寿日子能不能往后挪',
      '动土修缮工程开工日',
    ],
  },
  {
    key: 'relocation',
    label: '搬家迁移',
    scenarios: [
      '北京到杭州求职，从用神方位看适不适合',
      '回老家小城市还是留在一线',
      '想移民澳洲，从八字看东南方位的影响',
      '换学区房从风水和五行看怎么选',
      '出国读研选英国还是美国',
      '夫妻两人五行不同，搬哪个城市更平衡',
      '父母从北方搬到南方养老合适吗',
      '从市中心搬到郊区独栋的取舍',
    ],
  },
  {
    key: 'education',
    label: '学业考试',
    scenarios: [
      '高考填志愿选什么专业方向',
      '考公还是考研，纠结半年',
      '出国留学选硕士项目从命局看',
      '工作 5 年想读 MBA',
      '小孩补习压力大，要不要换路径',
      '论文压力大要不要 gap',
      '职业资格证考 3 年没过，要继续吗',
      '专升本考第二学位的时机',
    ],
  },
  {
    key: 'wealth',
    label: '财运投资',
    scenarios: [
      '存款 50 万要不要买房',
      '股市亏损 30%，要不要止损',
      '加密货币要不要 all in',
      '兼职理财顾问能做吗',
      '父母遗产怎么打理',
      '家族企业接班还是卖掉',
      '基金定投 3 年还在亏，继续吗',
      '创业天使融资估值博弈',
    ],
  },
  {
    key: 'health',
    label: '健康养生',
    scenarios: [
      '长期失眠从五行看怎么调',
      '肠胃问题反复，土行偏弱',
      '焦虑症 3 年，要不要长期吃药',
      '高强度健身和八字体质冲突吗',
      '中医说肝郁气滞，对应木行',
      '更年期情绪波动，命理怎么看',
      '父母慢性病照护选哪种方案',
      '产后抑郁恢复期建议',
    ],
  },
  {
    key: 'partnership',
    label: '合伙合作',
    scenarios: [
      '和发小合伙开店，要不要签协议',
      '股东内斗，要不要退出',
      '客户合同重大让步，签还是不签',
      '收购小团队进来，文化能不能融',
      '上下游绑定独家协议风险',
      '导师/导生关系破裂怎么收',
      '前同事邀请加入新公司',
      '亲戚要入股，怎么处理边界',
    ],
  },
  {
    key: 'real-estate',
    label: '置业买房',
    scenarios: [
      '首套刚需选南向还是北向',
      '改善置换学区房和地段二选一',
      '父母资助买房名字写谁',
      '二套投资公寓还是商铺',
      '老破小拆迁等还是出手',
      '婚前买房产权登记博弈',
      '小户型还是大户型，五行视角',
      '高层和低层从命理看',
    ],
  },
  {
    key: 'migration',
    label: '移民海外',
    scenarios: [
      '加拿大技术移民等 3 年要不要等',
      '澳洲投资移民门槛上调',
      '日本经营管理签证落地节奏',
      '欧洲购房移民 vs 美国 EB5',
      '香港优才计划 vs 新加坡 ONE Pass',
      '陪读妈妈在英国独立创业',
      '海外华人 30+ 回国发展',
      '中年带娃移民取舍',
    ],
  },
];

const FOCUS_QUESTIONS: Record<string, string[]> = {
  career: ['当前大运适合稳还是动？', '什么时候是出手窗口？', '什么职业方向更顺？'],
  marriage: ['这段关系长期能不能稳定？', '什么时候适合推进重大决定？', '需要避开哪些时间点？'],
  'date-selection': ['什么时间窗口最稳？', '需要避开哪些冲合？', '配偶/伙伴的日柱怎么协调？'],
  relocation: ['用神方位是否支持？', '当前大运能不能承接？', '需要在哪个流年节点完成？'],
  education: ['印星/食神状态怎么样？', '什么时间点出成绩？', '专业方向和用神匹配吗？'],
  wealth: ['财星是用神还是忌神？', '当前大运是积累还是消耗？', '什么时候适合扩张？'],
  health: ['哪个五行偏弱需要补？', '什么阶段需要重点调养？', '生活方式怎么对齐？'],
  partnership: ['对方与自己的合冲关系？', '当前大运利合还是利独？', '什么时候适合切割？'],
  'real-estate': ['方位/楼层和用神匹配吗？', '当前流年适合大额支出吗？', '什么时间点能落地？'],
  migration: ['用神方位是哪边？', '当前大运能承接迁移吗？', '什么节点出发最稳？'],
};

interface CaseSpec {
  themeKey: string;
  themeLabel: string;
  scenario: string;
  focus: string;
  fact: VirtualBaziFact;
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

function buildSpecs(count: number): CaseSpec[] {
  const specs: CaseSpec[] = [];
  const baseSeed = Date.now();
  let i = 0;
  let attempts = 0;
  while (specs.length < count && attempts < count * 3) {
    const theme = THEMES[i % THEMES.length];
    const scenario = theme.scenarios[Math.floor(Math.random() * theme.scenarios.length)];
    const focusList = FOCUS_QUESTIONS[theme.key] || ['当前大运适合稳还是动？'];
    const focus = focusList[Math.floor(Math.random() * focusList.length)];
    const fact = buildVirtualBaziFact(makeRng(baseSeed + attempts * 7919 + i * 13));
    attempts += 1;
    if (!fact) continue;
    specs.push({ themeKey: theme.key, themeLabel: theme.label, scenario, focus, fact });
    i += 1;
  }
  return specs;
}

const SYSTEM_PROMPT = `你是中文命理实战案例库的主编。给你一份"虚拟命盘事实清单"+ 一个真实的人生场景 + 一个聚焦问题。请基于这些写成一篇 1000-1800 字的实战案例叙事。

【铁律】
1. 命理判断只能引用清单（日主/格局/用神/忌神/大运/流年/互动），禁止编造清单外的命理事实。
2. 用神/忌神方向不能颠倒；提到具体干支/格局时不能换字。
3. 场景是虚构的，但案例叙述要逼真，像真人真事。不要在叙事里直接抄事实清单，要把命理判断融入推演里。
4. 案例必须围绕"聚焦问题"给出可执行结论。

【输出 JSON 结构】
{
  "title": "16-32 字案例标题，命中场景关键词",
  "excerpt": "80-140 字摘要，点出问题和判断方向",
  "seoTitle": "≤56 字 SEO 标题，含场景关键词",
  "seoDescription": "120-160 字 SEO 描述",
  "tags": ["标签1","标签2","标签3","标签4"],
  "sections": [
    { "title": "案主背景", "paragraphs": ["...2 段，铺垫人物年龄段/职业/家庭/当前困扰..."] },
    { "title": "命盘结构判读", "paragraphs": ["...2-3 段，引用清单事实做结构判断..."] },
    { "title": "聚焦问题的判断", "paragraphs": ["...3-4 段，针对聚焦问题给出分析..."] },
    { "title": "推荐动作与时间节点", "paragraphs": ["...2-3 段，具体可执行步骤..."] },
    { "title": "复盘与提醒", "paragraphs": ["...1-2 段，常见陷阱与边界..."] }
  ]
}

每段 paragraph 100-220 字，整篇 1000-1800 字。中文行文平实专业，避免营销腔，避免 markdown 加粗，避免列表，整段中文。

【输出格式】只输出 JSON，不要 markdown 代码块。`;

function buildUserPrompt(spec: CaseSpec): string {
  return `场景主题：${spec.themeLabel}
具体场景：${spec.scenario}
聚焦问题：${spec.focus}

【命盘事实清单（必须严格引用）】
${formatFactPackForPrompt(spec.fact)}

请基于以上输出符合 system 要求的 JSON。命盘判断必须与清单一致；不要在叙事里直接列清单，把判断融入推演。案例围绕"${spec.focus}"给出动作和时间节点。`;
}

interface Result {
  spec: CaseSpec;
  ok: boolean;
  error?: string;
  payload?: { title: string; excerpt: string; seoTitle: string; seoDescription: string; tags: string[]; sections: Array<{ title: string; paragraphs: string[] }> };
}

function tryParseObject(raw: string): unknown {
  let s = raw.trim();
  if (s.startsWith('```')) s = s.replace(/^```(?:json)?/i, '').replace(/```\s*$/, '').trim();
  const lo = s.indexOf('{');
  const hi = s.lastIndexOf('}');
  if (lo < 0 || hi < 0 || hi <= lo) return null;
  try { return JSON.parse(s.slice(lo, hi + 1)); } catch { return null; }
}

async function generateOne(openai: OpenAI, model: string, spec: CaseSpec): Promise<Result> {
  let raw = '';
  try {
    const resp = await openai.chat.completions.create({
      model,
      temperature: 0.72,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: buildUserPrompt(spec) },
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
    const paragraphs = Array.isArray(so.paragraphs) ? (so.paragraphs as unknown[]).filter((p) => typeof p === 'string' && (p as string).trim().length > 0).map((p) => (p as string).trim()) : [];
    if (stitle && paragraphs.length) sections.push({ title: stitle, paragraphs });
  }
  if (title.length < 6 || sections.length < 4) return { spec, ok: false, error: `validate fail title=${title.length} sections=${sections.length}` };
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

function caseSlug(spec: CaseSpec, idx: number): string {
  // 用 themeKey + 日柱 + 序号生成确定性唯一 slug
  const dayGZ = encodeURIComponent(spec.fact.dayGanZhi);
  const stamp = `${Date.now().toString(36)}-${idx.toString(36)}`;
  return `case-${spec.themeKey}-${dayGZ}-${stamp}`;
}

async function main() {
  const apiKey = getApiKey();
  if (!apiKey) { console.error('[d76] API_KEY missing'); process.exit(1); }
  const model = getModelFallbackChain(undefined, 'content')[0];
  if (!model) { console.error('[d76] no model'); process.exit(1); }

  const specs = buildSpecs(TARGET);
  console.log(`[d76] specs=${specs.length} target=${TARGET} model=${model} concurrency=${CONCURRENCY}`);
  if (!specs.length) return;

  const openai = new OpenAI({ apiKey, baseURL: getApiBaseUrl(), timeout: 60000, maxRetries: 1 });
  const t0 = Date.now();
  const jobs = specs.map((s) => () => generateOne(openai, model, s));
  const results = await pool(jobs, CONCURRENCY);
  const elapsed = Date.now() - t0;

  let ok = 0, fail = 0, saved = 0;
  for (let i = 0; i < results.length; i += 1) {
    const r = results[i];
    if (!r.ok || !r.payload) {
      fail += 1;
      console.error(`  fail [${r.spec?.themeKey}/${r.spec?.scenario?.slice(0, 20)}] ${r.error}`);
      continue;
    }
    ok += 1;
    const slug = caseSlug(r.spec, i);
    try {
      saveManagedContentEntry({
        contentType: 'case',
        subtype: r.spec.themeKey,
        slug,
        title: r.payload.title,
        name: null,
        excerpt: r.payload.excerpt,
        category: r.spec.themeLabel,
        readTime: `${Math.max(5, Math.min(12, Math.ceil(r.payload.sections.flatMap(s => s.paragraphs).join('').length / 250)))} 分钟阅读`,
        tags: r.payload.tags.length ? r.payload.tags : [r.spec.themeLabel, '真实案例', '命理实战'],
        featured: false,
        seoTitle: r.payload.seoTitle || `${r.payload.title} | 世界易学案例库`,
        seoDescription: r.payload.seoDescription || r.payload.excerpt,
        sections: r.payload.sections,
        status: 'draft',
        source: 'engine-llm:case-library',
        meta: {
          themeKey: r.spec.themeKey,
          themeLabel: r.spec.themeLabel,
          scenario: r.spec.scenario,
          focus: r.spec.focus,
          generationVersion: 'v5-D76',
          factSnapshot: {
            dayGanZhi: r.spec.fact.dayGanZhi,
            dayMaster: r.spec.fact.dayMaster,
            pattern: r.spec.fact.pattern,
            strength: r.spec.fact.strength,
            yongShen: r.spec.fact.yongShen,
            jiShen: r.spec.fact.jiShen,
            currentDaYun: r.spec.fact.currentDaYun,
          },
        },
      }, 'system:d76');
      saved += 1;
    } catch (err) {
      console.error(`  save fail [${slug}]:`, (err as Error).message.slice(0, 200));
    }
  }
  console.log(`[d76] ok=${ok} fail=${fail} saved=${saved} / ${specs.length} in ${(elapsed / 1000).toFixed(1)}s`);
}

main().catch((err) => { console.error('[d76] FATAL:', err); process.exit(99); });
