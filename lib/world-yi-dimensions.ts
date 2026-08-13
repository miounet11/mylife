/**
 * World Yi problem dimensions (纬度) and the public solver.
 * Each latitude is how the six layers solve one class of real questions.
 * Product 十维度 / 六域 are applications of these latitudes, not a second theory.
 */

import {
  explainWorldYiQuery,
  formatWorldYiExplanation,
  listWorldYiSituations,
  matchWorldYiSituations,
  type WorldYiExplanation,
  type WorldYiLayerId,
  type WorldYiLogicDomain,
} from '@/lib/world-yi-logic';

export type WorldYiProblemDimensionId =
  | 'rhythm'
  | 'career'
  | 'study'
  | 'partnership'
  | 'wealth'
  | 'relationship'
  | 'family'
  | 'health'
  | 'migration'
  | 'living'
  | 'naming'
  | 'timing';

export type WorldYiProblemDimension = {
  id: WorldYiProblemDimensionId;
  name: string;
  question: string;
  domain: WorldYiLogicDomain;
  primaryLayer: WorldYiLayerId;
  productSlug: string | null;
  href: string;
  domainHref: string | null;
  solve: string;
  firstMove: string;
  today: string;
  sevenDays: string;
  thirtyDays: string;
  verify: string;
  refuse: string;
  keywords: string[];
};

