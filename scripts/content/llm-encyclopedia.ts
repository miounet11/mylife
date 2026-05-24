// v5-D77 命理基础百科：53 词条（10 天干 + 12 地支 + 10 十神 + 11 神煞 + 10 主格局）
// 引擎吐定义事实（五行/阴阳/方位/季节/藏干/属性）→ LLM 修饰为 800-1500 字百科词条
//
// 用法: npx tsx scripts/content/llm-encyclopedia.ts [type?]
//   type: gan | zhi | shishen | shensha | pattern | all（默认 all）

import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd());

import OpenAI from 'openai';
import {
  TIAN_GAN, DI_ZHI, GAN_TO_WUXING, GAN_YIN_YANG, GAN_HE, GAN_CHONG,
  ZHI_TO_WUXING, ZHI_YIN_YANG, ZHI_CANG_GAN, ZHI_CHONG, ZHI_HE, ZHI_SAN_HE, ZHI_XING, ZHI_HAI,
  WUXING_DIRECTION, WUXING_COLOR, WUXING_SEASON_SCORE,
  SHI_SHEN, SHISHEN_CATEGORY,
} from '@/lib/bazi-constants';
import { saveManagedContentEntry } from '@/lib/content-store';
import { getApiBaseUrl, getApiKey } from '@/lib/env';
import { getModelFallbackChain } from '@/lib/llm-model-fallback';

const ONLY = process.argv[2] || 'all';
const CONCURRENCY = Math.max(1, Math.min(50, Number(process.env.FORUM_LLM_CONCURRENCY) || 50));

interface Entry {
  type: 'gan' | 'zhi' | 'shishen' | 'shensha' | 'pattern';
  name: string;
  fact: string;
  slug: string;
  category: string;
}

function elementName(en?: string) {
  return ({ wood: '木', fire: '火', earth: '土', metal: '金', water: '水' } as Record<string, string>)[en || ''] || en || '';
}

function ganFact(g: string): string {
  const wx = elementName(GAN_TO_WUXING[g]);
  const yy = GAN_YIN_YANG[g] === 0 ? '阳' : '阴';
  const dir = WUXING_DIRECTION[wx] || '';
  const col = (WUXING_COLOR[wx] || []).join('、');
  const he = GAN_HE[g] ? `与${GAN_HE[g]}相合（${g}${GAN_HE[g]}合）` : '';
  const chong = GAN_CHONG[g] ? `与${GAN_CHONG[g]}相冲` : '';
  const seasonScores = WUXING_SEASON_SCORE[wx] ? Object.entries(WUXING_SEASON_SCORE[wx]).map(([s, n]) => `${s}=${n}`).join(', ') : '';
  return [
    `天干名称：${g}`,
    `阴阳：${yy}干`,
    `五行：${wx}`,
    `方位：${dir}`,
    `代表色：${col}`,
    `合化：${he || '无固定合化对象'}`,
    `相冲：${chong || '无相冲'}`,
    `季节强弱评分：${seasonScores}（春=3 表示在春季最旺）`,
  ].join('\n');
}

function zhiFact(z: string): string {
  const wx = elementName(ZHI_TO_WUXING[z]);
  const yy = ZHI_YIN_YANG[z] === 0 ? '阳' : '阴';
  const cangGan = (ZHI_CANG_GAN[z] || []).join('、');
  const chong = ZHI_CHONG[z] ? `与${ZHI_CHONG[z]}相冲` : '';
  const he = ZHI_HE[z] ? `与${ZHI_HE[z]}六合` : '';
  const sanhe = ZHI_SAN_HE[z] ? `三合：${ZHI_SAN_HE[z].join('+')}（化为局）` : '';
  const xing = ZHI_XING[z] ? `相刑：${ZHI_XING[z]}` : '无相刑';
  const hai = ZHI_HAI[z] ? `相害：${ZHI_HAI[z]}` : '无相害';
  return [
    `地支名称：${z}`,
    `阴阳：${yy}支`,
    `本气五行：${wx}`,
    `藏干：${cangGan || '无'}`,
    `六冲：${chong || '无'}`,
    `六合：${he || '无'}`,
    sanhe || '',
    xing,
    hai,
  ].filter(Boolean).join('\n');
}

