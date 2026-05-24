// v5-D82 命理百科二期：24 节气 + 紫微 14 主星 + 64 卦基础 + 12 月将
// = 24 + 14 + 64 + 12 = 114 词条
//
// 用法: npx tsx scripts/content/llm-encyclopedia-2.ts [type?]
//   type: jieqi | ziwei | gua | yuejiang | all（默认 all）

import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd());

import OpenAI from 'openai';
import { saveManagedContentEntry } from '@/lib/content-store';
import { getApiBaseUrl, getApiKey } from '@/lib/env';
import { getModelFallbackChain } from '@/lib/llm-model-fallback';

const ONLY = process.argv[2] || 'all';
const CONCURRENCY = Math.max(1, Math.min(50, Number(process.env.FORUM_LLM_CONCURRENCY) || 50));

interface Entry {
  type: 'jieqi' | 'ziwei' | 'gua' | 'yuejiang';
  name: string;
  fact: string;
  slug: string;
  category: string;
}

// ============== 24 节气 ==============
const JIEQI: Array<[string, string]> = [
  ['立春', '春季首个节气，干支月建寅，太阳黄经 315°，每年 2 月 3-5 日左右；万物始生，命理上是新一年八字的真正起点'],
  ['雨水', '春季第二节气，月建寅，太阳黄经 330°，2 月 18-20 日；雪转雨，土气滋润，地支寅最旺'],
  ['惊蛰', '春季第三节气，月建卯，太阳黄经 345°，3 月 5-7 日；春雷启蛰，木气进入卯月最旺'],
  ['春分', '春季第四节气，月建卯，太阳黄经 0°，3 月 20-22 日；昼夜均分，阴阳平衡'],
  ['清明', '春季第五节气，月建辰，太阳黄经 15°，4 月 4-6 日；木气衰、土气墓，杂气月'],
  ['谷雨', '春季最后节气，月建辰，太阳黄经 30°，4 月 19-21 日；雨润百谷，木入墓库'],
  ['立夏', '夏季首个节气，月建巳，太阳黄经 45°，5 月 5-7 日；火气始旺，巳中藏丙、戊、庚'],
  ['小满', '夏季第二节气，月建巳，太阳黄经 60°，5 月 20-22 日；麦穗渐满'],
  ['芒种', '夏季第三节气，月建午，太阳黄经 75°，6 月 5-7 日；火气进入午月顶峰'],
  ['夏至', '夏季第四节气，月建午，太阳黄经 90°，6 月 21-22 日；日最长，阳极转阴'],
  ['小暑', '夏季第五节气，月建未，太阳黄经 105°，7 月 6-8 日；火土相生，未月燥土'],
  ['大暑', '夏季最后节气，月建未，太阳黄经 120°，7 月 22-24 日；火入墓，三伏天'],
  ['立秋', '秋季首个节气，月建申，太阳黄经 135°，8 月 7-9 日；金气始旺，申中藏庚、壬、戊'],
  ['处暑', '秋季第二节气，月建申，太阳黄经 150°，8 月 22-24 日；暑气止'],
  ['白露', '秋季第三节气，月建酉，太阳黄经 165°，9 月 7-9 日；金气进入酉月顶峰'],
  ['秋分', '秋季第四节气，月建酉，太阳黄经 180°，9 月 22-24 日；昼夜再次均分'],
  ['寒露', '秋季第五节气，月建戌，太阳黄经 195°，10 月 8-9 日；金入墓，戌为火库'],
  ['霜降', '秋季最后节气，月建戌，太阳黄经 210°，10 月 23-24 日；霜始降，水气渐盛'],
  ['立冬', '冬季首个节气，月建亥，太阳黄经 225°，11 月 7-8 日；水气始旺，亥中藏壬、甲'],
  ['小雪', '冬季第二节气，月建亥，太阳黄经 240°，11 月 22-23 日；初雪'],
  ['大雪', '冬季第三节气，月建子，太阳黄经 255°，12 月 6-8 日；水气进入子月顶峰'],
  ['冬至', '冬季第四节气，月建子，太阳黄经 270°，12 月 21-23 日；夜最长，一阳复始'],
  ['小寒', '冬季第五节气，月建丑，太阳黄经 285°，1 月 5-7 日；水入墓，丑为湿土'],
  ['大寒', '冬季最后节气，月建丑，太阳黄经 300°，1 月 20-21 日；冷之极'],
];

