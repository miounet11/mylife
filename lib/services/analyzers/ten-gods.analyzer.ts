// 十神分析器 - 单一职责：分析十神关系
import type { TenGods, Pillar } from '../types';
import type { PillarShiShen } from '../../bazi-analyzer';
import { calculateShiShen } from '../../bazi-constants';

export class TenGodsAnalyzer {
  analyze(
    pillars: Pillar[],
    dayMaster: string,
    shiShenAnalysis: PillarShiShen[] | null
  ): TenGods {
    const [year, month, day, hour] = pillars;

    return {
      year: this.analyzePillar(year, dayMaster, shiShenAnalysis?.[0]),
      month: this.analyzePillar(month, dayMaster, shiShenAnalysis?.[1]),
      day: this.analyzePillar(day, dayMaster, shiShenAnalysis?.[2]),
      hour: this.analyzePillar(hour, dayMaster, shiShenAnalysis?.[3]),
      distribution: this.calculateDistribution(pillars, dayMaster),
      dominant: this.findDominantGod(pillars, dayMaster),
    };
  }

  private analyzePillar(
    pillar: Pillar,
    dayMaster: string,
    analysis?: PillarShiShen
  ): TenGods['year'] {
    const stemGod = calculateShiShen(dayMaster, pillar.celestialStem);
    const branchGod = calculateShiShen(dayMaster, pillar.earthlyBranch);

    return {
      stem: stemGod,
      branch: branchGod,
      meaning: analysis?.meaning || this.getGodMeaning(stemGod),
      influence: analysis?.influence || this.getGodInfluence(stemGod),
    };
  }

  private calculateDistribution(
    pillars: Pillar[],
    dayMaster: string
  ): Record<string, number> {
    const distribution: Record<string, number> = {};

    pillars.forEach(pillar => {
      const stemGod = calculateShiShen(dayMaster, pillar.celestialStem);
      const branchGod = calculateShiShen(dayMaster, pillar.earthlyBranch);

      distribution[stemGod] = (distribution[stemGod] || 0) + 1;
      if (branchGod !== stemGod) {
        distribution[branchGod] = (distribution[branchGod] || 0) + 0.5;
      }
    });

    return distribution;
  }

  private findDominantGod(pillars: Pillar[], dayMaster: string): string {
    const distribution = this.calculateDistribution(pillars, dayMaster);
    const sorted = Object.entries(distribution).sort((a, b) => b[1] - a[1]);
    return sorted[0]?.[0] || '比肩';
  }

  private getGodMeaning(god: string): string {
    const meanings: Record<string, string> = {
      '比肩': '兄弟朋友，竞争合作',
      '劫财': '争夺竞争，独立自主',
      '食神': '才华表达，享受生活',
      '伤官': '创意才华，叛逆革新',
      '偏财': '意外之财，灵活机动',
      '正财': '稳定收入，勤劳务实',
      '七杀': '权威压力，果断行动',
      '正官': '名誉地位，责任约束',
      '偏印': '偏门学问，独特思维',
      '正印': '学识修养，庇护关怀',
    };
    return meanings[god] || '未知';
  }

  private getGodInfluence(god: string): string {
    const influences: Record<string, string> = {
      '比肩': '增强自信，但易固执',
      '劫财': '独立性强，但易冲动',
      '食神': '才华横溢，享受人生',
      '伤官': '聪明机智，但易叛逆',
      '偏财': '财运灵活，善于把握机会',
      '正财': '财运稳定，勤劳致富',
      '七杀': '果断有魄力，但压力大',
      '正官': '责任心强，追求名誉',
      '偏印': '思维独特，但易孤僻',
      '正印': '学识渊博，得贵人相助',
    };
    return influences[god] || '影响未知';
  }
}
