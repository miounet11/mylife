/**
 * World Yi public logic: definitions + situation explanations.
 * Teaching / cite layer only. Does not change 日主、扶抑用神、藏干、调候 engines.
 */

export type WorldYiLayerId =
  | 'structure'
  | 'timing'
  | 'environment'
  | 'action'
  | 'risk'
  | 'review';

export type WorldYiLogicDomain =
  | 'career'
  | 'wealth'
  | 'relationship'
  | 'health'
  | 'family'
  | 'migration'
  | 'general';

export type WorldYiLayerDef = {
  id: WorldYiLayerId;
  name: string;
  order: number;
  oneLiner: string;
  definition: string;
  fieldMetaphor: string;
  baziAnchor: string;
  checkQuestion: string;
  refuse: string;
};

export type WorldYiTermDef = {
  id: string;
  name: string;
  layerId: WorldYiLayerId;
  definition: string;
  usedWhen: string;
  refuse: string;
};

export type WorldYiSituation = {
  id: string;
  title: string;
  appearance: string;
  domain: WorldYiLogicDomain;
  layerId: WorldYiLayerId;
  termIds: string[];
  keywords: string[];
  structure: string;
  timing: string;
  environment: string;
  action: string;
  risk: string;
  refuse: string;
};

export type WorldYiSituationHit = {
  situation: WorldYiSituation;
  score: number;
};

export type WorldYiExplanation = {
  headline: string;
  situation: WorldYiSituation | null;
  layer: WorldYiLayerDef;
  terms: WorldYiTermDef[];
  structure: string;
  timing: string;
  environment: string;
  action: string;
  risk: string;
  refuse: string;
  matchedScore: number;
};

export const WORLD_YI_LAYERS: WorldYiLayerDef[] = [
  {
    id: 'structure',
    name: '结构',
    order: 1,
    oneLiner: '出厂设置。先问像什么，再问缺什么。',
    definition:
      '结构是日主、用神与十神描述的稳定张力：建设、表达、协调、收敛四种发挥。它回答「我像什么、最不费力的发挥是什么」，不回答「这个月吉不吉」。',
    fieldMetaphor: '可选教学：发挥方式像已经下地的品种，认识它，不靠许愿改写。',
    baziAnchor: '日主、通根、扶抑用神、十神。调候单独说，不并入主用神。',
    checkQuestion: '这件事是在用我的发挥方式，还是在用别人的剧本？',
    refuse: '不把结构说成性格标签，也不说改个名字就换了出厂设置。',
  },
  {
    id: 'timing',
    name: '时位',
    order: 2,
    oneLiner: '阶段。抬升期验证布局，收敛期清理守成。',
    definition:
      '时位是时间与位置：大运定十年底色，流年定一年窗口。同一结构在抬升期与收敛期动作相反。先写清 90 天窗口，判断才可回访。墓库读作余气未兑现，不是坟墓。',
    fieldMetaphor: '可选教学：余气像还在库存里的成品，未出土不等于失败。',
    baziAnchor: '月令、大运、流年、十二长生。墓/库 = 未兑现的阶段余气。',
    checkQuestion: '未来 90 天，时位允许我进，还是必须先退、先清？',
    refuse: '不把时位说成幸运开关，不把墓库说成灾祸。',
  },
  {
    id: 'environment',
    name: '环境',
    order: 3,
    oneLiner: '硬约束。城市、行业、家庭、现金流、时代天气。',
    definition:
      '环境是现实态：经济周期、行业密度、家庭责任、注意力负荷、AI 与平台节奏。脱离环境的「好结构」是空中楼阁。改环境是降维执行，不是改命。',
    fieldMetaphor: '可选教学：同一发挥在过密或过稀的约束里，阻力完全不同。',
    baziAnchor: '空间场、城市主题、时代天时。外层不改写日主。',
    checkQuestion: '是我不行，还是现金流、家庭、城市或时代负荷付不起这个动作？',
    refuse: '不把城市或方位写成开运名单，不承诺换地方就改命。',
  },
  {
    id: 'action',
    name: '动作',
    order: 4,
    oneLiner: '30 天可验证的最小单元。',
    definition:
      '判断必须落成本周可执行、30 天可回访的一件事。好动作有对象、有窗口、有验证点。不是「明年成为领袖」，而是「本周约一个人把一件事谈清楚」。',
    fieldMetaphor: '可选教学：五行在动作层是动词（推进、收敛、稳住），不是收藏品。',
    baziAnchor: '顺用神发挥，忌神侧少硬刚。验证落在事件。',
    checkQuestion: '七到三十天内，哪一件事做完，能证明这个判断对或错？',
    refuse: '不给改命口诀，不把「多做好事」当成动作。',
  },
  {
    id: 'risk',
    name: '风险',
    order: 5,
    oneLiner: '可承受的损失，加上方法边界。',
    definition:
      '风险不是「会倒霉」。两类错位最常见：把未兑现的阶段当成结局（不敢动）；或在收敛期硬扩张、在抬升期过度死守。世界易给概率更优的路径，不承诺成功，不替代医疗、法律、投资。',
    fieldMetaphor: '可选教学：错位推进像在歇季翻地，勤奋也会变成损耗。',
    baziAnchor: '忌神窗口、调候失当、环境过载。风险要可观察。',
    checkQuestion: '我是在管理可承受损失，还是在用「命该如此」把人按住？',
    refuse: '不用灾祸词吓人，不把风险写成注定应验。',
  },
  {
    id: 'review',
    name: '复盘',
    order: 6,
    oneLiner: '行动 → 反馈 → 修正。不圆说。',
    definition:
      '复盘把判断接回事实：窗口有没有出现、动作有没有做、环境有没有改。对了就加码同向，错了就改解释，不改历史。',
    fieldMetaphor: '可选教学：数的是已经发生的穗，不是改写春天的日记。',
    baziAnchor: '预测回访、校准、事件账。默会经验要留下可证伪条件。',
    checkQuestion: '哪一条当时的判断，现在已经有事实能确认或推翻？',
    refuse: '不把没发生的事说成「气没到」，用来逃验证。',
  },
];

