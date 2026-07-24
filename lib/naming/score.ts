import { charElement, getCharEntry } from './char-db';
import type {
  NameCandidate,
  NameScoreBreakdown,
  NamingMode,
  NamingScoreInput,
  Wuxing,
} from './types';

const TABOO = new Set('死病灾凶恶丑笨穷败亡哭丧毒残废');

export function analyzeChars(name: string): Array<{ char: string; element: Wuxing | '未知' }> {
  return [...name.replace(/\s/g, '')]
    .filter((c) => /[\u4e00-\u9fff]/.test(c))
    .map((char) => ({ char, element: charElement(char) }));
}

export function scoreName(input: NamingScoreInput): NameCandidate {
  const raw = input.name.trim();
  const given =
    input.mode === 'person' && input.surname && raw.startsWith(input.surname)
      ? raw.slice(input.surname.length)
      : raw;
  const fullName =
    input.mode === 'person' && input.surname
      ? raw.startsWith(input.surname)
        ? raw
        : `${input.surname}${raw}`
      : raw;

  const elements = analyzeChars(given || raw);
  const yong = new Set((input.yongShen || []).map(normalizeEl).filter(Boolean) as Wuxing[]);
  const ji = new Set((input.jiShen || []).map(normalizeEl).filter(Boolean) as Wuxing[]);

  let wuxing = 50;
  let favor = 0;
  let avoid = 0;
  let unknown = 0;
  for (const e of elements) {
    if (e.element === '未知') {
      unknown += 1;
      wuxing -= 3;
      continue;
    }
    if (yong.has(e.element)) {
      wuxing += 14;
      favor += 1;
    } else if (ji.has(e.element)) {
      wuxing -= 12;
      avoid += 1;
    } else {
      wuxing += 2;
    }
  }
  if (!yong.size && !ji.size) wuxing = 55 + Math.min(15, elements.length * 3);
  wuxing = clamp(wuxing, 15, 98);

  // phonology: 避免叠字刺耳 + 长度
  let phonology = 70;
  const chars = elements.map((e) => e.char);
  if (chars.length >= 2 && chars[0] === chars[1]) phonology -= 8;
  if (chars.length === 0) phonology = 20;
  if (chars.length > 3 && input.mode === 'person') phonology -= 10;
  if (chars.length === 2) phonology += 8;
  if (chars.length === 1 && input.mode === 'person') phonology += 4;
  phonology = clamp(phonology, 20, 95);

  // semantics
  let semantics = 72;
  for (const c of chars) {
    if (TABOO.has(c)) semantics -= 25;
    const ent = getCharEntry(c);
    if (ent?.meaning) semantics += 3;
    if (ent?.tags?.includes('prosper') || ent?.tags?.includes('bright')) semantics += 2;
  }
  semantics = clamp(semantics, 10, 95);

  let brandability: number | undefined;
  if (input.mode === 'company' || input.mode === 'product') {
    brandability = 60;
    if (chars.length >= 2 && chars.length <= 3) brandability += 15;
    if (chars.length === 1) brandability += 5;
    if (chars.length > 4) brandability -= 15;
    if (input.industry) brandability += 5;
    brandability = clamp(brandability, 25, 95);
  }

  let wuge: number | undefined;
  if (input.enableWuge) {
    wuge = roughWugeScore(fullName);
  }

  const parts = [wuxing, phonology, semantics];
  if (brandability != null) parts.push(brandability);
  if (wuge != null) parts.push(wuge);
  const total = Math.round(parts.reduce((a, b) => a + b, 0) / parts.length);

  const reasonBits: string[] = [];
  if (yong.size) {
    reasonBits.push(
      favor > avoid
        ? `用神契合较好（${favor} 字补用神）`
        : avoid
          ? `有 ${avoid} 字偏忌神，可微调`
          : '五行中性，可按用神微调末字',
    );
  } else {
    reasonBits.push('未绑用神，按音义与传播感评分');
  }
  if (unknown) reasonBits.push(`${unknown} 字未入库`);
  if (brandability != null) reasonBits.push(`传播感 ${brandability}`);

  const breakdown: NameScoreBreakdown = {
    wuxing,
    phonology,
    semantics,
    wuge,
    brandability,
    total,
  };

  return {
    name: input.mode === 'person' ? given || raw : raw,
    fullName: input.mode === 'person' ? fullName : raw,
    score: total,
    breakdown,
    elements,
    reason: reasonBits.join(' · '),
  };
}

function normalizeEl(s: string): Wuxing | null {
  const t = s.trim();
  if (t === '木' || t === '火' || t === '土' || t === '金' || t === '水') return t;
  const map: Record<string, Wuxing> = {
    wood: '木',
    fire: '火',
    earth: '土',
    metal: '金',
    water: '水',
  };
  return map[t.toLowerCase()] || null;
}

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

/** 简化五格：笔画和模 10 启发式（传统参考，非断事） */
function roughWugeScore(name: string): number {
  const strokes = [...name].reduce((sum, c) => {
    const e = getCharEntry(c);
    return sum + (e?.strokes || 10);
  }, 0);
  const lucky = new Set([1, 3, 5, 6, 7, 8, 11, 13, 15, 16, 18, 21, 23, 24, 25, 31, 32, 33, 35, 37, 39, 41, 45, 47, 48, 52]);
  const tian = (getCharEntry(name[0] || '')?.strokes || 10) + 1;
  const ren = strokes;
  const base = lucky.has(ren % 50) || lucky.has(tian) ? 78 : 58;
  return clamp(base + (strokes % 5), 40, 90);
}

export { TABOO };
