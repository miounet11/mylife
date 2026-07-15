// ── 八字分析器 V6 ──

import {
  GAN_TO_WUXING,
  ZHI_CANG_GAN,
  calculateShiShen,
} from '@/lib/bazi-constants';
import type { ShenShaResult } from '@/lib/shensha-calculator';

export interface YongShenResult {
  dayMaster: string;
  dayMasterElement: string;
  strength: string;
  strengthDesc: string;
  score: number;
  yongShen: string[];
  xiShen: string[];
  jiShen: string[];
  qiuShen: string[];
  analysis: string;
  tiaohuo?: { element: string; reason: string; note: string };
  tongguan?: { element: string; reason: string; note: string };
  pattern?: { pattern: string; description: string };
  confidence?: { score: number; boundary?: string };
  threeGain?: { reasonChain: string[] };
  details: {
    helpStrength: number;
    drainStrength: number;
    seasonBonus: number;
  };
  priority: Array<{ element: string; reason: string }>;
}

const ELEMENTS = ['wood', 'fire', 'earth', 'metal', 'water'] as const;
type Element = (typeof ELEMENTS)[number];

const CN_TO_EN: Record<string, Element> = {
  '木': 'wood', '火': 'fire', '土': 'earth', '金': 'metal', '水': 'water',
};
const EN_TO_CN: Record<Element, string> = {
  wood: '木', fire: '火', earth: '土', metal: '金', water: '水',
};

const GENERATES: Record<Element, Element> = {
  wood: 'fire', fire: 'earth', earth: 'metal', metal: 'water', water: 'wood',
};
const CONTROLS: Record<Element, Element> = {
  wood: 'earth', earth: 'water', water: 'fire', fire: 'metal', metal: 'wood',
};

const GENERATED_BY: Record<Element, Element> = {
  wood: 'water', fire: 'wood', earth: 'fire', metal: 'earth', water: 'metal',
};
const CONTROLLED_BY: Record<Element, Element> = {
  wood: 'metal', fire: 'water', earth: 'wood', water: 'earth', metal: 'fire',
};

const PILLAR_LABELS = ['年柱', '月柱', '日柱', '时柱'];

/** 月令四季旺相休囚死 */
const SEASON_STATE: Record<string, Record<Element, number>> = {
  spring: { wood: 15, fire: 10, earth: -5, metal: 0, water: 5 },
  summer: { wood: 5, fire: 15, earth: 10, metal: -5, water: 0 },
  autumn: { wood: -5, fire: 0, earth: 5, metal: 15, water: 10 },
  winter: { wood: 10, fire: -5, earth: 0, metal: 5, water: 15 },
};

const MONTH_TO_SEASON: Record<string, keyof typeof SEASON_STATE> = {
  '寅': 'spring', '卯': 'spring', '辰': 'spring',
  '巳': 'summer', '午': 'summer', '未': 'summer',
  '申': 'autumn', '酉': 'autumn', '戌': 'autumn',
  '亥': 'winter', '子': 'winter', '丑': 'winter',
};

const ROOT_WEIGHTS = [12, 7, 4];
const HIDDEN_WEIGHTS = [1.0, 0.6, 0.35];
const STEM_WEIGHTS = { helpSame: 6, helpGenerate: 5, drainOutput: 4, drainWealth: 5, drainControl: 7 };

const TIAN_YI_GUI_REN: Record<string, string[]> = {
  '甲': ['丑', '未'], '戊': ['丑', '未'], '庚': ['丑', '未'],
  '乙': ['子', '申'], '己': ['子', '申'],
  '丙': ['亥', '酉'], '丁': ['亥', '酉'],
  '壬': ['卯', '巳'], '癸': ['卯', '巳'],
  '辛': ['寅', '午'],
};

const TAO_HUA: Record<string, string> = {
  '寅': '卯', '午': '卯', '戌': '卯',
  '申': '酉', '子': '酉', '辰': '酉',
  '亥': '子', '卯': '子', '未': '子',
  '巳': '午', '酉': '午', '丑': '午',
};

const YANG_REN: Record<string, string> = {
  '甲': '卯', '乙': '寅', '丙': '午', '丁': '巳',
  '戊': '午', '己': '巳', '庚': '酉', '辛': '申',
  '壬': '子', '癸': '亥',
};

