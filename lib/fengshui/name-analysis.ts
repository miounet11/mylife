/**
 * 店名逐字五行分析
 *
 * 基于常用商铺用字的五行映射，对店名进行逐字评分。
 */

import type { ShopFengshuiOutput } from './types';

type NameAnalysis = ShopFengshuiOutput['nameAnalysis'];

/**
 * 常用商铺用字五行映射表（约80字）
 *
 * 归类依据：偏旁部首、字义、传统五行归类
 */
export const CHAR_ELEMENT_MAP: Record<string, string> = {
  // 水行
  福: 'water', 源: 'water', 泰: 'water', 馆: 'water', 行: 'water', 小: 'water', 水: 'water',
  海: 'water', 洋: 'water', 润: 'water', 泽: 'water', 清: 'water', 淼: 'water', 江: 'water',
  河: 'water', 湖: 'water', 溪: 'water', 渊: 'water', 浩: 'water', 涵: 'water', 淳: 'water',
  汇: 'water', 泉: 'water', 波: 'water', 澜: 'water', 沐: 'water', 沛: 'water',
  // 金行
  禄: 'metal', 财: 'metal', 宝: 'metal', 鑫: 'metal', 利: 'metal', 盛: 'metal',
  轩: 'metal', 楼: 'metal', 号: 'metal', 金: 'metal', 锦: 'metal', 锋: 'metal',
  钧: 'metal', 铭: 'metal', 钦: 'metal', 钰: 'metal', 锐: 'metal',
  钞: 'metal', 银: 'metal', 铁: 'metal', 锡: 'metal', 镇: 'metal', 铸: 'metal',
  // 火行
  寿: 'fire', 喜: 'fire', 亨: 'fire', 昌: 'fire', 宁: 'fire', 华: 'fire',
  店: 'fire', 氏: 'fire', 大: 'fire', 火: 'fire', 灿: 'fire', 炎: 'fire',
  煌: 'fire', 炫: 'fire', 烨: 'fire', 煜: 'fire', 熠: 'fire', 辉: 'fire',
  耀: 'fire', 明: 'fire', 亮: 'fire', 晨: 'fire', 星: 'fire', 阳: 'fire',
  日: 'fire', 光: 'fire',
  // 木行
  森: 'wood', 林: 'wood', 康: 'wood', 阁: 'wood', 居: 'wood', 斋: 'wood',
  家: 'wood', 木: 'wood', 荣: 'wood', 栋: 'wood', 柏: 'wood',
  松: 'wood', 桂: 'wood', 桐: 'wood', 槐: 'wood', 榕: 'wood', 柳: 'wood',
  杨: 'wood', 枫: 'wood', 蔓: 'wood', 薪: 'wood', 茗: 'wood', 苗: 'wood',
  芳: 'wood', 萃: 'wood', 茂: 'wood', 繁: 'wood',
  // 土行
  和: 'earth', 隆: 'earth', 安: 'earth', 贵: 'earth', 堂: 'earth', 坊: 'earth',
  土: 'earth', 地: 'earth', 山: 'earth', 岩: 'earth', 石: 'earth', 磊: 'earth',
  疆: 'earth', 城: 'earth', 堡: 'earth', 垣: 'earth', 坚: 'earth', 厚: 'earth',
  坦: 'earth', 培: 'earth', 基: 'earth', 增: 'earth', 壁: 'earth',
};

/** 五行相克：a 克 b */
const OVERCOMING: Record<string, string> = {
  wood: 'earth',
  earth: 'water',
  water: 'fire',
  fire: 'metal',
  metal: 'wood',
};

/** 克我者 */
const OVERCOME_BY: Record<string, string> = {
  wood: 'metal',
  earth: 'wood',
  water: 'earth',
  fire: 'water',
  metal: 'fire',
};

/** 五行生我者 */
const GENERATING_BY: Record<string, string> = {
  wood: 'water',
  fire: 'wood',
  earth: 'fire',
  metal: 'earth',
  water: 'metal',
};