// ============== 紫微 14 主星 ==============
const ZIWEI: Array<[string, string]> = [
  ['紫微', '北斗主星，五行阴土，化气曰尊；为帝王星，主权贵、领导、孤高；性格端正稳重，但易孤独'],
  ['天机', '南北斗化吉，五行阴木，化气曰善；为兄弟星、智慧星；主聪明、机变、善于谋划，宜动不宜静'],
  ['太阳', '中天主星，五行阳火，化气曰贵；为父星、官禄星；主光明、博爱、男命利父运'],
  ['武曲', '北斗第六星，五行阴金，化气曰财；为财帛主星；主刚毅、决断、擅理财，但易过于刚硬'],
  ['天同', '南斗第四星，五行阳水，化气曰福；为福德主星；主温和、享受、好饮食娱乐'],
  ['廉贞', '北斗第五星，五行阴火，化气曰囚；为次桃花、官非星；性格强烈，吉凶反差极大'],
  ['天府', '南斗主星，五行阳土，化气曰库；为禄库星；主稳重、富足、保守，宜守不宜攻'],
  ['太阴', '中天主星，五行阴水，化气曰富；为母星、田宅主；主温柔、内敛、文艺，女命主夫'],
  ['贪狼', '北斗第一星，五行阳木阴水，化气曰桃花；为正桃花、欲望星；主多才多艺，亦主酒色'],
  ['巨门', '北斗第二星，五行阴水，化气曰暗；为口舌、是非星；主口才、辩才，但易招口舌'],
  ['天相', '南斗第五星，五行阳水，化气曰印；为印星、官禄；主稳重、辅佐型人才'],
  ['天梁', '南斗第二星，五行阳土，化气曰荫；为父母、寿星；主慈悲、长寿、年长解难'],
  ['七杀', '南斗第六星，五行阴金，化气曰将；为将星、肃杀星；主刚毅、独立、易经历起伏'],
  ['破军', '北斗第七星，五行阴水，化气曰耗；为耗星、变动星；主开创、破旧立新，但易破财'],
];

// ============== 64 卦（先天八卦序）==============
const GUA_64: string[] = [
  '乾为天', '坤为地', '水雷屯', '山水蒙', '水天需', '天水讼', '地水师', '水地比',
  '风天小畜', '天泽履', '地天泰', '天地否', '天火同人', '火天大有', '地山谦', '雷地豫',
  '泽雷随', '山风蛊', '地泽临', '风地观', '火雷噬嗑', '山火贲', '山地剥', '地雷复',
  '天雷无妄', '山天大畜', '山雷颐', '泽风大过', '坎为水', '离为火',
  '泽山咸', '雷风恒', '天山遁', '雷天大壮', '火地晋', '地火明夷', '风火家人', '火泽睽',
  '水山蹇', '雷水解', '山泽损', '风雷益', '泽天夬', '天风姤', '泽地萃', '地风升',
  '泽水困', '水风井', '泽火革', '火风鼎', '震为雷', '艮为山', '风山渐', '雷泽归妹',
  '雷火丰', '火山旅', '巽为风', '兑为泽', '风水涣', '水泽节', '风泽中孚', '雷山小过',
  '水火既济', '火水未济',
];

