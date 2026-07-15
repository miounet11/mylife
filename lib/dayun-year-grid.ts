/**
 * 大运 × 逐年速查网格
 * 对现行（及可选下一步）大运内每一年：年柱、长生、空亡、与大运关系、用忌提示
 */

import { getYearGanZhi, getChangSheng, getKongWangByDayPillar, isZhiKongWang } from '@/lib/bazi-pro-tools';

export interface DayunYearCell {
  year: number;
  ganZhi: string;
  changSheng: string;
  isKongWang: boolean;
  vsDayun: string;
  tone: 'boost' | 'ok' | 'caution';
  note: string;
  isCurrentYear?: boolean;
}

export interface DayunYearBlock {
  dayunGanZhi: string;
  startYear: number;
  endYear: number;
  quality?: string;
  yongShenMatch?: string;
  isCurrent: boolean;
  years: DayunYearCell[];
}

const EL_MAP: Record<string, string> = {
  甲: '木',
  乙: '木',
  丙: '火',
  丁: '火',
  戊: '土',
  己: '土',
  庚: '金',
  辛: '金',
  壬: '水',
  癸: '水',
};

function vsDayunLabel(dayunGz: string, yearGz: string): string {
  if (!dayunGz || dayunGz.length < 2) return '—';
  if (dayunGz === yearGz) return '岁运并临';
  if (dayunGz[0] === yearGz[0]) return '天干同气';
  if (dayunGz[1] === yearGz[1]) return '地支伏吟';
  return '岁运异气';
}

function toneForYear(params: {
  vs: string;
  isKongWang: boolean;
  ganEl: string;
  yongShen: string[];
  jiShen: string[];
}): DayunYearCell['tone'] {
  if (params.vs === '岁运并临') return 'boost';
  if (params.isKongWang) return 'caution';
  if (params.ganEl && params.jiShen.includes(params.ganEl)) return 'caution';
  if (params.ganEl && params.yongShen.includes(params.ganEl)) return 'boost';
  return 'ok';
}

export function buildDayunYearGrid(params: {
  dayunRows: Array<{
    ganZhi: string;
    startYear: number;
    endYear: number;
    quality?: string;
    yongShenMatch?: string;
    isCurrent?: boolean;
  }>;
  dayMaster: string;
  dayPillarGanZhi: string;
  yongShen?: string[];
  jiShen?: string[];
  /** 展示现行 + 后续 N 步大运 */
  steps?: number;
  referenceYear?: number;
}): DayunYearBlock[] {
  const steps = params.steps ?? 2;
  const refYear = params.referenceYear ?? new Date().getFullYear();
  const yong = params.yongShen || [];
  const ji = params.jiShen || [];
  const kongWang = getKongWangByDayPillar(params.dayPillarGanZhi || '');

  const rows = [...params.dayunRows].filter((r) => r.startYear && r.endYear && r.ganZhi);
  if (!rows.length) return [];

  const currentIdx = rows.findIndex((r) => r.isCurrent);
  const startIdx = currentIdx >= 0 ? currentIdx : 0;
  const slice = rows.slice(startIdx, startIdx + steps);

  return slice.map((row) => {
    const years: DayunYearCell[] = [];
    const from = Math.min(row.startYear, row.endYear);
    const to = Math.max(row.startYear, row.endYear);
    for (let y = from; y <= to; y++) {
      const gz = getYearGanZhi(y);
      const gan = gz[0]!;
      const zhi = gz[1]!;
      const changSheng = getChangSheng(params.dayMaster, zhi);
      const isKong = isZhiKongWang(zhi, kongWang);
      const vs = vsDayunLabel(row.ganZhi, gz);
      const ganEl = EL_MAP[gan] || '';
      const tone = toneForYear({
        vs,
        isKongWang: isKong,
        ganEl,
        yongShen: yong,
        jiShen: ji,
      });
      const bits: string[] = [];
      if (vs === '岁运并临') bits.push('力量叠加强');
      if (isKong) bits.push('流年支空');
      if (ganEl && yong.includes(ganEl)) bits.push(`用神${ganEl}`);
      if (ganEl && ji.includes(ganEl)) bits.push(`忌神${ganEl}`);
      if (changSheng) bits.push(changSheng);

      years.push({
        year: y,
        ganZhi: gz,
        changSheng,
        isKongWang: isKong,
        vsDayun: vs,
        tone,
        note: bits.slice(0, 3).join(' · ') || '—',
        isCurrentYear: y === refYear,
      });
    }

    return {
      dayunGanZhi: row.ganZhi,
      startYear: from,
      endYear: to,
      quality: row.quality,
      yongShenMatch: row.yongShenMatch,
      isCurrent: !!row.isCurrent,
      years,
    };
  });
}
