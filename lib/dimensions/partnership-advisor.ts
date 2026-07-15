import { generateBaziShiShenAnalysis } from '@/lib/bazi-analyzer';
import type { DimensionAdvisorInput, DimensionReport } from './types';
import { buildDimensionEnginePack } from './engine-pack';
import { rankPartnerArchetypes } from './data/partner-archetypes';
import { buildPrediction, formatDateOffset, section } from './shared';

export function buildPartnershipReport(input: DimensionAdvisorInput): DimensionReport {
  const pack = buildDimensionEnginePack(input);
  const { truthInput, birthSignature } = pack;
  const reportId = input.reportId || `dimension_partner_${birthSignature}_${Date.now()}`;
  const pillars = truthInput.pillars || [];
  const bazi = pillars.map((p) => p.celestialStem + p.earthlyBranch);
  const analysis = generateBaziShiShenAnalysis(bazi);
  const { fit, avoid } = rankPartnerArchetypes(analysis.shiShenCount);
  const dayMaster = analysis.tenGodStructure.self;
  const isYang = ['甲', '丙', '戊', '庚', '壬'].includes(dayMaster);

  const sections = [
    section('core', '核心结论', [
      `日主 ${dayMaster} 偏${isYang ? '刚' : '柔'}，合作宜找能${isYang ? '补足规划与边界' : '补足推进与决断'}的伙伴。`,
      analysis.tenGodStructure.riskPatterns[0]
        ? `结构提醒：${analysis.tenGodStructure.riskPatterns[0].name} — ${analysis.tenGodStructure.riskPatterns[0].note}`
        : '未见显著合伙结构冲突，重在条款与节奏。',
    ], 'positive'),
    section(
      'fit',
      '更适合的合作者画像',
      fit.map((item) => `${item.label}：${item.fit}。分工建议：${item.division}`),
      'positive',
    ),
    section(
      'risk',
      '合伙风险点',
      [
        ...avoid,
        ...fit.map((item) => `${item.label}风险：${item.risk}`),
      ],
      'warning',
    ),
    section('contract', '合作落地清单', [
      '书面约定：出资比例、决策权、退出机制、竞业边界。',
      '先跑 30-90 天试点项目，再签长期合伙。',
      '资金账户与业务账户分离，按月对账。',
      '出现分歧时先对齐目标，再讨论方法。',
    ]),
    section('boundary', '边界说明', [
      '合作建议用于选人、分工与节奏参考，不构成法律或担保意见。',
      '正式合伙请咨询律师并签署协议。',
    ], 'muted'),
  ];

  const predictions = [
    buildPrediction(reportId, birthSignature, 'p1', {
      category: 'career',
      statement: '未来60天内完成一次合伙/协作「试点项目」验证',
      dueDate: formatDateOffset(60),
      confidence: 0.75,
      evidence: '人际合作 · 试点验证',
      verifyChecklist: ['是否书面约定分工？', '试点是否按期交付？'],
    }),
    buildPrediction(reportId, birthSignature, 'p2', {
      category: 'career',
      statement: `未来90天内与「${fit[0]?.label || '对等型'}」伙伴完成一次利益分配复盘`,
      dueDate: formatDateOffset(90),
      confidence: 0.72,
      evidence: '人际合作 · 分配复盘',
      verifyChecklist: ['是否无重大分歧？', '是否愿意续约？'],
    }),
    buildPrediction(reportId, birthSignature, 'p3', {
      category: 'career',
      statement: '未来180天内避免在信息不对称时签署长期绑定协议',
      dueDate: formatDateOffset(180),
      confidence: 0.7,
      evidence: '人际合作 · 风险边界',
      verifyChecklist: ['是否先小步验证？', '退出条款是否清晰？'],
    }),
  ];

  return {
    slug: 'partnership',
    title: '人际合作研判',
    question: '适合与什么人合作？合伙风险在哪？',
    generatedAt: new Date().toISOString(),
    birthSignature,
    sections,
    predictions,
    disclaimers: ['合作建议不构成法律意见或商业担保。'],
    meta: { dayMaster },
  };
}