// 64 卦简明卦义（每卦核心象意）
const GUA_MEANING: Record<string, string> = {
  '乾为天': '乾下乾上，纯阳之卦；象天健行；主刚健、领导、自强不息；问事通达；忌过刚则折',
  '坤为地': '坤下坤上，纯阴之卦；象地承载；主柔顺、包容、厚德载物；宜守不宜攻；忌迷失方向',
  '水雷屯': '震下坎上；屯者难也，初生之难；主创业、积累、艰难起步；宜守正待时；忌冒进',
  '山水蒙': '坎下艮上；蒙者昧也，启蒙未开；主学习、教育、求师；宜虚心受教；忌固执',
  '水天需': '乾下坎上；需者待也，前有险阻；主等待、忍耐、需要时机；宜诚信守候；忌焦躁',
  '天水讼': '坎下乾上；讼者争也，争讼不和；主纠纷、官司、口舌；宜中止；忌强求',
  '地水师': '坎下坤上；师者众也，兵众所聚；主团队、统帅、纪律；宜以正治军；忌私心',
  '水地比': '坤下坎上；比者亲也，亲密辅助；主合作、亲近、辅佐；宜诚信相亲；忌迟疑',
  '风天小畜': '乾下巽上；以柔畜刚，小有积蓄；主小有进展、积累不大；宜储备；忌大动作',
  '天泽履': '兑下乾上；履者礼也，履道而行；主行止、礼制、谨慎；宜守正；忌冒险',
  '地天泰': '乾下坤上；天地交而万物通；主通达、和顺、上下交泰；事业大吉；忌骄傲',
  '天地否': '坤下乾上；天地不交，闭塞不通；主闭塞、不顺、孤立；宜守俭；忌强为',
  '天火同人': '离下乾上；同心同德，与人同；主合作、同志、聚众；宜公正；忌私党',
  '火天大有': '乾下离上；柔得尊位，大有所获；主丰盛、富有、明察；宜慷慨；忌自满',
  '地山谦': '艮下坤上；山在地下，谦卑自持；主谦虚、低调、有终；事事吉；忌虚伪',
  '雷地豫': '坤下震上；雷出地奋，悦豫和顺；主安乐、欢愉、顺畅；宜适度；忌过乐失警',
  '泽雷随': '震下兑上；动而悦随，随时变易；主跟随、顺应、灵活；宜择善而从；忌盲随',
  '山风蛊': '巽下艮上；蛊者事也，整治弊病；主整顿、改革、除弊；宜大刀阔斧；忌纵容',
  '地泽临': '兑下坤上；临者大也，居高临下；主接近、监督、施惠；宜诚意；忌权压',
  '风地观': '坤下巽上；风行地上，观察省视；主观察、反省、教化；宜静观；忌浅看',
  '火雷噬嗑': '震下离上；颐中有物，啮而合之；主断狱、明察、刚柔并用；宜强制执行；忌姑息',
  '山火贲': '离下艮上；贲者饰也，文饰之美；主修饰、文采、美化；宜文明礼仪；忌外强中干',
  '山地剥': '坤下艮上；剥者落也，剥落之时；主剥蚀、衰败、防小人；宜静守；忌逆势',
  '地雷复': '震下坤上；一阳来复，反复其道；主复兴、回归、新生；时机将至；忌急躁',
  '天雷无妄': '震下乾上；动以天行，无虚伪妄；主真诚、不妄动、守正；宜诚意；忌不实',
  '山天大畜': '乾下艮上；大畜大有积蓄；主大量积累、贤德储备；宜蓄养德行；忌仓促',
  '山雷颐': '震下艮上；颐者养也，养身养德；主饮食、养生、修养；宜节制；忌贪欲',
  '泽风大过': '巽下兑上；过者超也，大有过度；主非常时期、超常手段；宜临危果断；忌一意孤行',
  '坎为水': '坎下坎上，重险重难；主险难、危机、深陷；宜坚守诚信；忌投机',
  '离为火': '离下离上，明明相继；主光明、附丽、文明；宜明察；忌过明炽烈',
  '泽山咸': '艮下兑上；咸者感也，男女相感；主感应、恋爱、初动；宜真诚相感；忌轻浮',
  '雷风恒': '巽下震上；恒者久也，长久之道；主持久、恒心、夫妻之道；宜守常；忌善变',
  '天山遁': '艮下乾上；遁者退也，退避之时；主隐退、避让、保身；宜知进退；忌恋栈',
  '雷天大壮': '乾下震上；大者壮也，刚动盛大；主强壮、激进、刚力；宜守正；忌过刚',
  '火地晋': '坤下离上；晋者进也，明出地上；主上进、晋升、显达；宜柔顺前进；忌争强',
  '地火明夷': '离下坤上；明入地中，光被遮蔽；主受困、晦藏、智者守愚；宜韬光养晦；忌锋芒',
  '风火家人': '离下巽上；家人之道，正家而后正天下；主家庭、和睦、内务；宜正家；忌私心',
  '火泽睽': '兑下离上；睽者乖也，乖违不合；主分歧、矛盾、异中求同；宜小事可成；忌强求大同',
  '水山蹇': '艮下坎上；蹇者难也，足跛行难；主险阻、艰难、有所止；宜西南方利；忌东北',
  '雷水解': '坎下震上；解者缓也，险难得解；主解放、宽缓、出险境；宜西南方利；忌迟疑',
  '山泽损': '兑下艮上；损下益上，损己利人；主减损、自我节制；宜减奢侈；忌损得不当',
  '风雷益': '震下巽上；损上益下，益民利下；主增益、布施、扩展；宜利益众生；忌索取',
  '泽天夬': '乾下兑上；夬者决也，决而去之；主决断、果决、清除；宜坚决；忌优柔',
  '天风姤': '巽下乾上；姤者遇也，柔遇刚；主邂逅、不期而遇、警惕；宜防微杜渐；忌轻信',
  '泽地萃': '坤下兑上；萃者聚也，聚众和悦；主聚集、相会、众心所归；宜诚敬；忌散漫',
  '地风升': '巽下坤上；升者上也，柔以时升；主上升、晋升、稳步发展；宜南行；忌冒进',
  '泽水困': '坎下兑上；困者穷也，刚揜于柔；主困窘、贫穷、被困；宜守正自处；忌妄动',
  '水风井': '巽下坎上；井者静也，养而不穷；主滋养、稳定、效法井德；宜守常；忌枯井',
  '泽火革': '离下兑上；革者改也，去故鼎新；主变革、改朝换代；宜大变；忌守旧',
  '火风鼎': '巽下离上；鼎者器也，烹饪定位；主新立、稳定、奉献；宜尊礼；忌轻浮',
  '震为雷': '震下震上，重雷震动；主震惊、激发、动作；宜恐惧修省；忌惊慌',
  '艮为山': '艮下艮上，重山静止；主止、静、思考；宜止其当止；忌僵化',
  '风山渐': '艮下巽上；渐者进也，循序渐进；主婚姻、缓慢前进；宜稳步；忌跳跃',
  '雷泽归妹': '兑下震上；归妹者女子归也；主婚嫁、归宿；宜安守本分；忌乱伦',
  '雷火丰': '离下震上；丰者大也，盛大丰满；主盛极、明动相济；宜把握当下；忌物极必反',
  '火山旅': '艮下离上；旅者客也，客居在外；主旅行、迁移、寄居；宜柔顺；忌独行',
  '巽为风': '巽下巽上，重巽随风；主随顺、无孔不入、商旅；宜顺势；忌优柔',
  '兑为泽': '兑下兑上，丽泽相滋；主喜悦、口才、朋友；宜以朋友讲习；忌口舌',
  '风水涣': '坎下巽上；涣者散也，风行水上；主分散、涣然冰释；宜以散济险；忌四散无归',
  '水泽节': '兑下坎上；节者止也，节制有度；主节制、节俭、节义；宜守节；忌过苦',
  '风泽中孚': '兑下巽上；中孚者诚信内充；主诚信、感化、心心相印；宜以诚相待；忌伪饰',
  '雷山小过': '艮下震上；小过者小有过越；主小事可过、大事谨慎；宜柔过刚；忌大动',
  '水火既济': '离下坎上；水火相济，事已成；主成功、调和、戒满；宜守成；忌乱动',
  '火水未济': '坎下离上；火水未成，事未济；主未成、努力、有可为；宜审慎前行；忌骄躁',
};

