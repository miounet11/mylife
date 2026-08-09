/**
 * Destiny-centered content matrix — Life K-Line equivalent of LDPlayer entity pages.
 *
 * Constitution: docs/ldplayer-ops-and-google-alignment.md
 *
 * Learn from LDPlayer: real entity hub → satellite content for concrete jobs →
 * real freshness → internal links → CTA. NOT cartesian long-tail URL farms.
 *
 * Full matrix is a catalog; production must use buildPeopleFirstQueue / people-first mode.
 */

import { DIMENSIONS } from '@/lib/dimensions/config';
import { GEO_CITY_SEEDS } from '@/lib/seo';
import type { ManagedContentType } from '@/lib/content-store';
import type { ContentGenerationLocale } from '@/lib/content-generation';

export type DestinyEntityKind =
  | 'dimension'
  | 'life-question'
  | 'city'
  | 'industry'
  | 'day-master'
  | 'life-stage'
  | 'tool'
  | 'methodology'
  | 'seasonal'
  | 'faq';

export type ContentTemplateKind =
  | 'pillar-guide' // long SEO pillar (LDPlayer app page depth)
  | 'how-to' // tutorial / FAQ deep dive
  | 'case-study' // real-decision narrative
  | 'comparison' // A vs B / which tool
  | 'listicle' // ranking / hot list
  | 'seasonal-pulse' // year/month timely
  | 'locale-local' // market-specific rewrite
  | 'answer-engine'; // GEO-ready Q&A first

export type ContentOsLocale = ContentGenerationLocale;

export type DestinyMatrixSlot = {
  /** Stable key for dedupe / coverage scoring */
  key: string;
  entityKind: DestinyEntityKind;
  entitySlug: string;
  entityName: string;
  template: ContentTemplateKind;
  contentType: ManagedContentType;
  locale: ContentOsLocale;
  market: string;
  /** User job / concrete decision task (LDPlayer: "how to install", "how to pick style") */
  topic: string;
  /** Unique angle — must not be swappable by replacing entity name alone */
  angle: string;
  keywords: string[];
  audience: string;
  /** SEO path family when published */
  pathFamily: 'knowledge' | 'cases' | 'insights' | 'topics' | 'docs';
  priority: number;
  /** Days between forced refresh when published */
  refreshDays: number;
  relatedCta: {
    href: string;
    label: string;
  };
  searchIntents: string[];
  /** Parent hub path for internal linking */
  hubHref?: string;
};

export const CONTENT_OS_LOCALES: Array<{
  locale: ContentOsLocale;
  market: string;
  uiGroup: 'zh-Hans' | 'zh-Hant' | 'en';
  weight: number;
}> = [
  { locale: 'zh-CN', market: '中国大陆', uiGroup: 'zh-Hans', weight: 100 },
  { locale: 'zh-TW', market: '台湾', uiGroup: 'zh-Hant', weight: 70 },
  { locale: 'zh-HK', market: '香港', uiGroup: 'zh-Hant', weight: 55 },
  { locale: 'zh-SG', market: '新加坡华人', uiGroup: 'zh-Hans', weight: 50 },
  { locale: 'zh-MY', market: '马来西亚华人', uiGroup: 'zh-Hans', weight: 40 },
  { locale: 'zh-US', market: '北美华人', uiGroup: 'zh-Hans', weight: 60 },
  { locale: 'en-US', market: 'Global English / US', uiGroup: 'en', weight: 80 },
  { locale: 'en-GB', market: 'UK / Europe English', uiGroup: 'en', weight: 45 },
  { locale: 'en-SG', market: 'Singapore English', uiGroup: 'en', weight: 40 },
];

