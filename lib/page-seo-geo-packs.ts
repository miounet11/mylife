/**
 * Site-wide SEO + GEO quality packs for public hub pages.
 * Every indexable surface should register a pack and render <PageSeoGeoSection />.
 *
 * Quality bar (aligned with docs/GLOBALIZATION_STANDARD + tool-seo-geo):
 * - title ~25–40 CJK chars or clear EN product title
 * - description 80–160 chars of unique value
 * - answerSummary ≥40 CJK (GEO direct answer)
 * - ≥3 searchIntents, ≥5 entityKeywords, ≥3 FAQs
 * - howTo + related internal links for crawl depth
 */

export type PageSeoLink = {
  href: string;
  label: string;
  description?: string;
};

export type PageSeoGeoPack = {
  path: string;
  /** Stable id for data attributes */
  slug: string;
  /** Visible product/hub name (H2 “是什么”) */
  name: string;
  title: string;
  description: string;
  keywords: string[];
  /** GEO direct answer — AI/snippet friendly */
  answerSummary: string;
  searchIntents: string[];
  entityKeywords: string[];
  audienceQuestions?: string[];
  audience?: string;
  howTo: Array<{ step: string; body: string }>;
  faqs: Array<{ question: string; answer: string }>;
  related: PageSeoLink[];
  breadcrumbs?: Array<{ name: string; path: string }>;
  disclaimer?: string;
  geoRegion?: string;
  geoPlaceName?: string;
};

const HOME: PageSeoGeoPack = {
  path: '/',
  slug: 'home',
  name: '人生K线结构判断工作台',
  title: '免费八字排盘与人生K线｜结构判断·流年大运·十维度｜Life K-Line',
  description:
    '填写生辰免费生成人生K线报告：日主用神、大运流年窗口、事业财运情感可执行下一步。结构参考，不恐吓，可验证。',
  keywords: ['免费八字', '八字排盘', '人生K线', '流年大运', '十维度研判', 'bazi chart', 'Life K-Line'],
  answerSummary:
    '人生K线根据出生时间地点输出结构化命盘与阶段节奏：先定日主与用神，再看大运流年窗口，最后落到事业、财运、关系等可执行动作。适合需要「先判断再行动」的决策，而非每日运势恐吓。',
  searchIntents: [
    '免费八字排盘在线',
    '人生K线是什么',
    '流年大运怎么看',
    '八字事业财运分析',
    '生辰结构判断工具',
  ],
  entityKeywords: ['八字', '日主', '用神', '大运', '流年', '人生K线', '十维度', '结构判断', '世界易', 'Life K-Line'],
  audience: '需要阶段决策与节奏判断的个人与顾问',
  howTo: [
    { step: '填写生辰', body: '输入公历生日、时辰与出生地，系统换算真太阳时与四柱。' },
    { step: '阅读结构主轴', body: '先看日主用神与当前大运，再看本年/本月窗口强弱。' },
    { step: '落到动作', body: '按事业/财运/关系意图选择工具或追问，并设置可验证检查点。' },
  ],
  faqs: [
    {
      question: '人生K线和普通算命有什么区别？',
      answer: '强调结构、阶段与可执行边界，输出可复核的节奏判断，不替代现实选择，也不做恐吓式吉凶断语。',
    },
    {
      question: '需要准确到时辰吗？',
      answer: '时辰越准，日柱与用神越稳。不确定时可先粗排再在报告中标注时辰精度。',
    },
    {
      question: '报告是否公开？',
      answer: '可分享摘要页；高质量匿名案例经脱敏后进入公开内容流，私有报告可关闭公开。',
    },
    {
      question: '适合海外华人吗？',
      answer: '支持时区与出生地，并有世界易与城市洞察内容，面向国内与海外华人决策场景。',
    },
  ],
  related: [
    { href: '/analyze', label: '完整测算工作台', description: '同一引擎的专注测算入口' },
    { href: '/tools', label: '工具中心', description: '合婚、流年、维度下钻' },
    { href: '/reports', label: '公开案例流', description: '匿名测算与工具结果' },
    { href: '/dimensions', label: '十维度研判', description: '事业婚姻财运等专题' },
  ],
  breadcrumbs: [
    { name: '首页', path: '/' },
  ],
  disclaimer: '内容为结构与节奏参考，不构成投资、医疗、法律或婚姻保证。',
};