export const WORLD_YI_TERMS: WorldYiTermDef[] = [
  {
    id: 'seed',
    name: '出厂设置',
    layerId: 'structure',
    definition: '日主所代表的给定发挥方式。认识它，不是改造它。建设 / 表达 / 协调 / 收敛四型由此读出。',
    usedWhen: '有人问「我到底是谁、适合怎样推进」时，先回到出厂设置，不先给行业名单。',
    refuse: '不说换名字、改风水就能换出厂设置。',
  },
  {
    id: 'yongshen-play',
    name: '用神发挥',
    layerId: 'structure',
    definition: '结构里最该被扶助的那口气。主用神只走扶抑，不跟调候混成一张清单。',
    usedWhen: '选择行业、节奏、搭档、方位时，问是否让用神更好发挥，而不是问「缺什么补什么」。',
    refuse: '不把调候喜神写成第二套用神来颠覆「身弱用印比」这类常识读法。',
  },
  {
    id: 'field',
    name: '抬升期',
    layerId: 'timing',
    definition: '能量外放、机会密度较高的阶段。策略是验证与布局，允许试错。',
    usedWhen: '机会已经露面、该推进、该表态、该上线时。',
    refuse: '不把任何热度都叫抬升；没有结构支撑的热度只是情绪天气。',
  },
  {
    id: 'warehouse',
    name: '余气阶段',
    layerId: 'timing',
    definition:
      '墓库的世界易读法：上一阶段未兑现的能力、作品、存款、未说出口的关系。会转化，不是死亡。',
    usedWhen: '东西「看起来停了」：offer 捏着、稿件压着、钱看着不动、感情不吵不进。',
    refuse: '不把余气阶段说成坟、灾、坐牢。',
  },
  {
    id: 'weather',
    name: '调候',
    layerId: 'timing',
    definition: '寒暖燥湿的季节调节。它管这一季能不能开工，不改出厂设置。',
    usedWhen: '冬天硬启动、夏天硬消耗、过干过湿导致发挥变形时。',
    refuse: '不把「冬天要火」写成身弱之人的主用神。',
  },
  {
    id: 'soil',
    name: '硬约束',
    layerId: 'environment',
    definition: '城市、团队、家宅、现金流、时代密度。环境放大或削弱用神，自己不改日主。',
    usedWhen: '同一人换城/换组后判若两人，或家里一回去就失速。',
    refuse: '不把环境说成开运名单，也不推销开运城市。',
  },
  {
    id: 'fieldwork',
    name: '30天验证',
    layerId: 'action',
    definition: '可回访的最小动作：推进、收敛、稳住、换环境颗粒度。',
    usedWhen: '用户要「那我怎么办」时，必须落到一件能回访的事。',
    refuse: '不把祈福、转运、空泛励志当动作。',
  },
  {
    id: 'grave-error',
    name: '把未兑现当成结局',
    layerId: 'risk',
    definition: '把余气阶段误读成失败：不敢发布、不敢离职、不敢分手、不敢动用存款。',
    usedWhen: '长期冻结、自我流放、用「命该如此」为不动辩护。',
    refuse: '不鼓励「想开点就好」，要指出哪一件还可以兑现。',
  },
  {
    id: 'off-season',
    name: '错位推进',
    layerId: 'risk',
    definition: '阶段不对仍强行扩张：现金不足时加码、恢复期接大项目、关系未定就迁城。',
    usedWhen: '动作很勤，结果是透支而不是收成。',
    refuse: '不把勤奋本身判为吉。',
  },
];