// ============== 12 月将（建除十二神 / 将星）==============
const YUEJIANG: Array<[string, string]> = [
  ['建', '十二建除之首；月建神，主开创、领导；适合开始新事；忌动土、移徙'],
  ['除', '除旧布新之神；主清扫、解除、医病；宜祭祀、解除；忌嫁娶、入宅'],
  ['满', '丰满圆满之神；主积累、丰收；宜祈福、纳财；忌服药、争讼'],
  ['平', '平稳均衡之神；主公平、稳定；宜修造、上任；忌嫁娶'],
  ['定', '安定持守之神；主稳定、决定；宜立约、定礼；忌出行、医疗'],
  ['执', '执行守恒之神；主把持、执行、忠贞；宜立卷、嫁娶；忌迁徙'],
  ['破', '冲破破坏之神；主大凶、破除；除拆旧、寻仇外百事忌'],
  ['危', '危险高处之神；主谨慎、自省、宜静；宜安神、修造；忌乘船、登高'],
  ['成', '完成圆满之神；万事吉，所谋皆成；宜婚嫁、入学、开业'],
  ['收', '收获收纳之神；主聚财、纳福；宜进人口、纳财；忌出行、放贷'],
  ['开', '开展开放之神；主开通、文教；宜开市、修造、入学；忌动土、丧礼'],
  ['闭', '闭合收藏之神；主收藏、归休；宜筑堤、修补；忌开市、远行'],
];