const ANALYZE: PageSeoGeoPack = {
  path: '/analyze',
  slug: 'analyze',
  name: '八字结构测算',
  title: '八字结构测算｜免费人生K线报告·用神大运流年｜人生K线',
  description:
    '专注测算入口：输入生辰生成完整结构报告，含用神、大运流年、行动板与工具下钻。免费可保存。',
  keywords: ['八字测算', '结构报告', '用神', '大运流年', '人生K线报告'],
  answerSummary:
    '测算页用同一人生K线引擎生成完整报告：锁定四柱与用神后，给出阶段窗口与事业/财运/关系方向，并可继续合婚、流年、维度工具。',
  searchIntents: ['在线八字测算', '免费生成命理报告', '大运流年分析', '用神怎么定'],
  entityKeywords: ['测算', '报告', '用神', '大运', '流年', '四柱', '行动板', '人生K线'],
  howTo: [
    { step: '输入生辰', body: '日期、时间、地点越完整，窗口判断越稳。' },
    { step: '选择意图', body: '可按事业、财运、关系等意图加权阅读路径。' },
    { step: '保存与下钻', body: '绑定邮箱保存报告，或进入工具/顾问追问。' },
  ],
  faqs: [
    { question: '和首页有什么不同？', answer: '首页是工作台速览；测算页更专注生成与阅读完整报告。' },
    { question: '要不要登录？', answer: '游客可先看；绑定邮箱后可跨设备回看与接收节点提醒。' },
    { question: '报告多久生成？', answer: '通常数十秒内出结构层；深度增强可能异步补全。' },
  ],
  related: [
    { href: '/', label: '首页工作台' },
    { href: '/hehun', label: '合婚双盘' },
    { href: '/tools/timing-yearly-window', label: '流年窗口工具' },
    { href: '/docs/read-first-report', label: '如何读第一份报告' },
  ],
  breadcrumbs: [
    { name: '首页', path: '/' },
    { name: '测算', path: '/analyze' },
  ],
};

const REPORTS: PageSeoGeoPack = {
  path: '/reports',
  slug: 'reports',
  name: '公开测算与工具案例流',
  title: '公开测算案例与工具结果｜匿名脱敏持续更新｜人生K线',
  description:
    '持续更新的匿名八字报告、合婚流年等工具结果与公开追问。结构读法示例，已脱敏，可据此生成你的判断。',
  keywords: ['公开八字案例', '匿名命理报告', '工具结果案例', '合婚案例', '流年案例'],
  answerSummary:
    '公开内容流汇集经质量门槛与隐私脱敏的用户测算摘要和工具结果，用于学习结构读法与场景对照；不是替他人断吉凶。你可用同法生成自己的报告。',
  searchIntents: ['八字案例分析', '匿名命理报告', '合婚案例公开', '流年工具结果示例'],
  entityKeywords: ['公开案例', '脱敏', '测算报告', '工具结果', '合婚', '流年', '人生K线'],
  howTo: [
    { step: '浏览匿名报告', body: '先看格局与日主主轴，再看阶段窗口。' },
    { step: '对照工具案例', body: '合婚、流年、维度结果展示下钻读法。' },
    { step: '生成自己的', body: '从任意案例 CTA 进入测算或同款工具。' },
  ],
  faqs: [
    { question: '会泄露隐私吗？', answer: '公开前去除邮箱手机证件与精确地址；薄内容与私有报告不进入索引。' },
    { question: '案例从哪来？', answer: '用户完成测算或工具后，合格结果自动脱敏进入内容流。' },
    { question: '能当作自己的结论吗？', answer: '不能。仅作结构读法参考，请用自己的生辰生成报告。' },
  ],
  related: [
    { href: '/analyze', label: '生成我的测算' },
    { href: '/tools', label: '工具中心' },
    { href: '/cases', label: '编辑部案例' },
    { href: '/knowledge', label: '知识库' },
  ],
  breadcrumbs: [
    { name: '首页', path: '/' },
    { name: '公开内容', path: '/reports' },
  ],
};

