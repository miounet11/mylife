// 报告页辅助函数集合
// 从 app/result/[id]/page.tsx 抽出，全部纯函数，无 React/无 DB
// spec: docs/superpowers/specs/2026-05-07-frontend-redesign-design.md §5.2

import type { FortuneRecord } from '@/lib/user-types';
import { localizeElementList, presentReportLines, presentReportText } from '@/lib/report-presentation';

export function getPublicDisplayName(name?: string | null) {
  const cleaned = `${name || ''}`.trim();
  if (!cleaned) return '某位用户';
  if (cleaned.length === 1) return `${cleaned}**`;
  return `${cleaned.slice(0, 1)}**`;
}

export function sanitizePublicFortuneRecord<T extends FortuneRecord>(record: T): T {
  return {
    ...record,
    userId: 'public-anonymous',
    name: getPublicDisplayName(record.name),
    birthDate: '',
    birthTime: '',
    birthPlace: undefined,
    bazi: {
      ...record.bazi,
      userId: undefined,
      name: getPublicDisplayName(record.name),
      birthDate: undefined,
      birthTime: undefined,
      birthPlace: undefined,
    },
  };
}

export function compactCopy(value?: string | null, maxLength = 92) {
  return presentReportText(value, maxLength);
}

export function getLifeKLineMetricToneClasses(tone?: 'strong' | 'steady' | 'watch') {
  if (tone === 'strong') {
    return {
      card: 'border-emerald-200 bg-emerald-50/70',
      label: 'text-emerald-700',
      value: 'text-emerald-900',
    };
  }
  if (tone === 'watch') {
    return {
      card: 'border-amber-200 bg-amber-50/75',
      label: 'text-amber-800',
      value: 'text-amber-950',
    };
  }
  return {
    card: 'border-sky-200 bg-sky-50/70',
    label: 'text-sky-700',
    value: 'text-sky-900',
  };
}

interface ValidationInsights {
  totalLinkedEvents?: number;
  accurateCount?: number;
  driftCount?: number;
  pendingCount?: number;
}

interface LinkedEvent {
  title?: string;
  userFeedback?: { wasAccurate?: boolean; userNotes?: string } | undefined;
  fortuneAnalysis?: { reason?: string } | undefined;
}

export function buildPastValidationBlock(params: {
  structuredBlock?: { headline?: string; evidence?: string[] };
  validationInsights: ValidationInsights;
  linkedEvents: LinkedEvent[];
}) {
  if (params.structuredBlock?.headline || (params.structuredBlock?.evidence || []).length > 0) {
    return {
      eyebrow:
        (params.validationInsights.totalLinkedEvents || 0) > 0 ? '已发生的印证' : '先建立印证样本',
      headline: compactCopy(
        params.structuredBlock?.headline ||
          '你过去的人生里，已经反复出现过与这份命理结构一致的信号。',
      ),
      evidence: presentReportLines(params.structuredBlock?.evidence || [], { limit: 3 }),
    };
  }

  const accurateEvents = params.linkedEvents
    .filter((event) => event.userFeedback?.wasAccurate === true)
    .slice(0, 2);
  const driftEvents = params.linkedEvents
    .filter((event) => event.userFeedback?.wasAccurate === false)
    .slice(0, 1);
  const accurateCount = params.validationInsights.accurateCount || 0;
  const driftCount = params.validationInsights.driftCount || 0;
  const pendingCount = params.validationInsights.pendingCount || 0;
  const totalLinkedEvents = params.validationInsights.totalLinkedEvents || 0;

  let headline = '你的人生主线已经开始在现实里显形，只是还需要继续补样本。';
  if (accurateCount >= 2) {
    headline = `这份命理判断已经被 ${accurateCount} 个真实事件印证，不是空泛结论。`;
  } else if (accurateCount === 1) {
    headline = '这份命理判断已经出现首个现实印证，说明主线方向是对的。';
  } else if (driftCount > 0) {
    headline = '现实反馈显示这份判断并非全错，真正要修的是时机和动作，不是推翻整体结构。';
  }

  const evidence = [
    ...accurateEvents.map((event) =>
      compactCopy(
        `${event.title || '已记录事件'}：${event.userFeedback?.userNotes || event.fortuneAnalysis?.reason || '这类节点已经和报告判断形成对应。'}`,
      ),
    ),
    ...driftEvents.map((event) =>
      compactCopy(
        `${event.title || '偏差事件'}：当前出现偏差，更像时机或执行跑偏，适合回看当时动作与节奏。`,
      ),
    ),
    totalLinkedEvents === 0
      ? '现在还没有足够的现实样本，后面一旦遇到转岗、合作、感情推进、搬迁、健康波动等节点，应立即记录。'
      : `当前共关联 ${totalLinkedEvents} 个事件，其中待继续观察 ${pendingCount} 个。`,
  ]
    .filter(Boolean)
    .slice(0, 3) as string[];

  return {
    eyebrow: totalLinkedEvents > 0 ? '已发生的印证' : '先建立印证样本',
    headline,
    evidence,
  };
}

