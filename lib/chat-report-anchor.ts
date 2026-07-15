/**
 * Chat 报告锚定答案构建
 * 无 /api/chat 时，用报告真值生成可执行、可验证的多轮回答。
 * 不做伪大师闲聊。
 */

import { KNOWLEDGE_BASE } from '@/lib/knowledge-base-meta';

function resolveFallbackContextLabels(context?: {
  report?: { topScenario?: string; bestWindow?: string; riskWindow?: string };
  focusAreas?: string[];
}) {
  const report = context?.report;
  if (report?.topScenario || report?.bestWindow || report?.riskWindow) {
    return {
      topScenario: report.topScenario || '当前阶段主轴',
      bestWindow: report.bestWindow || '近期可参考窗口',
      riskWindow: report.riskWindow || '近期需收敛的窗口',
      hasReport: true,
    };
  }
  const focusAreas = (context?.focusAreas || []).filter(Boolean);
  return {
    topScenario: focusAreas[0] || '尚未绑定结构报告',
    bestWindow:
      focusAreas.find((item) => /窗口|阶段|用神|格局|大运|流年/.test(item)) ||
      '需先生成报告后再判断窗口',
    riskWindow:
      focusAreas.find((item) => /风险|规避|透支|压力/.test(item)) ||
      '需结合你的具体时间和担心点再判断',
    hasReport: false,
  };
}

export interface ReportChatContext {
  reportId: string;
  dayMaster?: string;
  pattern?: string;
  yongShen?: string[];
  jiShen?: string[];
  xiShen?: string[];
  topScenario?: string;
  bestWindow?: string;
  riskWindow?: string;
  careerScore?: number | null;
  wealthScore?: number | null;
  marriageScore?: number | null;
  healthScore?: number | null;
  oneLiner?: string;
  doThis?: string;
  avoidThis?: string;
  currentDayun?: string;
  currentLiunian?: string;
  focusAreas?: string[];
  /** 从报告抽取的补充证据句 */
  evidenceLines?: string[];
  pillarsSummary?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  at: number;
}