const LIFE_QUESTIONS: Array<{
  slug: string;
  name: string;
  topic: string;
  /** Unique angle — NOT a shared template sentence */
  uniqueAngle: string;
  uniqueAngleEn: string;
  caseAngle: string;
  caseAngleEn: string;
  keywords: string[];
  cta: string;
  intents: string[];
}> = [
  {
    slug: 'should-i-change-job',
    name: '该不该换工作',
    topic: '换工作时机与风险窗口如何判断',
    uniqueAngle: '用事业十神与大运交接判断「换岗是窗口还是逃避」，并设计 90 天可回访验证',
    uniqueAngleEn: 'Separate promotion window vs escape urge using career stars and dayun handoff; design a 90-day revisit',
    caseAngle: '跳槽焦虑下如何拆「环境压力 vs 结构不适配」两个变量',
    caseAngleEn: 'Under job-change anxiety, separate environment pressure from structure mismatch',
    keywords: ['换工作', '跳槽', '职业窗口', '事业运'],
    cta: '/dimensions/career-industry',
    intents: ['现在适合跳槽吗', '换工作看八字还是现实', '跳槽年份怎么选'],
  },
  {
    slug: 'when-to-marry',
    name: '什么时候适合谈婚论嫁',
    topic: '婚恋推进窗口与关系节奏',
    uniqueAngle: '关系推进看夫妻宫与流年互动窗口，而不是「今年吉不吉」一句话',
    uniqueAngleEn: 'Relationship pacing via spouse palace and yearly interaction windows—not a single lucky-year label',
    caseAngle: '想结婚但对方犹豫：如何判断该推进还是给空间',
    caseAngleEn: 'Want to marry while partner hesitates: push forward or give space',
    keywords: ['结婚', '婚恋', '谈婚论嫁', '关系节奏'],
    cta: '/dimensions/marriage',
    intents: ['今年适合结婚吗', '感情推进还是观望', '合婚怎么看'],
  },
  {
    slug: 'invest-or-hold',
    name: '今年宜进还是宜守',
    topic: '财富节奏与风险控制窗口',
    uniqueAngle: '财星与比劫节奏决定「加仓验证」还是「现金流防守」，禁止收益承诺',
    uniqueAngleEn: 'Wealth-star vs peer competition sets verify-size vs cash-flow defense—never return promises',
    caseAngle: '想加杠杆时如何用时位层做止损式决策',
    caseAngleEn: 'When tempted to leverage, use timing layer for stop-loss style decisions',
    keywords: ['投资', '破财', '守成', '现金流'],
    cta: '/dimensions/investment',
    intents: ['今年适合投资吗', '破财年怎么守', '财富节奏怎么看'],
  },
  {
    slug: 'move-city',
    name: '要不要换城市发展',
    topic: '迁移择城与环境层压力测试',
    uniqueAngle: '迁城是环境层重排：用神发挥方式对照城市成本与行业密度，先小步验证',
    uniqueAngleEn: 'Relocation is environment reset: match useful-god play-style to cost and industry density; pilot first',
    caseAngle: '一线回流 vs 海外：如何写清可支付边界与 90 天试住',
    caseAngleEn: 'Tier-1 return vs overseas: write payability bounds and a 90-day trial stay',
    keywords: ['迁移', '换城市', '定居', '城市运'],
    cta: '/movement',
    intents: ['换城市看风水还是机会', '海外发展适合吗', '迁城时机'],
  },
  {
    slug: 'study-major',
    name: '升学与专业方向',
    topic: '升学方向、考试窗口与专业匹配',
    uniqueAngle: '专业选择对齐印星/食伤发挥，而不是只听「热门专业」叙事',
    uniqueAngleEn: 'Major choice aligns with resource vs expression play-style—not hot-major hype alone',
    caseAngle: '家庭期望与个人兴趣冲突时，如何设 30 天信息收集动作',
    caseAngleEn: 'Family expectation vs interest: design a 30-day information-gathering action',
    keywords: ['升学', '高考', '专业选择', '学业'],
    cta: '/dimensions/study-career',
    intents: ['专业怎么选', '考试年份运势', '升学焦虑'],
  },
  {
    slug: 'start-business',
    name: '创业还是打工',
    topic: '创业窗口、合伙风险与现金流',
    uniqueAngle: '创业看比劫/财官组合与现金流跑道，先验证再加码',
    uniqueAngleEn: 'Founding depends on peer/wealth/officer mix and cash runway—validate before scaling',
    caseAngle: '有合伙邀约时如何判断角色分工是否匹配结构',
    caseAngleEn: 'When offered partnership, check role split against structure fit',
    keywords: ['创业', '合伙', '事业', '风险'],
    cta: '/dimensions/career-industry',
    intents: ['适合创业吗', '合伙合不合', '创业年份'],
  },
  {
    slug: 'name-change',
    name: '改名有没有用',
    topic: '起名改名与用神补充边界',
    uniqueAngle: '改名只能补用神与表达边界，不能替代结构与时位判断',
    uniqueAngleEn: 'Name change can support useful-god expression—it cannot replace structure or timing',
    caseAngle: '想靠改名转运：如何识别不现实预期并改走可验证路径',
    caseAngleEn: 'Hoping a name change flips fate: spot unrealistic expectations and switch to verifiable paths',
    keywords: ['改名', '起名', '五行', '用神'],
    cta: '/tools/naming',
    intents: ['改名看什么', '姓名五行', '起名用神'],
  },
  {
    slug: 'read-my-report',
    name: '怎么读懂命理报告',
    topic: '普通人如何读结构、阶段与动作',
    uniqueAngle: '报告阅读顺序：先结构摘要 → 阶段窗口 → 一条可验证动作，拒绝吉凶标签跳读',
    uniqueAngleEn: 'Report reading order: structure summary → stage window → one verifiable action; no luck-label skimming',
    caseAngle: '看完报告更焦虑：如何把结论改写成 7 天实验',
    caseAngleEn: 'More anxious after reading a report: rewrite conclusions as a 7-day experiment',
    keywords: ['报告', '解读', '命盘', '人生K线'],
    cta: '/docs/read-first-report',
    intents: ['报告怎么看', '五行强弱', '用神是什么'],
  },
  {
    slug: 'true-solar-time',
    name: '真太阳时为什么重要',
    topic: '出生时间精度与排盘误差',
    uniqueAngle: '真太阳时影响时柱边界：不确定时降级判断并标注可信度',
    uniqueAngleEn: 'True solar time hits hour-pillar boundaries: degrade confidence when birth time is uncertain',
    caseAngle: '只记得大概时辰：如何做区间排盘与结论降级',
    caseAngleEn: 'Only approximate birth hour: interval charting and conclusion downgrade',
    keywords: ['真太阳时', '排盘', '时柱', '出生时间'],
    cta: '/docs/solar-time',
    intents: ['真太阳时怎么算', '时辰不准怎么办', '排盘误差'],
  },
  {
    slug: 'benmingnian',
    name: '本命年要注意什么',
    topic: '本命年、太岁与节奏管理（非恐吓）',
    uniqueAngle: '本命年是节奏管理题：收敛高风险敞口、加强回访，而不是禁忌清单恐吓',
    uniqueAngleEn: 'Benmingnian is pacing management: cut risk exposure and strengthen revisits—not taboo scare lists',
    caseAngle: '本命年想创业/结婚：如何用风险分层而不是一刀切禁止',
    caseAngleEn: 'Want to found/marry in benmingnian: risk tiers instead of blanket bans',
    keywords: ['本命年', '太岁', '流年', '风险'],
    cta: '/dimensions/fortune-rhythm',
    intents: ['本命年忌讳', '太岁是什么', '本命年适合做什么'],
  },
];

