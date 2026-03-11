// 证据生成器 - 单一职责：生成数据支撑
import type { Pillar, DataStatistics } from '../types';

export class EvidenceGenerator {
  generate(pillars: Pillar[]): { statistics: DataStatistics; celebrities: any[] } {
    const statistics = this.generateStatistics(pillars);
    const celebrities = this.generateCelebrities(pillars);

    return { statistics, celebrities };
  }

  private generateStatistics(pillars: Pillar[]): DataStatistics {
    // 模拟统计数据
    const dayMaster = pillars[2].celestialStem;
    const monthBranch = pillars[1].earthlyBranch;

    return {
      totalUsers: 10000,
      similarPatterns: this.getCareerDistribution(monthBranch)['管理'] + this.getCareerDistribution(monthBranch)['技术'],
      successRate: this.calculateSuccessRate(dayMaster),
    };
  }

  private calculateSuccessRate(dayMaster: string): number {
    // 基于日主的模拟成功率
    const rates: Record<string, number> = {
      '甲': 72, '乙': 68, '丙': 75, '丁': 70,
      '戊': 65, '己': 63, '庚': 78, '辛': 74,
      '壬': 76, '癸': 71,
    };
    return rates[dayMaster] || 70;
  }

  private getCareerDistribution(monthBranch: string): Record<string, number> {
    // 基于月支的职业分布
    return {
      '管理': 25,
      '技术': 30,
      '销售': 20,
      '教育': 15,
      '其他': 10,
    };
  }

  private generateCelebrities(pillars: Pillar[]): any[] {
    // 模拟名人案例
    const dayMaster = pillars[2].celestialStem;

    const celebrities: Record<string, any[]> = {
      '甲': [
        { name: '李嘉诚', field: '商业', achievement: '华人首富' },
        { name: '马云', field: '互联网', achievement: '阿里巴巴创始人' },
      ],
      '丙': [
        { name: '成龙', field: '娱乐', achievement: '国际影星' },
        { name: '刘德华', field: '娱乐', achievement: '天王巨星' },
      ],
      '庚': [
        { name: '李小龙', field: '武术', achievement: '功夫巨星' },
        { name: '霍英东', field: '商业', achievement: '地产大亨' },
      ],
    };

    return celebrities[dayMaster] || [
      { name: '示例名人', field: '各行业', achievement: '杰出成就' },
    ];
  }
}
