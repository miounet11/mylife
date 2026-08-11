/**
 * 人生 K 线 · 大运色带
 * 把 dayun 列表压成图表可画的区间（公历年），并按用忌质量着色。
 */

export type KlineDayunBand = {
  /** 大运干支 */
  ganZhi: string;
  startYear: number;
  endYear: number;
  startAge?: number;
  endAge?: number;
  quality?: string;
  yongShenMatch?: string;
  isCurrent?: boolean;
  description?: string;
  /** 填充色（rgba） */
  fill: string;
  /** 图例短标 */
  label: string;
};

const QUALITY_FILL: Record<string, string> = {
  excellent: 'rgba(47, 125, 82, 0.10)',
  good: 'rgba(37, 99, 235, 0.08)',
  neutral: 'rgba(100, 116, 139, 0.06)',
  bad: 'rgba(217, 119, 6, 0.09)',
  poor: 'rgba(220, 38, 38, 0.08)',
};

function fillForQuality(quality?: string): string {
  const q = `${quality || 'neutral'}`.toLowerCase();
  return QUALITY_FILL[q] || QUALITY_FILL.neutral!;
}

type LooseDayun = {
  ganZhi?: string;
  gan?: string;
  zhi?: string;
  startYear?: number;
  endYear?: number;
  startAge?: number;
  endAge?: number;
  quality?: string;
  yongShenMatch?: string;
  isCurrent?: boolean;
  description?: string;
};

/**
 * 从 fortune.dayun / DayunResult 提取色带。
 * 兼容 dayuns / dayunList 字段名。
 */
export function buildDayunBandsFromResult(
  dayun: unknown,
  opts?: { chartMinYear?: number; chartMaxYear?: number },
): KlineDayunBand[] {
  if (!dayun || typeof dayun !== 'object') return [];
  const root = dayun as Record<string, unknown>;
  const list = (Array.isArray(root.dayuns)
    ? root.dayuns
    : Array.isArray(root.dayunList)
      ? root.dayunList
      : Array.isArray(dayun)
        ? dayun
        : []) as LooseDayun[];

  const minY = opts?.chartMinYear;
  const maxY = opts?.chartMaxYear;

  const bands: KlineDayunBand[] = [];
  for (const d of list) {
    const startYear = Number(d.startYear);
    const endYear = Number(d.endYear);
    if (!Number.isFinite(startYear) || !Number.isFinite(endYear) || endYear < startYear) {
      continue;
    }
    // Clip to visible chart window when provided
    let s = startYear;
    let e = endYear;
    if (typeof minY === 'number') s = Math.max(s, minY);
    if (typeof maxY === 'number') e = Math.min(e, maxY);
    if (e < s) continue;

    const ganZhi =
      `${d.ganZhi || ''}`.trim() ||
      `${d.gan || ''}${d.zhi || ''}`.trim() ||
      '大运';
    bands.push({
      ganZhi,
      startYear: s,
      endYear: e,
      startAge: Number.isFinite(Number(d.startAge)) ? Number(d.startAge) : undefined,
      endAge: Number.isFinite(Number(d.endAge)) ? Number(d.endAge) : undefined,
      quality: d.quality,
      yongShenMatch: d.yongShenMatch,
      isCurrent: Boolean(d.isCurrent),
      description: typeof d.description === 'string' ? d.description : undefined,
      fill: fillForQuality(d.quality),
      label: ganZhi,
    });
  }

  // Prefer fewer labels: keep at most 12
  return bands.slice(0, 12);
}

export function qualityLabelZh(quality?: string): string {
  switch (`${quality || ''}`.toLowerCase()) {
    case 'excellent':
      return '上佳';
    case 'good':
      return '较好';
    case 'bad':
      return '偏逆';
    case 'poor':
      return '承压';
    default:
      return '中平';
  }
}