export const WORLD_YI_SITUATIONS: WorldYiSituation[] = [
  {
    id: 'offer-held',
    title: '有 offer 却不敢走',
    appearance: '新机会已经到手，原岗位也还能忍。每天比较，就是不上车。',
    domain: 'career',
    layerId: 'timing',
    termIds: ['warehouse', 'field', 'grave-error'],
    keywords: ['offer', '不敢走', '不敢辞', '裸辞', '跳槽犹豫', '新工作', '捏着'],
    structure: '先问新岗位是不是让用神更好发挥，而不是问哪边「更吉」。角色密度、承压方式对不上，offer 只是天气。',
    timing: '机会在田面，决定还在仓库。这是入库待转化，不是「命里不该动」。',
    environment: '对照两边组织的密度、政治、通勤和现金流缓冲，这是土壤测试。',
    action: '七日内写出三条可验证差异（职责、汇报、作息），并给自己一个明确上车/放弃日，避免无限库存。',
    risk: '把仓库当坟：把犹豫当成安全，直到 offer 过期，再解释成「本来就不该走」。',
    refuse: '不说「你八字今年不能换工作」。',
  },
  {
    id: 'promotion-freeze',
    title: '熬很久却升不上去',
    appearance: '业务熟、人可靠，名分和薪酬停在原地。越忠诚越像背景板。',
    domain: 'career',
    layerId: 'structure',
    termIds: ['yongshen-play', 'warehouse', 'soil'],
    keywords: ['升职', '晋升', '熬', '老黄牛', '不升', '职级', '天花板'],
    structure: '可靠往往是印比/官杀过重的发挥：能扛，但不被看见。先认清你是「守田的人」，不是「抢季节的人」。',
    timing: '能力已入库，名分还没出苗。继续加时长通常不能把库存变成田面。',
    environment: '这片组织土壤是否只奖励可见战功？若土壤奖励表演，苦劳不会自己发芽。',
    action: '把一件已完成的库存做成对外可见的结果（汇报、作品、带人），并给自己一个观察窗口：两季无名分就准备换土。',
    risk: '错把忠诚当结构优势，在板结土里继续埋自己。',
    refuse: '不说「你命里晚发」来劝人无限等待。',
  },
  {
    id: 'hop-too-fast',
    title: '一年一跳，越跳越空',
    appearance: '每个岗位还没结果就离开。简历热闹，田里没有连作。',
    domain: 'career',
    layerId: 'risk',
    termIds: ['off-season', 'field', 'seed'],
    keywords: ['跳槽', '一年一跳', '频繁换工作', '待不久', '适应不了'],
    structure: '种子可能本就需要转换环境，但更常见的是用换土逃避结构问题。',
    timing: '苗还没扎根就翻地，每一季都在出苗，没有入库。',
    environment: '连续换土会让你分不清是土的问题还是种子的问题。',
    action: '下一份工作先约定一个最小收获：带完一个完整周期再评估，不在第一个低谷翻地。',
    risk: '错季翻地变成习惯后，市场会把你读成无法结果的人。',
    refuse: '不把「多历练」美化成没有收成的跳动。',
  },
  {
    id: 'only-holder',
    title: '组里只有我能扛',
    appearance: '所有缺口都落到你。你一请假，系统就停。',
    domain: 'career',
    layerId: 'structure',
    termIds: ['seed', 'soil', 'fieldwork'],
    keywords: ['只有我', '能扛', '主力', '离不开', '救火', '背锅'],
    structure: '这是结构过载：你的发力方式被环境当成公共基础设施。',
    timing: '长期处在田面高强度，没有入库和歇地。',
    environment: '土壤把责任吸向最能扛的人。不减株，人会先于系统崩溃。',
    action: '本周交出一件可交接的事，并明确「不再默认接的缺口」。田活是减株，不是再扛一次。',
    risk: '把「我能扛」当成身份后，健康和家庭会成为被收割的休耕地。',
    refuse: '不夸「你就是贵人/劳模」来鼓励继续透支。',
  },
  {
    id: 'high-pay-no-save',
    title: '收入不低，却存不下',
    appearance: '账上看着风光，月底仍慌。一有结余就被生活或面子吃掉。',
    domain: 'wealth',
    layerId: 'timing',
    termIds: ['warehouse', 'field', 'grave-error'],
    keywords: ['存不下', '月光', '收入不低', '存钱', '漏财', '花钱'],
    structure: '会赚钱是田面能力，会留下是仓库能力。两者不是同一种结构。',
    timing: '收成一直在地面上被花掉，从未入库。这不是「财运差」，是没有仓库。',
    environment: '高密度城市和社交场面会把土壤抽干，让入库显得寒酸。',
    action: '先建一个不可见的小仓库：固定比例先划走，再谈消费和投资。两周后回看结余是否第一次留下。',
    risk: '继续用更高收入补没有仓库的田，扩张只会加大泄漏。',
    refuse: '不说「你命里留不住钱」。',
  },
  {
    id: 'afraid-after-loss',
    title: '亏过一次，就再不敢动',
    appearance: '一次投资或项目失败后，现金和机会都停在账上。安全变成冻结。',
    domain: 'wealth',
    layerId: 'risk',
    termIds: ['grave-error', 'warehouse', 'weather'],
    keywords: ['亏了', '套牢', '不敢投', '被割', '亏损', '再也不'],
    structure: '失败打击的是发挥信心，不是种子本身。先分清是判断错误，还是田候不对。',
    timing: '钱还在仓库，人把仓库当成坟。库存没有在转化，只是在避风。',
    environment: '周围若全是暴富叙事，你会把正常休整也读成落后。',
    action: '用一笔可亏得起的小额做一次完整周期（进、持、出、记），目的是恢复田活，不是翻本。',
    risk: '把仓库当坟：多年后发现本金还在、能力断了。',
    refuse: '不承诺下一把必回本，不推销高风险翻本。',
  },
  {
    id: 'expand-while-broke',
    title: '账上没钱还要扩张',
    appearance: '想招人、想开第二摊、想加杠杆。现金薄，故事很满。',
    domain: 'wealth',
    layerId: 'risk',
    termIds: ['off-season', 'weather', 'fieldwork'],
    keywords: ['扩张', '融资', '招人', '开分店', '加杠杆', '没钱还想'],
    structure: '食伤/偏财发挥过旺时，人会把「能想象的收成」当成已经在田里。',
    timing: '这是错季翻地：仓库未满就开新垄。',
    environment: '行业风口和同侪比较会把薄土说成沃土。',
    action: '先算三个月现金跑道。跑道不够，田活是收株和回款，不是新开。',
    risk: '用故事当土壤，一次回款延迟就会把整块田抽干。',
    refuse: '不把「敢拼」写成这一季的用神。',
  },
  {
    id: 'hot-cold',
    title: '热得快，冷得也快，订不下来',
    appearance: '开始很浓，一谈秩序、见面频率或未来就撤。或者你自己也撤。',
    domain: 'relationship',
    layerId: 'timing',
    termIds: ['field', 'warehouse', 'weather'],
    keywords: ['忽冷忽热', '不确定', '不承诺', '热恋', '冷淡', '分分合合'],
    structure: '热是田面天气，秩序是结构。合不合要看边界和节奏，不看前两周浓度。',
    timing: '感情还在出苗，有人却要求立刻结果；或该入库成约定时，仍停留在天气。',
    environment: '通勤、家庭反对、工作过密，都会把一棵苗吹干。',
    action: '用两周验证一件具体秩序：固定见面或明确不联系。看的是节奏，不是誓言。',
    risk: '把天气当成结构，或把正常入库当成「变心」。',
    refuse: '不说「你们八字不合所以处不长」。',
  },
  {
    id: 'stay-as-grave',
    title: '明明消耗，却觉得离开等于死',
    appearance: '关系或岗位已经抽干你，一提结束就恐慌，好像自我会一起消失。',
    domain: 'relationship',
    layerId: 'risk',
    termIds: ['grave-error', 'warehouse', 'seed'],
    keywords: ['离不开', '消耗', '结束就完了', '分手不敢', '离婚不敢', '牺牲'],
    structure: '身份和种子被绑在这段关系上。离开触动的是「我是谁」，不是日程空了。',
    timing: '这段关系早已入库成习惯，被误读成生命本身。',
    environment: '家庭目光和经济绑定会把土壤焊死，让换土看起来像叛逃。',
    action: '先做可逆的减株：减少共同开支或共同时间，观察两周自我是否还在。离开是后一步。',
    risk: '把仓库当坟：用「为了孩子/为了稳定」把活人也埋进去。',
    refuse: '不鼓励冲动决裂，也不用「只能熬」把人按在原地。',
  },
  {
    id: 'two-city',
    title: '两地跑的关系或工作',
    appearance: '两边都有责任，航班和视频维持秩序。谁先停，谁就像认输。',
    domain: 'migration',
    layerId: 'environment',
    termIds: ['soil', 'weather', 'fieldwork'],
    keywords: ['两地', '异地', '双城', '两边跑', '周末夫妻', '远程'],
    structure: '一个人很难同时在两块田里当主作物。先承认主田只有一块。',
    timing: '双城可以是过渡季，不能是永久田候。',
    environment: '两套土壤同时抽水：租金、签证、家庭期待。这是环境层，不是感情不够真。',
    action: '给双城一个到期日和主田标准（谁的工作/孩子/父母）。到期只选一块土加深，另一块改成探访。',
    risk: '无限过渡会让两边都长不好，最后用「我们尽力了」掩盖从未选土。',
    refuse: '不说某座城市天生旺你们。',
  },
  {
    id: 'weekend-crash',
    title: '工作日硬撑，周末整个人塌掉',
    appearance: '周五还能开会，周六起不来。休息日在还债，不是在恢复。',
    domain: 'health',
    layerId: 'timing',
    termIds: ['weather', 'off-season', 'fieldwork'],
    keywords: ['周末崩', '熬夜', '透支', '疲劳', '睡不醒', '过劳'],
    structure: '输出结构强、恢复结构弱。不是意志力差。',
    timing: '六天出苗、没有歇地。田候已经过热，还在施肥。',
    environment: '加班文化和通勤密度让歇地变成愧疚。',
    action: '先保一个不可侵占的恢复窗（连续一夜或一个上午），再谈效率。田活是减产，不是补剂。',
    risk: '把崩溃当成下周一还能重置的天气。连续错季会伤的是种子，不是情绪。',
    refuse: '不把养生广告写成命理结论，不替代医疗。',
  },
  {
    id: 'city-no-sleep',
    title: '城市太密，觉也睡不踏实',
    appearance: '房子不差，仍浅眠、易醒、周末想逃。一回老家或去海边就好一些。',
    domain: 'health',
    layerId: 'environment',
    termIds: ['soil', 'weather', 'yongshen-play'],
    keywords: ['失眠', '睡不好', '城市吵', '太密', '想逃离城市', '浅眠'],
    structure: '有的用神发挥需要低密度和长恢复；高密城市会把发挥压成应激。',
    timing: '这不是「今晚失眠」的流日问题，是土壤长期过密。',
    environment: '噪声、光、社交半径过短，都是土质。先改土，再谈功法。',
    action: '两周内改一处可验证的土：睡眠间、作息、一周一次低密环境。记录睡眠，不记录感觉鸡汤。',
    risk: '用迁城幻想代替眼前改土，或反过来坚持「能者该适应北上广」。',
    refuse: '不卖开运房，不把迁城说成唯一解药。',
  },
  {
    id: 'sandwich-only',
    title: '上有老下有小，只我一个人扛',
    appearance: '父母和孩子的日程都经过你。自己的田已经变成过道。',
    domain: 'family',
    layerId: 'structure',
    termIds: ['seed', 'soil', 'fieldwork'],
    keywords: ['上有老下有小', '夹心', '孝顺', '带孩子', '只有我养', '家务'],
    structure: '家庭把你定义成公共土壤。种子被用成了地本身。',
    timing: '这一季所有人的出苗都压在你的歇地上。',
    environment: '代际期待和「谁更能扛谁多扛」是土壤规则，不是亲情本质。',
    action: '先排出一张责任表：哪三件事必须别人接。田活是重新分工，不是更会忍耐。',
    risk: '把仓库当坟：等「孩子们大了/父母走了」再活，那时候种子也伤了。',
    refuse: '不把牺牲写成命定的孝。',
  },
  {
    id: 'eldercare-vs-career',
    title: '照护和事业互相抢人',
    appearance: '请假就丢项目，不请假就亏待病人。两边都在道德指控。',
    domain: 'family',
    layerId: 'environment',
    termIds: ['soil', 'fieldwork', 'warehouse'],
    keywords: ['照护', '生病', '陪床', '辞职回家', '父母病', '看护'],
    structure: '两块田都真实。世界易不让你用「事业更重要」或「家人第一」一句压死另一块。',
    timing: '照护常常是突发田候，事业是长季。先标这是过渡季还是新主田。',
    environment: '医院、护工、兄弟姐妹是否存在，是土壤，不是你够不够爱。',
    action: '写出 30 天过渡方案：谁值班、事业上哪一件可以入库暂停。到期再决定是否改主田。',
    risk: '在情绪最高的一周永久辞职或永久失踪，把过渡季写成终身翻地。',
    refuse: '不替你选「该尽孝还是该拼」，只逼你把主田选出来。',
  },
  {
    id: 'flee-city',
    title: '一不顺就想换城',
    appearance: '工作或感情受挫，立刻搜索移民、回老家、去大理。地图被当成答案。',
    domain: 'migration',
    layerId: 'environment',
    termIds: ['soil', 'seed', 'off-season'],
    keywords: ['换城', '润', '移民', '回老家', '逃离', '想搬走'],
    structure: '先问是种子在这块土上本就不适，还是这一季田候难受。',
    timing: '受挫当周做迁城决定，多半是把天气当成气候。',
    environment: '新城市仍是土壤测试：成本、签证、孤独、行业密度。地图不治结构。',
    action: '先在原城做一次最小换土（换组、换住处、换节奏）。仍不适，再把迁城当成下一季田活。',
    risk: '错季翻地：带着没处理的结构去新城市，换的是风景不是土壤。',
    refuse: '不推荐「某城旺你」，不把润学写成开运。',
  },
  {
    id: 'unpublished',
    title: '东西做完了，一直不敢拿出来',
    appearance: '作品、方案、感情表白都在文件夹里。差的不是完成度，是出土。',
    domain: 'general',
    layerId: 'timing',
    termIds: ['warehouse', 'field', 'grave-error'],
    keywords: ['不敢发', '不敢交', '完美主义', '压着', '没发布', '怕被看'],
    structure: '完成能力已在，看见自己的能力还在仓库。这是发挥问题，不是才华不足。',
    timing: '典型入库不出土。再改一版不会让它更像种子，只会更像坟。',
    environment: '评价密度高的圈子会让出土成本被放大。',
    action: '选一个小田面：发给一个人或发一个不完美版本，并记下真实反馈。田活是出土，不是再打磨。',
    risk: '把仓库当坟：十年后还在说「再改改」。',
    refuse: '不说「时候未到」来配合无限延期。',
  },
  {
    id: 'force-in-winter',
    title: '明明该歇，却硬开新项目',
    appearance: '刚结束一轮，人还空，又给自己加一项「必须做成」的大事。',
    domain: 'general',
    layerId: 'timing',
    termIds: ['weather', 'off-season', 'warehouse'],
    keywords: ['硬开', '停不下来', '又立flag', '休息不好', '逼自己', '新项目'],
    structure: '有的结构靠连续输出确认自我。停下来像死亡，其实只是歇地。',
    timing: '田候是冬天或刚收完。硬开是错季。该入库整理，不该出苗。',
    environment: '信息流里别人都在发布，会让歇地变成羞耻。',
    action: '给这一季一个合法仓库：只维护、不新开，并设一个开工日。用日历而不是心情决定出土。',
    risk: '连续错季翻地，下一次真正的田面来时没有种子可长。',
    refuse: '不把「卷」写成时代对你的用神要求。',
  },
  {
    id: 'industry-mismatch',
    title: '工作能做，但越做越不像自己',
    appearance: '业绩过得去，人却空。一提转行就怕从零开始。',
    domain: 'career',
    layerId: 'structure',
    termIds: ['seed', 'yongshen-play', 'soil'],
    keywords: ['转行', '不适合', '不像自己', '行业错了', '换赛道', '专业不对口'],
    structure: '先问岗位是否让用神发挥，不先问「哪行更赚」。名字好看的行业也可能是别人的剧本。',
    timing: '能力已入库，名分还在旧垄。转行是换作物，要选一个出土窗口，不是情绪日翻地。',
    environment: '行业密度和身边比较会把不适说成「你还不够拼」。',
    action: '列出三件你做得不累且别人来问的事，对照现在岗位。两周内做一次小出土（副业、内部轮岗、作品），再决定是否换土。',
    risk: '用「再熬一年」把种子埋在错土里，或一冲动清空所有库存去从零。',
    refuse: '不给开运行业名单，不说「你命里该做某行」。',
  },
  {
    id: 'exam-window',
    title: '考试/升学窗口到了，人却散',
    appearance: '报名在即或论文要交，注意力碎成很多准备，就是落不下一件。',
    domain: 'career',
    layerId: 'timing',
    termIds: ['field', 'weather', 'fieldwork'],
    keywords: ['考试', '考研', '升学', '论文', '备考', '证书', '面试'],
    structure: '印星/食伤发挥看的是输入与产出，不是意志口号。先认清你是靠记忆、表达还是实操出苗。',
    timing: '窗口在田面。再收集资料是伪入库。该减株，只留一季作物。',
    environment: '备考群和比较会把土壤抽成焦虑。低密、固定座位比新方法更重要。',
    action: '今天定一个主作物（一门或一章），七日内只交一件可批改的成品。三十日回看成稿，不回看心情。',
    risk: '错季加课：窗口期还在换方法、换老师。',
    refuse: '不说「文昌到了就能过」。',
  },
  {
    id: 'partner-split',
    title: '合伙能谈，一做事就拧',
    appearance: '愿景很合，钱、权和节奏一对上就吵。有人想冲，有人想留仓库。',
    domain: 'career',
    layerId: 'structure',
    termIds: ['seed', 'warehouse', 'fieldwork'],
    keywords: ['合伙', '合作', '股东', '分钱', '扯皮', '搭子', '工作室'],
    structure: '合伙是两粒种子共一块田。先分清谁主出苗、谁主仓库，不要两人都想当唯一作物。',
    timing: '冲的人把天气当田面，守的人把正常入库当成对方消极。',
    environment: '没有书面田埂（权责、退出、回款），土壤会把私人情绪吸进公事。',
    action: '七日内写出一张田埂：谁决策、怎么分、何时停。写不下来，就先不要加码。',
    risk: '用感情或「兄弟局」代替田埂，最后把仓库当坟，谁都翻不出来。',
    refuse: '不说「你们八字犯冲所以不能合作」。',
  },
  {
    id: 'name-as-seed',
    title: '想靠改名换一条命',
    appearance: '觉得现在的名字压运，想换一个「补用神」的名字重新开始。',
    domain: 'general',
    layerId: 'structure',
    termIds: ['seed', 'fieldwork', 'soil'],
    keywords: ['改名', '起名', '名字不好', '补用神', '改运'],
    structure: '名字是社会接口，不是第二粒种子。它改的是别人怎么叫你、你怎么签名，不改日主。',
    timing: '改名是一次出土。宜在你已经要换环境、换证件、换作品署名时做，不宜在情绪谷底当符咒。',
    environment: '户口、品牌、学术署名的土壤成本，比五行笔画更先决定该不该动。',
    action: '先写下这个名字每天出现的三个场景。若场景不变，改名只是换标签。要动，就接到起名工坊对照用神，再办一次真实出土。',
    risk: '把仓库里的未完成，寄托在新名字上，来年仍是同一块田。',
    refuse: '不承诺改名改命，不卖开运用字。',
  },
  {
    id: 'invest-window',
    title: '盯着要不要加仓/入场',
    appearance: '行情一动就想加。不加怕踏空，加上怕回撤。',
    domain: 'wealth',
    layerId: 'timing',
    termIds: ['weather', 'warehouse', 'off-season'],
    keywords: ['加仓', '入场', '投资', '股票', '基金', '现在能买吗', '抄底'],
    structure: '先分清你是靠稳定正财还是机会偏财发挥。用别人的进攻节奏，会把种子种进杠杆里。',
    timing: '问的是田候，不是吉日。仓库未建就入场，是错季翻地。',
    environment: '群消息和短视频是天气，不是气候。高密信息土会让你把每一小时当成季节。',
    action: '先标出可亏得起的一仓，写下持有到哪一天必须复盘。没有这一句，就先不加。',
    risk: '用「补仓」把仓库当坟，或把全部现金一次性出苗。',
    refuse: '不荐股，不给买卖点，不把用神说成该买哪一类资产。',
  },
  {
    id: 'move-house',
    title: '房子住着不对，想搬家',
    appearance: '睡不踏实，或通勤把人抽干。一提搬家又觉得贵、乱、不吉利。',
    domain: 'migration',
    layerId: 'environment',
    termIds: ['soil', 'weather', 'fieldwork'],
    keywords: ['搬家', '换房', '住得不对', '风水', '朝向', '租房'],
    structure: '搬家改的是土壤，不是种子。先问是恢复被抽干，还是想用新地址换命运。',
    timing: '累到极点那天签约，多半是天气决策。给自己一个 30 日观察窗。',
    environment: '光、声、通勤、同住人密度，是可测的土质。方位是次一层，不是第一刀。',
    action: '两周内改一处可逆的土（睡眠间、窗帘、一周两天远端）。仍不适，再列搬家清单：预算、通勤、恢复，而不是「哪边旺」。',
    risk: '把迁居写成开运，或反过来忍一块明显伤恢复的土。',
    refuse: '不卖开运房，不把某朝向写成命运开关。',
  },
  {
    id: 'pick-day',
    title: '哪一天签约/办事才对',
    appearance: '事情已经决定了，卡在选日子。黄历和群消息把人选到不敢动。',
    domain: 'general',
    layerId: 'timing',
    termIds: ['field', 'weather', 'fieldwork'],
    keywords: ['择日', '哪天签', '黄道吉日', '出行', '搬家日', '开工日'],
    structure: '日主和用神给的是节奏偏好，不是某一天的魔法。事本身不成，选日补不上。',
    timing: '择时是选田候：事情是否成熟、对手是否在场、你是否歇够。通书是参考层。',
    environment: '对方档期、证件、资金到账，是土壤约束，比宜忌清单硬。',
    action: '先确认三件硬条件齐了。再在一个可接受的窗口里选一天，选完就办。不要连翻三本通书。',
    risk: '把择日变成无限入库，事情在仓库里发霉。',
    refuse: '不把某一天说成必成或必败。医疗以医嘱为先。',
  },
  {
    id: 'stage-confused',
    title: '不知道自己处在哪一季',
    appearance: '别人都在收成或冲刺，你说不清该推进还是该停。K 线看了仍虚。',
    domain: 'general',
    layerId: 'timing',
    termIds: ['field', 'warehouse', 'weather'],
    keywords: ['什么阶段', '迷茫', '方向', '下一步', '卡在中间', '不知道该不该动'],
    structure: '迷茫常常不是没有种子，是把别人的季节当成自己的。',
    timing: '先判断气在田面还是仓库：有没有一件已完成却未出土的东西？有，就是入库未翻。没有，才是真的空田。',
    environment: '信息过密会让所有季节同时出现。降低输入，季节才显形。',
    action: '今天只回答一句：我手头哪一件已经 80 分却没拿出来？有就出土；没有就选一件最小田活做七天。',
    risk: '用「再想想」把仓库当坟，或用「全面规划」逃避出土。',
    refuse: '不给人生总方向鸡汤，不编造大运吉凶来结束迷茫。',
  },
];

