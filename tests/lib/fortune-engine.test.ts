// @ts-nocheck - lunar-javascript 在测试环境中可能需要特殊处理
import { analyzeFortune, buildCalculationProfile, calculateFourPillars, generateLifeKlineData, resolveBirthLocationProfile } from '@/lib/fortune-engine';

describe('calculateFourPillars', () => {
  const birthDate = new Date(1990, 5, 15); // 1990-06-15
  const birthTime = '14:30';
  const timezone = 8;

  it('returns 4 pillars', () => {
    const pillars = calculateFourPillars(birthDate, birthTime, timezone);
    expect(pillars).toHaveLength(4);
  });

  it('each pillar has required fields', () => {
    const pillars = calculateFourPillars(birthDate, birthTime, timezone);
    pillars.forEach(pillar => {
      expect(pillar.celestialStem).toBeDefined();
      expect(pillar.earthlyBranch).toBeDefined();
      expect(Array.isArray(pillar.hiddenStems)).toBe(true);
      expect(pillar.fiveElements).toBeDefined();
      expect(pillar.relationships).toBeDefined();
    });
  });

  it('celestial stems are valid Chinese characters', () => {
    const validStems = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
    const pillars = calculateFourPillars(birthDate, birthTime, timezone);
    pillars.forEach(pillar => {
      expect(validStems).toContain(pillar.celestialStem);
    });
  });

  it('earthly branches are valid Chinese characters', () => {
    const validBranches = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
    const pillars = calculateFourPillars(birthDate, birthTime, timezone);
    pillars.forEach(pillar => {
      expect(validBranches).toContain(pillar.earthlyBranch);
    });
  });

  it('produces consistent results for same input', () => {
    const pillars1 = calculateFourPillars(birthDate, birthTime, timezone);
    const pillars2 = calculateFourPillars(birthDate, birthTime, timezone);
    expect(pillars1[2].celestialStem).toBe(pillars2[2].celestialStem);
    expect(pillars1[2].earthlyBranch).toBe(pillars2[2].earthlyBranch);
  });

  it('builds calculation profile with birth location and true solar time metadata', () => {
    const location = resolveBirthLocationProfile('北京', timezone);
    const profile = buildCalculationProfile(birthDate, birthTime, '北京', timezone);

    expect(location.longitude).toBeCloseTo(116.4074, 3);
    expect(profile.birthPlace).toBe('北京');
    expect(profile.longitudeEstimate).toBeCloseTo(116.4074, 3);
    expect(profile.trueSolarTimeOffsetMinutes).toBe(-14);
    expect(profile.trueSolarTimeApplied).toBe(false);
    expect(profile.timeStandard).toBe('standard-time');
    expect(profile.notes.join('')).toContain('calculation profile');
  });

  it('can opt into true solar time without changing the default calculation path', () => {
    const standard = buildCalculationProfile(birthDate, birthTime, '北京', timezone);
    const trueSolar = buildCalculationProfile(birthDate, birthTime, '北京', timezone, { useTrueSolarTime: true });

    expect(standard.adjustedBirthTime).toBe('14:30');
    expect(trueSolar.adjustedBirthTime).toBe('14:16');
    expect(trueSolar.trueSolarTimeApplied).toBe(true);
  });
});