export const WORLD_YI_PROBLEM_DIMENSIONS: WorldYiProblemDimension[] = [
  {
    id: 'rhythm',
    name: '节奏',
    question: '我现在处在什么阶段？该出苗还是入库？',
    domain: 'general',
    primaryLayer: 'timing',
    productSlug: 'fortune-rhythm',
    href: '/dimensions/fortune-rhythm',
    domainHref: '/world-yi/logic',
    solve: '先分田面与仓库，再谈大运名词。迷茫时优先找一件 80 分却没出土的库存。',
    firstMove: '写下手头已完成却未拿出来的一件事。有就出土，没有就做七天最小田活。',
    today: '只回答：气在地面还是仓库？',
    sevenDays: '选一件最小可验证的出土或入库，不新开第二件事。',
    thirtyDays: '回看那一件是否真的离开了文件夹。',
    verify: '30 日内是否有一件事从「准备」变成「已被别人看见」。',
    refuse: '不编造大运吉凶来结束迷茫。',
    keywords: ['阶段', '节奏', '迷茫', '下一步', '大运', '卡在中间', '什么时候'],
  },
  {
    id: 'career',
    name: '事业',
    question: '这份工作还要不要做？怎么推进、承压、换岗？',
    domain: 'career',
    primaryLayer: 'structure',
    productSlug: 'career-industry',
    href: '/dimensions/career-industry',
    domainHref: '/world-yi/domains/career',
    solve: '先看岗位是否让用神发挥，再看机会在田面还是仓库，最后测组织这块土。',
    firstMove: '用三条可验证差异（职责、汇报、作息）比较现在与下一个选择。',
    today: '写出「我在这岗位上真正被用到的发力方式」。',
    sevenDays: '给犹豫中的 offer / 内部机会一个上车或放弃日。',
    thirtyDays: '做一件对外可见的结果，避免只靠苦劳入库。',
    verify: '30 日内是否出现一次可见结果，或一个明确去留日。',
    refuse: '不说命里该做哪一行，不把忠诚写成必须无限等待。',
    keywords: ['工作', '跳槽', '升职', 'offer', '转行', '事业', '职业', '岗位'],
  },
  {
    id: 'study',
    name: '学业',
    question: '考试、升学、证书这季怎么收成？',
    domain: 'career',
    primaryLayer: 'timing',
    productSlug: 'study-career',
    href: '/dimensions/study-career',
    domainHref: '/world-yi/domains/career',
    solve: '窗口在田面就减株。再换方法是伪入库。',
    firstMove: '今天只定一个主作物，七日内交一件可批改的成品。',
    today: '划掉所有「再找个方法」。',
    sevenDays: '交一章、一套卷或一次模拟，必须有别人能批的痕迹。',
    thirtyDays: '按成品回看，不按焦虑回看。',
    verify: '30 日内是否留下可批改的完整成品，而不是更多资料。',
    refuse: '不说文昌到了就能过。',
    keywords: ['考试', '考研', '升学', '论文', '备考', '证书', '学业'],
  },
  {
    id: 'partnership',
    name: '合作',
    question: '这个人还能不能一起做事？',
    domain: 'career',
    primaryLayer: 'structure',
    productSlug: 'partnership',
    href: '/dimensions/partnership',
    domainHref: '/world-yi/domains/career',
    solve: '两粒种子共一块田，先画田埂：决策、分钱、退出。画不下来就先不加码。',
    firstMove: '七日内写出权责和退出，写不下来就暂停共同投入。',
    today: '分清谁主出苗、谁主仓库。',
    sevenDays: '把口头合伙写成一页田埂。',
    thirtyDays: '按田埂过一次账，而不是再谈愿景。',
    verify: '30 日内是否有书面分工，或明确停止共同投入。',
    refuse: '不说八字犯冲所以不能合作。',
    keywords: ['合伙', '合作', '股东', '分钱', '搭子', '工作室'],
  },
  {
    id: 'wealth',
    name: '财富',
    question: '钱怎么进来、怎么留下、何时才能扩张？',
    domain: 'wealth',
    primaryLayer: 'timing',
    productSlug: 'investment',
    href: '/dimensions/investment',
    domainHref: '/world-yi/domains/wealth',
    solve: '赚钱是田面，留下是仓库。仓库未建不扩张。投资问田候，不荐标的。',
    firstMove: '先建一个不可见的小仓库，或标出可亏得起的一仓与复盘日。',
    today: '看结余有没有离开消费面、进入仓库。',
    sevenDays: '固定比例划走，或写下持有到哪一天必须复盘。',
    thirtyDays: '回看仓库是否第一次留下，而不是回看行情。',
    verify: '30 日内是否出现一笔未被花掉的结余，或一次按规则退出。',
    refuse: '不荐股，不说命里留不住钱。',
    keywords: ['存钱', '投资', '加仓', '月光', '扩张', '理财', '漏财', '收入'],
  },
  {
    id: 'relationship',
    name: '关系',
    question: '这段关系是推进、观察，还是收手？',
    domain: 'relationship',
    primaryLayer: 'timing',
    productSlug: 'marriage',
    href: '/dimensions/marriage',
    domainHref: '/world-yi/domains/relationship',
    solve: '热是天气，秩序是结构。用两周验证一件具体秩序，不看誓言。',
    firstMove: '约定一个可验证的节奏（见面或明确不联系），看的是守约不是浓度。',
    today: '分清你要的是天气还是田埂。',
    sevenDays: '提出一件具体秩序并看对方是否接得住。',
    thirtyDays: '决定推进、观察或减株，不无限热冷。',
    verify: '30 日内是否出现可重复的节奏，或一次清楚的收手。',
    refuse: '不说八字不合所以处不长。',
    keywords: ['感情', '恋爱', '结婚', '复合', '忽冷忽热', '关系', '分手'],
  },
  {
    id: 'family',
    name: '家庭',
    question: '责任怎么排，才不会只剩我一个人当土壤？',
    domain: 'family',
    primaryLayer: 'structure',
    productSlug: null,
    href: '/world-yi/domains/family',
    domainHref: '/world-yi/domains/family',
    solve: '先排责任表，再谈孝和爱。照护若是过渡季，要写到期日，勿在情绪最高周永久翻地。',
    firstMove: '列出三件必须别人接的事，或写出 30 日值班表。',
    today: '承认主田只有一块：事业或照护，先标过渡还是新主田。',
    sevenDays: '交出一件可交接的家事或值班。',
    thirtyDays: '到期复盘：继续过渡，还是改主田。',
    verify: '30 日内是否有一件责任真正离开你的日程。',
    refuse: '不把牺牲写成命定的孝。',
    keywords: ['家庭', '父母', '孩子', '照护', '夹心', '家务', '上有老'],
  },
  {
    id: 'health',
    name: '健康',
    question: '恢复秩序乱了，还要不要硬推？',
    domain: 'health',
    primaryLayer: 'timing',
    productSlug: 'health',
    href: '/dimensions/health',
    domainHref: '/world-yi/domains/health',
    solve: '先减产和保恢复窗，再谈效率。过密的土先改一处可逆的。不替代医疗。',
    firstMove: '守住一个不可侵占的恢复窗（一夜或一个上午）。',
    today: '把「再撑一下」写成损耗，而不是美德。',
    sevenDays: '连续保住恢复窗，并改一处土（睡眠间或通勤）。',
    thirtyDays: '用睡眠或崩溃次数复盘，不用感觉鸡汤。',
    verify: '30 日内周末是否还在还债，还是开始真的恢复。',
    refuse: '不把养生广告写成命理，不替代诊疗。',
    keywords: ['失眠', '过劳', '透支', '身体', '健康', '睡不好', '焦虑'],
  },
  {
    id: 'migration',
    name: '迁移',
    question: '该不该换城、回国、两边跑？',
    domain: 'migration',
    primaryLayer: 'environment',
    productSlug: null,
    href: '/world-yi/cities',
    domainHref: '/world-yi/domains/migration',
    solve: '先分清是种子不适这块土，还是这一季田候难受。地图不是答案。双城必须有到期日。',
    firstMove: '先在原城做一次最小换土；仍不适，再把迁城写成下一季田活。',
    today: '写下想逃的是天气还是土质。',
    sevenDays: '做一次可逆换土（换组、换住处、换节奏）。',
    thirtyDays: '若仍不适，才列迁城的成本、签证、家庭，不当周下决定。',
    verify: '30 日内是否完成一次原城换土实验，而不是只收藏移民帖。',
    refuse: '不推荐某城旺你。',
    keywords: ['换城', '迁移', '移民', '润', '回国', '两地', '出国'],
  },
  {
    id: 'living',
    name: '居所',
    question: '这块住的土还要不要改？',
    domain: 'migration',
    primaryLayer: 'environment',
    productSlug: 'living-environment',
    href: '/dimensions/living-environment',
    domainHref: '/tools/fengshui-space',
    solve: '光、声、通勤、同住密度先于方位。搬家改土，不改命。',
    firstMove: '两周内改一处可逆的土；仍不适再谈搬家清单。',
    today: '标出最抽人的一处：声、光、通勤或同住。',
    sevenDays: '改那一处（窗帘、睡眠间、远端一天）。',
    thirtyDays: '记录睡眠或恢复，决定是否进入搬家清单。',
    verify: '30 日内恢复是否因改土而变，而不是因看了开运文。',
    refuse: '不卖开运房，不把朝向写成开关。',
    keywords: ['搬家', '房子', '住', '风水', '朝向', '户型', '空间场'],
  },
  {
    id: 'naming',
    name: '起名',
    question: '这个名字要不要动？动了改的是什么？',
    domain: 'general',
    primaryLayer: 'structure',
    productSlug: 'naming',
    href: '/tools/naming',
    domainHref: '/world-yi/applications',
    solve: '名字是接口，不是第二粒种子。场景不变，改名只是换标签。',
    firstMove: '写下名字每天出现的三个场景。场景要变，再对接起名工坊。',
    today: '承认改名不改日主。',
    sevenDays: '列出证件、作品、品牌里这个名字的真实成本。',
    thirtyDays: '若仍要动，完成一次对照用神的正式出土，而不是再搜开运用字。',
    verify: '30 日内是否在真实场景换了署名，或明确决定不改。',
    refuse: '不承诺改名改命。',
    keywords: ['改名', '起名', '名字', '补用神', '改运'],
  },
  {
    id: 'timing',
    name: '择时',
    question: '哪一天办事才不算错季？',
    domain: 'general',
    primaryLayer: 'timing',
    productSlug: 'timing-selection',
    href: '/dimensions/timing-selection',
    domainHref: '/almanac',
    solve: '事先成熟，再选田候。通书是参考层。硬条件不齐，选日补不上。',
    firstMove: '先确认对方档期、资金、材料三件齐了，再在窗口里选一天并办掉。',
    today: '列出三件硬条件是否已齐。',
    sevenDays: '在可接受窗口里选定一天，选完就约。',
    thirtyDays: '事办完再复盘，不连翻通书。',
    verify: '30 日内事情是否办完，而不是仍在选日。',
    refuse: '不把某一天说成必成或必败。医疗以医嘱为先。',
    keywords: ['择日', '哪天', '吉日', '签约', '开工', '黄历'],
  },
];

