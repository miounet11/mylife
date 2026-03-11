// 运势趋势分析器 - 单一职责：分析运势走向
import type { FortuneAnalysisResult } from '../types';
import type { YongShenResult } from '../../bazi-analyzer';
import type { DayunResult } from '../../dayun-calculator';

export class FortuneTrendAnalyzer {
  analyze(
    baziStr: string[],
    birthDate: Date,
    gender: 'male' | 'female',
    yongShenResult: YongShenResult | null,
    dayunResult: DayunResult
  ): FortuneAnalysisResult['fortune'] {
    const currentAge = this.calculateAge(birthDate);
    const currentDayun = this.findCurrentDayun(dayunResult, currentAge);

    return {
      overall: this.analyzeOverall(yongShenResult, currentDayun),
      career: this.analyzeCareer(currentDayun),
      wealth: this.analyzeWealth(currentDayun),
      relationship: this.analyzeRelationship(currentDayun, gender),
      health: this.analyzeHealth(currentDayun),
      nextDecade: this.analyzeNextDecade(dayunResult, currentAge),
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
    return dayunResult.dayunPeriods.find(
      period => currentAge >= period.startAge && currentAge <= period.endAge
    );
  }

  private analyzeOverall(
    yongShenResult: YongShenResult | null,
    currentDayun: any
  ): string {
    if (!yongShenResult) {
      return '运势平稳，需把握机会';
    }

    const { riZhuQiangRuo } = yongShenResult;

    if (riZhuQiangRuo === '中和') {
      return '八字中和，运势平稳，适合稳健发展';
    } else if (riZhuQiangRuo === '偏强' || riZhuQiangRuo === '太强') {
      return '日主强旺，宜主动出击，开创事业';
    } else {
      return '日主偏弱，宜借助外力，寻求合作';
    }
  }

  private analyzeCareer(currentDayun: any): string {
    if (!currentDayun) {
      return '事业运势平稳，需持续努力';
    }

    const score = currentDayun.score || 50;

    if (score >= 80) {
      return '事业运势极佳，适合大展拳脚，把握机遇';
    } else if (score >= 60) {
      return '事业运势良好，稳步发展，可适当进取';
    } else if (score >= 40) {
      return '事业运势平稳，需脚踏实地，积累经验';
    } else {
      return '事业运势欠佳，宜守不宜攻，等待时机';
    }
  }

  private analyzeWealth(currentDayun: any): string {
    if (!currentDayun) {
      return '财运平稳，量入为出';
    }

    const score = currentDayun.score || 50;

    if (score >= 80) {
      return '财运亨通，投资有利，但需谨慎理财';
    } else if (score >= 60) {
      return '财运良好，正财稳定，可适当投资';
    } else if (score >= 40) {
      return '财运平稳，收入稳定，不宜冒险';
    } else {
      return '财运欠佳，需节制开支，避免投资';
    }
  }

  private analyzeRelationship(currentDayun: any, gender: 'male' | 'female'): string {
    if (!currentDayun) {
      return '感情运势平稳，需用心经营';
    }

    const score = currentDayun.score || 50;

    if (score >= 80) {
      return '感情运势极佳，桃花旺盛，易遇良缘';
    } else if (score >= 60) {
      return '感情运势良好，关系和谐，可考虑进展';
    } else if (score >= 40) {
      return '感情运势平稳，需用心维护，避免争执';
    } else {
      return '感情运势欠佳，需多沟通理解，避免冲突';
    }
  }

  private analyzeHealth(currentDayun: any): string {
    if (!currentDayun) {
      return '健康运势平稳，注意养生';
    }

    const score = currentDayun.score || 50;

    if (score >= 80) {
      return '健康运势极佳，精力充沛，但仍需注意休息';
    } else if (score >= 60) {
      return '健康运势良好，身体状况稳定，保持锻炼';
    } else if (score >= 40) {
      return '健康运势平稳，需注意作息，预防疾病';
    } else {
      return '健康运势欠佳，需加强养生，定期体检';
    }
  }

  private analyzeNextDecade(dayunResult: DayunResult, currentAge: number): string {
    const nextDayun = dayunResult.dayunPeriods.find(
      period => period.startAge > currentAge
    );

    if (!nextDayun) {
      return '未来十年运势平稳，需持续努力';
    }

    const score = nextDayun.score || 50;

    if (score >= 80) {
      return `${nextDayun.startAge}岁起进入大运旺期，宜把握机遇，大展宏图`;
    } else if (score >= 60) {
      return `${nextDayun.startAge}岁起运势转好，可积极进取`;
    } else if (score >= 40) {
      return `${nextDayun.startAge}岁起运势平稳，宜稳健发展`;
    } else {
      return `${nextDayun.startAge}岁起需谨慎行事，积蓄力量`;
    }
  }
}
