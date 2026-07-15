/**
 * 专业点盘工具：十二长生、空亡、流年干支
 * 经典表推演，供 expert 排盘台使用。
 */

export const TIAN_GAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'] as const;
export const DI_ZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'] as const;

export const CHANG_SHENG_NAMES = [
  '长生',
  '沐浴',
  '冠带',
  '临官',
  '帝旺',
  '衰',
  '病',
  '死',
  '墓',
  '绝',
  '胎',
  '养',
] as const;

/** 阳干顺排、阴干逆排的「长生」起点地支 */
const CHANG_SHENG_START: Record<string, string> = {
  甲: '亥',
  乙: '午',
  丙: '寅',
  丁: '酉',
  戊: '寅',
  己: '酉',
  庚: '巳',
  辛: '子',
  壬: '申',
  癸: '卯',
};

const YANG_GAN = new Set(['甲', '丙', '戊', '庚', '壬']);

/** 日柱空亡：六甲旬空亡地支 */
const KONG_WANG_BY_XUN: Array<{ heads: string[]; voidZhi: [string, string] }> = [
  { heads: ['甲子', '乙丑', '丙寅', '丁卯', '戊辰', '己巳', '庚午', '辛未', '壬申', '癸酉'], voidZhi: ['戌', '亥'] },
  { heads: ['甲戌', '乙亥', '丙子', '丁丑', '戊寅', '己卯', '庚辰', '辛巳', '壬午', '癸未'], voidZhi: ['申', '酉'] },
  { heads: ['甲申', '乙酉', '丙戌', '丁亥', '戊子', '己丑', '庚寅', '辛卯', '壬辰', '癸巳'], voidZhi: ['午', '未'] },
  { heads: ['甲午', '乙未', '丙申', '丁酉', '戊戌', '己亥', '庚子', '辛丑', '壬寅', '癸卯'], voidZhi: ['辰', '巳'] },
  { heads: ['甲辰', '乙巳', '丙午', '丁未', '戊申', '己酉', '庚戌', '辛亥', '壬子', '癸丑'], voidZhi: ['寅', '卯'] },
  { heads: ['甲寅', '乙卯', '丙辰', '丁巳', '戊午', '己未', '庚申', '辛酉', '壬戌', '癸亥'], voidZhi: ['子', '丑'] },
];

export function isGan(s: string): boolean {
  return TIAN_GAN.includes(s as (typeof TIAN_GAN)[number]);
}

export function isZhi(s: string): boolean {
  return DI_ZHI.includes(s as (typeof DI_ZHI)[number]);
}

/** 日主天干 + 地支 → 十二长生 */
export function getChangSheng(dayMasterGan: string, branch: string): string {
  const gan = `${dayMasterGan || ''}`.trim();
  const zhi = `${branch || ''}`.trim();
  if (!isGan(gan) || !isZhi(zhi)) return '—';
  const start = CHANG_SHENG_START[gan];
  if (!start) return '—';
  const startIdx = DI_ZHI.indexOf(start as (typeof DI_ZHI)[number]);
  const zhiIdx = DI_ZHI.indexOf(zhi as (typeof DI_ZHI)[number]);
  if (startIdx < 0 || zhiIdx < 0) return '—';
  const forward = YANG_GAN.has(gan);
  const offset = forward
    ? (zhiIdx - startIdx + 12) % 12
    : (startIdx - zhiIdx + 12) % 12;
  return CHANG_SHENG_NAMES[offset] || '—';
}

/** 日柱空亡地支（两支） */
export function getKongWangByDayPillar(dayGanZhi: string): string[] {
  const gz = `${dayGanZhi || ''}`.trim();
  if (gz.length < 2) return [];
  for (const xun of KONG_WANG_BY_XUN) {
    if (xun.heads.includes(gz)) return [...xun.voidZhi];
  }
  // 兜底：按干支索引推旬
  const gan = gz[0]!;
  const zhi = gz[1]!;
  if (!isGan(gan) || !isZhi(zhi)) return [];
  const gi = TIAN_GAN.indexOf(gan as (typeof TIAN_GAN)[number]);
  const zi = DI_ZHI.indexOf(zhi as (typeof DI_ZHI)[number]);
  // 旬首地支：从当前干支回溯到甲
  const stepsToJia = gi; // 甲=0
  const xunShouZhiIdx = (zi - stepsToJia + 12) % 12;
  const xunShouGanZhi = `甲${DI_ZHI[xunShouZhiIdx]}`;
  for (const xun of KONG_WANG_BY_XUN) {
    if (xun.heads[0] === xunShouGanZhi || xun.heads.includes(gz)) {
      return [...xun.voidZhi];
    }
  }
  return [];
}