const INDUSTRIES = [
  { slug: 'tech-internet', name: '互联网 / 科技', keywords: ['互联网', '科技', '产品', '工程师'] },
  { slug: 'finance', name: '金融 / 投资', keywords: ['金融', '银行', '投资', '基金'] },
  { slug: 'healthcare', name: '医疗健康', keywords: ['医疗', '健康', '制药', '护理'] },
  { slug: 'education', name: '教育培训', keywords: ['教育', '培训', '教培', '知识付费'] },
  { slug: 'consumer-brand', name: '消费品牌', keywords: ['消费', '品牌', '零售', '电商'] },
  { slug: 'real-estate', name: '地产 / 空间', keywords: ['地产', '建筑', '空间', '居住'] },
  { slug: 'content-media', name: '内容 / 传媒', keywords: ['内容', '传媒', '自媒体', '影视'] },
  { slug: 'manufacturing', name: '制造 / 供应链', keywords: ['制造', '供应链', '工厂', '外贸'] },
  { slug: 'public-policy', name: '公共 / 体制', keywords: ['体制', '公务员', '公共', '政策'] },
  { slug: 'freelance-creator', name: '自由职业 / 创作者', keywords: ['自由职业', '创作者', '独立', '副业'] },
];

const DAY_MASTERS = [
  { slug: 'jia-wood', name: '甲木日主', element: '木' },
  { slug: 'yi-wood', name: '乙木日主', element: '木' },
  { slug: 'bing-fire', name: '丙火日主', element: '火' },
  { slug: 'ding-fire', name: '丁火日主', element: '火' },
  { slug: 'wu-earth', name: '戊土日主', element: '土' },
  { slug: 'ji-earth', name: '己土日主', element: '土' },
  { slug: 'geng-metal', name: '庚金日主', element: '金' },
  { slug: 'xin-metal', name: '辛金日主', element: '金' },
  { slug: 'ren-water', name: '壬水日主', element: '水' },
  { slug: 'gui-water', name: '癸水日主', element: '水' },
];

const LIFE_STAGES = [
  { slug: 'age-18-25', name: '18-25 起步期', keywords: ['起步', '学业', '初入职场'] },
  { slug: 'age-26-35', name: '26-35 扩张期', keywords: ['扩张', '成家', '事业爬坡'] },
  { slug: 'age-36-45', name: '36-45 重组期', keywords: ['重组', '中年', '转折'] },
  { slug: 'age-46-60', name: '46-60 守成与传承', keywords: ['守成', '传承', '健康'] },
  { slug: 'post-60', name: '60+ 节奏重排', keywords: ['退休', '健康', '家庭'] },
];

