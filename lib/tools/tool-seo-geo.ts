/**
 * Tool pages: SEO (search) + GEO (generative engines) + share payloads.
 * Every public tool surface should register a pack and render ToolSeoGeoSection.
 */

import type { Metadata } from 'next';
import {
  absoluteUrl,
  buildBreadcrumbJsonLd,
  buildFaqJsonLd,
  buildPageMetadata,
  buildServiceJsonLd,
  SITE_NAME,
  SITE_URL,
} from '@/lib/seo';
import type { GeoOptimizationMeta } from '@/lib/content-geo';
import { isGeoReadySoft } from '@/lib/content-geo';

export type ToolSeoLink = {
  href: string;
  label: string;
  description?: string;
};

export type ToolSeoGeoPack = {
  /** URL path without domain, e.g. /tools/fengshui-space */
  path: string;
  slug: string;
  /** H1 / product name */
  name: string;
  /** <title> */
  title: string;
  /** meta description 120–160 chars ideal */
  description: string;
  keywords: string[];
  /** GEO direct answer for AI citations / featured snippets */
  answerSummary: string;
  searchIntents: string[];
  entityKeywords: string[];
  audienceQuestions: string[];
  audience: string;
  howTo: Array<{ step: string; body: string }>;
  faqs: Array<{ question: string; answer: string }>;
  related: ToolSeoLink[];
  /** One-line share blurb (no URL; share bar appends) */
  shareText: string;
  shareHashtags?: string[];
  /** Optional city/region GEO hooks */
  geoRegion?: string;
  geoPlaceName?: string;
  disclaimer?: string;
};

