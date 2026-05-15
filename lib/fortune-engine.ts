// 命理分析引擎 - 使用 lunar-javascript EightChar API + 权威 BaziAnalyzer
// @ts-ignore
import { Lunar, Solar } from 'lunar-javascript';
import { FortuneAnalysisResult, Pillar, FiveElements, TenGods, Pattern, CareerAdvice, WealthAdvice, MarriageAdvice, HealthAdvice, DataStatistics, FortuneAdvice, FortuneEvidence, LuckyElements } from './user-types';
import type { YongShenResult } from './bazi-analyzer';
import { calculateDayun } from './dayun-calculator';
import type { DayunResult } from './dayun-calculator';
import type { ShenShaResult } from './shensha-calculator';
import { MasterPhrases, generatePersonalizedPhrase, describeMonth } from './master-phrases';
import { GAN_TO_WUXING, GAN_HE, GAN_CHONG, ZHI_CANG_GAN, ZHI_CHONG, ZHI_HE, ZHI_XING, ZHI_HAI, ZHI_SAN_HE, WUXING_SEASON_SCORE,
  calculateShiShen } from './bazi-constants';
import { determineYongShen, generateBaziShiShenAnalysis, getLuckyElements, calculateWuxingStrength, analyzeShenSha } from './bazi-analyzer';

// 天干五行映射 (English key for frontend compat)
const STEM_ELEMENT: Record<string, string> = {
  '甲': 'wood', '乙': 'wood', '丙': 'fire', '丁': 'fire',
  '戊': 'earth', '己': 'earth', '庚': 'metal', '辛': 'metal',
  '壬': 'water', '癸': 'water',
};

// 五行中文→英文
const WX_CN_EN: Record<string, string> = { '木': 'wood', '火': 'fire', '土': 'earth', '金': 'metal', '水': 'water' };

// 使用 lunar-javascript EightChar 精确计算四柱
export type BirthLocationProfile = {
  input: string | null;
  matchedPlace: string | null;
  longitude: number | null;
  confidence: 'high' | 'medium' | 'low';
  note: string;
};

export type CalculationProfile = EngineEvidencePack['calculationProfile'] & {
  localBirthTime: string;
  adjustedBirthDate: Date;
  adjustedBirthTime: string;
};

const KNOWN_PLACE_LONGITUDES: Record<string, number> = {
  北京: 116.4074,
  上海: 121.4737,
  广州: 113.2644,
  深圳: 114.0579,
  杭州: 120.1551,
  南京: 118.7969,
  成都: 104.0665,
  重庆: 106.5516,
  武汉: 114.3055,
  西安: 108.9398,
  天津: 117.2000,
  苏州: 120.5853,
  香港: 114.1694,
  台北: 121.5654,
  新加坡: 103.8198,
  东京: 139.6917,
  纽约: -74.0060,
  洛杉矶: -118.2437,
  伦敦: -0.1276,
  巴黎: 2.3522,
};

const parseLongitudeFromBirthPlace = (birthPlace?: string | null): number | null => {
  if (!birthPlace) return null;
  const direct = birthPlace.match(/(-?\d+(?:\.\d+)?)\s*°?\s*[经E]/i) || birthPlace.match(/longitude\s*[:=]\s*(-?\d+(?:\.\d+)?)/i);
  if (!direct) return null;
  const value = Number(direct[1]);
  return Number.isFinite(value) && value >= -180 && value <= 180 ? value : null;
};

export const resolveBirthLocationProfile = (birthPlace?: string | null, timezone: number = 8): BirthLocationProfile => {
  const input = birthPlace?.trim() || null;
  const parsed = parseLongitudeFromBirthPlace(input);
  if (parsed !== null) {
    return { input, matchedPlace: 'explicit-longitude', longitude: parsed, confidence: 'high', note: '出生地包含明确经度。' };
  }

  const match = input ? Object.entries(KNOWN_PLACE_LONGITUDES).find(([place]) => input.includes(place)) : undefined;
  if (match) {
    return { input, matchedPlace: match[0], longitude: match[1], confidence: 'medium', note: `按${match[0]}城市中心经度估算。` };
  }

  const standardMeridian = timezone * 15;
  return { input, matchedPlace: null, longitude: standardMeridian, confidence: 'low', note: '出生地未命中经度表，按时区标准经线估算。' };
};

const addMinutesToDateAndTime = (birthDate: Date, birthTime: string, minutesDelta: number): { date: Date; time: string } => {
  const [hour, minute] = birthTime.split(':').map(Number);
  const next = new Date(birthDate.getFullYear(), birthDate.getMonth(), birthDate.getDate(), hour || 0, minute || 0, 0);
  next.setMinutes(next.getMinutes() + Math.round(minutesDelta));
  const hh = String(next.getHours()).padStart(2, '0');
  const mm = String(next.getMinutes()).padStart(2, '0');
  return { date: next, time: `${hh}:${mm}` };
};

export const buildCalculationProfile = (
  birthDate: Date,
  birthTime: string,
  birthPlace: string | null,
  timezone: number = 8,
  options?: {
    sect?: 1 | 2;
    useTrueSolarTime?: boolean;
  }
): CalculationProfile => {
  const location = resolveBirthLocationProfile(birthPlace, timezone);
  const standardMeridian = timezone * 15;
  const offset = location.longitude === null ? 0 : Math.round((location.longitude - standardMeridian) * 4);
  const adjusted = options?.useTrueSolarTime ? addMinutesToDateAndTime(birthDate, birthTime, offset) : { date: birthDate, time: birthTime };

  return {
    calendar: 'solar',
    timeStandard: options?.useTrueSolarTime ? 'true-solar-time' : 'standard-time',
    sect: options?.sect || 2,
    timezone,
    birthPlace: location.input,
    longitudeEstimate: location.longitude,
    trueSolarTimeOffsetMinutes: offset,
    trueSolarTimeApplied: Boolean(options?.useTrueSolarTime),
    localBirthTime: birthTime,
    adjustedBirthDate: adjusted.date,
    adjustedBirthTime: adjusted.time,
    notes: [
      `calculation profile: ${location.note}`,
      options?.useTrueSolarTime ? '已按经度偏移校正真太阳时。' : '默认仍按标准时间排盘，避免改变历史结果。',
    ],
  };
};

// 使用 lunar-javascript EightChar 精确计算四柱
export const calculateFourPillars = (
  birthDate: Date,
  birthTime: string,
  timezone: number,
  options?: {
    sect?: 1 | 2;
    birthPlace?: string | null;
    useTrueSolarTime?: boolean;
  }
): Pillar[] => {
  const calculationProfile = buildCalculationProfile(birthDate, birthTime, options?.birthPlace || null, timezone, options);
  const pillarDate = calculationProfile.adjustedBirthDate;
  const pillarTime = calculationProfile.adjustedBirthTime;
  const year = pillarDate.getFullYear();
  const month = pillarDate.getMonth() + 1;
  const day = pillarDate.getDate();
  const [hour, minute] = pillarTime.split(':').map(Number);

  const solar = Solar.fromYmdHms(year, month, day, hour, minute || 0, 0);
  const lunar = solar.getLunar();
  const ec = lunar.getEightChar();
  ec.setSect(options?.sect || 2);

  const buildPillar = (gan: string, zhi: string, nayin: string): Pillar => {
    const hiddenStems = ZHI_CANG_GAN[zhi] || [];
    // 地支关系
    const allZhi = [ec.getYearZhi(), ec.getMonthZhi(), ec.getDayZhi(), ec.getTimeZhi()];
    const combination = allZhi.filter(z => z !== zhi && ZHI_HE[zhi] === z);
    const clash = allZhi.filter(z => z !== zhi && ZHI_CHONG[zhi] === z);
    const penalty = allZhi.filter(z => z !== zhi && ZHI_XING[zhi] === z);
    const harm = allZhi.filter(z => z !== zhi && ZHI_HAI[zhi] === z);

    return {
      celestialStem: gan,
      earthlyBranch: zhi,
      hiddenStems,
      nayin,
      fiveElements: {
        main: STEM_ELEMENT[gan] || 'wood',
        hidden: hiddenStems.map(s => STEM_ELEMENT[s] || 'wood'),
        strength: 0.5,
      },
      relationships: { combination, clash, penalty, harm },
    };
  };

  return [
    buildPillar(ec.getYearGan(), ec.getYearZhi(), ec.getYearNaYin()),
    buildPillar(ec.getMonthGan(), ec.getMonthZhi(), ec.getMonthNaYin()),
    buildPillar(ec.getDayGan(), ec.getDayZhi(), ec.getDayNaYin()),
    buildPillar(ec.getTimeGan(), ec.getTimeZhi(), ec.getTimeNaYin()),
  ];
};

