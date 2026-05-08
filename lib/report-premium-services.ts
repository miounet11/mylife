import type { MonthlyWindow, ReportCorrectionInsight, ScenarioView } from '@/lib/report-v2';

export type PremiumServiceKey =
  | 'event-simulation'
  | 'event-verdict'
  | 'event-review'
  | 'meihua-enhancement';

export const PREMIUM_SERVICE_KEYS: PremiumServiceKey[] = [
  'event-simulation',
  'event-verdict',
  'event-review',
  'meihua-enhancement',
];

export function isPremiumServiceKey(value: string): value is PremiumServiceKey {
  return PREMIUM_SERVICE_KEYS.includes(value as PremiumServiceKey);
}

export function normalizePremiumServiceKey(value?: string | null): PremiumServiceKey | undefined {
  const normalized = `${value || ''}`.trim();
  return isPremiumServiceKey(normalized) ? normalized : undefined;
}

export interface PremiumServiceOffer {
  key: PremiumServiceKey;
  badge: string;
  title: string;
  tagline: string;
  description: string;
  featuredSignal: string;
  fitFor: string[];
  deliverables: string[];
  primaryCtaLabel: string;
  secondaryCtaLabel: string;
}

export function getPremiumServiceLabel(key: PremiumServiceKey) {
  switch (key) {
    case 'event-simulation':
      return '事件推演';
    case 'event-verdict':
      return '断事专项';
    case 'event-review':
      return '事件剖析';
    case 'meihua-enhancement':
      return '摇卦 / 梅花易增强';
    default:
      return '专项服务';
  }
}

export function buildPremiumServiceOffers(params: {
  scenarioViews: ScenarioView[];
  monthlyWindows: MonthlyWindow[];
  correctionInsight?: ReportCorrectionInsight;
}): PremiumServiceOffer[] {
  const scenario = pickFocusScenario(params.scenarioViews);
  const monthlyWindow = params.monthlyWindows[0];
  const correctionLevel = params.correctionInsight?.level || 'healthy';
  const correctionSummary = params.correctionInsight?.summary || '当前最适合围绕具体事件做更细的时机与动作拆解。';
  const featuredWindow = monthlyWindow
    ? `${monthlyWindow.label}${monthlyWindow.status === 'push' ? '更适合主动推进' : monthlyWindow.status === 'caution' ? '更适合先守后动' : '更适合稳步布局'}`
    : '系统会结合最近窗口重新判断时机';
  const featuredScenario = scenario
    ? `${scenario.title}${scenario.status === 'caution' ? '当前要先避坑再推进' : '当前已有可切入空间'}`
    : '系统会优先锁定当前最该处理的场景';
  const correctionSignal = correctionLevel === 'action'
    ? '这类问题更适合先纠偏，再决定是否继续投入。'
    : correctionLevel === 'watch'
      ? '这类问题适合先复盘偏差，再决定下一步节奏。'
      : '如果你想把一件事看得更透，可以直接进入专项推演。';

  return [
    {
      key: 'event-simulation',
      badge: '付费专项',
      title: '事件推演',
      tagline: '把一件具体的事拆成时机、路径和结果概率。',
      description: '适合求职、换岗、创业、合作、签约、关系推进等明确事件。系统会把命局结构、人生K线和近期窗口压成一条能执行的推进时间线。',
      featuredSignal: `${featuredScenario}，${featuredWindow}。`,
      fitFor: [
        '你已经有一件具体想推进的事',
        '你不满足于泛泛建议，想知道什么时候动、怎么动',
        '你希望把结果拆成阶段，而不是只看一句吉凶',
      ],
      deliverables: [
        '事件推进节奏图：什么时候试探、什么时候加速、什么时候收手',
        '成功条件、风险触发点和容易犯错的位置',
        '如果错过当前窗口，下一次更适合的替代时间',
      ],
      primaryCtaLabel: '进入事件推演',
      secondaryCtaLabel: '先记录成事件',
    },
    {
      key: 'event-verdict',
      badge: '高价值断事',
      title: '断事专项',
      tagline: '围绕一个问题给出更明确的倾向判断。',
      description: '适合“要不要做”“该不该谈”“这次合作能不能成”“该不该辞职”等二元或强决策问题。结果会更强调倾向、依据和取舍条件。',
      featuredSignal: scenario?.summary || '系统会优先抽取与你当前阶段最相关的结构证据。',
      fitFor: [
        '你现在卡在一个明确选择题里',
        '你需要的是倾向判断，而不是泛化安慰',
        '你愿意根据结构条件做取舍和筛选',
      ],
      deliverables: [
        '倾向判断：偏可行、偏保守或暂缓观察',
        '为什么这样判断，以及最关键的结构依据',
        '如果要推进，最应该先满足的前置条件',
      ],
      primaryCtaLabel: '进入断事专项',
      secondaryCtaLabel: '去 AI 深问',
    },
    {
      key: 'event-review',
      badge: '复盘增强',
      title: '事件剖析',
      tagline: '已经发生的事，重点看偏差原因和下一步修正。',
      description: '适合“为什么没成”“为什么方向对了但结果偏了”“同类事情为什么总在重复”这类复盘问题。系统会结合事件反馈闭环做纠偏。',
      featuredSignal: `${correctionSummary}${correctionSignal}`,
      fitFor: [
        '你已经经历过一次真实事件，想看偏差源头',
        '你想知道问题更像时机、执行还是信息判断失真',
        '你需要一个更稳定的下次打法',
      ],
      deliverables: [
        '本次偏差更可能来自哪里',
        '如果重做一次，节奏应该前移、后移还是分段',
        '下一次同类事件的三条纠偏检查点',
      ],
      primaryCtaLabel: '进入事件剖析',
      secondaryCtaLabel: '查看事件中心',
    },
    {
      key: 'meihua-enhancement',
      badge: '决策加成',
      title: '摇卦 / 梅花易增强',
      tagline: '适合时间敏感、二选一、要快速落判断的问题。',
      description: '当你面对临门一脚式问题时，可以在原有报告基础上叠加摇卦或梅花易增强，用来做近距离、短周期、强决策的辅助判断。',
      featuredSignal: '适合“今天要不要去谈”“这次消息真假如何”“A 和 B 先选哪个”这类短周期问题。',
      fitFor: [
        '问题强时效，不能等太久',
        '你需要对一件小而关键的事快速收敛',
        '你想在长期结构外，再看一次短时机波动',
      ],
      deliverables: [
        '短周期判断倾向和即时风险提醒',
        '近 24 小时到 30 天内更值得把握的动作点',
        '作为长期命理结构的补充，而不是替代',
      ],
      primaryCtaLabel: '开启卦象增强',
      secondaryCtaLabel: '先订阅升级提醒',
    },
  ];
}

