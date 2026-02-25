/**
 * 八字常量定义 - 移植自历史版本权威引擎
 * 天干、地支、五行、十神完整常量体系
 */

// ==================== 天干 ====================
export const TIAN_GAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];

export const GAN_TO_WUXING: Record<string, string> = {
  '甲': '木', '乙': '木', '丙': '火', '丁': '火',
  '戊': '土', '己': '土', '庚': '金', '辛': '金',
  '壬': '水', '癸': '水',
};

export const GAN_YIN_YANG: Record<string, number> = {
  '甲': 0, '乙': 1, '丙': 0, '丁': 1, '戊': 0,
  '己': 1, '庚': 0, '辛': 1, '壬': 0, '癸': 1,
};

export const GAN_HE: Record<string, string> = {
  '甲': '己', '己': '甲',
  '乙': '庚', '庚': '乙',
  '丙': '辛', '辛': '丙',
  '丁': '壬', '壬': '丁',
  '戊': '癸', '癸': '戊',
};

export const GAN_CHONG: Record<string, string> = {
  '甲': '庚', '庚': '甲',
  '乙': '辛', '辛': '乙',
  '丙': '壬', '壬': '丙',
  '丁': '癸', '癸': '丁',
};

// ==================== 地支 ====================
export const DI_ZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

export const ZHI_TO_WUXING: Record<string, string> = {
  '子': '水', '丑': '土', '寅': '木', '卯': '木',
  '辰': '土', '巳': '火', '午': '火', '未': '土',
  '申': '金', '酉': '金', '戌': '土', '亥': '水',
};

export const ZHI_YIN_YANG: Record<string, number> = {
  '子': 0, '丑': 1, '寅': 0, '卯': 1,
  '辰': 0, '巳': 1, '午': 0, '未': 1,
  '申': 0, '酉': 1, '戌': 0, '亥': 1,
};

// 地支藏干 [本气, 中气?, 余气?]
export const ZHI_CANG_GAN: Record<string, string[]> = {
  '子': ['癸'],
  '丑': ['己', '癸', '辛'],
  '寅': ['甲', '丙', '戊'],
  '卯': ['乙'],
  '辰': ['戊', '乙', '癸'],
  '巳': ['丙', '庚', '戊'],
  '午': ['丁', '己'],
  '未': ['己', '丁', '乙'],
  '申': ['庚', '壬', '戊'],
  '酉': ['辛'],
  '戌': ['戊', '辛', '丁'],
  '亥': ['壬', '甲'],
};

// 地支六冲
export const ZHI_CHONG: Record<string, string> = {
  '子': '午', '午': '子', '丑': '未', '未': '丑',
  '寅': '申', '申': '寅', '卯': '酉', '酉': '卯',
  '辰': '戌', '戌': '辰', '巳': '亥', '亥': '巳',
};

// 地支六合
export const ZHI_HE: Record<string, string> = {
  '子': '丑', '丑': '子', '寅': '亥', '亥': '寅',
  '卯': '戌', '戌': '卯', '辰': '酉', '酉': '辰',
  '巳': '申', '申': '巳', '午': '未', '未': '午',
};

// 地支三合局
export const ZHI_SAN_HE: Record<string, string[]> = {
  '水局': ['申', '子', '辰'],
  '木局': ['亥', '卯', '未'],
  '火局': ['寅', '午', '戌'],
  '金局': ['巳', '酉', '丑'],
};

// 地支刑
export const ZHI_XING: Record<string, string> = {
  '寅': '巳', '巳': '申', '申': '寅',
  '丑': '戌', '戌': '未', '未': '丑',
  '子': '卯', '卯': '子',
  '辰': '辰', '午': '午', '酉': '酉', '亥': '亥',
};

// 地支害
export const ZHI_HAI: Record<string, string> = {
  '子': '未', '未': '子', '丑': '午', '午': '丑',
  '寅': '巳', '巳': '寅', '卯': '辰', '辰': '卯',
  '申': '亥', '亥': '申', '酉': '戌', '戌': '酉',
};

// ==================== 五行 ====================
export const WUXING_SHENG: Record<string, string> = {
  '木': '火', '火': '土', '土': '金', '金': '水', '水': '木',
};

export const WUXING_KE: Record<string, string> = {
  '木': '土', '火': '金', '土': '水', '金': '木', '水': '火',
};

export const WUXING_BEI_SHENG: Record<string, string> = {
  '木': '水', '火': '木', '土': '火', '金': '土', '水': '金',
};

export const WUXING_BEI_KE: Record<string, string> = {
  '木': '金', '火': '水', '土': '木', '金': '火', '水': '土',
};

