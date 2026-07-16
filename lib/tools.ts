import type { FortuneRecord, PremiumServiceRequestRecord, ToolSessionRecord as BaseToolSessionRecord } from '@/lib/user-types';
import { isPremiumServiceKey } from '@/lib/report-premium-services';
import {
  worldYiApplicationSurface,
  worldYiDomainSurfaces,
  type WorldYiDomainKey,
} from '@/lib/world-yi-surfaces';
import { summarizeToolSessions } from '@/lib/tool-context';
import { buildEngineToolRunSummary } from '@/lib/tool-run-summary';

export type ToolCategoryKey =
  | WorldYiDomainKey
  | 'timing'
  | 'application';

export interface ToolCategoryDefinition {
  key: ToolCategoryKey;
  title: string;
  description: string;
  headline: string;
}

export interface ToolDefinition {
  slug: string;
  title: string;
  shortTitle: string;
  category: ToolCategoryKey;
  themeKey: string;
  themeLabel: string;
  description: string;
  userIntent: string;
  promptHint: string;
  targetUser: string;
  valuePromise: string;
  hook: string;
  triggerMoment: string;
  wrongQuestion: string;
  rightQuestion: string;
  freeValueLine: string;
  paidValueLine: string;
  hookKeywords: string[];
  freeOutputFields: string[];
  premiumOutputFields: string[];
  freeInsights: string[];
  premiumModules: string[];
  relatedKnowledgeSlugs: string[];
  relatedCaseSlugs: string[];
  relatedReportThemes: string[];
  chatIntent?: 'event-simulation' | 'event-verdict' | 'event-review' | 'meihua-enhancement' | 'palmistry-reading' | 'home-layout-diagnosis';
  premiumServiceKey?: PremiumServiceRequestRecord['serviceKey'];
  nextToolSlugs: string[];
  caseStories: ToolCaseStory[];
  premiumOutcomes: string[];
  objectionAnswers: ToolObjectionAnswer[];
  faqItems: ToolFaqItem[];
  featuredBadge?: string;
  signaturePromise?: string;
  decisionLens?: string;
  premiumWhyNow?: string;
}

export interface ToolCaseStory {
  title: string;
  persona: string;
  scenario: string;
  action: string;
  outcome: string;
  payoff: string;
}

export interface ToolObjectionAnswer {
  objection: string;
  answer: string;
}

export interface ToolFaqItem {
  question: string;
  answer: string;
}

export interface ToolRunSummary {
  headline: string;
  summary: string;
  confidenceLabel: string;
  recommendedAction: string;
  riskReminder: string;
  whyItMatches: string;
  evidence: string[];
  premiumPreview: string[];
}

export interface ToolPremiumOffer {
  title: string;
  teaser: string;
  upgradeMoment: string;
  outcomeLine: string;
  deliverables: string[];
  ctaLabel: string;
  subscribeTags: string[];
}

export interface ToolBundleDefinition {
  slug: string;
  title: string;
  description: string;
  toolSlugs: string[];
  valueHeadline: string;
  recommendedFor: string;
}

export interface ToolGrowthProfile {
  slug: string;
  stageLabel: string;
  seoTitle: string;
  seoDescription: string;
  heroEyebrow: string;
  heroSubtitle: string;
  primaryCtaLabel: string;
  secondaryCtaLabel: string;
  freeValueBullets: string[];
  upgradeBullets: string[];
  geoQuestions: string[];
  socialHooks: string[];
  keywords: string[];
}

export type ToolSessionRecord = BaseToolSessionRecord<ToolRunSummary>;

export interface ToolRecommendation {
  slug: string;
  reason: string;
  source: 'report' | 'history' | 'category' | 'default';
}

type ToolThemeTuple = [
  string,
  string,
  string,
  string,
  string,
  string,
  string[],
  ToolDefinition['chatIntent']?,
  string?,
  string?,
  string?,
  string?,
  string?,
  string?,
  string[]?,
  string[]?,
  string[]?,
];

const categoryDefinitions: ToolCategoryDefinition[] = [
  {
    key: 'career',
    title: '事业工具',
    description: '围绕岗位、角色、推进和组织压力拆成高频单项判断。',
    headline: '把职业焦虑拆成具体判断，而不是一句“适不适合”。',
  },
  {
    key: 'wealth',
    title: '财富工具',
    description: '围绕赚钱方式、保留能力、扩张时机和风险识别做细分工具。',
    headline: '财富不是一个分数，而是一连串可验证的选择。',
  },
  {
    key: 'relationship',
    title: '关系工具',
    description: '围绕推进、边界、复合、结婚和关系消耗做主题切片。',
    headline: '关系问题先拆节奏、边界和环境，再谈结果。',
  },
  {
    key: 'health',
    title: '健康工具',
    description: '围绕恢复秩序、透支预警和压力窗口做持续跟踪。',
    headline: '健康判断的重点是恢复秩序，而不是临时安慰。',
  },
  {
    key: 'family',
    title: '家庭工具',
    description: '围绕责任排序、代际压力、家庭恢复和照护结构做专题工具。',
    headline: '家庭问题最怕没人先把顺序排出来。',
  },
  {
    key: 'migration',
    title: '迁移工具',
    description: '围绕留回、换城、出国、身份成本和环境适配做判断。',
    headline: '迁移不是地图题，而是阶段与环境匹配题。',
  },
  {
    key: 'timing',
    title: '阶段窗口工具',
    description: '围绕年运、月运、推进窗口、风险节点和恢复窗口做阶段测算。',
    headline: '先看窗口与节奏，再决定要不要推进。',
  },
  {
    key: 'application',
    title: '生活应用工具',
    description: '围绕择时、家宅、起名、寻物和短周期决策建立高频入口。',
    headline: '高频问题更需要被产品化，而不是散落成技巧。',
  },
];

const categoryLaunchLimits: Record<ToolCategoryKey, number> = {
  career: 20,
  wealth: 20,
  relationship: 20,
  health: 15,
  family: 15,
  migration: 15,
  timing: 8,
  application: 8,
};

