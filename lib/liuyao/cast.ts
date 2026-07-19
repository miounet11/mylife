/**
 * Educational 六爻 coin-method cast (排卦).
 * Generates 本卦 / 变卦 structure only — no automatic judgment text.
 */

export type YaoValue = 6 | 7 | 8 | 9; // 老阴 / 少阳 / 少阴 / 老阳

export type YaoLine = {
  /** 初爻 → 上爻 index 0..5 */
  index: number;
  value: YaoValue;
  /** true = 阳爻 */
  yang: boolean;
  changing: boolean;
  label: string;
};

export type LiuyaoCastResult = {
  seed: string;
  lines: YaoLine[]; // 初 to 上
  benBinary: string; // 6 bits bottom-to-top 1=yang
  bianBinary: string;
  benName: string;
  bianName: string;
  changingCount: number;
  method: 'three-coin';
  disclaimer: string;
};

/**
 * 64 gua names. Binary string position 0 = 初爻 (bottom), '1' = 阳, '0' = 阴.
 * Trigram order (bottom→top bits): 乾111 兑110 离101 震100 巽011 坎010 艮001 坤000
 */
const TRIGRAM: Record<string, string> = {
  '111': '乾',
  '110': '兑',
  '101': '离',
  '100': '震',
  '011': '巽',
  '010': '坎',
  '001': '艮',
  '000': '坤',
};

/** Upper×lower → full name (common educational set; unknown → composed). */
const GUA_PAIR: Record<string, string> = {
  乾乾: '乾为天',
  坤坤: '坤为地',
  坎震: '水雷屯',
  艮坎: '山水蒙',
  坎乾: '水天需',
  乾坎: '天水讼',
  坤坎: '地水师',
  坎坤: '水地比',
  巽乾: '风天小畜',
  乾兑: '天泽履',
  坤乾: '地天泰',
  乾坤: '天地否',
  乾离: '天火同人',
  离乾: '火天大有',
  坤艮: '地山谦',
  震坤: '雷地豫',
  兑震: '泽雷随',
  艮巽: '山风蛊',
  坤兑: '地泽临',
  巽坤: '风地观',
  离震: '火雷噬嗑',
  艮离: '山火贲',
  艮坤: '山地剥',
  坤震: '地雷复',
  乾震: '天雷无妄',
  艮乾: '山天大畜',
  艮震: '山雷颐',
  兑巽: '泽风大过',
  坎坎: '坎为水',
  离离: '离为火',
  兑艮: '泽山咸',
  震巽: '雷风恒',
  乾艮: '天山遁',
  震乾: '雷天大壮',
  离坤: '火地晋',
  坤离: '地火明夷',
  巽离: '风火家人',
  离兑: '火泽睽',
  坎艮: '水山蹇',
  震坎: '雷水解',
  艮兑: '山泽损',
  巽震: '风雷益',
  兑乾: '泽天夬',
  乾巽: '天风姤',
  兑坤: '泽地萃',
  坤巽: '地风升',
  兑坎: '泽水困',
  坎巽: '水风井',
  兑离: '泽火革',
  离巽: '火风鼎',
  震震: '震为雷',
  艮艮: '艮为山',
  巽艮: '风山渐',
  震兑: '雷泽归妹',
  震离: '雷火丰',
  离艮: '火山旅',
  巽巽: '巽为风',
  兑兑: '兑为泽',
  坎离: '水火既济',
  离坎: '火水未济',
  巽兑: '风泽中孚',
  震艮: '雷山小过',
  坎兑: '水泽节',
  巽坎: '风水涣',
  坤震: '地雷复',
};

function nameForBinary(bin: string): string {
  if (bin.length !== 6) return `卦象 ${bin}`;
  const lower = TRIGRAM[bin.slice(0, 3)] || '?';
  const upper = TRIGRAM[bin.slice(3, 6)] || '?';
  const key = `${upper}${lower}`;
  return GUA_PAIR[key] || `${upper}${lower}卦`;
}

function yaoLabel(v: YaoValue): string {
  if (v === 6) return '老阴 ×';
  if (v === 7) return '少阳 —';
  if (v === 8) return '少阴 --';
  return '老阳 ○';
}

/** Mulberry32 PRNG for deterministic cast from seed. */
function mulberry32(a: number) {
  return function next() {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashSeed(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Three-coin method: 3 coins → 6..9 */
function castYao(rand: () => number): YaoValue {
  // each coin: 2 = yang (back), 3 = yin (face) classic numbering
  let sum = 0;
  for (let i = 0; i < 3; i += 1) {
    sum += rand() < 0.5 ? 2 : 3;
  }
  // sum 6,7,8,9
  return sum as YaoValue;
}

export function castLiuyao(seedInput?: string): LiuyaoCastResult {
  const seed = (seedInput || `${Date.now()}-${Math.random()}`).slice(0, 64);
  const rand = mulberry32(hashSeed(seed));
  const lines: YaoLine[] = [];
  let ben = '';
  let bian = '';
  let changingCount = 0;

  for (let i = 0; i < 6; i += 1) {
    const value = castYao(rand);
    const yang = value === 7 || value === 9;
    const changing = value === 6 || value === 9;
    if (changing) changingCount += 1;
    lines.push({
      index: i,
      value,
      yang,
      changing,
      label: yaoLabel(value),
    });
    ben += yang ? '1' : '0';
    // 变卦: 变爻阴阳翻转
    const bianYang = changing ? !yang : yang;
    bian += bianYang ? '1' : '0';
  }

  return {
    seed,
    lines,
    benBinary: ben,
    bianBinary: bian,
    benName: nameForBinary(ben),
    bianName: nameForBinary(bian),
    changingCount,
    method: 'three-coin',
    disclaimer:
      '教育排卦：仅演示三枚铜钱起卦与本卦/变卦结构，不自动断事、不承诺吉凶。',
  };
}

export function listKnownGuaCount(): number {
  return Object.keys(GUA_PAIR).filter((k) => GUA_PAIR[k]).length;
}
