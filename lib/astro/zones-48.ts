/**
 * 12 星座 × 4 区 = 48 星区
 * 每个星座按民用日期切成四段（约 7–8 日），交界区带 cusp 气质说明。
 */

import { SIGN_BY_KEY } from '@/lib/astro/signs-data';
import type { AstroZone48, SignKey, ZonePhase } from '@/lib/astro/types';

const SEASONAL_ORDER: SignKey[] = [
  'aries',
  'taurus',
  'gemini',
  'cancer',
  'leo',
  'virgo',
  'libra',
  'scorpio',
  'sagittarius',
  'capricorn',
  'aquarius',
  'pisces',
];

const PHASE_LABEL: Record<ZonePhase, { zh: string; en: string }> = {
  1: { zh: '一区', en: 'Zone I' },
  2: { zh: '二区', en: 'Zone II' },
  3: { zh: '三区', en: 'Zone III' },
  4: { zh: '四区', en: 'Zone IV' },
};

const PHASE_TRAITS: Record<ZonePhase, { traits: string[]; tip: string; flavor: string }> = {
  1: {
    flavor: '初段：带着上一星座余韵，启动感强但尚未定型',
    traits: ['对边界与开端敏感', '更容易试探多种路径', '能量偏「试探性推进」'],
    tip: '适合做小步实验与信息收集，少把第一印象写成终局。',
  },
  2: {
    flavor: '中前段：星座主气质逐渐稳定',
    traits: ['主星特质更清晰', '节奏开始可预期', '适合建立习惯与对外标签'],
    tip: '把优势做成可复用模板，避免只靠灵感。',
  },
  3: {
    flavor: '中后段：主气质最浓，也最容易极端',
    traits: ['优点与盲点都放大', '决策更「像自己」', '外界评价也更两极'],
    tip: '主动设护栏：清单、同伴复核、时间缓冲。',
  },
  4: {
    flavor: '末段：开始预感下一星座，转折与收束并行',
    traits: ['收尾与移交意识增强', '更容易焦虑「还没完成」', '与下一象限气质混响'],
    tip: '做交接与复盘，把未竟事项写成下一阶段输入。',
  },
};

function mdToNum(md: string): number {
  const [m, d] = md.split('-').map(Number);
  return m * 100 + d;
}

/** Expand a sign date range into list of MM-DD; handles Capricorn year wrap */
function expandRange(start: string, end: string): string[] {
  const daysInMonth = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  const out: string[] = [];
  let m = Number(start.slice(0, 2));
  let d = Number(start.slice(3, 5));
  const endN = mdToNum(end);
  const wraps = mdToNum(start) > endN;

  for (let i = 0; i < 40; i++) {
    const md = `${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    out.push(md);
    if (!wraps && mdToNum(md) === endN) break;
    if (wraps && out.length > 1 && mdToNum(md) === endN) break;
    d += 1;
    if (d > daysInMonth[m]) {
      d = 1;
      m += 1;
      if (m > 12) m = 1;
    }
  }
  return out;
}

function previousSign(key: SignKey): SignKey {
  const i = SEASONAL_ORDER.indexOf(key);
  return SEASONAL_ORDER[(i + 11) % 12];
}

function nextSign(key: SignKey): SignKey {
  const i = SEASONAL_ORDER.indexOf(key);
  return SEASONAL_ORDER[(i + 1) % 12];
}

function buildZones(): AstroZone48[] {
  const zones: AstroZone48[] = [];
  let index = 0;

  for (const key of SEASONAL_ORDER) {
    const sign = SIGN_BY_KEY[key];
    const days = expandRange(sign.start, sign.end);
    const n = days.length || 1;
    const chunk = Math.max(1, Math.floor(n / 4));
    for (let p = 1; p <= 4; p++) {
      const phase = p as ZonePhase;
      const startIdx = (p - 1) * chunk;
      const endIdx = p === 4 ? n - 1 : Math.min(n - 1, p * chunk - 1);
      const start = days[startIdx] || sign.start;
      const end = days[endIdx] || sign.end;
      index += 1;
      const phaseMeta = PHASE_TRAITS[phase];
      const label = PHASE_LABEL[phase];
      let cuspWith: SignKey | null = null;
      if (phase === 1) cuspWith = previousSign(key);
      if (phase === 4) cuspWith = nextSign(key);

      const cuspText = cuspWith
        ? phase === 1
          ? `与${SIGN_BY_KEY[cuspWith].zh}交界气质：仍带${SIGN_BY_KEY[cuspWith].keywords[0]}余波。`
          : `与${SIGN_BY_KEY[cuspWith].zh}交界气质：开始渗入${SIGN_BY_KEY[cuspWith].keywords[0]}。`
        : '';

      zones.push({
        id: `${key}-z${phase}`,
        index,
        signKey: key,
        phase,
        title: `${sign.zh}·${label.zh}`,
        titleEn: `${sign.en} ${label.en}`,
        start,
        end,
        cuspWith,
        summary: `${sign.zh}${label.zh}（约 ${start} 至 ${end}）。${phaseMeta.flavor}。${cuspText}${sign.summary.slice(0, 48)}…`,
        traits: [
          ...phaseMeta.traits,
          `主气质：${sign.keywords.slice(0, 3).join('、')}`,
          `元素·模式：${sign.element}象 · ${sign.modality}`,
        ],
        actionTip: `${phaseMeta.tip} 结合${sign.zh}主轴：${sign.strengths[0]}；警惕${sign.watchouts[0]}。`,
      });
    }
  }
  return zones;
}

export const ASTRO_ZONES_48: AstroZone48[] = buildZones();

export function getZoneById(id: string | null | undefined): AstroZone48 | null {
  if (!id) return null;
  return ASTRO_ZONES_48.find((z) => z.id === id) || null;
}

export function getZonesBySign(signKey: SignKey): AstroZone48[] {
  return ASTRO_ZONES_48.filter((z) => z.signKey === signKey);
}

/** Resolve 48-zone from civil birth date YYYY-MM-DD or MM-DD */
export function resolveZoneFromDate(date: string | null | undefined): AstroZone48 | null {
  if (!date) return null;
  const m = date.match(/(?:^\d{4}-)?(\d{2})-(\d{2})/);
  if (!m) return null;
  const md = `${m[1]}-${m[2]}`;
  const n = mdToNum(md);
  for (const z of ASTRO_ZONES_48) {
    const a = mdToNum(z.start);
    const b = mdToNum(z.end);
    // Capricorn zone segments can wrap only if start>end (rare for sub-zones)
    if (a <= b) {
      if (n >= a && n <= b) return z;
    } else if (n >= a || n <= b) {
      return z;
    }
  }
  return null;
}
