import { brandCharPool, listGivenNamePool, type CharEntry } from './char-db';
import { scoreName } from './score';
import type {
  CompanyGenerateInput,
  NameCandidate,
  NamingGenerateResult,
  NamingMode,
  PersonGenerateInput,
  ProductGenerateInput,
  Wuxing,
} from './types';

const DISCLAIMER =
  '起名结果为文化、音韵与结构参考，不构成命运承诺或法律意见。公司/产品名请核验工商注册与商标。';

export function generatePersonNames(input: PersonGenerateInput): NamingGenerateResult {
  const surname = (input.surname || '李').trim().slice(0, 2) || '李';
  const count = Math.min(36, Math.max(8, input.count || 16));
  const yong = (input.yongShen || []).map(toWx).filter(Boolean) as Wuxing[];
  const pool = listGivenNamePool(input.gender, yong);
  const taboo = new Set([...(input.tabooChars || []), ...surname]);
  const gen = input.generationChar?.trim().slice(0, 1);

  const combos: string[] = [];
  // single char
  for (const a of pool.slice(0, 40)) {
    if (taboo.has(a.char)) continue;
    if (gen) combos.push(gen + a.char);
    else combos.push(a.char);
  }
  // double char
  const top = pool.slice(0, 28);
  for (let i = 0; i < top.length; i++) {
    for (let j = 0; j < top.length; j++) {
      if (i === j) continue;
      const a = top[i].char;
      const b = top[j].char;
      if (taboo.has(a) || taboo.has(b)) continue;
      if (gen) combos.push(gen + b);
      else combos.push(a + b);
    }
  }

  const uniq = [...new Set(combos)].slice(0, 200);
  const scored = uniq
    .map((given) =>
      scoreName({
        mode: 'person',
        name: given,
        surname,
        yongShen: input.yongShen,
        jiShen: input.jiShen,
        enableWuge: input.enableWuge,
      }),
    )
    .map((c) => ({
      ...c,
      styleTags: styleTagsFor(c, input.style),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, count);

  return {
    mode: 'person',
    generatedAt: new Date().toISOString(),
    candidates: scored,
    disclaimer: DISCLAIMER,
    meta: { surname, gender: input.gender, yongShen: input.yongShen },
  };
}

export function generateCompanyNames(input: CompanyGenerateInput): NamingGenerateResult {
  const count = Math.min(36, Math.max(8, input.count || 16));
  const len = input.preferredLength || 2;
  const yong = (input.yongShen || []).map(toWx).filter(Boolean) as Wuxing[];
  const pool = brandCharPool(yong);
  const kws = (input.keywords || []).map((k) => k.trim()).filter(Boolean).slice(0, 5);

  const combos = buildBrandCombos(pool, len, kws);
  const scored = combos
    .map((name) =>
      scoreName({
        mode: 'company',
        name,
        yongShen: input.yongShen,
        industry: input.industry,
        enableWuge: input.enableWuge,
      }),
    )
    .map((c) => ({
      ...c,
      reason: [c.reason, input.industry ? `行业：${input.industry}` : '']
        .filter(Boolean)
        .join(' · '),
      styleTags: ['brand', input.industry || 'business'].filter(Boolean),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, count);

  return {
    mode: 'company',
    generatedAt: new Date().toISOString(),
    candidates: scored,
    disclaimer: DISCLAIMER,
    meta: { industry: input.industry, keywords: kws },
  };
}

export function generateProductNames(input: ProductGenerateInput): NamingGenerateResult {
  const count = Math.min(36, Math.max(8, input.count || 16));
  const pool = brandCharPool();
  const kws = (input.keywords || []).map((k) => k.trim()).filter(Boolean).slice(0, 5);
  const style = input.style || 'steady';
  const len = style === 'global' ? 2 : style === 'guofeng' ? 2 : 2;

  const combos = buildBrandCombos(pool, len as 2, kws);
  // add keyword fusion
  for (const k of kws) {
    if (/[\u4e00-\u9fff]{1,2}/.test(k)) {
      for (const c of pool.slice(0, 12)) combos.push(k.slice(0, 2) + c.char);
    }
  }

  const scored = [...new Set(combos)]
    .map((name) => {
      const base = scoreName({ mode: 'product', name, industry: input.category });
      const eng = input.bilingual ? toRoughPinyinBrand(name) : undefined;
      return {
        ...base,
        english: eng,
        styleTags: [style, input.category || 'product'].filter(Boolean) as string[],
        reason: `${base.reason} · 风格 ${styleLabel(style)}`,
      } satisfies NameCandidate;
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, count);

  return {
    mode: 'product',
    generatedAt: new Date().toISOString(),
    candidates: scored,
    disclaimer: DISCLAIMER,
    meta: { category: input.category, style, keywords: kws },
  };
}

export function generateByMode(
  mode: NamingMode,
  body: Record<string, unknown>,
): NamingGenerateResult {
  if (mode === 'company') {
    return generateCompanyNames({
      industry: str(body.industry),
      keywords: arr(body.keywords),
      preferredLength: (Number(body.preferredLength) as 2 | 3 | 4) || 2,
      yongShen: arr(body.yongShen),
      count: num(body.count),
      enableWuge: body.enableWuge === true,
    });
  }
  if (mode === 'product') {
    return generateProductNames({
      category: str(body.category),
      keywords: arr(body.keywords),
      style: (body.style as ProductGenerateInput['style']) || 'steady',
      count: num(body.count),
      bilingual: body.bilingual !== false,
    });
  }
  return generatePersonNames({
    surname: str(body.surname) || '李',
    gender: (body.gender as PersonGenerateInput['gender']) || 'neutral',
    yongShen: arr(body.yongShen),
    jiShen: arr(body.jiShen),
    generationChar: str(body.generationChar),
    tabooChars: arr(body.tabooChars),
    style: (body.style as PersonGenerateInput['style']) || 'modern',
    count: num(body.count),
    enableWuge: body.enableWuge === true,
  });
}

function buildBrandCombos(pool: CharEntry[], len: number, kws: string[]): string[] {
  const out: string[] = [];
  const top = pool.slice(0, 36);
  if (len <= 2) {
    for (let i = 0; i < top.length; i++) {
      for (let j = 0; j < top.length; j++) {
        if (i === j) continue;
        out.push(top[i].char + top[j].char);
      }
    }
  } else {
    for (let i = 0; i < Math.min(12, top.length); i++) {
      for (let j = 0; j < Math.min(12, top.length); j++) {
        for (let k = 0; k < Math.min(8, top.length); k++) {
          out.push(top[i].char + top[j].char + top[k].char);
        }
      }
    }
  }
  // inject keywords
  for (const k of kws) {
    const pure = [...k].filter((c) => /[\u4e00-\u9fff]/.test(c)).join('').slice(0, 2);
    if (!pure) continue;
    for (const c of top.slice(0, 10)) {
      out.push(pure + c.char);
      out.push(c.char + pure);
    }
  }
  return [...new Set(out)].slice(0, 300);
}

function styleTagsFor(c: NameCandidate, style?: string): string[] {
  const tags = [style || 'modern'];
  if (c.breakdown.wuxing >= 75) tags.push('用神友好');
  if (c.breakdown.phonology >= 80) tags.push('音韵顺');
  return tags;
}

function styleLabel(s: string) {
  return (
    { steady: '稳重', tech: '科技', guofeng: '国风', global: '洋气' } as Record<string, string>
  )[s] || s;
}

function toRoughPinyinBrand(name: string): string {
  // lightweight aesthetic romanization stub (not full pinyin table)
  const map: Record<string, string> = {
    云: 'Yun',
    启: 'Qi',
    明: 'Ming',
    华: 'Hua',
    科: 'Ke',
    创: 'Chuang',
    新: 'Xin',
    智: 'Zhi',
    源: 'Yuan',
    汇: 'Hui',
    安: 'An',
    信: 'Xin',
    德: 'De',
    和: 'He',
    泰: 'Tai',
    瑞: 'Rui',
    星: 'Xing',
    光: 'Guang',
    远: 'Yuan',
    达: 'Da',
  };
  const parts = [...name].map((c) => map[c] || c);
  return parts.join('');
}

function toWx(s: string): Wuxing | null {
  if (s === '木' || s === '火' || s === '土' || s === '金' || s === '水') return s;
  return null;
}

function str(v: unknown) {
  return typeof v === 'string' ? v.trim() : '';
}
function arr(v: unknown): string[] {
  if (Array.isArray(v)) return v.map(String).map((s) => s.trim()).filter(Boolean);
  if (typeof v === 'string')
    return v
      .split(/[,，、\s]+/)
      .map((s) => s.trim())
      .filter(Boolean);
  return [];
}
function num(v: unknown) {
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}
