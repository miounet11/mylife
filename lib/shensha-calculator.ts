/**
 * 神煞系统 - 基于年干、日干、地支计算常用神煞
 * 参考《三命通会》《神峰通考》权威体系
 */

import { TIAN_GAN, DI_ZHI } from './bazi-constants';

export interface ShenSha {
  name: string;
  type: 'auspicious' | 'inauspicious' | 'neutral';
  description: string;
  pillar: 'year' | 'month' | 'day' | 'hour'; // 所在柱
}

export interface ShenShaResult {
  list: ShenSha[];
  auspicious: string[];
  inauspicious: string[];
  summary: string;
}

// ==================== 神煞查表 ====================

// 天乙贵人：以日干查地支
export const TIANYI_GUIREN: Record<string, string[]> = {
  '甲': ['丑', '未'], '戊': ['丑', '未'],
  '乙': ['子', '申'], '己': ['子', '申'],
  '丙': ['亥', '酉'], '庚': ['亥', '酉'],
  '丁': ['亥', '酉'], '辛': ['寅', '午'],
  '壬': ['卯', '巳'], '癸': ['卯', '巳'],
};

// 文昌贵人：以日干查地支
export const WENCHANG: Record<string, string> = {
  '甲': '巳', '乙': '午', '丙': '申', '丁': '酉',
  '戊': '申', '己': '酉', '庚': '亥', '辛': '子',
  '壬': '寅', '癸': '卯',
};

// 驿马：以年支或日支三合局首查
export const YIMA: Record<string, string> = {
  '申': '寅', '子': '寅', '辰': '寅',
  '寅': '申', '午': '申', '戌': '申',
  '亥': '巳', '卯': '巳', '未': '巳',
  '巳': '亥', '酉': '亥', '丑': '亥',
};

// 桃花：以年支或日支三合局中宫查
export const TAOHUA: Record<string, string> = {
  '申': '酉', '子': '酉', '辰': '酉',
  '寅': '卯', '午': '卯', '戌': '卯',
  '亥': '子', '卯': '子', '未': '子',
  '巳': '午', '酉': '午', '丑': '午',
};

// 将星：以年支或日支查三合局中支
export const JIANGXING: Record<string, string> = {
  '申': '子', '子': '子', '辰': '子',
  '寅': '午', '午': '午', '戌': '午',
  '巳': '酉', '酉': '酉', '丑': '酉',
  '亥': '卯', '卯': '卯', '未': '卯',
};

// 华盖：以年支查
const HUAGAI: Record<string, string> = {
  '子': '辰', '丑': '丑', '寅': '戌', '卯': '未',
  '辰': '辰', '巳': '丑', '午': '戌', '未': '未',
  '申': '辰', '酉': '丑', '戌': '戌', '亥': '未',
};

// 羊刃：以日干查地支
const YANGREN: Record<string, string> = {
  '甲': '卯', '乙': '寅', '丙': '午', '丁': '巳',
  '戊': '午', '己': '巳', '庚': '酉', '辛': '申',
  '壬': '子', '癸': '亥',
};

// 魁罡：特定干支组合
const KUIGANG = new Set(['庚辰', '庚戌', '壬辰', '戊戌']);

// 孤辰寡宿：以年支查
const GUCHEN: Record<string, string> = {
  '寅': '巳', '卯': '巳', '辰': '巳',
  '巳': '申', '午': '申', '未': '申',
  '申': '亥', '酉': '亥', '戌': '亥',
  '亥': '寅', '子': '寅', '丑': '寅',
};
const GUASU: Record<string, string> = {
  '寅': '丑', '卯': '丑', '辰': '丑',
  '巳': '辰', '午': '辰', '未': '辰',
  '申': '未', '酉': '未', '戌': '未',
  '亥': '戌', '子': '戌', '丑': '戌',
};

// 天德贵人：以月支查天干
export const TIANDE: Record<string, string> = {
  '寅': '丁', '卯': '申', '辰': '壬', '巳': '辛',
  '午': '亥', '未': '甲', '申': '癸', '酉': '寅',
  '戌': '丙', '亥': '乙', '子': '巳', '丑': '庚',
};

// 月德贵人：以月支查天干
export const YUEDE: Record<string, string> = {
  '寅': '丙', '卯': '甲', '辰': '壬', '巳': '庚',
  '午': '丙', '未': '甲', '申': '壬', '酉': '庚',
  '戌': '丙', '亥': '甲', '子': '壬', '丑': '庚',
};

// ==================== 计算函数 ====================

/**
 * 计算八字神煞
 * @param pillars 四柱 [{gan, zhi}, ...] 年月日时
 */
