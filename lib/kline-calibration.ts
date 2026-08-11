/**
 * 人生 K 线 · 校准标记
 * 把用户确认/否认的过往节点映射到年份，供图表标注与文案提示。
 * 不改写引擎分数，只做「可验证」的视觉与说明层。
 */

export type KlineCalibrationMarker = {
  year: number;
  kind: 'confirmed' | 'denied';
  title: string;
  /** optional short note */
  note?: string;
};

function yearFromDateString(value?: string | null): number | null {
  if (!value) return null;
  const m = String(value).match(/(19|20)\d{2}/);
  if (!m) return null;
  const y = Number(m[0]);
  return y >= 1900 && y <= 2100 ? y : null;
}

/**
 * Build markers from report-linked events (user confirmed/denied past nodes).
 */
export function buildKlineCalibrationMarkers(params: {
  events?: Array<{
    title?: string;
    date?: string;
    userFeedback?: { wasAccurate?: boolean; userNotes?: string };
    fortuneAnalysis?: {
      templateKind?: string;
      occurrenceWindow?: string;
      title?: string;
      reportId?: string;
    };
  }> | null;
  /** Optional past templates for year hints when event date is soft */
  pastTemplates?: Array<{
    title?: string;
    occurrenceWindow?: string;
    key?: string;
  }> | null;
}): KlineCalibrationMarker[] {
  const out: KlineCalibrationMarker[] = [];
  const seen = new Set<string>();

  for (const ev of params.events || []) {
    const fb = ev.userFeedback;
    if (!fb || typeof fb.wasAccurate !== 'boolean') continue;
    const analysis = ev.fortuneAnalysis || {};
    // Prefer past_event calibrations; still accept generic linked feedback with a year
    const year =
      yearFromDateString(ev.date) ||
      yearFromDateString(analysis.occurrenceWindow) ||
      yearFromDateString(ev.title);
    if (!year) continue;
    const kind: KlineCalibrationMarker['kind'] = fb.wasAccurate
      ? 'confirmed'
      : 'denied';
    const title = (ev.title || analysis.title || '校准节点').slice(0, 40);
    const key = `${kind}:${year}:${title}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({
      year,
      kind,
      title,
      note: kind === 'confirmed' ? '用户确认发生' : '用户标记未发生',
    });
  }

  // Cap for chart clutter
  return out
    .sort((a, b) => a.year - b.year)
    .slice(0, 12);
}

export function calibrationSummaryLine(
  markers: KlineCalibrationMarker[],
): string | null {
  if (!markers.length) return null;
  const conf = markers.filter((m) => m.kind === 'confirmed').length;
  const den = markers.filter((m) => m.kind === 'denied').length;
  const bits: string[] = [];
  if (conf) bits.push(`确认 ${conf} 个节点`);
  if (den) bits.push(`未发生 ${den} 个`);
  return `已校准：${bits.join(' · ')}（曲线分数未改写，仅作对照标注）`;
}