const TOOLS: PageSeoGeoPack = {
  path: '/tools',
  slug: 'tools-hub',
  name: '人生K线工具中心',
  title: '命理工具中心｜合婚·流年·维度·手相面相·起名｜人生K线',
  description:
    '按问题下钻：合婚双盘、流年窗口、十维度、手相面相、起名与空间场。与主报告同一引擎，结果可公开为案例。',
  keywords: ['命理工具', '合婚', '流年', '手相', '起名', '空间场', '十维度'],
  answerSummary:
    '工具中心把综合报告拆成可验证的专题：合婚看双盘匹配，流年看年度主窗口，维度看事业婚姻财运切片，形象类工具看补充证据。每个工具结果可保存并在合格后脱敏公开。',
  searchIntents: ['在线合婚', '流年运势工具', '八字事业分析工具', '起名五行工具', '手相面相在线'],
  entityKeywords: ['工具', '合婚', '流年窗口', '维度', '手相', '面相', '起名', '空间场', '人生K线'],
  howTo: [
    { step: '先有主报告或生辰', body: '多数工具可挂报告或仅用出生信息即时重算。' },
    { step: '选问题入口', body: '按合婚、流年、维度、形象类选择工具。' },
    { step: '阅读与下钻', body: '看摘要与动作后，可回报告或追问顾问。' },
  ],
  faqs: [
    { question: '必须先排盘吗？', answer: '推荐先有报告；部分工具支持仅出生信息即时重算。' },
    { question: '工具结论和报告冲突怎么办？', answer: '以报告锁定的日主用神与大运为准，工具是主题投影。' },
    { question: '结果会公开吗？', answer: '本人结果默认私密查看；合格结果可脱敏进入公开案例流。' },
  ],
  related: [
    { href: '/hehun', label: '合婚' },
    { href: '/tools/timing-yearly-window', label: '流年窗口' },
    { href: '/dimensions', label: '十维度' },
    { href: '/reports', label: '公开工具案例' },
  ],
  breadcrumbs: [
    { name: '首页', path: '/' },
    { name: '工具', path: '/tools' },
  ],
};

const KNOWLEDGE: PageSeoGeoPack = {
  path: '/knowledge',
  slug: 'knowledge',
  name: '世界易与人生K线知识库',
  title: '命理知识库｜世界易·用神大运·结构读法｜人生K线',
  description:
    '系统阅读用神、大运流年、十维度与世界易方法论文章。学完结构再测算，避免碎片恐吓信息。',
  keywords: ['命理知识', '世界易', '用神', '大运流年', '八字学习'],
  answerSummary:
    '知识库提供可检索的结构方法论：从日主用神、大运流年到维度应用与世界易全局视角，文章与测算工具互相链接，方便边学边验证。',
  searchIntents: ['八字用神怎么看', '大运流年入门', '世界易是什么', '十维度研判学习'],
  entityKeywords: ['知识库', '世界易', '用神', '大运', '流年', '方法论', '人生K线'],
  howTo: [
    { step: '按主题选文', body: '从入门、用神、阶段到应用专题筛选。' },
    { step: '对照自己的盘', body: '读完用测算或工具验证，而非只收藏概念。' },
    { step: '进入路径学习', body: '可接学习轨道与顾问追问。' },
  ],
  faqs: [
    { question: '适合零基础吗？', answer: '有入门与读报告指南；建议与一份自己的报告对照阅读。' },
    { question: '和案例库区别？', answer: '知识库讲方法；案例库与公开流讲场景示例。' },
    { question: '有英文内容吗？', answer: '支持多语言筛选与世界易英文入口。' },
  ],
  related: [
    { href: '/cases', label: '案例库' },
    { href: '/learn', label: '学习轨道' },
    { href: '/docs', label: '使用文档' },
    { href: '/analyze', label: '去测算' },
  ],
  breadcrumbs: [
    { name: '首页', path: '/' },
    { name: '知识', path: '/knowledge' },
  ],
};

const CASES: PageSeoGeoPack = {
  path: '/cases',
  slug: 'cases',
  name: '结构案例库',
  title: '命理结构案例｜事业跳槽·婚姻节奏·决策对照｜人生K线',
  description:
    '编辑精选与公开脱敏案例：事业转换、关系窗口、节奏决策。学习如何把结构落到可验证动作。',
  keywords: ['命理案例', '八字案例', '事业跳槽案例', '婚姻节奏案例'],
  answerSummary:
    '案例库展示完整读法：背景→结构主轴→窗口→动作→验证点。与实时公开流互补，适合深度学习决策闭环。',
  searchIntents: ['八字事业案例', '跳槽时机案例', '婚姻八字案例', '结构决策案例'],
  entityKeywords: ['案例', '决策闭环', '验证点', '事业', '婚姻', '人生K线'],
  howTo: [
    { step: '选相近场景', body: '按事业、关系、节奏主题进入。' },
    { step: '拆四段读法', body: '主轴、窗口、动作、验证缺一不可。' },
    { step: '映射到自己', body: '用测算生成个人报告再对照。' },
  ],
  faqs: [
    { question: '案例是真实用户吗？', answer: '含编辑案例与脱敏公开用户内容，均去除隐私。' },
    { question: '能照抄结论吗？', answer: '不能。结构相同不等于人生选择相同。' },
    { question: '和 /reports 区别？', answer: '案例库偏编辑精选；/reports 是持续自动公开流。' },
  ],
  related: [
    { href: '/reports', label: '实时公开流' },
    { href: '/knowledge', label: '知识库' },
    { href: '/analyze', label: '生成报告' },
  ],
  breadcrumbs: [
    { name: '首页', path: '/' },
    { name: '案例', path: '/cases' },
  ],
};

