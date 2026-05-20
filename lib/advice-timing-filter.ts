// v5-D42 advice.timing 运行时兜底过滤器
//
// LLM 偶发不遵守 prompt 约束时，从输出里把"近期/将来/合适时机"这类
// 无锚点模糊词条目剔除，让 D41 公开追问页结构卡能按公历月分桶。
//
// 规则（与 lib/prompts/analyze/narrative.ts HARD_CONSTRAINTS 对齐）：
//  - 必须是非空 string（trim 后）
//  - 长度 ≤ 40 字（按 UTF-16 代码单元计，prompt 同口径）
//  - 不得包含任意黑名单模糊词（区分大小写无意义，全部中文）
//  - 最终上限 5 条；非数组输入返回 []
//
// 不强求"必须出现具体时间锚"——这条由 prompt 负责，runtime 只兜底拦截最大噪音源。
// 这样空数组也合法：宁可前端"未识别"，也不让"近期"桶污染时间窗口图。

const FUZZY_TIME_TOKENS = [
  '近期',
  '将来',
  '不久',
  '适当时机',
  '合适时机',
  '合适窗口',
  '一段时间内',
  '短期',
  '中期',
  '长期',
  '未来一段',
];

const MAX_ITEMS = 5;
const MAX_LEN = 40;

export function sanitizeAdviceTiming(input: unknown): string[] {
  if (!Array.isArray(input)) return [];

  const out: string[] = [];
  for (const raw of input) {
    if (typeof raw !== 'string') continue;
    const item = raw.trim();
    if (!item) continue;
    if (item.length > MAX_LEN) continue;
    if (FUZZY_TIME_TOKENS.some((token) => item.includes(token))) continue;
    if (out.includes(item)) continue;
    out.push(item);
    if (out.length >= MAX_ITEMS) break;
  }
  return out;
}

export const __TEST_ONLY = {
  FUZZY_TIME_TOKENS,
  MAX_ITEMS,
  MAX_LEN,
};