const YI_MA: Record<string, string> = {
  '寅': '申', '午': '申', '戌': '申',
  '申': '寅', '子': '寅', '辰': '寅',
  '巳': '亥', '酉': '亥', '丑': '亥',
  '亥': '巳', '卯': '巳', '未': '巳',
};

const WEN_CHANG: Record<string, string> = {
  '甲': '巳', '乙': '午', '丙': '申', '丁': '酉',
  '戊': '申', '己': '酉', '庚': '亥', '辛': '子',
  '壬': '寅', '癸': '卯',
};

const LUCKY_COLORS: Record<Element, string[]> = {
  wood: ['绿色', '青色'], fire: ['红色', '紫色'], earth: ['黄色', '棕色'],
  metal: ['白色', '金色'], water: ['黑色', '蓝色'],
};
const LUCKY_DIRECTIONS: Record<Element, string> = {
  wood: '东方', fire: '南方', earth: '中央', metal: '西方', water: '北方',
};
const LUCKY_NUMBERS: Record<Element, number[]> = {
  wood: [3, 8], fire: [2, 7], earth: [5, 0], metal: [4, 9], water: [1, 6],
};

function parseBazi(bazi: string[]) {
  if (!bazi || bazi.length < 4) return null;
  const pillars = bazi.slice(0, 4).map((gz) => ({
    gan: gz[0] || '',
    zhi: gz[1] || '',
    ganZhi: gz,
  }));
  if (pillars.some((p) => !p.gan || !p.zhi)) return null;
  return pillars;
}

function toElement(gan: string): Element | null {
  const el = GAN_TO_WUXING[gan];
  return (el as Element) || null;
}

function uniqElements(elements: Element[]): Element[] {
  return [...new Set(elements)];
}

function getSeasonBonus(monthZhi: string, dmElement: Element): number {
  const season = MONTH_TO_SEASON[monthZhi] || 'spring';
  return SEASON_STATE[season][dmElement] || 0;
}

function calculateRootStrength(pillars: ReturnType<typeof parseBazi>, dmElement: Element): number {
  if (!pillars) return 0;
  let score = 0;
  pillars.forEach((pillar, idx) => {
    const hidden = ZHI_CANG_GAN[pillar.zhi] || [];
    hidden.forEach((gan, hIdx) => {
      if (toElement(gan) === dmElement) {
        const base = idx === 2 ? ROOT_WEIGHTS[0] : ROOT_WEIGHTS[Math.min(hIdx, 2)];
        score += base * HIDDEN_WEIGHTS[hIdx];
      }
    });
  });
  return score;
}

function calculateStemHelpDrain(
  pillars: ReturnType<typeof parseBazi>,
  dayMaster: string,
  dmElement: Element,
): { help: number; drain: number } {
  if (!pillars) return { help: 0, drain: 0 };
  let help = 0;
  let drain = 0;

  pillars.forEach((pillar, idx) => {
    if (idx === 2) return;
    const gan = pillar.gan;
    const el = toElement(gan);
    if (!el) return;

    if (el === dmElement) help += STEM_WEIGHTS.helpSame;
    else if (el === GENERATED_BY[dmElement]) help += STEM_WEIGHTS.helpGenerate;
    else if (el === GENERATES[dmElement]) drain += STEM_WEIGHTS.drainOutput;
    else if (el === CONTROLS[dmElement]) drain += STEM_WEIGHTS.drainWealth;
    else if (el === CONTROLLED_BY[dmElement]) drain += STEM_WEIGHTS.drainControl;
  });

  const dayStem = pillars[2].gan;
  if (dayStem !== dayMaster) {
    const el = toElement(dayStem);
    if (el === dmElement) help += STEM_WEIGHTS.helpSame * 0.5;
  }

  return { help, drain };
}

function calculateElementScores(bazi: string[]): Record<Element, number> {
  const pillars = parseBazi(bazi);
  const scores: Record<Element, number> = { wood: 0, fire: 0, earth: 0, metal: 0, water: 0 };
  if (!pillars) return scores;

  pillars.forEach((pillar, idx) => {
    const ganEl = toElement(pillar.gan);
    if (ganEl) scores[ganEl] += idx === 1 ? 12 : idx === 2 ? 10 : 8;

    const hidden = ZHI_CANG_GAN[pillar.zhi] || [];
    hidden.forEach((gan, hIdx) => {
      const el = toElement(gan);
      if (!el) return;
      const weight = (idx === 1 ? 10 : 8) * HIDDEN_WEIGHTS[hIdx];
      scores[el] += weight;
    });
  });

  return scores;
}

