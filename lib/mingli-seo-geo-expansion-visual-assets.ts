import type { VisualAssetManifest } from '@/lib/visual-assets';

export const MINGLI_SEO_GEO_EXPANSION_BATCH_ID = 'mingli-seo-geo-expansion-143-v1';
export const MINGLI_SEO_GEO_EXPANSION_LIBRARY_KEY = 'mingli_seo_geo_expansion';
export const MINGLI_SEO_GEO_EXPANSION_BRAND_PACK_ID = 'world-yi-mingli-seo-geo-v1';

type SeoGeoTheme = {
  key: string;
  zh: string;
  en: string;
  moduleFocus: string;
  labels: string[];
  mustShow: string[];
  searchTerms: string[];
  tools: string[];
  themes: string[];
};

type SeoGeoAudience = {
  key: string;
  zh: string;
  en: string;
  region: string;
  userContext: string;
  localeTerms: string[];
};

type SeoGeoSpec = {
  index: number;
  id: string;
  slug: string;
  ratio: '16:9' | '4:5';
  size: '2048x1152' | '1536x1920';
  theme: SeoGeoTheme;
  audience: SeoGeoAudience;
};

const themes: SeoGeoTheme[] = [
  {
    key: 'bazi-first-report',
    zh: '八字第一份报告怎么看',
    en: 'How to read a first BaZi report',
    moduleFocus: 'report literacy',
    labels: ['格局', '五行', '大运', '流年', '行动'],
    mustShow: ['birth data card', 'report layer map', 'from structure to action path'],
    searchTerms: ['八字测算', 'BaZi report online', 'Chinese astrology report'],
    tools: ['career-role-fit', 'timing-yearly-window', 'health-recovery-window'],
    themes: ['bazi_report', 'first_report', 'report_literacy'],
  },
  {
    key: 'annual-luck-window',
    zh: '流年运势窗口',
    en: 'Annual timing window',
    moduleFocus: 'annual timing',
    labels: ['年度重点', '机会窗', '风险点', '复盘'],
    mustShow: ['annual timeline', 'opportunity and pressure nodes', 'non-fear boundary'],
    searchTerms: ['流年运势', 'annual luck Chinese astrology', '2026 BaZi forecast'],
    tools: ['timing-yearly-window', 'timing-monthly-rhythm', 'timing-pause-window'],
    themes: ['annual_luck', 'yearly_flow', 'timing_window'],
  },
  {
    key: 'career-direction-fit',
    zh: '事业方向适配',
    en: 'Career direction fit',
    moduleFocus: 'career decision',
    labels: ['角色', '节奏', '资源', '机会', '边界'],
    mustShow: ['career role matrix', 'decision fork', 'action checklist'],
    searchTerms: ['事业运势', 'career astrology Chinese', 'career direction BaZi'],
    tools: ['career-role-fit', 'career-job-switch', 'career-promotion-window'],
    themes: ['career', 'role_fit', 'decision_structure'],
  },
  {
    key: 'wealth-resource-rhythm',
    zh: '财富资源节奏',
    en: 'Wealth and resource rhythm',
    moduleFocus: 'wealth behavior',
    labels: ['收入', '现金流', '风险', '积累'],
    mustShow: ['resource flow diagram', 'cashflow pressure meter', 'no get-rich promise badge'],
    searchTerms: ['财运分析', 'wealth luck BaZi', 'Chinese astrology wealth'],
    tools: ['wealth-income-channel', 'wealth-cashflow-pressure', 'wealth-saving-capacity'],
    themes: ['wealth', 'resource_allocation', 'cashflow'],
  },
  {
    key: 'relationship-pace-boundary',
    zh: '关系节奏与边界',
    en: 'Relationship pace and boundary',
    moduleFocus: 'relationship reflection',
    labels: ['节奏', '沟通', '边界', '复盘'],
    mustShow: ['two-lane relationship timeline', 'communication cards', 'no marriage certainty badge'],
    searchTerms: ['感情运势', 'relationship astrology Chinese', 'BaZi relationship compatibility'],
    tools: ['relationship-pace-fit', 'relationship-boundary-conflict', 'relationship-communication-gap'],
    themes: ['relationship', 'boundary', 'communication'],
  },
  {
    key: 'naming-five-elements',
    zh: '起名五行与用字',
    en: 'Naming with five elements',
    moduleFocus: 'naming education',
    labels: ['音义形', '五行', '使用场景', '长期感'],
    mustShow: ['name card grid', 'five-element balance layer', 'Kangxi dictionary reference without superstition'],
    searchTerms: ['宝宝起名', 'Chinese name generator', 'five elements naming'],
    tools: ['naming-person', 'naming-brand', 'application-timing-selection'],
    themes: ['naming', 'five_elements', 'character_usage'],
  },
  {
    key: 'home-feng-shui-flow',
    zh: '家居风水动线',
    en: 'Home feng shui flow',
    moduleFocus: 'spatial order',
    labels: ['入户', '动线', '采光', '厨卫', '安稳'],
    mustShow: ['schematic home flow diagram', 'entry and light path', 'structure-first explanation'],
    searchTerms: ['家居风水', 'feng shui apartment layout', 'home layout analysis'],
    tools: ['application-home-order', 'application-timing-selection', 'health-recovery-window'],
    themes: ['feng_shui_form', 'home_layout', 'movement_flow'],
  },
  {
    key: 'qimen-decision-map',
    zh: '奇门决策地图',
    en: 'Qi Men decision map',
    moduleFocus: 'decision timing',
    labels: ['时机', '方位', '角色', '行动', '验证'],
    mustShow: ['abstract nine-palace decision board', 'timing and action arrows', 'not a magic promise badge'],
    searchTerms: ['奇门遁甲', 'Qi Men Dun Jia reading', 'Chinese divination decision'],
    tools: ['application-timing-selection', 'career-offer-choice', 'timing-pause-window'],
    themes: ['qimen', 'decision_timing', 'world_yi_method'],
  },
  {
    key: 'five-elements-daily-balance',
    zh: '五行日常平衡',
    en: 'Daily five-element balance',
    moduleFocus: 'five elements education',
    labels: ['木', '火', '土', '金', '水', '关系'],
    mustShow: ['five-element cycle', 'daily rhythm cards', 'relationship not personality labels'],
    searchTerms: ['五行分析', 'five elements Chinese metaphysics', 'Wu Xing chart'],
    tools: ['career-execution-rhythm', 'health-energy-cycle', 'wealth-resource-allocation'],
    themes: ['five_elements', 'mingli_education', 'daily_rhythm'],
  },
  {
    key: 'auspicious-date-selection',
    zh: '择日与行动窗口',
    en: 'Date selection and action window',
    moduleFocus: 'date selection',
    labels: ['事项', '窗口', '避让', '执行', '复盘'],
    mustShow: ['calendar decision grid', 'action window cards', 'avoid deterministic guarantee'],
    searchTerms: ['择日', 'Chinese auspicious date', 'date selection Chinese calendar'],
    tools: ['application-timing-selection', 'timing-monthly-rhythm', 'timing-yearly-window'],
    themes: ['date_selection', 'timing', 'action_window'],
  },
  {
    key: 'health-recovery-rhythm',
    zh: '恢复节奏与身心边界',
    en: 'Recovery rhythm and wellbeing boundary',
    moduleFocus: 'wellbeing boundary',
    labels: ['恢复', '睡眠', '压力', '节律', '边界'],
    mustShow: ['non-medical recovery rhythm chart', 'rest and pressure cards', 'not medical advice badge'],
    searchTerms: ['健康运势', 'Chinese astrology wellness', 'energy rhythm BaZi'],
    tools: ['health-recovery-window', 'health-energy-cycle', 'health-mental-boundary'],
    themes: ['wellbeing_boundary', 'recovery_rhythm', 'non_medical'],
  },
  {
    key: 'study-exam-timing',
    zh: '学习考试节奏',
    en: 'Study and exam timing',
    moduleFocus: 'learning rhythm',
    labels: ['专注', '复习', '考试', '压力', '节奏'],
    mustShow: ['study timeline', 'focus and review cards', 'no score promise badge'],
    searchTerms: ['考试运势', 'study luck Chinese astrology', 'exam timing BaZi'],
    tools: ['study-exam-focus', 'timing-monthly-rhythm', 'health-recovery-window'],
    themes: ['study', 'exam_timing', 'focus_rhythm'],
  },
  {
    key: 'migration-location-choice',
    zh: '迁移与城市选择',
    en: 'Migration and city choice',
    moduleFocus: 'relocation decision',
    labels: ['城市', '行业', '家庭', '成本', '时机'],
    mustShow: ['map-like decision board without real private address', 'city choice matrix', 'practical constraint layer'],
    searchTerms: ['移民运势', 'relocation feng shui', 'Chinese astrology relocation'],
    tools: ['migration-city-fit', 'migration-overseas-adaptation', 'career-role-fit'],
    themes: ['migration', 'city_choice', 'overseas_chinese'],
  },
];