export const WORLD_YI_JUDGMENT_METHOD = [
  '判断方法（世界易六层，按顺序，不得跳层下吉凶）：',
  '1) 结构：先定日主、扶抑用神与发挥类型（建设/表达/协调/收敛）。先问像什么，再问缺什么。调候单独说。',
  '2) 时位：再定大运、流年。抬升期验证布局，收敛期清理守成。写清 90 天窗口。墓库是余气未兑现，不是坟。',
  '3) 环境：再叠城市、行业、家庭、现金流、时代天气。硬约束不够就降维执行，不改日主。',
  '4) 动作：落到一件 7–30 天可回访的事。',
  '5) 风险：可承受损失 + 方法边界。盯错位：未兑现当成结局，或收敛期硬扩张。',
  '6) 复盘：用已发生的事校正，不把没发生说成「气没到」。',
  '世界易用当代社会、认知、环境变化，重读易学/玄学/神学/心理学/星座/哲学的有效部分；最终回到判断、意义、主体与可验证动作。',
  '解释处境时：先点层，再点问题纬度，再给动作和拒绝句。',
].join('\n');

export const WORLD_YI_LOGIC_AXIOMS = [
  '先问像不像，再问好不好。世界易是判断底座，不是吉凶标签。',
  '我不是乱，我是有结构的；不是倒霉，是处在某个阶段；不是没路，是进退顺序错了。',
  '结构是出厂设置；时位是抬升或收敛；环境是硬约束；动作必须 30 天可回访。',
  '墓库是余气未兑现，不是坟，不是灾。',
  '调候不并入主用神，以免颠覆扶抑常识。',
  '吸收易学、玄学、神学、心理学、星座、哲学的有效部分，用当代变化重读；不吸收梦境当教义。',
  '解释现实时先点层、再给定义、再给动作和拒绝句。',
] as const;

