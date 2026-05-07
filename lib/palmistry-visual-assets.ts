import type { VisualAssetManifest } from '@/lib/visual-assets';

export const PALMISTRY_VISUAL_BATCH_ID = 'palmistry-seo-geo-80-v1';
export const PALMISTRY_LIBRARY_KEY = 'palmistry_cultural_diagrams';
export const PALMISTRY_BRAND_PACK_ID = 'world-yi-palmistry-boundary-v1';

type PalmistryTopic = {
  key: string;
  zh: string;
  en: string;
  theme: string;
  labels: string[];
  mustShow: string[];
  userQuestion: string;
};

type PalmistryAudience = {
  key: string;
  zh: string;
  en: string;
  geo: string;
  searchTerms: string[];
};

type PalmistryAssetSpec = {
  index: number;
  id: string;
  slug: string;
  ratio: '16:9' | '4:5';
  size: '2048x1152' | '1536x1920';
  topic: PalmistryTopic;
  audience: PalmistryAudience;
};

const palmistryTopics: PalmistryTopic[] = [
  {
    key: 'three-major-lines',
    zh: '三大主线总览',
    en: 'Three major palm lines',
    theme: 'palm lines chart',
    labels: ['生命线', '智慧线', '感情线', '可见依据'],
    mustShow: ['abstract palm diagram with three major lines highlighted', 'small legend translating each line into life rhythm, thinking style, relationship expression', 'boundary note: cultural observation only'],
    userQuestion: 'What are the three major palm lines and how should users read them without deterministic claims?',
  },
  {
    key: 'life-line-boundary',
    zh: '生命线观察边界',
    en: 'Life line cultural boundary',
    theme: 'life line meaning',
    labels: ['生命线', '体力节奏', '不看寿命', '复看'],
    mustShow: ['life line highlighted on an abstract palm', 'clear crossed-out deterministic lifespan symbol', 'observation checklist for continuity and curve'],
    userQuestion: 'How can the life line be explained as energy rhythm instead of lifespan prediction?',
  },
  {
    key: 'head-line-thinking',
    zh: '智慧线与思考节奏',
    en: 'Head line and thinking rhythm',
    theme: 'head line palmistry',
    labels: ['智慧线', '判断节奏', '分叉', '断续'],
    mustShow: ['head line highlighted with branches and breaks as diagram examples', 'cards for focus, review, decision rhythm', 'no personality diagnosis label'],
    userQuestion: 'How can the head line be observed as decision rhythm without personality typing?',
  },
  {
    key: 'heart-line-expression',
    zh: '感情线与表达方式',
    en: 'Heart line expression',
    theme: 'heart line meaning',
    labels: ['感情线', '表达边界', '尾端分叉', '关系节奏'],
    mustShow: ['heart line highlighted near upper palm', 'relationship communication arrows', 'boundary note against marriage certainty'],
    userQuestion: 'How can the heart line be mapped to communication and boundary reflection?',
  },
  {
    key: 'fate-line-career',
    zh: '事业线 / 命运线',
    en: 'Fate line / career line',
    theme: 'fate line career line',
    labels: ['事业线', '命运线', '阶段感', '不定职业'],
    mustShow: ['vertical fate line examples', 'career stage cards', 'avoid fixed career outcome'],
    userQuestion: 'How can fate line observations be translated into stage reflection instead of career certainty?',
  },
  {
    key: 'sun-line-visibility',
    zh: '太阳线与被看见',
    en: 'Sun line visibility',
    theme: 'sun line palmistry',
    labels: ['太阳线', '表达', '作品感', '曝光'],
    mustShow: ['sun line under ring finger highlighted', 'visibility and output metaphor', 'small note: not fame guarantee'],
    userQuestion: 'How can the sun line be explained as output and visibility reflection?',
  },
  {
    key: 'mercury-health-line-boundary',
    zh: '水星线 / 健康线边界',
    en: 'Mercury line / health line boundary',
    theme: 'health line palmistry boundary',
    labels: ['水星线', '健康线', '传统线名', '不诊病'],
    mustShow: ['mercury line as optional traditional line', 'medical cross-out boundary icon', 'photo quality and follow-up checklist'],
    userQuestion: 'How can the health line name be used safely without medical interpretation?',
  },
  {
    key: 'marriage-line-boundary',
    zh: '婚姻线观察边界',
    en: 'Marriage line boundary',
    theme: 'marriage line palmistry',
    labels: ['婚姻线', '关系表达', '不定婚姻', '边界'],
    mustShow: ['small side lines under little finger as abstract diagram', 'relationship communication cards', 'no marriage certainty claim'],
    userQuestion: 'How can marriage line content be kept reflective and non-deterministic?',
  },
  {
    key: 'wealth-line-boundary',
    zh: '财运线观察边界',
    en: 'Wealth line boundary',
    theme: 'wealth line palmistry boundary',
    labels: ['财运线', '资源习惯', '不定财运', '复盘'],
    mustShow: ['abstract money/resource line diagram without coins as promise', 'resource allocation reflection cards', 'anti get-rich guarantee note'],
    userQuestion: 'How can wealth line content avoid promising money outcomes?',
  },
  {
    key: 'palm-mounts-map',
    zh: '掌丘分区图',
    en: 'Palm mounts map',
    theme: 'palm mounts chart',
    labels: ['金星丘', '木星丘', '土星丘', '太阳丘', '水星丘', '月丘'],
    mustShow: ['abstract palm with colored mount zones', 'compact bilingual mount labels', 'no body-reading determinism'],
    userQuestion: 'How should palm mounts be introduced as cultural zones for self-reflection?',
  },
  {
    key: 'venus-mount-rhythm',
    zh: '金星丘与生活热度',
    en: 'Venus mount rhythm',
    theme: 'venus mount palmistry',
    labels: ['金星丘', '生活热度', '亲密边界', '节奏'],
    mustShow: ['thumb base mount highlighted', 'warm but restrained energy rhythm cards', 'boundary against desire/personality labeling'],
    userQuestion: 'How can Venus mount be translated into daily rhythm and relationship boundary reflection?',
  },
  {
    key: 'jupiter-mount-ambition',
    zh: '木星丘与主动性',
    en: 'Jupiter mount initiative',
    theme: 'jupiter mount palmistry',
    labels: ['木星丘', '主动性', '目标感', '不贴标签'],
    mustShow: ['mount below index finger highlighted', 'goal and initiative diagram', 'no fixed leadership personality claim'],
    userQuestion: 'How can Jupiter mount be discussed without labeling a person as destined leader?',
  },
  {
    key: 'moon-mount-imagination',
    zh: '月丘与环境感受',
    en: 'Moon mount environmental sensitivity',
    theme: 'moon mount palmistry',
    labels: ['月丘', '环境感', '想象', '恢复'],
    mustShow: ['outer lower palm zone highlighted', 'environment and rest reflection cards', 'no mental diagnosis'],
    userQuestion: 'How can Moon mount be mapped to environment and recovery reflection?',
  },
  {
    key: 'mars-plain-boundary',
    zh: '火星平原与承压',
    en: 'Mars plain pressure boundary',
    theme: 'mars plain palmistry',
    labels: ['火星平原', '承压', '边界', '不恐吓'],
    mustShow: ['central palm area highlighted', 'pressure and boundary diagram', 'no fear-based conflict claim'],
    userQuestion: 'How can Mars plain observations support pressure management reflection?',
  },
  {
    key: 'hand-shape-five-elements',
    zh: '手型五行文化图',
    en: 'Five-element hand shape chart',
    theme: 'Chinese palmistry hand shape',
    labels: ['金形手', '木形手', '水形手', '火形手', '土形手'],
    mustShow: ['five abstract hand silhouettes with distinct proportions', 'Chinese five-element labels', 'note: cultural typology not identity proof'],
    userQuestion: 'How can five-element hand shape be introduced as cultural typology with boundaries?',
  },
  {
    key: 'left-right-dominant-hand',
    zh: '左右手与惯用手',
    en: 'Left right dominant hand',
    theme: 'left hand right hand palm reading',
    labels: ['左手', '右手', '惯用手', '复看'],
    mustShow: ['two abstract palms side by side', 'dominant hand input field metaphor', 'do not infer identity'],
    userQuestion: 'How should left/right and dominant hand context be requested before observation?',
  },
  {
    key: 'photo-upload-guide',
    zh: '手相上传拍摄指南',
    en: 'Palm photo upload guide',
    theme: 'upload palm photo for reading',
    labels: ['自然光', '掌心正对', '指尖完整', '无滤镜'],
    mustShow: ['phone camera framing an abstract palm', 'four short shooting rules', 'privacy and boundary badge'],
    userQuestion: 'What photo requirements help palm upload analysis stay useful and bounded?',
  },
  {
    key: 'privacy-boundary',
    zh: '手相隐私与边界',
    en: 'Palm privacy and boundary',
    theme: 'palm reading privacy',
    labels: ['隐私', '不识别身份', '不诊病', '不定命'],
    mustShow: ['abstract palm behind privacy shield', 'four boundary badges', 'calm product safety style'],
    userQuestion: 'How should palm photo privacy and safety boundaries be shown to users?',
  },
  {
    key: 'diaspora-bilingual-search',
    zh: '海外华人双语手相入口',
    en: 'Chinese palmistry bilingual search',
    theme: 'Chinese palmistry chart bilingual',
    labels: ['手相', 'Palm Lines', 'Chinese Palmistry', '文化观察'],
    mustShow: ['bilingual Chinese-English search cards', 'abstract palm chart', 'overseas Chinese context without flags dominating'],
    userQuestion: 'How can Chinese palmistry terms be made searchable for overseas Chinese users?',
  },
  {
    key: 'non-deterministic-report',
    zh: '非定命手相报告',
    en: 'Non deterministic palm report',
    theme: 'palm reading report boundaries',
    labels: ['看结构', '讲边界', '给建议', '可复看'],
    mustShow: ['report layout with abstract palm and checklist', 'no fortune-teller imagery', 'clear action-oriented cards'],
    userQuestion: 'What should a safe palmistry report page communicate at a glance?',
  },
];