const categoryThemeMap: Record<ToolCategoryKey, Array<{
  key: string;
  label: string;
  description: string;
  userIntent: string;
  targetUser: string;
  promptHint: string;
  valuePromise: string;
  relatedReportThemes: string[];
  hook: string;
  triggerMoment: string;
  wrongQuestion: string;
  rightQuestion: string;
  freeValueLine: string;
  paidValueLine: string;
  hookKeywords: string[];
  freeInsights: string[];
  premiumModules: string[];
  chatIntent?: ToolDefinition['chatIntent'];
  premiumServiceKey?: ToolDefinition['premiumServiceKey'];
}>> = {
  career: [
    ['role-fit', '岗位匹配', '当前岗位和真实结构是否匹配', '想确认自己适不适合继续留在当前角色的人', '我现在的岗位/角色到底适不适合长期做下去？', '识别适配点、消耗点和推进方式', ['事业', '角色', '组织'], 'event-verdict', '你不是不努力，你可能只是站错了岗位。', '每天上班都像顶着一块石头，但又说不清到底是不喜欢还是不适合。', '我适不适合这份工作？', '这份岗位到底是阶段不对，还是结构不匹配？', '免费先给你岗位适配摘要、当前风险点和一个立即动作。', '付费深测会拆岗位结构、窗口、风险线和下一步职业路径。', ['岗位', '适配', '工作卡住'], ['当前适配度判断', '最容易耗损的位置', '短期该继续还是先稳住'], ['完整角色画像', '未来 3-6 个月窗口', '最优转向建议']],
    ['promotion-window', '升职窗口', '什么时候更适合争取升级', '在组织内准备争取升级机会的人', '我现在适合争取升职/加责任吗？', '看当前窗口、组织压力和推进节奏', ['事业', '窗口', '推进'], 'event-simulation', '不是你永远升不上去，而是你可能总在错的窗口硬冲。', '机会就在眼前，但你拿不准现在是该主动争，还是先铺垫。', '我会不会升职？', '我现在争取升级，是顺势还是送人头？', '免费先告诉你当前窗口偏推进还是偏保守。', '付费深测会拆最优争取时点、组织阻力和试探路径。', ['升职', '加责任', '窗口'], ['当前窗口强弱', '组织阻力提醒', '一条最小试探动作'], ['升职时间线', '组织博弈点', '失败后的替代路线']],
    ['job-switch', '转岗判断', '该不该换岗或转方向', '在原岗卡住、考虑转岗的人', '我现在该继续当前方向，还是切换岗位？', '明确继续、切换或观望的条件', ['事业', '切换', '阶段'], 'event-verdict', '有些卡住不是你不行，而是你已经不该再在这条路上硬耗。', '你已经开始反复想离开，但又怕自己只是情绪化。', '我要不要辞职？', '我现在更适合留、转岗，还是先观望？', '免费先给你“留/转/稳住”倾向和核心依据。', '付费深测会拆切换成本、时机和最短转向路径。', ['转岗', '换方向', '职业切换'], ['当前倾向判断', '最关键的切换条件', '现在最该先验证什么'], ['切换成本清单', '最佳动作顺序', '错误切换预警']],
    ['entrepreneurship', '创业时机', '当前是否适合单干或创业', '想尝试创业、自由职业或副业扩张的人', '我当前适合创业、合伙或先稳住主业吗？', '区分冲动试错和可控扩张', ['事业', '财富', '风险'], 'event-simulation', '创业不是勇敢不勇敢的问题，而是你现在扛不扛得住。', '你对单干和创业越来越心动，但也感觉风险正在变大。', '我适合创业吗？', '我现在创业是顺势起盘，还是过早加码？', '免费先告诉你当前更像试探窗口还是高风险期。', '付费深测会拆资金、节奏、合伙和启动窗口。', ['创业', '单干', '副业放大'], ['当前创业倾向', '最危险的冲动点', '先试哪一步'], ['启动窗口表', '合伙/单干比较', '资金与节奏预案']],
    ['partnership-fit', '合作适配', '合作方是否值得推进', '正在评估合伙、合作或商务项目的人', '这次合作能推进吗，还是风险更大？', '看合作节奏、风险和前置条件', ['事业', '合作', '风险'], 'event-verdict', '很多合作不是看能不能做，而是看值不值得跟这个人做。', '你眼前有合作机会，但总觉得哪里不踏实。', '这次合作能成吗？', '这次合作现在该推进，还是先立条件？', '免费先给你合作倾向和核心风险。', '付费深测会拆合作结构、边界、分钱和退出点。', ['合作', '合伙', '商务'], ['合作倾向判断', '最大风险点', '先谈什么再决定'], ['合作边界清单', '分工与分钱预警', '退出条件设计']],
    ['boss-relationship', '上级关系', '如何处理老板/上级压力', '觉得自己总被上级压制或误解的人', '我和现在的上级关系到底怎么处理更稳？', '看角色冲突和应对策略', ['事业', '关系', '执行'], 'event-review', '你卡的不一定是能力，可能是和上级的接口完全错位。', '你明明做了很多，但和上级总是对不上、被压着走。', '我老板为什么总针对我？', '我和这位上级到底是节奏不合，还是结构相克？', '免费先指出主要冲突模式和应对方向。', '付费深测会拆沟通接口、边界和可用打法。', ['老板', '上级', '压制'], ['主要冲突模式', '短期止损建议', '下一次沟通先改什么'], ['上级关系策略图', '高风险触发点', '继续留下还是另寻路径']],
    ['team-conflict', '团队冲突', '团队磨合问题该怎么拆', '反复遇到团队卡点和协同冲突的人', '团队合作为什么总在这个点上出问题？', '把冲突拆成节奏、边界和责任问题', ['事业', '团队', '边界'], 'event-review', '团队问题最怕的不是吵，而是谁都没把真正的问题说出来。', '你发现自己换了团队也会遇到类似冲突。', '我们团队为什么总是配合不好？', '这次团队冲突到底卡在节奏、边界还是责任？', '免费先给你冲突归因和最该先修的一点。', '付费深测会拆角色错位、责任链和修复顺序。', ['团队', '协作', '冲突'], ['冲突主因', '最小修复动作', '近期避免踩的坑'], ['角色错位拆解', '责任链重排', '修复路线图']],
    ['interview-readiness', '面试胜率', '当前去面试是否容易有结果', '正在找工作、准备跳槽的人', '这段时间去面试和谈机会，胜率高不高？', '看表达窗口、资源匹配和推进节奏', ['事业', '窗口', '表达'], 'event-simulation', '不是所有时间去面试，命中率都一样。', '你已经开始投递或准备面试，但不确定现在是不是好时机。', '我最近面试运怎么样？', '我现在去面试，是高命中窗口还是白忙一场？', '免费先看近期命中率倾向和表达风险。', '付费深测会拆面试窗口、发力顺序和 offer 转化点。', ['面试', '求职', '跳槽'], ['近期胜率倾向', '最该避开的表达坑', '下一步投递建议'], ['面试窗口日历', '岗位匹配优先级', '转化率提升动作']],
    ['offer-choice', 'Offer 对比', '多个机会之间如何选', '拿到两个以上机会、难以取舍的人', 'A 和 B 哪个更适合我当前阶段？', '把选择拆成阶段、环境和成本', ['事业', '迁移', '财富'], 'event-verdict', '真正难的不是拿不到 offer，而是拿到了以后选错。', '你手上已经有两个以上机会，但每个都有明显代价。', '两个 offer 哪个更好？', '这两个机会，哪个更适合我当前阶段和代价结构？', '免费先给你阶段匹配倾向和主要取舍轴。', '付费深测会拆环境成本、成长性和错选代价。', ['offer', '跳槽选择', '机会对比'], ['当前阶段更匹配哪类机会', '最核心取舍轴', '一个先验证动作'], ['A/B 结构对比表', '环境与代价清单', '错选风险预警']],
    ['burnout-risk', '职业透支', '职业倦怠和透支风险', '已经疲惫、怀疑自己但又不敢停的人', '我现在是该硬撑，还是必须先恢复？', '识别透支型卡顿和恢复优先级', ['事业', '健康', '恢复'], 'event-review', '你不是懒，你可能已经透支到再硬扛只会更差。', '最近你做什么都慢半拍，情绪和身体都开始报警。', '我是不是太脆弱了？', '我现在的低能量是阶段波动，还是透支红线？', '免费先给你透支预警和减负方向。', '付费深测会拆恢复次序、工作调整和风险窗口。', ['透支', '倦怠', '恢复'], ['当前透支等级', '最该先减掉什么', '近期风险提醒'], ['恢复路线图', '工作调整建议', '高风险窗口表']],
    ['leadership-style', '带队方式', '适不适合带人和管理', '正在变成管理者或带小团队的人', '我适合怎样带人，哪些管理方式最容易失误？', '识别管理优势和常见踩坑点', ['事业', '团队', '权责'], 'event-verdict', '不是所有优秀执行者都会自动变成好管理者。', '你开始带人，但感觉管得越多问题越多。', '我适合当管理吗？', '我更适合什么管理方式，最容易在哪踩坑？', '免费先给你管理风格倾向和高风险误区。', '付费深测会拆带队方式、权责边界和团队搭配。', ['带队', '管理', '领导'], ['管理风格倾向', '最该避免的误区', '当前带队先改什么'], ['团队搭配建议', '管理边界策略', '权责升级节奏']],
    ['execution-rhythm', '执行节奏', '推进速度是否匹配当前阶段', '常在推进节奏上失衡的人', '我现在推进太快还是太慢？', '把推进节奏拉回可执行区间', ['事业', '阶段', '动作'], 'event-review', '很多失败不是方向错，而是节奏错。', '你明明知道该做什么，但总在快慢失衡里翻车。', '为什么我总是推进不好？', '我现在的问题是推太快、太散，还是太慢、太拖？', '免费先判断当前节奏类型和一个纠偏动作。', '付费深测会拆执行序列、阶段推进表和停顿点。', ['执行', '节奏', '推进'], ['当前节奏类型', '最小纠偏动作', '近期别再犯的错误'], ['执行序列表', '推进节奏图', '停顿与加速节点']],
    ['career-reset', '事业重启', '职业停滞后如何重启', '职业中断、休整或想重新开始的人', '我现在怎么重启事业更稳？', '看重启顺序和最短路径', ['事业', '恢复', '阶段'], 'event-simulation', '事业重启最怕的不是慢，而是一上来就选错恢复顺序。', '你已经停下来或被迫中断，现在不知道第一步该从哪走。', '我怎么重新开始？', '我现在事业重启，最稳的第一步到底是什么？', '免费先给你重启主顺序和风险提醒。', '付费深测会拆 30/60/90 天重启路径和窗口。', ['重启', '事业中断', '重新开始'], ['当前重启优先级', '最危险的急躁点', '先做哪一步'], ['30/60/90 天路径', '窗口与试错顺序', '重启失败预警']],
    ['visibility', '被看见能力', '为什么努力但总不被看见', '输出很多但回报感低的人', '为什么我明明做了很多却总不被看见？', '识别表达接口和价值呈现问题', ['事业', '表达', '结构'], 'event-review', '有些人卡的不是实力，而是“别人根本没看到你真正的价值”。', '你感觉自己一直在付出，但总轮不到你被选中。', '为什么我总是不被看见？', '我被忽略是时机问题，还是表达接口完全错位？', '免费先指出最可能的遮蔽点。', '付费深测会拆表达接口、曝光策略和组织内路径。', ['被看见', '表达', '价值感'], ['当前遮蔽点', '最该先调整的接口', '近期提高可见度的动作'], ['曝光路径设计', '组织内影响力打法', '错位修正方案']],
    ['decision-authority', '决策权限', '当前是否适合拿更多决策权', '面对新责任、怕背锅的人', '我该不该主动拿更多决策权？', '看权限、代价和承担能力', ['事业', '权责', '风险'], 'event-verdict', '拿决策权不是越多越好，而是看你现在接不接得住。', '你眼前出现更大权限，但也伴随着更大风险。', '我要不要争取更大权限？', '我现在拿更多决策权，是机会还是雷？', '免费先给你当前承接度和风险判断。', '付费深测会拆权责边界、代价和最优争取方式。', ['权限', '责任', '背锅'], ['当前承接度', '最该防的风险', '先争取哪一块'], ['权责边界图', '组织博弈建议', '代价与收益评估']],
    ['industry-switch', '赛道切换', '换行业是否合适', '考虑跨行业转换的人', '我现在换赛道会不会比继续死磕更好？', '看切换成本和阶段匹配', ['事业', '迁移', '成本'], 'event-verdict', '行业切换不是勇不勇的问题，而是你现在换得值不值。', '你开始怀疑自己不是不行，而是赛道本身就不适合。', '我要不要换行业？', '我现在换赛道，是升级还是高成本折返？', '免费先给你切换倾向和主要成本。', '付费深测会拆过渡路径、窗口和错换代价。', ['换行业', '赛道', '职业方向'], ['当前切换倾向', '最大成本点', '先试哪条过渡路径'], ['行业切换路线图', '阶段窗口表', '错换风险清单']],
    ['communication-style', '职场表达', '表达方式哪里最影响结果', '总感觉自己讲不明白或容易误伤的人', '我在职场表达上最该调整什么？', '看表达接口和沟通误差', ['事业', '关系', '表达'], 'event-review', '表达问题最怕的不是不会说，而是总在关键处说偏。', '你常常觉得自己讲了很多，但结果不是被误解，就是没有效果。', '我是不是不会表达？', '我现在表达上最伤结果的到底是哪一环？', '免费先指出当前表达误差。', '付费深测会拆沟通接口、用词方向和对人策略。', ['表达', '沟通', '误解'], ['当前表达误差', '最该先改的一点', '下一次沟通避坑'], ['沟通策略图', '不同对象表达建议', '误伤高发点']],
    ['network-leverage', '人脉利用', '当前是否适合借力他人资源', '想找贵人、合作或推荐的人', '这段时间适合多找人、借资源推进吗？', '判断借力窗口和分寸', ['事业', '关系', '机会'], 'event-simulation', '借力不是求人，而是看你现在有没有到该借的时候。', '你开始想找人帮忙、借资源、做连接，但怕太早或太冒进。', '我最近有没有贵人运？', '我现在适不适合主动借人和借资源？', '免费先给你借力窗口和边界提醒。', '付费深测会拆连接顺序、谁值得找和怎么开口。', ['人脉', '资源', '推荐'], ['当前借力窗口', '先找哪类人', '最该守住的边界'], ['连接路径图', '资源优先级', '开口与推进脚本']],
    ['salary-negotiation', '谈薪窗口', '什么时候谈薪更有利', '准备谈薪、涨薪或重新定价的人', '我现在谈薪有胜算吗？', '看时机、筹码和沟通路径', ['财富', '事业', '窗口'], 'event-simulation', '谈薪成不成，很多时候不是看你值不值，而是看你会不会挑时间。', '你想涨薪，但拿不准现在谈会不会太早、太冒险。', '我该不该去谈涨薪？', '我现在谈薪，是顺势放大还是时机不对？', '免费先给你当前谈薪窗口判断。', '付费深测会拆筹码、谈法和失败后替代动作。', ['谈薪', '涨薪', '薪资'], ['当前窗口判断', '最强筹码提醒', '先试哪一步'], ['谈薪策略表', '筹码清单', '失败后替代动作']],
    ['career-rebuild', '事业修复', '连续失利后如何修复判断', '刚经历失利、拒绝、裁员的人', '最近连续失利后，我应该怎么修复节奏？', '把修复期与推进期区分开', ['事业', '恢复', '复盘'], 'event-review', '连续失利后最怕的不是输，而是急着证明自己没输。', '你最近可能接连受挫，判断力也开始变形。', '我是不是已经不行了？', '我现在更需要修复判断，还是继续推进？', '免费先给你修复优先级和一条止损动作。', '付费深测会拆修复周期、复盘重点和重新发力窗口。', ['失利', '裁员', '修复'], ['修复优先级', '止损动作', '当前最不该做什么'], ['修复周期图', '复盘重点', '重启窗口建议']],
  ].map((tuple) => buildThemeTuple('career', tuple)),
  wealth: [
    ['income-channel', '赚钱方式', '更适合哪类赚钱入口', '想看自己更适合主动赚还是稳步积累的人', '我更适合通过什么方式赚钱？', '识别主收入模型和副收入边界', ['财富', '结构', '事业'], 'event-verdict'],
    ['cashflow-pressure', '现金流压力', '当前现金流风险是否偏高', '最近现金流紧绷、压力大的用户', '我现在最大的财务压力点在哪里？', '看现金流薄弱点和先修哪里', ['财富', '风险', '阶段'], 'event-review'],
    ['saving-capacity', '存钱能力', '为什么总留不住钱', '收入不差但结余很低的人', '为什么我赚钱不算少，却总存不下来？', '识别财富泄漏点和保留纪律', ['财富', '习惯', '结构'], 'event-review'],
    ['expansion-window', '扩张窗口', '是否适合扩大投入', '正在考虑加杠杆、扩业务、扩投入的人', '我现在适合扩大投入还是先收缩？', '判断扩张节奏和踩刹车条件', ['财富', '风险', '窗口'], 'event-simulation'],
    ['investment-risk', '投资承受度', '当前适不适合投资冒险', '面对投资机会但担心风险的人', '我当前阶段适合做风险更高的投资吗？', '把投资冲动拉回承受度判断', ['财富', '风险', '阶段'], 'event-verdict'],
    ['price-sensitivity', '定价能力', '自己的价值定价是否偏低', '自由职业者、顾问、创作者、创业者', '我的定价是不是一直偏低？', '识别价值表达和议价空间', ['财富', '事业', '表达'], 'event-review'],
    ['side-hustle', '副业节奏', '副业该不该继续做大', '有副业、第二曲线或兼职的人', '我现在适合把副业做大吗？', '判断副业扩张边界', ['财富', '事业', '窗口'], 'event-simulation'],
    ['debt-pressure', '债务压力', '债务是否正在放大风险', '负债、分期、周转压力较大的人', '我的债务风险是不是已经在放大？', '识别风险边界和减压次序', ['财富', '风险', '恢复'], 'event-review'],
    ['partner-money', '合作分钱', '合作中分配是否容易失衡', '合伙做事、合作项目的人', '这次合作里钱和责任会不会失衡？', '把分钱问题和责任结构一起看', ['财富', '合作', '风险'], 'event-verdict'],
    ['consumption-discipline', '消费纪律', '哪些场景最容易冲动花钱', '消费失控、情绪型消费用户', '我最容易在哪些情况下乱花钱？', '识别消费触发器和节制动作', ['财富', '健康', '情绪'], 'event-review'],
    ['asset-accumulation', '资产积累', '当前阶段积累方向是否对路', '想长期做资产配置的人', '我现在应该优先积累哪类资产？', '聚焦先搭框架，再谈规模', ['财富', '阶段', '长期'], 'event-verdict'],
    ['family-finance', '家庭财务', '家庭账本怎么排顺序', '家庭收支压力和责任分配混乱的人', '家庭财务现在最该先理顺什么？', '把家庭责任和资金顺序排清', ['财富', '家庭', '责任'], 'event-review'],
    ['windfall-control', '偏财风险', '偏财/意外收益怎么处理', '遇到一次性机会、奖金或意外收入的人', '这笔偏财我该冲一把还是先守住？', '避免一次收益反而打乱长期秩序', ['财富', '风险', '纪律'], 'event-verdict'],
    ['business-model', '生意模型', '当前赚钱模式是否稳固', '做生意、做项目、靠市场吃饭的人', '我现在的赚钱模式是不是太脆弱？', '看模式稳定性和最薄弱环节', ['财富', '事业', '结构'], 'event-review'],
    ['resource-allocation', '资源配置', '钱该优先投到哪里', '资源有限、决策压力大的人', '我现在最值得投入的钱应该花在哪？', '给出投入优先级顺序', ['财富', '阶段', '动作'], 'event-verdict'],
    ['travel-spending', '迁移成本', '搬家/留学/出国的财务压力', '面临大额迁移支出的人', '这次迁移或换城的财务压力值不值得承受？', '看成本、回报和阶段匹配', ['迁移', '财富', '阶段'], 'event-simulation'],
    ['income-stability', '收入稳定性', '收入波动是否过高', '收入不稳定、接单型或业绩型用户', '我的收入结构是不是太不稳定？', '识别稳定锚点和缓冲策略', ['财富', '风险', '恢复'], 'event-review'],
    ['negotiation-balance', '谈判收益', '谈判时是否容易让利过多', '总是先妥协、后后悔的人', '我在谈判里是不是总吃亏？', '判断自己的谈判下限和失误点', ['财富', '关系', '表达'], 'event-review'],
    ['wealth-repair', '财富修复', '亏损或失误后怎么修复', '经历过亏损、被骗、重大错配的人', '前面的财务失误之后，我该怎么修复？', '先修纪律，再修规模', ['财富', '复盘', '恢复'], 'event-review'],
    ['money-timing', '进账窗口', '近期更容易进账还是承压', '想看短中期收入波动的人', '我最近是更容易进账还是更容易失血？', '给出近期窗口和风险提示', ['财富', '窗口', '阶段'], 'event-simulation'],
  ].map((tuple) => buildThemeTuple('wealth', tuple)),
  relationship: [
    ['pace-fit', '推进节奏', '这段关系该推进、观察还是收手', '处在暧昧、推进、磨合期的人', '这段关系现在该推进、观望还是收手？', '给出关系节奏建议', ['关系', '阶段', '动作'], 'event-verdict'],
    ['boundary-conflict', '边界冲突', '关系中哪里最容易失衡', '反复出现争吵、压迫或消耗的人', '这段关系里最核心的边界问题是什么？', '识别消耗点和止损线', ['关系', '边界', '家庭'], 'event-review'],
    ['reconciliation', '复合倾向', '是否适合尝试复合', '分手后犹豫要不要回头的人', '这段关系还有没有复合空间？', '判断复合条件而非情绪冲动', ['关系', '阶段', '风险'], 'event-verdict'],
    ['marriage-window', '结婚节奏', '什么时候更适合谈婚论嫁', '关系稳定但卡在承诺节点的人', '我们现在适合进入婚姻阶段吗？', '看阶段成熟度和现实承载', ['关系', '家庭', '迁移'], 'event-simulation'],
    ['partner-fit', '伴侣匹配', '对象是否适合长期走下去', '正在认真评估长期关系的人', '这个人适合长期走下去吗？', '从边界、环境和长期成本判断', ['关系', '家庭', '长期'], 'event-verdict'],
    ['conflict-repair', '冲突修复', '争吵后如何修复更有效', '每次争吵都越吵越远的人', '为什么我们越沟通越糟？', '拆出冲突结构和修复动作', ['关系', '沟通', '复盘'], 'event-review'],
    ['long-distance', '异地关系', '异地是否有推进空间', '异地、跨城、跨国关系中的用户', '异地关系现在还有推进空间吗？', '把距离成本与情感节奏一起看', ['关系', '迁移', '成本'], 'event-simulation'],
    ['family-pressure', '家人阻力', '家庭因素会不会压垮关系', '关系中受到父母/家庭影响的人', '家庭阻力会不会让这段关系走不下去？', '看外部压力和关系承载度', ['关系', '家庭', '压力'], 'event-verdict'],
    ['dating-readiness', '进入新关系', '现在是否适合开始新关系', '想开始认识新对象但状态不稳的人', '我现在适合进入一段新的关系吗？', '先看恢复和开放度，再看机会', ['关系', '健康', '阶段'], 'event-simulation'],
    ['attraction-pattern', '吸引模式', '为什么总被同类人吸引', '反复进入同类型关系的人', '为什么我总是遇到类似的问题关系？', '识别重复模式和纠偏点', ['关系', '复盘', '结构'], 'event-review'],
    ['commitment-anxiety', '承诺焦虑', '为什么一到承诺就卡住', '进入确定关系时容易退缩的人', '我为什么一到要确定关系就退缩？', '区分真实不合适和承诺恐惧', ['关系', '阶段', '心理'], 'event-review'],
    ['communication-gap', '沟通错位', '双方到底哪里没对上', '总觉得鸡同鸭讲的伴侣或暧昧对象', '我们到底是哪里没有对上？', '把沟通错位拆成接口问题', ['关系', '表达', '边界'], 'event-review'],
    ['triangle-risk', '第三方风险', '外部诱因是否在干扰关系', '担心第三者、竞争对象或情绪替代的人', '这段关系是不是正在被外部因素干扰？', '识别风险信号和应对边界', ['关系', '风险', '边界'], 'event-verdict'],
    ['marriage-migration', '婚迁协同', '关系与迁移是否冲突', '同时面对婚姻和城市选择的人', '关系和迁移决策会不会互相拖累？', '协调长期关系与迁移成本', ['关系', '迁移', '家庭'], 'event-simulation'],
    ['breakup-recovery', '分手修复', '分手后如何恢复', '刚结束关系、容易反复的人', '分手后我现在最该先修复什么？', '先恢复秩序，再决定是否回头', ['关系', '健康', '恢复'], 'event-review'],
    ['compatibility-window', '适配窗口', '什么时候最适合推进亲密关系', '有对象但推进节奏不确定的人', '这段时间适合更进一步吗？', '给出近期推进与保守窗口', ['关系', '窗口', '阶段'], 'event-simulation'],
    ['trust-stability', '信任稳定性', '关系信任是否正在变脆', '总在猜疑、验证、消耗的人', '这段关系的信任是不是正在变脆？', '识别信任风险和修复前置条件', ['关系', '风险', '沟通'], 'event-review'],
    ['parenting-partnership', '育儿协同', '伴侣在育儿上能否协同', '家庭与伴侣角色冲突明显的人', '我们在育儿和家庭责任上能协同吗？', '看角色分工和消耗来源', ['关系', '家庭', '责任'], 'event-verdict'],
    ['old-relationship-pattern', '旧关系回潮', '旧对象再次出现该怎么判断', '旧关系回流、对方再联系的人', '旧关系回来找我，我该怎么看？', '区分情绪回潮和结构改善', ['关系', '复盘', '边界'], 'event-verdict'],
    ['relationship-rebuild', '关系重建', '关系受损后是否值得重建', '经历重大冲突、出轨、信任危机的人', '这段关系还有没有重建价值？', '看代价、条件和修复周期', ['关系', '风险', '长期'], 'event-review'],
  ].map((tuple) => buildThemeTuple('relationship', tuple)),
  health: [
    ['recovery-window', '恢复窗口', '最近更适合休养还是推进', '身心疲劳、恢复慢的人', '我最近最适合恢复还是推进？', '给出恢复优先级和窗口判断', ['健康', '阶段', '恢复'], 'event-simulation'],
    ['burnout-alert', '透支预警', '是否已经到透支边缘', '工作和生活双重承压用户', '我是不是已经在透支边缘了？', '识别红线和必须减负的位置', ['健康', '事业', '风险'], 'event-review'],
    ['sleep-stability', '睡眠稳定', '睡眠失衡与阶段关系', '长期睡眠不稳、作息紊乱的人', '我的睡眠失衡更像结构问题还是阶段问题？', '看恢复秩序和环境噪音', ['健康', '环境', '恢复'], 'event-review'],
    ['stress-peak', '压力高峰', '哪段时间最容易压力爆表', '容易在固定周期崩的人', '我最近最容易在哪些时段压力失控？', '提前识别高压节点', ['健康', '窗口', '风险'], 'event-simulation'],
    ['body-signal', '身体信号', '身体反复提醒的重点是什么', '总在被身体提醒但没法解释的人', '身体最近反复在提醒我什么？', '把模糊不适翻译成恢复重点', ['健康', '结构', '恢复'], 'event-review'],
    ['mental-boundary', '心理边界', '情绪耗损主要来自哪里', '容易被他人情绪吞没的人', '我的情绪耗损主要来自哪里？', '拆出边界漏洞和减负策略', ['健康', '关系', '边界'], 'event-review'],
    ['energy-cycle', '能量周期', '什么时候更适合高强度安排', '想更合理安排节奏的人', '我什么时候更适合做高强度安排？', '让能量曲线与日程对齐', ['健康', '窗口', '动作'], 'event-simulation'],
    ['chronic-overload', '长期过载', '哪些责任正在拖慢恢复', '责任过重、恢复总失败的人', '到底是什么在持续拖慢我的恢复？', '识别长期过载源', ['健康', '家庭', '事业'], 'event-review'],
    ['environment-load', '环境耗损', '空间和环境是否正在拖后腿', '换房、通勤、噪音、密度过高的人', '我的环境是不是正在持续消耗我？', '把环境变量纳入恢复判断', ['健康', '迁移', '环境'], 'event-verdict'],
    ['illness-timing', '不适窗口', '短期内需要特别留意的窗口', '想提前预防而不是事后补救的人', '近期我最该注意哪些不适窗口？', '提前给出预防性提醒', ['健康', '窗口', '风险'], 'event-simulation'],
    ['habit-rebuild', '习惯重建', '恢复秩序从哪里开始最稳', '作息、饮食、运动长期混乱的人', '我的恢复秩序应该从哪里开始重建？', '给出最小可执行恢复动作', ['健康', '恢复', '动作'], 'event-review'],
    ['caregiving-fatigue', '照护疲惫', '照顾别人是否已经伤到自己', '长期照护老人、孩子、伴侣的人', '我在照顾别人这件事上是不是已经过载了？', '识别照护负担与边界', ['健康', '家庭', '责任'], 'event-review'],
    ['travel-fatigue', '迁移疲惫', '频繁出差/跨城是否正在伤身', '经常出差、往返、多城生活的人', '频繁移动是不是正在成为我的主要消耗？', '看移动成本和恢复代价', ['健康', '迁移', '恢复'], 'event-verdict'],
    ['medical-readiness', '检查节奏', '近期是否适合安排检查/治疗', '正在犹豫要不要做检查和干预的人', '这段时间适合安排检查或治疗吗？', '看行动窗口和执行优先级', ['健康', '窗口', '行动'], 'meihua-enhancement'],
    ['healing-rebuild', '疗愈重建', '长期修复到底怎么排顺序', '想系统恢复但总是半途而废的人', '我的长期恢复应该怎样排序？', '建立长期修复路线', ['健康', '长期', '恢复'], 'event-review'],
  ].map((tuple) => buildThemeTuple('health', tuple)),
  family: [
    ['responsibility-order', '责任排序', '家里最该先处理哪件事', '家庭事务多到压不住的人', '家庭问题这么多，最该先处理哪一块？', '先排顺序，减少混乱推进', ['家庭', '责任', '恢复'], 'event-verdict'],
    ['parent-pressure', '父母压力', '父母关系和压力如何影响自己', '长期承受父母期待或消耗的人', '父母压力到底怎样影响我当前状态？', '把代际压力从情绪里拎出来', ['家庭', '关系', '压力'], 'event-review'],
    ['eldercare-load', '照护负担', '照护父母是否到了重配节点', '面对老人照护决策的人', '现在的照护安排是不是已经不可持续？', '看责任结构和下一步重配', ['家庭', '健康', '责任'], 'event-review'],
    ['child-rhythm', '孩子节奏', '与孩子互动节奏是否失衡', '和孩子关系紧张、沟通无效的人', '我和孩子的互动问题到底卡在哪里？', '看节奏、界限和家庭环境', ['家庭', '关系', '边界'], 'event-review'],
    ['home-recovery', '家庭恢复', '家里是否有真正的恢复位', '回家也无法恢复的人', '我的家为什么待着也恢复不了？', '识别家庭恢复系统漏洞', ['家庭', '健康', '环境'], 'event-verdict'],
    ['couple-division', '伴侣分工', '家庭分工是否已经失衡', '家庭里总有一个人过载的人群', '家庭分工是不是已经明显失衡？', '看责任比例和修复方式', ['家庭', '关系', '责任'], 'event-review'],
    ['home-move', '搬家判断', '为家庭搬家是否值得', '为学区、老人、孩子搬家的人', '为了家庭这次搬家值不值得？', '把家庭收益和迁移成本一起看', ['家庭', '迁移', '财富'], 'event-simulation'],
    ['generation-gap', '代际错位', '代际冲突真正卡在哪', '和父母/长辈长期难沟通的人', '我们这代和上一代真正错位在哪里？', '把代际冲突翻译成结构问题', ['家庭', '关系', '沟通'], 'event-review'],
    ['family-finance-order', '家中账本', '家庭财务顺序怎么重排', '家庭钱和责任都乱的人', '家庭财务和责任怎么才能不再互相拖累？', '重排责任与金钱顺序', ['家庭', '财富', '责任'], 'event-review'],
    ['schooling-choice', '教育选择', '孩子教育决策是否合适', '面临择校、出国、城市教育选择的人', '这个教育选择对家庭整体划算吗？', '看长期成本和家庭承载', ['家庭', '迁移', '财富'], 'event-simulation'],
    ['family-boundary', '家庭边界', '家人介入是否过深', '边界感薄弱、容易被家里影响的人', '家人的介入是不是已经过深了？', '识别必要边界和调整动作', ['家庭', '关系', '边界'], 'event-verdict'],
    ['shared-living', '同住压力', '同住安排是否正在放大冲突', '与父母、伴侣、亲属同住的人', '同住是不是正在加重我们的问题？', '把空间问题变成结构问题', ['家庭', '关系', '环境'], 'event-review'],
    ['family-crisis', '家庭危机', '突发家庭事件该怎么排动作', '家庭突发变故、时间压力很高的人', '家庭突发问题现在最该先做什么？', '给出短周期行动顺序', ['家庭', '风险', '行动'], 'meihua-enhancement'],
    ['family-repair', '家庭修复', '长期裂痕是否值得修复', '想修复但又怕再次受伤的人', '这段家庭关系还有没有修复价值？', '看修复成本和边界条件', ['家庭', '关系', '长期'], 'event-review'],
    ['home-order', '家宅秩序', '家宅和秩序是否在影响全家', '家里长期混乱、难以稳定的人', '家里的秩序是不是正在放大所有问题？', '把家宅问题转译成恢复系统问题', ['家庭', '环境', '恢复'], 'event-verdict'],
  ].map((tuple) => buildThemeTuple('family', tuple)),
  migration: [
    ['stay-or-leave', '留回判断', '该留下还是离开当前城市/国家', '面对重大迁移抉择的人', '我现在是该留下还是离开？', '给出留回判断的核心条件', ['迁移', '阶段', '环境'], 'event-verdict'],
    ['city-fit', '城市适配', '当前城市是否真的适合自己', '在城市中长期疲惫或无归属感的人', '现在这个城市真的适合我吗？', '看环境匹配和恢复质量', ['迁移', '健康', '事业'], 'event-review'],
    ['overseas-window', '出国窗口', '什么时候更适合出国/跨境', '正计划出国、留学、迁移的人', '我现在适合出国/跨境推进吗？', '看窗口、身份和财务承载', ['迁移', '窗口', '财富'], 'event-simulation'],
    ['return-home', '回国节奏', '回国是否比继续留外更稳', '海外华人考虑回流的人', '我现在回国会不会更合适？', '看回流代价与长期定位', ['迁移', '事业', '家庭'], 'event-verdict'],
    ['identity-cost', '身份成本', '身份问题会不会拖垮迁移决策', '签证、身份、合法性压力高的人', '身份成本是不是在拖垮这次迁移？', '识别隐藏成本和决策边界', ['迁移', '风险', '财富'], 'event-review'],
    ['dual-city', '双城生活', '双城/多城是否还能持续', '长期双城、跨城跑的人', '双城生活还撑得住吗？', '看消耗和该不该收缩', ['迁移', '健康', '关系'], 'event-review'],
    ['study-abroad', '留学判断', '留学是否匹配当前阶段', '自己或为孩子考虑留学的人', '这次留学安排值得推进吗？', '把教育、身份、财务和长期路径一起看', ['迁移', '家庭', '财富'], 'event-simulation'],
    ['relocation-job', '异地工作', '为了工作迁移值不值得', '准备外派、异地机会、跨城求职的人', '为了这份工作迁移值不值？', '看职业收益是否覆盖迁移代价', ['迁移', '事业', '财富'], 'event-verdict'],
    ['migration-family', '迁移与家庭', '家庭责任会不会抵消迁移收益', '迁移与照护责任冲突的人', '家庭责任会不会让这次迁移得不偿失？', '平衡家庭责任与迁移收益', ['迁移', '家庭', '责任'], 'event-review'],
    ['settlement-speed', '落地速度', '迁移后多久能真正稳定下来', '刚完成迁移的人', '我迁移后大概多久能稳定下来？', '看稳定周期和前期坑位', ['迁移', '阶段', '恢复'], 'event-simulation'],
    ['global-relationship', '跨境关系', '关系与迁移是否互相增压', '异国、跨文化、跨城关系用户', '跨境关系和迁移会不会互相拖累？', '识别双重成本与推进条件', ['迁移', '关系', '成本'], 'event-review'],
    ['career-abroad-fit', '海外事业', '海外职业路径是否契合', '在海外重建职业路径的人', '我在海外继续当前职业路径合适吗？', '看环境和事业模型匹配', ['迁移', '事业', '环境'], 'event-verdict'],
    ['homecoming-risk', '返乡风险', '回家乡/原城市是否真能解决问题', '想逃离大城市或回老家的人', '回去真的会更轻松，还是只是暂时逃避？', '区分恢复性回流和逃避性回流', ['迁移', '家庭', '健康'], 'event-verdict'],
    ['school-choice-global', '国际择校', '国际教育路径是否划算', '家庭全球教育决策用户', '这条国际教育路线对我们家划算吗？', '看长期成本与阶段收益', ['迁移', '家庭', '财富'], 'event-simulation'],
    ['migration-rebuild', '迁移重建', '迁移后如何重新站稳', '迁移后长期失速的人', '迁移之后我怎么才能重新站稳？', '给出重建秩序与先手动作', ['迁移', '恢复', '事业'], 'event-review'],
  ].map((tuple) => buildThemeTuple('migration', tuple)),
  timing: [
    ['yearly-window', '年度主窗口', '今年最核心的推进窗口', '想先看全年节奏的人', '我今年最值得把握的主窗口是什么？', '给出全年节奏主轴', ['阶段', '窗口', '行动'], 'event-simulation'],
    ['monthly-rhythm', '月度节奏', '本月更适合推进还是保守', '需要月度节奏感的人', '我这个月应该冲，还是先稳住？', '给出月度推进建议', ['阶段', '窗口', '动作'], 'event-simulation'],
    ['decision-day', '决策日判断', '近期哪几天更适合关键动作', '面对短周期关键动作的人', '最近哪几天更适合做关键决定？', '聚焦短周期节点', ['窗口', '短周期', '行动'], 'meihua-enhancement'],
    ['signing-window', '签约窗口', '签约、确认、递交的窗口', '准备提交、签约、定案的人', '最近什么时候更适合签约/确认？', '识别推进与保守窗口', ['窗口', '财富', '事业'], 'event-simulation'],
    ['launch-window', '启动窗口', '什么时候更适合启动新计划', '想上新项目、开启新计划的人', '我的新计划什么时候启动更顺？', '避免在错位窗口硬启动', ['阶段', '行动', '风险'], 'event-simulation'],
    ['pause-window', '暂停窗口', '什么时候必须先停一下', '容易一路硬冲的人', '我最近什么时候必须先停下来？', '识别该收手而不是加码的时段', ['恢复', '窗口', '风险'], 'event-review'],
    ['repair-window', '修复窗口', '什么时候最适合做修复和调整', '关系、事业、健康都在补洞的人', '我最近什么时候最适合做修复？', '给出修复优先窗口', ['恢复', '阶段', '动作'], 'event-review'],
    ['visibility-window', '曝光窗口', '什么时候更适合亮相和争取', '需要发声、展示、上线的人', '我最近什么时候更适合被看见？', '帮助选择亮相节奏', ['事业', '表达', '窗口'], 'event-simulation'],
    ['travel-window', '出行窗口', '何时更适合出行/移动', '临时出差、旅行、搬动安排的人', '近期什么时候更适合出行或移动？', '识别顺势与高耗损窗口', ['迁移', '短周期', '健康'], 'meihua-enhancement'],
    ['meeting-window', '会谈窗口', '什么时候更适合谈判/沟通', '要谈合作、关系、重要会议的人', '这件事我什么时候去谈更容易成？', '看沟通窗口与阻力波动', ['关系', '事业', '窗口'], 'event-simulation'],
    ['money-window', '财务窗口', '什么时候更适合收缩/进攻', '近期有财务动作的人', '最近财务上该守还是该攻？', '给出近期财务节奏提醒', ['财富', '窗口', '风险'], 'event-simulation'],
    ['love-window', '关系窗口', '什么时候更适合推进关系', '关系中需要择时的人', '最近什么时候更适合推进关系？', '识别推进与误判节点', ['关系', '窗口', '动作'], 'event-simulation'],
    ['recovery-day', '恢复日判断', '短期内最该养神减负的时段', '近期压力大、身体差的人', '最近哪几天最需要减负恢复？', '把恢复也做成明确动作提醒', ['健康', '恢复', '短周期'], 'meihua-enhancement'],
    ['course-correction', '纠偏节点', '什么时候适合调整方向', '已经感觉方向有偏差的人', '我最近什么时候最适合纠偏？', '避免拖延到代价更高', ['复盘', '阶段', '动作'], 'event-review'],
    ['opportunity-wave', '机会波段', '近期机会是上升还是收缩', '近期需要抓机会的人', '我最近的机会波段是在上升还是收缩？', '给出阶段性机会判断', ['阶段', '机会', '风险'], 'event-simulation'],
  ].map((tuple) => buildThemeTuple('timing', tuple)),
  application: [
    ['naming-person', '个人起名', '名字是否适配长期身份叙事', '想给自己、孩子或品牌找名字的人', '这个名字适合长期使用吗？', '把名字拉回身份、场景和长期感受', ['应用', '身份', '长期'], 'event-verdict'],
    ['naming-brand', '品牌命名', '品牌/项目命名是否顺手', '给产品、品牌、账号命名的人', '这个品牌名会不会越用越别扭？', '看传播接口和长期使用感', ['应用', '表达', '传播'], 'event-verdict'],
    ['timing-selection', '择时', '某件具体事什么时候做更顺', '有明确动作、短周期决策压力的人', '这件事到底什么时候做更顺？', '给出短周期动作窗口', ['应用', '窗口', '行动'], 'meihua-enhancement'],
    ['meeting-choice', '会面择时', '会面/谈判安排在哪个时段更合适', '临时会谈、面试、约谈用户', '最近哪次会面安排更合适？', '降低短周期误判', ['应用', '关系', '事业'], 'meihua-enhancement'],
    ['lost-item', '寻物复原', '丢失物品的高概率路径', '证件、文件、贵重物品丢失的人', '东西丢了，我最该从哪里找？', '通过环境与路径复原聚焦查找方向', ['应用', '环境', '路径'], 'event-verdict'],
    ['home-order', '家宅秩序', '家里哪里最该先调整', '家里杂乱、情绪重、恢复差的人', '上传户型图后，请只按可见结构诊断入户、动线、采光通风、厨卫、卧室安稳和收纳问题。', '把家宅问题转译成户型结构、动线与恢复系统问题', ['应用', '环境', '恢复', '户型'], 'home-layout-diagnosis', '家里最伤人的，不是小，而是乱冲乱堵。', '当你搬家、装修、租房或长期觉得家里动线乱、睡不好、潮湿、杂物越堆越多时，就该上传户型图先诊断结构问题。', '“这套房是不是风水不好？”', '这张户型图里，哪些结构问题最该先改，为什么？', '免费先给你户型问题清单、因果链、优先级和低成本调整。', '深测版会继续拆方向假设、动静分区、门线冲、采光通风、洁污分区和 7-21 天验证指标。', ['户型图', '家宅', '动线', '风水形势'], ['核心问题清单', '因果链与优先级', '低成本调整'], ['户型问题诊断图', '动线/采光/厨卫细拆', '7-21 天验证清单']],
    ['palmistry-reading', '手相结构观察', '上传手相照片后观察掌纹结构', '想用手相照片做相学文化观察、但不想听宿命化断语的人', '上传手相照片后，请只按可见掌纹、掌丘、手型和照片质量做文化观察，并说明哪些地方不能判断。', '把手相问题转译成掌纹结构、表达节奏、边界和可执行复盘', ['应用', '相学', '手相', '掌纹'], 'palmistry-reading', '手相不是定命工具，只能作为掌纹结构和自我复盘的文化观察。', '当你想看生命线、智慧线、感情线、事业线、掌丘和手型，但又不希望被寿命、疾病、婚姻必然这类说法吓到时，就上传清晰手相照片。', '“我这只手是不是命不好？”', '这张手相照片里哪些掌纹结构值得观察，能转成哪些现实建议？', '免费先给你图片可用性、掌纹结构观察、文化解释和边界说明。', '深测版会继续拆三大主线、命运线/事业线、太阳线、掌丘分布、左右手差异和 21 天复看指标。', ['手相', '掌纹', '生命线', '智慧线', '感情线', '相学边界'], ['图片可用性检查', '掌纹与掌丘结构点', '边界化现实建议'], ['三大主线细拆', '掌丘/手型综合观察', '21 天复看与问题映射']],
    ['room-recovery', '卧室恢复', '卧室是否真的支持恢复', '睡不好、房间待不住的人', '卧室为什么没法让我恢复？', '识别空间干扰点', ['应用', '健康', '恢复'], 'event-review'],
    ['travel-choice', '出行判断', '今天/近期这趟行程值不值得去', '短期出行决策压力大的人', '这趟出行今天/近期值不值得去？', '短周期价值判断', ['应用', '短周期', '风险'], 'meihua-enhancement'],
    ['message-judgment', '消息真假', '一则消息是否值得信', '等待对方回复、消息判断的人', '这个消息我该不该当真？', '聚焦短周期判断倾向', ['应用', '关系', '风险'], 'meihua-enhancement'],
    ['offer-day', '面试择日', '面试安排在什么时候更顺', '求职用户', '面试安排在哪一天更有利？', '给出短期时间建议', ['应用', '事业', '窗口'], 'meihua-enhancement'],
    ['sign-contract-day', '签约择日', '签约/付款/交付的日子如何选', '短周期商务动作用户', '签约/付款/交付选哪天更顺？', '降低短期签约摩擦', ['应用', '财富', '窗口'], 'meihua-enhancement'],
    ['relationship-choice', '关系二选一', 'A/B 对象或路径如何快速收敛', '感情二选一决策用户', 'A 和 B 我现在更该往哪边走？', '把模糊关系变成短周期判断', ['应用', '关系', '决策'], 'meihua-enhancement'],
    ['job-choice-short', '机会二选一', '两个短期机会如何快决', '工作、合作、出差等二选一用户', '两个机会里我现在先选哪个？', '短周期快速收敛', ['应用', '事业', '财富'], 'meihua-enhancement'],
    ['home-move-day', '搬家择时', '搬家/入住时间怎么选', '搬家、入住、换房用户', '搬家/入住时间怎么选更稳？', '把短周期动作与恢复联系起来', ['应用', '家庭', '迁移'], 'meihua-enhancement'],
    ['event-quick-read', '今日快断', '今天这件事是否值得继续推进', '当天要做决定的人', '今天这件事我还要不要继续推进？', '提供短周期临门一脚判断', ['应用', '短周期', '行动'], 'meihua-enhancement'],
  ].map((tuple) => buildThemeTuple('application', tuple)),
};

