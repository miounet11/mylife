import { normalizeWuxingList } from '../shared';

export type AssetElement = '木' | '火' | '土' | '金' | '水';
export type RiskProfile = '保守' | '均衡' | '进取';

export interface AssetClassEntry {
  name: string;
  element: AssetElement;
  riskLevel: 'low' | 'medium' | 'high';
  note: string;
}

export interface RankedAsset extends AssetClassEntry {
  score: number;
  reasons: string[];
}

export interface AllocationBucket {
  name: string;
  pct: number;
  note: string;
}

export const ASSET_CLASSES: AssetClassEntry[] = [
  { name: '货币基金 / 存款', element: '土', riskLevel: 'low', note: '守势与流动性优先' },
  { name: '国债 / 债券', element: '土', riskLevel: 'low', note: '稳健底仓，适合防守阶段' },
  { name: '保险保障型', element: '土', riskLevel: 'low', note: '风险转移，不是收益工具' },
  { name: '指数基金', element: '金', riskLevel: 'medium', note: '规则化配置，适合中期节奏' },
  { name: '黄金 / 贵金属', element: '金', riskLevel: 'medium', note: '对冲波动，忌追涨杀跌' },
  { name: 'REITs / 收息资产', element: '土', riskLevel: 'medium', note: '现金流匹配优先于房价想象' },
  { name: '股票 / 权益', element: '火', riskLevel: 'high', note: '进攻窗口可用，需设止损' },
  { name: '创业股权', element: '火', riskLevel: 'high', note: '高波动高投入，宜小步验证' },
  { name: '不动产', element: '土', riskLevel: 'medium', note: '长周期资产，重现金流匹配' },
  { name: '跨境贸易结算', element: '水', riskLevel: 'medium', note: '流动性强，需关注汇率' },
  { name: '现金等价物组合', element: '水', riskLevel: 'low', note: '机动资金池，服务机会与应急' },
  { name: '成长行业主题基金', element: '木', riskLevel: 'high', note: '主题波动大，仓位需设上限' },
  { name: '教育 / 技能再投资', element: '木', riskLevel: 'low', note: '人力资本投入，长期复利' },
  { name: '数字资产（小仓位）', element: '水', riskLevel: 'high', note: '仅作卫星仓，不可作为安全垫' },
];

export function resolveRiskProfile(wealthScore: number, volatility: number): RiskProfile {
  const composite = wealthScore - volatility * 0.35;
  if (composite >= 58) return '进取';
  if (composite <= 45) return '保守';
  return '均衡';
}

export function suggestAllocation(riskProfile: RiskProfile): AllocationBucket[] {
  if (riskProfile === '保守') {
    return [
      { name: '现金/货币/短债', pct: 50, note: '安全垫与应急' },
      { name: '债券/收息', pct: 30, note: '稳定现金流' },
      { name: '权益/卫星', pct: 15, note: '小仓位学习曲线' },
      { name: '技能/保障', pct: 5, note: '人力资本与保障' },
    ];
  }
  if (riskProfile === '进取') {
    return [
      { name: '现金/货币', pct: 20, note: '至少覆盖 3-6 个月支出' },
      { name: '债券/收息', pct: 20, note: '对冲权益回撤' },
      { name: '权益主仓', pct: 45, note: '分批建仓，设止损' },
      { name: '卫星/主题', pct: 15, note: '高波动仓位设上限' },
    ];
  }
  return [
    { name: '现金/货币', pct: 30, note: '流动性与再平衡弹药' },
    { name: '债券/收息', pct: 30, note: '底仓稳定器' },
    { name: '权益', pct: 30, note: '中期主成长来源' },
    { name: '卫星/技能', pct: 10, note: '小仓试错 + 能力再投资' },
  ];
}

export function rankAssetClasses(
  favorable: string[],
  riskProfile: RiskProfile,
): { fit: RankedAsset[]; avoid: string[] } {
  const favorSet = new Set(normalizeWuxingList(favorable));
  const riskCap = riskProfile === '保守' ? 1 : 2;
  const riskRank = { low: 0, medium: 1, high: 2 };

  const fit = ASSET_CLASSES.map((item) => {
    let score = 0;
    const reasons: string[] = [];
    if (favorSet.has(item.element)) {
      score += 3;
      reasons.push(`五行${item.element}与用神/喜神匹配`);
    }
    if (riskRank[item.riskLevel] <= riskCap) {
      score += 1;
      reasons.push(`风险级别适配「${riskProfile}」画像`);
    } else {
      score -= 2;
      reasons.push(`风险高于「${riskProfile}」建议上限`);
    }
    if (riskProfile === '保守' && item.riskLevel === 'low') {
      score += 1;
      reasons.push('防守阶段优先低波动');
    }
    if (riskProfile === '均衡' && item.riskLevel === 'high') {
      score -= 1;
      reasons.push('均衡画像下高波动仅作卫星仓');
    }
    if (riskProfile === '进取' && item.riskLevel === 'high' && favorSet.has(item.element)) {
      score += 1;
      reasons.push('进攻窗口可作卫星仓');
    }
    if (riskProfile === '均衡' && item.riskLevel === 'medium' && favorSet.has(item.element)) {
      score += 1;
      reasons.push('均衡画像优先中波动主仓');
    }
    reasons.push(item.note);
    return { ...item, score, reasons };
  })
    .filter((item) => item.score > 0 && riskRank[item.riskLevel] <= riskCap)
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name, 'zh'))
    .slice(0, 4);

  const avoid: string[] = [];
  if (riskProfile === '保守') {
    avoid.push('高杠杆扩张', '短线频繁交易', '无安全垫满仓权益');
  } else if (riskProfile === '进取') {
    avoid.push('满仓单一标的', '忽视现金流安全垫', '把主题仓位做成主仓');
  } else {
    avoid.push('一次性重仓', '把节奏判断当成收益保证');
  }
  if (favorSet.has('水')) avoid.push('忽视汇率与流动性风险');
  if (favorSet.has('火')) avoid.push('情绪化追涨杀跌');

  return {
    fit: fit.length
      ? fit
      : ASSET_CLASSES.filter((item) => item.riskLevel !== 'high')
          .slice(0, 3)
          .map((item) => ({
            ...item,
            score: 1,
            reasons: [item.note, '用神匹配不足时的防守兜底'],
          })),
    avoid,
  };
}