function shishenFact(s: string): string {
  const cat = SHISHEN_CATEGORY[s] || '';
  return [
    `十神名称：${s}`,
    `分类：${cat}（${cat === 'self' ? '同我类（与日主同五行）' : cat === 'output' ? '我生类（日主所生）' : cat === 'wealth' ? '我克类（日主所克，主财）' : cat === 'official' ? '克我类（克制日主，主官杀）' : '生我类（生扶日主，主印）'})`,
    `命理职能：${({
      '比肩': '同性朋友、合作、自我认同；过旺易争夺、不服管',
      '劫财': '异性朋友、合伙、易破财；调节得当则贵人',
      '食神': '才华、表达、子女（女命）、口福；过多则散漫',
      '伤官': '创造、叛逆、技艺、表达欲强；忌见正官',
      '偏财': '偏门财、流动财、父亲、桃花（男命异性缘）',
      '正财': '正职收入、妻星（男命）、节俭持家',
      '七杀': '权力、压力、决断；制化得当为大将之才',
      '正官': '名誉、地位、丈夫（女命）、规则约束',
      '偏印': '继母、宗教/玄学缘、孤独感、专业技术',
      '正印': '母亲、学历、靠山、保护伞、贵人',
    } as Record<string, string>)[s] || '需结合命局判断'}`,
  ].join('\n');
}

const SHENSHA_FACTS: Record<string, string> = {
  '天乙贵人': `名称：天乙贵人\n性质：第一吉神，主贵人扶持\n规则：以日干查地支（甲戊见丑未、乙己见子申、丙丁见酉亥、庚辛见午寅、壬癸见卯巳）\n作用：见之多有贵人提携、逢凶化吉，最忌空亡或刑冲`,
  '文昌贵人': `名称：文昌贵人\n性质：吉神，主聪明、文采、考试\n规则：以日干查地支（甲见巳、乙见午、丙戊见申、丁己见酉、庚见亥、辛见子、壬见寅、癸见卯）\n作用：利学业、考试、文书、写作；学者命中常见`,
  '驿马': `名称：驿马\n性质：动星，主迁移、出差、远行\n规则：申子辰见寅、寅午戌见申、巳酉丑见亥、亥卯未见巳\n作用：吉神逢之主升迁、出国、远行致富；凶神逢之主奔波、漂泊`,
  '桃花': `名称：桃花（咸池）\n性质：异性缘星，主感情/魅力\n规则：申子辰见酉、寅午戌见卯、巳酉丑见午、亥卯未见子\n作用：在年支为外桃花、月日为内桃花；旺者人缘好，过旺则桃花劫`,
  '华盖': `名称：华盖\n性质：艺术、宗教、孤高\n规则：申子辰见辰、寅午戌见戌、巳酉丑见丑、亥卯未见未\n作用：主艺术天分、宗教缘、晚婚或独居倾向；常见于学者、艺术家、修行人`,
  '羊刃': `名称：羊刃\n性质：刚强凶煞，主刃伤、争斗\n规则：阳干禄前一位（甲见卯、丙戊见午、庚见酉、壬见子）\n作用：制化得当为大将之才；不制则易血光、官非；忌冲、合羊刃`,
  '魁罡': `名称：魁罡\n性质：极端聪明刚烈\n规则：日柱为庚辰、庚戌、壬辰、戊戌\n作用：聪明果断、性格刚强；男命利权位，女命主婚姻波折，忌财官旺地`,
  '孤辰': `名称：孤辰\n性质：孤独之星\n规则：寅卯辰人见巳、巳午未人见申、申酉戌人见亥、亥子丑人见寅\n作用：主性格孤僻、不合群；婚姻迟成、夫妻聚少离多；女命忌见`,
  '寡宿': `名称：寡宿\n性质：与孤辰相对的女命独立星\n规则：寅卯辰人见丑、巳午未人见辰、申酉戌人见未、亥子丑人见戌\n作用：女命见之主婚姻不顺、独立性强；现代命理也可视作事业型女性的标志`,
  '天德贵人': `名称：天德贵人\n性质：积德吉星\n规则：以月支查（正月丁、二月申、三月壬、四月辛、五月亥、六月甲、七月癸、八月寅、九月丙、十月乙、十一月巳、十二月庚）\n作用：主积善之家、贵人扶持、化解凶煞`,
  '月德贵人': `名称：月德贵人\n性质：与天德合并的吉神\n规则：寅午戌月见丙、申子辰月见壬、巳酉丑月见庚、亥卯未月见甲\n作用：主慈悲心重、贵人提携、临难不死；女命主贞洁旺夫`,
};

