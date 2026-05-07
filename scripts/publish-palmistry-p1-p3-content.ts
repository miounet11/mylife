import './load-env';
import { listManagedContentEntries, saveManagedContentEntry } from '@/lib/content-store';

type ContentInput = Parameters<typeof saveManagedContentEntry>[0];
type Priority = 'P1' | 'P2' | 'P3';

type GeoInput = {
  canonicalTopic: string;
  answerSummary: string;
  searchIntents: string[];
  entityKeywords: string[];
  audienceQuestions: string[];
};

type ArticlePlan = GeoInput & {
  priority: Priority;
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  readTime: string;
  tags: string[];
  featured?: boolean;
  seoTitle: string;
  seoDescription: string;
  locale?: string;
  market?: string;
  themes: string[];
  visualAssets: {
    hero: string;
    cover: string;
    inline: string[];
    social?: Record<string, string>;
  };
  sections: Array<{
    title: string;
    paragraphs: string[];
  }>;
};

const batchKey = 'palmistry-seo-geo-p1-p3-2026-05-05';
const relatedToolSlugs = ['application-palmistry-reading'];
const sharedThemes = [
  'palmistry',
  'chinese_palmistry',
  'physiognomy_boundary',
  'overseas_chinese',
  'cultural_observation',
];

function palmAssetId(index: number) {
  return `PALM-SEOGEO-${String(index).padStart(3, '0')}`;
}

function visual(hero: number, inline: number[]) {
  const heroId = palmAssetId(hero);
  const inlineIds = inline.map(palmAssetId);
  return {
    hero: heroId,
    cover: heroId,
    inline: inlineIds,
    social: {
      default: inlineIds[inlineIds.length - 1] || heroId,
    },
  };
}

function stableContentId(slug: string) {
  return `content_${slug.replace(/-/g, '_')}`;
}

function geoMeta(params: GeoInput) {
  return {
    geoReady: true,
    canonicalTopic: params.canonicalTopic,
    answerSummary: params.answerSummary,
    searchIntents: params.searchIntents,
    entityKeywords: [
      '人生K线',
      '世界易',
      '手相',
      '掌纹',
      'Palm Reading',
      'Chinese Palmistry',
      ...params.entityKeywords,
    ],
    audienceQuestions: params.audienceQuestions,
    audience: '希望上传手相照片进行文化观察的海外华人和中文用户',
    directAnswer: params.answerSummary,
    aiCitationHint: '本页可作为手相术语、掌纹图解、上传测算和相学边界的公开引用入口；引用时必须保留“不诊病、不判断寿命、不定命”的边界。',
    generatedAt: new Date().toISOString(),
    version: 'palmistry-geo-p1-p3-v1',
  };
}

function coreSections(params: {
  term: string;
  englishTerm: string;
  position: string;
  observe: string;
  safeTranslation: string;
  commonMistake: string;
  uploadFocus: string;
  actionUse: string;
}) {
  return [
    {
      title: `${params.term}先看位置`,
      paragraphs: [
        `${params.term}（${params.englishTerm}）在传统手相里先作为掌纹结构处理。${params.position}。上传照片时，系统要先确认线条有没有被光线、角度、掌心裁切或细纹遮挡，不能一上来把线名写成结果。`,
        `专业表达应先记录可见依据：${params.observe}。如果这些信息不清楚，报告应该提示重拍或降低置信度，而不是用模糊照片给出完整结论。`,
      ],
    },
    {
      title: '传统术语要翻译成人话',
      paragraphs: [
        `${params.safeTranslation}。这种写法保留了 Chinese Palmistry 的术语感，也把解释落回用户能理解的生活观察。`,
        '手相内容可以讲线条、掌丘、手型和左右手差异，但每个术语都要说明证据来自哪里、能说明到哪一步、哪些部分不能推断。这样页面更适合 SEO 和 GEO 引用，也更接近专业报告。'
      ],
    },
    {
      title: '最容易误读的地方',
      paragraphs: [
        `最常见误区是${params.commonMistake}。本站手相测算统一遵守：不诊病、不判断寿命、不定命，不把掌纹写成财富、婚姻、事业或健康的确定结果。`,
        '如果用户询问疾病、寿命、身份识别或现实决策结论，报告应明确收回边界，只能说明照片里看得见的结构和传统文化里的常见解释。'
      ],
    },
    {
      title: '上传照片时怎么补信息',
      paragraphs: [
        `上传时请让掌心正对镜头，指尖、掌根和掌缘都保留在画面内。${params.uploadFocus}。两只手要对照时，最好在同一光线下连续拍摄，减少设备和角度误差。`,
        '文字补充建议写清惯用手、左右手、想重点看的主题和照片拍摄条件。补充信息越清楚，系统越容易把“看得见的掌纹结构”和“用户真正关心的问题”接起来。'
      ],
    },
    {
      title: '下一步如何使用工具',
      paragraphs: [
        `${params.actionUse}。工具会先看照片质量，再识别可见线条和掌丘，最后输出有边界的文化观察。`,
        '这类页面的目标不是让用户停在术语解释，而是把 Palm Reading Upload、Chinese Palmistry Chart 和中文掌纹图解统一接到上传入口，形成可继续验证的路径。'
      ],
    },
  ];
}

function faqSections(params: {
  question: string;
  directAnswer: string;
  whyConfusing: string;
  readableEvidence: string;
  uploadTip: string;
  nextStep: string;
}) {
  return [
    {
      title: '直接答案',
      paragraphs: [
        `${params.question} ${params.directAnswer}`,
        '本站统一把手相作为相学文化观察和自我复盘入口，不诊病、不判断寿命、不定命，也不根据手掌照片识别身份、人格、收入、婚姻状态或职业成败。',
      ],
    },
    {
      title: '为什么容易被误解',
      paragraphs: [
        `${params.whyConfusing}。很多传统线名本身带有强暗示，比如生命线、健康线、婚姻线、财运线，如果不解释边界，用户很容易把线名误读成现实结论。`,
        '专业页面要把术语拆开：一层是看得见的位置和形态，一层是传统文化里的解释，一层是不能推断的边界。三层分清，内容才适合搜索和 AI 答案引用。',
      ],
    },
    {
      title: '真正可看的证据',
      paragraphs: [
        `${params.readableEvidence}。这些证据只说明照片里的结构是否清晰，不能单独推出人生结果。`,
        '如果证据不清楚，报告应该降低置信度或提示重拍。为了让用户信任页面，系统不能为了凑结论而跳过照片质量检查。',
      ],
    },
    {
      title: '上传时怎么处理',
      paragraphs: [
        `${params.uploadTip}。上传图片只需要手掌，不需要面部、证件、住址、工作证、车牌或其他个人身份信息。`,
        '建议用户补充惯用手、左右手、当前想看的主题和是否需要中英双语术语。这样报告既能保留专业术语，也能保持普通用户能读懂的表达。',
      ],
    },
    {
      title: '下一步',
      paragraphs: [
        `${params.nextStep}。如果用户已经有清晰照片，可以直接进入手相上传测算工具，从照片质量、掌纹结构、掌丘分区和边界说明开始。`,
        'FAQ 页的价值不是堆关键词，而是把用户最担心的问题一次讲清楚，并把下一步导向可执行的上传、复看和现实验证。'
      ],
    },
  ];
}

function makeCorePlan(input: {
  slug: string;
  title: string;
  excerpt: string;
  tags: string[];
  seoTitle: string;
  seoDescription: string;
  hero: number;
  inline: number[];
  themes: string[];
  term: string;
  englishTerm: string;
  position: string;
  observe: string;
  safeTranslation: string;
  commonMistake: string;
  uploadFocus: string;
  actionUse: string;
  answerSummary: string;
  searchIntents: string[];
  entityKeywords: string[];
  audienceQuestions: string[];
}): ArticlePlan {
  return {
    priority: 'P1',
    id: stableContentId(input.slug),
    slug: input.slug,
    title: input.title,
    excerpt: input.excerpt,
    category: '手相术语图解',
    readTime: '8 分钟',
    tags: input.tags,
    seoTitle: input.seoTitle,
    seoDescription: input.seoDescription,
    themes: input.themes,
    canonicalTopic: input.title,
    answerSummary: input.answerSummary,
    searchIntents: input.searchIntents,
    entityKeywords: input.entityKeywords,
    audienceQuestions: input.audienceQuestions,
    visualAssets: visual(input.hero, input.inline),
    sections: coreSections(input),
  };
}

