export type BirthAccuracy = 'exact' | 'range' | 'unknown';
export type ProfileIntent = 'career' | 'wealth' | 'relationship' | 'yearly';
export type SupplementDomain =
  | 'career'
  | 'goals'
  | 'relationship'
  | 'wealth'
  | 'health'
  | 'residence'
  | 'astro'
  | 'body'
  | 'apps';
export type ProfileImpactHint = 'engine' | 'expression' | 'display';
export type ProfileDocumentCategory = 'life_event' | 'career_note' | 'relationship_note' | 'health_note' | 'other';
export type ProfileDocumentVisibility = 'engine' | 'private';

export const MAX_PROFILE_DOCUMENTS = 20;
export const MAX_PROFILE_DOCUMENT_CHARS = 2000;
export const MAX_PINNED_PROFILE_DOCUMENTS = 3;

export const PROFILE_RELATION_OPTIONS = [
  { key: 'self', label: '本人' },
  { key: 'spouse', label: '配偶' },
  { key: 'child', label: '子女' },
  { key: 'parent', label: '父母' },
  { key: 'sibling', label: '兄弟姐妹' },
  { key: 'friend', label: '朋友' },
  { key: 'other', label: '其他' },
] as const;

export const PROFILE_DOCUMENT_CATEGORY_OPTIONS = [
  { key: 'life_event' as const, label: '人生事件' },
  { key: 'career_note' as const, label: '职业记录' },
  { key: 'relationship_note' as const, label: '关系记录' },
  { key: 'health_note' as const, label: '健康关注' },
  { key: 'other' as const, label: '其他' },
];

export const PROFILE_INTENT_OPTIONS = [
  { key: 'career' as const, label: '事业发展', text: '职业方向、升迁窗口、转型节奏。' },
  { key: 'wealth' as const, label: '财运规划', text: '收入结构、合作风险、积累周期。' },
  { key: 'relationship' as const, label: '婚恋关系', text: '关系模式、相处节奏、关键年份。' },
  { key: 'yearly' as const, label: '年度流年', text: '今年重点、月份节奏、近期取舍。' },
];

export const PROFILE_ACCURACY_OPTIONS = [
  { key: 'exact' as const, label: '准确到分钟', text: '可信度最高，可细看时柱与具体窗口。' },
  { key: 'range' as const, label: '大致时段', text: '可看整体趋势，时柱细节会降低权重。' },
  { key: 'unknown' as const, label: '不确定时间', text: '先看年/月/日结构，避免过度解读时柱。' },
];