export const WUXING_DIRECTION: Record<string, string> = {
  '木': '东', '火': '南', '土': '中', '金': '西', '水': '北',
};

export const WUXING_COLOR: Record<string, string[]> = {
  '木': ['绿色', '青色', '翠绿'],
  '火': ['红色', '紫色', '橙色'],
  '土': ['黄色', '棕色', '米色'],
  '金': ['白色', '金色', '银色'],
  '水': ['黑色', '蓝色', '灰色'],
};

export const WUXING_NUMBER: Record<string, number[]> = {
  '木': [3, 8], '火': [2, 7], '土': [5, 10], '金': [4, 9], '水': [1, 6],
};

export const WUXING_ORGAN: Record<string, { yin: string; yang: string }> = {
  '木': { yin: '肝', yang: '胆' },
  '火': { yin: '心', yang: '小肠' },
  '土': { yin: '脾', yang: '胃' },
  '金': { yin: '肺', yang: '大肠' },
  '水': { yin: '肾', yang: '膀胱' },
};

// 五行季节得令程度
export const WUXING_SEASON_SCORE: Record<string, Record<string, number>> = {
  '木': { '寅': 3, '卯': 3, '巳': 1, '午': 0, '申': -2, '酉': -2, '亥': 2, '子': 2, '辰': 1, '未': -1, '戌': -1, '丑': -1 },
  '火': { '寅': 2, '卯': 2, '巳': 3, '午': 3, '申': -1, '酉': -1, '亥': -2, '子': -2, '辰': 1, '未': 1, '戌': 1, '丑': -1 },
  '土': { '寅': 0, '卯': 0, '巳': 2, '午': 2, '申': 2, '酉': 0, '亥': -1, '子': -1, '辰': 3, '未': 3, '戌': 3, '丑': 3 },
  '金': { '寅': -2, '卯': -2, '巳': -1, '午': -2, '申': 3, '酉': 3, '亥': 1, '子': 1, '辰': 1, '未': 1, '戌': 2, '丑': 2 },
  '水': { '寅': 1, '卯': 0, '巳': -2, '午': -2, '申': 2, '酉': 2, '亥': 3, '子': 3, '辰': 0, '未': -1, '戌': -1, '丑': 1 },
};

// ==================== 十神 ====================
export const SHI_SHEN = ['比肩', '劫财', '食神', '伤官', '偏财', '正财', '七杀', '正官', '偏印', '正印'];

export const SHISHEN_CATEGORY: Record<string, string> = {
  '比肩': '比劫', '劫财': '比劫',
  '食神': '食伤', '伤官': '食伤',
  '偏财': '财星', '正财': '财星',
  '七杀': '官杀', '正官': '官杀',
  '偏印': '印星', '正印': '印星',
};

/**
 * 计算十神
 */
export function calculateShiShen(dayMaster: string, targetGan: string): string | null {
  const dayElement = GAN_TO_WUXING[dayMaster];
  const targetElement = GAN_TO_WUXING[targetGan];
  if (!dayElement || !targetElement) return null;

  const sameYinYang = GAN_YIN_YANG[dayMaster] === GAN_YIN_YANG[targetGan];

  if (dayElement === targetElement) return sameYinYang ? '比肩' : '劫财';
  if (WUXING_SHENG[dayElement] === targetElement) return sameYinYang ? '食神' : '伤官';
  if (WUXING_KE[dayElement] === targetElement) return sameYinYang ? '偏财' : '正财';
  if (WUXING_KE[targetElement] === dayElement) return sameYinYang ? '七杀' : '正官';
  if (WUXING_SHENG[targetElement] === dayElement) return sameYinYang ? '偏印' : '正印';

  return null;
}

/**
 * 生成十神对照表
 */
export function generateShiShenTable(dayMaster: string): Record<string, string | null> {
  const table: Record<string, string | null> = {};
  for (const gan of TIAN_GAN) {
    table[gan] = calculateShiShen(dayMaster, gan);
  }
  return table;
}

// ==================== 辅助函数 ====================
export function getZhiCangGan(zhi: string): string[] {
  return ZHI_CANG_GAN[zhi] || [];
}

export function isYangGan(gan: string): boolean {
  return GAN_YIN_YANG[gan] === 0;
}

export function isChong(zhi1: string, zhi2: string): boolean {
  return ZHI_CHONG[zhi1] === zhi2;
}

export function isHe(zhi1: string, zhi2: string): boolean {
  return ZHI_HE[zhi1] === zhi2;
}

export function checkSanHe(zhiArray: string[]): string | null {
  for (const [name, group] of Object.entries(ZHI_SAN_HE)) {
    const matches = group.filter(z => zhiArray.includes(z)).length;
    if (matches >= 3) return name;
  }
  return null;
}