const palmistryAudiences: PalmistryAudience[] = [
  {
    key: 'north-america-chinese',
    zh: '北美华人',
    en: 'North America Chinese diaspora',
    geo: 'United States / Canada',
    searchTerms: ['手相测算', 'palm reading upload', 'Chinese palmistry chart'],
  },
  {
    key: 'uk-europe-chinese',
    zh: '英国欧洲华人',
    en: 'UK and Europe Chinese users',
    geo: 'UK / Europe',
    searchTerms: ['手相图解', 'palm lines meaning', 'Chinese palm reading online'],
  },
  {
    key: 'australia-new-zealand-chinese',
    zh: '澳新华人',
    en: 'Australia and New Zealand Chinese users',
    geo: 'Australia / New Zealand',
    searchTerms: ['掌纹分析', 'upload hand photo palmistry', 'life line head line heart line'],
  },
  {
    key: 'singapore-malaysia-chinese',
    zh: '新马华人',
    en: 'Singapore and Malaysia Chinese users',
    geo: 'Singapore / Malaysia',
    searchTerms: ['华人手相', 'Chinese palmistry meaning', '手相生命线智慧线感情线'],
  },
];

function padIndex(value: number) {
  return String(value).padStart(3, '0');
}

function buildSlug(spec: PalmistryAssetSpec) {
  return `palmistry-${padIndex(spec.index)}-${spec.topic.key}-${spec.audience.key}`;
}