const BY_ID = new Map(WORLD_YI_PROBLEM_DIMENSIONS.map((item) => [item.id, item]));

export function listWorldYiProblemDimensions(): WorldYiProblemDimension[] {
  return WORLD_YI_PROBLEM_DIMENSIONS.slice();
}

export function getWorldYiProblemDimension(id: string): WorldYiProblemDimension | null {
  return BY_ID.get(id as WorldYiProblemDimensionId) || null;
}

export function listWorldYiDimensionsForDomain(domain: WorldYiLogicDomain | 'all'): WorldYiProblemDimension[] {
  if (!domain || domain === 'all') return WORLD_YI_PROBLEM_DIMENSIONS.slice();
  return WORLD_YI_PROBLEM_DIMENSIONS.filter((item) => item.domain === domain);
}

export function dimensionForProductSlug(slug: string): WorldYiProblemDimension | null {
  return WORLD_YI_PROBLEM_DIMENSIONS.find((item) => item.productSlug === slug) || null;
}

function normalize(raw: string): string {
  return (raw || '').trim().toLowerCase().replace(/\s+/g, '');
}

export function scoreWorldYiDimension(dim: WorldYiProblemDimension, query: string): number {
  const q = normalize(query);
  if (!q) return 0;
  let score = 0;
  if (q.includes(dim.name) || dim.question.includes(query.trim())) score += 8;
  for (const word of dim.keywords) {
    const w = word.toLowerCase();
    if (q.includes(w) || w.includes(q)) score += 5;
  }
  return score;
}

