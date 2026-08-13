/**
 * Chat answer structure contract (top-tier decision product).
 * Forces: 依据 / 结论 / 三时窗动作 / 风险 / 验证点 — for event loop.
 */

export const CHAT_ANSWER_STRUCTURE_CONTRACT = [
  '【回答结构 · 首轮决策卡】',
  '这是本会话的第一轮完整判断。请用清晰小标题组织正文（Markdown 加粗标题即可，标题前不要加 1. 2. 编号），固定顺序：',
  '**判断依据** — 有报告：点明日主/主用神（扶抑）/忌神/当前大运/窗口中至少一项，且必须与会话真值一致。调候单独说，不得写成身弱主用神。解释处境时先点世界易六层：结构（像什么）→ 时位（抬升/收敛）→ 环境（硬约束）→ 动作（30天验证）。',
  '无报告：用一两句说明「本会话未绑定报告，以下按通用决策框架」，禁止编造日主/用神/大运/流年吉凶。',
  '**当前结论** — 1～2 句可执行判断（推进 / 暂缓 / 条件推进），不要空套话。',
  '**阶段动作** — 固定三行，格式严格：',
  '- 今天：…',
  '- 7 天内：…',
  '- 30 天内：…',
  '**风险提醒** — 一条最该防的误判或过早投入信号。',
  '**验证点** — 一条 7～30 天内可观察的现实信号（便于「记入事件」复盘）。',
  '文末必须另起一段，格式严格：',
  '**还想问**',
  '- …（只属于这份盘/这个问题的下一问）',
  '- …（另一条更深的下一问）',
  '禁止恐吓、绝对化命运断言；不替代医疗、法律或具体投资标的建议。',
].join('\n');

/** 第二轮起：对话深度，禁止再套「今天/7天/30天」表单 */
export const CHAT_FOLLOWUP_DEPTH_CONTRACT = [
  '【回答结构 · 追问深挖】',
  '这是多轮追问，不要再输出完整的「今天 / 7 天 / 30 天」决策卡。用户已经看过首轮结构。',
  '本轮只深挖用户这一句，写得像顾问在把一件事说透，而不是再填一张表。',
  '必须做到：',
  '1) 先用 1 句接住上一轮结论，再往下拆一层（为什么、例外、边界、现实怎么验）。',
  '2) 至少引用 1 条本盘真值：日主/主用神/忌神/调候/大运/窗口（不得改写；调候不得冒充主用神）。',
  '3) 给 1 个只属于这个人的具体细节（不是「注意身体」「保持平常心」）。',
  '4) 篇幅 400～900 字，密度优先；可以分段，但不要五个固定小标题全套再来一遍。',
  '5) 文末必须：',
  '**还想问**',
  '- …（顺着本轮没说完的一点）',
  '- …（换一个相邻议题，仍锚定同一份盘）',
  '禁止重开一套喜忌体系；禁止空话收尾。',
].join('\n');

/**
 * Soft repair instruction when first pass is structure-thin.
 * Sent as a follow-up user turn so the model rewrites the whole answer once.
 */
export const CHAT_STRUCTURE_REPAIR_INSTRUCTION = [
  '【结构补全 · 整段重写】',
  '上一版未完整满足回答结构。请整段重写（不要只补几句，不要解释为何重写）。',
  '小标题前不要加 1. 2. 编号，必须且仅用这些标题：',
  '**判断依据**',
  '**当前结论**',
  '**阶段动作**（内含三行：今天：… / 7 天内：… / 30 天内：…）',
  '**风险提醒**',
  '**验证点**',
  '有报告真值时禁止改写日主/用神/大运；无报告时禁止编造，且勿展开长篇「无法推演」说明。',
].join('\n');

export type ParsedChatAnswer = {
  basis: string;
  conclusion: string;
  today: string;
  in7d: string;
  in30d: string;
  risk: string;
  verify: string;
  raw: string;
};