export function buildReportAnchoredAnswer(
  question: string,
  ctx: ReportChatContext | null,
  priorMessages?: ChatMessage[]
): string {
  const q = (question || '').trim();
  if (!q) return '请先输入一个具体问题。';

  if (!ctx?.reportId) {
    return [
      '当前未绑定结构报告，回答依据会偏弱。',
      '建议先生成完整报告，再带着具体问题回来追问。',
      '你也可以直接问：事业节奏 / 关系模式 / 年度窗口。',
    ].join('\n');
  }

  const { topScenario, bestWindow, riskWindow, hasReport } = resolveFallbackContextLabels({
    report: {
      topScenario: ctx.topScenario,
      bestWindow: ctx.bestWindow,
      riskWindow: ctx.riskWindow,
    },
    focusAreas: ctx.focusAreas,
  });

  const yong = (ctx.yongShen || []).join('、') || '用神';
  const ji = (ctx.jiShen || []).join('、') || '忌神';
  const scene = detectScene(q);
  const continuity = buildMultiTurnContinuity(q, priorMessages || [], scene);

  const header = [
    `【锚定报告 ${ctx.reportId.slice(0, 10)}… · ${KNOWLEDGE_BASE.shortLabel}】`,
    ctx.dayMaster ? `日主 ${ctx.dayMaster}${ctx.pattern ? ` · 格局 ${ctx.pattern}` : ''}` : '',
    ctx.pillarsSummary ? `四柱 ${ctx.pillarsSummary}` : '',
    ctx.currentDayun || ctx.currentLiunian
      ? `运局 ${[ctx.currentDayun, ctx.currentLiunian].filter(Boolean).join(' × ')}`
      : '',
  ]
    .filter(Boolean)
    .join('\n');

  const scores = [
    ctx.careerScore != null ? `事业 ${ctx.careerScore}` : '',
    ctx.wealthScore != null ? `财富 ${ctx.wealthScore}` : '',
    ctx.marriageScore != null ? `婚配 ${ctx.marriageScore}` : '',
    ctx.healthScore != null ? `健康 ${ctx.healthScore}` : '',
  ]
    .filter(Boolean)
    .join(' · ');

  let body = '';
  if (scene === 'career') {
    body = [
      `【结论】事业主轴是「${topScenario}」。`,
      scores ? `【参考】四维 ${scores}。` : '',
      `【为什么】结构上宜顺着「${yong}」做能力与岗位匹配；「${ji}」方向硬推更容易空转。`,
      ctx.doThis ? `【怎么做】${ctx.doThis}` : `【怎么做】选一件 30 天内能验证的工作动作（复盘/对齐/小项目）。`,
      `【窗口】可推进：${bestWindow}；宜收敛：${riskWindow}。`,
      '【你可能想问】是不是马上跳槽？不一定——先验证匹配问题，再决定换环境。',
      '【验证】90 天内完成 1 次岗位/项目复盘，并记入事件本。',
    ]
      .filter(Boolean)
      .join('\n');
  } else if (scene === 'wealth') {
    body = [
      `【结论】财富节奏：先现金流与承压能力，再谈扩张。`,
      scores ? `【参考】四维 ${scores}。` : '',
      `【为什么】资源更适合投向「${yong}」同向结构；「${ji}」相关冲动投入容易抬高回撤。`,
      `【怎么做】降杠杆、定回款/储蓄节点；窗口 ${bestWindow} 可小步试，防守期 ${riskWindow} 少开新战线。`,
      '【你可能想问】能不能加杠杆？只有回本路径清晰且爆仓不影响生活时才考虑。',
      '【验证】本月固定储蓄/回款是否兑现，并在预测页标记。',
    ]
      .filter(Boolean)
      .join('\n');
  } else if (scene === 'marriage') {
    body = [
      `【结论】关系重点不是「合不合」一句话，而是节奏与边界。`,
      scores ? `【参考】四维 ${scores}。` : '',
      ctx.oneLiner ? `【结构】${ctx.oneLiner}` : '',
      `【为什么】高压窗口硬推进承诺，容易把沟通问题放大成对立。`,
      `【怎么做】推进窗口 ${bestWindow}；宜缓 ${riskWindow}。先做「无指责」对齐（时间/金钱/家人）。`,
      '【你可能想问】要不要合婚？有对方八字可到 /hehun 做双盘对照，仍替代不了现实选择。',
      '【验证】完成一次对齐并记录冲突频率是否下降。',
    ]
      .filter(Boolean)
      .join('\n');
  } else if (scene === 'health') {
    body = [
      `【结论】身体节律（非医疗诊断）：优先作息与压力管理。`,
      scores ? `【参考】四维 ${scores}。` : '',
      ctx.avoidThis ? `【边界】报告提示不宜：${ctx.avoidThis}` : '',
      `【为什么】高负荷叠在忌神/低分窗口上，恢复成本会变高。`,
      `【怎么做】恢复窗口 ${bestWindow}；高负荷宜避开 ${riskWindow}。从睡眠与负荷做减法。`,
      '【你可能想问】是不是有病？不是。身体不适请就医，这里只谈生活节律。',
      '【验证】连续 14 天固定睡眠/运动，并在事件本打卡。',
    ]
      .filter(Boolean)
      .join('\n');
  } else if (scene === 'risk' || scene === 'month') {
    body = [
      `【结论】窗口管理：主轴「${topScenario}」。`,
      `【窗口】可参考「${bestWindow}」· 需收敛「${riskWindow}」。`,
      ctx.doThis ? `【现在最该做】${ctx.doThis}` : '',
      ctx.avoidThis ? `【现在最别做】${ctx.avoidThis}` : '',
      '【为什么】不是迷信日期，而是把「推进成本」说清楚：成本高时硬冲更贵。',
      '【验证】把不宜事项写入事件日历，窗口过后再评估是否恢复推进。',
    ]
      .filter(Boolean)
      .join('\n');
  } else if (scene === 'followup') {
    body = [
      continuity || '【承接】上一轮仍以报告真值为准，不另起体系。',
      hasReport ? `【主轴】仍是「${topScenario}」。` : '',
      ctx.doThis ? `【行动锚】${ctx.doThis}` : `顺着 ${yong} 推进一件可验证的小事。`,
      ctx.avoidThis ? `【边界】${ctx.avoidThis}` : `忌神 ${ji} 方向少硬推。`,
      `【窗口】${bestWindow}；防守 ${riskWindow}。`,
      '【验证】把上一轮建议执行 7 天，事件本标注结果后再回来细化。',
    ]
      .filter(Boolean)
      .join('\n');
  } else {
    body = [
      hasReport
        ? `【结论】基于已绑定报告，主轴是「${topScenario}」。`
        : '【结论】报告上下文不完整，以下为保守结构建议。',
      ctx.oneLiner ? `【一句话】${ctx.oneLiner}` : '',
      ctx.doThis ? `【现在最该做】${ctx.doThis}` : `优先顺着 ${yong} 做一件可验证的小事。`,
      ctx.avoidThis ? `【现在最别做】${ctx.avoidThis}` : `忌神 ${ji} 方向少硬推。`,
      `【窗口】${bestWindow}；防守 ${riskWindow}。`,
      scores ? `【四维】${scores}` : '',
      '【为什么】先做对一件可核对的事，比同时听很多建议更有效。',
      '【验证】选 1 件事执行 30 天，再回报告/预测页打分。',
    ]
      .filter(Boolean)
      .join('\n');
  }

  const evidence =
    ctx.evidenceLines && ctx.evidenceLines.length
      ? `\n\n【报告依据（方便你对照）】\n${ctx.evidenceLines
          .slice(0, 4)
          .map((line, i) => `${i + 1}. ${line}`)
          .join('\n')}`
      : '';

  const bridge = continuity && scene !== 'followup' ? `\n\n${continuity}` : '';

  return `${header}\n\n${body}${bridge}${evidence}\n\n（回答锚定报告真值、尽量白话；若与现实冲突，请记入事件本并回访校准。有疑问请继续追问。）`;
}