function normalizeElementScores(scores: Record<Element, number>): Record<Element, number> {
  const total = ELEMENTS.reduce((sum, el) => sum + scores[el], 0) || 1;
  const normalized: Record<Element, number> = { wood: 0, fire: 0, earth: 0, metal: 0, water: 0 };
  ELEMENTS.forEach((el) => { normalized[el] = (scores[el] / total) * 100; });
  return normalized;
}

function resolveStrengthLevel(score: number): { strength: string; strengthDesc: string } {
  if (score >= 72) return { strength: 'very_strong', strengthDesc: '身极旺' };
  if (score >= 58) return { strength: 'strong', strengthDesc: '身偏旺' };
  if (score >= 42) return { strength: 'neutral', strengthDesc: '中和' };
  if (score >= 28) return { strength: 'weak', strengthDesc: '身偏弱' };
  return { strength: 'very_weak', strengthDesc: '身极弱' };
}

function detectCongPattern(
  normalized: Record<Element, number>,
  dmElement: Element,
  strengthScore: number,
): { pattern: string; description: string } | null {
  const selfGroup = normalized[dmElement] + normalized[GENERATED_BY[dmElement]];
  const sorted = ELEMENTS.map((el) => ({ el, pct: normalized[el] })).sort((a, b) => b.pct - a.pct);
  const dominant = sorted[0];

  if (strengthScore >= 68 && selfGroup >= 55 && dominant.el === dmElement) {
    return {
      pattern: '从旺格',
      description: `${EN_TO_CN[dmElement]}气独旺，全局顺势而从，宜顺其旺势取用神。`,
    };
  }

  if (strengthScore >= 62 && selfGroup >= 50) {
    return {
      pattern: '从强格',
      description: `印比助身过旺，宜顺旺势，以泄耗为调节。`,
    };
  }

  if (strengthScore <= 32 && selfGroup <= 18) {
    const drainEl = sorted[0].el;
    const patternName = drainEl === CONTROLS[dmElement] ? '从财格'
      : drainEl === CONTROLLED_BY[dmElement] ? '从杀格'
        : drainEl === GENERATES[dmElement] ? '从儿格' : '从弱格';
    return {
      pattern: patternName,
      description: `日主${EN_TO_CN[dmElement]}极弱，${EN_TO_CN[drainEl]}势成主导，宜从势而行。`,
    };
  }

  if (strengthScore <= 38 && selfGroup <= 25) {
    return {
      pattern: '从弱格',
      description: `日主失令少根，全局克泄耗重，宜从顺势五行。`,
    };
  }

  return null;
}

function detectTiaohuo(monthZhi: string): YongShenResult['tiaohuo'] | undefined {
  const season = MONTH_TO_SEASON[monthZhi];
  if (season === 'winter') {
    return {
      element: 'fire',
      reason: '冬月水寒木冻，需火调候暖局',
      note: '优先见丙丁或南方火气，改善寒凝之弊',
    };
  }
  if (season === 'summer') {
    return {
      element: 'water',
      reason: '夏月火旺土燥，需水调候润局',
      note: '优先见壬癸或北方水气，缓解炎燥之弊',
    };
  }
  return undefined;
}

function detectTongguan(normalized: Record<Element, number>): YongShenResult['tongguan'] | undefined {
  const pairs: Array<{ a: Element; b: Element; bridge: Element; label: string }> = [
    { a: 'wood', b: 'earth', bridge: 'fire', label: '木土相战' },
    { a: 'earth', b: 'water', bridge: 'metal', label: '土水相战' },
    { a: 'water', b: 'fire', bridge: 'wood', label: '水火相战' },
    { a: 'fire', b: 'metal', bridge: 'earth', label: '火金相战' },
    { a: 'metal', b: 'wood', bridge: 'water', label: '金木相战' },
  ];

  for (const pair of pairs) {
    const scoreA = normalized[pair.a];
    const scoreB = normalized[pair.b];
    if (scoreA >= 22 && scoreB >= 22 && Math.abs(scoreA - scoreB) <= 12) {
      return {
        element: pair.bridge,
        reason: `${pair.label}，以${EN_TO_CN[pair.bridge]}通关`,
        note: `当${EN_TO_CN[pair.a]}与${EN_TO_CN[pair.b]}两旺相峙时，${EN_TO_CN[pair.bridge]}可化对峙为流通`,
      };
    }
  }
  return undefined;
}

