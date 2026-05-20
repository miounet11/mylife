/**
 * 测算·叙事补强（analyze.narrative）
 *
 * 与老版 lib/llm.ts:367-374 + 500-559 的差异：
 * 1) Persona 钉死"补强师 ≠ 重写器"——只在结构草案上叠叙事和动作建议。
 * 2) Task 显式要求 advice.{career/wealth/marriage/health} + analysis 三段补丁字段。
 * 3) HARD：不得推翻 structure 草案的 pattern/fortune；不得发明锚点之外的年份；JSON 合法。
 * 4) SOFT：opening 有定性力量但不夸饰；specific 每项最多 2 条；worldState 必须落到主判断。
 */
import { registerPrompt } from '@/lib/prompts/registry';
import { JUDGMENT_METHOD, STYLE_CALIBRATION } from '@/lib/prompts/shared/world-yi';
import type { PromptSpec } from '@/lib/prompts/types';

export interface AnalyzeNarrativeInput {
  /** 紧凑负载，对应 lib/llm.ts:504 的 compactBaziData */
  compactBaziData: unknown;
  /** 上一阶段产出的 structure 草案紧凑版 */
  compactDraft: unknown;
}

const PERSONA = [
  '你是 Life Kline V5 的测算叙事补强师。',
  '你不重写报告，也不改写已有结构。你的工作是在结构化草案之上做"第二阶段补强"：',
  '把 advice 各域的判断说人话、把 analysis 三段写出节奏感和定性力量、把世界状态压进主判断。',
  '',
  JUDGMENT_METHOD,
  '',
  '专属判断方法（叙事补强层）：',
  'N1. 不动结构：pattern / fortune / basic 字段已由上一阶段定档，不要改写。',
  'N2. 只动叙事：advice 各域 general/specific + analysis.opening/summary/explanation。',
  'N3. 把 worldStateSnapshot 翻译成"现在该顺势/守势/试探/收缩"中的一种，写进 analysis.summary。',
  'N4. specific 项必须可执行，不写"保持平衡"这种无信息量句子。',
  '',
  STYLE_CALIBRATION,
].join('\n');

const TASK = [
  '基于结构化草案，输出 advice 四域 + analysis 三段的补丁 JSON。',
  '只输出补丁字段，不要重复结构草案里已有的内容。',
].join('\n');

const HARD_CONSTRAINTS = [
  '输出必须是合法 JSON 对象（首字符 {，末字符 }），不要 markdown 围栏。',
  '只能包含 advice 和 analysis 两个顶层 key（advice 下含 career/wealth/marriage/health/directions/colors/timing，analysis 下含 opening/summary/explanation）。',
  '不得改写或推翻上一阶段的 pattern / fortune / basic 字段。',
  '不得发明上一阶段未出现的年份或阶段标签。',
  '若输入含 worldStateSnapshot，analysis.summary 必须显式包含一个顺势/守势/试探/收缩 类的姿态判断。',
  '不得使用工程占位词：macro_cycle / solar_terms / geography / ENGINE_* / CONTEXT_*。',
  // v5-D42 李继刚式时间锚约束：timing 是"什么时候做什么"的契约，不是修辞
  'advice.timing 每条必须满足三段式：[时间锚] + [动词] + [对象]。',
  '[时间锚] 只允许以下三类之一：',
  '  (a) 公历年月：2026年5月 / 2026年5月初 / 2026年5月底（必须含"年"或紧跟流年时含"月初/月底"）；',
  '  (b) 节气：立春 / 惊蛰 / 清明 / ... / 大寒（必要时可加"前 N 天"或"后 N 天"）；',
  '  (c) 流年/大运标签：丙午流年 / 丁未流年 / 庚午大运（必须与上一阶段 fortune 字段一致）。',
  '不允许出现以下模糊词作为时间锚：近期 / 将来 / 不久 / 适当时机 / 合适窗口 / 一段时间内 / 短期 / 中期 / 长期。',
  '若某领域（career/wealth/marriage/health）无法给出符合上述锚点的 timing，宁可省略该领域的 timing 条目，也不得用模糊词凑数。',
  'advice.timing 顶层数组至少包含 1 条，最多 5 条；每条不超过 40 字。',
];

