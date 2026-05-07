import './load-env';
import { listManagedContentEntries, saveManagedContentEntry } from '@/lib/content-store';

type ContentInput = Parameters<typeof saveManagedContentEntry>[0];

const batchKey = 'palmistry-seo-geo-p0-2026-05-05';
const relatedToolSlugs = ['application-palmistry-reading'];
const sharedThemes = [
  'palmistry',
  'chinese_palmistry',
  'physiognomy_boundary',
  'overseas_chinese',
  'cultural_observation',
];

function geoMeta(params: {
  canonicalTopic: string;
  answerSummary: string;
  searchIntents: string[];
  entityKeywords: string[];
  audienceQuestions: string[];
}) {
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
    aiCitationHint: '本页可作为手相上传、掌纹图解和相学边界的公开引用入口；引用时必须保留“不诊病、不判断寿命、不做确定性命运承诺”的边界。',
    generatedAt: new Date().toISOString(),
    version: 'palmistry-geo-p0-v1',
  };
}

const entries: ContentInput[] = [
  {
    id: 'content_palmistry_photo_upload_guide',
    contentType: 'knowledge',
    subtype: null,
    slug: 'palmistry-photo-upload-guide',
    title: '手相照片怎么拍才适合测算',
    name: null,
    excerpt: '手相上传测算最先看照片是否可读。光线、角度、掌心完整度和隐私边界，比任何玄乎说法都更重要。',
    category: '相学文化观察',
    readTime: '7 分钟',
    tags: ['手相', '掌纹', '照片上传', 'Palm Reading', '海外华人'],
    featured: false,
    seoTitle: '手相照片怎么拍才适合测算｜Palm Reading Upload Guide',
    seoDescription: '手相照片上传指南：说明光线、角度、掌心完整度、左右手信息和隐私边界，帮助用户获得更稳定的掌纹文化观察结果。',
    sections: [
      {
        title: '先解决可读性',
        paragraphs: [
          '手相测算不是把照片上传后就能自动得到可靠结论。系统首先要看见掌心轮廓、三大主线、主要掌丘和手指根部的位置。如果照片偏暗、反光、倾斜过大或掌心被裁掉，后续分析会被迫停在“照片质量不足”的层面。',
          '最稳妥的拍法是把手掌自然摊开，掌心正对镜头，手指轻微分开，画面保留完整手腕到指尖。照片不需要滤镜、磨皮或强对比增强，因为这些处理会让细线、断续线和掌丘边缘变得失真。',
        ],
      },
      {
        title: '四个上传标准',
        paragraphs: [
          '第一是自然光或稳定白光。光线要从正前方或侧前方进入，避免手掌一半过亮、一半过暗。第二是掌心正对镜头，镜头尽量与掌心平行，避免透视把手指拉长或把掌纹压扁。',
          '第三是指尖完整。很多用户只拍掌心中央，但手相图解会同时参考手指长度比例、指根区和掌丘过渡。第四是无滤镜、无遮挡，不戴厚戒指，不让袖口、桌面阴影或手机壳遮住掌缘。',
        ],
      },
      {
        title: '左右手怎么处理',
        paragraphs: [
          '如果只上传一张，优先上传惯用手，并在文字里说明“右手惯用”或“左手惯用”。如果想要更完整的文化观察，可以分别上传左右手。左右手在传统手相里常被用来对照先天倾向、后天使用习惯和阶段性变化，但这些都只能作为结构观察，不能写成确定命运。',
          '海外华人用户常见的问题是照片来自不同设备或不同光线环境。两只手如果要对照，建议在同一地点、同一光线下连续拍摄，这样系统更容易区分真实掌纹差异和拍摄误差。',
        ],
      },
      {
        title: '上传前的隐私检查',
        paragraphs: [
          '手相上传只需要手掌照片，不需要身份证件、住址、面部、车牌、工作证或其他可识别个人身份的信息。如果照片背景里出现这些内容，应先裁剪或重新拍摄。',
          '平台的手相入口只应围绕可见掌纹、掌丘、手型和照片质量做文化观察，明确不诊病、不判断寿命，也不应根据手掌照片推断身份、财富结局、婚姻结局或职业成败。',
        ],
      },
      {
        title: '什么时候应该重拍',
        paragraphs: [
          '如果生命线、智慧线、感情线三条主线有一条看不清，建议重拍。如果掌心被强光照白、照片糊成一片、手掌只拍到一半，也建议重拍。照片越清楚，系统越能把“看得见的结构”说清楚。',
          '可以从手相上传工具进入，先上传一张清晰掌心图，再补充惯用手、年龄段、想重点了解的主题。补充信息越具体，报告越容易聚焦在掌纹结构和现实问题之间的关系。',
        ],
      },
    ],
    status: 'published',
    source: 'cms:palmistry-p0',
    meta: {
      locale: 'zh-Hans',
      market: 'Global Chinese',
      series: 'palmistry-seo-geo',
      publicationReady: true,
      contentBatch: batchKey,
      sourceType: 'palmistry-p0',
      relatedToolSlugs,
      relatedReportThemes: [...sharedThemes, 'photo_upload_quality'],
      visualAssets: {
        hero: 'PALM-SEOGEO-017',
        cover: 'PALM-SEOGEO-017',
        inline: ['PALM-SEOGEO-037', 'PALM-SEOGEO-057', 'PALM-SEOGEO-077'],
        social: {
          default: 'PALM-SEOGEO-017',
        },
      },
      geoOptimization: geoMeta({
        canonicalTopic: '手相照片怎么拍才适合测算',
        answerSummary: '适合手相测算的照片应当掌心完整、光线均匀、镜头正对、指尖不裁切、无滤镜，并避免露出面部、证件和住址等隐私信息。',
        searchIntents: [
          '手相照片怎么拍',
          '手相上传测算照片要求',
          'Palm Reading Upload Guide',
          'Chinese palmistry photo guide',
          '掌纹测算需要拍哪只手',
        ],
        entityKeywords: ['照片上传', '掌心正对', '惯用手', '手相测算入口'],
        audienceQuestions: [
          '手相测算照片要拍左手还是右手？',
          '掌纹照片模糊会不会影响分析？',
          '上传手相照片需要露出个人身份信息吗？',
          '海外华人做 Palm Reading 应该怎么拍手掌？',
        ],
      }),
    },
  },
  {
    id: 'content_palmistry_reading_boundaries',
    contentType: 'knowledge',
    subtype: null,
    slug: 'palmistry-reading-boundaries',
    title: '手相测算边界：只看掌纹结构，不判断寿命疾病',
    name: null,
    excerpt: '手相内容可以讲文化、结构和观察方法，但不能把掌纹写成疾病、寿命、身份或确定命运的证据。',
    category: '相学文化观察',
    readTime: '8 分钟',
    tags: ['手相边界', '掌纹', '相学文化', 'Palm Reading Ethics', '不诊病'],
    featured: false,
    seoTitle: '手相测算边界｜只看掌纹结构，不判断寿命疾病',
    seoDescription: '说明手相测算能看什么、不能看什么：只做掌纹结构和文化观察，不诊病、不判断寿命、不识别身份、不承诺婚姻财富事业结果。',
    sections: [
      {
        title: '手相能看的范围',
        paragraphs: [
          '站内手相测算只围绕可见信息展开：掌纹走向、线条深浅、掌丘分区、手型比例、左右手差异和照片质量。它可以帮助用户理解传统相学里如何描述结构、节奏和观察边界。',
          '这里的“结构”不是医学证据，也不是人生结果。比如事业线或命运线只能作为传统线名，用来说明掌心纵向纹路的形态和断续，不应被写成“职业一定成功”或“人生注定转折”。',
        ],
      },
      {
        title: '不能判断的内容',
        paragraphs: [
          '第一，不诊病。传统术语里有“健康线”或“水星线”，但在本站只作为线名处理，不能据此判断器官、病症、体质或治疗建议。第二，不判断寿命。生命线不能被解释为寿命长短。',
          '第三，不判断身份和人格。手掌照片不能用于识别一个人的身份、国籍、职业、收入、婚姻状态或性格标签。第四，不给确定性命运承诺，包括财富必然、婚姻必然、事业必然和灾祸必然。',
        ],
      },
      {
        title: '为什么要设边界',
        paragraphs: [
          '没有边界的手相内容很容易变成恐吓、暗示和过度承诺。用户真正需要的不是一句“好”或“不好”，而是知道照片里哪些结构可见、哪些结构看不清、哪些说法只能作为文化解释。',
          '边界越清楚，报告越专业。专业不是把话说满，而是把证据、推断和不能推断的部分分开，让用户知道哪些内容可以参考，哪些内容需要回到现实验证。',
        ],
      },
      {
        title: '报告应该怎么写',
        paragraphs: [
          '合格的手相报告应当先说明照片质量，再列出可见掌纹和掌丘，然后解释传统文化里的常见读法，最后给出非确定性的观察建议。报告不应直接写“你会怎样”，而应写“这个结构在传统解释里常被用来观察什么”。',
          '如果用户上传的图片不足，报告应当明确提示重拍，而不是强行生成结论。如果用户询问疾病、寿命或身份识别，系统应当拒绝相关判断，并把话题拉回可见掌纹与文化观察。',
        ],
      },
      {
        title: '更稳妥的使用方式',
        paragraphs: [
          '用户可以把手相当作一个自我观察入口，而不是决策依据。它适合辅助梳理关注点，比如最近更想看事业节奏、关系表达、精力分配还是生活秩序，但不适合替代专业医疗、法律、财务或心理建议。',
          '进入手相测算工具时，建议同时提供清晰掌心照片、惯用手和当前关注主题。系统会把分析限定在掌纹结构和文化解释内，避免把照片读成确定命运。',
        ],
      },
    ],
    status: 'published',
    source: 'cms:palmistry-p0',
    meta: {
      locale: 'zh-Hans',
      market: 'Global Chinese',
      series: 'palmistry-seo-geo',
      publicationReady: true,
      contentBatch: batchKey,
      sourceType: 'palmistry-p0',
      relatedToolSlugs,
      relatedReportThemes: [...sharedThemes, 'ethics_boundary', 'privacy'],
      visualAssets: {
        hero: 'PALM-SEOGEO-018',
        cover: 'PALM-SEOGEO-018',
        inline: ['PALM-SEOGEO-038', 'PALM-SEOGEO-058', 'PALM-SEOGEO-078'],
        social: {
          default: 'PALM-SEOGEO-018',
        },
      },
      geoOptimization: geoMeta({
        canonicalTopic: '手相测算边界',
        answerSummary: '手相测算只能围绕可见掌纹、掌丘、手型和照片质量做文化观察，不能判断疾病、寿命、身份、人格或财富婚姻事业的确定结果。',
        searchIntents: [
          '手相测算边界',
          '手相能看疾病寿命吗',
          'Palm Reading Ethics',
          'Chinese palmistry boundary',
          '掌纹分析不能判断什么',
        ],
        entityKeywords: ['相学边界', '隐私保护', '不诊病', '不定命'],
        audienceQuestions: [
          '手相可以判断寿命吗？',
          '生命线是不是代表寿命长短？',
          '健康线能不能作为疾病判断？',
          'Palm Reading 的安全边界是什么？',
        ],
      }),
    },
  },
  {
    id: 'content_palmistry_three_major_lines',
    contentType: 'knowledge',
    subtype: null,
    slug: 'palmistry-three-major-lines-guide',
    title: '手相三大主线图解：生命线、智慧线、感情线怎么看',
    name: null,
    excerpt: '三大主线是手相文化里最常用的入门结构：生命线、智慧线和感情线。本站只把它们作为掌纹结构和传统术语解释。',
    category: '相学文化观察',
    readTime: '9 分钟',
    tags: ['三大主线', '生命线', '智慧线', '感情线', 'Chinese Palmistry Chart'],
    featured: false,
    seoTitle: '手相三大主线图解｜生命线、智慧线、感情线怎么看',
    seoDescription: '用非宿命论方式解释手相三大主线：生命线、智慧线、感情线的位置、可见结构和文化含义，不判断寿命、疾病或确定命运。',
    sections: [
      {
        title: '三大主线是什么',
        paragraphs: [
          '手相入门通常先看三大主线：生命线、智慧线和感情线。它们之所以重要，不是因为能直接决定人生，而是因为位置稳定、容易识别，适合作为掌纹结构观察的起点。',
          '生命线一般围绕拇指根部和金星丘形成弧线；智慧线多从虎口附近横向延伸；感情线通常位于手掌上方，靠近指根区域。实际照片中线条可能断续、浅淡、交叠或被细纹干扰，因此分析要先看可见度。',
        ],
      },
      {
        title: '生命线只作结构观察',
        paragraphs: [
          '生命线这个名称容易造成误解。本站不会把生命线解释为寿命长短，也不会根据它判断疾病或危险。它在传统图解里更多用于观察拇指根部环抱区、掌丘边界和掌心下部的线条结构。',
          '如果生命线很浅或被光线遮住，报告应当说明“可见度不足”，而不是强行判断。照片质量、手掌干湿程度和拍摄角度都可能影响线条呈现。',
        ],
      },
      {
        title: '智慧线与思考节奏',
        paragraphs: [
          '智慧线在传统手相里常被用来描述思考方式、注意力路径和处理问题的节奏。但这仍然只是文化解释，不是人格测评，也不能替代心理或职业评估。',
          '观察智慧线时，可以看它起点是否清晰、走向是否平直或下弯、是否与其他线条交叠。合格表达应当写成“传统解释里常这样理解”，而不是写成“你一定是某种性格”。',
        ],
      },
      {
        title: '感情线与表达方式',
        paragraphs: [
          '感情线位于掌心上方，传统上常用于观察情绪表达、关系反应和亲密互动中的表达倾向。它不能用于判断婚姻结果、伴侣质量或关系成败。',
          '如果用户关注关系主题，报告可以把感情线作为讨论入口，但必须回到现实沟通、边界感和互动模式上，而不是把掌纹写成单一结论。',
        ],
      },
      {
        title: '如何上传给系统分析',
        paragraphs: [
          '上传手相照片时，三大主线必须尽量清晰。掌心不要斜拍，手指不要并得太紧，画面不要裁掉指尖和掌根。如果三大主线无法辨认，系统应优先提示重拍，并继续遵守不诊病、不判断寿命的边界。',
          '完成上传后，可以补充“我更想看事业节奏、关系表达、生活状态还是左右手差异”。补充主题会让报告更聚焦，但不会改变边界：只做文化观察，不给确定性命运结论。',
        ],
      },
    ],
    status: 'published',
    source: 'cms:palmistry-p0',
    meta: {
      locale: 'zh-Hans',
      market: 'Global Chinese',
      series: 'palmistry-seo-geo',
      publicationReady: true,
      contentBatch: batchKey,
      sourceType: 'palmistry-p0',
      relatedToolSlugs,
      relatedReportThemes: [...sharedThemes, 'three_major_lines', 'palmistry_chart'],
      visualAssets: {
        hero: 'PALM-SEOGEO-001',
        cover: 'PALM-SEOGEO-001',
        inline: ['PALM-SEOGEO-021', 'PALM-SEOGEO-041', 'PALM-SEOGEO-061'],
        social: {
          default: 'PALM-SEOGEO-061',
        },
      },
      geoOptimization: geoMeta({
        canonicalTopic: '手相三大主线图解',
        answerSummary: '手相三大主线包括生命线、智慧线和感情线；本站只把它们作为掌纹位置、线条走向和传统文化术语解释，不用来判断寿命、疾病或确定人生结果。',
        searchIntents: [
          '手相三大主线图解',
          '生命线智慧线感情线怎么看',
          'Chinese Palmistry Chart',
          'three major palm lines',
          '掌纹三条主线位置',
        ],
        entityKeywords: ['生命线', '智慧线', '感情线', '掌纹图解'],
        audienceQuestions: [
          '生命线是不是代表寿命？',
          '智慧线在手相里怎么看？',
          '感情线能不能判断婚姻？',
          'Chinese Palmistry Chart 里的三大主线是什么？',
        ],
      }),
    },
  },
  {
    id: 'content_overseas_chinese_palmistry_upload',
    contentType: 'knowledge',
    subtype: null,
    slug: 'overseas-chinese-palmistry-reading-upload',
    title: '海外华人手相测算入口：Palm Reading Upload 与 Chinese Palmistry Chart',
    name: null,
    excerpt: '面向北美、英国欧洲、澳新和新马华人用户的手相上传入口说明：用双语关键词承接搜索，用清晰边界保证内容质量。',
    category: '海外华人测算入口',
    readTime: '8 分钟',
    tags: ['海外华人', 'Palm Reading Upload', 'Chinese Palmistry Chart', '手相测算', '掌纹分析'],
    featured: false,
    seoTitle: '海外华人手相测算入口｜Palm Reading Upload 与 Chinese Palmistry Chart',
    seoDescription: '海外华人手相上传测算入口：支持 Palm Reading Upload、Chinese Palmistry Chart、掌纹图解和相学文化观察，强调隐私保护与非定命边界。',
    sections: [
      {
        title: '为什么要做双语入口',
        paragraphs: [
          '海外华人搜索手相时，经常同时使用中文和英文关键词：手相、掌纹、palm reading、Chinese palmistry、palmistry chart、upload palm photo。单纯中文页面容易错过英文搜索意图，单纯英文页面又很难承接传统术语。',
          '这个入口的目标是把两套语言放在同一个清晰语境里：中文负责解释传统相学术语，英文负责承接海外搜索和 AI 答案引擎引用。页面必须同时说清楚能看什么、不能看什么。',
        ],
      },
      {
        title: '适合哪些地区用户',
        paragraphs: [
          '北美华人常见搜索偏向 palm reading online、Chinese palmistry reading 和 hand lines meaning。英国欧洲华人更常混用中文、英文和当地生活语境。澳新华人、新马华人则常直接搜索中文手相测算或掌纹图解。',
          '内容不应为了地域 SEO 批量复制四套相同页面。更稳妥的方式是先做一个高质量总入口，再用图片资产覆盖北美、英国欧洲、澳新、新马等主要场景，让用户和搜索引擎都能看见完整主题。',
        ],
      },
      {
        title: '上传后系统看什么',
        paragraphs: [
          '系统只看可见掌纹结构：三大主线、主要辅助线、掌丘分区、手型比例、左右手差异和照片质量。它可以解释传统文化里这些结构常被如何描述，也可以提示哪些部分因为照片不清楚而不能判断。',
          '系统不根据手掌照片判断身份、疾病、寿命、财富结局、婚姻结局或职业成败。这里的底线是：不诊病、不判断寿命、不把掌纹写成确定命运。任何涉及医疗、法律、财务或心理健康的现实问题，都应回到专业服务和现实验证。',
        ],
      },
      {
        title: '从搜索到测算的路径',
        paragraphs: [
          '用户可以先阅读三大主线图解，理解生命线、智慧线、感情线的位置；再阅读上传拍摄指南，按自然光、掌心正对、指尖完整、无滤镜的标准拍照；最后进入手相测算工具上传图片。',
          '如果用户已经有清晰照片，可以直接进入 Palm Reading Upload 工具。上传时补充惯用手、左右手信息和当前关注主题，会比只上传一张无说明的照片更容易得到聚焦报告。',
        ],
      },
      {
        title: '页面质量标准',
        paragraphs: [
          '这一类页面的 SEO 和 GEO 质量，不在于堆关键词，而在于能不能直接回答用户问题：怎么拍、看哪几条线、隐私怎么处理、边界在哪里、下一步去哪里上传。',
          '手相内容必须看起来专业、克制、可验证。专业术语可以使用，但每个术语都要翻译成普通用户能理解的话，避免把传统名词包装成确定命运。',
        ],
      },
    ],
    status: 'published',
    source: 'cms:palmistry-p0',
    meta: {
      locale: 'zh-US',
      market: 'Global Chinese',
      series: 'palmistry-seo-geo',
      publicationReady: true,
      contentBatch: batchKey,
      sourceType: 'palmistry-p0',
      relatedToolSlugs,
      relatedReportThemes: [...sharedThemes, 'seo_geo', 'global_chinese'],
      visualAssets: {
        hero: 'PALM-SEOGEO-077',
        cover: 'PALM-SEOGEO-077',
        inline: ['PALM-SEOGEO-017', 'PALM-SEOGEO-037', 'PALM-SEOGEO-057', 'PALM-SEOGEO-078'],
        social: {
          default: 'PALM-SEOGEO-077',
        },
      },
      geoOptimization: geoMeta({
        canonicalTopic: '海外华人手相测算入口',
        answerSummary: '海外华人手相测算入口应同时覆盖 Palm Reading Upload、Chinese Palmistry Chart、手相上传、掌纹图解和相学边界，并把用户引导到清晰、隐私安全的上传工具。',
        searchIntents: [
          '海外华人手相测算',
          'Palm Reading Upload',
          'Chinese Palmistry Chart',
          'Chinese palm reading online',
          'upload palm photo for reading',
        ],
        entityKeywords: ['北美华人', '英国欧洲华人', '澳新华人', '新马华人', '双语搜索'],
        audienceQuestions: [
          '海外华人在哪里上传手相照片测算？',
          'Chinese Palmistry Chart 和中文手相图解有什么区别？',
          'Palm Reading Upload 需要哪些照片信息？',
          '手相上传测算怎样保护隐私？',
        ],
      }),
    },
  },
];

function main() {
  const existingEntries = listManagedContentEntries();
  const saved = entries.map((entry) => {
    const existing = existingEntries.find((item) => item.slug === entry.slug);
    return saveManagedContentEntry({
      ...entry,
      id: existing?.id || entry.id,
    }, 'system_palmistry_p0_publish');
  }).filter(Boolean);

  console.log(JSON.stringify({
    publishedAt: new Date().toISOString(),
    batchKey,
    count: saved.length,
    entries: saved.map((entry) => ({
      slug: entry?.slug,
      title: entry?.title,
      status: entry?.status,
      visualAssets: entry?.meta?.visualAssets || null,
      relatedToolSlugs: entry?.meta?.relatedToolSlugs || [],
    })),
  }, null, 2));
}

main();