const TOOLS = [
  { slug: 'bazi-chart', name: '八字排盘', href: '/analyze', keywords: ['八字', '排盘', '四柱'] },
  { slug: 'life-kline', name: '人生K线', href: '/analyze', keywords: ['人生K线', '运势曲线', '大运'] },
  { slug: 'hehun', name: '合婚双盘', href: '/hehun', keywords: ['合婚', '双盘', '配对'] },
  { slug: 'naming', name: '起名工坊', href: '/tools/naming', keywords: ['起名', '改名', '五行'] },
  { slug: 'fengshui', name: '空间场模拟', href: '/tools/fengshui-space', keywords: ['风水', '空间', '户型'] },
  { slug: 'almanac', name: '黄历择日', href: '/almanac', keywords: ['黄历', '择日', '宜忌'] },
  { slug: 'astro', name: '星座体系', href: '/astro', keywords: ['星座', '本命盘', '运势'] },
  { slug: 'predictions', name: '预测回访', href: '/predictions', keywords: ['预测', '回访', '验证'] },
];

const METHODOLOGY = [
  {
    slug: 'world-yi-six-steps',
    name: '世界易六步判断法',
    topic: '结构→时位→环境→动作→风险 的可执行判断',
    keywords: ['世界易', '六步判断', '结构时位'],
  },
  {
    slug: 'structure-timing-environment',
    name: '结构 · 时位 · 环境',
    topic: '三层对齐后再谈吉凶标签',
    keywords: ['结构', '时位', '环境', '判断框架'],
  },
  {
    slug: 'yongshen-plain',
    name: '用神人话版',
    topic: '用神不是好运符，是发挥方式与补益方向',
    keywords: ['用神', '喜用', '五行'],
  },
  {
    slug: 'dayun-vs-liunian',
    name: '大运与流年',
    topic: '十年底色 vs 一年窗口如何叠用',
    keywords: ['大运', '流年', '节奏'],
  },
];

function isEnglish(locale: ContentOsLocale) {
  return locale.startsWith('en');
}

function isTraditional(locale: ContentOsLocale) {
  return locale === 'zh-TW' || locale === 'zh-HK';
}

function localizeTopic(topic: string, locale: ContentOsLocale) {
  if (isEnglish(locale)) {
    return topic; // generator rewrites fully for EN
  }
  if (isTraditional(locale)) {
    // Lightweight traditional markers; full rewrite happens in LLM
    return topic;
  }
  return topic;
}

function slotKey(parts: string[]) {
  return parts.map((p) => p.trim().toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff-]+/g, '-')).join('__');
}

function buildDimensionSlots(locale: ContentOsLocale, market: string, weight: number): DestinyMatrixSlot[] {
  return DIMENSIONS.map((dim) => {
    const english = isEnglish(locale);
    return {
      key: slotKey(['dimension', dim.slug, 'pillar', locale]),
      entityKind: 'dimension' as const,
      entitySlug: dim.slug,
      entityName: dim.title,
      template: 'pillar-guide' as const,
      contentType: 'knowledge' as const,
      locale,
      market,
      topic: english
        ? `How to judge “${dim.question}” with structure, timing, and environment`
        : `如何用结构·时位·环境判断「${dim.question}」`,
      angle: english
        ? `${dim.description} Decision framework, not fortune labels.`
        : `${dim.description} 强调可验证动作，而非吉凶标签。`,
      keywords: [dim.title, dim.question, '人生K线', '十维度', 'World Yi'],
      audience: english ? `Users focused on ${dim.title}` : `关注「${dim.title}」的用户`,
      pathFamily: 'topics',
      priority: weight + (dim.priority === 'p0' ? 30 : dim.priority === 'p1' ? 15 : 5),
      refreshDays: 90,
      relatedCta: { href: `/dimensions/${dim.slug}`, label: english ? 'Open dimension' : '进入十维度' },
      searchIntents: [dim.question, `${dim.title}怎么看`, `${dim.title}运势`],
    };
  });
}

function buildLifeQuestionSlots(locale: ContentOsLocale, market: string, weight: number): DestinyMatrixSlot[] {
  return LIFE_QUESTIONS.flatMap((q) => {
    const base = {
      entityKind: 'life-question' as const,
      entitySlug: q.slug,
      entityName: q.name,
      locale,
      market,
      keywords: [...q.keywords, '人生命运', '人生K线'],
      audience: isEnglish(locale) ? 'People facing a real life decision' : '面临真实人生抉择的用户',
      relatedCta: { href: q.cta, label: isEnglish(locale) ? 'Try the tool' : '去验证' },
      searchIntents: q.intents,
    };

    return [
      {
        ...base,
        key: slotKey(['life-question', q.slug, 'how-to', locale]),
        template: 'how-to' as const,
        contentType: 'knowledge' as const,
        topic: localizeTopic(q.topic, locale),
        angle: isEnglish(locale) ? q.uniqueAngleEn : q.uniqueAngle,
        pathFamily: 'knowledge' as const,
        priority: weight + 25,
        refreshDays: 60,
      },
      {
        ...base,
        key: slotKey(['life-question', q.slug, 'case', locale]),
        template: 'case-study' as const,
        contentType: 'case' as const,
        topic: localizeTopic(`${q.name}：真实决策压力如何拆解`, locale),
        angle: isEnglish(locale) ? q.caseAngleEn : q.caseAngle,
        pathFamily: 'cases' as const,
        priority: weight + 18,
        refreshDays: 75,
      },
    ];
  });
}