/** 多轮：承接上一问主题，避免每轮重开白 */
function buildMultiTurnContinuity(
  question: string,
  prior: ChatMessage[],
  scene: string
): string {
  if (!prior.length) return '';
  const lastUser = [...prior].reverse().find((m) => m.role === 'user');
  const lastAsst = [...prior].reverse().find((m) => m.role === 'assistant');
  if (!lastUser && !lastAsst) return '';

  const follow =
    /^(那|然后|还有|继续|再说|补充|为什么|怎么|如何|具体|如果|要是|刚才|上面|第一|第二)/.test(
      question.trim()
    ) ||
    scene === 'followup' ||
    /呢$|吗$|吧$/.test(question.trim());

  if (!follow && prior.filter((m) => m.role === 'user').length < 1) return '';

  const prevScene = lastUser ? detectScene(lastUser.content) : 'general';
  const prevSnippet = (lastAsst?.content || '')
    .replace(/【锚定报告[\s\S]*?】\n?/, '')
    .split('\n')
    .map((s) => s.trim())
    .filter((s) => s && !s.startsWith('（回答锚定'))
    .slice(0, 2)
    .join(' ');

  if (prevSnippet) {
    return `承接上一轮（${sceneLabel(prevScene)}）：${prevSnippet.slice(0, 120)}${
      prevSnippet.length > 120 ? '…' : ''
    }。本轮在同一报告真值上细化。`;
  }
  return '承接上一轮追问：仍锚定同一份报告结构，不另起体系。';
}

function sceneLabel(scene: string): string {
  const map: Record<string, string> = {
    career: '事业',
    wealth: '财富',
    marriage: '关系',
    health: '健康',
    risk: '避险',
    month: '窗口',
    followup: '追问',
    general: '综合',
  };
  return map[scene] || '综合';
}

function detectScene(q: string): string {
  if (/^(那|然后|还有|继续|再说|补充|为什么|怎么|如何|具体|如果|要是)/.test(q.trim()) && q.length < 40) {
    return 'followup';
  }
  if (/事业|工作|跳槽|升职|职业|岗位|行业|创业/.test(q)) return 'career';
  if (/财|钱|收入|投资|理财|杠杆|资产/.test(q)) return 'wealth';
  if (/婚|感情|关系|伴侣|恋爱|合婚|对象/.test(q)) return 'marriage';
  if (/健康|身体|睡眠|压力|作息|运动/.test(q)) return 'health';
  if (/风险|避|不宜|防守|小心/.test(q)) return 'risk';
  if (/本月|这个月|近月|窗口|时机/.test(q)) return 'month';
  return 'general';
}

function asText(v: unknown, max = 80): string {
  if (typeof v !== 'string') return '';
  const t = v.replace(/\s+/g, ' ').trim();
  if (!t) return '';
  return t.length > max ? `${t.slice(0, max)}…` : t;
}