function jieqiFact(name: string, desc: string): string {
  return [
    `节气名称：${name}`,
    `节气说明：${desc}`,
    '节气是 24 等分的太阳黄道，是命理排月柱、起大运的真正分界（公历日期会浮动 1-2 天）',
    '在八字中，月柱以节气切换为准，不以农历初一为准',
  ].join('\n');
}

function ziweiFact(name: string, desc: string): string {
  return [
    `紫微主星：${name}`,
    `星曜性质：${desc}`,
    '紫微斗数 14 主星各居十二宫位时，结合化禄/化权/化科/化忌四化决定吉凶',
    '主星与辅星（左辅右弼/文昌文曲/天魁天钺等）配合，构成完整命盘格局',
  ].join('\n');
}

function guaFact(name: string): string {
  const meaning = GUA_MEANING[name] || '64 卦之一';
  return [
    `卦名：${name}`,
    `卦义：${meaning}`,
    '64 卦由 8 经卦两两叠合而成，每卦 6 爻，从下往上为初爻至上爻',
    '占卜应用：六爻法以世应、用神、生克为判断核心；梅花易数以体用之间生克定吉凶',
  ].join('\n');
}

function yuejiangFact(name: string, desc: string): string {
  return [
    `建除神：${name}`,
    `性质：${desc}`,
    '建除十二神是中国传统择日体系的核心，每天对应其中一神',
    '使用方法：根据当日的建除神查宜忌，配合日干支与本人八字综合判断',
  ].join('\n');
}

function buildEntries(): Entry[] {
  const out: Entry[] = [];
  if (ONLY === 'all' || ONLY === 'jieqi') {
    for (const [name, desc] of JIEQI) {
      out.push({ type: 'jieqi', name, fact: jieqiFact(name, desc), slug: `jieqi-${encodeURIComponent(name)}`, category: '24 节气百科' });
    }
  }
  if (ONLY === 'all' || ONLY === 'ziwei') {
    for (const [name, desc] of ZIWEI) {
      out.push({ type: 'ziwei', name, fact: ziweiFact(name, desc), slug: `ziwei-${encodeURIComponent(name)}`, category: '紫微主星百科' });
    }
  }
  if (ONLY === 'all' || ONLY === 'gua') {
    for (const name of GUA_64) {
      out.push({ type: 'gua', name, fact: guaFact(name), slug: `gua-${encodeURIComponent(name)}`, category: '64 卦百科' });
    }
  }
  if (ONLY === 'all' || ONLY === 'yuejiang') {
    for (const [name, desc] of YUEJIANG) {
      out.push({ type: 'yuejiang', name, fact: yuejiangFact(name, desc), slug: `yuejiang-${encodeURIComponent(name)}`, category: '建除十二神百科' });
    }
  }
  return out;
}

