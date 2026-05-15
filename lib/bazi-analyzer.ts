/**
 * 八字命局分析器 - 移植自历史版本权威引擎
 * 计算日主强弱、用神、忌神、格局等核心命理数据
 * 这些数据是确定性计算，不依赖AI
 */

import {
  GAN_TO_WUXING, GAN_YIN_YANG, TIAN_GAN,
  ZHI_TO_WUXING, ZHI_CANG_GAN,
  WUXING_SHENG, WUXING_KE, WUXING_BEI_SHENG, WUXING_BEI_KE,
  WUXING_SEASON_SCORE, WUXING_COLOR, WUXING_DIRECTION, WUXING_NUMBER,
  calculateShiShen, getZhiCangGan, SHISHEN_CATEGORY,
} from './bazi-constants';
import { calculateShenSha, ShenShaResult } from './shensha-calculator';

// ==================== 五行力量计算 ====================

/**
 * 计算八字中某个五行的总力量
 */
export function calculateWuxingStrength(bazi: string[], targetWuxing: string): number {
  let strength = 0;

  bazi.forEach((pillar, idx) => {
    if (!pillar || pillar.length < 2) return;
    const tianGan = pillar[0];
    const diZhi = pillar[1];
    const cangGan = getZhiCangGan(diZhi);

    // 天干力量 (月柱天干权重更高)
    const tianGanWeight = idx === 1 ? 1.5 : 1;
    if (GAN_TO_WUXING[tianGan] === targetWuxing) {
      strength += tianGanWeight;
    }

    // 地支本气力量
    if (ZHI_TO_WUXING[diZhi] === targetWuxing) {
      strength += idx === 1 ? 2.5 : 1.5; // 月支最重要
    }

    // 藏干力量
    cangGan.forEach((gan, i) => {
      if (GAN_TO_WUXING[gan] === targetWuxing) {
        const weight = i === 0 ? 1 : i === 1 ? 0.6 : 0.3;
        strength += weight * (idx === 1 ? 1.5 : 1);
      }
    });
  });

  return Math.round(strength * 10) / 10;
}

// ==================== 日主强弱分析 ====================

export interface StrengthAnalysis {
  dayMaster: string;
  dayMasterElement: string;
  strength: 'very_strong' | 'strong' | 'neutral' | 'weak' | 'very_weak';
  strengthDesc: string;
  score: number;
  confidence: {
    level: 'high' | 'medium' | 'low';
    score: number;
    boundary: boolean;
    reasonChain: string[];
  };
  threeGain: {
    seasonCommandScore: number;
    rootSupportScore: number;
    supportScore: number;
    drainControlScore: number;
    totalScore: number;
    reasonChain: string[];
  };
  details: {
    helpStrength: number;
    drainStrength: number;
    seasonBonus: number;
  };
}

/**
 * 计算日主强弱
 */
