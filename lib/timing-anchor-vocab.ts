/**
 * v5-D49 时间锚词表共享源（single source of truth）
 *
 * 历史：D42 把"李继刚式时间锚契约"先写进 lib/prompts/analyze/narrative.ts，
 * D48 又复制到 lib/prompts/agentic/strategy-advisor.ts、temporal-spatial-advisor.ts，
 * 加上 lib/advice-timing-filter.ts 的 runtime 兜底——同一份词表/句法在 4 处复制粘贴。
 *
 * 漂移已经发生：
 * - narrative HARD 黑名单 9 词（缺"合适时机"、"未来一段"）
 * - 两个 advisor + filter 是 11 词
 *
 * 收敛策略：本文件只导出常量与 prompt 文本片段构造函数，不改变契约语义。
 * 黑名单按 11 词为准（更严的一边），narrative 这次顺手补齐两词。
 *
 * 不在本文件做的事：
 * - 不导出运行时过滤函数（保留在 lib/advice-timing-filter.ts，避免循环依赖与膨胀）
 * - 不导出"是否带锚点"的判定（prompt 端是叙述约束，runtime 端只剔黑名单，不强求白名单命中）
 */

/** 时间锚模糊词黑名单（runtime + prompt 共用） */
export const FUZZY_TIME_TOKENS = [
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
] as const;

/** 时间锚动词白名单（prompt 软偏好引用） */
export const TIMING_VERB_WHITELIST = [
  '推进',
  '收缩',
  '复盘',
  '谈判',
  '签约',
  '暂停',
  '切换',
  '观望',
] as const;

/** 时间锚动词黑名单（prompt 软偏好引用） */
export const TIMING_VERB_BLACKLIST = ['做', '搞', '弄', '安排'] as const;

/** sanitizeAdviceTiming 的上限常量，与 prompt 端 HARD 同步（如修改记得同改 narrative/advisor 的"≤40 字 / 2~5 条"句子） */
export const TIMING_MAX_ITEMS = 5;
export const TIMING_MAX_LEN = 40;

/**
 * 构造 prompt HARD 段的时间锚契约文本片段。
 * 调用方：narrative / strategy-advisor / temporal-spatial-advisor
 *
 * @param target 字段名，narrative 用 'advice.timing'；advisor 用 'actions'
 * @param itemRange 数组长度区间文本，narrative 是 '1~5 条'；advisor 是 '2~5 条'（受 ACTIONS_CONTRACT 下限约束）
 */
export function buildTimingAnchorHardConstraints(target: string, itemRange: string): string[] {
  const blacklistText = FUZZY_TIME_TOKENS.join(' / ');
  return [
    `${target} 每条必须满足三段式：[时间锚] + [动词] + [对象]。`,
    '[时间锚] 只允许以下三类之一：',
    '  (a) 公历年月：2026年5月 / 2026年5月初 / 2026年5月底（必须含"年"）；',
    '  (b) 节气：立春 / 惊蛰 / 清明 / ... / 大寒（可加"前 N 天"或"后 N 天"）；',
    '  (c) 流年/大运标签：丙午流年 / 丁未流年 / 庚午大运（必须与上一阶段 fortune 字段一致）。',
    `不允许在 ${target} 中出现以下模糊词作为时间锚：${blacklistText}。`,
    `${target} 数组 ${itemRange}；每条不超过 ${TIMING_MAX_LEN} 字；一条只承载一个动作。`,
  ];
}

/**
 * 构造 prompt SOFT 段的时间锚动词偏好文本片段。
 */
export function buildTimingVerbSoftPreferences(target: string): string[] {
  const verbWhite = TIMING_VERB_WHITELIST.join(' / ');
  const verbBlack = TIMING_VERB_BLACKLIST.map((v) => `"${v}"`).join('/');
  return [
    `${target} 优先用"公历年月 + 动词 + 对象"句式，能精确到月就不要用季度。`,
    `${target} 动词必须可执行：${verbWhite}，禁用 ${verbBlack} 等含糊词。`,
    `${target} 一条只承载一个动作，禁止"X 月做 A 也做 B"的复合条目。`,
  ];
}

/**
 * 构造 prompt ANTI 段的时间口水反模式片段。
 */
export function buildTimingAntiPatterns(): string[] {
  return [
    '"近期推进"/"将来再看"/"合适时机"/"一段时间内"/"短期内"/"中长期" 等无锚点时间词',
    '"X 月做 A 也做 B" 复合时间条目（一条只能承载一个动作）',
  ];
}