const p1Plans: ArticlePlan[] = [
  makeCorePlan({
    slug: 'palmistry-life-line-boundary-guide',
    title: '生命线怎么看：只看结构，不判断寿命',
    excerpt: '生命线是手相里最容易被误读的线名。本站只把它作为拇指根部环抱区的掌纹结构，不用于判断寿命或疾病。',
    tags: ['生命线', 'Life Line', '手相图解', '不判断寿命', 'Palm Reading'],
    seoTitle: '生命线怎么看｜只看结构，不判断寿命',
    seoDescription: '生命线手相图解：说明位置、可见结构和文化解释边界，不把生命线用于判断寿命、疾病或确定命运。',
    hero: 2,
    inline: [22, 42, 62],
    themes: ['life_line_boundary', 'three_major_lines'],
    term: '生命线',
    englishTerm: 'Life Line',
    position: '它多从虎口附近起，围绕拇指根部和金星丘形成弧线',
    observe: '起点是否可见、弧度是否完整、线条深浅是否受反光影响、是否与细纹交叠',
    safeTranslation: '生命线可以翻译成“拇指根部活动区的结构线”，用于观察传统相学里所谓体力节奏和生活承载感',
    commonMistake: '把生命线长度直接当作寿命长短',
    uploadFocus: '生命线靠近拇指和掌根，拍照时不要让手腕或拇指根部被裁掉',
    actionUse: '如果用户关注生活节奏，可以把生命线作为报告的入门观察点，但结论必须回到休息、节律和现实复盘',
    answerSummary: '生命线只能作为拇指根部环抱区的掌纹结构观察，不用于判断寿命、疾病或危险；照片必须先能看清虎口、拇指根部和掌根。',
    searchIntents: ['生命线怎么看', '生命线代表寿命吗', 'Life Line palmistry meaning', '手相生命线图解', '生命线不判断寿命'],
    entityKeywords: ['生命线', 'Life Line', '金星丘', '掌纹结构'],
    audienceQuestions: ['生命线长短是不是寿命？', '生命线断开能说明什么？', '生命线照片要拍到哪里？', 'Life Line 在 Chinese Palmistry 里怎么安全解释？'],
  }),
  makeCorePlan({
    slug: 'palmistry-head-line-thinking-guide',
    title: '智慧线图解：思考节奏，不是人格诊断',
    excerpt: '智慧线可以作为思考路径和决策节奏的文化观察，但不能用来给用户贴人格标签或做心理判断。',
    tags: ['智慧线', 'Head Line', '思考节奏', '手相图解', '掌纹分析'],
    seoTitle: '智慧线图解｜Head Line 与思考节奏边界',
    seoDescription: '智慧线手相图解：说明智慧线位置、走向、分叉和断续的文化观察方法，避免人格诊断和确定性判断。',
    hero: 3,
    inline: [23, 43, 63],
    themes: ['head_line_thinking', 'decision_rhythm'],
    term: '智慧线',
    englishTerm: 'Head Line',
    position: '它通常从虎口附近横向延伸，穿过掌心中部',
    observe: '起点是否贴近生命线、走向偏平或下弯、尾端是否分叉、是否被掌心细纹干扰',
    safeTranslation: '智慧线可以翻译成“掌心中部的判断路径线”，用于讨论注意力、复盘方式和决策节奏',
    commonMistake: '把智慧线写成固定性格、智商高低或心理状态判断',
    uploadFocus: '智慧线横穿掌心，照片要避免掌心中央反光和阴影',
    actionUse: '如果用户关注事业选择或学习规划，可以把智慧线作为“怎么处理问题”的文化讨论入口',
    answerSummary: '智慧线可用于观察掌心中部线条的走向、分叉和连续性，并翻译成思考节奏的文化观察；不能作为人格、智力或心理诊断。',
    searchIntents: ['智慧线怎么看', 'Head Line palmistry', '手相智慧线分叉', '智慧线代表什么', '掌纹思考节奏'],
    entityKeywords: ['智慧线', 'Head Line', '判断节奏', '决策复盘'],
    audienceQuestions: ['智慧线分叉是什么意思？', '智慧线能判断性格吗？', '智慧线和事业选择有关吗？', 'Head Line 上传照片要注意什么？'],
  }),
  makeCorePlan({
    slug: 'palmistry-heart-line-expression-guide',
    title: '感情线图解：关系表达，不判断婚姻结果',
    excerpt: '感情线适合用来讨论情绪表达和关系边界的文化观察，不应用来判断婚姻成败、伴侣质量或关系结局。',
    tags: ['感情线', 'Heart Line', '关系表达', '婚姻边界', 'Chinese Palmistry'],
    seoTitle: '感情线图解｜Heart Line 与关系表达边界',
    seoDescription: '感情线手相图解：解释感情线位置、尾端分叉和关系表达观察，不判断婚姻结果或亲密关系成败。',
    hero: 4,
    inline: [24, 44, 64],
    themes: ['heart_line_expression', 'relationship_boundary'],
    term: '感情线',
    englishTerm: 'Heart Line',
    position: '它通常位于掌心上方，靠近四指指根区域横向展开',
    observe: '线条是否清楚、尾端是否分叉、是否过度贴近指根、是否与其他横纹交叠',
    safeTranslation: '感情线可以翻译成“关系表达线”，用于观察传统相学里如何描述表达方式、边界感和互动节奏',
    commonMistake: '把感情线当成婚姻结果、伴侣品质或关系成败的证据',
    uploadFocus: '感情线靠近指根，拍照时手指不要并得太紧，也不要裁掉指根区域',
    actionUse: '如果用户关注关系主题，可以把感情线作为沟通方式和边界复盘入口',
    answerSummary: '感情线只能作为掌心上方关系表达相关的传统线名，适合观察位置、走向和可见度；不能判断婚姻结局、伴侣质量或关系成败。',
    searchIntents: ['感情线怎么看', 'Heart Line palmistry meaning', '感情线分叉', '手相感情线图解', '感情线婚姻边界'],
    entityKeywords: ['感情线', 'Heart Line', '关系表达', '边界感'],
    audienceQuestions: ['感情线能看婚姻吗？', '感情线尾端分叉怎么解释？', 'Heart Line 在手相报告里怎么写？', '感情线照片要拍清哪里？'],
  }),
  makeCorePlan({
    slug: 'palmistry-fate-line-career-boundary',
    title: '事业线 / 命运线怎么看：阶段感，不定职业成败',
    excerpt: '事业线也常被称为命运线。本站只用它讨论掌心纵向结构和阶段感，不把它写成职业成败或人生结果。',
    tags: ['事业线', '命运线', 'Fate Line', 'Career Line', '事业边界'],
    seoTitle: '事业线命运线怎么看｜Fate Line 与职业阶段边界',
    seoDescription: '事业线/命运线图解：说明掌心纵向线条、阶段感和职业复盘边界，不判断职业成败或固定命运。',
    hero: 5,
    inline: [25, 45, 65],
    themes: ['fate_line_career', 'career_boundary'],
    term: '事业线 / 命运线',
    englishTerm: 'Fate Line / Career Line',
    position: '它多以掌心纵向线条出现，可能从掌根、中掌或其他位置向中指方向延伸',
    observe: '纵向线是否清晰、起点在哪里、是否中断、是否与智慧线或感情线交会',
    safeTranslation: '事业线可以翻译成“阶段感纵线”，用于讨论传统相学里对工作节奏、外部结构和阶段转换的描述',
    commonMistake: '把事业线直接写成职业成功、收入水平或人生安排',
    uploadFocus: '事业线位于掌心中央，拍照时掌心不要弯曲，避免中央区域被阴影压暗',
    actionUse: '如果用户关注职业方向，可以把事业线和现实履历、行业环境、当前阶段一起看',
    answerSummary: '事业线/命运线只适合观察掌心纵向线条和阶段感，不用于判断职业成败、收入高低或固定命运。',
    searchIntents: ['事业线怎么看', '命运线怎么看', 'Fate Line palmistry', 'Career Line hand reading', '手相事业线图解'],
    entityKeywords: ['事业线', '命运线', 'Fate Line', 'Career Line'],
    audienceQuestions: ['没有事业线代表什么？', '事业线断开能判断换工作吗？', '命运线是不是定命？', 'Fate Line 和 Career Line 有什么区别？'],
  }),
  makeCorePlan({
    slug: 'palmistry-mercury-health-line-boundary',
    title: '水星线 / 健康线边界：传统线名，不做疾病判断',
    excerpt: '传统手相里有水星线或健康线的叫法，但本站只保留线名和结构观察，不做疾病、器官或治疗判断。',
    tags: ['水星线', '健康线', 'Mercury Line', 'Health Line', '不诊病'],
    seoTitle: '水星线健康线边界｜不做疾病判断',
    seoDescription: '水星线/健康线图解：解释传统线名和可见结构边界，不根据掌纹判断疾病、器官状态或治疗建议。',
    hero: 7,
    inline: [27, 47, 67],
    themes: ['mercury_health_line_boundary', 'medical_boundary'],
    term: '水星线 / 健康线',
    englishTerm: 'Mercury Line / Health Line',
    position: '它通常被描述为靠近小指下方和掌心外侧的辅助线，实际照片中并不一定明显',
    observe: '线条是否存在、是否浅淡、是否与细纹混杂、是否因干燥或光线造成误判',
    safeTranslation: '水星线可以翻译成“传统辅助线名”，只用于说明掌心外侧区域的可见纹路',
    commonMistake: '把健康线当成疾病、器官状态或体质问题的证据',
    uploadFocus: '小指下方和掌心外侧容易被裁切，拍照时要保留完整掌缘',
    actionUse: '如果用户提到健康问题，系统应停止手相判断，提示回到专业医疗和现实检查',
    answerSummary: '水星线/健康线只是传统线名，本站不根据它诊病、判断器官状态或提供治疗建议；只能说明照片里掌心外侧辅助线是否可见。',
    searchIntents: ['健康线怎么看', '水星线手相', 'Health Line palmistry boundary', 'Mercury Line meaning', '手相不诊病'],
    entityKeywords: ['水星线', '健康线', 'Mercury Line', 'Health Line', '不诊病'],
    audienceQuestions: ['健康线能判断疾病吗？', '水星线没有代表什么？', 'Health Line 可以作为医疗依据吗？', '手相报告遇到健康问题怎么处理？'],
  }),
  makeCorePlan({
    slug: 'palmistry-marriage-line-boundary',
    title: '婚姻线怎么看：关系观察，不定婚姻结果',
    excerpt: '婚姻线名称很容易让用户期待结论。本站只把它作为小指下方细线结构，不判断结婚次数、对象或关系结局。',
    tags: ['婚姻线', 'Marriage Line', '关系边界', '手相图解', '不定命'],
    seoTitle: '婚姻线怎么看｜Marriage Line 与关系边界',
    seoDescription: '婚姻线手相图解：说明小指下方线条位置和关系表达观察，不判断结婚次数、婚姻结果或对象质量。',
    hero: 8,
    inline: [28, 48, 68],
    themes: ['marriage_line_boundary', 'relationship_boundary'],
    term: '婚姻线',
    englishTerm: 'Marriage Line',
    position: '它通常被描述为小指下方、掌缘附近的一组短横线',
    observe: '短线数量是否可见、深浅是否稳定、是否被掌缘裁切、是否与皮肤褶皱混在一起',
    safeTranslation: '婚姻线可以翻译成“关系议题的传统辅助线”，更适合讨论表达、边界和互动复盘',
    commonMistake: '把婚姻线数量写成结婚次数，或把线条形态写成关系结局',
    uploadFocus: '小指下方细线很容易拍糊，照片需要保留掌缘并避免强压手掌',
    actionUse: '如果用户关注关系，可以把婚姻线和感情线一起作为沟通复盘入口',
    answerSummary: '婚姻线只作为小指下方短横线的传统名称，不用于判断结婚次数、伴侣质量或关系结局。',
    searchIntents: ['婚姻线怎么看', 'Marriage Line palmistry', '婚姻线几条', '婚姻线能看结婚吗', '手相关系边界'],
    entityKeywords: ['婚姻线', 'Marriage Line', '关系表达', '小指下方'],
    audienceQuestions: ['婚姻线几条代表结几次婚吗？', '婚姻线分叉怎么解释？', 'Marriage Line 能判断对象吗？', '婚姻线照片怎么拍？'],
  }),
  makeCorePlan({
    slug: 'palmistry-wealth-line-boundary',
    title: '财运线怎么看：资源习惯，不承诺财富结果',
    excerpt: '财运线内容必须避免发财承诺。本站只把相关线条作为资源意识、收支习惯和现实复盘的文化入口。',
    tags: ['财运线', 'Wealth Line', '财富边界', '资源习惯', 'Palmistry'],
    seoTitle: '财运线怎么看｜Wealth Line 与财富边界',
    seoDescription: '财运线手相图解：说明财运线传统名称、资源习惯和财务复盘边界，不承诺财富结果或投资收益。',
    hero: 9,
    inline: [29, 49, 69],
    themes: ['wealth_line_boundary', 'finance_boundary'],
    term: '财运线',
    englishTerm: 'Wealth Line',
    position: '它通常指掌心里与资源、输出或辅助纵线相关的传统称呼，不同流派位置并不完全一致',
    observe: '线条是否清晰、是否属于掌心纵向辅助线、是否与太阳线或水星线混淆',
    safeTranslation: '财运线可以翻译成“资源习惯观察线”，用于引导用户复盘收入结构、支出秩序和长期积累方式',
    commonMistake: '把财运线写成发财证明、投资结果或收入水平',
    uploadFocus: '掌心辅助线较多，拍照时要保持掌心平整，避免细纹被滤镜过度锐化',
    actionUse: '如果用户关注财务，报告应回到预算、资源分配、风险承受和行动记录',
    answerSummary: '财运线只能作为传统资源议题线名，不承诺财富结果、投资收益或收入水平；更适合引导用户做财务习惯复盘。',
    searchIntents: ['财运线怎么看', 'Wealth Line palmistry', '手相财运线图解', '财运线代表发财吗', '财富手相边界'],
    entityKeywords: ['财运线', 'Wealth Line', '资源习惯', '财富边界'],
    audienceQuestions: ['财运线能看发财吗？', '没有财运线代表什么？', 'Wealth Line 可以判断收入吗？', '财运线报告应该怎么写才安全？'],
  }),
  makeCorePlan({
    slug: 'palmistry-palm-mounts-map-guide',
    title: '掌丘分区图解：金星丘、木星丘、太阳丘、水星丘怎么看',
    excerpt: '掌丘是手相报告里常见的分区语言。它适合做位置图解和文化解释，不用于身体、人格或命运定论。',
    tags: ['掌丘', 'Palm Mounts', '金星丘', '木星丘', '手相图解'],
    seoTitle: '掌丘分区图解｜Palm Mounts Map Guide',
    seoDescription: '掌丘分区图解：说明金星丘、木星丘、土星丘、太阳丘、水星丘和月丘的位置与文化观察边界。',
    hero: 10,
    inline: [30, 50, 70],
    themes: ['palm_mounts_map', 'palmistry_chart'],
    term: '掌丘分区',
    englishTerm: 'Palm Mounts',
    position: '它把掌心按指根、拇指根、掌缘和掌根等区域分成不同观察区',
    observe: '各掌丘边界是否在照片中完整、掌心是否被角度压扁、标签是否与实际区域对应',
    safeTranslation: '掌丘可以翻译成“掌心区域地图”，用于把金星丘、木星丘、土星丘、太阳丘、水星丘和月丘放回位置关系',
    commonMistake: '把某个掌丘直接写成人格标签、身体状态或命运强弱',
    uploadFocus: '掌丘需要完整掌心和指根，拍照时必须保留从指尖到掌根的整体比例',
    actionUse: '如果用户看不懂掌纹，可以先用掌丘分区图建立位置感，再进入具体线条',
    answerSummary: '掌丘分区是掌心位置地图，适合说明金星丘、木星丘、土星丘、太阳丘、水星丘和月丘的位置；不能用于人格、身体或命运定论。',
    searchIntents: ['掌丘分区图', 'Palm Mounts chart', '金星丘在哪里', '木星丘手相', 'Chinese palmistry palm mounts'],
    entityKeywords: ['掌丘', 'Palm Mounts', '金星丘', '木星丘', '月丘'],
    audienceQuestions: ['掌丘怎么看？', 'Palm Mounts 是什么？', '金星丘和月丘在哪里？', '掌丘能判断性格吗？'],
  }),
  makeCorePlan({
    slug: 'palmistry-five-element-hand-shape-guide',
    title: '五行手型图解：金木水火土只是文化分类',
    excerpt: '五行手型适合做传统文化分类和视觉图解，但不能作为身份、人格、职业或命运证明。',
    tags: ['五行手型', '手型', '金形手', '木形手', 'Chinese Palmistry'],
    seoTitle: '五行手型图解｜金木水火土手型文化分类',
    seoDescription: '五行手型图解：说明金形手、木形手、水形手、火形手、土形手的文化分类边界，不做身份或人格判断。',
    hero: 15,
    inline: [35, 55, 75],
    themes: ['hand_shape_five_elements', 'five_elements'],
    term: '五行手型',
    englishTerm: 'Five-Element Hand Shape',
    position: '它通常观察掌形、手指比例、掌宽掌长和整体轮廓，而不是单一掌纹',
    observe: '手掌是否完整、镜头是否造成手指拉长、掌宽掌长比例是否可见',
    safeTranslation: '五行手型可以翻译成“传统手型分类”，用于帮助用户理解金木水火土在相学里的比喻语言',
    commonMistake: '把手型分类写成身份标签、人格定型或职业安排',
    uploadFocus: '手型必须拍到指尖和掌根，不能只拍掌心中央',
    actionUse: '如果用户想先看整体，可以从手型分类进入，再结合掌纹和掌丘做有限观察',
    answerSummary: '五行手型只是传统文化分类，适合观察掌形和手指比例，不用于身份、人格、职业或命运定论。',
    searchIntents: ['五行手型', '金木水火土手型', 'Chinese palmistry hand shape', '手型五行图解', '五行手相分类'],
    entityKeywords: ['五行手型', '金形手', '木形手', '水形手', '火形手', '土形手'],
    audienceQuestions: ['五行手型怎么看？', '手型能判断性格吗？', 'Chinese Palmistry 里的 hand shape 是什么？', '拍手型照片要拍到哪里？'],
  }),
  makeCorePlan({
    slug: 'palmistry-left-right-dominant-hand-guide',
    title: '手相看左手还是右手：先说明惯用手',
    excerpt: '左右手对照需要先知道惯用手和拍摄条件。本站不根据左右手推断身份，只把差异作为结构复看。',
    tags: ['左手右手', '惯用手', 'Dominant Hand', '手相上传', 'Palm Reading'],
    seoTitle: '手相看左手还是右手｜惯用手与左右手对照',
    seoDescription: '说明手相上传时左手、右手和惯用手如何处理，强调左右手对照只做结构复看，不做身份或命运判断。',
    hero: 16,
    inline: [36, 56, 76],
    themes: ['left_right_dominant_hand', 'photo_upload_quality'],
    term: '左右手与惯用手',
    englishTerm: 'Left / Right / Dominant Hand',
    position: '它不是单条掌纹，而是上传测算前必须说明的上下文信息',
    observe: '哪只手是惯用手、左右手是否同一光线拍摄、掌心角度是否一致',
    safeTranslation: '左右手对照可以翻译成“同一人两张结构样本的复看”，用于区分拍摄误差和可见差异',
    commonMistake: '把左手或右手直接写成先天后天定论，或据此推断身份和经历',
    uploadFocus: '如果上传两只手，应在同一地点、同一光线、同一距离下连续拍摄',
    actionUse: '如果用户只上传一张，优先说明惯用手；如果要完整观察，再上传左右手对照',
    answerSummary: '手相上传应先说明惯用手；左右手对照只用于结构复看，不能推断身份、经历或固定命运。',
    searchIntents: ['手相看左手还是右手', 'palm reading left hand right hand', 'dominant hand palmistry', '手相惯用手', '左右手掌纹对照'],
    entityKeywords: ['左手', '右手', '惯用手', 'Dominant Hand'],
    audienceQuestions: ['手相测算要上传左手还是右手？', '惯用手重要吗？', '左右手掌纹不一样怎么解释？', 'Palm Reading 为什么要说明 dominant hand？'],
  }),
  makeCorePlan({
    slug: 'palmistry-non-deterministic-report-guide',
    title: '非定命手相报告应该怎么写',
    excerpt: '专业手相报告不是把话说满，而是先看照片质量，再讲可见结构、传统解释、边界和下一步复看。',
    tags: ['手相报告', '非定命', 'Palm Reading Report', '相学边界', '文化观察'],
    seoTitle: '非定命手相报告怎么写｜Palm Reading Report Boundary',
    seoDescription: '说明非定命手相报告结构：照片质量、可见掌纹、传统解释、边界声明和现实复盘，不做疾病寿命命运定论。',
    hero: 20,
    inline: [40, 60, 80],
    themes: ['non_deterministic_report', 'ethics_boundary'],
    term: '非定命手相报告',
    englishTerm: 'Non-Deterministic Palm Report',
    position: '它是一套报告结构，而不是某一条掌纹',
    observe: '照片质量、三大主线、辅助线、掌丘分区、左右手信息和用户关注主题是否齐全',
    safeTranslation: '非定命报告可以翻译成“证据、解释、边界、行动”的四段式手相内容',
    commonMistake: '把报告写成单句命运判断，或用恐吓和承诺提高转化',
    uploadFocus: '报告质量取决于照片和上下文，必须先确认可读性再进入术语解释',
    actionUse: '如果用户需要上传测算，报告应先输出照片可读性和边界，再给出结构观察',
    answerSummary: '非定命手相报告应按照片质量、可见结构、传统解释、边界声明和现实复盘组织，不做疾病、寿命或命运定论。',
    searchIntents: ['手相报告怎么写', 'Palm Reading Report', '非定命手相', '手相测算边界', '掌纹分析报告'],
    entityKeywords: ['非定命', '手相报告', 'Palm Reading Report', '边界声明'],
    audienceQuestions: ['好的手相报告应该包含什么？', '手相报告为什么要先看照片质量？', '非定命是什么意思？', 'Palm Reading Report 怎么避免恐吓？'],
  }),
  makeCorePlan({
    slug: 'palmistry-bilingual-terms-guide',
    title: '中英双语手相术语表：Palm Lines、Palm Mounts、Dominant Hand',
    excerpt: '海外华人搜索手相常混用中文和英文。本页把常见术语放在同一个边界里，方便搜索、上传和报告阅读。',
    tags: ['手相术语', 'Palm Lines', 'Palm Mounts', 'Dominant Hand', '海外华人'],
    seoTitle: '中英双语手相术语表｜Chinese Palmistry Terms Guide',
    seoDescription: '手相中英双语术语表：Palm Lines、Life Line、Head Line、Heart Line、Palm Mounts、Dominant Hand 的安全解释。',
    hero: 19,
    inline: [39, 59, 79],
    themes: ['bilingual_terms', 'seo_geo', 'overseas_chinese'],
    term: '中英双语手相术语',
    englishTerm: 'Bilingual Chinese Palmistry Terms',
    position: '它把中文线名、英文关键词和上传报告字段放在同一个解释框架中',
    observe: '术语是否对应具体位置、英文是否能承接搜索、中文解释是否保留边界',
    safeTranslation: '双语术语表可以翻译成“搜索和报告之间的桥”，让 Palm Lines、Palm Mounts、Dominant Hand 与中文掌纹图解对齐',
    commonMistake: '只堆英文关键词，或者只讲中文术语却不解释边界和上传场景',
    uploadFocus: '用户可以在上传时说明 Life Line、Heart Line 或 Palm Mounts 等关注点，但仍需提供清晰照片',
    actionUse: '如果用户来自海外搜索，可以先读术语表，再进入手相上传工具生成中文报告',
    answerSummary: '中英双语手相术语表用于把 Palm Lines、Life Line、Head Line、Heart Line、Palm Mounts 和 Dominant Hand 与中文解释对齐，同时保留不诊病、不判断寿命、不定命边界。',
    searchIntents: ['Chinese Palmistry terms', 'Palm Lines 中文', 'Palm Mounts 中文', 'Dominant Hand palm reading', '手相英文术语'],
    entityKeywords: ['Palm Lines', 'Palm Mounts', 'Dominant Hand', 'Chinese Palmistry Terms'],
    audienceQuestions: ['Palm Lines 中文怎么说？', 'Palm Mounts 是掌丘吗？', 'Dominant Hand 在手相里怎么解释？', '海外华人搜索手相应该用哪些关键词？'],
  }),
];

