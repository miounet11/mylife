// 五行分析器 - 单一职责：分析五行力量
import type { FiveElements, Pillar } from '../types';
import { calculateWuxingStrength } from '../../bazi-analyzer';
import { WUXING_COLOR, WUXING_DIRECTION, WUXING_NUMBER } from '../../bazi-constants';

const WX_CN_EN: Record<string, string> = {
  '木': 'wood',
  '火': 'fire',
  '土': 'earth',
  '金': 'metal',
  '水': 'water',
};

export class FiveElementsAnalyzer {
  analyze(baziStr: string[], pillars: Pillar[]): FiveElements {
    const strengthMap = calculateWuxingStrength(baziStr);

    const wood = strengthMap['木'] || 0;
    const fire = strengthMap['火'] || 0;
    const earth = strengthMap['土'] || 0;
    const metal = strengthMap['金'] || 0;
    const water = strengthMap['水'] || 0;

    const total = wood + fire + earth + metal + water;

    return {
      wood: {
        strength: wood,
        percentage: total > 0 ? (wood / total) * 100 : 0,
        quality: this.getQuality(wood, total),
        description: this.getDescription('wood', wood, total)
      },
      fire: {
        strength: fire,
        percentage: total > 0 ? (fire / total) * 100 : 0,
        quality: this.getQuality(fire, total),
        description: this.getDescription('fire', fire, total)
      },
      earth: {
        strength: earth,
        percentage: total > 0 ? (earth / total) * 100 : 0,
        quality: this.getQuality(earth, total),
        description: this.getDescription('earth', earth, total)
      },
      metal: {
        strength: metal,
        percentage: total > 0 ? (metal / total) * 100 : 0,
        quality: this.getQuality(metal, total),
        description: this.getDescription('metal', metal, total)
      },
      water: {
        strength: water,
        percentage: total > 0 ? (water / total) * 100 : 0,
        quality: this.getQuality(water, total),
        description: this.getDescription('water', water, total)
      },
      balance: this.calculateBalance(strengthMap),
      dominant: this.findDominant(strengthMap),
      lacking: this.findLacking(strengthMap),
    };
  }

  private calculateBalance(strengthMap: Record<string, number>): string {
    const values = Object.values(strengthMap);
    const max = Math.max(...values);
    const min = Math.min(...values);
    const diff = max - min;

    if (diff < 20) return '五行均衡';
    if (diff < 40) return '略有偏颇';
    if (diff < 60) return '明显失衡';
    return '严重失衡';
  }

  private findDominant(strengthMap: Record<string, number>): string[] {
    const avg = Object.values(strengthMap).reduce((a, b) => a + b, 0) / 5;
    return Object.entries(strengthMap)
      .filter(([_, v]) => v > avg * 1.3)
      .map(([k, _]) => WX_CN_EN[k] || k);
  }

  private findLacking(strengthMap: Record<string, number>): string[] {
    const avg = Object.values(strengthMap).reduce((a, b) => a + b, 0) / 5;
    return Object.entries(strengthMap)
      .filter(([_, v]) => v < avg * 0.5)
      .map(([k, _]) => WX_CN_EN[k] || k);
  }

  private getQuality(strength: number, total: number): string {
    const percentage = total > 0 ? (strength / total) * 100 : 0;
    if (percentage > 30) return '旺';
    if (percentage > 20) return '强';
    if (percentage > 10) return '平';
    if (percentage > 5) return '弱';
    return '极弱';
  }

  private getDescription(element: string, strength: number, total: number): string {
    const percentage = total > 0 ? (strength / total) * 100 : 0;
    const elementNames: Record<string, string> = {
      wood: '木',
      fire: '火',
      earth: '土',
      metal: '金',
      water: '水'
    };
    const name = elementNames[element] || element;
    return `${name}行力量占比 ${percentage.toFixed(1)}%`;
  }
}
