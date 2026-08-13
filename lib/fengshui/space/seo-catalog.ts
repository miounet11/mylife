/**
 * 空间场 SEO/GEO catalog — unique decision jobs, not a cartesian doorway farm.
 * Each scenario owns a search intent and a non-swappable angle.
 */

import type { LayoutDomain } from './layout-presets';

export type SpaceSeoCluster =
  | 'method'
  | 'yangzhai'
  | 'shop'
  | 'office'
  | 'villa'
  | 'rural'
  | 'apartment'
  | 'yinzhai'
  | 'city'
  | 'renzhai';

export type SpaceSeoScenario = {
  slug: string;
  cluster: SpaceSeoCluster;
  title: string;
  intent: string;
  keywords: string[];
  angle: string;
  domain: LayoutDomain;
  layout: string;
  facing: string;
  areaSqm: number;
  job: string;
  cityName?: string;
  cityNote?: string;
  yongShen?: string[];
  jiShen?: string[];
  faqs: Array<{ question: string; answer: string }>;
};

const FACINGS = ['东', '东南', '南', '西南', '西', '西北', '北', '东北'] as const;

const FACING_ANGLE: Record<(typeof FACINGS)[number], string> = {
  东: '东向接晨光，木气偏旺；核门口是否被楼距压暗，而不是先改朝向。',
  东南: '东南常兼通风与采光，宜保持门厅通透，忌鞋柜封死进风。',
  南: '南向采光通常更稳，核西侧西晒与对楼遮挡，再谈家具。',
  西南: '西南偏土，宜稳不宜堆；入口杂物比朝向本身更伤动线。',
  西: '西向西晒与金属感并存：先遮阳与进深，再谈补气。',
  西北: '西北偏金，宜整洁利落；忌尖角直冲床或收银台。',
  北: '北向采光偏弱，先补稳定光源与通风，不靠改门。',
  东北: '东北偏土，宜厚重收纳；门口高差与暗角比方位口号重要。',
};

const YANG_LAYOUTS: Array<{ layout: string; area: number; job: string; extraKw: string[] }> = [
  { layout: '一室', area: 38, job: '刚需起步', extraKw: ['一室户型风水', '小户型风水'] },
  { layout: '一室一厅', area: 48, job: '单身改善', extraKw: ['一室一厅风水'] },
  { layout: '两室一厅', area: 72, job: '刚需', extraKw: ['两室一厅风水', '刚需户型'] },
  { layout: '两室两厅', area: 88, job: '刚需改善', extraKw: ['两室两厅风水'] },
  { layout: '三室一厅', area: 98, job: '改善', extraKw: ['三室一厅风水', '改善户型'] },
  { layout: '三室两厅', area: 108, job: '改善', extraKw: ['三室两厅风水', '选房子风水'] },
  { layout: '三室两厅两卫', area: 118, job: '改善', extraKw: ['三室两厅风水'] },
  { layout: '四室两厅', area: 136, job: '改善', extraKw: ['四室两厅风水'] },
  { layout: '四室两厅两卫', area: 148, job: '改善', extraKw: ['四室两厅风水'] },
  { layout: '五室两厅', area: 168, job: '大宅', extraKw: ['改善户型'] },
  { layout: '复式', area: 156, job: '复式动线', extraKw: ['复式风水'] },
];

const SHOP_LAYOUTS: Array<{ layout: string; area: number; job: string; extraKw: string[] }> = [
  { layout: '窄面宽深铺', area: 42, job: '临街窄铺', extraKw: ['选铺面', '临街铺'] },
  { layout: '方铺', area: 60, job: '方正铺', extraKw: ['商铺风水'] },
  { layout: '角铺', area: 68, job: '转角铺', extraKw: ['转角铺', '人流量估算'] },
  { layout: '餐饮铺', area: 80, job: '餐饮', extraKw: ['餐饮店风水', '怎么看商铺风水'] },
  { layout: '轻餐饮/咖啡', area: 55, job: '咖啡轻餐', extraKw: ['咖啡店选址'] },
  { layout: '美业小铺', area: 48, job: '美业', extraKw: ['美业店铺风水'] },
  { layout: '中岛档口', area: 18, job: '中岛', extraKw: ['选铺面'] },
  { layout: '双开间', area: 96, job: '双开间', extraKw: ['商铺风水'] },
  { layout: '底商', area: 88, job: '底商', extraKw: ['底商风水'] },
  { layout: '前店后仓', area: 110, job: '前店后仓', extraKw: ['前店后仓'] },
];