function buildCategoryProductCopy(
  category: ToolCategoryKey,
  label: string,
  description: string,
  promptHint: string,
  valuePromise: string,
  relatedReportThemes: string[],
  intent?: ToolDefinition['chatIntent']
) {
  const trimmedPrompt = promptHint.replace(/[？?]+$/g, '');
  const shared = {
    hookKeywords: [label, ...relatedReportThemes].slice(0, 4),
    rightQuestion: promptHint,
  };

  switch (category) {
    case 'career':
      return {
        ...shared,
        hook: `你现在反复卡住的，往往不是能力本身，而是“${label}”这个职业判断点。`,
        triggerMoment: `当你已经连续几周在想“${trimmedPrompt}”，并且开始影响工作动作时，就该做这个工具。`,
        wrongQuestion: '“我事业以后会不会自己变好？”',
        freeValueLine: `免费先把 ${label} 的当前倾向、一个风险点和一条最小行动建议讲清楚。`,
        paidValueLine: `深测版会继续拆 ${label} 的组织阻力、阶段窗口、试探路径和高风险决策点。`,
        freeInsights: ['当前职业倾向', '最容易踩空的位置', '一条立即可执行动作'],
        premiumModules: ['未来 3-6 个月窗口', '组织/岗位结构拆解', intent === 'event-simulation' ? '推进时间线' : '取舍条件与止损线'],
      };
    case 'wealth':
      return {
        ...shared,
        hook: `你真正焦虑的不是“有没有财运”，而是“${label}”到底该怎么判断。`,
        triggerMoment: `当收入、支出、扩张或风险开始同时压着你时，这类财富工具最有价值。`,
        wrongQuestion: '“我是不是天生没财运？”',
        freeValueLine: `免费先把 ${label} 的主风险、当前倾向和一条保守动作给你。`,
        paidValueLine: `深测版会拆现金流顺序、风险触发点、扩张节奏和更细的取舍路径。`,
        freeInsights: ['当前财富倾向', '最大泄漏点或风险点', '先守还是先攻'],
        premiumModules: ['资金顺序表', '高风险窗口', '扩张与收缩路线'],
      };
    case 'relationship':
      return {
        ...shared,
        hook: `关系里最折磨人的，通常不是没答案，而是“${label}”一直看不清。`,
        triggerMoment: `当你开始反复复盘聊天、猜对方想法、或在推进和收手之间摇摆时，这个工具就该用了。`,
        wrongQuestion: '“他到底爱不爱我？”',
        freeValueLine: `免费先告诉你 ${label} 当前更偏推进、观察还是止损。`,
        paidValueLine: `深测版会拆边界、节奏、环境挤压和接下来最容易误判的节点。`,
        freeInsights: ['当前关系倾向', '最核心的边界或节奏问题', '下一步别做什么'],
        premiumModules: ['关系推进/修复路径', '边界与风险线', '外部环境影响判断'],
      };
    case 'health':
      return {
        ...shared,
        hook: `你最需要看清的，可能不是病名，而是“${label}”这条恢复逻辑。`,
        triggerMoment: `当身体、睡眠、情绪或工作效率一起下滑时，先用这类工具把恢复顺序排出来。`,
        wrongQuestion: '“我是不是太脆弱了？”',
        freeValueLine: `免费先判断 ${label} 当前更像短期波动还是恢复秩序失衡。`,
        paidValueLine: `深测版会拆恢复优先级、减负顺序、高风险窗口和环境修正位。`,
        freeInsights: ['当前恢复等级', '最该先减掉的负担', '近期风险提醒'],
        premiumModules: ['恢复路线图', '高风险时段', '环境与作息修正建议'],
      };
    case 'family':
      return {
        ...shared,
        hook: `家庭问题最怕没人先排顺序，而“${label}”往往正是那个该先处理的点。`,
        triggerMoment: `当责任、照护、情绪和钱开始缠在一起时，家庭类工具会比泛建议更有用。`,
        wrongQuestion: '“为什么家里总是这样？”',
        freeValueLine: `免费先把 ${label} 的当前主矛盾和一个止乱动作说清。`,
        paidValueLine: `深测版会拆责任排序、代际压力、家庭环境和修复路径。`,
        freeInsights: ['当前家庭主矛盾', '最先该排的顺序', '短期先止住哪件事'],
        premiumModules: ['责任重排建议', '代际压力拆解', '家庭修复路线图'],
      };
    case 'migration':
      return {
        ...shared,
        hook: `迁移最难的不是去哪，而是“${label}”这一步到底值不值得。`,
        triggerMoment: `当你已经开始在留、走、换城、出国之间长期摇摆时，这类工具最能帮你收口。`,
        wrongQuestion: '“我是不是注定要出国/回国？”',
        freeValueLine: `免费先给你 ${label} 的当前倾向、主要代价和一个验证动作。`,
        paidValueLine: `深测版会拆身份成本、家庭牵制、职业收益和迁移落地节奏。`,
        freeInsights: ['当前迁移倾向', '最重的现实成本', '先验证哪一步'],
        premiumModules: ['迁移成本清单', '留回比较框架', '落地节奏与窗口'],
      };
    case 'timing':
      return {
        ...shared,
        hook: `很多错判不是方向错，而是“${label}”这一步时机错。`,
        triggerMoment: `当你已经知道要做什么，只是拿不准什么时候动，这类窗口工具最适合。`,
        wrongQuestion: '“有没有一个永远都好的时间？”',
        freeValueLine: `免费先判断 ${label} 当前是推进窗、观察窗还是收缩窗。`,
        paidValueLine: `深测版会拆具体时间区间、动作优先级和错过窗口后的替代方案。`,
        freeInsights: ['当前窗口性质', '近期宜做/不宜做', '一个顺势动作'],
        premiumModules: ['更细时间区间', '动作优先级排序', '替代窗口方案'],
      };
    case 'application':
      return {
        ...shared,
        hook: `高频现实问题最怕乱拍脑袋，而“${label}”就是该被单独判断的一类。`,
        triggerMoment: `当问题强时效、不能等、又需要快速收敛时，这类应用工具最适合用。`,
        wrongQuestion: `“${description}能不能凭感觉解决？”`,
        freeValueLine: `免费先给你 ${label} 的短结论、一个风险提醒和一条立即动作。`,
        paidValueLine: `深测版会把 ${label} 的短周期路径、判断依据和落地动作完整展开。`,
        freeInsights: ['短周期倾向判断', '当前最该先做什么', '一个立即避坑提醒'],
        premiumModules: ['更完整的短周期判断', '依据与路径复原', '连带问题延展建议'],
      };
    default:
      return {
        ...shared,
        hook: `${label}不是一个抽象概念，而是你当前最容易反复卡住的真实问题。`,
        triggerMoment: `当你已经开始反复想“${trimmedPrompt}”时，这个工具就该用了。`,
        wrongQuestion: `“${description}会不会自动变好？”`,
        freeValueLine: `免费先给你 ${label} 的摘要判断、一个风险提醒和一条立即动作。`,
        paidValueLine: `深测版会把 ${label} 的时间窗口、证据链、风险线和下一步打法完整展开。`,
        freeInsights: ['当前倾向判断', '一条立即动作', '近期风险提醒'],
        premiumModules: ['完整时间窗口', '证据链拆解', '下一步动作序列'],
      };
  }
}

