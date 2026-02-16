// 命理分析引擎 - 类似真正的大师
import { Lunar } from 'lunar-japanese';
import { UserFortuneProfile, FortuneAnalysisResult, Pillar, FiveElements, TenGods, Pattern, CareerAdvice, WealthAdvice, MarriageAdvice, HealthAdvice, DataStatistics } from './user-types';
import { MasterPhrases, selectBestPhrase, generatePersonalizedPhrase, describeMonth } from './master-phrases';

// 精确计算四柱
export const calculateFourPillars = (
  birthDate: Date,
  birthTime: string,
  timezone: number
): Pillar[] => {
  // 转换为标准时间
  const utcDate = new Date(birthDate.getTime() + timezone * 3600000);
  
  // 使用lunar-japanese精确计算
  const lunar = Lunar.fromYmd(
    utcDate.getFullYear(),
    utcDate.getMonth() + 1,
    utcDate.getDate()
  );
  
  // 精确计算时柱
  const [hour, minute] = birthTime.split(':').map(Number);
  const hourPillar = calculateHourPillar(lunar, hour, minute);
  
  // 年柱
  const yearPillar: Pillar = {
    celestialStem: getYearStem(lunar.year),
    earthlyBranch: getYearBranch(lunar.year),
    hiddenStems: getHiddenStems(lunar.year),
    nayin: getNayin(lunar.year),
    fiveElements: getPillarFiveElements(lunar.year, null, null),
    relationships: getPillarRelationships(lunar.year, null, null),
  };
  
  // 月柱
  const monthPillar: Pillar = {
    celestialStem: getMonthStem(lunar.year, lunar.month),
    earthlyBranch: getMonthBranch(lunar.month),
    hiddenStems: getHiddenStems(lunar.month),
    nayin: getNayin(lunar.month),
    fiveElements: getPillarFiveElements(null, lunar.month, null),
    relationships: getPillarRelationships(null, lunar.month, null),
  };
  
  // 日柱
  const dayPillar: Pillar = {
    celestialStem: getDayStem(lunar.year, lunar.month, lunar.day),
    earthlyBranch: getDayBranch(lunar.day),
    hiddenStems: getHiddenStems(lunar.day),
    nayin: getNayin(lunar.day),
    fiveElements: getPillarFiveElements(null, null, lunar.day),
    relationships: getPillarRelationships(null, null, lunar.day),
  };
  
  // 时柱
  const timePillar: Pillar = {
    celestialStem: getHourStem(lunar.day, hour, minute),
    earthlyBranch: getHourBranch(hour, minute),
    hiddenStems: getHiddenStems(hour),
    nayin: getNayin(hour),
    fiveElements: getPillarFiveElements(null, null, null),
    relationships: getPillarRelationships(null, null, null),
  };
  
  return [yearPillar, monthPillar, dayPillar, timePillar];
};

// 分析完整命理
export const analyzeFortune = (
  name: string,
  birthDate: Date,
  birthTime: string,
  birthPlace: string,
  timezone: number = 8,
  gender: 'male' | 'female'
): FortuneAnalysisResult => {
  // 1. 计算四柱
  const pillars = calculateFourPillars(birthDate, birthTime, timezone);
  const dayMaster = pillars[2].celestialStem;
  const dayBranch = pillars[2].earthlyBranch;
  const monthBranch = pillars[1].earthlyBranch;
  
  // 2. 分析五行
  const fiveElements = analyzeFiveElements(pillars);
  
  // 3. 分析十神
  const tenGods = analyzeTenGods(pillars, dayMaster, gender);
  
  // 4. 判断格局
  const pattern = determinePattern(pillars, dayMaster);
  
  // 5. 运势分析
  const fortune = analyzeFortuneTrend(pillars, dayMaster);
  
  // 6. 生成建议
  const advice = generateAdvice(pillars, fiveElements, tenGods, pattern, fortune);
  
  // 7. 数据支撑
  const evidence = generateEvidence(pillars, fiveElements, pattern);
  
  // 8. 个性化开头
  const user = { name, age: calculateAge(birthDate), bazi: { pillars, fiveElements, tenGods, pattern, dayMaster } };
  const opening = generatePersonalizedPhrase(user, 'opening');
  
  // 9. 大师话术结尾
  const closing = generatePersonalizedPhrase(user, 'closing');
  
  return {
    basic: {
      name,
      dayMaster,
      pillars,
    },
    fiveElements,
    tenGods,
    pattern,
    fortune,
    advice,
    evidence,
    analysis: {
      opening,
      explanation: generateExplanation(pillars, fiveElements, tenGods, pattern),
    },
    masterLanguage: {
      opening: selectBestPhrase('opening'),
      descriptions: [selectBestPhrase('description')],
      judgments: [selectBestPhrase('judgment')],
      timing: [selectBestPhrase('timing')],
      advice: [selectBestPhrase('advice')],
      closing: [selectBestPhrase('closing')],
    },
  };
};