/** Allow **1. 判断依据** / 1、当前结论 / plain 判断依据 */
const HEADING_PREFIX = '(?:\\*\\*)?(?:\\d+[\\.、．]\\s*)?';

function sectionAfter(text: string, labels: string[]): string {
  for (const label of labels) {
    const re = new RegExp(
      `${HEADING_PREFIX}${label}(?:\\*\\*)?[：:\\s]*([\\s\\S]*?)(?=(?:\\n\\s*(?:\\*\\*)?(?:\\d+[\\.、．]\\s*)?(?:判断依据|当前结论|当前阶段建议|阶段动作|阶段建议|风险提醒|验证点|今天|7\\s*天|30\\s*天)|$))`,
      'i',
    );
    const m = text.match(re);
    if (m?.[1]) {
      return compact(m[1], 280);
    }
  }
  return '';
}

function lineAfter(text: string, labels: string[]): string {
  for (const label of labels) {
    const re = new RegExp(
      `(?:[-*•]\\s*)?${HEADING_PREFIX}${label}(?:\\*\\*)?[：:\\s]*([^\\n]+)`,
      'i',
    );
    const m = text.match(re);
    if (m?.[1]) return compact(m[1], 120);
  }
  return '';
}

function compact(value: string, max = 200): string {
  return `${value || ''}`
    .replace(/\s+/g, ' ')
    .replace(/^[\s\-•*]+/, '')
    .trim()
    .slice(0, max);
}

/** Best-effort parse of structured assistant answers */
export function parseChatAnswerStructure(answer: string): ParsedChatAnswer {
  const raw = `${answer || ''}`.trim();
  const basis = sectionAfter(raw, ['判断依据', '依据', '结构依据']);
  const conclusion = sectionAfter(raw, ['当前结论', '结论', '阶段建议', '当前阶段建议']);
  const today =
    lineAfter(raw, ['今天', '今日']) ||
    sectionAfter(raw, ['今天']);
  const in7d = lineAfter(raw, ['7\\s*天内', '七天内', '一周内']);
  const in30d = lineAfter(raw, ['30\\s*天内', '三十天内', '一个月内']);
  const risk = sectionAfter(raw, ['风险提醒', '风险', '最该防']);
  let verify = sectionAfter(raw, ['验证点', '可验证', '复盘点', '检查点']);
  if (!verify) {
    // Heuristic: last sentence mentioning 观察/是否/结果
    const sentences = raw.split(/[。！？\n]/).map((s) => s.trim()).filter(Boolean);
    verify =
      sentences
        .reverse()
        .find((s) => /观察|是否|结果|反馈|验证|对照/.test(s))
        ?.slice(0, 120) || '';
  }

  return {
    basis,
    conclusion: conclusion || compact(raw, 100),
    today,
    in7d,
    in30d,
    risk,
    verify,
    raw,
  };
}

export type ChatAnswerStructureScore = {
  /** 0–7 filled slots */
  filled: number;
  max: number;
  /** ≥3 core slots → show compact decision card */
  isRich: boolean;
  /** <2 core slots and answer is long enough → soft incomplete hint */
  isThin: boolean;
  missing: string[];
};

/**
 * Score how well an answer matches the decision-loop contract.
 * Uses explicit section hits only (not raw-text fallback for 结论).
 */
export function scoreChatAnswerStructure(
  answer: string | ParsedChatAnswer,
): ChatAnswerStructureScore {
  const raw = typeof answer === 'string' ? `${answer || ''}`.trim() : answer.raw;
  const p = typeof answer === 'string' ? parseChatAnswerStructure(answer) : answer;

  const hasExplicitConclusion = Boolean(
    sectionAfter(raw, ['当前结论', '当前阶段建议', '阶段建议', '结论']),
  );
  const hasExplicitVerify = Boolean(
    sectionAfter(raw, ['验证点', '可验证', '复盘点', '检查点']),
  );

  const slots: Array<{ label: string; ok: boolean }> = [
    { label: '判断依据', ok: Boolean(p.basis) },
    { label: '当前结论', ok: hasExplicitConclusion },
    { label: '今天', ok: Boolean(p.today) },
    { label: '7天', ok: Boolean(p.in7d) },
    { label: '30天', ok: Boolean(p.in30d) },
    { label: '风险', ok: Boolean(p.risk) },
    { label: '验证点', ok: hasExplicitVerify || Boolean(p.verify) },
  ];

  const filled = slots.filter((s) => s.ok).length;
  const missing = slots.filter((s) => !s.ok).map((s) => s.label);
  const isRich = filled >= 3 && (hasExplicitConclusion || Boolean(p.today) || hasExplicitVerify);
  const isThin = filled < 2 && raw.length >= 80;

  return { filled, max: slots.length, isRich, isThin, missing };
}