export function analyzeDayMasterStrength(bazi: string[]): StrengthAnalysis | null {
  if (!bazi || bazi.length < 4) return null;

  const dayPillar = bazi[2];
  const monthPillar = bazi[1];
  if (!dayPillar || dayPillar.length < 2) return null;

  const dayMaster = dayPillar[0];
  const dayMasterElement = GAN_TO_WUXING[dayMaster];
  const monthBranch = monthPillar?.[1];

  // 帮扶日主的力量（比劫+印星）
  const selfElement = dayMasterElement;
  const parentElement = WUXING_BEI_SHENG[selfElement];

  const selfStrength = calculateWuxingStrength(bazi, selfElement);
  const parentStrength = calculateWuxingStrength(bazi, parentElement);
  const helpStrength = selfStrength + parentStrength * 0.8;

  // 克泄日主的力量（财星+官杀+食伤）
  const childElement = WUXING_SHENG[selfElement];
  const wealthElement = WUXING_KE[selfElement];
  const officerElement = WUXING_BEI_KE[selfElement];

  const childStrength = calculateWuxingStrength(bazi, childElement);
  const wealthStrength = calculateWuxingStrength(bazi, wealthElement);
  const officerStrength = calculateWuxingStrength(bazi, officerElement);
  const drainStrength = childStrength * 0.7 + wealthStrength * 0.9 + officerStrength;

  // 月令得令加成
  const seasonScore = WUXING_SEASON_SCORE[selfElement]?.[monthBranch] || 0;
  const seasonBonus = seasonScore * 1.5;

  const rootSupportScore = bazi.reduce((sum, pillar) => {
    const branch = pillar?.[1];
    const hiddenStems = ZHI_CANG_GAN[branch] || [];
    return sum + hiddenStems.reduce((inner, stem, index) => inner + (GAN_TO_WUXING[stem] === selfElement ? [2.5, 1.5, 1][index] || 0.5 : 0), 0);
  }, 0);
  const supportScore = helpStrength;
  const drainControlScore = drainStrength;
  const totalScore = (supportScore + seasonBonus + rootSupportScore) - drainControlScore;
  const roundedTotalScore = Math.round(totalScore * 10) / 10;

  let strength: StrengthAnalysis['strength'];
  let strengthDesc: string;
  if (totalScore >= 3) { strength = 'very_strong'; strengthDesc = '极旺'; }
  else if (totalScore >= 1) { strength = 'strong'; strengthDesc = '偏旺'; }
  else if (totalScore >= -1) { strength = 'neutral'; strengthDesc = '中和'; }
  else if (totalScore >= -3) { strength = 'weak'; strengthDesc = '偏弱'; }
  else { strength = 'very_weak'; strengthDesc = '极弱'; }

  const boundaryDistance = Math.min(...[-3, -1, 1, 3].map((threshold) => Math.abs(roundedTotalScore - threshold)));
  const boundary = boundaryDistance <= 0.4;
  const confidenceScore = Math.max(0.45, Math.min(0.95, 0.82 + (boundary ? -0.22 : 0) + (Math.abs(roundedTotalScore) >= 2 ? 0.08 : 0)));
  const reasonChain = [
    `得令${Math.round(seasonBonus * 10) / 10}`,
    `得地${Math.round(rootSupportScore * 10) / 10}`,
    `得助${Math.round(supportScore * 10) / 10}`,
    `克泄耗${Math.round(drainControlScore * 10) / 10}`,
    `强弱总分${roundedTotalScore}，判为${strengthDesc}`,
  ];

  return {
    dayMaster, dayMasterElement, strength, strengthDesc,
    score: roundedTotalScore,
    confidence: {
      level: confidenceScore >= 0.82 ? 'high' : confidenceScore >= 0.62 ? 'medium' : 'low',
      score: Math.round(confidenceScore * 100) / 100,
      boundary,
      reasonChain,
    },
    threeGain: {
      seasonCommandScore: Math.round(seasonBonus * 10) / 10,
      rootSupportScore: Math.round(rootSupportScore * 10) / 10,
      supportScore: Math.round(supportScore * 10) / 10,
      drainControlScore: Math.round(drainControlScore * 10) / 10,
      totalScore: roundedTotalScore,
      reasonChain,
    },
    details: {
      helpStrength: Math.round(helpStrength * 10) / 10,
      drainStrength: Math.round(drainStrength * 10) / 10,
      seasonBonus: Math.round(seasonBonus * 10) / 10,
    },
  };
}

// ==================== 特殊格局检测 ====================

interface PatternInfo {
  pattern: string;
  element: string;
  description: string;
  note: string;
}

function detectSpecialPattern(bazi: string[], sa: StrengthAnalysis): PatternInfo | null {
  const { dayMasterElement, strength, score } = sa;
  if (strength !== 'very_weak' && strength !== 'very_strong') return null;

  const elementCount: Record<string, number> = { '木': 0, '火': 0, '土': 0, '金': 0, '水': 0 };

  bazi.forEach(pillar => {
    if (!pillar || pillar.length < 2) return;
    const ganEl = GAN_TO_WUXING[pillar[0]];
    const zhiEl = ZHI_TO_WUXING[pillar[1]];
    if (ganEl) elementCount[ganEl]++;
    if (zhiEl) elementCount[zhiEl]++;
  });

  const selfElement = dayMasterElement;
  const wealthElement = WUXING_KE[selfElement];
  const officerElement = WUXING_BEI_KE[selfElement];
  const childElement = WUXING_SHENG[selfElement];
  const selfCount = elementCount[selfElement];

  if (strength === 'very_weak' && score < -3 && selfCount <= 1) {
    if (elementCount[wealthElement] >= 4) {
      return { pattern: '从财格', element: wealthElement,
        description: `日主极弱无根，财星${wealthElement}满盘，弃命从财。用神取财星及食伤生财，忌印比扶身。`,
        note: '《子平真诠》：从财者，身弱财旺，不能任财，则从财势。' };
    }
    if (elementCount[officerElement] >= 4) {
      return { pattern: '从杀格', element: officerElement,
        description: `日主极弱无根，官杀${officerElement}满盘，弃命从杀。用神取官杀及财星生杀，忌印比扶身。`,
        note: '《子平真诠》：从杀者，身弱杀旺，不能任杀，则从杀势。' };
    }
    if (elementCount[childElement] >= 4) {
      return { pattern: '从儿格', element: childElement,
        description: `日主极弱无根，食伤${childElement}满盘，弃命从儿。用神取食伤及财星，忌印星克制食伤。`,
        note: '《子平真诠》：从儿者，身弱食伤旺，不能任食伤，则从食伤势。' };
    }
  }

  if (strength === 'very_strong' && score > 3) {
    const maxEl = Object.entries(elementCount)
      .filter(([el]) => el !== selfElement)
      .reduce((max, [el, count]) => count > max.count ? { element: el, count } : max, { element: '', count: 0 });
    if (maxEl.count >= 4) {
      return { pattern: '专旺格', element: maxEl.element,
        description: `命局${maxEl.element}气专旺，占据多数位置。顺其旺势，用神取${maxEl.element}及生扶之五行。`,
        note: '专旺格需顺势而为，不可逆势克制。' };
    }
  }

  return null;
}

