/**
 * 老师（用户可见智能体）注册表
 *
 * 对标行业范式（ChatGPT GPTs / Projects、Claude Projects、Gemini Gems）：
 * - 每位老师 = 具名专家：名称、职责一句、边界、开场预设问
 * - 一份报告 + 地理 + 实践档案 = Project 级长期上下文（会话绑定，不写进用户可见「方法论」）
 * - 站内多入口进入同一 teacher id，对话顶栏可切换
 *
 * 后台 agentic 产线 agent（core_constitution 等）不暴露给用户。
 */

export type TeacherId =
  | 'overview'
  | 'career'
  | 'wealth'
  | 'relationship'
  | 'health'
  | 'timing'
  | 'geo'
  | 'practice'
  | 'hehun'
  | 'study'
  | 'partnership'
  | 'naming'
  | 'timing_selection'
  | 'guide'
  | 'terms'
  | 'expert_chart';

export type TeacherTier = 'p0' | 'p1' | 'p2';

/** 上下文槽位：对标 Project knowledge 注入，非用户文案 */
export type TeacherContextSlot = 'report' | 'geo' | 'practice';

export interface TeacherDefinition {
  id: TeacherId;
  /** 对外全称，统一「××老师」 */
  name: string;
  /** 一句职责（顶栏 / 卡片） */
  tagline: string;
  /** 边界一句（开场或资料卡） */
  boundary: string;
  /** 用户会问的典型问题 */
  starters: string[];
  tier: TeacherTier;
  /** 默认需要的上下文 */
  context: TeacherContextSlot[];
  /** 报告议题 key */
  topicKey?: string;
  /** 十维度 slug */
  dimensionSlug?: string;
  /** chat scene 兼容 */
  scene?: string;
  /** 站内主入口 path（无 query） */
  hubPath?: string;
  /** 图标（emoji，轻量） */
  icon: string;
  /** 是否在报告「问老师」主条展示 */
  showOnReport?: boolean;
  /** 是否在全局老师广场展示 */
  showInGallery?: boolean;
}

/**
 * 主清单：P0 先上主航道 + 地理 + 实践
 * 命名与职责稳定后，UI / chat / 埋点只认 id
 */