const DIMENSIONS: PageSeoGeoPack = {
  path: '/dimensions',
  slug: 'dimensions',
  name: '十维度研判中心',
  title: '十维度研判｜事业婚姻财运学业迁移等专题｜人生K线',
  description:
    '把人生问题拆成十个可验证维度：事业行业、婚姻、财运投资、学业、人居等，与主报告同一引擎。',
  keywords: ['十维度', '事业分析', '婚姻分析', '财运', '投资节奏', '人居'],
  answerSummary:
    '十维度把综合盘拆成专题切片：每个维度有核心问题、引擎标签与输出模板，避免一次报告信息过载，便于针对「现在卡在哪」下钻。',
  searchIntents: ['八字事业维度', '婚姻维度分析', '财运投资节奏', '学业事业方向'],
  entityKeywords: ['十维度', '事业', '婚姻', '财运', '投资', '学业', '人居', '合伙'],
  howTo: [
    { step: '选卡点维度', body: '先定位事业/关系/财运等主问题。' },
    { step: '结合主报告', body: '维度结论对齐用神与大运，不孤立解读。' },
    { step: '设验证点', body: '每个维度输出可观察的检查信号。' },
  ],
  faqs: [
    { question: '十个都要看吗？', answer: '不必。先看当前决策相关的 1–2 个维度。' },
    { question: '和工具中心重复吗？', answer: '维度偏专题研判页；工具偏交互运行与结果页。' },
    { question: '需要会员吗？', answer: '基础维度可体验；深度与保存能力随会员策略变化。' },
  ],
  related: [
    { href: '/tools', label: '工具中心' },
    { href: '/analyze', label: '主报告' },
    { href: '/teachers', label: '顾问角色' },
  ],
  breadcrumbs: [
    { name: '首页', path: '/' },
    { name: '十维度', path: '/dimensions' },
  ],
};

const DOCS: PageSeoGeoPack = {
  path: '/docs',
  slug: 'docs',
  name: '产品使用文档',
  title: '使用文档｜生辰填写·真太阳时·读第一份报告｜人生K线',
  description:
    '正确填写生辰、理解真太阳时、读懂第一份结构报告。减少误用，提高测算质量。',
  keywords: ['真太阳时', '生辰填写', '如何读八字报告', '使用文档'],
  answerSummary:
    '文档中心说明输入规范与报告读法：出生地时区、真太阳时、时辰不确定时的处理，以及报告章节的阅读顺序，帮助用户得到可复核的结构结论。',
  searchIntents: ['真太阳时怎么算', '八字时辰不准怎么办', '如何读命理报告'],
  entityKeywords: ['文档', '真太阳时', '时区', '生辰', '报告读法'],
  howTo: [
    { step: '读输入规范', body: '先保证生辰与地点可用。' },
    { step: '读报告顺序', body: '主轴→窗口→动作→验证。' },
    { step: '再进工具', body: '输入正确后再合婚/流年下钻。' },
  ],
  faqs: [
    { question: '时辰未知能测吗？', answer: '可以粗排并标注精度；关键决策建议补全时辰。' },
    { question: '为什么要真太阳时？', answer: '经度时差影响时柱，进而影响用神与细节。' },
    { question: '文档会更新吗？', answer: '随产品能力迭代，建议收藏本页。' },
  ],
  related: [
    { href: '/docs/birth-info', label: '生辰信息' },
    { href: '/docs/true-solar-time', label: '真太阳时' },
    { href: '/docs/read-first-report', label: '读第一份报告' },
    { href: '/analyze', label: '开始测算' },
  ],
  breadcrumbs: [
    { name: '首页', path: '/' },
    { name: '文档', path: '/docs' },
  ],
};