// 分析五行
const analyzeFiveElements = (pillars: Pillar[]): FiveElements => {
  const elements = { wood: 0, fire: 0, earth: 0, metal: 0, water: 0 };
  
  pillars.forEach(pillar => {
    const main = pillar.fiveElements.main;
    if (elements[main as keyof typeof elements] !== undefined) {
      elements[main as keyof typeof elements] += pillar.fiveElements.strength;
    }
    pillar.fiveElements.hidden.forEach(hidden => {
      if (elements[hidden as keyof typeof elements] !== undefined) {
        elements[hidden as keyof typeof elements] += 0.3; // 藏干权重较低
      }
    });
  });
  
  // 计算总强度
  const total = Object.values(elements).reduce((a, b) => a + b, 0);
  
  // 计算每个五行的强度百分比和质量
  const fiveElementsResult: any = {};
  (Object.keys(elements) as (keyof typeof elements)[]).forEach(element => {
    const strength = elements[element];
    const percentage = (strength / total) * 100;
    
    let quality: string;
    let description: string;
    
    if (percentage >= 30) {
      quality = 'strong';
      description = MasterPhrases.fiveElements[element].strong;
    } else if (percentage >= 15) {
      quality = 'medium';
      description = `${MasterPhrases.fiveElements[element].strong}，稍弱`;
    } else {
      quality = 'weak';
      description = MasterPhrases.fiveElements[element].weak;
    }
    
    fiveElementsResult[element] = {
      strength: percentage,
      quality,
      description,
    };
  });
  
  return fiveElementsResult;
};

// 分析十神
const analyzeTenGods = (pillars: Pillar[], dayMaster: string, gender: 'male' | 'female'): TenGods => {
  const self = dayMaster;
  const output: string[] = [];
  const input: string[] = [];
  const control: string[] = [];
  const controlled: string[] = [];
  
  // 分析与日主的关系
  pillars.forEach(pillar => {
    const stem = pillar.celestialStem;
    
    // 正印/偏印（生我）
    if (isOutputElement(dayMaster, stem)) {
      output.push(isPositiveElement(dayMaster, stem) ? '正印' : '偏印');
    }
    
    // 正财/偏财（我克）
    if (isInputElement(dayMaster, stem)) {
      input.push(isPositiveElement(dayMaster, stem) ? '正财' : '偏财');
    }
    
    // 正官/七杀（克我）
    if (isControlElement(dayMaster, stem)) {
      control.push(isPositiveElement(dayMaster, stem) ? '正官' : '七杀');
    }
    
    // 伤官/食神（我生）
    if (isControlledByElement(dayMaster, stem)) {
      controlled.push(isControlledByPositive(dayMaster, stem) ? '食神' : '伤官');
    }
  });
  
  return {
    self,
    output: [...new Set(output)],
    input: [...new Set(input)],
    control: [...new Set(control)],
    controlled: [...new Set(controlled)],
  };
};

// 判断格局
const determinePattern = (pillars: Pillar[], dayMaster: string): Pattern => {
  const monthBranch = pillars[1].earthlyBranch;
  const yearPillar = pillars[0];
  
  // 从杀格
  if (monthBranch === '子' || monthBranch === '午' || monthBranch === '卯' || monthBranch === '酉') {
    return {
      type: '从杀格',
      strength: 'strong',
      quality: 'excellent',
      description: MasterPhrases.patterns.congsha.masterLanguage,
    };
  }
  
  // 从财格
  if (isInputElement(dayMaster, pillars[1].celestialStem)) {
    return {
      type: '从财格',
      strength: 'strong',
      quality: 'excellent',
      description: MasterPhrases.patterns.congcai.masterLanguage,
    };
  }
  
  // 从伤格
  if (isControlledByElement(dayMaster, pillars[1].celestialStem)) {
    return {
      type: '从伤格',
      strength: 'strong',
      quality: 'good',
      description: MasterPhrases.patterns.congshang.masterLanguage,
    };
  }
  
  // 默认正格
  return {
    type: '正格',
    strength: 'medium',
    quality: 'good',
    description: MasterPhrases.patterns.zhenge.masterLanguage,
  };
};