// ==================== 通关用神检测 ====================

interface TongguanInfo {
  element: string;
  reason: string;
  conflict: [string, string];
  note: string;
}

function detectMediatingElement(bazi: string[], sa: StrengthAnalysis): TongguanInfo | null {
  const wuxingStrength: Record<string, number> = {
    '木': calculateWuxingStrength(bazi, '木'),
    '火': calculateWuxingStrength(bazi, '火'),
    '土': calculateWuxingStrength(bazi, '土'),
    '金': calculateWuxingStrength(bazi, '金'),
    '水': calculateWuxingStrength(bazi, '水'),
  };

  const sorted = Object.entries(wuxingStrength).sort((a, b) => b[1] - a[1]);
  const [strongest, second] = sorted;

  if (strongest[1] < 3 || second[1] < 2.5) return null;
  if (strongest[1] - second[1] > strongest[1] * 0.3) return null;

  const mediatingMap: Record<string, string> = {
    '金-木': '水', '木-金': '水', '木-土': '火', '土-木': '火',
    '土-水': '金', '水-土': '金', '水-火': '木', '火-水': '木',
    '火-金': '土', '金-火': '土',
  };

  const key = `${strongest[0]}-${second[0]}`;
  const mediatingElement = mediatingMap[key];

  if (mediatingElement) {
    return {
      element: mediatingElement,
      reason: `命局${strongest[0]}(${strongest[1].toFixed(1)})与${second[0]}(${second[1].toFixed(1)})两行交战，用${mediatingElement}通关。`,
      conflict: [strongest[0], second[0]],
      note: '《滴天髓》："两神成象，非通关而不解"',
    };
  }
  return null;
}

// ==================== 调候用神检测 ====================

interface TiaohouInfo {
  needed: boolean;
  element: string;
  priority: 'high' | 'medium';
  reason: string;
  note: string;
}

function checkSeasonalRegulation(bazi: string[], monthBranch: string): TiaohouInfo | null {
  const fireCount = calculateWuxingStrength(bazi, '火');
  const waterCount = calculateWuxingStrength(bazi, '水');

  // 冬月（亥子丑）：寒命需火
  if (['亥', '子', '丑'].includes(monthBranch)) {
    const priority = monthBranch === '子' ? 'high' as const : 'medium' as const;
    if (fireCount < 1.5) {
      return {
        needed: true, element: '火', priority,
        reason: `冬月${monthBranch}生人，天寒地冻，必用火调候暖局。《穷通宝鉴》："冬月非火不暖"`,
        note: fireCount === 0 ? '命局无火，调候失宜，一生多阻' : '命局火弱，需借流年运势补火',
      };
    }
  }

  // 夏月（巳午未）：热命需水
  if (['巳', '午', '未'].includes(monthBranch)) {
    const priority = monthBranch === '午' ? 'high' as const : 'medium' as const;
    if (waterCount < 1.5) {
      return {
        needed: true, element: '水', priority,
        reason: `夏月${monthBranch}生人，炎热燥烈，必用水调候润局。《穷通宝鉴》："夏月非水不凉"`,
        note: waterCount === 0 ? '命局无水，燥土焦木，一生多劳' : '命局水弱，需借流年运势补水',
      };
    }
  }

  return null;
}

// ==================== 完整用神分析 ====================

export interface YongShenLayer {
  element: string | null;
  priority: 'primary' | 'secondary' | 'supporting' | 'none';
  confidence: number;
  reasonChain: string[];
}

export interface YongShenResult extends StrengthAnalysis {
  yongShen: string[];
  xiShen: string[];
  jiShen: string[];
  qiuShen: string[];
  primaryYongShen: YongShenLayer;
  tiaohouYongShen: YongShenLayer;
  tongguanYongShen: YongShenLayer;
  balanceYongShen: YongShenLayer;
  bingyaoYongShen: YongShenLayer;
  priority: string[];
  yongShenConfidence: {
    level: 'high' | 'medium' | 'low';
    score: number;
    reasonChain: string[];
  };
  pattern: PatternInfo | null;
  tiaohuo: TiaohouInfo | null;
  tongguan: TongguanInfo | null;
  analysis: string;
}

/**
 * 确定用神和忌神（四步法）
 * 1. 特殊格局优先
 * 2. 调候次之
 * 3. 通关用神
 * 4. 强弱平衡
 */