function buildYongXiJiQiu(
  dmElement: Element,
  strength: string,
  pattern: { pattern: string; description: string } | null,
  normalized: Record<Element, number>,
  tiaohuo?: YongShenResult['tiaohuo'],
  tongguan?: YongShenResult['tongguan'],
): Pick<YongShenResult, 'yongShen' | 'xiShen' | 'jiShen' | 'qiuShen' | 'priority'> {
  let yong: Element[] = [];
  let xi: Element[] = [];
  let ji: Element[] = [];
  let qiu: Element[] = [];

  if (pattern?.pattern.includes('从旺') || pattern?.pattern === '从强格') {
    yong = [dmElement];
    xi = [GENERATES[dmElement]];
    ji = [CONTROLLED_BY[dmElement], CONTROLLED_BY[GENERATES[dmElement]]];
    qiu = [CONTROLLED_BY[dmElement]];
  } else if (pattern?.pattern.includes('从')) {
    const sorted = ELEMENTS.map((el) => ({ el, pct: normalized[el] })).sort((a, b) => b.pct - a.pct);
    const dominant = sorted[0].el;
    yong = [dominant];
    xi = [GENERATED_BY[dominant], GENERATES[dominant]].filter((el) => el !== dmElement);
    ji = [dmElement, GENERATED_BY[dmElement]];
    qiu = [GENERATED_BY[dmElement]];
  } else if (strength === 'very_strong' || strength === 'strong') {
    yong = uniqElements([CONTROLLED_BY[dmElement], CONTROLS[dmElement], GENERATES[dmElement]]);
    xi = uniqElements([CONTROLS[dmElement], GENERATES[dmElement]]);
    ji = uniqElements([dmElement, GENERATED_BY[dmElement]]);
    qiu = uniqElements([GENERATED_BY[dmElement], GENERATED_BY[GENERATED_BY[dmElement]]]);
  } else if (strength === 'very_weak' || strength === 'weak') {
    yong = uniqElements([GENERATED_BY[dmElement], dmElement]);
    xi = uniqElements([GENERATED_BY[dmElement], dmElement]);
    ji = uniqElements([GENERATES[dmElement], CONTROLS[dmElement], CONTROLLED_BY[dmElement]]);
    qiu = uniqElements([CONTROLS[dmElement], CONTROLLED_BY[dmElement]]);
  } else {
    const weakest = ELEMENTS.map((el) => ({ el, pct: normalized[el] })).sort((a, b) => a.pct - b.pct)[0].el;
    const strongest = ELEMENTS.map((el) => ({ el, pct: normalized[el] })).sort((a, b) => b.pct - a.pct)[0].el;
    yong = [weakest];
    xi = [weakest, GENERATED_BY[weakest]];
    ji = [strongest];
    qiu = [GENERATES[strongest]];
  }

  if (tiaohuo && !yong.includes(tiaohuo.element as Element)) {
    yong = uniqElements([tiaohuo.element as Element, ...yong]);
  }
  if (tongguan && !xi.includes(tongguan.element as Element)) {
    xi = uniqElements([tongguan.element as Element, ...xi]);
  }

  yong = yong.filter((el) => !ji.includes(el)).slice(0, 3);
  xi = xi.filter((el) => !ji.includes(el) && !yong.includes(el)).slice(0, 3);
  ji = ji.filter((el) => !yong.includes(el)).slice(0, 3);
  qiu = qiu.filter((el) => !yong.includes(el) && !xi.includes(el)).slice(0, 2);

  const priority = [
    ...yong.map((element) => ({ element, reason: '用神：扶抑/格局/调候主线' })),
    ...xi.map((element) => ({ element, reason: '喜神：辅助用神成势' })),
    ...ji.map((element) => ({ element, reason: '忌神：加重失衡' })),
    ...qiu.map((element) => ({ element, reason: '仇神：助忌伤用' })),
  ];

  return { yongShen: yong, xiShen: xi, jiShen: ji, qiuShen: qiu, priority };
}

