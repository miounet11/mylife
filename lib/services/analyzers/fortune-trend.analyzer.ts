// 运势趋势分析器 - 单一职责：分析运势走向
import type { FortuneAnalysisResult } from '../types';
import type { YongShenResult } from '../../bazi-analyzer';
import type { DayunResult } from '../../dayun-calculator';

export class FortuneTrendAnalyzer {
  analyze(
    _baziStr: string[],
    birthDate: Date,
    gender: 'male' | 'female',
    yongShenResult: YongShenResult | null,
    dayunResult: DayunResult
  ): FortuneAnalysisResult['fortune'] {
    const currentAge = this.calculateAge(birthDate);
    const currentDayun = this.findCurrentDayun(dayunResult, currentAge);

    return {
      currentDaYun: currentDayun?.ganZhi || '待进入大运',
      currentLiuNian: `${new Date().getFullYear()}流年`,
      interaction: this.analyzeInteraction(currentDayun, yongShenResult),
      nextYear: this.analyzeNextYear(dayunResult, currentAge),
      overall: this.analyzeOverall(yongShenResult, currentDayun),
    };
  }

  private calculateAge(birthDate: Date): number {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }

  private findCurrentDayun(dayunResult: DayunResult, currentAge: number) {
    return dayunResult.currentDayun || dayunResult.dayuns.find(
      (period) => currentAge >= period.startAge && currentAge <= period.endAge
    ) || null;
  }

  private analyzeOverall(
    yongShenResult: YongShenResult | null,
    currentDayun: any
  ): string {
    if (!yongShenResult) {
      return '运势平稳，需把握机会';
    }

    const riZhuQiangRuo = this.mapStrength(yongShenResult.strength);

    if (riZhuQiangRuo === '中和') {
      return '八字中和，运势平稳，适合稳健发展';
    } else if (riZhuQiangRuo === '偏强' || riZhuQiangRuo === '太强') {
      return '日主强旺，宜主动出击，开创事业';
    } else {
      return '日主偏弱，宜借助外力，寻求合作';
    }
  }

  private analyzeInteraction(currentDayun: DayunResult['currentDayun'], yongShenResult: YongShenResult | null): string {
    if (!currentDayun) {
      return '当前尚未进入明确大运阶段，整体以积累为主';
    }

    if (!yongShenResult) {
      return `当前大运为${currentDayun.ganZhi}，宜结合现实机会稳步推进`;
    }

    const favorable = [...yongShenResult.yongShen, ...yongShenResult.xiShen];
    const hasSupport = favorable.includes(currentDayun.ganWuxing) || favorable.includes(currentDayun.zhiWuxing);
    if (hasSupport) {
      return `${currentDayun.ganZhi}与用神方向较协调，适合主动争取关键机会`;
    }
    return `${currentDayun.ganZhi}与命局存在拉扯，宜控制节奏，避免过度消耗`;
  }

  private analyzeNextYear(dayunResult: DayunResult, currentAge: number): string {
    const nextDayun = dayunResult.dayuns.find(
      (period) => period.startAge > currentAge
    );

    if (!nextDayun) {
      return '下一年延续当前节奏，重在稳住既有基础';
    }

    return `${nextDayun.startAge}岁起转入${nextDayun.ganZhi}大运，宜提前布局下一阶段重心`;
  }

  private mapStrength(strength: YongShenResult['strength']): string {
    switch (strength) {
      case 'very_strong':
        return '太强';
      case 'strong':
        return '偏强';
      case 'neutral':
        return '中和';
      case 'weak':
        return '偏弱';
      case 'very_weak':
        return '太弱';
      default:
        return '中和';
    }
  }
}