const audiences: SeoGeoAudience[] = [
  {
    key: 'us-canada-chinese',
    zh: '美国加拿大华人',
    en: 'US and Canada Chinese users',
    region: 'United States / Canada',
    userContext: 'immigration, condo living, career transition, family planning',
    localeTerms: ['美国华人', '加拿大华人', 'North America Chinese'],
  },
  {
    key: 'uk-europe-chinese',
    zh: '英国欧洲华人',
    en: 'UK and Europe Chinese users',
    region: 'UK / Europe',
    userContext: 'study, work visa, long-distance family, compact rental homes',
    localeTerms: ['英国华人', '欧洲华人', 'UK Chinese'],
  },
  {
    key: 'australia-new-zealand-chinese',
    zh: '澳新西兰华人',
    en: 'Australia and New Zealand Chinese users',
    region: 'Australia / New Zealand',
    userContext: 'home purchase, career rhythm, family education, suburb relocation',
    localeTerms: ['澳洲华人', '新西兰华人', 'Australia Chinese'],
  },
  {
    key: 'singapore-malaysia-chinese',
    zh: '新加坡马来西亚华人',
    en: 'Singapore and Malaysia Chinese users',
    region: 'Singapore / Malaysia',
    userContext: 'dense city living, family business, bilingual culture, apartment layout',
    localeTerms: ['新加坡华人', '马来西亚华人', 'Singapore Chinese'],
  },
  {
    key: 'hong-kong-taiwan-overseas',
    zh: '港澳台海外用户',
    en: 'Hong Kong, Macau and Taiwan overseas users',
    region: 'Hong Kong / Macau / Taiwan diaspora',
    userContext: 'cross-border work, family decisions, naming and property timing',
    localeTerms: ['港澳台', '繁体中文用户', 'Traditional Chinese users'],
  },
  {
    key: 'overseas-students',
    zh: '海外留学生',
    en: 'Overseas Chinese students',
    region: 'Global student cities',
    userContext: 'study pressure, exam windows, career first step, shared rentals',
    localeTerms: ['留学生', 'international student', 'study abroad'],
  },
  {
    key: 'new-immigrant-families',
    zh: '新移民家庭',
    en: 'New immigrant families',
    region: 'Global Chinese diaspora',
    userContext: 'settlement, job search, school district, home layout and naming',
    localeTerms: ['新移民', 'new immigrant family', '海外定居'],
  },
  {
    key: 'entrepreneur-founders',
    zh: '海外创业者',
    en: 'Overseas Chinese founders',
    region: 'Global business hubs',
    userContext: 'brand naming, timing, hiring, cashflow and decision risk',
    localeTerms: ['创业者', 'founder', '品牌命名'],
  },
  {
    key: 'remote-workers',
    zh: '远程工作华人',
    en: 'Chinese remote workers',
    region: 'Remote-first global cities',
    userContext: 'work rhythm, home office, relocation, relationship boundaries',
    localeTerms: ['远程工作', 'remote work', 'home office'],
  },
  {
    key: 'young-professionals',
    zh: '海外年轻职场人',
    en: 'Overseas young professionals',
    region: 'Major global cities',
    userContext: 'career acceleration, relationship clarity, rental layout and cashflow',
    localeTerms: ['年轻职场人', 'young professionals', 'career switch'],
  },
  {
    key: 'multi-generation-families',
    zh: '多代同住家庭',
    en: 'Multi-generation overseas Chinese families',
    region: 'Suburbs and family homes',
    userContext: 'family roles, home order, naming, health rhythm and wealth planning',
    localeTerms: ['多代同住', 'family home', 'intergenerational family'],
  },
];

