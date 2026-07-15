export type MembershipPlanId = 'annual' | 'quarterly';

export interface MembershipPlan {
  id: MembershipPlanId;
  name: string;
  priceCny: number;
  periodLabel: string;
  highlight: boolean;
  features: string[];
}

export const MEMBERSHIP_PLANS: MembershipPlan[] = [
  {
    id: 'annual',
    name: '年度会员',
    priceCny: 199,
    periodLabel: '/ 年',
    highlight: true,
    features: [
      '完整事业、财运、婚恋、健康四维分析',
      '流年大运与关键人生窗口详解',
      '年度策略与月份节奏提醒',
      '邮箱永久保存报告，随时回看',
      '后续年度运势更新优先查看',
    ],
  },
  {
    id: 'quarterly',
    name: '季度会员',
    priceCny: 69,
    periodLabel: '/ 季',
    highlight: false,
    features: [
      '解锁会员完整版报告全文',
      '事业财运婚恋健康细分解读',
      '当前流年与大运深度分析',
      '邮箱保存报告 90 天回看',
    ],
  },
];

export const FREE_TIER_FEATURES = [
  '八字结构与五行强弱概览',
  '人生K线趋势与阶段判断',
  '按问题类型组织的免费摘要',
  '出生时间可信度边界提示',
];

export function getMembershipPlan(planId: string): MembershipPlan | null {
  return MEMBERSHIP_PLANS.find((plan) => plan.id === planId) || null;
}