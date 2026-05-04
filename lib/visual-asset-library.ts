import type { ManagedContentEntry } from '@/lib/content-store';
import { listVisualAssets, type VisualAssetRecord } from '@/lib/visual-assets';

export type VisualAssetLibraryItem = {
  id: string;
  slug: string;
  title: string;
  description: string;
  publicUrl: string;
  altText: string;
  ratio: '16:9' | '4:5';
  module: 'PRODUCT_WORLD_YI' | 'REPORT' | 'TOOLS' | 'CONTENT' | 'WORLD_YI' | 'MINGLI' | 'SOCIAL';
  targetRoutes: string[];
  relatedToolSlugs: string[];
  relatedReportThemes: string[];
  narrativeTitle: string;
  narrativeExcerpt: string;
  narrativeSections: Array<{ heading: string; body: string }>;
};

export type VisualAssetBinding = {
  hero?: string;
  cover?: string;
  inline?: string[];
  social?: Record<string, string>;
};

export type VisualAssetContentSignal = Pick<ManagedContentEntry, 'contentType' | 'slug' | 'title' | 'excerpt' | 'category' | 'tags' | 'meta'>;

const visualAssetBase = '/images/visual-assets/product-world-yi-explainers-v1';

export const approvedVisualAssets: VisualAssetLibraryItem[] = [
  {
    id: 'PWY01-001',
    slug: 'life-kline-product-universe',
    title: '人生K线产品宇宙图',
    description: '说明测算、报告、工具、知识、案例、复访如何组成完整产品路径。',
    publicUrl: `${visualAssetBase}/life-kline-product-universe-v1.png`,
    altText: '人生K线从测算到报告工具知识案例和复访的产品宇宙图',
    ratio: '16:9',
    module: 'PRODUCT_WORLD_YI',
    targetRoutes: ['/', '/analyze', '/result/[id]', '/tools'],
    relatedToolSlugs: ['career-role-fit', 'timing-yearly-window', 'application-home-order'],
    relatedReportThemes: ['product_journey', 'world_yi_method', 'decision_structure'],
    narrativeTitle: '从测算到行动的完整路径',
    narrativeExcerpt: '这张图把人生K线的核心路径压缩成一个产品宇宙：先建立个人底盘，再进入报告、工具、知识、案例与复访。',
    narrativeSections: [
      { heading: '产品路径', body: '用户不是只看一次结论，而是从出生信息进入个人报告，再根据问题进入工具、知识和案例。' },
      { heading: '世界易底层', body: '所有入口都回到结构、时位、环境、行动、风险和复盘，不把命理内容写成宿命结论。' },
      { heading: '适用位置', body: '适合放在首页、测算页、产品说明页和视觉资产总览页。' },
    ],
  },
  {
    id: 'PWY01-002',
    slug: 'world-yi-six-step-method',
    title: '世界易六步判断法',
    description: '把世界易的结构、时位、环境、行动、风险、复盘做成总式图。',
    publicUrl: `${visualAssetBase}/world-yi-six-step-method-v2.png`,
    altText: '世界易结构时位环境行动风险复盘六步判断法',
    ratio: '16:9',
    module: 'WORLD_YI',
    targetRoutes: ['/world-yi', '/analyze'],
    relatedToolSlugs: ['timing-yearly-window', 'career-execution-rhythm', 'application-timing-selection'],
    relatedReportThemes: ['world_yi_method', 'decision_structure', 'action_path'],
    narrativeTitle: '世界易六步判断法',
    narrativeExcerpt: '世界易不是把未来说成固定结论，而是把判断拆成结构、时位、环境、行动、风险和复盘六个环节。',
    narrativeSections: [
      { heading: '六步总式', body: '先看结构，再看所处时位和外部环境，然后决定行动，管理风险，并在结果出现后复盘。' },
      { heading: '非决定论', body: '这张图强调判断流程，不制造恐吓，也不承诺确定性的财富、关系或健康结果。' },
      { heading: '适用位置', body: '适合放在世界易总入口、知识库方法论入口和测算前说明。' },
    ],
  },
  {
    id: 'PWY01-003',
    slug: 'first-report-reading-path',
    title: '第一份报告阅读路径',
    description: '说明用户填写生辰后，如何先看第一份报告，再进入深入报告。',
    publicUrl: `${visualAssetBase}/first-report-reading-path-v1.png`,
    altText: '用户填写生辰后阅读第一份人生K线报告再进入深入报告的路径图',
    ratio: '16:9',
    module: 'REPORT',
    targetRoutes: ['/analyze', '/result/[id]'],
    relatedToolSlugs: ['career-role-fit', 'timing-monthly-rhythm', 'health-recovery-window'],
    relatedReportThemes: ['report_literacy', 'first_report', 'premium_conversion'],
    narrativeTitle: '第一份报告应该先看什么',
    narrativeExcerpt: '第一份报告的任务不是一次讲完全部，而是先让用户看懂重点、阶段、行动和下一步深测入口。',
    narrativeSections: [
      { heading: '首屏重点', body: '用户填写生辰后，第一屏应优先说明总览、重点、阶段和行动，而不是直接进入术语堆叠。' },
      { heading: '深度引导', body: '当用户已经理解自己的主要问题后，再引导到深入报告和细分报告。' },
      { heading: '适用位置', body: '适合放在测算页、报告页和新用户引导中。' },
    ],
  },
  {
    id: 'PWY01-004',
    slug: 'deep-report-layer-map',
    title: '深入报告层级地图',
    description: '说明深入报告如何从总论进入事业、关系、财富、健康、迁移等细分报告。',
    publicUrl: `${visualAssetBase}/deep-report-layer-map-v1.png`,
    altText: '人生K线深入报告通向事业关系财富健康迁移年度等细分报告的层级地图',
    ratio: '16:9',
    module: 'REPORT',
    targetRoutes: ['/result/[id]', '/tools', '/premium'],
    relatedToolSlugs: ['career-job-switch', 'relationship-pace-fit', 'wealth-income-channel'],
    relatedReportThemes: ['deep_report', 'premium_conversion', 'tool_journey'],
    narrativeTitle: '从总论进入细分报告',
    narrativeExcerpt: '深入报告把综合判断拆成事业、关系、财富、健康、迁移、年度等方向，让用户逐层深入。',
    narrativeSections: [
      { heading: '层级关系', body: '总论负责建立全局，细分报告负责回答用户的具体问题。' },
      { heading: '选择路径', body: '用户不需要一次购买或阅读全部内容，而是从最急的问题方向开始。' },
      { heading: '适用位置', body: '适合放在结果页、付费深度服务页和工具中心入口。' },
    ],
  },
  {
    id: 'PWY01-005',
    slug: 'tool-center-120-matrix',
    title: '120个工具矩阵',
    description: '说明工具中心如何把报告里的问题拆成单项测算和行动建议。',
    publicUrl: `${visualAssetBase}/tool-center-120-matrix-v1.png`,
    altText: '人生K线120个工具把报告问题拆成单项测算和行动建议的矩阵图',
    ratio: '16:9',
    module: 'TOOLS',
    targetRoutes: ['/tools', '/result/[id]'],
    relatedToolSlugs: ['career-role-fit', 'wealth-income-channel', 'relationship-pace-fit'],
    relatedReportThemes: ['tool_center', 'report_to_tool', 'action_path'],
    narrativeTitle: '把大报告拆成可执行的小问题',
    narrativeExcerpt: '工具中心把综合报告里的复杂问题拆成可重复使用的单项工具，帮助用户从理解进入行动。',
    narrativeSections: [
      { heading: '工具矩阵', body: '120 个工具按事业、关系、财富、风水、起名、复盘等方向组织。' },
      { heading: '使用逻辑', body: '先有综合报告，再用单项工具拆小问题，最后回到行动和记忆。' },
      { heading: '适用位置', body: '适合放在工具中心、结果页工具推荐和产品说明中。' },
    ],
  },
  {
    id: 'PWY01-006',
    slug: 'content-system-map',
    title: '内容体系地图',
    description: '说明知识、案例、洞察、图片文章和工具如何互相导流。',
    publicUrl: `${visualAssetBase}/content-system-map-v1.png`,
    altText: '人生K线知识案例洞察图片文章工具和报告互相连接的内容体系地图',
    ratio: '16:9',
    module: 'CONTENT',
    targetRoutes: ['/knowledge', '/cases', '/insights', '/analyze'],
    relatedToolSlugs: ['career-role-fit', 'timing-yearly-window', 'application-home-order'],
    relatedReportThemes: ['content_journey', 'knowledge_to_report', 'decision_structure', 'action_path'],
    narrativeTitle: '内容不是信息流，而是判断路径',
    narrativeExcerpt: '知识、案例、洞察、图片文章和工具都应回到用户自己的判断问题，而不是只做内容堆积。',
    narrativeSections: [
      { heading: '内容结构', body: '知识解释概念，案例说明场景，洞察提供环境，工具承接行动。' },
      { heading: '导流逻辑', body: '每个内容入口都应能回到测算、报告或工具，而不是成为孤立页面。' },
      { heading: '适用位置', body: '适合放在知识库、案例库、内容运营说明和图库页。' },
    ],
  },
  {
    id: 'PWY01-007',
    slug: 'not-fatalism-boundary',
    title: '不是宿命论的判断边界',
    description: '说明世界易和命理分析只做结构化判断，不做恐吓和决定论。',
    publicUrl: `${visualAssetBase}/not-fatalism-boundary-v1.png`,
    altText: '世界易不做宿命论和恐吓式判断而强调结构行动和验证的边界图',
    ratio: '16:9',
    module: 'WORLD_YI',
    targetRoutes: ['/world-yi', '/analyze'],
    relatedToolSlugs: ['health-mental-boundary', 'timing-pause-window', 'relationship-boundary-conflict'],
    relatedReportThemes: ['safety_boundary', 'world_yi_method', 'risk_boundary'],
    narrativeTitle: '看结构，不制造恐惧',
    narrativeExcerpt: '命理和易学内容必须有边界：它们可以提供文化解释和结构判断，但不能替代现实专业决策。',
    narrativeSections: [
      { heading: '判断边界', body: '不说必然发财、必然失败、必然有灾，也不把传统概念用于恐吓。' },
      { heading: '行动导向', body: '好的报告应帮助用户理解结构、时位和行动边界，而不是制造焦虑。' },
      { heading: '适用位置', body: '适合放在世界易页、测算页、知识库安全说明和所有敏感主题前。' },
    ],
  },
  {
    id: 'PWY01-008',
    slug: 'five-elements-modern-translation',
    title: '五行现代翻译图',
    description: '把金木水火土从标签翻译为承载、推动、流动、表达、收束的关系。',
    publicUrl: `${visualAssetBase}/five-elements-modern-translation-v1.png`,
    altText: '五行金木水火土相生相克与现代判断关系的说明图',
    ratio: '16:9',
    module: 'MINGLI',
    targetRoutes: ['/knowledge', '/analyze'],
    relatedToolSlugs: ['career-execution-rhythm', 'health-energy-cycle', 'wealth-resource-allocation'],
    relatedReportThemes: ['five_elements', 'mingli_education', 'decision_structure'],
    narrativeTitle: '五行不是标签，是关系',
    narrativeExcerpt: '五行图把金木水火土从人格标签翻译成系统关系，帮助用户理解生克、承载和转化。',
    narrativeSections: [
      { heading: '五行关系', body: '五行不是单字标签，而是增长、表达、承载、秩序和流动之间的关系。' },
      { heading: '现代翻译', body: '报告中应把五行落到现实承载力、推进方式、资源和风险上。' },
      { heading: '适用位置', body: '适合放在知识库、命理基础文章和测算说明中。' },
    ],
  },
  {
    id: 'PWY01-009',
    slug: 'bazi-time-correction-map',
    title: '生辰与真太阳时说明图',
    description: '说明出生日期、时间、地点、时区、真太阳时和节气切换如何影响报告。',
    publicUrl: `${visualAssetBase}/bazi-time-correction-map-v1.png`,
    altText: '生辰日期时间地点时区真太阳时和节气切换影响八字报告精度的说明图',
    ratio: '16:9',
    module: 'MINGLI',
    targetRoutes: ['/analyze'],
    relatedToolSlugs: ['timing-yearly-window', 'timing-monthly-rhythm', 'application-timing-selection'],
    relatedReportThemes: ['bazi_time', 'true_solar_time', 'report_accuracy'],
    narrativeTitle: '为什么要填写出生时间和地点',
    narrativeExcerpt: '出生日期、时间、地点、时区、真太阳时和节气切换共同影响排盘精度。',
    narrativeSections: [
      { heading: '时间校准', body: '同一个钟表时间在不同地点可能对应不同太阳时，因此需要地点和时区。' },
      { heading: '节气边界', body: '八字排盘还需要考虑节气切换，尤其是接近节气边界的出生时间。' },
      { heading: '适用位置', body: '适合放在测算表单、报告可信度说明和真太阳时知识文章中。' },
    ],
  },
  {
    id: 'PWY01-010',
    slug: 'yearly-tai-sui-share-cover',
    title: '流年太岁传播封面',
    description: '适合传播的流年太岁主题封面，强调结构放大而非恐吓。',
    publicUrl: `${visualAssetBase}/yearly-tai-sui-share-cover-v1.png`,
    altText: '流年太岁传播封面说明今年结构放大而非恐吓',
    ratio: '4:5',
    module: 'SOCIAL',
    targetRoutes: ['/analyze', '/knowledge'],
    relatedToolSlugs: ['timing-yearly-window', 'timing-monthly-rhythm', 'timing-pause-window'],
    relatedReportThemes: ['tai_sui', 'yearly_flow', 'social_share'],
    narrativeTitle: '流年太岁：看今年被放大的结构',
    narrativeExcerpt: '流年太岁相关内容要避免灾祸恐吓，重点解释年度结构、节奏和风险管理。',
    narrativeSections: [
      { heading: '传播主题', body: '流年太岁是强传播主题，但表达必须克制，不能制造“今年必坏”的暗示。' },
      { heading: '正确方向', body: '把太岁理解为年度结构被放大，用户需要看重点、行动和边界。' },
      { heading: '适用位置', body: '适合放在社媒图、年度专题、流年文章和测算入口。' },
    ],
  },
  {
    id: 'PWY01-011',
    slug: 'ben-ming-nian-share-cover',
    title: '本命年传播封面',
    description: '适合传播的本命年主题封面，强调复盘和节奏调整。',
    publicUrl: `${visualAssetBase}/ben-ming-nian-share-cover-v1.png`,
    altText: '本命年传播封面说明本命年不是必坏而是复盘和节奏调整',
    ratio: '4:5',
    module: 'SOCIAL',
    targetRoutes: ['/analyze', '/knowledge'],
    relatedToolSlugs: ['timing-yearly-window', 'health-recovery-window', 'career-career-rebuild'],
    relatedReportThemes: ['ben_ming_nian', 'yearly_review', 'social_share'],
    narrativeTitle: '本命年不是必坏，是提醒复盘',
    narrativeExcerpt: '本命年内容适合传播，但必须强调复盘、节奏和边界，而不是恐吓式结论。',
    narrativeSections: [
      { heading: '传播边界', body: '不把本命年写成必然倒霉，也不制造转运焦虑。' },
      { heading: '行动建议', body: '把它理解为年度节奏提醒，适合复盘、设边界和调整行动。' },
      { heading: '适用位置', body: '适合放在年度专题、社媒封面和测算入口。' },
    ],
  },
  {
    id: 'PWY01-012',
    slug: 'visual-article-detail-template',
    title: '图片深度解读页说明图',
    description: '说明每张图片都有配套文章，帮助用户从图进入深入内容。',
    publicUrl: `${visualAssetBase}/visual-article-detail-template-v1.png`,
    altText: '每张生成图片配套深度解读文章并连接工具和测算入口的说明图',
    ratio: '16:9',
    module: 'CONTENT',
    targetRoutes: ['/knowledge', '/visual-assets'],
    relatedToolSlugs: ['career-role-fit', 'timing-yearly-window', 'application-home-order'],
    relatedReportThemes: ['visual_article', 'content_journey', 'knowledge_to_tool'],
    narrativeTitle: '每张图都是一篇可深入阅读的文章',
    narrativeExcerpt: '图片不是孤立素材，每张图都应有解读文章、相关工具和测算入口，帮助站点形成内容资产。',
    narrativeSections: [
      { heading: '图片文章', body: '每张图都有标题、摘要、解读段落和适用入口。' },
      { heading: '站点质量', body: '图片配套文章可以提高用户理解深度，也能增强内容体系的结构化程度。' },
      { heading: '适用位置', body: '适合放在图库页、知识文章和视觉资产详情页。' },
    ],
  },
];