function buildConfidence(score: number): YongShenResult['confidence'] {
  const distance = Math.abs(score - 50);
  const boundary = distance < 8 ? '日主强弱接近中和边界' : distance < 14 ? '日主强弱处于临界区间' : undefined;
  const clarity = Math.min(1, distance / 35);
  return {
    score: Math.round((0.45 + clarity * 0.55) * 100) / 100,
    boundary,
  };
}

function buildAnalysisText(
  dmElement: Element,
  strengthDesc: string,
  pattern: { pattern: string; description: string } | null,
  yong: Element[],
  ji: Element[],
): string {
  const parts = [
    `日主${EN_TO_CN[dmElement]}，${strengthDesc}`,
    pattern ? `格局为${pattern.pattern}` : '按正格扶抑取用',
    yong.length ? `用神取${yong.map((e) => EN_TO_CN[e]).join('、')}` : '',
    ji.length ? `忌神为${ji.map((e) => EN_TO_CN[e]).join('、')}` : '',
  ].filter(Boolean);
  return parts.join('；') + '。';
}

export function determineYongShen(bazi: string[]): YongShenResult | null {
  const pillars = parseBazi(bazi);
  if (!pillars) return null;

  const dayMaster = pillars[2].gan;
  const dmElement = toElement(dayMaster);
  if (!dmElement) return null;

  const monthZhi = pillars[1].zhi;
  const seasonBonus = getSeasonBonus(monthZhi, dmElement);
  const rootStrength = calculateRootStrength(pillars, dmElement);
  const { help, drain } = calculateStemHelpDrain(pillars, dayMaster, dmElement);

  const rawScore = 50 + seasonBonus + rootStrength + help - drain;
  const score = Math.max(5, Math.min(95, Math.round(rawScore)));
  const { strength, strengthDesc } = resolveStrengthLevel(score);

  const elementScores = calculateElementScores(bazi);
  const normalized = normalizeElementScores(elementScores);
  const pattern = detectCongPattern(normalized, dmElement, score);
  const tiaohuo = detectTiaohuo(monthZhi);
  const tongguan = detectTongguan(normalized);
  const { yongShen, xiShen, jiShen, qiuShen, priority } = buildYongXiJiQiu(
    dmElement, strength, pattern, normalized, tiaohuo, tongguan,
  );

  const confidence = buildConfidence(score);
  const threeGain: YongShenResult['threeGain'] = {
    reasonChain: [
      `月令${monthZhi}令，季节加成${seasonBonus > 0 ? '+' : ''}${seasonBonus}`,
      `通根${Math.round(rootStrength)}，天干帮扶${help}、克泄${drain}`,
      tiaohuo ? `调候：${tiaohuo.reason}` : '调候需求不显',
      tongguan ? `通关：${tongguan.reason}` : '无明显两神交战',
      `综合取用：${yongShen.map((e) => EN_TO_CN[e as Element]).join('、')}`,
    ],
  };

  return {
    dayMaster,
    dayMasterElement: EN_TO_CN[dmElement],
    strength,
    strengthDesc,
    score,
    yongShen,
    xiShen,
    jiShen,
    qiuShen,
    analysis: buildAnalysisText(dmElement, strengthDesc, pattern, yongShen as Element[], jiShen as Element[]),
    tiaohuo,
    tongguan,
    pattern: pattern || { pattern: '正格', description: '日主强弱适中，按扶抑、调候、通关综合取用。' },
    confidence,
    threeGain,
    details: {
      helpStrength: Math.round(help * 10) / 10,
      drainStrength: Math.round(drain * 10) / 10,
      seasonBonus,
    },
    priority,
  };
}

