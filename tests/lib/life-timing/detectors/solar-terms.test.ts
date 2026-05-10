import { detectSolarTerms } from '@/lib/life-timing/detectors/solar-terms';

describe('detectSolarTerms', () => {
  it('从 2026-04-01 检测 → 含立夏', () => {
    const points = detectSolarTerms(new Date(2026, 3, 1));
    const liXia = points.find((p) => p.context.termName === '立夏');
    expect(liXia).toBeDefined();
    expect(liXia!.severity).toBe('notice');
    expect(liXia!.startDate.startsWith('2026-05-')).toBe(true);
  });

  it('从 2026-05-10 检测 → 不含已过的立夏', () => {
    const points = detectSolarTerms(new Date(2026, 4, 10));
    const liXia2026 = points.find((p) =>
      p.context.termName === '立夏' && p.startDate.startsWith('2026-05')
    );
    expect(liXia2026).toBeUndefined();
  });

  it('从 2026-01-01 检测 → 含立春', () => {
    const points = detectSolarTerms(new Date(2026, 0, 1));
    const liChun = points.find((p) => p.context.termName === '立春');
    expect(liChun).toBeDefined();
    expect(liChun!.severity).toBe('caution');
  });

  it('365 天内必然有 4 主节气（不重复）', () => {
    const points = detectSolarTerms(new Date(2026, 0, 1));
    const distinctTerms = new Set(points.map((p) => p.context.termName));
    expect(distinctTerms.has('立春')).toBe(true);
    expect(distinctTerms.has('立夏')).toBe(true);
    expect(distinctTerms.has('立秋')).toBe(true);
    expect(distinctTerms.has('立冬')).toBe(true);
  });

  it('每个节气有 7 天过渡期', () => {
    const points = detectSolarTerms(new Date(2026, 3, 1));
    for (const point of points) {
      const start = new Date(point.startDate);
      const end = new Date(point.endDate!);
      const days = Math.round((end.getTime() - start.getTime()) / 86400000);
      expect(days).toBe(7);
    }
  });

  it('id 包含节气名和年份', () => {
    const points = detectSolarTerms(new Date(2026, 3, 1));
    const liXia = points.find((p) => p.context.termName === '立夏');
    expect(liXia!.id).toMatch(/^solar_立夏_2026$/);
  });

  it('rawReason 含命理含义', () => {
    const points = detectSolarTerms(new Date(2026, 3, 1));
    expect(points[0].rawReason).toMatch(/节气过渡期|能量切换/);
  });

  it('输出按 startDate 升序', () => {
    const points = detectSolarTerms(new Date(2026, 0, 1));
    for (let i = 1; i < points.length; i++) {
      expect(points[i].startDate >= points[i - 1].startDate).toBe(true);
    }
  });

  it('立春标 caution', () => {
    const points = detectSolarTerms(new Date(2026, 0, 1));
    const liChun = points.find((p) => p.context.termName === '立春');
    expect(liChun!.severity).toBe('caution');
  });

  it('立夏立秋立冬标 notice', () => {
    const points = detectSolarTerms(new Date(2026, 0, 1));
    const others = points.filter((p) =>
      ['立夏', '立秋', '立冬'].includes(p.context.termName as string)
    );
    for (const p of others) {
      expect(p.severity).toBe('notice');
    }
  });
});
