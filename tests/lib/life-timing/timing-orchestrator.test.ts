import { buildTimingProfile } from '@/lib/life-timing/timing-orchestrator';
import type { DetectorInput } from '@/lib/life-timing/types';
import type { DayunResult, DayunInfo } from '@/lib/dayun-calculator';

function makeDayun(startAge: number, ganZhi: string, quality: 'good' | 'neutral' | 'bad' = 'neutral'): DayunInfo {
  return {
    index: 0, startAge, endAge: startAge + 9,
    startYear: 1990 + startAge, endYear: 1999 + startAge,
    gan: ganZhi.charAt(0), zhi: ganZhi.charAt(1), ganZhi,
    ganWuxing: '木', zhiWuxing: '木',
    yongShenMatch: 'neutral', quality,
    description: '', isCurrent: false,
  };
}

function makeInput(): DetectorInput {
  return {
    bazi: {
      yearGan: '庚', yearZhi: '午',
      monthGan: '庚', monthZhi: '辰',
      dayGan: '甲', dayZhi: '寅',
      hourGan: '甲', hourZhi: '子',
    },
    birthDate: new Date(1990, 4, 15),
    currentDate: new Date(2026, 4, 10),
    pattern: '身旺',
    shenShaList: [{ name: '天乙贵人' }],
    dayunResult: {
      startAge: 5,
      dayuns: [
        makeDayun(5, '辛卯'),
        makeDayun(15, '庚寅'),
        makeDayun(25, '己丑', 'good'),
        makeDayun(35, '戊子'),
      ],
      currentDayun: null,
      currentDayunYear: 0,
    } as DayunResult,
  };
}

describe('buildTimingProfile', () => {
  it('返回完整 TimingProfile 结构', () => {
    const profile = buildTimingProfile(makeInput());
    expect(profile.birthSignature).toBeTruthy();
    expect(profile.baziPillars).toBe('庚午|庚辰|甲寅|甲子');
    expect(profile.computedAt).toBeTruthy();
    expect(profile.computedForYear).toBeTruthy();
    expect(Array.isArray(profile.past_validations)).toBe(true);
    expect(Array.isArray(profile.next_30_days)).toBe(true);
    expect(Array.isArray(profile.next_12_months)).toBe(true);
    expect(Array.isArray(profile.next_5_years)).toBe(true);
  });

  it('next_30_days 只含 ≤30 天内', () => {
    const profile = buildTimingProfile(makeInput());
    const cutoff = new Date(2026, 5, 9);
    for (const point of profile.next_30_days) {
      const date = new Date(point.startDate);
      expect(date.getTime()).toBeLessThanOrEqual(cutoff.getTime() + 86400000);
    }
  });

  it('next_12_months 只含 30-365 天内', () => {
    const profile = buildTimingProfile(makeInput());
    const cutoff30 = new Date(2026, 5, 9);
    const cutoff365 = new Date(2027, 4, 10);
    for (const point of profile.next_12_months) {
      const date = new Date(point.startDate);
      expect(date.getTime()).toBeGreaterThanOrEqual(cutoff30.getTime() - 86400000);
      expect(date.getTime()).toBeLessThanOrEqual(cutoff365.getTime() + 86400000);
    }
  });

  it('next_5_years 含 MajorTransition 类型', () => {
    const profile = buildTimingProfile(makeInput());
    for (const trans of profile.next_5_years) {
      expect(['dayun_shift', 'tai_sui_year', 'sui_yun_bing_lin']).toContain(trans.type);
      expect(typeof trans.year).toBe('number');
      expect(typeof trans.ageAtYear).toBe('number');
    }
  });

  it('next_5_years 按年份升序', () => {
    const profile = buildTimingProfile(makeInput());
    for (let i = 1; i < profile.next_5_years.length; i++) {
      expect(profile.next_5_years[i].year >= profile.next_5_years[i - 1].year).toBe(true);
    }
  });

  it('past_validations 含身旺规则', () => {
    const profile = buildTimingProfile(makeInput());
    expect(profile.past_validations.find((v) => v.id === 'pattern_strong_self')).toBeDefined();
  });

  it('past_validations 含天乙贵人规则', () => {
    const profile = buildTimingProfile(makeInput());
    expect(profile.past_validations.find((v) => v.id === 'shensha_tianyi')).toBeDefined();
  });

  it('birthSignature 含日期', () => {
    const profile = buildTimingProfile(makeInput());
    expect(profile.birthSignature).toMatch(/1990/);
  });

  it('computedForYear 是当前命理年（丙午）', () => {
    const profile = buildTimingProfile(makeInput());
    expect(profile.computedForYear).toBe('丙午');
  });

  it('time points 不重复', () => {
    const profile = buildTimingProfile(makeInput());
    const ids30 = new Set(profile.next_30_days.map((p) => p.id));
    const ids12 = new Set(profile.next_12_months.map((p) => p.id));
    for (const id of ids30) {
      expect(ids12.has(id)).toBe(false);
    }
  });

  it('性能 - sanity check（jest 环境下 ≤ 2000ms，实际 ~100ms）', () => {
    // jest + ts-jest 转译开销让性能测试不稳定，只做 sanity check
    // 真实生产性能见 npm run life-timing:verify 输出
    buildTimingProfile(makeInput());
    const t0 = performance.now();
    buildTimingProfile(makeInput());
    const elapsed = performance.now() - t0;
    expect(elapsed).toBeLessThan(2000);
  });

  it('空 dayuns → 不崩', () => {
    const input = makeInput();
    input.dayunResult.dayuns = [];
    const profile = buildTimingProfile(input);
    expect(profile.next_5_years.length).toBeGreaterThanOrEqual(0);
  });

  it('next_30_days 不含本年立夏（5/5 已过）', () => {
    const profile = buildTimingProfile(makeInput());
    const liXia2026 = profile.next_30_days.find((p) =>
      p.context.termName === '立夏' && p.startDate.startsWith('2026-05')
    );
    expect(liXia2026).toBeUndefined();
  });

  it('next_12_months 含立秋', () => {
    const profile = buildTimingProfile(makeInput());
    const liQiu = profile.next_12_months.find((p) => p.context.termName === '立秋');
    expect(liQiu).toBeDefined();
  });

  it('日期严格升序', () => {
    const profile = buildTimingProfile(makeInput());
    for (let i = 1; i < profile.next_30_days.length; i++) {
      expect(profile.next_30_days[i].startDate >= profile.next_30_days[i - 1].startDate).toBe(true);
    }
    for (let i = 1; i < profile.next_12_months.length; i++) {
      expect(profile.next_12_months[i].startDate >= profile.next_12_months[i - 1].startDate).toBe(true);
    }
  });
});
