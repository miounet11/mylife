/**
 * 产品内容语气与展示规范（大众可读）
 *
 * 原则：
 * 1. 不故弄玄虚：术语必须先白话，再给术语名
 * 2. 循循善诱：先结论 → 为什么 → 怎么做 → 你可能想问
 * 3. 不怕长：用户有十万个为什么，讲清楚比「惜字如金」重要
 * 4. 一目了然：分章、小标题、列表，可扫读
 * 5. 可验证：建议必须落到可执行、可回访的动作
 */

import { presentReportText } from '@/lib/report-presentation';

/** 注入 LLM / Agent 的统一用户向语气 */
export const USER_FACING_VOICE_PROMPT = [
  '【用户向写作规范 · 必须遵守】',
  '1. 读者是普通人，不是命理从业者。先给结论，再解释原因，最后给动作。',
  '2. 禁止故弄玄虚：少用「玄机、气数、天机、注定、破解、化解改命」等吓人或装腔的词；必须用术语时，立刻跟一句白话。',
  '3. 循循善诱：主动回答用户心里的「为什么」「那我该怎么办」「什么时候做」「做错了会怎样」「怎么知道有效」。',
  '4. 不怕写长：每个关键判断至少包含「结论 + 依据 + 行动 + 验证方式」；宁多一句清楚，不少一句糊涂。',
  '5. 逻辑清晰：用短段落；能列表就列表；数字和时间尽量具体（月份/季度/窗口）。',
  '6. 边界诚实：医疗/法律/投资不替代专业意见；时辰不确定时明确降低短窗确定性。',
  '7. 中文输出字段里的叙述要对用户友好；JSON 结构字段名保持英文。',
  '8. 推荐结构标签（写进正文）：【结论】【为什么】【怎么做】【你可能想问】【如何验证】。',
].join('\n');

/** 读法一句话：放在卡片/章节顶部 */
export const READING_PATH_HINT =
  '读法：先看「结论」→ 再看「为什么」→ 记下「怎么做」→ 有疑问看「你可能想问」→ 到期用「如何验证」对照。';

export type ExplainBlock = {
  /** 先看：结论 */
  conclusion: string;
  /** 为什么这样说 */
  why?: string;
  /** 怎么做 */
  how?: string[];
  /** 怎么验证 */
  verify?: string;
  /** 你可能想问 */
  faq?: Array<{ q: string; a: string }>;
};

/** 长文：默认允许更长，去掉「惜字如金」式截断 */
export function presentLong(input: unknown, maxLen = 900): string {
  return presentReportText(input, maxLen);
}

export function presentMedium(input: unknown, maxLen = 420): string {
  return presentReportText(input, maxLen);
}

export function presentShort(input: unknown, maxLen = 160): string {
  return presentReportText(input, maxLen);
}

/** 把「术语」包装成 白话（术语） */
export function termWithPlain(term: string, plain: string): string {
  return `${plain}（${term}）`;
}

/** 弱化故弄玄虚用词，保留可读信息 */
export function softenMysticPhrases(input: string): string {
  if (!input) return '';
  return input
    .replace(/天机不可泄露/g, '细节需要结合你的现实对照')
    .replace(/气数已定/g, '结构倾向相对稳定')
    .replace(/命中注定/g, '结构上更常见的倾向')
    .replace(/改命|破解命运|化解厄运/g, '调整行动与节奏')
    .replace(/玄机/g, '关键点')
    .replace(/天机/g, '关键信息')
    .replace(/必有大灾|必遭横祸/g, '推进成本可能偏高，宜谨慎')
    .replace(/大吉大利/g, '条件相对有利')
    .replace(/大凶/g, '宜重点防守');
}

export function buildWhyFromStatus(
  status: 'push' | 'steady' | 'caution',
  domain: string,
  score10?: number
): string {
  const scoreHint =
    typeof score10 === 'number' ? `当前该维约 ${score10}/10。` : '';
  if (status === 'push') {
    return `${scoreHint}在「${domain}」上，结构与阶段更支持推进：外部窗口和内部条件相对同向，适合做可验证的正向动作，而不是无限等待。推进不等于梭哈——仍建议一次只开一条主线。`;
  }
  if (status === 'caution') {
    return `${scoreHint}在「${domain}」上，压力或错位更明显：硬推容易放大消耗。先减并行、降杠杆、守住底盘，比「硬刚一把」更划算。防守不是躺平，而是把精力留给恢复与准备。`;
  }
  return `${scoreHint}在「${domain}」上，整体中性偏稳：可以小步前进，但不要同时开太多不确定线；做成一件再放大。稳中求进，比追热点更省后悔成本。`;
}

