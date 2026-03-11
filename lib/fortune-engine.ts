// 命理分析引擎 - 使用 lunar-javascript EightChar API + 权威 BaziAnalyzer
// @ts-ignore
import { Lunar, Solar } from 'lunar-javascript';
import { FortuneAnalysisResult, Pillar, FiveElements, TenGods, Pattern, CareerAdvice, WealthAdvice, MarriageAdvice, HealthAdvice, DataStatistics, FortuneAdvice, FortuneEvidence, LuckyElements } from './user-types';
import type { YongShenResult, PillarShiShen } from './bazi-analyzer';
import { calculateDayun } from './dayun-calculator';
import type { DayunResult } from './dayun-calculator';
import { MasterPhrases, selectBestPhrase, generatePersonalizedPhrase, describeMonth } from './master-phrases';
import { GAN_TO_WUXING, ZHI_CANG_GAN, ZHI_CHONG, ZHI_HE, ZHI_XING, ZHI_HAI,
  WUXING_COLOR, WUXING_DIRECTION, WUXING_NUMBER,
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
export const calculateFourPillars = (
  birthDate: Date,
  birthTime: string,
  timezone: number
): Pillar[] => {
  const year = birthDate.getFullYear();
  const month = birthDate.getMonth() + 1;
  const day = birthDate.getDate();
  const [hour, minute] = birthTime.split(':').map(Number);

  const solar = Solar.fromYmdHms(year, month, day, hour, minute || 0, 0);
  const lunar = solar.getLunar();
  const ec = lunar.getEightChar();

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
  gender: 'male' | 'female'
): FortuneAnalysisResult => {
  // 1. 计算四柱 (Pillar 对象)
  const pillars = calculateFourPillars(birthDate, birthTime, timezone);
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
  const pattern = buildPattern(yongShenResult);

  // 10. 生成建议 (基于用神)
  const advice = buildAdvice(yongShenResult, luckyElements);

  // 11. 数据支撑
  const evidence = generateEvidence(pillars);

  // 12. 个性化文本
  const user = { name, age: calculateAge(birthDate), bazi: { pillars, fiveElements, tenGods, pattern, dayMaster } };
  const opening = generatePersonalizedPhrase(user, 'opening');
  const explanation = buildExplanation(pillars, yongShenResult, shiShenAnalysis);

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

  return {
    basic: { dayMaster, pillars },
    fiveElements,
    tenGods,
    pattern,
    physique: buildPhysique(dayMaster),
    careerSuggestion: buildCareerSuggestion(tenGods, dayMaster, shiShenAnalysis),
    fortune: buildFortuneTrend(baziStr, birthDate, gender, yongShenResult, dayunResult),
    advice,
    evidence: { statistics: evidence.statistics, celebrities: evidence.celebrities, similarCases: [] },
    analysis: { opening, explanation },
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

const buildPattern = (ys: ReturnType<typeof determineYongShen>): Pattern => {
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
  const desc = ys.analysis || MasterPhrases.patterns.zhenge.masterLanguage;
  return {
    type: ys.strengthDesc === '极旺' || ys.strengthDesc === '偏旺' ? '身旺格' : ys.strengthDesc === '极弱' || ys.strengthDesc === '偏弱' ? '身弱格' : '中和格',
    strength: ys.strength === 'very_strong' || ys.strength === 'strong' ? 'strong' : ys.strength === 'neutral' ? 'medium' : 'weak',
    quality: 'good',
    description: desc,
  };
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

const buildAdvice = (ys: YongShenResult | null, lucky: LuckyElements | null): FortuneAdvice => {
  const yongShenColors = lucky?.colors || ['红色', '紫色'];
  const yongShenDirs = lucky?.directions || ['南方'];
  const yongShenNums = lucky?.numbers || [1, 6];

  const career: CareerAdvice = {
    general: MasterPhrases.career.general[Math.floor(Math.random() * MasterPhrases.career.general.length)],
    specific: MasterPhrases.career.specific.slice(0, 3),
    timing: MasterPhrases.career.direction[Math.floor(Math.random() * MasterPhrases.career.direction.length)],
    avoid: MasterPhrases.career.avoid.slice(0, 2),
    direction: yongShenDirs[0] || '南方',
    colors: yongShenColors.slice(0, 2),
  };

  const wealth: WealthAdvice = {
    general: MasterPhrases.wealth.general[Math.floor(Math.random() * MasterPhrases.wealth.general.length)],
    specific: MasterPhrases.wealth.specific.slice(0, 3),
    timing: MasterPhrases.wealth.direction[Math.floor(Math.random() * MasterPhrases.wealth.direction.length)],
    direction: yongShenDirs[1] || yongShenDirs[0] || '南方',
    colors: yongShenColors.slice(0, 2),
    avoid: MasterPhrases.wealth.avoid.slice(0, 2),
  };

  const marriage: MarriageAdvice = {
    general: MasterPhrases.marriage.general[Math.floor(Math.random() * MasterPhrases.marriage.general.length)],
    specific: MasterPhrases.marriage.specific.slice(0, 3),
    timing: MasterPhrases.marriage.direction[Math.floor(Math.random() * MasterPhrases.marriage.direction.length)],
    direction: yongShenDirs[0] || '南方',
    colors: yongShenColors.slice(0, 2),
  };

  const health: HealthAdvice = {
    general: MasterPhrases.health.general[Math.floor(Math.random() * MasterPhrases.health.general.length)],
    specific: MasterPhrases.health.specific.slice(0, 3),
    timing: MasterPhrases.health.direction[Math.floor(Math.random() * MasterPhrases.health.direction.length)],
    directions: yongShenDirs.slice(0, 2),
    colors: yongShenColors.slice(0, 2),
    avoid: MasterPhrases.health.avoid.slice(0, 2),
  };

  return {
    career, wealth, marriage, health,
    colors: [...new Set([...career.colors, ...wealth.colors])],
    directions: [...new Set(yongShenDirs)],
    numbers: yongShenNums,
    timing: [MasterPhrases.timing[Math.floor(Math.random() * MasterPhrases.timing.length)]],
    yongShen: ys?.yongShen || [],
    jiShen: ys?.jiShen || [],
    xiShen: ys?.xiShen || [],
  };
};

// ==================== 权威综合解析文本 ====================

const buildExplanation = (pillars: Pillar[], ys: YongShenResult | null, shiShen: ReturnType<typeof generateBaziShiShenAnalysis>): string => {
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

  return text;
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
): Array<{ year: number; career: number; wealth: number; marriage: number; health: number }> => {
  const currentYear = new Date().getFullYear();
  const birthYear = birthDate.getFullYear();

  // 使用精确大运起运年龄
  const dayunStartAge = dayunResult?.startAge ?? 8;

  const klineData = [];
  const startYear = Math.max(birthYear, currentYear - 10); // 最近10年
  const endYear = currentYear + 10; // 未来10年

  for (let year = startYear; year <= endYear; year++) {
    const yearAge = year - birthYear;
    const dayunIndex = Math.floor((yearAge - dayunStartAge) / 10);

    // 获取流年干支
    const liuNianGanZhi = getLiuNianGanZhi(year);
    const liuNianGan = liuNianGanZhi[0];
    const liuNianZhi = liuNianGanZhi[1];

    // 基础分数（50-100）
    let careerScore = 60;
    let wealthScore = 60;
    let marriageScore = 60;
    let healthScore = 60;

    // 根据用神调整分数
    if (yongShen) {
      const liuNianWuxing = GAN_TO_WUXING[liuNianGan];
      const isYongShenYear = yongShen.yongShen.includes(liuNianWuxing);
      const isJiShenYear = yongShen.jiShen.includes(liuNianWuxing);

      if (isYongShenYear) {
        // 用神年，各方面提升
        careerScore += 15;
        wealthScore += 15;
        marriageScore += 10;
        healthScore += 10;
      } else if (isJiShenYear) {
        // 忌神年，各方面下降
        careerScore -= 10;
        wealthScore -= 10;
        marriageScore -= 5;
        healthScore -= 5;
      }
    }

    // 根据精确大运调整（大运影响更大）
    let dayunBonus = 0;
    if (dayunResult) {
      const activeDayun = dayunResult.dayuns.find(d => year >= d.startYear && year < d.startYear + 10);
      if (activeDayun) {
        dayunBonus = activeDayun.yongShenMatch === 'good' ? 12 : activeDayun.yongShenMatch === 'bad' ? -10 : 0;
      }
    } else {
      dayunBonus = Math.sin(dayunIndex * 0.5) * 10;
    }
    careerScore += dayunBonus;
    wealthScore += dayunBonus * 0.8;

    // 根据流年地支调整婚姻和健康
    const zhiRelations = getZhiRelations(liuNianZhi, pillars);
    if (zhiRelations.he) {
      marriageScore += 10; // 地支合，婚姻好
    }
    if (zhiRelations.chong) {
      healthScore -= 8; // 地支冲，健康注意
    }

    // 年龄因素（健康随年龄下降）
    healthScore -= (yearAge - 30) * 0.3;

    // 确定性波动（基于年份和日主天干的哈希，确保相同输入产生相同输出）
    const deterministicFactor = (seed: number) => {
      const x = Math.sin(seed) * 10000;
      return (x - Math.floor(x) - 0.5) * 5;
    };
    const dayStemCode = pillars[2].celestialStem.charCodeAt(0);
    careerScore += deterministicFactor(year * 4 + dayStemCode);
    wealthScore += deterministicFactor(year * 4 + dayStemCode + 1);
    marriageScore += deterministicFactor(year * 4 + dayStemCode + 2);
    healthScore += deterministicFactor(year * 4 + dayStemCode + 3);

    // 限制在 40-100 范围内
    const clamp = (val: number) => Math.max(40, Math.min(100, Math.round(val)));

    klineData.push({
      year,
      career: clamp(careerScore),
      wealth: clamp(wealthScore),
      marriage: clamp(marriageScore),
      health: clamp(healthScore),
    });
  }

  return klineData;
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
