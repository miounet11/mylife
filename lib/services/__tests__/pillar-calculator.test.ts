// 单元测试 - 四柱计算服务
import { describe, it, expect } from '@jest/globals';
import { PillarCalculatorService } from '../pillar-calculator.service';

describe('PillarCalculatorService', () => {
  const service = new PillarCalculatorService();

  describe('calculate', () => {
    it('should calculate pillars correctly for a known date', () => {
      const birthInfo = {
        date: new Date(1990, 0, 1), // 1990-01-01
        time: '12:00',
        timezone: 8,
      };

      const pillars = service.calculate(birthInfo);

      expect(pillars).toHaveLength(4);
      expect(pillars[0]).toHaveProperty('celestialStem');
      expect(pillars[0]).toHaveProperty('earthlyBranch');
      expect(pillars[1]).toHaveProperty('celestialStem');
      expect(pillars[2]).toHaveProperty('celestialStem');
      expect(pillars[3]).toHaveProperty('celestialStem');
    });

    it('should handle different time zones', () => {
      const birthInfo1 = {
        date: new Date(1990, 0, 1),
        time: '00:00',
        timezone: 8,
      };

      const birthInfo2 = {
        date: new Date(1990, 0, 1),
        time: '00:00',
        timezone: 0,
      };

      const pillars1 = service.calculate(birthInfo1);
      const pillars2 = service.calculate(birthInfo2);

      // Different timezones may result in different hour pillars
      expect(pillars1).toBeDefined();
      expect(pillars2).toBeDefined();
    });
  });

  describe('getDayMaster', () => {
    it('should return the day stem', () => {
      const birthInfo = {
        date: new Date(1990, 0, 1),
        time: '12:00',
        timezone: 8,
      };

      const pillars = service.calculate(birthInfo);
      const dayMaster = service.getDayMaster(pillars);

      expect(dayMaster).toBe(pillars[2].celestialStem);
      expect(dayMaster).toMatch(/^[甲乙丙丁戊己庚辛壬癸]$/);
    });
  });

  describe('toBaziString', () => {
    it('should convert pillars to bazi string array', () => {
      const birthInfo = {
        date: new Date(1990, 0, 1),
        time: '12:00',
        timezone: 8,
      };

      const pillars = service.calculate(birthInfo);
      const baziStr = service.toBaziString(pillars);

      expect(baziStr).toHaveLength(4);
      baziStr.forEach(str => {
        expect(str).toMatch(/^[甲乙丙丁戊己庚辛壬癸][子丑寅卯辰巳午未申酉戌亥]$/);
      });
    });
  });
});
