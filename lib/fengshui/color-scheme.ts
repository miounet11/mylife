/**
 * 色彩五行映射与搭配方案生成
 *
 * 五行对应色彩：
 * 木→绿色系，火→红橙黄系，土→米棕系，金→银白金系，水→蓝黑系
 */

import type { FengshuiColorScheme } from './types';

export const ELEMENT_COLOR_MAP: Record<string, Array<{ label: string; hex: string }>> = {
  wood: [
    { label: '墨绿', hex: '#2E7D32' },
    { label: '青绿', hex: '#4CAF50' },
    { label: '浅绿', hex: '#A5D6A7' },
  ],
  fire: [
    { label: '朱红', hex: '#D32F2F' },
    { label: '橙红', hex: '#F57C00' },
    { label: '暖黄', hex: '#FFC107' },
  ],
  earth: [
    { label: '米黄', hex: '#F5F5DC' },
    { label: '驼色', hex: '#BCAAA4' },
    { label: '棕褐', hex: '#8D6E63' },
  ],
  metal: [
    { label: '银白', hex: '#CFD8DC' },
    { label: '金色', hex: '#FFD700' },
    { label: '灰白', hex: '#F5F5F5' },
  ],
  water: [
    { label: '藏青', hex: '#1A237E' },
    { label: '深蓝', hex: '#0D47A1' },
    { label: '黑色', hex: '#212121' },
  ],
};

/** 五行相生：a 生 b */
const GENERATING: Record<string, string> = {
  wood: 'fire',
  fire: 'earth',
  earth: 'metal',
  metal: 'water',
  water: 'wood',
};

/** 五行相克：a 克 b */
const OVERCOMING: Record<string, string> = {
  wood: 'earth',
  earth: 'water',
  water: 'fire',
  fire: 'metal',
  metal: 'wood',
};

/** 被克：b 被 a 克 → 克我者 */
const OVERCOME_BY: Record<string, string> = {
  wood: 'metal',
  earth: 'wood',
  water: 'earth',
  fire: 'water',
  metal: 'fire',
};

const ELEMENT_CN: Record<string, string> = {
  wood: '木',
  fire: '火',
  earth: '土',
  metal: '金',
  water: '水',
};

/** 装修风格偏好对主色选择的影响 */
const DECOR_ELEMENT_PREFERENCE: Record<string, string> = {
  现代简约: 'metal',
  新中式: 'wood',
  工业风: 'metal',
  北欧: 'water',
  轻奢: 'earth',
};

/**
 * 根据喜用五行和装修偏好生成色彩方案
 *
 * - primary：从最强喜用神的色彩中选取
 * - secondary：从生主五行的五行色彩中选取（相生为辅）
 * - accent：从与主五行相生的另一端选取互补色
 * - avoidColors：克主五行的五行对应色彩
 */
export function generateColorScheme(
  favorableElements: string[],
  decorPreference?: string,
): FengshuiColorScheme {
  // 确定主五行
  let primaryElement = favorableElements[0] || 'earth';

  // 如果装修偏好指定了五行，且偏好五行在喜用神中，优先使用
  if (decorPreference && DECOR_ELEMENT_PREFERENCE[decorPreference]) {
    const decorElement = DECOR_ELEMENT_PREFERENCE[decorPreference];
    if (favorableElements.includes(decorElement)) {
      primaryElement = decorElement;
    }
  }

  // 次要五行：生主五行的五行
  let secondaryElement = '';
  for (const el of Object.keys(GENERATING)) {
    if (GENERATING[el] === primaryElement) {
      secondaryElement = el;
      break;
    }
  }
  // 如果没找到相生来源（不应发生），fallback
  if (!secondaryElement) {
    secondaryElement = favorableElements[1] || GENERATING[primaryElement] || 'earth';
  }

  // 点缀五行：主五行所生的五行
  let accentElement = GENERATING[primaryElement] || 'earth';

  // 如果次要或点缀五行也在喜用神中，优先
  if (favorableElements.length > 1 && favorableElements[1]) {
    // 检查是否次要在喜用神中
    if (favorableElements.includes(secondaryElement)) {
      // 保持
    } else if (favorableElements.includes(accentElement)) {
      // 交换：用喜用神做点缀
      accentElement = favorableElements[1];
    }
  }

  // 克主五行的五行 → 避免色
  const avoidElement = OVERCOME_BY[primaryElement];
  const avoidColors = (ELEMENT_COLOR_MAP[avoidElement] || []).map((c) => c.label);

  // 取色
  const primaryColors = ELEMENT_COLOR_MAP[primaryElement] || ELEMENT_COLOR_MAP.earth;
  const secondaryColors = ELEMENT_COLOR_MAP[secondaryElement] || ELEMENT_COLOR_MAP.earth;
  const accentColors = ELEMENT_COLOR_MAP[accentElement] || ELEMENT_COLOR_MAP.earth;

  const primaryPick = primaryColors[0];
  const secondaryPick = secondaryColors[0];
  const accentPick = accentColors[Math.min(1, accentColors.length - 1)];

  return {
    primary: {
      label: primaryPick.label,
      hex: primaryPick.hex,
      element: primaryElement,
      reason: `主五行「${ELEMENT_CN[primaryElement]}」对应色彩${decorPreference ? `，契合「${decorPreference}」风格` : ''}。`,
    },
    secondary: {
      label: secondaryPick.label,
      hex: secondaryPick.hex,
      element: secondaryElement,
      reason: `「${ELEMENT_CN[secondaryElement]}」生「${ELEMENT_CN[primaryElement]}」，作为辅助色有相生之效。`,
    },
    accent: {
      label: accentPick.label,
      hex: accentPick.hex,
      element: accentElement,
      reason: `「${ELEMENT_CN[accentElement]}」与主色形成视觉对比，增强层次感。`,
    },
    avoidColors,
  };
}
