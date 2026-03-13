import { callJsonLLM } from '@/lib/agentic-report/llm-client';
import { getEntityTypeLabel, type EntityInsightType } from '@/lib/content';
import type { ContentSection } from '@/lib/content';
import type { ContentStatus, ManagedContentType } from '@/lib/content-store';

export type ContentGenerationMode = 'single' | 'cluster';

export interface ContentGenerationInput {
  mode?: ContentGenerationMode;
  contentType?: ManagedContentType;
  subtype?: EntityInsightType;
  topic: string;
  angle?: string;
  platform?: string;
  keywords?: string[];
  audience?: string;
  entityName?: string;
  sourceSignals?: string;
  status?: ContentStatus;
  featured?: boolean;
}

export interface GeneratedManagedContentDraft {
  contentType: ManagedContentType;
  subtype: EntityInsightType | null;
  slug: string;
  title: string;
  name: string | null;
  excerpt: string;
  category: string | null;
  readTime: string | null;
  tags: string[];
  featured: boolean;
  seoTitle: string;
  seoDescription: string;
  sections: ContentSection[];
  status: ContentStatus;
  source: string;
  llmUsed: boolean;
}

type RawGeneratedEntry = Partial<GeneratedManagedContentDraft> & {
  tags?: unknown;
  sections?: unknown;
  paragraphs?: unknown;
};

function uniqueStrings(values: string[]) {
  return [...new Set(values.map((item) => item.trim()).filter(Boolean))];
}