export const PROFILE_SUPPLEMENT_DOMAINS: Record<SupplementDomain, {
  label: string;
  description: string;
  fields: Array<{ key: string; label: string; placeholder?: string; impact: ProfileImpactHint }>;
}> = {
  career: {
    label: '职业现状',
    description: '帮助事业类建议更贴近你的真实工作状态。',
    fields: [
      { key: 'industry', label: '所在行业', placeholder: '如：互联网、教育、金融', impact: 'expression' },
      { key: 'role', label: '岗位角色', placeholder: '如：产品经理、销售主管', impact: 'expression' },
      { key: 'workMode', label: '工作模式', placeholder: '如：全职上班、自由职业、创业', impact: 'expression' },
      { key: 'incomeStructure', label: '收入结构', placeholder: '如：固定薪资为主、项目提成', impact: 'expression' },
    ],
  },
  goals: {
    label: '当前目标',
    description: '让报告和邮件提醒围绕你此刻最关心的问题展开。',
    fields: [
      { key: 'primaryConcern', label: '最大困惑', placeholder: '如：要不要换城市、是否适合转型', impact: 'expression' },
      { key: 'twelveMonthGoal', label: '12 个月目标', placeholder: '如：稳定收入、找到合适伴侣', impact: 'expression' },
      { key: 'decisionPending', label: '待做决定', placeholder: '如：是否接受新 offer', impact: 'expression' },
    ],
  },
  relationship: {
    label: '婚恋关系',
    description: '关系状态会影响相处节奏与关键年份的判断权重。',
    fields: [
      { key: 'status', label: '关系状态', placeholder: '如：单身、恋爱中、已婚', impact: 'expression' },
      { key: 'children', label: '子女情况', placeholder: '如：无、1 个、2 个', impact: 'expression' },
      { key: 'livingArrangement', label: '居住安排', placeholder: '如：同居、异地、分居', impact: 'expression' },
    ],
  },
  wealth: {
    label: '财务现状',
    description: '帮助财运建议更贴近你的资产与压力结构。',
    fields: [
      { key: 'assetType', label: '资产类型', placeholder: '如：房产、股票、现金为主', impact: 'expression' },
      { key: 'debtPressure', label: '负债压力', placeholder: '如：房贷、无负债、信用卡', impact: 'expression' },
      { key: 'investmentStyle', label: '投资风格', placeholder: '如：保守、均衡、激进', impact: 'expression' },
    ],
  },
  health: {
    label: '健康关注',
    description: '仅记录关注倾向，不作医学诊断。',
    fields: [
      { key: 'focusArea', label: '关注部位', placeholder: '如：睡眠、肠胃、情绪', impact: 'expression' },
      { key: 'routine', label: '作息习惯', placeholder: '如：晚睡、规律运动', impact: 'expression' },
      { key: 'exercise', label: '运动习惯', placeholder: '如：每周跑步 2 次', impact: 'expression' },
    ],
  },
  residence: {
    label: '居住迁移',
    description: '现居地与迁移计划会影响地理气候类信号。',
    fields: [
      { key: 'currentCity', label: '现居城市', placeholder: '如：上海、深圳', impact: 'expression' },
      { key: 'plannedMove', label: '计划迁移', placeholder: '如：考虑去杭州、暂无', impact: 'expression' },
      { key: 'environmentPreference', label: '环境偏好', placeholder: '如：南方湿润、干燥北方', impact: 'expression' },
    ],
  },
  astro: {
    label: '星座星盘',
    description: '太阳星座与生肖可由生日推导；月亮/上升可自填，作表达层补充。',
    fields: [
      { key: 'sunSign', label: '太阳星座', placeholder: '如：天秤座', impact: 'display' },
      { key: 'chineseZodiac', label: '生肖', placeholder: '如：龙', impact: 'display' },
      { key: 'moonSign', label: '月亮星座', placeholder: '如：巨蟹座', impact: 'expression' },
      { key: 'risingSign', label: '上升星座', placeholder: '如：处女座', impact: 'expression' },
      { key: 'astroNote', label: '星盘备注', placeholder: '如：已知精确上升时间', impact: 'expression' },
    ],
  },
  body: {
    label: '面相手相',
    description: '体貌观测摘要（非医学诊断），与命盘交叉作表达层。',
    fields: [
      { key: 'faceSummary', label: '面相摘要', placeholder: '最近一次面相结论', impact: 'expression' },
      { key: 'faceScore', label: '面相综合分', placeholder: '如：72', impact: 'display' },
      { key: 'facePhysical', label: '面相物理要点', placeholder: '三庭五眼等可见结构', impact: 'expression' },
      { key: 'palmSummary', label: '手相摘要', placeholder: '最近一次手相结论', impact: 'expression' },
      { key: 'palmScore', label: '手相综合分', placeholder: '如：68', impact: 'display' },
      { key: 'palmPhysical', label: '手相物理要点', placeholder: '三主线等可见结构', impact: 'expression' },
      { key: 'bodyUpdatedAt', label: '体貌更新时间', placeholder: 'ISO 时间', impact: 'display' },
      { key: 'lastSessionId', label: '最近会话', placeholder: 'tool session id', impact: 'display' },
    ],
  },
  apps: {
    label: '应用工具',
    description: '起名、空间场等工具结果摘要，写入底座供对话与报告共享。',
    fields: [
      { key: 'namingSummary', label: '起名摘要', placeholder: '最近一次起名结论', impact: 'expression' },
      { key: 'namingTop', label: '领先候选名', placeholder: '如：某某', impact: 'display' },
      { key: 'namingScore', label: '起名领先分', placeholder: '如：86', impact: 'display' },
      { key: 'namingMode', label: '起名模式', placeholder: 'person/company/product', impact: 'display' },
      { key: 'namingSessionId', label: '起名会话', placeholder: 'session id', impact: 'display' },
      { key: 'namingCount', label: '候选数量', placeholder: '如：12', impact: 'display' },
      { key: 'spaceSummary', label: '空间场摘要', placeholder: '最近一次空间场结论', impact: 'expression' },
      { key: 'spaceDomain', label: '空间用途', placeholder: '住宅/商铺', impact: 'display' },
      { key: 'spaceScore', label: '空间综合分', placeholder: '如：70', impact: 'display' },
      { key: 'spaceSessionId', label: '空间会话', placeholder: 'session id', impact: 'display' },
      { key: 'spaceTitle', label: '空间报表标题', placeholder: '报表标题', impact: 'display' },
      { key: 'spaceLinked', label: '人宅合参', placeholder: '1/0', impact: 'display' },
      { key: 'hehunScore', label: '合婚综合分', placeholder: '如：72', impact: 'display' },
      { key: 'hehunBand', label: '合婚档位', placeholder: '如：可经营', impact: 'display' },
      { key: 'hehunHeadline', label: '合婚头条', placeholder: '双方综合结论', impact: 'expression' },
      { key: 'hehunSummary', label: '合婚摘要', placeholder: '结构对照摘要', impact: 'expression' },
      { key: 'hehunPartner', label: '合婚对方', placeholder: '对方称呼', impact: 'display' },
      { key: 'hehunSessionId', label: '合婚会话', placeholder: 'session id', impact: 'display' },
      { key: 'dimLastSlug', label: '最近维度', placeholder: 'fortune-rhythm', impact: 'display' },
      { key: 'dimLastTitle', label: '维度标题', placeholder: '运势节奏', impact: 'display' },
      { key: 'dimLastSummary', label: '维度摘要', placeholder: '结论一句', impact: 'expression' },
      { key: 'dimLastAt', label: '维度时间', placeholder: 'ISO 时间', impact: 'display' },
      { key: 'dimLastSessionId', label: '维度会话', placeholder: 'session id', impact: 'display' },
      { key: 'dimPredictionCount', label: '维度预测数', placeholder: '如：3', impact: 'display' },
      { key: 'dimSlugs', label: '已跑维度', placeholder: 'slug 列表', impact: 'display' },
      { key: 'lastToolSlug', label: '最近工具', placeholder: 'tool slug', impact: 'display' },
      { key: 'lastToolTitle', label: '最近工具名', placeholder: '工具标题', impact: 'display' },
      { key: 'lastToolSummary', label: '工具摘要', placeholder: '结果一句', impact: 'expression' },
      { key: 'lastToolScore', label: '工具质检分', placeholder: '如：80', impact: 'display' },
      { key: 'lastToolSessionId', label: '工具会话', placeholder: 'session id', impact: 'display' },
      { key: 'appsUpdatedAt', label: '应用更新时间', placeholder: 'ISO 时间', impact: 'display' },
    ],
  },
};

