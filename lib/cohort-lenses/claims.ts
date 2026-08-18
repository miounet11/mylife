import type { CohortClaimDef, CohortFacts, CohortLensId, CohortRegion } from './types';

function fill(template: string, facts: CohortFacts): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => {
    const value = (facts as unknown as Record<string, unknown>)[key];
    return typeof value === 'string' ? value : '';
  });
}

function claim(
  id: string,
  lensId: CohortLensId,
  text: string,
  checkPrompt: string,
  traitIfLike: string,
  traitIfUnlike: string,
  dimension: CohortClaimDef['dimension'],
  forks: CohortClaimDef['forks'],
): CohortClaimDef {
  return { id, lensId, text, checkPrompt, traitIfLike, traitIfUnlike, dimension, forks };
}

const BASE: Array<Omit<CohortClaimDef, 'text' | 'checkPrompt' | 'traitIfLike' | 'traitIfUnlike'> & {
  text: string;
  checkPrompt: string;
  traitIfLike: string;
  traitIfUnlike: string;
}> = [
  claim(
    'childhood.setting',
    'childhood',
    '我的童年底色更接近「{childhoodSetting}」，而不是更年轻一辈那种被算法和课程表精密安排的日常。',
    '你的童年是否更接近这种公共气氛，而不是完全私人化的屏幕童年？',
    '童年公共气氛与同代人重合度高',
    '童年环境与大陆同代默认叙事明显不同',
    'family',
    [
      { id: 'protected', label: '家庭保护更强、更晚接触外部世界', trait: '童年更封闭、家庭保护强' },
      { id: 'mobile', label: '城乡流动或频繁搬家，很早就自己闯', trait: '童年有明显流动/自立经历' },
      { id: 'other-system', label: '海外或另一套教育系统里长大', trait: '童年主要不在大陆公共叙事里' },
    ],
  ),
  claim(
    'childhood.media',
    'childhood',
    '我接收世界的方式，童年时更接近「{mediaDiet}」。',
    '你小时候的信息节奏，是不是更接近上面这句话，而不是短视频时间线？',
    '童年信息节奏与同代媒体环境一致',
    '童年信息环境与同代默认媒体不同',
    'self',
    [
      { id: 'books', label: '书和口语多于屏幕', trait: '童年信息以书本/口语为主' },
      { id: 'early-screen', label: '比同代更早进入个人屏幕', trait: '童年更早个人屏幕化' },
      { id: 'scarce', label: '信息其实更稀缺，家里没什么媒体', trait: '童年信息环境比同代更稀缺' },
    ],
  ),
  claim(
    'childhood.family',
    'childhood',
    '家庭形状对我的影响，更接近「{familyShape}」。',
    '你的家庭是否把期待、资源和责任按这种方式分配？',
    '家庭资源/期待结构与同代常见模式相近',
    '家庭结构与同代常见模式不同',
    'family',
    [
      { id: 'many-siblings', label: '兄弟姐妹多，资源是抢的', trait: '多子女、资源竞争型家庭' },
      { id: 'one-child-pressure', label: '几乎全家期待压在我一个人身上', trait: '独生/准独生高期待家庭' },
      { id: 'distant', label: '照顾者更换多，家庭并不稳定', trait: '童年照顾结构不稳定' },
    ],
  ),
  claim(
    'personality.values',
    'personality',
    '做选择时，我默认会把「{valueCore}」放得很靠前。',
    '你做人生决定时，是不是经常先过这一关？',
    '价值取向与同代默认剧本接近',
    '价值取向与同代默认剧本不同',
    'self',
    [
      { id: 'security', label: '我更先要安全，再谈意义', trait: '决策时安全优先于意义' },
      { id: 'meaning', label: '我更先要意义，安全可以后补', trait: '决策时意义优先于安全' },
      { id: 'optionality', label: '我最怕被一条路锁死', trait: '决策时保留选项权优先' },
    ],
  ),
  claim(
    'personality.vs-older',
    'personality',
    '和更早一辈比，我同意：我们{olderContrast}。',
    '跟父母或更早一辈比，这句话像不像你们的差别？',
    '与上一代的反差符合同代叙事',
    '与上一代的关系并不符合同代反差叙事',
    'family',
    [
      { id: 'closer', label: '其实我和上一代更像', trait: '与上一代连续性大于断裂' },
      { id: 'break', label: '断裂比这句话还要深', trait: '与上一代断裂比同代叙事更深' },
      { id: 'mixed', label: '价值接近，表达方式完全不同', trait: '与上一代价值近、表达远' },
    ],
  ),
  claim(
    'personality.vs-younger',
    'personality',
    '和更晚一辈比，我同意：我们{youngerContrast}。',
    '跟更年轻的同事或亲戚比，这个差别像你吗？',
    '与更年轻一辈的差别符合同代感受',
    '并不觉得自己和更年轻一辈有这种差别',
    'self',
    [
      { id: 'same', label: '其实我更像更年轻一辈', trait: '心态更接近更年轻一辈' },
      { id: 'bridge', label: '我两边都能翻译，但不属于任何一边', trait: '常做两代之间的翻译者' },
      { id: 'gap', label: '代沟比这句话更大，我经常听不懂他们', trait: '与更年轻一辈代沟很深' },
    ],
  ),
  claim(
    'career.entry',
    'career',
    '我进入社会时，职业现实更接近「{jobMarketEntry}」。',
    '你入场时的工作世界，是不是这个天气？',
    '入职场时的宏观天气与同代一致',
    '入职场路径与同代默认天气不同',
    'career',
    [
      { id: 'state', label: '我主要走体制/稳定编制', trait: '职业从稳定编制起步' },
      { id: 'market', label: '我主要走市场/创业/跳槽', trait: '职业从市场竞争起步' },
      { id: 'later', label: '我入场更晚或中途转轨', trait: '职业入场偏晚或中途转轨' },
    ],
  ),
  claim(
    'career.edge',
    'career',
    '我真正好用的优势，更像「{careerAdvantage}」。',
    '你工作里最能换钱、换信任的，是不是这个？',
    '职业优势与同代结构优势重合',
    '职业优势不在同代常见清单里',
    'career',
    [
      { id: 'craft', label: '我更靠手艺/专业深度', trait: '职业优势是专业深度' },
      { id: 'people', label: '我更靠关系和协调', trait: '职业优势是协调与关系' },
      { id: 'build', label: '我更靠把新东西做出来', trait: '职业优势是从0到1' },
    ],
  ),
  claim(
    'career.trap',
    'career',
    '我最容易踩的坑是：{careerTrap}。',
    '这条陷阱有没有在你身上出现过，或正在出现？',
    '认同同代常见职业陷阱',
    '职业卡点不是同代常见陷阱',
    'career',
    [
      { id: 'overstay', label: '我更容易待太久、走太晚', trait: '职业上容易过晚离开' },
      { id: 'overswitch', label: '我更容易换太勤、积不深', trait: '职业上容易切换过勤' },
      { id: 'title', label: '我更容易被头衔/平台绑住', trait: '职业身份过度绑定平台头衔' },
    ],
  ),
  claim(
    'relationship.script',
    'relationship',
    '认真关系里，我默认的脚本更接近「{relationshipNorm}」。',
    '你谈一段认真关系时，是不是常被这套脚本推着走？',
    '关系推进脚本与同代社会钟点相近',
    '关系脚本与同代社会期待不同',
    'relationship',
    [
      { id: 'slow', label: '我更慢、更观察，不按社会钟点', trait: '关系推进偏慢、观察优先' },
      { id: 'fast', label: '我更快进入承诺，也更容易耗尽', trait: '关系进入承诺快、耗尽也快' },
      { id: 'avoid', label: '我倾向先把关系强度降下来', trait: '关系上习惯降强度/保持距离' },
    ],
  ),
  claim(
    'relationship.attach',
    'relationship',
    '亲密关系里，我更常出现「{attachmentPull}」。',
    '亲密靠近时，你的第一反应像不像这句话？',
    '依恋倾向与同代常见模式相近',
    '依恋模式与同代描述不符',
    'relationship',
    [
      { id: 'anxious', label: '我更怕被放下，会追问和确认', trait: '关系里更偏焦虑确认' },
      { id: 'avoidant', label: '我更怕被吞掉，会先退开', trait: '关系里更偏回避后退' },
      { id: 'secure', label: '我能靠近也能独处，冲突后能修', trait: '关系里修复能力较强' },
    ],
  ),
  claim(
    'relationship.conflict',
    'relationship',
    '冲突来了，我更可能先讲道理或先退开，而不是先处理情绪。',
    '吵架或冷战时，你的第一动作是讲理、退开，还是先安抚情绪？',
    '冲突时习惯理性化或撤退',
    '冲突时并不回避情绪，能直接谈感受',
    'relationship',
    [
      { id: 'reason', label: '先讲道理和对错', trait: '冲突时先讲道理' },
      { id: 'withdraw', label: '先沉默或离开现场', trait: '冲突时先撤退' },
      { id: 'repair', label: '先承认情绪，再谈事情', trait: '冲突时能先修情绪再谈事' },
    ],
  ),
  claim(
    'money.formative',
    'money',
    '我对钱的第一层记忆，更接近「{moneyFormative}」。',
    '你对钱的早期印象，是不是被这类公共事件或家庭故事写过？',
    '金钱启蒙事件与同代宏观周期重合',
    '金钱观主要不是被同代公共事件塑造',
    'wealth',
    [
      { id: 'scarcity', label: '家里长期缺钱，我怕花', trait: '金钱观由短缺塑造' },
      { id: 'sudden', label: '家里有过暴涨或暴亏', trait: '金钱观由剧烈涨跌塑造' },
      { id: 'stable', label: '钱一直够用，很少讨论', trait: '金钱观由稳定够用塑造' },
    ],
  ),
  claim(
    'money.habit',
    'money',
    '我现在处理钱的默认动作是：{moneyHabit}。',
    '发薪、有闲钱或面对风险时，你是不是自动这么做？',
    '储蓄/风险习惯与同代默认接近',
    '花钱和承担风险的方式与同代不同',
    'wealth',
    [
      { id: 'save', label: '先存，再谈任何配置', trait: '金钱上先储蓄后配置' },
      { id: 'invest', label: '先找机会，现金留得少', trait: '金钱上偏机会、现金薄' },
      { id: 'experience', label: '先把生活过成我想要的样子', trait: '金钱上体验优先' },
    ],
  ),
  claim(
    'money.blind',
    'money',
    '我在钱上最容易看走眼的是：{moneyBlind}。',
    '回看过去三五年，这条盲点有没有让你付过学费？',
    '认同同代常见金钱盲点',
    '金钱上的坑不是同代常见那一条',
    'wealth',
    [
      { id: 'house', label: '房子/稳定资产占用了过多判断', trait: '财富判断过度绑定房产' },
      { id: 'cash', label: '现金安全感让我错过配置', trait: '过度现金化、配置不足' },
      { id: 'hype', label: '我容易被风口和叙事带走', trait: '金钱上易被叙事/风口带走' },
    ],
  ),
  claim(
    'blindspot.core',
    'blindspot',
    '我最不容易承认的盲点是：{blindspot}。',
    '这句话让你不舒服，还是「对，就是这个」？',
    '认同同代核心心理盲点',
    '核心消耗并不来自同代常见盲点',
    'self',
    [
      { id: 'over-function', label: '我过度负责，难以下放', trait: '过度负责、难以下放' },
      { id: 'under-commit', label: '我过度保留选项，难以下注', trait: '过度保留选项、难以下注' },
      { id: 'compare', label: '我过度比较，难以下自己的定义', trait: '自我评价过度依赖比较' },
    ],
  ),
  claim(
    'blindspot.daily',
    'blindspot',
    '它在日常里的样子是：{blindspotDaily}。',
    '过去两周，有没有出现过这种具体场面？',
    '盲点已在日常场面里出现',
    '日常卡点不是这种场面',
    'self',
    [
      { id: 'overwork', label: '用更忙来回避判断', trait: '用忙碌回避判断' },
      { id: 'scroll', label: '用信息流来回避判断', trait: '用信息流回避判断' },
      { id: 'argue', label: '用讲道理来回避感受', trait: '用讲道理回避感受' },
    ],
  ),
  claim(
    'blindspot.flip',
    'blindspot',
    '若要把这个盲点翻成优势，对我最有用的是：{blindspotFlip}。',
    '若只改一个习惯，这个动作对你是否可执行？',
    '认可把该盲点翻成可执行优势的路径',
    '需要另一套更贴我的翻法',
    'self',
    [
      { id: 'calendar', label: '写进日历的小实验，而不是立人设', trait: '用日历小实验替代立人设' },
      { id: 'partner', label: '找一个会对我复盘的人', trait: '需要外部复盘对象' },
      { id: 'constraint', label: '先加约束（截止日期/预算），再谈理想', trait: '先加约束再谈理想' },
    ],
  ),
  claim(
    'roadmap.coming-of-age',
    'roadmap',
    '真正改写我节奏的公共节点，更接近「{comingOfAgeEvent}」。',
    '回看自己的转折年，是不是这个公共天气？',
    '个人转折与同代公共节点重合',
    '个人主转折不是同代那一次公共事件',
    'self',
    [
      { id: 'family', label: '真正改写我的是家里的事', trait: '人生主转折来自家庭事件' },
      { id: 'health', label: '真正改写我的是身体/精力', trait: '人生主转折来自身体节奏' },
      { id: 'work', label: '真正改写我的是一次职业断裂', trait: '人生主转折来自职业断裂' },
    ],
  ),
  claim(
    'roadmap.now-priority',
    'roadmap',
    '以我现在的年龄，最该先排顺序的是家庭、现金和职业，而不是再开一条新战线。',
    '你现在是不是已经处在「必须排序」而不是「必须扩张」的阶段？',
    '当前阶段认同先排序再扩张',
    '当前阶段仍应主攻扩张而不是排序',
    'career',
    [
      { id: 'expand', label: '我还在立足/扩张期', trait: '当前阶段仍以扩张为主' },
      { id: 'sort', label: '我必须先排家庭/现金/职业', trait: '当前阶段必须先排序约束' },
      { id: 'hand-off', label: '我更该做交接和减负', trait: '当前阶段以交接减负为主' },
    ],
  ),
  claim(
    'roadmap.next-decision',
    'roadmap',
    '未来 12 个月，我最该做的是一个带日期的决定，而不是再收集一套新理论。',
    '你是不是已经知道那个决定，只是还没写下日期？',
    '认同下一步是带日期的决定',
    '下一步仍是信息收集，不是拍板',
    'self',
    [
      { id: 'info', label: '我还缺关键信息，不能拍板', trait: '下一步仍是补信息' },
      { id: 'date', label: '我缺的是截止日期和退出条件', trait: '下一步缺截止日期/退出条件' },
      { id: 'help', label: '我缺的是一个能对质我的人', trait: '下一步缺对质/复盘对象' },
    ],
  ),
];

