export type SubjectElement = '木' | '火' | '土' | '金' | '水';

export interface SubjectEntry {
  name: string;
  element: SubjectElement;
  tracks: string[];
}

export const SUBJECT_CATALOG: SubjectEntry[] = [
  { name: '人文社科', element: '木', tracks: ['文学', '教育', '心理', '法律'] },
  { name: '设计艺术', element: '火', tracks: ['视觉', '产品', '传媒', '品牌'] },
  { name: '经管商科', element: '土', tracks: ['管理', '运营', '供应链', '公共事务'] },
  { name: '理工工程', element: '金', tracks: ['计算机', '机械', '金融工程', '数据分析'] },
  { name: '语言跨境', element: '水', tracks: ['外语', '国际贸易', '研究', '咨询'] },
];

export function rankSubjects(
  favorable: string[],
  hasStrongYin: boolean,
  hasStrongShiShang: boolean,
): { fit: SubjectEntry[]; rhythm: string[] } {
  const favorSet = new Set(favorable);
  const fit = SUBJECT_CATALOG
    .map((item) => ({
      item,
      score: (favorSet.has(item.element) ? 2 : 0) + (hasStrongYin && item.element === '木' ? 1 : 0) + (hasStrongShiShang && item.element === '火' ? 1 : 0),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((row) => row.item);

  const rhythm = [
    hasStrongYin ? '印星偏强：适合「系统学习 + 阶段性复盘」，不宜临时抱佛脚。' : '宜短周期刷题验证，找到稳定节奏再拉长备考周期。',
    hasStrongShiShang ? '食伤偏强：表达/作品型考试更有优势，多做模拟输出。' : '先夯实基础框架，再进入高频练习。',
    '大考择时优先选用神流年窗口，低谷年以减少冒险报考。',
  ];

  return { fit: fit.length ? fit : SUBJECT_CATALOG.slice(0, 3), rhythm };
}