const visualAssetJourneyOverrides: Record<string, Partial<Pick<VisualAssetLibraryItem, 'relatedToolSlugs' | 'relatedReportThemes' | 'targetRoutes'>>> = {
  'content-system-map': {
    relatedToolSlugs: ['career-role-fit', 'timing-yearly-window', 'application-home-order'],
    relatedReportThemes: ['content_journey', 'knowledge_to_report', 'decision_structure', 'action_path'],
    targetRoutes: ['/knowledge', '/cases', '/insights', '/tools', '/analyze'],
  },
  'tool-center-120-matrix': {
    relatedToolSlugs: ['career-role-fit', 'wealth-income-channel', 'relationship-pace-fit'],
    relatedReportThemes: ['tool_center', 'report_to_tool', 'action_path'],
  },
  'five-elements-modern-translation': {
    relatedToolSlugs: ['career-execution-rhythm', 'health-energy-cycle', 'wealth-resource-allocation'],
    relatedReportThemes: ['five_elements', 'mingli_education', 'decision_structure'],
  },
};

function normalizeVisualAssetModule(module: string): VisualAssetLibraryItem['module'] {
  const allowed = new Set<VisualAssetLibraryItem['module']>([
    'PRODUCT_WORLD_YI',
    'REPORT',
    'TOOLS',
    'CONTENT',
    'WORLD_YI',
    'MINGLI',
    'SOCIAL',
  ]);
  return allowed.has(module as VisualAssetLibraryItem['module']) ? module as VisualAssetLibraryItem['module'] : 'CONTENT';
}

