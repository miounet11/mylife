export type ExperienceSurfaceKey =
  | 'home'
  | 'analyze'
  | 'result'
  | 'tools'
  | 'toolDetail'
  | 'toolResult'
  | 'knowledge'
  | 'knowledgeArticle'
  | 'cases'
  | 'caseArticle'
  | 'chat'
  | 'events'
  | 'profile'
  | 'history';

export type ExperienceIconKey =
  | 'birth'
  | 'overview'
  | 'deepen'
  | 'tool'
  | 'validate'
  | 'learn'
  | 'system'
  | 'visual';

export interface ProductExperiencePrinciple {
  key: string;
  title: string;
  description: string;
}

export interface ProductExperienceStep {
  key: string;
  title: string;
  description: string;
  href: string;
  action: string;
  icon: ExperienceIconKey;
}

export interface ProductPurposePath {
  key: string;
  title: string;
  description: string;
  href: string;
  action: string;
  icon: ExperienceIconKey;
}

export interface ProductSurfaceRole {
  surface: ExperienceSurfaceKey;
  label: string;
  job: string;
  primaryAction: string;
  secondaryAction: string;
  layoutRule: string;
  interactionRule: string;
  successMetric: string;
  readingOrder: string[];
  nextSteps: ProductSurfaceNextStep[];
}

export interface ProductSurfaceNextStep {
  key: string;
  title: string;
  description: string;
  href: string;
  action: string;
  emphasis?: 'primary' | 'secondary';
}

export interface ToolProblemLineGuide {
  prompt: string;
  firstStep: string;
  nextStep: string;
}

export const productExperiencePrinciples: ProductExperiencePrinciple[] = [
  {
    key: 'first-value-fast',
    title: '先给第一份可读判断',
    description: '入口不解释完整体系，先帮助用户完成出生信息确认并进入首份报告。',
  },
  {
    key: 'goal-routing',
    title: '按用户目的分流',
    description: '学习、测算、解决具体问题、理解世界易、分享传播分别进入不同路径。',
  },
  {
    key: 'progressive-disclosure',
    title: '复杂内容渐进展开',
    description: '首屏只保留主判断和下一步，证据、趋势、专项和内容网络放在后续层级。',
  },
  {
    key: 'closed-loop',
    title: '形成验证闭环',
    description: '报告之后必须接到追问、工具、事件记录和回访验证，避免一次性阅读后流失。',
  },
];

export const productActivationPath: ProductExperienceStep[] = [
  {
    key: 'birth-input',
    title: '确认出生信息',
    description: '只先确认时间、地点和真太阳时，不要求用户先理解复杂术语。',
    href: '#analysis-form',
    action: '开始填写',
    icon: 'birth',
  },
  {
    key: 'first-report',
    title: '先看一页总览',
    description: '首份结果只回答当前阶段、先做什么、先别做什么。',
    href: '/knowledge/how-to-read-bazi-report',
    action: '学习读法',
    icon: 'overview',
  },
  {
    key: 'deep-question',
    title: '追问一个关键问题',
    description: '把最卡的一件事继续问深，而不是同时打开所有解释。',
    href: '/chat',
    action: '进入追问',
    icon: 'deepen',
  },
  {
    key: 'single-tool',
    title: '进入一个专项工具',
    description: '主线明确后，只进入最相关的一条问题线和一个工具。',
    href: '/tools',
    action: '找工具',
    icon: 'tool',
  },
  {
    key: 'event-loop',
    title: '沉淀事件并回看',
    description: '把现实节点记录下来，后续用真实反馈校正判断。',
    href: '/events',
    action: '记录事件',
    icon: 'validate',
  },
];