function buildThemeTuple(category: ToolCategoryKey, tuple: readonly unknown[]) {
  const [
    key,
    label,
    description,
    targetUser,
    promptHint,
    valuePromise,
    relatedReportThemes,
    chatIntent,
    hook,
    triggerMoment,
    wrongQuestion,
    rightQuestion,
    freeValueLine,
    paidValueLine,
    hookKeywords,
    freeInsights,
    premiumModules,
  ] = tuple as ToolThemeTuple;
  const defaults = buildCategoryProductCopy(
    category,
    label,
    description,
    promptHint,
    valuePromise,
    relatedReportThemes,
    chatIntent
  );
  return {
    key,
    label,
    description,
    userIntent: description,
    targetUser,
    promptHint,
    valuePromise,
    relatedReportThemes,
    hook: hook || defaults.hook,
    triggerMoment: triggerMoment || defaults.triggerMoment,
    wrongQuestion: wrongQuestion || defaults.wrongQuestion,
    rightQuestion: rightQuestion || promptHint,
    freeValueLine: freeValueLine || defaults.freeValueLine,
    paidValueLine: paidValueLine || defaults.paidValueLine,
    hookKeywords: hookKeywords || defaults.hookKeywords,
    freeInsights: freeInsights || defaults.freeInsights,
    premiumModules: premiumModules || defaults.premiumModules,
    chatIntent,
    premiumServiceKey: mapIntentToPremiumService(chatIntent),
  };
}

