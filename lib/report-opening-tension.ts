/**
 * Report first-screen: one tension + one ask.
 * Users bounce when the first screen is six chapters. They stay when they
 * see the conflict of THIS chart and one question they can tap.
 */

import type { ProReportView } from '@/lib/report-pro-view';
import { buildChatHref } from '@/lib/chat-entry';

export type ReportOpeningTension = {
  eyebrow: string;
  headline: string;
  why: string;
  doNow: string;
  askLabel: string;
  askQuestion: string;
  askHref: string;
};

export function buildReportOpeningTension(
  view: ProReportView,
  reportId: string,
): ReportOpeningTension {
  const yong = (view.elements.yongShen || []).slice(0, 2).join('、') || '结构主线';
  const strength = `${view.elements.strengthDesc || ''}`.trim();
  const tiaoNote = `${view.elements.tiaohuoNote || ''}`.trim();
  const tiaoEl = `${view.elements.tiaohuoElement || ''}`.trim();
  const doNow =
    `${view.nowAction.doThis || ''}`.trim() ||
    `顺着主用神「${yong}」做一件 2–4 周能看到反馈的小事。`;
  const caution = view.topics.find((t) => t.status === 'caution');
  const risk = view.riskAlerts[0];

  let eyebrow = '这一盘的矛盾';
  let headline = '';
  let why = '';
  let askLabel = '就问这一句';
  let askQuestion = '';

  if (strength && /弱/.test(strength) && (tiaoNote || tiaoEl)) {
    headline = `${strength}，主用神是${yong}；另有调候${tiaoEl || ''}`.replace(/；另有调候$/, '');
    if (tiaoEl && !headline.includes(tiaoEl)) headline = `${headline}（${tiaoEl}）`;
    why =
      '扶抑主线和季节调节不是一回事。先听主用神做事；调候只作辅助，不要当成「身弱却用火」。';
    askLabel = '主用和调候听谁的';
    askQuestion = `我这份盘判为「${strength}」，主用神「${yong}」${
      tiaoNote ? `；调候：${tiaoNote}` : tiaoEl ? `；另有调候${tiaoEl}` : ''
    }。请不要复述喜忌列表，直接讲：接下来 30 天把主用神落到哪一件可验证的事？调候和主用神打架时听谁的？`;
  } else if (strength && /旺/.test(strength)) {
    headline = `${strength}，宜克泄；主用神${yong}`;
    why = '身偏旺时再去补印比容易空转。先把克泄落到能收缩的动作，再谈扩张。';
    askLabel = '旺了该怎么泄';
    askQuestion = `我这份盘是「${strength}」，主用神「${yong}」。请不要再讲一遍身旺理论，直接给：本周哪一件事是克泄落地，哪一件是在给自己加码？`;
  } else if (caution?.summary) {
    eyebrow = '这一盘先避的坑';
    headline = `${caution.title}偏紧：${caution.summary.slice(0, 72)}`;
    why = caution.why || '先把高压议题降杠杆，再谈推进。';
    askLabel = `${caution.title}怎么避`;
    askQuestion = `${caution.title}当前偏紧${caution.summary ? `——${caution.summary}` : ''}。请翻译成 3 条「现在不要做」，以及一个「什么时候可以重新启动」的判断条件。`;
  } else if (risk) {
    eyebrow = '这一盘先盯的窗口';
    headline = `${risk.when}：${risk.title}`;
    why = risk.why || risk.reason || '窗口成本高时硬冲更贵。';
    askLabel = '这个窗口怎么用';
    askQuestion = `${risk.when}「${risk.title}」我该怎么安排？什么可以做、什么必须停，窗口过了怎么恢复？`;
  } else {
    headline =
      `${view.overview.oneLiner || ''}`.trim().slice(0, 90) ||
      `日主${view.dayMaster || ''} · ${view.patternLabel || '当前结构'}，先认清主用神再谈时机`;
    why = `主用神「${yong}」是扶抑主线；拿不准时只做一件可验证的小事。`;
    askLabel = '主线怎么落地';
    askQuestion = `围绕主用神「${yong}」，接下来 30 天我该把哪一件事做成可验证的结果？不要空谈五行。`;
  }

  const askHref = buildChatHref({
    reportId,
    question: askQuestion,
    mode: 'prefill',
    teacher: /关系|婚/.test(askLabel) ? 'relationship' : /财|窗口/.test(askLabel) ? 'timing' : 'overview',
    source: 'result_opening_tension',
  });

  return {
    eyebrow,
    headline,
    why,
    doNow,
    askLabel,
    askQuestion,
    askHref,
  };
}