function buildCitySlots(locale: ContentOsLocale, market: string, weight: number): DestinyMatrixSlot[] {
  const english = isEnglish(locale);
  return GEO_CITY_SEEDS.map((city) => ({
    key: slotKey(['city', city.slug, 'insight', locale]),
    entityKind: 'city' as const,
    entitySlug: city.slug.replace(/^world-yi-city-/, ''),
    entityName: english ? city.cityEn : city.city,
    template: 'pillar-guide' as const,
    contentType: 'insight' as const,
    locale,
    market,
    topic: english
      ? `City pressure-test: ${city.cityEn} for life rhythm decisions`
      : `城市压力测试：${city.city}与个人节奏判断`,
    angle: english ? city.summaryEn : city.summary,
    keywords: english
      ? [city.cityEn, city.regionEn, ...city.focusEn, 'migration', 'World Yi']
      : [city.city, city.region, ...city.focus, '迁移', '城市观察'],
    audience: english
      ? `Readers considering life in ${city.cityEn}`
      : `关注${city.city}发展/居住/迁移的用户`,
    pathFamily: 'insights',
    priority: weight + 20,
    refreshDays: 120,
    relatedCta: { href: '/movement', label: english ? 'Migration tools' : '迁移择城' },
    searchIntents: english
      ? [`${city.cityEn} bazi city fit`, `move to ${city.cityEn}`, `${city.cityEn} career rhythm`]
      : [`${city.city}适合发展吗`, `${city.city}风水`, `${city.city}迁移`],
  }));
}

function buildIndustrySlots(locale: ContentOsLocale, market: string, weight: number): DestinyMatrixSlot[] {
  return INDUSTRIES.map((ind) => ({
    key: slotKey(['industry', ind.slug, 'insight', locale]),
    entityKind: 'industry' as const,
    entitySlug: ind.slug,
    entityName: ind.name,
    template: 'pillar-guide' as const,
    contentType: 'insight' as const,
    locale,
    market,
    topic: isEnglish(locale)
      ? `Industry rhythm: ${ind.name} career fit and cycle windows`
      : `行业节奏：${ind.name}的适配度与周期窗口`,
    angle: isEnglish(locale)
      ? 'Match personal structure to industry density and cycle, not job titles alone.'
      : '把个人结构对上行业密度与周期，而不是只看职位名称。',
    keywords: [...ind.keywords, '行业', '职业', '赛道'],
    audience: isEnglish(locale) ? `Professionals in ${ind.name}` : `关注${ind.name}赛道的用户`,
    pathFamily: 'insights',
    priority: weight + 16,
    refreshDays: 100,
    relatedCta: { href: '/dimensions/career-industry', label: isEnglish(locale) ? 'Career dimension' : '工作行业研判' },
    searchIntents: [`${ind.name}适合吗`, `${ind.name}行业运`, `${ind.keywords[0]}跳槽`],
  }));
}

function buildDayMasterSlots(locale: ContentOsLocale, market: string, weight: number): DestinyMatrixSlot[] {
  return DAY_MASTERS.map((dm) => ({
    key: slotKey(['day-master', dm.slug, 'guide', locale]),
    entityKind: 'day-master' as const,
    entitySlug: dm.slug,
    entityName: dm.name,
    template: 'how-to' as const,
    contentType: 'knowledge' as const,
    locale,
    market,
    topic: isEnglish(locale)
      ? `${dm.name}: strengths, friction, and play-style (not fate labels)`
      : `${dm.name}：发挥方式、摩擦点与适配场景（非命运标签）`,
    angle: isEnglish(locale)
      ? 'Day master as operating style, not destiny verdict.'
      : '日主是发挥方式与问题取向，不是好坏判决。',
    keywords: [dm.name, dm.element, '日主', '八字', '用神'],
    audience: isEnglish(locale) ? 'Readers learning day-master basics' : '学习日主基础的用户',
    pathFamily: 'knowledge',
    priority: weight + 12,
    refreshDays: 180,
    relatedCta: { href: '/analyze', label: isEnglish(locale) ? 'Generate chart' : '免费排盘' },
    searchIntents: [`${dm.name}性格`, `${dm.name}事业`, `${dm.name}感情`],
  }));
}