function mapIntentToPremiumService(intent?: ToolDefinition['chatIntent']) {
  if (!intent) return undefined;
  return isPremiumServiceKey(intent) ? intent : undefined;
}

function buildCaseStories(tool: ToolDefinition): ToolCaseStory[] {
  const toolLabel = tool.shortTitle;

  switch (tool.category) {
    case 'career':
      return [
        {
          title: '先缩窄问题，再决定要不要硬冲',
          persona: '32 岁运营负责人',
          scenario: `她连续两个月在想“${tool.promptHint}”，但一直把问题混成“我要不要辞职”。`,
          action: `先做了 ${toolLabel}测试，把问题缩成岗位结构、上级接口和窗口三件事。`,
          outcome: '结果发现不是能力差，而是当前岗位接口严重错位，她先调整职责边界后再谈转向。',
          payoff: '少走了一次冲动离职，后面再做窗口类工具时，判断明显更稳。',
        },
        {
          title: '先看代价，再决定换不换',
          persona: '29 岁产品经理',
          scenario: `他原本只盯着“机会看起来更大”，没有把 ${toolLabel} 背后的组织代价算进去。`,
          action: `用这个工具先看适配和风险，再串到下一步窗口或机会工具。`,
          outcome: '他提前发现新机会的推进方式并不适合自己，避免了高成本跳槽。',
          payoff: '先用免费结果收口问题，再用深测决定是否出手，转化点非常自然。',
        },
        {
          title: '把综合焦虑拆成一条行动链',
          persona: '35 岁团队主管',
          scenario: '她既想升职、又怕背锅，还在考虑换岗，原本每周都在摇摆。',
          action: `先用 ${toolLabel} 看主问题，再接一个窗口工具和一个应用工具。`,
          outcome: '三次测试形成了“先稳岗位，再挑时机，再落动作”的顺序。',
          payoff: '用户更容易连续使用多个工具，也更容易接受整套深测服务。',
        },
      ];
    case 'wealth':
      return [
        {
          title: '先保命，再谈放大',
          persona: '31 岁自由职业者',
          scenario: `她担心自己“赚得不少却留不住”，但说不清是现金流问题还是消费问题。`,
          action: `先做 ${toolLabel}测试，把风险和泄漏点拆开。`,
          outcome: '结果显示不是收入不行，而是支出顺序和扩张节奏严重错位。',
          payoff: '她先修正保留能力，后面再做扩张类工具时更愿意付费看细路线。',
        },
        {
          title: '一次决策，少掉几个月压力',
          persona: '38 岁小生意经营者',
          scenario: '他本来准备继续加投入，但资金链已经有发紧迹象。',
          action: `先用 ${toolLabel} 看当前倾向，再接财务窗口工具。`,
          outcome: '他把原定扩张推迟了一个阶段，保住了现金流缓冲带。',
          payoff: '用户能直接感知“少亏钱”就是价值，付费点更明确。',
        },
        {
          title: '把钱的问题和人的问题分开看',
          persona: '34 岁合伙创业者',
          scenario: '她以为问题在收益不够，实际是合作分钱和责任分配一起失衡。',
          action: `先做 ${toolLabel}，再被引导去做合作/签约类工具。`,
          outcome: '她先把边界谈清，再决定继续合作。',
          payoff: '多工具串联后，用户更容易形成完整购买路径。',
        },
      ];
    case 'relationship':
      return [
        {
          title: '不再只问爱不爱，而是看结构',
          persona: '27 岁女生',
          scenario: `她反复纠结“对方到底在不在乎我”，但真正卡住的是 ${toolLabel}。`,
          action: `她先用这个工具判断推进、观察还是止损。`,
          outcome: '结果把边界和节奏问题说清后，她停止了高频试探，关系反而没那么失控。',
          payoff: '用户先被“说中”，再愿意继续做更深的关系链路工具。',
        },
        {
          title: '一次看清，少走一次回头路',
          persona: '30 岁离异后重新恋爱用户',
          scenario: '她本来准备在情绪上头时复合，但担心自己只是舍不得。',
          action: `先做 ${toolLabel}，再串到复合或沟通类工具。`,
          outcome: '她发现问题并不是情绪，而是旧的边界模式没有改。',
          payoff: '避免再次进入高消耗关系，是最强的免费价值钩子。',
        },
        {
          title: '把一段关系拆成三步判断',
          persona: '33 岁准备结婚用户',
          scenario: '她同时面对推进、家庭阻力和迁移选择，单问一个结果完全不够。',
          action: `先做 ${toolLabel}，再接窗口工具和家庭/迁移工具。`,
          outcome: '最后形成“先看匹配，再看家庭阻力，再定节奏”的判断链。',
          payoff: '这种链路天然适合套装和连续复购。',
        },
      ];
    case 'health':
      return [
        {
          title: '先看到预警，恢复才有抓手',
          persona: '36 岁长期高压上班族',
          scenario: `他总觉得自己只是累，但 ${toolLabel} 一直在反复报警。`,
          action: `先做 ${toolLabel}测试，把恢复重点缩到一个真实场景。`,
          outcome: '结果提示近期更像透支积累，而不是简单情绪波动，他先减掉夜间高耗动作。',
          payoff: '用户会明显感到“这不是安慰，是在帮我排恢复顺序”。',
        },
        {
          title: '一个提醒，换来一次及时检查',
          persona: '29 岁女性用户',
          scenario: '她原本只是反复熬夜、心慌和睡眠差，没有把这当回事。',
          action: `做完 ${toolLabel} 后，按建议去做了基础检查和复诊安排。`,
          outcome: '后续发现有需要继续跟进的指标异常，及时开始调整作息和就医节奏。',
          payoff: '这种“早点发现，少拖一段时间”的案例最容易建立信任，但页面会明确这是示例，不替代医疗建议。',
        },
        {
          title: '恢复工具最适合连着用',
          persona: '41 岁照护者',
          scenario: '她以为自己只是睡不好，后来发现环境耗损、照护负担和节奏失衡是连着的。',
          action: `先做 ${toolLabel}，再接环境类和恢复窗口类工具。`,
          outcome: '连续几次测试后，她终于知道该先减哪个负担，而不是每次都临时硬撑。',
          payoff: '健康类用户对持续记录和复访非常敏感，天然适合历史沉淀和复测。',
        },
      ];
    case 'family':
      return [
        {
          title: '家庭问题先排顺序，情绪才会降下来',
          persona: '39 岁双职工妈妈',
          scenario: `她觉得家里每一件事都急，但真正卡住的是 ${toolLabel} 没有排清。`,
          action: `先用 ${toolLabel}测试收口主矛盾。`,
          outcome: '结果显示先修责任排序，而不是继续在每件小事上争输赢。',
          payoff: '用户会马上感觉“终于知道先做什么”，这就是核心价值。',
        },
        {
          title: '代际压力不拆开，所有问题都会变形',
          persona: '34 岁独生子女',
          scenario: '他原本以为自己只是脾气差，实际是照护和财务责任长期叠加。',
          action: `做完 ${toolLabel} 后，又被引导去做家庭财务和边界工具。`,
          outcome: '他终于把责任、钱和情绪分开处理，而不是一起爆炸。',
          payoff: '家庭类最适合设计多步测试链，用户也更容易持续回来复看。',
        },
        {
          title: '一个家庭工具带出整套修复路径',
          persona: '42 岁返乡照护用户',
          scenario: '她的问题同时牵扯搬家、父母健康和伴侣分工。',
          action: `先做 ${toolLabel}，再串到迁移和关系工具。`,
          outcome: '原本一团乱的事情被拆成“照护安排、居住决策、伴侣分工”三条线。',
          payoff: '当用户感到混乱被拆清，付费深测就更容易成交。',
        },
      ];
    case 'migration':
      return [
        {
          title: '不是去哪都行，而是看值不值',
          persona: '33 岁准备换城用户',
          scenario: `她一直在纠结走不走，但没把 ${toolLabel} 的真实代价算清。`,
          action: `先做 ${toolLabel}测试，先看阶段倾向和现实成本。`,
          outcome: '结果提醒她先验证工作落点，再决定搬迁时间。',
          payoff: '用户会明显感觉这不是空泛建议，而是在减少迁移误判。',
        },
        {
          title: '少一次冲动迁移，少一轮高成本折返',
          persona: '28 岁海外用户',
          scenario: '他原本准备立刻回流，但身份、职业和家庭牵扯都还没准备好。',
          action: `做完 ${toolLabel} 后，又接了落地速度和家庭责任工具。`,
          outcome: '最后他先做过渡方案，而不是直接把自己推回高压局面。',
          payoff: '迁移类工具非常适合做连续判断链，也最容易形成高单价产品。',
        },
        {
          title: '迁移决策最怕只看一个点',
          persona: '37 岁留学家庭',
          scenario: '她最初只问孩子教育值不值，却忽略了财务、身份和家庭承载。',
          action: `先做 ${toolLabel}，再串到财富和家庭类工具。`,
          outcome: '最后形成了一套更完整的迁移决策框架。',
          payoff: '跨分类串联能显著提升复访率和套装转化。',
        },
      ];
    case 'timing':
      return [
        {
          title: '同一件事，换个窗口结果差很多',
          persona: '30 岁准备谈判用户',
          scenario: `她已经知道自己要推进，但卡在“${tool.promptHint}”。`,
          action: `先用 ${toolLabel} 看推进窗、观察窗还是收缩窗。`,
          outcome: '她把关键动作往更顺的时段挪后，推进阻力明显下降。',
          payoff: '时间工具最大的钩子，就是让用户感到“我终于知道什么时候动”。',
        },
        {
          title: '把窗口接到主问题，价值会翻倍',
          persona: '34 岁求职用户',
          scenario: '他本来只做岗位工具，没有继续看时机。',
          action: `补做 ${toolLabel} 后，把投递和谈薪动作压到了更合适的时间。`,
          outcome: '他不再在低命中窗口乱投，决策更有秩序。',
          payoff: '时间类天然是第二步工具，最适合承接前面的主问题测试。',
        },
        {
          title: '把“现在要不要动”做成可复访产品',
          persona: '26 岁高频决策用户',
          scenario: '她每个月都会遇到推进、暂停、修复的不同选择。',
          action: `持续复测 ${toolLabel}，并结合前面历史结果看变化。`,
          outcome: '她开始形成自己的节奏感，而不是每次都重新焦虑。',
          payoff: '这类工具最适合做持续记录、订阅和周期复购。',
        },
      ];
    case 'application':
      return [
        {
          title: '高频问题，最适合当场收口',
          persona: '24 岁短周期决策用户',
          scenario: `她遇到一个必须今天判断的问题，核心就是 ${toolLabel}。`,
          action: `先用这个工具拿到短结论，再决定要不要继续深问。`,
          outcome: '她很快把问题从一团乱想法，变成一个可执行动作。',
          payoff: '应用类工具最适合做即时价值，也最容易形成转化入口。',
        },
        {
          title: '一次快断，带出后面的系统判断',
          persona: '31 岁上班族',
          scenario: '他本来只是想快点做决定，没想到问题背后还牵涉到事业和窗口。',
          action: `做完 ${toolLabel} 后，又被引导去做主问题工具。`,
          outcome: '原本只是一件短事，最后串出了更大的结构问题。',
          payoff: '这就是应用工具最好的用法: 先钩住，再带去更高客单的链路。',
        },
        {
          title: '短周期入口也能沉淀长期画像',
          persona: '28 岁连续复测用户',
          scenario: '她经常用短工具处理临时问题，担心每次都要重新说明背景。',
          action: `系统自动把 ${toolLabel} 的历史结果与她的用户画像关联起来。`,
          outcome: '后面的测算能直接继承上下文，结果比单次测更贴近她的真实处境。',
          payoff: '这类“越用越懂你”的体验，是复购和留存的核心付费点。',
        },
      ];
    default:
      return [
        {
          title: '先把问题问对',
          persona: '典型用户',
          scenario: `他一直在反复想“${tool.promptHint}”。`,
          action: `先做 ${toolLabel}测试，收口真实问题。`,
          outcome: '结果把模糊焦虑翻译成一个更可执行的判断点。',
          payoff: '问题一旦问对，后续工具和付费服务都会更顺。',
        },
        {
          title: '先看风险，再做决定',
          persona: '复测用户',
          scenario: '她最初只想要一个结论，后来发现代价和时机同样关键。',
          action: `做完 ${toolLabel} 后继续串联下一步工具。`,
          outcome: '最终判断比一次性拍板更稳。',
          payoff: '多步产品链路能显著提升满意度和转化。',
        },
        {
          title: '结果会沉淀成后续上下文',
          persona: '长期用户',
          scenario: '她不希望每次都从零开始说明背景。',
          action: '系统把这次结果与用户历史自动关联。',
          outcome: '后续测算能继承上下文，判断更贴近真实情况。',
          payoff: '持续积累就是复访价值本身。',
        },
      ];
  }
}