export function generateBaziShiShenAnalysis(bazi: string[]) {
  const pillars = parseBazi(bazi);
  const empty = {
    tenGodStructure: {
      self: '',
      output: [] as string[],
      wealth: [] as string[],
      input: [] as string[],
      control: [] as string[],
      controlled: [] as string[],
      lifeDomains: [] as Array<{ domain: string; driver: string; evidence: string[] }>,
      riskPatterns: [] as Array<{ name: string; note: string }>,
      opportunityPatterns: [] as Array<{ name: string; note: string }>,
      evidenceChain: [] as string[],
      byPillar: [] as Array<{ pillar: string; stem: string; branch: string; shiShen: string }>,
    },
    shiShenCount: {} as Record<string, number>,
    pillarsAnalysis: [] as Array<{ pillar: string; ganZhi: string; tianGanShiShen: string; branchShiShen: string[] }>,
  };

  if (!pillars) return empty;

  const dayMaster = pillars[2].gan;
  const shiShenCount: Record<string, number> = {};
  const pillarsAnalysis: typeof empty.pillarsAnalysis = [];
  const byPillar: typeof empty.tenGodStructure.byPillar = [];

  const output: string[] = [];
  const wealth: string[] = [];
  const input: string[] = [];
  const control: string[] = [];
  const controlled: string[] = [];

  const addGod = (name: string | null, weight = 1) => {
    if (!name) return;
    shiShenCount[name] = (shiShenCount[name] || 0) + weight;
    if (name === '正印' || name === '偏印') output.push(name);
    else if (name === '正财' || name === '偏财') input.push(name);
    else if (name === '正官' || name === '七杀') control.push(name);
    else if (name === '食神' || name === '伤官') controlled.push(name);
    else if (name === '比肩' || name === '劫财') wealth.push(name);
  };

  pillars.forEach((pillar, idx) => {
    const stemGod = idx === 2 ? '日主' : calculateShiShen(dayMaster, pillar.gan);
    const branchGods = (ZHI_CANG_GAN[pillar.zhi] || [])
      .map((gan) => calculateShiShen(dayMaster, gan))
      .filter((g): g is string => Boolean(g));

    if (idx !== 2) addGod(stemGod, 1.2);
    branchGods.forEach((g, hIdx) => addGod(g, hIdx === 0 ? 1 : 0.6));

    pillarsAnalysis.push({
      pillar: PILLAR_LABELS[idx],
      ganZhi: pillar.ganZhi,
      tianGanShiShen: stemGod || '',
      branchShiShen: branchGods,
    });

    byPillar.push({
      pillar: PILLAR_LABELS[idx],
      stem: pillar.gan,
      branch: pillar.zhi,
      shiShen: stemGod || '',
    });
  });

  const dominant = Object.entries(shiShenCount).sort((a, b) => b[1] - a[1])[0]?.[0] || '';
  const riskPatterns: Array<{ name: string; note: string }> = [];
  const opportunityPatterns: Array<{ name: string; note: string }> = [];

  if ((shiShenCount['伤官'] || 0) > 0 && (shiShenCount['正官'] || 0) > 0) {
    riskPatterns.push({ name: '伤官见官', note: '表达、规则与职位压力并存，注意分寸。' });
  }
  if ((shiShenCount['劫财'] || 0) >= 1.5 && (shiShenCount['正财'] || 0) > 0) {
    riskPatterns.push({ name: '比劫夺财', note: '合作与现金流边界需提前约定。' });
  }
  if ((shiShenCount['正印'] || 0) > 0 && (shiShenCount['正财'] || 0) > 0) {
    riskPatterns.push({ name: '财印相战', note: '现实收益与长期投入容易互相挤压。' });
  }
  if ((shiShenCount['食神'] || 0) > 0 || (shiShenCount['伤官'] || 0) > 0) {
    opportunityPatterns.push({ name: '食伤泄秀', note: '适合表达、作品与长期输出。' });
  }
  if ((shiShenCount['正财'] || 0) > 0 || (shiShenCount['偏财'] || 0) > 0) {
    opportunityPatterns.push({ name: '财星得用', note: '机会捕捉与资源配置能力可放大。' });
  }

  const lifeDomains = [
    {
      domain: 'career',
      driver: control.length ? `官杀${[...new Set(control)].join('、')}主导事业压力与职位` : '事业看月柱、官杀与印星结构',
      evidence: [...new Set(control), ...new Set(output)].slice(0, 4),
    },
    {
      domain: 'wealth',
      driver: input.length ? `财星${[...new Set(input)].join('、')}主资源与现金流` : '财富看财星、食伤生财与比劫分财',
      evidence: [...new Set(input), ...new Set(controlled)].slice(0, 4),
    },
    {
      domain: 'relationship',
      driver: '婚恋看日支、配偶星与合冲刑害',
      evidence: [...new Set([...input, ...control])].slice(0, 3),
    },
    {
      domain: 'growth',
      driver: output.length ? `印星${[...new Set(output)].join('、')}主学习恢复与底层能量` : '成长看印星、根气与调候',
      evidence: [...new Set(output)].slice(0, 3),
    },
  ];

  const evidenceChain = [
    `月令十神：${pillarsAnalysis[1]?.tianGanShiShen || '未知'}`,
    `时柱十神：${pillarsAnalysis[3]?.tianGanShiShen || '未知'}`,
    dominant ? `最显十神：${dominant}` : '',
    riskPatterns[0] ? `风险：${riskPatterns[0].name}` : '',
    opportunityPatterns[0] ? `机会：${opportunityPatterns[0].name}` : '',
  ].filter(Boolean);

  return {
    tenGodStructure: {
      self: dayMaster,
      output: [...new Set(output)],
      wealth: [...new Set(wealth)],
      input: [...new Set(input)],
      control: [...new Set(control)],
      controlled: [...new Set(controlled)],
      lifeDomains,
      riskPatterns,
      opportunityPatterns,
      evidenceChain,
      byPillar,
    },
    shiShenCount,
    pillarsAnalysis,
  };
}

