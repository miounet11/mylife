/**
 * Trust Report v1.5.0 类型定义
 * 扩展自 user-types.ts，增加报告专用数据结构
 */

import type { FortuneAnalysisResult } from './user-types';

// ==================== 核心报告类型 ====================

/**
 * 完整信任报告数据结构
 */
export interface TrustReportData {
  // 基础信息
  id: string;
  userId: string;
  generatedAt: Date;
  version: string; // '1.5.0'

  // 用户基本信息
  userInfo: {
    name: string;
    birthDate: string;
    birthTime: string;
    gender: 'male' | 'female';
    currentAge: number;
    bazi: string[]; // [年柱, 月柱, 日柱, 时柱]
  };

  // 核心洞察（顶部展示）
  coreInsights: CoreInsights;

  // 命运类型分析
  lifeType: LifeTypeAnalysis;

  // 快速统计
  quickStats: QuickStats;

  // 状态向量（多维度分析）
  stateVector: StateVectorData;

  // 概率分析
  probabilityAnalysis: ProbabilityAnalysisData;

  // 事件预测
  eventPredictions: EventPrediction[];

  // 人生K线数据
  klineData: KlineDataPoint[];

  // LLM 生成的深度分析
  llmAnalysis?: LLMAnalysis;

  // 分享文案
  shareCopies?: ShareCopy[];
}

// ==================== 核心洞察 ====================

export interface CoreInsights {
  // 日主分析
  dayMaster: {
    gan: string; // 天干
    element: string; // 五行
    analysis: string; // 简要分析
  };

  // 用神喜忌
  usefulGod?: string; // "火、土" 或 "火,土"

  // 核心特质（性格总结）
  characterSummary?: string;

  // 人生巅峰
  peakYear?: {
    year: number;
    age: number;
    score: number;
    reason?: string;
  };

  // 人生低谷（可选）
  troughYear?: {
    year: number;
    age: number;
    score: number;
    reason?: string;
  };
}

// ==================== 命运类型分析 ====================

export interface LifeTypeAnalysis {
  // 命运类型
  type: 'delayed_reward' | 'early_peak' | 'high_pressure' | 'noble_dependent' | 'risk_gambler' | 'steady_compound';

  // 置信度 (0-1)
  confidence: number;

  // 当前人生阶段
  currentPhase?: {
    phase: 'accumulation' | 'breakthrough' | 'harvest' | 'transition' | 'stability';
    label: string; // "积累蓄势期"
    description: string;
    turningPoint?: number; // 拐点年龄
  };

  // 统计数据
  stats?: {
    peakAge?: number;
    peakYear?: number;
    currentScore?: number;
    halfDiff?: number; // 前后半生差异
  };
}

// ==================== 快速统计 ====================

export interface QuickStats {
  // 命理总分 (0-10)
  summaryScore?: number;

  // 本年运势趋势
  yearlyTrend?: 'up' | 'down' | 'stable';
  yearlyScore?: number;

  // 财运指数 (0-10)
  wealthScore?: number;

  // 距离巅峰年数
  peakAge?: number;
}

// ==================== 状态向量数据 ====================

export interface StateVectorData {
  // 当前状态向量
  current: {
    tianShi: number; // 天时 (0-10)
    diLi: number;    // 地利 (0-10)
    renHe: number;   // 人和 (0-10)
  };

  // 历史趋势（可选）
  history?: Array<{
    year: number;
    tianShi: number;
    diLi: number;
    renHe: number;
  }>;

  // 未来预测（可选）
  forecast?: Array<{
    year: number;
    tianShi: number;
    diLi: number;
    renHe: number;
  }>;
}

// ==================== 概率分析数据 ====================

export interface ProbabilityAnalysisData {
  // 多层雷达图数据
  radarData: RadarChartData;

  // 概率评分条
  scoreBar: ProbabilityScoreData;

  // 事件概率曲线
  eventCurve?: EventCurveData;
}