function buildPremiumOutcomes(tool: ToolDefinition) {
  const categoryOutcomes: Record<ToolCategoryKey, string[]> = {
    career: ['拿到更明确的留/转/争路径', '知道未来 3-6 个月先发力还是先保守', '减少一次高成本职业误判'],
    wealth: ['看清先守哪里、再动哪里', '拿到风险与现金流优先级', '避免把短期冲动当成长期机会'],
    relationship: ['知道该推进、观察还是止损', '看清边界和节奏问题到底卡在哪', '减少情绪化回头或误判成本'],
    health: ['先排恢复顺序，再谈推进', '识别近期高风险窗口和必须减负的位置', '把模糊不适变成更具体的行动提醒'],
    family: ['先把责任顺序排出来', '知道家里该先止住哪一件事', '降低长期混乱带来的持续消耗'],
    migration: ['看清留走的真实代价', '拿到迁移与落地节奏建议', '减少一次高成本折返'],
    timing: ['知道现在该冲、该等还是该停', '拿到更细的时间窗口', '错过当前窗口也有替代路径'],
    application: ['快速收敛眼前问题', '把短周期判断做得更有依据', '把临时问题串回长期结构'],
  };

  return [...tool.premiumModules.slice(0, 2), ...categoryOutcomes[tool.category]].slice(0, 5);
}

function buildObjectionAnswers(tool: ToolDefinition): ToolObjectionAnswer[] {
  const categoryHint: Record<ToolCategoryKey, string> = {
    career: '职业判断最怕继续模糊推进，晚一个窗口，代价往往更高。',
    wealth: '钱的问题最怕看得不细，越拖越容易把风险和机会混在一起。',
    relationship: '关系问题越靠猜，越容易把情绪当结论。',
    health: '健康与恢复问题越晚排顺序，代价通常不只是情绪，而是长期透支。',
    family: '家庭问题越不拆开，越容易让每个人都更累。',
    migration: '迁移决策一旦做错，补救成本通常比预想更大。',
    timing: '时机问题最怕“差不多就行”，真正差的往往就是这一点点。',
    application: '越是短周期问题，越需要快速但有依据的判断。',
  };

  return [
    {
      objection: '我先看看免费结果，没必要这么快进付费吧？',
      answer: `可以先看免费结果，但如果你已经准备真的做决定、推进或止损，深测价值会更高。${categoryHint[tool.category]}`,
    },
    {
      objection: '我担心问题描述得不够清楚，做了也不准。',
      answer: '这类工具默认会继承你的综合报告和历史工具记录，不是完全靠这一次输入。你只需要补一句当前场景，系统会把已有上下文一起带入。',
    },
    {
      objection: '我能不能只做这一个，不继续串别的？',
      answer: '可以，但精品工具最强的价值在串联使用: 先看主问题，再看时机，再落动作。这样结果更稳，也更容易变成真正有用的决策链。',
    },
  ];
}

function buildFaqItems(tool: ToolDefinition): ToolFaqItem[] {
  return [
    {
      question: `${tool.shortTitle}和综合报告有什么不同？`,
      answer: `综合报告负责看大结构，${tool.shortTitle}负责把一个高频问题单独拆细，所以更适合反复复访和连续测算。`,
    },
    {
      question: '这次结果后面还会用到吗？',
      answer: '会。每次工具结果都会绑定当前用户，并作为后续工具、聊天和综合判断的上下文基础。',
    },
    {
      question: '什么时候最适合升级专项服务？',
      answer: `当你已经准备真的做决定、需要更细的路径、窗口或止损线，而不是只想听一个摘要结论时，就该升级。`,
    },
  ];
}

const curatedToolOverrides: Record<string, {
  featuredBadge: string;
  signaturePromise: string;
  decisionLens: string;
  premiumWhyNow: string;
}> = {
  'career-role-fit': {
    featuredBadge: '事业精选',
    signaturePromise: '把“我到底适不适合继续做这份工作”拆成岗位结构、组织接口和长期代价。',
    decisionLens: '先看你是不适配，还是只是阶段性疲劳，再决定留、转还是重排职责。',
    premiumWhyNow: '如果你已经在反复想离开，但还没看清问题到底是岗位错、老板错还是阶段错，这就是最值钱的一步。',
  },
  'career-promotion-window': {
    featuredBadge: '升职精选',
    signaturePromise: '不是只看能不能升，而是看现在争取会不会撞在错误窗口上。',
    decisionLens: '把时机、组织阻力和个人筹码放在一张判断图里。',
    premiumWhyNow: '升职窗口错一次，往往不是晚一点而已，而是整个评价周期都要重来。',
  },
  'career-offer-choice': {
    featuredBadge: '机会精选',
    signaturePromise: '把两个 offer 的环境、成长性、代价和阶段匹配一次拆清。',
    decisionLens: '不只比工资或 title，而是比哪个更适合你当前阶段承接。',
    premiumWhyNow: '拿到机会后最贵的错误不是没有选择，而是选了一个未来半年会后悔的。',
  },
  'career-salary-negotiation': {
    featuredBadge: '谈薪精选',
    signaturePromise: '把谈薪这件事拆成窗口、筹码、表达和失败后的替代动作。',
    decisionLens: '不是“我值不值”，而是“我现在怎么谈更可能拿到结果”。',
    premiumWhyNow: '谈薪不是随时都能谈，时机一错，筹码再好也会被打折。',
  },
  'wealth-income-channel': {
    featuredBadge: '财富精选',
    signaturePromise: '判断你更适合什么赚钱模式，而不是继续在错误入口里硬耗。',
    decisionLens: '把赚钱方式拆成主收入模型、副业边界和长期放大性。',
    premiumWhyNow: '收入结构一旦选错，不只是赚得慢，还会把精力持续耗在错误方向上。',
  },
  'wealth-cashflow-pressure': {
    featuredBadge: '现金流精选',
    signaturePromise: '先把最危险的资金薄弱点找出来，再决定守、缩还是补。',
    decisionLens: '把现金流压力、风险触发点和可用缓冲带一起看。',
    premiumWhyNow: '现金流问题最怕拖，越晚拆清，后面越像在被动救火。',
  },
  'wealth-saving-capacity': {
    featuredBadge: '积累精选',
    signaturePromise: '不是只看你会不会花钱，而是看钱为什么总留不住。',
    decisionLens: '拆出消费触发、结构泄漏和保留纪律三个层次。',
    premiumWhyNow: '当你赚钱不算少但总没留下时，问题通常不是收入，而是结构漏洞。',
  },
  'wealth-expansion-window': {
    featuredBadge: '扩张精选',
    signaturePromise: '判断现在是该加码还是踩刹车，而不是把冒进误当机会。',
    decisionLens: '把窗口、承受度和回撤风险放在同一个节奏表里。',
    premiumWhyNow: '扩张错一次，后面往往不是少赚一点，而是回补成本极高。',
  },
  'relationship-pace-fit': {
    featuredBadge: '关系精选',
    signaturePromise: '把这段关系该推进、观察还是收手，做成一个更可执行的判断。',
    decisionLens: '先看节奏是否匹配，再看情绪、承诺和现实承载。',
    premiumWhyNow: '关系里最耗人的不是没答案，而是长期停在暧昧和误判里。',
  },
  'relationship-boundary-conflict': {
    featuredBadge: '边界精选',
    signaturePromise: '判断这段关系到底卡在爱不爱，还是卡在边界和消耗。',
    decisionLens: '把冲突从情绪事件翻译成边界漏洞和责任错位。',
    premiumWhyNow: '只要边界没拆清，再多沟通都可能只是重复旧冲突。',
  },
  'relationship-reconciliation': {
    featuredBadge: '复合精选',
    signaturePromise: '看这次复合到底是结构改善，还是情绪性回头。',
    decisionLens: '先看旧问题有没有变，再看值不值得重新投入。',
    premiumWhyNow: '复合最贵的成本不是回头，而是又回到同一套伤人的模式里。',
  },
  'relationship-communication-gap': {
    featuredBadge: '沟通精选',
    signaturePromise: '把“为什么越聊越糟”拆成接口、表达和误伤点。',
    decisionLens: '不只看说了什么，而是看你们到底在哪一层没有对上。',
    premiumWhyNow: '很多关系不是没机会，而是一直死在关键几次说偏上。',
  },
  'health-recovery-window': {
    featuredBadge: '恢复精选',
    signaturePromise: '先判断现在该恢复还是推进，避免把透支错当成努力。',
    decisionLens: '把能量、睡眠、情绪和工作动作一起看，而不是只看单一症状。',
    premiumWhyNow: '恢复顺序一旦排错，你会以为自己一直在休息，实际却还在继续透支。',
  },
  'health-burnout-alert': {
    featuredBadge: '透支精选',
    signaturePromise: '识别你是不是已经到必须减负的红线，而不是继续自我怀疑。',
    decisionLens: '看透支来源、恢复失败点和近期必须避开的高风险窗口。',
    premiumWhyNow: '透支问题越拖，通常就越不像情绪问题，而会变成身体和工作一起下滑。',
  },
  'health-sleep-stability': {
    featuredBadge: '睡眠精选',
    signaturePromise: '把睡眠差这件事拆成恢复秩序、环境干扰和节奏失衡。',
    decisionLens: '不是只看失眠本身，而是看它在你整体恢复系统里意味着什么。',
    premiumWhyNow: '睡眠问题常常是更大恢复失衡的入口，越早拆清越能少走弯路。',
  },
  'health-environment-load': {
    featuredBadge: '环境精选',
    signaturePromise: '判断你现在的不适到底有多少来自环境持续耗损。',
    decisionLens: '把空间、通勤、噪音、密度和恢复质量一起纳入判断。',
    premiumWhyNow: '很多人一直在修自己，却没意识到真正持续拖后腿的是环境。',
  },
  'migration-stay-or-leave': {
    featuredBadge: '迁移精选',
    signaturePromise: '把“留还是走”从情绪题变成阶段、成本和环境匹配题。',
    decisionLens: '先看为什么想走，再看离开的收益能不能覆盖代价。',
    premiumWhyNow: '迁移决策一旦冲动，后面补救成本往往远高于当下的不舒服。',
  },
  'migration-city-fit': {
    featuredBadge: '城市精选',
    signaturePromise: '看当前城市是不适合你，还是你只是处在一个不稳阶段。',
    decisionLens: '把环境适配、恢复质量和职业承接放在一起判断。',
    premiumWhyNow: '当“这座城市不对”反复出现时，往往已经不只是情绪波动。',
  },
  'migration-identity-cost': {
    featuredBadge: '身份精选',
    signaturePromise: '提前看清身份、签证、合法性这些隐藏成本会不会拖垮整次迁移。',
    decisionLens: '不只看能不能走，还看走之后能不能承受住身份代价。',
    premiumWhyNow: '迁移里最容易被低估的，就是身份和合法性带来的持续消耗。',
  },
  'migration-settlement-speed': {
    featuredBadge: '落地精选',
    signaturePromise: '判断迁移后多久能稳、先稳什么、最容易在哪些地方踩空。',
    decisionLens: '把落地速度、恢复成本和前期坑位提前拆清。',
    premiumWhyNow: '真正让人后悔的常常不是迁移本身，而是迁移后长时间站不稳。',
  },
};

