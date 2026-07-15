export interface PartnerArchetype {
  key: string;
  label: string;
  fit: string;
  risk: string;
  division: string;
}

export const PARTNER_ARCHETYPES: PartnerArchetype[] = [
  {
    key: 'peer',
    label: '对等型（比劫）',
    fit: '适合能力互补、分工清晰的对等合伙',
    risk: '利益分配不清时易内耗',
    division: '你负责前台/执行，对方负责资源/后台，或按项目里程碑分账',
  },
  {
    key: 'rule',
    label: '规则型（官杀）',
    fit: '适合需要制度、合规、流程管控的合作',
    risk: '过度控制会压制创新',
    division: '对方定规则与验收，你负责落地与反馈闭环',
  },
  {
    key: 'support',
    label: '支持型（印星）',
    fit: '适合长期学习、研发、顾问式合作',
    risk: '容易重讨论轻交付',
    division: '对方提供方法论与资源，你负责产品化与节奏推进',
  },
  {
    key: 'resource',
    label: '资源型（财星）',
    fit: '适合渠道、资金、客户资源互补',
    risk: '现金流与分成条款是最大摩擦点',
    division: '书面约定分成、结算周期与退出机制，先小单验证',
  },
];

export function rankPartnerArchetypes(shiShenCount: Record<string, number>): {
  fit: PartnerArchetype[];
  avoid: string[];
} {
  const biJie = (shiShenCount['比肩'] || 0) + (shiShenCount['劫财'] || 0);
  const guanSha = (shiShenCount['正官'] || 0) + (shiShenCount['七杀'] || 0);
  const yin = (shiShenCount['正印'] || 0) + (shiShenCount['偏印'] || 0);
  const cai = (shiShenCount['正财'] || 0) + (shiShenCount['偏财'] || 0);

  const scored = [
    { archetype: PARTNER_ARCHETYPES[0], score: biJie },
    { archetype: PARTNER_ARCHETYPES[1], score: guanSha },
    { archetype: PARTNER_ARCHETYPES[2], score: yin },
    { archetype: PARTNER_ARCHETYPES[3], score: cai },
  ].sort((a, b) => b.score - a.score);

  const fit = scored.filter((item) => item.score > 0).slice(0, 2).map((item) => item.archetype);
  const avoid: string[] = [];
  if (biJie >= 1.5 && cai > 0) avoid.push('比劫夺财：合伙前明确「谁管钱、谁管事」');
  if (guanSha > 0 && (shiShenCount['伤官'] || 0) > 0) avoid.push('伤官见官：避免口头承诺替代书面协议');
  if (!avoid.length) avoid.push('合作前先做 30-90 天小项目验证，再谈长期绑定');

  return { fit: fit.length ? fit : PARTNER_ARCHETYPES.slice(0, 2), avoid };
}