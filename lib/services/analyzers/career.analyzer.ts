// 职业分析器 - 单一职责：根据十神和日主分析职业方向
import type { TenGods, FortuneAnalysisResult } from '../types';

const STEM_ELEMENT: Record<string, string> = {
  '甲': 'wood', '乙': 'wood', '丙': 'fire', '丁': 'fire',
  '戊': 'earth', '己': 'earth', '庚': 'metal', '辛': 'metal',
  '壬': 'water', '癸': 'water',
};

export class CareerAnalyzer {
  analyze(
    tenGods: TenGods,
    dayMaster: string
  ): FortuneAnalysisResult['advice']['career'] {
    const primary: string[] = [];
    const secondary: string[] = [];
    const avoid: string[] = [];
    const reasons: string[] = [];

    // 月柱十神为主，时柱为辅
    const mainGod = tenGods.month?.name ?? '';
    const timeGod = tenGods.hour?.name ?? '';

    const careerMap: Record<string, string[]> = {
      '正官': ['政府机关', '管理层', '法律', '军警'],
      '七杀': ['军事', '竞技', '外科', '执法'],
      '食神': ['餐饮', '艺术', '教育', '技艺'],
      '伤官': ['创意设计', '音乐', '写作', '技术研发'],
      '偏财': ['商业贸易', '投资', '销售', '金融'],
      '正财': ['会计', '银行', '稳定职业', '行政'],
      '偏印': ['宗教', '哲学', '研究', '医学'],
      '正印': ['文教', '出版', '学术', '文秘'],
      '比肩': ['合伙创业', '体育', '竞争性行业'],
      '劫财': ['独立创业', '中介', '经纪'],
    };

    const elementCareer: Record<string, string[]> = {
      wood: ['教育', '文化', '医疗', '环保'],
      fire: ['传媒', '娱乐', '餐饮', '能源'],
      earth: ['房地产', '农业', '建筑', '仓储'],
      metal: ['金融', '机械', '军警', '法律'],
      water: ['航运', '贸易', '信息技术', '咨询'],
    };

    // 根据月柱十神推荐
    if (mainGod && careerMap[mainGod]) {
      primary.push(...careerMap[mainGod]);
      reasons.push(`月柱${mainGod}主${careerMap[mainGod][0]}`);
    }

    // 根据时柱十神补充
    if (timeGod && careerMap[timeGod] && timeGod !== mainGod) {
      secondary.push(...careerMap[timeGod]);
      reasons.push(`时柱${timeGod}辅${careerMap[timeGod][0]}`);
    }

    // 根据日主五行补充
    const element = STEM_ELEMENT[dayMaster];
    if (element && elementCareer[element]) {
      secondary.push(...elementCareer[element]);
      reasons.push(`日主${dayMaster}属${element}`);
    }

    // 避免的职业
    if (mainGod === '伤官') {
      avoid.push('公务员', '传统行业');
      reasons.push('伤官不宜官场');
    } else if (mainGod === '七杀') {
      avoid.push('文职', '服务业');
      reasons.push('七杀宜武不宜文');
    }

    return {
      primary: [...new Set(primary)],
      secondary: [...new Set(secondary)],
      avoid: [...new Set(avoid)],
      reason: reasons.join('；') || '结合十神结构与日主五行给出职业建议',
    };
  }
}
