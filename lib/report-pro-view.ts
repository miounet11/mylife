/**
 * Pro 式命盘阅读视图 — 面向小白用户
 *
 * 用户真正想知道的：
 * 1) 我的命盘是什么、综合几分
 * 2) 喜用 / 忌神 → 趋利避害
 * 3) 本月 / 今年 / 明年 好不好
 * 4) 重点风险时间（避灾）
 * 5) 事业财感情健康强弱
 * 6) 像 K 线一样的人生轨迹
 */

import type {
  DecisionPlaybookItem,
  ExpertInterpretationBlock,
  MonthlyWindow,
  ScenarioView,
  YearlyTrendSnapshot,
} from '@/lib/report-v2';
import { localizeElementList, presentReportText } from '@/lib/report-presentation';
import {
  buildWhyFromStatus,
  composeExplainParagraph,
  defaultFaqForDomain,
  defaultReportFaq,
  presentLong,
  presentMedium,
  sectionReadingLabel,
  softenMysticPhrases,
} from '@/lib/content-voice';

export type ProTopicStatus = 'push' | 'steady' | 'caution';

export interface ProPillarItem {
  label: string;
  ganZhi: string;
}

export interface ProTopicCard {
  key: string;
  title: string;
  score10: number;
  status: ProTopicStatus;
  tags: string[];
  /** 结论（先看） */
  summary: string;
  /** 完整展开 */
  fullText: string;
  /** 为什么是这个判断 */
  why?: string;
  /** 怎么做（步骤） */
  how?: string[];
  /** 如何验证 */
  verify?: string;
  /** 你可能想问 */
  faq?: Array<{ q: string; a: string }>;
}

export interface ProOutlookBlock {
  title: string;
  body: string;
  tags: string[];
  keyDates: string[];
  score10?: number;
  /** good | ok | caution */
  level?: 'good' | 'ok' | 'caution';
}

export interface ProKlinePeak {
  year: number;
  score: number;
  label: string;
}

/** 喜用忌 — 小白话 */
export interface ProElementGuide {
  yongShen: string[];
  xiShen: string[];
  jiShen: string[];
  /** 趋利：可以多做什么 */
  doList: string[];
  /** 避害：尽量少做什么 */
  avoidList: string[];
  plainSummary: string;
}

/** 时间轴打分：本月 / 今年 / 明年 */
export interface ProTimeScore {
  key: 'month' | 'year' | 'nextYear';
  label: string;
  sublabel: string;
  score10: number;
  level: 'good' | 'ok' | 'caution';
  tip: string;
}

/** 重点避险时间 */
export interface ProRiskAlert {
  key: string;
  when: string;
  severity: 'high' | 'medium';
  title: string;
  reason: string;
  action: string;
  /** 白话：为什么要避 */
  why?: string;
  /** 窗口过了怎么恢复 */
  afterHint?: string;
  /** 存事件用的日期 YYYY-MM-DD */
  dateKey?: string;
  eventType?: 'career' | 'wealth' | 'marriage' | 'health' | 'other';
}

/** 现在最该做 / 最别做 */
export interface ProNowAction {
  doThis: string;
  avoidThis: string;
  focusWindow?: string;
  /** 为什么该做 */
  whyDo?: string;
  /** 为什么别做 */
  whyAvoid?: string;
  /** 如何验证做对了 */
  verifyHint?: string;
}

/** 近月时间条（合一时间轴） */
export interface ProMonthStripItem {
  key: string;
  label: string;
  shortLabel: string;
  score10: number;
  level: 'good' | 'ok' | 'caution';
  theme: string;
  isCurrent?: boolean;
}

/** 命理总评分章（讲清楚，而不是一句话糊弄） */
export interface ProOverviewSection {
  key: string;
  title: string;
  body: string;
  bullets?: string[];
  /** 这一章回答什么（读法） */
  readingHint?: string;
  /** 章节内 FAQ（可选） */
  faq?: Array<{ q: string; a: string }>;
}

export interface ProReportView {
  title: string;
  subtitle: string;
  patternLabel: string;
  dayMaster: string;
  pillars: ProPillarItem[];
  overview: {
    score10: number;
    /** 完整总评拼接文（兼容旧 UI） */
    body: string;
    tags: string[];
    /** 给小白的一句话结论 */
    oneLiner: string;
    /** 分章展开：结构 / 用忌 / 岁运 / 四维 / 时间 / 行动 */
    sections: ProOverviewSection[];
  };
  /** 阅读指引 */
  beginnerGuide: string[];
  /** 唯一行动条 */
  nowAction: ProNowAction;
  elements: ProElementGuide;
  timeScores: ProTimeScore[];
  /** 近 12 个月合一时间轴 */
  monthStrip: ProMonthStripItem[];
  riskAlerts: ProRiskAlert[];
  month: ProOutlookBlock | null;
  year: ProOutlookBlock | null;
  nextYear: ProOutlookBlock | null;
  topics: ProTopicCard[];
  klinePeak: ProKlinePeak | null;
  /** K 线低谷提示 */
  klineTrough: ProKlinePeak | null;
}

const PILLAR_LABELS = ['年柱', '月柱', '日柱', '时柱'] as const;

const TOPIC_TITLE: Record<string, string> = {
  career: '事业行业',
  wealth: '财富财运',
  marriage: '婚姻情感',
  health: '身体健康',
  overall: '综合运势',
};

const STATUS_TAG: Record<ProTopicStatus, string> = {
  push: '宜推进',
  steady: '宜稳健',
  caution: '宜防守',
};

const ELEMENT_PLAIN: Record<string, string> = {
  木: '生长、学习、拓展',
  火: '表达、曝光、行动力',
  土: '稳定、积累、落地',
  金: '规则、决断、收敛',
  水: '流动、智慧、休整',
};

/** 0–100 → 1–10 */
export function toScore10(score0to100: number | null | undefined): number {
  if (typeof score0to100 !== 'number' || !Number.isFinite(score0to100)) return 5;
  const n = Math.round(score0to100 / 10);
  return Math.max(1, Math.min(10, n));
}

export function scoreLevel(score10: number): 'good' | 'ok' | 'caution' {
  if (score10 >= 7) return 'good';
  if (score10 >= 5) return 'ok';
  return 'caution';
}