function buildLifeStageSlots(locale: ContentOsLocale, market: string, weight: number): DestinyMatrixSlot[] {
  return LIFE_STAGES.map((stage) => ({
    key: slotKey(['life-stage', stage.slug, 'guide', locale]),
    entityKind: 'life-stage' as const,
    entitySlug: stage.slug,
    entityName: stage.name,
    template: 'how-to' as const,
    contentType: 'knowledge' as const,
    locale,
    market,
    topic: isEnglish(locale)
      ? `Life stage ${stage.name}: what to optimize now`
      : `人生阶段「${stage.name}」：当下该优化什么`,
    angle: isEnglish(locale)
      ? 'Stage-specific decision focus with timing windows.'
      : '按阶段收敛决策焦点，配合时间窗口。',
    keywords: [...stage.keywords, '人生阶段', '节奏'],
    audience: stage.name,
    pathFamily: 'topics',
    priority: weight + 14,
    refreshDays: 120,
    relatedCta: { href: '/dimensions/fortune-rhythm', label: isEnglish(locale) ? 'Rhythm check' : '运势节奏' },
    searchIntents: stage.keywords.map((k) => `${k}运势`),
  }));
}

function buildToolSlots(locale: ContentOsLocale, market: string, weight: number): DestinyMatrixSlot[] {
  return TOOLS.flatMap((tool) => [
    {
      key: slotKey(['tool', tool.slug, 'how-to', locale]),
      entityKind: 'tool' as const,
      entitySlug: tool.slug,
      entityName: tool.name,
      template: 'how-to' as const,
      contentType: 'knowledge' as const,
      locale,
      market,
      topic: isEnglish(locale)
        ? `How to use ${tool.name} for real decisions`
        : `如何用「${tool.name}」做真实决策`,
      angle: isEnglish(locale)
        ? 'Product tutorial mapped to decision outcomes.'
        : '产品教程映射到决策结果，而不是功能清单。',
      keywords: [...tool.keywords, '教程', '使用指南'],
      audience: isEnglish(locale) ? 'New users' : '新用户与回访用户',
      pathFamily: 'docs' as const,
      priority: weight + 22,
      refreshDays: 90,
      relatedCta: { href: tool.href, label: isEnglish(locale) ? 'Open tool' : '打开工具' },
      searchIntents: [`${tool.name}怎么用`, `${tool.name}教程`, `${tool.keywords[0]}免费`],
    },
    {
      key: slotKey(['tool', tool.slug, 'comparison', locale]),
      entityKind: 'tool' as const,
      entitySlug: tool.slug,
      entityName: tool.name,
      template: 'comparison' as const,
      contentType: 'knowledge' as const,
      locale,
      market,
      topic: isEnglish(locale)
        ? `${tool.name} vs generic online bazi tools`
        : `${tool.name} vs 普通在线八字站：差别在哪里`,
      angle: isEnglish(locale)
        ? 'Structure engine + revisit loop vs one-shot fortune labels.'
        : '结构引擎 + 回访闭环 vs 一次性吉凶标签。',
      keywords: [...tool.keywords, '对比', '选择'],
      audience: isEnglish(locale) ? 'Comparison shoppers' : '正在比较工具的用户',
      pathFamily: 'knowledge' as const,
      priority: weight + 10,
      refreshDays: 120,
      relatedCta: { href: tool.href, label: isEnglish(locale) ? 'Try free' : '免费体验' },
      searchIntents: [`${tool.name}哪个好`, '八字软件推荐', '命理网站推荐'],
    },
  ]);
}

function buildMethodologySlots(locale: ContentOsLocale, market: string, weight: number): DestinyMatrixSlot[] {
  return METHODOLOGY.map((m) => ({
    key: slotKey(['methodology', m.slug, 'pillar', locale]),
    entityKind: 'methodology' as const,
    entitySlug: m.slug,
    entityName: m.name,
    template: 'pillar-guide' as const,
    contentType: 'knowledge' as const,
    locale,
    market,
    topic: m.topic,
    angle: isEnglish(locale)
      ? 'Proprietary World Yi / Life K-Line methodology pillar.'
      : '世界易 / 人生K线差异化方法论支柱文。',
    keywords: [...m.keywords, 'World Yi', '人生K线'],
    audience: isEnglish(locale) ? 'Method-seeking readers' : '想理解方法论的用户',
    pathFamily: 'knowledge',
    priority: weight + 28,
    refreshDays: 150,
    relatedCta: { href: '/world-yi', label: isEnglish(locale) ? 'World Yi' : '世界易' },
    searchIntents: m.keywords.map((k) => `${k}是什么`),
  }));
}