const OTHER: Array<{
  domain: LayoutDomain;
  cluster: SpaceSeoCluster;
  layout: string;
  area: number;
  facings: string[];
  extraKw: string[];
}> = [
  { domain: 'office', cluster: 'office', layout: '开放办公', area: 180, facings: ['南', '东', '北'], extraKw: ['办公室风水'] },
  { domain: 'office', cluster: 'office', layout: '隔间办公', area: 140, facings: ['东南', '西'], extraKw: ['办公室风水'] },
  { domain: 'villa', cluster: 'villa', layout: '合院别墅', area: 260, facings: ['南', '东南'], extraKw: ['别墅风水'] },
  { domain: 'villa', cluster: 'villa', layout: '独栋', area: 320, facings: ['南', '西南'], extraKw: ['别墅风水'] },
  { domain: 'rural', cluster: 'rural', layout: '三合院', area: 200, facings: ['南', '东南'], extraKw: ['农村宅基地风水'] },
  { domain: 'rural', cluster: 'rural', layout: '两进宅', area: 180, facings: ['东', '南'], extraKw: ['农村宅基地风水'] },
  { domain: 'apartment', cluster: 'apartment', layout: '高层两室', area: 86, facings: ['南', '北', '西'], extraKw: ['公寓风水'] },
  { domain: 'apartment', cluster: 'apartment', layout: '服务式公寓', area: 52, facings: ['东', '东南'], extraKw: ['公寓风水'] },
];

const CITIES: Array<{ name: string; region: string; note: string; jobs: Array<'选房' | '选铺'> }> = [
  { name: '上海', region: '华东', note: '高密度与楼距压缩采光，南向不等于一定通透。', jobs: ['选房', '选铺'] },
  { name: '北京', region: '华北', note: '南北通透叙事强，核实际开间与冬季日照时数。', jobs: ['选房', '选铺'] },
  { name: '深圳', region: '华南', note: '湿热与高层遮挡并存，通风比贴吉凶标签更先。', jobs: ['选房', '选铺'] },
  { name: '杭州', region: '华东', note: '沿河与高湿，北向与低楼层要先看潮与光。', jobs: ['选房', '选铺'] },
  { name: '广州', region: '华南', note: '骑楼与底商多，人流和进深比门楣装饰重要。', jobs: ['选房', '选铺'] },
  { name: '成都', region: '西南', note: '云量偏多，南向仍要核楼间距。', jobs: ['选房', '选铺'] },
  { name: '南京', region: '华东', note: '冬冷夏热，西晒与北向保温要分开看。', jobs: ['选房'] },
  { name: '武汉', region: '华中', note: '夏热明显，西向铺与西向宅先做遮阳再谈补气。', jobs: ['选房', '选铺'] },
  { name: '苏州', region: '华东', note: '水网与老城巷深，门口对冲比方位口号常见。', jobs: ['选房'] },
  { name: '重庆', region: '西南', note: '坡地高差改变「南向」体感，先核入口台阶与采光。', jobs: ['选房', '选铺'] },
  { name: '西安', region: '西北', note: '干燥与粉尘，北向更要补通风过滤而不是改门。', jobs: ['选房'] },
  { name: '长沙', region: '华中', note: '夏季湿热，餐饮铺油烟动线比门向更先核。', jobs: ['选铺'] },
  { name: '郑州', region: '中原', note: '新盘日照规范参差，以南向为线索核实际窗墙比。', jobs: ['选房'] },
  { name: '青岛', region: '华北沿海', note: '海风与潮湿，北向海景要核结露与通风。', jobs: ['选房'] },
  { name: '天津', region: '华北', note: '冬季风向明显，北向进门先看冷风灌入。', jobs: ['选房'] },
  { name: '厦门', region: '东南沿海', note: '湿热台风季，开口与回风比贴符更先。', jobs: ['选铺'] },
  { name: '合肥', region: '华东', note: '新城区楼距尚可，核心是西晒与电梯厅暗角。', jobs: ['选房'] },
  { name: '福州', region: '东南', note: '湿热多雨，底层与北向先看潮。', jobs: ['选房'] },
  { name: '东莞', region: '珠三角', note: '产业园区通勤长，选房先核西向回家时段西晒。', jobs: ['选房', '选铺'] },
  { name: '佛山', region: '珠三角', note: '镇街底商密，进深与排烟比门楣更先。', jobs: ['选铺'] },
  { name: '无锡', region: '苏南', note: '湖湾湿气，北向与底层先看潮。', jobs: ['选房'] },
  { name: '宁波', region: '浙东', note: '港城风大，西向铺要核风压与遮阳。', jobs: ['选房', '选铺'] },
  { name: '昆明', region: '西南高原', note: '紫外强、日夜温差大，南向仍要核西晒玻璃。', jobs: ['选房'] },
  { name: '济南', region: '华北', note: '冬冷夏热，南北通透叙事要核实际开间。', jobs: ['选房'] },
  { name: '沈阳', region: '东北', note: '采暖季长，北向先看冷风灌入与门斗。', jobs: ['选房'] },
  { name: '大连', region: '东北沿海', note: '海风潮湿，北向海景核结露。', jobs: ['选房'] },
];