export function getLuckyElements(yongShen: YongShenResult) {
  const primary = (yongShen.yongShen[0] as Element) || 'fire';
  const secondary = (yongShen.xiShen[0] as Element) || primary;

  return {
    colors: [...new Set([...LUCKY_COLORS[primary], ...LUCKY_COLORS[secondary]])].slice(0, 4),
    directions: [...new Set([LUCKY_DIRECTIONS[primary], LUCKY_DIRECTIONS[secondary]])],
    numbers: [...new Set([...LUCKY_NUMBERS[primary], ...LUCKY_NUMBERS[secondary]])].slice(0, 4),
    yongShen: yongShen.yongShen,
    jiShen: yongShen.jiShen,
    xiShen: yongShen.xiShen,
  };
}

export function calculateWuxingStrength(bazi: string[], element: string): number {
  const enElement = CN_TO_EN[element] || (ELEMENTS.includes(element as Element) ? element as Element : null);
  if (!enElement) return 0;

  const scores = calculateElementScores(bazi);
  const total = ELEMENTS.reduce((sum, el) => sum + scores[el], 0) || 1;
  return Math.round((scores[enElement] / total) * 1000) / 10;
}

export function analyzeShenSha(bazi: string[]): ShenShaResult | null {
  const pillars = parseBazi(bazi);
  if (!pillars) return null;

  const dayMaster = pillars[2].gan;
  const dayBranch = pillars[2].zhi;
  const yearBranch = pillars[0].zhi;
  const list: ShenShaResult['list'] = [];

  const allBranches = pillars.map((p, idx) => ({ zhi: p.zhi, label: PILLAR_LABELS[idx] }));

  const tianYi = TIAN_YI_GUI_REN[dayMaster] || [];
  allBranches.forEach(({ zhi, label }) => {
    if (tianYi.includes(zhi)) {
      list.push({ name: '天乙贵人', pillar: label, description: `${zhi}为${dayMaster}日贵人位` });
    }
  });

  const peachTarget = TAO_HUA[dayBranch] || TAO_HUA[yearBranch];
  if (peachTarget) {
    allBranches.forEach(({ zhi, label }) => {
      if (zhi === peachTarget) {
        list.push({ name: '桃花', pillar: label, description: '人缘、魅力与关系机缘增强' });
      }
    });
  }

  const yangRen = YANG_REN[dayMaster];
  if (yangRen) {
    allBranches.forEach(({ zhi, label }) => {
      if (zhi === yangRen) {
        list.push({ name: '羊刃', pillar: label, description: '魄力与风险并存，注意冲动与外伤' });
      }
    });
  }

  const yiMa = YI_MA[yearBranch] || YI_MA[dayBranch];
  if (yiMa) {
    allBranches.forEach(({ zhi, label }) => {
      if (zhi === yiMa) {
        list.push({ name: '驿马', pillar: label, description: '变动、出行与跨域机会' });
      }
    });
  }

  const wenChang = WEN_CHANG[dayMaster];
  if (wenChang) {
    allBranches.forEach(({ zhi, label }) => {
      if (zhi === wenChang) {
        list.push({ name: '文昌', pillar: label, description: '学习、考试与表达力提升' });
      }
    });
  }

  return { list };
}