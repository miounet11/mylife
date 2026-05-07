export type ProductDocCategoryKey =
  | 'start'
  | 'workflows'
  | 'reading'
  | 'account'
  | 'safety';

export interface ProductDocCategory {
  key: ProductDocCategoryKey;
  title: string;
  shortTitle: string;
  order: number;
}

export interface ProductDocStep {
  title: string;
  body: string;
  href?: string;
  action?: string;
  tips?: string[];
}

export interface ProductDocSection {
  title: string;
  lead?: string;
  bullets?: string[];
  steps?: ProductDocStep[];
  callout?: {
    title: string;
    body: string;
    href?: string;
    action?: string;
  };
}

export interface ProductDocFaqItem {
  question: string;
  answer: string;
}

export interface ProductDoc {
  slug: string;
  title: string;
  shortTitle: string;
  category: ProductDocCategoryKey;
  summary: string;
  readTime: string;
  updatedAt: string;
  priority: 'P0' | 'P1' | 'P2' | 'P3';
  tags: string[];
  entryHrefs: Array<{
    label: string;
    href: string;
  }>;
  sections: ProductDocSection[];
  faq: ProductDocFaqItem[];
  relatedSlugs: string[];
}

export const productDocCategories: ProductDocCategory[] = [
  { key: 'start', title: '快速开始', shortTitle: '开始', order: 1 },
  { key: 'workflows', title: '核心流程', shortTitle: '流程', order: 2 },
  { key: 'reading', title: '读法与方法', shortTitle: '读法', order: 3 },
  { key: 'account', title: '档案与更新', shortTitle: '档案', order: 4 },
  { key: 'safety', title: '边界与安全', shortTitle: '安全', order: 5 },
];