function normalizeVisualAssetRatio(ratio: string): VisualAssetLibraryItem['ratio'] {
  return ratio === '4:5' ? '4:5' : '16:9';
}

function toLibraryItem(asset: VisualAssetRecord): VisualAssetLibraryItem | null {
  if (!asset.publicUrl) return null;

  return {
    id: asset.id,
    slug: asset.slug,
    title: asset.title,
    description: asset.description || asset.narrativeExcerpt || asset.title,
    publicUrl: asset.publicUrl,
    altText: asset.altText || asset.title,
    ratio: normalizeVisualAssetRatio(asset.ratio),
    module: normalizeVisualAssetModule(asset.module),
    targetRoutes: asset.targetRoutes,
    relatedToolSlugs: asset.relatedToolSlugs,
    relatedReportThemes: asset.relatedReportThemes,
    narrativeTitle: asset.narrativeTitle || asset.title,
    narrativeExcerpt: asset.narrativeExcerpt || asset.description || asset.title,
    narrativeSections: asset.narrativeSections.length
      ? asset.narrativeSections
      : [{ heading: '图片说明', body: asset.description || asset.title }],
  };
}

function mergeUniqueStrings(...groups: Array<string[] | undefined>) {
  return Array.from(new Set(groups.flatMap((group) => group || []).map((item) => item.trim()).filter(Boolean)));
}

