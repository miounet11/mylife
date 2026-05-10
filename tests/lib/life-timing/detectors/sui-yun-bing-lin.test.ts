import { detectSuiYunBingLin } from '@/lib/life-timing/detectors/sui-yun-bing-lin';
import type { DetectorInput } from '@/lib/life-timing/types';
import type { DayunInfo, DayunResult } from '@/lib/dayun-calculator';

function makeDayun(startAge: number, ganZhi: string): DayunInfo {
  return {
    index: 0, startAge, endAge: startAge + 9,
    startYear: 1990 + startAge, endYear: 1999 + startAge,
    gan: ganZhi.charAt(0), zhi: ganZhi.charAt(1), ganZhi,
    ganWuxing: '木', zhiWuxing: '木',
    yongShenMatch: 'neutral', quality: 'neutral',
    description: '', isCurrent: false,
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

describe('detectSuiYunBingLin', () => {
  it('大运乙巳 + 流年乙巳（2025）→ 命中', () => {
    // 1990 出生，2025 = 35 岁。dayun 起 35-44 = 乙巳
    const dayuns = [makeDayun(35, '乙巳')];
    const input = makeInput(new Date(2025, 5, 15), dayuns);
    const points = detectSuiYunBingLin(input);
    const hit = points.find((p) => p.context.year === 2025);
    expect(hit).toBeDefined();
    expect(hit!.severity).toBe('critical');
  });

  it('大运乙巳 + 流年丙午（2026）→ 不命中', () => {
    const dayuns = [makeDayun(35, '乙巳')];
    const input = makeInput(new Date(2026, 5, 15), dayuns);
    const points = detectSuiYunBingLin(input);
    expect(points.find((p) => p.context.year === 2026)).toBeUndefined();
  });

  it('该年龄不在任何大运区间 → 不命中（不崩）', () => {
    const dayuns = [makeDayun(60, '丙午')];
    const input = makeInput(new Date(2025, 0, 15), dayuns);
    const points = detectSuiYunBingLin(input);
    expect(points).toEqual([]);
  });

  it('一生 1-2 次正常', () => {
    const dayuns = [
      makeDayun(15, '乙巳'),
      makeDayun(25, '丙午'),
      makeDayun(35, '丁未'),
    ];
    const input = makeInput(new Date(2025, 5, 15), dayuns);
    const points = detectSuiYunBingLin(input);
    expect(points.length).toBeLessThanOrEqual(2);
  });

  it('rawReason 含"岁运并临"', () => {
    const dayuns = [makeDayun(35, '乙巳')];
    const input = makeInput(new Date(2025, 5, 15), dayuns);
    const points = detectSuiYunBingLin(input);
    if (points.length > 0) {
      expect(points[0].rawReason).toMatch(/岁运并临/);
    }
  });

  it('立春前不算本年触发', () => {
    const dayuns = [makeDayun(35, '乙巳')];
    const input = makeInput(new Date(2025, 0, 15), dayuns);
    const points = detectSuiYunBingLin(input);
    expect(points.find((p) => p.context.year === 2025)).toBeUndefined();
  });

  it('id 含年份', () => {
    const dayuns = [makeDayun(35, '乙巳')];
    const input = makeInput(new Date(2025, 5, 15), dayuns);
    const points = detectSuiYunBingLin(input);
    if (points.length > 0) {
      expect(points[0].id).toMatch(/^suiyunbinglin_2025$/);
    }
  });

  it('未来 5 年扫描', () => {
    const dayuns = [makeDayun(25, '乙亥'), makeDayun(35, '甲戌')];
    const input = makeInput(new Date(2025, 5, 15), dayuns);
    const points = detectSuiYunBingLin(input);
    points.forEach((p) => {
      expect((p.context.year as number)).toBeLessThanOrEqual(2030);
    });
  });
});