const PATTERN_FACTS: Record<string, string> = {
  '正官格': '格局名：正官格\n构成：月支本气或藏干透出克日主同性五行（日主阴见阳官、日主阳见阴官）\n喜：身强用官，喜财生官、印化官\n忌：身弱被官克倒，忌伤官见官、七杀混杂\n职业方向：公务员、企业管理、规则型行业',
  '七杀格': '格局名：七杀格（偏官）\n构成：月支本气或藏干透出克日主同性五行（阴见阴杀、阳见阳杀）\n喜：身强用杀，喜食神制杀、印化杀\n忌：身弱遇杀必凶，忌财生杀、官杀混杂\n职业方向：军警、外科医生、纪检、销售前线',
  '正财格': '格局名：正财格\n构成：月支或透出日主所克之异性五行\n喜：身强财旺，喜食神/伤官生财、官星护财\n忌：身弱财多反成累，忌劫财夺财\n职业方向：商业经营、金融、会计、稳定收入型职业',
  '偏财格': '格局名：偏财格\n构成：月支或透出日主所克之同性五行\n喜：身强配偏财，喜食伤生财、星位独透\n忌：劫财夺财、财多身弱\n职业方向：金融投资、贸易、流动财、副业兼职多面手',
  '食神格': '格局名：食神格\n构成：月支或透出日主所生之同性五行\n喜：食神生财、印护食神\n忌：枭神（偏印）夺食、食神被冲克\n职业方向：餐饮、教育、艺术表达、子女缘佳',
  '伤官格': '格局名：伤官格\n构成：月支或透出日主所生之异性五行\n喜：伤官配印（聪明且有约束）、伤官生财\n忌：见正官（伤官见官，为祸百端）、身弱伤官重\n职业方向：技艺、设计、自媒体、独立创作',
  '正印格': '格局名：正印格\n构成：月支或透出生日主之异性五行\n喜：身弱用印，官印相生\n忌：财坏印、印多身旺\n职业方向：教育、文职、研究、医疗、需要专业资历的领域',
  '偏印格': '格局名：偏印格（枭神）\n构成：月支或透出生日主之同性五行\n喜：偏印化杀、身弱有效\n忌：枭夺食、孤独感重\n职业方向：技术专精、玄学、宗教、专业咨询',
  '比肩格': '格局名：比肩格\n构成：月支或透出与日主同五行同阴阳\n喜：身弱用比帮身、与日主和谐\n忌：身强见比劫财、争夺资源\n职业方向：合伙创业、运动员、独立经营',
  '劫财格': '格局名：劫财格（羊刃格之一）\n构成：月支或透出与日主同五行异阴阳\n喜：身弱用劫扶身\n忌：身旺见劫破财、冲合羊刃\n职业方向：竞技性行业、销售、需要冲劲的工作',
};