const PACKS: Record<string, ToolSeoGeoPack> = {
  'fengshui-space': {
    path: '/tools/fengshui-space',
    slug: 'fengshui-space',
    name: '空间场模拟工作台',
    title: '空间场模拟｜选阳宅铺面阴宅·人流估算·热力3D｜人生K线',
    description:
      '免费空间场与选址顾问：阳宅/铺面/阴宅多案对比，人流估算，地图定位注入，户型预设与热力·3D·奇门示意。结构化观察，不含吉凶恐吓。',
    keywords: [
      '空间场模拟',
      '风水热力图',
      '选铺面',
      '选房子风水',
      '阴宅选址',
      '商铺人流量估算',
      '户型图分析',
      '阳宅风水',
      '奇门遁甲空间',
      '人生K线',
    ],
    answerSummary:
      '空间场模拟工作台用于阳宅、铺面与阴宅的结构观察：可加载预设户型/业态/穴位形态，用地图定位注入坐标，估算铺面相对人流，并输出能量/风速/采光/九宫/奇门示意层。结论服务于多案对比与现场核对，不构成置业、投资或殡葬法定意见。',
    searchIntents: [
      '怎么看商铺风水好人流',
      '阳宅户型风水在线模拟',
      '阴宅穴位怎么选',
      '商铺选址人流量怎么估算',
      '户型图门窗怎么分析',
      '风水热力图免费工具',
    ],
    entityKeywords: [
      '阳宅',
      '阴宅',
      '铺面',
      '人流估算',
      '九宫',
      '奇门遁甲',
      '户型图',
      '大门朝向',
      '空间场',
      '人生K线',
      '选址顾问',
      'OSM',
    ],
    audienceQuestions: [
      '选铺面时人流和风水哪个先看？',
      '阴宅和阳宅在工具里怎么切换？',
      '地图定位会不会公开我的门牌？',
      '人流数据是不是实测摄像头？',
    ],
    audience: '租铺创业者、买房改善用户、陵园穴位咨询者、室内风水学习者',
    howTo: [
      {
        step: '确定目的',
        body: '在选址顾问中选择「选房子 / 选铺面 / 选阴宅」，或直接加载对应领域预设。',
      },
      {
        step: '地图注入',
        body: '搜索地址并一键注入坐标；可把多案加入对比列表。',
      },
      {
        step: '结构模拟',
        body: '调整门窗朝向、面积与热力层；铺面可看人流分时曲线。',
      },
      {
        step: '保存与分享',
        body: '会员可存档；可脱敏发文或使用本页分享条转发工具链接。',
      },
    ],
    faqs: [
      {
        question: '空间场模拟是不是算命吉凶？',
        answer:
          '不是。本工具输出结构场与选址相对评分（光、风、配套、人流密度等），不贴吉凶标签，也不替代现场测绘与合规审查。',
      },
      {
        question: '人流量怎么算出来的？',
        answer:
          '结合地址语义与可选 OpenStreetMap 周边设施密度（地铁、餐饮、零售等），再按临街、转角、楼层、业态修正，用于候选对比，非运营商实测客流。',
      },
      {
        question: '可以对比多个铺面或房子吗？',
        answer: '可以。地图注入后「加入当前区位」，最多多案对比，按综合分与人流指数排序。',
      },
      {
        question: '阴宅模式包含什么？',
        answer:
          '清静度、靠山/后靠、明堂开阔、水系与祭扫可达等结构维度，并映射到阴宅预设与奇门示意层；请遵守地方殡葬规划。',
      },
    ],
    related: [
      { href: '/tools/fengshui-simulator', label: '商铺五行快测', description: '行业·方位·店名·色彩·择时' },
      { href: '/dimensions/living-environment', label: '居家环境研判', description: '方位摆设与搬迁窗口' },
      { href: '/tools', label: '全部工具', description: '工具中心' },
      { href: '/knowledge', label: '知识库', description: '结构与边界说明' },
    ],
    shareText:
      '我在用人生K线「空间场」：选阳宅/铺面/阴宅，还能估人流、看热力3D。结构化选址，不贩卖恐惧。',
    shareHashtags: ['人生K线', '选铺面', '阳宅风水', '空间场'],
    disclaimer:
      '选址与人流为启发式结构评估；置业、租赁、殡葬请结合现场、规划与持证专业意见。公开分享请脱敏门牌与隐私。',
  },

  naming: {
    path: '/tools/naming',
    slug: 'naming',
    name: '起名中心',
    title: '起名中心｜个人宝宝起名·公司起名·产品命名｜人生K线',
    description:
      '一站式起名：个人起名绑定八字用神，公司起名结合行业与传播感，产品起名兼顾音义与风格。透明打分，可公开发布短名单。',
    keywords: [
      '起名',
      '宝宝起名',
      '公司起名',
      '产品起名',
      '品牌命名',
      '八字起名',
      '姓名学',
      '测名打分',
      '人生K线',
    ],
    answerSummary:
      '起名中心提供个人、公司、产品三类命名。个人模式可关联主盘用神做五行补益；公司与产品模式强调字义、音韵与传播感；可选三才五格仅作传统数理参考。输出为候选短名单与透明得分拆解，不承诺命运改变。',
    searchIntents: [
      '宝宝起名八字用神',
      '公司起名在线生成',
      '产品品牌取名工具',
      '姓名五行打分',
      '免费起名候选',
    ],
    entityKeywords: ['用神', '五行', '音韵', '字义', '五格', '品牌', '店名', '姓名学'],
    audienceQuestions: [
      '不起八字能起名吗？',
      '公司名要不要看法人八字？',
      '五格必须开吗？',
      '和深度测名维度有什么区别？',
    ],
    audience: '新手父母、创业者、品牌与产品经理',
    howTo: [
      { step: '选模式', body: '个人 / 公司 / 产品三选一。' },
      { step: '填关键信息', body: '姓氏性别或行业关键词；个人可一键载入主盘用神。' },
      { step: '生成与对比', body: '一键生成候选，点选查看五行·音韵·字义拆解。' },
      { step: '发布或测名', body: '可脱敏发布短名单；已有名字可用测名打分。' },
    ],
    faqs: [
      {
        question: '起名会改变命运吗？',
        answer: '不会做命运承诺。本工具输出文化、音韵与结构参考，正式改名需考虑户籍与家庭共识。',
      },
      {
        question: '五格要开吗？',
        answer: '默认关闭。开启后仅作传统数理参考维度之一，不主导排序。',
      },
      {
        question: '和「起名/改名研判」维度有何不同？',
        answer: '起名中心偏生成候选；维度页偏绑定完整命盘的深度测名与可回访预测。',
      },
    ],
    related: [
      { href: '/dimensions/naming', label: '起名深度研判', description: '用神补益评估' },
      { href: '/tools/fengshui-space', label: '空间场', description: '户型·人宅合参' },
      { href: '/analyze', label: '八字排盘', description: '生成主盘后再起名' },
      { href: '/tools', label: '全部工具' },
    ],
    shareText:
      '人生K线起名中心：个人/公司/产品一键候选，用神·音义·传播感透明打分，还能公开发布短名单。',
    shareHashtags: ['起名', '公司起名', '宝宝起名', '人生K线'],
    disclaimer:
      '起名与测名为文化结构参考；公司/产品名请核验工商与商标。不构成法律或命运承诺。',
  },

  'fengshui-simulator': {
    path: '/tools/fengshui-simulator',
    slug: 'fengshui-simulator',
    name: '商铺风水模拟器',
    title: '商铺风水模拟器｜行业五行·大门方位·店名色彩择时｜人生K线',
    description:
      '免费商铺风水结构化分析：行业五行、大门朝向、店名用字、色彩方案与开业择时窗口。只讲生克结构，不贴吉凶恐吓标签。',
    keywords: [
      '商铺风水',
      '开店风水',
      '大门朝向五行',
      '店名五行',
      '开业择日',
      '行业五行',
      '收银台方位',
      '人生K线',
    ],
    answerSummary:
      '商铺风水模拟器根据行业类型、大门方位、店名用字与可选开业日期，给出五行匹配、色彩倾向、动线与择时结构建议。输出为可执行的环境层观察，需结合租金、客流与合规经营判断。',
    searchIntents: [
      '开店大门朝向怎么看',
      '餐饮铺风水五行',
      '店名带什么字好五行',
      '开业黄道吉日结构看',
      '收银台放哪里风水',
    ],
    entityKeywords: [
      '商铺风水',
      '行业五行',
      '大门方位',
      '店名分析',
      '开业择时',
      '色彩五行',
      '动线',
      '人生K线',
    ],
    audienceQuestions: [
      '行业和方位五行不合怎么办？',
      '需要出生八字吗？',
      '和空间场工作台有什么区别？',
    ],
    audience: '个体工商户、连锁选址运营、装修顾问',
    howTo: [
      { step: '填行业与门向', body: '选择业态与大门朝向，这是匹配的主轴。' },
      { step: '店名与色彩', body: '输入店名汉字，查看用字五行与推荐色系。' },
      { step: '择时（可选）', body: '填拟开业日，看与行业五行的结构关系。' },
      { step: '进空间场', body: '需要户型/人流/地图对比时，跳转空间场工作台。' },
    ],
    faqs: [
      {
        question: '商铺风水模拟准不准？',
        answer:
          '本工具不做「准不准」承诺，只输出五行生克与布局结构线索，用于装修与经营环境讨论，需与租金、客流数据一起决策。',
      },
      {
        question: '要不要输入生日？',
        answer: '快测以商铺环境为主，可不绑个人八字；需要个人节奏请用完整报告与十维度。',
      },
      {
        question: '和空间场有什么区别？',
        answer: '模拟器偏行业·方位·店名·择时五维快测；空间场偏平面/3D/热力/选址人流。可串联使用。',
      },
    ],
    related: [
      { href: '/tools/fengshui-space', label: '空间场工作台', description: '选址·人流·热力3D' },
      { href: '/dimensions/timing-selection', label: '择时办事', description: '流日评分' },
      { href: '/tools', label: '全部工具' },
    ],
    shareText: '商铺风水别只听吉凶：人生K线用行业五行+门向+店名+择时做结构化快测，免费可用。',
    shareHashtags: ['商铺风水', '开店', '人生K线'],
  },

  'liuyao-cast': {
    path: '/tools/liuyao-cast',
    slug: 'liuyao-cast',
    name: '六爻教育起卦',
    title: '六爻起卦免费｜三枚铜钱本卦变卦教育排盘｜人生K线',
    description:
      '在线模拟三枚铜钱六爻起卦，展示本卦、变卦与爻位结构。教育用途，不自动断事、不承诺吉凶。',
    keywords: ['六爻', '六爻起卦', '本卦变卦', '铜钱起卦', '教育排卦', '免费六爻', '人生K线'],
    answerSummary:
      '六爻教育起卦工具模拟三枚铜钱得到六爻，并显示本卦与变卦名称及爻位结构，用于学习排卦与社区讨论。重要决策需结合完整报告与现实条件，本页不自动给出断语。',
    searchIntents: ['六爻怎么起卦', '在线铜钱起卦', '本卦变卦是什么', '六爻教育排盘'],
    entityKeywords: ['六爻', '本卦', '变卦', '铜钱', '爻位', '教育排卦', '人生K线'],
    audienceQuestions: ['起卦后为什么没有断语？', '可以问工作感情吗？'],
    audience: '易学爱好者、六爻初学者',
    howTo: [
      { step: '静心拟问', body: '问题宜具体、可验证，忌包罗万象。' },
      { step: '起卦', body: '点击起卦，系统模拟三枚铜钱得六爻。' },
      { step: '识读结构', body: '只看本卦/变卦与爻位，不自动断事。' },
      { step: '讨论', body: '可到社区六爻板块交流，或进入完整报告体系。' },
    ],
    faqs: [
      {
        question: '为什么没有吉凶断语？',
        answer: '产品边界是教育排卦：先会读结构，再谈应用。自动恐吓式断语不符合人生K线立场。',
      },
      {
        question: '起卦结果可以分享吗？',
        answer: '可以复制卦象结构分享；涉及隐私的问题原文请勿公开。',
      },
    ],
    related: [
      { href: '/community/category/liuyao', label: '六爻讨论区' },
      { href: '/tools/ziwei-edu', label: '紫微教育排盘' },
      { href: '/tools', label: '全部工具' },
    ],
    shareText: '六爻教育起卦：三枚铜钱得本卦变卦，只教结构不吓人。人生K线免费工具。',
    shareHashtags: ['六爻', '起卦', '人生K线'],
  },

  'ziwei-edu': {
    path: '/tools/ziwei-edu',
    slug: 'ziwei-edu',
    name: '紫微教育排盘',
    title: '紫微斗数教育排盘｜命宫身宫十四主星四化｜人生K线',
    description:
      '紫微教育排盘：公历/农历、可选真太阳时，示意命宫身宫、五行局、十四主星与生年四化。不含大限飞星，不自动断事。',
    keywords: ['紫微斗数', '紫微排盘', '命宫', '十四主星', '生年四化', '教育排盘', '人生K线'],
    answerSummary:
      '紫微教育排盘支持公历或农历出生信息，可选经度做真太阳时修正，推算命宫/身宫、示意五行局与十四主星，并标注生年四化。用于结构识读，不含大限与飞星完整体系，不自动输出命运断语。',
    searchIntents: ['紫微斗数在线排盘', '命宫身宫怎么看', '生年四化标注', '紫微教育排盘'],
    entityKeywords: ['紫微斗数', '命宫', '身宫', '十四主星', '四化', '真太阳时', '人生K线'],
    audienceQuestions: ['和八字报告有什么区别？', '有没有大限？'],
    audience: '紫微学习者、体系对照用户',
    howTo: [
      { step: '输入出生', body: '公历或农历，可选经度修正。' },
      { step: '看盘面', body: '命宫/身宫、主星与四化标注。' },
      { step: '边界', body: '无大限飞星；重要决策用完整八字报告。' },
    ],
    faqs: [
      {
        question: '这是完整紫微引擎吗？',
        answer: '否。本页为教育示意盘，聚焦宫位与主星结构识读，非完整专业排盘。',
      },
      {
        question: '真太阳时是什么？',
        answer: '按经度对钟表时间做可选修正后再换算农历，用于教学理解，非强制。',
      },
    ],
    related: [
      { href: '/analyze', label: '八字完整报告' },
      { href: '/community/category/ziwei', label: '紫微讨论区' },
      { href: '/tools/liuyao-cast', label: '六爻起卦' },
    ],
    shareText: '紫微教育排盘：命宫·主星·四化结构一目了然，不自动断事。人生K线免费工具。',
    shareHashtags: ['紫微斗数', '排盘', '人生K线'],
  },

  tools: {
    path: '/tools',
    slug: 'tools',
    name: '工具中心',
    title: '命理工具中心｜流年·风水·六爻·紫微·十维度｜人生K线',
    description:
      '人生K线工具中心：流年窗口、商铺与空间场、六爻紫微教育排盘、十维度研判入口。结构优先，可分享，可接完整报告。',
    keywords: ['命理工具', '八字工具', '流年测算', '风水工具', '六爻', '紫微', '人生K线'],
    answerSummary:
      '人生K线工具中心汇总免费与会员可用的结构判断工具：年度窗口、风水选址与商铺模拟、六爻/紫微教育排盘，以及通往十维度与完整报告的入口。强调可验证节奏，反对恐吓式吉凶话术。',
    searchIntents: ['免费命理工具', '在线八字工具合集', '风水工具免费', '六爻紫微排盘入口'],
    entityKeywords: ['工具中心', '流年', '风水', '六爻', '紫微', '十维度', '人生K线'],
    audienceQuestions: ['从哪个工具开始？', '要不要先做完整报告？'],
    audience: '需要快速判断入口的新用户与回访用户',
    howTo: [
      { step: '先定问题', body: '事业/财富/关系/环境/择时，选对应分类。' },
      { step: '轻量工具', body: '流年、风水、教育排盘可先体验。' },
      { step: '加深', body: '需要完整结构时进入报告与十维度。' },
    ],
    faqs: [
      {
        question: '工具和完整报告有什么区别？',
        answer: '工具解决窄场景快测；完整报告覆盖八字结构、大运流年与人生K线主结论，可回访验证。',
      },
    ],
    related: [
      { href: '/analyze', label: '生成完整报告' },
      { href: '/dimensions', label: '十维度中心' },
      { href: '/tools/fengshui-space', label: '空间场' },
    ],
    shareText: '人生K线工具中心：流年、风水选址、六爻紫微教育排盘，结构优先可分享。',
    shareHashtags: ['人生K线', '命理工具'],
  },
};