export function appendAnswerStructureContract(
  systemContent: string,
  options?: { followup?: boolean },
): string {
  const base = `${systemContent || ''}`.trim();
  const contract = options?.followup
    ? CHAT_FOLLOWUP_DEPTH_CONTRACT
    : CHAT_ANSWER_STRUCTURE_CONTRACT;
  if (!base) return contract;
  if (base.includes('【回答结构 · 首轮') || base.includes('【回答结构 · 追问') || base.includes('【回答结构 · 硬要求')) {
    return base;
  }
  return `${base}\n\n${contract}`;
}

/** 从回答抽出「还想问」下一问，供聊天气泡点击续问 */
export function extractNextAskHooks(answer: string): string[] {
  const text = `${answer || ''}`.trim();
  if (!text) return [];
  const section = text.match(
    /(?:\*\*)?(?:还想问|下一问|你可以继续问)(?:\*\*)?[：:\s]*([\s\S]*)$/i,
  );
  const block = section?.[1] || '';
  const lines = block
    .split('\n')
    .map((line) => line.replace(/^[\s-*•、\d.．]+/, '').trim())
    .filter((line) => line.length >= 6 && line.length <= 80 && !/^（/.test(line));
  const unique: string[] = [];
  for (const line of lines) {
    if (!unique.includes(line)) unique.push(line);
    if (unique.length >= 3) break;
  }
  return unique;
}

/** Enrich event description / follow-up from structured answer */
export function buildVerifyEventFields(params: {
  question: string;
  answer: string;
  reportId?: string | null;
  topScenario?: string | null;
}): {
  title: string;
  description: string;
  shortTerm: string;
  longTerm: string;
  verifyPoint: string;
  parsed: ParsedChatAnswer;
} {
  const parsed = parseChatAnswerStructure(params.answer);
  const q = compact(params.question, 40) || '对话决策';
  const verify = parsed.verify || parsed.conclusion || compact(params.answer, 80);
  const title = verify.length <= 22 ? `验证：${verify}` : `验证：${verify.slice(0, 20)}…`;

  const actionLines = [
    parsed.today ? `今天：${parsed.today}` : '',
    parsed.in7d ? `7天内：${parsed.in7d}` : '',
    parsed.in30d ? `30天内：${parsed.in30d}` : '',
  ].filter(Boolean);

  const description = [
    `问题：${compact(params.question, 60)}`,
    parsed.basis ? `依据：${parsed.basis}` : '',
    parsed.conclusion ? `结论：${parsed.conclusion}` : `摘要：${compact(params.answer, 100)}`,
    actionLines.length ? `动作：${actionLines.join('；')}` : '',
    parsed.risk ? `风险：${parsed.risk}` : '',
    `验证点：${verify}`,
  ]
    .filter(Boolean)
    .join('\n');

  const shortTerm = verify;
  const longTerm = params.topScenario
    ? `事件发生后对照「${params.topScenario}」与原结论，标记准确/偏差，再回聊天纠偏。`
    : '事件发生后标记准确或偏差，回到聊天页继续追问偏差来自时机、执行还是信息判断。';

  return {
    title,
    description,
    shortTerm,
    longTerm,
    verifyPoint: verify,
    parsed,
  };
}