function buildSpecs(): PalmistryAssetSpec[] {
  return Array.from({ length: 80 }, (_, index) => {
    const topic = palmistryTopics[index % palmistryTopics.length];
    const audience = palmistryAudiences[Math.floor(index / palmistryTopics.length) % palmistryAudiences.length];
    const ratio = index % 5 === 4 ? '4:5' : '16:9';
    return {
      index: index + 1,
      id: `PALM-SEOGEO-${padIndex(index + 1)}`,
      slug: '',
      ratio,
      size: ratio === '4:5' ? '1536x1920' : '2048x1152',
      topic,
      audience,
    };
  }).map((spec) => ({
    ...spec,
    slug: buildSlug(spec),
  }));
}

function buildPalmistryPrompt(spec: PalmistryAssetSpec) {
  return [
    'Create a premium educational infographic for Life Kline / World Yi.',
    '',
    'Subject:',
    `${spec.topic.zh} / ${spec.topic.en}. Audience: ${spec.audience.zh} (${spec.audience.en}, ${spec.audience.geo}).`,
    '',
    'Core visual:',
    'Use an abstract non-identifiable palm diagram only. Do not use a real hand photo, real skin texture, fingerprints, jewelry, face, body, or any identifiable person.',
    '',
    'Must show:',
    ...spec.topic.mustShow.map((item) => `- ${item}`),
    `- SEO/GEO micro context: ${spec.audience.searchTerms.join(' / ')}`,
    '',
    'Required in-image text:',
    `- Main headline, large and readable: ${spec.topic.zh}`,
    `- English support line, readable: ${spec.topic.en}`,
    `- Short labels only: ${spec.topic.labels.join(' / ')}`,
    '- Boundary badges: 文化观察 / 不诊病 / 不定命',
    '- Compact brand signature: 世界易 / 人生K线 · www.life-kline.com',
    '',
    'Text density:',
    '- No paragraphs inside the image.',
    '- Use only headline, English support line, short labels, boundary badges, and brand signature.',
    '- Chinese and English text must be readable and not garbled.',
    '- No tiny fake text, no dense tables, no duplicated subtitles.',
    '',
    'Visual style:',
    'High-trust editorial product design, warm off-white paper, ink black linework, jade teal reasoning layer, muted gold section markers, restrained cinnabar focus dots, fine architectural diagram grid, sophisticated Chinese-English educational layout.',
    '',
    'Safety boundary:',
    'No deterministic fate claims. No lifespan prediction. No disease diagnosis. No personality diagnosis. No wealth, marriage, career, or health certainty. No fortune teller, crystal ball, horror mysticism, talisman, red-black fear poster, or cheap metaphysical ad style.',
    '',
    'Composition:',
    `${spec.ratio} infographic, clear hierarchy, abstract palm diagram as the main object, 3 to 5 callout markers, enough white space, professional SEO/GEO-ready educational cover.`,
    '',
    'Output:',
    `Size ${spec.size}, no transparent background.`,
  ].join('\n');
}