export function buildProReportView(params: {
  result: {
    basic?: {
      name?: string;
      dayMaster?: string;
      pillars?: Array<Record<string, unknown>>;
      year?: string;
      month?: string;
      day?: string;
      hour?: string;
    };
    pattern?: { type?: string; description?: string } | null;
    advice?: {
      career?: { general?: string; specific?: string[]; timing?: string; avoid?: string[] };
      wealth?: { general?: string; specific?: string[]; timing?: string; avoid?: string[] };
      marriage?: { general?: string; specific?: string[]; timing?: string; avoid?: string[] };
      health?: { general?: string; specific?: string[]; timing?: string; avoid?: string[] };
      yongShen?: string[];
      xiShen?: string[];
      jiShen?: string[];
      timing?: string[] | string;
    } | null;
    analysis?: {
      opening?: string;
      summary?: string;
      explanation?: string;
    } | null;
    fortune?: {
      currentDaYun?: string;
      currentLiuNian?: string;
      interaction?: string;
      nextYear?: string;
      trend?: string;
    } | null;
    confidence?: { overallScore?: number; summary?: string } | null;
    klineData?: Array<{
      year?: number;
      career?: number;
      wealth?: number;
      marriage?: number;
      health?: number;
      score?: number;
    }> | null;
  };
  scenarioViews?: ScenarioView[] | null;
  monthlyWindows?: MonthlyWindow[] | null;
  yearlyTrendSnapshots?: YearlyTrendSnapshot[] | null;
  expertInterpretation?: ExpertInterpretationBlock[] | null;
  decisionPlaybook?: DecisionPlaybookItem[] | null;
  cockpitHeadline?: string | null;
}): ProReportView {
  const { result } = params;
  const pillars = extractPillars(result.basic);
  const patternLabel = presentReportText(result.pattern?.type, 24) || '命盘结构';
  const dayMaster = presentReportText(result.basic?.dayMaster, 8);
  const publicTitle = dayMaster ? `日主${dayMaster} · ${patternLabel}` : patternLabel;

  const overviewScore = buildOverviewScore(params);
  const oneLiner = buildOneLiner(params, overviewScore);
  const overviewTags = buildOverviewTags(params);

  const elements = buildElementGuide(params);
  const timeScores = buildTimeScores(params);
  const riskAlerts = buildRiskAlerts(params);
  const monthStrip = buildMonthStrip(params.monthlyWindows);
  const month = buildMonthOutlook(params.monthlyWindows, result.fortune);
  const year = buildYearOutlook(params.yearlyTrendSnapshots, result.fortune, 0);
  const nextYear = buildYearOutlook(params.yearlyTrendSnapshots, result.fortune, 1);
  const topics = buildTopicCards(params);
  const { peak: klinePeak, trough: klineTrough } = findKlineExtremes(result.klineData);
  const nowAction = buildNowAction(params, elements, riskAlerts, overviewScore);
  const overviewSections = buildOverviewSections(params, {
    score10: overviewScore,
    oneLiner,
    elements,
    topics,
    timeScores,
    riskAlerts,
    nowAction,
    year,
    nextYear,
    klinePeak,
    klineTrough,
    dayMaster,
    patternLabel,
    pillars,
  });
  const overviewBody = overviewSections.map((s) => `【${s.title}】\n${s.body}`).join('\n\n');

  const beginnerGuide = [
    '先看「决策一页通」和「现在最该做 / 最别做」——两分钟知道自己该往哪走。',
    '再看人生 K 线：一生高低点、当前落在哪一段，心里有地图才不慌。',
    '然后读命理总评六+一章：结构→用忌→岁运→四维→时间→行动→你可能想问。',
    '时间条里红/低分月份优先记到事件本——那是避险重点，不是吓唬你。',
    '四维议题默认展开「结论 / 为什么 / 怎么做」；不懂就点「继续追问」。',
    '有十万个为什么很正常：每章都有白话解释，末章 FAQ 先扫一遍。',
  ];

  return {
    title: publicTitle,
    subtitle: presentReportText(result.fortune?.currentDaYun, 48) || '当前阶段运势一览',
    patternLabel,
    dayMaster,
    pillars,
    overview: {
      score10: overviewScore,
      body: overviewBody,
      tags: overviewTags,
      oneLiner,
      sections: overviewSections,
    },
    beginnerGuide,
    nowAction,
    elements,
    timeScores,
    monthStrip,
    riskAlerts,
    month,
    year,
    nextYear,
    topics,
    klinePeak,
    klineTrough,
  };
}

function extractPillars(basic?: {
  pillars?: Array<Record<string, unknown>>;
  year?: string;
  month?: string;
  day?: string;
  hour?: string;
}): ProPillarItem[] {
  const fromArray = (basic?.pillars || [])
    .slice(0, 4)
    .map((p, i) => {
      const stem = `${p.celestialStem || p.gan || ''}`.trim();
      const branch = `${p.earthlyBranch || p.zhi || ''}`.trim();
      const ganZhi =
        presentReportText(p.ganZhi, 4) ||
        presentReportText(`${stem}${branch}`, 4) ||
        '';
      return {
        label: PILLAR_LABELS[i] || `柱${i + 1}`,
        ganZhi,
      };
    })
    .filter((p) => p.ganZhi);

  if (fromArray.length >= 4) return fromArray;

  const flat = [basic?.year, basic?.month, basic?.day, basic?.hour]
    .map((v, i) => ({
      label: PILLAR_LABELS[i]!,
      ganZhi: presentReportText(v, 4),
    }))
    .filter((p) => p.ganZhi);

  return flat.length ? flat : fromArray;
}

function buildOneLiner(
  params: Parameters<typeof buildProReportView>[0],
  score10: number
): string {
  const level = scoreLevel(score10);
  const pattern = presentReportText(params.result.pattern?.type, 16) || '当前命盘';
  const dayun = presentReportText(params.result.fortune?.currentDaYun, 20);
  const yong = localizeElementList(params.result.advice?.yongShen || []).slice(0, 2).join('、');
  const yongHint = yong ? `，主线尽量顺着「${yong}」` : '';
  if (level === 'good') {
    return `${pattern}${dayun ? `，正行${dayun}` : ''}：综合 ${score10}/10，整体可积极布局${yongHint}；仍要避开下方风险月，做成一件再放大。`;
  }
  if (level === 'caution') {
    return `${pattern}${dayun ? `，正行${dayun}` : ''}：综合 ${score10}/10，宜收缩防守、趋利避害${yongHint}。先看「重点避险」与「最别做」，再谈扩张。`;
  }
  return `${pattern}${dayun ? `，正行${dayun}` : ''}：综合 ${score10}/10，稳中求进${yongHint}。一次只开一条主线，用 2–4 周验证再加码。`;
}

/** 长文展示：允许更长截断，避免总评只剩一句 */
function longText(input: unknown, max = 480): string {
  return presentReportText(input, max);
}