function buildYongShenLayers(params: {
  sa: StrengthAnalysis;
  yongShen: string[];
  xiShen: string[];
  jiShen: string[];
  pattern: PatternInfo | null;
  tiaohuo: TiaohouInfo | null;
  tongguan: TongguanInfo | null;
  balanceElement: string | null;
}): Pick<YongShenResult, 'primaryYongShen' | 'tiaohouYongShen' | 'tongguanYongShen' | 'balanceYongShen' | 'bingyaoYongShen' | 'priority' | 'yongShenConfidence'> {
  const { sa, yongShen, xiShen, jiShen, pattern, tiaohuo, tongguan, balanceElement } = params;
  const primary = yongShen[0] || null;
  const reasonChain = [
    pattern ? `格局优先：${pattern.pattern}` : '',
    tiaohuo ? `调候：${tiaohuo.element}，${tiaohuo.priority}` : '',
    tongguan ? `通关：${tongguan.element}` : '',
    balanceElement ? `扶抑平衡：${balanceElement}` : '',
    `强弱：${sa.strengthDesc}，${sa.threeGain.reasonChain.join('；')}`,
  ].filter(Boolean);
  const score = Math.max(0.45, Math.min(0.96, sa.confidence.score + (primary ? 0.04 : -0.08) + (tiaohuo?.priority === 'high' || tongguan ? 0.03 : 0)));

  return {
    primaryYongShen: { element: primary, priority: primary ? 'primary' : 'none', confidence: Math.round(score * 100) / 100, reasonChain },
    tiaohouYongShen: { element: tiaohuo?.element || null, priority: tiaohuo ? (tiaohuo.priority === 'high' ? 'primary' : 'supporting') : 'none', confidence: tiaohuo ? 0.82 : 0.5, reasonChain: tiaohuo ? [tiaohuo.reason, tiaohuo.note] : ['无强制调候信号'] },
    tongguanYongShen: { element: tongguan?.element || null, priority: tongguan ? 'secondary' : 'none', confidence: tongguan ? 0.78 : 0.5, reasonChain: tongguan ? [tongguan.reason, tongguan.note] : ['未发现必须通关的五行冲突'] },
    balanceYongShen: { element: balanceElement, priority: balanceElement ? 'secondary' : 'none', confidence: 0.76, reasonChain: [`按日主${sa.strengthDesc}取扶抑平衡`] },
    bingyaoYongShen: { element: primary, priority: primary ? 'supporting' : 'none', confidence: 0.72, reasonChain: [`病在${jiShen.join('、') || '偏枯'}，药取${[...yongShen, ...xiShen].filter(Boolean).join('、') || '节律平衡'}`] },
    priority: [primary ? `primary:${primary}` : '', tiaohuo ? `tiaohou:${tiaohuo.element}` : '', tongguan ? `tongguan:${tongguan.element}` : '', balanceElement ? `balance:${balanceElement}` : ''].filter(Boolean),
    yongShenConfidence: { level: score >= 0.82 ? 'high' : score >= 0.62 ? 'medium' : 'low', score: Math.round(score * 100) / 100, reasonChain },
  };
}

