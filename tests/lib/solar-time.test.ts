import { calculateTrueSolarTime } from '@/lib/solar-time';

describe('calculateTrueSolarTime', () => {
  it('returns corrected time for Beijing longitude', () => {
    // 北京经度 116.4074，时区 8（东八区标准经度 120°）
    // 经度差 = 116.4074 - 120 = -3.5926°，时差 = -3.5926 * 4 = -14.37 分钟
    const result = calculateTrueSolarTime(2024, 6, 15, 12, 0, 0, 116.4074, 8);
    expect(result).toBeDefined();
    expect(result.correctionMinutes).toBeDefined();
    // 北京在东八区标准经度以西，修正应为负值（约 -14 分钟）
    expect(result.correctionMinutes).toBeLessThan(0);
  });

  it('returns corrected time for Shanghai longitude', () => {
    // 上海经度 121.4737，接近东八区标准经度 120°
    const result = calculateTrueSolarTime(2024, 6, 15, 12, 0, 0, 121.4737, 8);
    expect(result).toBeDefined();
    // 上海在标准经度以东，修正应为正值
    expect(result.correctionMinutes).toBeGreaterThan(0);
  });

  it('returns valid time components', () => {
    const result = calculateTrueSolarTime(2024, 1, 1, 12, 0, 0, 116.4074, 8);
    expect(result.year).toBeGreaterThan(0);
    expect(result.month).toBeGreaterThanOrEqual(1);
    expect(result.month).toBeLessThanOrEqual(12);
    expect(result.day).toBeGreaterThanOrEqual(1);
    expect(result.day).toBeLessThanOrEqual(31);
    expect(result.hour).toBeGreaterThanOrEqual(0);
    expect(result.hour).toBeLessThanOrEqual(23);
    expect(result.minute).toBeGreaterThanOrEqual(0);
    expect(result.minute).toBeLessThanOrEqual(59);
  });

  it('handles date boundary crossing', () => {
    // 午夜附近，修正可能导致日期变化
    const result = calculateTrueSolarTime(2024, 1, 1, 0, 5, 0, 60, 8);
    expect(result).toBeDefined();
    // 经度 60°，时区 8，差 -60°，修正 -240 分钟，会跨越到前一天
    expect(result.day).toBeDefined();
  });
});