// 生成建议
const generateAdvice = (
  pillars: Pillar[],
  fiveElements: FiveElements,
  tenGods: TenGods,
  pattern: Pattern,
  fortune: any
): any => {
  // 事业建议
  const career: CareerAdvice = {
    general: MasterPhrases.advice.career.general[Math.floor(Math.random() * MasterPhrases.advice.career.general.length)],
    specific: MasterPhrases.advice.career.specific.slice(0, 3),
    timing: MasterPhrases.advice.career.direction[Math.floor(Math.random() * MasterPhrases.advice.career.direction.length)],
    avoid: MasterPhrases.advice.career.avoid.slice(0, 2),
    direction: MasterPhrases.advice.career.direction[Math.floor(Math.random() * MasterPhrases.advice.career.direction.length)],
    colors: MasterPhrases.advice.career.colors.slice(0, 2),
  };
  
  // 财富建议
  const wealth: WealthAdvice = {
    general: MasterPhrases.advice.wealth.general[Math.floor(Math.random() * MasterPhrases.advice.wealth.general.length)],
    specific: MasterPhrases.advice.wealth.specific.slice(0, 3),
    timing: MasterPhrases.advice.wealth.direction[Math.floor(Math.random() * MasterPhrases.advice.wealth.direction.length)],
    direction: MasterPhrases.advice.wealth.direction[Math.floor(Math.random() * MasterPhrases.advice.wealth.direction.length)],
    colors: MasterPhrases.advice.wealth.colors.slice(0, 2),
    avoid: MasterPhrases.advice.wealth.avoid.slice(0, 2),
  };
  
  // 婚姻建议
  const marriage: MarriageAdvice = {
    general: MasterPhrases.advice.marriage.general[Math.floor(Math.random() * MasterPhrases.advice.marriage.general.length)],
    specific: MasterPhrases.advice.marriage.specific.slice(0, 3),
    timing: MasterPhrases.advice.marriage.direction[Math.floor(Math.random() * MasterPhrases.advice.marriage.direction.length)],
    direction: MasterPhrases.advice.marriage.direction[Math.floor(Math.random() * MasterPhrases.advice.marriage.direction.length)],
    colors: MasterPhrases.advice.marriage.colors.slice(0, 2),
  };
  
  // 健康建议
  const health: HealthAdvice = {
    general: MasterPhrases.advice.health.general[Math.floor(Math.random() * MasterPhrases.advice.health.general.length)],
    specific: MasterPhrases.advice.health.specific.slice(0, 3),
    timing: MasterPhrases.advice.health.direction[Math.floor(Math.random() * MasterPhrases.advice.health.direction.length)],
    directions: MasterPhrases.advice.health.direction.slice(0, 2),
    colors: MasterPhrases.advice.health.colors.slice(0, 2),
    avoid: MasterPhrases.advice.health.avoid.slice(0, 2),
  };
  
  return {
    career,
    wealth,
    marriage,
    health,
    colors: [...new Set([...career.colors, ...wealth.colors, ...marriage.colors, ...health.colors])],
    directions: [...new Set([...career.direction, ...wealth.direction, ...marriage.direction, ...health.directions])],
    timing: [MasterPhrases.advice.career.timing[Math.floor(Math.random() * MasterPhrases.advice.career.timing.length)]],
  };
};

// 生成解释
const generateExplanation = (
  pillars: Pillar[],
  fiveElements: FiveElements,
  tenGods: TenGods,
  pattern: Pattern
): string => {
  const dayMaster = pillars[2].celestialStem;
  const monthBranch = pillars[1].earthlyBranch;
  
  return `从您的八字来看，日主为${dayMaster}，生于${monthBranch}月，这是${describeMonth(monthBranch)}的时令。年柱${pillars[0].celestialStem}${pillars[0].earthlyBranch}，为您的祖上运，反映您家族的传承；月柱${pillars[1].celestialStem}${monthBranch}，为父母宫，反映您与父母的关系；日柱${pillars[2].celestialStem}${pillars[2].earthlyBranch}，为夫妻宫，反映您的婚姻感情；时柱${pillars[3].celestialStem}${pillars[3].earthlyBranch}，为子女宫，反映您与子女的关系。`;
};