function buildOverviewBody(params: Parameters<typeof buildProReportView>[0]): string {
  // 兼容旧调用：返回完整分章拼接的第一版短文兜底
  const expert = params.expertInterpretation?.[0];
  const candidates = [
    params.cockpitHeadline,
    expert?.detail,
    expert?.headline,
    params.result.analysis?.opening,
    params.result.analysis?.summary,
    params.result.pattern?.description,
    params.result.fortune?.interaction,
  ];
  for (const c of candidates) {
    const text = longText(c, 600);
    if (text.length >= 24) return text;
  }
  return longText(
    `${params.result.pattern?.type || '当前命盘'}已成型。请结合喜用忌神、时间分数与人生曲线阅读。`,
    400
  );
}

/**
 * 命理总评分章：把结构、用忌、岁运、四维、时间、行动一次讲清楚
 */
function buildOverviewSections(
  params: Parameters<typeof buildProReportView>[0],
  ctx: {
    score10: number;
    oneLiner: string;
    elements: ProElementGuide;
    topics: ProTopicCard[];
    timeScores: ProTimeScore[];
    riskAlerts: ProRiskAlert[];
    nowAction: ProNowAction;
    year: ProOutlookBlock | null;
    nextYear: ProOutlookBlock | null;
    klinePeak: ProKlinePeak | null;
    klineTrough: ProKlinePeak | null;
    dayMaster: string;
    patternLabel: string;
    pillars: ProPillarItem[];
  }
): ProOverviewSection[] {
  const result = params.result;
  const expert = params.expertInterpretation || [];
  const sections: ProOverviewSection[] = [];

  // ① 结构
  const pillarLine = ctx.pillars.map((p) => `${p.label}${p.ganZhi}`).join(' · ') || '四柱见排盘';
  const patternDesc = softenMysticPhrases(longText(result.pattern?.description, 480));
  const opening = softenMysticPhrases(
    longText(
      params.cockpitHeadline ||
        expert[0]?.detail ||
        expert[0]?.headline ||
        result.analysis?.opening ||
        result.analysis?.summary ||
        result.analysis?.explanation,
      720
    )
  );
  const structureBody = [
    `先说结论：你的日主（代表「我」的字）是「${ctx.dayMaster || '—'}」，格局参考「${ctx.patternLabel}」。这不是标签牢笼，而是读盘的起点——后面所有建议，都从这里展开。`,
    `四柱排盘：${pillarLine}。年柱偏社会背景、月柱偏阶段气候、日柱看自身与伴侣宫、时柱看发挥与晚景倾向——先建立坐标，不必一次背全。`,
    patternDesc ? `格局说明（白话）：${patternDesc}` : '',
    opening ? `综合开篇：${opening}` : '',
    `综合评分 ${ctx.score10}/10。${ctx.oneLiner}`,
    '你可能想问「格局好不好」：比好坏更重要的是「适不适合现在的动作」。分数与后文用忌、时间、四维一起看，才完整。',
  ]
    .filter(Boolean)
    .join('\n');
  sections.push({
    key: 'structure',
    title: '① 命盘结构：你是谁',
    readingHint: sectionReadingLabel('structure'),
    body: structureBody,
    bullets: [
      ctx.dayMaster ? `日主 ${ctx.dayMaster}` : '',
      ctx.patternLabel ? `格局 ${ctx.patternLabel}` : '',
      `综合 ${ctx.score10}/10`,
    ].filter(Boolean),
  });

  // ② 用忌
  const yong = ctx.elements.yongShen.join('、') || '用神待补';
  const xi = ctx.elements.xiShen.join('、') || '—';
  const ji = ctx.elements.jiShen.join('、') || '忌神待补';
  const yongBody = [
    `先说结论：喜用忌是整份报告的「方向盘」。宜顺「${yong}」（喜「${xi}」），慎「${ji}」。`,
    '为什么重要：后文事业、财、关系、健康与时间建议，都尽量按这个方向取舍。没有方向盘，就会东一榔头西一棒子，看起来很忙却验证不了进步。',
    ctx.elements.plainSummary ? `白话总览：${ctx.elements.plainSummary}` : '',
    ctx.elements.doList.length
      ? `趋利（可以多做）：\n${ctx.elements.doList
          .slice(0, 5)
          .map((x, i) => `  ${i + 1}. ${x}`)
          .join('\n')}`
      : '',
    ctx.elements.avoidList.length
      ? `避害（尽量少做）：\n${ctx.elements.avoidList
          .slice(0, 5)
          .map((x, i) => `  ${i + 1}. ${x}`)
          .join('\n')}`
      : '',
    '你可能想问「忌神是不是永远不能碰」：不是。忌神是「高压时别硬刚、别梭哈」的提醒，不是诅咒。拿不准时，先做一件 2–4 周能看到反馈的小事。',
  ]
    .filter(Boolean)
    .join('\n');
  sections.push({
    key: 'yongji',
    title: '② 喜用与趋避：什么该顺、什么该躲',
    readingHint: sectionReadingLabel('yongji'),
    body: yongBody,
    bullets: [`用神 ${yong}`, `喜神 ${xi}`, `忌神 ${ji}`],
  });

  // ③ 岁运阶段
  const dayun = longText(result.fortune?.currentDaYun, 48);
  const liunian = longText(result.fortune?.currentLiuNian, 28);
  const interaction = softenMysticPhrases(
    longText(result.fortune?.interaction || result.fortune?.trend, 520)
  );
  const yearBody = softenMysticPhrases(longText(ctx.year?.body, 420));
  const nextBody = softenMysticPhrases(longText(ctx.nextYear?.body, 360));
  const stageBits = [
    '先说结论：你现在的「人生坐标」= 大运（约十年主题）× 流年（当年气候）× 人生曲线高低点。',
    dayun ? `当前大运：${dayun}。大运像季节主题，决定这几年更适合攻还是守。` : '当前大运信息见副标题/专业版大运表。',
    liunian ? `流年参考：${liunian}。流年是「今年天气」，叠在大运上，会放大或缓和某些议题。` : '',
    interaction ? `岁运怎么互动：${interaction}` : '',
    yearBody ? `今年节奏：${yearBody}` : '',
    nextBody ? `明年展望：${nextBody}` : '',
    ctx.klinePeak ? `人生曲线高点参考：${ctx.klinePeak.label}（约 ${ctx.klinePeak.year} 年）——高峰适合布局与收获验证。` : '',
    ctx.klineTrough
      ? `人生曲线低谷参考：${ctx.klineTrough.label}（约 ${ctx.klineTrough.year} 年）——低谷更适合保全、学习与关系修复，而不是豪赌翻盘。`
      : '',
    '你可能想问「大运不好是不是十年都完了」：不是。大运是主题倾向，仍可通过用忌取舍、窗口管理把后悔成本压低。',
  ].filter(Boolean);
  sections.push({
    key: 'stage',
    title: '③ 当前阶段：大运 × 流年你在哪儿',
    readingHint: sectionReadingLabel('stage'),
    body: stageBits.join('\n'),
    bullets: [
      dayun ? `大运 ${dayun}` : '',
      liunian ? `流年 ${liunian}` : '',
      ctx.year?.score10 != null ? `今年 ${ctx.year.score10}/10` : '',
    ].filter(Boolean),
  });

  // ④ 四维议题
  const topicParas = ctx.topics.map((t) => {
    const tip =
      t.status === 'push' ? '宜推进' : t.status === 'caution' ? '宜防守' : '宜稳健';
    const detail = softenMysticPhrases(longText(t.fullText || t.summary, 480));
    const why = t.why ? `\n为什么：${t.why}` : '';
    const how =
      t.how && t.how.length
        ? `\n怎么做：${t.how
            .slice(0, 3)
            .map((h, i) => `${i + 1}) ${h}`)
            .join(' ')}`
        : '';
    return `【${t.title} ${t.score10}/10 · ${tip}】\n结论：${detail}${why}${how}`;
  });
  const domainExtra = expert
    .filter((b) =>
      /事业|财|婚|关系|健康|身体|career|wealth|marriage|health/i.test(`${b.title}${b.key || ''}`)
    )
    .slice(0, 4)
    .map((b) =>
      softenMysticPhrases(longText(`${b.title}：${b.detail || b.headline || ''}`, 360))
    )
    .filter((t) => t.length > 12);
  sections.push({
    key: 'domains',
    title: '④ 人生四维：事业 · 财富 · 关系 · 健康',
    readingHint: sectionReadingLabel('domains'),
    body:
      [
        '先说结论：四维不是排名赛，而是告诉你「哪块该推进、哪块该防守」。分数低 ≠ 没希望，多半是「现在推进成本高」。',
        ...topicParas,
        ...domainExtra,
        '下方议题卡片默认展开「结论 / 为什么 / 怎么做 / 你可能想问」，可逐条深读或点继续追问。',
      ]
        .filter(Boolean)
        .join('\n\n') || '四维细节见下方议题卡片，可逐条展开。',
    bullets: ctx.topics.map((t) => `${t.title} ${t.score10}/10`),
  });

  // ⑤ 时间与避险
  const timeLines = ctx.timeScores.map(
    (s) =>
      `${s.label}${s.sublabel ? `（${s.sublabel}）` : ''} ${s.score10}/10（${levelWord(s.level)}）：${longText(s.tip, 200) || levelWord(s.level)}`
  );
  const riskLines = ctx.riskAlerts.slice(0, 5).map((r) => {
    const why = r.why ? ` 为什么要避：${longText(r.why, 120)}` : '';
    return `${r.when} · ${r.title}：${longText(r.reason, 160)} → 怎么做：${longText(r.action, 100)}${why}`;
  });
  const monthTip = ctx.timeScores.find((s) => s.key === 'month');
  const timingBody = [
    '先说结论：时间分不是玄学恐吓，而是「推进成本」提示——成本高时硬冲更贵，成本低时适合验证与签约类动作。',
    timeLines.length ? `时间轴细读：\n${timeLines.map((x, i) => `${i + 1}. ${x}`).join('\n')}` : '',
    riskLines.length
      ? `重点避险（建议记入事件本）：\n${riskLines.map((x, i) => `${i + 1}. ${x}`).join('\n')}`
      : '近期无特别高亮避险月，仍避免同时开多条不确定线。',
    monthTip ? `本月一句话：${longText(monthTip.tip, 220)}` : '',
    '读法：红/低分窗口先减硬承诺与高杠杆；高分窗口再推进，但一次只开一条主线。窗口过后用清单逐条恢复，不要一次全开。',
  ]
    .filter(Boolean)
    .join('\n');
  sections.push({
    key: 'timing',
    title: '⑤ 时间节奏与避险：什么时候做、什么时候停',
    readingHint: sectionReadingLabel('timing'),
    body: timingBody,
    bullets: riskLines.slice(0, 3).map((r) => r.slice(0, 40)),
  });

  // ⑥ 行动总纲
  const playbook = (params.decisionPlaybook || [])
    .slice(0, 4)
    .map((item) => {
      const title = longText(item.title || item.track, 32);
      const now = longText(item.nowAction, 120);
      const avoid = longText(item.avoidAction, 120);
      const why = longText(item.whyNow, 120);
      return [
        title && `· ${title}`,
        now && `  做：${now}`,
        avoid && `  不做：${avoid}`,
        why && `  为什么：${why}`,
      ]
        .filter(Boolean)
        .join('\n');
    })
    .filter(Boolean);
  const actionBody = [
    `先说结论——现在最该做：${ctx.nowAction.doThis}`,
    ctx.nowAction.whyDo ? `为什么该做：${ctx.nowAction.whyDo}` : '',
    `现在最别做：${ctx.nowAction.avoidThis}`,
    ctx.nowAction.whyAvoid ? `为什么别做：${ctx.nowAction.whyAvoid}` : '',
    ctx.nowAction.focusWindow ? `关注窗口：${ctx.nowAction.focusWindow}` : '',
    playbook.length ? `分轨剧本（可对照）：\n${playbook.join('\n')}` : '',
    ctx.nowAction.verifyHint
      ? `如何验证：${ctx.nowAction.verifyHint}`
      : '如何验证：把关键节点记入事件本，到期在预测回访打分；30 天后再对照总评是否仍然成立。',
    '只选 1 件主线坚持 30 天，比同时听十个建议更有效。做完再回来，我们帮你对照「哪里对了、哪里要改」。',
  ]
    .filter(Boolean)
    .join('\n');
  sections.push({
    key: 'action',
    title: '⑥ 当下行动总纲：先做对一件事',
    readingHint: sectionReadingLabel('action'),
    body: actionBody,
    bullets: [
      ctx.nowAction.doThis.slice(0, 48),
      `忌：${ctx.nowAction.avoidThis.slice(0, 36)}`,
    ],
  });

  // ⑦ 你可能想问
  const reportFaq = defaultReportFaq({
    dayMaster: ctx.dayMaster,
    yong,
    ji,
    score10: ctx.score10,
  });
  const faqBody = reportFaq
    .map((item, i) => `Q${i + 1}. ${item.q}\nA：${item.a}`)
    .join('\n\n');
  sections.push({
    key: 'faq',
    title: '⑦ 你可能想问：十万个为什么先答这些',
    readingHint: sectionReadingLabel('faq'),
    body: `有疑问很正常。下面先扫一遍常见卡点；若仍不解，点任意议题的「继续追问」，用你的生活问题来问即可。\n\n${faqBody}`,
    bullets: reportFaq.slice(0, 3).map((f) => f.q.slice(0, 24)),
    faq: reportFaq,
  });

  return sections;
}