const METHOD: Array<Omit<SpaceSeoScenario, 'cluster' | 'domain'> & { job: string }> = [
  {
    slug: 'method-what-is-space-lab',
    title: '空间场是什么：结构观察，不是吉凶标签',
    intent: '空间场',
    keywords: ['空间场', '风水模拟', '风水模拟器免费'],
    angle: '输出光/风/滞留相对读数，服务多案对比，不贴吉凶。',
    layout: '三室两厅',
    facing: '南',
    areaSqm: 108,
    job: '认知',
    faqs: [
      { question: '空间场算不算命？', answer: '不算。它是户型与选址的结构启发式评估。' },
      { question: '和八字什么关系？', answer: '可叠同一套日主用神做人宅合参，不另起宅命。' },
    ],
  },
  {
    slug: 'method-heatmap',
    title: '风水热力图怎么读：峰值、滞留与通道',
    intent: '风水热力图',
    keywords: ['风水热力图', '户型分析'],
    angle: '峰值高不等于宜居；看滞留比与通道比是否同时恶化。',
    layout: '三室两厅',
    facing: '南',
    areaSqm: 108,
    job: '读数',
    faqs: [
      { question: '热力是实测吗？', answer: '不是。网格为相对归一化示意，用于方案对比。' },
    ],
  },
  {
    slug: 'method-openings',
    title: '户型图门窗怎么分析：先动线后方位',
    intent: '户型图门窗怎么分析',
    keywords: ['户型图门窗怎么分析', '户型分析', '户型风水'],
    angle: '一进一出是否成立，比贴八卦宫位更先。',
    layout: '两室两厅',
    facing: '南',
    areaSqm: 88,
    job: '门窗',
    faqs: [{ question: '没有户型图怎么办？', answer: '可先加载预设，再按实际门窗拖点。' }],
  },
  {
    slug: 'method-bagua8',
    title: '八方位叠图怎么用：对照家具，不改承重墙',
    intent: '八方位',
    keywords: ['八方位', '用神方位摆设'],
    angle: '叠图用来核静区与堆物，不作为拆墙依据。',
    layout: '三室两厅',
    facing: '东南',
    areaSqm: 108,
    job: '叠图',
    faqs: [{ question: '一定要改朝向吗？', answer: '不要。多数情况在用神方位补采光与整洁即可。' }],
  },
  {
    slug: 'method-renzhai',
    title: '人宅合参：同一套日主用神，不另起宅命',
    intent: '人宅合参',
    keywords: ['人宅合参', '八字和风水一起看', '用神方位'],
    angle: '用神只叠加建议层，不改几何网格。',
    layout: '三室两厅',
    facing: '南',
    areaSqm: 108,
    job: '人宅',
    yongShen: ['木', '水'],
    jiShen: ['金'],
    faqs: [{ question: '没有命盘能用吗？', answer: '能。先做纯结构评估，排盘后再关联。' }],
  },
  {
    slug: 'method-no-rebuild',
    title: '不改朝向怎么补：用神方位的采光与整洁',
    intent: '不改朝向怎么补',
    keywords: ['不改朝向怎么补', '用神方位摆设', '用神方位'],
    angle: '补的是光、风、收纳，不是改门洞。',
    layout: '两室一厅',
    facing: '西',
    areaSqm: 78,
    job: '补益',
    yongShen: ['木'],
    jiShen: ['金'],
    faqs: [{ question: '西向一定差吗？', answer: '西向先处理西晒与进深，不是判死刑。' }],
  },
  {
    slug: 'method-traffic-first',
    title: '人流和风水哪个先看：铺面先结构密度再方位',
    intent: '人流和风水哪个先看',
    keywords: ['人流和风水哪个先看', '人流量估算', '选铺面'],
    angle: '没有过店密度，门向吉祥话无法兑现。',
    layout: '餐饮铺',
    facing: '南',
    areaSqm: 80,
    job: '人流优先',
    faqs: [{ question: '人流是摄像头数据吗？', answer: '不是。结合地址语义与周边设施密度做对比指数。' }],
  },
  {
    slug: 'method-vs-shop-simulator',
    title: '空间场和商铺五行快测有什么差别',
    intent: '风水模拟器免费',
    keywords: ['风水模拟器免费', '商铺风水', '空间场'],
    angle: '快测看行业·店名·色彩；工作台看户型·热力·选址人流。',
    layout: '方铺',
    facing: '东南',
    areaSqm: 60,
    job: '对比工具',
    faqs: [{ question: '要先做哪个？', answer: '有店名行业先快测；要比户型或区位用空间场。' }],
  },
  {
    slug: 'method-site-advisor',
    title: '选址顾问怎么用：多案对比而不是单点吉凶',
    intent: '选址顾问',
    keywords: ['选址顾问', '风水选址', '选铺面'],
    angle: '分数用于排序短板，不构成置业意见。',
    layout: '角铺',
    facing: '东',
    areaSqm: 68,
    job: '选址',
    faqs: [{ question: '可以比几个点？', answer: '建议 2–6 个候选，同一目的下比。' }],
  },
  {
    slug: 'method-light-wind',
    title: '采光通风怎么看：通道比比宫位口号重要',
    intent: '采光通风',
    keywords: ['采光通风', '户型风水', '南向户型'],
    angle: '对楼遮挡会让南向失效，先看窗墙与进深。',
    layout: '三室一厅',
    facing: '南',
    areaSqm: 98,
    job: '光风',
    faqs: [{ question: '没有西窗怎么办？', answer: '用稳定人工光与南北对流，不必硬开窗。' }],
  },
  {
    slug: 'method-bedroom',
    title: '主卧宜靠哪：静区优先，忌神侧少堆电器',
    intent: '主卧方位',
    keywords: ['主卧方位', '人宅合参', '用神方位'],
    angle: '主卧先求夜眠稳定，再叠加用神方位。',
    layout: '三室两厅',
    facing: '南',
    areaSqm: 108,
    job: '主卧',
    yongShen: ['水'],
    jiShen: ['火'],
    faqs: [{ question: '主卧必须在用神位吗？', answer: '优先安静与通风；用神位是加分不是强制。' }],
  },
  {
    slug: 'method-west-sun',
    title: '西晒户型先遮阳再谈风水补益',
    intent: '西晒户型',
    keywords: ['西晒户型', '西向户型', '大门朝向'],
    angle: '西晒是物理问题，先遮阳进深，再谈金气。',
    layout: '两室两厅',
    facing: '西',
    areaSqm: 90,
    job: '西晒',
    faqs: [{ question: '西向能买吗？', answer: '能，只要遮阳、进深与睡眠区不在西晒轴上。' }],
  },
  {
    slug: 'method-south-door',
    title: '大门朝南不等于一定接气',
    intent: '大门朝南',
    keywords: ['大门朝南', '南向户型', '大门朝向'],
    angle: '南门被影壁、高差或暗厅抵消时，读数会跌。',
    layout: '三室两厅',
    facing: '南',
    areaSqm: 110,
    job: '南门',
    faqs: [{ question: '要不要改门？', answer: '先改门厅堆物与采光，改门是最后一步。' }],
  },
  {
    slug: 'method-east-door',
    title: '大门朝东：晨光与木气，核楼距',
    intent: '大门朝东',
    keywords: ['大门朝东', '东向户型', '大门朝向'],
    angle: '东向怕被前楼压暗，不怕「东」这个字本身。',
    layout: '两室一厅',
    facing: '东',
    areaSqm: 76,
    job: '东门',
    faqs: [{ question: '东向适合谁？', answer: '需要晨光与通风的刚需户，仍要核楼距。' }],
  },
  {
    slug: 'method-yinzhai-boundary',
    title: '阴宅模式边界：结构维，不替代殡葬规划',
    intent: '阴宅风水',
    keywords: ['阴宅风水', '穴位选址'],
    angle: '只评估清静、后靠、明堂与可达，遵守地方殡葬规划。',
    layout: '单穴',
    facing: '南',
    areaSqm: 4,
    job: '阴宅边界',
    faqs: [{ question: '能指定吉穴吗？', answer: '不能。本工具不做吉凶点穴，只给结构对照。' }],
  },
  {
    slug: 'method-first-home',
    title: '刚需怎么用空间场：先排除滞留与暗厅',
    intent: '刚需户型',
    keywords: ['刚需户型', '选房子风水', '两室一厅风水'],
    angle: '刚需先淘汰暗厅与对流失败，再比南向溢价。',
    layout: '两室一厅',
    facing: '南',
    areaSqm: 72,
    job: '刚需',
    faqs: [{ question: '刚需必须南向吗？', answer: '不是。东南与东向常更均衡，看楼距。' }],
  },
  {
    slug: 'method-upgrade-home',
    title: '改善型怎么比：静区与动线分开打分',
    intent: '改善户型',
    keywords: ['改善户型', '三室两厅风水', '选房子风水'],
    angle: '改善看主卧是否离开动线，而不是只比面积。',
    layout: '三室两厅两卫',
    facing: '东南',
    areaSqm: 118,
    job: '改善',
    faqs: [{ question: '多一卫一定更好？', answer: '要看湿区是否切回睡眠区。' }],
  },
  {
    slug: 'method-street-traffic',
    title: '临街铺人流估算怎么读',
    intent: '人流量估算',
    keywords: ['人流量估算', '临街铺', '选铺面'],
    angle: '指数用于候选排序，不是运营商实测客流。',
    layout: '窄面宽深铺',
    facing: '南',
    areaSqm: 42,
    job: '人流',
    faqs: [{ question: '周末和周中差多少？', answer: '工具给相对分时曲线，用于对比而不是绝对值。' }],
  },
];