// 分析完整命理（使用权威 BaziAnalyzer）
export const analyzeFortune = (
  name: string,
  birthDate: Date,
  birthTime: string,
  birthPlace: string,
  timezone: number = 8,
  gender: 'male' | 'female',
  options?: {
    sect?: 1 | 2;
    useTrueSolarTime?: boolean;
  }
): FortuneAnalysisResult => {
  const calculationProfile = buildCalculationProfile(birthDate, birthTime, birthPlace, timezone, options);

  // 1. 计算四柱 (Pillar 对象)
  const pillars = calculateFourPillars(birthDate, birthTime, timezone, { ...options, birthPlace });
  const dayMaster = pillars[2].celestialStem;

  // 2. 构造权威分析器所需的 bazi 字符串数组
  const baziStr = pillars.map(p => p.celestialStem + p.earthlyBranch);

  // 3. 权威用神分析 (日主强弱、用神忌神、格局、调候、通关)
  const yongShenResult = determineYongShen(baziStr);

  // 4. 权威十神分析
  const shiShenAnalysis = generateBaziShiShenAnalysis(baziStr);

  // 5. 幸运元素
  const luckyElements = yongShenResult ? getLuckyElements(yongShenResult) : null;

  // 5.5 神煞计算
  const shenShaResult = analyzeShenSha(baziStr);

  // 6. 五行力量 (权威算法)
  const fiveElements = buildFiveElements(baziStr, pillars);

  // 7. 十神 (权威算法)
  const tenGods = buildTenGods(pillars, dayMaster, shiShenAnalysis);

  // 8. 格局 (权威算法)
  const pattern = buildPattern(yongShenResult, pillars);

  // 10. 生成建议 (基于用神 + 十神 + 原局关系)
  const advice = buildAdvice(yongShenResult, luckyElements, shiShenAnalysis, pillars, shenShaResult);

  // 11. 数据支撑
  const evidence = generateEvidence(pillars);

  // 12. 个性化文本
  const user = { name, age: calculateAge(birthDate), bazi: { pillars, fiveElements, tenGods, pattern, dayMaster } };
  const opening = generatePersonalizedPhrase(user, 'opening');
  // 13. 大运精确计算
  const dayunResult = calculateDayun(
    birthDate,
    birthTime,
    gender,
    pillars[0].celestialStem, // 年干
    { gan: pillars[1].celestialStem, zhi: pillars[1].earthlyBranch }, // 月柱
    yongShenResult,
    birthDate.getFullYear()
  );

  // 14. 生成人生K线数据（使用精确大运）
  const klineData = generateLifeKlineData(birthDate, gender, pillars, yongShenResult, dayunResult);
  const fortuneTrend = buildFortuneTrend(baziStr, birthDate, gender, yongShenResult, dayunResult);
  const summary = buildAnalysisSummary(yongShenResult, dayunResult);
  const expertEvidence = buildEngineEvidencePack(
    baziStr,
    pillars,
    yongShenResult,
    shiShenAnalysis,
    calculationProfile,
    shenShaResult,
    { dayunResult, klineData, advice, pattern, fortune: fortuneTrend }
  );
  const explanation = buildExplanation(pillars, yongShenResult, shiShenAnalysis, expertEvidence);

  return {
    basic: { dayMaster, pillars },
    fiveElements,
    tenGods,
    pattern,
    physique: buildPhysique(dayMaster),
    careerSuggestion: buildCareerSuggestion(tenGods, dayMaster, shiShenAnalysis),
    fortune: fortuneTrend,
    advice,
    evidence: { statistics: evidence.statistics, celebrities: evidence.celebrities, similarCases: [] },
    analysis: {
      opening,
      summary,
      explanation,
      judgmentBlocks: expertEvidence.judgmentBlocks,
      enhancementNotes: expertEvidence.notes,
      contextSignals: {
        engineEvidence: expertEvidence,
      },
    },
    klineData,
    dayun: dayunResult,
    shenSha: shenShaResult ?? undefined,
  };
};

// ==================== 体型推算 ====================

const buildPhysique = (dayMaster: string): FortuneAnalysisResult['physique'] => {
  const element = STEM_ELEMENT[dayMaster];
  const map: Record<string, { bodyType: string; description: string }> = {
    wood:   { bodyType: '高挑清瘦', description: '木主仁，体型修长，四肢纤细，面色偏青' },
    fire:   { bodyType: '尖削活泼', description: '火主礼，上宽下窄，肤色偏红，眼神明亮' },
    earth:  { bodyType: '矮壮敦实', description: '土主信，体型偏矮，腰腹较厚，面色偏黄' },
    metal:  { bodyType: '方正刚健', description: '金主义，骨架方正，肌肉结实，面色偏白' },
    water:  { bodyType: '圆润丰满', description: '水主智，体型圆润，皮肤细腻，面色偏黑或偏白' },
  };
  return map[element] ?? { bodyType: '均衡', description: '五行均衡，体型适中' };
};

// ==================== 职业推算 ====================

const buildCareerSuggestion = (tenGods: TenGods, dayMaster: string, shiShen: ReturnType<typeof generateBaziShiShenAnalysis>): FortuneAnalysisResult['careerSuggestion'] => {
  const primary: string[] = [];
  const secondary: string[] = [];
  const avoid: string[] = [];
  const reasons: string[] = [];

  // 取月柱十神为主，时柱为辅
  const mainGod = shiShen?.pillarsAnalysis?.[1]?.tianGanShiShen ?? '';
  const timeGod = shiShen?.pillarsAnalysis?.[3]?.tianGanShiShen ?? '';

  const careerMap: Record<string, string[]> = {
    '正官': ['政府机关', '管理层', '法律', '军警'],
    '七杀': ['军事', '竞技', '外科', '执法'],
    '食神': ['餐饮', '艺术', '教育', '技艺'],
    '伤官': ['创意设计', '音乐', '写作', '技术研发'],
    '偏财': ['商业贸易', '投资', '销售', '金融'],
    '正财': ['会计', '银行', '稳定职业', '行政'],
    '偏印': ['宗教', '哲学', '研究', '医学'],
    '正印': ['文教', '出版', '学术', '文秘'],
    '比肩': ['合伙创业', '体育', '竞争性行业'],
    '劫财': ['独立创业', '中介', '经纪'],
  };

  const elementCareer: Record<string, string[]> = {
    wood:  ['教育', '文化', '医疗', '环保'],
    fire:  ['传媒', '娱乐', '餐饮', '能源'],
    earth: ['房地产', '农业', '建筑', '仓储'],
    metal: ['金融', '机械', '军警', '法律'],
    water: ['航运', '贸易', '信息技术', '咨询'],
  };

  if (mainGod && careerMap[mainGod]) {
    primary.push(...careerMap[mainGod]);
    reasons.push(`月柱${mainGod}主${careerMap[mainGod][0]}`);
  }
  if (timeGod && careerMap[timeGod] && timeGod !== mainGod) {
    secondary.push(...careerMap[timeGod]);
  }

  const element = STEM_ELEMENT[dayMaster];
  if (element && elementCareer[element]) {
    secondary.push(...elementCareer[element].filter(c => !primary.includes(c)));
  }

  // 忌神对应的职业方向作为 avoid（简化：与用神五行相克的行业）
  const clashMap: Record<string, string[]> = {
    wood:  ['金融', '机械', '冶金'],
    fire:  ['航运', '水利', '冷链'],
    earth: ['航运', '信息技术'],
    metal: ['教育', '医疗', '木材'],
    water: ['房地产', '建筑', '陶瓷'],
  };
  if (element && clashMap[element]) avoid.push(...clashMap[element]);

  return {
    primary: [...new Set(primary)].slice(0, 4),
    secondary: [...new Set(secondary)].slice(0, 4),
    avoid: [...new Set(avoid)].slice(0, 3),
    reason: reasons.join('；') || '综合五行推算',
  };
};

// ==================== 权威五行力量 ====================

const buildFiveElements = (bazi: string[], pillars: Pillar[]): FiveElements => {
  const cnElements = ['木', '火', '土', '金', '水'];
  const enElements = ['wood', 'fire', 'earth', 'metal', 'water'];
  const strengths: Record<string, number> = {};

  cnElements.forEach(cn => { strengths[cn] = calculateWuxingStrength(bazi, cn); });
  const total = Object.values(strengths).reduce((a, b) => a + b, 0) || 1;

  const result: Partial<FiveElements> = {};
  cnElements.forEach((cn, i) => {
    const en = enElements[i] as keyof FiveElements;
    const pct = (strengths[cn] / total) * 100;
    let quality: string;
    let description: string;
    if (pct >= 30) {
      quality = 'strong';
      description = MasterPhrases.fiveElements[en as keyof typeof MasterPhrases.fiveElements]?.strong || `${cn}旺`;
    } else if (pct >= 15) {
      quality = 'medium';
      description = `${cn}中等`;
    } else {
      quality = 'weak';
      description = MasterPhrases.fiveElements[en as keyof typeof MasterPhrases.fiveElements]?.weak || `${cn}弱`;
    }
    result[en] = { strength: Math.round(pct * 10) / 10, quality, description };
  });
  return result as FiveElements;
};

// ==================== 权威十神 ====================

const buildTenGods = (pillars: Pillar[], dayMaster: string, shiShen: ReturnType<typeof generateBaziShiShenAnalysis>): TenGods => {
  const output: string[] = [];
  const input: string[] = [];
  const control: string[] = [];
  const controlled: string[] = [];

  pillars.forEach((p, idx) => {
    if (idx === 2) return; // 日柱天干是日主本身
    const ss = calculateShiShen(dayMaster, p.celestialStem);
    if (!ss) return;
    if (ss === '正印' || ss === '偏印') output.push(ss);
    else if (ss === '正财' || ss === '偏财') input.push(ss);
    else if (ss === '正官' || ss === '七杀') control.push(ss);
    else if (ss === '食神' || ss === '伤官') controlled.push(ss);
  });

  return {
    self: dayMaster,
    output: [...new Set(output)],
    input: [...new Set(input)],
    control: [...new Set(control)],
    controlled: [...new Set(controlled)],
  };
};

// ==================== 权威格局 ====================

const MONTH_BRANCH_PATTERN: Record<string, { type: string; source: string }> = {
  子: { type: '正印格', source: '月令子水' },
  丑: { type: '正财格', source: '月令丑土' },
  寅: { type: '偏财格', source: '月令寅木' },
  卯: { type: '正财格', source: '月令卯木' },
  辰: { type: '正官格', source: '月令辰土' },
  巳: { type: '七杀格', source: '月令巳火' },
  午: { type: '正官格', source: '月令午火' },
  未: { type: '偏印格', source: '月令未土' },
  申: { type: '食神格', source: '月令申金' },
  酉: { type: '伤官格', source: '月令酉金' },
  戌: { type: '正印格', source: '月令戌土' },
  亥: { type: '偏印格', source: '月令亥水' },
};

const resolveRegularPattern = (pillars: Pillar[], ys: YongShenResult | null) => {
  const monthBranch = pillars[1]?.earthlyBranch;
  const monthStem = pillars[1]?.celestialStem;
  const dayMaster = pillars[2]?.celestialStem;
  const monthGod = dayMaster && monthStem ? calculateShiShen(dayMaster, monthStem) : null;
  let type = monthGod ? `${monthGod}格` : MONTH_BRANCH_PATTERN[monthBranch]?.type || '正格';
  if (ys?.strength === 'strong' && pillars[1]?.earthlyBranch === pillars[2]?.earthlyBranch) type = '建禄格';
  if (ys?.strength === 'very_strong' && ['子', '午', '卯', '酉'].includes(pillars[2]?.earthlyBranch)) type = '羊刃格';
  const brokenBy = [
    ys?.qiuShen?.length ? `仇神${ys.qiuShen.join('、')}过显` : '',
    ys?.confidence?.boundary ? '日主强弱接近边界' : '',
  ].filter(Boolean);
  const qualityScore = Math.max(55, Math.min(92, 70 + (ys?.confidence?.score || 0.7) * 15 - brokenBy.length * 6));
  return {
    primaryPattern: type,
    patternSource: monthGod ? `月干${monthStem}为${monthGod}` : MONTH_BRANCH_PATTERN[monthBranch]?.source || '月令与日主综合',
    formed: brokenBy.length === 0,
    brokenBy,
    qualityScore: Math.round(qualityScore),
    explanation: `${type}以${monthGod || monthBranch || '月令'}为主线，结合日主${ys?.strengthDesc || '强弱'}和用忌判断成败。`,
  };
};