function levelWord(level?: 'good' | 'ok' | 'caution') {
  if (level === 'good') return '偏顺';
  if (level === 'caution') return '宜慎';
  return '平稳';
}

function buildOverviewScore(params: Parameters<typeof buildProReportView>[0]): number {
  const overall = params.scenarioViews?.find((s) => s.key === 'overall');
  if (typeof overall?.score === 'number') return toScore10(overall.score);

  const conf = params.result.confidence?.overallScore;
  if (typeof conf === 'number') return toScore10(conf);

  const topics = (params.scenarioViews || []).filter((s) => s.key !== 'overall');
  if (topics.length) {
    const avg = topics.reduce((s, t) => s + (t.score || 0), 0) / topics.length;
    return toScore10(avg);
  }

  const year = params.yearlyTrendSnapshots?.[0]?.overallScore;
  if (typeof year === 'number') return toScore10(year);

  return 6;
}

function buildOverviewTags(params: Parameters<typeof buildProReportView>[0]): string[] {
  const tags: string[] = [];
  const pattern = presentReportText(params.result.pattern?.type, 16);
  if (pattern) tags.push(pattern);
  const dayun = presentReportText(params.result.fortune?.currentDaYun, 20);
  if (dayun) tags.push(dayun);
  const liunian = presentReportText(params.result.fortune?.currentLiuNian, 12);
  if (liunian) tags.push(`流年 ${liunian}`);
  return tags.slice(0, 4);
}