export const productPurposePaths: ProductPurposePath[] = [
  {
    key: 'start-analysis',
    title: '我现在想先测算',
    description: '从出生信息确认开始，快速拿到首份结构总览。',
    href: '#analysis-form',
    action: '开始测算',
    icon: 'birth',
  },
  {
    key: 'learn-system',
    title: '我想先学习怎么读',
    description: '从真太阳时、报告读法、五行结构和案例复盘建立基础理解。',
    href: '/knowledge/topics',
    action: '进入学习路径',
    icon: 'learn',
  },
  {
    key: 'solve-problem',
    title: '我有具体问题要解决',
    description: '按事业、财富、关系、健康、家庭、迁移等问题线进入工具。',
    href: '/tools',
    action: '进入工具导航',
    icon: 'tool',
  },
  {
    key: 'understand-world-yi',
    title: '我想理解世界易体系',
    description: '看产品、命理判断、现实行动和内容系统之间的完整关系。',
    href: '/world-yi',
    action: '了解世界易',
    icon: 'system',
  },
  {
    key: 'visual-explainers',
    title: '我想快速看图理解',
    description: '用图片说明产品结构、报告路径、工具体系和世界易知识。',
    href: '/visual-assets',
    action: '进入图片说明',
    icon: 'visual',
  },
];