const SIGNATURE: Partial<Record<string, CohortClaimDef[]>> = {
  'cn-80-84': [
    claim(
      'childhood.only-child-bet',
      'childhood',
      '家里几乎把一代人的上升希望压在我身上，我很早就知道「不能普通」。',
      '你是否从小就感到自己是家里的唯一赌注？',
      '童年被当作家庭唯一上升通道',
      '童年并没有「全家赌注」的压力',
      'family',
      [
        { id: 'shared', label: '期待是分散的，不是只压我', trait: '家庭期待相对分散' },
        { id: 'neglect', label: '其实我更缺关注，而不是关注过多', trait: '童年更缺关注而非过载期待' },
      ],
    ),
  ],
  'cn-90-94': [
    claim(
      'career.platform-title',
      'career',
      '我一度把大厂/平台职级当成自己的能力证明，平台一变就发虚。',
      '你有没有过「离开平台头衔就不知道自己是谁」的时刻？',
      '职业身份曾过度绑定平台职级',
      '职业身份并不依赖平台头衔',
      'career',
      [
        { id: 'craft-id', label: '我的身份一直在手艺上', trait: '职业身份主要绑在手艺' },
        { id: 'never-platform', label: '我几乎没进入过平台叙事', trait: '职业路径在平台叙事之外' },
      ],
    ),
  ],
  'cn-95-99': [
    claim(
      'childhood.pandemic-cut',
      'childhood',
      '疫情打断过我的大学或第一份工作，节奏从此和「按年规划」对不上。',
      '疫情是否明显改写过你的求学或初职节奏？',
      '疫情是个人节奏的断裂点',
      '疫情并未成为个人主断裂点',
      'self',
      [
        { id: 'other-break', label: '真正打断我的是别的事', trait: '个人主断裂点不是疫情' },
        { id: 'continuous', label: '我的节奏其实一直连续', trait: '求学/初职节奏相对连续' },
      ],
    ),
  ],
};