function buildElementGuide(params: Parameters<typeof buildProReportView>[0]): ProElementGuide {
  const yongShen = localizeElementList(params.result.advice?.yongShen || []);
  const xiShen = localizeElementList(params.result.advice?.xiShen || []);
  const jiShen = localizeElementList(params.result.advice?.jiShen || []);

  const favored = [...new Set([...yongShen, ...xiShen])];
  const doList: string[] = [];
  const avoidList: string[] = [];

  for (const el of favored.slice(0, 3)) {
    const plain = ELEMENT_PLAIN[el] || '顺势而为';
    doList.push(`多亲近「${el}」：${plain}相关的事更容易顺。`);
  }
  for (const el of jiShen.slice(0, 3)) {
    const plain = ELEMENT_PLAIN[el] || '逆势消耗';
    avoidList.push(`少硬碰「${el}」：${plain}上的大动作容易耗力。`);
  }

  // 从 playbook / advice 补趋利避害动作
  const playbook = params.decisionPlaybook || [];
  for (const item of playbook.slice(0, 3)) {
    const now = presentReportText(item.nowAction, 48);
    const avoid = presentReportText(item.avoidAction, 48);
    if (now && doList.length < 5) doList.push(now);
    if (avoid && avoidList.length < 5) avoidList.push(avoid);
  }

  const careerAvoid = (params.result.advice?.career?.avoid || []).map((x) => presentReportText(x, 40));
  const healthAvoid = (params.result.advice?.health?.avoid || []).map((x) => presentReportText(x, 40));
  for (const a of [...careerAvoid, ...healthAvoid]) {
    if (a && avoidList.length < 6) avoidList.push(a);
  }

  if (!doList.length) {
    doList.push('先做可验证、可回撤的小步动作，再决定是否放大。');
  }
  if (!avoidList.length) {
    avoidList.push('避免在低分窗口同时开太多战线或高杠杆决策。');
  }

  const plainSummary = [
    favored.length
      ? `对你更有帮助的方向（用神/喜神）是「${favored.join('、')}」：做事、选合作、排时间，尽量往这些气质靠。`
      : '用神信息偏少时，先按「低后悔成本」行动：能验证再加码。',
    jiShen.length
      ? `更容易消耗你的方向（忌神）是「${jiShen.join('、')}」：不是永远不能碰，而是别在高压窗口硬刚、别一次梭哈。`
      : '',
    '读法很简单：绿色多做、红色少硬推；拿不准时，先做一件 2–4 周能看到反馈的小事。这就是趋利避害，不需要故弄玄虚。',
  ]
    .filter(Boolean)
    .join('');

  return {
    yongShen,
    xiShen,
    jiShen,
    doList: uniqueStrings(doList).slice(0, 8),
    avoidList: uniqueStrings(avoidList).slice(0, 8),
    plainSummary: presentLong(plainSummary, 480),
  };
}

function buildTimeScores(params: Parameters<typeof buildProReportView>[0]): ProTimeScore[] {
  const now = new Date();
  const currentYear = now.getFullYear();
  const windows = params.monthlyWindows || [];
  const monthWin = windows[0];
  const yearSnap =
    params.yearlyTrendSnapshots?.find((s) => s.year === currentYear) ||
    params.yearlyTrendSnapshots?.[0];
  const nextSnap =
    params.yearlyTrendSnapshots?.find((s) => s.year === currentYear + 1) ||
    params.yearlyTrendSnapshots?.find((s) => s.year === (yearSnap?.year || currentYear) + 1);

  // 明年也可从 kline 取
  const nextFromKline = scoreYearFromKline(params.result.klineData, currentYear + 1);
  const thisFromKline = scoreYearFromKline(params.result.klineData, currentYear);

  const monthScore = toScore10(monthWin?.score);
  const yearScore = toScore10(
    typeof yearSnap?.overallScore === 'number' ? yearSnap.overallScore : thisFromKline
  );
  const nextScore = toScore10(
    typeof nextSnap?.overallScore === 'number' ? nextSnap.overallScore : nextFromKline
  );

  const monthTip =
    presentLong(monthWin?.reason || monthWin?.theme, 220) ||
    (scoreLevel(monthScore) === 'caution'
      ? '本月节奏偏紧：适合收尾、复盘、对齐，不适合同时开多条新战线或硬性摊牌。'
      : scoreLevel(monthScore) === 'good'
        ? '本月相对顺：可推进 1 件主线事项，但仍建议拆小验证，不要一口气梭哈。'
        : '本月中性：按计划小步推进，重大决定先问「两周后能否验证」。');

  const yearTip =
    presentLong(yearSnap?.headline || yearSnap?.advice, 220) ||
    presentMedium(params.result.fortune?.currentLiuNian, 80) ||
    '今年先锁定主线板块与避险月，再把资源投到喜用方向；不要什么都想要。';

  const nextTip =
    presentLong(nextSnap?.headline || nextSnap?.advice || params.result.fortune?.nextYear, 240) ||
    (scoreLevel(nextScore) === 'good'
      ? '明年有抬升空间：可提前做能力/关系/现金储备，把布局做在窗口前面。'
      : '明年仍宜稳：先做能力与现金储备，忌豪赌式翻盘；把验证闭环跑通比押大运更重要。');

  return [
    {
      key: 'month',
      label: '本月',
      sublabel: presentReportText(monthWin?.label, 16) || `${now.getMonth() + 1}月`,
      score10: monthScore,
      level: scoreLevel(monthScore),
      tip: monthTip,
    },
    {
      key: 'year',
      label: '今年',
      sublabel: String(yearSnap?.year || currentYear),
      score10: yearScore,
      level: scoreLevel(yearScore),
      tip: yearTip,
    },
    {
      key: 'nextYear',
      label: '明年',
      sublabel: String(nextSnap?.year || currentYear + 1),
      score10: nextScore,
      level: scoreLevel(nextScore),
      tip: nextTip,
    },
  ];
}