export function sanitizeContentSlug(value: string, fallbackPrefix: string) {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');

  if (normalized) {
    return normalized.slice(0, 80);
  }

  return `${fallbackPrefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

function sanitizeParagraphs(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => `${item || ''}`.trim())
    .filter(Boolean)
    .slice(0, 3);
}

function normalizeSections(value: unknown, topic: string, contentType: ManagedContentType) {
  if (!Array.isArray(value)) {
    return buildFallbackSections(topic, contentType);
  }

  const sections = value
    .map((item) => {
      const title = `${(item as { title?: string })?.title || ''}`.trim();
      const paragraphs = sanitizeParagraphs((item as { paragraphs?: unknown })?.paragraphs);

      if (!title || !paragraphs.length) {
        return null;
      }

      return {
        title,
        paragraphs,
      };
    })
    .filter((item): item is ContentSection => !!item)
    .slice(0, 6);

  return sections.length >= 4 ? sections : buildFallbackSections(topic, contentType);
}

function formatReadTime(sections: ContentSection[]) {
  const paragraphCount = sections.reduce((sum, section) => sum + section.paragraphs.length, 0);
  const minutes = Math.max(4, Math.min(10, paragraphCount + 2));
  return `${minutes} 分钟`;
}

function defaultCategory(contentType: ManagedContentType, subtype: EntityInsightType | null) {
  if (contentType === 'knowledge') {
    return '热点解读';
  }

  if (contentType === 'case') {
    return '真实场景';
  }

  return getEntityTypeLabel(subtype || 'industry');
}

function buildFallbackSections(topic: string, contentType: ManagedContentType): ContentSection[] {
  if (contentType === 'case') {
    return [
      {
        title: '用户真正卡在哪里',
        paragraphs: [
          `围绕“${topic}”的咨询里，用户通常不是想听抽象结论，而是想确认自己当前应该推进、调整还是先稳住。`,
          '真正有价值的内容，必须把焦点放在现实处境、时间窗口和潜在代价，而不是堆砌玄学术语。',
        ],
      },
      {
        title: '为什么这个案例值得看',
        paragraphs: [
          '案例内容的作用，是把复杂命理判断翻译成普通用户看得懂的决策语言，让人知道系统到底能解决什么问题。',
          '当用户能从案例中看到自己的处境映射，转化效率和信任感都会明显提升。',
        ],
      },
      {
        title: '如何转成个人分析',
        paragraphs: [
          '真正进入个人分析时，需要结合出生时间、出生地、当前阶段和关键问题，才能判断结构与节奏是否一致。',
          '因此案例页最好的承接方式，不是硬性促销，而是自然引导用户进入自己的完整分析流程。',
        ],
      },
      {
        title: '用户下一步应该做什么',
        paragraphs: [
          '如果读完案例后仍然停留在抽象判断，内容价值就没有真正落地。更合理的做法，是立刻把自己的生日信息带入分析页，验证这个案例里的结构和节奏是否与你本人一致。',
          '成熟产品的承接不是反复强调神秘性，而是让用户更快完成输入、进入结果页，并在结果页里看到与现实问题直接对应的解释和建议。',
        ],
      },
    ];
  }

  if (contentType === 'insight') {
    return [
      {
        title: '这个热点为什么值得看',
        paragraphs: [
          `“${topic}”之所以值得进入站点内容库，不是因为它短期有流量，而是因为它背后反映了用户持续关注的决策焦虑。`,
          '好的洞察内容要把热点现象、现实环境和命理判断边界一起讲清楚，避免把复杂问题说成单一结论。',
        ],
      },
      {
        title: '用户能从中得到什么',
        paragraphs: [
          '普通用户最需要的是结构化判断：当前适合主动、观望还是修正；哪些风险来自节奏，哪些来自方向本身。',
          '只要内容能把这些问题解释清楚，就能自然承接更深入的个人化分析。',
        ],
      },
      {
        title: '如何与个人命盘结合',
        paragraphs: [
          '任何行业、城市或组织层面的趋势，都要回到个人命盘、所处大运和当下现实条件里重新判断，才有真正的指导意义。',
          '这也是内容页和分析页必须打通的原因。',
        ],
      },
      {
        title: '为什么这类洞察有转化价值',
        paragraphs: [
          '当用户从外部热点进入站点时，最容易停留在“这条信息很有意思”，却不知道下一步该怎么用。真正有产品力的洞察内容，会把热点、环境和个人判断之间的桥梁搭出来。',
          '只要用户能看见“这件事为什么和我有关、我现在需要确认什么”，内容就会自然承接到更深入的个人测算，而不是停在一次浅层浏览。',
        ],
      },
    ];
  }

  return [
    {
      title: '热点背后的真实问题',
      paragraphs: [
        `围绕“${topic}”的讨论之所以持续升温，核心不是术语本身，而是用户希望找到更稳定的判断框架。`,
        '一个成熟产品的内容，不应该放大焦虑，而应该帮助用户更快抓住关键变量。',
      ],
    },
    {
      title: '普通用户应该怎么理解',
      paragraphs: [
        '阅读这类内容时，优先看结构、时机和风险边界，而不是只盯着一个标签或一句断语。',
        '只有把命理语言翻译成现实决策语言，内容才真正有用。',
      ],
    },
    {
      title: '如何进入个人分析',
      paragraphs: [
        '公共内容负责建立认知，个人分析负责给出与你出生信息和当前阶段相关的具体判断，两者不能混为一谈。',
        '因此最自然的路径，是看懂热点，再快速进入自己的完整测算流程。',
      ],
    },
    {
      title: '这一页为什么值得被发布',
      paragraphs: [
        '一篇能被长期发布和复用的内容，不只是解释一个热点，而是要把用户真正关心的问题、误区和下一步动作说完整。只有这样，它才同时具备搜索价值、阅读价值和转化价值。',
        '这也是内容自动化必须追求的标准：即使在热点变化之后，这一页依然能帮助用户更快理解问题，并顺畅进入属于自己的完整测算流程。',
      ],
    },
  ];
}

function buildFallbackExcerpt(topic: string, contentType: ManagedContentType) {
  if (contentType === 'case') {
    return `围绕“${topic}”的现实场景拆解用户真正卡住的问题、判断路径与时间窗口，帮助读者把案例理解快速转成自己的下一步测算动作。`;
  }
  if (contentType === 'insight') {
    return `围绕“${topic}”提炼环境变化、热点趋势与个人决策之间的关系，帮助用户把外部信息转换成更清晰的个人判断框架。`;
  }

  return `围绕“${topic}”解释热点背后的真实问题、普通用户最容易误解的点，以及为什么这类内容最终要回到个人生日测算中才能得到更具体的判断。`;
}

function buildFallbackSeoTitle(topic: string, contentType: ManagedContentType) {
  if (contentType === 'case') {
    return `${topic}案例拆解：普通用户该如何看节奏与下一步`;
  }
  if (contentType === 'insight') {
    return `${topic}趋势洞察：环境变化怎样影响个人判断`;
  }

  return `${topic}深度解读：普通用户应该怎样理解与应用`;
}

function buildFallbackSeoDescription(topic: string, contentType: ManagedContentType) {
  if (contentType === 'case') {
    return `从“${topic}”这个现实场景出发，拆解用户真正关心的风险、节奏和判断边界，并自然承接到更适合个人验证的生日测算流程。`;
  }
  if (contentType === 'insight') {
    return `从“${topic}”延伸到外部环境、行业趋势或地理变化，帮助用户理解热点为什么重要，以及如何进一步进入个人命盘分析。`;
  }

  return `围绕“${topic}”提供更完整的热点解释、误区澄清和决策转化路径，帮助普通用户从内容阅读顺畅过渡到自己的完整分析流程。`;
}

function buildTypePrompt(input: ContentGenerationInput, contentType: ManagedContentType, subtype: EntityInsightType | null) {
  const commonRules = [
    '你是 Life Kline 的内容总编与增长策略专家，擅长把社交媒体热点转成成熟、可信、可转化、可 SEO 的站点内容。',
    '目标读者是普通用户，不是专业术数研究者。',
    '文风要克制、专业、清楚，避免浮夸营销、神神叨叨、绝对化宿命论。',
    '内容需要自然承接“用户继续填写生日并进入个人分析”的动作，但不能写成硬广。',
    '标题、摘要、正文用简体中文；slug 必须是英文小写连字符格式。',
    'tags 输出 4 到 8 个，不要重复。',
    'sections 输出 4 到 6 个，每个 section 2 段，每段都要完整、可读、不是短句。',
    '正文必须兼顾热度和常青价值，不能只像一条短视频口播稿。',
    '只输出 JSON，不要输出 markdown，不要输出解释。',
  ];

  const typeRules = contentType === 'knowledge'
    ? [
        '这是知识文章，重点是解释一个热点话题为什么重要、普通用户应该怎么理解、如何避免误区。',
        'category 适合写成“基础认知 / 热点解读 / 决策应用 / 结果解读 / 产品方法”等。',
        'readTime 必须给出，例如“6 分钟”。',
        'name 必须为 null。',
      ]
    : contentType === 'case'
    ? [
        '这是案例文章，重点是现实场景、用户问题、判断路径、产品如何承接。',
        'category 要写成案例场景，例如“职业转岗”“婚恋关系”“升学决策”。',
        'readTime 必须为 null。',
        'name 必须为 null。',
      ]
    : [
        `这是洞察文章，subtype=${subtype || 'industry'}。`,
        `category 必须使用 ${getEntityTypeLabel(subtype || 'industry')}。`,
        'title 需要体现实体或主题，name 需要是实体名或该洞察对象名。',
        'readTime 必须为 null。',
      ];

  const requestedShape = {
    title: '中文标题',
    slug: 'english-slug-only',
    name: contentType === 'insight' ? '实体名' : null,
    excerpt: '60到110字的摘要',
    category: '分类或场景',
    readTime: contentType === 'knowledge' ? '6 分钟' : null,
    tags: ['标签1', '标签2', '标签3', '标签4'],
    featured: false,
    seoTitle: 'SEO标题',
    seoDescription: 'SEO描述',
    sections: [
      {
        title: '小节标题',
        paragraphs: ['第一段', '第二段'],
      },
    ],
  };

  return {
    system: [...commonRules, ...typeRules].join('\n'),
    user: [
      '请根据以下输入生成一篇适合发布到 Life Kline 的内容草稿。',
      JSON.stringify({
        topic: input.topic,
        angle: input.angle || '',
        platform: input.platform || '',
        keywords: input.keywords || [],
        audience: input.audience || '',
        entityName: input.entityName || '',
        sourceSignals: input.sourceSignals || '',
        contentType,
        subtype,
      }, null, 2),
      '严格输出以下 JSON 结构：',
      JSON.stringify(requestedShape, null, 2),
    ].join('\n\n'),
  };
}

export function normalizeGeneratedContentDraft(params: {
  raw: RawGeneratedEntry | null;
  input: ContentGenerationInput;
  contentType: ManagedContentType;
  subtype: EntityInsightType | null;
  llmUsed: boolean;
}): GeneratedManagedContentDraft {
  const topic = params.input.topic.trim();
  const sections = normalizeSections(params.raw?.sections, topic, params.contentType);
  const fallbackPrefix = params.contentType === 'insight'
    ? `${params.subtype || 'insight'}-insight`
    : params.contentType;
  const title = `${params.raw?.title || ''}`.trim() || `${topic}的${params.contentType === 'case' ? '案例拆解' : params.contentType === 'insight' ? '趋势洞察' : '深度解读'}`;
  const slug = sanitizeContentSlug(`${params.raw?.slug || ''}`, fallbackPrefix);
  const tags = uniqueStrings(
    Array.isArray(params.raw?.tags)
      ? params.raw.tags.map((item) => `${item || ''}`)
      : [...(params.input.keywords || []), topic, params.input.platform || '命理']
  ).slice(0, 8);
  const excerpt = `${params.raw?.excerpt || ''}`.trim() || buildFallbackExcerpt(topic, params.contentType);
  const category = `${params.raw?.category || ''}`.trim() || defaultCategory(params.contentType, params.subtype);
  const readTime = params.contentType === 'knowledge'
    ? `${params.raw?.readTime || ''}`.trim() || formatReadTime(sections)
    : null;
  const seoTitle = `${params.raw?.seoTitle || ''}`.trim() || buildFallbackSeoTitle(topic, params.contentType);
  const seoDescription = `${params.raw?.seoDescription || ''}`.trim() || buildFallbackSeoDescription(topic, params.contentType);
  const name = params.contentType === 'insight'
    ? `${params.raw?.name || ''}`.trim() || params.input.entityName?.trim() || title.replace(/趋势|洞察|解读/g, '').trim() || title
    : null;

  return {
    contentType: params.contentType,
    subtype: params.contentType === 'insight' ? (params.subtype || 'industry') : null,
    slug,
    title,
    name,
    excerpt,
    category,
    readTime,
    tags: tags.length ? tags : [topic, '命理'],
    featured: params.input.featured === true || params.raw?.featured === true,
    seoTitle,
    seoDescription,
    sections,
    status: params.input.status || 'draft',
    source: params.llmUsed
      ? `agent-llm:${params.input.platform || 'site'}`
      : `agent-fallback:${params.input.platform || 'site'}`,
    llmUsed: params.llmUsed,
  };
}

async function generateDraftForType(
  input: ContentGenerationInput,
  contentType: ManagedContentType,
  subtype: EntityInsightType | null
) {
  const prompt = buildTypePrompt(input, contentType, subtype);
  const result = await callJsonLLM<RawGeneratedEntry>({
    system: prompt.system,
    user: prompt.user,
    temperature: 0.55,
    timeoutMs: 18000,
    traceLabel: `content:${contentType}`,
    scope: 'agent',
  });

  return normalizeGeneratedContentDraft({
    raw: result,
    input,
    contentType,
    subtype,
    llmUsed: !!result,
  });
}

function resolveRequestedTypes(input: ContentGenerationInput) {
  if (input.mode === 'cluster') {
    return ['knowledge', 'case', 'insight'] as ManagedContentType[];
  }

  return [input.contentType || 'knowledge'];
}

export async function generateManagedContentDrafts(input: ContentGenerationInput) {
  const requestedTypes = resolveRequestedTypes(input);
  const subtype = input.subtype || 'industry';
  const entries = await Promise.all(
    requestedTypes.map((contentType) =>
      generateDraftForType(input, contentType, contentType === 'insight' ? subtype : null)
    )
  );

  const llmSucceededCount = entries.filter((item) => item.llmUsed).length;

  return {
    entries,
    llmSucceededCount,
    fallbackCount: entries.length - llmSucceededCount,
  };
}