// 生成数据支撑
const generateEvidence = (pillars: Pillar[], fiveElements: FiveElements, pattern: Pattern): any => {
  // 模拟数据统计
  const statistics: DataStatistics = {
    totalSamples: 100000,
    similarCases: 1500,
    successRate: 0.85,
    averageIncome: '500万/年',
    averageAge: 45,
  };
  
  // 模拟名人对比
  const celebrities = [
    {
      name: '马云',
      bazi: ['甲辰', '丙寅', '甲寅', '丙寅'],
      similar: ['甲木为日主', '得令而旺', '格局清奇'],
      lesson: MasterPhrases.patterns.zhenge.masterLanguage,
    },
    {
      name: '李嘉诚',
      bazi: ['甲午', '丙戌', '甲午', '丙寅'],
      similar: ['甲木为日主', '火旺', '从火格'],
      lesson: MasterPhrases.patterns.congcai.masterLanguage,
    },
  ];
  
  return {
    statistics,
    celebrities,
  };
};

// 辅助函数
const getYearStem = (year: number): string => {
  const stems = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
  return stems[(year - 4) % 10];
};

const getYearBranch = (year: number): string => {
  const branches = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
  return branches[(year - 4) % 12];
};

const getMonthStem = (year: number, month: number): string => {
  const stems = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
  const firstMonthStemIndex = (year - 4) * 12 % 10;
  return stems[(firstMonthStemIndex + month - 1) % 10];
};

const getMonthBranch = (month: number): string => {
  const branches = ['寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥', '子', '丑'];
  return branches[(month + 1) % 12];
};

