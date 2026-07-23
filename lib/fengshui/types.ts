/** 商铺风水模拟器共享类型 */

export interface ShopFengshuiInput {
  /** 行业类型：餐饮/零售/科技/教育/美容/医疗/金融/文化/制造/地产 */
  industryType: string;
  /** 商铺门牌名称 */
  shopName: string;
  /** 大门朝向（八卦方位）：东/东南/南/西南/西/西北/北/东北 */
  doorDirection: string;
  /** 装修风格偏好：现代简约/新中式/工业风/北欧/轻奢 */
  decorPreference?: string;
  /** 计划开业日期 YYYY-MM-DD */
  openingDate?: string;
}

/** 五维度雷达分数（0-100） */
export interface FengshuiRadarScores {
  industry: number;    // 行业五行匹配度
  direction: number;   // 大门方位匹配度
  nameScore: number;   // 店名五行匹配度
  colorScore: number;  // 色彩搭配匹配度
  timingScore: number; // 开业择时匹配度
}

/** 色彩方案 */
export interface FengshuiColorScheme {
  primary: { label: string; hex: string; element: string; reason: string };
  secondary: { label: string; hex: string; element: string; reason: string };
  accent: { label: string; hex: string; element: string; reason: string };
  avoidColors: string[];
}

/** 开业择时窗口 */
export interface FengshuiTimingWindow {
  recommendedDate: string | null;
  seasonPreference: string;
  avoidPeriods: string[];
  reason: string;
}

/** 商铺布局建议 */
export interface ShopLayoutAdvice {
  /** 整体格局描述 */
  overallLayout: string;
  /** 收银台/前台建议 */
  cashierAdvice: string;
  /** 入口/橱窗建议 */
  entranceAdvice: string;
  /** 休息区/洽谈区建议 */
  loungeAdvice: string;
  /** 动线建议 */
  flowAdvice: string;
}

/** 商铺风水分析完整输出 */
export interface ShopFengshuiOutput {
  /** 综合匹配度 0-100 */
  overallScore: number;
  /** 五维度雷达分数 */
  radarScores: FengshuiRadarScores;
  /** 行业所属五行 */
  industryElement: string;
  /** 大门朝向所属五行 */
  doorElement: string;
  /** 行业五行分析 */
  industryAnalysis: { element: string; matchLevel: string; description: string };
  /** 大门方位分析 */
  doorAnalysis: { element: string; matchLevel: string; description: string; favorableElements: string[] };
  /** 色彩方案 */
  colorScheme: FengshuiColorScheme;
  /** 店名五行分析 */
  nameAnalysis: { totalScore: number; characters: Array<{ char: string; element: string; score: number }>; summary: string };
  /** 开业择时分析 */
  timingWindow: FengshuiTimingWindow;
  /** 商铺布局建议 */
  layoutAdvice: ShopLayoutAdvice;
  /** 结构化摘要（不说吉凶标签） */
  structuralSummary: string;
}