const COMMUNITY: PageSeoGeoPack = {
  path: '/community',
  slug: 'community',
  name: '结构讨论社区',
  title: '命理社区｜结构问答与场景讨论｜人生K线',
  description:
    '按分类浏览结构向问答与讨论。强调方法与验证，不鼓励恐吓式断语。可衔接顾问与测算。',
  keywords: ['命理社区', '八字问答', '结构讨论'],
  answerSummary:
    '社区按主题聚合用户问题与回应，鼓励把场景拆成结构、窗口与动作；复杂问题可转测算报告或顾问角色继续。',
  searchIntents: ['八字问答社区', '命理讨论区', '事业婚姻提问'],
  entityKeywords: ['社区', '问答', '分类', '顾问', '验证'],
  howTo: [
    { step: '选分类', body: '按事业、关系、学习等进入。' },
    { step: '描述场景', body: '写清阶段与已尝试动作，便于结构回答。' },
    { step: '对照自己的盘', body: '公开讨论后仍应用个人报告验证。' },
  ],
  faqs: [
    { question: '匿名吗？', answer: '支持隐私模式与脱敏展示，具体以发帖设置为准。' },
    { question: '官方会回答吗？', answer: '部分问题有结构化或官方向回应，不保证时效。' },
    { question: '能替代测算吗？', answer: '不能。社区是讨论层，决策请用个人报告。' },
  ],
  related: [
    { href: '/teachers', label: '顾问' },
    { href: '/chat', label: '对话' },
    { href: '/reports', label: '公开案例' },
  ],
  breadcrumbs: [
    { name: '首页', path: '/' },
    { name: '社区', path: '/community' },
  ],
};

const TEACHERS: PageSeoGeoPack = {
  path: '/teachers',
  slug: 'teachers',
  name: '顾问角色中心',
  title: '命理顾问角色｜事业时机财运总览老师｜人生K线',
  description:
    '按角色开启顾问对话：总览、事业、时机、财运等。带着报告上下文追问，输出可执行下一步。',
  keywords: ['命理顾问', '事业老师', '财运顾问', '时机顾问'],
  answerSummary:
    '顾问中心用角色化追问降低空白页压力：选定老师后带着报告或生辰上下文提问，回答对齐引擎真值并给出阶段动作。',
  searchIntents: ['在线命理顾问', '事业运咨询', '流年时机提问'],
  entityKeywords: ['顾问', '老师', '事业', '时机', '财运', '总览', '追问'],
  howTo: [
    { step: '选角色', body: '按当前问题选事业/时机/财运等。' },
    { step: '带上报告', body: '有报告时上下文更准。' },
    { step: '要验证点', body: '请顾问给出可观察检查信号。' },
  ],
  faqs: [
    { question: '是真人吗？', answer: '为结构化 AI 顾问角色，基于报告引擎约束。' },
    { question: '要先注册吗？', answer: '可先体验；保存与召回建议绑定邮箱。' },
    { question: '和聊天页关系？', answer: '老师入口会进入对话并带上角色与意图。' },
  ],
  related: [
    { href: '/chat', label: '对话' },
    { href: '/analyze', label: '先出报告' },
    { href: '/dimensions', label: '十维度' },
  ],
  breadcrumbs: [
    { name: '首页', path: '/' },
    { name: '顾问', path: '/teachers' },
  ],
};

const WORLD_YI: PageSeoGeoPack = {
  path: '/world-yi',
  slug: 'world-yi',
  name: '世界易',
  title: '世界易｜全球时位·迁移择城·结构方法｜人生K线',
  description:
    '世界易把结构判断放到全球时位与迁移场景：城市洞察、领域应用与英文入口，服务海内外华人。',
  keywords: ['世界易', '迁移择城', '海外华人运势', '城市洞察', 'World Yi'],
  answerSummary:
    '世界易是人生K线的全球方法层：在个人结构之上叠加城市、迁移与跨文化场景，提供中英内容入口与应用轨道，而不是单一地区民俗断语。',
  searchIntents: ['海外华人八字', '迁移择城', '世界易是什么', '城市运势观察'],
  entityKeywords: ['世界易', 'World Yi', '迁移', '城市', '全球', '华人', '时位'],
  howTo: [
    { step: '读方法', body: '从世界易总览理解时位框架。' },
    { step: '看城市/领域', body: '进入城市主题或应用轨道。' },
    { step: '回到个人盘', body: '用测算验证是否适配迁移与阶段。' },
  ],
  faqs: [
    { question: '和普通八字站区别？', answer: '更强调全球时位、迁移与跨市场表达。' },
    { question: '有英文吗？', answer: '有 /world-yi/en 等英文入口。' },
    { question: '能直接荐城吗？', answer: '提供结构观察与对照，不构成移民置业保证。' },
  ],
  related: [
    { href: '/world-yi/cities', label: '城市主题' },
    { href: '/world-yi/era-timing', label: '时代天时' },
    { href: '/world-yi/en', label: 'English gateway' },
    { href: '/insights', label: '城市洞察' },
    { href: '/analyze', label: '个人测算' },
  ],
  breadcrumbs: [
    { name: '首页', path: '/' },
    { name: '世界易', path: '/world-yi' },
  ],
  geoRegion: '全球',
  geoPlaceName: '海外华人社区',
};

