// 服务层类型定义
// 这些类型与重构后的代码结构匹配

export interface Pillar {
  celestialStem: string;
  earthlyBranch: string;
  element: string;  // 简化版：直接存储五行
  hidden: string[]; // 简化版：藏干
}

export interface FiveElements {
  wood: ElementDetail;
  fire: ElementDetail;
  earth: ElementDetail;
  metal: ElementDetail;
  water: ElementDetail;
  balance: string;
  dominant: string[];
  lacking: string[];
}

export interface ElementDetail {
  strength: number;
  percentage: number;
  quality: string;
  description: string;
}

export interface TenGods {
  year: PillarShiShen;
  month: PillarShiShen;
  day: PillarShiShen;
  hour: PillarShiShen;
}

export interface PillarShiShen {
  name: string;
  meaning: string;
  influence: string;
}

export interface Pattern {
  type: string;
  strength?: string;
  quality?: 'high' | 'medium' | 'low';
  strengths: string[];  // 优势列表
  weaknesses: string[]; // 劣势列表
  description: string;
}

export interface YongShenResult {
  yongShen: string[];
  xiShen: string[];
  jiShen: string[];
  geJu: string;         // 格局
  riZhuQiangRuo: string; // 日主强弱
}

export interface DayunResult {
  currentDaYun: string;
  dayunPeriods: Array<{
    age: number;
    pillar: string;
    element: string;
  }>;
}

export interface FortuneAdvice {
  yongShen: string[];
  xiShen: string[];
  jiShen: string[];
  lucky: {
    colors: string[];
    directions: string[];
    numbers: number[];
  };
  colors: string[];
  directions: string[];
  numbers: number[];
  career: {
    primary: string[];
    secondary: string[];
    avoid: string[];
    reason: string;
  };
}

export interface LuckyElements {
  elements: string[];
  colors: string[];
  directions: string[];
  numbers: number[];
}

export interface DataStatistics {
  totalUsers: number;
  similarPatterns: number;
  successRate: number;
}

export interface FortuneAnalysisResult {
  basic: {
    name: string;
    birthDate: string;
    birthTime: string;
    bazi: string[];
    dayMaster: string;
  };
  fiveElements: FiveElements;
  tenGods: TenGods;
  pattern: Pattern;
  fortune: {
    currentDaYun: string;
    currentLiuNian: string;
    interaction: string;
    nextYear: string;
    overall: string;
  };
  advice: FortuneAdvice;
  evidence: {
    statistics: DataStatistics;
    celebrities: Array<{
      name: string;
      bazi: string[];
      achievement: string;
      similarity: number;
    }>;
  };
  analysis: {
    physique: string;
    career: string;
    llmUsed: boolean;
  };
  klineData: any;
}