export const productDocs: ProductDoc[] = [
  {
    slug: 'quick-start',
    title: '快速开始',
    shortTitle: '快速开始',
    category: 'start',
    summary: '从出生信息到第一份报告的最短路径。',
    readTime: '3 分钟',
    updatedAt: '2026-05-05',
    priority: 'P0',
    tags: ['开始', '报告', '首份判断'],
    entryHrefs: [
      { label: '开始填写', href: '/analyze' },
      { label: '工具中心', href: '/tools' },
    ],
    sections: [
      {
        title: '最短路径',
        steps: [
          {
            title: '填写出生信息',
            body: '填写出生日期、出生时间、出生地点和性别。',
            href: '/analyze',
            action: '开始填写',
            tips: ['时间不确定时先选择最接近的时间段。', '出生地用于真太阳时校正。'],
          },
          {
            title: '查看第一份报告',
            body: '先看主判断、阶段提示和下一步动作。',
            tips: ['不要从细节术语开始读。', '先确认页面顶部的主结论。'],
          },
          {
            title: '追问一个关键问题',
            body: '把当前最卡的问题带到结构追问。',
            href: '/chat',
            action: '进入追问',
          },
          {
            title: '进入一个工具',
            body: '按事业、财富、关系、健康、家庭、迁移或阶段窗口选择单项工具。',
            href: '/tools',
            action: '找工具',
          },
          {
            title: '记录现实事件',
            body: '把结果之后发生的重要节点记录下来，后续用来回看。',
            href: '/events',
            action: '记录事件',
          },
        ],
      },
      {
        title: '第一次使用只看这些',
        bullets: ['出生信息是否完整', '主判断是什么', '现在更适合推进还是观察', '下一步先做什么', '哪些事项先不要做'],
      },
    ],
    faq: [
      { question: '第一次使用必须先读知识库吗？', answer: '不用。先生成报告，再按需要打开文档或知识内容。' },
      { question: '没有明确问题可以开始吗？', answer: '可以。先生成结构总览，再用工具或追问细化。' },
    ],
    relatedSlugs: ['birth-info', 'read-first-report', 'structured-chat'],
  },
  {
    slug: 'birth-info',
    title: '出生信息填写',
    shortTitle: '出生信息',
    category: 'start',
    summary: '出生日期、时间、地点和真太阳时的填写规则。',
    readTime: '5 分钟',
    updatedAt: '2026-05-05',
    priority: 'P0',
    tags: ['出生时间', '出生地', '真太阳时'],
    entryHrefs: [
      { label: '填写出生信息', href: '/analyze' },
    ],
    sections: [
      {
        title: '必填信息',
        bullets: ['出生日期', '出生时间', '出生地点', '性别'],
      },
      {
        title: '时间不确定',
        lead: '先保证流程能完成，再在报告后做二次校正。',
        steps: [
          { title: '知道大概时段', body: '选择最接近的小时。' },
          { title: '只知道上午或下午', body: '先选择中间时间，再在追问里说明不确定。' },
          { title: '完全不知道', body: '先不要硬填精确时间，优先补充现实验证事件。', href: '/events', action: '记录事件' },
        ],
      },
      {
        title: '真太阳时',
        bullets: ['出生地点会影响时刻校正。', '跨时区、夏令时和节气边界会影响判断精度。', '系统会在录入流程中处理必要校正。'],
      },
    ],
    faq: [
      { question: '出生地点要精确到哪里？', answer: '优先填写城市。能确认医院或区县时再补充更细信息。' },
      { question: '农历生日可以直接填吗？', answer: '当前主流程优先使用公历日期；不确定时先转换后再填。' },
    ],
    relatedSlugs: ['true-solar-time', 'quick-start', 'privacy-safety'],
  },
  {
    slug: 'read-first-report',
    title: '第一份报告怎么读',
    shortTitle: '报告读法',
    category: 'reading',
    summary: '先读主判断、阶段、风险和动作，再进入深入内容。',
    readTime: '6 分钟',
    updatedAt: '2026-05-05',
    priority: 'P0',
    tags: ['报告', '主判断', '下一步'],
    entryHrefs: [
      { label: '生成报告', href: '/analyze' },
      { label: '结构追问', href: '/chat' },
    ],
    sections: [
      {
        title: '阅读顺序',
        steps: [
          { title: '主判断', body: '先确认当前结构主线。' },
          { title: '阶段', body: '看现在处在推进、调整、恢复还是等待窗口。' },
          { title: '风险', body: '识别近期最容易误判的位置。' },
          { title: '动作', body: '把结论落到下一步。' },
          { title: '深入层', body: '需要时再展开事业、关系、财富、健康等细分内容。' },
        ],
      },
      {
        title: '不要这样读',
        bullets: ['不要只盯单个术语。', '不要把报告当成固定命运。', '不要用一份报告替代专业医疗、法律或财务判断。'],
      },
      {
        title: '读完后的三个动作',
        bullets: ['追问一个最关键的问题。', '运行一个单项工具。', '记录一个可验证的现实事件。'],
      },
    ],
    faq: [
      { question: '报告里哪些内容最重要？', answer: '顶部主判断、阶段提示、风险提醒和下一步动作。' },
      { question: '看不懂术语怎么办？', answer: '先不用追术语，直接把不懂的段落带到结构追问。' },
    ],
    relatedSlugs: ['structured-chat', 'use-tools', 'methodology-boundary'],
  },
  {
    slug: 'structured-chat',
    title: '结构追问',
    shortTitle: '结构追问',
    category: 'workflows',
    summary: '把报告、工具或事件里的一个问题继续问清楚。',
    readTime: '4 分钟',
    updatedAt: '2026-05-05',
    priority: 'P0',
    tags: ['追问', '报告', '上下文'],
    entryHrefs: [
      { label: '进入结构追问', href: '/chat' },
    ],
    sections: [
      {
        title: '适合追问的问题',
        bullets: ['现在要不要推进', '这段关系该继续还是观察', '这个机会风险在哪里', '接下来三个月先做什么'],
      },
      {
        title: '更好的问法',
        steps: [
          { title: '绑定上下文', body: '从报告、工具结果或事件入口进入。' },
          { title: '只问一个问题', body: '一轮只处理一个关键问题。' },
          { title: '补充资料维度', body: '可加入面相、手相、字迹、学习材料、场景照片、合同或法院文书摘要。' },
          { title: '给出时间范围', body: '例如最近一个月、三个月、今年。' },
          { title: '收敛动作', body: '最后要求输出先做什么和先不要做什么。' },
        ],
      },
      {
        title: '资料维度',
        bullets: ['面相和手相照片只做可见特征辅助', '字迹和学习材料用于补充状态与习惯', '场景照片用于补足环境信息', '文书材料先遮挡证件号、手机号、住址和案号'],
      },
      {
        title: '不适合的问法',
        bullets: ['泛泛问一生运势', '同时问十几个主题', '要求替你做医疗、法律或投资决定'],
      },
    ],
    faq: [
      { question: '追问会记住我的报告吗？', answer: '从报告或工具入口进入时，会带上对应上下文。' },
      { question: '可以直接自由提问吗？', answer: '可以，但绑定报告或事件后更容易得到可执行回答。' },
    ],
    relatedSlugs: ['read-first-report', 'event-calendar', 'privacy-safety'],
  },
  {
    slug: 'use-tools',
    title: '工具中心',
    shortTitle: '工具中心',
    category: 'workflows',
    summary: '把综合报告拆成单项问题并持续复访。',
    readTime: '6 分钟',
    updatedAt: '2026-05-05',
    priority: 'P0',
    tags: ['工具', '单项判断', '问题线'],
    entryHrefs: [
      { label: '打开工具中心', href: '/tools' },
    ],
    sections: [
      {
        title: '先选问题线',
        bullets: ['事业', '财富', '关系', '健康', '家庭', '迁移', '阶段窗口', '生活应用'],
      },
      {
        title: '运行顺序',
        steps: [
          { title: '先建个人底盘', body: '有综合报告时，工具可以读取更完整上下文。', href: '/analyze', action: '生成报告' },
          { title: '选择一个工具', body: '不要同时打开多个问题。' },
          { title: '填写当前问题', body: '把具体事件、时间范围和担心点写清楚。' },
          { title: '看免费输出', body: '先拿倾向、风险和一个行动。' },
          { title: '需要时再深测', body: '复杂问题再进入升级服务。' },
        ],
      },
      {
        title: '工具结果怎么用',
        bullets: ['把结果接回报告。', '把行动记入事件日历。', '用后续现实反馈校正判断。'],
      },
    ],
    faq: [
      { question: '可以不生成报告直接用工具吗？', answer: '部分工具可以先看，但有综合报告时效果更稳定。' },
      { question: '工具太多怎么选？', answer: '先按问题线进入，再选最贴近当前事件的一个。' },
    ],
    relatedSlugs: ['quick-start', 'premium-services', 'event-calendar'],
  },
  {
    slug: 'event-calendar',
    title: '事件日历',
    shortTitle: '事件日历',
    category: 'workflows',
    summary: '把现实发生的节点接回报告和工具结果。',
    readTime: '4 分钟',
    updatedAt: '2026-05-05',
    priority: 'P1',
    tags: ['事件', '验证', '复盘'],
    entryHrefs: [
      { label: '记录事件', href: '/events' },
    ],
    sections: [
      {
        title: '适合记录的事件',
        bullets: ['机会出现', '关系推进或中断', '岗位变化', '现金流变化', '健康恢复或透支', '迁移决定'],
      },
      {
        title: '记录格式',
        steps: [
          { title: '发生时间', body: '写清具体日期或时间段。' },
          { title: '事件内容', body: '用事实描述，不写长篇解释。' },
          { title: '关联报告', body: '把事件接到对应报告或工具结果。' },
          { title: '验证结果', body: '后续标记成立、偏差或待观察。' },
        ],
      },
    ],
    faq: [
      { question: '小事要不要记录？', answer: '只记录会影响判断或行动选择的节点。' },
      { question: '事件会影响后续推荐吗？', answer: '会。事件记录越清楚，后续复访越容易收敛。' },
    ],
    relatedSlugs: ['read-first-report', 'profile-history', 'structured-chat'],
  },
  {
    slug: 'profile-history',
    title: '档案与历史',
    shortTitle: '我的档案',
    category: 'account',
    summary: '管理报告、工具记录、事件和继续入口。',
    readTime: '4 分钟',
    updatedAt: '2026-05-05',
    priority: 'P1',
    tags: ['档案', '历史', '恢复进度'],
    entryHrefs: [
      { label: '打开我的档案', href: '/profile' },
      { label: '查看历史', href: '/history' },
    ],
    sections: [
      {
        title: '档案里有什么',
        bullets: ['最近报告', '工具历史', '事件记录', '订阅与更新状态', '下一步推荐'],
      },
      {
        title: '回访顺序',
        steps: [
          { title: '先看最近报告', body: '确认上次判断主线。' },
          { title: '再看工具历史', body: '找出已经处理过的问题。' },
          { title: '补事件反馈', body: '把现实结果接回来。' },
          { title: '继续一个入口', body: '选择追问、工具或更新中心。' },
        ],
      },
    ],
    faq: [
      { question: '换设备还能看到记录吗？', answer: '登录邮箱后可以恢复与账号绑定的记录。' },
      { question: '历史页和档案页有什么区别？', answer: '历史页偏列表复盘，档案页偏继续任务。' },
    ],
    relatedSlugs: ['updates-subscription', 'event-calendar', 'privacy-safety'],
  },
  {
    slug: 'updates-subscription',
    title: '更新与订阅',
    shortTitle: '更新订阅',
    category: 'account',
    summary: '邮箱登录、报告更新、月度提醒和订阅管理。',
    readTime: '5 分钟',
    updatedAt: '2026-05-05',
    priority: 'P1',
    tags: ['邮箱', '订阅', '月度更新'],
    entryHrefs: [
      { label: '更新中心', href: '/updates' },
      { label: '邮箱登录', href: '/login' },
    ],
    sections: [
      {
        title: '更新中心显示什么',
        bullets: ['订阅状态', '当前报告', '最近月度更新', '升级任务', '召回提醒'],
      },
      {
        title: '推荐设置',
        steps: [
          { title: '绑定邮箱', body: '用于恢复记录和接收更新。' },
          { title: '查看报告状态', body: '确认是否有升级或月度更新。' },
          { title: '管理订阅', body: '只保留你需要的通知。' },
        ],
      },
    ],
    faq: [
      { question: '订阅后会收到什么？', answer: '报告更新、月度提醒和公开内容更新。' },
      { question: '可以取消订阅吗？', answer: '可以在更新中心管理。' },
    ],
    relatedSlugs: ['profile-history', 'premium-services', 'privacy-safety'],
  },
  {
    slug: 'methodology-boundary',
    title: '结构、阶段、环境、动作',
    shortTitle: '核心读法',
    category: 'reading',
    summary: '人生K线的四层判断读法和使用边界。',
    readTime: '7 分钟',
    updatedAt: '2026-05-05',
    priority: 'P1',
    tags: ['结构', '阶段', '环境', '动作'],
    entryHrefs: [
      { label: '生成报告', href: '/analyze' },
      { label: '知识库', href: '/knowledge' },
    ],
    sections: [
      {
        title: '四层读法',
        bullets: ['结构：底层倾向和长期模式。', '阶段：当前窗口和节奏。', '环境：城市、行业、关系、组织等现实变量。', '动作：现在先做什么、先不要做什么。'],
      },
      {
        title: '使用原则',
        bullets: ['先看主线，再看细节。', '先验证现实，再加深解释。', '先做小动作，再考虑大决策。'],
      },
      {
        title: '边界',
        callout: {
          title: '不替代专业意见',
          body: '涉及医疗、法律、投资、心理危机等高风险事项时，请优先联系对应专业人士。',
          href: '/docs/privacy-safety',
          action: '查看边界',
        },
      },
    ],
    faq: [
      { question: '这是不是固定命运？', answer: '不是。它更像结构化判断和行动排序工具。' },
      { question: '为什么要看环境？', answer: '同一个结构在不同环境里会有不同表现。' },
    ],
    relatedSlugs: ['read-first-report', 'true-solar-time', 'privacy-safety'],
  },
  {
    slug: 'true-solar-time',
    title: '真太阳时',
    shortTitle: '真太阳时',
    category: 'reading',
    summary: '出生地点、时区和节气边界对报告精度的影响。',
    readTime: '5 分钟',
    updatedAt: '2026-05-05',
    priority: 'P1',
    tags: ['真太阳时', '出生地', '节气'],
    entryHrefs: [
      { label: '填写出生信息', href: '/analyze' },
    ],
    sections: [
      {
        title: '为什么需要出生地',
        bullets: ['同一北京时间在不同城市对应的太阳位置不同。', '接近时辰边界时，地点校正更重要。', '节气切换附近需要更谨慎。'],
      },
      {
        title: '你需要做什么',
        steps: [
          { title: '填城市', body: '优先填写出生城市。' },
          { title: '确认时间', body: '尽量确认到小时和分钟。' },
          { title: '说明不确定', body: '不确定时在追问里说明。' },
        ],
      },
    ],
    faq: [
      { question: '真太阳时会完全改变报告吗？', answer: '大多数情况下不会完全改变，但在边界时间可能影响关键判断。' },
      { question: '国外出生怎么办？', answer: '填写出生地和当地出生时间，系统按地点和时区处理。' },
    ],
    relatedSlugs: ['birth-info', 'read-first-report', 'methodology-boundary'],
  },
  {
    slug: 'premium-services',
    title: '深测与升级服务',
    shortTitle: '升级服务',
    category: 'account',
    summary: '什么时候需要深测、深测会补什么、如何发起。',
    readTime: '5 分钟',
    updatedAt: '2026-05-05',
    priority: 'P2',
    tags: ['深测', '升级', '服务'],
    entryHrefs: [
      { label: '工具中心', href: '/tools' },
      { label: '更新中心', href: '/updates' },
    ],
    sections: [
      {
        title: '适合升级的情况',
        bullets: ['一个问题影响多个领域。', '免费报告只能给出方向，无法拆行动顺序。', '需要比较多个选择。', '需要持续回访。'],
      },
      {
        title: '升级会补什么',
        bullets: ['更细的结构拆解', '阶段窗口', '风险线', '行动路径', '后续复访建议'],
      },
      {
        title: '发起方式',
        steps: [
          { title: '从报告页发起', body: '适合综合问题。' },
          { title: '从工具页发起', body: '适合单项问题。' },
          { title: '从更新中心查看状态', body: '适合跟进进度。', href: '/updates', action: '查看状态' },
        ],
      },
    ],
    faq: [
      { question: '所有问题都需要升级吗？', answer: '不需要。先用免费报告和工具确认主线。' },
      { question: '升级后还能继续追问吗？', answer: '可以。升级内容会继续接到后续追问和复访路径。' },
    ],
    relatedSlugs: ['use-tools', 'updates-subscription', 'read-first-report'],
  },
  {
    slug: 'privacy-safety',
    title: '隐私与安全边界',
    shortTitle: '隐私安全',
    category: 'safety',
    summary: '个人信息、敏感内容和高风险场景的使用边界。',
    readTime: '6 分钟',
    updatedAt: '2026-05-05',
    priority: 'P0',
    tags: ['隐私', '安全', '边界'],
    entryHrefs: [
      { label: '我的档案', href: '/profile' },
      { label: '更新中心', href: '/updates' },
    ],
    sections: [
      {
        title: '不要填写这些信息',
        bullets: ['身份证号', '银行卡号', '密码', '完整住址', '他人隐私信息', '无法公开讨论的敏感材料'],
      },
      {
        title: '高风险场景',
        bullets: ['医疗诊断和治疗', '法律诉讼', '投资买卖', '心理危机', '人身安全风险'],
      },
      {
        title: '正确用法',
        steps: [
          { title: '先用事实描述问题', body: '少写身份信息，多写发生了什么。' },
          { title: '上传前先打码', body: '照片、合同、法院文书和学习材料只保留与问题有关的部分。' },
          { title: '把结果当作判断辅助', body: '不要把报告当作唯一决策依据。' },
          { title: '需要专业帮助时及时转向', body: '医疗、法律、财务和心理危机优先找专业支持。' },
        ],
      },
    ],
    faq: [
      { question: '可以输入别人的出生信息吗？', answer: '请确认你有合理授权，不要提交他人的敏感隐私。' },
      { question: '报告能替我做决定吗？', answer: '不能。报告用于辅助排序和复盘，最终决定仍由你负责。' },
    ],
    relatedSlugs: ['birth-info', 'methodology-boundary', 'updates-subscription'],
  },
];