export const WORLD_YI_LOGIC_BRIEF = [
  '世界易定义（解释现实处境时必须用）：',
  ...WORLD_YI_LOGIC_AXIOMS,
  WORLD_YI_JUDGMENT_METHOD,
  '禁止：把墓库说成墓地、把城市说成开运名单、把调候并进主用神、用「命该如此」结束判断。',
].join('\n');

const LAYER_BY_ID = new Map(WORLD_YI_LAYERS.map((layer) => [layer.id, layer]));
const TERM_BY_ID = new Map(WORLD_YI_TERMS.map((term) => [term.id, term]));
const SITUATION_BY_ID = new Map(WORLD_YI_SITUATIONS.map((item) => [item.id, item]));

export function listWorldYiLayers(): WorldYiLayerDef[] {
  return WORLD_YI_LAYERS.slice().sort((a, b) => a.order - b.order);
}

export function getWorldYiLayer(id: WorldYiLayerId): WorldYiLayerDef | null {
  return LAYER_BY_ID.get(id) || null;
}

export function listWorldYiTerms(): WorldYiTermDef[] {
  return WORLD_YI_TERMS.slice();
}

export function getWorldYiTerm(id: string): WorldYiTermDef | null {
  return TERM_BY_ID.get(id) || null;
}

export function listWorldYiSituations(domain?: WorldYiLogicDomain | 'all'): WorldYiSituation[] {
  if (!domain || domain === 'all') return WORLD_YI_SITUATIONS.slice();
  return WORLD_YI_SITUATIONS.filter((item) => item.domain === domain);
}

