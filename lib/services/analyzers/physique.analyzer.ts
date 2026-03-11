// 体质分析器 - 单一职责：根据日主分析体质
import type { FortuneAnalysisResult } from '../types';

const STEM_ELEMENT: Record<string, string> = {
  '甲': 'wood', '乙': 'wood', '丙': 'fire', '丁': 'fire',
  '戊': 'earth', '己': 'earth', '庚': 'metal', '辛': 'metal',
  '壬': 'water', '癸': 'water',
};

export class PhysiqueAnalyzer {
  analyze(dayMaster: string): FortuneAnalysisResult['physique'] {
    const element = STEM_ELEMENT[dayMaster];

    const physiqueMap: Record<string, { bodyType: string; description: string }> = {
      wood: {
        bodyType: '高挑清瘦',
        description: '木主仁，体型修长，四肢纤细，面色偏青',
      },
      fire: {
        bodyType: '尖削活泼',
        description: '火主礼，上宽下窄，肤色偏红，眼神明亮',
      },
      earth: {
        bodyType: '矮壮敦实',
        description: '土主信，体型偏矮，腰腹较厚，面色偏黄',
      },
      metal: {
        bodyType: '方正刚健',
        description: '金主义，骨架方正，肌肉结实，面色偏白',
      },
      water: {
        bodyType: '圆润丰满',
        description: '水主智，体型圆润，皮肤细腻，面色偏黑或偏白',
      },
    };

    return (
      physiqueMap[element] || {
        bodyType: '均衡',
        description: '五行均衡，体型适中',
      }
    );
  }
}
