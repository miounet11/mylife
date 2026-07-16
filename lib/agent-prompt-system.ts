// @ts-nocheck
/**
 * V6 Agent Prompt System — LLM 驱动的命理分析生成引擎
 *
 * 架构：
 * - MasterPrompt: 总系统提示词（定义 agent 身份、规则、边界）
 * - SectionPrompts: 分节提示词（布局、五行、婚姻、财运、健康、大运流年）
 * - ContextBuilder: 从 FortuneAnalysisResult + DashboardData 构建 LLM 上下文注入块
 * - QualityGuard: 输出质检规则
 *
 * 设计原则：
 * 1. 先给数据再给指令 — LLM 看到的是"这里是数据，请按格式分析"
 * 2. 精确槽位化 — 所有动态值通过模板注入，不依赖 LLM 自行计算
 * 3. 边界清晰 — 明确禁止医学诊断、法律建议、绝对化预测
 * 4. 风格控制 — 可选"精算版"（带推导过程）/ "白话版"（日常语言）
 */

import type { FortuneAnalysisResult, Pillar } from './user-types';
import type { YongShenResult } from './bazi-analyzer';
import type { DayunResult } from './dayun-calculator';
import type { DashboardData } from './dashboard-builder';
import type { KlinePointV6, KlineAnchorV6 } from './kline-v6';
import { USER_FACING_VOICE_PROMPT } from './content-voice';
import { ENGINE_HARD_CONTRACT } from './ground-truth/hard-contract';

// ── 风格模式 ──

export type AgentStyle = 'premium' | 'daily' | 'concise';

// ── 生成目标 ──

export type GenerationTarget =
  | 'full-report'        // 完整命理报告
  | 'dashboard-summary'  // 一页式总览摘要
  | 'career-deep-dive'   // 职业深度分析
  | 'wealth-deep-dive'   // 财运深度分析
  | 'marriage-deep-dive' // 婚姻深度分析
  | 'health-deep-dive'   // 健康分析
  | 'yearly-forecast'    // 年度运程
  | 'monthly-forecast';  // 月度运程

// ── 上下文注入块 ──

export interface AgentContextBlock {
  /** 当前公历/农历时间锚 */
  timeAnchor: {
    gregorian: string;
    lunar: string;
    season: string;
    solarTerm: string;
  };
  /** 命盘数据压缩摘要 */
  chartSummary: {
    dayMaster: string;
    dayElement: string;
    pillars: Array<{ label: string; ganZhi: string; nayin: string; cangGan: string[] }>;
    yongShen: string[];
    jiShen: string[];
    xianTianTaiJi: string;
    pattern: string;
    shenSha: string[];
  };
  /** 大运流年数据 */
  luckCycle: {
    currentDayun: { ganZhi: string; startAge: number; endAge: number; element: string; label: string };
    previousDayun: { ganZhi: string; element: string } | null;
    nextDayun: { ganZhi: string; element: string } | null;
    currentYear: number;
    liuNian: string;
    liuNianElement: string;
  };
  /** 五行数据 */
  elements: {
    scores: Record<string, number>;
    strongest: string;
    weakest: string;
    distribution: string;
  };
  /** K线摘要 */
  klineSummary: {
    currentScore: number;
    trend: 'up' | 'down' | 'flat';
    nextPeak: number | null;
    nextTrough: number | null;
    anchors: Array<{ year: number; label: string; score: number }>;
  };
}

// ── Master System Prompt ──

