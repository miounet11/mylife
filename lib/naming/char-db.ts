/**
 * 起名字库（精选常用字）— 五行 + 义项标签 + 性别倾向
 * 非全康熙；未知字降分不崩溃
 */

import type { Gender, Wuxing } from './types';

export type CharEntry = {
  char: string;
  element: Wuxing;
  /** 康熙笔画近似，供五格可选 */
  strokes?: number;
  gender?: Gender;
  tags?: string[];
  meaning?: string;
};

const RAW: Array<[string, Wuxing, number?, Gender?, string?, string?]> = [
  // 水
  ['浩', '水', 11, 'male', 'grand', '盛大'],
  ['泽', '水', 8, 'male', 'grace', '恩泽'],
  ['涵', '水', 12, 'neutral', 'depth', '包容'],
  ['淼', '水', 12, 'neutral', 'water', '水势'],
  ['清', '水', 11, 'neutral', 'pure', '清澈'],
  ['润', '水', 10, 'neutral', 'grace', '温润'],
  ['沐', '水', 7, 'neutral', 'fresh', '沐浴'],
  ['洋', '水', 9, 'male', 'grand', '宽广'],
  ['涛', '水', 10, 'male', 'force', '波涛'],
  ['霖', '水', 16, 'male', 'rain', '甘霖'],
  ['雪', '水', 11, 'female', 'pure', '洁白'],
  ['露', '水', 21, 'female', 'grace', '甘露'],
  // 木
  ['梓', '木', 11, 'neutral', 'tree', '梓材'],
  ['林', '木', 8, 'neutral', 'tree', '成片'],
  ['柏', '木', 9, 'male', 'tree', '坚韧'],
  ['桐', '木', 10, 'neutral', 'tree', '梧桐'],
  ['萱', '木', 12, 'female', 'plant', '忘忧'],
  ['蓉', '木', 13, 'female', 'plant', '芙蓉'],
  ['芳', '木', 7, 'female', 'plant', '芬芳'],
  ['菁', '木', 11, 'female', 'plant', '菁华'],
  ['荣', '木', 9, 'neutral', 'prosper', '兴盛'],
  ['楠', '木', 13, 'male', 'tree', '楠木'],
  ['槿', '木', 15, 'female', 'plant', '木槿'],
  ['禾', '木', 5, 'neutral', 'grain', '五谷'],
  // 火
  ['煜', '火', 13, 'male', 'light', '照耀'],
  ['烨', '火', 10, 'male', 'light', '火盛'],
  ['曦', '火', 20, 'neutral', 'sun', '晨光'],
  ['晨', '火', 11, 'neutral', 'sun', '清晨'],
  ['阳', '火', 6, 'male', 'sun', '阳光'],
  ['炎', '火', 8, 'male', 'fire', '热烈'],
  ['晴', '火', 12, 'female', 'sun', '晴朗'],
  ['暖', '火', 13, 'female', 'warm', '温暖'],
  ['彤', '火', 7, 'female', 'red', '丹红'],
  ['朗', '火', 10, 'male', 'bright', '明朗'],
  ['晖', '火', 10, 'neutral', 'light', '光辉'],
  ['灿', '火', 7, 'neutral', 'bright', '灿烂'],
  // 土
  ['安', '土', 6, 'neutral', 'peace', '安定'],
  ['宇', '土', 6, 'male', 'space', '宇宙'],
  ['轩', '土', 7, 'male', 'lofty', '气宇'],
  ['坤', '土', 8, 'male', 'earth', '厚德'],
  ['垚', '土', 9, 'neutral', 'earth', '高土'],
  ['培', '土', 11, 'neutral', 'cultivate', '培育'],
  ['嘉', '土', 14, 'neutral', 'good', '嘉美'],
  ['宜', '土', 8, 'female', 'fit', '适宜'],
  ['婉', '土', 11, 'female', 'gentle', '婉约'],
  ['婷', '土', 12, 'female', 'grace', '美好'],
  ['瑶', '土', 14, 'female', 'jade', '美玉'],
  ['琦', '土', 13, 'neutral', 'jade', '珍奇'],
  // 金
  ['铭', '金', 14, 'male', 'metal', '铭记'],
  ['锐', '金', 12, 'male', 'sharp', '锐意'],
  ['锦', '金', 13, 'neutral', 'silk', '锦绣'],
  ['钧', '金', 9, 'male', 'metal', '千钧'],
  ['铮', '金', 11, 'male', 'metal', '铮铮'],
  ['钰', '金', 10, 'female', 'jade-metal', '珍宝'],
  ['铃', '金', 10, 'female', 'sound', '铃声'],
  ['睿', '金', 14, 'neutral', 'wise', '通达'],
  ['哲', '金', 10, 'male', 'wise', '明哲'],
  ['思', '金', 9, 'neutral', 'think', '思虑'],
  ['静', '金', 14, 'female', 'calm', '宁静'],
  ['雯', '金', 12, 'female', 'cloud', '彩云'],
  // 更多高频
  ['子', '水', 3, 'neutral', 'seed', '子息'],
  ['一', '土', 1, 'neutral', 'one', '专一'],
  ['文', '水', 4, 'neutral', 'culture', '文采'],
  ['博', '水', 12, 'male', 'broad', '广博'],
  ['明', '火', 8, 'neutral', 'bright', '光明'],
  ['杰', '木', 8, 'male', 'hero', '俊杰'],
  ['伟', '土', 6, 'male', 'great', '宏伟'],
  ['强', '木', 11, 'male', 'strong', '刚强'],
  ['丽', '火', 7, 'female', 'beauty', '美丽'],
  ['美', '水', 9, 'female', 'beauty', '美好'],
  ['慧', '水', 15, 'female', 'wise', '聪慧'],
  ['怡', '土', 8, 'female', 'joy', '和悦'],
  ['欣', '木', 8, 'female', 'joy', '欣喜'],
  ['乐', '火', 5, 'neutral', 'joy', '快乐'],
  ['宁', '火', 5, 'neutral', 'peace', '安宁'],
  ['和', '土', 8, 'neutral', 'harmony', '和谐'],
  ['信', '金', 9, 'neutral', 'trust', '诚信'],
  ['德', '火', 15, 'neutral', 'virtue', '品德'],
  ['仁', '金', 4, 'neutral', 'benevolence', '仁爱'],
  ['义', '木', 3, 'neutral', 'righteous', '道义'],
  ['礼', '火', 5, 'neutral', 'rite', '礼仪'],
  ['智', '火', 12, 'neutral', 'wisdom', '智慧'],
  ['远', '土', 7, 'neutral', 'far', '高远'],
  ['航', '水', 10, 'male', 'sail', '远航'],
  ['辰', '土', 7, 'neutral', 'time', '星辰'],
  ['星', '火', 9, 'neutral', 'star', '星光'],
  ['月', '木', 4, 'female', 'moon', '明月'],
  ['云', '水', 4, 'neutral', 'cloud', '云霞'],
  ['风', '水', 4, 'neutral', 'wind', '清风'],
  ['山', '土', 3, 'male', 'mountain', '山岳'],
  ['海', '水', 10, 'male', 'sea', '大海'],
  ['天', '火', 4, 'neutral', 'sky', '苍天'],
  ['启', '木', 7, 'neutral', 'open', '开启'],
  ['承', '金', 8, 'neutral', 'carry', '承载'],
  ['宏', '水', 7, 'male', 'grand', '宏大'],
  ['恒', '水', 9, 'male', 'const', '恒久'],
  ['昌', '火', 8, 'male', 'prosper', '昌盛'],
  ['盛', '金', 11, 'neutral', 'prosper', '兴盛'],
  ['隆', '火', 11, 'male', 'prosper', '兴隆'],
  ['泰', '水', 9, 'neutral', 'peace', '安泰'],
  ['康', '木', 11, 'neutral', 'health', '安康'],
  ['健', '土', 10, 'male', 'health', '强健'],
  ['成', '金', 6, 'neutral', 'achieve', '成就'],
  ['达', '火', 6, 'male', 'reach', '通达'],
  ['通', '金', 10, 'neutral', 'open', '通达'],
  ['华', '水', 6, 'neutral', 'splendor', '光华'],
  ['英', '木', 8, 'neutral', 'hero', '英才'],
  ['俊', '火', 9, 'male', 'handsome', '俊朗'],
  ['雅', '木', 12, 'female', 'elegant', '雅致'],
  ['诗', '金', 8, 'female', 'poetry', '诗意'],
  ['书', '金', 4, 'neutral', 'book', '书香'],
  ['画', '水', 8, 'neutral', 'art', '绘事'],
  ['诺', '火', 10, 'neutral', 'promise', '承诺'],
  ['言', '金', 7, 'neutral', 'speech', '言辞'],
  // 公司/品牌常用
  ['创', '金', 12, 'neutral', 'create', '创造'],
  ['新', '金', 13, 'neutral', 'new', '革新'],
  ['科', '木', 9, 'neutral', 'tech', '科技'],
  ['智', '火', 12, 'neutral', 'smart', '智能'],
  ['联', '木', 12, 'neutral', 'link', '联合'],
  ['合', '水', 6, 'neutral', 'unite', '合作'],
  ['众', '金', 6, 'neutral', 'crowd', '大众'],
  ['汇', '水', 5, 'neutral', 'gather', '汇聚'],
  ['源', '水', 13, 'neutral', 'source', '本源'],
  ['本', '木', 5, 'neutral', 'root', '根本'],
  ['元', '木', 4, 'neutral', 'origin', '元初'],
  ['基', '土', 11, 'neutral', 'base', '根基'],
  ['鼎', '火', 13, 'neutral', '鼎', '鼎立'],
  ['锋', '金', 12, 'male', 'edge', '先锋'],
  ['领', '金', 11, 'neutral', 'lead', '引领'],
  ['航', '水', 10, 'neutral', 'nav', '导航'],
  ['云', '水', 4, 'neutral', 'cloud', '云端'],
  ['数', '水', 13, 'neutral', 'data', '数据'],
  ['智', '火', 12, 'neutral', 'ai', '智慧'],
  ['品', '水', 9, 'neutral', 'quality', '品质'],
  ['优', '土', 6, 'neutral', 'excellent', '优秀'],
  ['精', '木', 14, 'neutral', 'refine', '精良'],
  ['尚', '金', 8, 'neutral', 'fashion', '时尚'],
  ['美', '水', 9, 'neutral', 'beauty', '美好'],
  ['家', '木', 10, 'neutral', 'home', '家居'],
  ['居', '木', 8, 'neutral', 'live', '居住'],
  ['安', '土', 6, 'neutral', 'safe', '安全'],
  ['信', '金', 9, 'neutral', 'credit', '信用'],
  ['诚', '金', 8, 'neutral', 'sincere', '诚信'],
  ['德', '火', 15, 'neutral', 'virtue', '德行'],
  ['福', '水', 13, 'neutral', 'bless', '福泽'],
  ['祥', '金', 10, 'neutral', 'auspicious', '吉祥'],
  ['瑞', '金', 13, 'neutral', 'auspicious', '祥瑞'],
  ['利', '火', 7, 'neutral', 'benefit', '利益'],
  ['兴', '木', 6, 'neutral', 'rise', '兴旺'],
  ['盛', '金', 11, 'neutral', 'bloom', '繁盛'],
  ['丰', '火', 4, 'neutral', 'abundant', '丰盛'],
  ['盈', '水', 9, 'neutral', 'full', '盈余'],
  ['泰', '水', 9, 'neutral', 'peace', '康泰'],
  ['和', '土', 8, 'neutral', 'harmony', '和合'],
  ['平', '水', 5, 'neutral', 'flat', '平安'],
  ['正', '金', 5, 'neutral', 'upright', '端正'],
  ['中', '土', 4, 'neutral', 'center', '中正'],
  ['华', '水', 6, 'neutral', 'china', '中华'],
  ['国', '土', 8, 'neutral', 'nation', '邦国'],
  ['世', '金', 5, 'neutral', 'world', '世界'],
  ['界', '土', 9, 'neutral', 'realm', '境界'],
  ['环', '土', 8, 'neutral', 'circle', '环球'],
  ['球', '土', 11, 'neutral', 'globe', '地球'],
  ['通', '金', 10, 'neutral', 'connect', '联通'],
  ['达', '火', 6, 'neutral', 'arrive', '抵达'],
  ['远', '土', 7, 'neutral', 'far', '高远'],
  ['景', '木', 12, 'neutral', 'view', '景象'],
  ['明', '火', 8, 'neutral', 'bright', '光明'],
  ['光', '火', 6, 'neutral', 'light', '光芒'],
  ['耀', '火', 20, 'neutral', 'shine', '光耀'],
  ['辉', '水', 12, 'neutral', 'glow', '光辉'],
];