function buildNowAction(
  params: Parameters<typeof buildProReportView>[0],
  elements: ProElementGuide,
  riskAlerts: ProRiskAlert[],
  overviewScore: number
): ProNowAction {
  const playbook = [...(params.decisionPlaybook || [])].sort((a, b) => {
    const rank = (p: string) => (p === 'P1' ? 0 : p === 'P2' ? 1 : p === 'P3' ? 2 : 3);
    return rank(a.priority) - rank(b.priority);
  });
  const top = playbook[0];
  const topRisk = riskAlerts.find((a) => a.severity === 'high') || riskAlerts[0];

  let doThis =
    presentMedium(top?.nowAction, 160) ||
    elements.doList[0] ||
    (overviewScore >= 7
      ? '在喜用方向上推进一件可验证的小事（能在 2–4 周看到反馈），做成再放大。'
      : '先做低后悔成本的整理与复盘（清单、边界、现金流），再决定要不要扩张。');

  let avoidThis =
    presentMedium(top?.avoidAction, 160) ||
    elements.avoidList[0] ||
    (topRisk
      ? `${topRisk.when}前后少做高风险决定：${presentMedium(topRisk.action, 80)}`
      : '避免同时开太多战线，或在忌神方向硬冲——并行越多，验证越难。');

  const focusWindow =
    presentReportText(top?.bestWindow, 32) ||
    topRisk?.when ||
    presentReportText(params.monthlyWindows?.[0]?.label, 20) ||
    undefined;

  const whyDo =
    presentMedium(top?.whyNow, 280) ||
    (overviewScore >= 7
      ? '当前综合分不低，适合用「小步试错」把结构优势变成现实结果；空谈窗口不如完成一件可核对的事。做成再放大，比一次梭哈更稳。'
      : '当前更适合先稳住底盘：把混乱变成可管理状态，再谈进攻，后悔成本更低。防守不是躺平，而是为下一波窗口蓄力。');

  const whyAvoid = topRisk
    ? `因为「${topRisk.when}」被标为${topRisk.severity === 'high' ? '高压' : '需小心'}窗口：${presentMedium(topRisk.reason, 200)}硬冲容易把小问题放大成大回撤。窗口过后可用清单恢复推进，不必永远停住。`
    : '忌神方向或并行过多时，你的注意力与资源会被稀释，看起来很忙，却很难形成可验证进步。先做减法，进度反而更清楚。';

  const yongHint = elements.yongShen.length
    ? `尽量落在喜用「${elements.yongShen.slice(0, 2).join('、')}」方向上。`
    : '';

  return {
    doThis: presentMedium(doThis, 220),
    avoidThis: presentMedium(avoidThis, 220),
    focusWindow,
    whyDo: presentMedium(`${whyDo}${yongHint ? ` ${yongHint}` : ''}`, 320),
    whyAvoid: presentMedium(whyAvoid, 320),
    verifyHint:
      '如何知道做对了：30 天内完成 1 次对照——把结果记入事件本，并在预测回访勾选命中/部分/未命中。有偏差很正常，带着反馈再回来细化即可。',
  };
}

function buildMonthStrip(windows?: MonthlyWindow[] | null): ProMonthStripItem[] {
  const list = (windows || []).slice(0, 12);
  return list.map((w, index) => {
    const score10 = toScore10(w.score);
    const month = String(w.month).padStart(2, '0');
    return {
      key: w.key,
      label: presentReportText(w.label, 16) || `${w.year}.${month}`,
      shortLabel: `${w.month}月`,
      score10,
      level: scoreLevel(score10),
      theme: presentReportText(w.theme, 12) || '',
      isCurrent: index === 0,
    };
  });
}

