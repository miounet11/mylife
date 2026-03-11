// K线数据生成器 - 单一职责：生成运势K线图数据
import type { Pillar } from '../types';
import type { YongShenResult } from '../../bazi-analyzer';
import type { DayunResult } from '../../dayun-calculator';

interface KlineDataPoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  label?: string;
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

    // 生成从出生到当前年龄的K线数据
    for (let age = 0; age <= currentAge + 10; age++) {
      const year = birthYear + age;
      const dayun = this.findDayunForAge(dayunResult, age);
      const score = dayun?.score || 50;

      // 基于大运分数生成K线数据
      const baseValue = score;
      const volatility = 10; // 波动范围

      const open = baseValue + this.randomOffset(volatility);
      const close = baseValue + this.randomOffset(volatility);
      const high = Math.max(open, close) + Math.abs(this.randomOffset(volatility / 2));
      const low = Math.min(open, close) - Math.abs(this.randomOffset(volatility / 2));

      data.push({
        date: `${year}`,
        open: Math.max(0, Math.min(100, open)),
        high: Math.max(0, Math.min(100, high)),
        low: Math.max(0, Math.min(100, low)),
        close: Math.max(0, Math.min(100, close)),
        volume: Math.floor(Math.random() * 1000) + 500,
        label: age === currentAge ? '当前' : dayun?.label,
      });
    }

    return data;
  }

  private findDayunForAge(dayunResult: DayunResult, age: number) {
    return dayunResult.dayunPeriods.find(
      period => age >= period.startAge && age <= period.endAge
    );
  }

  private randomOffset(range: number): number {
    return (Math.random() - 0.5) * range * 2;
  }
}