function buildSeasonalSlots(locale: ContentOsLocale, market: string, weight: number, year: number): DestinyMatrixSlot[] {
  const months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  return months.map((month) => ({
    key: slotKey(['seasonal', `${year}-m${month}`, 'pulse', locale]),
    entityKind: 'seasonal' as const,
    entitySlug: `${year}-m${String(month).padStart(2, '0')}`,
    entityName: isEnglish(locale) ? `${year}-${month} rhythm pulse` : `${year}年${month}月节奏观察`,
    template: 'seasonal-pulse' as const,
    contentType: 'knowledge' as const,
    locale,
    market,
    topic: isEnglish(locale)
      ? `${year} month ${month}: what decision windows to watch (framework, not prediction theater)`
      : `${year}年${month}月：值得关注的决策窗口（框架而非恐吓式运势）`,
    angle: isEnglish(locale)
      ? 'Monthly rhythm observation using structure, timing, and environment — not fear-based horoscopes.'
      : '用结构·时位·环境做月度节奏观察，而不是恐吓式运势清单。',
    keywords: [`${year}`, `${month}月`, '流年', '月运', '节奏'],
    audience: isEnglish(locale) ? 'Readers seeking timely guidance' : '关注当月节奏的用户',
    pathFamily: 'knowledge',
    priority: weight + (month === new Date().getMonth() + 1 ? 35 : 8),
    refreshDays: 28,
    relatedCta: { href: '/almanac', label: isEnglish(locale) ? 'Almanac' : '黄历' },
    searchIntents: [`${year}年${month}月运势`, `${month}月适合做什么`, '本月运势'],
  }));
}

function buildFaqSlots(locale: ContentOsLocale, market: string, weight: number): DestinyMatrixSlot[] {
  const faqs = [
    {
      slug: 'is-bazi-scientific',
      name: '八字科学吗',
      topic: '把八字定位为结构语言与决策辅助，而非伪科学争吵',
    },
    {
      slug: 'free-vs-paid',
      name: '免费排盘够不够',
      topic: '免费结构 vs 深度报告 vs 会员：分别解决什么',
    },
    {
      slug: 'birth-time-unknown',
      name: '不知道出生时辰',
      topic: '时辰缺失时如何降级判断与标注不确定',
    },
    {
      slug: 'privacy-data',
      name: '生辰隐私安全吗',
      topic: '数据用途、保存与可删除边界',
    },
  ];

  return faqs.map((faq) => ({
    key: slotKey(['faq', faq.slug, 'answer', locale]),
    entityKind: 'faq' as const,
    entitySlug: faq.slug,
    entityName: faq.name,
    template: 'answer-engine' as const,
    contentType: 'knowledge' as const,
    locale,
    market,
    topic: faq.topic,
    angle: isEnglish(locale)
      ? 'Answer-engine optimized: direct answer → bounds → next step.'
      : '生成式搜索友好：先答 → 边界 → 下一步。',
    keywords: [faq.name, 'FAQ', '人生K线'],
    audience: isEnglish(locale) ? 'Skeptical first-time visitors' : '首次到访与犹豫用户',
    pathFamily: 'docs',
    priority: weight + 15,
    refreshDays: 180,
    relatedCta: { href: '/analyze', label: isEnglish(locale) ? 'Try free' : '免费体验' },
    searchIntents: [faq.name, faq.topic],
  }));
}

/**
 * Full catalog matrix (can be large). For production generation use
 * buildPeopleFirstCatalog / scheduler people-first mode instead.
 */
export function buildContentOsMatrix(options?: {
  locales?: ContentOsLocale[];
  year?: number;
  includeSeasonal?: boolean;
  /** Include day-master / life-stage (doorway-risk). Default false. */
  includeDoorwayRiskKinds?: boolean;
  /** Include tool comparison templates. Default false. */
  includeComparisons?: boolean;
}): DestinyMatrixSlot[] {
  const year = options?.year || new Date().getFullYear();
  // Default OFF — seasonal farms are anti-Google scaled content
  const includeSeasonal = options?.includeSeasonal === true;
  const includeDoorway = options?.includeDoorwayRiskKinds === true;
  const includeComparisons = options?.includeComparisons === true;
  const localeFilter = options?.locales
    ? new Set(options.locales)
    : null;

  const slots: DestinyMatrixSlot[] = [];

  for (const loc of CONTENT_OS_LOCALES) {
    if (localeFilter && !localeFilter.has(loc.locale)) continue;
    const { locale, market, weight } = loc;
    slots.push(
      ...buildDimensionSlots(locale, market, weight),
      ...buildLifeQuestionSlots(locale, market, weight),
      ...buildCitySlots(locale, market, weight),
      ...buildIndustrySlots(locale, market, weight),
      ...buildToolSlots(locale, market, weight).filter(
        (s) => includeComparisons || s.template !== 'comparison',
      ),
      ...buildMethodologySlots(locale, market, weight),
      ...buildFaqSlots(locale, market, weight),
    );
    if (includeDoorway) {
      slots.push(
        ...buildDayMasterSlots(locale, market, weight),
        ...buildLifeStageSlots(locale, market, weight),
      );
    }
    if (includeSeasonal) {
      // Only current month in catalog helpers that need it — full year only if explicitly requested
      const all = buildSeasonalSlots(locale, market, weight, year);
      const month = new Date().getMonth() + 1;
      slots.push(...all.filter((s) => s.entitySlug.endsWith(`-m${String(month).padStart(2, '0')}`)));
    }
  }

  return slots
    .map((s) => ({
      ...s,
      hubHref:
        s.hubHref ||
        `/topics/${
          s.entityKind === 'life-question'
            ? `q-${s.entitySlug}`
            : s.entityKind === 'dimension'
              ? `dimension-${s.entitySlug}`
              : s.entityKind === 'tool'
                ? `tool-${s.entitySlug}`
                : s.entityKind === 'city'
                  ? `city-${s.entitySlug}`
                  : s.entityKind === 'industry'
                    ? `industry-${s.entitySlug}`
                    : s.entityKind === 'day-master'
                      ? `day-master-${s.entitySlug}`
                      : `${s.entityKind}-${s.entitySlug}`
        }`,
    }))
    .sort((a, b) => b.priority - a.priority || a.key.localeCompare(b.key));
}

