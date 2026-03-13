// K线数据生成器 - 单一职责：生成运势K线图数据
import type { Pillar } from '../types';
import type { YongShenResult } from '../../bazi-analyzer';
import type { DayunResult } from '../../dayun-calculator';

interface KlineDataPoint {
  year: number;
  career: number;
  wealth: number;
  marriage: number;
  health: number;
}

export class KlineDataGenerator {
  generate(
    birthDate: Date,
    gender: 'male' | 'female',
    pillars: Pillar[],
    yongShenResult: YongShenResult | null,
    dayunResult: DayunResult
  ): KlineDataPoint[] {
    const data: KlineDataPoint[] = [];
    const currentYear = new Date().getFullYear();
    const birthYear = birthDate.getFullYear();
    const currentAge = currentYear - birthYear;
    const seedBase = [
      birthYear,
      gender,
      pillars.map((pillar) => `${pillar.celestialStem}${pillar.earthlyBranch}`).join('|'),
      (yongShenResult?.yongShen || []).join(','),
      (yongShenResult?.jiShen || []).join(','),
    ].join(':');

    // 生成从出生到当前年龄的K线数据
    for (let age = 0; age <= currentAge + 10; age++) {
      const year = birthYear + age;
      const dayun = this.findDayunForAge(dayunResult, age);
      const score = this.getDayunScore(dayun);

      // 基于大运分数生成K线数据
      const baseValue = score;
      const volatility = 10; // 波动范围

      const open = baseValue + this.seededOffset(`${seedBase}:${year}:open`, volatility);
      const close = baseValue + this.seededOffset(`${seedBase}:${year}:close`, volatility);
      const high = Math.max(open, close) + Math.abs(this.seededOffset(`${seedBase}:${year}:high`, volatility / 2));
      const low = Math.min(open, close) - Math.abs(this.seededOffset(`${seedBase}:${year}:low`, volatility / 2));

      data.push({
        year,
        career: Math.max(0, Math.min(100, close)),
        wealth: Math.max(0, Math.min(100, high)),
        marriage: Math.max(0, Math.min(100, open)),
        health: Math.max(0, Math.min(100, low)),
      });
    }

    return data;
  }

  private findDayunForAge(dayunResult: DayunResult, age: number) {
    return dayunResult.dayuns.find(
      (period) => age >= period.startAge && age <= period.endAge
    );
  }

  private getDayunScore(dayun: DayunResult['currentDayun'] | DayunResult['dayuns'][number] | undefined): number {
    if (!dayun) return 50;

    switch (dayun.quality) {
      case 'excellent':
        return 88;
      case 'good':
        return 72;
      case 'neutral':
        return 56;
      case 'bad':
        return 42;
      case 'poor':
        return 28;
      default:
        return 50;
    }
  }

  private seededOffset(seedSource: string, range: number): number {
    const normalized = (this.hashString(seedSource) % 1000) / 999;
    return (normalized - 0.5) * range * 2;
  }

  private hashString(input: string): number {
    let hash = 0;
    for (let index = 0; index < input.length; index++) {
      hash = (hash * 31 + input.charCodeAt(index)) >>> 0;
    }
    return hash;
  }
}
