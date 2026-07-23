/**
 * 行业五行映射与匹配
 *
 * 行业 → 主五行 / 辅五行 映射，依据传统行业分类与五行属性。
 */

export interface IndustryElementInfo {
  element: string;
  subElement?: string;
  description: string;
}

export const INDUSTRY_ELEMENT_MAP: Record<string, IndustryElementInfo> = {
  餐饮: { element: 'fire', subElement: 'earth', description: '餐饮业以烹饪为核心，火为主，食材源于土地，故火土兼具。' },
  科技: { element: 'metal', subElement: 'water', description: '科技行业以精密制造与信息流动为特征，金属电子与数据传输，金水相生。' },
  教育: { element: 'wood', subElement: 'fire', description: '教育属文化传播，木主生长，火主光明，木火相生。' },
  零售: { element: 'earth', subElement: 'metal', description: '零售业以实体店铺为载体，土地承载，货币交易属金，土金相生。' },
  美容: { element: 'water', subElement: 'wood', description: '美容以润泽滋养为特征，水主润，木主生长，水木相生。' },
  医疗: { element: 'wood', subElement: 'fire', description: '医疗以救死扶伤为本质，木主生命，火主温度与活力，木火相生。' },
  金融: { element: 'metal', subElement: 'water', description: '金融业以货币流转为核心，金属货币，水主流动，金水相生。' },
  文化: { element: 'wood', subElement: 'fire', description: '文化产业以内容创作为主，木主文采，火主传播，木火相生。' },
  制造: { element: 'earth', subElement: 'metal', description: '制造业以加工为核心，土地资源与金属加工，土金相生。' },
  地产: { element: 'earth', description: '地产业以土地为根本，土为载体，承载万物。' },
};

/** 五行相生关系：a 生 b */
const GENERATING: Record<string, string> = {
  wood: 'fire',
  fire: 'earth',
  earth: 'metal',
  metal: 'water',
  water: 'wood',
};

/** 五行相克关系：a 克 b */
const OVERCOMING: Record<string, string> = {
  wood: 'earth',
  earth: 'water',
  water: 'fire',
  fire: 'metal',
  metal: 'wood',
};

const ELEMENT_CN: Record<string, string> = {
  wood: '木',
  fire: '火',
  earth: '土',
  metal: '金',
  water: '水',
};

/**
 * 根据行业类型解析五行属性
 */
export function resolveIndustryElement(industryType: string): IndustryElementInfo {
  const info = INDUSTRY_ELEMENT_MAP[industryType];
  if (info) return info;

  // 模糊匹配：尝试包含关系
  for (const key of Object.keys(INDUSTRY_ELEMENT_MAP)) {
    if (industryType.includes(key) || key.includes(industryType)) {
      return INDUSTRY_ELEMENT_MAP[key];
    }
  }

  // 默认返回土
  return {
    element: 'earth',
    description: `未匹配到「${industryType}」的标准五行映射，默认归为土行，主承载与稳定。`,
  };
}

/**
 * 行业五行与喜用神的匹配度评分
 *
 * 评分规则：
 * - 行业主五行在${comparisonBasis}中 → 60分
 * - 行业辅五行在${comparisonBasis}中 → 额外25分
 * - 行业主五行被喜用神所生（相生） → 额外15分
 * - 行业主五行克喜用神 → 扣20分
 * - 上限100，下限0
 */
export function matchIndustryElement(
  industryType: string,
  favorableElements: string[],
  comparisonBasis = '喜用五行',
): { score: number; matchLevel: string; description: string } {
  const info = resolveIndustryElement(industryType);
  let score = 0;
  const reasons: string[] = [];

  const mainEl = info.element;
  const subEl = info.subElement;

  // 主五行在${comparisonBasis}中
  if (favorableElements.includes(mainEl)) {
    score += 60;
    reasons.push(`行业主五行「${ELEMENT_CN[mainEl]}」在${comparisonBasis}中`);
  }

  // 辅五行在${comparisonBasis}中
  if (subEl && favorableElements.includes(subEl)) {
    score += 25;
    reasons.push(`行业辅五行「${ELEMENT_CN[subEl]}」在${comparisonBasis}中`);
  }

  // 喜用神生行业主五行（相生加持）
  for (const fav of favorableElements) {
    if (GENERATING[fav] === mainEl && mainEl !== fav) {
      score += 15;
      reasons.push(`喜用神「${ELEMENT_CN[fav]}」生行业五行「${ELEMENT_CN[mainEl]}」`);
    }
  }

  // 行业主五行克喜用神（减分）
  for (const fav of favorableElements) {
    if (OVERCOMING[mainEl] === fav) {
      score -= 20;
      reasons.push(`行业五行「${ELEMENT_CN[mainEl]}」克喜用神「${ELEMENT_CN[fav]}」`);
    }
  }

  // 保底：如果以上都未命中，给基础分
  if (score === 0) {
    score = 30;
    reasons.push(`行业五行「${ELEMENT_CN[mainEl]}」与喜用神无明显生克关系`);
  }

  score = Math.max(0, Math.min(100, score));

  let matchLevel: string;
  if (score >= 75) {
    matchLevel = '高度匹配';
  } else if (score >= 50) {
    matchLevel = '中度匹配';
  } else if (score >= 30) {
    matchLevel = '一般匹配';
  } else {
    matchLevel = '偏弱匹配';
  }

  return {
    score,
    matchLevel,
    description: reasons.join('；') + '。',
  };
}