export function buildPresentDiagnosisBlock(params: {
  structuredBlock?: { headline?: string; evidence?: string[] };
  currentStageSummary: string;
  decisionHeadline: string;
  patternType?: string;
  currentDaYun?: string;
  favoredElements: string[];
  stateVectorCards: Array<{ label: string; value: number }>;
}) {
  if (params.structuredBlock?.headline || (params.structuredBlock?.evidence || []).length > 0) {
    return {
      eyebrow: '你现在所处的位置',
      headline: compactCopy(
        params.structuredBlock?.headline || params.decisionHeadline || params.currentStageSummary,
      ),
      evidence: presentReportLines(params.structuredBlock?.evidence || [], { limit: 3 }),
    };
  }

  const strongestVector = [...params.stateVectorCards].sort((left, right) => right.value - left.value)[0];
  const weakestVector = [...params.stateVectorCards].sort((left, right) => left.value - right.value)[0];
  const evidence = [
    params.patternType
      ? `命局主轴：你当前按 ${params.patternType} 结构来判断，不能脱离这个骨架。`
      : '',
    params.currentDaYun
      ? `阶段位置：现在正落在 ${params.currentDaYun} 这一步运，重点是认清这一步到底要你收、要你守，还是要你推。`
      : '',
    localizeElementList(params.favoredElements).length > 0
      ? `顺势方向：现阶段优先放大 ${localizeElementList(params.favoredElements).join('、')} 对应的动作和环境。`
      : '',
    strongestVector && weakestVector
      ? `现实侧重点：${strongestVector.label}相对占优，${weakestVector.label}更容易拖后腿，决策时不要平均用力。`
      : '',
  ]
    .filter(Boolean)
    .slice(0, 3);

  return {
    eyebrow: '你现在所处的位置',
    headline: compactCopy(
      params.decisionHeadline ||
        params.currentStageSummary ||
        '你现在最重要的，不是继续求更多答案，而是认清当前阶段真正的主轴。',
    ),
    evidence,
  };
}

export function buildFutureGuidanceBlock(params: {
  structuredBlock?: { headline?: string; evidence?: string[] };
  decisionNowAction: string;
  decisionAvoidAction: string;
  nextFocusSummary: string;
  leadWindow?: { label: string; theme?: string } | null;
  topMonthlyWindows: Array<{ label: string; theme?: string; status?: string }>;
}) {
  if (params.structuredBlock?.headline || (params.structuredBlock?.evidence || []).length > 0) {
    return {
      eyebrow: '接下来会怎么走',
      headline: compactCopy(
        params.structuredBlock?.headline || '接下来不要分散出击，先把当前阶段最该落地的动作做出来。',
      ),
      evidence: presentReportLines(params.structuredBlock?.evidence || [], { limit: 4 }),
    };
  }

  const leadWindowLabel = params.leadWindow
    ? `${params.leadWindow.label}${params.leadWindow.theme ? ` · ${params.leadWindow.theme}` : ''}`
    : '';
  const evidence = [
    leadWindowLabel
      ? `最近优先窗口：${leadWindowLabel}。这不是让你同时做很多事，而是要求你在窗口内把关键动作做准。`
      : '',
    params.decisionNowAction ? `现在就做：${params.decisionNowAction}` : '',
    params.decisionAvoidAction ? `明确避开：${params.decisionAvoidAction}` : '',
    params.topMonthlyWindows.length > 1
      ? `后续观察顺序：${params.topMonthlyWindows.map((item) => item.label).join('、')}。`
      : params.nextFocusSummary,
  ]
    .filter(Boolean)
    .slice(0, 4);

  return {
    eyebrow: '接下来会怎么走',
    headline: compactCopy(
      leadWindowLabel
        ? `接下来最容易起变化的是 ${leadWindowLabel} 这段，你要做的是顺势推进，而不是逆势硬顶。`
        : '接下来不要分散出击，先把当前阶段最该落地的动作做出来。',
    ),
    evidence,
  };
}