function buildToolDefinitions(): ToolDefinition[] {
  const definitions: ToolDefinition[] = [];

  for (const category of categoryDefinitions) {
    const domainSurface = worldYiDomainSurfaces[category.key as WorldYiDomainKey];
    const knowledgeSlugs = domainSurface?.knowledgeSlugs || worldYiApplicationSurface.groups.flatMap((item) => [...item.knowledgeSlugs]);
    const caseSlugs = domainSurface?.caseSlugs || worldYiApplicationSurface.groups.flatMap((item) => [...item.caseSlugs]);

    for (const theme of categoryThemeMap[category.key].slice(0, categoryLaunchLimits[category.key])) {
      const slug = `${category.key}-${theme.key}`;
      definitions.push({
        slug,
        title: `${theme.label}测试`,
        shortTitle: theme.label,
        category: category.key,
        themeKey: theme.key,
        themeLabel: theme.label,
        description: theme.description,
        userIntent: theme.userIntent,
        promptHint: theme.promptHint,
        targetUser: theme.targetUser,
        valuePromise: theme.valuePromise,
        hook: theme.hook,
        triggerMoment: theme.triggerMoment,
        wrongQuestion: theme.wrongQuestion,
        rightQuestion: theme.rightQuestion,
        freeValueLine: theme.freeValueLine,
        paidValueLine: theme.paidValueLine,
        hookKeywords: theme.hookKeywords,
        freeOutputFields: ['headline', 'summary', 'recommendedAction', 'riskReminder'],
        premiumOutputFields: ['whyItMatches', 'evidence', 'premiumPreview'],
        freeInsights: theme.freeInsights,
        premiumModules: theme.premiumModules,
        relatedKnowledgeSlugs: knowledgeSlugs.slice(0, 4),
        relatedCaseSlugs: caseSlugs.slice(0, 3),
        relatedReportThemes: theme.relatedReportThemes,
        chatIntent: theme.chatIntent,
        premiumServiceKey: theme.premiumServiceKey,
        nextToolSlugs: [],
        caseStories: [],
        premiumOutcomes: [],
        objectionAnswers: [],
        faqItems: [],
        featuredBadge: undefined,
        signaturePromise: undefined,
        decisionLens: undefined,
        premiumWhyNow: undefined,
      });
    }
  }

  const byCategory = definitions.reduce<Record<string, ToolDefinition[]>>((accumulator, item) => {
    accumulator[item.category] = accumulator[item.category] || [];
    accumulator[item.category].push(item);
    return accumulator;
  }, {});

  definitions.forEach((definition, index) => {
    const sameCategory = byCategory[definition.category];
    const nextSame = sameCategory[(sameCategory.findIndex((item) => item.slug === definition.slug) + 1) % sameCategory.length];
    const timingFallback = byCategory.timing[(index + 2) % byCategory.timing.length];
    const applicationFallback = byCategory.application[(index + 4) % byCategory.application.length];
    definition.nextToolSlugs = Array.from(new Set([nextSame?.slug, timingFallback?.slug, applicationFallback?.slug].filter(Boolean) as string[]));
    definition.caseStories = buildCaseStories(definition);
    definition.premiumOutcomes = buildPremiumOutcomes(definition);
    definition.objectionAnswers = buildObjectionAnswers(definition);
    definition.faqItems = buildFaqItems(definition);
    const curatedOverride = curatedToolOverrides[definition.slug];
    if (curatedOverride) {
      definition.featuredBadge = curatedOverride.featuredBadge;
      definition.signaturePromise = curatedOverride.signaturePromise;
      definition.decisionLens = curatedOverride.decisionLens;
      definition.premiumWhyNow = curatedOverride.premiumWhyNow;
    }
  });

  return definitions;
}

const toolDefinitions = buildToolDefinitions();
const dailySignSeed = toolDefinitions.find((item) => item.slug === 'timing-monthly-rhythm');
if (dailySignSeed && !toolDefinitions.some((item) => item.slug === 'daily-sign')) {
  toolDefinitions.push({
    ...dailySignSeed,
    slug: 'daily-sign',
    title: '今日一签',
    shortTitle: '今日一签',
    themeKey: 'daily-sign',
    themeLabel: '今日一签',
    description: '每日轻量节律提示，适合作为日常复访入口。',
    userIntent: '我今天更适合推进、观察还是收敛？',
    promptHint: '给我今天最值得记住的一条节律提示。',
    targetUser: '想快速获得今日状态提示的用户',
    valuePromise: '用一条可执行的今日提示帮助用户形成复访习惯。',
    hook: '不是天天都要做大决定，但每天都值得先校准一下节奏。',
    triggerMoment: '早上开工前、晚上复盘前，或想快速抽一签的时候。',
    wrongQuestion: '我今天运气好不好？',
    rightQuestion: '我今天更适合推进、观察还是收敛？',
    freeValueLine: '免费先给你今日主轴和一个立即动作。',
    paidValueLine: '深测版会把今日提示接到完整报告与时间地图。',
    hookKeywords: ['今日一签', '每日节律', '日运', 'daily sign'],
    relatedReportThemes: ['阶段', '窗口', '行动'],
    featuredBadge: '每日复访',
    signaturePromise: '把命理判断收成一条今天就能用的节律提示。',
    decisionLens: '每日入口重在形成复访，而不是一次性深读。',
    premiumWhyNow: '当你想把今日提示接到完整时间地图时，再进入深测报告。',
  });
}


const toolGrowthProfiles: Record<string, ToolGrowthProfile> = {
  'daily-sign': {
    slug: 'daily-sign',
    stageLabel: 'P0 每日复访入口',
    seoTitle: '今日一签 | 每日节律提示 | 人生K线工具',
    seoDescription: '免费抽取今日节律提示：推进、观察还是收敛。适合作为每日轻量复访入口。',
    heroEyebrow: '今日一签 / 每日节律 / 轻量复访',
    heroSubtitle: '不必先填完整报告。先拿一条今天就能用的节律提示，再按需进入工作台生成结构化判断。',
    primaryCtaLabel: '抽今日一签',
    secondaryCtaLabel: '生成完整报告',
    freeValueBullets: [
      '先判断今天更偏推进、观察还是收敛。',
      '给出一条可立即执行的小动作，而不是大段术语。',
      '适合作为每日复访与邮件回访的轻入口。',
    ],
    upgradeBullets: [
      '把今日提示接到完整八字结构报告',
      '查看未来 30 天与 12 个月时间地图',
      '绑定邮箱后保存历史节律记录',
    ],
    geoQuestions: [
      '今日一签和完整八字报告有什么区别？',
      '每日节律提示能代替正式报告吗？',
      '怎么把今日提示用到实际决策里？',
    ],
    socialHooks: [
      '不是天天都要算命，但每天都值得先校准节奏。',
      '今日一签只回答一个问题：今天该推进还是收敛。',
      '轻量入口，深度判断仍交给完整报告。',
    ],
    keywords: ['今日一签', '每日运势', '日运', 'daily sign', '八字每日提示'],
  },

  'timing-yearly-window': {
    slug: 'timing-yearly-window',
    stageLabel: 'P0 SEO/GEO 冷启动工具',
    seoTitle: '2026 流年测算与年度主窗口 | 人生K线工具',
    seoDescription: '输入出生信息并结合综合报告，免费查看 2026 年度主窗口、推进节奏、风险提醒和深度流年报告升级入口。',
    heroEyebrow: '2026 流年 / 年度窗口 / 八字节奏',
    heroSubtitle: '适合想先看全年事业、关系、财富和恢复节奏的人。免费版先给年度主轴和一个立即动作，深测版再展开月份窗口、风险线和年度决策包。',
    primaryCtaLabel: '免费测 2026 年度主窗口',
    secondaryCtaLabel: '先看八字综合底盘',
    freeValueBullets: [
      '先判断 2026 更偏推进、观察还是收缩，不让用户停在泛泛生肖运势。',
      '把年度节奏落到事业、关系、财富或恢复中的一个优先动作。',
      '结果页保留邮箱保存和深测入口，方便 7/30 日复访。',
    ],
    upgradeBullets: [
      '2026 月份窗口与关键节点拆解',
      '年度风险线、止损线和替代窗口',
      '事业/关系/财富专项决策包',
    ],
    geoQuestions: [
      '2026 年流年测算应该先看什么？',
      '八字年度报告和生肖运势有什么区别？',
      '今年适合换工作、推进关系或做重大决定吗？',
    ],
    socialHooks: [
      '2026 年不要只看生肖，先看你自己的年度主窗口。',
      '同样是流年变化，有人适合冲，有人更该先守。',
      '免费结果只告诉你主节奏，深测才会拆到月份和动作。',
    ],
    keywords: ['2026流年', '八字流年测算', '年度运势', 'BaZi annual luck', 'Chinese astrology 2026'],
  },
  'application-palmistry-reading': {
    slug: 'application-palmistry-reading',
    stageLabel: 'P0 图片上传测算入口',
    seoTitle: '手相上传测算：生命线、智慧线、感情线结构观察 | 人生K线工具',
    seoDescription: '上传手相照片，按可见掌纹、掌丘、手型和照片质量做相学文化观察；免费获得基础结构判断，支持深度手相报告和人工复核转化。',
    heroEyebrow: '手相上传 / 掌纹结构 / 图片测算',
    heroSubtitle: '用户不需要先懂相学。上传清晰掌纹照片后，先看图片可用性、三大主线和现实建议，避免寿命、疾病、婚姻必然这类吓人断语。',
    primaryCtaLabel: '上传手相照片免费测',
    secondaryCtaLabel: '查看手相深测能补什么',
    freeValueBullets: [
      '免费先检查图片质量、生命线/智慧线/感情线可见度和主要掌丘结构。',
      '把掌纹观察转成边界、表达节奏和复盘建议，而不是宿命化断语。',
      '天然适合小红书、短视频和图片搜索承接，用户动作简单。',
    ],
    upgradeBullets: [
      '三大主线、事业线、太阳线和掌丘分布细拆',
      '左右手差异、照片质量补拍建议和 21 天复看指标',
      '深度手相报告或人工复核服务入口',
    ],
    geoQuestions: [
      '手相照片上传后 AI 能看哪些内容？',
      '生命线短是不是一定不好？',
      '免费手相测算和深度手相报告差在哪里？',
    ],
    socialHooks: [
      '手相照片先别急着断命，第一步其实是看图片够不够清楚。',
      '生命线、智慧线、感情线能观察，但不能拿来吓自己。',
      '上传一张手相图，先拿到可见结构和现实建议。',
    ],
    keywords: ['手相上传测算', '掌纹分析', '生命线', '智慧线', '感情线', 'palm reading upload'],
  },
};

const toolBundleDefinitions: ToolBundleDefinition[] = [
  {
    slug: 'career-acceleration',
    title: '事业加速包',
    description: '把岗位匹配、升职窗口、Offer 对比和谈薪窗口串成一条事业推进链。',
    toolSlugs: ['career-role-fit', 'career-promotion-window', 'career-offer-choice', 'career-salary-negotiation'],
    valueHeadline: '先看适不适合，再看什么时候争取，最后再决定怎么谈。',
    recommendedFor: '卡在岗位、升职、跳槽和谈薪同一条线上反复犹豫的人。',
  },
  {
    slug: 'relationship-clarity',
    title: '关系澄清包',
    description: '把推进节奏、边界冲突、复合倾向和沟通错位放在一起看。',
    toolSlugs: ['relationship-pace-fit', 'relationship-boundary-conflict', 'relationship-reconciliation', 'relationship-communication-gap'],
    valueHeadline: '不要只问结果，先把关系为什么卡住看清。',
    recommendedFor: '想知道该推进、修复还是收手的人。',
  },
  {
    slug: 'wealth-discipline',
    title: '财富秩序包',
    description: '围绕赚钱方式、现金流、存钱能力和扩张窗口建立财富判断闭环。',
    toolSlugs: ['wealth-income-channel', 'wealth-cashflow-pressure', 'wealth-saving-capacity', 'wealth-expansion-window'],
    valueHeadline: '先稳住财富秩序，再决定要不要放大。',
    recommendedFor: '收入、支出、扩张和风险同时缠在一起的人。',
  },
  {
    slug: 'recovery-reset',
    title: '恢复重建包',
    description: '围绕恢复窗口、透支预警、睡眠稳定和环境耗损做恢复序列。',
    toolSlugs: ['health-recovery-window', 'health-burnout-alert', 'health-sleep-stability', 'health-environment-load'],
    valueHeadline: '先恢复，再推进，不要把透支误当成努力。',
    recommendedFor: '身体和工作一起拉警报的人。',
  },
  {
    slug: 'migration-decision',
    title: '迁移动作包',
    description: '把留回、城市适配、身份成本和落地速度放在一套决策链里。',
    toolSlugs: ['migration-stay-or-leave', 'migration-city-fit', 'migration-identity-cost', 'migration-settlement-speed'],
    valueHeadline: '迁移不是地图题，是阶段与成本题。',
    recommendedFor: '在换城、出国、回国和双城之间拉扯的人。',
  },
];