/** 从公开报告页/API 尽力抽取聊天上下文 */
export function extractChatContextFromSnapshot(
  reportId: string,
  snapshot: unknown
): ReportChatContext {
  const s = (snapshot || {}) as any;
  const result = s.result || s.analysis || s;
  const basic = result.basic || s.basic || {};
  const advice = result.advice || s.advice || {};
  const yong = result.yongShen || s.yongShen || {};
  const scenarios = result.scenarioViews || s.scenarioViews || [];
  const overall = scenarios.find((x: any) => x.key === 'overall') || scenarios[0];
  const career = scenarios.find((x: any) => x.key === 'career');
  const wealth = scenarios.find((x: any) => x.key === 'wealth');
  const marriage = scenarios.find((x: any) => x.key === 'marriage');
  const health = scenarios.find((x: any) => x.key === 'health');
  const dayun = result.dayun?.currentDayun || result.dayun?.current || s.dayun?.currentDayun;
  const fortune = result.fortune || s.fortune || {};
  const months = result.monthlyWindows || s.monthlyWindows || [];
  const cautionMonth = months.find(
    (m: any) => m.level === 'caution' || m.status === 'caution' || (typeof m.score === 'number' && m.score < 45)
  );
  const goodMonth = months.find(
    (m: any) => m.level === 'good' || m.status === 'good' || (typeof m.score === 'number' && m.score >= 65)
  );
  const pillars = basic.pillars || [];
  const pillarsSummary = pillars
    .map((p: any) => p.ganZhi || `${p.celestialStem || ''}${p.earthlyBranch || ''}`)
    .filter(Boolean)
    .join(' ')
    .slice(0, 24);

  const evidenceLines = [
    asText(overall?.summary || overall?.body, 100),
    asText(career?.summary || career?.fullText, 100),
    asText(fortune.interaction, 100),
    asText(result.analysis?.summary || result.analysis?.opening, 100),
    asText(advice.career?.general || advice.marriage?.general, 100),
  ].filter(Boolean) as string[];

  const yongList = advice.yongShen || yong.yongShen || [];
  const jiList = advice.jiShen || yong.jiShen || [];

  return {
    reportId,
    dayMaster: basic.dayMaster || '',
    pattern: result.pattern?.type || basic.pattern || '',
    yongShen: yongList,
    jiShen: jiList,
    xiShen: advice.xiShen || yong.xiShen || [],
    topScenario: overall?.title || asText(overall?.summary, 40) || career?.title,
    bestWindow:
      asText(goodMonth?.label || goodMonth?.month || goodMonth?.title, 24) ||
      asText(fortune.currentLiuNian, 24) ||
      overall?.actionLabel,
    riskWindow:
      asText(cautionMonth?.label || cautionMonth?.month || cautionMonth?.title, 24) ||
      asText(scenarios.find((x: any) => x.status === 'caution')?.title, 24),
    careerScore: typeof career?.score === 'number' ? career.score : null,
    wealthScore: typeof wealth?.score === 'number' ? wealth.score : null,
    marriageScore: typeof marriage?.score === 'number' ? marriage.score : null,
    healthScore: typeof health?.score === 'number' ? health.score : null,
    oneLiner: asText(
      result.analysis?.summary || advice.overall || overall?.summary || overall?.oneLiner,
      80
    ),
    doThis:
      advice.career?.actions?.[0] ||
      advice.career?.specific?.[0] ||
      overall?.actionLabel ||
      (yongList[0] ? `顺着用神「${yongList[0]}」推进一件可验证的事` : undefined),
    avoidThis:
      advice.career?.avoid?.[0] ||
      advice.jiShen?.[0] ||
      (jiList[0] ? `忌神「${jiList[0]}」方向少硬推` : undefined),
    currentDayun: dayun?.ganZhi || extractGz(fortune.currentDaYun) || fortune.currentDaYun,
    currentLiunian: fortune.currentLiuNian,
    pillarsSummary: pillarsSummary || undefined,
    focusAreas: [
      overall?.summary,
      career?.summary,
      fortune.interaction,
      marriage?.summary,
    ].filter(Boolean),
    evidenceLines: evidenceLines.slice(0, 4),
  };
}

function extractGz(text?: string): string {
  const m = `${text || ''}`.match(/[甲乙丙丁戊己庚辛壬癸][子丑寅卯辰巳午未申酉戌亥]/);
  return m?.[0] || '';
}