function readStringArrayFromMeta(meta: Record<string, unknown> | undefined, key: string) {
  const value = meta?.[key];
  if (!Array.isArray(value)) return [];
  return value.map((item) => (typeof item === 'string' ? item.trim() : '')).filter(Boolean);
}

function readVisualAssetBinding(meta: Record<string, unknown> | undefined): VisualAssetBinding | null {
  const value = meta?.visualAssets;
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as VisualAssetBinding;
}

function normalizeVisualAssetBindingIds(binding: VisualAssetBinding | null) {
  if (!binding) return [];
  return mergeUniqueStrings(
    [binding.hero, binding.cover].filter(Boolean) as string[],
    binding.inline,
    binding.social ? Object.values(binding.social) : []
  );
}

function normalizeMatchText(value: string) {
  return value.toLowerCase().replace(/[_-]/g, ' ');
}

function scoreAssetForContent(asset: VisualAssetLibraryItem, entry: VisualAssetContentSignal) {
  const relatedReportThemes = readStringArrayFromMeta(entry.meta, 'relatedReportThemes');
  const relatedToolSlugs = readStringArrayFromMeta(entry.meta, 'relatedToolSlugs');
  const signalParts = [
    entry.title,
    entry.excerpt,
    entry.category || '',
    entry.slug,
    entry.contentType,
    ...(entry.tags || []),
    ...relatedReportThemes,
    ...relatedToolSlugs,
  ];
  const signalText = normalizeMatchText(signalParts.join(' '));
  const assetText = normalizeMatchText([
    asset.id,
    asset.slug,
    asset.title,
    asset.description,
    asset.module,
    asset.narrativeExcerpt,
    ...asset.relatedReportThemes,
    ...asset.relatedToolSlugs,
    ...asset.targetRoutes,
  ].join(' '));
  let score = 0;

  for (const tag of entry.tags || []) {
    const normalizedTag = normalizeMatchText(tag);
    if (normalizedTag && assetText.includes(normalizedTag)) score += 5;
  }

  for (const theme of relatedReportThemes) {
    const normalizedTheme = normalizeMatchText(theme);
    if (!normalizedTheme) continue;
    if (asset.relatedReportThemes.some((item) => normalizeMatchText(item) === normalizedTheme)) score += 8;
    if (assetText.includes(normalizedTheme) || signalText.includes(normalizedTheme)) score += 2;
  }

  for (const slug of relatedToolSlugs) {
    if (asset.relatedToolSlugs.includes(slug)) score += 7;
  }

  if (entry.contentType === 'knowledge') {
    if (asset.targetRoutes.includes('/knowledge')) score += 2;
    if (asset.module === 'MINGLI' && /命理|易学|五行|八卦|天干|地支|八字|风水|起名|太岁|本命年/.test(signalText)) score += 6;
    if (asset.module === 'WORLD_YI' && /世界易|方法|判断|结构|决策/.test(signalText)) score += 5;
    if (asset.module === 'CONTENT') score += 1;
  }

  if (entry.contentType === 'case') {
    if (asset.targetRoutes.includes('/cases')) score += 2;
    if (asset.module === 'WORLD_YI') score += 3;
    if (asset.module === 'PRODUCT_WORLD_YI') score += 1;
  }

  if (/五行|金|木|水|火|土|five elements/.test(signalText) && /five elements|五行|metal|wood|water|fire|earth/.test(assetText)) score += 10;
  if (/太岁|流年|本命年|annual|yearly/.test(signalText) && /太岁|流年|本命年|annual|yearly|tai sui|ben ming/.test(assetText)) score += 10;
  if (/起名|康熙|字典|姓名|naming|character/.test(signalText) && /起名|康熙|字|naming|character/.test(assetText)) score += 10;
  if (/风水|空间|家居|环境|feng shui|home/.test(signalText) && /风水|空间|环境|feng shui|home/.test(assetText)) score += 10;
  if (/奇门|遁甲|qimen/.test(signalText) && /奇门|遁甲|qimen/.test(assetText)) score += 10;
  if (/面相|手相|相学|摸骨|palm|face|ethics/.test(signalText) && /面相|手相|相学|摸骨|palm|face|ethics/.test(assetText)) score += 10;
  if (/报告|测算|生辰|出生|first report|birth/.test(signalText) && /报告|测算|生辰|出生|report|birth|bazi/.test(assetText)) score += 6;
  if (/工具|tool/.test(signalText) && /工具|tool/.test(assetText)) score += 6;

  return score;
}

