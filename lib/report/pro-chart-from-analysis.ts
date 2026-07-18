/**
 * Soft mapper: FortuneAnalysisResult / EngineGroundTruth / loose engine shapes
 * → ProBaziChartPanel props. Optional chaining only — never throws on stubs.
 */

import type { ProBaziChartPanelProps, ProBaziPillar } from '@/components/report/pro-bazi-chart-panel';

const PILLAR_LABELS = ['年柱', '月柱', '日柱', '时柱'] as const;

const ELEMENT_CN: Record<string, string> = {
  wood: '木',
  fire: '火',
  earth: '土',
  metal: '金',
  water: '水',
  木: '木',
  火: '火',
  土: '土',
  金: '金',
  水: '水',
};

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
}

function asString(v: unknown): string | undefined {
  if (typeof v === 'string' && v.trim()) return v.trim();
  if (typeof v === 'number' && Number.isFinite(v)) return String(v);
  return undefined;
}

function asStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.map((x) => asString(x)).filter((x): x is string => Boolean(x));
}

function toElementLabel(v: string): string {
  return ELEMENT_CN[v.toLowerCase?.() ? v.toLowerCase() : v] || ELEMENT_CN[v] || v;
}

function ganZhiFromPillar(p: Record<string, unknown> | null | undefined): string {
  if (!p) return '';
  const direct =
    asString(p.ganZhi) ||
    asString(p.ganzhi) ||
    asString(p.bazi) ||
    asString(p.pillar);
  if (direct && direct.length >= 2) return direct.slice(0, 2);

  const gan =
    asString(p.celestialStem) ||
    asString(p.stem) ||
    asString(p.gan) ||
    asString(p.tianGan);
  const zhi =
    asString(p.earthlyBranch) ||
    asString(p.branch) ||
    asString(p.zhi) ||
    asString(p.diZhi);
  if (gan && zhi) return `${gan}${zhi}`;
  if (typeof p === 'string') return String(p).slice(0, 2);
  return '';
}

function mapPillarsFromArray(raw: unknown[]): ProBaziPillar[] {
  return PILLAR_LABELS.map((label, i) => {
    const item = raw[i];
    if (typeof item === 'string') {
      return { label, ganZhi: item.slice(0, 2) || '—' };
    }
    const p = asRecord(item);
    const ganZhi = ganZhiFromPillar(p) || '—';
    const stemGod =
      asString(p?.stemGod) ||
      asString(p?.stemShiShen) ||
      asString(p?.tianGanShiShen) ||
      asString(p?.shiShen) ||
      asString(p?.tenGod);
    const branchGods =
      asStringArray(p?.branchGods).length
        ? asStringArray(p?.branchGods)
        : asStringArray(p?.branchShiShen).length
          ? asStringArray(p?.branchShiShen)
          : asStringArray(p?.hiddenShiShen).length
            ? asStringArray(p?.hiddenShiShen)
            : asString(p?.branchShiShen)
              ? [asString(p?.branchShiShen)!]
              : [];
    return {
      label: asString(p?.label) || asString(p?.pillar) || label,
      ganZhi,
      stemGod: stemGod || undefined,
      branchGods: branchGods.length ? branchGods : undefined,
    };
  });
}

/** Merge 十神 table (EngineGroundTruth.tenGodsTable) onto pillars by index / label. */
function mergeTenGodsTable(
  pillars: ProBaziPillar[],
  table: unknown,
): ProBaziPillar[] {
  if (!Array.isArray(table) || !table.length) return pillars;
  return pillars.map((p, i) => {
    const row =
      table.find((t) => {
        const r = asRecord(t);
        const name = asString(r?.pillar) || asString(r?.label) || '';
        return name && (name === p.label || name.includes(p.label.replace('柱', '')) || p.label.includes(name));
      }) || table[i];
    const r = asRecord(row);
    if (!r) return p;
    const stemGod =
      p.stemGod ||
      asString(r.stemShiShen) ||
      asString(r.tianGanShiShen) ||
      asString(r.shiShen);
    const branchGods =
      p.branchGods?.length
        ? p.branchGods
        : asStringArray(r.hiddenShiShen).length
          ? asStringArray(r.hiddenShiShen)
          : asStringArray(r.branchShiShen).length
            ? asStringArray(r.branchShiShen)
            : asString(r.branchShiShen)
              ? [asString(r.branchShiShen)!]
              : undefined;
    return {
      ...p,
      stemGod: stemGod || p.stemGod,
      branchGods: branchGods || p.branchGods,
    };
  });
}

function formatDaYunWindow(w: Record<string, unknown> | null | undefined): string | undefined {
  if (!w) return undefined;
  const gz = asString(w.ganZhi) || asString(w.dayun) || asString(w.name);
  const start = w.startAge ?? w.startYear;
  const end = w.endAge ?? w.endYear;
  const agePart =
    start != null && end != null ? `${start}–${end}岁` : start != null ? `${start}岁起` : '';
  if (gz && agePart) return `${gz} · ${agePart}`;
  if (gz) return gz;
  return asString(w.label) || asString(w.description);
}

/**
 * Map any common analysis / engine blob to panel props.
 * Accepts EngineGroundTruth, FortuneAnalysisResult, or nested `{ engine }` / `{ basic }`.
 */
