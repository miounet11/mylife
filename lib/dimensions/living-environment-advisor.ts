import type { DimensionAdvisorInput, DimensionReport } from './types';
import { buildDimensionEnginePack } from './engine-pack';
import { resolveDirections } from './data/directions-wuxing';
import { buildPrediction, formatDateOffset, section } from './shared';

export function buildLivingEnvironmentReport(input: DimensionAdvisorInput): DimensionReport {
  const pack = buildDimensionEnginePack(input);
  const { truthInput, birthSignature } = pack;
  const reportId = input.reportId || `dimension_living_${birthSignature}_${Date.now()}`;
  const yongShen = truthInput.yongShen;
  const favorable = [...(yongShen?.yongShen || []), ...(yongShen?.xiShen || [])];
  const unfavorable = yongShen?.jiShen || [];
  const { enhance, reduce } = resolveDirections(favorable, unfavorable);
  const currentYear = new Date().getFullYear();
  const kline = truthInput.kline || [];
  const bestMoveYear = [...kline.filter((item) => item.year >= currentYear)]
    .sort((a, b) => b.career + b.wealth - (a.career + a.wealth))[0];

  const sections = [
    section('core', '核心结论', [
      `用神宜补：${favorable.join('、') || '按引擎判定'}，居家环境优先强化对应方位与元素。`,
      `忌神宜减：${unfavorable.join('、') || '无明显忌神'}，避免在该方位长期堆叠杂物或高耗能摆设。`,
    ], 'positive'),
    section(
      'enhance',
      '宜强化方位与摆设',
      enhance.map((item) => `${item.direction}（${item.element}）：${item.layout}`),
      'positive',
    ),
    section(
      'reduce',
      '宜收敛方位',
      reduce.length
        ? reduce.map((item) => `${item.direction}（${item.element}）：减少忌神元素摆设，保持简洁`)
        : ['忌神方位不明显，以整屋通风与动线顺畅为主'],
      'warning',
    ),
    section('move', '搬迁/调整窗口', [
      bestMoveYear
        ? `${bestMoveYear.year} 年整体节奏较适合做大调整（综合约 ${Math.round((bestMoveYear.career + bestMoveYear.wealth) / 2)} 分）`
        : '未来一年宜先做局部调整，再考虑大搬',
      ...enhance.map((item) => item.moveNote),
      '搬家前先整理弃置，比「带旧气进新家」更利节奏。',
    ]),
    section('boundary', '边界说明', [
      '环境建议用于布局与节奏参考，不替代建筑、消防等专业规范。',
      '重大装修请咨询专业人士。',
    ], 'muted'),
  ];

  const predictions = [
    buildPrediction(reportId, birthSignature, 'l1', {
      category: 'timing',
      statement: `未来30天在${enhance[0]?.direction || '用神方位'}完成一处环境微调（清洁/绿植/收纳）`,
      dueDate: formatDateOffset(30),
      confidence: 0.74,
      evidence: '居家环境 · 方位调整',
      verifyChecklist: ['是否完成调整？', '居住舒适度是否提升？'],
    }),
    buildPrediction(reportId, birthSignature, 'l2', {
      category: 'timing',
      statement: bestMoveYear
        ? `${bestMoveYear.year}年Q2-Q3适合评估搬迁或大规模整理`
        : '未来6个月适合完成一次全屋动线优化',
      dueDate: bestMoveYear ? `${bestMoveYear.year}-08-31` : formatDateOffset(180),
      confidence: 0.72,
      evidence: '居家环境 · 搬迁窗口',
      verifyChecklist: ['是否完成评估？', '成本是否可控？'],
    }),
    buildPrediction(reportId, birthSignature, 'l3', {
      category: 'timing',
      statement: '未来90天内避免在忌神方位做高耗能或杂乱堆叠',
      dueDate: formatDateOffset(90),
      confidence: 0.7,
      evidence: '居家环境 · 忌神收敛',
      verifyChecklist: ['是否保持整洁？', '睡眠/专注是否改善？'],
    }),
  ];

  return {
    slug: 'living-environment',
    title: '居家环境研判',
    question: '方位与摆设如何补用神？何时宜搬家？',
    generatedAt: new Date().toISOString(),
    birthSignature,
    sections,
    predictions,
    disclaimers: ['环境建议不构成建筑或风水法律承诺。'],
    meta: { primaryDirection: enhance[0]?.direction || '' },
  };
}