function buildRiskAlerts(params: Parameters<typeof buildProReportView>[0]): ProRiskAlert[] {
  const alerts: ProRiskAlert[] = [];
  const windows = [...(params.monthlyWindows || [])].sort((a, b) => a.score - b.score);

  // 最低分月份 = 重点避险
  for (const w of windows.slice(0, 4)) {
    if (w.score >= 62 && alerts.length >= 1) continue;
    if (w.score >= 70) continue;
    const severity: 'high' | 'medium' = w.score < 52 ? 'high' : 'medium';
    const dateKey = `${w.year}-${String(w.month).padStart(2, '0')}-15`;
    const reason =
      presentLong(w.reason, 280) ||
      presentMedium(w.theme, 80) ||
      '此阶段节奏偏紧，外部推力与内部承受力可能错位，不宜硬推。';
    alerts.push({
      key: `win-${w.key}`,
      when: presentReportText(w.label, 24) || `${w.year}.${String(w.month).padStart(2, '0')}`,
      severity,
      title: severity === 'high' ? '重点避险月' : '需要小心的阶段',
      reason,
      why: `不是「倒霉」，而是该时间段的评分/主题显示推进成本更高。你越硬推，越容易用冲动换回撤。`,
      action:
        severity === 'high'
          ? '少开新战线，延后高风险签约/投资/冲突性决定；先保全现金流、睡眠与关键关系。'
          : '控制节奏，重大决定拆成小实验：先验证再加码。',
      afterHint: '窗口过后再评估：该恢复推进的事项，用清单逐条重启，不要一次全开。',
      dateKey,
      eventType: 'other',
    });
  }

  // 健康/事业 caution scenario
  for (const sc of params.scenarioViews || []) {
    if (sc.key === 'overall') continue;
    if (sc.status !== 'caution' && sc.score >= 55) continue;
    const risk = (sc.risks || []).map((r) => presentReportText(r, 48)).filter(Boolean)[0];
    if (!risk && sc.score >= 55) continue;
    const typeMap: Record<string, ProRiskAlert['eventType']> = {
      career: 'career',
      wealth: 'wealth',
      marriage: 'marriage',
      health: 'health',
    };
    alerts.push({
      key: `sc-${sc.key}`,
      when: '当前阶段',
      severity: sc.score < 50 ? 'high' : 'medium',
      title: `${TOPIC_TITLE[sc.key] || sc.title}需防守`,
      reason: risk || presentLong(sc.summary, 220) || '该板块压力偏大，继续硬推容易内耗。',
      why: buildWhyFromStatus('caution', TOPIC_TITLE[sc.key] || sc.title || '该领域'),
      action: presentMedium(sc.actionLabel, 80) || '先降噪、减并行、守住底盘，再谈扩张。',
      afterHint: '当评分回升或连续 2–4 周反馈变好时，再恢复推进，并一次只加一条主线。',
      dateKey: formatMonthMid(new Date()),
      eventType: typeMap[sc.key] || 'other',
    });
  }

  // playbook guard stance
  for (const item of params.decisionPlaybook || []) {
    if (item.stance !== 'guard' && item.priority !== 'Observe') continue;
    alerts.push({
      key: `pb-${item.key}`,
      when: presentReportText(item.bestWindow, 20) || '关注窗口',
      severity: item.stance === 'guard' ? 'high' : 'medium',
      title: presentReportText(item.title, 24) || '操作需谨慎',
      reason: presentReportText(item.whyNow, 90) || '此方向不宜激进。',
      action: presentReportText(item.avoidAction, 60) || presentReportText(item.nowAction, 60) || '先观察再行动。',
      dateKey: parseWindowToDateKey(item.bestWindow) || formatMonthMid(new Date()),
      eventType: (['career', 'wealth', 'marriage', 'health'].includes(item.track)
        ? item.track
        : 'other') as ProRiskAlert['eventType'],
    });
  }

  // K 线低谷年
  const trough = findKlineExtremes(params.result.klineData).trough;
  if (trough && trough.year >= new Date().getFullYear() - 1) {
    alerts.push({
      key: `kline-low-${trough.year}`,
      when: `${trough.year}年前后`,
      severity: trough.score < 45 ? 'high' : 'medium',
      title: '人生曲线低谷段',
      reason: `轨迹评分约 ${trough.score}，属于承压区间：外部推力与内部承受力更容易错位。`,
      why: '低谷不是「人生完了」，而是推进成本偏高的阶段。用学习、保全与关系修复换时间，通常比豪赌翻盘更划算。',
      action: '以保全、学习、关系修复为主，忌豪赌式翻盘；一次只守一条底线（现金流/睡眠/关键关系）。',
      afterHint: '曲线回升后，用清单恢复推进事项，仍建议做成一件再开下一件。',
      dateKey: `${trough.year}-06-15`,
      eventType: 'other',
    });
  }

  // 去重并限 5 条，高严重度优先
  const seen = new Set<string>();
  const sorted = alerts
    .filter((a) => {
      const k = `${a.when}-${a.title}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    })
    .sort((a, b) => (a.severity === 'high' ? 0 : 1) - (b.severity === 'high' ? 0 : 1))
    .slice(0, 5);

  return sorted;
}

function buildMonthOutlook(
  windows?: MonthlyWindow[] | null,
  fortune?: { currentLiuNian?: string } | null
): ProOutlookBlock | null {
  const w = windows?.[0];
  if (!w) return null;
  const body =
    presentLong(w.reason || w.theme, 420) ||
    '本月节奏请结合评分与喜用方向安排：高分可推进，低分先保全。';
  if (!body) return null;
  const score10 = toScore10(w.score);
  const tags: string[] = [];
  if (w.status === 'push') tags.push('宜推进');
  if (w.status === 'steady') tags.push('宜稳健');
  if (w.status === 'caution') tags.push('宜谨慎');
  const theme = presentReportText(w.theme, 16);
  if (theme) tags.push(theme);

  const keyDates = (windows || [])
    .slice(0, 4)
    .map((item) => {
      const label = presentReportText(item.label, 16);
      const t = presentReportText(item.theme, 12);
      const mark = item.score < 55 ? '⚠' : item.score >= 72 ? '↑' : '·';
      return label ? `${mark} ${label}${t ? ` ${t}` : ''}` : '';
    })
    .filter(Boolean);

  return {
    title: `本月运势${w.label ? ` · ${presentReportText(w.label, 16)}` : ''}`,
    body,
    tags: tags.slice(0, 3),
    keyDates,
    score10,
    level: scoreLevel(score10),
  };
}

function buildYearOutlook(
  snapshots?: YearlyTrendSnapshot[] | null,
  fortune?: { currentLiuNian?: string; nextYear?: string; interaction?: string } | null,
  offsetYear = 0
): ProOutlookBlock | null {
  const currentYear = new Date().getFullYear() + offsetYear;
  const snap =
    snapshots?.find((s) => s.year === currentYear) ||
    (offsetYear === 0 ? snapshots?.[0] : snapshots?.find((s) => s.year === currentYear)) ||
    null;

  const body = presentLong(
    offsetYear === 0
      ? snap?.advice || snap?.headline || fortune?.interaction
      : snap?.advice || snap?.headline || fortune?.nextYear,
    520
  );
  if (!body && !snap) return null;

  const score10 =
    typeof snap?.overallScore === 'number' ? toScore10(snap.overallScore) : undefined;
  const tags: string[] = [];
  if (snap?.dominantTrack) tags.push(`主线 ${presentReportText(snap.dominantTrack, 8)}`);
  if (snap?.pressureTrack) tags.push(`压力 ${presentReportText(snap.pressureTrack, 8)}`);
  if (offsetYear === 0) {
    const liunian = presentReportText(fortune?.currentLiuNian, 12);
    if (liunian) tags.push(liunian);
  }

  return {
    title: `${snap?.year || currentYear}年运势`,
    body: body || `${snap?.year || currentYear}年节奏请结合人生曲线与喜用方向安排。`,
    tags: tags.slice(0, 3),
    keyDates: [],
    score10,
    level: typeof score10 === 'number' ? scoreLevel(score10) : undefined,
  };
}

function buildTopicCards(params: Parameters<typeof buildProReportView>[0]): ProTopicCard[] {
  const advice = params.result.advice || {};
  const adviceMap: Record<string, { general?: string; specific?: string[]; timing?: string; avoid?: string[] }> = {
    career: advice.career || {},
    wealth: advice.wealth || {},
    marriage: advice.marriage || {},
    health: advice.health || {},
  };

  const scenarios = (params.scenarioViews || []).filter((s) => s.key !== 'overall');
  const keys = ['career', 'wealth', 'marriage', 'health'] as const;

  return keys.map((key) => {
    const sc = scenarios.find((s) => s.key === key);
    const adv = adviceMap[key] || {};
    const status: ProTopicStatus = sc?.status || 'steady';
    const score10 = toScore10(sc?.score);
    const title = TOPIC_TITLE[key] || sc?.title || key;

    const conclusion = softenMysticPhrases(
      presentLong(sc?.summary, 360) ||
        presentLong(adv.general, 360) ||
        '结合命盘与当前阶段，先稳住节奏，用一件可验证的小事打开局面。'
    );

    const baseWhy = buildWhyFromStatus(status, title, score10);
    const risks = [
      ...(sc?.risks || []).slice(0, 3).map((r) => presentMedium(r, 160)),
      ...(adv.avoid || []).slice(0, 3).map((r) => presentMedium(r, 160)),
    ].filter(Boolean);
    const expertBit = (params.expertInterpretation || [])
      .find((b) =>
        new RegExp(key === 'career' ? '事业|career' : key === 'wealth' ? '财|wealth' : key === 'marriage' ? '婚|关系|marriage' : '健康|身体|health', 'i').test(
          `${b.title}${b.key || ''}`
        )
      );
    const expertWhy = expertBit
      ? presentMedium(expertBit.detail || expertBit.headline, 220)
      : '';
    const why = softenMysticPhrases(
      [
        baseWhy,
        expertWhy ? `结合细读：${expertWhy}` : '',
        risks.length ? `需要警惕：${risks.slice(0, 2).join('；')}` : '',
      ]
        .filter(Boolean)
        .join(' ')
    );

    const how = [
      ...(sc?.focus || []).map((f) => presentMedium(f, 140)),
      ...(adv.specific || []).slice(0, 4).map((f) => presentMedium(f, 160)),
      presentMedium(adv.timing, 160) ? `时机提示：${presentMedium(adv.timing, 160)}` : '',
      presentMedium(sc?.actionLabel, 80) ? `当下姿态：${presentMedium(sc?.actionLabel, 80)}` : '',
      status === 'push'
        ? '选 1 个主动作推进 30 天，并设可核对结果（升/降/平），做成再放大。'
        : status === 'caution'
          ? '先砍掉 1 条并行线，把精力集中在保全与恢复；恢复后再谈扩张。'
          : '维持主线节奏，每周只加 1 个小改进，避免同时开多线。',
    ].filter(Boolean) as string[];

    const verify =
      key === 'career'
        ? '如何验证：岗位/项目是否出现职责或反馈变化；或 30 天内完成 1 次书面复盘并记入事件本。'
        : key === 'wealth'
          ? '如何验证：现金流、回款或冲动支出是否按计划改善（用数字记，不要只凭感觉）。'
          : key === 'marriage'
            ? '如何验证：完成 1 次无指责对齐（时间/金钱/家人），并记录冲突频率是否下降。'
            : '如何验证：连续 14 天睡眠/运动打卡，精力自评是否回升；不适请就医。';

    const faq = defaultFaqForDomain(key);
    const fullText = composeExplainParagraph({
      conclusion,
      why,
      how: how.slice(0, 6),
      verify,
    });

    const tags = [
      STATUS_TAG[status],
      presentReportText(sc?.actionLabel, 18),
      sc?.trend === 'up' ? '趋势向上' : sc?.trend === 'down' ? '趋势承压' : '',
    ].filter(Boolean) as string[];

    return {
      key,
      title,
      score10,
      status,
      tags: tags.slice(0, 3),
      summary: conclusion,
      fullText,
      why,
      how: how.slice(0, 5),
      verify,
      faq,
    };
  });
}

function scoreYearFromKline(
  klineData: Parameters<typeof buildProReportView>[0]['result']['klineData'],
  year: number
): number | null {
  if (!Array.isArray(klineData)) return null;
  const p = klineData.find((x) => Number(x.year) === year);
  if (!p) return null;
  if (Number(p.score) > 0) return Number(p.score);
  const dims = [p.career, p.wealth, p.marriage, p.health].map(Number).filter((n) => Number.isFinite(n));
  if (!dims.length) return null;
  return dims.reduce((a, b) => a + b, 0) / dims.length;
}

function findKlineExtremes(
  klineData?: Array<{
    year?: number;
    career?: number;
    wealth?: number;
    marriage?: number;
    health?: number;
    score?: number;
  }> | null
): { peak: ProKlinePeak | null; trough: ProKlinePeak | null } {
  if (!Array.isArray(klineData) || !klineData.length) {
    return { peak: null, trough: null };
  }
  let peak: ProKlinePeak | null = null;
  let trough: ProKlinePeak | null = null;
  for (const p of klineData) {
    const year = Number(p.year);
    if (!Number.isFinite(year)) continue;
    const dims = [p.career, p.wealth, p.marriage, p.health]
      .map(Number)
      .filter((n) => Number.isFinite(n));
    const score =
      Number(p.score) > 0
        ? Number(p.score)
        : dims.length
          ? dims.reduce((a, b) => a + b, 0) / dims.length
          : 0;
    const rounded = Math.round(score);
    if (!peak || score > peak.score) {
      peak = { year, score: rounded, label: `人生高点约 ${year}年 · 评分 ${rounded}` };
    }
    if (!trough || score < trough.score) {
      trough = { year, score: rounded, label: `相对低谷约 ${year}年 · 评分 ${rounded}` };
    }
  }
  return { peak, trough };
}

function uniqueJoin(parts: string[], maxLen: number): string {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const p of parts) {
    const t = p.trim();
    if (!t) continue;
    const key = t.slice(0, 40);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(t);
  }
  return presentReportText(out.join(' '), maxLen);
}

function uniqueStrings(values: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const v of values) {
    const t = presentReportText(v, 80);
    if (!t) continue;
    const k = t.slice(0, 28);
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(t);
  }
  return out;
}

function formatMonthMid(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}-15`;
}

/** 解析 2026.07 / 2026-07 / 2027.06 为存事件日期 */
function parseWindowToDateKey(raw?: string): string | undefined {
  const text = `${raw || ''}`.trim();
  const m = text.match(/(20\d{2})[.\-/年](\d{1,2})/);
  if (!m) return undefined;
  return `${m[1]}-${String(Number(m[2])).padStart(2, '0')}-15`;
}

/** 大众版术语小白话（UI 悬停/脚注用；深读见 knowledge-ladder TERM_KNOWLEDGE） */
export const PRO_TERM_GLOSSARY: Record<string, string> = {
  用神: '对你最有帮助的五行方向，做事顺着它更容易顺。点词可进知识库深读。',
  喜神: '辅助用神的有利因素，可一起加强。',
  忌神: '容易消耗你的方向，大事上尽量少硬碰——不是诅咒。',
  日主: '八字里代表「我」的字，看命盘的起点，不是标签牢笼。',
  大运: '大约十年一段的人生节奏主题。',
  流年: '某一年的整体气候，叠加在大运上。',
  格局: '命盘的整体类型标签，用来概括结构特征。',
  四柱: '年柱月柱日柱时柱，八个字的时间坐标。',
  人生K线: '把大运流年加权成一生高低曲线，看落点比看单月更稳。',
};
