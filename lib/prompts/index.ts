/**
 * Prompt 仓库公开出口。
 *
 * 业务代码引用方式：
 *   import { buildPrompt, getPrompt } from '@/lib/prompts';
 *   const { system, user, temperature } = buildPrompt('analyze.structure', input);
 *
 * 注意：本模块在所有迁移完成前，registry 仅包含已迁移的 prompt id。
 * 未迁移的 id 调用 buildPrompt 会抛错——业务侧继续走 legacy 实现。
 */
export type { PromptSpec, PromptStage, BuiltPrompt, EvalCase, EvalScore } from './types';
export { SCORE_WEIGHTS } from './types';
export { registerPrompt, getPrompt, listPrompts, buildPrompt, dumpPrompt } from './registry';
export { scoreOutput, aggregateScores } from './eval/scorers';
export {
  JUDGMENT_METHOD,
  ANTI_PATTERNS,
  STYLE_CALIBRATION,
  ACTIONS_CONTRACT,
  withWorldYiBase,
} from './shared/world-yi';

// ⬇️ 已迁移 prompt 在这里 import 触发自注册。每迁一个加一行。
import './analyze/structure';
import './analyze/narrative';
import './agentic/core-constitution';
import './agentic/kline-narrative';
import './agentic/career-wealth';
import './agentic/relationship-family';
import './agentic/health-lifestyle';
import './agentic/strategy-advisor';
import './agentic/temporal-spatial-advisor';
import './chat/main';
import './chat/intents';
