/**
 * Project GroundTruthPack into consumer-specific views.
 */

import type { GroundTruthPack, LockedEngineFacts } from '@/lib/ground-truth/pack';
import type { ReportChatContext } from '@/lib/chat-report-anchor';
import { CHAT_ENGINE_CONTRACT } from '@/lib/ground-truth/hard-contract';

export function lockedFactsToJson(facts: LockedEngineFacts): string {
  try {
    return JSON.stringify(facts, null, 0);
  } catch {
    return '{}';
  }
}

/** Compact block for agent user prompts (LOCKED_ENGINE_FACTS). */
export function buildLockedFactsPromptBlock(pack: GroundTruthPack): string {
  return [
    '【LOCKED_ENGINE_FACTS · 输出中须保留字面】',
    lockedFactsToJson(pack.lockedFacts),
    '',
    '【禁止】',
    '- 新增大运干支或调整 startAge/endAge',
    '- 新造十神表条目',
    '- 把非锚点年写成峰谷年',
    '- 改写用神/忌神元素列表',
  ].join('\n');
}

/** 8–12 line EFC prose for chat teachers. */
export function buildTeacherEfcBlock(pack: GroundTruthPack): string {
  const f = pack.lockedFacts;
  const lines = [
    CHAT_ENGINE_CONTRACT,
    f.dayMaster ? `日主：${f.dayMaster}` : '',
    f.pattern ? `格局：${f.pattern}` : '',
    f.pillars.length ? `四柱：${f.pillars.join(' ')}` : '',
    f.yongShen.length ? `用神：${f.yongShen.join('、')}` : '',
    f.xiShen.length ? `喜神：${f.xiShen.join('、')}` : '',
    f.jiShen.length ? `忌神：${f.jiShen.join('、')}` : '',
    f.currentDayun
      ? `当前大运：${f.currentDayun.ganZhi}（${f.currentDayun.startAge}-${f.currentDayun.endAge}岁，${f.currentDayun.quality}）`
      : '',
    f.tenGodsStem.length ? `十神重心：${[...new Set(f.tenGodsStem)].slice(0, 6).join('、')}` : '',
    Number.isFinite(f.currentScore)
      ? `当前综合参考分：${f.currentScore}（${f.currentYear}年，约${f.currentAge}岁）`
      : '',
    f.anchorYears.length
      ? `K线锚点年：${f.anchorYears.slice(0, 6).join('、')}`
      : '',
    f.windowLabels.length
      ? `优先窗口标签：${f.windowLabels.slice(0, 4).join('、')}`
      : '',
  ].filter(Boolean);

  return lines.join('\n');
}

/** Project pack → chat report anchor context. */
export function packToChatReportContext(
  pack: GroundTruthPack,
  reportId: string,
  extras?: Partial<ReportChatContext>,
): ReportChatContext {
  const f = pack.lockedFacts;
  const eng = pack.engine;
  const currentYear = f.currentYear;
  const currentPoint = eng.kline.points.find((p) => p.year === currentYear);

  const bestWindow =
    extras?.bestWindow ||
    eng.kline.windows.find((w) => w.type === 'peak')?.label ||
    eng.kline.windows[0]?.label ||
    '';
  const riskWindow =
    extras?.riskWindow ||
    eng.kline.windows.find((w) => w.type === 'trough')?.label ||
    eng.kline.windows[1]?.label ||
    '';

  return {
    reportId,
    dayMaster: f.dayMaster,
    pattern: f.pattern,
    yongShen: f.yongShen,
    jiShen: f.jiShen,
    xiShen: f.xiShen,
    pillarsSummary: f.pillars.join(' ').slice(0, 32),
    currentDayun: f.currentDayun
      ? `${f.currentDayun.ganZhi} ${f.currentDayun.startAge}-${f.currentDayun.endAge}岁`
      : extras?.currentDayun,
    topScenario: extras?.topScenario || (f.yongShen[0] ? `顺着${f.yongShen.join('、')}推进` : '当前阶段主轴'),
    bestWindow: bestWindow || extras?.bestWindow,
    riskWindow: riskWindow || extras?.riskWindow,
    careerScore: currentPoint?.career ?? extras?.careerScore ?? null,
    wealthScore: currentPoint?.wealth ?? extras?.wealthScore ?? null,
    marriageScore: currentPoint?.marriage ?? extras?.marriageScore ?? null,
    healthScore: currentPoint?.health ?? extras?.healthScore ?? null,
    oneLiner: extras?.oneLiner,
    doThis: extras?.doThis,
    avoidThis: extras?.avoidThis || (f.jiShen[0] ? `${f.jiShen.join('、')}方向少硬推` : undefined),
    evidenceLines: [
      f.dayMaster ? `日主 ${f.dayMaster} · 格局 ${f.pattern || '—'}` : '',
      f.yongShen.length ? `用神 ${f.yongShen.join('、')} · 忌神 ${f.jiShen.join('、') || '—'}` : '',
      f.currentDayun
        ? `当前大运 ${f.currentDayun.ganZhi}（${f.currentDayun.startAge}-${f.currentDayun.endAge}岁）`
        : '',
      f.tenGodsStem.length ? `十神 ${[...new Set(f.tenGodsStem)].slice(0, 4).join('、')}` : '',
      Number.isFinite(f.currentScore) ? `当前综合分 ${f.currentScore}` : '',
    ].filter(Boolean),
    focusAreas: extras?.focusAreas,
    currentLiunian: extras?.currentLiunian,
  };
}

/** Short reportHint line for teacher addon when only a string is needed. */
export function packToReportHint(pack: GroundTruthPack): string {
  const f = pack.lockedFacts;
  const parts = [
    f.dayMaster ? `日主${f.dayMaster}` : '',
    f.yongShen.length ? `用神${f.yongShen.join('')}` : '',
    f.currentDayun ? `大运${f.currentDayun.ganZhi}` : '',
    Number.isFinite(f.currentScore) ? `综合${f.currentScore}` : '',
  ].filter(Boolean);
  return parts.join(' · ');
}