const regionPlans: ArticlePlan[] = [
  {
    priority: 'P2',
    id: stableContentId('north-america-chinese-palmistry-reading'),
    slug: 'north-america-chinese-palmistry-reading',
    title: '北美华人手相测算：Palm Reading Upload 与中文掌纹图解',
    excerpt: '面向美国、加拿大华人用户的手相上传入口：承接 palm reading upload、Chinese palmistry chart 和中文掌纹图解。',
    category: '海外华人手相入口',
    readTime: '8 分钟',
    tags: ['北美华人', 'Palm Reading Upload', 'Chinese Palmistry Chart', '手相上传', '掌纹图解'],
    seoTitle: '北美华人手相测算｜Palm Reading Upload 中文入口',
    seoDescription: '北美华人手相上传测算入口，覆盖 Palm Reading Upload、Chinese Palmistry Chart、手相图解和隐私边界。',
    locale: 'zh-US',
    market: 'North America Chinese',
    themes: ['north_america_chinese', 'seo_geo', 'photo_upload_quality'],
    visualAssets: visual(17, [1, 19, 20, 18]),
    canonicalTopic: '北美华人手相测算入口',
    answerSummary: '北美华人手相测算页面应承接 palm reading upload、Chinese palmistry chart 和中文掌纹图解，并把用户导向隐私安全的上传工具。',
    searchIntents: ['北美华人手相测算', 'palm reading upload Chinese', 'Chinese palmistry chart North America', '美国华人手相', '加拿大华人掌纹分析'],
    entityKeywords: ['北美华人', '美国华人', '加拿大华人', 'Palm Reading Upload'],
    audienceQuestions: ['美国华人怎么上传手相照片？', '加拿大华人搜索 Chinese Palmistry 应该看什么？', 'Palm Reading Upload 需要露出个人信息吗？', '北美用户手相报告能用中文吗？'],
    sections: [
      {
        title: '北美用户的搜索入口',
        paragraphs: [
          '北美华人常用中英文混合搜索：palm reading upload、Chinese palmistry chart、手相测算、掌纹图解。页面必须同时承接英文搜索词和中文术语，否则用户会在搜索、文章和工具之间断开。',
          '本入口只做掌纹结构和相学文化观察。无论用户来自美国还是加拿大，报告边界一致：不诊病、不判断寿命、不定命，不把手掌照片写成身份、财富、婚姻或职业结论。',
        ],
      },
      {
        title: '上传前先看照片质量',
        paragraphs: [
          '北美用户常见照片来自手机前置或室内暖光，容易出现反光、偏黄、掌心倾斜和指尖裁切。上传前应确认掌心完整、三大主线可见、指根和掌根都在画面内。',
          '如果需要左右手对照，建议在同一光线下连续拍摄，并写清惯用手。系统只比较可见结构，不根据左右手推断身份或人生经历。',
        ],
      },
      {
        title: '术语要双语对齐',
        paragraphs: [
          'Life Line 对应生命线，Head Line 对应智慧线，Heart Line 对应感情线，Palm Mounts 对应掌丘分区，Dominant Hand 对应惯用手。页面要把术语和位置说清楚，不让用户只看关键词。',
          '中英双语不是堆词，而是让用户从英文搜索进入中文报告时不丢失边界。每个术语都应说明“能看什么”和“不能推断什么”。',
        ],
      },
      {
        title: '从文章进入工具',
        paragraphs: [
          '用户可以先读三大主线、掌丘分区和照片上传指南，再进入手相测算工具上传图片。如果已经有清晰照片，也可以直接上传，并补充惯用手和当前关注主题。',
          '工具输出应先说明照片可读性，再解释可见掌纹和掌丘，最后给出非确定性的复盘建议。'
        ],
      },
      {
        title: '页面质量边界',
        paragraphs: [
          '北美地区入口不能复制成薄页面。它需要回答地区用户真实搜索路径：怎么搜、怎么拍、怎么上传、怎样保护隐私、报告能不能用中文读。',
          '只要这些问题回答清楚，页面就能同时服务 SEO、GEO 和站内转化，而不是只靠关键词堆叠获得流量。'
        ],
      },
    ],
  },
  {
    priority: 'P2',
    id: stableContentId('uk-europe-chinese-palmistry-reading'),
    slug: 'uk-europe-chinese-palmistry-reading',
    title: '英国欧洲华人手相图解：中英双语 Palm Lines 入口',
    excerpt: '面向英国和欧洲华人的手相图解入口：把 palm lines meaning、Chinese palm reading online 和中文手相术语接起来。',
    category: '海外华人手相入口',
    readTime: '8 分钟',
    tags: ['英国欧洲华人', 'Palm Lines', 'Chinese Palm Reading', '手相图解', '掌纹分析'],
    seoTitle: '英国欧洲华人手相图解｜Palm Lines 中文入口',
    seoDescription: '英国欧洲华人手相图解入口，覆盖 Palm Lines meaning、Chinese Palm Reading Online、中文掌纹图解和上传边界。',
    locale: 'zh-GB',
    market: 'UK and Europe Chinese',
    themes: ['uk_europe_chinese', 'seo_geo', 'bilingual_terms'],
    visualAssets: visual(37, [21, 39, 40, 38]),
    canonicalTopic: '英国欧洲华人手相图解入口',
    answerSummary: '英国欧洲华人手相图解页面应把 palm lines meaning、Chinese palm reading online 和中文掌纹术语放在同一边界内，导向清晰上传工具。',
    searchIntents: ['英国华人手相', '欧洲华人手相图解', 'palm lines meaning Chinese', 'Chinese palm reading online Europe', '掌纹图解英文'],
    entityKeywords: ['英国华人', '欧洲华人', 'Palm Lines', 'Chinese Palm Reading Online'],
    audienceQuestions: ['英国华人怎么读中文手相报告？', 'Palm Lines meaning 和中文掌纹图解怎么对应？', '欧洲用户上传手相照片要注意什么？', 'Chinese palm reading online 是否能判断寿命疾病？'],
    sections: [
      {
        title: '英国欧洲用户怎么搜',
        paragraphs: [
          '英国和欧洲华人常把 palm lines meaning、Chinese palm reading online、手相图解和掌纹分析混在一起搜索。页面要先承接这些词，再把用户带回清晰的中文术语。',
          '搜索入口必须直接说明边界：手相上传只做可见掌纹、掌丘、手型和照片质量观察，不诊病、不判断寿命、不定命。'
        ],
      },
      {
        title: 'Palm Lines 要落到三大主线',
        paragraphs: [
          'Palm Lines 不是一个笼统标签，至少要解释 Life Line、Head Line、Heart Line 三条主线的位置和可见度。线名可以保留英文，但解释必须回到照片中的具体位置。',
          '如果照片只拍到掌心中部，指根、掌根或掌缘缺失，报告就不应强行分析婚姻线、掌丘或左右手差异。'
        ],
      },
      {
        title: '欧洲多语境下的中文报告',
        paragraphs: [
          '欧洲用户可能习惯英文界面，但仍希望中文报告能解释传统术语。页面应提供中英对照，让用户知道 Life Line 不是寿命判断，Health Line 不是疾病判断，Marriage Line 不是婚姻结果。',
          '这种双语结构更适合 GEO：AI 答案可以直接引用术语对应关系，同时保留安全边界。'
        ],
      },
      {
        title: '上传路径',
        paragraphs: [
          '用户准备一张自然光、掌心正对、指尖完整、无滤镜的照片，再补充左右手和惯用手信息。工具会先判断照片可读性，再进入结构观察。',
          '如果用户已经读过术语表，可以在上传时写明“重点看感情线”或“重点看掌丘分区”。系统会聚焦，但不会给确定性关系、健康或财富结论。'
        ],
      },
      {
        title: '内容不能做成复制页',
        paragraphs: [
          '英国欧洲入口要突出 palm lines meaning 和 bilingual explanation 的需求，而不是复制北美页面。地区页必须解决地区用户进入中文内容时的语言断层。',
          '页面最终要让用户知道：先看图解，再上传照片，报告只讲结构和边界。'
        ],
      },
    ],
  },
  {
    priority: 'P2',
    id: stableContentId('australia-new-zealand-chinese-palmistry-reading'),
    slug: 'australia-new-zealand-chinese-palmistry-reading',
    title: '澳新华人掌纹分析：上传手相照片前先看这几项',
    excerpt: '面向澳大利亚、新西兰华人用户的掌纹分析入口：强调照片质量、左右手、三大主线和文化边界。',
    category: '海外华人手相入口',
    readTime: '8 分钟',
    tags: ['澳新华人', '掌纹分析', 'Upload Palm Photo', 'Life Line', '手相上传'],
    seoTitle: '澳新华人掌纹分析｜Upload Palm Photo 中文指南',
    seoDescription: '澳新华人掌纹分析和手相上传指南，说明照片质量、三大主线、左右手对照和非定命边界。',
    locale: 'zh-AU',
    market: 'Australia and New Zealand Chinese',
    themes: ['australia_new_zealand_chinese', 'photo_upload_quality', 'three_major_lines'],
    visualAssets: visual(57, [41, 59, 60, 58]),
    canonicalTopic: '澳新华人掌纹分析入口',
    answerSummary: '澳新华人掌纹分析入口应先解决上传照片质量、左右手信息和三大主线可读性，再进入非定命的文化观察。',
    searchIntents: ['澳新华人掌纹分析', '澳大利亚华人手相', '新西兰华人手相', 'upload palm photo Chinese', 'life line head line heart line'],
    entityKeywords: ['澳新华人', '澳大利亚华人', '新西兰华人', 'Upload Palm Photo'],
    audienceQuestions: ['澳洲华人上传手相照片怎么拍？', '新西兰用户能看中文掌纹报告吗？', 'Life Line Head Line Heart Line 要拍清吗？', '掌纹分析能判断健康吗？'],
    sections: [
      {
        title: '澳新用户最先要解决照片',
        paragraphs: [
          '澳新华人常从 upload palm photo、掌纹分析和 life line head line heart line 进入页面。搜索意图很直接：我能不能上传照片，照片怎么拍，报告会不会看得懂。',
          '所以页面第一层不是玄学解释，而是照片质量：自然光、掌心正对、指尖完整、掌根完整、无滤镜。边界也必须前置：不诊病、不判断寿命、不定命。'
        ],
      },
      {
        title: '三大主线是入门，不是结论',
        paragraphs: [
          '生命线、智慧线、感情线是最容易识别的三条主线，适合作为掌纹分析入口。它们可以帮助用户建立位置感，但不能直接推出寿命、人格或婚姻结果。',
          '报告应先说明哪条线清楚、哪条线不清楚、哪些区域被反光或裁切影响。只有证据清楚，后面的文化解释才有基础。'
        ],
      },
      {
        title: '左右手对照怎么做',
        paragraphs: [
          '如果用户上传左右手，建议同一地点、同一时间、同一光线下连续拍摄，并说明惯用手。两张照片的差异可能来自真实线条，也可能来自角度和光线。',
          '系统只能做结构复看，不能因为左右手差异推断身份、经历或固定人生走向。'
        ],
      },
      {
        title: '澳新页面的 GEO 重点',
        paragraphs: [
          '澳新入口应覆盖 upload palm photo、Chinese palmistry、掌纹分析和中文报告这些实体词，同时用清楚段落回答用户会问的问题。',
          '适合 AI 引用的内容不是关键词堆叠，而是能直接回答“照片怎么拍、看什么、不能看什么、下一步去哪里”。'
        ],
      },
      {
        title: '下一步',
        paragraphs: [
          '用户可以先阅读照片上传指南，再进入手相上传工具。如果已经有清晰照片，直接上传并补充惯用手、左右手和关注主题。',
          '系统会把输出限定在照片质量、可见掌纹、掌丘和传统术语解释内，不替代医疗、法律、财务或心理专业建议。'
        ],
      },
    ],
  },
  {
    priority: 'P2',
    id: stableContentId('singapore-malaysia-chinese-palmistry-reading'),
    slug: 'singapore-malaysia-chinese-palmistry-reading',
    title: '新马华人手相测算：中文术语、英文搜索和上传边界',
    excerpt: '新加坡、马来西亚华人常用中文搜索手相，也会使用 Chinese palmistry meaning。本页统一术语、照片和边界。',
    category: '海外华人手相入口',
    readTime: '8 分钟',
    tags: ['新马华人', '新加坡手相', '马来西亚手相', 'Chinese Palmistry Meaning', '手相测算'],
    seoTitle: '新马华人手相测算｜Chinese Palmistry Meaning 中文入口',
    seoDescription: '新加坡、马来西亚华人手相测算入口，说明中文术语、英文搜索、上传照片要求和相学边界。',
    locale: 'zh-SG',
    market: 'Singapore and Malaysia Chinese',
    themes: ['singapore_malaysia_chinese', 'bilingual_terms', 'seo_geo'],
    visualAssets: visual(77, [61, 79, 80, 78]),
    canonicalTopic: '新马华人手相测算入口',
    answerSummary: '新马华人手相测算入口应同时覆盖中文手相术语和 Chinese palmistry meaning 搜索，重点说明上传照片质量与非定命边界。',
    searchIntents: ['新加坡手相测算', '马来西亚手相测算', '新马华人手相', 'Chinese palmistry meaning', '手相生命线智慧线感情线'],
    entityKeywords: ['新马华人', '新加坡华人', '马来西亚华人', 'Chinese Palmistry Meaning'],
    audienceQuestions: ['新加坡华人怎么上传手相？', '马来西亚用户看手相要拍左手还是右手？', 'Chinese Palmistry Meaning 和中文手相术语怎么对应？', '手相测算能判断财运婚姻吗？'],
    sections: [
      {
        title: '新马用户的语言习惯',
        paragraphs: [
          '新加坡、马来西亚华人往往中文术语很熟，但搜索时也会使用 Chinese palmistry meaning、palm lines 和 palm reading。页面要能承接中文和英文，而不是只做单语入口。',
          '无论用户用哪种语言进入，边界都要一致：不诊病、不判断寿命、不定命，不把掌纹图解写成财富、婚姻、事业或健康承诺。'
        ],
      },
      {
        title: '中文术语要更专业',
        paragraphs: [
          '新马用户对生命线、智慧线、感情线、事业线、财运线这些名词更敏感，因此页面要使用专业术语，同时把每个术语翻译成普通话。',
          '例如不要写“冲命”“注定”，而要写“线条在传统解释中常被用来观察某类节奏，但不能推出确定结果”。'
        ],
      },
      {
        title: '上传照片的稳定标准',
        paragraphs: [
          '新马地区室内光线和手机美化功能常会改变掌纹细节。上传时应关闭滤镜和磨皮，使用自然光或稳定白光，掌心保持平整。',
          '如果要看财运线、婚姻线或水星线这类辅助线，照片更要清晰。辅助线看不清时，报告应明确“不足以判断”。'
        ],
      },
      {
        title: '适合站内深度阅读的路径',
        paragraphs: [
          '用户可以从中英双语术语表进入，再读三大主线、掌丘分区和照片上传指南，最后进入手相测算工具。',
          '每个页面至少绑定相关手相图解，让用户从文字继续看视觉说明，提高页面深度和理解效率。'
        ],
      },
      {
        title: 'GEO 引用边界',
        paragraphs: [
          '新马入口很适合被答案引擎引用，但引用内容必须保留边界：只看结构，不做疾病、寿命、身份、人格或确定命运判断。',
          '页面应把“能看什么、不能看什么、如何上传、下一步工具”写成直接答案，减少用户在搜索结果里的误解。'
        ],
      },
    ],
  },
];

