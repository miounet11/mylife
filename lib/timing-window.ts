/**
 * 择日窗口 2.0 — 90 天吉日/忌日表（基于用神流日评分）
 */

import { pickAvoidDays, pickBestDays, scoreUpcomingDays, type DayScore } from '@/lib/dimensions/data/daily-fortune';

export type TimingEventType =
  | 'sign_contract'
  | 'open_business'
  | 'move_house'
  | 'marriage_register'
  | 'interview'
  | 'medical_aux'
  | 'general';

export const TIMING_EVENT_LABELS: Record<TimingEventType, string> = {
  sign_contract: '签约/合同',
  open_business: '开业/上线',
  move_house: '搬家/入宅',
  marriage_register: '领证/婚礼相关',
  interview: '面试/答辩',
  medical_aux: '医疗辅助择时（医生优先）',
  general: '一般要事',
};

export interface TimingWindowPack {
  eventType: TimingEventType;
  eventLabel: string;
  windowDays: number;
  best: DayScore[];
  avoid: DayScore[];
  all: DayScore[];
  tips: string[];
  disclaimer: string;
}

export function buildTimingWindow(params: {
  yongShen?: string[];
  xiShen?: string[];
  jiShen?: string[];
  eventType?: TimingEventType;
  days?: number;
}): TimingWindowPack {
  const eventType = params.eventType || 'general';
  const days = params.days ?? 90;
  const favorable = [...(params.yongShen || []), ...(params.xiShen || [])];
  const unfavorable = params.jiShen || [];
  const all = scoreUpcomingDays(favorable, unfavorable, days);
  const best = pickBestDays(all, 10);
  const avoid = pickAvoidDays(all, 8);

  const tips = EVENT_TIPS[eventType] || EVENT_TIPS.general;

  return {
    eventType,
    eventLabel: TIMING_EVENT_LABELS[eventType],
    windowDays: days,
    best,
    avoid,
    all,
    tips,
    disclaimer:
      eventType === 'medical_aux'
        ? '医疗以医生建议为第一优先；择时仅作辅助参考。'
        : '择时基于流日与用神匹配，不保证结果，不构成法律/商业承诺。',
  };
}

const EVENT_TIPS: Record<TimingEventType, string[]> = {
  sign_contract: ['宜日上午签署，条款前一晚复核完毕', '忌日可谈判，但避免不可逆落笔'],
  open_business: ['宜日做公开发布/剪彩，忌日可内测', '备选第二吉日防天气与档期'],
  move_house: ['宜日搬大件与入宅，忌日只打包不入宅', '提前确认物业与水电'],
  marriage_register: ['兼顾双方行程与家庭到场', '领证与宴席可拆开择日'],
  interview: ['宜日前一晚早睡，材料预演', '忌日可网申，慎终面'],
  medical_aux: ['一切以主治医生时间与身体状态为准', '仅在可选日期中参考宜忌'],
  general: ['宜日推进关键动作，忌日做整理与复盘', '不确定时缩小决策范围'],
};