function padIndex(value: number) {
  return String(value).padStart(3, '0');
}

function getRatio(index: number): SeoGeoSpec['ratio'] {
  return index % 4 === 0 ? '4:5' : '16:9';
}

function getSize(ratio: SeoGeoSpec['ratio']): SeoGeoSpec['size'] {
  return ratio === '4:5' ? '1536x1920' : '2048x1152';
}

function buildSpecs(): SeoGeoSpec[] {
  const specs: SeoGeoSpec[] = [];
  for (const audience of audiences) {
    for (const theme of themes) {
      const index = specs.length + 1;
      const ratio = getRatio(index);
      specs.push({
        index,
        id: `MSEO-${padIndex(index)}`,
        slug: `mingli-seo-geo-${padIndex(index)}-${theme.key}-${audience.key}`,
        ratio,
        size: getSize(ratio),
        theme,
        audience,
      });
    }
  }
  return specs;
}

function buildPrompt(spec: SeoGeoSpec) {
  const { theme, audience, ratio, size } = spec;

  return [
    'Create a premium SEO/GEO educational infographic for Life Kline / World Yi.',
    '',
    `Subject: ${theme.zh} / ${theme.en}.`,
    `Audience: ${audience.zh} (${audience.en}, ${audience.region}).`,
    `Audience context: ${audience.userContext}.`,
    `Module focus: ${theme.moduleFocus}.`,
    '',
    'Core stance:',
    'Use modern Chinese metaphysics as a structured cultural education and decision-reflection system.',
    'Do not create a fortune-teller poster. Do not promise fixed luck, wealth, marriage, health, score, immigration or career outcomes.',
    'Translate metaphysics into structure, timing, environment, action, risk and review.',
    '',
    'Must show:',
    ...theme.mustShow.map((item) => `- ${item}`),
    `- SEO/GEO context labels: ${[...theme.searchTerms, ...audience.localeTerms].join(' / ')}`,
    '- compact pathway: 先看结构 -> 再看时机 -> 最后看行动',
    '',
    'Required in-image text:',
    `- Main headline, large and readable: ${theme.zh}`,
    `- English support line, readable: ${theme.en}`,
    `- Audience chip: ${audience.zh}`,
    `- Short labels only: ${theme.labels.join(' / ')}`,
    '- Boundary badges: 文化观察 / 不定命 / 可复盘',
    '- Action label: 上传信息后看个人结构',
    '- Compact brand signature: 世界易 / 人生K线 · www.life-kline.com',
    '',
    'Text density contract:',
    '- No paragraph blocks inside the image.',
    '- Use only headline, English support line, audience chip, short labels, 3-5 callouts, boundary badges and brand signature.',
    '- Chinese and English text must be large, readable and not garbled.',
    '- No tiny fake text, no dense tables, no duplicated subtitles.',
    '',
    'Visual style:',
    'High-trust editorial product design, warm off-white paper, ink black structure lines, jade teal reasoning layer, muted gold timing marks, restrained cinnabar focus dots, fine blueprint grid, calm premium Chinese-English layout.',
    'Use diagrams, cards, arrows, timeline nodes, maps, calendar grids, five-element rings, report panels or decision boards according to the topic.',
    'Keep visual variety across the batch while preserving the same brand palette.',
    '',
    'Safety boundary:',
    'No deterministic fate claims. No disease diagnosis. No lifespan prediction. No guaranteed wealth, relationship, career, exam, immigration or real-estate outcome. No fear-based Tai Sui or Ben Ming Nian language. No talisman, charm, deity, crystal ball, horror mysticism, cheap red-black metaphysics ad, or fake official certificate.',
    '',
    'Composition:',
    `${ratio} infographic, clear hierarchy, central diagram plus 3 to 5 callout markers, enough white space, professional SEO/GEO-ready educational cover for overseas Chinese users.`,
    '',
    'Output:',
    `Size ${size}, high quality, no transparent background.`,
  ].join('\n');
}