export function determineYongShen(bazi: string[]): YongShenResult | null {
  const sa = analyzeDayMasterStrength(bazi);
  if (!sa) return null;

  const { dayMasterElement, strength } = sa;
  const monthBranch = bazi[1]?.[1];

  const selfElement = dayMasterElement;
  const parentElement = WUXING_BEI_SHENG[selfElement];
  const siblingElement = selfElement;
  const childElement = WUXING_SHENG[selfElement];
  const wealthElement = WUXING_KE[selfElement];
  const officerElement = WUXING_BEI_KE[selfElement];

  let yongShen: string[] = [];
  let xiShen: string[] = [];
  let jiShen: string[] = [];
  let qiuShen: string[] = [];
  let pattern: PatternInfo | null = null;
  let tiaohuo: TiaohouInfo | null = null;
  let tongguan: TongguanInfo | null = null;
  let balanceElement: string | null = null;

  // 第一步：检测特殊格局
  pattern = detectSpecialPattern(bazi, sa);
  if (pattern) {
    if (pattern.pattern.includes('从财')) {
      yongShen = [wealthElement, childElement];
      jiShen = [parentElement, siblingElement];
    } else if (pattern.pattern.includes('从杀')) {
      yongShen = [officerElement, wealthElement];
      jiShen = [parentElement, siblingElement];
    } else if (pattern.pattern.includes('从儿')) {
      yongShen = [childElement, wealthElement];
      jiShen = [parentElement]; qiuShen = [siblingElement];
    } else if (pattern.pattern.includes('专旺')) {
      yongShen = [pattern.element];
      xiShen = [WUXING_BEI_SHENG[pattern.element]];
      jiShen = [WUXING_BEI_KE[pattern.element]];
    }
    const layers = buildYongShenLayers({ sa, yongShen, xiShen, jiShen, pattern, tiaohuo: null, tongguan: null, balanceElement: yongShen[0] || null });
    return { ...sa, yongShen, xiShen, jiShen, qiuShen, ...layers, pattern, tiaohuo: null, tongguan: null,
      analysis: generateAnalysisText(sa, { yongShen, xiShen, jiShen, qiuShen, pattern, tiaohuo: null, tongguan: null }) };
  }

  // 第二步：检查调候用神
  tiaohuo = checkSeasonalRegulation(bazi, monthBranch);
  if (tiaohuo && tiaohuo.priority === 'high') {
    yongShen = [tiaohuo.element];
    if (strength === 'very_strong' || strength === 'strong') {
      xiShen = [officerElement, wealthElement, childElement].filter(el => el !== tiaohuo!.element);
      jiShen = [parentElement]; qiuShen = [siblingElement];
    } else if (strength === 'very_weak' || strength === 'weak') {
      xiShen = [parentElement, siblingElement].filter(el => el !== tiaohuo!.element);
      jiShen = [childElement, wealthElement].filter(el => el !== tiaohuo!.element);
      qiuShen = [officerElement].filter(el => el !== tiaohuo!.element);
    } else {
      xiShen = [parentElement].filter(el => el !== tiaohuo!.element);
      jiShen = [officerElement].filter(el => el !== tiaohuo!.element);
    }
    const layers = buildYongShenLayers({ sa, yongShen, xiShen, jiShen, pattern: null, tiaohuo, tongguan: null, balanceElement: xiShen[0] || yongShen[0] || null });
    return { ...sa, yongShen, xiShen, jiShen, qiuShen, ...layers, pattern: null, tiaohuo, tongguan: null,
      analysis: generateAnalysisText(sa, { yongShen, xiShen, jiShen, qiuShen, pattern: null, tiaohuo, tongguan: null }) };
  }

  // 第三步：检查通关用神
  tongguan = detectMediatingElement(bazi, sa);
  if (tongguan) {
    yongShen = [tongguan.element];
    if (strength === 'very_strong' || strength === 'strong') {
      xiShen = [officerElement, wealthElement, childElement].filter(el => el !== tongguan!.element);
      jiShen = [parentElement]; qiuShen = [siblingElement];
    } else if (strength === 'very_weak' || strength === 'weak') {
      xiShen = [parentElement, siblingElement].filter(el => el !== tongguan!.element);
      jiShen = [childElement, wealthElement].filter(el => el !== tongguan!.element);
      qiuShen = [officerElement].filter(el => el !== tongguan!.element);
    } else {
      xiShen = [parentElement].filter(el => el !== tongguan!.element);
      jiShen = [officerElement].filter(el => el !== tongguan!.element);
    }
    const layers = buildYongShenLayers({ sa, yongShen, xiShen, jiShen, pattern: null, tiaohuo, tongguan, balanceElement: xiShen[0] || yongShen[0] || null });
    return { ...sa, yongShen, xiShen, jiShen, qiuShen, ...layers, pattern: null, tiaohuo, tongguan,
      analysis: generateAnalysisText(sa, { yongShen, xiShen, jiShen, qiuShen, pattern: null, tiaohuo, tongguan }) };
  }

  // 第四步：基于日主强弱确定用神
  if (strength === 'very_strong' || strength === 'strong') {
    balanceElement = officerElement;
    yongShen = [officerElement, wealthElement];
    xiShen = [childElement];
    jiShen = [parentElement];
    qiuShen = [siblingElement];
  } else if (strength === 'very_weak' || strength === 'weak') {
    balanceElement = parentElement;
    yongShen = [parentElement];
    xiShen = [siblingElement];
    jiShen = [childElement, wealthElement];
    qiuShen = [officerElement];
  } else {
    balanceElement = parentElement;
    yongShen = [parentElement];
    xiShen = [siblingElement];
    jiShen = [officerElement];
    qiuShen = [wealthElement];
  }

  // 中优先级调候加入喜神
  if (tiaohuo && tiaohuo.priority === 'medium') {
    if (!yongShen.includes(tiaohuo.element) && !xiShen.includes(tiaohuo.element)) {
      xiShen = [tiaohuo.element, ...xiShen];
    }
  }

  const layers = buildYongShenLayers({ sa, yongShen, xiShen, jiShen, pattern, tiaohuo, tongguan, balanceElement });
  return { ...sa, yongShen, xiShen, jiShen, qiuShen, ...layers, pattern, tiaohuo, tongguan,
    analysis: generateAnalysisText(sa, { yongShen, xiShen, jiShen, qiuShen, pattern, tiaohuo, tongguan }) };
}

// ==================== 分析文本生成 ====================

function generateAnalysisText(sa: StrengthAnalysis, data: {
  yongShen: string[]; xiShen: string[]; jiShen: string[]; qiuShen: string[];
  pattern: PatternInfo | null; tiaohuo: TiaohouInfo | null; tongguan: TongguanInfo | null;
}): string {
  const { dayMaster, dayMasterElement, strengthDesc } = sa;
  const { yongShen, xiShen, jiShen, qiuShen, pattern, tiaohuo, tongguan } = data;

  let text = `日主${dayMaster}(${dayMasterElement})${strengthDesc}`;

  if (pattern) {
    text += `，成${pattern.pattern}。${pattern.description}`;
    return text;
  }

  if (tiaohuo && tiaohuo.priority === 'high') text += `，${tiaohuo.reason}`;
  if (tongguan) text += `，${tongguan.reason}`;

  text += `，用神取${yongShen.join('、')}`;
  if (xiShen.length > 0) text += `，喜${xiShen.join('、')}`;
  text += `，忌${jiShen.join('、')}`;
  if (qiuShen.length > 0) text += `，最忌${qiuShen.join('、')}`;

  if (tiaohuo && tiaohuo.priority === 'medium') text += `。${tiaohuo.note}`;

  return text;
}