export function getWorldYiSituation(id: string): WorldYiSituation | null {
  return SITUATION_BY_ID.get(id) || null;
}

function normalizeQuery(raw: string): string {
  return (raw || '').trim().toLowerCase().replace(/\s+/g, '');
}

export function scoreWorldYiSituation(situation: WorldYiSituation, query: string): number {
  const q = normalizeQuery(query);
  if (!q) return 0;
  let score = 0;
  const title = situation.title.toLowerCase();
  const appearance = situation.appearance.toLowerCase();
  if (title.includes(q) || q.includes(normalizeQuery(situation.title))) score += 10;
  for (const word of situation.keywords) {
    const w = word.toLowerCase();
    if (!w) continue;
    if (q.includes(w) || w.includes(q)) score += 6;
  }
  if (appearance.includes(q)) score += 3;
  if (q.includes(situation.domain)) score += 1;
  return score;
}

export function matchWorldYiSituations(query: string, limit = 3): WorldYiSituationHit[] {
  const scored = WORLD_YI_SITUATIONS.map((situation) => ({
    situation,
    score: scoreWorldYiSituation(situation, query),
  }))
    .filter((hit) => hit.score >= 6)
    .sort((a, b) => b.score - a.score);
  return scored.slice(0, Math.max(1, limit));
}

