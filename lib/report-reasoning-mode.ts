export type ReportReasoningMode = 'engine' | 'deterministic-expert' | 'parallel-agents';

export function deriveReportReasoningMode(params: {
  reasoningMode?: string;
  agenticUsed?: boolean;
  orchestrationMode?: string;
  agentResults?: Record<string, unknown>;
  contextSignals?: Record<string, unknown>;
  verifyVerdict?: 'PASS' | 'WARN' | 'FAIL';
  enhancementNotes?: string[];
}): ReportReasoningMode {
  if (params.reasoningMode === 'engine' || params.reasoningMode === 'deterministic-expert' || params.reasoningMode === 'parallel-agents') {
    return params.reasoningMode;
  }

  if (params.agenticUsed || params.orchestrationMode === 'parallel-agents') {
    return 'parallel-agents';
  }

  if (params.orchestrationMode === 'deterministic-expert' || params.orchestrationMode === 'single-llm') {
    return 'deterministic-expert';
  }

  if (
    Object.keys(params.agentResults || {}).length > 0 ||
    Object.keys(params.contextSignals || {}).length > 0 ||
    !!params.verifyVerdict ||
    (params.enhancementNotes || []).some((item) => item.includes('专家层') || item.includes('天地人'))
  ) {
    return 'deterministic-expert';
  }

  return 'engine';
}

export function getReasoningModeLabel(mode: ReportReasoningMode) {
  if (mode === 'parallel-agents') return '并发 Agent';
  if (mode === 'deterministic-expert') return 'Deterministic 专家层';
  return '基础引擎';
}

export function getReasoningModeDescription(mode: ReportReasoningMode) {
  if (mode === 'parallel-agents') {
    return '命理引擎、天地人上下文、并发专家与一致性校验已同时进入主报告。';
  }
  if (mode === 'deterministic-expert') {
    return '命理引擎之上已叠加 deterministic 专家层、人生 K 线锚点与天地人上下文补强。';
  }
  return '当前报告主要由结构化命理引擎直接解释，尚未进入专家层补强。';
}