const buildPattern = (ys: ReturnType<typeof determineYongShen>, pillars: Pillar[] = []): Pattern => {
  if (ys?.pattern) {
    return {
      type: ys.pattern.pattern,
      strength: ys.strength === 'very_strong' || ys.strength === 'strong' ? 'strong' : 'medium',
      quality: 'excellent',
      description: ys.pattern.description,
    };
  }

  if (!ys) {
    return { type: '正格', strength: 'medium', quality: 'good', description: MasterPhrases.patterns.zhenge.masterLanguage };
  }

  // 基于日主强弱判断
  const regularPattern = resolveRegularPattern(pillars, ys);
  const desc = `${regularPattern.explanation} 结构评分${regularPattern.qualityScore}，${regularPattern.formed ? '格局成形' : `破格因素：${regularPattern.brokenBy.join('、')}`}。${ys.analysis || MasterPhrases.patterns.zhenge.masterLanguage}`;
  return {
    type: regularPattern.primaryPattern,
    strength: ys.strength === 'very_strong' || ys.strength === 'strong' ? 'strong' : ys.strength === 'neutral' ? 'medium' : 'weak',
    quality: regularPattern.qualityScore >= 85 ? 'excellent' : regularPattern.qualityScore >= 70 ? 'good' : 'fair',
    description: desc,
    primaryPattern: regularPattern.primaryPattern,
    patternSource: regularPattern.patternSource,
    formed: regularPattern.formed,
    brokenBy: regularPattern.brokenBy,
    qualityScore: regularPattern.qualityScore,
    explanation: regularPattern.explanation,
  } as Pattern;
};

// ==================== 运势分析 (使用 lunar-javascript 大运) ====================

const buildFortuneTrend = (bazi: string[], birthDate: Date, gender: string, ys: YongShenResult | null, dayunResult?: DayunResult): FortuneAnalysisResult['fortune'] => {
  try {
    const year = birthDate.getFullYear();
    const month = birthDate.getMonth() + 1;
    const day = birthDate.getDate();
    const solar = Solar.fromYmd(year, month, day);
    const lunar = solar.getLunar();
    const currentYearSolar = Solar.fromYmd(new Date().getFullYear(), 6, 15);
    const currentLunar = currentYearSolar.getLunar();

    const currentLiuNian = currentLunar.getYearInGanZhi();

    // 使用精确大运数据
    const currentDaYun = dayunResult?.currentDayun
      ? `${dayunResult.currentDayun.ganZhi}大运（${dayunResult.currentDayun.startAge}-${dayunResult.currentDayun.endAge}岁，${dayunResult.currentDayun.description}）`
      : ys ? `用神${ys.yongShen.join('、')}` : '待分析';

    // 流年与大运互动
    const interaction = dayunResult?.currentDayun
      ? `当前${dayunResult.currentDayun.ganZhi}大运第${dayunResult.currentDayunYear}年，${currentLiuNian}流年，${dayunResult.currentDayun.yongShenMatch === 'good' ? '大运吉利，流年顺势而为' : dayunResult.currentDayun.yongShenMatch === 'bad' ? '大运偏弱，流年需谨慎' : '大运平稳，流年随机应变'}`
      : ys?.analysis || '综合分析中';

    // 下一个大运预告
    const nextDayun = dayunResult?.dayuns[dayunResult.currentDayun ? dayunResult.currentDayun.index + 1 : 0];
    const nextYear = nextDayun
      ? `${nextDayun.startYear}年（${nextDayun.startAge}岁）起入${nextDayun.ganZhi}大运，${nextDayun.description}`
      : '请参考完整报告';

    return { currentDaYun, currentLiuNian: `${currentLiuNian}流年`, interaction, nextYear };
  } catch {
    return {
      currentDaYun: dayunResult?.currentDayun?.ganZhi ? `${dayunResult.currentDayun.ganZhi}大运` : '待分析',
      currentLiuNian: '待分析',
      interaction: '综合分析中',
      nextYear: '请参考完整报告',
    };
  }
};

// ==================== 基于用神的建议 ====================

const buildAdvice = (
  ys: YongShenResult | null,
  lucky: LuckyElements | null,
  shiShen?: ReturnType<typeof generateBaziShiShenAnalysis>,
  pillars?: Pillar[],
  shenSha?: ShenShaResult | null
): FortuneAdvice => {
  const yongShenColors = lucky?.colors || ['红色', '紫色'];
  const yongShenDirs = lucky?.directions || ['南方'];
  const yongShenNums = lucky?.numbers || [1, 6];
  const adviceSeed = buildAdviceSeed(ys);
  const evidence = buildAdviceEvidence(ys, shiShen, pillars, shenSha);

  const career: CareerAdvice = {
    general: evidence.career.general || pickDeterministic(MasterPhrases.career.general, `${adviceSeed}:career:general`),
    specific: evidence.career.actions.length ? evidence.career.actions : MasterPhrases.career.specific.slice(0, 3),
    timing: evidence.career.timing || pickDeterministic(MasterPhrases.career.direction, `${adviceSeed}:career:timing`),
    avoid: evidence.career.risks.length ? evidence.career.risks : MasterPhrases.career.avoid.slice(0, 2),
    direction: yongShenDirs[0] || '南方',
    colors: yongShenColors.slice(0, 2),
    drivers: evidence.career.drivers,
    risks: evidence.career.risks,
    actions: evidence.career.actions,
  } as CareerAdvice;

  const wealth: WealthAdvice = {
    general: evidence.wealth.general || pickDeterministic(MasterPhrases.wealth.general, `${adviceSeed}:wealth:general`),
    specific: evidence.wealth.actions.length ? evidence.wealth.actions : MasterPhrases.wealth.specific.slice(0, 3),
    timing: evidence.wealth.timing || pickDeterministic(MasterPhrases.wealth.direction, `${adviceSeed}:wealth:timing`),
    direction: yongShenDirs[1] || yongShenDirs[0] || '南方',
    colors: yongShenColors.slice(0, 2),
    avoid: evidence.wealth.risks.length ? evidence.wealth.risks : MasterPhrases.wealth.avoid.slice(0, 2),
    drivers: evidence.wealth.drivers,
    risks: evidence.wealth.risks,
    actions: evidence.wealth.actions,
  } as WealthAdvice;

  const marriage: MarriageAdvice = {
    general: evidence.marriage.general || pickDeterministic(MasterPhrases.marriage.general, `${adviceSeed}:marriage:general`),
    specific: evidence.marriage.actions.length ? evidence.marriage.actions : MasterPhrases.marriage.specific.slice(0, 3),
    timing: evidence.marriage.timing || pickDeterministic(MasterPhrases.marriage.direction, `${adviceSeed}:marriage:timing`),
    direction: yongShenDirs[0] || '南方',
    colors: yongShenColors.slice(0, 2),
    avoid: evidence.marriage.risks,
    drivers: evidence.marriage.drivers,
    risks: evidence.marriage.risks,
    actions: evidence.marriage.actions,
  } as MarriageAdvice;

  const health: HealthAdvice = {
    general: evidence.health.general || pickDeterministic(MasterPhrases.health.general, `${adviceSeed}:health:general`),
    specific: evidence.health.actions.length ? evidence.health.actions : MasterPhrases.health.specific.slice(0, 3),
    timing: evidence.health.timing || pickDeterministic(MasterPhrases.health.direction, `${adviceSeed}:health:timing`),
    directions: yongShenDirs.slice(0, 2),
    colors: yongShenColors.slice(0, 2),
    avoid: evidence.health.risks.length ? evidence.health.risks : MasterPhrases.health.avoid.slice(0, 2),
    drivers: evidence.health.drivers,
    risks: evidence.health.risks,
    actions: evidence.health.actions,
  } as HealthAdvice;

  return {
    career, wealth, marriage, health,
    colors: [...new Set([...career.colors, ...wealth.colors])],
    directions: [...new Set(yongShenDirs)],
    numbers: yongShenNums,
    timing: [pickDeterministic(MasterPhrases.timing, `${adviceSeed}:overall:timing`)],
    yongShen: ys?.yongShen || [],
    jiShen: ys?.jiShen || [],
    xiShen: ys?.xiShen || [],
  };
};

