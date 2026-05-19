/**
 * Prompt 中央仓库的类型定义。
 * 所有送给 LLM 的提示词都应表达为 PromptSpec，并通过 registry 暴露。
 */

export type PromptStage =
  | 'analyze.structure'
  | 'analyze.narrative'
  | 'agentic.core_constitution'
  | 'agentic.kline_narrative'
  | 'agentic.career_wealth'
  | 'agentic.relationship_family'
  | 'agentic.health_lifestyle'
  | 'agentic.strategy_advisor'
  | 'agentic.temporal_spatial_advisor'
  | 'chat.main'
  | 'chat.intent.event_simulation'
  | 'chat.intent.event_verdict'
  | 'chat.intent.event_review'
  | 'chat.intent.meihua_enhancement'
  | 'chat.intent.palmistry_reading'
  | 'chat.intent.home_layout_diagnosis';

/**
 * 五段式提示词。任何一段缺失都应在 build 时显式给空字符串而不是 undefined。
 */
export interface PromptSpec<Input = unknown> {
  id: PromptStage;
  version: string;
  /** Persona：你是谁、你的判断方法是什么（不要只写头衔） */
  persona: string;
  /** Task：本次要完成的具体动作（一句话定锚） */
  task: string;
  /** Input：把输入数据拼成模型可用的字符串（实现而非内容） */
  buildInput: (input: Input) => string;
  /** 硬约束：违反即失败 */
  hardConstraints: string[];
  /** 软偏好：评分项 */
  softPreferences: string[];
  /** 反模式：禁止输出的具体表达（用于评分） */
  antiPatterns: string[];
  /** 输出 schema（JSON schema doc / zod doc 字符串） */
  outputSchemaDoc: string;
  /** 温度建议 */
  temperature: number;
  /** 兼容老路径：是否仍然走旧实现，灰度切换用 */
  legacy?: boolean;
}

export interface BuiltPrompt {
  system: string;
  user: string;
  temperature: number;
  meta: { id: PromptStage; version: string };
}

/**
 * 评测样例：一个真实输入快照 + 期望命中/反命中。
 */
export interface EvalCase<Input = unknown> {
  id: string;
  promptId: PromptStage;
  input: Input;
  /** 必须出现在输出里的片段 */
  mustInclude?: string[];
  /** 必须不出现的片段（反模式） */
  mustExclude?: string[];
  /** 引擎真值字段：用于 engine_consistency 评分 */
  engineTruth?: Record<string, unknown>;
}

export interface EvalScore {
  caseId: string;
  promptId: PromptStage;
  promptVersion: string;
  scores: {
    structure_completeness: number;
    evidence_density: number;
    anti_pattern_hit: number;
    engine_consistency: number;
    human_taste: number;
  };
  total: number;
  notes: string[];
}

export const SCORE_WEIGHTS = {
  structure_completeness: 0.2,
  evidence_density: 0.2,
  anti_pattern_hit: 0.15,
  engine_consistency: 0.3,
  human_taste: 0.15,
} as const;
