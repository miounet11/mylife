/**
 * 经典起名法 / 多维评分（天时地利人和）
 */

import type { NameCandidate, Wuxing } from './types';
import { analyzeNameChars, computeWuge, formatCharBreakdown } from './kangxi-engine';

export type NamingMethodId =
  | 'yongshen' // 八字用神补益
  | 'wuge' // 三才五格
  | 'poetry' // 诗词典雅
  | 'phonology' // 音韵
  | 'wuxing_balance' // 姓名自带五行平衡
  | 'tianshi' // 天时（生辰/流年）
  | 'dili' // 地利（地域/行业）
  | 'renhe'; // 人和（寓意/传播/心愿）

export type MethodScore = {
  id: NamingMethodId;
  label: string;
  score: number;
  note: string;
};

export const METHOD_LABELS: Record<NamingMethodId, string> = {
  yongshen: '用神补益',
  wuge: '三才五格',
  poetry: '诗词典雅',
  phonology: '音韵节奏',
  wuxing_balance: '五行结构',
  tianshi: '天时生辰',
  dili: '地利场景',
  renhe: '人和寓意',
};

/** 诗词用字偏好（教学用精选） */
export const POETRY_CHARS = new Set(
  '清明月山水云风花雪松竹梅兰菊荷春夏秋冬雅诗书琴画远飞鹤鹿雁江河湖海天星辰曦晨晖霞露泽润浩涵林梓萱芳荣华锦瑞祥安康宁泰和怡欣静思慧雅德仁义礼智信成达通启承宏恒盛隆英俊杰伟强丽美乐',
);

export type MultiDimContext = {
  yongShen?: string[];
  jiShen?: string[];
  surname?: string;
  gender?: string;
  birthDate?: string;
  birthTime?: string;
  birthPlace?: string;
  industry?: string;
  region?: string;
  category?: string;
  wish?: string; // 取名心语
  poetryHint?: string;
  /** 天时：日主/节气简述 */
  dayMaster?: string;
  mode: 'person' | 'company' | 'product' | 'rename';
};

export function scoreMethods(
  fullName: string,
  givenOrBrand: string,
  ctx: MultiDimContext,
): MethodScore[] {
  const chars = analyzeNameChars(givenOrBrand || fullName);
  const yong = new Set((ctx.yongShen || []).filter(Boolean));
  const ji = new Set((ctx.jiShen || []).filter(Boolean));

  // 用神
  let yongScore = 50;
  let yongHits = 0;
  let jiHits = 0;
  for (const c of chars) {
    if (c.element === '未知') continue;
    if (yong.has(c.element)) {
      yongScore += 14;
      yongHits += 1;
    } else if (ji.has(c.element)) {
      yongScore -= 12;
      jiHits += 1;
    }
  }
  if (!yong.size) yongScore = ctx.birthDate ? 48 : 42;
  yongScore = clamp(yongScore, 15, 98);

  // 五格
  const wuge =
    ctx.mode === 'person' || ctx.mode === 'rename'
      ? computeWuge(ctx.surname || fullName.slice(0, 1), givenOrBrand)
      : null;
  const wugeScore = wuge?.score ?? 55;

  // 诗词
  let poetry = 50;
  for (const c of chars) {
    if (POETRY_CHARS.has(c.char)) poetry += 8;
  }
  if (ctx.poetryHint) poetry += 6;
  poetry = clamp(poetry, 30, 95);

  // 音韵
  let ph = 70;
  if (chars.length === 2) ph += 10;
  if (chars.length === 1) ph += 4;
  if (chars.length >= 2 && chars[0].char === chars[1].char) ph -= 12;
  if (chars.length > 3) ph -= 8;
  ph = clamp(ph, 25, 95);

  // 五行自洽
  const els = chars.map((c) => c.element).filter((e) => e !== '未知') as Wuxing[];
  const uniq = new Set(els);
  let bal = 60 + uniq.size * 6;
  if (els.length && uniq.size === 1) bal -= 8;
  bal = clamp(bal, 30, 92);

  // 天时：有生辰加权
  let tianshi = 45;
  if (ctx.birthDate) tianshi += 25;
  if (ctx.birthTime) tianshi += 10;
  if (ctx.dayMaster) tianshi += 8;
  if (yongHits > 0) tianshi += 10;
  tianshi = clamp(tianshi, 30, 95);

  // 地利
  let dili = 50;
  if (ctx.birthPlace || ctx.region) dili += 15;
  if (ctx.industry || ctx.category) dili += 15;
  if (ctx.mode === 'company' && /有限公司|Limited|LLC|株式会社/.test(fullName)) dili += 12;
  dili = clamp(dili, 30, 95);

  // 人和
  let renhe = 55;
  if (ctx.wish) {
    renhe += 12;
    // 粗：心语命中字义标签
    const wish = ctx.wish;
    for (const c of chars) {
      if (c.meaning && wish.includes(c.meaning.slice(0, 1))) renhe += 4;
    }
  }
  if (yongHits >= 1 && jiHits === 0) renhe += 8;
  renhe = clamp(renhe, 30, 95);

  const methods: MethodScore[] = [
    {
      id: 'yongshen',
      label: METHOD_LABELS.yongshen,
      score: yongScore,
      note: yong.size
        ? `补用神 ${yongHits} 字${jiHits ? ` · 忌神 ${jiHits}` : ''}`
        : ctx.birthDate
          ? '已填生辰，用神待引擎'
          : '未绑定生辰/用神',
    },
    {
      id: 'wuge',
      label: METHOD_LABELS.wuge,
      score: wugeScore,
      note: wuge?.summary || '非个人名略过五格主轴',
    },
    {
      id: 'wuxing_balance',
      label: METHOD_LABELS.wuxing_balance,
      score: bal,
      note: formatCharBreakdown(chars).slice(0, 4).join('；') || '无汉字',
    },
    {
      id: 'phonology',
      label: METHOD_LABELS.phonology,
      score: ph,
      note: `${chars.length} 字节奏`,
    },
    {
      id: 'poetry',
      label: METHOD_LABELS.poetry,
      score: poetry,
      note: ctx.poetryHint ? `心语/诗词：${ctx.poetryHint.slice(0, 20)}` : '典雅用字参考',
    },
    {
      id: 'tianshi',
      label: METHOD_LABELS.tianshi,
      score: tianshi,
      note: ctx.birthDate
        ? `生辰 ${ctx.birthDate}${ctx.birthTime ? ` ${ctx.birthTime}` : ''}${ctx.dayMaster ? ` · 日主${ctx.dayMaster}` : ''}`
        : '建议填写出生时间以开天时维',
    },
    {
      id: 'dili',
      label: METHOD_LABELS.dili,
      score: dili,
      note: [ctx.birthPlace || ctx.region, ctx.industry || ctx.category].filter(Boolean).join(' · ') || '场景待补',
    },
    {
      id: 'renhe',
      label: METHOD_LABELS.renhe,
      score: renhe,
      note: ctx.wish ? `心语：${ctx.wish.slice(0, 24)}` : '寓意与认同感',
    },
  ];

  return methods;
}