const WORLD_YI_ERA_TIMING: PageSeoGeoPack = {
  path: '/world-yi/era-timing',
  slug: 'world-yi-era-timing',
  name: '世界易时代天时',
  title: '世界易时代天时｜星象周期·社会压力·技术阶段｜人生K线',
  description:
    '把天文/占星周期写成时代环境层：外行星拐点、土木社会压力、火逆摩擦窗口与四象阶段。可回测假设，不替代个人结构与大运。',
  keywords: [
    '时代天时',
    '三层星象',
    '天王星周期',
    '土木',
    '火星逆行',
    '四象阶段',
    '世界易',
    '天象',
  ],
  answerSummary:
    '世界易时代天时把星象与天象写成宏观环境层：外行星标时代拐点，土木标社会压力，火逆标摩擦窗口，四象阶段对照行业从车库到定规则。优先个人结构与大运，周期叙事可证伪、可回访，不构成投资或宿命结论。',
  searchIntents: [
    '天王星周期 AI',
    '三层星象分析法',
    '火星逆行冲突',
    '四象阶段论',
    '世界易时代天时',
    '占星与八字怎么结合',
  ],
  entityKeywords: [
    '世界易',
    '时代天时',
    '天王星',
    '土木',
    '火星逆行',
    '四象阶段',
    '环境层',
    '时位',
    '证伪',
    '人生K线',
  ],
  howTo: [
    { step: '读三层', body: '外行星 / 土木 / 火逆各对应世界易哪一层。' },
    { step: '对四象', body: '判断赛道阶段与用神发挥方式是否匹配。' },
    { step: '接个人盘', body: '用结构报告对齐大运，假设写入日历回访。' },
  ],
  faqs: [
    {
      question: '时代天时会不会取代八字？',
      answer: '不会。结构仍以日主用神为主；星象周期是时代天气，权重低于个人命盘。',
    },
    {
      question: '2030/2032 预测能信吗？',
      answer: '按开放假设处理：有证伪条件与回访日，不构成买卖点或宿命。',
    },
    {
      question: '和城市主题什么关系？',
      answer: '城市是空间环境，时代天时是时间环境；完整环境层需要两者对照。',
    },
    {
      question: '和星座工具重复吗？',
      answer: '星座工具偏个人表达；时代天时偏宏观周期与社会压力。',
    },
  ],
  related: [
    { href: '/world-yi', label: '世界易总入口' },
    { href: '/world-yi/cities', label: '城市主题' },
    { href: '/knowledge/world-yi-era-three-layer-stars', label: '三层星象' },
    { href: '/knowledge/world-yi-era-four-phase', label: '四象阶段' },
    { href: '/tools/zodiac', label: '个人星座' },
    { href: '/analyze?source=world_yi_era_timing', label: '结构报告' },
  ],
  breadcrumbs: [
    { name: '首页', path: '/' },
    { name: '世界易', path: '/world-yi' },
    { name: '时代天时', path: '/world-yi/era-timing' },
  ],
  geoRegion: '全球',
  geoPlaceName: '全球技术与华人社群',
};

const WORLD_YI_CITIES: PageSeoGeoPack = {
  path: '/world-yi/cities',
  slug: 'world-yi-cities',
  name: '世界易城市主题',
  title: '世界易城市主题｜迁城择地·环境层压力测试｜人生K线',
  description:
    '把城市当成环境层而非吉凶标签：对照成本、行业密度与节奏，接到居家环境维度与个人结构报告。覆盖国内与海外华人城市。',
  keywords: [
    '世界易城市',
    '迁移择城',
    '城市运势观察',
    '环境层',
    '海外华人城市',
    '迁城决策',
  ],
  answerSummary:
    '世界易城市主题把迁城/择地写成可验证的环境层压力测试：先看个人结构与时位，再对照城市成本、行业密度与节奏，最后用 30–90 天可逆动作验证。城市不是吉凶名单，也不构成移民置业保证。',
  searchIntents: [
    '迁移择城怎么判断',
    '城市运势观察',
    '海外华人适合哪座城',
    '八字迁城看什么',
    '世界易城市主题',
  ],
  entityKeywords: [
    '世界易',
    '城市主题',
    '环境层',
    '迁移',
    '择城',
    '节奏',
    '用神',
    '海外华人',
    '结构',
    '时位',
  ],
  howTo: [
    { step: '读方法', body: '先理解结构 → 时位 → 环境 → 动作 → 风险五层。' },
    { step: '选城市', body: '按区域打开城市观察卡，对照成本与行业密度。' },
    { step: '接到个人盘', body: '用结构报告与居家环境维度做压力测试，再设计可逆验证。' },
  ],
  faqs: [
    {
      question: '城市主题是幸运城市排行吗？',
      answer: '不是。我们不做吉凶名单，只把城市当环境压力测试，对齐结构与时位后再谈动作。',
    },
    {
      question: '能直接告诉我该去哪座城吗？',
      answer: '不能保证。提供环境层对照与节奏参考，最终要与签证、家庭、行业、现金流共同判断。',
    },
    {
      question: '和单独城市洞察页什么关系？',
      answer: '本页是总入口与方法说明；每座城有独立洞察页，可被搜索与 AI 引用。',
    },
    {
      question: '短视频里的「城市气场」怎么用？',
      answer: '可作话题入口，但结论必须落到成本、密度、节奏与可验证动作，避免恐吓式断语。',
    },
  ],
  related: [
    { href: '/world-yi', label: '世界易总入口' },
    { href: '/insights', label: '全部城市洞察' },
    { href: '/dimensions/living-environment', label: '居家环境维度' },
    { href: '/knowledge/world-yi-migration-stage-logic', label: '世界易迁移观' },
    { href: '/analyze?source=world_yi_cities', label: '生成结构报告' },
  ],
  breadcrumbs: [
    { name: '首页', path: '/' },
    { name: '世界易', path: '/world-yi' },
    { name: '城市主题', path: '/world-yi/cities' },
  ],
  geoRegion: '全球',
  geoPlaceName: '主要华人城市',
};