// ==================== 十神分布分析 ====================

export interface PillarShiShen {
  pillarName: string;
  pillar: string;
  tianGan: string;
  diZhi: string;
  tianGanShiShen: string | null;
  cangGan: Array<{ gan: string; shiShen: string | null; type: string }>;
}

export type TenGodStructure = {
  dominantTenGod: { name: string; score: number; category: string; pillar?: string | null; visibility: '天干透出' | '地支藏干' | '混合透藏' } | null;
  categoryBalance: Array<{ category: string; score: number; percentage: number; gods: string[] }>;
  byPillar: Array<{ pillarName: string; pillar: string; tianGan: string | null; diZhiMain: string | null; hidden: string[] }>;
  byVisibility: {
    visible: Array<{ name: string; score: number }>;
    hidden: Array<{ name: string; score: number }>;
  };
  lifeDomains: Array<{ domain: 'career' | 'wealth' | 'relationship' | 'health' | 'growth'; driver: string; evidence: string[] }>;
  combinations: Array<{ name: string; type: 'opportunity' | 'risk' | 'mixed'; evidence: string[] }>;
  riskPatterns: Array<{ name: string; severity: 'high' | 'medium' | 'low'; evidence: string[] }>;
  opportunityPatterns: Array<{ name: string; strength: 'high' | 'medium' | 'low'; evidence: string[] }>;
  favorableSignals: string[];
  evidenceChain: string[];
};

const roundShiShenScore = (value: number) => Math.round(value * 10) / 10;
const shiShenScore = (count: Record<string, number>, name: string) => roundShiShenScore(count[name] || 0);
const shiShenCategoryScore = (count: Record<string, number>, category: string) => roundShiShenScore(
  Object.entries(count).reduce((sum, [god, score]) => sum + (SHISHEN_CATEGORY[god] === category ? Number(score) : 0), 0)
);
const scoreLevel = (score: number): 'high' | 'medium' | 'low' => score >= 2.4 ? 'high' : score >= 1.2 ? 'medium' : 'low';

