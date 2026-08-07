/**
 * World Yi · Era timing (时代天时) — macro celestial / social cycle lens.
 *
 * Product stance:
 * - Outer planets / social pressure / friction windows = *environment & timing layer*,
 *   not destiny switches that override day-master structure.
 * - Hypotheses (e.g. 2030/2032) are falsifiable predictions for revisit scoring.
 * - Pairs with city theme: city = spatial environment; era = temporal environment.
 */

export type EraLayerId = 'outer' | 'social' | 'friction';

export type EraLayer = {
  id: EraLayerId;
  title: string;
  titleEn: string;
  symbols: string;
  symbolsEn: string;
  worldYiSlot: string;
  worldYiSlotEn: string;
  body: string;
  bodyEn: string;
  do: string;
  doEn: string;
  dont: string;
  dontEn: string;
};

export type FourPhaseId = 'garage' | 'scale' | 'integrate' | 'rule';

export type FourPhase = {
  id: FourPhaseId;
  order: number;
  title: string;
  titleEn: string;
  metaphor: string;
  metaphorEn: string;
  careerHint: string;
  careerHintEn: string;
  structureAsk: string;
  structureAskEn: string;
};

export type EraHypothesis = {
  id: string;
  year: number;
  label: string;
  labelEn: string;
  claim: string;
  claimEn: string;
  observeBy: string;
  observeByEn: string;
  falsifyIf: string;
  falsifyIfEn: string;
  status: 'open' | 'watching';
};

/** Three-layer star / social-cycle analysis, mapped to World Yi slots. */
export const ERA_THREE_LAYERS: EraLayer[] = [
  {
    id: 'outer',
    title: '外行星 · 时代拐点',
    titleEn: 'Outer planets · era inflections',
    symbols: '天王星、海王星、冥王星等长周期体',
    symbolsEn: 'Uranus, Neptune, Pluto (long cycles)',
    worldYiSlot: '时位 / 宏观环境底色',
    worldYiSlotEn: 'Timing / macro environment base',
    body:
      '标记技术范式、制度与集体风险偏好的转折，而不是个人吉凶开关。世界易把它读成「时代底色」：你的大运流年是在顺势放大，还是在逆势摩擦。',
    bodyEn:
      'Marks shifts in tech paradigms, institutions, and collective risk appetite — not personal luck switches. Read as era base color against your decade/year windows.',
    do: '用公开事件回测：拐点前后行业、监管与资本成本是否同向变化。',
    doEn: 'Backtest with public events: industry, regulation, capital cost around the inflection.',
    dont: '不要用外行星过宫直接断个人暴富/破产。',
    dontEn: 'Do not use a single outer-planet transit to decree personal boom or bust.',
  },
  {
    id: 'social',
    title: '土木 · 社会压力点',
    titleEn: 'Jupiter–Saturn · social pressure',
    symbols: '木星扩张 / 土星约束与周期会合',
    symbolsEn: 'Jupiter expansion / Saturn constraint & cycles',
    worldYiSlot: '环境层 · 社会与制度压力',
    worldYiSlotEn: 'Environment · social & institutional pressure',
    body:
      '定位就业、监管、舆论与资本成本的张弛。与迁城、择业同一逻辑：环境是压力测试，不是地理或星座定命。',
    bodyEn:
      'Locates stretch/squeeze in jobs, regulation, narrative, and cost of capital. Same logic as city fit: pressure test, not destiny.',
    do: '写清压力来源：监管、利率、编制/签证、平台规则中的哪一两项。',
    doEn: 'Name pressure sources: regulation, rates, visa/headcount, platform rules.',
    dont: '不要把「土星压你」写成无法行动的借口。',
    dontEn: 'Do not use “Saturn is crushing you” as an excuse for inaction.',
  },
  {
    id: 'friction',
    title: '火星逆行 · 摩擦窗口',
    titleEn: 'Mars retrograde · friction windows',
    symbols: '火星逆行及高冲突相位窗口',
    symbolsEn: 'Mars retrograde & high-conflict aspect windows',
    worldYiSlot: '风险层 · 高摩擦时段',
    worldYiSlotEn: 'Risk · high-friction windows',
    body:
      '预警谈判、诉讼、扩招、公开对线等冲突型动作的摩擦上升。宜缓签长约、宜复核流程，不是灾厄预言。',
    bodyEn:
      'Flags elevated friction for negotiation, litigation, hiring surges, public fights. Prefer delay on long contracts and process checks — not disaster prophecy.',
    do: '把窗口写进事件日历，到期回访：冲突是否真的升高。',
    doEn: 'Log the window on the event calendar; revisit whether friction actually rose.',
    dont: '不要用逆行恐吓用户停止一切决策。',
    dontEn: 'Do not scare users into freezing all decisions during retrograde.',
  },
];

