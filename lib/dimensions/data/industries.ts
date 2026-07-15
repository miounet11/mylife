import { normalizeWuxingList } from '../shared';

export type IndustryElement = '木' | '火' | '土' | '金' | '水';

export interface IndustryEntry {
  name: string;
  element: IndustryElement;
  roles: string[];
  /** Short structural note for ranking explainability */
  note?: string;
}

export interface RankedIndustry extends IndustryEntry {
  score: number;
  reasons: string[];
}

export const INDUSTRY_CATALOG: IndustryEntry[] = [
  { name: '教育培训', element: '木', roles: ['教研', '课程设计', '咨询教练'], note: '生发与传授' },
  { name: '文化传媒', element: '木', roles: ['内容策划', '品牌传播', '出版编辑'], note: '内容生发' },
  { name: '医疗健康', element: '木', roles: ['康复管理', '健康管理', '医药运营'], note: '养护生发' },
  { name: '农林环保', element: '木', roles: ['项目运营', '政策研究', '生态产品'], note: '自然生长' },
  { name: '互联网产品', element: '火', roles: ['产品经理', '增长运营', '用户体验'], note: '曝光与转化' },
  { name: '餐饮美业', element: '火', roles: ['门店运营', '品牌营销', '供应链'], note: '流量与呈现' },
  { name: '能源科技', element: '火', roles: ['项目管理', '解决方案', '市场拓展'], note: '能量释放' },
  { name: '娱乐演艺', element: '火', roles: ['内容制作', '艺人经纪', '现场运营'], note: '舞台与热度' },
  { name: '房地产建筑', element: '土', roles: ['项目管理', '工程协调', '资产运营'], note: '承载与空间' },
  { name: '农业食品', element: '土', roles: ['供应链', '品控', '渠道管理'], note: '根基与供给' },
  { name: '公共服务', element: '土', roles: ['政策研究', '行政协调', '社区服务'], note: '秩序承载' },
  { name: '人力资源', element: '土', roles: ['招聘', '组织发展', '员工关系'], note: '组织土壤' },
  { name: '金融投资', element: '金', roles: ['风控', '研究分析', '资产管理'], note: '规则与收敛' },
  { name: '制造装备', element: '金', roles: ['工艺工程', '质量管理', '精益制造'], note: '标准与精度' },
  { name: '法律合规', element: '金', roles: ['法务', '合规审查', '交易支持'], note: '边界与规则' },
  { name: '审计咨询', element: '金', roles: ['审计', '战略咨询', '尽职调查'], note: '裁断与结构' },
  { name: '贸易物流', element: '水', roles: ['国际贸易', '供应链规划', '跨境运营'], note: '流动与连接' },
  { name: '旅游酒店', element: '水', roles: ['目的地运营', '客户服务', '渠道合作'], note: '流动体验' },
  { name: '科研数据', element: '水', roles: ['数据分析', '算法工程', '研究助理'], note: '智慧流动' },
  { name: '软件工程', element: '水', roles: ['后端开发', '平台架构', 'DevOps'], note: '系统流动' },
];

export function rankIndustriesForElements(
  favorable: string[],
  unfavorable: string[],
  options?: { limit?: number; avoidLimit?: number },
): { fit: RankedIndustry[]; avoid: RankedIndustry[] } {
  const favorSet = new Set(normalizeWuxingList(favorable));
  const avoidSet = new Set(normalizeWuxingList(unfavorable));
  const fitLimit = options?.limit ?? 3;
  const avoidLimit = options?.avoidLimit ?? 3;

  const scored: RankedIndustry[] = INDUSTRY_CATALOG.map((industry) => {
    let score = 0;
    const reasons: string[] = [];
    if (favorSet.has(industry.element)) {
      score += 4;
      reasons.push(`五行${industry.element}落入用神/喜神`);
    }
    if (avoidSet.has(industry.element)) {
      score -= 4;
      reasons.push(`五行${industry.element}落入忌神`);
    }
    if (!favorSet.size && !avoidSet.size) {
      score = 1;
      reasons.push('用神不足，按行业基础结构兜底排序');
    }
    if (industry.note) reasons.push(industry.note);
    return { ...industry, score, reasons };
  });

  const fit = scored
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name, 'zh'))
    .slice(0, fitLimit);

  const avoid = scored
    .filter((item) => item.score < 0)
    .sort((a, b) => a.score - b.score || a.name.localeCompare(b.name, 'zh'))
    .slice(0, avoidLimit);

  return {
    fit: fit.length ? fit : scored.sort((a, b) => b.score - a.score).slice(0, fitLimit),
    avoid: avoid.length
      ? avoid
      : scored.sort((a, b) => a.score - b.score).slice(0, avoidLimit).map((item) => ({
          ...item,
          reasons: item.reasons.length ? item.reasons : ['相对忌神距离更近，宜作次选'],
        })),
  };
}