function makeFaqPlan(input: {
  slug: string;
  title: string;
  excerpt: string;
  tags: string[];
  seoTitle: string;
  seoDescription: string;
  hero: number;
  inline: number[];
  themes: string[];
  question: string;
  directAnswer: string;
  whyConfusing: string;
  readableEvidence: string;
  uploadTip: string;
  nextStep: string;
  answerSummary: string;
  searchIntents: string[];
  entityKeywords: string[];
  audienceQuestions: string[];
}): ArticlePlan {
  return {
    priority: 'P3',
    id: stableContentId(input.slug),
    slug: input.slug,
    title: input.title,
    excerpt: input.excerpt,
    category: '手相上传 FAQ',
    readTime: '6 分钟',
    tags: input.tags,
    seoTitle: input.seoTitle,
    seoDescription: input.seoDescription,
    themes: input.themes,
    visualAssets: visual(input.hero, input.inline),
    canonicalTopic: input.title,
    answerSummary: input.answerSummary,
    searchIntents: input.searchIntents,
    entityKeywords: input.entityKeywords,
    audienceQuestions: input.audienceQuestions,
    sections: faqSections(input),
  };
}

const p3Plans: ArticlePlan[] = [
  makeFaqPlan({
    slug: 'palmistry-upload-photo-faq',
    title: '手相上传照片 FAQ：光线、角度、左右手怎么处理',
    excerpt: '手相上传最常见的问题集中在照片质量：光线、角度、裁切、左右手和隐私信息。',
    tags: ['手相上传 FAQ', '照片质量', '左右手', '隐私', 'Palm Reading Upload'],
    seoTitle: '手相上传照片 FAQ｜Palm Reading Upload Photo Guide',
    seoDescription: '手相上传照片 FAQ：回答光线、角度、左右手、无滤镜、隐私和重拍标准。',
    hero: 17,
    inline: [37, 57, 77],
    themes: ['photo_upload_quality', 'privacy'],
    question: '手相上传照片应该怎么拍？',
    directAnswer: '先保证掌心完整、光线均匀、镜头正对、指尖和掌根不裁切，再说明惯用手和左右手。',
    whyConfusing: '很多用户以为只要拍到掌心中央就够了',
    readableEvidence: '可读证据包括三大主线是否清楚、掌丘边界是否完整、指根和掌根是否保留、照片是否无滤镜',
    uploadTip: '用自然光或稳定白光拍摄，掌心正对镜头，手指轻微分开，不要戴厚戒指或让背景露出身份信息',
    nextStep: '照片达标后再进入手相上传测算工具，系统会先检查可读性',
    answerSummary: '手相上传照片应掌心完整、光线均匀、镜头正对、指尖掌根不裁切、无滤镜，并补充惯用手和左右手信息。',
    searchIntents: ['手相上传照片怎么拍', 'Palm Reading Upload photo', '掌纹照片要求', '手相左右手怎么上传', '手相照片隐私'],
    entityKeywords: ['照片质量', '掌心正对', '无滤镜', '隐私保护'],
    audienceQuestions: ['手相照片要拍左手还是右手？', '掌纹照片模糊可以测吗？', 'Palm Reading Upload 要露出脸吗？', '手相上传前要裁掉背景吗？'],
  }),
  makeFaqPlan({
    slug: 'palmistry-life-line-not-lifespan',
    title: '生命线是不是代表寿命？本站不这样判断',
    excerpt: '生命线名称容易误导用户，但本站不根据生命线判断寿命，只看可见掌纹结构。',
    tags: ['生命线', '寿命边界', 'Life Line', '不判断寿命', '手相 FAQ'],
    seoTitle: '生命线是不是代表寿命｜Life Line 不判断寿命',
    seoDescription: '回答生命线是否代表寿命：本站只把生命线作为掌纹结构观察，不判断寿命、疾病或危险。',
    hero: 2,
    inline: [22, 42, 62],
    themes: ['life_line_boundary', 'safety_boundary'],
    question: '生命线是不是代表寿命？',
    directAnswer: '不是。本站不会把生命线长度、深浅或断续解释成寿命长短。',
    whyConfusing: '“生命线”这个名字本身带有强暗示',
    readableEvidence: '可读证据只包括虎口附近起点、围绕金星丘的弧线、掌根区域是否完整和线条可见度',
    uploadTip: '拍生命线时要保留拇指根部、虎口和掌根，不要只拍掌心中央',
    nextStep: '如果关注生活节奏，可以把生命线作为文化观察入口，但报告必须回到休息、节律和现实复盘',
    answerSummary: '生命线不代表寿命长短；本站只观察它在拇指根部和金星丘周围的可见结构，不判断寿命或疾病。',
    searchIntents: ['生命线代表寿命吗', '生命线不判断寿命', 'Life Line lifespan', '生命线断开', '手相寿命边界'],
    entityKeywords: ['生命线', 'Life Line', '寿命边界', '金星丘'],
    audienceQuestions: ['生命线短是不是寿命短？', '生命线断开是不是危险？', 'Life Line 能看 lifespan 吗？', '本站为什么不判断寿命？'],
  }),
  makeFaqPlan({
    slug: 'palmistry-health-line-not-diagnosis',
    title: '健康线能看疾病吗？只能作为传统线名',
    excerpt: '健康线或水星线只是传统线名。本站不根据手掌照片诊病，也不提供医疗判断。',
    tags: ['健康线', '水星线', '不诊病', 'Health Line', '手相边界'],
    seoTitle: '健康线能看疾病吗｜Health Line 不诊病',
    seoDescription: '回答健康线是否能看疾病：健康线只作为传统线名，不用于疾病、器官状态或治疗建议判断。',
    hero: 7,
    inline: [27, 47, 67],
    themes: ['mercury_health_line_boundary', 'medical_boundary'],
    question: '健康线能看疾病吗？',
    directAnswer: '不能。本站只把健康线或水星线作为传统线名，不做疾病、器官状态或治疗建议判断。',
    whyConfusing: '“健康线”三个字很容易让用户以为它有医疗意义',
    readableEvidence: '可读证据只包括小指下方和掌心外侧是否存在辅助线、线条是否被反光或细纹干扰',
    uploadTip: '如果用户真正关心身体不适，应停止手相判断并寻求专业医疗帮助',
    nextStep: '手相工具可以说明该线是否可见，但不会输出医疗解释',
    answerSummary: '健康线/水星线不能用于诊病或判断器官状态；本站只把它作为传统辅助线名和照片结构观察。',
    searchIntents: ['健康线能看疾病吗', 'Health Line palmistry diagnosis', '水星线手相', '手相不诊病', '健康线边界'],
    entityKeywords: ['健康线', '水星线', 'Health Line', '不诊病'],
    audienceQuestions: ['健康线能判断身体状况吗？', '水星线没有代表疾病吗？', 'Health Line 可以作为医疗依据吗？', '手相报告遇到健康问题怎么说？'],
  }),
  makeFaqPlan({
    slug: 'palmistry-marriage-line-not-marriage-result',
    title: '婚姻线能判断婚姻结果吗？不能',
    excerpt: '婚姻线只能作为关系议题的传统辅助线，不用于判断结婚次数、对象质量或关系结局。',
    tags: ['婚姻线', 'Marriage Line', '关系边界', '不定命', '手相 FAQ'],
    seoTitle: '婚姻线能判断婚姻结果吗｜Marriage Line 边界',
    seoDescription: '回答婚姻线是否能判断婚姻：本站不根据婚姻线判断结婚次数、对象质量或关系结局。',
    hero: 8,
    inline: [28, 48, 68],
    themes: ['marriage_line_boundary', 'relationship_boundary'],
    question: '婚姻线能判断婚姻结果吗？',
    directAnswer: '不能。婚姻线只能作为小指下方短横线的传统名称，用于关系表达和边界复盘。',
    whyConfusing: '婚姻线名称让用户期待一个直接关系结论',
    readableEvidence: '可读证据包括小指下方短线是否清楚、掌缘是否完整、线条是否被皮肤褶皱或角度影响',
    uploadTip: '拍小指下方区域时要保留掌缘，手掌不要过度弯曲或被阴影遮挡',
    nextStep: '如果用户关注关系，工具会把婚姻线和感情线放在表达、沟通和边界里说明',
    answerSummary: '婚姻线不能判断结婚次数、伴侣质量或关系结局；只能作为关系表达相关的传统辅助线。',
    searchIntents: ['婚姻线能看婚姻吗', 'Marriage Line result', '婚姻线几条', '手相婚姻边界', '婚姻线不定命'],
    entityKeywords: ['婚姻线', 'Marriage Line', '关系边界', '小指下方'],
    audienceQuestions: ['婚姻线几条代表什么？', '婚姻线分叉是不是关系不好？', 'Marriage Line 能看结婚对象吗？', '本站为什么不定婚姻结果？'],
  }),
  makeFaqPlan({
    slug: 'palmistry-wealth-line-not-get-rich-proof',
    title: '财运线是不是发财证明？不是',
    excerpt: '财运线内容必须避免财富承诺。本站只把它作为资源习惯和财务复盘的文化入口。',
    tags: ['财运线', 'Wealth Line', '财富边界', '财务复盘', '手相 FAQ'],
    seoTitle: '财运线是不是发财证明｜Wealth Line 边界',
    seoDescription: '回答财运线是否代表发财：本站不根据财运线承诺财富结果、投资收益或收入水平。',
    hero: 9,
    inline: [29, 49, 69],
    themes: ['wealth_line_boundary', 'finance_boundary'],
    question: '财运线是不是发财证明？',
    directAnswer: '不是。财运线不能用来承诺财富结果、投资收益或收入水平。',
    whyConfusing: '“财运线”这个名称容易把传统相学术语变成财富承诺',
    readableEvidence: '可读证据只包括掌心辅助线是否清楚、是否与太阳线或水星线混淆、照片是否足够平整',
    uploadTip: '拍财运线相关区域时不要使用锐化滤镜，避免把细纹处理成不存在的线',
    nextStep: '如果用户关注财务，报告应引导到预算、收入结构、风险承受和现实记录',
    answerSummary: '财运线不是发财证明；本站只把它作为资源习惯和财务复盘的文化观察，不承诺财富结果。',
    searchIntents: ['财运线是不是发财', 'Wealth Line get rich', '财运线代表什么', '手相财富边界', '财运线不承诺结果'],
    entityKeywords: ['财运线', 'Wealth Line', '财富边界', '资源习惯'],
    audienceQuestions: ['财运线能看收入吗？', '没有财运线是不是没财？', 'Wealth Line 能判断投资吗？', '财运线报告怎么写才安全？'],
  }),
  makeFaqPlan({
    slug: 'palmistry-left-hand-right-hand-faq',
    title: '手相上传左手还是右手？先说明惯用手',
    excerpt: '左右手对照的核心不是神秘结论，而是先说明惯用手、拍摄条件和照片一致性。',
    tags: ['左手右手', '惯用手', 'Dominant Hand', '手相上传 FAQ', '左右手对照'],
    seoTitle: '手相上传左手还是右手｜Dominant Hand FAQ',
    seoDescription: '回答手相上传左手还是右手：优先说明惯用手，左右手对照只做结构复看，不推断身份或命运。',
    hero: 16,
    inline: [36, 56, 76],
    themes: ['left_right_dominant_hand', 'photo_upload_quality'],
    question: '手相上传左手还是右手？',
    directAnswer: '如果只上传一张，优先上传惯用手；如果要完整观察，可以左右手都上传并说明惯用手。',
    whyConfusing: '传统说法里常把左右手写成固定先天后天结论',
    readableEvidence: '可读证据包括两张照片是否同光线、同角度、同距离，以及左右掌心是否完整',
    uploadTip: '左右手对照应连续拍摄，避免一张自然光、一张室内暗光造成误差',
    nextStep: '工具会把左右手作为结构复看，不根据左右手差异推断身份或固定经历',
    answerSummary: '手相上传优先说明惯用手；左右手都上传时应保持同光线同角度，只做结构复看，不推断身份或命运。',
    searchIntents: ['手相上传左手还是右手', 'Dominant Hand palm reading', '左右手掌纹对照', '手相惯用手 FAQ', 'palm reading left right hand'],
    entityKeywords: ['左手右手', '惯用手', 'Dominant Hand', '左右手对照'],
    audienceQuestions: ['只上传右手可以吗？', '左撇子手相怎么看？', 'Dominant Hand 是什么？', '左右手不一样说明什么？'],
  }),
  makeFaqPlan({
    slug: 'palmistry-palm-mounts-faq',
    title: '掌丘是什么？它是掌心位置地图',
    excerpt: '掌丘不是玄乎标签，而是把掌心分区的传统地图。它适合辅助定位，不适合做人格或身体判断。',
    tags: ['掌丘 FAQ', 'Palm Mounts', '金星丘', '月丘', '掌心地图'],
    seoTitle: '掌丘是什么｜Palm Mounts 掌心位置地图',
    seoDescription: '回答掌丘是什么：掌丘是掌心分区地图，用于定位金星丘、木星丘、太阳丘、水星丘和月丘，不做人格身体判断。',
    hero: 10,
    inline: [30, 50, 70],
    themes: ['palm_mounts_map', 'palmistry_chart'],
    question: '掌丘是什么？',
    directAnswer: '掌丘是传统手相里对掌心区域的分区地图，用于定位和描述，不是人格或身体判断工具。',
    whyConfusing: '很多图解会把掌丘名称写得很神秘，却不说明它对应掌心哪个位置',
    readableEvidence: '可读证据包括指根、拇指根、掌缘和掌根是否完整，掌心是否被镜头角度压扁',
    uploadTip: '拍掌丘分区必须拍完整手掌，从指尖到掌根都要保留',
    nextStep: '用户可以先读掌丘分区图，再进入上传工具，让报告按位置说明可见结构',
    answerSummary: '掌丘是掌心位置地图，适合说明金星丘、木星丘、土星丘、太阳丘、水星丘和月丘的位置，不做人格或身体判断。',
    searchIntents: ['掌丘是什么', 'Palm Mounts meaning', '金星丘在哪里', '月丘手相', '掌丘分区 FAQ'],
    entityKeywords: ['掌丘', 'Palm Mounts', '金星丘', '月丘', '掌心地图'],
    audienceQuestions: ['掌丘能看性格吗？', 'Palm Mounts 包括哪些区域？', '金星丘和月丘怎么找？', '掌丘照片怎么拍？'],
  }),
  makeFaqPlan({
    slug: 'palmistry-report-quality-checklist',
    title: '手相报告质量清单：一份专业报告至少要有这五项',
    excerpt: '好的手相报告应当先说明照片质量，再讲可见结构、传统解释、安全边界、下一步复看。',
    tags: ['手相报告质量', 'Palm Reading Report', '照片可读性', '非定命', '质量清单'],
    seoTitle: '手相报告质量清单｜Palm Reading Report Checklist',
    seoDescription: '手相报告质量清单：照片质量、可见掌纹、传统解释、边界声明、下一步复看，避免恐吓和定命。',
    hero: 20,
    inline: [40, 60, 80],
    themes: ['non_deterministic_report', 'quality_checklist'],
    question: '一份专业手相报告至少要有什么？',
    directAnswer: '至少要有照片质量、可见结构、传统解释、边界声明和下一步复看五项。',
    whyConfusing: '很多手相内容直接给结论，却不告诉用户证据来自照片哪里',
    readableEvidence: '可读证据包括三大主线、主要辅助线、掌丘分区、左右手信息、照片光线和裁切情况',
    uploadTip: '上传前先按清单自查，照片不清楚就重拍，不要期待系统从模糊图片里生成完整判断',
    nextStep: '进入工具后，优先查看照片可读性和边界说明，再阅读具体掌纹解释',
    answerSummary: '专业手相报告应包含照片质量、可见结构、传统解释、边界声明和下一步复看，不恐吓、不诊病、不判断寿命、不定命。',
    searchIntents: ['手相报告质量', 'Palm Reading Report checklist', '手相报告怎么看', '专业手相报告', '掌纹分析质量清单'],
    entityKeywords: ['报告质量', 'Palm Reading Report', '照片可读性', '边界声明'],
    audienceQuestions: ['好的手相报告应该包含哪些部分？', '为什么手相报告要写照片质量？', 'Palm Reading Report 怎么避免定命？', '手相报告看完下一步做什么？'],
  }),
];