/** Four-phase tech / venture stage model (garage → rules). */
export const ERA_FOUR_PHASES: FourPhase[] = [
  {
    id: 'garage',
    order: 1,
    title: '车库孵化',
    titleEn: 'Garage incubation',
    metaphor: '单点验证、小团队、高容错',
    metaphorEn: 'Single-point validation, small team, high error tolerance',
    careerHint: '适合探索型发挥：原型、试点、边角创新。',
    careerHintEn: 'Fits exploratory style: prototypes, pilots, edge innovation.',
    structureAsk: '你的用神是否允许「试错密度」？现金流撑得住吗？',
    structureAskEn: 'Does your useful-god style allow high trial density? Cash runway?',
  },
  {
    id: 'scale',
    order: 2,
    title: '放量扩张',
    titleEn: 'Scale-out',
    metaphor: '复制成功路径、抢份额、融资或编制扩张',
    metaphorEn: 'Replicate path, take share, fund or headcount expansion',
    careerHint: '适合表达/推进型：渠道、品牌、销售节奏。',
    careerHintEn: 'Fits expression/push style: channels, brand, sales rhythm.',
    structureAsk: '当前大运是否允许重排资源？还是该先收口验证？',
    structureAskEn: 'Does this decade allow resource re-layout — or tighten validation first?',
  },
  {
    id: 'integrate',
    order: 3,
    title: '技术整合',
    titleEn: 'Integration',
    metaphor: '标准接口、合并路径、从单点到系统',
    metaphorEn: 'Interfaces, merge paths, from point breakthroughs to systems',
    careerHint: '适合协调/建设型：架构、中台、跨团队治理。',
    careerHintEn: 'Fits coordinate/build style: architecture, platform, cross-team governance.',
    structureAsk: '你是整合者还是被整合对象？角色是否匹配？',
    structureAskEn: 'Integrator or integratee? Does the role match your structure?',
  },
  {
    id: 'rule',
    order: 4,
    title: '规则制定',
    titleEn: 'Rule-making',
    metaphor: '标准、合规、平台规则、行业话语权',
    metaphorEn: 'Standards, compliance, platform rules, industry voice',
    careerHint: '适合收敛/守成型：风控、标准、长期资产与声誉。',
    careerHintEn: 'Fits conserve style: risk control, standards, long-horizon assets & reputation.',
    structureAsk: '你是否进入「定规则」窗口，还是仍在被规则定价？',
    structureAskEn: 'Are you writing rules — or still priced by them?',
  },
];

/**
 * Public, falsifiable hypotheses inspired by popular Uranus × mansion narratives.
 * These are *content hypotheses* for calibration — not production astro ephemeris claims.
 */
export const ERA_HYPOTHESES: EraHypothesis[] = [
  {
    id: 'h-2030-bi',
    year: 2030,
    label: '2030 · 毕宿窗口（假设）',
    labelEn: '2030 · Bi mansion window (hypothesis)',
    claim:
      '若「天王星×星宿阶段」叙事成立，2030 前后更易出现 AI 等技术的单点突破集中爆发（应用层与算力/数据接口的跃迁）。',
    claimEn:
      'If the Uranus×mansion stage narrative holds, ~2030 skews toward clustered single-point AI (and adjacent tech) breakthroughs.',
    observeBy: '2030-12-31',
    observeByEn: '2030-12-31',
    falsifyIf:
      '主要指标（顶级会议/开源里程碑/资本与算力拐点）未出现相对 2027–2029 的显著跃迁，则该假设降权。',
    falsifyIfEn:
      'If top-tier milestones / open-source / compute-capital inflection do not leap vs 2027–2029, down-weight the claim.',
    status: 'open',
  },
  {
    id: 'h-2032-shen',
    year: 2032,
    label: '2032 · 参宿窗口（假设）',
    labelEn: '2032 · Shen mansion window (hypothesis)',
    claim:
      '2032 前后更易进入「技术整合完成」阶段：标准、接口与产业分工收敛，单点神话让位于系统与规则。',
    claimEn:
      '~2032 skews toward integration complete: standards, interfaces, and industry division — less single-point myth, more systems and rules.',
    observeBy: '2032-12-31',
    observeByEn: '2032-12-31',
    falsifyIf:
      '若行业仍以碎片化单点竞争为主、缺少跨栈标准与整合并购主线，则该假设降权。',
    falsifyIfEn:
      'If the field stays fragmented single-point races without cross-stack standards / integration M&A, down-weight the claim.',
    status: 'open',
  },
];

export const WORLD_YI_ERA_METHOD_BLURB =
  '星象与天象不是命运开关，而是时代环境层：外行星标拐点，土木标社会压力，火逆标摩擦窗口。再与个人结构、大运、城市环境对齐，最后落到可验证动作。空间（城）+ 时代（天时）= 完整环境层。';

export const WORLD_YI_ERA_METHOD_BLURB_EN =
  'Celestial cycles are not destiny switches — they are an era environment layer: outer planets mark inflections, Jupiter–Saturn social pressure, Mars retrograde friction windows. Align with structure, personal timing, and city environment, then design falsifiable actions. Space (city) + era (sky time) = full environment layer.';

export function listEraKnowledgeLinks(): Array<{
  href: string;
  title: string;
  titleEn: string;
  summary: string;
  summaryEn: string;
}> {
  return [
    {
      href: '/knowledge/world-yi-era-three-layer-stars',
      title: '三层星象分析法',
      titleEn: 'Three-layer star analysis',
      summary: '外行星 / 土木 / 火逆如何接到世界易五层判断。',
      summaryEn: 'Outer / social / friction layers mapped to World Yi.',
    },
    {
      href: '/knowledge/world-yi-era-four-phase',
      title: '四象阶段论',
      titleEn: 'Four-phase stage model',
      summary: '车库 → 放量 → 整合 → 定规则，与用神发挥方式对照。',
      summaryEn: 'Garage → scale → integrate → rules, vs useful-god style.',
    },
    {
      href: '/knowledge/world-yi-era-uranus-cycle',
      title: '天王星周期与技术阶段',
      titleEn: 'Uranus cycle & tech stages',
      summary: '84 年叙事如何读、如何证伪；2030/2032 假设页入口。',
      summaryEn: 'How to read (and falsify) the 84-year narrative; 2030/2032 hypotheses.',
    },
  ];
}