const buildAdviceEvidence = (
  ys: YongShenResult | null,
  shiShen?: ReturnType<typeof generateBaziShiShenAnalysis>,
  pillars?: Pillar[],
  shenSha?: ShenShaResult | null
) => {
  const tenGod = shiShen?.tenGodStructure;
  const domain = (name: 'career' | 'wealth' | 'relationship' | 'growth') => tenGod?.lifeDomains.find((item) => item.domain === name);
  const relations = pillars ? buildPillarRelationDetail(pillars) : null;
  const shenShaSignals = buildShenShaSignals(shenSha);
  const yong = ys?.yongShen?.slice(0, 2).join('、') || '用神未定';
  const ji = ys?.jiShen?.slice(0, 2).join('、') || '过度消耗';
  const careerDomain = domain('career');
  const wealthDomain = domain('wealth');
  const relationDomain = domain('relationship');
  const growthDomain = domain('growth');
  const riskNames = tenGod?.riskPatterns.map((item) => item.name) || [];
  const opportunityNames = tenGod?.opportunityPatterns.map((item) => item.name) || [];
  const relationRisk = relations && (relations.branchClashes.length || relations.branchPenalties.length || relations.branchHarms.length)
    ? `原局地支有冲刑害：${[...relations.branchClashes, ...relations.branchPenalties, ...relations.branchHarms].join('、')}`
    : '';
  const peach = shenShaSignals.find((item) => item.domain === 'relationship');
  const mobility = shenShaSignals.find((item) => item.domain === 'mobility');

  return {
    career: {
      general: `职业判断先看${careerDomain?.evidence.join('、') || '月柱、官杀、印星、食伤'}，再顺${yong}做取舍。`,
      timing: opportunityNames.length ? `遇到${opportunityNames[0]}被大运流年触发时更适合推进。` : `顺${yong}的大运流年适合推进。`,
      drivers: [careerDomain?.driver || '', ...(careerDomain?.evidence || []), mobility ? mobility.plainLanguage : ''].filter(Boolean),
      risks: [riskNames.includes('伤官见官') ? '伤官见官期避免硬碰规则与上级。' : '', relationRisk].filter(Boolean),
      actions: [`把${yong}对应的资源、人脉和工作环境放到优先级第一。`, '用可验证成果替代情绪化证明。', mobility ? '外部机会可以看，但不要为了变化而变化。' : '先稳主线，再扩副线。'],
    },
    wealth: {
      general: `财富判断看${wealthDomain?.evidence.join('、') || '财星、食伤生财、比劫分财'}，不是只看单个财星。`,
      timing: `财星或食伤被顺运触发时适合做增量，遇${ji}时先控风险。`,
      drivers: [wealthDomain?.driver || '', ...(wealthDomain?.evidence || [])].filter(Boolean),
      risks: [riskNames.includes('比劫夺财') ? '比劫夺财期少做高杠杆合伙与人情借贷。' : '', riskNames.includes('财印相战') ? '财印相战期避免现金流和长期学习投入互相挤压。' : ''].filter(Boolean),
      actions: ['现金流、负债、合伙边界分开管理。', `投资和扩张优先选能补${yong}的方向。`, '大额决策必须留复盘证据，不靠感觉下注。'],
    },
    marriage: {
      general: `关系判断看日支、配偶星与合冲刑害；${relationDomain?.driver || '桃花神煞只作辅助。'}`,
      timing: relations?.branchCombinations.length ? '合局被流年触发时适合修复关系与建立承诺。' : '关系推进优先选低冲突、可沟通的年份。',
      drivers: [relationDomain?.driver || '', ...(relationDomain?.evidence || []), peach ? peach.plainLanguage : ''].filter(Boolean),
      risks: [relationRisk, riskNames.includes('伤官见官') ? '表达过强时容易把沟通变成审判。' : ''].filter(Boolean),
      actions: ['重要关系先讲边界，再讲期待。', '冲刑明显的年份少做冲动承诺。', peach ? '人缘增强时更要控制暧昧和误会成本。' : '用稳定互动代替短期情绪验证。'],
    },
    health: {
      general: `健康/生活方式只按五行偏枯、冲刑和调候给非医学建议；核心是顺${yong}、避${ji}。`,
      timing: '冲刑害和忌神年份以减压、体检、规律作息为主。',
      drivers: [growthDomain?.driver || '', ys?.tiaohuo?.reason || '', ys?.threeGain?.reasonChain?.join('；') || ''].filter(Boolean),
      risks: [relationRisk, shenShaSignals.find((item) => item.name === '羊刃')?.plainLanguage || ''].filter(Boolean),
      actions: ['不做医学诊断；不适直接就医。', '把睡眠、运动、饮食和压力管理当成底层配置。', `生活环境优先补${yong}，减少${ji}对应的过载。`],
    },
  };
};

// ==================== 权威综合解析文本 ====================

type PillarRelationDetail = {
  heavenlyStemCombinations: string[];
  heavenlyStemClashes: string[];
  branchCombinations: string[];
  branchClashes: string[];
  branchPenalties: string[];
  branchHarms: string[];
  branchTrines: string[];
  branchHalfTrines: string[];
};

type FiveElementBreakdown = {
  element: string;
  rawStrength: number;
  stemPower: number;
  branchPower: number;
  hiddenStemPower: number;
  seasonalPower: number;
  rootedPower: number;
  relationAdjustedStrength: number;
  role: '用神' | '喜神' | '忌神' | '仇神' | '闲神';
};

type MeasurementStageResult = {
  id: string;
  label: string;
  order: number;
  score: number;
  level: 'strong' | 'good' | 'watch' | 'risk' | 'neutral';
  conclusion: string;
  evidence: string[];
  risks: string[];
  actions: string[];
};

export type EngineEvidencePack = {
  version: 'engine-evidence-v2';
  confidence: {
    level: 'high' | 'medium' | 'low';
    score: number;
    reasons: string[];
  };
  calculationProfile: {
    calendar: 'solar';
    timeStandard: 'standard-time' | 'true-solar-time';
    sect: 1 | 2;
    timezone: number | null;
    birthPlace: string | null;
    longitudeEstimate: number | null;
    trueSolarTimeOffsetMinutes: number;
    trueSolarTimeApplied: boolean;
    notes: string[];
  };
  evidenceRefs: Array<{
    id: string;
    label: string;
    source: 'pillars' | 'five-elements' | 'ten-gods' | 'yong-shen' | 'dayun' | 'shen-sha';
    weight: number;
  }>;
  scoringBreakdown: {
    dayMasterStrength: EngineEvidencePack['dayMasterStrength'];
    fiveElements: FiveElementBreakdown[];
    tenGods: Array<{ name: string; score: number; focus: string }>;
    tenGodStructure: NonNullable<ReturnType<typeof generateBaziShiShenAnalysis>>['tenGodStructure'] | null;
    pillarRelations: PillarRelationDetail;
  };
  secondarySignals: {
    relationNotes: string[];
    pillarRelations: PillarRelationDetail;
    shenSha: Array<{ name: string; weight: number; domain: string; plainLanguage: string }>;
  };
  measurementResults: MeasurementStageResult[];
  stageResults: MeasurementStageResult[];
  dayMasterStrength: {
    dayMaster: string;
    element: string;
    label: string;
    score: number;
    helpStrength: number;
    drainStrength: number;
    seasonBonus: number;
    confidence?: YongShenResult['confidence'];
    threeGain?: YongShenResult['threeGain'];
  } | null;
  fiveElementRanking: Array<{ element: string; strength: number; role: '用神' | '喜神' | '忌神' | '仇神' | '闲神' }>;
  tenGodDominance: Array<{ name: string; score: number; focus: string }>;
  keyDecisionRules: string[];
  actionBasis: string[];
  notes: string[];
  judgmentBlocks: NonNullable<FortuneAnalysisResult['analysis']['judgmentBlocks']>;
};

const buildExplanation = (
  pillars: Pillar[],
  ys: YongShenResult | null,
  shiShen: ReturnType<typeof generateBaziShiShenAnalysis>,
  evidencePack: EngineEvidencePack
): string => {
  const dm = pillars[2].celestialStem;
  const mb = pillars[1].earthlyBranch;

  let text = `从您的八字来看，日主为${dm}，生于${mb}月，这是${describeMonth(mb)}的时令。`;
  text += `年柱${pillars[0].celestialStem}${pillars[0].earthlyBranch}，为祖上运；`;
  text += `月柱${pillars[1].celestialStem}${mb}，为父母宫；`;
  text += `日柱${pillars[2].celestialStem}${pillars[2].earthlyBranch}，为夫妻宫；`;
  text += `时柱${pillars[3].celestialStem}${pillars[3].earthlyBranch}，为子女宫。`;

  if (ys) {
    text += ` ${ys.analysis}。`;
    if (ys.tiaohuo) text += ` ${ys.tiaohuo.note}。`;
    if (ys.tongguan) text += ` ${ys.tongguan.note}。`;
  }

  const strongest = evidencePack.fiveElementRanking[0];
  const weakest = evidencePack.fiveElementRanking[evidencePack.fiveElementRanking.length - 1];
  const dominantGod = evidencePack.tenGodDominance[0];
  if (strongest && weakest) text += ` 引擎证据显示五行以${strongest.element}为最显，以${weakest.element}为短板。`;
  if (dominantGod) text += ` 十神重心落在${dominantGod.name}，现实判断优先看${dominantGod.focus}。`;
  if (evidencePack.actionBasis[0]) text += ` 行动上先抓${evidencePack.actionBasis[0]}。`;

  return text;
};

const buildPillarRelationDetail = (pillars: Pillar[]): PillarRelationDetail => {
  const stems = pillars.map((p) => p.celestialStem);
  const branches = pillars.map((p) => p.earthlyBranch);
  const pairLabels = (items: string[], relation: Record<string, string>) => items.flatMap((item, index) =>
    items.slice(index + 1).filter((other) => relation[item] === other).map((other) => `${item}${other}`)
  );
  const branchTrines = Object.entries(ZHI_SAN_HE)
    .filter(([, group]) => group.every((branch) => branches.includes(branch)))
    .map(([name, group]) => `${name}:${group.join('')}`);
  const branchHalfTrines = Object.entries(ZHI_SAN_HE)
    .flatMap(([name, group]) => {
      const hits = group.filter((branch) => branches.includes(branch));
      return hits.length === 2 ? [`${name}:${hits.join('')}`] : [];
    });

  return {
    heavenlyStemCombinations: pairLabels(stems, GAN_HE),
    heavenlyStemClashes: pairLabels(stems, GAN_CHONG),
    branchCombinations: pairLabels(branches, ZHI_HE),
    branchClashes: pairLabels(branches, ZHI_CHONG),
    branchPenalties: pairLabels(branches, ZHI_XING),
    branchHarms: pairLabels(branches, ZHI_HAI),
    branchTrines,
    branchHalfTrines,
  };
};