export function matchWorldYiDimension(query: string): WorldYiProblemDimension | null {
  const ranked = WORLD_YI_PROBLEM_DIMENSIONS.map((dim) => ({
    dim,
    score: scoreWorldYiDimension(dim, query),
  }))
    .filter((row) => row.score >= 5)
    .sort((a, b) => b.score - a.score);
  return ranked[0]?.dim || null;
}

export type WorldYiSolve = {
  query: string;
  dimension: WorldYiProblemDimension;
  explanation: WorldYiExplanation;
  situationId: string | null;
  today: string;
  sevenDays: string;
  thirtyDays: string;
  verify: string;
  firstMove: string;
  href: string;
};

export function solveWorldYiProblem(query: string): WorldYiSolve {
  const q = (query || '').trim();
  const hits = q ? matchWorldYiSituations(q, 1) : [];
  const fromSituation = hits[0]?.situation;
  const dimension =
    (fromSituation ? listWorldYiDimensionsForDomain(fromSituation.domain)[0] : null) ||
    matchWorldYiDimension(q) ||
    BY_ID.get('rhythm')!;
  const explanation = q ? explainWorldYiQuery(q) : explainWorldYiQuery(dimension.question);
  const situationId = explanation.situation?.id || fromSituation?.id || null;
  return {
    query: q,
    dimension,
    explanation,
    situationId,
    today: dimension.today,
    sevenDays: explanation.action || dimension.sevenDays,
    thirtyDays: dimension.thirtyDays,
    verify: dimension.verify,
    firstMove: dimension.firstMove,
    href: dimension.href,
  };
}

export function formatWorldYiSolve(solve: WorldYiSolve): string {
  return [
    `纬度：${solve.dimension.name} · ${solve.dimension.question}`,
    formatWorldYiExplanation(solve.explanation),
    `今天：${solve.today}`,
    `7 天内：${solve.sevenDays}`,
    `30 天内：${solve.thirtyDays}`,
    `验证：${solve.verify}`,
    `拒绝：${solve.dimension.refuse}`,
  ].join('\n');
}

export function worldYiDimensionCoverage() {
  const domains = new Set(WORLD_YI_PROBLEM_DIMENSIONS.map((d) => d.domain));
  const situationDomains = new Set(listWorldYiSituations().map((s) => s.domain));
  return {
    dimensionCount: WORLD_YI_PROBLEM_DIMENSIONS.length,
    domains: [...domains],
    situationDomains: [...situationDomains],
  };
}
