import type { DimensionAdvisorInput, DimensionReport } from './types';
import { buildDimensionEnginePack } from './engine-pack';
import { rankAssetClasses, resolveRiskProfile, suggestAllocation } from './data/asset-classes';
import {
  buildPrediction,
  clampConfidence,
  findKlinePoint,
  formatDateOffset,
  formatWuxingList,
  normalizeWuxingList,
  section,
} from './shared';

function wealthTrajectory(
  kline: { year: number; wealth: number }[],
  currentYear: number,
): string[] {
  const years = [currentYear, currentYear + 1, currentYear + 2];
  return years.map((year) => {
    const point = kline.find((item) => item.year === year);
    if (!point) return `${year} 年财富线：数据不足`;
    const score = Math.round(point.wealth);
    const tag = score >= 60 ? '偏进取' : score <= 48 ? '偏防守' : '偏均衡';
    return `${year} 年财富线约 ${score} 分（${tag}）`;
  });
}

function currentWealthScore(kline: { year: number; wealth: number }[]): number {
  const point = findKlinePoint(kline as Array<{ year: number; career: number; wealth: number; marriage: number; health: number }>);
  return point?.wealth ?? 50;
}

function wealthVolatility(kline: { wealth: number }[]): number {
  if (kline.length < 2) return 0;
  const values = kline.slice(-5).map((item) => item.wealth);
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((acc, item) => acc + (item - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

export function buildInvestmentRhythmReport(input: DimensionAdvisorInput): DimensionReport {
  const pack = buildDimensionEnginePack(input);
  const { truthInput, birthSignature } = pack;
  const reportId = input.reportId || `dimension_invest_${birthSignature}_${Date.now()}`;
  const yongShen = truthInput.yongShen;
  const favorable = normalizeWuxingList([...(yongShen?.yongShen || []), ...(yongShen?.xiShen || [])]);
  const kline = truthInput.kline || [];
  const currentYear = new Date().getFullYear();
  const wealthScore = currentWealthScore(kline);
  const volatility = wealthVolatility(kline);
  const riskProfile = resolveRiskProfile(wealthScore, volatility);
  const { fit, avoid } = rankAssetClasses(favorable, riskProfile);
  const allocation = suggestAllocation(riskProfile);
  const confidenceBase = yongShen?.confidence?.score ? yongShen.confidence.score / 100 : 0.72;

  const sections = [
    section('core', '核心结论', [
      `当前财富节奏评分约 ${Math.round(wealthScore)}，波动系数 ${volatility.toFixed(1)}，资金风格偏「${riskProfile}」。`,
      wealthScore >= 58
        ? '今年整体偏「宜进取」：可小仓位验证，但必须保留安全垫与止损规则。'
        : '今年整体偏「宜守成」：优先流动性与确定性，再谈收益扩张。',
    ], 'positive'),
    section(
      'assets',
      '更适配资产类型',
      fit.map(
        (item) =>
          `${item.name}（${item.element} · ${item.riskLevel} · 匹配${item.score}）：${item.reasons.slice(0, 2).join('；')}`,
      ),
      'positive',
    ),
    section(
      'allocation',
      '参考仓位骨架（非收益承诺）',
      allocation.map((item) => `${item.name} ${item.pct}%：${item.note}`),
    ),
    section('trajectory', '未来两年财富节奏', wealthTrajectory(kline, currentYear)),
    section('rhythm', '今年资金节奏', [
      riskProfile === '进取'
        ? 'Q1-Q2 适合布局主策略，Q3 起逐步锁定部分收益、降低回撤。'
        : riskProfile === '保守'
          ? '全年以稳为主：先补齐 3-6 个月支出安全垫，再谈卫星仓。'
          : '上半年以稳为主，下半年视窗口再小幅加码。',
      wealthScore >= 55 ? '高点窗口可分批进场，避免一次性满仓。' : '低点窗口优先保留现金与低风险底仓。',
      '每笔资金动作建议设置「验证点 + 止损线」，并同步到预测回访。',
    ]),
    section(
      'avoid',
      '不宜动作',
      [
        ...avoid,
        '把命理节奏当成收益保证',
        '在信息不完整时做高杠杆决策',
      ],
      'warning',
    ),
    section('evidence', '引擎证据', [
      yongShen
        ? `日主${yongShen.dayMaster}，用神 ${formatWuxingList(yongShen.yongShen, '—')}，忌神 ${formatWuxingList(yongShen.jiShen, '—')}。`
        : '用神信息不足，资产匹配以降权防守策略给出。',
      `财富线 ${currentYear} 年约 ${Math.round(wealthScore)} 分，近 5 年波动 ${volatility.toFixed(1)}，风险画像「${riskProfile}」。`,
      `适配资产 ${fit.length} 类；参考骨架现金/防守占比约 ${allocation.filter((item) => /现金|债券|收息|货币/.test(item.name)).reduce((sum, item) => sum + item.pct, 0)}%。`,
    ], 'muted'),
    section('boundary', '边界说明', [
      '本研判仅讨论资金节奏与风险偏好，不构成投资建议、收益承诺或法律意见。',
      '市场、政策与个人现金流约束，永远优先于模型结论。',
      '任何涉及杠杆、复杂衍生品、跨境资产的决策，请咨询持牌专业人士。',
    ], 'muted'),
  ];

  const predictions = [
    buildPrediction(reportId, birthSignature, 'i1', {
      category: 'wealth',
      statement:
        riskProfile === '进取'
          ? `${currentYear}年Q3前适合完成一次「小仓位验证」并设好止损（财富线约${Math.round(wealthScore)}分）`
          : `${currentYear}年Q2前适合完成一次现金流安全垫复盘（财富线约${Math.round(wealthScore)}分）`,
      dueDate: formatDateOffset(150),
      confidence: clampConfidence(confidenceBase + 0.02),
      evidence: `投资理财 · 风险画像「${riskProfile}」`,
      window: riskProfile === '进取' ? `${currentYear}年Q1-Q3` : `${currentYear}年Q1-Q2`,
      verifyChecklist: ['是否按计划执行？', '风险敞口是否可控？', '是否保留了安全垫？'],
    }),
    buildPrediction(reportId, birthSignature, 'i2', {
      category: 'wealth',
      statement: `未来6个月宜将「${fit[0]?.name || '稳健底仓'}」作为配置主轴之一（匹配分${fit[0]?.score ?? 1}）`,
      dueDate: formatDateOffset(180),
      confidence: clampConfidence(confidenceBase),
      evidence: fit[0]
        ? `投资理财 · 资产匹配 ${fit[0].name}`
        : '投资理财 · 稳健底仓',
      window: '未来6个月',
      verifyChecklist: ['配置结构是否更均衡？', '流动性是否充足？'],
    }),
    buildPrediction(reportId, birthSignature, 'i3', {
      category: 'wealth',
      statement: '未来90天内不宜做无安全垫的高杠杆扩张',
      dueDate: formatDateOffset(90),
      confidence: clampConfidence(confidenceBase - 0.01),
      evidence: '投资理财 · 风险边界（合规）',
      window: '未来90天',
      verifyChecklist: ['是否避免了冲动加仓？', '是否保留了应急资金？'],
    }),
  ];

  return {
    slug: 'investment',
    title: '投资理财节奏研判',
    question: '我的资金节奏偏激进还是保守？今年宜进宜守？',
    generatedAt: new Date().toISOString(),
    birthSignature,
    sections,
    predictions,
    disclaimers: [
      '仅供节奏参考，不构成投资建议、收益承诺或法律意见。',
      '投资有风险，决策需结合个人财务状况与专业顾问意见。',
    ],
    meta: {
      riskProfile,
      wealthScore: Math.round(wealthScore),
      volatility: Number(volatility.toFixed(2)),
      topAsset: fit[0]?.name || '',
      priority: 'p0',
    },
  };
}
