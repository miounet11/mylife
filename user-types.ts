// 用户档案类型定义
export interface UserFortuneProfile {
  id: string;
  name: string;
  birthDate: Date;
  birthTime: string;
  birthPlace: string;
  timezone: number;
  gender: 'male' | 'female';
  
  // 命理数据（静态）
  bazi: {
    pillars: Pillar[];
    fiveElements: FiveElements;
    tenGods: TenGods;
    pattern: Pattern;
    dayMaster: string;
    nayin: string;
  };
  
  // 年运势（动态更新）
  yearlyFortune: Map<number, YearlyFortune>;
  
  // 月运势（动态更新）
  monthlyFortune: Map<string, MonthlyFortune>;
  
  // 重要节点（历史记录）
  importantEvents: ImportantEvent[];
  
  // 用户问题（历史记录）
  questions: FortuneQuestion[];
  
  // 偏好设置
  preferences: {
    notification: boolean;
    detailLevel: 'basic' | 'detailed' | 'expert';
    language: string;
  };
  
  // 增运记录
  fortuneEnhancements: FortuneEnhancement[];
  
  // 创建时间
  createdAt: Date;
  
  // 更新时间
  updatedAt: Date;
}

export interface Pillar {
  celestialStem: string;  // 天干
  earthlyBranch: string;   // 地支
  hiddenStems: string[];   // 藏干
  nayin: string;           // 纳音
  fiveElements: {
    main: string;          // 主五行
    hidden: string[];       // 藏干五行
    strength: number;       // 五行强弱
  };
  relationships: {
    combination: string[];  // 合化
    clash: string[];        // 冲克
    penalty: string[];      // 刑害
    harm: string[];         // 破害
  };
}

export interface FiveElements {
  wood: { strength: number; quality: string; description: string };
  fire: { strength: number; quality: string; description: string };
  earth: { strength: number; quality: string; description: string };
  metal: { strength: number; quality: string; description: string };
  water: { strength: number; quality: string; description: string };
}

export interface TenGods {
  self: string;      // 自身
  output: string[];  // 生我
  input: string[];   // 我生
  control: string[]; // 我克
  controlled: string[];  // 克我
}

export interface Pattern {
  type: string;
  strength: string;
  quality: string;
  description: string;
}

export interface YearlyFortune {
  year: number;
  pillar: string;
  quality: 'excellent' | 'good' | 'fair' | 'poor';
  career: string;
  wealth: string;
  marriage: string;
  health: string;
  overall: string;
  advice: string[];
}

export interface MonthlyFortune {
  month: string; // YYYY-MM
  yearPillar: string;
  monthPillar: string;
  quality: 'excellent' | 'good' | 'fair' | 'poor';
  career: string;
  wealth: string;
  marriage: string;
  health: string;
  overall: string;
  luckyDays: string[];
  unluckyDays: string[];
}

export interface ImportantEvent {
  id: string;
  type: 'career' | 'wealth' | 'marriage' | 'health' | 'family' | 'other';
  date: Date;
  description: string;
  impact: 'positive' | 'negative' | 'neutral';
  
  // 命理分析
  fortuneAnalysis: {
    relatedPillar: string;
    relatedGod: string;
    explanation: string;
    predictionAccuracy: boolean;
  };
  
  // 用户反馈
  userFeedback: {
    wasAccurate: boolean;
    userNotes: string;
  };
  
  // 后续建议
  followUpAdvice: {
    shortTerm: string;
    longTerm: string;
    nextCheckDate: Date;
  };
  
  createdAt: Date;
  updatedAt: Date;
}

export interface FortuneQuestion {
  id: string;
  userId: string;
  question: string;
  category: string;
  date: Date;
  
  // AI分析
  analysis: {
    relevantPillar: string;
    relevantFiveElement: string;
    relevantTenGod: string;
    answer: string;
    confidence: number;
  };
  
  // 用户反馈
  userFeedback: {
    rating: number; // 1-5星
    helpful: boolean;
    followUp: string;
  };
  
  createdAt: Date;
  updatedAt: Date;
}

export interface FortuneEnhancement {
  id: string;
  userId: string;
  type: 'color' | 'direction' | 'amulet' | 'ritual' | 'date';
  
  // 增运信息
  enhancement: {
    title: string;
    description: string;
    effectiveness: number; // 有效期（天数）
    startDate: Date;
    endDate: Date;
  };
  
  // 具体建议
  specificAdvice: {
    colors: string[];
    directions: string[];
    items: string[];
    actions: string[];
  };
  
  // 使用记录
  usage: {
    timesUsed: number;
    lastUsed: Date;
    effectiveness: number; // 用户反馈的有效性评分
  };
  
  createdAt: Date;
  updatedAt: Date;
}

// 会话类型
export interface Session {
  id: string;
  userId: string;
  startTime: Date;
  lastActive: Date;
  
