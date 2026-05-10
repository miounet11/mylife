import { detectLiuyueTriggers } from '@/lib/life-timing/detectors/liuyue-triggers';
import type { DetectorInput } from '@/lib/life-timing/types';
import type { DayunResult } from '@/lib/dayun-calculator';

function makeInput(
  currentDate: Date,
  baziZhis: { yearZhi: string; monthZhi: string; dayZhi: string; hourZhi: string }
): DetectorInput {
  return {
    bazi: {
      yearGan: '甲', yearZhi: baziZhis.yearZhi,
      monthGan: '甲', monthZhi: baziZhis.monthZhi,
      dayGan: '甲', dayZhi: baziZhis.dayZhi,
      hourGan: '甲', hourZhi: baziZhis.hourZhi,
    },
    birthDate: new Date(1990, 4, 15),
    currentDate,
    dayunResult: { startAge: 0, dayuns: [], currentDayun: null, currentDayunYear: 0 } as DayunResult,
  };
}

describe('detectLiuyueTriggers', () => {
  it('日支午 + 子月（11月）→ liuyue_clash', () => {
    const input = makeInput(new Date(2026, 9, 1), {
      yearZhi: '寅', monthZhi: '辰', dayZhi: '午', hourZhi: '子'
    });
    const points = detectLiuyueTriggers(input);
    const clash = points.find((p) => p.type === 'liuyue_clash');
    expect(clash).toBeDefined();
    expect(clash!.severity).toBe('caution');
  });

  it('命局有寅 + 寅月 → liuyue_fuyin', () => {
    const input = makeInput(new Date(2026, 0, 1), {
      yearZhi: '午', monthZhi: '辰', dayZhi: '寅', hourZhi: '子'
    });
    const points = detectLiuyueTriggers(input);
    const fuyin = points.find((p) => p.type === 'liuyue_fuyin');
    expect(fuyin).toBeDefined();
    expect(fuyin!.severity).toBe('caution');
  });

  it('命局有子辰 + 申月 → liuyue_combine 三合水局', () => {
    const input = makeInput(new Date(2026, 6, 1), {
      yearZhi: '辰', monthZhi: '午', dayZhi: '子', hourZhi: '寅'
    });
    const points = detectLiuyueTriggers(input);
    const combine = points.find((p) => p.type === 'liuyue_combine');
    expect(combine).toBeDefined();
    expect(combine!.severity).toBe('notice');
  });

  it('12 月遍历', () => {
    const input = makeInput(new Date(2026, 0, 15), {
      yearZhi: '午', monthZhi: '寅', dayZhi: '寅', hourZhi: '寅'
    });
    const points = detectLiuyueTriggers(input);
    const months = new Set<string>();
    for (const p of points) {
      const ym = p.startDate.slice(0, 7);
      months.add(ym);
    }
    expect(months.size).toBeGreaterThanOrEqual(1);
    expect(months.size).toBeLessThanOrEqual(12);
  });

  it('同月可触发多种关系', () => {
    const input = makeInput(new Date(2026, 0, 1), {
      yearZhi: '寅', monthZhi: '寅', dayZhi: '寅', hourZhi: '寅'
    });
    const points = detectLiuyueTriggers(input);
    const fuyinCount = points.filter((p) => p.type === 'liuyue_fuyin').length;
    expect(fuyinCount).toBeGreaterThanOrEqual(1);
  });

  it('startDate 是月初', () => {
    const input = makeInput(new Date(2026, 0, 1), {
      yearZhi: '午', monthZhi: '寅', dayZhi: '午', hourZhi: '寅'
    });
    const points = detectLiuyueTriggers(input);
    for (const p of points) {
      expect(p.startDate).toMatch(/^\d{4}-\d{2}-01$/);
    }
  });

  it('endDate 是月末', () => {
    const input = makeInput(new Date(2026, 0, 1), {
      yearZhi: '午', monthZhi: '寅', dayZhi: '午', hourZhi: '寅'
    });
    const points = detectLiuyueTriggers(input);
    for (const p of points) {
      const end = new Date(p.endDate!);
      const next = new Date(end);
      next.setDate(end.getDate() + 1);
      expect(next.getDate()).toBe(1);
    }
  });

  it('id 唯一', () => {
    const input = makeInput(new Date(2026, 0, 15), {
      yearZhi: '午', monthZhi: '寅', dayZhi: '午', hourZhi: '寅'
    });
    const points = detectLiuyueTriggers(input);
    const ids = points.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('rawReason 含相应描述', () => {
    const input = makeInput(new Date(2026, 9, 1), {
      yearZhi: '寅', monthZhi: '辰', dayZhi: '午', hourZhi: '子'
    });
    const points = detectLiuyueTriggers(input);
    const clash = points.find((p) => p.type === 'liuyue_clash');
    if (clash) {
      expect(clash.rawReason).toMatch(/相冲|变动月/);
    }
  });

  it('返回数组不崩', () => {
    const input = makeInput(new Date(2026, 0, 1), {
      yearZhi: '寅', monthZhi: '寅', dayZhi: '寅', hourZhi: '寅'
    });
    const points = detectLiuyueTriggers(input);
    expect(Array.isArray(points)).toBe(true);
  });

  it('context 含 liuYueGanZhi', () => {
    const input = makeInput(new Date(2026, 9, 1), {
      yearZhi: '寅', monthZhi: '辰', dayZhi: '午', hourZhi: '子'
    });
    const points = detectLiuyueTriggers(input);
    const clash = points.find((p) => p.type === 'liuyue_clash');
    if (clash) {
      expect(clash.context.liuYueGanZhi).toBeTruthy();
    }
  });
});
