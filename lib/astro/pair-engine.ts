/**
 * Sign-pair structure notes — rule-based, not romantic spam.
 */

import { ASTRO_SIGNS, getSignByKey, SIGN_BY_KEY } from '@/lib/astro/signs-data';
import type { ElementKey, SignKey } from '@/lib/astro/types';
import type { WuXing } from '@/lib/almanac/elements';
import { relation } from '@/lib/almanac/elements';

const EL_WX: Record<ElementKey, WuXing> = {
  火: '火',
  土: '土',
  风: '金',
  水: '水',
};

export type AstroPairPack = {
  a: SignKey;
  b: SignKey;
  title: string;
  elementNote: string;
  modalityNote: string;
  catalogNote: string;
  favors: string[];
  watchouts: string[];
  score: number;
  stance: 'ease' | 'work' | 'neutral';
  worldYi: string;
  bridges: Array<{ href: string; label: string }>;
  seo: { title: string; description: string; keywords: string[] };
};

function modalityNote(a: string, b: string): string {
  if (a === b) return `同为${a}宫：节奏同步时推进快，也容易一起钻牛角尖。`;
  if ((a === '基本' && b === '固定') || (a === '固定' && b === '基本')) {
    return '基本 × 固定：一个开局一个守成，需约定「谁拍板、谁落地」。';
  }
  if ((a === '基本' && b === '变动') || (a === '变动' && b === '基本')) {
    return '基本 × 变动：启动与调节互补，忌把灵活当成不承诺。';
  }
  return '固定 × 变动：深度与弹性拉扯，先写清边界再谈长期。';
}

export function buildAstroPairPack(keyA: string, keyB: string): AstroPairPack | null {
  const a = getSignByKey(keyA);
  const b = getSignByKey(keyB);
  if (!a || !b) return null;

  // Canonical order: aries-first seasonal order for stable URLs (caller should normalize)
  const wa = EL_WX[a.element];
  const wb = EL_WX[b.element];
  const rel = relation(wa, wb);

  let score = 55;
  const favors: string[] = [];
  const watchouts: string[] = [];
  let elementNote = '';

  if (rel === 'same') {
    score += 8;
    elementNote = `同属${a.element}象近似：语言易共鸣，也易共振放大盲点。`;
    favors.push('共同话题与节奏更容易对齐。');
    watchouts.push('盲点相似时，需要外置复核（清单/第三方）。');
  } else if (rel === 'generates' || rel === 'generated_by') {
    score += 12;
    elementNote = `${a.element}象与${b.element}象有生扶结构：互补供给，忌单方过度付出。`;
    favors.push('分工明确时协作效率高。');
    watchouts.push('生扶关系也可能变成依赖，定期复盘交换是否对等。');
  } else if (rel === 'controls' || rel === 'controlled_by') {
    score -= 8;
    elementNote = `${a.element}象与${b.element}象有克制结构：张力可用于成长，也易消耗。`;
    favors.push('冲突若被规则化，可变出高质量决策。');
    watchouts.push('避免人身攻击与权力博弈；先谈事实与边界。');
  } else {
    elementNote = `${a.element}象 × ${b.element}象：关系偏中性，靠阶段与环境定调。`;
  }

  const listedWell = a.pairsWell.includes(b.key) || b.pairsWell.includes(a.key);
  const listedWork = a.needsWork.includes(b.key) || b.needsWork.includes(a.key);
  let catalogNote = '百科配对为倾向参考，不等于现实关系结论。';
  if (listedWell) {
    score += 10;
    catalogNote = `资料库将「${a.zh}–${b.zh}」标为较易协作的组合之一。`;
    favors.push(`${a.keywords[0]}与${b.keywords[0]}可形成互补主轴。`);
  }
  if (listedWork) {
    score -= 8;
    catalogNote = `资料库提示「${a.zh}–${b.zh}」需要更多沟通与边界设计。`;
    watchouts.push(`注意${a.watchouts[0]}与${b.watchouts[0]}叠加。`);
  }

  score = Math.max(20, Math.min(90, score));
  const stance: AstroPairPack['stance'] =
    score >= 62 ? 'ease' : score <= 48 ? 'work' : 'neutral';

  const title = `${a.zh}与${b.zh}`;
  return {
    a: a.key,
    b: b.key,
    title,
    elementNote,
    modalityNote: modalityNote(a.modality, b.modality),
    catalogNote,
    favors: favors.slice(0, 4),
    watchouts: watchouts.slice(0, 4),
    score,
    stance,
    worldYi: `世界易视角：关系先看边界与节奏，再看元素互补。${a.worldYiBridge.slice(0, 40)}… / ${b.worldYiBridge.slice(0, 40)}…`,
    bridges: [
      { href: `/astro/signs/${a.key}`, label: a.zh },
      { href: `/astro/signs/${b.key}`, label: b.zh },
      { href: '/world-yi/domains/relationship', label: '关系分科' },
      { href: '/hehun', label: '合婚双盘' },
      { href: '/analyze?source=astro_pair', label: '结构报告' },
      { href: '/almanac', label: '万年历' },
    ],
    seo: {
      title: `${title}配对｜元素模式与协作边界｜人生K线星座`,
      description: `${title}：${elementNote.slice(0, 60)} 协作分${score}。结构倾向参考，非宿命。`,
      keywords: [a.zh, b.zh, '星座配对', '协作', a.element, b.element],
    },
  };
}

/** Normalize pair URL keys to seasonal order so A-B === B-A canonical */
export function canonicalPairKeys(keyA: string, keyB: string): [SignKey, SignKey] | null {
  const a = getSignByKey(keyA);
  const b = getSignByKey(keyB);
  if (!a || !b) return null;
  const order = ASTRO_SIGNS.map((s) => s.key);
  const ia = order.indexOf(a.key);
  const ib = order.indexOf(b.key);
  if (ia <= ib) return [a.key, b.key];
  return [b.key, a.key];
}

export function allPairKeyCombos(): Array<{ a: SignKey; b: SignKey }> {
  const keys = ASTRO_SIGNS.map((s) => s.key);
  const out: Array<{ a: SignKey; b: SignKey }> = [];
  for (let i = 0; i < keys.length; i++) {
    for (let j = i; j < keys.length; j++) {
      out.push({ a: keys[i], b: keys[j] });
    }
  }
  return out; // 78 including self-pairs
}

// silence unused
void SIGN_BY_KEY;