export function buildMasterPrompt(style: AgentStyle): string {
  const basePrompt = `你是一位专业命理分析助手，名叫"六爻"。你精通《滴天髓》《子平真诠》《穷通宝鉴》《三命通会》等经典命理典籍，同时也理解现代心理学和职业发展理论。

## 核心身份
- 你不是"算命先生"，你是"命局结构分析师"和"人生节奏教练"
- 你的任务不是预测命运，而是解读命盘结构，帮助用户理解自己的先天倾向和节奏
- 你从不使用"你一定会…"、"你注定…"、"百分百…"等绝对化表述
- 你的分析基于八字命理的五行生克制化原理，但始终保持理性和开放态度
- 读者是普通人：他们有十万个为什么；你要循循善诱，讲清楚，不故弄玄虚

${USER_FACING_VOICE_PROMPT}

## 输出规则（大众可读）
1. **先看数据后分析**：每次分析都从具体命盘数据出发，不凭空推论
2. **先结论，再原因，后动作**：每个关键判断按【结论】【为什么】【怎么做】【如何验证】组织
3. **术语必跟白话**：写「用神」时立刻解释「对你更有帮助的方向」
4. **杜绝空洞恭维与玄乎吓人**：不写"乃富贵之命也"、"大吉大利"、"天机"、"气数已定"
5. **不怕写长**：宁多一句清楚，不少一句糊涂；用短段落与列表方便扫读
6. **有条件句**：使用"如果…那么…"、"在…条件下…"而不是绝对判断
7. **时间锚定**：提到流年/月份时附带公历参考
8. **区分建议与定论**：建议用"可以试试"、"值得关注"，不用"必须"、"一定"
9. **主动回答常见追问**：如「要不要跳槽」「能不能加杠杆」「是不是有病」「分数低怎么办」

## 禁止事项
- 禁止做任何医学诊断或治疗建议（可谈作息负荷，并写「不适请就医」）
- 禁止做任何法律判断或具体投资标的建议
- 禁止使用"克夫"、"克妻"、"克子"等带有负面价值判断的用语
- 禁止预测具体死亡/疾病/灾难
- 禁止使用"化解"、"破解"、"改命"等暗示可以通过特定操作改变命运的用语

## 命理工具箱
你会收到一份结构化的"命盘数据注入"，包含：
- 四柱八字（年柱、月柱、日柱、时柱）+ 纳音 + 藏干
- 日主和五行力量分布
- 用神和忌神
- 格局判断
- 当前大运和流年
- 人生趋势 K 线摘要
- 神煞列表

你基于这些数据进行分析，不会自行推算（所有计算已在服务端完成）。

${ENGINE_HARD_CONTRACT}

## 风格设定`;

  const styleExtensions: Record<AgentStyle, string> = {
    premium: `
**当前为"精算版"风格**
- 每个判断附带五行推导简写，并翻译成生活含义（如"用神为火 → 更适合需要表达/曝光的工作"）
- 可少量引用古籍，但必须立刻白话解释，不装腔
- 分析深度：每个维度 4–7 条具体洞察 + 至少 1 条「你可能想问」
- 结尾给可行动的"本章要点"与验证方式，不空泛祝福`,
    daily: `
**当前为"白话版"风格（默认对用户最友好）**
- 用日常语言；术语必须跟白话
- 每条分析附一个现实生活类比
- 分析深度：每个维度 3–5 条，必须含【结论】【为什么】【怎么做】
- 结尾给「关键词 + 30 天可验证动作」`,
    concise: `
**当前为"简洁版"风格**
- 每个维度 2–3 条最核心洞察，但仍要「结论 + 一句为什么 + 一条动作」
- 短句列表，适合移动端
- 不删掉验证提示`,
  };

  return basePrompt + styleExtensions[style];
}

// ── Section Prompts（分节生成提示词） ──

