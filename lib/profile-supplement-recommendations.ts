import {
  PROFILE_SUPPLEMENT_DOMAINS,
  type ProfileIntent,
  type SupplementDomain,
} from '@/lib/profile-settings-types';

export type ProfileSupplementRecommendation = {
  domain: SupplementDomain;
  fieldKey: string;
  label: string;
  reason: string;
  priority: 'high' | 'medium';
};

const INTENT_RECOMMENDATIONS: Record<ProfileIntent, ProfileSupplementRecommendation[]> = {
  career: [
    { domain: 'career', fieldKey: 'industry', label: '所在行业', reason: '事业类报告会优先参考你的行业背景。', priority: 'high' },
    { domain: 'career', fieldKey: 'role', label: '岗位角色', reason: '角色信息决定建议的可执行程度。', priority: 'high' },
    { domain: 'goals', fieldKey: 'primaryConcern', label: '最大困惑', reason: '让报告围绕你当前职业卡点展开。', priority: 'high' },
    { domain: 'goals', fieldKey: 'decisionPending', label: '待做决定', reason: '若有跳槽/转型决定，建议会更有针对性。', priority: 'medium' },
  ],
  wealth: [
    { domain: 'wealth', fieldKey: 'assetType', label: '资产类型', reason: '财运建议需要知道你的资产结构。', priority: 'high' },
    { domain: 'wealth', fieldKey: 'investmentStyle', label: '投资风格', reason: '风险偏好影响流年财务策略。', priority: 'high' },
    { domain: 'career', fieldKey: 'incomeStructure', label: '收入结构', reason: '收入形态是财运判断的重要上下文。', priority: 'medium' },
    { domain: 'goals', fieldKey: 'twelveMonthGoal', label: '12 个月目标', reason: '财务目标越具体，建议越可执行。', priority: 'medium' },
  ],
  relationship: [
    { domain: 'relationship', fieldKey: 'status', label: '关系状态', reason: '婚恋建议会结合你的真实关系阶段。', priority: 'high' },
    { domain: 'relationship', fieldKey: 'livingArrangement', label: '居住安排', reason: '异地/同居等安排影响关系节奏判断。', priority: 'medium' },
    { domain: 'goals', fieldKey: 'primaryConcern', label: '最大困惑', reason: '关系困惑会提升报告和邮件的相关度。', priority: 'high' },
    { domain: 'goals', fieldKey: 'decisionPending', label: '待做决定', reason: '若有承诺/分离类决定，建议会更谨慎。', priority: 'medium' },
  ],
  yearly: [
    { domain: 'goals', fieldKey: 'twelveMonthGoal', label: '12 个月目标', reason: '流年解读会优先对齐你的年度目标。', priority: 'high' },
    { domain: 'goals', fieldKey: 'primaryConcern', label: '最大困惑', reason: '今年最在意的事决定提醒重点。', priority: 'high' },
    { domain: 'residence', fieldKey: 'currentCity', label: '现居城市', reason: '地理气候信号会影响流年环境判断。', priority: 'medium' },
    { domain: 'health', fieldKey: 'focusArea', label: '健康关注', reason: '流年健康提醒需要知道你的关注倾向。', priority: 'medium' },
  ],
};

const DEFAULT_RECOMMENDATIONS: ProfileSupplementRecommendation[] = [
  { domain: 'goals', fieldKey: 'primaryConcern', label: '最大困惑', reason: '补充当前困惑可显著提升建议贴合度。', priority: 'high' },
  { domain: 'career', fieldKey: 'industry', label: '所在行业', reason: '职业背景是多数建议的基础上下文。', priority: 'medium' },
  { domain: 'relationship', fieldKey: 'status', label: '关系状态', reason: '关系信息有助于平衡事业与生活建议。', priority: 'medium' },
];

export function getSupplementRecommendations(intent: ProfileIntent | null | undefined) {
  if (intent && INTENT_RECOMMENDATIONS[intent]) {
    return INTENT_RECOMMENDATIONS[intent];
  }
  return DEFAULT_RECOMMENDATIONS;
}

export function listMissingRecommendations(
  intent: ProfileIntent | null | undefined,
  supplements: Record<string, Record<string, string>>,
) {
  return getSupplementRecommendations(intent).filter((item) => {
    const value = supplements[item.domain]?.[item.fieldKey];
    return !`${value || ''}`.trim();
  });
}

export function recommendationFieldLabel(domain: SupplementDomain, fieldKey: string) {
  const field = PROFILE_SUPPLEMENT_DOMAINS[domain]?.fields.find((item) => item.key === fieldKey);
  return field?.label || fieldKey;
}