export interface RadarChartData {
  // 当前年份数据
  current: {
    year: number;
    dimensions: {
      career: number;    // 事业 (0-10)
      wealth: number;    // 财运 (0-10)
      marriage: number;  // 婚姻 (0-10)
      health: number;    // 健康 (0-10)
      learning: number;  // 学业 (0-10)
      social: number;    // 人际 (0-10)
    };
  };

  // 对比年份（可选）
  comparison?: Array<{
    year: number;
    label: string; // "去年" "明年" "巅峰期"
    dimensions: RadarChartData['current']['dimensions'];
  }>;
}

export interface ProbabilityScoreData {
  // 各维度概率评分
  dimensions: Array<{
    name: string; // "事业成功"
    category: 'career' | 'wealth' | 'marriage' | 'health' | 'learning' | 'social';
    probability: number; // 0-1
    confidence: number;  // 0-1
    trend: 'up' | 'down' | 'stable';
    description?: string;
  }>;
}

export interface EventCurveData {
  // 事件类型
  eventType: string; // "升职" "结婚" "创业"

  // 时间序列概率
  timeline: Array<{
    year: number;
    month?: number;
    probability: number; // 0-1
    confidence: number;  // 0-1
  }>;

  // 峰值时间点
  peakPeriods: Array<{
    startYear: number;
    endYear: number;
    probability: number;
    reason: string;
  }>;
}

// ==================== 事件预测 ====================

export interface EventPrediction {
  // 事件信息
  id: string;
  type: 'career' | 'wealth' | 'marriage' | 'health' | 'learning' | 'social';
  title: string; // "职业突破"
  description: string;

  // 时间预测
  timing: {
    mostLikely: {
      year: number;
      month?: number;
      probability: number; // 0-1
    };
    alternativePeriods?: Array<{
      year: number;
      month?: number;
      probability: number;
    }>;
  };

  // 影响因素
  factors: {
    favorable: string[]; // 有利因素
    unfavorable: string[]; // 不利因素
    keyTriggers: string[]; // 关键触发点
  };

  // 建议
  advice: {
    preparation: string[]; // 准备工作
    timing: string; // 时机把握
    avoid: string[]; // 避免事项
  };

  // 置信度
  confidence: number; // 0-1
}

// ==================== K线数据 ====================

export interface KlineDataPoint {
  year: number;
  age: number;

  // 各维度评分 (0-10)
  career: number;
  wealth: number;
  marriage: number;
  health: number;

  // 综合评分
  overall?: number;

  // 关键事件标记
  events?: Array<{
    type: string;
    label: string;
    impact: 'positive' | 'negative' | 'neutral';
  }>;
}

// ==================== LLM 分析 ====================

export interface LLMAnalysis {
  // 开场白（吸引注意）
  opening: string;

  // 核心洞察（3-5个关键点）
  keyInsights: Array<{
    title: string;
    content: string;
    importance: 'high' | 'medium' | 'low';
  }>;

  // 人生阶段分析
  phaseAnalysis: {
    past: string; // 过去总结
    present: string; // 当前状态
    future: string; // 未来展望
  };

  // 决策建议
  decisionAdvice: Array<{
    scenario: string; // 场景
    recommendation: string; // 建议
    reasoning: string; // 理由
    timing: string; // 时机
  }>;

  // 风险提示
  riskWarnings?: Array<{
    period: string; // 时间段
    risk: string; // 风险描述
    severity: 'low' | 'medium' | 'high';
    mitigation: string; // 应对措施
  }>;

  // 结语（鼓励与展望）
  closing: string;

  // 生成元数据
  metadata: {
    model: string;
    generatedAt: Date;
    tokensUsed?: number;
    confidence: number; // 0-1
  };
}

// ==================== 分享文案 ====================

export interface ShareCopy {
  type: 'wechat' | 'weibo' | 'douyin' | 'xiaohongshu' | 'generic';
  text: string;
  hashtags?: string[];
  imageUrl?: string;
}

// ==================== 报告生成配置 ====================

export interface ReportGenerationConfig {
  // 用户ID
  userId: string;

  // 是否使用 LLM 增强
  useLLM: boolean;

  // LLM 配置
  llmConfig?: {
    model: 'gpt-4' | 'gpt-3.5-turbo' | 'claude-3' | 'deepseek';
    temperature: number;
    maxTokens: number;
  };