const MAP = new Map<string, CharEntry>();
for (const [char, element, strokes, gender, tag, meaning] of RAW) {
  if (MAP.has(char)) continue;
  MAP.set(char, {
    char,
    element,
    strokes,
    gender,
    tags: tag ? [tag] : [],
    meaning,
  });
}

export function getCharEntry(char: string): CharEntry | null {
  return MAP.get(char) || null;
}

export function charElement(char: string): Wuxing | '未知' {
  return MAP.get(char)?.element || '未知';
}

export function allChars(filter?: {
  element?: Wuxing;
  gender?: Gender;
  tag?: string;
}): CharEntry[] {
  let list = [...MAP.values()];
  if (filter?.element) list = list.filter((c) => c.element === filter.element);
  if (filter?.gender && filter.gender !== 'neutral') {
    list = list.filter((c) => !c.gender || c.gender === filter.gender || c.gender === 'neutral');
  }
  if (filter?.tag) list = list.filter((c) => c.tags?.includes(filter.tag!));
  return list;
}

export function listGivenNamePool(gender?: Gender, preferElements?: Wuxing[]): CharEntry[] {
  const prefer = new Set(preferElements || []);
  const pool = allChars({ gender });
  if (!prefer.size) return pool;
  const hi = pool.filter((c) => prefer.has(c.element));
  const lo = pool.filter((c) => !prefer.has(c.element));
  return [...hi, ...lo];
}

/** 公司/产品用字（偏品牌传播） */
export function brandCharPool(preferElements?: Wuxing[]): CharEntry[] {
  const tags = new Set([
    'grand',
    'prosper',
    'create',
    'tech',
    'trust',
    'new',
    'quality',
    'source',
    'lead',
    'link',
    'bright',
    'peace',
    'harmony',
  ]);
  const prefer = new Set(preferElements || []);
  const base = allChars().filter(
    (c) =>
      c.tags?.some((t) => tags.has(t)) ||
      '创科汇源基鼎锋领云数品优精诚信福祥瑞利兴盛丰盈泰和平中华世通达远景明光'.includes(
        c.char,
      ),
  );
  if (!prefer.size) return base.length ? base : allChars();
  return [
    ...base.filter((c) => prefer.has(c.element)),
    ...base.filter((c) => !prefer.has(c.element)),
  ];
}