const LEARN: PageSeoGeoPack = {
  path: '/learn',
  slug: 'learn',
  name: '学习轨道',
  title: '命理学习轨道｜入门事业财富关系｜人生K线',
  description:
    '分轨道学习结构判断：入门、事业、财富、关系。边学边用报告与工具验证，避免碎片恐吓信息。',
  keywords: ['命理学习', '八字入门', '学习轨道', '事业轨', '财富轨'],
  answerSummary:
    '学习轨道把方法论拆成可完成的路径：入门建立读盘底座，事业/财富/关系轨用案例与练习把结构落到动作，并与测算、工具互相链接。',
  searchIntents: ['八字入门路径', '命理怎么系统学', '事业运势学习', '关系节奏学习'],
  entityKeywords: ['学习轨道', '入门', '事业', '财富', '关系', '案例', '人生K线'],
  howTo: [
    { step: '选轨道', body: '零基础选入门；有具体问题选事业/财富/关系。' },
    { step: '对照报告', body: '读完关键文后用自己的盘验证。' },
    { step: '练习动作', body: '每个节点只保留可验证小动作。' },
  ],
  faqs: [
    { question: '需要按顺序学吗？', answer: '入门建议按序；专题轨可按当前问题切入。' },
    { question: '和知识库区别？', answer: '学习轨强调路径与练习；知识库是检索型文章。' },
    { question: '学完要测算吗？', answer: '建议生成报告，把概念落到自己的结构上。' },
  ],
  related: [
    { href: '/knowledge', label: '知识库' },
    { href: '/cases', label: '案例' },
    { href: '/analyze', label: '测算' },
    { href: '/docs', label: '文档' },
  ],
  breadcrumbs: [
    { name: '首页', path: '/' },
    { name: '学习', path: '/learn' },
  ],
};

const INSIGHTS: PageSeoGeoPack = {
  path: '/insights',
  slug: 'insights',
  name: '城市与环境洞察',
  title: '城市洞察｜迁移择城·环境层节奏｜世界易·人生K线',
  description:
    '城市与环境下的成本结构、角色密度与节奏差异，用于迁移、择城与跨文化决策参考。',
  keywords: ['城市洞察', '迁移择城', '环境层', '海外华人', '世界易'],
  answerSummary:
    '洞察层把个人结构放到城市与环境：观察成本、角色密度与节奏差异，帮助迁移与选址决策，不构成置业或移民保证。',
  searchIntents: ['迁移择城', '城市运势观察', '海外华人环境', '上海城市洞察'],
  entityKeywords: ['城市', '迁移', '环境层', '世界易', '华人', '择城'],
  howTo: [
    { step: '选城市/主题', body: '从洞察列表进入具体城市或环境文。' },
    { step: '对照个人盘', body: '用测算看阶段是否匹配迁移窗口。' },
    { step: '落到验证', body: '设定观察指标，避免只凭感觉迁城。' },
  ],
  faqs: [
    { question: '洞察能直接告诉我去哪吗？', answer: '不能保证。只提供环境层对照与节奏参考。' },
    { question: '和世界易关系？', answer: '洞察是世界易方法在城市/环境上的应用内容。' },
    { question: '有英文吗？', answer: '部分城市有英文姊妹内容，见世界易英文入口。' },
  ],
  related: [
    { href: '/world-yi/cities', label: '城市主题总入口' },
    { href: '/world-yi', label: '世界易' },
    { href: '/world-yi/en', label: 'English' },
    { href: '/analyze', label: '个人测算' },
  ],
  breadcrumbs: [
    { name: '首页', path: '/' },
    { name: '洞察', path: '/insights' },
  ],
  geoRegion: '全球',
  geoPlaceName: '主要华人城市',
};

