/**
 * 数据底座完整度里程碑 — 产品化进度感
 */

export type FoundationMilestoneId =
  | 'birth'
  | 'report'
  | 'life_qa'
  | 'body'
  | 'apps'
  | 'solid'
  | 'rich';

export type FoundationMilestone = {
  id: FoundationMilestoneId;
  label: string;
  description: string;
  /** 达成门槛（overall 或专用条件） */
  targetOverall?: number;
  done: boolean;
  href: string;
  ctaLabel: string;
  rewardHint: string;
};

export type MilestoneInput = {
  overall: number;
  hasBirth: boolean;
  hasReport: boolean;
  lifeQaScore: number;
  bodyScore: number;
  toolsScore: number;
  fortuneId?: string | null;
};

export function buildFoundationMilestones(input: MilestoneInput): FoundationMilestone[] {
  const f = input.fortuneId
    ? `?fortuneId=${encodeURIComponent(input.fortuneId)}`
    : '';
  const foundation = `/profile/foundation${f}`;
  const wizard = `/profile/foundation?wizard=1${input.fortuneId ? `&fortuneId=${encodeURIComponent(input.fortuneId)}` : ''}`;

  return [
    {
      id: 'birth',
      label: '立生辰',
      description: '年月日（时辰更佳）',
      done: input.hasBirth,
      href: input.hasBirth ? foundation : '/analyze?source=foundation_milestone_birth',
      ctaLabel: input.hasBirth ? '已完成' : '去排盘',
      rewardHint: '解锁四柱与星座推导',
    },
    {
      id: 'report',
      label: '结构报告',
      description: '生成至少一份人生 K 线报告',
      done: input.hasReport,
      href: input.hasReport
        ? input.fortuneId
          ? `/result/${input.fortuneId}`
          : '/profile'
        : '/analyze?source=foundation_milestone_report',
      ctaLabel: input.hasReport ? '查看' : '生成',
      rewardHint: '对话可锚定日主/用神真值',
    },
    {
      id: 'life_qa',
      label: '生活参数',
      description: '职业/目标/关系等问答过半',
      targetOverall: 50,
      done: input.lifeQaScore >= 50,
      href: wizard,
      ctaLabel: input.lifeQaScore >= 50 ? '已过半' : '问答向导',
      rewardHint: '建议更贴你的现实场景',
    },
    {
      id: 'body',
      label: '体貌观测',
      description: '面相或手相至少一项',
      done: input.bodyScore >= 50,
      href: `/tools/physiognomy${f ? f + '&' : '?'}source=foundation_milestone`,
      ctaLabel: input.bodyScore >= 50 ? '已观测' : '上传',
      rewardHint: '物理→命理交叉层',
    },
    {
      id: 'apps',
      label: '应用工具',
      description: '起名 / 空间 / 合婚 / 维度任一',
      done: input.toolsScore >= 25,
      href: `/tools${f ? f.replace('?', '?') : ''}`,
      ctaLabel: input.toolsScore >= 25 ? '已试用' : '去试用',
      rewardHint: '工具信号进入底座',
    },
    {
      id: 'solid',
      label: '核心已立',
      description: '底座完整度 ≥ 65%',
      targetOverall: 65,
      done: input.overall >= 65,
      href: foundation,
      ctaLabel: input.overall >= 65 ? '已达成' : '继续补',
      rewardHint: '报告与对话默认带全参数',
    },
    {
      id: 'rich',
      label: '参数较全',
      description: '底座完整度 ≥ 85%',
      targetOverall: 85,
      done: input.overall >= 85,
      href: foundation,
      ctaLabel: input.overall >= 85 ? '已达成' : '冲刺',
      rewardHint: '适合作为会员深度服务底座',
    },
  ];
}

export function milestoneProgress(milestones: FoundationMilestone[]): {
  done: number;
  total: number;
  percent: number;
  next: FoundationMilestone | null;
} {
  const done = milestones.filter((m) => m.done).length;
  const total = milestones.length;
  return {
    done,
    total,
    percent: total ? Math.round((done / total) * 100) : 0,
    next: milestones.find((m) => !m.done) || null,
  };
}