  // 报告详细程度
  detailLevel: 'basic' | 'standard' | 'detailed' | 'expert';

  // 包含的模块
  modules: {
    coreInsights: boolean;
    lifeType: boolean;
    quickStats: boolean;
    stateVector: boolean;
    probabilityAnalysis: boolean;
    eventPredictions: boolean;
    klineChart: boolean;
    llmAnalysis: boolean;
    shareCopies: boolean;
  };

  // 时间范围
  timeRange?: {
    startYear: number;
    endYear: number;
  };

  // 语言
  language: 'zh-CN' | 'zh-TW' | 'en';
}

// ==================== 报告存储格式 ====================

export interface StoredReport {
  id: string;
  userId: string;
  version: string;
  data: TrustReportData;
  config: ReportGenerationConfig;
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date;
  viewCount: number;
  shareCount: number;
}

// ==================== Report V4 页面分区类型 ====================

export interface ReportCockpitSection {
  headline: string;
  judgment?: string;
  stageLabel?: string;
  identityLabel?: string;
  confidenceLabel?: string;
  topActions: string[];
  avoidances: string[];
  focusChips: string[];
  periodCards: Array<{
    label: string;
    value: string;
    tone?: 'push' | 'steady' | 'caution';
    note?: string;
  }>;
}

export interface ReportLifeKLineSection {
  headline?: string;
  summary?: string;
  arcLabel?: string;
  latestMetrics: Array<{
    label: string;
    value: string;
    tone?: 'strong' | 'steady' | 'watch';
  }>;
}

export interface ReportBlueprintSection {
  typeLabel?: string;
  strongestAdvantage?: string;
  recurringRisk?: string;
  usefulDirection?: string;
  unsuitablePattern?: string;
  facts: string[];
}

export interface ReportCurrentStateSection {
  headline: string;
  summary?: string;
  stance: 'push' | 'hold' | 'adjust' | 'recover';
  stanceLabel: string;
  evidence: string[];
  usageNote?: string;
}

export interface ReportTimelineSection {
  headline?: string;
  summary?: string;
  items: Array<{
    label: string;
    theme: string;
    status: 'push' | 'steady' | 'caution';
    statusLabel: string;
    reason?: string;
  }>;
}

export interface ReportScenarioPanelSection {
  summary?: string;
  panels: Array<{
    key: string;
    title: string;
    verdict: string;
    reason: string;
    action: string;
    status: 'push' | 'steady' | 'caution';
    scoreLabel?: string;
  }>;
}

export interface ReportActionBoardSection {
  focusSummary?: string;
  now: string[];
  next30Days: string[];
  next90Days: string[];
  avoidList: string[];
}

export interface ReportValidationSection {
  confidenceLabel?: string;
  summary?: string;
  tone?: 'high' | 'medium' | 'watch';
  highConfidencePoints: string[];
  sensitivePoints: string[];
  correctionSummary?: string;
  eventPrompts: string[];
}

export interface ReportPersonalityBridgeSection {
  label?: string;
  summary?: string;
  traits: string[];
  disclaimers: string[];
}

export interface ReportV4Sections {
  cockpit: ReportCockpitSection;
  lifeKLine: ReportLifeKLineSection;
  coreBlueprint: ReportBlueprintSection;
  currentOperatingSystem: ReportCurrentStateSection;
  timeline12Months: ReportTimelineSection;
  scenarioPanels: ReportScenarioPanelSection;
  actionBoard: ReportActionBoardSection;
  validationLayer: ReportValidationSection;
  personalityBridge?: ReportPersonalityBridgeSection;
}

// ==================== 辅助类型 ====================

/**
 * 从 FortuneAnalysisResult 转换为 TrustReportData 的映射器
 */
export type ReportDataMapper = (result: FortuneAnalysisResult, config: ReportGenerationConfig) => Promise<TrustReportData>;

/**
 * 报告组件通用 Props
 */
export interface ReportComponentProps {
  data: TrustReportData;
  className?: string;
  compact?: boolean;
}