export function calculateShenSha(
  pillars: Array<{ gan: string; zhi: string }>
): ShenShaResult {
  const [year, month, day, hour] = pillars;
  const dayGan = day.gan;
  const yearZhi = year.zhi;
  const monthZhi = month.zhi;
  const allZhi = pillars.map(p => p.zhi);
  const allGan = pillars.map(p => p.gan);

  const list: ShenSha[] = [];

  // 天乙贵人
  const tianyiZhi = TIANYI_GUIREN[dayGan] || [];
  for (let i = 0; i < pillars.length; i++) {
    if (tianyiZhi.includes(pillars[i].zhi)) {
      list.push({
        name: '天乙贵人',
        type: 'auspicious',
        description: '逢凶化吉，贵人相助，一生多得贵人提携',
        pillar: (['year', 'month', 'day', 'hour'] as const)[i],
      });
    }
  }

  // 文昌贵人
  const wenchangZhi = WENCHANG[dayGan];
  if (wenchangZhi) {
    for (let i = 0; i < pillars.length; i++) {
      if (pillars[i].zhi === wenchangZhi) {
        list.push({
          name: '文昌贵人',
          type: 'auspicious',
          description: '聪明好学，利于文职考试，学业事业顺遂',
          pillar: (['year', 'month', 'day', 'hour'] as const)[i],
        });
      }
    }
  }

  // 驿马（以日支为主）
  const yimaZhi = YIMA[day.zhi];
  if (yimaZhi) {
    for (let i = 0; i < pillars.length; i++) {
      if (pillars[i].zhi === yimaZhi && i !== 2) {
        list.push({
          name: '驿马',
          type: 'neutral',
          description: '奔波劳碌，利于出行、迁移、外贸',
          pillar: (['year', 'month', 'day', 'hour'] as const)[i],
        });
      }
    }
  }

  // 桃花（以日支为主）
  const taohuaZhi = TAOHUA[day.zhi];
  if (taohuaZhi) {
    for (let i = 0; i < pillars.length; i++) {
      if (pillars[i].zhi === taohuaZhi && i !== 2) {
        list.push({
          name: '桃花',
          type: 'neutral',
          description: '人缘极佳，异性缘旺，感情丰富',
          pillar: (['year', 'month', 'day', 'hour'] as const)[i],
        });
      }
    }
  }

  // 华盖（以年支查日支）
  const huagaiZhi = HUAGAI[yearZhi];
  if (huagaiZhi && day.zhi === huagaiZhi) {
    list.push({
      name: '华盖',
      type: 'neutral',
      description: '孤高清雅，利于艺术宗教，但易孤独',
      pillar: 'day',
    });
  }

  // 羊刃
  const yangrenZhi = YANGREN[dayGan];
  if (yangrenZhi) {
    for (let i = 0; i < pillars.length; i++) {
      if (pillars[i].zhi === yangrenZhi && i !== 2) {
        list.push({
          name: '羊刃',
          type: 'inauspicious',
          description: '性格刚烈，易有意外伤灾，需注意安全',
          pillar: (['year', 'month', 'day', 'hour'] as const)[i],
        });
      }
    }
  }

  // 魁罡
  const dayPillar = day.gan + day.zhi;
  if (KUIGANG.has(dayPillar)) {
    list.push({
      name: '魁罡',
      type: 'neutral',
      description: '聪明果断，权威领导力强，但性格强硬',
      pillar: 'day',
    });
  }

  // 孤辰寡宿（以年支查）
  const guchenZhi = GUCHEN[yearZhi];
  const guasuZhi = GUASU[yearZhi];
  if (guchenZhi && allZhi.includes(guchenZhi)) {
    list.push({
      name: '孤辰',
      type: 'inauspicious',
      description: '感情孤独，婚姻不顺，宜修身养性',
      pillar: 'year',
    });
  }
  if (guasuZhi && allZhi.includes(guasuZhi)) {
    list.push({
      name: '寡宿',
      type: 'inauspicious',
      description: '感情孤独，婚姻不顺，宜修身养性',
      pillar: 'year',
    });
  }

  // 天德贵人（以月支查，看四柱天干是否有对应干）
  const tiandeGan = TIANDE[monthZhi];
  if (tiandeGan && allGan.includes(tiandeGan)) {
    list.push({
      name: '天德贵人',
      type: 'auspicious',
      description: '上天庇佑，逢凶化吉，一生少灾少难',
      pillar: 'month',
    });
  }

  // 月德贵人
  const yuedeGan = YUEDE[monthZhi];
  if (yuedeGan && allGan.includes(yuedeGan)) {
    list.push({
      name: '月德贵人',
      type: 'auspicious',
      description: '品德高尚，贵人相助，财运亨通',
      pillar: 'month',
    });
  }

  const auspicious = [...new Set(list.filter(s => s.type === 'auspicious').map(s => s.name))];
  const inauspicious = [...new Set(list.filter(s => s.type === 'inauspicious').map(s => s.name))];

  const summary = buildSummary(auspicious, inauspicious);

  return { list, auspicious, inauspicious, summary };
}

function buildSummary(auspicious: string[], inauspicious: string[]): string {
  const parts: string[] = [];
  if (auspicious.length > 0) parts.push(`吉神：${auspicious.join('、')}`);
  if (inauspicious.length > 0) parts.push(`凶煞：${inauspicious.join('、')}`);
  if (parts.length === 0) return '命局神煞平和，无特殊吉凶';
  return parts.join('；');
}