const HEHUN: PageSeoGeoPack = {
  path: '/hehun',
  slug: 'hehun',
  name: '合婚双盘',
  title: '合婚双盘分析｜双方八字匹配·关系节奏｜人生K线',
  description:
    '双方生辰合盘：看匹配结构、关系节奏与协作边界。游客可先看，绑定后可回看。',
  keywords: ['合婚', '八字合盘', '姻缘匹配', '关系节奏'],
  answerSummary:
    '合婚工具并排双方四柱与用神关系，输出匹配结构、易摩擦点与阶段节奏建议，帮助沟通协作而非判定「命中注定」。',
  searchIntents: ['在线合婚', '八字合盘免费', '情侣八字匹配', '夫妻合婚分析'],
  entityKeywords: ['合婚', '双盘', '匹配', '关系', '用神', '协作'],
  howTo: [
    { step: '填双方生辰', body: '双方日期时辰地点尽量完整。' },
    { step: '看匹配主轴', body: '先读结构匹配再看摩擦点。' },
    { step: '落到协作', body: '用窗口与动作改善沟通，而非贴标签。' },
  ],
  faqs: [
    { question: '合婚能决定结婚吗？', answer: '不能。只提供结构与节奏参考。' },
    { question: '一方时辰未知？', answer: '可先粗排并标注不确定；关键决策建议补全。' },
    { question: '结果保存吗？', answer: '登录或绑定邮箱后更易跨设备回看。' },
  ],
  related: [
    { href: '/dimensions/marriage', label: '婚姻维度' },
    { href: '/analyze', label: '个人报告' },
    { href: '/reports', label: '公开案例' },
  ],
  breadcrumbs: [
    { name: '首页', path: '/' },
    { name: '合婚', path: '/hehun' },
  ],
};

const PACKS: Record<string, PageSeoGeoPack> = {
  home: HOME,
  '/': HOME,
  analyze: ANALYZE,
  '/analyze': ANALYZE,
  reports: REPORTS,
  '/reports': REPORTS,
  tools: TOOLS,
  '/tools': TOOLS,
  knowledge: KNOWLEDGE,
  '/knowledge': KNOWLEDGE,
  cases: CASES,
  '/cases': CASES,
  dimensions: DIMENSIONS,
  '/dimensions': DIMENSIONS,
  docs: DOCS,
  '/docs': DOCS,
  community: COMMUNITY,
  '/community': COMMUNITY,
  teachers: TEACHERS,
  '/teachers': TEACHERS,
  'world-yi': WORLD_YI,
  '/world-yi': WORLD_YI,
  'world-yi-cities': WORLD_YI_CITIES,
  '/world-yi/cities': WORLD_YI_CITIES,
  'world-yi-era-timing': WORLD_YI_ERA_TIMING,
  '/world-yi/era-timing': WORLD_YI_ERA_TIMING,
  hehun: HEHUN,
  '/hehun': HEHUN,
  learn: LEARN,
  '/learn': LEARN,
  insights: INSIGHTS,
  '/insights': INSIGHTS,
};

export function getPageSeoGeoPack(pathOrSlug: string): PageSeoGeoPack | null {
  const key = `${pathOrSlug || ''}`.trim();
  if (!key) return null;
  if (PACKS[key]) return PACKS[key];
  const noSlash = key.startsWith('/') ? key : `/${key}`;
  if (PACKS[noSlash]) return PACKS[noSlash];
  const bare = key.replace(/^\//, '');
  return PACKS[bare] || null;
}

export function listPageSeoGeoPacks(): PageSeoGeoPack[] {
  const seen = new Set<string>();
  const out: PageSeoGeoPack[] = [];
  for (const pack of Object.values(PACKS)) {
    if (seen.has(pack.path)) continue;
    seen.add(pack.path);
    out.push(pack);
  }
  return out;
}

/** Soft GEO readiness for packs (summary + intents + entities + faqs). */
export function isPagePackGeoReady(pack: PageSeoGeoPack | null | undefined): boolean {
  if (!pack) return false;
  if ((pack.answerSummary || '').trim().length < 40) return false;
  if ((pack.searchIntents || []).length < 3) return false;
  if ((pack.entityKeywords || []).length < 5) return false;
  if ((pack.faqs || []).length < 3) return false;
  return true;
}