/**
 * People-first production catalog: primary hubs + satellites only.
 * Matches LDPlayer: entity hub depth + problem-solving satellites.
 */
export function buildPeopleFirstCatalog(options?: {
  locales?: ContentOsLocale[];
  year?: number;
}): DestinyMatrixSlot[] {
  const locales = options?.locales?.length ? options.locales : (['zh-CN'] as ContentOsLocale[]);
  return buildContentOsMatrix({
    locales,
    year: options?.year,
    includeSeasonal: true, // current month only (filtered inside)
    includeDoorwayRiskKinds: false,
    includeComparisons: false,
  });
}

export function summarizeContentOsMatrix(slots: DestinyMatrixSlot[]) {
  const byEntity = new Map<string, number>();
  const byLocale = new Map<string, number>();
  const byTemplate = new Map<string, number>();
  for (const slot of slots) {
    byEntity.set(slot.entityKind, (byEntity.get(slot.entityKind) || 0) + 1);
    byLocale.set(slot.locale, (byLocale.get(slot.locale) || 0) + 1);
    byTemplate.set(slot.template, (byTemplate.get(slot.template) || 0) + 1);
  }
  return {
    total: slots.length,
    byEntityKind: Object.fromEntries(byEntity),
    byLocale: Object.fromEntries(byLocale),
    byTemplate: Object.fromEntries(byTemplate),
    topPriority: slots.slice(0, 20).map((s) => ({
      key: s.key,
      priority: s.priority,
      topic: s.topic,
      locale: s.locale,
    })),
  };
}

/** LDPlayer-style entity hub list for /topics */
export function listDestinyEntityHubs() {
  const hubs: Array<{
    kind: DestinyEntityKind;
    slug: string;
    name: string;
    href: string;
    description: string;
  }> = [];

  for (const dim of DIMENSIONS) {
    hubs.push({
      kind: 'dimension',
      slug: dim.slug,
      name: dim.title,
      href: `/topics/dimension-${dim.slug}`,
      description: dim.question,
    });
  }
  for (const q of LIFE_QUESTIONS) {
    hubs.push({
      kind: 'life-question',
      slug: q.slug,
      name: q.name,
      href: `/topics/q-${q.slug}`,
      description: q.topic,
    });
  }
  for (const city of GEO_CITY_SEEDS) {
    hubs.push({
      kind: 'city',
      slug: city.slug.replace(/^world-yi-city-/, ''),
      name: city.city,
      href: `/topics/city-${city.slug.replace(/^world-yi-city-/, '')}`,
      description: city.summary,
    });
  }
  for (const ind of INDUSTRIES) {
    hubs.push({
      kind: 'industry',
      slug: ind.slug,
      name: ind.name,
      href: `/topics/industry-${ind.slug}`,
      description: `${ind.name}行业节奏与个人适配`,
    });
  }
  for (const dm of DAY_MASTERS) {
    hubs.push({
      kind: 'day-master',
      slug: dm.slug,
      name: dm.name,
      href: `/topics/day-master-${dm.slug}`,
      description: `${dm.name}发挥方式与适配场景`,
    });
  }
  for (const tool of TOOLS) {
    hubs.push({
      kind: 'tool',
      slug: tool.slug,
      name: tool.name,
      href: `/topics/tool-${tool.slug}`,
      description: `${tool.name}使用指南与决策路径`,
    });
  }

  return hubs;
}

export function getDestinyEntityHub(slug: string) {
  return listDestinyEntityHubs().find((hub) => hub.href === `/topics/${slug}` || hub.slug === slug) || null;
}

export function slotsForEntity(entityKind: DestinyEntityKind, entitySlug: string, locales?: ContentOsLocale[]) {
  return buildContentOsMatrix({ locales, includeSeasonal: false }).filter(
    (slot) => slot.entityKind === entityKind && slot.entitySlug === entitySlug,
  );
}