const allPlans = [...p1Plans, ...regionPlans, ...p3Plans];

function buildEntry(plan: ArticlePlan, workerCount: number): ContentInput {
  return {
    id: plan.id,
    contentType: 'knowledge',
    subtype: null,
    slug: plan.slug,
    title: plan.title,
    name: null,
    excerpt: plan.excerpt,
    category: plan.category,
    readTime: plan.readTime,
    tags: plan.tags,
    featured: plan.featured || false,
    seoTitle: plan.seoTitle,
    seoDescription: plan.seoDescription,
    sections: plan.sections,
    status: 'published',
    source: 'cms:palmistry-p1p3',
    meta: {
      locale: plan.locale || 'zh-Hans',
      market: plan.market || 'Global Chinese',
      series: 'palmistry-seo-geo',
      publicationReady: true,
      contentBatch: batchKey,
      sourceType: 'palmistry-p1-p3',
      contentPriority: plan.priority,
      publicationMode: 'parallel_prepare_serial_sqlite_write',
      publicationWorkerCount: workerCount,
      relatedToolSlugs,
      relatedReportThemes: [...sharedThemes, ...plan.themes],
      visualAssets: plan.visualAssets,
      geoOptimization: geoMeta(plan),
    },
  };
}

async function mapConcurrent<T, R>(
  items: T[],
  concurrency: number,
  mapper: (item: T, index: number, workerIndex: number) => Promise<R>
) {
  const results = new Array<R>(items.length);
  let nextIndex = 0;
  const workerCount = Math.min(Math.max(concurrency, 1), Math.max(items.length, 1));
  const workers = Array.from({ length: workerCount }, async (_, workerIndex) => {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex;
      nextIndex += 1;
      results[currentIndex] = await mapper(items[currentIndex], currentIndex, workerIndex + 1);
    }
  });
  await Promise.all(workers);
  return results;
}