export function buildMingliSeoGeoExpansionVisualManifest(): VisualAssetManifest {
  const specs = buildSpecs();

  return {
    batch: {
      id: MINGLI_SEO_GEO_EXPANSION_BATCH_ID,
      name: 'Mingli SEO/GEO Expansion 143 v1',
      libraryKey: MINGLI_SEO_GEO_EXPANSION_LIBRARY_KEY,
      module: 'MINGLI',
      targetCount: specs.length,
      model: 'gpt-image-2',
      brandPackId: MINGLI_SEO_GEO_EXPANSION_BRAND_PACK_ID,
      meta: {
        purpose: 'Fill the 500-asset SEO/GEO visual plan with overseas Chinese educational infographics across BaZi, annual timing, career, wealth, relationship, naming, feng shui, qimen, five elements, date selection, wellbeing, study and migration.',
        targetTotalPlan: 500,
        plannedExpansionCount: specs.length,
        safetyBoundary: 'educational, non-deterministic, no medical/legal/financial guarantees',
      },
    },
    assets: specs.map((spec) => ({
      id: spec.id,
      assetType: 'seo_geo_mingli_infographic',
      module: 'MINGLI',
      slug: spec.slug,
      title: `${spec.theme.zh}｜${spec.audience.zh}`,
      description: `${spec.theme.zh}的海外华人 SEO/GEO 教育图，面向${spec.audience.zh}，用结构、时机、环境、行动和复盘解释传统术语。`,
      prompt: buildPrompt(spec),
      negativePrompt: [
        'fortune teller poster',
        'deterministic destiny claim',
        'guaranteed wealth',
        'guaranteed marriage',
        'medical diagnosis',
        'lifespan prediction',
        'immigration guarantee',
        'exam score promise',
        'horror mysticism',
        'cheap talisman',
        'charm sales graphic',
        'deity illustration',
        'crystal ball',
        'red black fear poster',
        'fake official certificate',
        'garbled Chinese text',
        'tiny unreadable text',
        'dense paragraph blocks',
      ].join(', '),
      model: 'gpt-image-2',
      size: spec.size,
      ratio: spec.ratio,
      quality: 'medium',
      brandReferenceIds: [MINGLI_SEO_GEO_EXPANSION_BRAND_PACK_ID],
      altText: `${spec.theme.zh}面向${spec.audience.zh}的世界易结构化教育信息图`,
      overlayCopySimplified: spec.theme.zh,
      overlayCopyTraditional: spec.theme.zh,
      overlayCopyEnglish: spec.theme.en,
      narrativeTitle: `${spec.theme.zh}：给${spec.audience.zh}的结构化读法`,
      narrativeExcerpt: `${spec.theme.zh}不应被写成固定结论。更适合${spec.audience.zh}的读法，是把传统术语翻译成结构、时机、环境、行动和复盘。`,
      narrativeSections: [
        {
          heading: '图中要看什么',
          body: `这张图围绕${spec.theme.zh}展开，重点看${spec.theme.labels.slice(0, 4).join('、')}，用于理解问题结构，不用于制造确定性结论。`,
        },
        {
          heading: '为什么适合海外华人',
          body: `${spec.audience.zh}常见处境是${spec.audience.userContext}。图中保留中英关键词，方便从搜索、问答和站内工具继续进入个人化测算。`,
        },
        {
          heading: '使用边界',
          body: '内容只做文化教育、结构判断和行动复盘，不承诺财富、婚姻、健康、考试、移民、职业或房产结果。',
        },
      ],
      targetRoutes: ['/visual-assets', '/knowledge/topics', '/tools', '/chat', '/analyze'],
      relatedContentSlugs: [],
      relatedToolSlugs: spec.theme.tools,
      relatedReportThemes: [
        'seo_geo',
        'overseas_chinese',
        'world_yi_method',
        spec.theme.key,
        spec.audience.key,
        ...spec.theme.themes,
      ],
      status: 'prompt_ready',
      qaStatus: 'pending',
      qaScore: 0,
      correctionCount: 0,
      version: 1,
      meta: {
        themeKey: spec.theme.key,
        audienceKey: spec.audience.key,
        region: spec.audience.region,
        searchTerms: themeSearchTerms(spec),
        targetTotalPlan: 500,
        referenceOnly: true,
      },
      createdBy: 'system_mingli_seo_geo_expansion',
    })),
  };
}

function themeSearchTerms(spec: SeoGeoSpec) {
  return [...spec.theme.searchTerms, ...spec.audience.localeTerms];
}