export const TEACHERS: TeacherDefinition[] = [
  {
    id: 'overview',
    name: '总览老师',
    tagline: '结合整份报告，帮你抓住当下主线',
    boundary: '给出优先顺序与行动要点，细项可转请其他老师',
    starters: [
      '结合这份报告，我现在最该先处理哪一件事？',
      '如果只能做一件事，未来 30 天我先做什么？',
      '我怎样判断自己有没有走在合适的方向上？',
    ],
    tier: 'p0',
    context: ['report', 'geo', 'practice'],
    scene: 'general',
    icon: '🧭',
    showOnReport: true,
    showInGallery: true,
  },
  {
    id: 'career',
    name: '事业老师',
    tagline: '工作节奏、岗位匹配与推进窗口',
    boundary: '行业与节奏参考，不保证录用或具体结果',
    starters: [
      '未来 3–6 个月，我更适合深耕、转换还是先稳住？',
      '结合我现在的城市与行业环境，跳槽窗口怎么看？',
      '升职或换岗时，有哪些不宜硬推的信号？',
    ],
    tier: 'p0',
    context: ['report', 'geo', 'practice'],
    topicKey: 'career',
    dimensionSlug: 'career-industry',
    scene: 'career',
    icon: '💼',
    showOnReport: true,
    showInGallery: true,
  },
  {
    id: 'wealth',
    name: '财务老师',
    tagline: '收支节奏、杠杆边界与稳健安排',
    boundary: '仅供节奏与纪律参考，不构成投资建议或收益承诺',
    starters: [
      '按我的结构，现在更适合储蓄、技能变现还是小步试探？',
      '结合所在城市的生活成本，财务上先守住什么？',
      '未来半年哪些财务动作要特别谨慎？',
    ],
    tier: 'p0',
    context: ['report', 'geo', 'practice'],
    topicKey: 'wealth',
    dimensionSlug: 'investment',
    scene: 'wealth',
    icon: '💰',
    showOnReport: true,
    showInGallery: true,
  },
  {
    id: 'relationship',
    name: '关系老师',
    tagline: '关系节奏、边界与沟通安排',
    boundary: '节奏与相处参考，不能替代双方真实选择',
    starters: [
      '现阶段更适合推进关系，还是先理顺自身节奏？',
      '若处于异地或两地奔波，沟通上要注意什么？',
      '未来半年认真交往或承诺类安排，窗口怎么判断？',
    ],
    tier: 'p0',
    context: ['report', 'geo', 'practice'],
    topicKey: 'marriage',
    dimensionSlug: 'marriage',
    scene: 'marriage',
    icon: '💞',
    showOnReport: true,
    showInGallery: true,
  },
  {
    id: 'health',
    name: '节律老师',
    tagline: '作息、负荷与恢复节奏',
    boundary: '生活方式参考，不能替代医疗诊断与治疗',
    starters: [
      '我最该先调整作息、运动还是压力管理？',
      '结合当地气候与作息，90 天养护怎么排更可持续？',
      '有哪些生活信号需要优先重视（非疾病判断）？',
    ],
    tier: 'p0',
    context: ['report', 'geo', 'practice'],
    topicKey: 'health',
    dimensionSlug: 'health',
    scene: 'health',
    icon: '🌿',
    showOnReport: true,
    showInGallery: true,
  },
  {
    id: 'timing',
    name: '时机老师',
    tagline: '本月本季何时推进、何时收束',
    boundary: '窗口与成本参考，重大决策请结合现实条件',
    starters: [
      '本月我最适合推进哪一类事？哪些宜暂缓？',
      '接下来一个季度，签约或公开表达怎么选时段？',
      '避险阶段具体怎么安排工作与生活节奏？',
    ],
    tier: 'p0',
    context: ['report', 'geo', 'practice'],
    dimensionSlug: 'fortune-rhythm',
    scene: 'month',
    icon: '📅',
    showOnReport: true,
    showInGallery: true,
  },
  {
    id: 'geo',
    name: '地理老师',
    tagline: '城市匹配、方位与居家环境节奏',
    boundary: '环境与节奏参考，不构成置业、装修或移民法律意见',
    starters: [
      '我现在的城市与命盘节奏是否匹配？',
      '若考虑换城或搬家，优先看哪些条件？',
      '暂时不搬家时，办公与居家方向能做哪些调整？',
    ],
    tier: 'p0',
    context: ['report', 'geo', 'practice'],
    dimensionSlug: 'living-environment',
    scene: 'move',
    hubPath: '/dimensions/living-environment',
    icon: '🌏',
    showOnReport: true,
    showInGallery: true,
  },
  {
    id: 'practice',
    name: '实践老师',
    tagline: '对照你做过的事，调整下一步动作',
    boundary: '依据你的记录与反馈调整安排，不作命运定论',
    starters: [
      '对照上次建议，我这 30 天做得怎么样？下一步怎么改？',
      '事件本里最近几件事，说明我该推进还是收束？',
      '预测回访里未命中的部分，我该如何调整动作？',
    ],
    tier: 'p0',
    context: ['report', 'geo', 'practice'],
    scene: 'followup',
    hubPath: '/predictions',
    icon: '✅',
    showOnReport: true,
    showInGallery: true,
  },
  // ── P1 ──
  {
    id: 'hehun',
    name: '合婚老师',
    tagline: '双人节奏差异与相处对齐',
    boundary: '差异与节奏参考，不能替代双方选择',
    starters: [
      '两个人节奏差异主要在哪里？如何对齐？',
      '现阶段适合推进承诺，还是先做边界沟通？',
    ],
    tier: 'p1',
    context: ['report', 'geo', 'practice'],
    hubPath: '/hehun',
    icon: '💍',
    showInGallery: true,
  },
  {
    id: 'study',
    name: '学业老师',
    tagline: '学习考试与方向节奏',
    boundary: '方向与节奏参考，不承诺考试结果',
    starters: ['升学或考试阶段，我该如何安排节奏？'],
    tier: 'p1',
    context: ['report', 'geo', 'practice'],
    dimensionSlug: 'study-career',
    icon: '📚',
    showInGallery: true,
  },
  {
    id: 'partnership',
    name: '合伙老师',
    tagline: '合作对象与分工边界',
    boundary: '协作画像参考，不构成尽调或法律意见',
    starters: ['我适合与什么类型的人长期合作？'],
    tier: 'p1',
    context: ['report', 'geo', 'practice'],
    dimensionSlug: 'partnership',
    icon: '🤝',
    showInGallery: true,
  },
  {
    id: 'naming',
    name: '起名老师',
    tagline: '姓名与用神方向的匹配说明',
    boundary: '文化与结构参考，不承诺具体运势结果',
    starters: ['这个名字与我的用神方向是否相合？'],
    tier: 'p1',
    context: ['report', 'geo'],
    dimensionSlug: 'naming',
    icon: '✍️',
    showInGallery: true,
  },
  {
    id: 'timing_selection',
    name: '择日老师',
    tagline: '办事时段排序与忌宜提醒',
    boundary: '时段参考；医疗等事项以专业意见为先',
    starters: ['未来 90 天，签约或搬家更合适的时段？'],
    tier: 'p1',
    context: ['report', 'geo', 'practice'],
    dimensionSlug: 'timing-selection',
    icon: '🗓️',
    showInGallery: true,
  },
  {
    id: 'guide',
    name: '导读老师',
    tagline: '这份报告建议先看哪些部分',
    boundary: '只做阅读指引，不重新排盘',
    starters: ['这份报告我应该按什么顺序阅读？'],
    tier: 'p1',
    context: ['report'],
    icon: '📖',
    showInGallery: true,
  },
  {
    id: 'terms',
    name: '名词老师',
    tagline: '日主、用神、大运等概念说明',
    boundary: '概念说明，并结合本盘字段举例',
    starters: ['用神在我这份盘里具体指什么？'],
    tier: 'p1',
    context: ['report'],
    icon: '🔤',
    showInGallery: true,
  },
  // ── P2 ──
  {
    id: 'expert_chart',
    name: '排盘老师',
    tagline: '四柱、十神与岁运细读',
    boundary: '专业细读参考，面向需要深入结构的用户',
    starters: ['请按四柱与岁运，细读我当前阶段的结构要点'],
    tier: 'p2',
    context: ['report', 'geo'],
    icon: '📐',
    showInGallery: true,
  },
];