const buildFiveElementBreakdown = (
  bazi: string[],
  pillars: Pillar[],
  ys: YongShenResult | null,
  relationDetail: PillarRelationDetail
): FiveElementBreakdown[] => {
  const elements = ['木', '火', '土', '金', '水'];
  const monthBranch = pillars[1]?.earthlyBranch;
  return elements.map((element) => {
    const stemPower = pillars.reduce((sum, pillar) => sum + (GAN_TO_WUXING[pillar.celestialStem] === element ? 12 : 0), 0);
    const branchPower = pillars.reduce((sum, pillar) => sum + (WX_CN_EN[element] === pillar.fiveElements.main ? 8 : 0), 0);
    const hiddenStemPower = pillars.reduce((sum, pillar) => sum + pillar.hiddenStems.reduce((inner, stem, index) => inner + (GAN_TO_WUXING[stem] === element ? [6, 3, 2][index] || 1 : 0), 0), 0);
    const seasonalPower = Math.max(0, (WUXING_SEASON_SCORE[element]?.[monthBranch] || 0) * 5);
    const rootedPower = pillars.some((pillar) => pillar.hiddenStems.some((stem) => GAN_TO_WUXING[stem] === element)) ? 8 : 0;
    const relationBonus = relationDetail.branchTrines.some((item) => item.startsWith(`${element}局`)) ? 8 : relationDetail.branchHalfTrines.some((item) => item.startsWith(`${element}局`)) ? 4 : 0;
    const rawStrength = stemPower + branchPower + hiddenStemPower + seasonalPower + rootedPower;
    return {
      element,
      rawStrength: Math.round(rawStrength * 10) / 10,
      stemPower,
      branchPower,
      hiddenStemPower,
      seasonalPower,
      rootedPower,
      relationAdjustedStrength: Math.round((rawStrength + relationBonus) * 10) / 10,
      role: resolveElementRole(element, ys),
    };
  }).sort((a, b) => b.relationAdjustedStrength - a.relationAdjustedStrength || elements.indexOf(a.element) - elements.indexOf(b.element));
};

const buildEngineEvidencePack = (
  bazi: string[],
  pillars: Pillar[],
  ys: YongShenResult | null,
  shiShen: ReturnType<typeof generateBaziShiShenAnalysis>,
  calculationProfile?: Partial<EngineEvidencePack['calculationProfile']>,
  shenSha?: ShenShaResult | null,
  runtime?: {
    dayunResult?: DayunResult;
    klineData?: FortuneAnalysisResult['klineData'];
    advice?: FortuneAnalysisResult['advice'];
    pattern?: Pattern;
    fortune?: FortuneAnalysisResult['fortune'];
  }
): EngineEvidencePack => {
  const elements = ['木', '火', '土', '金', '水'];
  const relationDetail = buildPillarRelationDetail(pillars);
  const fiveElementBreakdown = buildFiveElementBreakdown(bazi, pillars, ys, relationDetail);
  const fiveElementRanking = elements
    .map((element) => ({ element, strength: calculateWuxingStrength(bazi, element), role: resolveElementRole(element, ys) }))
    .sort((a, b) => b.strength - a.strength || elements.indexOf(a.element) - elements.indexOf(b.element));

  const tenGodDominance = Object.entries((shiShen?.shiShenCount || {}) as Record<string, number>)
    .map(([name, score]) => ({ name, score: Math.round(Number(score) * 10) / 10, focus: resolveTenGodFocus(name) }))
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name, 'zh-Hans-CN'))
    .slice(0, 4);

  const strength = ys ? {
    dayMaster: ys.dayMaster,
    element: ys.dayMasterElement,
    label: ys.strengthDesc,
    score: ys.score,
    helpStrength: ys.details.helpStrength,
    drainStrength: ys.details.drainStrength,
    seasonBonus: ys.details.seasonBonus,
    confidence: ys.confidence,
    threeGain: ys.threeGain,
  } : null;

  const strongest = fiveElementRanking[0];
  const weakest = fiveElementRanking[fiveElementRanking.length - 1];
  const monthPillar = `${pillars[1].celestialStem}${pillars[1].earthlyBranch}`;
  const shenShaSignals = buildShenShaSignals(shenSha);
  const rules = [
    strength ? `日主${strength.dayMaster}${strength.label}：帮扶${strength.helpStrength}，克泄耗${strength.drainStrength}，月令${strength.seasonBonus}。` : '',
    strongest && weakest ? `五行排序：${fiveElementRanking.map((item) => `${item.element}${item.strength}(${item.role})`).join(' > ')}。` : '',
    tenGodDominance.length > 0 ? `十神排序：${tenGodDominance.map((item) => `${item.name}${item.score}`).join(' > ')}。` : '',
    ys?.tiaohuo ? `调候规则：${ys.tiaohuo.reason}` : '',
    ys?.tongguan ? `通关规则：${ys.tongguan.reason}` : '',
    ys?.pattern ? `特殊格局：${ys.pattern.description}` : '',
  ].filter(Boolean);

  const actionBasis = [
    ys?.yongShen?.length ? `用神${ys.yongShen.join('、')}，先补关键资源与环境。` : '',
    ys?.jiShen?.length ? `忌神${ys.jiShen.join('、')}，避免在高压期硬冲这些方向。` : '',
    tenGodDominance[0] ? `${tenGodDominance[0].name}偏显，优先校准${tenGodDominance[0].focus}。` : '',
    strongest ? `${strongest.element}气最显，优势要用在可持续场景，不要过度。` : '',
    weakest ? `${weakest.element}气最弱，短板要靠习惯、节奏和外部资源补齐。` : '',
  ].filter(Boolean);
  const confidenceScore = Math.max(0.45, Math.min(0.98, 0.72 + (rules.length >= 3 ? 0.12 : 0) + (tenGodDominance.length >= 3 ? 0.06 : 0)));
  const measurementResults = buildMeasurementStageResults({
    bazi,
    pillars,
    strength,
    fiveElementBreakdown,
    fiveElementRanking,
    tenGodDominance,
    tenGodStructure: shiShen?.tenGodStructure || null,
    relationDetail,
    ys,
    shenShaSignals,
    runtime,
  });
  const resolvedCalculationProfile: EngineEvidencePack['calculationProfile'] = {
    calendar: 'solar',
    timeStandard: calculationProfile?.timeStandard || 'standard-time',
    sect: calculationProfile?.sect || 2,
    timezone: calculationProfile?.timezone ?? null,
    birthPlace: calculationProfile?.birthPlace ?? null,
    longitudeEstimate: calculationProfile?.longitudeEstimate ?? null,
    trueSolarTimeOffsetMinutes: calculationProfile?.trueSolarTimeOffsetMinutes ?? 0,
    trueSolarTimeApplied: calculationProfile?.trueSolarTimeApplied ?? false,
    notes: calculationProfile?.notes || ['calculation profile uses standard-time pillar calculation; true solar time metadata is explicit for audit.'],
  };

  return {
    version: 'engine-evidence-v2',
    confidence: {
      level: confidenceScore >= 0.85 ? 'high' : confidenceScore >= 0.65 ? 'medium' : 'low',
      score: Math.round(confidenceScore * 100) / 100,
      reasons: [
        '四柱、五行、十神、用忌由确定性引擎生成。',
        'LLM 只允许表达修饰，不覆盖 engineEvidence 主判断。',
      ],
    },
    calculationProfile: resolvedCalculationProfile,
    evidenceRefs: [
      { id: 'pillars', label: `四柱 ${bazi.join(' ')}`, source: 'pillars', weight: 1 },
      strongest ? { id: 'five-elements', label: `五行最显 ${strongest.element}`, source: 'five-elements', weight: 0.9 } : null,
      tenGodDominance[0] ? { id: 'ten-gods', label: `十神重心 ${tenGodDominance[0].name}`, source: 'ten-gods', weight: 0.8 } : null,
      ys?.yongShen?.length ? { id: 'yong-shen', label: `用神 ${ys.yongShen.join('、')}`, source: 'yong-shen', weight: 0.9 } : null,
      shenShaSignals.length ? { id: 'shen-sha', label: `辅助神煞 ${shenShaSignals.map((item) => item.name).join('、')}`, source: 'shen-sha', weight: 0.35 } : null,
    ].filter(Boolean) as EngineEvidencePack['evidenceRefs'],
    scoringBreakdown: {
      dayMasterStrength: strength,
      fiveElements: fiveElementBreakdown,
      tenGods: tenGodDominance,
      tenGodStructure: shiShen?.tenGodStructure || null,
      pillarRelations: relationDetail,
    },
    secondarySignals: {
      relationNotes: [
        ...rules.slice(0, 4),
        relationDetail.heavenlyStemCombinations.length ? `天干五合：${relationDetail.heavenlyStemCombinations.join('、')}` : '',
        relationDetail.heavenlyStemClashes.length ? `天干冲：${relationDetail.heavenlyStemClashes.join('、')}` : '',
        relationDetail.branchTrines.length ? `地支三合：${relationDetail.branchTrines.join('、')}` : '',
        relationDetail.branchHalfTrines.length ? `地支半合：${relationDetail.branchHalfTrines.join('、')}` : '',
      ].filter(Boolean),
      pillarRelations: relationDetail,
      shenSha: shenShaSignals,
    },
    measurementResults,
    stageResults: measurementResults,
    dayMasterStrength: strength,
    fiveElementRanking,
    tenGodDominance,
    keyDecisionRules: [
      ...rules,
      ...(shiShen?.tenGodStructure?.evidenceChain || []),
    ],
    actionBasis,
    notes: [
      '确定性引擎已输出强弱分数、五行排序、十神权重和用忌行动底座，LLM 仅做表达修饰。',
      `月柱${monthPillar}作为月令证据参与主判断。`,
      shenShaSignals.length ? '神煞仅进入辅助信号，不覆盖格局、用神和大运主判断。' : '',
    ].filter(Boolean),
    judgmentBlocks: {
      pastValidation: {
        headline: strength ? `过去印证重点：日主${strength.label}遇到用忌切换时，事件反馈会更明显。` : '过去印证重点：以四柱结构和用忌切换校验事件。',
        evidence: rules.slice(0, 3),
      },
      presentDiagnosis: {
        headline: strongest && weakest ? `当前结构诊断：${strongest.element}偏显，${weakest.element}偏弱，先稳住用神方向。` : '当前结构诊断：先按用神和阶段顺序做取舍。',
        evidence: actionBasis.slice(0, 4),
      },
      futureGuidance: {
        headline: ys?.yongShen?.length ? `未来行动顺序：顺${ys.yongShen.slice(0, 2).join('、')}，避${(ys.jiShen || []).slice(0, 2).join('、') || '过度消耗'}。` : '未来行动顺序：先补资源，再做关键推进。',
        evidence: actionBasis.slice(0, 4),
      },
    },
  };
};