function buildEntries(): Entry[] {
  const out: Entry[] = [];
  if (ONLY === 'all' || ONLY === 'gan') {
    for (const g of TIAN_GAN) {
      out.push({ type: 'gan', name: g, fact: ganFact(g), slug: `tiangan-${encodeURIComponent(g)}`, category: '天干百科' });
    }
  }
  if (ONLY === 'all' || ONLY === 'zhi') {
    for (const z of DI_ZHI) {
      out.push({ type: 'zhi', name: z, fact: zhiFact(z), slug: `dizhi-${encodeURIComponent(z)}`, category: '地支百科' });
    }
  }
  if (ONLY === 'all' || ONLY === 'shishen') {
    for (const s of SHI_SHEN) {
      out.push({ type: 'shishen', name: s, fact: shishenFact(s), slug: `shishen-${encodeURIComponent(s)}`, category: '十神百科' });
    }
  }
  if (ONLY === 'all' || ONLY === 'shensha') {
    for (const [name, fact] of Object.entries(SHENSHA_FACTS)) {
      out.push({ type: 'shensha', name, fact, slug: `shensha-${encodeURIComponent(name)}`, category: '神煞百科' });
    }
  }
  if (ONLY === 'all' || ONLY === 'pattern') {
    for (const [name, fact] of Object.entries(PATTERN_FACTS)) {
      out.push({ type: 'pattern', name, fact, slug: `pattern-${encodeURIComponent(name)}`, category: '格局百科' });
    }
  }
  return out;
}

const SYSTEM_PROMPT = `你是中文命理百科主编。给你一个命理概念名称和一份"事实清单"（来自命理引擎）。请扩写为一篇 800-1500 字的百科词条。

【铁律】
1. 命理事实只能来自清单。清单里的五行、阴阳、合冲、藏干、规则、职能等不能改字。
2. 可以扩写背景（古籍渊源、现代解读、生活类比、配置场景），但不能与清单矛盾。
3. 不允许编造清单外的硬规则（如新增"X 与 Y 三合"）。

【输出 JSON 结构】
{
  "title": "16-28 字标题，包含概念名称",
  "excerpt": "60-120 字摘要",
  "seoTitle": "≤56 字 SEO 标题，含概念名",
  "seoDescription": "120-160 字 SEO 描述",
  "tags": ["标签1","标签2","标签3"],
  "sections": [
    { "title": "概念定义", "paragraphs": ["...2-3 段，引用事实清单..."] },
    { "title": "命理特征与象征意义", "paragraphs": ["...2-3 段..."] },
    { "title": "实战配置与判读", "paragraphs": ["...2-3 段，举几个常见组合（与清单不矛盾）..."] },
    { "title": "常见误区", "paragraphs": ["...2 段..."] },
    { "title": "FAQ", "paragraphs": ["问题：...答：...","问题：...答：..."] }
  ]
}

每段 paragraph 80-200 字，整篇 800-1500 字。中文行文平实专业，避免营销腔，整段中文，不要 markdown 加粗，不要列表。

【输出格式】只输出 JSON，不要 markdown 代码块。`;

function tryParseObject(raw: string): unknown {
  let s = raw.trim();
  if (s.startsWith('```')) s = s.replace(/^```(?:json)?/i, '').replace(/```\s*$/, '').trim();
  const lo = s.indexOf('{');
  const hi = s.lastIndexOf('}');
  if (lo < 0 || hi < 0 || hi <= lo) return null;
  try { return JSON.parse(s.slice(lo, hi + 1)); } catch { return null; }
}

interface Result {
  entry: Entry;
  ok: boolean;
  error?: string;
  payload?: { title: string; excerpt: string; seoTitle: string; seoDescription: string; tags: string[]; sections: Array<{ title: string; paragraphs: string[] }> };
}