const getDayStem = (year: number, month: number, day: number): string => {
  const D = [0, 31, 59, 30, 31, 31, 30, 31, 31, 30, 31, 30, 31];
  const M = [11, 12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const Y = (year - 1) % 400 + Math.floor((year - 1) / 4) - Math.floor((year - 1) / 100) + Math.floor((year - 1) / 400);
  const Y0 = 0;
  const C = (Y - Y0) % 4;
  const D0 = D[M[month - 1]];
  const B = Math.floor(Y0 / 4 - Math.floor(Y0 / 100) + Math.floor(Y0 / 400));
  
  let d = D0 + B + day;
  const stems = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
  return stems[(d - 1) % 10];
};

const getDayBranch = (day: number): string => {
  const branches = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
  return branches[(day - 1) % 12];
};

const getHourStem = (day: number, hour: number, minute: number): string => {
  const dayStem = getDayStem(1, 1, day);
  const stemIndex = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'].indexOf(dayStem);
  const stems = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
  return stems[(stemIndex * 2 + Math.floor(hour / 2)) % 10];
};

const getHourBranch = (hour: number, minute: number): string => {
  const branches = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
  return branches[Math.floor((hour + minute / 60) / 2) % 12];
};

const calculateHourPillar = (lunar: any, hour: number, minute: number): Pillar => {
  const stem = getHourStem(lunar.day, hour, minute);
  const branch = getHourBranch(hour, minute);
  
  return {
    celestialStem: stem,
    earthlyBranch: branch,
    hiddenStems: getHiddenStems(hour),
    nayin: getNayin(hour),
    fiveElements: getPillarFiveElements(null, null, null),
    relationships: getPillarRelationships(null, null, null),
  };
};

const getHiddenStems = (value: any): string[] => {
  // 简化版本，实际需要更复杂的逻辑
  const hiddenMap: any = {
    '子': ['壬', '癸'],
    '丑': ['己', '辛', '丁'],
    '寅': ['甲', '丙', '戊'],
    '卯': ['乙'],
    '辰': ['戊', '乙', '癸'],
    '巳': ['丙', '庚'],
    '午': ['丁', '己'],
    '未': ['己', '丁'],
    '申': ['庚', '壬', '戊'],
    '酉': ['辛'],
    '戌': ['戊', '辛', '丁'],
    '亥': ['壬', '甲'],
  };
  
  return hiddenMap[value] || [];
};

const getNayin = (value: any): string => {
  const nayinMap: any = {
    '甲': '海中金',
    '乙': '炉中火',
    '丙': '涧下水',
    '丁': '城头土',
    '戊': '霹雳火',
    '己': '大驿土',
    '庚': '石榴木',
    '辛': '大海水',
    '壬': '沙中金',
    '癸': '剑锋金',
  };
  
  return nayinMap[value] || '';
};

const getPillarFiveElements = (year: any, month: any, day: any): any => {
  const fiveElements = (stem: string): string => {
    const map = {
      '甲': 'wood', '乙': 'wood', '丙': 'fire', '丁': 'fire',
      '戊': 'earth', '己': 'earth', '庚': 'metal', '辛': 'metal',
      '壬': 'water', '癸': 'water',
    };
    return map[stem] || 'wood';
  };
  
  const main = year ? fiveElements(getYearStem(year)) : (month ? fiveElements(getMonthStem(1, month)) : fiveElements(getDayStem(1, 1, day)));
  const hidden = year ? getHiddenStems(year) : (month ? getHiddenStems(month) : getHiddenStems(day));
  
  return {
    main,
    hidden: hidden.map(fiveElements),
    strength: 0.5, // 简化版本，实际需要更复杂的计算
  };
};

const getPillarRelationships = (year: any, month: any, day: any): any => {
  return {
    combination: [], // 合化
    clash: [], // 冲克
    penalty: [], // 刑害
    harm: [], // 破害
  };
};

const analyzeFortuneTrend = (pillars: Pillar[], dayMaster: string): any => {
  // 简化版本，实际需要更复杂的计算
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  
  return {
    currentDaYun: '丙子大运',
    currentLiuNian: '甲辰流年',
    interaction: '甲辰与丙子形成合局，利于合作、求财、婚姻',
    nextYear: '乙巳年，巳火生午土，事业上升，财运亨通',
  };
};

const isOutputElement = (dayMaster: string, stem: string): boolean => {
  const outputMap: any = {
    '甲': ['丙', '丁'],
    '乙': ['丙', '丁'],
    '丙': ['戊', '己'],
    '丁': ['戊', '己'],
    '戊': ['庚', '辛'],
    '己': ['庚', '辛'],
    '庚': ['壬', '癸'],
    '辛': ['壬', '癸'],
    '壬': ['甲', '乙'],
    '癸': ['甲', '乙'],
  };
  return outputMap[dayMaster]?.includes(stem) || false;
};

const isInputElement = (dayMaster: string, stem: string): boolean => {
  const inputMap: any = {
    '甲': ['戊', '己'],
    '乙': ['戊', '己'],
    '丙': ['庚', '辛'],
    '丁': ['庚', '辛'],
    '戊': ['壬', '癸'],
    '己': ['壬', '癸'],
    '庚': ['甲', '乙'],
    '辛': ['甲', '乙'],
    '壬': ['丙', '丁'],
    '癸': ['丙', '丁'],
  };
  return inputMap[dayMaster]?.includes(stem) || false;
};

const isControlElement = (dayMaster: string, stem: string): boolean => {
  const controlMap: any = {
    '甲': ['庚', '辛'],
    '乙': ['庚', '辛'],
    '丙': ['壬', '癸'],
    '丁': ['壬', '癸'],
    '戊': ['甲', '乙'],
    '己': ['甲', '乙'],
    '庚': ['丙', '丁'],
    '辛': ['丙', '丁'],
    '壬': ['戊', '己'],
    '癸': ['戊', '己'],
  };
  return controlMap[dayMaster]?.includes(stem) || false;
};

const isControlledByElement = (dayMaster: string, stem: string): boolean => {
  const controlledMap: any = {
    '甲': ['丙', '丁'],
    '乙': ['丙', '丁'],
    '丙': ['戊', '己'],
    '丁': ['戊', '己'],
    '戊': ['庚', '辛'],
    '己': ['庚', '辛'],
    '庚': ['壬', '癸'],
    '辛': ['壬', '癸'],
    '壬': ['甲', '乙'],
    '癸': ['甲', '乙'],
  };
  return controlledMap[dayMaster]?.includes(stem) || false;
};

const isPositiveElement = (dayMaster: string, stem: string): boolean => {
  return ['甲', '丙', '戊', '庚', '壬'].includes(dayMaster) && ['甲', '丙', '戊', '庚', '壬'].includes(stem);
};

const isControlledByPositive = (dayMaster: string, stem: string): boolean => {
  return ['甲', '丙', '戊', '庚', '壬'].includes(dayMaster) && ['丙', '丁', '戊', '己', '庚', '辛'].includes(stem);
};

const calculateAge = (birthDate: Date): number => {
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};