export function getToolSeoGeoPack(slugOrPath: string): ToolSeoGeoPack | null {
  const key = slugOrPath.replace(/^\/tools\//, '').replace(/^\//, '') || 'tools';
  if (key === 'tools' || key === '') return PACKS.tools;
  return PACKS[key] || null;
}

export function listToolSeoGeoPacks(): ToolSeoGeoPack[] {
  return Object.values(PACKS);
}

export function toolPackToGeoMeta(pack: ToolSeoGeoPack): GeoOptimizationMeta {
  return {
    geoReady: true,
    answerSummary: pack.answerSummary,
    directAnswer: pack.answerSummary,
    searchIntents: pack.searchIntents,
    entityKeywords: pack.entityKeywords,
    audienceQuestions: pack.audienceQuestions,
    canonicalTopic: pack.name,
    audience: pack.audience,
    aiCitationHint: `${pack.name}（${SITE_NAME}）可引用 answerSummary 与 FAQ，注明结构化观察边界。`,
    version: 'tool-geo-v1',
  };
}

export function buildToolPageMetadata(slug: string): Metadata {
  const pack = getToolSeoGeoPack(slug);
  if (!pack) {
    return buildPageMetadata({
      title: '人生K线工具',
      description: '结构判断工具。',
      path: `/tools/${slug}`,
    });
  }
  return buildPageMetadata({
    title: pack.title,
    description: pack.description,
    path: pack.path,
    keywords: pack.keywords,
    type: 'website',
  });
}

export function buildToolJsonLdGraph(pack: ToolSeoGeoPack) {
  const url = absoluteUrl(pack.path);
  const breadcrumb = buildBreadcrumbJsonLd([
    { name: '首页', path: '/' },
    { name: '工具中心', path: '/tools' },
    { name: pack.name, path: pack.path },
  ]);
  const faq = pack.faqs.length ? buildFaqJsonLd(pack.faqs) : null;
  const service = buildServiceJsonLd({
    name: pack.name,
    description: pack.description,
    path: pack.path,
  });
  const webApp = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: pack.name,
    description: pack.description,
    url,
    applicationCategory: 'LifestyleApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'CNY',
    },
    provider: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
    inLanguage: 'zh-CN',
    keywords: pack.keywords.join(', '),
    abstract: pack.answerSummary,
    audience: {
      '@type': 'Audience',
      audienceType: pack.audience,
    },
  };
  const howTo =
    pack.howTo.length > 0
      ? {
          '@context': 'https://schema.org',
          '@type': 'HowTo',
          name: `如何使用${pack.name}`,
          description: pack.answerSummary,
          step: pack.howTo.map((s, i) => ({
            '@type': 'HowToStep',
            position: i + 1,
            name: s.step,
            text: s.body,
          })),
        }
      : null;

  return [breadcrumb, webApp, service, faq, howTo].filter(Boolean);
}

export function assertToolGeoReady(slug: string): boolean {
  const pack = getToolSeoGeoPack(slug);
  if (!pack) return false;
  return isGeoReadySoft(toolPackToGeoMeta(pack));
}