export function buildSectionPrompt(
  section: 'opening' | 'structure' | 'career' | 'wealth' | 'marriage' | 'health' | 'forecast' | 'closing',
  context: AgentContextBlock,
  style: AgentStyle,
): string {
  const dataBlock = buildDataInjectionBlock(context);
  const sectionPrompts: Record<string, string> = {
    opening: `${dataBlock}

请为此命盘撰写**开篇**（6–10 句，写给完全不懂命理的用户）：
- 【结论】先说明日主、格局、用神的生活含义
- 【为什么】用 2–3 句解释为什么这样看
- 给一个"本文将从结构/事业/财/关系/健康/节奏展开"的预告
- 不要"恭喜"、"可贵"类恭维，不要故弄玄虚
- ${style === 'premium' ? '可附一句古籍，但必须立刻白话' : '少引古籍，多生活类比'}
- 结尾写：命盘是地图不是终点；建议边读边记下「最该做/最别做」`,

    structure: `${dataBlock}

请分析此命盘的**命局结构**（写清楚，不怕长）：
1. 【结论】日主状态 + 格局一句话
2. 【为什么】月令、五行强弱、格局成立理由（术语后跟白话）
3. 用神/忌神选定理由，以及对「做事/选合作/排时间」的含义
4. 大方向建议：什么该顺、什么该躲
5. 【你可能想问】「格局好不好」「分数低怎么办」各答 1 段
6. 【怎么做 / 如何验证】2–4 条可执行动作
${style === 'premium' ? '- 可引《子平真诠》或《滴天髓》，必须白话翻译' : ''}`,

    career: `${dataBlock}

请分析**职业与事业**（结论→原因→行动→验证）：
1. 【结论】职业倾向与当前宜攻/宜守
2. 十神与用神对应的行业/模式（平台 vs 独立等），写成普通人能懂的话
3. 当前大运/流年对事业的影响
4. 【怎么做】3–5 条可验证建议（含 30 天动作）
5. 【你可能想问】「要不要马上跳槽」必须正面回答
注意：方向与模式分析，不是指定唯一工种
${style !== 'concise' ? '- 关键判断附简短推理链 + 生活含义' : ''}`,

    wealth: `${dataBlock}

请分析**财运与资源节奏**（结论→原因→行动→验证）：
1. 【结论】先现金流还是可扩张
2. 财星结构与得财方式倾向（白话）
3. 当前阶段的财运节奏与不宜
4. 【怎么做】储蓄/回款/降杠杆等可核对动作
5. 【你可能想问】「能不能加杠杆」必须正面、保守地回答
注意：不做具体投资标的与金额预测`,

    marriage: `${dataBlock}

请分析**婚恋与关系**（重点是节奏与边界，不是合不合命）：
1. 【结论】当前宜推进还是放缓
2. 关系结构特征（沟通/期望/节奏）用生活语言写
3. 时间窗口提示
4. 【怎么做】无指责对齐等具体动作
5. 【你可能想问】「是不是命中注定」——强调现实选择
注意：禁止克夫/克妻等表述
${style !== 'concise' ? '- 使用"关系结构"框架' : ''}`,

    health: `${dataBlock}

请分析**健康与生活节律**（非医疗诊断）：
1. 【结论】优先关注的生活节律点
2. 五行偏颇 → 生活层面的关注（睡眠/负荷/压力），不是疾病名
3. 当前大运的恢复/消耗提示
4. 【怎么做】14 天可验证小闭环
5. 明确声明：不适请就医；命理不替代检查
${style === 'premium' ? '- 可引调养理念，避免处方式表述' : ''}`,

    forecast: `${dataBlock}

请分析**大运与流年节奏**（让用户知道现在在哪、下一步干什么）：
1. 【结论】当前十年主题 + 今年气候
2. 大运×流年互动的生活含义（攻/守/过渡）
3. 未来 1–3 年趋势概览与关键节点（附公历）
4. 【怎么做 / 最别做】各至少 2 条
5. 【如何验证】提醒记入事件本/预测回访
注意：用"在…条件下更常见"的表述，不用注定论
${style === 'premium' ? '- 趋势可附简短生克链路 + 白话' : ''}`,

    closing: `${dataBlock}

请撰写**结语**（4–6 句）：
- 呼应开篇核心判断（结论复述）
- 给用户可带走的「行动关键词」+ 一条 30 天验证动作
- 鼓励有疑问继续追问（十万个为什么都正常）
- 不空泛祝福；${style === 'daily' ? '可用一句生活类比' : '可用「命盘是地图，不是终点」'}
- 提示下次可关注的维度以促进复访`,
  };

  return sectionPrompts[section];
}

// ── 数据注入块构建器 ──

