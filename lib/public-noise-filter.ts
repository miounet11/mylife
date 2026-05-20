// v5-D43/D45 公开页噪音过滤共享工具
//
// 来源：在公开追问/报告/内容 Feed 中观察到 LLM 多次把以下东西混进用户视图：
//  1) 运维工程指令（"补齐 evidence/actions"、"升级重算"、"低分测算"）
//     —— 它们的源头是 qualityAudit.recommendedActions / feedbackLoop.* 字段
//  2) 历史幻觉的过去年份窗口（"2016-2020 阶段尝试小规模合作"）
//     —— LLM 偶尔会从训练知识里捞过去的年份当成"未来建议"
//  3) 工程占位词（macro_cycle / solar_terms / ENGINE_* / CONTEXT_* / orchestrate 等）
//
// 规则：宁可空数组也不放噪音条目。结构卡/列表上层自有 fallback。

const PUBLIC_NOISE_TOKENS = [
  'evidence',
  'actions',
  'orchestrat',
  'recommend',
  'audit',
  'fixes',
  'checkpoint',
  '低分测算',
  '正式报告编排',
  '稍后升级重算',
  '升级重算',
  '核对出生时间与地点',
  '已脱敏，并稍后',
];

export function isPublicNoiseLine(text: string): boolean {
  if (!text) return false;
  const lower = text.toLowerCase();
  if (PUBLIC_NOISE_TOKENS.some((t) => lower.includes(t.toLowerCase()))) return true;
  const years = Array.from(text.matchAll(/(19|20)\d{2}/g)).map((m) => Number(m[0]));
  if (years.length > 0) {
    const currentYear = new Date().getUTCFullYear();
    const maxYear = Math.max(...years);
    if (maxYear < currentYear - 1) return true;
  }
  return false;
}

export const __TEST_ONLY = { PUBLIC_NOISE_TOKENS };
