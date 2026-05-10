import { detectDayunTransition } from '@/lib/life-timing/detectors/dayun-transition';
import type { DetectorInput } from '@/lib/life-timing/types';
import type { DayunInfo, DayunResult } from '@/lib/dayun-calculator';

function makeDayun(startAge: number, ganZhi: string): DayunInfo {
  return {
    index: 0,
    startAge,
    endAge: startAge + 9,
    startYear: 1990 + startAge,
    endYear: 1999 + startAge,
    gan: ganZhi.charAt(0),
    zhi: ganZhi.charAt(1),
    ganZhi,
    ganWuxing: '木',
    zhiWuxing: '木',
    yongShenMatch: 'neutral',
    quality: 'neutral',
    description: '',
    isCurrent: false,
  };
}

function makeInput(currentDate: Date, dayuns: DayunInfo[]): DetectorInput {
  return {
    bazi: {
      yearGan: '庚', yearZhi: '午',
      monthGan: '庚', monthZhi: '辰',
      dayGan: '甲', dayZhi: '寅',
      hourGan: '甲', hourZhi: '子',
    },
    birthDate: new Date(1990, 4, 15),
    currentDate,
    dayunResult: { startAge: 5, dayuns, currentDayun: null, currentDayunYear: 0 } as DayunResult,
  };
}

describe('detectDayunTransition', () => {
  it('当前 35 岁，下个大运 36 岁 → 命中', () => {
    const dayuns = [makeDayun(25, '乙亥'), makeDayun(35, '甲戌')];
    const input = makeInput(new Date(2025, 4, 15), dayuns);
    const points = detectDayunTransition(input);
    const shift = points.find((p) => p.context.ganZhi === '甲戌');
    expect(shift).toBeDefined();
    expect(shift!.severity).toBe('critical');
  });

  it('当前 30 岁，下个大运 35 岁 → 不命中', () => {
    const dayuns = [makeDayun(25, '乙亥'), makeDayun(35, '甲戌')];
    const input = makeInput(new Date(2020, 4, 15), dayuns);
    const points = detectDayunTransition(input);
    expect(points.length).toBe(0);
  });

  it('未来 12 月内换大运 → 1 个 critical 时点', () => {
    const dayuns = [makeDayun(25, '乙亥'), makeDayun(35, '甲戌')];
    const input = makeInput(new Date(2025, 0, 15), dayuns);
    const points = detectDayunTransition(input);
    const critical = points.filter((p) => p.severity === 'critical');
    expect(critical.length).toBe(1);
  });

  it('rawReason 含大运干支和年龄', () => {
    const dayuns = [makeDayun(35, '甲戌')];
    const input = makeInput(new Date(2025, 4, 15), dayuns);
    const points = detectDayunTransition(input);
    expect(points[0].rawReason).toMatch(/甲戌大运|35.*岁|10 年/);
  });

  it('startDate 提前 30 天', () => {
    const dayuns = [makeDayun(35, '甲戌')];
    const input = makeInput(new Date(2025, 0, 15), dayuns);
    const points = detectDayunTransition(input);
    const shift = points[0];
    const start = new Date(shift.startDate);
    expect(start.getFullYear()).toBe(2025);
    expect(start.getMonth()).toBe(3);
  });

  it('DayunResult.dayuns 为空 → 返回空数组', () => {
    const input = makeInput(new Date(2025, 4, 15), []);
    const points = detectDayunTransition(input);
    expect(points).toEqual([]);
  });

  it('id 含干支和年龄', () => {
    const dayuns = [makeDayun(35, '甲戌')];
    const input = makeInput(new Date(2025, 0, 15), dayuns);
    const points = detectDayunTransition(input);
    expect(points[0].id).toMatch(/^dayun_甲戌_35$/);
  });

  it('context 含 ganZhi/startAge/startDate', () => {
    const dayuns = [makeDayun(35, '甲戌')];
    const input = makeInput(new Date(2025, 0, 15), dayuns);
    const points = detectDayunTransition(input);
    expect(points[0].context.ganZhi).toBe('甲戌');
    expect(points[0].context.startAge).toBe(35);
  });
});