export function aggregateMethodScores(methods: MethodScore[]): number {
  if (!methods.length) return 50;
  // 用神/天时/五格权重略高
  const weight: Partial<Record<NamingMethodId, number>> = {
    yongshen: 1.35,
    tianshi: 1.2,
    wuge: 1.1,
    renhe: 1.05,
    dili: 1.05,
  };
  let sum = 0;
  let w = 0;
  for (const m of methods) {
    const wt = weight[m.id] || 1;
    sum += m.score * wt;
    w += wt;
  }
  return Math.round(sum / w);
}

export function attachMethodsToCandidate(
  c: NameCandidate,
  ctx: MultiDimContext,
): NameCandidate & { methods: MethodScore[]; charBreakdown: string[] } {
  const given = c.name;
  const full = c.fullName || c.name;
  const methods = scoreMethods(full, given, ctx);
  const total = aggregateMethodScores(methods);
  const chars = analyzeNameChars(given);
  return {
    ...c,
    score: total,
    breakdown: {
      ...c.breakdown,
      total,
      wuxing: methods.find((m) => m.id === 'yongshen')?.score ?? c.breakdown.wuxing,
      phonology: methods.find((m) => m.id === 'phonology')?.score ?? c.breakdown.phonology,
      semantics: methods.find((m) => m.id === 'renhe')?.score ?? c.breakdown.semantics,
      wuge: methods.find((m) => m.id === 'wuge')?.score,
    },
    reason: [
      methods
        .slice()
        .sort((a, b) => b.score - a.score)
        .slice(0, 3)
        .map((m) => `${m.label}${m.score}`)
        .join(' · '),
      c.reason,
    ]
      .filter(Boolean)
      .join(' · '),
    methods,
    charBreakdown: formatCharBreakdown(chars),
  };
}

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

/** 诗词撷英 chips（对标竞品） */
export const POETRY_CHIPS = [
  '桃之夭夭，灼灼其华',
  '蒹葭苍苍，白露为霜',
  '此情可待成追忆',
  '明月松间照，清泉石上流',
  '南有乔木，不可休思',
  '接天莲叶无穷碧',
  '沅有芷兮澧有兰',
  '采菊东篱下，悠然见南山',
  '海内存知己，天涯若比邻',
  '会当凌绝顶，一览众山小',
];
