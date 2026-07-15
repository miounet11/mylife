export type BirthAccuracy = 'exact' | 'range' | 'unknown';
export type ProfileIntent = 'career' | 'wealth' | 'relationship' | 'yearly';
export type SupplementDomain = 'career' | 'goals' | 'relationship' | 'wealth' | 'health' | 'residence';
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