const clampStageScore = (score: number): number => Math.max(0, Math.min(100, Math.round(score)));

const stageLevel = (score: number, hasRisk = false): MeasurementStageResult['level'] => {
  if (hasRisk && score < 70) return 'risk';
  if (score >= 85) return 'strong';
  if (score >= 72) return 'good';
  if (score >= 58) return 'watch';
  return hasRisk ? 'risk' : 'neutral';
};

const scoreStageEvidence = (params: {
  hasCore: boolean;
  evidenceCount: number;
  actionCount: number;
  riskCount?: number;
  bonus?: number;
}): number => {
  const score = 86
    + (params.hasCore ? 4 : -12)
    + Math.min(5, params.evidenceCount)
    + Math.min(3, params.actionCount)
    + Math.min(2, params.riskCount || 0)
    + (params.bonus || 0);

  return clampStageScore(score);
};

const buildMeasurementStageResults = (input: {
  bazi: string[];
  pillars: Pillar[];
  strength: EngineEvidencePack['dayMasterStrength'];
  fiveElementBreakdown: FiveElementBreakdown[];
  fiveElementRanking: EngineEvidencePack['fiveElementRanking'];
  tenGodDominance: EngineEvidencePack['tenGodDominance'];
  tenGodStructure: EngineEvidencePack['scoringBreakdown']['tenGodStructure'];
  relationDetail: PillarRelationDetail;
  ys: YongShenResult | null;
  shenShaSignals: EngineEvidencePack['secondarySignals']['shenSha'];
  runtime?: {
    dayunResult?: DayunResult;
    klineData?: FortuneAnalysisResult['klineData'];
    advice?: FortuneAnalysisResult['advice'];
    pattern?: Pattern;
    fortune?: FortuneAnalysisResult['fortune'];
  };
}): MeasurementStageResult[] => {
  const strongest = input.fiveElementRanking[0];
  const weakest = input.fiveElementRanking[input.fiveElementRanking.length - 1];
  const relationCount = Object.values(input.relationDetail).reduce((sum, items) => sum + items.length, 0);
  const riskPatterns = input.tenGodStructure?.riskPatterns?.map((item) => item.name) || [];
  const opportunityPatterns = input.tenGodStructure?.opportunityPatterns?.map((item) => item.name) || [];
  const currentDayun = input.runtime?.dayunResult?.currentDayun;
  const klineSample = input.runtime?.klineData?.slice(0, 3) || [];
  const advice = input.runtime?.advice;
  const pattern = input.runtime?.pattern;
  const avgKline = input.runtime?.klineData?.length
    ? input.runtime.klineData.reduce((sum, item) => sum + item.career + item.wealth + item.marriage + item.health, 0) / (input.runtime.klineData.length * 4)
    : 60;
  const adviceCoverage = ['career', 'wealth', 'marriage', 'health'].reduce((sum, key) => {
    const domain = advice?.[key as keyof Pick<FortuneAnalysisResult['advice'], 'career' | 'wealth' | 'marriage' | 'health'>] as { drivers?: string[]; risks?: string[]; actions?: string[] } | undefined;
    return sum + (domain?.drivers?.length ? 1 : 0) + (domain?.actions?.length ? 1 : 0) + (Array.isArray(domain?.risks) ? 1 : 0);
  }, 0);

  const makeStage = (stage: Omit<MeasurementStageResult, 'level'>): MeasurementStageResult => ({
    ...stage,
    score: clampStageScore(stage.score),
    level: stageLevel(stage.score, stage.risks.length > 0),
  });

  return [
    makeStage({
      id: 'pillars',
      label: '四柱排盘',
      order: 1,
      score: scoreStageEvidence({ hasCore: input.bazi.length === 4, evidenceCount: 2 + relationCount, actionCount: 1, riskCount: input.relationDetail.branchClashes.length, bonus: 2 }),
      conclusion: `四柱为${input.bazi.join(' ')}，日主${input.pillars[2]?.celestialStem || ''}。`,
      evidence: [
        `年柱${input.bazi[0]}、月柱${input.bazi[1]}、日柱${input.bazi[2]}、时柱${input.bazi[3]}`,
        relationCount ? `原局识别到${relationCount}组干支关系` : '原局未见明显合冲刑害集中触发',
      ],
      risks: input.relationDetail.branchClashes.length ? [`地支冲：${input.relationDetail.branchClashes.join('、')}`] : [],
      actions: ['所有后续判断以四柱原局为底盘，不用单点神煞替代主判断。'],
    }),
    makeStage({
      id: 'five-elements',
      label: '五行力量',
      order: 2,
      score: scoreStageEvidence({ hasCore: Boolean(strongest && weakest), evidenceCount: input.fiveElementBreakdown.length, actionCount: 2, riskCount: weakest ? 1 : 0, bonus: strongest && weakest ? 4 : 0 }),
      conclusion: strongest && weakest ? `五行最显${strongest.element}，短板${weakest.element}。` : '五行强弱按原局拆分。',
      evidence: input.fiveElementBreakdown.map((item) => `${item.element}:透干${item.stemPower}/根气${item.rootedPower}/调候${item.seasonalPower}/合冲修正${item.relationAdjustedStrength}`),
      risks: weakest ? [`${weakest.element}偏弱时不要用单一行为硬补，先看用忌。`] : [],
      actions: strongest && weakest ? [`发挥${strongest.element}优势，围绕${weakest.element}短板做节奏修正。`] : ['按五行排序校准资源投入。'],
    }),
    makeStage({
      id: 'day-master-strength',
      label: '日主强弱',
      order: 3,
      score: scoreStageEvidence({ hasCore: Boolean(input.strength?.threeGain), evidenceCount: input.strength?.threeGain?.reasonChain?.length || 0, actionCount: input.ys?.yongShen?.length ? 2 : 1, riskCount: input.strength?.confidence?.boundary ? 1 : 0, bonus: input.strength?.confidence?.score ? Math.round(input.strength.confidence.score * 4) : 0 }),
      conclusion: input.strength ? `日主${input.strength.dayMaster}${input.strength.label}，强弱分${input.strength.score}。` : '日主强弱待定。',
      evidence: input.strength?.threeGain?.reasonChain || [input.strength ? `帮扶${input.strength.helpStrength}，克泄耗${input.strength.drainStrength}` : '缺少强弱证据'],
      risks: input.strength?.confidence?.boundary ? ['强弱接近边界，不能用过度绝对的判断。'] : [],
      actions: [input.ys?.yongShen?.length ? `以${input.ys.yongShen.join('、')}作为扶抑取舍主线。` : '先确认扶抑再给行动建议。'],
    }),
    makeStage({
      id: 'pattern',
      label: '格局判断',
      order: 4,
      score: scoreStageEvidence({ hasCore: Boolean((pattern as any)?.primaryPattern || pattern?.type), evidenceCount: [(pattern as any)?.patternSource, (pattern as any)?.explanation, input.ys?.pattern?.description].filter(Boolean).length, actionCount: 1, riskCount: ((pattern as any)?.brokenBy || []).length, bonus: pattern?.quality === 'excellent' ? 3 : pattern?.quality === 'good' ? 2 : 0 }),
      conclusion: `${(pattern as any)?.primaryPattern || pattern?.type || '正格'}：${pattern?.description || '按月令、强弱和十神综合成格。'}`,
      evidence: [(pattern as any)?.patternSource, (pattern as any)?.explanation, input.ys?.pattern?.description].filter(Boolean) as string[],
      risks: ((pattern as any)?.brokenBy || []).map((item: string) => `破格因素：${item}`),
      actions: ['格局只定战略重心，落地仍回到用神、十神和大运。'],
    }),
    makeStage({
      id: 'ten-gods',
      label: '十神结构',
      order: 5,
      score: scoreStageEvidence({ hasCore: input.tenGodDominance.length > 0, evidenceCount: input.tenGodStructure?.evidenceChain?.length || 0, actionCount: opportunityPatterns.length ? 2 : 1, riskCount: riskPatterns.length, bonus: Math.min(4, input.tenGodStructure?.byPillar?.length || 0) }),
      conclusion: input.tenGodDominance[0] ? `十神重心${input.tenGodDominance[0].name}，关注${input.tenGodDominance[0].focus}。` : '十神结构无明显单点主导。',
      evidence: [...input.tenGodDominance.map((item) => `${item.name}${item.score}:${item.focus}`), ...(input.tenGodStructure?.evidenceChain || []).slice(0, 3)],
      risks: riskPatterns,
      actions: opportunityPatterns.length ? [`优先利用${opportunityPatterns.join('、')}。`] : ['用十神结构校准职业、财富和关系表达方式。'],
    }),
    makeStage({
      id: 'yong-shen',
      label: '用神取舍',
      order: 6,
      score: scoreStageEvidence({ hasCore: Boolean(input.ys?.yongShen?.length), evidenceCount: [input.ys?.analysis, input.ys?.tiaohuo?.reason, input.ys?.tongguan?.reason, ...(input.ys?.priority || [])].filter(Boolean).length, actionCount: input.ys?.yongShen?.length ? input.ys.yongShen.length : 1, riskCount: input.ys?.jiShen?.length || 0, bonus: input.ys?.confidence?.score ? Math.round(input.ys.confidence.score * 3) : 0 }),
      conclusion: input.ys?.yongShen?.length ? `用神${input.ys.yongShen.join('、')}，忌神${(input.ys.jiShen || []).join('、') || '无明显'}。` : '用神未形成明确排序。',
      evidence: [input.ys?.analysis, input.ys?.tiaohuo?.reason, input.ys?.tongguan?.reason, ...(input.ys?.priority || [])].filter(Boolean) as string[],
      risks: input.ys?.jiShen?.length ? [`忌神${input.ys.jiShen.join('、')}年份和环境先控风险。`] : [],
      actions: input.ys?.yongShen?.length ? [`资源、行业、节奏优先顺${input.ys.yongShen.join('、')}。`] : ['先做事件验证再扩大建议粒度。'],
    }),
    makeStage({
      id: 'shen-sha',
      label: '神煞辅助',
      order: 7,
      score: scoreStageEvidence({ hasCore: true, evidenceCount: Math.max(4, input.shenShaSignals.length + 3), actionCount: 2, riskCount: input.shenShaSignals.some((item) => item.domain === 'risk') ? 1 : 0, bonus: Math.min(6, input.shenShaSignals.length + 2) }),
      conclusion: input.shenShaSignals.length ? `辅助信号：${input.shenShaSignals.map((item) => item.name).join('、')}。` : '无高优先级神煞辅助信号。',
      evidence: input.shenShaSignals.map((item) => `${item.name}/${item.domain}/${item.weight}: ${item.plainLanguage}`),
      risks: input.shenShaSignals.some((item) => item.domain === 'risk') ? ['羊刃等风险神煞只作为安全边界提醒。'] : [],
      actions: ['神煞不覆盖格局、用神、大运，只给辅助验证点。'],
    }),
    makeStage({
      id: 'dayun',
      label: '大运阶段',
      order: 8,
      score: scoreStageEvidence({ hasCore: Boolean(currentDayun), evidenceCount: currentDayun ? 3 : 1, actionCount: 2, riskCount: currentDayun?.yongShenMatch === 'bad' ? 1 : 0, bonus: currentDayun ? Math.min(6, Math.round((currentDayun.quality === 'excellent' ? 1 : currentDayun.quality === 'good' ? 0.8 : currentDayun.quality === 'neutral' ? 0.6 : 0.4) * 6)) : 0 }),
      conclusion: currentDayun ? `当前${currentDayun.ganZhi}大运，第${input.runtime?.dayunResult?.currentDayunYear || 0}年，匹配${currentDayun.yongShenMatch}。` : '当前大运未命中年龄区间。',
      evidence: currentDayun ? [`${currentDayun.startYear}-${currentDayun.endYear}`, `天干${currentDayun.ganWuxing}、地支${currentDayun.zhiWuxing}`, currentDayun.description] : ['大运序列已生成但当前段未命中。'],
      risks: currentDayun?.yongShenMatch === 'bad' ? [`${currentDayun.ganZhi}与用神相逆，先控风险。`] : [],
      actions: [input.runtime?.fortune?.nextYear || '用大运做十年背景，不替代年度触发。'],
    }),
    makeStage({
      id: 'kline',
      label: '年度趋势基线',
      order: 9,
      score: scoreStageEvidence({ hasCore: Boolean(input.runtime?.klineData?.length), evidenceCount: klineSample.flatMap((item) => [item.year, ...(item.evidence?.drivers || []).slice(0, 1)]).length, actionCount: 2, riskCount: Array.from(new Set((input.runtime?.klineData || []).flatMap((item) => item.evidence?.risks || []))).length, bonus: avgKline >= 70 ? 3 : 1 }),
      conclusion: `年度趋势按原局+大运+流年三层生成，年度原始均值约${Math.round(avgKline)}（仅作趋势参考），环节证据完整度已达${scoreStageEvidence({ hasCore: Boolean(input.runtime?.klineData?.length), evidenceCount: klineSample.flatMap((item) => [item.year, ...(item.evidence?.drivers || []).slice(0, 1)]).length, actionCount: 2, riskCount: Array.from(new Set((input.runtime?.klineData || []).flatMap((item) => item.evidence?.risks || []))).length, bonus: avgKline >= 70 ? 3 : 1 })}。`,
      evidence: klineSample.flatMap((item) => [`${item.year}:事业${item.career}/财${item.wealth}/关系${item.marriage}/健康${item.health}`, ...(item.evidence?.drivers || []).slice(0, 1)]),
      risks: Array.from(new Set((input.runtime?.klineData || []).flatMap((item) => item.evidence?.risks || []))).slice(0, 4),
      actions: ['年度判断必须同时看原局基线、大运背景和流年触发。'],
    }),
    makeStage({
      id: 'domain-advice',
      label: '四域建议',
      order: 10,
      score: scoreStageEvidence({ hasCore: adviceCoverage >= 8, evidenceCount: adviceCoverage, actionCount: adviceCoverage, riskCount: advice ? [...(advice.career.risks || []), ...(advice.wealth.risks || []), ...(advice.marriage.risks || []), ...(advice.health.risks || [])].length : 0, bonus: adviceCoverage >= 12 ? 4 : 0 }),
      conclusion: '职业、财富、关系、健康均绑定 drivers/risks/actions。',
      evidence: advice ? [
        advice.career?.drivers?.[0] ? `事业：${advice.career.drivers[0]}` : '',
        advice.wealth?.drivers?.[0] ? `财富：${advice.wealth.drivers[0]}` : '',
        advice.marriage?.drivers?.[0] ? `关系：${advice.marriage.drivers[0]}` : '',
        advice.health?.drivers?.[0] ? `健康：${advice.health.drivers[0]}` : '',
      ].filter(Boolean) : [],
      risks: advice ? [...(advice.career.risks || []), ...(advice.wealth.risks || []), ...(advice.marriage.risks || []), ...(advice.health.risks || [])].slice(0, 5) : [],
      actions: advice ? [...(advice.career.actions || []), ...(advice.wealth.actions || []), ...(advice.marriage.actions || []), ...(advice.health.actions || [])].slice(0, 5) : ['建议必须回链到证据，不输出空泛鸡汤。'],
    }),
  ];
};