export function listToolDefinitions() {
  return toolDefinitions;
}

export function getToolDefinition(slug: string) {
  return toolDefinitions.find((item) => item.slug === slug) || null;
}

export function getToolGrowthProfile(slug: string) {
  return toolGrowthProfiles[slug] || null;
}

export function getPriorityGrowthTools() {
  return Object.values(toolGrowthProfiles)
    .map((profile) => getToolDefinition(profile.slug))
    .filter(Boolean) as ToolDefinition[];
}

export function getPriorityGrowthToolLinks(source: string) {
  return getPriorityGrowthTools().map((tool) => ({
    href: `/tools/${tool.slug}?source=${encodeURIComponent(source)}`,
    label: getToolGrowthProfile(tool.slug)?.primaryCtaLabel || tool.shortTitle,
    shortLabel: tool.slug === 'timing-yearly-window'
      ? '2026 流年'
      : tool.slug === 'application-palmistry-reading'
        ? '手相上传'
        : tool.shortTitle,
  }));
}

export function listToolBundles() {
  return toolBundleDefinitions;
}

export function getToolBundleForSlug(toolSlug: string) {
  return toolBundleDefinitions.find((bundle) => bundle.toolSlugs.includes(toolSlug)) || null;
}

export function listToolCategories() {
  return categoryDefinitions.map((category) => ({
    ...category,
    count: toolDefinitions.filter((item) => item.category === category.key).length,
  }));
}

export function listToolsByCategory(category: ToolCategoryKey) {
  return toolDefinitions.filter((item) => item.category === category);
}

export function getFeaturedTools(limit = 8) {
  const priorityCategories: ToolCategoryKey[] = ['career', 'relationship', 'wealth', 'timing', 'application'];
  const featured: ToolDefinition[] = [];
  priorityCategories.forEach((category) => {
    featured.push(...listToolsByCategory(category).slice(0, 2));
  });
  return featured.slice(0, limit);
}

export function inferCategoryFromText(text: string): ToolCategoryKey | null {
  const lowered = text.toLowerCase();
  const rules: Array<{ category: ToolCategoryKey; patterns: string[] }> = [
    { category: 'career', patterns: ['事业', '工作', '职业', '升职', '转岗', '面试', '团队', '老板', 'job', 'career'] },
    { category: 'wealth', patterns: ['财富', '赚钱', '收入', '现金流', '理财', '投资', '财务', 'money', 'cash'] },
    { category: 'relationship', patterns: ['关系', '感情', '婚姻', '伴侣', '恋爱', '复合', 'partner', 'relationship'] },
    { category: 'health', patterns: ['健康', '身体', '恢复', '睡眠', '压力', '焦虑', 'health', 'recovery'] },
    { category: 'family', patterns: ['家庭', '父母', '孩子', '照护', '家里', 'family', 'parent'] },
    { category: 'migration', patterns: ['迁移', '移民', '出国', '回国', '城市', '海外', 'migration', 'overseas'] },
    { category: 'timing', patterns: ['窗口', '时机', '什么时候', '本月', '今年', '今天', '择时', 'timing'] },
    { category: 'application', patterns: ['起名', '寻物', '家宅', '户型', '平面图', '风水', '手相', '掌纹', '相学', '择日', '签约', '今日', 'quick', 'name', 'floor plan', 'feng shui', 'palm', 'palmistry'] },
  ];

  const matched = rules.find((rule) => rule.patterns.some((pattern) => lowered.includes(pattern)));
  return matched?.category || null;
}

export function buildToolRecommendations(params?: {
  report?: FortuneRecord | null;
  recentSessions?: ToolSessionRecord[];
  limit?: number;
}) {
  const limit = params?.limit || 6;
  const recommendations: ToolRecommendation[] = [];
  const added = new Set<string>();

  const addFromCategory = (category: ToolCategoryKey, reason: string, source: ToolRecommendation['source']) => {
    for (const tool of listToolsByCategory(category)) {
      if (added.has(tool.slug)) continue;
      recommendations.push({ slug: tool.slug, reason, source });
      added.add(tool.slug);
      if (recommendations.length >= limit) {
        return;
      }
    }
  };

  const reportSignals = [
    params?.report?.analysis?.opening,
    params?.report?.analysis?.explanation,
    params?.report?.pattern?.type,
    params?.report?.name,
  ].filter(Boolean).join(' ');
  const reportCategory = inferCategoryFromText(reportSignals);
  if (reportCategory) {
    addFromCategory(reportCategory, '基于当前报告主轴推荐', 'report');
  }

  const recentCategory = params?.recentSessions?.[0]?.toolSlug
    ? getToolDefinition(params.recentSessions[0].toolSlug)?.category || null
    : null;
  if (recentCategory && recommendations.length < limit) {
    addFromCategory(recentCategory, '基于最近使用记录延展', 'history');
  }

  if (recommendations.length < limit) {
    addFromCategory('timing', '先配一个阶段窗口工具', 'default');
  }

  if (recommendations.length < limit) {
    addFromCategory('application', '补一个高频应用工具', 'default');
  }

  if (recommendations.length < limit) {
    addFromCategory('career', '默认热门工具', 'default');
  }

  return recommendations.slice(0, limit);
}

export function buildToolPremiumOffer(tool: ToolDefinition): ToolPremiumOffer {
  const categorySpecific = (() => {
    switch (tool.category) {
      case 'career':
        return {
          upgradeMoment: '当你准备真的去谈、去换、去争，而不是只想“再看看”时，就该解锁深测。',
          outcomeLine: '深测版的目标不是给你安慰，而是帮你降低职业误判成本。',
          deliverables: ['岗位/组织阻力拆解', '未来 3-6 个月窗口', '推进与止损双路径'],
        };
      case 'wealth':
        return {
          upgradeMoment: '当你准备动钱、扩张、谈合作或承受更大财务风险时，深测价值最高。',
          outcomeLine: '深测版的目标是让你知道钱该先守哪里、再动哪里。',
          deliverables: ['现金流与风险顺序', '扩张/收缩时间窗', '高风险触发点'],
        };
      case 'relationship':
        return {
          upgradeMoment: '当你已经不想再反复猜，而是想知道这段关系该推进、修复还是收手时，就该深测。',
          outcomeLine: '深测版的目标是帮你把情绪问题翻译成边界、节奏和取舍问题。',
          deliverables: ['边界与节奏拆解', '推进/修复/止损路径', '最容易误判的节点'],
        };
      case 'health':
        return {
          upgradeMoment: '当身体、情绪、睡眠和工作已经互相拖累时，深测会比泛建议更有价值。',
          outcomeLine: '深测版的目标是先帮你排恢复顺序，再谈怎么重回推进。',
          deliverables: ['恢复路线图', '高风险时段提醒', '环境与减负建议'],
        };
      case 'family':
        return {
          upgradeMoment: '当家庭问题已经影响判断和生活秩序时，深测会帮你先把顺序排清。',
          outcomeLine: '深测版的目标是把混乱家庭问题压成可执行的责任重排。',
          deliverables: ['责任排序图', '代际压力拆解', '家庭修复优先级'],
        };
      case 'migration':
        return {
          upgradeMoment: '当你真的准备留、走、换城、出国时，深测最能降低迁移决策代价。',
          outcomeLine: '深测版的目标是让迁移从情绪题变成成本和阶段题。',
          deliverables: ['迁移成本清单', '留回比较框架', '落地节奏建议'],
        };
      case 'timing':
        return {
          upgradeMoment: '当你已经知道要做什么，只差决定什么时候动时，深测会更值钱。',
          outcomeLine: '深测版的目标是把错的时机排除掉，而不是只告诉你“最近还行”。',
          deliverables: ['更细的时间区间', '动作优先级', '错过后的替代窗口'],
        };
      case 'application':
        return {
          upgradeMoment: '当问题很急、今天就要定、而且你不想靠感觉拍板时，深测最有价值。',
          outcomeLine: '深测版的目标是让短周期决策也有依据，而不是临门一脚全靠运气。',
          deliverables: ['短周期判断路径', '即时风险提醒', '连带问题延展建议'],
        };
      default:
        return {
          upgradeMoment: '当你准备把这个问题真正落地时，就该进入深测。',
          outcomeLine: '深测版会继续把问题讲透，而不是停在摘要。',
          deliverables: ['完整拆解', '时间窗口', '下一步动作'],
        };
    }
  })();

  return {
    title: `${tool.shortTitle}深测版`,
    teaser: `${tool.shortTitle}的免费版只给摘要。深测版会把“为什么、什么时候、先做什么、不要做什么”完整展开。`,
    upgradeMoment: categorySpecific.upgradeMoment,
    outcomeLine: categorySpecific.outcomeLine,
    deliverables: categorySpecific.deliverables,
    ctaLabel: '解锁深测提醒',
    subscribeTags: ['tool_premium', `tool:${tool.slug}`, `category:${tool.category}`],
  };
}

export function buildToolRunSummary(params: {
  tool: ToolDefinition;
  report: FortuneRecord;
  recentSessions?: ToolSessionRecord[];
  note?: string;
  /** Optional prebuilt GroundTruthPack (birth-only path) */
  pack?: unknown;
}): ToolRunSummary {
  try {
    return buildEngineToolRunSummary({
      tool: {
        slug: params.tool.slug,
        shortTitle: params.tool.shortTitle,
        title: params.tool.title,
        valuePromise: params.tool.valuePromise,
        relatedReportThemes: params.tool.relatedReportThemes,
        chatIntent: params.tool.chatIntent,
        premiumServiceKey: params.tool.premiumServiceKey,
        category: params.tool.category,
      },
      report: params.report as any,
      recentSessions: params.recentSessions as any,
      note: params.note,
      pack: params.pack as any,
    }) as ToolRunSummary;
  } catch (error) {
    console.warn('[tools] engine tool summary failed, using legacy rehash', error);
  }
  return buildToolRunSummaryLegacy(params);
}

function buildToolRunSummaryLegacy(params: {
  tool: ToolDefinition;
  report: FortuneRecord;
  recentSessions?: ToolSessionRecord[];
  note?: string;
}): ToolRunSummary {
  const { tool, report, note } = params;
  const toolMemory = summarizeToolSessions(params.recentSessions || [], report, 4);
  const opening = `${report.analysis?.opening || ''}`.trim() || `${report.name}当前已经进入一个需要重新排顺序的阶段。`;
  const explanation = `${report.analysis?.explanation || ''}`.trim() || '这份结果会优先围绕结构、阶段、环境和动作四层展开。';
  // v5-D25 (2026-05-17): career/wealth/marriage/health 是 *Advice 对象，不是 string。
  // 之前的代码 .filter(Boolean) 后强转 as string[]，对象进入 adviceSignals[0/1]
  // → 写到 recommendedAction → 下游 scoreToolResultQuality 的 .trim() 抛 TypeError。
  // 日志实锤：tool-run all model attempts failed 后必现 "a.recommendedAction.trim is not a function"。
  const adviceSignals = [
    report.advice?.career?.general,
    report.advice?.wealth?.general,
    report.advice?.marriage?.general,
    report.advice?.health?.general,
    report.advice?.overall,
  ]
    .map((value) => (typeof value === 'string' ? value.trim() : ''))
    .filter((value) => value.length > 0)
    .slice(0, 2);
  const patternLabel = report.pattern?.type || '当前格局';
  const confidenceLabel = report.reportVersion?.includes('agent') ? '多层增强' : '基础结构判断';

  return {
    headline: `${tool.shortTitle}显示：${opening.replace(/[。！!]+$/g, '')}`,
    summary: `${tool.valuePromise}。当前更值得先看的是“${patternLabel}”与阶段节奏之间的关系。${note ? `补充问题：${note}` : explanation}${toolMemory ? ` ${toolMemory.summary}` : ''}`,
    confidenceLabel,
    recommendedAction: adviceSignals[0] || toolMemory?.recentSessions[0]?.recommendedAction || `${tool.shortTitle}建议先围绕一个真实场景做缩窄，不要同时推进太多事情。`,
    riskReminder: adviceSignals[1] || '如果你现在的信息还不完整，短周期判断要避免当成长期定论。',
    whyItMatches: `${tool.shortTitle}和你当前档案最相关，因为你的报告主轴里已经出现了 ${tool.relatedReportThemes.join(' / ')} 这些问题。${toolMemory ? ` 最近工具也持续指向 ${toolMemory.focusAreas.join(' / ')}。` : ''}`,
    evidence: [
      opening,
      explanation,
      `${report.name}当前格局：${patternLabel}`,
      ...(toolMemory?.evidence || []),
    ].filter(Boolean),
    premiumPreview: [
      '完整版本会展开具体窗口、风险触发点和优先动作顺序',
      tool.chatIntent ? '可继续进入专项追问，围绕这一类问题深问' : '可继续回到聊天页做结构追问',
      tool.premiumServiceKey ? '如需高价值判断，可直接升级到专项服务' : '可继续搭配阶段窗口工具和应用工具使用',
    ],
  };
}
