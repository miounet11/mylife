/** 十二生肖 × 流日匹配（地支冲合 + 通书，非恐吓） */

export type ShengxiaoAnimal =
  | '鼠'
  | '牛'
  | '虎'
  | '兔'
  | '龙'
  | '蛇'
  | '马'
  | '羊'
  | '猴'
  | '鸡'
  | '狗'
  | '猪';

export type ShengxiaoSlug =
  | 'rat'
  | 'ox'
  | 'tiger'
  | 'rabbit'
  | 'dragon'
  | 'snake'
  | 'horse'
  | 'goat'
  | 'monkey'
  | 'rooster'
  | 'dog'
  | 'pig';

export const SHENGXIAO_CATALOG: Array<{
  slug: ShengxiaoSlug;
  zh: ShengxiaoAnimal;
  branch: string;
  en: string;
  keywords: string[];
  blurb: string;
}> = [
  { slug: 'rat', zh: '鼠', branch: '子', en: 'Rat', keywords: ['机敏', '储备'], blurb: '地支子，偏水机。' },
  { slug: 'ox', zh: '牛', branch: '丑', en: 'Ox', keywords: ['耐力', '耕耘'], blurb: '地支丑，偏土稳。' },
  { slug: 'tiger', zh: '虎', branch: '寅', en: 'Tiger', keywords: ['开创', '胆识'], blurb: '地支寅，偏木开。' },
  { slug: 'rabbit', zh: '兔', branch: '卯', en: 'Rabbit', keywords: ['细腻', '调和'], blurb: '地支卯，偏木柔。' },
  { slug: 'dragon', zh: '龙', branch: '辰', en: 'Dragon', keywords: ['格局', '变动'], blurb: '地支辰，水库土。' },
  { slug: 'snake', zh: '蛇', branch: '巳', en: 'Snake', keywords: ['洞察', '策略'], blurb: '地支巳，偏火藏。' },
  { slug: 'horse', zh: '马', branch: '午', en: 'Horse', keywords: ['行动', '外向'], blurb: '地支午，偏火明。' },
  { slug: 'goat', zh: '羊', branch: '未', en: 'Goat', keywords: ['审美', '照护'], blurb: '地支未，偏土润。' },
  { slug: 'monkey', zh: '猴', branch: '申', en: 'Monkey', keywords: ['灵活', '机变'], blurb: '地支申，偏金活。' },
  { slug: 'rooster', zh: '鸡', branch: '酉', en: 'Rooster', keywords: ['标准', '锋利'], blurb: '地支酉，偏金锐。' },
  { slug: 'dog', zh: '狗', branch: '戌', en: 'Dog', keywords: ['守界', '义气'], blurb: '地支戌，火库土。' },
  { slug: 'pig', zh: '猪', branch: '亥', en: 'Pig', keywords: ['包容', '厚积'], blurb: '地支亥，偏水厚。' },
];

const BRANCH_CHONG: Record<string, string> = {
  子: '午',
  午: '子',
  丑: '未',
  未: '丑',
  寅: '申',
  申: '寅',
  卯: '酉',
  酉: '卯',
  辰: '戌',
  戌: '辰',
  巳: '亥',
  亥: '巳',
};

const BRANCH_LIUHE: Record<string, string> = {
  子: '丑',
  丑: '子',
  寅: '亥',
  亥: '寅',
  卯: '戌',
  戌: '卯',
  辰: '酉',
  酉: '辰',
  巳: '申',
  申: '巳',
  午: '未',
  未: '午',
};

export function getShengxiaoBySlug(slug: string | null | undefined) {
  return SHENGXIAO_CATALOG.find((s) => s.slug === slug) || null;
}

export function getShengxiaoByZh(zh: string | null | undefined) {
  return SHENGXIAO_CATALOG.find((s) => s.zh === zh) || null;
}

export function shengxiaoFlowRelation(
  animalBranch: string,
  flowDayBranch: string,
): { kind: 'chong' | 'he' | 'same' | 'neutral'; label: string; scoreDelta: number } {
  if (!animalBranch || !flowDayBranch) {
    return { kind: 'neutral', label: '流日地支未解析', scoreDelta: 0 };
  }
  if (animalBranch === flowDayBranch) {
    return { kind: 'same', label: `流日地支${flowDayBranch}与本命生肖同支（值太岁近似）`, scoreDelta: -8 };
  }
  if (BRANCH_CHONG[animalBranch] === flowDayBranch) {
    return { kind: 'chong', label: `流日${flowDayBranch}与生肖支${animalBranch}六冲`, scoreDelta: -14 };
  }
  if (BRANCH_LIUHE[animalBranch] === flowDayBranch) {
    return { kind: 'he', label: `流日${flowDayBranch}与生肖支${animalBranch}六合`, scoreDelta: 10 };
  }
  return { kind: 'neutral', label: `流日地支${flowDayBranch}与生肖支${animalBranch}无冲合`, scoreDelta: 0 };
}