const BY_ID = new Map(TEACHERS.map((t) => [t.id, t]));

export function getTeacher(id: string | null | undefined): TeacherDefinition {
  if (id && BY_ID.has(id as TeacherId)) return BY_ID.get(id as TeacherId)!;
  return BY_ID.get('overview')!;
}

export function listTeachers(opts?: {
  tier?: TeacherTier | TeacherTier[];
  reportOnly?: boolean;
  galleryOnly?: boolean;
}): TeacherDefinition[] {
  const tiers = opts?.tier
    ? Array.isArray(opts.tier)
      ? opts.tier
      : [opts.tier]
    : null;
  return TEACHERS.filter((t) => {
    if (tiers && !tiers.includes(t.tier)) return false;
    if (opts?.reportOnly && !t.showOnReport) return false;
    if (opts?.galleryOnly && !t.showInGallery) return false;
    return true;
  });
}

export function listReportTeachers(): TeacherDefinition[] {
  return listTeachers({ reportOnly: true, tier: 'p0' });
}

export function teacherFromTopicKey(topicKey: string | null | undefined): TeacherDefinition {
  if (!topicKey) return getTeacher('overview');
  const hit = TEACHERS.find((t) => t.topicKey === topicKey);
  return hit || getTeacher('overview');
}

export function teacherFromDimensionSlug(slug: string | null | undefined): TeacherDefinition {
  if (!slug) return getTeacher('overview');
  const hit = TEACHERS.find((t) => t.dimensionSlug === slug);
  return hit || getTeacher('overview');
}

/** 兼容旧 scene → 老师 */
export function teacherFromScene(scene: string | null | undefined): TeacherDefinition {
  const map: Record<string, TeacherId> = {
    general: 'overview',
    career: 'career',
    wealth: 'wealth',
    marriage: 'relationship',
    health: 'health',
    month: 'timing',
    risk: 'timing',
    move: 'geo',
    job: 'career',
    followup: 'practice',
  };
  return getTeacher(scene ? map[scene] || 'overview' : 'overview');
}

/**
 * 构建请教某位老师的链接
 * 对标 GPT/Gem 深链：固定专家 + Project（report）+ 可选 starter
 */
export function buildTeacherChatHref(params: {
  teacherId: TeacherId | string;
  reportId?: string | null;
  question?: string | null;
  city?: string | null;
  source?: string | null;
}): string {
  const teacher = getTeacher(params.teacherId);
  const q = new URLSearchParams();
  q.set('teacher', teacher.id);
  if (params.reportId) q.set('reportId', params.reportId);
  if (params.city) q.set('city', params.city.trim());
  const question = (params.question || teacher.starters[0] || '').trim();
  if (question) {
    q.set('question', question);
    q.set('q', question);
  }
  const source =
    params.source ||
    (params.reportId ? `report:${params.reportId}:teacher:${teacher.id}` : `teacher:${teacher.id}`);
  q.set('source', source);
  return `/chat?${q.toString()}`;
}

/** 系统侧拼装：老师人设（注入 LLM，不直接整段展示给用户） */
export function buildTeacherSystemPreamble(teacher: TeacherDefinition): string {
  return [
    `你是「${teacher.name}」。`,
    `职责：${teacher.tagline}`,
    `边界：${teacher.boundary}`,
    '回答要求：先给结论，再说明依据（可结合命盘结构、地理环境、用户已记录的实践），最后给可执行下一步。',
    '若问题明显属于其他老师的主责领域，简要作答后建议用户换请对应老师深聊。',
    '禁止恐吓、空恭维与绝对化命运断言；医疗/法律/投资不替代专业意见。',
  ].join('\n');
}