const SLUG_TOKEN: Record<string, string> = {
  东: 'east',
  东南: 'se',
  南: 'south',
  西南: 'sw',
  西: 'west',
  西北: 'nw',
  北: 'north',
  东北: 'ne',
  一室: '1room',
  一室一厅: '1b1l',
  两室一厅: '2b1l',
  两室两厅: '2b2l',
  三室一厅: '3b1l',
  三室两厅: '3b2l',
  三室两厅两卫: '3b2l2ba',
  四室两厅: '4b2l',
  四室两厅两卫: '4b2l2ba',
  五室两厅: '5b2l',
  复式: 'duplex',
  窄面宽深铺: 'shop-narrow',
  方铺: 'shop-square',
  角铺: 'shop-corner',
  餐饮铺: 'shop-food',
  '轻餐饮/咖啡': 'shop-cafe',
  美业小铺: 'shop-beauty',
  中岛档口: 'shop-kiosk',
  双开间: 'shop-double',
  底商: 'shop-street',
  前店后仓: 'shop-backstock',
  开放办公: 'office-open',
  隔间办公: 'office-room',
  合院别墅: 'villa-court',
  独栋: 'villa-single',
  三合院: 'rural-sanhe',
  两进宅: 'rural-two',
  高层两室: 'apt-2b',
  服务式公寓: 'apt-serviced',
  单穴: 'tomb-single',
  双穴并排: 'tomb-double',
  家族三穴: 'tomb-family',
  草坪葬: 'tomb-lawn',
  刚需起步: 'starter',
  单身改善: 'solo',
  刚需: 'first-home',
  刚需改善: 'step-up',
  改善: 'upgrade',
  大宅: 'large',
  复式动线: 'duplex-flow',
  临街窄铺: 'street-narrow',
  方正铺: 'square',
  转角铺: 'corner',
  餐饮: 'food',
  咖啡轻餐: 'cafe',
  美业: 'beauty',
  中岛: 'kiosk',
  双开间: 'double-bay',
  底商: 'street-shop',
  前店后仓: 'front-back',
  选房: 'home',
  选铺: 'shop',
  同气: 'match',
  错位: 'mismatch',
  面积对照: 'area',
  阴宅结构: 'tomb',
  木: 'wood',
  火: 'fire',
  土: 'earth',
  金: 'metal',
  水: 'water',
  上海: 'shanghai',
  北京: 'beijing',
  深圳: 'shenzhen',
  杭州: 'hangzhou',
  广州: 'guangzhou',
  成都: 'chengdu',
  南京: 'nanjing',
  武汉: 'wuhan',
  苏州: 'suzhou',
  重庆: 'chongqing',
  西安: 'xian',
  长沙: 'changsha',
  郑州: 'zhengzhou',
  青岛: 'qingdao',
  天津: 'tianjin',
  厦门: 'xiamen',
  合肥: 'hefei',
  福州: 'fuzhou',
  东莞: 'dongguan',
  佛山: 'foshan',
  无锡: 'wuxi',
  宁波: 'ningbo',
  昆明: 'kunming',
  济南: 'jinan',
  沈阳: 'shenyang',
  大连: 'dalian',
};

