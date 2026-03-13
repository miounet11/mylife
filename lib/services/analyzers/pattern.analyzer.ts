// 格局分析器 - 单一职责：分析八字格局
import type { Pattern } from '../types';
import type { YongShenResult } from '../../bazi-analyzer';

export class PatternAnalyzer {
  analyze(yongShenResult: YongShenResult | null): Pattern {
    if (!yongShenResult) {
      return {
        type: '普通格局',
        quality: 'medium',
        description: '八字平和，无明显格局',
        strengths: ['平稳发展'],
        weaknesses: ['缺乏突破'],
      };
    }

    const geJu = yongShenResult.pattern?.pattern;
    const riZhuQiangRuo = this.mapStrength(yongShenResult.strength);

    return {
      type: geJu || '普通格局',
      quality: this.determineQuality(yongShenResult),
      description: this.getPatternDescription(geJu, riZhuQiangRuo),
      strengths: this.getStrengths(geJu, riZhuQiangRuo),
      weaknesses: this.getWeaknesses(geJu, riZhuQiangRuo),
    };
  }

  private determineQuality(yongShenResult: YongShenResult): 'high' | 'medium' | 'low' {
    const geJu = yongShenResult.pattern?.pattern;
    const riZhuQiangRuo = this.mapStrength(yongShenResult.strength);

    // 特殊格局为高品质
    const specialPatterns = ['从强格', '从弱格', '化气格', '专旺格'];
    if (geJu && specialPatterns.some(p => geJu.includes(p))) {
      return 'high';
    }

    // 中和为中品质
    if (riZhuQiangRuo === '中和') {
      return 'high';
    }

    // 偏强或偏弱为中品质
    if (riZhuQiangRuo === '偏强' || riZhuQiangRuo === '偏弱') {
      return 'medium';
    }

    // 太强或太弱为低品质
    return 'low';
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

  private getPatternDescription(geJu: string | undefined, strength: string): string {
    if (!geJu) {
      return `日主${strength}，格局平和`;
    }

    const descriptions: Record<string, string> = {
      '从强格': '日主极强，顺势而为，宜从事领导、创业等强势行业',
      '从弱格': '日主极弱，顺从环境，宜从事服务、辅助等配合性工作',
      '化气格': '五行转化，格局特殊，需把握时机',
      '专旺格': '某一五行极旺，专注发展该领域',
      '身强财旺': '财运亨通，适合经商创业',
      '身弱财旺': '财多身弱，需增强自身能力',
      '官印相生': '事业学业俱佳，贵人相助',
      '食伤生财': '才华变现，适合创意产业',
    };

    return descriptions[geJu] || `${geJu}，日主${strength}`;
  }

  private getStrengths(geJu: string | undefined, strength: string): string[] {
    const strengths: string[] = [];

    if (strength === '中和') {
      strengths.push('五行平衡', '适应力强', '发展稳健');
    } else if (strength === '偏强' || strength === '太强') {
      strengths.push('意志坚定', '执行力强', '领导能力');
    } else if (strength === '偏弱' || strength === '太弱') {
      strengths.push('灵活变通', '善于合作', '学习能力强');
    }

    if (geJu) {
      const patternStrengths: Record<string, string[]> = {
        '从强格': ['领导力强', '决断力佳', '开创能力'],
        '从弱格': ['适应力强', '善于配合', '人际关系好'],
        '化气格': ['变通能力', '机遇把握', '转化能力'],
        '身强财旺': ['财运亨通', '经商天赋', '执行力强'],
        '官印相生': ['事业运佳', '贵人相助', '学业优秀'],
      };
      if (patternStrengths[geJu]) {
        strengths.push(...patternStrengths[geJu]);
      }
    }

    return strengths.length > 0 ? strengths : ['待发掘优势'];
  }

  private getWeaknesses(geJu: string | undefined, strength: string): string[] {
    const weaknesses: string[] = [];

    if (strength === '太强') {
      weaknesses.push('过于刚强', '不易妥协', '易树敌');
    } else if (strength === '太弱') {
      weaknesses.push('缺乏主见', '易受影响', '执行力弱');
    } else if (strength === '偏强') {
      weaknesses.push('略显固执', '需注意沟通');
    } else if (strength === '偏弱') {
      weaknesses.push('需增强自信', '提升执行力');
    }

    if (geJu) {
      const patternWeaknesses: Record<string, string[]> = {
        '从强格': ['易独断专行', '需注意合作'],
        '从弱格': ['缺乏主见', '需增强自信'],
        '身弱财旺': ['财多身弱', '需提升能力'],
      };
      if (patternWeaknesses[geJu]) {
        weaknesses.push(...patternWeaknesses[geJu]);
      }
    }

    return weaknesses.length > 0 ? weaknesses : ['当前结构短板不突出'];
  }
}