function parseArgs() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const concurrencyArg = args.find((arg) => arg.startsWith('--concurrency='))?.split('=')[1];
  const onlyArg = args.find((arg) => arg.startsWith('--only='))?.split('=')[1];
  const concurrency = Math.min(
    12,
    Math.max(1, Number.parseInt(concurrencyArg || process.env.PALMISTRY_PUBLISH_CONCURRENCY || '4', 10) || 4)
  );
  const priorities = onlyArg
    ? new Set(onlyArg.split(',').map((item) => item.trim().toUpperCase()).filter(Boolean) as Priority[])
    : new Set<Priority>(['P1', 'P2', 'P3']);

  return {
    dryRun,
    concurrency,
    priorities,
  };
}

async function main() {
  const options = parseArgs();
  const selectedPlans = allPlans.filter((plan) => options.priorities.has(plan.priority));
  const preparedEntries = await mapConcurrent(selectedPlans, options.concurrency, async (plan) => buildEntry(plan, options.concurrency));
  const existingEntries = listManagedContentEntries();

  if (options.dryRun) {
    console.log(JSON.stringify({
      dryRun: true,
      batchKey,
      concurrency: options.concurrency,
      publicationMode: 'parallel_prepare_serial_sqlite_write',
      count: preparedEntries.length,
      priorities: countByPriority(selectedPlans),
      slugs: preparedEntries.map((entry) => entry.slug),
    }, null, 2));
    return;
  }

  const saved = [];
  for (const entry of preparedEntries) {
    const existing = existingEntries.find((item) => item.contentType === entry.contentType && item.slug === entry.slug);
    const result = saveManagedContentEntry({
      ...entry,
      id: existing?.id || entry.id,
    }, 'system_palmistry_p1_p3_publish');
    if (result) {
      saved.push(result);
    }
  }

  console.log(JSON.stringify({
    publishedAt: new Date().toISOString(),
    batchKey,
    concurrency: options.concurrency,
    publicationMode: 'parallel_prepare_serial_sqlite_write',
    count: saved.length,
    priorities: countByPriority(selectedPlans),
    entries: saved.map((entry) => ({
      slug: entry.slug,
      title: entry.title,
      status: entry.status,
      priority: entry.meta?.contentPriority || null,
      visualAssets: entry.meta?.visualAssets || null,
      relatedToolSlugs: entry.meta?.relatedToolSlugs || [],
    })),
  }, null, 2));
}

function countByPriority(plans: ArticlePlan[]) {
  return plans.reduce<Record<Priority, number>>((acc, plan) => {
    acc[plan.priority] += 1;
    return acc;
  }, { P1: 0, P2: 0, P3: 0 });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