function pickFocusScenario(scenarios: ScenarioView[]) {
  if (!Array.isArray(scenarios) || scenarios.length === 0) {
    return null;
  }

  return scenarios.find((item) => item.key !== 'overall' && item.status === 'caution')
    || scenarios.find((item) => item.key !== 'overall' && item.status === 'push')
    || scenarios.find((item) => item.key !== 'overall')
    || scenarios[0];
}

// v5-D1 (2026-05-08) 决策台风专项服务智能匹配
// 给定报告上下文，返回当下最该 surfacing 的一个 offer
// 选中规则（按优先级）：
//   1) correction.level === 'action'    → event-review (有偏差要复盘)
//   2) scenario.status === 'caution'    → event-verdict (需要倾向判断)
//   3) 有 push 类型的 monthlyWindow     → event-simulation (可以推演)
//   4) 默认                              → event-simulation (推演通用入口)
//   5) 未来可加：高时效问题 → meihua-enhancement
export function pickPrimaryPremiumOffer(params: {
  offers: PremiumServiceOffer[];
  scenarioViews: ScenarioView[];
  monthlyWindows: MonthlyWindow[];
  correctionInsight?: ReportCorrectionInsight;
}): PremiumServiceOffer | null {
  const offers = params.offers || [];
  const findOffer = (key: PremiumServiceKey) =>
    offers.find((o) => o.key === key) || null;

  // 1) 偏差需要复盘 → event-review
  if (params.correctionInsight?.level === 'action') {
    const review = findOffer('event-review');
    if (review) return review;
  }

  // 2) 场景有警示 → event-verdict
  const cautionScenario = (params.scenarioViews || []).find(
    (s) => s.key !== 'overall' && s.status === 'caution',
  );
  if (cautionScenario) {
    const verdict = findOffer('event-verdict');
    if (verdict) return verdict;
  }

  // 3) 有 push 类型的窗口 → event-simulation
  const pushWindow = (params.monthlyWindows || []).find(
    (w) => w.status === 'push',
  );
  if (pushWindow) {
    const simulation = findOffer('event-simulation');
    if (simulation) return simulation;
  }

  // 4) 默认 → event-simulation
  return findOffer('event-simulation') || offers[0] || null;
}
