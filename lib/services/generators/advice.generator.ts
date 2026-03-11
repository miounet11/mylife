// 建议生成器 - 单一职责：生成命理建议
import type { FortuneAdvice, LuckyElements } from '../types';
import type { YongShenResult } from '../../bazi-analyzer';
import { WUXING_COLOR, WUXING_DIRECTION, WUXING_NUMBER } from '../../bazi-constants';

const WX_CN_EN: Record<string, string> = {
  '木': 'wood',
  '火': 'fire',
  '土': 'earth',
  '金': 'metal',
  '水': 'water',
};

export class AdviceGenerator {
  generate(
    yongShenResult: YongShenResult | null,
    luckyElements: LuckyElements | null
  ): FortuneAdvice {
    if (!yongShenResult || !luckyElements) {
      return this.getDefaultAdvice();
    }

    const { yongShen, xiShen, jiShen } = yongShenResult;

    return {
      career: this.generateCareerAdvice(yongShen, xiShen),
      wealth: this.generateWealthAdvice(yongShen, xiShen),
      marriage: this.generateMarriageAdvice(yongShen),
      health: this.generateHealthAdvice(jiShen),
      lucky: this.generateLuckyAdvice(luckyElements),
    };
  }

  private generateCareerAdvice(yongShen: string[], xiShen: string[]): any {
    const elements = [...yongShen, ...xiShen];
    const suggestions: string[] = [];
    const industries: string[] = [];

    elements.forEach(element => {
      const enElement = WX_CN_EN[element];
      if (enElement === 'wood') {
        industries.push('教育', '文化', '医疗', '环保');
        suggestions.push('从事与木相关的行业，如教育、文化等');
      } else if (enElement === 'fire') {
        industries.push('传媒', '娱乐', '餐饮', '能源');
        suggestions.push('从事与火相关的行业，如传媒、娱乐等');
      } else if (enElement === 'earth') {
        industries.push('房地产', '农业', '建筑', '仓储');
        suggestions.push('从事与土相关的行业，如房地产、建筑等');
      } else if (enElement === 'metal') {
        industries.push('金融', '机械', '军警', '法律');
        suggestions.push('从事与金相关的行业，如金融、机械等');
      } else if (enElement === 'water') {
        industries.push('航运', '贸易', '信息技术', '咨询');
        suggestions.push('从事与水相关的行业，如贸易、IT等');
      }
    });

    return {
      suggestions: [...new Set(suggestions)],
      industries: [...new Set(industries)],
      timing: '选择用神五行旺的时间段发展事业',
    };
  }

  private generateWealthAdvice(yongShen: string[], xiShen: string[]): any {
    return {
      suggestions: [
        '投资方向应符合用神五行',
        '避免在忌神五行旺的时期大额投资',
        '可在用神五行旺的方位发展财运',
      ],
      investment: '稳健为主，适当进取',
      timing: '选择用神五行旺的年份月份投资',
    };
  }

  private generateMarriageAdvice(yongShen: string[]): any {
    return {
      suggestions: [
        '选择五行互补的伴侣',
        '婚期宜选在用神五行旺的时间',
        '婚房方位宜选用神五行的方位',
      ],
      timing: '用神五行旺的年份利于婚姻',
      compatibility: '五行互补为佳',
    };
  }

  private generateHealthAdvice(jiShen: string[]): any {
    const suggestions: string[] = [
      '注意忌神五行对应的身体部位',
      '在忌神五行旺的时期加强养生',
      '可通过饮食调理平衡五行',
    ];

    const organs: Record<string, string> = {
      '木': '肝胆',
      '火': '心脏',
      '土': '脾胃',
      '金': '肺部',
      '水': '肾脏',
    };

    const concerns: string[] = [];
    jiShen.forEach(element => {
      if (organs[element]) {
        concerns.push(`注意${organs[element]}健康`);
      }
    });

    return {
      suggestions,
      concerns: concerns.length > 0 ? concerns : ['保持均衡饮食和作息'],
      prevention: '定期体检，预防为主',
    };
  }

  private generateLuckyAdvice(luckyElements: LuckyElements): any {
    const colors: string[] = [];
    const directions: string[] = [];
    const numbers: string[] = [];

    luckyElements.elements.forEach(element => {
      const enElement = WX_CN_EN[element];
      if (WUXING_COLOR[element]) {
        colors.push(...WUXING_COLOR[element]);
      }
      if (WUXING_DIRECTION[element]) {
        directions.push(...WUXING_DIRECTION[element]);
      }
      if (WUXING_NUMBER[element]) {
        numbers.push(...WUXING_NUMBER[element].map(String));
      }
    });

    return {
      colors: [...new Set(colors)],
      directions: [...new Set(directions)],
      numbers: [...new Set(numbers)],
      elements: luckyElements.elements,
    };
  }

  private getDefaultAdvice(): FortuneAdvice {
    return {
      career: {
        suggestions: ['根据自身兴趣和能力选择职业'],
        industries: ['多元化发展'],
        timing: '把握机遇',
      },
      wealth: {
        suggestions: ['稳健理财', '量入为出'],
        investment: '谨慎投资',
        timing: '顺势而为',
      },
      marriage: {
        suggestions: ['真诚相待', '互相理解'],
        timing: '顺其自然',
        compatibility: '性格互补',
      },
      health: {
        suggestions: ['均衡饮食', '适量运动', '规律作息'],
        concerns: ['定期体检'],
        prevention: '预防为主',
      },
      lucky: {
        colors: ['根据个人喜好'],
        directions: ['各方位均可'],
        numbers: ['吉祥数字'],
        elements: [],
      },
    };
  }
}