function buildDataInjectionBlock(context: AgentContextBlock): string {
  const { timeAnchor, chartSummary, luckCycle, elements, klineSummary } = context;

  return `## 当前时间锚
- 公历：${timeAnchor.gregorian}
- 农历：${timeAnchor.lunar}
- 当前节气：${timeAnchor.solarTerm}

## 命盘数据
- 日主：${chartSummary.dayMaster}（五行属${chartSummary.dayElement}）
- 格局：${chartSummary.pattern}
- 先天太极：${chartSummary.xianTianTaiJi}
- 用神：${chartSummary.yongShen.join('、')}
- 忌神：${chartSummary.jiShen.join('、')}
- 神煞：${chartSummary.shenSha.join('、') || '无特殊神煞'}

### 四柱详情
${chartSummary.pillars.map(p =>
    `${p.label}：${p.ganZhi}（纳音${p.nayin}，藏干${p.cangGan.join('、') || '无'}）`
  ).join('\n')}

## 五行力量分布
- 各五行得分：${Object.entries(elements.scores).map(([k, v]) => `${k}=${v}`).join('，')}
- 最强五行：${elements.strongest}
- 最弱五行：${elements.weakest}
- 分布特征：${elements.distribution}

## 大运流年
- 当前大运：${luckCycle.currentDayun.ganZhi}（${luckCycle.currentDayun.startAge}-${luckCycle.currentDayun.endAge}岁，五行属${luckCycle.currentDayun.element}）
- 上一大运：${luckCycle.previousDayun ? `${luckCycle.previousDayun.ganZhi}（${luckCycle.previousDayun.element}）` : '无'}
- 下一大运：${luckCycle.nextDayun ? `${luckCycle.nextDayun.ganZhi}（${luckCycle.nextDayun.element}）` : '无'}
- 当前流年：${luckCycle.currentYear}年（${luckCycle.liuNian}，五行属${luckCycle.liuNianElement}）

## 人生趋势摘要
- 当前综合评分：${klineSummary.currentScore}/100
- 趋势方向：${klineSummary.trend === 'up' ? '上升期 ↑' : klineSummary.trend === 'down' ? '调整期 ↓' : '平台期 →'}
${klineSummary.nextPeak ? `- 下一个人生高点：${klineSummary.nextPeak}年` : ''}
${klineSummary.nextTrough ? `- 下一个调整低点：${klineSummary.nextTrough}年` : ''}

---
请基于以上数据进行分析。`;
}

// ── 上下文构建器：从计算数据构建 AgentContextBlock ──

export function buildAgentContext(
  fortuneResult: FortuneAnalysisResult,
  dashboardData: DashboardData,
  klineData: KlinePointV6[],
  klineAnchors: KlineAnchorV6[],
  now: Date = new Date(),
): AgentContextBlock {
  const analysis = fortuneResult.analysis;
  const ev = fortuneResult.evidencePack;
  const chartData = ev?.chartData;

  // 时间锚
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const day = now.getDate();

  // 节气简化
  const solarTerms = [
    '小寒', '大寒', '立春', '雨水', '惊蛰', '春分',
    '清明', '谷雨', '立夏', '小满', '芒种', '夏至',
    '小暑', '大暑', '立秋', '处暑', '白露', '秋分',
    '寒露', '霜降', '立冬', '小雪', '大雪', '冬至',
  ];
  const termIdx = Math.floor((month - 1) * 2 + (day >= 15 ? 1 : 0));
  const currentTerm = solarTerms[termIdx % 24];

  // 命盘摘要
  const pillars = chartData?.pillars || fortuneResult.pillars || [];
  const yongShen = analysis?.luckyElements?.yongShen || [];
  const jiShen = analysis?.luckyElements?.jiShen || [];

  const chartSummary: AgentContextBlock['chartSummary'] = {
    dayMaster: analysis?.dayMaster || '',
    dayElement: analysis?.dayMasterElement || '',
    pillars: pillars.map((p: Pillar, i: number) => ({
      label: ['年柱', '月柱', '日柱', '时柱'][i] || `柱${i + 1}`,
      ganZhi: `${p.celestialStem || ''}${p.earthlyBranch || ''}`,
      nayin: '',
      cangGan: [],
    })),
    yongShen,
    jiShen,
    xianTianTaiJi: analysis?.xianTianTaiJi || '',
    pattern: analysis?.pattern || '',
    shenSha: analysis?.shenSha || [],
  };

  // 大运流年
  const dayun = fortuneResult.dayun;
  const currentDayunIdx = dayun?.currentDayunIndex ?? 0;
  const dayunList = dayun?.dayunList || [];
  const currentDayun = dayunList[currentDayunIdx];
  const prevDayun = currentDayunIdx > 0 ? dayunList[currentDayunIdx - 1] : null;
  const nextDayun = currentDayunIdx < dayunList.length - 1 ? dayunList[currentDayunIdx + 1] : null;

  const liuNian = getYearGanZhi(year);

  const luckCycle: AgentContextBlock['luckCycle'] = {
    currentDayun: {
      ganZhi: currentDayun?.ganZhi || '',
      startAge: currentDayun?.startAge || 0,
      endAge: currentDayun?.endAge || 0,
      element: currentDayun?.element || '',
      label: currentDayun?.label || '',
    },
    previousDayun: prevDayun ? { ganZhi: prevDayun.ganZhi, element: prevDayun.element || '' } : null,
    nextDayun: nextDayun ? { ganZhi: nextDayun.ganZhi, element: nextDayun.element || '' } : null,
    currentYear: year,
    liuNian,
    liuNianElement: ganToElement(liuNian[0] || ''),
  };

  // 五行数据
  const wxScores = analysis?.wuxingScores || {};
  let sortedWx = Object.entries(wxScores).sort((a, b) => b[1] - a[1]);

  const elementsData: AgentContextBlock['elements'] = {
    scores: wxScores as Record<string, number>,
    strongest: sortedWx[0]?.[0] || '',
    weakest: sortedWx[sortedWx.length - 1]?.[0] || '',
    distribution: describeDistribution(wxScores),
  };

  // K线摘要
  const latestKline = klineData[klineData.length - 1];
  const klineSummary: AgentContextBlock['klineSummary'] = {
    currentScore: latestKline?.career || 50,
    trend: computeTrend(klineData),
    nextPeak: findNextAnchor(klineAnchors, 'peak', year),
    nextTrough: findNextAnchor(klineAnchors, 'trough', year),
    anchors: klineAnchors.slice(0, 6).map(a => ({
      year: a.year,
      label: a.type || '',
      score: a.score || 0,
    })),
  };

  return {
    timeAnchor: {
      gregorian: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
      lunar: '',
      season: getSeason(month),
      solarTerm: currentTerm,
    },
    chartSummary,
    luckCycle,
    elements: elementsData,
    klineSummary,
  };
}

