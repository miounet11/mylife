// ── 八字常量 V6 ──

/** 天干 → 五行 */
export const GAN_TO_WUXING: Record<string, string> = {
  '甲': 'wood', '乙': 'wood',
  '丙': 'fire', '丁': 'fire',
  '戊': 'earth', '己': 'earth',
  '庚': 'metal', '辛': 'metal',
  '壬': 'water', '癸': 'water',
};

/** 天干合 */
export const GAN_HE: Record<string, string> = {
  '甲': '己', '己': '甲',
  '乙': '庚', '庚': '乙',
  '丙': '辛', '辛': '丙',
  '丁': '壬', '壬': '丁',
  '戊': '癸', '癸': '戊',
};

/** 天干冲 */
export const GAN_CHONG: Record<string, string> = {
  '甲': '庚', '庚': '甲',
  '乙': '辛', '辛': '乙',
  '丙': '壬', '壬': '丙',
  '丁': '癸', '癸': '丁',
};

/** 地支 → 藏干 */
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

/** 地支冲 */
export const ZHI_CHONG: Record<string, string> = {
  '子': '午', '午': '子',
  '丑': '未', '未': '丑',
  '寅': '申', '申': '寅',
  '卯': '酉', '酉': '卯',
  '辰': '戌', '戌': '辰',
  '巳': '亥', '亥': '巳',
};

/** 地支合（六合） */
export const ZHI_HE: Record<string, string> = {
  '子': '丑', '丑': '子',
  '寅': '亥', '亥': '寅',
  '卯': '戌', '戌': '卯',
  '辰': '酉', '酉': '辰',
  '巳': '申', '申': '巳',
  '午': '未', '未': '午',
};

/** 地支三合局 */
export const ZHI_SAN_HE: Record<string, string[]> = {
  '申子辰': ['申', '子', '辰'],
  '亥卯未': ['亥', '卯', '未'],
  '寅午戌': ['寅', '午', '戌'],
  '巳酉丑': ['巳', '酉', '丑'],
};

/** 地支刑 */
export const ZHI_XING: Record<string, string> = {
  '寅': '巳', '巳': '申', '申': '寅', // 无恩之刑
  '丑': '戌', '戌': '未', '未': '丑', // 恃势之刑
  '子': '卯', '卯': '子',               // 无礼之刑
  '辰': '辰', '午': '午', '酉': '酉', '亥': '亥', // 自刑
};

/** 地支害 */
export const ZHI_HAI: Record<string, string> = {
  '子': '未', '未': '子',
  '丑': '午', '午': '丑',
  '寅': '巳', '巳': '寅',
  '卯': '辰', '辰': '卯',
  '申': '亥', '亥': '申',
  '酉': '戌', '戌': '酉',
};

/** 五行季节强度权重 */
export const WUXING_SEASON_SCORE: Record<string, number> = {
  springWood: 3, springFire: 2, springEarth: 1, springMetal: 0, springWater: 1,
  summerWood: 1, summerFire: 3, summerEarth: 2, summerMetal: 1, summerWater: 0,
  autumnWood: 0, autumnFire: 1, autumnEarth: 1, autumnMetal: 3, autumnWater: 2,
  winterWood: 2, winterFire: 0, winterEarth: 1, winterMetal: 1, winterWater: 3,
};

/** 十神计算 (日主天干 vs 某天干) */
export function calculateShiShen(dayMaster: string, stem: string): string | null {
  if (!dayMaster || !stem) return null;

  const wuxing = GAN_TO_WUXING;
  const dm = wuxing[dayMaster];
  const st = wuxing[stem];
  if (!dm || !st) return null;

  // 生克关系
  const generate: Record<string, string> = { wood: 'fire', fire: 'earth', earth: 'metal', metal: 'water', water: 'wood' };
  const control: Record<string, string> = { wood: 'earth', earth: 'water', water: 'fire', fire: 'metal', metal: 'wood' };

  const isSameYinYang = (g1: string, g2: string) => {
    const yang = ['甲', '丙', '戊', '庚', '壬'];
    const yin = ['乙', '丁', '己', '辛', '癸'];
    return (yang.includes(g1) && yang.includes(g2)) || (yin.includes(g1) && yin.includes(g2));
  };

  // 同我
  if (dm === st) return isSameYinYang(dayMaster, stem) ? '比肩' : '劫财';

  // 我生
  if (generate[dm] === st) return isSameYinYang(dayMaster, stem) ? '食神' : '伤官';

  // 我克
  if (control[dm] === st) return isSameYinYang(dayMaster, stem) ? '偏财' : '正财';

  // 生我
  if (generate[st] === dm) return isSameYinYang(dayMaster, stem) ? '偏印' : '正印';

  // 克我
  if (control[st] === dm) return isSameYinYang(dayMaster, stem) ? '七杀' : '正官';

  return null;
}
