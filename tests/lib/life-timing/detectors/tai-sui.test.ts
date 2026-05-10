import { detectTaiSuiYears } from '@/lib/life-timing/detectors/tai-sui';
import type { DetectorInput } from '@/lib/life-timing/types';
import type { DayunResult } from '@/lib/dayun-calculator';

function makeInput(yearZhi: string, currentDate: Date): DetectorInput {
  return {
    bazi: {
      yearGan: '甲', yearZhi,
      monthGan: '甲', monthZhi: '寅',
      dayGan: '甲', dayZhi: '寅',
      hourGan: '甲', hourZhi: '寅',
    },
    birthDate: new Date(1990, 0, 1),
    currentDate,
    dayunResult: { startAge: 0, dayuns: [], currentDayun: null, currentDayunYear: 0 } as DayunResult,
  };
}

describe('detectTaiSuiYears', () => {
  it('年支午 + 当前 2026/3/1（丙午年）→ 值太岁 critical', () => {
    const points = detectTaiSuiYears(makeInput('午', new Date(2026, 2, 1)));
    const valueTaiSui = points.find((p) => p.type === 'tai_sui_value' && p.context.year === 2026);
    expect(valueTaiSui).toBeDefined();
    expect(valueTaiSui!.severity).toBe('critical');
  });

  it('年支子 + 当前 2026/3/1（丙午年）→ 冲太岁 critical', () => {
    const points = detectTaiSuiYears(makeInput('子', new Date(2026, 2, 1)));
    const clash = points.find((p) => p.type === 'tai_sui_clash' && p.context.year === 2026);
    expect(clash).toBeDefined();
    expect(clash!.severity).toBe('critical');
  });

  it('年支丑 + 2026 → 害太岁 caution', () => {
    const points = detectTaiSuiYears(makeInput('丑', new Date(2026, 2, 1)));
    const harm = points.find((p) => p.type === 'tai_sui_harm' && p.context.year === 2026);
    expect(harm).toBeDefined();
    expect(harm!.severity).toBe('caution');
  });

  it('年支卯 + 2026 → 破太岁 notice', () => {
    const points = detectTaiSuiYears(makeInput('卯', new Date(2026, 2, 1)));
    const breakP = points.find((p) => p.type === 'tai_sui_break' && p.context.year === 2026);
    expect(breakP).toBeDefined();
    expect(breakP!.severity).toBe('notice');
  });

  it('年支戌 + 2026（丙午）→ 三合午戌火局，无 tai_sui 类型命中', () => {
    const points = detectTaiSuiYears(makeInput('戌', new Date(2026, 2, 1)));
    const for2026 = points.filter((p) => p.context.year === 2026);
    expect(for2026.length).toBe(0);
  });

  it('当前 2026/1/15 立春前 + 年支午 → 不算 2026 触发', () => {
    const points = detectTaiSuiYears(makeInput('午', new Date(2026, 0, 15)));
    const for2026 = points.filter((p) => p.context.year === 2026);
    expect(for2026.length).toBe(0);
  });

  it('未来 5 年内最多 5 个不同年份的 tai_sui', () => {
    const points = detectTaiSuiYears(makeInput('午', new Date(2026, 2, 1)));
    const years = new Set(points.map((p) => p.context.year));
    expect(years.size).toBeLessThanOrEqual(5);
  });

  it('rawReason 含年份和干支', () => {
    const points = detectTaiSuiYears(makeInput('午', new Date(2026, 2, 1)));
    const valueTaiSui = points.find((p) => p.type === 'tai_sui_value');
    expect(valueTaiSui!.rawReason).toMatch(/2026|丙午|本命年|值太岁/);
  });

  it('startDate 是当年立春日期', () => {
    const points = detectTaiSuiYears(makeInput('午', new Date(2026, 2, 1)));
    const valueTaiSui = points.find((p) => p.type === 'tai_sui_value' && p.context.year === 2026);
    expect(valueTaiSui!.startDate).toMatch(/^2026-02-0[3-5]$/);
  });

  it('endDate 是次年立春', () => {
    const points = detectTaiSuiYears(makeInput('午', new Date(2026, 2, 1)));
    const valueTaiSui = points.find((p) => p.type === 'tai_sui_value' && p.context.year === 2026);
    expect(valueTaiSui!.endDate).toMatch(/^2027-02-0[3-5]$/);
  });

  it('id 唯一', () => {
    const points = detectTaiSuiYears(makeInput('午', new Date(2026, 2, 1)));
    const ids = points.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