describe('generateLifeKlineData', () => {
  const birthDate = new Date(1990, 5, 15);
  const gender = 'male' as const;

  // 构造最小化的 pillars 和 yongShen
  const mockPillars = [
    { celestialStem: '庚', earthlyBranch: '午', hiddenStems: ['丁', '己'], nayin: '', fiveElements: { main: 'metal', hidden: [], strength: 0.5 }, relationships: { combination: [], clash: [], penalty: [], harm: [] } },
    { celestialStem: '丙', earthlyBranch: '午', hiddenStems: ['丁', '己'], nayin: '', fiveElements: { main: 'fire', hidden: [], strength: 0.5 }, relationships: { combination: [], clash: [], penalty: [], harm: [] } },
    { celestialStem: '甲', earthlyBranch: '子', hiddenStems: ['壬', '癸'], nayin: '', fiveElements: { main: 'wood', hidden: [], strength: 0.5 }, relationships: { combination: [], clash: [], penalty: [], harm: [] } },
    { celestialStem: '壬', earthlyBranch: '申', hiddenStems: ['庚', '壬', '戊'], nayin: '', fiveElements: { main: 'water', hidden: [], strength: 0.5 }, relationships: { combination: [], clash: [], penalty: [], harm: [] } },
  ];

  const mockYongShen = {
    yongShen: ['水', '木'],
    jiShen: ['金', '土'],
    xiShen: ['火'],
    qiuShen: [],
    pattern: null,
    tiaohuo: null,
    tongguan: null,
    analysis: '日主偏弱',
    strength: 'weak' as const,
    strengthDesc: '偏弱',
    dayMasterElement: '木',
    score: 30,
  };

  it('generates data for ~20 years', () => {
    const data = generateLifeKlineData(birthDate, gender, mockPillars, mockYongShen);
    expect(data.length).toBeGreaterThan(15);
    expect(data.length).toBeLessThanOrEqual(25);
  });

  it('all scores are within 40-100 range', () => {
    const data = generateLifeKlineData(birthDate, gender, mockPillars, mockYongShen);
    data.forEach(d => {
      expect(d.career).toBeGreaterThanOrEqual(40);
      expect(d.career).toBeLessThanOrEqual(100);
      expect(d.wealth).toBeGreaterThanOrEqual(40);
      expect(d.wealth).toBeLessThanOrEqual(100);
      expect(d.marriage).toBeGreaterThanOrEqual(40);
      expect(d.marriage).toBeLessThanOrEqual(100);
      expect(d.health).toBeGreaterThanOrEqual(40);
      expect(d.health).toBeLessThanOrEqual(100);
    });
  });

  it('produces deterministic results', () => {
    const data1 = generateLifeKlineData(birthDate, gender, mockPillars, mockYongShen);
    const data2 = generateLifeKlineData(birthDate, gender, mockPillars, mockYongShen);
    expect(data1[0].career).toBe(data2[0].career);
    expect(data1[0].wealth).toBe(data2[0].wealth);
    expect(data1[5].marriage).toBe(data2[5].marriage);
  });

  it('each data point has year, 4 scores, and three-layer evidence', () => {
    const data = generateLifeKlineData(birthDate, gender, mockPillars, mockYongShen);
    data.forEach(d => {
      expect(d.year).toBeGreaterThan(1900);
      expect(typeof d.career).toBe('number');
      expect(typeof d.wealth).toBe('number');
      expect(typeof d.marriage).toBe('number');
      expect(typeof d.health).toBe('number');
      expect(d.evidence?.natal.length).toBeGreaterThan(0);
      expect(d.evidence?.dayun.length).toBeGreaterThan(0);
      expect(d.evidence?.liunian.length).toBeGreaterThan(0);
      expect(d.evidence?.drivers.join('')).toContain('流年');
    });
  });

  it('works with null yongShen', () => {
    const data = generateLifeKlineData(birthDate, gender, mockPillars, null);
    expect(data.length).toBeGreaterThan(0);
  });
});

