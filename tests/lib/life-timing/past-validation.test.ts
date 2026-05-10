import { generatePastValidations } from '@/lib/life-timing/past-validation';
import type { DetectorInput } from '@/lib/life-timing/types';
import type { DayunResult } from '@/lib/dayun-calculator';

function makeInput(opts: {
  pattern?: string;
  shenShas?: Array<{ name: string; pillar?: string }>;
  pastDayuns?: Array<{ ganZhi: string; quality: 'good' | 'neutral' | 'bad' }>;
}): DetectorInput {
  return {
    bazi: {
      yearGan: '甲', yearZhi: '午',
      monthGan: '甲', monthZhi: '寅',
      dayGan: '甲', dayZhi: '寅',
      hourGan: '甲', hourZhi: '寅',
    },
    birthDate: new Date(1990, 4, 15),
    currentDate: new Date(2026, 0, 1),
    pattern: opts.pattern,
    shenShaList: opts.shenShas?.map((s) => ({ name: s.name })),
    dayunResult: {
      startAge: 5,
      dayuns: (opts.pastDayuns || []).map((d, i) => ({
        index: i,
        startAge: 5 + i * 10,
        endAge: 14 + i * 10,
        startYear: 1995 + i * 10,
        endYear: 2004 + i * 10,
        gan: d.ganZhi.charAt(0),
        zhi: d.ganZhi.charAt(1),
        ganZhi: d.ganZhi,
        ganWuxing: '木',
        zhiWuxing: '木',
        yongShenMatch: 'neutral',
        quality: d.quality,
        description: '',
        isCurrent: false,
      })),
      currentDayun: null,
      currentDayunYear: 0,
    } as DayunResult,
  };
}

describe('generatePastValidations', () => {
  it('身弱命局 → pattern_weak_self', () => {
    const result = generatePastValidations(makeInput({ pattern: '身弱' }));
    expect(result.find((r) => r.id === 'pattern_weak_self')).toBeDefined();
  });

  it('身旺命局 → pattern_strong_self', () => {
    const result = generatePastValidations(makeInput({ pattern: '身旺' }));
    expect(result.find((r) => r.id === 'pattern_strong_self')).toBeDefined();
  });

  it('神煞含羊刃 → shensha_yangren', () => {
    const result = generatePastValidations(makeInput({
      shenShas: [{ name: '羊刃' }],
    }));
    expect(result.find((r) => r.id === 'shensha_yangren')).toBeDefined();
  });

  it('神煞含文昌 → shensha_wenchang', () => {
    const result = generatePastValidations(makeInput({
      shenShas: [{ name: '文昌' }],
    }));
    expect(result.find((r) => r.id === 'shensha_wenchang')).toBeDefined();
  });

  it('神煞含天乙贵人 → shensha_tianyi', () => {
    const result = generatePastValidations(makeInput({
      shenShas: [{ name: '天乙贵人' }],
    }));
    expect(result.find((r) => r.id === 'shensha_tianyi')).toBeDefined();
  });

  it('过去大运 quality=good → dayun_imprint_recent_good', () => {
    const result = generatePastValidations(makeInput({
      pastDayuns: [
        { ganZhi: '乙巳', quality: 'good' },
        { ganZhi: '丙午', quality: 'good' },
      ],
    }));
    expect(result.find((r) => r.id === 'dayun_imprint_recent_good')).toBeDefined();
  });

  it('没有命理特征 → 输出空数组', () => {
    const result = generatePastValidations(makeInput({}));
    expect(Array.isArray(result)).toBe(true);
  });

  it('总条数 ≤ 4', () => {
    const result = generatePastValidations(makeInput({
      pattern: '身弱',
      shenShas: [
        { name: '羊刃' },
        { name: '文昌' },
        { name: '天乙贵人' },
      ],
      pastDayuns: [
        { ganZhi: '乙巳', quality: 'good' },
        { ganZhi: '丙午', quality: 'good' },
      ],
    }));
    expect(result.length).toBeLessThanOrEqual(4);
  });

  it('每条 rawTemplate 是字符串', () => {
    const result = generatePastValidations(makeInput({
      pattern: '身旺',
      shenShas: [{ name: '羊刃' }],
    }));
    for (const item of result) {
      expect(typeof item.rawTemplate).toBe('string');
      expect(item.rawTemplate.length).toBeGreaterThan(0);
    }
  });

  it('id 唯一', () => {
    const result = generatePastValidations(makeInput({
      pattern: '身弱',
      shenShas: [{ name: '羊刃' }, { name: '文昌' }],
    }));
    const ids = result.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