/** 某地支是否落空亡 */
export function isZhiKongWang(branch: string, kongWang: string[]): boolean {
  return kongWang.includes(`${branch || ''}`.trim());
}

/**
 * 公历年 → 年柱干支
 * 以 1984 甲子为锚（春节前后年柱交界专业上应按立春，此处用公历年近似，点盘时注明）
 */
export function getYearGanZhi(year: number): string {
  // 1984 = 甲子
  const offset = ((year - 1984) % 60 + 60) % 60;
  const gan = TIAN_GAN[offset % 10]!;
  const zhi = DI_ZHI[offset % 12]!;
  return `${gan}${zhi}`;
}

/** 简化：公历月柱（非精确节气月，仅作速查；专业点盘应结合节气） */
export function getApproxMonthGanZhi(year: number, month: number): string {
  // 甲己之年丙作首：年干定寅月天干
  const yearGan = getYearGanZhi(year)[0]!;
  const yearGanIdx = TIAN_GAN.indexOf(yearGan as (typeof TIAN_GAN)[number]);
  // 寅月天干起点：甲己丙、乙庚戊、丙辛庚、丁壬壬、戊癸甲
  const yinGanStarts = [2, 4, 6, 8, 0]; // 丙戊庚壬甲
  const group = yearGanIdx % 5;
  const yinGanIdx = yinGanStarts[group]!;
  // month 1=寅... 若公历月：2月≈寅（粗），这里用 正月=1 → 寅 = month 映射
  // 公历 m=1 仍用丑月近似太糙；采用：公历 m 对应地支 (m+1)%12 的常见速查
  // 寅=2月起：公历月 m → 地支 index = (m + 1) % 12  (1月=丑=1, 2月=寅=2)
  const zhiIdx = (month + 1) % 12;
  const ganIdx = (yinGanIdx + ((zhiIdx - 2 + 12) % 12)) % 10;
  return `${TIAN_GAN[ganIdx]}${DI_ZHI[zhiIdx]}`;
}

export type LiunianProbe = {
  year: number;
  ganZhi: string;
  gan: string;
  zhi: string;
  dayMasterChangSheng: string;
  isKongWang: boolean;
  vsDayun: string;
  notes: string[];
};

/** 自选流年点盘摘要（相对日主与当前大运） */
export function probeLiunianYear(params: {
  year: number;
  dayMaster: string;
  dayPillarGanZhi: string;
  currentDayunGanZhi?: string;
  yongShen?: string[];
  jiShen?: string[];
}): LiunianProbe {
  const ganZhi = getYearGanZhi(params.year);
  const gan = ganZhi[0]!;
  const zhi = ganZhi[1]!;
  const kongWang = getKongWangByDayPillar(params.dayPillarGanZhi);
  const dayMasterChangSheng = getChangSheng(params.dayMaster, zhi);
  const isKongWang = isZhiKongWang(zhi, kongWang);

  const notes: string[] = [];
  notes.push(`${params.year} 年柱 ${ganZhi}（公历年锚，精确交节请以立春为准）`);
  notes.push(`日主 ${params.dayMaster || '—'} 临 ${zhi} 为「${dayMasterChangSheng}」`);
  if (isKongWang) notes.push(`流年地支 ${zhi} 落日空亡（${kongWang.join('')}）`);

  let vsDayun = '—';
  const dayun = `${params.currentDayunGanZhi || ''}`.trim();
  if (dayun.length >= 2) {
    if (dayun === ganZhi) {
      vsDayun = '岁运并临';
      notes.push('大运与流年干支相同，力量叠加强。');
    } else if (dayun[0] === gan) {
      vsDayun = '天干同气';
      notes.push(`与大运天干同为 ${gan}`);
    } else if (dayun[1] === zhi) {
      vsDayun = '地支伏吟';
      notes.push(`与大运地支同为 ${zhi}`);
    } else {
      vsDayun = '岁运异气';
    }
  }

  const elMap: Record<string, string> = {
    甲: '木', 乙: '木', 丙: '火', 丁: '火', 戊: '土', 己: '土', 庚: '金', 辛: '金', 壬: '水', 癸: '水',
  };
  const elLabel = elMap[gan] || '';
  if (elLabel && params.yongShen?.includes(elLabel)) notes.push(`流年天干属用神「${elLabel}」方向`);
  if (elLabel && params.jiShen?.includes(elLabel)) notes.push(`流年天干属忌神「${elLabel}」方向，宜审慎`);

  return {
    year: params.year,
    ganZhi,
    gan,
    zhi,
    dayMasterChangSheng,
    isKongWang,
    vsDayun,
    notes,
  };
}