async function generateOne(openai: OpenAI, model: string, e: Entry): Promise<Result> {
  let raw = '';
  try {
    const resp = await openai.chat.completions.create({
      model,
      temperature: 0.65,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `概念名称：${e.name}\n所属类目：${e.category}\n\n【事实清单】\n${e.fact}\n\n请输出符合 system 要求的 JSON。` },
      ],
    });
    raw = resp.choices?.[0]?.message?.content || '';
  } catch (err) {
    return { entry: e, ok: false, error: 'llm err: ' + (err as Error).message.slice(0, 200) };
  }
  const parsed = tryParseObject(raw);
  if (!parsed || typeof parsed !== 'object') return { entry: e, ok: false, error: 'parse fail' };
  const o = parsed as Record<string, unknown>;
  const title = typeof o.title === 'string' ? o.title.trim() : '';
  const excerpt = typeof o.excerpt === 'string' ? o.excerpt.trim() : '';
  const seoTitle = typeof o.seoTitle === 'string' ? o.seoTitle.trim() : '';
  const seoDescription = typeof o.seoDescription === 'string' ? o.seoDescription.trim() : '';
  const tags = Array.isArray(o.tags) ? (o.tags as unknown[]).filter((t) => typeof t === 'string').slice(0, 5) as string[] : [];
  const sectionsRaw = Array.isArray(o.sections) ? o.sections : [];
  const sections: Array<{ title: string; paragraphs: string[] }> = [];
  for (const s of sectionsRaw) {
    if (!s || typeof s !== 'object') continue;
    const so = s as Record<string, unknown>;
    const stitle = typeof so.title === 'string' ? so.title.trim() : '';
    const paragraphs = Array.isArray(so.paragraphs) ? (so.paragraphs as unknown[]).filter((p) => typeof p === 'string' && (p as string).trim().length > 0).map((p) => (p as string).trim()) : [];
    if (stitle && paragraphs.length) sections.push({ title: stitle, paragraphs });
  }
  if (title.length < 4 || sections.length < 3) return { entry: e, ok: false, error: `validate fail title=${title.length} sections=${sections.length}` };
  return { entry: e, ok: true, payload: { title, excerpt, seoTitle, seoDescription, tags, sections } };
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
  if (!apiKey) { console.error('[d77] API_KEY missing'); process.exit(1); }
  const model = getModelFallbackChain(undefined, 'content')[0];
  if (!model) { console.error('[d77] no model'); process.exit(1); }

  const entries = buildEntries();
  console.log(`[d77] entries=${entries.length} (filter=${ONLY}) model=${model} concurrency=${CONCURRENCY}`);
  if (!entries.length) return;

  const openai = new OpenAI({ apiKey, baseURL: getApiBaseUrl(), timeout: 60000, maxRetries: 1 });
  const t0 = Date.now();
  const jobs = entries.map((e) => () => generateOne(openai, model, e));
  const results = await pool(jobs, CONCURRENCY);
  const elapsed = Date.now() - t0;

  let ok = 0, fail = 0, saved = 0;
  for (const r of results) {
    if (!r.ok || !r.payload) {
      fail += 1;
      console.error(`  fail [${r.entry?.name}] ${r.error}`);
      continue;
    }
    ok += 1;
    try {
      saveManagedContentEntry({
        contentType: 'knowledge',
        subtype: r.entry.type,
        slug: r.entry.slug,
        title: r.payload.title,
        name: r.entry.name,
        excerpt: r.payload.excerpt,
        category: r.entry.category,
        readTime: `${Math.max(4, Math.min(8, Math.ceil(r.payload.sections.flatMap(s => s.paragraphs).join('').length / 250)))} 分钟阅读`,
        tags: r.payload.tags.length ? r.payload.tags : [r.entry.name, r.entry.category],
        featured: false,
        seoTitle: r.payload.seoTitle || `${r.entry.name} | 命理百科 - 世界易学`,
        seoDescription: r.payload.seoDescription || r.payload.excerpt,
        sections: r.payload.sections,
        status: 'draft',
        source: 'engine-llm:encyclopedia',
        meta: { encyclopediaType: r.entry.type, conceptName: r.entry.name, generationVersion: 'v5-D77' },
      }, 'system:d77');
      saved += 1;
    } catch (err) {
      console.error(`  save fail [${r.entry.name}]:`, (err as Error).message.slice(0, 200));
    }
  }
  console.log(`[d77] ok=${ok} fail=${fail} saved=${saved} / ${entries.length} in ${(elapsed / 1000).toFixed(1)}s`);
}

main().catch((err) => { console.error('[d77] FATAL:', err); process.exit(99); });
