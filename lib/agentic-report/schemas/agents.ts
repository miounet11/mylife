import type { CoreAgentKey } from '@/lib/agentic-report/agent-definitions';

export type AgentWindow = {
  label: string;
  score: number;
  advice: string;
};

export type BaseAgentOutput = {
  summary: string;
  highlights: string[];
  risks: string[];
  windows: AgentWindow[];
  actions: string[];
  citations: string[];
};

export type CoreConstitutionOutput = BaseAgentOutput & {
  constitutionSummary: string;
  favorableElements: string[];
  unfavorableElements: string[];
};

export type KlineNarrativeOutput = BaseAgentOutput & {
  peakYears: Array<{ year: number; label: string }>;
  troughYears: Array<{ year: number; label: string }>;
  currentPhase: string;
};

export type CareerWealthOutput = BaseAgentOutput & {
  strategy: {
    primaryTrack: string;
    capitalDiscipline: string;
    macroFit: string;
  };
};

export type RelationshipFamilyOutput = BaseAgentOutput & {
  relationshipFocus: string;
  collaborationAdvice: string;
};

export type HealthLifestyleOutput = BaseAgentOutput & {
  bodyFocus: string;
  recoveryAdvice: string;
};

export type StrategyAdvisorOutput = BaseAgentOutput & {
  topPriority: string;
  avoidNow: string;
};

export type TemporalSpatialAdvisorOutput = BaseAgentOutput & {
  temporalSignal: string;
  spatialSignal: string;
  macroSignal: string;
};

const SCHEMA_DOCS: Record<CoreAgentKey, string> = {
  core_constitution: `{
  "summary": "一句话命局结论",
  "constitutionSummary": "命局底盘摘要",
  "favorableElements": ["喜用元素"],
  "unfavorableElements": ["忌神元素"],
  "highlights": ["重点1", "重点2", "重点3"],
  "risks": ["风险1", "风险2"],
  "windows": [{"label":"阶段窗口","score":80,"advice":"具体动作"}],
  "actions": ["动作1", "动作2"],
  "citations": ["constitution", "dayun.windows"]
}`,
  kline_narrative: `{
  "summary": "一句话K线判断",
  "peakYears": [{"year":2032,"label":"峰值说明"}],
  "troughYears": [{"year":2028,"label":"低谷说明"}],
  "currentPhase": "当前阶段标题",
  "highlights": ["重点1", "重点2"],
  "risks": ["风险1"],
  "windows": [{"label":"阶段窗口","score":76,"advice":"动作"}],
  "actions": ["动作1", "动作2"],
  "citations": ["kline.anchorPoints", "kline.windows"]
}`,
  career_wealth: `{
  "summary": "一句话事业财富判断",
  "strategy": {
    "primaryTrack": "主战场",
    "capitalDiscipline": "资金纪律",
    "macroFit": "宏观适配"
  },
  "highlights": ["重点1", "重点2"],
  "risks": ["风险1", "风险2"],
  "windows": [{"label":"关键窗口","score":73,"advice":"动作"}],
  "actions": ["动作1", "动作2"],
  "citations": ["constitution.yongShen", "macroCycles", "timeWindows.career"]
}`,
  relationship_family: `{
  "summary": "一句话关系判断",
  "relationshipFocus": "当前关系重点",
  "collaborationAdvice": "合作边界建议",
  "highlights": ["重点1", "重点2"],
  "risks": ["风险1"],
  "windows": [{"label":"关系窗口","score":68,"advice":"动作"}],
  "actions": ["动作1", "动作2"],
  "citations": ["timeWindows.relationship", "humanFactors"]
}`,
  health_lifestyle: `{
  "summary": "一句话健康判断",
  "bodyFocus": "当前身体关注点",
  "recoveryAdvice": "恢复建议",
  "highlights": ["重点1", "重点2"],
  "risks": ["风险1"],
  "windows": [{"label":"健康窗口","score":64,"advice":"动作"}],
  "actions": ["动作1", "动作2"],
  "citations": ["timeWindows.health", "geoClimate"]
}`,
  strategy_advisor: `{
  "summary": "一句话策略结论",
  "topPriority": "第一优先级",
  "avoidNow": "当前避免事项",
  "highlights": ["重点1", "重点2"],
  "risks": ["风险1"],
  "windows": [{"label":"策略窗口","score":81,"advice":"动作"}],
  "actions": ["动作1", "动作2"],
  "citations": ["kline.windows", "temporal", "macroCycles"]
}`,
  temporal_spatial_advisor: `{
  "summary": "一句话天地人结论",
  "temporalSignal": "节气/立春/流年信号",
  "spatialSignal": "方位/城市/环境信号",
  "macroSignal": "国运/行业运信号",
  "highlights": ["重点1", "重点2"],
  "risks": ["风险1"],
  "windows": [{"label":"时空窗口","score":78,"advice":"动作"}],
  "actions": ["动作1", "动作2"],
  "citations": ["temporal", "macroCycles", "geoClimate", "spatialFactors"]
}`,
};

export function getAgentSchemaDoc(agentKey: CoreAgentKey) {
  return SCHEMA_DOCS[agentKey];
}