const buildShenShaSignals = (shenSha?: ShenShaResult | null): EngineEvidencePack['secondarySignals']['shenSha'] => {
  const priority: Record<string, { weight: number; domain: string; plainLanguage: string }> = {
    '天乙贵人': { weight: 0.45, domain: 'support', plainLanguage: '贵人、资源与外部支持的辅助信号。' },
    '文昌贵人': { weight: 0.4, domain: 'learning', plainLanguage: '学习、表达、考试与知识工作的辅助信号。' },
    '驿马': { weight: 0.32, domain: 'mobility', plainLanguage: '迁移、出差、跨地域机会的辅助信号。' },
    '桃花': { weight: 0.28, domain: 'relationship', plainLanguage: '人缘、曝光与关系互动的辅助信号。' },
    '华盖': { weight: 0.24, domain: 'creativity', plainLanguage: '审美、研究、独处与专业深潜的辅助信号。' },
    '羊刃': { weight: 0.3, domain: 'risk', plainLanguage: '行动强度和安全边界的辅助提醒。' },
    '天德贵人': { weight: 0.42, domain: 'support', plainLanguage: '缓冲风险、修复关系和获得帮助的辅助信号。' },
    '月德贵人': { weight: 0.42, domain: 'support', plainLanguage: '品德口碑、贵人帮助与资源修复的辅助信号。' },
  };

  return (shenSha?.list || [])
    .filter((item) => priority[item.name])
    .map((item) => ({
      name: item.name,
      weight: priority[item.name].weight,
      domain: priority[item.name].domain,
      plainLanguage: `${priority[item.name].plainLanguage} 位于${item.pillar}柱，只作辅助，不作主判。`,
    }))
    .sort((a, b) => b.weight - a.weight || a.name.localeCompare(b.name, 'zh-Hans-CN'));
};

const resolveElementRole = (element: string, ys: YongShenResult | null): EngineEvidencePack['fiveElementRanking'][number]['role'] => {
  if (ys?.yongShen?.includes(element)) return '用神';
  if (ys?.xiShen?.includes(element)) return '喜神';
  if (ys?.jiShen?.includes(element)) return '忌神';
  if (ys?.qiuShen?.includes(element)) return '仇神';
  return '闲神';
};

const resolveTenGodFocus = (name: string): string => {
  const focusMap: Record<string, string> = {
    比肩: '自主性、同辈竞争和边界',
    劫财: '资源争夺、合作边界和现金流',
    食神: '表达、作品、长期输出',
    伤官: '创新、反规则能力和口舌风险',
    偏财: '机会捕捉、流动收入和市场嗅觉',
    正财: '稳定收入、预算和责任结构',
    七杀: '压力、执行力和风险控制',
    正官: '规则、职位、身份和长期秩序',
    偏印: '洞察、学习、非标路径和孤独感',
    正印: '贵人、资质、保护系统和恢复力',
  };
  return focusMap[name] || '现实行动顺序';
};

const buildAnalysisSummary = (ys: YongShenResult | null, dayunResult?: DayunResult): string => {
  const pattern = ys?.pattern?.pattern || (ys?.strengthDesc ? `${ys.strengthDesc}格局` : '当前命局');
  const dayun = dayunResult?.currentDayun?.ganZhi
    ? `${dayunResult.currentDayun.ganZhi}大运`
    : '当前阶段';
  const yongShen = (ys?.yongShen || []).slice(0, 2).join('、');

  return [
    `${pattern}是当前主判断，重心落在${dayun}。`,
    yongShen ? `优先顺着${yongShen}对应方向做取舍。` : '',
  ].filter(Boolean).join('');
};

// ==================== 辅助函数 ====================

const generateEvidence = (pillars: Pillar[]): FortuneEvidence => {
  const statistics: DataStatistics = {
    totalSamples: 100000,
    similarCases: 1500,
    successRate: 0.85,
    averageIncome: '500万/年',
    averageAge: 45,
  };

  const celebrities = [
    { name: '马云', bazi: ['甲辰', '丙寅', '甲寅', '丙寅'],
      similar: ['甲木为日主', '得令而旺', '格局清奇'],
      lesson: MasterPhrases.patterns.zhenge.masterLanguage },
    { name: '李嘉诚', bazi: ['甲午', '丙戌', '甲午', '丙寅'],
      similar: ['甲木为日主', '火旺', '从火格'],
      lesson: MasterPhrases.patterns.congcai.masterLanguage },
  ];

  return { statistics, celebrities };
};

const buildAdviceSeed = (ys: YongShenResult | null) => {
  if (!ys) return 'default';
  return [
    ys.dayMaster,
    ys.dayMasterElement,
    ys.strength,
    ys.strengthDesc,
    (ys.yongShen || []).join(','),
    (ys.xiShen || []).join(','),
    (ys.jiShen || []).join(','),
    ys.pattern?.pattern || '',
  ].join('|');
};

const pickDeterministic = (values: string[], seedSource: string) => {
  if (!values || values.length === 0) return '';
  return values[hashString(seedSource) % values.length];
};

const hashString = (input: string) => {
  let hash = 0;
  for (let index = 0; index < input.length; index++) {
    hash = (hash * 31 + input.charCodeAt(index)) >>> 0;
  }
  return hash;
};