function explanationFromSituation(situation: WorldYiSituation, score: number): WorldYiExplanation {
  const layer = getWorldYiLayer(situation.layerId) || WORLD_YI_LAYERS[0];
  const terms = situation.termIds
    .map((id) => getWorldYiTerm(id))
    .filter((term): term is WorldYiTermDef => !!term);
  return {
    headline: `${situation.title}：先当「${layer.name}」看，不要先当吉凶看。`,
    situation,
    layer,
    terms,
    structure: situation.structure,
    timing: situation.timing,
    environment: situation.environment,
    action: situation.action,
    risk: situation.risk,
    refuse: situation.refuse,
    matchedScore: score,
  };
}

const GENERIC_EXPLANATION: WorldYiExplanation = {
  headline: '先把这件事拆进六层，再决定进还是退。',
  situation: null,
  layer: WORLD_YI_LAYERS[0],
  terms: [WORLD_YI_TERMS[0], WORLD_YI_TERMS[3], WORLD_YI_TERMS[5]],
  structure: '先问：这是出厂设置问题（发挥方式），还是我在用别人的剧本？',
  timing: '再问：未来 90 天是抬升还是收敛？未兑现的不要当成失败。',
  environment: '再问：是我不行，还是现金流、家庭、城市或时代负荷付不起？',
  action: '只选一件七到三十天能验证的动作。',
  risk: '两头盯：把未兑现当成结局，或在收敛期硬扩张。',
  refuse: '不给吉凶判决，不把「命该如此」当结束语。',
  matchedScore: 0,
};