// ── 辅助函数 ──

function getYearGanZhi(year: number): string {
  const gan = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'][(year - 4) % 10];
  const zhi = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'][(year - 4) % 12];
  return `${gan}${zhi}`;
}

function ganToElement(gan: string): string {
  const map: Record<string, string> = {
    '甲': '木', '乙': '木', '丙': '火', '丁': '火',
    '戊': '土', '己': '土', '庚': '金', '辛': '金',
    '壬': '水', '癸': '水',
  };
  return map[gan] || '';
}

function getSeason(month: number): string {
  if (month >= 3 && month <= 5) return '春';
  if (month >= 6 && month <= 8) return '夏';
  if (month >= 9 && month <= 11) return '秋';
  return '冬';
}

function describeDistribution(scores: Record<string, number>): string {
  const entries = Object.entries(scores).filter(([, v]) => v !== undefined);
  if (entries.length === 0) return '无数据';
  const total = entries.reduce((s, [, v]) => s + (v || 0), 0);
  if (total === 0) return '无数据';
  const maxVar = Math.max(...entries.map(([, v]) => v || 0));
  const minVar = Math.min(...entries.map(([, v]) => v || 0));
  const spread = maxVar - minVar;
  if (spread < total * 0.1) return '五行均衡';
  if (spread < total * 0.3) return '五行分布适中';
  return '五行偏枯，需调候';
}

function computeTrend(kline: KlinePointV6[]): 'up' | 'down' | 'flat' {
  if (kline.length < 3) return 'flat';
  const recent = kline.slice(-3);
  const avgScore = (p: KlinePointV6) => (p.career + p.wealth + p.marriage + p.health) / 4;
  const first = avgScore(recent[0]!);
  const last = avgScore(recent[recent.length - 1]!);
  if (last - first > 2) return 'up';
  if (first - last > 2) return 'down';
  return 'flat';
}

function findNextAnchor(anchors: KlineAnchorV6[], type: 'peak' | 'trough', afterYear: number): number | null {
  const candidates = type === 'peak'
    ? anchors.filter(a => a.type === 'peak' && a.year > afterYear)
    : anchors.filter(a => a.type === 'trough' && a.year > afterYear);
  if (candidates.length === 0) return null;
  return candidates.sort((a, b) => a.year - b.year)[0]!.year;
}

// ── 质量检查器（Quality Guard） ──

export interface QualityCheckResult {
  passed: boolean;
  issues: string[];
  warnings: string[];
}

