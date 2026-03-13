// @ts-nocheck - lunar-javascript 在测试环境中可能需要特殊处理
import { analyzeFortune, calculateFourPillars, generateLifeKlineData } from '@/lib/fortune-engine';

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

  it('each data point has year and 4 scores', () => {
    const data = generateLifeKlineData(birthDate, gender, mockPillars, mockYongShen);
    data.forEach(d => {
      expect(d.year).toBeGreaterThan(1900);
      expect(typeof d.career).toBe('number');
      expect(typeof d.wealth).toBe('number');
      expect(typeof d.marriage).toBe('number');
      expect(typeof d.health).toBe('number');
    });
  });

  it('works with null yongShen', () => {
    const data = generateLifeKlineData(birthDate, gender, mockPillars, null);
    expect(data.length).toBeGreaterThan(0);
  });
});

describe('analyzeFortune determinism', () => {
  it('returns stable advice and opening for the same input', () => {
    const input = {
      name: '张三',
      birthDate: new Date(1990, 5, 15),
      birthTime: '14:30',
      birthPlace: '北京',
      timezone: 8,
      gender: 'male' as const,
    };

    const first = analyzeFortune(
      input.name,
      input.birthDate,
      input.birthTime,
      input.birthPlace,
      input.timezone,
      input.gender
    );
    const second = analyzeFortune(
      input.name,
      input.birthDate,
      input.birthTime,
      input.birthPlace,
      input.timezone,
      input.gender
    );

    expect(first.analysis?.opening).toBe(second.analysis?.opening);
    expect(first.advice?.career?.general).toBe(second.advice?.career?.general);
    expect(first.advice?.wealth?.timing).toBe(second.advice?.wealth?.timing);
    expect(first.advice?.timing?.[0]).toBe(second.advice?.timing?.[0]);
  });
});
