// 单元测试 - 五行分析器
import { describe, it, expect } from '@jest/globals';
import { FiveElementsAnalyzer } from '../analyzers/five-elements.analyzer';
import type { Pillar } from '../types';

describe('FiveElementsAnalyzer', () => {
  const analyzer = new FiveElementsAnalyzer();

  describe('analyze', () => {
    it('should analyze five elements correctly', () => {
      const baziStr = ['甲子', '丙寅', '戊辰', '庚午'];
      const pillars: Pillar[] = [
        { celestialStem: '甲', earthlyBranch: '子', element: 'wood', hidden: [] },
        { celestialStem: '丙', earthlyBranch: '寅', element: 'fire', hidden: [] },
        { celestialStem: '戊', earthlyBranch: '辰', element: 'earth', hidden: [] },
        { celestialStem: '庚', earthlyBranch: '午', element: 'metal', hidden: [] },
      ];

      const result = analyzer.analyze(baziStr, pillars);

      expect(result).toHaveProperty('wood');
      expect(result).toHaveProperty('fire');
      expect(result).toHaveProperty('earth');
      expect(result).toHaveProperty('metal');
      expect(result).toHaveProperty('water');
      expect(result).toHaveProperty('balance');
      expect(result).toHaveProperty('dominant');
      expect(result).toHaveProperty('lacking');

      expect(result.wood.strength).toBeGreaterThanOrEqual(0);
      expect(result.wood.percentage).toBeGreaterThanOrEqual(0);
      expect(result.wood.percentage).toBeLessThanOrEqual(100);
    });

    it('should identify dominant elements', () => {
      const baziStr = ['甲寅', '乙卯', '甲辰', '乙巳']; // 木旺
      const pillars: Pillar[] = [
        { celestialStem: '甲', earthlyBranch: '寅', element: 'wood', hidden: [] },
        { celestialStem: '乙', earthlyBranch: '卯', element: 'wood', hidden: [] },
        { celestialStem: '甲', earthlyBranch: '辰', element: 'wood', hidden: [] },
        { celestialStem: '乙', earthlyBranch: '巳', element: 'wood', hidden: [] },
      ];

      const result = analyzer.analyze(baziStr, pillars);

      expect(result.dominant).toContain('wood');
      expect(result.wood.strength).toBeGreaterThan(result.metal.strength);
    });

    it('should identify lacking elements', () => {
      const baziStr = ['甲寅', '乙卯', '甲辰', '乙巳']; // 缺金水
      const pillars: Pillar[] = [
        { celestialStem: '甲', earthlyBranch: '寅', element: 'wood', hidden: [] },
        { celestialStem: '乙', earthlyBranch: '卯', element: 'wood', hidden: [] },
        { celestialStem: '甲', earthlyBranch: '辰', element: 'wood', hidden: [] },
        { celestialStem: '乙', earthlyBranch: '巳', element: 'wood', hidden: [] },
      ];

      const result = analyzer.analyze(baziStr, pillars);

      expect(result.lacking.length).toBeGreaterThan(0);
    });
  });
});