export function proChartFromAnalysis(source: unknown): ProBaziChartPanelProps {
  if (!source) return {};

  const root = asRecord(source) || {};
  // Unwrap common nestings
  const engine =
    asRecord(root.engine) ||
    asRecord(asRecord(root.context)?.engine) ||
    (root.constitution || root.pillars || root.basic ? root : null) ||
    root;

  const eng = asRecord(engine) || root;
  const constitution = asRecord(eng.constitution) || asRecord(eng.yongShen) || {};
  const basic = asRecord(eng.basic) || asRecord(root.basic) || {};
  const fortune = asRecord(eng.fortune) || asRecord(root.fortune) || {};
  const pattern = asRecord(eng.pattern) || asRecord(root.pattern) || {};
  const dayun = asRecord(eng.dayun) || asRecord(eng.daYun) || asRecord(root.dayun) || {};

  // Pillars: engine.pillars | basic.pillars | pillars | bazi array
  let pillarsRaw: unknown =
    eng.pillars ?? basic.pillars ?? root.pillars ?? asRecord(eng.bazi)?.pillars;

  // FortuneAnalysisResult pillars are Pillar objects without labels
  let pillars: ProBaziPillar[] = [];
  if (Array.isArray(pillarsRaw) && pillarsRaw.length) {
    pillars = mapPillarsFromArray(pillarsRaw);
  } else if (typeof pillarsRaw === 'string') {
    // "甲子 乙丑 丙寅 丁卯" or "甲子乙丑丙寅丁卯"
    const parts = pillarsRaw.includes(' ')
      ? pillarsRaw.split(/\s+/).filter(Boolean)
      : pillarsRaw.match(/.{2}/g) || [];
    pillars = mapPillarsFromArray(parts);
  }

  // 十神 table enrichment
  pillars = mergeTenGodsTable(
    pillars,
    eng.tenGodsTable ?? root.tenGodsTable ?? asRecord(eng.shiShenAnalysis)?.pillarsAnalysis,
  );

  // Also try shiShenAnalysis.pillarsAnalysis as primary if pillars empty
  if (!pillars.some((p) => p.ganZhi && p.ganZhi !== '—')) {
    const pa =
      asRecord(eng.shiShenAnalysis)?.pillarsAnalysis ??
      asRecord(root.shiShenAnalysis)?.pillarsAnalysis ??
      asRecord(eng.analysis)?.pillarsAnalysis;
    if (Array.isArray(pa) && pa.length) {
      pillars = mapPillarsFromArray(pa);
    }
  }

  const dayMaster =
    asString(constitution.dayMaster) ||
    asString(basic.dayMaster) ||
    asString(eng.dayMaster) ||
    asString(root.dayMaster);

  const yongRaw =
    asStringArray(constitution.yongShen).length
      ? asStringArray(constitution.yongShen)
      : asStringArray(asRecord(eng.yongShen)?.yongShen).length
        ? asStringArray(asRecord(eng.yongShen)?.yongShen)
        : asStringArray(eng.yongShen).length
          ? asStringArray(eng.yongShen)
          : asStringArray(asRecord(eng.advice)?.yongShen).length
            ? asStringArray(asRecord(eng.advice)?.yongShen)
            : asStringArray(root.yongShen);

  const yongShen = yongRaw.map(toElementLabel);

  const patternType =
    asString(constitution.patternType) ||
    asString(pattern.type) ||
    asString(asRecord(constitution.pattern)?.pattern) ||
    asString(eng.patternType);

  // Current 大运
  const currentWin =
    asRecord(dayun.currentDayun) ||
    (Array.isArray(dayun.windows)
      ? asRecord(dayun.windows.find((w) => asRecord(w)?.isCurrent))
      : null);

  const currentDaYun =
    formatDaYunWindow(currentWin) ||
    asString(fortune.currentDaYun) ||
    asString(dayun.direction) ||
    asString(eng.currentDaYun);

  // Next window: first non-current dayun window, or fortune.nextYear
  let nextWindow: string | undefined;
  if (Array.isArray(dayun.windows)) {
    const next = dayun.windows.find((w) => {
      const r = asRecord(w);
      return r && !r.isCurrent;
    });
    // Prefer the window after current
    const curIdx = dayun.windows.findIndex((w) => asRecord(w)?.isCurrent);
    const after =
      curIdx >= 0 && curIdx < dayun.windows.length - 1
        ? asRecord(dayun.windows[curIdx + 1])
        : asRecord(next);
    nextWindow = formatDaYunWindow(after);
  }
  if (!nextWindow) {
    nextWindow =
      asString(fortune.nextYear) ||
      asString(eng.nextWindow) ||
      asString(root.nextWindow);
  }

  return {
    pillars: pillars.length ? pillars : undefined,
    dayMaster,
    yongShen: yongShen.length ? yongShen : undefined,
    patternType,
    currentDaYun,
    nextWindow,
  };
}

/** Convenience: map EngineGroundTruth-shaped object (typed path). */
export function proChartFromEngine(engine: {
  constitution?: {
    dayMaster?: string;
    patternType?: string;
    yongShen?: string[];
  };
  pillars?: Array<{
    label?: string;
    ganZhi?: string;
    celestialStem?: string;
    earthlyBranch?: string;
  }>;
  tenGodsTable?: Array<{
    pillar?: string;
    stemShiShen?: string;
    branchShiShen?: string;
    hiddenShiShen?: string[];
  }>;
  dayun?: {
    windows?: Array<{
      ganZhi?: string;
      startAge?: number;
      endAge?: number;
      isCurrent?: boolean;
    }>;
    currentDayun?: {
      ganZhi?: string;
      startAge?: number;
      endAge?: number;
    } | null;
    direction?: string;
  };
}): ProBaziChartPanelProps {
  return proChartFromAnalysis(engine);
}