const SYSTEM_PROMPT = `你是中文命理百科主编。给你一个命理概念名称和事实清单。请扩写为一篇 800-1500 字的百科词条。

【铁律】
1. 命理事实只能来自清单（节气名/月建/紫微星性/卦义/建除神职能等）。清单里的字面信息不能改。
2. 可以扩写背景（古籍渊源、现代应用、生活类比、配置场景），但不能与清单矛盾。
3. 不允许编造清单外的硬规则。

【输出 JSON 结构】
{
  "title": "16-28 字标题，包含概念名称",
  "excerpt": "60-120 字摘要",
  "seoTitle": "≤56 字 SEO 标题，含概念名",
  "seoDescription": "120-160 字 SEO 描述",
  "tags": ["标签1","标签2","标签3"],
  "sections": [
    { "title": "概念定义", "paragraphs": ["...2-3 段..."] },
    { "title": "传统命理意义", "paragraphs": ["...2-3 段..."] },
    { "title": "实战配置与判读", "paragraphs": ["...2-3 段..."] },
    { "title": "常见误区", "paragraphs": ["...2 段..."] },
    { "title": "FAQ", "paragraphs": ["问题：...答：...","问题：...答：..."] }
  ]
}

每段 paragraph 80-200 字，整篇 800-1500 字。中文行文平实专业，避免营销腔，避免 markdown 加粗，避免列表。

【输出格式】只输出 JSON，不要 markdown 代码块。`;

function tryParseObject(raw: string): unknown {
  let s = raw.trim();
  if (s.startsWith('```')) s = s.replace(/^```(?:json)?/i, '').replace(/```\s*$/, '').trim();
  const lo = s.indexOf('{');
  const hi = s.lastIndexOf('}');
  if (lo < 0 || hi < 0 || hi <= lo) return null;
  try { return JSON.parse(s.slice(lo, hi + 1)); } catch { return null; }
}

interface Result {
  entry: Entry;
  ok: boolean;
  error?: string;
  payload?: { title: string; excerpt: string; seoTitle: string; seoDescription: string; tags: string[]; sections: Array<{ title: string; paragraphs: string[] }> };
}

async function generateOne(openai: OpenAI, model: string, e: Entry): Promise<Result> {
  let raw = '';
  try {
    const resp = await openai.chat.completions.create({
      model,
      temperature: 0.65,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `概念名称：${e.name}\n所属类目：${e.category}\n\n【事实清单】\n${e.fact}\n\n请输出符合 system 要求的 JSON。` },
      ],
    });
    raw = resp.choices?.[0]?.message?.content || '';
  } catch (err) {
    return { entry: e, ok: false, error: 'llm err: ' + (err as Error).message.slice(0, 200) };
  }
  const parsed = tryParseObject(raw);
  if (!parsed || typeof parsed !== 'object') return { entry: e, ok: false, error: 'parse fail' };
  const o = parsed as Record<string, unknown>;
  const title = typeof o.title === 'string' ? o.title.trim() : '';
  const excerpt = typeof o.excerpt === 'string' ? o.excerpt.trim() : '';
  const seoTitle = typeof o.seoTitle === 'string' ? o.seoTitle.trim() : '';
  const seoDescription = typeof o.seoDescription === 'string' ? o.seoDescription.trim() : '';
  const tags = Array.isArray(o.tags) ? (o.tags as unknown[]).filter((t) => typeof t === 'string').slice(0, 5) as string[] : [];
  const sectionsRaw = Array.isArray(o.sections) ? o.sections : [];
  const sections: Array<{ title: string; paragraphs: string[] }> = [];
  for (const s of sectionsRaw) {
    if (!s || typeof s !== 'object') continue;
    const so = s as Record<string, unknown>;
    const stitle = typeof so.title === 'string' ? so.title.trim() : '';
    const paragraphs = Array.isArray(so.paragraphs) ? (so.paragraphs as unknown[]).filter((p) => typeof p === 'string' && (p as string).trim().length > 0).map((p) => (p as string).trim()) : [];
    if (stitle && paragraphs.length) sections.push({ title: stitle, paragraphs });
  }
  if (title.length < 4 || sections.length < 3) return { entry: e, ok: false, error: `validate fail title=${title.length} sections=${sections.length}` };
  return { entry: e, ok: true, payload: { title, excerpt, seoTitle, seoDescription, tags, sections } };
}

