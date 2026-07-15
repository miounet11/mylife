export type EncyclopediaKind = 'gua' | 'jieqi' | 'ziwei' | 'yuejiang';

const ENCYCLOPEDIA_CATEGORIES: Record<string, EncyclopediaKind> = {
  '64 卦百科': 'gua',
  '24 节气百科': 'jieqi',
  '紫微主星百科': 'ziwei',
  '建除十二神百科': 'yuejiang',
};

const SLUG_PREFIXES: Array<{ prefix: string; kind: EncyclopediaKind }> = [
  { prefix: 'gua-', kind: 'gua' },
  { prefix: 'jieqi-', kind: 'jieqi' },
  { prefix: 'ziwei-', kind: 'ziwei' },
  { prefix: 'yuejiang-', kind: 'yuejiang' },
];

export interface EncyclopediaWorldYiLens {
  kind: EncyclopediaKind;
  label: string;
  title: string;
  lead: string;
  structurePrompt: string;
  timingPrompt: string;
  actionPrompt: string;
  boundary: string;
  learnHref: string;
  methodologyHref: string;
  analyzeHref: string;
}

const LENS_BY_KIND: Record<EncyclopediaKind, Omit<EncyclopediaWorldYiLens, 'kind' | 'learnHref' | 'methodologyHref' | 'analyzeHref'>> = {
  gua: {
    label: '64卦百科',
    title: '世界易读法 · 卦象',
    lead: '卦象不是吉凶标签，而是结构、时位与进退关系的压缩表达。',
    structurePrompt: '先问：这个卦在描述哪种结构张力？强弱、内外、动止分别落在哪一层？',
    timingPrompt: '再问：它出现在什么阶段？是蓄势、推进、转折还是收束？',
    actionPrompt: '最后落到行动：此刻适合巩固、试探、暂停还是切换策略？',
    boundary: '世界易不用卦象替代现实决策；它帮助你看清结构，不替你做选择。',
  },
  jieqi: {
    label: '24节气百科',
    title: '世界易读法 · 节气',
    lead: '节气是时位坐标，不是神秘开关。它标记能量交接与节奏边界。',
    structurePrompt: '先问：这个节气改变了哪一层环境？对日主与用神是助力还是消耗？',
    timingPrompt: '再问：它适合启动、调整、收尾还是恢复？与当前大运是否同向？',
    actionPrompt: '最后落到行动：把动作拆成「本周可执行」与「本季可观察」两层。',
    boundary: '择时讲的是阶段匹配，不是挑一个神奇日期。',
  },
  ziwei: {
    label: '紫微主星百科',
    title: '世界易读法 · 主星',
    lead: '主星是角色密度与推进方式的描述，不是固定人设。',
    structurePrompt: '先问：这颗星在命盘里承担什么功能？是主导、辅佐、消耗还是缓冲？',
    timingPrompt: '再问：当前大限/流年是在放大还是压制这颗星的表达？',
    actionPrompt: '最后落到行动：你该补角色、减角色，还是换环境让角色更顺？',
    boundary: '紫微读的是角色与节奏，不替代心理、医疗或法律判断。',
  },
  yuejiang: {
    label: '建除十二神百科',
    title: '世界易读法 · 建除',
    lead: '建除是行动节律提示，不是绝对宜忌清单。',
    structurePrompt: '先问：这件事属于开创、调整、收尾还是守成？与建除神性是否同向？',
    timingPrompt: '再问：当前阶段更需要速度，还是更需要稳固与复查？',
    actionPrompt: '最后落到行动：把「宜/忌」翻译成可执行的顺序调整，而非迷信回避。',
    boundary: '择日服务于动作顺序，不保证结果必然发生。',
  },
};

export function detectEncyclopediaKind(input: {
  slug: string;
  category?: string | null;
}): EncyclopediaKind | null {
  const category = input.category?.trim();
  if (category && ENCYCLOPEDIA_CATEGORIES[category]) {
    return ENCYCLOPEDIA_CATEGORIES[category];
  }

  const slug = input.slug.toLowerCase();
  for (const item of SLUG_PREFIXES) {
    if (slug.startsWith(item.prefix)) {
      return item.kind;
    }
  }

  return null;
}

export function isEncyclopediaArticle(input: {
  slug: string;
  category?: string | null;
}): boolean {
  return detectEncyclopediaKind(input) !== null;
}

export function getEncyclopediaWorldYiLens(input: {
  slug: string;
  category?: string | null;
  source?: string;
}): EncyclopediaWorldYiLens | null {
  const kind = detectEncyclopediaKind(input);
  if (!kind) return null;

  const base = LENS_BY_KIND[kind];
  const sourceQuery = input.source ? `?source=${encodeURIComponent(input.source)}` : '';

  return {
    kind,
    ...base,
    learnHref: `/learn/classics${sourceQuery}`,
    methodologyHref: `/knowledge/world-yi-methodology${sourceQuery}`,
    analyzeHref: `/analyze${sourceQuery}`,
  };
}