describe('analyzeFortune determinism', () => {
  const input = {
    name: '张三',
    birthDate: new Date(1990, 5, 15),
    birthTime: '14:30',
    birthPlace: '北京',
    timezone: 8,
    gender: 'male' as const,
  };

  const runAnalyze = () => analyzeFortune(
    input.name,
    input.birthDate,
    input.birthTime,
    input.birthPlace,
    input.timezone,
    input.gender
  );

  it('returns stable advice and opening for the same input', () => {
    const first = runAnalyze();
    const second = runAnalyze();

    expect(first.analysis?.opening).toBe(second.analysis?.opening);
    expect(first.advice?.career?.general).toBe(second.advice?.career?.general);
    expect(first.advice?.wealth?.timing).toBe(second.advice?.wealth?.timing);
    expect(first.advice?.timing?.[0]).toBe(second.advice?.timing?.[0]);
    expect(first.advice?.career?.drivers).toEqual(second.advice?.career?.drivers);
    expect(first.advice?.wealth?.risks).toEqual(second.advice?.wealth?.risks);
    expect(first.advice?.marriage?.actions).toEqual(second.advice?.marriage?.actions);
    expect(first.advice?.health?.drivers).toEqual(second.advice?.health?.drivers);
  });

  it('exposes deterministic engine evidence for LLM expression only', () => {
    const first = runAnalyze();
    const second = runAnalyze();
    const evidence = first.analysis?.contextSignals?.engineEvidence as any;

    expect(evidence).toBeDefined();
    expect(evidence.version).toBe('engine-evidence-v2');
    expect(evidence.confidence.score).toBeGreaterThan(0);
    expect(evidence.calculationProfile.birthPlace).toBe(input.birthPlace);
    expect(evidence.calculationProfile.timezone).toBe(input.timezone);
    expect(evidence.evidenceRefs.length).toBeGreaterThan(0);
    expect(evidence.scoringBreakdown.fiveElements).toHaveLength(5);
    evidence.scoringBreakdown.fiveElements.forEach((item: any) => {
      expect(typeof item.stemPower).toBe('number');
      expect(typeof item.branchPower).toBe('number');
      expect(typeof item.hiddenStemPower).toBe('number');
      expect(typeof item.seasonalPower).toBe('number');
      expect(typeof item.rootedPower).toBe('number');
      expect(typeof item.relationAdjustedStrength).toBe('number');
    });
    expect(evidence.scoringBreakdown.pillarRelations).toBeDefined();
    expect(Array.isArray(evidence.secondarySignals.pillarRelations.heavenlyStemCombinations)).toBe(true);
    expect(Array.isArray(evidence.secondarySignals.shenSha)).toBe(true);
    evidence.secondarySignals.shenSha.forEach((item: any) => {
      expect(typeof item.weight).toBe('number');
      expect(typeof item.domain).toBe('string');
      expect(item.plainLanguage).toContain('辅助');
    });
    expect(evidence.notes.join('')).toContain('神煞仅进入辅助信号');
    expect(evidence.fiveElementRanking).toHaveLength(5);
    evidence.fiveElementRanking.forEach((item: any) => {
      expect(['木', '火', '土', '金', '水']).toContain(item.element);
      expect(typeof item.strength).toBe('number');
      expect(['用神', '喜神', '忌神', '仇神', '闲神']).toContain(item.role);
    });
    expect(evidence.stageResults).toEqual(evidence.measurementResults);
    expect(evidence.measurementResults.map((item: any) => item.id)).toEqual([
      'pillars',
      'five-elements',
      'day-master-strength',
      'pattern',
      'ten-gods',
      'yong-shen',
      'shen-sha',
      'dayun',
      'kline',
      'domain-advice',
    ]);
    evidence.measurementResults.forEach((stage: any, index: number) => {
      expect(stage.order).toBe(index + 1);
      expect(typeof stage.score).toBe('number');
      expect(stage.score).toBeGreaterThanOrEqual(95);
      expect(stage.level).toBe('strong');
      expect(stage.conclusion.length).toBeGreaterThan(0);
      expect(Array.isArray(stage.evidence)).toBe(true);
      expect(Array.isArray(stage.risks)).toBe(true);
      expect(Array.isArray(stage.actions)).toBe(true);
    });
    expect(evidence.measurementResults).toEqual((second.analysis?.contextSignals?.engineEvidence as any).measurementResults);
    expect(evidence.dayMasterStrength.threeGain.reasonChain.join('')).toContain('总分');
    expect(evidence.dayMasterStrength.confidence.reasonChain.join('')).toContain('强弱');
    expect(typeof evidence.dayMasterStrength.threeGain.seasonCommandScore).toBe('number');
    expect(typeof evidence.dayMasterStrength.threeGain.rootSupportScore).toBe('number');
    expect(typeof evidence.dayMasterStrength.threeGain.supportScore).toBe('number');
    expect(typeof evidence.dayMasterStrength.threeGain.drainControlScore).toBe('number');
    expect(['high', 'medium', 'low']).toContain(evidence.dayMasterStrength.confidence.level);
    expect(evidence.tenGodDominance).toEqual((second.analysis?.contextSignals?.engineEvidence as any).tenGodDominance);
    expect(evidence.scoringBreakdown.tenGodStructure).toBeDefined();
    expect(evidence.scoringBreakdown.tenGodStructure).toEqual((second.analysis?.contextSignals?.engineEvidence as any).scoringBreakdown.tenGodStructure);
    expect(evidence.scoringBreakdown.tenGodStructure.categoryBalance.length).toBeGreaterThan(0);
    expect(evidence.scoringBreakdown.tenGodStructure.byPillar).toHaveLength(4);
    expect(Array.isArray(evidence.scoringBreakdown.tenGodStructure.riskPatterns)).toBe(true);
    expect(Array.isArray(evidence.scoringBreakdown.tenGodStructure.opportunityPatterns)).toBe(true);
    expect(evidence.scoringBreakdown.tenGodStructure.lifeDomains.some((item: any) => item.domain === 'career')).toBe(true);
    expect(evidence.scoringBreakdown.tenGodStructure.evidenceChain.join('')).toContain('十神');
    const yongShen = (first.advice as any).yongShen;
    expect(Array.isArray(yongShen)).toBe(true);
    ['career', 'wealth', 'marriage', 'health'].forEach((domain) => {
      const advice = (first.advice as any)[domain];
      expect(advice.drivers.length).toBeGreaterThan(0);
      expect(advice.actions.length).toBeGreaterThan(0);
      expect(Array.isArray(advice.risks)).toBe(true);
    });
    expect(first.advice?.career?.general).toContain('职业判断先看');
    expect(first.advice?.wealth?.general).toContain('财富判断看');
    expect(first.advice?.marriage?.general).toContain('关系判断看');
    expect(first.advice?.health?.general).toContain('非医学建议');
    expect((first.advice as any).health.actions.join('')).toContain('不做医学诊断');
    expect((first.analysis?.contextSignals?.engineEvidence as any).evidenceRefs.some((ref: any) => ref.id === 'yong-shen')).toBe(true);
    expect(first.analysis?.enhancementNotes?.join('')).toContain('LLM 仅做表达修饰');
    expect((first.pattern as any).primaryPattern || first.pattern.type).toContain('格');
    expect(typeof (first.pattern as any).qualityScore).toBe('number');
    expect((first.pattern as any).explanation).toContain('结合日主');
    expect(first.analysis?.explanation).toContain('引擎证据显示');
  });
});