export function qualityCheck(output: string): QualityCheckResult {
  const issues: string[] = [];
  const warnings: string[] = [];

  // 禁止词检查
  const forbiddenPatterns = [
    { pattern: /克夫|克妻|克子|克母|克父/g, msg: '含负面"克X"用语' },
    { pattern: /你一定会|你注定|你肯定要|百分之百|绝对会/g, msg: '含绝对化预测' },
    { pattern: /化解|破解|改命|转运法事/g, msg: '含"化解/改命"类误导用语' },
    { pattern: /此人|此命|此造/g, msg: '含过度客体化用语（此人/此命/此造）' },
    { pattern: /短命|夭折|横死|血光之灾/g, msg: '含极端负面预测' },
  ];

  for (const { pattern, msg } of forbiddenPatterns) {
    if (pattern.test(output)) {
      pattern.lastIndex = 0;
      issues.push(msg);
    }
  }

  // 最少字数检查
  if (output.length < 50) {
    issues.push('输出过短（<50字符），可能为截断或空输出');
  }

  // 结构检查
  if (!output.includes('日主') && !output.includes('day master')) {
    warnings.push('输出未提及日主');
  }

  // 过度恭维检查
  const flatteryPatterns = [
    /乃富贵之命也/g,
    /大吉大利/g,
    /命中注定.*富贵/g,
    /天生.*命/g,
  ];
  for (const p of flatteryPatterns) {
    if (p.test(output)) {
      p.lastIndex = 0;
      warnings.push('含空泛恭维用语');
      break;
    }
  }

  return {
    passed: issues.length === 0,
    issues,
    warnings,
  };
}

// ── 多轮对话管理 ──

export interface ConversationTurn {
  role: 'user' | 'assistant';
  content: string;
  section?: string;
  timestamp: number;
}

export interface AgentConversation {
  context: AgentContextBlock;
  turns: ConversationTurn[];
  style: AgentStyle;
  target: GenerationTarget;
}

export function createConversation(context: AgentContextBlock, target: GenerationTarget, style: AgentStyle): AgentConversation {
  return { context, turns: [], style, target };
}

export function addTurn(conv: AgentConversation, role: 'user' | 'assistant', content: string, section?: string): AgentConversation {
  return {
    ...conv,
    turns: [...conv.turns, { role, content, section, timestamp: Date.now() }],
  };
}

export function buildConversationMessages(conv: AgentConversation): Array<{ role: 'system' | 'user' | 'assistant'; content: string }> {
  const systemMsg = buildMasterPrompt(conv.style);
  const initialUserMsg = buildSectionPrompt(
    targetToSection(conv.target),
    conv.context,
    conv.style,
  );

  const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    { role: 'system', content: systemMsg },
    { role: 'user', content: initialUserMsg },
  ];

  for (const turn of conv.turns) {
    messages.push({ role: turn.role, content: turn.content });
  }

  return messages;
}

function targetToSection(target: GenerationTarget): 'opening' | 'structure' | 'career' | 'wealth' | 'marriage' | 'health' | 'forecast' | 'closing' {
  const map: Record<GenerationTarget, ReturnType<typeof targetToSection>> = {
    'full-report': 'opening',
    'dashboard-summary': 'structure',
    'career-deep-dive': 'career',
    'wealth-deep-dive': 'wealth',
    'marriage-deep-dive': 'marriage',
    'health-deep-dive': 'health',
    'yearly-forecast': 'forecast',
    'monthly-forecast': 'forecast',
  };
  return map[target];
}

// ── 多 Agent 编排 ──

export interface AgentTask {
  id: string;
  section: string;
  prompt: string;
  dependsOn: string[];
  status: 'pending' | 'running' | 'completed' | 'failed';
  output: string | null;
}

export function buildFullReportTasks(context: AgentContextBlock, style: AgentStyle): AgentTask[] {
  const sections = ['opening', 'structure', 'career', 'wealth', 'marriage', 'health', 'forecast', 'closing'] as const;
  const tasks: AgentTask[] = [];

  for (const section of sections) {
    tasks.push({
      id: `task-${section}`,
      section,
      prompt: buildSectionPrompt(section, context, style),
      dependsOn: section === 'opening' ? [] : ['task-structure'], // all depend on structure
      status: 'pending',
      output: null,
    });
  }

  return tasks;
}

export function mergeReportOutputs(tasks: AgentTask[]): string {
  const sections = ['opening', 'structure', 'career', 'wealth', 'marriage', 'health', 'forecast', 'closing'];
  const parts: string[] = [];

  for (const section of sections) {
    const task = tasks.find(t => t.section === section);
    if (task?.output) {
      parts.push(task.output);
    }
  }

  return parts.join('\n\n---\n\n');
}