export const productDocPlaybooks = [
  {
    title: '第一次使用',
    docSlugs: ['quick-start', 'birth-info', 'read-first-report'],
  },
  {
    title: '报告之后',
    docSlugs: ['structured-chat', 'use-tools', 'event-calendar'],
  },
  {
    title: '长期复访',
    docSlugs: ['profile-history', 'updates-subscription', 'premium-services'],
  },
  {
    title: '使用边界',
    docSlugs: ['privacy-safety', 'methodology-boundary', 'true-solar-time'],
  },
];

export const productDocGlossary = [
  { term: '结构', definition: '长期倾向、模式和承载方式。' },
  { term: '阶段', definition: '当前所处的节奏和窗口。' },
  { term: '环境', definition: '城市、行业、组织、关系和现实条件。' },
  { term: '动作', definition: '可以执行、验证和复盘的下一步。' },
  { term: '真太阳时', definition: '按出生地点校正后的太阳时刻。' },
  { term: '单项工具', definition: '围绕一个具体问题运行的聚焦判断。' },
];

export function getProductDocCategory(key: ProductDocCategoryKey) {
  return productDocCategories.find((category) => category.key === key);
}

export function getProductDocBySlug(slug: string) {
  return productDocs.find((doc) => doc.slug === slug);
}

