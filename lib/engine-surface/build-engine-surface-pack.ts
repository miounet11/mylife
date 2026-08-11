/**
 * Normalize report / tool / birth-structured data → EngineSurfacePack.
 */

import {
  ENGINE_MODULE_META,
  type EngineModuleId,
  type EngineSurfaceDayunRow,
  type EngineSurfacePack,
  type EngineSurfacePillar,
} from '@/lib/engine-surface/types';
import { extractChartIdentityFromAnalysis } from '@/lib/calculation-identity';
import { buildDayunBandsFromResult } from '@/lib/kline-dayun-bands';
import { buildPersonalKlineHighlight } from '@/lib/kline-showcase';
import { qualityLabelZh } from '@/lib/kline-dayun-bands';

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

function asStringList(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value
      .map((v) => {
        if (typeof v === 'string') return v;
        if (v && typeof v === 'object' && 'name' in (v as object)) {
          return String((v as { name?: string }).name || '');
        }
        return String(v || '');
      })
      .map((s) => s.trim())
      .filter(Boolean);
  }
  if (typeof value === 'string') {
    return value
      .split(/[,，、\s]+/)
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

function pillarFromLoose(
  pillars: unknown,
  labels = ['年柱', '月柱', '日柱', '时柱'],
): EngineSurfacePillar[] {
  if (!Array.isArray(pillars)) return [];
  return pillars.slice(0, 4).map((p, i) => {
    const row = (p || {}) as Record<string, unknown>;
    const gan =
      String(row.celestialStem || row.gan || row.stem || '').trim() ||
      (typeof row.ganZhi === 'string' ? row.ganZhi[0] : '') ||
      '';
    const zhi =
      String(row.earthlyBranch || row.zhi || row.branch || '').trim() ||
      (typeof row.ganZhi === 'string' ? row.ganZhi[1] : '') ||
      '';
    const ganZhi =
      String(row.ganZhi || '').trim() ||
      `${gan}${zhi}` ||
      '—';
    return {
      label: String(row.label || labels[i] || `柱${i + 1}`),
      ganZhi,
      gan: gan || undefined,
      zhi: zhi || undefined,
    };
  });
}

function dayunRows(dayun: unknown): EngineSurfaceDayunRow[] {
  // Normalize common aliases so bands builder sees dayuns/dayunList/array
  let normalized: unknown = dayun;
  if (dayun && typeof dayun === 'object' && !Array.isArray(dayun)) {
    const root = dayun as Record<string, unknown>;
    if (!Array.isArray(root.dayuns) && !Array.isArray(root.dayunList)) {
      if (Array.isArray(root.list)) {
        normalized = { dayuns: root.list };
      } else if (Array.isArray(root.rows)) {
        normalized = { dayuns: root.rows };
      } else if (Array.isArray(root.dayun)) {
        normalized = { dayuns: root.dayun };
      }
    }
  }
  const bands = buildDayunBandsFromResult(normalized);
  return bands.map((b) => {
    const rawQ = b.quality || '';
    const quality = /^(excellent|good|neutral|bad|poor)$/i.test(rawQ)
      ? qualityLabelZh(rawQ)
      : rawQ || undefined;
    return {
      ganZhi: b.ganZhi,
      startYear: b.startYear,
      endYear: b.endYear,
      startAge: b.startAge,
      endAge: b.endAge,
      quality,
      yongShenMatch: b.yongShenMatch,
      isCurrent: b.isCurrent,
      description: b.description,
    };
  });
}

function elementsFromFive(five: unknown): EngineSurfacePack['elements'] {
  if (!five || typeof five !== 'object') return [];
  const entries = Object.entries(five as Record<string, unknown>);
  return entries
    .map(([key, val]) => {
      const v = val as { strength?: number; quality?: string; description?: string } | number;
      const strength =
        typeof v === 'number'
          ? v
          : typeof v?.strength === 'number'
            ? v.strength
            : undefined;
      return {
        key,
        label: ELEMENT_CN[key] || key,
        strength,
        note:
          typeof v === 'object' && v
            ? String(v.quality || v.description || '').slice(0, 48) || undefined
            : undefined,
      };
    })
    .filter((e) => e.label)
    .sort((a, b) => (b.strength || 0) - (a.strength || 0));
}

function tenGodsFromLoose(ten: unknown): EngineSurfacePack['tenGods'] {
  if (!ten || typeof ten !== 'object') return [];
  const t = ten as Record<string, unknown>;
  const out: EngineSurfacePack['tenGods'] = [];
  if (t.self) out.push({ label: '比劫/日主侧', value: String(t.self) });
  for (const key of ['output', 'input', 'control', 'controlled'] as const) {
    const list = asStringList(t[key]);
    if (list.length) {
      const labels: Record<string, string> = {
        output: '食伤',
        input: '印星',
        control: '官杀',
        controlled: '财星',
      };
      out.push({ label: labels[key] || key, value: list.join('、') });
    }
  }
  // flat map fallback
  if (!out.length) {
    for (const [k, v] of Object.entries(t)) {
      if (v == null || typeof v === 'object') continue;
      out.push({ label: k, value: String(v) });
    }
  }
  return out.slice(0, 8);
}

export type BuildEngineSurfaceInput = {
  source?: EngineSurfacePack['source'];
  reportId?: string | null;
  name?: string | null;
  gender?: string | null;
  birthDate?: string | null;
  birthTime?: string | null;
  birthPlace?: string | null;
  analysis?: unknown;
  bazi?: unknown;
  basic?: unknown;
  /** Direct pillars when already normalized (pro / expert views) */
  pillars?: EngineSurfacePillar[] | null;
  dayMaster?: string | null;
  pattern?: string | null;
  fiveElements?: unknown;
  tenGods?: unknown;
  shenSha?: unknown;
  advice?: { yongShen?: string[]; jiShen?: string[]; xiShen?: string[] } | null;
  yongShen?: unknown;
  dayun?: unknown;
  /** Pre-normalized dayun rows (skips band builder) */
  dayunRows?: EngineSurfaceDayunRow[] | null;
  klineData?: unknown;
  /** prebuilt pro month strip if available */
  monthStrip?: Array<{
    key?: string;
    label?: string;
    shortLabel?: string;
    monthLabel?: string;
    score?: number;
    score10?: number;
    status?: string;
    level?: string;
    theme?: string;
    isCurrent?: boolean;
  }> | null;
  risks?: string[] | null;
  /** Override identity when already extracted (expert desk) */
  identity?: EngineSurfacePack['identity'];
  modules?: EngineModuleId[];
};

function defaultModules(pack: Omit<EngineSurfacePack, 'modules' | 'version' | 'source' | 'tags' | 'almanac' | 'formulaLines'> & {
  almanac: EngineSurfacePack['almanac'];
  formulaLines: string[];
  tags: string[];
}): EngineModuleId[] {
  const ids: EngineModuleId[] = [];
  if (pack.identity) ids.push('identity');
  if (pack.pillars.length) ids.push('pillars');
  if (pack.yongShen.length || pack.jiShen.length) ids.push('yongji');
  if (pack.elements.length) ids.push('elements');
  if (pack.dayun.length) ids.push('dayun');
  if (pack.kline) ids.push('kline');
  if (pack.months.length) ids.push('months');
  ids.push('almanac');
  if (pack.tenGods.length) ids.push('tenGods');
  if (pack.shenSha.length) ids.push('shenSha');
  if (pack.risks.length) ids.push('risks');
  ids.push('formula');
  return ids;
}

function levelToStatus(level?: string, isCurrent?: boolean): string | undefined {
  if (isCurrent) return '当前';
  if (level === 'good') return '宜推';
  if (level === 'caution') return '宜守';
  if (level === 'ok') return '稳健';
  return undefined;
}

export function buildEngineSurfacePack(input: BuildEngineSurfaceInput): EngineSurfacePack {
  const basic = (input.basic || input.bazi || {}) as Record<string, unknown>;
  const pillars =
    input.pillars && input.pillars.length
      ? input.pillars
      : pillarFromLoose(basic.pillars);
  const dayMaster =
    input.dayMaster ||
    String(basic.dayMaster || pillars[2]?.gan || pillars[2]?.ganZhi?.[0] || '').trim() ||
    null;
  const patternLabel =
    input.pattern ||
    (basic as { pattern?: string }).pattern ||
    null;

  const extracted = extractChartIdentityFromAnalysis(
    input.analysis,
    input.birthTime || null,
  );
  const identity: EngineSurfacePack['identity'] =
    input.identity ||
    (extracted
      ? {
          clockBirthDate: input.birthDate || null,
          clockBirthTime: extracted.clockBirthTime,
          effectiveBirthTime: extracted.effectiveBirthTime,
          chartFingerprint: extracted.chartFingerprint,
          useSolarTime: extracted.useSolarTime,
          useSeparateZiHour: extracted.useSeparateZiHour,
          timeMismatch: extracted.timeMismatch,
          birthPlace: input.birthPlace || null,
        }
      : input.birthDate || input.birthTime
        ? {
            clockBirthDate: input.birthDate || null,
            clockBirthTime: input.birthTime || null,
            birthPlace: input.birthPlace || null,
          }
        : null);

  const advice = input.advice || {};
  const yongObj = input.yongShen as { yongShen?: string[]; jiShen?: string[]; xiShen?: string[] } | null;
  const yongShen = asStringList(advice.yongShen || yongObj?.yongShen);
  const jiShen = asStringList(advice.jiShen || yongObj?.jiShen);
  const xiShen = asStringList(advice.xiShen || yongObj?.xiShen);

  const shenShaRaw = input.shenSha;
  const shenSha = Array.isArray(shenShaRaw)
    ? shenShaRaw
        .map((s) => (typeof s === 'string' ? s : (s as { name?: string })?.name || ''))
        .filter(Boolean)
        .slice(0, 16)
    : asStringList(shenShaRaw).slice(0, 16);

  const birthYear = (() => {
    const m = String(input.birthDate || '').match(/^(\d{4})/);
    return m ? Number(m[1]) : undefined;
  })();

  const highlight = buildPersonalKlineHighlight(input.klineData as any, {
    birthYear,
  });

  const kline = highlight
    ? {
        sampleYears: highlight.sampleYears,
        spanLabel: highlight.spanLabel,
        currentScore: highlight.currentYearScore,
        peakYear: highlight.peak?.year ?? null,
        peakScore: highlight.peak?.score ?? null,
        troughYear: highlight.trough?.year ?? null,
        troughScore: highlight.trough?.score ?? null,
        stageHeadline: highlight.stageHeadline,
        href: input.reportId ? `#pro-kline` : '#kline-engine-desk',
      }
    : null;

  const months: EngineSurfacePack['months'] = Array.isArray(input.monthStrip)
    ? input.monthStrip.slice(0, 12).map((m, i) => {
        const score =
          typeof m.score === 'number'
            ? m.score
            : typeof m.score10 === 'number'
              ? Math.round(m.score10 * 10)
              : null;
        return {
          key: m.key || `m-${i}`,
          label: m.shortLabel || m.monthLabel || m.label || m.key || `月${i + 1}`,
          score,
          status: m.status || levelToStatus(m.level, m.isCurrent) || m.theme,
          href: undefined,
        };
      })
    : [];

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const yearNow = today.getFullYear();

  const risks = (input.risks || []).filter(Boolean).slice(0, 8);

  const formulaLines = [
    '结构层：四柱 / 用忌 / 大运 / 流年 · 确定性引擎',
    '人生K线：generateLifeKlineV6 · 原局+大运+流年加权 · 无 Math.sin',
    '月分：年分 + 流月干支×用忌（公历月近似）',
    '日运：万年历通书 × 日主用神结构（personal-day）',
    '叙事层：LLM 只解释，不改盘、不改指纹',
  ];

  const tags = [
    dayMaster ? `日主${dayMaster}` : '',
    patternLabel ? String(patternLabel).slice(0, 12) : '',
    yongShen.length ? `用${yongShen.slice(0, 2).join('')}` : '',
    kline ? `K线${kline.sampleYears}年` : '',
    identity?.clockBirthTime ? `锁定${identity.clockBirthTime}` : '',
  ].filter(Boolean);

  const dayun =
    input.dayunRows && input.dayunRows.length
      ? input.dayunRows
      : dayunRows(input.dayun);

  const base = {
    dayMaster,
    pattern: patternLabel,
    gender: input.gender || null,
    identity,
    pillars,
    yongShen,
    jiShen,
    xiShen,
    elements: elementsFromFive(input.fiveElements),
    dayun,
    kline,
    months,
    tenGods: tenGodsFromLoose(input.tenGods),
    shenSha,
    risks,
    formulaLines,
    almanac: {
      todayHref: `/almanac/${todayStr}`,
      yearHref: `/almanac/${yearNow}-01-01`,
      blurb: '通书宜忌 + 个人日运（与同一日主/用神）',
    },
    reportId: input.reportId || null,
    tags,
  };

  const modules =
    input.modules && input.modules.length
      ? input.modules
      : defaultModules(base as any);

  return {
    version: 'engine-surface-v1',
    source: input.source || 'unknown',
    modules: modules.filter((id) => ENGINE_MODULE_META[id]),
    ...base,
  };
}

/**
 * From mass-reading ProReportView + engine series.
 * Prefer view fields (already presented) and layer engine series on top.
 */
export function buildEngineSurfaceFromProView(params: {
  view: {
    dayMaster?: string;
    patternLabel?: string;
    pillars?: Array<{ label: string; ganZhi: string }>;
    elements?: { yongShen?: string[]; jiShen?: string[]; xiShen?: string[] };
    monthStrip?: BuildEngineSurfaceInput['monthStrip'];
    riskAlerts?: Array<{ when?: string; title?: string; reason?: string }>;
  };
  reportId?: string | null;
  klineData?: unknown;
  dayun?: unknown;
  birthDate?: string | null;
  birthTime?: string | null;
  birthPlace?: string | null;
  gender?: string | null;
  analysis?: unknown;
  fiveElements?: unknown;
  tenGods?: unknown;
  shenSha?: unknown;
}): EngineSurfacePack {
  const v = params.view;
  const risks = (v.riskAlerts || [])
    .map((r) => [r.when, r.title, r.reason].filter(Boolean).join(' · '))
    .filter(Boolean)
    .slice(0, 8);

  return buildEngineSurfacePack({
    source: 'report',
    reportId: params.reportId,
    dayMaster: v.dayMaster,
    pattern: v.patternLabel,
    pillars: (v.pillars || []).map((p) => ({
      label: p.label,
      ganZhi: p.ganZhi,
      gan: p.ganZhi?.[0],
      zhi: p.ganZhi?.[1],
    })),
    advice: {
      yongShen: v.elements?.yongShen,
      jiShen: v.elements?.jiShen,
      xiShen: v.elements?.xiShen,
    },
    monthStrip: v.monthStrip,
    risks,
    klineData: params.klineData,
    dayun: params.dayun,
    birthDate: params.birthDate,
    birthTime: params.birthTime,
    birthPlace: params.birthPlace,
    gender: params.gender,
    analysis: params.analysis,
    fiveElements: params.fiveElements,
    tenGods: params.tenGods,
    shenSha: params.shenSha,
  });
}

/**
 * From expert desk structured view — densest engine pack for professionals.
 */
export function buildEngineSurfaceFromExpertDesk(params: {
  desk: {
    dayMaster?: string;
    gender?: string;
    input?: {
      name?: string;
      birthDate?: string;
      birthTime?: string;
      birthPlace?: string;
      gender?: string;
    };
    chartIdentity?: {
      clockBirthTime?: string | null;
      effectiveBirthTime?: string | null;
      chartFingerprint?: string | null;
      useSolarTime?: boolean;
      useSeparateZiHour?: boolean;
      timeMismatch?: boolean;
    } | null;
    pillars?: Array<{ label: string; ganZhi: string; gan?: string; zhi?: string }>;
    fiveElements?: Array<{
      key: string;
      label: string;
      strength?: number;
      quality?: string;
      description?: string;
    }>;
    tenGods?: unknown;
    pattern?: { type?: string } | string | null;
    yongJi?: { yongShen?: string[]; xiShen?: string[]; jiShen?: string[] };
    dayun?: { rows?: Array<Record<string, unknown>> };
    shenSha?: string[];
    liuyue?: Array<{
      year?: number;
      month?: number;
      label?: string;
      ganZhi?: string;
    }>;
  };
  reportId?: string | null;
  klineData?: unknown;
}): EngineSurfacePack {
  const d = params.desk;
  const pattern =
    typeof d.pattern === 'string'
      ? d.pattern
      : d.pattern && typeof d.pattern === 'object'
        ? d.pattern.type || null
        : null;

  const fiveAsMap: Record<string, { strength?: number; quality?: string; description?: string }> = {};
  for (const e of d.fiveElements || []) {
    fiveAsMap[e.key || e.label] = {
      strength: e.strength,
      quality: e.quality,
      description: e.description,
    };
  }

  const dayunRowsNorm: EngineSurfaceDayunRow[] = (d.dayun?.rows || [])
    .map((r) => {
      const rawQ = r.quality != null ? String(r.quality) : '';
      const quality = /^(excellent|good|neutral|bad|poor)$/i.test(rawQ)
        ? qualityLabelZh(rawQ)
        : rawQ || undefined;
      return {
        ganZhi: String(r.ganZhi || ''),
        startYear: Number(r.startYear) || 0,
        endYear: Number(r.endYear) || 0,
        startAge: typeof r.startAge === 'number' ? r.startAge : undefined,
        endAge: typeof r.endAge === 'number' ? r.endAge : undefined,
        quality,
        yongShenMatch: r.yongShenMatch ? String(r.yongShenMatch) : undefined,
        isCurrent: Boolean(r.isCurrent),
        description: r.description ? String(r.description) : undefined,
      };
    })
    .filter((r) => r.ganZhi);

  const monthStrip = (d.liuyue || []).slice(0, 12).map((m, i) => ({
    key: m.label || `${m.year}-${m.month}` || `ly-${i}`,
    label: m.label || `${m.month}月`,
    monthLabel: m.ganZhi || m.label,
    status: m.ganZhi,
  }));

  const id = d.chartIdentity;
  return buildEngineSurfacePack({
    source: 'report',
    reportId: params.reportId,
    name: d.input?.name,
    gender: d.gender || d.input?.gender,
    birthDate: d.input?.birthDate,
    birthTime: d.input?.birthTime || id?.clockBirthTime || null,
    birthPlace: d.input?.birthPlace,
    dayMaster: d.dayMaster,
    pattern,
    pillars: (d.pillars || []).map((p) => ({
      label: p.label,
      ganZhi: p.ganZhi,
      gan: p.gan || p.ganZhi?.[0],
      zhi: p.zhi || p.ganZhi?.[1],
    })),
    fiveElements: fiveAsMap,
    tenGods: d.tenGods,
    shenSha: d.shenSha,
    advice: d.yongJi,
    dayunRows: dayunRowsNorm,
    monthStrip,
    klineData: params.klineData,
    identity: id
      ? {
          clockBirthDate: d.input?.birthDate || null,
          clockBirthTime: id.clockBirthTime,
          effectiveBirthTime: id.effectiveBirthTime,
          chartFingerprint: id.chartFingerprint,
          useSolarTime: id.useSolarTime,
          useSeparateZiHour: id.useSeparateZiHour,
          timeMismatch: id.timeMismatch,
          birthPlace: d.input?.birthPlace || null,
        }
      : null,
  });
}

/** Convenience: from typical fortune / analyze result blob */
export function buildEngineSurfaceFromFortuneLike(row: {
  id?: string;
  name?: string;
  gender?: string;
  birthDate?: string;
  birthTime?: string;
  birthPlace?: string;
  analysis?: unknown;
  bazi?: unknown;
  fiveElements?: unknown;
  tenGods?: unknown;
  shenSha?: unknown;
  pattern?: { type?: string } | string | null;
  advice?: { yongShen?: string[]; jiShen?: string[]; xiShen?: string[] } | null;
  dayun?: unknown;
  klineData?: unknown;
  fortune?: { currentDaYun?: string } | null;
}): EngineSurfacePack {
  const pattern =
    typeof row.pattern === 'string'
      ? row.pattern
      : row.pattern && typeof row.pattern === 'object'
        ? row.pattern.type || null
        : null;
  return buildEngineSurfacePack({
    source: 'report',
    reportId: row.id || null,
    name: row.name,
    gender: row.gender,
    birthDate: row.birthDate,
    birthTime: row.birthTime,
    birthPlace: row.birthPlace,
    analysis: row.analysis,
    bazi: row.bazi,
    basic: row.bazi,
    pattern,
    fiveElements: row.fiveElements,
    tenGods: row.tenGods,
    shenSha: row.shenSha,
    advice: row.advice,
    dayun: row.dayun,
    klineData: row.klineData,
  });
}