function enrichVisualAssetItem(item: VisualAssetLibraryItem): VisualAssetLibraryItem {
  const override = visualAssetJourneyOverrides[item.slug] || {};
  return {
    ...item,
    targetRoutes: mergeUniqueStrings(item.targetRoutes, override.targetRoutes),
    relatedToolSlugs: mergeUniqueStrings(item.relatedToolSlugs, override.relatedToolSlugs),
    relatedReportThemes: mergeUniqueStrings(item.relatedReportThemes, override.relatedReportThemes),
  };
}

function uniqueVisualAssets(items: VisualAssetLibraryItem[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

export function getApprovedVisualAssets(limit = 500) {
  const dbItems = listVisualAssets({
    status: 'approved',
    qaStatus: 'approved',
    limit,
  })
    .map(toLibraryItem)
    .filter(Boolean) as VisualAssetLibraryItem[];

  return uniqueVisualAssets([...dbItems, ...approvedVisualAssets])
    .map(enrichVisualAssetItem)
    .slice(0, limit);
}

export function getApprovedVisualAssetBySlug(slug: string) {
  return getApprovedVisualAssets().find((asset) => asset.slug === slug) || null;
}

export function getVisualAssetById(id: string) {
  return getApprovedVisualAssets().find((asset) => asset.id === id) || null;
}

export function getVisualAssetsForRoute(route: string, limit = 3) {
  return getApprovedVisualAssets()
    .filter((asset) => asset.targetRoutes.includes(route))
    .slice(0, limit);
}

export function getRelatedVisualAssets(asset: VisualAssetLibraryItem, limit = 6) {
  return getApprovedVisualAssets()
    .filter((candidate) => candidate.id !== asset.id)
    .map((candidate) => {
      let score = 0;
      if (candidate.module === asset.module) score += 8;
      for (const theme of asset.relatedReportThemes) {
        if (candidate.relatedReportThemes.includes(theme)) score += 4;
      }
      for (const slug of asset.relatedToolSlugs) {
        if (candidate.relatedToolSlugs.includes(slug)) score += 4;
      }
      for (const route of asset.targetRoutes) {
        if (candidate.targetRoutes.includes(route)) score += 1;
      }
      return { asset: candidate, score };
    })
    .filter((item) => item.score > 0)
    .sort((left, right) => right.score - left.score || left.asset.id.localeCompare(right.asset.id))
    .map((item) => item.asset)
    .slice(0, limit);
}

export function getVisualAssetsForContentEntry(entry: VisualAssetContentSignal, limit = 3) {
  const assets = getApprovedVisualAssets();
  const manualIds = normalizeVisualAssetBindingIds(readVisualAssetBinding(entry.meta));
  const manuallyBound = manualIds
    .map((id) => assets.find((asset) => asset.id === id || asset.slug === id))
    .filter((asset): asset is VisualAssetLibraryItem => !!asset);
  const manualIdSet = new Set(manuallyBound.map((asset) => asset.id));
  const scored = assets
    .filter((asset) => !manualIdSet.has(asset.id))
    .map((asset) => ({
      asset,
      score: scoreAssetForContent(asset, entry),
    }))
    .filter((item) => item.score > 0)
    .sort((left, right) => right.score - left.score || left.asset.id.localeCompare(right.asset.id))
    .map((item) => item.asset);
  const fallback = assets.filter((asset) => (
    entry.contentType === 'case'
      ? ['WORLD_YI', 'REPORT', 'CONTENT'].includes(asset.module)
      : ['MINGLI', 'WORLD_YI', 'CONTENT'].includes(asset.module)
  ));

  return uniqueVisualAssets([...manuallyBound, ...scored, ...fallback]).slice(0, limit);
}

export function buildVisualAssetBindingForContentEntry(entry: VisualAssetContentSignal): VisualAssetBinding | null {
  const current = readVisualAssetBinding(entry.meta);
  const currentIds = normalizeVisualAssetBindingIds(current);
  if (currentIds.length > 0) {
    return current;
  }

  const [cover, inline, social] = getVisualAssetsForContentEntry(entry, 3);
  if (!cover) return null;

  return {
    hero: cover.id,
    cover: cover.id,
    inline: inline ? [inline.id] : [],
    social: social ? { default: social.id } : {},
  };
}