export const productSurfaceRoles: ProductSurfaceRole[] = [
  {
    surface: 'home',
    label: '入口页',
    job: '让新用户最快完成第一次测算，并给老用户续接最近进度。',
    primaryAction: '开始测算',
    secondaryAction: '按目的进入学习、工具、世界易或图片说明。',
    layoutRule: '首屏放表单和路径，不堆知识库和工具清单。',
    interactionRule: '用户不用先理解世界易，先完成一次低负担输入。',
    successMetric: '测算表单开始率、首份报告生成率、老用户恢复路径点击率。',
    readingOrder: ['出生信息', '第一份报告', '追问', '一个工具', '事件验证'],
    nextSteps: [
      {
        key: 'home-analyze',
        title: '直接开始测算',
        description: '把首页首屏变成最短路径，出生信息确认后直接进入结果页。',
        href: '#analysis-form',
        action: '开始填写',
        emphasis: 'primary',
      },
      {
        key: 'home-learn',
        title: '先按目的学习',
        description: '不准备填写信息的用户，先进入专题地图建立读法。',
        href: '/knowledge/topics',
        action: '进入学习',
      },
    ],
  },
  {
    surface: 'analyze',
    label: '录入页',
    job: '只处理出生信息确认、上下文承接和提交反馈。',
    primaryAction: '生成首份判断',
    secondaryAction: '解释填写规则，承接来源工具或内容。',
    layoutRule: '主输入优先，辅助解释和图片放在次级区域。',
    interactionRule: '表单只问必要信息，其他说明必须围绕“为什么要这样填”。',
    successMetric: '表单完成率、真太阳时确认率、提交后进入结果页成功率。',
    readingOrder: ['确认时间', '确认地点', '检查真太阳时', '提交生成', '回到来源任务'],
    nextSteps: [
      {
        key: 'analyze-submit',
        title: '完成必要信息',
        description: '先生成首份报告，其他深入解释放到结果页再展开。',
        href: '#analyze-workspace',
        action: '开始填写',
        emphasis: 'primary',
      },
      {
        key: 'analyze-cases',
        title: '不确定怎么填',
        description: '先看案例和读法，理解系统如何把信息转成判断。',
        href: '/cases',
        action: '先看案例',
      },
    ],
  },
  {
    surface: 'result',
    label: '结果页',
    job: '先让用户看懂主判断，再进入深入报告、追问、工具和事件验证。',
    primaryAction: '读懂首屏主判断',
    secondaryAction: '展开深入层或进入一个专项工具。',
    layoutRule: '总览、三步动作、深入折叠，避免所有模块同时摊开。',
    interactionRule: '先回答“现在怎么看、下一步做什么、不要做什么”，再让用户自己选择深入层。',
    successMetric: '追问点击率、深入报告展开率、工具进入率、事件记录率。',
    readingOrder: ['主判断', '三步动作', '深入报告', '专项工具', '事件验证'],
    nextSteps: [
      {
        key: 'result-chat',
        title: '追问最关键的问题',
        description: '把报告中的一个判断继续问深，避免在同一页堆满所有解释。',
        href: '/chat',
        action: '进入追问',
        emphasis: 'primary',
      },
      {
        key: 'result-tools',
        title: '只进入一个专项工具',
        description: '按报告主线选择一个工具继续拆，不同时打开多条问题线。',
        href: '/tools',
        action: '找工具',
      },
      {
        key: 'result-events',
        title: '记录现实节点',
        description: '把后续发生的事件记录回来，用真实反馈校正判断。',
        href: '/events',
        action: '记录事件',
      },
    ],
  },
  {
    surface: 'tools',
    label: '工具页',
    job: '把 120 个工具收敛成问题线，减少乱点。',
    primaryAction: '选择一条问题线',
    secondaryAction: '推荐少量首轮工具，并接回报告和内容证据。',
    layoutRule: '先分类分流，再展示少量推荐，不展示完整大清单。',
    interactionRule: '用户先选问题线，再跑一个工具，工具结果继续回到报告、追问和内容证据。',
    successMetric: '问题线选择率、首个工具运行率、工具结果复访率。',
    readingOrder: ['是否已有报告', '选择问题线', '首轮工具', '结果复访', '内容证据'],
    nextSteps: [
      {
        key: 'tools-analyze',
        title: '还没有报告',
        description: '先建立个人底盘，再让工具继承主报告上下文。',
        href: '/analyze',
        action: '先做综合判断',
        emphasis: 'primary',
      },
      {
        key: 'tools-problem-lines',
        title: '已经有报告',
        description: '从最卡的一条问题线进入，不要一次性跑很多工具。',
        href: '#problem-lines',
        action: '选问题线',
      },
    ],
  },
  {
    surface: 'knowledge',
    label: '内容页',
    job: '解释报告和工具背后的判断方法，提供案例证据和学习路径。',
    primaryAction: '理解一个概念或案例',
    secondaryAction: '回到测算、工具或相关内容网络。',
    layoutRule: '内容只服务下一步判断，不做无目标信息流。',
    interactionRule: '每篇内容都要回答“这能帮助用户下一步判断什么”，并接回报告或工具。',
    successMetric: '专题进入率、内容到测算转化率、内容到工具/案例点击率。',
    readingOrder: ['专题地图', '核心概念', '案例证据', '工具应用', '个人测算'],
    nextSteps: [
      {
        key: 'knowledge-topics',
        title: '按专题学习',
        description: '先从专题地图建立方法，不在内容列表里随机浏览。',
        href: '/knowledge/topics',
        action: '看专题地图',
        emphasis: 'primary',
      },
      {
        key: 'knowledge-analyze',
        title: '回到个人判断',
        description: '读完方法后把问题带回自己的出生信息和报告。',
        href: '/analyze',
        action: '开始分析',
      },
    ],
  },
  {
    surface: 'knowledgeArticle',
    label: '知识详情页',
    job: '让用户读懂一个概念，并立刻知道它对应哪类测算、工具和案例。',
    primaryAction: '读完一个概念',
    secondaryAction: '进入个人测算、专题地图、相关工具或案例。',
    layoutRule: '正文优先，右侧只保留分析、工具、案例和专题路径，不做无关推荐。',
    interactionRule: '文章必须把抽象概念转成“下一步该验证什么”，而不是停留在解释层。',
    successMetric: '文章读完率、文章到测算转化率、文章到工具/案例点击率。',
    readingOrder: ['文章摘要', '核心概念', '专题路径', '相关工具', '个人测算'],
    nextSteps: [
      {
        key: 'knowledge-article-analyze',
        title: '把概念带回自己',
        description: '读完原理后进入分析入口，验证它落到个人结构上是否成立。',
        href: '/analyze',
        action: '开始分析',
        emphasis: 'primary',
      },
      {
        key: 'knowledge-article-topics',
        title: '回到专题地图',
        description: '如果还没有形成体系，先回专题地图继续顺序阅读。',
        href: '/knowledge/topics',
        action: '看专题',
      },
    ],
  },
  {
    surface: 'cases',
    label: '案例页',
    job: '用真实场景降低理解门槛，让用户看到结构、阶段、环境和动作如何落地。',
    primaryAction: '找到相似场景',
    secondaryAction: '回到自己的测算、工具或同类案例。',
    layoutRule: '先展示场景和关键转折，不把案例页做成单纯文章列表。',
    interactionRule: '案例只服务“我和这个场景哪里相似、下一步该验证什么”。',
    successMetric: '案例到测算转化率、同类案例继续阅读率、案例到工具点击率。',
    readingOrder: ['相似场景', '结构原因', '阶段变化', '动作选择', '回到自己'],
    nextSteps: [
      {
        key: 'cases-analyze',
        title: '把相似问题带回自己',
        description: '看完案例后进入分析页，验证自己的结构与阶段。',
        href: '/analyze',
        action: '开始分析',
        emphasis: 'primary',
      },
      {
        key: 'cases-tools',
        title: '按问题线继续拆',
        description: '如果已经有报告，直接进入对应工具继续细分。',
        href: '/tools',
        action: '找工具',
      },
    ],
  },
  {
    surface: 'caseArticle',
    label: '案例详情页',
    job: '把一个真实场景拆成结构、阶段、环境和动作，帮助用户判断自己是否相似。',
    primaryAction: '看懂一个场景',
    secondaryAction: '回到个人测算、同类案例、相关工具或方法论。',
    layoutRule: '案例正文优先，但侧栏必须保留快速分析、工具、知识和世界易路径。',
    interactionRule: '案例不能让用户只围观别人，必须引导用户验证自己的结构。',
    successMetric: '案例读完率、案例到测算转化率、案例到工具点击率。',
    readingOrder: ['场景摘要', '结构原因', '阶段变化', '相关工具', '回到自己'],
    nextSteps: [
      {
        key: 'case-article-analyze',
        title: '验证自己是否相似',
        description: '不要只按表面情节判断，先用出生信息验证自己的结构和阶段。',
        href: '/analyze',
        action: '开始分析',
        emphasis: 'primary',
      },
      {
        key: 'case-article-cases',
        title: '继续看同类案例',
        description: '如果还在建立理解，可以先读同类案例观察共性。',
        href: '/cases',
        action: '返回案例库',
      },
    ],
  },
  {
    surface: 'toolDetail',
    label: '工具详情页',
    job: '让用户确认这个工具是否解决当前问题，并在有报告上下文时直接运行。',
    primaryAction: '运行一个工具',
    secondaryAction: '先做综合报告、进入追问或返回问题线。',
    layoutRule: '工具价值、适合人群和运行入口在首屏；案例、FAQ、付费深测放在后续。',
    interactionRule: '工具页必须避免让用户连续试错，先判断是否已有报告和是否匹配当前问题。',
    successMetric: '工具开始率、综合报告门槛转化率、工具运行成功率。',
    readingOrder: ['适合问题', '是否已有报告', '运行工具', '结果承接', '深测升级'],
    nextSteps: [
      {
        key: 'tool-detail-run',
        title: '运行当前工具',
        description: '已有报告时直接运行，保持一次只解决一个具体问题。',
        href: '#tool-runner',
        action: '开始工具',
        emphasis: 'primary',
      },
      {
        key: 'tool-detail-analyze',
        title: '先建立综合底盘',
        description: '没有报告时先做综合判断，避免工具缺少个人上下文。',
        href: '/analyze',
        action: '先做测算',
      },
    ],
  },
  {
    surface: 'toolResult',
    label: '工具结果页',
    job: '把一次工具结果接回报告、追问、工具推荐和长期记忆。',
    primaryAction: '读懂工具结论',
    secondaryAction: '继续深问、返回综合报告或进入下一工具。',
    layoutRule: '先显示当前建议和风险，再展示深度解释、记忆、相关工具和升级服务。',
    interactionRule: '工具结果必须形成复访闭环，不能让用户读完一个单项结果就断掉。',
    successMetric: '工具结果追问率、返回报告率、下一工具点击率、工具记忆复访率。',
    readingOrder: ['当前建议', '风险提醒', '继续深问', '返回报告', '下一工具'],
    nextSteps: [
      {
        key: 'tool-result-chat',
        title: '继续深问这次结果',
        description: '围绕本次工具结论追问为什么成立、先做什么、要防什么。',
        href: '/chat',
        action: '继续深问',
        emphasis: 'primary',
      },
      {
        key: 'tool-result-tools',
        title: '只接一个下一工具',
        description: '按这次结论继续下钻，不重新打开工具大清单乱选。',
        href: '/tools',
        action: '继续工具',
      },
    ],
  },
  {
    surface: 'chat',
    label: '追问页',
    job: '承接报告、工具和事件上下文，把用户的下一步问题收敛成可执行动作。',
    primaryAction: '追问一个关键问题',
    secondaryAction: '返回报告、管理事件或切换专项。',
    layoutRule: '聊天工作台优先，右侧只放上下文、专项切换和返回路径。',
    interactionRule: '追问必须围绕一个具体问题，不重新变成泛问答入口。',
    successMetric: '追问发起率、带报告追问率、追问后返回报告/事件率。',
    readingOrder: ['上下文确认', '选择专项', '提出问题', '收敛动作', '回到验证'],
    nextSteps: [
      {
        key: 'chat-workbench',
        title: '开始一个追问',
        description: '只围绕当前最关键问题继续拆，避免一次问太多方向。',
        href: '#chat-workbench',
        action: '开始追问',
        emphasis: 'primary',
      },
      {
        key: 'chat-events',
        title: '把结论放回事件',
        description: '追问后的动作需要进入事件验证，后续才能校正。',
        href: '/events',
        action: '管理事件',
      },
    ],
  },
  {
    surface: 'events',
    label: '事件页',
    job: '把现实事件、提醒、验证和纠偏变成报告质量提升的反馈系统。',
    primaryAction: '补回验证结果',
    secondaryAction: '创建事件、纠偏追问或返回关联报告。',
    layoutRule: '验证队列优先，日历和列表用于管理，不抢待验证与待纠偏任务。',
    interactionRule: '事件页必须优先处理过期验证和偏差样本，避免只做记录工具。',
    successMetric: '事件创建率、待验证处理率、偏差纠偏追问率。',
    readingOrder: ['待验证', '偏差样本', '未来节点', '日历列表', '回到报告'],
    nextSteps: [
      {
        key: 'events-validate',
        title: '补回验证结果',
        description: '先处理已发生但未反馈的事件，让报告持续校正。',
        href: '#validation-workbench',
        action: '处理验证',
        emphasis: 'primary',
      },
      {
        key: 'events-chat',
        title: '围绕偏差继续追问',
        description: '如果现实反馈和判断不一致，进入追问修正结构、阶段或动作。',
        href: '/chat',
        action: '进入纠偏',
      },
    ],
  },
  {
    surface: 'profile',
    label: '档案页',
    job: '把用户的报告、工具、事件、订阅和最近任务恢复成一个连续工作台。',
    primaryAction: '恢复最近任务',
    secondaryAction: '打开最新报告、继续追问或补回事件。',
    layoutRule: '先放恢复路径和状态，不把档案页做成静态资料页。',
    interactionRule: '默认续接上次没完成的判断任务，减少用户重新找入口的成本。',
    successMetric: '恢复任务点击率、最新报告打开率、事件补录率、更新中心进入率。',
    readingOrder: ['最近任务', '最新报告', '工具历史', '事件验证', '订阅更新'],
    nextSteps: [
      {
        key: 'profile-resume',
        title: '恢复最近任务',
        description: '接回最近报告、工具历史和事件记录，继续完成判断闭环。',
        href: '/history',
        action: '查看历史',
        emphasis: 'primary',
      },
      {
        key: 'profile-events',
        title: '补回现实事件',
        description: '用真实反馈校正报告，不让判断停留在一次生成。',
        href: '/events',
        action: '管理事件',
      },
    ],
  },
  {
    surface: 'history',
    label: '历史页',
    job: '把历史报告和事件反馈变成复盘工作台，优先处理待验证和待纠偏样本。',
    primaryAction: '复盘最关键的一条记录',
    secondaryAction: '补回事件反馈、进入纠偏追问或打开最近报告。',
    layoutRule: '先展示待验证、待纠偏和最近报告，再展示完整列表。',
    interactionRule: '历史页不是归档页，而是把过去样本转成下一轮判断质量提升。',
    successMetric: '待验证事件处理率、偏差样本追问率、报告复访率。',
    readingOrder: ['待验证', '待纠偏', '最近报告', '关联事件', '再次分析'],
    nextSteps: [
      {
        key: 'history-events',
        title: '先补回事件反馈',
        description: '把已经发生的结果标注回来，判断系统才有校正样本。',
        href: '/events',
        action: '进入事件页',
        emphasis: 'primary',
      },
      {
        key: 'history-analyze',
        title: '重新生成一份判断',
        description: '当现实阶段已经变化，可以新建分析形成新的比较样本。',
        href: '/analyze',
        action: '新建分析',
      },
    ],
  },
];

