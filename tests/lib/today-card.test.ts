import { buildTodayCardForFortune } from '@/lib/today-card';

const baseFortune = {
  id: 'test-1',
  bazi: {
    dayMaster: '甲',
    pillars: [
      { celestialStem: '甲', earthlyBranch: '子' },
      { celestialStem: '丙', earthlyBranch: '寅' },
      { celestialStem: '戊', earthlyBranch: '午' },
      { celestialStem: '庚', earthlyBranch: '申' },
    ],
  },
} as any;

describe('today-card', () => {
  it('builds a card with consistent fields for a fixed date', () => {
    const card = buildTodayCardForFortune(baseFortune, new Date('2026-05-19T08:00:00+08:00'));
    expect(card).not.toBeNull();
    expect(card!.date).toBe('2026-05-19');
    expect(card!.dayPillar).toMatch(/日$/);
    expect(card!.doTags.length).toBeGreaterThan(0);
    expect(card!.doTags.length).toBeLessThanOrEqual(4);
    expect(card!.avoidTags.length).toBeGreaterThan(0);
    expect(card!.avoidTags.length).toBeLessThanOrEqual(4);
    expect(['auspicious', 'neutral', 'caution']).toContain(card!.toneLabel);
    expect(typeof card!.windowHint).toBe('string');
  });

  it('returns null when bazi/pillars missing', () => {
    expect(buildTodayCardForFortune({ id: 'bad' } as any)).toBeNull();
    expect(
      buildTodayCardForFortune({
        id: 'bad2',
        bazi: { dayMaster: '甲', pillars: [] },
      } as any)
    ).toBeNull();
  });

  it('detects relations between today branch and fortune branches', () => {
    // 2026-05-19 北京时间 -> 癸巳日；命局含 寅(刑巳)/申(合巳/刑巳)
    const card = buildTodayCardForFortune(baseFortune, new Date('2026-05-19T08:00:00+08:00'));
    expect(card!.relations.he).toContain('申');
    expect(card!.relations.xing.length).toBeGreaterThan(0);
  });

  it('produces stable shiShen tag for same dayMaster', () => {
    const c1 = buildTodayCardForFortune(baseFortune, new Date('2026-05-19T08:00:00+08:00'));
    const c2 = buildTodayCardForFortune(baseFortune, new Date('2026-05-19T20:00:00+08:00'));
    expect(c1!.todayShiShen).toBe(c2!.todayShiShen);
    expect(c1!.dayPillar).toBe(c2!.dayPillar);
  });
});