async function pool<T>(jobs: Array<() => Promise<T>>, concurrency: number): Promise<T[]> {
  const out: T[] = new Array(jobs.length);
  let cursor = 0;
  async function worker() {
    while (true) {
      const idx = cursor++;
      if (idx >= jobs.length) return;
      try { out[idx] = await jobs[idx](); }
      catch (err) { out[idx] = { ok: false, error: (err as Error).message } as unknown as T; }
    }
  }
  await Promise.all(new Array(Math.min(concurrency, jobs.length)).fill(0).map(() => worker()));
  return out;
}

async function main() {
  const apiKey = getApiKey();
  if (!apiKey) { console.error('[d82] API_KEY missing'); process.exit(1); }
  const model = getModelFallbackChain(undefined, 'content')[0];
  if (!model) { console.error('[d82] no model'); process.exit(1); }

  const entries = buildEntries();
  console.log(`[d82] entries=${entries.length} (filter=${ONLY}) model=${model} concurrency=${CONCURRENCY}`);
  if (!entries.length) return;

  const openai = new OpenAI({ apiKey, baseURL: getApiBaseUrl(), timeout: 60000, maxRetries: 1 });
  const t0 = Date.now();
  const jobs = entries.map((e) => () => generateOne(openai, model, e));
  const results = await pool(jobs, CONCURRENCY);
  const elapsed = Date.now() - t0;

  let ok = 0, fail = 0, saved = 0;
  for (const r of results) {
    if (!r.ok || !r.payload) {
      fail += 1;
      console.error(`  fail [${r.entry?.name}] ${r.error}`);
      continue;
    }
    ok += 1;
    try {
      saveManagedContentEntry({
        contentType: 'knowledge',
        subtype: r.entry.type,
        slug: r.entry.slug,
        title: r.payload.title,
        name: r.entry.name,
        excerpt: r.payload.excerpt,
        category: r.entry.category,
        readTime: `${Math.max(4, Math.min(8, Math.ceil(r.payload.sections.flatMap(s => s.paragraphs).join('').length / 250)))} 分钟阅读`,
        tags: r.payload.tags.length ? r.payload.tags : [r.entry.name, r.entry.category],
        featured: false,
        seoTitle: r.payload.seoTitle || `${r.entry.name} | 命理百科 - 世界易学`,
        seoDescription: r.payload.seoDescription || r.payload.excerpt,
        sections: r.payload.sections,
        status: 'published',
        source: 'engine-llm:encyclopedia-2',
        meta: { encyclopediaType: r.entry.type, conceptName: r.entry.name, generationVersion: 'v5-D82' },
      }, 'system:d82');
      saved += 1;
    } catch (err) {
      console.error(`  save fail [${r.entry.name}]:`, (err as Error).message.slice(0, 200));
    }
  }
  console.log(`[d82] ok=${ok} fail=${fail} saved=${saved} / ${entries.length} in ${(elapsed / 1000).toFixed(1)}s`);
}

main().catch((err) => { console.error('[d82] FATAL:', err); process.exit(99); });
