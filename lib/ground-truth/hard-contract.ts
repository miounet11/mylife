/**
 * Shared LLM hard contracts for engine+LLM fusion.
 * Engine fields are the only factual source; LLM only interprets / paraphrases.
 */

/** Drop-in system block for agentic agents and report LLM. */
export const ENGINE_HARD_CONTRACT = [
  '【引擎硬约束 · 违反视为失败】',
  '1. 引擎字段为唯一事实源：日主、四柱干支、用神/喜神/忌神、大运干支与起止年龄、K线锚点年份、窗口标签，只能复述或解释，禁止改写、拼凑或新造。',
  '2. 禁止自行推算或「补全」引擎未给出的大运、十神、格局名、流年干支；数据缺失时写 uncertainty / 降级，不要猜测。',
  '3. 用神/忌神建议必须与 ENGINE_CONSTITUTION 一致；不得把忌神说成主用方向。',
  '4. windows.label / peakYears / troughYears 必须取自 ENGINE_* 已给集合；不得发明新时间窗标签或锚点年。',
  '5. 你只做表达与决策翻译，不重算命盘；所有计算已在服务端完成。',
  '6. 结合 USER_LIFE_CONTEXT 只调整侧重点与语气，不得推翻命局结构结论。',
  '7. 对 UNCERTAINTY_NOTES 必须在结论中保留不确定性；禁止绝对化命运断言。',
  '8. 输出合法 JSON（若任务要求 JSON）；叙述用白话；术语必须立刻跟生活含义。',
].join('\n');

/** Soft teacher chat contract when report lock payload is present. */
export const CHAT_ENGINE_CONTRACT = [
  '【报告真值约束】',
  '- 下列锁定事实来自结构引擎，回答时必须对齐，不得改写干支/用神/大运年龄。',
  '- 信息不足时说明边界并建议回看报告，不要自行推算八字。',
  '- 不做医学诊断、法律判断或具体投资标的承诺。',
].join('\n');

/** Free-tool / theme projector contract. */
export const TOOL_ENGINE_CONTRACT = [
  '【工具输出硬约束】',
  '1. 结论必须能在引擎字段中找到依据（用神、大运、K线分数、窗口）。',
  '2. 不得用与本工具主题无关的整份报告开场白复述。',
  '3. 保留年份、分数、五行与大运干支字面。',
].join('\n');

export function prependHardContract(systemPrompt: string, contract = ENGINE_HARD_CONTRACT): string {
  const base = `${systemPrompt || ''}`.trim();
  if (!base) return contract;
  if (base.includes('【引擎硬约束')) return base;
  return `${contract}\n\n${base}`;
}
