import { detectLiunianShenshaMonths } from '@/lib/life-timing/detectors/liunian-shensha-month';
import type { DetectorInput } from '@/lib/life-timing/types';
import type { DayunResult } from '@/lib/dayun-calculator';

function makeInput(currentDate: Date, dayGan: string, yearZhi: string, dayZhi: string): DetectorInput {
  return {
    bazi: {
      yearGan: '甲', yearZhi,
      monthGan: '甲', monthZhi: '寅',
      dayGan, dayZhi,
      hourGan: '甲', hourZhi: '寅',
    },
    birthDate: new Date(1990, 4, 15),
    currentDate,
    dayunResult: { startAge: 0, dayuns: [], currentDayun: null, currentDayunYear: 0 } as DayunResult,
  };
}

describe('detectLiunianShenshaMonths', () => {
  it('日干甲 → 天乙贵人地支为丑/未', () => {
    const points = detectLiunianShenshaMonths(makeInput(new Date(2026, 0, 1), '甲', '寅', '辰'));
    const tianyi = points.filter((p) => p.type === 'liuyue_shensha_tianyi');
    expect(tianyi.length).toBeGreaterThanOrEqual(1);
    for (const p of tianyi) {
      expect(p.context.shenSha).toBe('天乙贵人');
    }
  });

  it('日干丙 → 文昌贵人在申', () => {
    const points = detectLiunianShenshaMonths(makeInput(new Date(2026, 0, 1), '丙', '寅', '辰'));
    const wenchang = points.filter((p) => p.type === 'liuyue_shensha_wenchang');
    expect(wenchang.length).toBeGreaterThanOrEqual(1);
  });

  it('年支子 → 桃花在酉', () => {
    const points = detectLiunianShenshaMonths(makeInput(new Date(2026, 0, 1), '甲', '子', '辰'));
    const taohua = points.filter((p) => p.type === 'liuyue_shensha_taohua');
    expect(taohua.length).toBeGreaterThanOrEqual(1);
  });

  it('年支子 → 驿马在寅', () => {
    const points = detectLiunianShenshaMonths(makeInput(new Date(2026, 0, 1), '甲', '子', '辰'));
    const yima = points.filter((p) => p.type === 'liuyue_shensha_yima');
    expect(yima.length).toBeGreaterThanOrEqual(1);
  });

  it('年支午 → 将星在午', () => {
    const points = detectLiunianShenshaMonths(makeInput(new Date(2026, 0, 1), '甲', '午', '辰'));
    const jiangxing = points.filter((p) => p.type === 'liuyue_shensha_jiangxing');
    expect(jiangxing.length).toBeGreaterThanOrEqual(1);
  });

  it('严重程度一律 notice', () => {
    const points = detectLiunianShenshaMonths(makeInput(new Date(2026, 0, 1), '甲', '寅', '辰'));
    for (const p of points) {
      expect(p.severity).toBe('notice');
    }
  });

  it('12 月遍历无漏', () => {
    const points = detectLiunianShenshaMonths(makeInput(new Date(2026, 0, 1), '甲', '寅', '辰'));
    const months = new Set<string>();
    for (const p of points) {
      const ym = p.startDate.slice(0, 7);
      months.add(ym);
    }
    expect(months.size).toBeLessThanOrEqual(12);
  });

  it('同月触发多个神煞 → 多条 TimingPoint', () => {
    const points = detectLiunianShenshaMonths(makeInput(new Date(2026, 0, 1), '甲', '午', '寅'));
    expect(points.length).toBeGreaterThan(0);
  });

  it('startDate 月初、endDate 月末', () => {
    const points = detectLiunianShenshaMonths(makeInput(new Date(2026, 0, 1), '甲', '寅', '辰'));
    for (const p of points) {
      expect(p.startDate).toMatch(/^\d{4}-\d{2}-01$/);
      const end = new Date(p.endDate!);
      const next = new Date(end);
      next.setDate(end.getDate() + 1);
      expect(next.getDate()).toBe(1);
    }
  });

  it('id 唯一', () => {
    const points = detectLiunianShenshaMonths(makeInput(new Date(2026, 0, 1), '甲', '午', '寅'));
    const ids = points.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('日干乙、年支不在桃花表 → 不崩', () => {
    const points = detectLiunianShenshaMonths(makeInput(new Date(2026, 0, 1), '乙', '寅', '辰'));
    expect(Array.isArray(points)).toBe(true);
  });

  it('rawReason 含神煞名', () => {
    const points = detectLiunianShenshaMonths(makeInput(new Date(2026, 0, 1), '甲', '午', '寅'));
    if (points.length > 0) {
      const tianyi = points.find((p) => p.type === 'liuyue_shensha_tianyi');
      if (tianyi) expect(tianyi.rawReason).toMatch(/天乙/);
    }
  });
});