export const productTrustSignals = [
  '只需确认时间和地点',
  '先出一页可读总览',
  '深入内容可逐层展开',
  '工具和事件持续复访',
] as const;

export const analyzeOutcomeCards = [
  { label: '分析顺序', value: '结构 -> 阶段 -> 环境 -> 动作' },
  { label: '时间基准', value: '真太阳时优先' },
  { label: '首份结果', value: '先看一页总览' },
  { label: '后续路径', value: '追问 / 工具 / 验证' },
] as const;

export const toolEntryModes = [
  {
    key: 'no-report',
    title: '还没有报告',
    description: '先建立个人底盘，再让工具承接主报告上下文。',
    href: '/analyze',
    action: '先做综合判断',
  },
  {
    key: 'has-report',
    title: '已经有报告',
    description: '直接选择最卡的问题线，只跑一个最相关的工具。',
    href: '#problem-lines',
    action: '选择问题线',
  },
  {
    key: 'just-learning',
    title: '只是想学习',
    description: '先看工具矩阵和案例证据，不急着提交个人信息。',
    href: '/knowledge/topics',
    action: '先看学习路径',
  },
] as const;

export const toolProblemLineGuides: Record<string, ToolProblemLineGuide> = {
  career: {
    prompt: '工作卡住、岗位不适配、升职转岗、团队压力。',
    firstStep: '先判断角色和阶段，再决定推进还是换线。',
    nextStep: '适合接岗位适配、升迁窗口和团队关系工具。',
  },
  wealth: {
    prompt: '收入、现金流、投资、扩张、守财能力。',
    firstStep: '先拆赚钱方式和风险边界，再看机会。',
    nextStep: '适合接现金流、投资节奏和守财能力工具。',
  },
  relationship: {
    prompt: '恋爱、婚姻、复合、边界、关系消耗。',
    firstStep: '先看节奏和边界，不要一上来只问结果。',
    nextStep: '适合接关系节奏、复合窗口和长期匹配工具。',
  },
  health: {
    prompt: '睡眠、压力、恢复、长期透支、身体节律。',
    firstStep: '先找恢复秩序，再看推进窗口。',
    nextStep: '适合接恢复节律、压力源和年度健康窗口工具。',
  },
  family: {
    prompt: '父母、孩子、照护、家宅、责任排序。',
    firstStep: '先排责任顺序，再谈情绪和关系修复。',
    nextStep: '适合接家庭责任、亲子节奏和家宅压力工具。',
  },
  migration: {
    prompt: '换城市、出国、回国、移民、海外身份成本。',
    firstStep: '先看阶段能不能承受移动成本。',
    nextStep: '适合接城市迁移、海外窗口和身份成本工具。',
  },
  timing: {
    prompt: '今年、这个月、某个节点该不该推进。',
    firstStep: '先定窗口强弱，再决定动作大小。',
    nextStep: '适合接流年、月度窗口和择时判断工具。',
  },
  application: {
    prompt: '起名、择时、家宅、签约、寻物等高频应用。',
    firstStep: '先用轻量工具快速判断，再沉淀到报告。',
    nextStep: '适合接起名、择日、风水和具体应用工具。',
  },
};

export function getSurfaceRole(surface: ExperienceSurfaceKey) {
  return productSurfaceRoles.find((item) => item.surface === surface);
}
