// 解释生成器 - 单一职责：生成个性化解释文本
import type { Pillar } from '../types';
import type { YongShenResult, PillarShiShen } from '../../bazi-analyzer';
import { generatePersonalizedPhrase } from '../../master-phrases';

export class ExplanationGenerator {
  generate(
    pillars: Pillar[],
    yongShenResult: YongShenResult | null,
    shiShenAnalysis: PillarShiShen[] | null,
    user: any
  ): { opening: string; explanation: string } {
    const opening = generatePersonalizedPhrase(user, 'opening');
    const explanation = this.buildExplanation(pillars, yongShenResult, shiShenAnalysis);

    return { opening, explanation };
  }

  private buildExplanation(
    pillars: Pillar[],
    yongShenResult: YongShenResult | null,
    shiShenAnalysis: PillarShiShen[] | null
  ): string {
    const parts: string[] = [];

    // 四柱基本信息
    parts.push(this.explainPillars(pillars));

    // 用神解释
    if (yongShenResult) {
      parts.push(this.explainYongShen(yongShenResult));
    }

    // 十神解释
    if (shiShenAnalysis) {
      parts.push(this.explainShiShen(shiShenAnalysis));
    }

    return parts.join('\n\n');
  }

  private explainPillars(pillars: Pillar[]): string {
    const [year, month, day, hour] = pillars;
    return `您的八字为：${year.celestialStem}${year.earthlyBranch}年、${month.celestialStem}${month.earthlyBranch}月、${day.celestialStem}${day.earthlyBranch}日、${hour.celestialStem}${hour.earthlyBranch}时。日主为${day.celestialStem}，代表您的本质特征。`;
  }

  private explainYongShen(yongShenResult: YongShenResult): string {
    const { yongShen, xiShen, jiShen, riZhuQiangRuo, geJu } = yongShenResult;

    const parts: string[] = [];

    parts.push(`您的日主${riZhuQiangRuo}，格局为${geJu || '普通格局'}。`);

    if (yongShen.length > 0) {
      parts.push(`用神为${yongShen.join('、')}，这是您命局的关键，应多接触相关五行。`);
    }

    if (xiShen.length > 0) {
      parts.push(`喜神为${xiShen.join('、')}，可辅助用神发挥作用。`);
    }

    if (jiShen.length > 0) {
      parts.push(`忌神为${jiShen.join('、')}，应尽量避免接触相关五行。`);
    }

    return parts.join('');
  }

  private explainShiShen(shiShenAnalysis: PillarShiShen[]): string {
    const parts: string[] = [];

    shiShenAnalysis.forEach((pillar, index) => {
      const pillarNames = ['年柱', '月柱', '日柱', '时柱'];
      if (pillar.meaning) {
        parts.push(`${pillarNames[index]}：${pillar.meaning}`);
      }
    });

    return parts.length > 0 ? parts.join('；') : '';
  }
}