function slugify(parts: string[]) {
  return parts
    .map((p) => {
      const raw = `${p}`.trim();
      if (SLUG_TOKEN[raw]) return SLUG_TOKEN[raw];
      const ascii = raw
        .toLowerCase()
        .replace(/[／/]/g, '-')
        .replace(/[^a-z0-9-]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
      return ascii || 'x';
    })
    .filter((p) => p && p !== 'x')
    .join('-')
    .slice(0, 80);
}

function facingFaq(facing: string): Array<{ question: string; answer: string }> {
  return [
    {
      question: `${facing}向一定好或一定差吗？`,
      answer: `不。${facing}向先核采光、遮挡与进深；方位只是线索。`,
    },
    {
      question: '要不要改大门？',
      answer: '先整理入口与通风。改门涉及结构与物业，不是第一动作。',
    },
  ];
}

let CACHED: SpaceSeoScenario[] | null = null;

export function listSpaceSeoScenarios(): SpaceSeoScenario[] {
  if (CACHED) return CACHED;
  const out: SpaceSeoScenario[] = [];
  const seen = new Set<string>();

  const push = (s: SpaceSeoScenario) => {
    if (seen.has(s.slug)) return;
    seen.add(s.slug);
    out.push(s);
  };

  for (const m of METHOD) {
    push({
      ...m,
      cluster: m.job === '阴宅边界' ? 'yinzhai' : 'method',
      domain: m.job === '阴宅边界' ? 'tomb' : m.layout.includes('铺') ? 'shop' : 'residential',
    });
  }

  for (const row of YANG_LAYOUTS) {
    for (const facing of FACINGS) {
      push({
        slug: slugify(['yang', row.layout, facing, row.job]),
        cluster: 'yangzhai',
        title: `${row.layout}${facing}向${row.job}：户型结构怎么看`,
        intent: `${row.layout}风水`,
        keywords: [...row.extraKw, `${facing}向户型`, '阳宅风水', '户型风水', '大门朝向'],
        angle: `${row.layout} · ${row.job}。${FACING_ANGLE[facing]}`,
        domain: 'residential',
        layout: row.layout,
        facing,
        areaSqm: row.area,
        job: row.job,
        faqs: facingFaq(facing),
      });
    }
  }

  const shopFacings = ['东', '东南', '南', '西', '西北'] as const;
  for (const row of SHOP_LAYOUTS) {
    for (const facing of shopFacings) {
      push({
        slug: slugify(['shop', row.layout, facing, row.job]),
        cluster: 'shop',
        title: `${row.layout}朝${facing}：选铺结构与人流怎么对照`,
        intent: row.extraKw[0] || '商铺风水',
        keywords: [...row.extraKw, '商铺风水', '选铺面', `${facing}向`],
        angle: `${row.job}铺面。${FACING_ANGLE[facing]} 铺面还要核临街与进深。`,
        domain: 'shop',
        layout: row.layout,
        facing,
        areaSqm: row.area,
        job: row.job,
        faqs: facingFaq(facing),
      });
    }
  }

  for (const row of OTHER) {
    for (const facing of row.facings) {
      push({
        slug: slugify([row.cluster, row.layout, facing]),
        cluster: row.cluster,
        title: `${row.layout}朝${facing}：${row.extraKw[0] || '结构'}怎么看`,
        intent: row.extraKw[0] || row.layout,
        keywords: [...row.extraKw, `${facing}向`, '空间场'],
        angle: `${row.layout}。${FACING_ANGLE[facing as (typeof FACINGS)[number]] || '先核光风动线。'}`,
        domain: row.domain,
        layout: row.layout,
        facing,
        areaSqm: row.area,
        job: row.cluster,
        faqs: facingFaq(facing),
      });
    }
  }

  const tombForms = [
    { layout: '单穴', facing: ['南', '东南'] },
    { layout: '双穴并排', facing: ['南', '东'] },
    { layout: '家族三穴', facing: ['东南'] },
    { layout: '草坪葬', facing: ['南'] },
  ];
  for (const t of tombForms) {
    for (const facing of t.facing) {
      push({
        slug: slugify(['tomb', t.layout, facing]),
        cluster: 'yinzhai',
        title: `${t.layout}朝${facing}：阴宅结构维（非点穴）`,
        intent: '穴位选址',
        keywords: ['阴宅风水', '穴位选址'],
        angle: '只看清静、后靠、明堂开阔与祭扫可达，遵守地方殡葬规划。',
        domain: 'tomb',
        layout: t.layout,
        facing,
        areaSqm: 6,
        job: '阴宅结构',
        faqs: [
          { question: '这是吉穴断法吗？', answer: '不是。仅结构对照，不替代殡葬规划与现场。' },
        ],
      });
    }
  }

  for (const city of CITIES) {
    for (const job of city.jobs) {
      const shop = job === '选铺';
      push({
        slug: slugify(['city', city.name, job]),
        cluster: 'city',
        title: shop
          ? `${city.name}选铺：人流密度与门向怎么一起看`
          : `${city.name}选房：楼距、朝向与户型结构`,
        intent: shop ? `${city.name}选铺` : `${city.name}买房风水`,
        keywords: shop
          ? [`${city.name}选铺`, `${city.name}商铺`, '选铺面', '人流量估算']
          : [`${city.name}买房风水`, `${city.name}选房`, '选房子风水', '户型风水'],
        angle: `${city.region} · ${city.note}`,
        domain: shop ? 'shop' : 'residential',
        layout: shop ? '餐饮铺' : '三室两厅',
        facing: '南',
        areaSqm: shop ? 72 : 108,
        job,
        cityName: city.name,
        cityNote: city.note,
        faqs: [
          {
            question: `${city.name}一定要南向吗？`,
            answer: `不必。${city.note} 以南向为线索，不以口号成交。`,
          },
          {
            question: '会公开我的门牌吗？',
            answer: '公开内容只用城市级观察，不含精确门牌。',
          },
        ],
      });
    }
  }

  const areaVariants: Array<{ layout: string; facing: string; area: number; job: string }> = [];
  for (const layout of ['两室一厅', '两室两厅', '三室两厅'] as const) {
    for (const facing of ['南', '东南', '东', '西'] as const) {
      areaVariants.push({
        layout,
        facing,
        area: layout === '三室两厅' ? 128 : 96,
        job: '面积对照',
      });
    }
  }
  for (const row of areaVariants) {
    push({
      slug: slugify(['yang', row.layout, row.facing, `${row.area}sqm`]),
      cluster: 'yangzhai',
      title: `${row.layout}朝${row.facing}约${row.area}㎡：面积加大后动线怎么变`,
      intent: `${row.layout}风水`,
      keywords: [`${row.layout}风水`, `${row.facing}向户型`, '改善户型'],
      angle: `同布局放大到约${row.area}㎡时，先看通道比是否被多一间房切碎，而不是只比总价。`,
      domain: 'residential',
      layout: row.layout,
      facing: row.facing,
      areaSqm: row.area,
      job: row.job,
      faqs: facingFaq(row.facing),
    });
  }

  const elements: Array<{ el: string; facing: string; clash: string }> = [
    { el: '木', facing: '东', clash: '西' },
    { el: '火', facing: '南', clash: '北' },
    { el: '土', facing: '西南', clash: '北' },
    { el: '金', facing: '西', clash: '东' },
    { el: '水', facing: '北', clash: '南' },
  ];
  for (const e of elements) {
    push({
      slug: slugify(['renzhai', 'yong', e.el, e.facing]),
      cluster: 'renzhai',
      title: `用神${e.el}：入口朝${e.facing}的人宅合参`,
      intent: '用神方位',
      keywords: ['用神方位', '人宅合参', '八字和风水一起看', `${e.facing}向户型`],
      angle: `示例盘用神${e.el}，入口同气时谈接气，仍不改墙。`,
      domain: 'residential',
      layout: '三室两厅',
      facing: e.facing,
      areaSqm: 108,
      job: '同气',
      yongShen: [e.el],
      faqs: facingFaq(e.facing),
    });
    push({
      slug: slugify(['renzhai', 'mismatch', e.el, e.clash]),
      cluster: 'renzhai',
      title: `用神${e.el}但大门朝${e.clash}：先补哪一侧`,
      intent: '用神方位摆设',
      keywords: ['用神方位摆设', '不改朝向怎么补', '人宅合参'],
      angle: `错位时在${e.el}对应方位补光与整洁，不强制改${e.clash}门。`,
      domain: 'residential',
      layout: '两室两厅',
      facing: e.clash,
      areaSqm: 90,
      job: '错位',
      yongShen: [e.el],
      jiShen: e.el === '木' ? ['金'] : e.el === '金' ? ['火'] : ['木'],
      faqs: facingFaq(e.clash),
    });
  }

  CACHED = out;
  return out;
}

export function getSpaceSeoScenario(slug: string): SpaceSeoScenario | null {
  return listSpaceSeoScenarios().find((s) => s.slug === slug) || null;
}

export function listSpaceSeoClusters(): Array<{
  cluster: SpaceSeoCluster;
  title: string;
  items: SpaceSeoScenario[];
}> {
  const titles: Record<SpaceSeoCluster, string> = {
    method: '方法与读数',
    yangzhai: '阳宅户型',
    shop: '铺面选址',
    office: '办公',
    villa: '别墅',
    rural: '宅基地',
    apartment: '公寓',
    yinzhai: '阴宅结构（教学）',
    city: '城市观察',
    renzhai: '人宅合参',
  };
  const groups = new Map<SpaceSeoCluster, SpaceSeoScenario[]>();
  for (const s of listSpaceSeoScenarios()) {
    const list = groups.get(s.cluster) || [];
    list.push(s);
    groups.set(s.cluster, list);
  }
  return (Object.keys(titles) as SpaceSeoCluster[])
    .map((cluster) => ({ cluster, title: titles[cluster], items: groups.get(cluster) || [] }))
    .filter((g) => g.items.length);
}