export function inferWorldYiGuidedPaths(signalText: string) {
  const lowered = signalText.toLowerCase();
  const domainCandidates = [
    {
      key: 'career',
      href: '/world-yi/domains/career',
      title: '进入事业分科',
      description: '把岗位、角色密度、推进节奏和组织压力重新排清。',
      matches: ['事业', '工作', '职业', '升职', '岗位', '团队', '老板', 'career', 'job', 'promotion'],
    },
    {
      key: 'wealth',
      href: '/world-yi/domains/wealth',
      title: '进入财富分科',
      description: '把赚钱、守财、现金流和扩张时机拆开看。',
      matches: ['财富', '赚钱', '收入', '现金流', '理财', '财务', '投资', 'wealth', 'money', 'cash'],
    },
    {
      key: 'relationship',
      href: '/world-yi/domains/relationship',
      title: '进入关系分科',
      description: '把关系从合不合，拉回边界、节奏和环境压力。',
      matches: ['关系', '感情', '婚姻', '伴侣', '恋爱', '复合', 'relationship', 'marriage', 'partner'],
    },
    {
      key: 'health',
      href: '/world-yi/domains/health',
      title: '进入健康分科',
      description: '先看恢复秩序、透支循环和环境密度，再谈推进。',
      matches: ['健康', '身体', '恢复', '焦虑', '睡眠', '压力', 'health', 'stress', 'recovery'],
    },
    {
      key: 'family',
      href: '/world-yi/domains/family',
      title: '进入家庭分科',
      description: '处理责任排序、代际压力和家庭恢复位。',
      matches: ['家庭', '父母', '孩子', '照护', '代际', 'family', 'parent', 'child'],
    },
    {
      key: 'migration',
      href: '/world-yi/domains/migration',
      title: '进入迁移分科',
      description: '把留回、城市、身份成本和环境匹配一起看。',
      matches: ['迁移', '移民', '出国', '回国', '城市', '海外', 'migration', 'overseas', 'relocation'],
    },
  ] as const;
  const matchedDomain = domainCandidates.find((candidate) =>
    candidate.matches.some((keyword) => lowered.includes(keyword)),
  );

  return [
    {
      href: '/knowledge/world-yi-methodology',
      title: '先回方法论',
      description:
        '如果你想知道这份结果为什么这样排，先看结构、阶段、环境、动作的判断总法。',
    },
    matchedDomain
      ? {
          href: matchedDomain.href,
          title: matchedDomain.title,
          description: matchedDomain.description,
        }
      : {
          href: '/world-yi/domains',
          title: '进入人生六域',
          description: '把当前问题挂回事业、财富、关系、健康、家庭、迁移六条主线里继续读。',
        },
    lowered.includes('海外') ||
    lowered.includes('出国') ||
    lowered.includes('移民') ||
    lowered.includes('跨境') ||
    lowered.includes('global') ||
    lowered.includes('overseas')
      ? {
          href: '/world-yi/global',
          title: '进入全球华人层',
          description:
            '当前问题涉及身份、迁移、跨文化或双边生活时，直接切到全球判断层。',
        }
      : {
          href: '/world-yi/network',
          title: '查看专题地图',
          description:
            '从总入口切进六域、应用、全球与英文路径，看到这份报告在母系统中的位置。',
        },
    lowered.includes('名字') ||
    lowered.includes('起名') ||
    lowered.includes('家宅') ||
    lowered.includes('择时') ||
    lowered.includes('寻物')
      ? {
          href: '/world-yi/applications',
          title: '进入生活应用层',
          description:
            '当前问题更接近日常应用，就继续下钻到起名、择时、家宅和寻物路径。',
        }
      : {
          href: '/world-yi/book',
          title: '看世界易主书',
          description:
            '如果你要理解世界易的母体系，就从十卷主书工程继续展开。',
        },
  ];
}
