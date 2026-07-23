/** 商铺风水分析引擎 — 桶导出 */

export * from './types';
export { analyzeShopFengshui } from './shop-analyzer';
export { resolveIndustryElement, matchIndustryElement, INDUSTRY_ELEMENT_MAP } from './industry-wuxing';
export { resolveDirectionElement, matchDirection, DOOR_DIRECTION_MAP } from './direction-wuxing';
export { generateColorScheme, ELEMENT_COLOR_MAP } from './color-scheme';
export { analyzeShopName, CHAR_ELEMENT_MAP, FALLBACK_ELEMENT } from './name-analysis';
export { analyzeOpeningDate } from './timing-window';
export * from './space';