export function listProductDocsByCategory(categoryKey: ProductDocCategoryKey) {
  return productDocs
    .filter((doc) => doc.category === categoryKey)
    .sort((left, right) => {
      const priorityOrder = ['P0', 'P1', 'P2', 'P3'];
      return priorityOrder.indexOf(left.priority) - priorityOrder.indexOf(right.priority)
        || left.title.localeCompare(right.title, 'zh-CN');
    });
}

export function listRelatedProductDocs(slugs: string[], options?: { currentSlug?: string; limit?: number }) {
  const limit = options?.limit || 4;
  const direct = slugs
    .map((slug) => getProductDocBySlug(slug))
    .filter((doc): doc is ProductDoc => Boolean(doc));
  const seen = new Set(direct.map((doc) => doc.slug));
  const fallback = productDocs
    .filter((doc) => doc.slug !== options?.currentSlug)
    .filter((doc) => !seen.has(doc.slug))
    .sort((left, right) => {
      const priorityOrder = ['P0', 'P1', 'P2', 'P3'];
      return priorityOrder.indexOf(left.priority) - priorityOrder.indexOf(right.priority)
        || left.title.localeCompare(right.title, 'zh-CN');
    });

  return [...direct, ...fallback].slice(0, limit);
}

export function listProductDocRoutes() {
  return productDocs.map((doc) => `/docs/${doc.slug}`);
}