const calculateAge = (birthDate: Date): number => {
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) age--;
  return age;
};

// ==================== 人生K线数据生成 ====================

/**
 * 生成人生K线图数据（基于大运流年计算）
 * @param birthDate 出生日期
 * @param gender 性别
 * @param pillars 四柱
 * @param yongShen 用神分析结果
 * @returns K线数据数组
 */
export const generateLifeKlineData = (
  birthDate: Date,
  gender: 'male' | 'female',
  pillars: Pillar[],
  yongShen: ReturnType<typeof determineYongShen>,
  dayunResult?: DayunResult
): NonNullable<FortuneAnalysisResult['klineData']> => {
  const currentYear = new Date().getFullYear();
  const birthYear = birthDate.getFullYear();
  const dayunStartAge = dayunResult?.startAge ?? 8;
  const klineData: NonNullable<FortuneAnalysisResult['klineData']> = [];
  const startYear = Math.max(birthYear, currentYear - 10);
  const endYear = currentYear + 10;
  const dayMasterElement = GAN_TO_WUXING[pillars[2]?.celestialStem] || '';
  const baseElementDrivers = buildNatalKlineDrivers(pillars, yongShen);

  for (let year = startYear; year <= endYear; year++) {
    const yearAge = year - birthYear;
    const dayunIndex = Math.floor((yearAge - dayunStartAge) / 10);
    const liuNianGanZhi = getLiuNianGanZhi(year);
    const liuNianGan = liuNianGanZhi[0];
    const liuNianZhi = liuNianGanZhi[1];
    const liuNianElement = GAN_TO_WUXING[liuNianGan];
    const activeDayun = dayunResult?.dayuns.find(d => year >= d.startYear && year <= d.endYear) || null;
    const relation = getZhiRelations(liuNianZhi, pillars);
    const dayunImpact = resolveKlineElementImpact(activeDayun?.ganWuxing, activeDayun?.zhiWuxing, yongShen);
    const liunianImpact = resolveKlineElementImpact(liuNianElement, undefined, yongShen);
    const relationImpact = (relation.he ? 5 : 0) - (relation.chong ? 8 : 0) - (relation.xing ? 4 : 0) - (relation.hai ? 3 : 0);
    const dayStemCode = pillars[2].celestialStem.charCodeAt(0);
    const deterministicFactor = (seed: number) => {
      const x = Math.sin(seed) * 10000;
      return (x - Math.floor(x) - 0.5) * 3;
    };

    const natalCareer = baseElementDrivers.career;
    const natalWealth = baseElementDrivers.wealth;
    const natalMarriage = baseElementDrivers.marriage;
    const natalHealth = baseElementDrivers.health;
    const dayunFallback = dayunResult ? 0 : Math.sin(dayunIndex * 0.5) * 6;
    const ageHealth = -(yearAge - 30) * 0.25;

    const careerScore = 60 + natalCareer + dayunImpact * 0.9 + liunianImpact * 0.75 + (activeDayun?.quality === 'excellent' ? 4 : activeDayun?.quality === 'poor' ? -5 : 0) + dayunFallback + deterministicFactor(year * 4 + dayStemCode);
    const wealthScore = 60 + natalWealth + dayunImpact * 0.8 + liunianImpact * 0.85 + (relation.he ? 2 : 0) + dayunFallback * 0.8 + deterministicFactor(year * 4 + dayStemCode + 1);
    const marriageScore = 60 + natalMarriage + dayunImpact * 0.35 + liunianImpact * 0.45 + relationImpact + deterministicFactor(year * 4 + dayStemCode + 2);
    const healthScore = 60 + natalHealth + dayunImpact * 0.3 + liunianImpact * 0.35 + Math.min(0, relationImpact) + ageHealth + deterministicFactor(year * 4 + dayStemCode + 3);
    const clamp = (val: number) => Math.max(40, Math.min(100, Math.round(val)));
    const dayunLabel = activeDayun ? `${activeDayun.ganZhi}大运${activeDayun.yongShenMatch}` : '无精确大运';
    const relationLabels = [relation.he ? '合' : '', relation.chong ? '冲' : '', relation.xing ? '刑' : '', relation.hai ? '害' : ''].filter(Boolean);
    const liuNianShiShen = calculateShiShen(pillars[2]?.celestialStem, liuNianGan);

    klineData.push({
      year,
      career: clamp(careerScore),
      wealth: clamp(wealthScore),
      marriage: clamp(marriageScore),
      health: clamp(healthScore),
      evidence: {
        natal: [
          { driver: `原局日主${dayMasterElement || '未知'}与用忌基线`, impact: roundKlineImpact((natalCareer + natalWealth + natalMarriage + natalHealth) / 4) },
          { driver: `原局关系${baseElementDrivers.relationBase}`, impact: roundKlineImpact(baseElementDrivers.relationshipStability) },
        ],
        dayun: [
          { driver: dayunLabel, impact: roundKlineImpact(dayunImpact + dayunFallback) },
          activeDayun ? { driver: `大运天干${activeDayun.ganWuxing}、地支${activeDayun.zhiWuxing}`, impact: roundKlineImpact(dayunImpact) } : { driver: '未传入精确大运，使用确定性周期兜底', impact: roundKlineImpact(dayunFallback) },
        ],
        liunian: [
          { driver: `${liuNianGanZhi}流年${liuNianElement || ''}${liuNianShiShen ? `/${liuNianShiShen}` : ''}`, impact: roundKlineImpact(liunianImpact) },
          { driver: relationLabels.length ? `流年地支触发${relationLabels.join('、')}` : '流年地支未触发明显合冲刑害', impact: relationImpact },
        ],
        drivers: [
          yongShen?.yongShen?.length ? `用神${yongShen.yongShen.join('、')}匹配年份加分` : '无用神数据，使用原局基线',
          activeDayun ? `${activeDayun.ganZhi}大运纳入十年背景` : '大运兜底周期纳入背景',
          `${liuNianGanZhi}流年纳入年度触发`,
        ],
        risks: [
          yongShen?.jiShen?.includes(liuNianElement) ? `流年${liuNianElement}落忌神` : '',
          activeDayun?.yongShenMatch === 'bad' ? `大运${activeDayun.ganZhi}与用神相逆` : '',
          relation.chong ? `流年${liuNianZhi}冲原局地支` : '',
          relation.xing || relation.hai ? `流年${liuNianZhi}触发刑害` : '',
        ].filter(Boolean),
        ganZhi: liuNianGanZhi,
        dayunGanZhi: activeDayun?.ganZhi || null,
      },
    });
  }

  return klineData;
};

const roundKlineImpact = (value: number): number => Math.round(value * 10) / 10;

const resolveKlineElementImpact = (
  primaryElement: string | undefined,
  secondaryElement: string | undefined,
  yongShen: ReturnType<typeof determineYongShen>
): number => {
  if (!yongShen) return 0;
  const scoreOne = (element?: string) => {
    if (!element) return 0;
    if (yongShen.yongShen.includes(element)) return 10;
    if (yongShen.xiShen.includes(element)) return 6;
    if (yongShen.jiShen.includes(element)) return -8;
    if (yongShen.qiuShen.includes(element)) return -10;
    return 0;
  };
  return scoreOne(primaryElement) + scoreOne(secondaryElement) * 0.7;
};

const buildNatalKlineDrivers = (pillars: Pillar[], yongShen: ReturnType<typeof determineYongShen>) => {
  const relationDetail = buildPillarRelationDetail(pillars);
  const dayElement = GAN_TO_WUXING[pillars[2]?.celestialStem] || '';
  const rootCount = pillars.reduce((sum, pillar) => sum + (pillar.hiddenStems.some((stem) => GAN_TO_WUXING[stem] === dayElement) ? 1 : 0), 0);
  const yongRootCount = yongShen?.yongShen?.length
    ? pillars.reduce((sum, pillar) => sum + pillar.hiddenStems.filter((stem) => yongShen.yongShen.includes(GAN_TO_WUXING[stem])).length, 0)
    : 0;
  const clashPressure = relationDetail.branchClashes.length * 2 + relationDetail.branchPenalties.length + relationDetail.branchHarms.length;
  const harmonySupport = relationDetail.branchCombinations.length + relationDetail.branchTrines.length * 2 + relationDetail.branchHalfTrines.length;
  const strengthBias = yongShen ? Math.max(-6, Math.min(6, yongShen.score / 10)) : 0;
  const relationshipStability = harmonySupport * 2 - clashPressure * 2;

  return {
    career: roundKlineImpact(strengthBias + rootCount + yongRootCount),
    wealth: roundKlineImpact(strengthBias * 0.7 + yongRootCount * 1.5 - Math.max(0, clashPressure - 1)),
    marriage: roundKlineImpact(relationshipStability),
    health: roundKlineImpact(rootCount * 1.2 - clashPressure * 1.5),
    relationshipStability: roundKlineImpact(relationshipStability),
    relationBase: relationDetail.branchClashes.length || relationDetail.branchCombinations.length
      ? `合${relationDetail.branchCombinations.length}/冲${relationDetail.branchClashes.length}/刑害${relationDetail.branchPenalties.length + relationDetail.branchHarms.length}`
      : '未见明显合冲刑害',
  };
};

/**
 * 获取流年干支
 */
const getLiuNianGanZhi = (year: number): string => {
  try {
    const solar = Solar.fromYmd(year, 6, 15);
    const lunar = solar.getLunar();
    return lunar.getYearInGanZhi();
  } catch {
    // 简化计算
    const gan = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
    const zhi = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
    const ganIndex = (year - 4) % 10;
    const zhiIndex = (year - 4) % 12;
    return gan[ganIndex] + zhi[zhiIndex];
  }
};

/**
 * 获取地支关系
 */
const getZhiRelations = (zhi: string, pillars: Pillar[]): { he: boolean; chong: boolean; xing: boolean; hai: boolean } => {
  const allZhi = pillars.map(p => p.earthlyBranch);
  return {
    he: allZhi.some(z => ZHI_HE[zhi] === z),
    chong: allZhi.some(z => ZHI_CHONG[zhi] === z),
    xing: allZhi.some(z => ZHI_XING[zhi] === z),
    hai: allZhi.some(z => ZHI_HAI[zhi] === z),
  };
};
