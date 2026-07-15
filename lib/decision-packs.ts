/**
 * 人生分叉 Decision Pack — 跳槽/创业/搬家/大额支出/升学
 * 从 ProReportView + 用忌 生成可执行一页包，不另起算法。
 */

import type { ProReportView } from '@/lib/report-pro-view';
import { presentReportText } from '@/lib/report-presentation';

export type DecisionPackKey = 'job_change' | 'startup' | 'relocation' | 'big_spend' | 'study';

export interface DecisionPack {
  key: DecisionPackKey;
  title: string;
  stance: '推进' | '稳健' | '防守';
  oneLiner: string;
  checklist: string[];
  windows: string[];
  risks: string[];
  verifyIn90Days: string[];
  dimensionHref?: string;
}

export function buildDecisionPacks(view: ProReportView, reportId?: string): DecisionPack[] {
  const career = view.topics.find((t) => t.key === 'career');
  const wealth = view.topics.find((t) => t.key === 'wealth');
  const health = view.topics.find((t) => t.key === 'health');
  const month = view.timeScores.find((s) => s.key === 'month');
  const year = view.timeScores.find((s) => s.key === 'year');
  const yong = view.elements.yongShen.join('、') || '用神';
  const ji = view.elements.jiShen.join('、') || '忌神';
  const q = reportId ? `?reportId=${encodeURIComponent(reportId)}` : '';

  const careerStance = stanceFrom(career?.score10, career?.status);
  const wealthStance = stanceFrom(wealth?.score10, wealth?.status);
  const monthCaution = month?.level === 'caution';

  return [
    {
      key: 'job_change',
      title: '跳槽 / 转岗',
      stance: careerStance,
      oneLiner:
        careerStance === '推进'
          ? `事业分 ${career?.score10 ?? '—'}/10，可主动看机会，但仍顺 ${yong} 选岗。`
          : careerStance === '防守'
            ? `事业宜先稳住现岗位能力与现金流，慎裸辞。`
            : `宜「先谈后动」：内部转岗或拿到 offer 再决策。`,
      checklist: [
        `岗位是否落在喜用方向（${yong}）而非触忌（${ji}）`,
        '是否具备 6 个月生活缓冲，再考虑空窗期',
        '谈薪与职责是否写进书面 offer',
        view.nowAction.doThis,
      ],
      windows: [
        month ? `本月 ${month.score10}/10 · ${month.tip || month.level}` : '关注本月节奏',
        year ? `今年 ${year.score10}/10` : '',
        view.nowAction.focusWindow ? `焦点窗 ${view.nowAction.focusWindow}` : '',
      ].filter(Boolean),
      risks: [
        view.nowAction.avoidThis,
        monthCaution ? '本月偏紧，重大跳槽决策宜延后或缩小动作' : '',
        ...view.riskAlerts.slice(0, 1).map((r) => `${r.when}：${r.title}`),
      ].filter(Boolean),
      verifyIn90Days: ['是否入职/谈妥', '压力与收入是否同时可接受', '是否仍顺喜用方向'],
      dimensionHref: `/dimensions/career-industry${q}`,
    },
    {
      key: 'startup',
      title: '创业 / 副业',
      stance: careerStance === '推进' && wealthStance !== '防守' ? '推进' : wealthStance === '防守' ? '防守' : '稳健',
      oneLiner:
        wealthStance === '防守'
          ? '财运宜守现金流，创业宜轻资产小步试错。'
          : '可小范围验证需求，避免全仓投入。',
      checklist: [
        '是否有可验证的付费用户/订单，而非仅热情',
        `业务模式是否贴近用神 ${yong}`,
        '合伙权责与退出条款是否事先写清',
        '主业收入是否仍覆盖生活必需',
      ],
      windows: [
        year ? `今年事业/财运背景 ${career?.score10 ?? '—'}/${wealth?.score10 ?? '—'}` : '分阶段试水',
      ],
      risks: ['避免借贷加杠杆扩张', '避免与忌神行业硬刚', presentReportText(wealth?.summary, 60)].filter(
        Boolean
      ) as string[],
      verifyIn90Days: ['是否有首笔收入', '周工时是否可持续', '是否触发健康红线'],
      dimensionHref: `/dimensions/career-industry${q}`,
    },
    {
      key: 'relocation',
      title: '搬家 / 迁移',
      stance: monthCaution ? '防守' : '稳健',
      oneLiner: '迁移看「匹配+窗口」：方位与生活成本优先于风水口号。',
      checklist: [
        '工作/家人是否形成真实拉力，而非情绪逃离',
        '新城市是否降低长期摩擦（通勤、托育、医疗）',
        '合同与租期是否避开明显避险月',
        ...view.elements.doList.slice(0, 1),
      ],
      windows: view.monthStrip
        .filter((m) => m.level === 'good')
        .slice(0, 2)
        .map((m) => `${m.label} 较宜推进`),
      risks: view.riskAlerts.slice(0, 2).map((r) => `${r.when} 慎大搬家`),
      verifyIn90Days: ['居住满意度', '通勤与开支', '关系是否更顺'],
      dimensionHref: `/dimensions/living-environment${q}`,
    },
    {
      key: 'big_spend',
      title: '大额支出 / 置业节奏',
      stance: wealthStance,
      oneLiner:
        wealthStance === '推进'
          ? '可在预算内推进，保留应急金。'
          : '宜先做现金流压力测试，再签约。',
      checklist: [
        '紧急备用金是否仍覆盖 6 个月',
        '月供/分期是否在收入 30% 安全线内（经验法则）',
        '是否非冲动窗口（避开风险月）',
        presentReportText(wealth?.summary, 80) || '对照财富议题建议',
      ],
      windows: [
        month && month.level === 'good' ? `本月可谈条款` : '本月宜多比价、少落笔',
      ],
      risks: ['避免加杠杆投机', view.nowAction.avoidThis].filter(Boolean) as string[],
      verifyIn90Days: ['是否按预算执行', '睡眠与焦虑是否可控', '是否影响主业'],
      dimensionHref: `/dimensions/investment${q}`,
    },
    {
      key: 'study',
      title: '学业 / 考试 / 技能升级',
      stance: health?.score10 && health.score10 < 5 ? '防守' : '稳健',
      oneLiner: '用印食伤逻辑做学习投资：可验证产出优先于证书堆叠。',
      checklist: [
        '目标是否可在 90 天内看见进度（作品/分数/面试）',
        `学习方向是否贴近 ${yong}`,
        '睡眠是否被牺牲（健康底线）',
      ],
      windows: [year ? `今年整体 ${year.score10}/10，宜定一个主技能` : '定一个主技能'],
      risks: health?.score10 && health.score10 < 5 ? ['身体分偏低，忌熬夜冲刺'] : ['避免同时开三门证'],
      verifyIn90Days: ['是否完成阶段考核', '是否形成可展示成果'],
      dimensionHref: `/dimensions/study-career${q}`,
    },
  ];
}

function stanceFrom(score10?: number, status?: string): DecisionPack['stance'] {
  if (status === 'push' || (score10 != null && score10 >= 7)) return '推进';
  if (status === 'caution' || (score10 != null && score10 <= 4)) return '防守';
  return '稳健';
}