  // 会话上下文
  context: {
    currentTopic: string;
    recentQuestions: FortuneQuestion[];
    userMood: string;
    recentEvents: ImportantEvent[];
  };
  
  // 对话历史
  messages: ChatMessage[];
  
  // 会话标签
  tags: string[];
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  
  // AI分析
  analysis?: {
    fortuneContext: string;
    personalized: boolean;
  };
}

// 事件提醒类型
export interface FortuneEvent {
  id: string;
  type: 'auspicious' | 'inauspicious' | 'neutral';
  title: string;
  description: string;
  
  // 时间
  date: Date;
  duration: string;
  
  // 命理分析
  fortuneAnalysis: {
    relatedPillar: string;
    relatedGod: string;
    favorable: boolean;
    explanation: string;
  };
  
  // 具体建议
  advice: {
    do: string[];
    avoid: string[];
    prepare: string;
  };
  
  // 提醒设置
  reminder: {
    enabled: boolean;
    advanceDays: number;
    methods: ('app' | 'email' | 'sms')[];
  };
  
  createdAt: Date;
  updatedAt: Date;
}

// 化灾预警类型
export interface DisasterWarning {
  id: string;
  userId: string;
  type: 'career' | 'wealth' | 'health' | 'marriage' | 'family';
  
  // 时间范围
  startDate: Date;
  endDate: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
  
  // 命理预警
  fortunePrediction: {
    trigger: string; // 触发原因
    description: string; // 详细描述
    affectedAreas: string[]; // 受影响方面
    probability: number; // 发生概率
  };
  
  // 防护措施
  protectionMeasures: {
    immediate: string[]; // 立即采取的措施
    shortTerm: string[]; // 短期措施
    longTerm: string[]; // 长期措施
    
    // 增运建议
    fortuneEnhancements: {
      rituals: string[]; // 仪式
      amulets: string[]; // 护身符
      colors: string[]; // 颜色
      directions: string[]; // 方位
      dates: Date[]; // 吉日
    };
  };
  
  // 提醒设置
  reminder: {
    enabled: boolean;
    advanceDays: number; // 提前多少天提醒
    frequency: 'daily' | 'weekly' | 'once';
  };
  
  createdAt: Date;
  updatedAt: Date;
}

// 增运提醒类型
export interface FortuneEnhancementReminder {
  id: string;
  userId: string;
  type: 'color' | 'direction' | 'amulet' | 'ritual' | 'date';
  
  // 增运信息
  enhancement: {
    title: string;
    description: string;
    effectiveness: number; // 有效期（天数）
    startDate: Date;
    endDate: Date;
  };
  
  // 具体建议
  specificAdvice: {
    colors: string[];
    directions: string[];
    items: string[];
    actions: string[];
  };
  
  // 提醒设置
  reminder: {
    enabled: boolean;
    frequency: 'daily' | 'weekly' | 'monthly';
    nextReminder: Date;
  };
  
  createdAt: Date;
  updatedAt: Date;
}

// 命理分析结果类型（用于展示）
export interface FortuneAnalysisResult {
  // 基础信息
  basic: {
    dayMaster: string;
    pillars: Pillar[];
  };
  
  // 五行分析
  fiveElements: FiveElements;
  
  // 十神配置
  tenGods: TenGods;
  
  // 格局判断
  pattern: Pattern;
  
  // 运势分析
  fortune: {
    currentDaYun: string;
    currentLiuNian: string;
    interaction: string;
    nextYear: string;
  };
  
  // 个性化建议
  advice: {
    career: CareerAdvice;
    wealth: WealthAdvice;
    marriage: MarriageAdvice;
    health: HealthAdvice;
    colors: string[];
    directions: string[];
    timing: string[];
  };
  
  // 数据支撑
  evidence: {
    statistics: DataStatistics;
    celebrities: Celebrity[];
    similarCases: SimilarCase[];
  };
}

export interface CareerAdvice {
  general: string;
  specific: string[];
  timing: string;
  avoid: string[];
  direction: string;
  colors: string[];
}

export interface WealthAdvice {
  general: string;
  specific: string[];
  timing: string;
  direction: string;
  colors: string[];
  avoid: string[];
}

export interface MarriageAdvice {
  general: string;
  specific: string[];
  timing: string;
  direction: string;
  colors: string[];
}

export interface HealthAdvice {
  general: string;
  specific: string[];
  timing: string;
  directions: string[];
  colors: string[];
  avoid: string[];
}

export interface DataStatistics {
  totalSamples: number;
  similarCases: number;
  successRate: number;
  averageIncome: string;
  averageAge: number;
}

export interface Celebrity {
  name: string;
  bazi: string[];
  similar: string[];
  lesson: string;
}

export interface SimilarCase {
  age: number;
  income: string;
  success: boolean;
  lesson: string;
}