export const PROFILE_ENGINE_FIELDS = [
  'birthDate',
  'birthTime',
  'birthPlace',
  'birthAccuracy',
  'gender',
] as const;

export type ProfileEngineField = (typeof PROFILE_ENGINE_FIELDS)[number];

export interface ProfileAccountView {
  id: string;
  name: string;
  email: string | null;
  timezone: number;
}

/** Locked chart calculation identity (from analyze) — people-facing summary only. */
export interface ProfileChartIdentityView {
  clockBirthTime: string | null;
  effectiveBirthTime: string | null;
  chartFingerprint: string | null;
  useSolarTime: boolean;
  useSeparateZiHour: boolean;
  /** true when stored birthTime differs from identity clock (display drift) */
  timeMismatch: boolean;
}

export interface ProfileFortuneView {
  id: string;
  name: string;
  relation: string;
  relationLabel: string | null;
  isPrimary: boolean;
  birthDate: string;
  birthTime: string;
  birthPlace: string;
  birthAccuracy: BirthAccuracy;
  gender: 'male' | 'female';
  intent: ProfileIntent | null;
  timezone: number;
  birthSignature: string | null;
  reportId: string;
  pillarSummary: string | null;
  chartIdentity: ProfileChartIdentityView | null;
  completeness: number;
  updatedAt: string | null;
}

export interface ProfileSupplementView {
  domain: SupplementDomain;
  fields: Record<string, string>;
  updatedAt: string | null;
}

export interface ProfileDocumentView {
  id: string;
  title: string;
  category: ProfileDocumentCategory;
  content: string;
  visibility: ProfileDocumentVisibility;
  pinned: boolean;
  wordCount: number;
  updatedAt: string | null;
}

export interface ProfileChangeLogView {
  id: string;
  changeType: string;
  fieldPath: string | null;
  triggeredRecalc: boolean;
  summary: string;
  createdAt: string | null;
}

export interface ProfileCompletenessBreakdown {
  overall: number;
  fortuneScore: number;
  supplementScore: number;
  documentScore: number;
  intent: ProfileIntent | null;
  domainScores: Record<SupplementDomain, number>;
  topWeightedDomains: SupplementDomain[];
  intentHint: string | null;
}

export interface ProfileSubscriptionFocusView {
  focusReportId: string | null;
  focusFortuneName: string | null;
  focusFortuneRelation: string | null;
  shortLabel: string;
  headline: string;
  description: string;
  settingsHref: string;
  isSet: boolean;
}

export interface ProfileMissingRecommendationView {
  domain: SupplementDomain;
  fieldKey: string;
  label: string;
  reason: string;
  priority: 'high' | 'medium';
}

export interface ProfileSettingsResponse {
  success: boolean;
  account: ProfileAccountView;
  activeFortuneId: string | null;
  fortunes: ProfileFortuneView[];
  supplements: ProfileSupplementView[];
  documents: ProfileDocumentView[];
  changeLog: ProfileChangeLogView[];
  completeness: number;
  completenessBreakdown: ProfileCompletenessBreakdown;
  subscriptionFocus: ProfileSubscriptionFocusView;
  topMissingRecommendations: ProfileMissingRecommendationView[];
  pendingRecalc?: {
    fortuneId: string;
    jobId: string;
    status: string;
  } | null;
  error?: string;
}