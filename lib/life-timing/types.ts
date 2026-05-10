import type { DayunResult } from '@/lib/dayun-calculator';

// 时点严重程度
export type TimingSeverity = 'notice' | 'caution' | 'critical';

// 时点类型（决定后续 narrator 用哪个 prompt 模板）
export type TimingType =
  | 'solar_term'
  | 'tai_sui_value'
  | 'tai_sui_clash'
  | 'tai_sui_punish'
  | 'tai_sui_harm'
  | 'tai_sui_break'
  | 'dayun_transition'
  | 'sui_yun_bing_lin'
  | 'liuyue_clash'
  | 'liuyue_fuyin'
  | 'liuyue_combine'
  | 'liuyue_shensha_neg'
  | 'liuyue_shensha_tianyi'
  | 'liuyue_shensha_wenchang'
  | 'liuyue_shensha_taohua'
  | 'liuyue_shensha_yima'
  | 'liuyue_shensha_tiande'
  | 'liuyue_shensha_jiangxing';

// 单个时点
export interface TimingPoint {
  id: string;
  type: TimingType;
  severity: TimingSeverity;
  startDate: string;     // ISO 'YYYY-MM-DD'
  endDate?: string;
  rawReason: string;
  context: Record<string, unknown>;
  userCopy?: {
    title: string;
    summary: string;
    todoSuggestions: string[];
    avoidSuggestions: string[];
  };
}

// 大运转换（5 年视图用）
export interface MajorTransition {
  type: 'dayun_shift' | 'tai_sui_year' | 'sui_yun_bing_lin';
  year: number;
  ageAtYear: number;
  rawReason: string;
  severity: TimingSeverity;
  context: Record<string, unknown>;
}

// 过去印证（区块 2 用）
export interface PastValidation {
  id: string;
  category: 'pattern' | 'shen_sha' | 'dayun_imprint';
  rawTemplate: string;
  context: Record<string, unknown>;
}

// 完整输出
export interface TimingProfile {
  birthSignature: string;
  baziPillars: string;     // '庚午|戊午|辛酉|乙未'
  computedAt: string;
  computedForYear: string;
  past_validations: PastValidation[];
  next_30_days: TimingPoint[];
  next_12_months: TimingPoint[];
  next_5_years: MajorTransition[];
}

// 检测器输入
export interface DetectorInput {
  bazi: {
    yearGan: string;
    yearZhi: string;
    monthGan: string;
    monthZhi: string;
    dayGan: string;
    dayZhi: string;
    hourGan: string;
    hourZhi: string;
  };
  birthDate: Date;
  currentDate: Date;
  dayunResult: DayunResult;
  shenShaList?: Array<{ name: string; pillar?: string; impact?: string }>;
  pattern?: string;
}