export function defaultFaqForDomain(domainKey: string): Array<{ q: string; a: string }> {
  const map: Record<string, Array<{ q: string; a: string }>> = {
    career: [
      {
        q: '是不是要马上跳槽？',
        a: '不一定。先分清是「能力/岗位不匹配」还是「窗口不对」。多数人应先做可验证的内部复盘或小范围试探，再决定是否换环境。裸辞通常不是默认答案。',
      },
      {
        q: '怎么判断我在顺着用神？',
        a: '看你做的事是否越做越有反馈：技能变现、协作顺、责任变清晰。若越忙越空、冲突上升，往往在忌神方向硬耗——这时先减负，再谈扩张。',
      },
      {
        q: '分数低是不是事业没希望？',
        a: '不是。低分多半表示「现在推进成本高」，适合保全与准备。分数会随阶段变化；关键是别在高压窗硬开多条战线。',
      },
    ],
    wealth: [
      {
        q: '现在能加杠杆吗？',
        a: '优先现金流与可回款节奏。杠杆只在「用神同向 + 回本路径清晰 + 爆仓不影响生活」时考虑，否则先做减法。',
      },
      {
        q: '怎样算验证成功？',
        a: '例如：连续 3 个月固定储蓄达成、一笔回款节点兑现、冲动消费次数下降——具体数字比感觉重要。',
      },
      {
        q: '财运不好是不是不能碰投资？',
        a: '不是绝对禁止，而是提高门槛：只做你理解的、可小额验证的、失败也睡得着的。不懂的产品先不碰。',
      },
    ],
    marriage: [
      {
        q: '合不合是不是命中注定？',
        a: '更重要的是节奏与边界：沟通、金钱、家人、时间四件事能否对齐。合盘只是参考，不能替代现实选择。',
      },
      {
        q: '现在该推进还是放缓？',
        a: '若双方稳定且无高压窗口，可推进具体约定；若一方高压或冲突升级，先做「无指责对齐」，再谈承诺。',
      },
      {
        q: '要不要做合婚？',
        a: '有对方八字可以做双盘对照，用来谈节奏与差异，而不是判「成不成」。最终仍看双方是否愿意共同管理差异。',
      },
    ],
    health: [
      {
        q: '这是不是说我有病？',
        a: '不是医疗诊断。这里只谈生活节律：睡眠、负荷、压力。身体不适请就医，不要用命理替代检查。',
      },
      {
        q: '最短可以做什么？',
        a: '连续 14 天固定睡眠与一次中等强度运动，并记录精力曲线——这是最容易验证的「小闭环」。',
      },
      {
        q: '为什么总提忌神和低分窗口？',
        a: '因为高负荷叠在推进成本高的阶段，恢复更慢。不是恐吓，而是提醒你别在最累的时候再加码。',
      },
    ],
  };
  return (
    map[domainKey] || [
      {
        q: '我该先看哪一块？',
        a: '先看「现在最该做 / 最别做」，再看这一维的评分与窗口；最后把动作写进日历或事件本。',
      },
      {
        q: '看不懂术语怎么办？',
        a: '每个术语旁边通常有白话。也可以直接点「继续追问」，用你的生活问题来问，不必先学会术语。',
      },
    ]
  );
}

/** 整份报告级常见问题（总评末章） */
export function defaultReportFaq(params?: {
  dayMaster?: string;
  yong?: string;
  ji?: string;
  score10?: number;
}): Array<{ q: string; a: string }> {
  const dm = params?.dayMaster || '日主';
  const yong = params?.yong || '用神方向';
  const ji = params?.ji || '忌神方向';
  const score =
    typeof params?.score10 === 'number' ? `综合约 ${params.score10}/10。` : '';
  return [
    {
      q: '这份报告是算命吗？准不准？',
      a: `${score}它更像「结构地图 + 阶段导航」：告诉你资源更适合往哪投、什么时候推进成本高。准不准要用现实结果验证——建议 30 天把动作记入事件本，再在预测回访打分。`,
    },
    {
      q: '用神忌神到底怎么用？',
      a: `顺着「${yong}」做事、选合作、排时间；「${ji}」不是永远不能碰，而是高压窗口别硬刚、别梭哈。拿不准时，先做一件 2–4 周能看到反馈的小事。`,
    },
    {
      q: '分数低是不是今年很糟？',
      a: '低分多半表示「现在推进贵」，适合减法、保全与准备，不等于人生没希望。高分也不等于可以乱冲——仍建议一次只开一条主线并设验证点。',
    },
    {
      q: '时辰不确定怎么办？',
      a: '结构与大运仍可参考，但婚期、流时等短窗口会更保守。若能确认出生时辰，补录后重算，短窗会更清晰。',
    },
    {
      q: `日主是「${dm}」对我意味着什么？`,
      a: '日主是看盘的起点，代表你的核心气质倾向，不是标签牢笼。后面的喜用、议题、时间建议，都在这个起点上展开——重点看「该往哪走」，而不是纠结称号。',
    },
    {
      q: '看完报告下一步做什么？',
      a: '① 记住「最该做 / 最别做」 ② 把避险月记进事件本 ③ 只选 1 件 30 天动作 ④ 到期回来对照 ⑤ 有疑问点「继续追问」。',
    },
  ];
}

/** 组装用户可读长段落 */
export function composeExplainParagraph(block: ExplainBlock): string {
  const parts = [
    block.conclusion,
    block.why ? `为什么：${block.why}` : '',
    block.how?.length ? `怎么做：${block.how.map((h, i) => `${i + 1}) ${h}`).join(' ')}` : '',
    block.verify ? `如何验证：${block.verify}` : '',
  ].filter(Boolean);
  return parts.join('\n');
}

/** 章节读法标签 */
export function sectionReadingLabel(key: string): string {
  const map: Record<string, string> = {
    structure: '这一章回答：我是谁、结构大致怎样',
    yongji: '这一章回答：什么该顺、什么该躲',
    stage: '这一章回答：我现在处在哪一段人生节奏',
    domains: '这一章回答：事业财感情健康各自强弱',
    timing: '这一章回答：什么时候做、什么时候停',
    action: '这一章回答：接下来 30 天先做对哪一件',
    faq: '这一章回答：你心里可能卡住的问题',
  };
  return map[key] || '按结论 → 原因 → 行动阅读';
}