const ELEMENT_CN: Record<string, string> = {
  wood: '木',
  fire: '火',
  earth: '土',
  metal: '金',
  water: '水',
};

/** 未在映射表中的字符默认五行 */
export const FALLBACK_ELEMENT = 'earth';

/**
 * 偏旁部首推断五行（备用策略）
 *
 * 水部(氵) → water，金部(钅) → metal，木部(木) → wood，
 * 火部(灬/火) → fire，土部(土) → earth，其余 → earth
 */
function inferByRadical(char: string): string {
  // 检查常见偏旁
  if (/[\u6c35\u6c34\u6d77\u6e56\u6d2a]/.test(char)) return 'water';
  if (/[\u9485\u91d1\u94c1\u9521]/.test(char)) return 'metal';
  if (/[\u6728\u6797\u67f3\u6843]/.test(char)) return 'wood';
  if (/[\u706b\u70e7\u7085\u7194]/.test(char)) return 'fire';
  if (/[\u571f\u5730\u574e\u5806]/.test(char)) return 'earth';
  return FALLBACK_ELEMENT;
}

/**
 * 解析单字五行
 */
function resolveCharElement(char: string): string {
  if (CHAR_ELEMENT_MAP[char]) return CHAR_ELEMENT_MAP[char];
  return inferByRadical(char);
}

/**
 * 对单个字评分
 *
 * - 字的五行在喜用神中 → 20分
 * - 字的五行被喜用神所生（生我者为喜用） → 15分
 * - 字的五行克喜用神 → 5分（有损耗但仍有力量）
 * - 字的五行被喜用神所克 → 0分
 * - 中性（无明显生克） → 10分
 */
function scoreCharacter(char: string, element: string, favorable: string[]): number {
  if (favorable.includes(element)) return 20;

  // 喜用神生此字五行
  for (const fav of favorable) {
    if (GENERATING_BY[element] === fav) return 15;
  }

  // 此字五行克喜用神
  for (const fav of favorable) {
    if (OVERCOMING[element] === fav) return 5;
  }

  // 喜用神克此字五行
  for (const fav of favorable) {
    if (OVERCOME_BY[element] === fav) return 0;
  }

  return 10;
}

/**
 * 分析店名五行
 *
 * 逐字判定五行归属，结合喜用神评分，综合给出店名五行匹配总分。
 */
export function analyzeShopName(
  name: string,
  favorable: string[],
  comparisonBasis = '喜用五行',
): NameAnalysis {
  const chars = Array.from(name).filter((c) => c.trim().length > 0);

  const characters = chars.map((char) => {
    const element = resolveCharElement(char);
    const score = scoreCharacter(char, element, favorable);
    return { char, element, score };
  });

  if (characters.length === 0) {
    return {
      totalScore: 50,
      characters: [],
      summary: '店名为空，无法进行五行分析，默认中等评分。',
    };
  }

  const avgScore = characters.reduce((sum, c) => sum + c.score, 0) / characters.length;
  const totalScore = Math.round(avgScore * 5); // 0-100

  // 生成摘要
  const elementCounts: Record<string, number> = {};
  for (const c of characters) {
    elementCounts[c.element] = (elementCounts[c.element] || 0) + 1;
  }
  const dominantElements = Object.entries(elementCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([el, count]) => `${ELEMENT_CN[el]}(${count})`)
    .join('、');

  const favorableHits = characters.filter((c) => favorable.includes(c.element)).length;
  const summaryParts: string[] = [
    `店名「${name}」共${characters.length}字，五行分布：${dominantElements}。`,
  ];

  if (favorableHits > 0) {
    summaryParts.push(`其中${favorableHits}字落在${comparisonBasis}中，整体匹配度${totalScore}分。`);
  } else {
    summaryParts.push(`无字直接落在${comparisonBasis}中，整体匹配度${totalScore}分，可考虑调整用字。`);
  }

  return {
    totalScore,
    characters,
    summary: summaryParts.join(''),
  };
}