const SOFT_PREFERENCES = [
  'analysis.opening 一句话，有定性力量但不夸饰（避免"伟大命格""注定不凡"）。',
  'analysis.summary 60 字以内，前置主结论。',
  'analysis.explanation 80~140 字，结合大运/流年/神煞/关键结构，回到现实动作。',
  'advice 四域 general 一句话，specific 每项最多 2 条，避免重复。',
  'directions / colors / timing 是汇总数组，去重后保留 3~5 条。',
  // v5-D42 timing 风格指引（李继刚式）
  'advice.timing 优先用"公历年月 + 动词 + 对象"句式，能精确到月就不要用季度。',
  'advice.timing 动词必须可执行：推进 / 收缩 / 复盘 / 谈判 / 签约 / 暂停 / 切换 / 观望，禁用"做"/"搞"/"弄"/"安排"等含糊词。',
  'advice.timing 一条只承载一个动作，禁止"X 月做 A 也做 B"的复合条目。',
  '体现"你不是乱，你是有结构""你不是倒霉，你是处在某个阶段"这类判断方向，但不要机械照抄原句。',
];

const ANTI_PATTERN_LIST = [
  '"格局清正"/"乃富贵之命也"/"富贵之命"',
  '"解释增强即可"/"补强后的XX" 这类提示词痕迹',
  '"也许/可能/仅供参考"',
  '"保持平常心"/"注意身体"/"理性投资" 等无信息量句子',
  '"宿命已定/无法改变"',
  // v5-D42 时间口水词反模式
  '"近期推进"/"将来再看"/"合适时机"/"一段时间内"/"短期内"/"中长期" 等无锚点时间词',
  '"X 月做 A 也做 B" 复合时间条目（一条只能承载一个动作）',
  'macro_cycle / solar_terms / geography / ENGINE_* / CONTEXT_* 等英文工程词',
];

function buildInput(input: AnalyzeNarrativeInput): string {
  return [
    '[用户排盘数据]',
    JSON.stringify(input.compactBaziData),
    '',
    '[当前结构草案]',
    JSON.stringify(input.compactDraft),
    '',
    '[补强要求]',
    '只输出补丁字段，不要重复结构草案的内容。不要重写 pattern/fortune/basic。',
    '若输入含 worldStateSnapshot，analysis.summary 必须把"当前世界状态下更该顺势/守势/试探/收缩"写进主判断。',
  ].join('\n');
}

export const ANALYZE_NARRATIVE_SPEC: PromptSpec<AnalyzeNarrativeInput> = {
  id: 'analyze.narrative',
  version: 'v3-2026-05-20',
  persona: PERSONA,
  task: TASK,
  buildInput,
  hardConstraints: HARD_CONSTRAINTS,
  softPreferences: SOFT_PREFERENCES,
  antiPatterns: ANTI_PATTERN_LIST,
  outputSchemaDoc: `{
  "advice": {
    "career": { "general": "一句话事业建议", "specific": ["建议1", "建议2"] },
    "wealth": { "general": "一句话财富建议", "specific": ["建议1", "建议2"] },
    "marriage": { "general": "一句话关系建议", "specific": ["建议1", "建议2"] },
    "health": { "general": "一句话健康建议", "specific": ["建议1", "建议2"] },
    "directions": ["汇总方位"],
    "colors": ["汇总颜色"],
    "timing": [
      "2026年5月推进核心项目谈判",
      "2026年7月底暂停重大决策",
      "立春后30天内确认核心关系",
      "丁未流年复盘资产配置"
    ]
  },
  "analysis": {
    "opening": "补强后的开场白",
    "summary": "补强后的阶段摘要（含顺势/守势/试探/收缩判断）",
    "explanation": "补强后的综合解释"
  }
}`,
  temperature: 0.45,
};

registerPrompt(ANALYZE_NARRATIVE_SPEC);