function applyRegion(claimDef: CohortClaimDef, region: CohortRegion): CohortClaimDef {
  if (region === 'cn-mainland') return claimDef;
  if (claimDef.id === 'childhood.setting' && region === 'greater-china') {
    return {
      ...claimDef,
      text: '我的童年更接近港澳台/新加坡的城市公共生活，而不是大陆单位、高考和独生子女的默认叙事。',
      traitIfLike: '童年主要在港澳台/新加坡公共语境',
    };
  }
  if (claimDef.id === 'childhood.setting' && region === 'overseas') {
    return {
      ...claimDef,
      text: '我的童年有明显的跨文化或移民背景，和大陆同代人的学校/媒体记忆对不上号。',
      traitIfLike: '童年有跨文化或移民背景',
    };
  }
  if (claimDef.id === 'money.formative' && region === 'overseas') {
    return {
      ...claimDef,
      text: '我对钱的第一层记忆，更多来自移民家庭的汇率、学费和「先站稳再谈理想」，而不是大陆房价叙事。',
      traitIfLike: '金钱观由移民/跨境成本塑造',
    };
  }
  return claimDef;
}

export function buildCohortClaims(facts: CohortFacts, region: CohortRegion): CohortClaimDef[] {
  const filled = BASE.map((item) =>
    applyRegion(
      {
        ...item,
        text: fill(item.text, facts),
        checkPrompt: fill(item.checkPrompt, facts),
        traitIfLike: fill(item.traitIfLike, facts),
        traitIfUnlike: fill(item.traitIfUnlike, facts),
      },
      region,
    ),
  );
  const extra = (SIGNATURE[facts.key] || []).map((item) => applyRegion(item, region));
  return [...filled, ...extra];
}

export function claimsForLens(claims: CohortClaimDef[], lensId: CohortLensId): CohortClaimDef[] {
  return claims.filter((item) => item.lensId === lensId);
}
