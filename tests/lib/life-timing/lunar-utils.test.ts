import { findLiChun, getLiuNianGanZhi, getCurrentLiuNianGanZhi } from '@/lib/life-timing/lunar-utils';

describe('lunar-utils', () => {
  it('findLiChun 2026 是 2/3-2/5', () => {
    const date = findLiChun(2026);
    expect(date.getFullYear()).toBe(2026);
    expect(date.getMonth()).toBe(1);
    expect(date.getDate()).toBeGreaterThanOrEqual(3);
    expect(date.getDate()).toBeLessThanOrEqual(5);
  });

  it('findLiChun 2027 不同年份', () => {
    const date = findLiChun(2027);
    expect(date.getFullYear()).toBe(2027);
    expect(date.getMonth()).toBe(1);
  });

  it('getLiuNianGanZhi 2026 立春后 = 丙午', () => {
    expect(getLiuNianGanZhi(2026)).toBe('丙午');
  });

  it('getLiuNianGanZhi 2025 立春后 = 乙巳', () => {
    expect(getLiuNianGanZhi(2025)).toBe('乙巳');
  });

  it('getCurrentLiuNianGanZhi 立春前 取上一年干支', () => {
    const beforeLiChun = new Date(2026, 0, 15);
    const ganzhi = getCurrentLiuNianGanZhi(beforeLiChun);
    expect(ganzhi).toBe('乙巳');
  });
});