const buildTenGodStructure = (pillarsAnalysis: PillarShiShen[], shiShenCount: Record<string, number>): TenGodStructure => {
  const visibleCount: Record<string, number> = {};
  const hiddenCount: Record<string, number> = {};
  const pillarHits: Record<string, string[]> = {};

  pillarsAnalysis.forEach((pillar) => {
    const visible = pillar.tianGanShiShen && pillar.tianGanShiShen !== '日主' ? pillar.tianGanShiShen : null;
    if (visible) {
      visibleCount[visible] = (visibleCount[visible] || 0) + 1;
      pillarHits[visible] = [...(pillarHits[visible] || []), `${pillar.pillarName}干`];
    }
    pillar.cangGan.forEach((hidden) => {
      if (!hidden.shiShen) return;
      const weight = hidden.type === '本气' ? 1 : hidden.type === '中气' ? 0.6 : 0.3;
      hiddenCount[hidden.shiShen] = (hiddenCount[hidden.shiShen] || 0) + weight;
      pillarHits[hidden.shiShen] = [...(pillarHits[hidden.shiShen] || []), `${pillar.pillarName}支${hidden.type}`];
    });
  });

  const ranked = Object.entries(shiShenCount)
    .map(([name, score]) => ({ name, score: roundShiShenScore(Number(score)), category: SHISHEN_CATEGORY[name] || '其他' }))
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name, 'zh-Hans-CN'));
  const total = ranked.reduce((sum, item) => sum + item.score, 0) || 1;
  const dominant = ranked[0] || null;
  const dominantVisibility = dominant
    ? visibleCount[dominant.name] && hiddenCount[dominant.name] ? '混合透藏' : visibleCount[dominant.name] ? '天干透出' : '地支藏干'
    : '地支藏干';

  const categoryBalance = ['比劫', '食伤', '财星', '官杀', '印星']
    .map((category) => {
      const gods = ranked.filter((item) => item.category === category).map((item) => item.name);
      const score = shiShenCategoryScore(shiShenCount, category);
      return { category, score, percentage: Math.round((score / total) * 100), gods };
    })
    .sort((a, b) => b.score - a.score || a.category.localeCompare(b.category, 'zh-Hans-CN'));

  const byPillar = pillarsAnalysis.map((pillar) => ({
    pillarName: pillar.pillarName,
    pillar: pillar.pillar,
    tianGan: pillar.tianGanShiShen,
    diZhiMain: pillar.cangGan[0]?.shiShen || null,
    hidden: pillar.cangGan.map((item) => `${item.gan}:${item.shiShen || '无'}:${item.type}`),
  }));

  const visible = Object.entries(visibleCount).map(([name, score]) => ({ name, score: roundShiShenScore(score) })).sort((a, b) => b.score - a.score || a.name.localeCompare(b.name, 'zh-Hans-CN'));
  const hidden = Object.entries(hiddenCount).map(([name, score]) => ({ name, score: roundShiShenScore(score) })).sort((a, b) => b.score - a.score || a.name.localeCompare(b.name, 'zh-Hans-CN'));
  const topCategory = categoryBalance[0];

  const careerEvidence = ['正官', '七杀', '正印', '偏印', '食神', '伤官'].filter((god) => shiShenScore(shiShenCount, god) > 0).map((god) => `${god}${shiShenScore(shiShenCount, god)}`);
  const wealthEvidence = ['正财', '偏财', '食神', '伤官', '比肩', '劫财'].filter((god) => shiShenScore(shiShenCount, god) > 0).map((god) => `${god}${shiShenScore(shiShenCount, god)}`);
  const relationshipEvidence = ['正官', '七杀', '正财', '偏财', '劫财', '伤官'].filter((god) => shiShenScore(shiShenCount, god) > 0).map((god) => `${god}${shiShenScore(shiShenCount, god)}`);
  const growthEvidence = ['正印', '偏印', '食神', '伤官'].filter((god) => shiShenScore(shiShenCount, god) > 0).map((god) => `${god}${shiShenScore(shiShenCount, god)}`);

  const lifeDomains: TenGodStructure['lifeDomains'] = [
    { domain: 'career', driver: careerEvidence.length ? '官杀定压力边界，印星定资质背书，食伤定输出方式。' : '事业侧十神信号偏弱，先看五行用忌和大运触发。', evidence: careerEvidence },
    { domain: 'wealth', driver: wealthEvidence.length ? '财星看资源与现金流，食伤看生财能力，比劫看分财与竞争。' : '财富侧十神信号偏弱，避免只凭单点财星判断。', evidence: wealthEvidence },
    { domain: 'relationship', driver: relationshipEvidence.length ? '配偶星、伤官与比劫共同决定关系张力。' : '关系侧十神信号偏弱，日支合冲优先级更高。', evidence: relationshipEvidence },
    { domain: 'growth', driver: growthEvidence.length ? '印星看学习吸收，食伤看表达产出。' : '成长侧缺少显性十神，靠阶段节奏补强。', evidence: growthEvidence },
  ];

  const combinations: TenGodStructure['combinations'] = [];
  if (shiShenScore(shiShenCount, '伤官') > 0 && shiShenScore(shiShenCount, '正官') > 0) combinations.push({ name: '伤官见官', type: 'risk', evidence: [`伤官${shiShenScore(shiShenCount, '伤官')}`, `正官${shiShenScore(shiShenCount, '正官')}`] });
  if (shiShenScore(shiShenCount, '食神') > 0 && shiShenScore(shiShenCount, '七杀') > 0) combinations.push({ name: '食神制杀', type: 'opportunity', evidence: [`食神${shiShenScore(shiShenCount, '食神')}`, `七杀${shiShenScore(shiShenCount, '七杀')}`] });
  if (shiShenCategoryScore(shiShenCount, '官杀') > 0 && shiShenCategoryScore(shiShenCount, '印星') > 0) combinations.push({ name: '杀印/官印相生', type: 'opportunity', evidence: [`官杀${shiShenCategoryScore(shiShenCount, '官杀')}`, `印星${shiShenCategoryScore(shiShenCount, '印星')}`] });
  if (shiShenCategoryScore(shiShenCount, '财星') > 0 && shiShenCategoryScore(shiShenCount, '官杀') > 0) combinations.push({ name: '财生官杀', type: 'opportunity', evidence: [`财星${shiShenCategoryScore(shiShenCount, '财星')}`, `官杀${shiShenCategoryScore(shiShenCount, '官杀')}`] });
  if (shiShenCategoryScore(shiShenCount, '财星') > 0 && shiShenCategoryScore(shiShenCount, '印星') > 0) combinations.push({ name: '财印相战', type: 'mixed', evidence: [`财星${shiShenCategoryScore(shiShenCount, '财星')}`, `印星${shiShenCategoryScore(shiShenCount, '印星')}`] });
  if (shiShenCategoryScore(shiShenCount, '比劫') > 0 && shiShenCategoryScore(shiShenCount, '财星') > 0) combinations.push({ name: '比劫夺财', type: 'risk', evidence: [`比劫${shiShenCategoryScore(shiShenCount, '比劫')}`, `财星${shiShenCategoryScore(shiShenCount, '财星')}`] });

  const riskPatterns = combinations
    .filter((item) => item.type === 'risk' || item.type === 'mixed')
    .map((item) => ({ name: item.name, severity: item.type === 'risk' && item.evidence.some((value) => Number(value.replace(/[^0-9.]/g, '')) >= 2) ? 'high' : 'medium', evidence: item.evidence })) as TenGodStructure['riskPatterns'];
  const opportunityPatterns = combinations
    .filter((item) => item.type === 'opportunity')
    .map((item) => ({ name: item.name, strength: scoreLevel(item.evidence.reduce((sum, value) => sum + Number(value.replace(/[^0-9.]/g, '') || 0), 0) / item.evidence.length), evidence: item.evidence })) as TenGodStructure['opportunityPatterns'];

  const favorableSignals = [
    dominant ? `主导十神：${dominant.name}${dominant.score}，${dominantVisibility}` : '',
    topCategory ? `主导类别：${topCategory.category}${topCategory.score}，占${topCategory.percentage}%` : '',
    opportunityPatterns[0] ? `机会组合：${opportunityPatterns[0].name}` : '',
  ].filter(Boolean);

  return {
    dominantTenGod: dominant ? { ...dominant, pillar: (pillarHits[dominant.name] || [null])[0], visibility: dominantVisibility as NonNullable<TenGodStructure['dominantTenGod']>['visibility'] } : null,
    categoryBalance,
    byPillar,
    byVisibility: { visible, hidden },
    lifeDomains,
    combinations,
    riskPatterns,
    opportunityPatterns,
    favorableSignals,
    evidenceChain: [
      dominant ? `十神第一权重为${dominant.name}${dominant.score}。` : '十神权重不足，不能生成主导判断。',
      topCategory ? `${topCategory.category}合计${topCategory.score}，占比${topCategory.percentage}%。` : '',
      combinations.length ? `结构组合：${combinations.map((item) => item.name).join('、')}。` : '未触发高优先级十神组合。',
    ].filter(Boolean),
  };
};

