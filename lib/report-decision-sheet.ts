/**
 * 普通人「决策一页通」— 30 秒读懂自己
 * 数据来自 ProReportView，不另起算法。
 */

import type { ProReportView } from '@/lib/report-pro-view';
import { presentReportText } from '@/lib/report-presentation';
import { KNOWLEDGE_BASE } from '@/lib/knowledge-base-meta';

export interface DecisionSheet {
  structureLine: string;
  stageLine: string;
  next30Days: string[];
  risks: string[];
  revisitWhen: string;
  overallScore10: number;
  /** 为什么是这个结构判断 */
  whyStructure?: string;
  /** 为什么是这个阶段判断 */
  whyStage?: string;
  /** 读法提示 */
  howToRead?: string;
}

/** 可复制 / 分享的纯文本决策摘要 */
export function formatDecisionSheetPlain(
  sheet: DecisionSheet,
  opts?: { name?: string; reportId?: string }
): string {
  const name = opts?.name?.trim();
  const lines = [
    `【决策一页通 · ${KNOWLEDGE_BASE.shortLabel}】`,
    name ? `${name}` : '',
    `综合 ${sheet.overallScore10}/10`,
    '',
    `① 结构（你是谁）`,
    sheet.structureLine,
    sheet.whyStructure ? `为什么：${sheet.whyStructure}` : '',
    '',
    `② 阶段（你在哪儿）`,
    sheet.stageLine,
    sheet.whyStage ? `为什么：${sheet.whyStage}` : '',
    '',
    `③ 未来 30 天（怎么做）`,
    ...sheet.next30Days.map((x, i) => `  ${i + 1}. ${x}`),
    '',
    `④ 风险与不宜（别踩坑）`,
    ...sheet.risks.map((x, i) => `  ${i + 1}. ${x}`),
    '',
    `下次回来：${sheet.revisitWhen}`,
    sheet.howToRead ? `\n读法：${sheet.howToRead}` : '',
    opts?.reportId ? `报告：https://www.life-kline.com/result/${opts.reportId}` : '',
    '',
    '说明：文化决策与自我管理参考，非医疗/法律/投资建议。',
  ].filter((line) => line !== undefined && line !== '');
  return lines.join('\n').trim() + '\n';
}

export function buildDecisionSheet(view: ProReportView): DecisionSheet {
  const structureLine =
    presentReportText(view.overview.oneLiner, 220) ||
    presentReportText(view.overview.sections?.[0]?.body, 220) ||
    `${view.dayMaster || '日主'}命局 · ${view.patternLabel || '综合结构'}：先认清方向，再谈时机。`;

  const month = view.timeScores.find((s) => s.key === 'month');
  const year = view.timeScores.find((s) => s.key === 'year');
  const stageBits = [
    month ? `本月 ${month.score10}/10（${levelWord(month.level)}）${month.tip ? `：${month.tip}` : ''}` : '',
    year ? `今年 ${year.score10}/10（${levelWord(year.level)}）${year.tip ? `：${year.tip}` : ''}` : '',
    view.nowAction.focusWindow ? `关注窗口 ${view.nowAction.focusWindow}` : '',
  ].filter(Boolean);
  const stageLine = stageBits.join('\n') || '先稳住节奏，再看议题强弱；不确定时只做可验证的小事。';

  const next30Days = unique([
    view.nowAction.doThis,
    view.nowAction.whyDo ? `（原因）${view.nowAction.whyDo}` : '',
    ...view.elements.doList.slice(0, 2),
    ...view.topics
      .filter((t) => t.status === 'push')
      .slice(0, 1)
      .map((t) => `${t.title}：顺势推进（${t.score10}/10）——${t.how?.[0] || t.summary}`),
  ]).slice(0, 5);

  while (next30Days.length < 3) {
    next30Days.push(
      next30Days.length === 0
        ? '先复盘最近一次关键决策是否顺着喜用方向，并写下可验证结果'
        : next30Days.length === 1
          ? '用一件小事验证本月窗口（2–4 周能看到反馈），而不是同时开多线'
          : '把不宜事项写进日历提醒，降低冲动决策；到期回来打分'
    );
  }

  const risks = unique([
    view.nowAction.avoidThis,
    view.nowAction.whyAvoid ? `（原因）${view.nowAction.whyAvoid}` : '',
    ...view.riskAlerts.slice(0, 3).map((r) => `${r.when}：${r.title}——${r.reason}`),
    ...view.elements.avoidList.slice(0, 2),
  ]).slice(0, 5);

  const highRisk = view.riskAlerts.find((r) => r.severity === 'high');
  const cautionMonth = view.monthStrip.find((m) => m.level === 'caution');
  const revisitWhen = highRisk
    ? `建议在「${highRisk.when}」前回来对照一次：哪些避开了、哪些没避开、结果如何`
    : cautionMonth
      ? `建议关注「${cautionMonth.label}」前后再回来复盘，把现实结果记入事件本`
      : '建议 30 天后带着现实反馈再看这份报告，并在预测回访打分';

  const yong = view.elements.yongShen.join('、') || '喜用';
  const ji = view.elements.jiShen.join('、') || '忌神';

  return {
    structureLine,
    stageLine,
    next30Days,
    risks: risks.length ? risks : ['暂无高亮风险，仍避免同时开多条不确定线'],
    revisitWhen,
    overallScore10: view.overview.score10,
    whyStructure: `因为命盘给出的是「方向与边界」：日主与格局告诉你资源更适合投向哪一类事；喜用「${yong}」、忌「${ji}」是取舍标准，不是宿命口号。`,
    whyStage: `阶段分来自本月/今年窗口与大运流年背景：分高不等于乱冲，分低不等于躺平——而是告诉你现在「推进成本」高还是低。`,
    howToRead:
      '读法（循序渐进）：①先看结构是否认账 ②再看阶段该攻还是守 ③只选 1–3 件 30 天动作并写清验证方式 ④风险写进事件本/日历 ⑤到期对照打分 ⑥有十万个为什么就点「继续问」——我们按结论→原因→行动回答，不故弄玄虚。',
  };
}

function levelWord(level?: 'good' | 'ok' | 'caution') {
  if (level === 'good') return '偏顺';
  if (level === 'caution') return '宜慎';
  return '平稳';
}

function unique(items: string[]) {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of items) {
    const t = `${raw || ''}`.trim();
    if (!t || seen.has(t)) continue;
    seen.add(t);
    out.push(t);
  }
  return out;
}