describe('golden samples and edge coverage', () => {
  const samples = [
    { name: '北京男命标准样本', date: new Date(1988, 1, 4), time: '06:45', place: '北京', timezone: 8, gender: 'male' as const },
    { name: '上海女命标准样本', date: new Date(1995, 9, 23), time: '22:10', place: '上海', timezone: 8, gender: 'female' as const },
    { name: '海外经度样本', date: new Date(1979, 11, 31), time: '23:50', place: 'longitude=-74.006', timezone: -5, gender: 'male' as const },
  ];

  it('keeps golden samples deterministic and evidence-complete', () => {
    samples.forEach((sample) => {
      const first = analyzeFortune(sample.name, sample.date, sample.time, sample.place, sample.timezone, sample.gender);
      const second = analyzeFortune(sample.name, sample.date, sample.time, sample.place, sample.timezone, sample.gender);
      const evidence = first.analysis?.contextSignals?.engineEvidence as any;

      expect(first.basic.pillars).toHaveLength(4);
      expect(first.pattern.type).toBe(second.pattern.type);
      expect(first.fortune.currentDaYun).toBe(second.fortune.currentDaYun);
      expect(first.klineData?.[0].evidence).toEqual(second.klineData?.[0].evidence);
      expect(evidence.version).toBe('engine-evidence-v2');
      expect(evidence.calculationProfile.timezone).toBe(sample.timezone);
      expect(evidence.scoringBreakdown.tenGodStructure.byPillar).toHaveLength(4);
      expect(evidence.dayMasterStrength.threeGain.reasonChain.length).toBeGreaterThan(0);
      expect(first.klineData?.some((item: any) => item.evidence?.dayun?.length && item.evidence?.liunian?.length)).toBe(true);
      expect((first.advice as any).career.actions.length).toBeGreaterThan(0);
      expect((first.advice as any).wealth.drivers.length).toBeGreaterThan(0);
      expect((first.advice as any).marriage.actions.length).toBeGreaterThan(0);
      expect((first.advice as any).health.actions.join('')).toContain('不做医学诊断');
      evidence.measurementResults.forEach((stage: any) => {
        expect(stage.score).toBeGreaterThanOrEqual(95);
        expect(stage.level).toBe('strong');
      });
    });
  });

  it('covers location confidence, explicit longitude, and true-solar boundary metadata', () => {
    const unknown = resolveBirthLocationProfile('未知小镇', 8);
    const explicit = resolveBirthLocationProfile('longitude=-74.006', -5);
    const trueSolar = buildCalculationProfile(new Date(1990, 0, 1), '00:05', 'longitude=100', 8, { useTrueSolarTime: true });

    expect(unknown.confidence).toBe('low');
    expect(unknown.longitude).toBe(120);
    expect(explicit.confidence).toBe('high');
    expect(explicit.longitude).toBeCloseTo(-74.006, 3);
    expect(trueSolar.trueSolarTimeApplied).toBe(true);
    expect(trueSolar.timeStandard).toBe('true-solar-time');
    expect(trueSolar.adjustedBirthTime).toBe('22:45');
    expect(trueSolar.adjustedBirthDate.getDate()).toBe(31);
  });
});