/**
 * 生成完整八字十神分析
 */
export function generateBaziShiShenAnalysis(bazi: string[]) {
  if (!bazi || bazi.length < 4) return null;
  const dayMaster = bazi[2]?.[0];
  if (!dayMaster) return null;

  const pillarNames = ['年', '月', '日', '时'];
  const pillarsAnalysis: PillarShiShen[] = bazi.map((pillar, idx) => {
    if (!pillar || pillar.length < 2) return null as any;
    const tianGan = pillar[0];
    const diZhi = pillar[1];
    const cangGan = getZhiCangGan(diZhi);
    return {
      pillarName: pillarNames[idx],
      pillar, tianGan, diZhi,
      tianGanShiShen: idx === 2 ? '日主' : calculateShiShen(dayMaster, tianGan),
      cangGan: cangGan.map((gan, i) => ({
        gan,
        shiShen: calculateShiShen(dayMaster, gan),
        type: i === 0 ? '本气' : i === 1 ? '中气' : '余气',
      })),
    };
  }).filter(Boolean);

  // 统计十神分布
  const shiShenCount: Record<string, number> = {};
  pillarsAnalysis.forEach(p => {
    if (p.tianGanShiShen && p.tianGanShiShen !== '日主') {
      shiShenCount[p.tianGanShiShen] = (shiShenCount[p.tianGanShiShen] || 0) + 1;
    }
    p.cangGan.forEach(c => {
      if (c.shiShen) {
        const weight = c.type === '本气' ? 1 : c.type === '中气' ? 0.6 : 0.3;
        shiShenCount[c.shiShen] = (shiShenCount[c.shiShen] || 0) + weight;
      }
    });
  });

  const dayMasterElement = GAN_TO_WUXING[dayMaster];
  const dayMasterYinYang = GAN_YIN_YANG[dayMaster] === 0 ? '阳' : '阴';
  const tenGodStructure = buildTenGodStructure(pillarsAnalysis, shiShenCount);

  return {
    dayMaster, dayMasterElement, dayMasterYinYang,
    dayMasterDesc: `${dayMasterYinYang}${dayMasterElement}`,
    pillarsAnalysis, shiShenCount, tenGodStructure,
  };
}

// ==================== 幸运元素推算 ====================

export function getLuckyElements(yongShenResult: YongShenResult) {
  const yong = yongShenResult.yongShen[0] || yongShenResult.dayMasterElement;
  return {
    colors: WUXING_COLOR[yong] || ['红色', '紫色'],
    directions: [WUXING_DIRECTION[yong] || '南'].concat(
      yongShenResult.xiShen.map(x => WUXING_DIRECTION[x]).filter(Boolean)
    ),
    numbers: WUXING_NUMBER[yong] || [1, 6],
  };
}

/**
 * 从四柱字符串数组计算神煞
 * @param bazi 四柱数组，每项为两字字符串，如 ['甲子', '丙寅', '戊午', '庚申']
 */
export function analyzeShenSha(bazi: string[]): ShenShaResult | null {
  if (bazi.length < 4) return null;
  const pillars = bazi.slice(0, 4).map(p => ({
    gan: p[0],
    zhi: p[1],
  }));
  if (pillars.some(p => !p.gan || !p.zhi)) return null;
  return calculateShenSha(pillars);
}