export function explainWorldYiSituation(id: string): WorldYiExplanation | null {
  const situation = getWorldYiSituation(id);
  if (!situation) return null;
  return explanationFromSituation(situation, 99);
}

export function explainWorldYiQuery(query: string): WorldYiExplanation {
  const hits = matchWorldYiSituations(query, 1);
  if (!hits.length) return GENERIC_EXPLANATION;
  return explanationFromSituation(hits[0].situation, hits[0].score);
}

export function formatWorldYiExplanation(exp: WorldYiExplanation): string {
  const lines = [
    exp.headline,
    `结构：${exp.structure}`,
    `时位：${exp.timing}`,
    `环境：${exp.environment}`,
    `动作：${exp.action}`,
    `风险：${exp.risk}`,
    `拒绝：${exp.refuse}`,
  ];
  if (exp.terms.length) {
    lines.splice(1, 0, `用语：${exp.terms.map((t) => t.name).join('、')}`);
  }
  return lines.join('\n');
}

export const WORLD_YI_LOGIC_DOMAINS: Array<{ id: WorldYiLogicDomain | 'all'; label: string }> = [
  { id: 'all', label: '全部处境' },
  { id: 'career', label: '事业' },
  { id: 'wealth', label: '财富' },
  { id: 'relationship', label: '关系' },
  { id: 'health', label: '健康' },
  { id: 'family', label: '家庭' },
  { id: 'migration', label: '迁移' },
  { id: 'general', label: '日常' },
];
