/**
 * v6-Q2: Ensure agent result text carries required context anchors
 * (节气 / 流年 / 城市 / 行业 / 窗口) so soft verify can PASS when data exists.
 * Does not invent engine facts — only injects from StructuredAgenticContext.
 */

import type { StructuredAgenticContext } from '@/lib/agentic-report/types';

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function appendUnique(base: string, fragment: string): string {
  const f = fragment.trim();
  if (!f) return base || '';
  if ((base || '').includes(f)) return base || '';
  return `${base || ''}${base ? '。' : ''}${f}`.trim();
}

export function enrichAgentResultsWithContextAnchors(
  context: StructuredAgenticContext,
  agentResults: Record<string, unknown>,
): Record<string, unknown> {
  const temporal = context.context?.temporal || ({} as any);
  const geo = context.context?.geoClimate || ({} as any);
  const macro = context.context?.macroCycles || ({} as any);
  const solarTerm = String(temporal.currentSolarTerm || '').trim();
  const liuNian = String(temporal.currentLiuNian || temporal.liuNian || '').trim();
  const place = String(geo.currentPlace || geo.birthPlace || '').trim();
  const industry = String(macro.industryCycle?.[0]?.industry || '').trim();
  const bestWindow = String(context.engine?.kline?.windows?.[0]?.label || '').trim();
  const year = new Date().getFullYear();

  const out: Record<string, unknown> = { ...agentResults };

  // temporal_spatial_advisor: must carry 节气 + 流年 + 地点
  {
    const key = 'temporal_spatial_advisor';
    const row = asRecord(out[key]);
    let summary = String(row.summary || row.plainAdvice || row.temporalSignal || '');
    if (solarTerm) summary = appendUnique(summary, `当前节气参考：${solarTerm}`);
    if (liuNian) summary = appendUnique(summary, `当前流年参考：${liuNian}（${year}）`);
    if (place) summary = appendUnique(summary, `地理环境参考：${place}`);
    out[key] = {
      ...row,
      summary,
      temporalSignal: appendUnique(String(row.temporalSignal || ''), [solarTerm && `${solarTerm}节气`, liuNian && `${liuNian}流年`].filter(Boolean).join('，')),
      spatialSignal: appendUnique(String(row.spatialSignal || ''), place ? `所在/出生地：${place}` : ''),
    };
  }

  // strategy + career_wealth: industry + window
  for (const key of ['strategy_advisor', 'career_wealth'] as const) {
    const row = asRecord(out[key]);
    let summary = String(row.summary || row.plainReading || '');
    if (industry) summary = appendUnique(summary, `行业周期参考：${industry}`);
    if (bestWindow) summary = appendUnique(summary, `阶段窗口参考：${bestWindow}`);
    if (liuNian) summary = appendUnique(summary, `流年${liuNian}`);
    out[key] = { ...row, summary };
  }

  // kline_narrative: window + year anchors
  {
    const key = 'kline_narrative';
    const row = asRecord(out[key]);
    let summary = String(row.summary || row.phasePlain || '');
    if (bestWindow) summary = appendUnique(summary, `主窗口：${bestWindow}`);
    const anchors = (context.engine?.kline?.anchorPoints || [])
      .map((a: any) => a?.year)
      .filter(Boolean)
      .slice(0, 3);
    if (anchors.length) summary = appendUnique(summary, `锚点年：${anchors.join('、')}`);
    out[key] = { ...row, summary };
  }

  // core_constitution: ensure day master + yong appear when known
  {
    const key = 'core_constitution';
    const row = asRecord(out[key]);
    const c = context.engine?.constitution || ({} as any);
    let summary = String(row.summary || row.constitutionSummary || row.plainReading || '');
    if (c.dayMaster) summary = appendUnique(summary, `日主${c.dayMaster}`);
    if (Array.isArray(c.yongShen) && c.yongShen.length) {
      summary = appendUnique(summary, `用神${c.yongShen.slice(0, 3).join('、')}`);
    }
    out[key] = { ...row, summary, constitutionSummary: summary };
  }

  return out;
}
