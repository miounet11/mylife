/**
 * 大门方位五行映射与分析
 *
 * 八卦方位 → 五行 映射，依据后天八卦（文王八卦）：
 * 震(东)=木，巽(东南)=木，离(南)=火，坤(西南)=土，
 * 兑(西)=金，乾(西北)=金，坎(北)=水，艮(东北)=土。
 */

export interface DoorDirectionInfo {
  element: string;
  favorable: string[];
  adverse: string[];
}

export const DOOR_DIRECTION_MAP: Record<string, DoorDirectionInfo> = {
  东: { element: 'wood', favorable: ['fire', 'water'], adverse: ['metal', 'earth'] },
  东南: { element: 'wood', favorable: ['fire', 'water'], adverse: ['metal', 'earth'] },
  南: { element: 'fire', favorable: ['wood', 'earth'], adverse: ['water', 'metal'] },
  西南: { element: 'earth', favorable: ['fire', 'metal'], adverse: ['wood', 'water'] },
  西: { element: 'metal', favorable: ['earth', 'water'], adverse: ['fire', 'wood'] },
  西北: { element: 'metal', favorable: ['earth', 'water'], adverse: ['fire', 'wood'] },
  北: { element: 'water', favorable: ['metal', 'wood'], adverse: ['earth', 'fire'] },
  东北: { element: 'earth', favorable: ['fire', 'metal'], adverse: ['wood', 'water'] },
};

const ELEMENT_CN: Record<string, string> = {
  wood: '木',
  fire: '火',
  earth: '土',
  metal: '金',
  water: '水',
};

/**
 * 根据门向解析五行属性及相生相克方位
 */
export function resolveDirectionElement(
  direction: string,
): { element: string; favorableElements: string[]; adverseElements: string[] } {
  const info = DOOR_DIRECTION_MAP[direction];
  if (info) {
    return {
      element: info.element,
      favorableElements: [...info.favorable],
      adverseElements: [...info.adverse],
    };
  }

  // 模糊匹配
  for (const key of Object.keys(DOOR_DIRECTION_MAP)) {
    if (direction.includes(key) || key.includes(direction)) {
      const d = DOOR_DIRECTION_MAP[key];
      return {
        element: d.element,
        favorableElements: [...d.favorable],
        adverseElements: [...d.adverse],
      };
    }
  }

  // 默认返回东（木）
  return {
    element: 'wood',
    favorableElements: ['fire', 'water'],
    adverseElements: ['metal', 'earth'],
  };
}

/**
 * 大门方位与喜用神的匹配度评分
 *
 * 评分规则：
 * - 门向五行在${comparisonBasis}中 → 50分
 * - 门向所生五行（favourable列表）与喜用神重叠 → 每个 +20分（上限+40）
 * - 门向所克五行（adverse列表）与喜用神重叠 → 每个 -15分
 * - 上限100，下限0
 */
export function matchDirection(
  direction: string,
  favorableElements: string[],
  comparisonBasis = '喜用五行',
): { score: number; matchLevel: string; description: string } {
  const info = resolveDirectionElement(direction);
  let score = 0;
  const reasons: string[] = [];

  // 门向五行本身在${comparisonBasis}中
  if (favorableElements.includes(info.element)) {
    score += 50;
    reasons.push(`门向五行「${ELEMENT_CN[info.element]}」在${comparisonBasis}中`);
  }

  // 门向所生五行与喜用神重叠
  let favBonus = 0;
  for (const fav of info.favorableElements) {
    if (favorableElements.includes(fav)) {
      favBonus += 20;
      reasons.push(`门向所生「${ELEMENT_CN[fav]}」在${comparisonBasis}中`);
    }
  }
  score += Math.min(favBonus, 40);

  // 门向所克五行与喜用神重叠（减分）
  for (const adv of info.adverseElements) {
    if (favorableElements.includes(adv)) {
      score -= 15;
      reasons.push(`门向所克「${ELEMENT_CN[adv]}」在${comparisonBasis}中，有损耗`);
    }
  }

  // 保底
  if (score === 0) {
    score = 25;
    reasons.push(`门向五行「${ELEMENT_CN[info.element]}」与喜用神无明显生克关系`);
  }

  score = Math.max(0, Math.min(100, score));

  let matchLevel: string;
  if (score >= 75) {
    matchLevel = '方位生旺';
  } else if (score >= 50) {
    matchLevel = '方位得宜';
  } else if (score >= 30) {
    matchLevel = '方位平稳';
  } else {
    matchLevel = '方位偏弱';
  }

  return {
    score,
    matchLevel,
    description: reasons.join('；') + '。',
  };
}