export function buildPalmistryVisualManifest(): VisualAssetManifest {
  const specs = buildSpecs();

  return {
    batch: {
      id: PALMISTRY_VISUAL_BATCH_ID,
      name: 'Palmistry SEO/GEO Cultural Diagram Library 80 v1',
      libraryKey: PALMISTRY_LIBRARY_KEY,
      module: 'MINGLI',
      targetCount: specs.length,
      model: 'gpt-image-2',
      brandPackId: PALMISTRY_BRAND_PACK_ID,
      meta: {
        safety: 'abstract_palmistry_cultural_diagrams_only',
        audience: 'overseas_chinese_seo_geo',
        targetRoutes: ['/tools/application-palmistry-reading', '/chat', '/visual-assets', '/knowledge/topics'],
      },
    },
    assets: specs.map((spec) => ({
      id: spec.id,
      assetType: 'seo_geo_infographic',
      module: 'MINGLI',
      slug: spec.slug,
      title: `${spec.topic.zh}｜${spec.audience.zh}`,
      description: `${spec.topic.zh}的抽象手相文化教育图，面向${spec.audience.zh}搜索与站内深度阅读，不做疾病、寿命或命运定论。`,
      prompt: buildPalmistryPrompt(spec),
      negativePrompt: [
        'real hand photo',
        'identifiable person',
        'face',
        'fingerprints',
        'skin pores',
        'medical diagnosis',
        'lifespan prediction',
        'deterministic destiny claims',
        'personality diagnosis',
        'fortune teller',
        'crystal ball',
        'horror mysticism',
        'cheap talisman',
        'red black fear poster',
        'garbled Chinese text',
        'tiny unreadable text',
      ].join(', '),
      model: 'gpt-image-2',
      size: spec.size,
      ratio: spec.ratio,
      quality: 'medium',
      sourceImageIds: [],
      brandReferenceIds: [PALMISTRY_BRAND_PACK_ID],
      altText: `${spec.topic.zh}手相图解，面向${spec.audience.zh}的掌纹文化观察边界说明`,
      overlayCopySimplified: spec.topic.zh,
      overlayCopyTraditional: spec.topic.zh,
      overlayCopyEnglish: spec.topic.en,
      narrativeTitle: `${spec.topic.zh}：只看结构，不做定命`,
      narrativeExcerpt: `${spec.topic.zh}用于解释${spec.topic.theme}相关的手相文化观察方法，适合${spec.audience.zh}用户理解掌纹术语、上传边界和现实复盘方式。`,
      narrativeSections: [
        {
          heading: '图中要看什么',
          body: `这张图围绕${spec.topic.zh}展开，只使用抽象手掌图和短标签说明可见结构，帮助用户理解${spec.topic.labels.slice(0, 3).join('、')}等概念。`,
        },
        {
          heading: '为什么适合海外华人搜索',
          body: `面向${spec.audience.geo}的中文用户，图中保留 Chinese Palmistry、Palm Lines 等中英关键词，方便从搜索、问答和站内工具页继续进入手相上传观察。`,
        },
        {
          heading: '使用边界',
          body: '手相内容只作为相学文化观察和自我复盘工具，不判断疾病、寿命、身份、人格、财富、婚姻、事业或命运定论。',
        },
      ],
      targetRoutes: ['/tools/application-palmistry-reading', '/chat', '/visual-assets', '/knowledge/topics'],
      relatedContentSlugs: [],
      relatedToolSlugs: ['application-palmistry-reading', 'application-home-order', 'health-recovery-window'],
      relatedReportThemes: ['palmistry', 'physiognomy_boundary', 'seo_geo', 'overseas_chinese', 'cultural_observation'],
      status: 'prompt_ready',
      qaStatus: 'pending',
      qaScore: 0,
      correctionCount: 0,
      version: 1,
      meta: {
        topicKey: spec.topic.key,
        audienceKey: spec.audience.key,
        geo: spec.audience.geo,
        searchTerms: spec.audience.searchTerms,
        mustAvoid: ['real-person palm reading', 'medical inference', 'deterministic fate claim'],
      },
      createdBy: 'system_palmistry_visual_assets',
    })),
  };
}
