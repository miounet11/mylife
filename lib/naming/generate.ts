import { brandCharPool, listGivenNamePool, type CharEntry } from './char-db';
import {
  buildCompanyNamePatterns,
  extractTradeName,
  type CompanyEntityForm,
  type CompanyJurisdiction,
} from './company-entity';
import { analyzeNameChars, computeWuge } from './kangxi-engine';
import { attachMethodsToCandidate, type MultiDimContext } from './methods';
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
  '起名结果为文化、音韵、康熙笔画与结构参考，不构成命运承诺或法律意见。公司/产品名请核验工商注册与商标。五格为传统数理参考。';

export function generatePersonNames(input: PersonGenerateInput): NamingGenerateResult {
  const surname = (input.surname || '李').trim().slice(0, 2) || '李';
  const count = Math.min(36, Math.max(8, input.count || 16));
  const yong = (input.yongShen || []).map(toWx).filter(Boolean) as Wuxing[];
  const pool = listGivenNamePool(input.gender, yong);
  const taboo = new Set([...(input.tabooChars || []), ...surname]);
  const gen = input.generationChar?.trim().slice(0, 1);
  const fixedPos = input.fixedCharPos || 'middle';
  const nameLen = input.nameLength || 'any';

  const combos: string[] = [];
  // single char given → 两字全名
  if (nameLen === 'any' || nameLen === '2') {
    for (const a of pool.slice(0, 40)) {
      if (taboo.has(a.char)) continue;
      if (gen && fixedPos === 'end') combos.push(a.char + gen);
      else if (gen && fixedPos === 'middle') combos.push(gen + a.char);
      else if (!gen) combos.push(a.char);
    }
  }
  // double char given → 三字全名
  if (nameLen === 'any' || nameLen === '3') {
    const top = pool.slice(0, 28);
    for (let i = 0; i < top.length; i++) {
      for (let j = 0; j < top.length; j++) {
        if (i === j) continue;
        const a = top[i].char;
        const b = top[j].char;
        if (taboo.has(a) || taboo.has(b)) continue;
        if (gen && fixedPos === 'middle') combos.push(gen + b);
        else if (gen && fixedPos === 'end') combos.push(a + gen);
        else combos.push(a + b);
      }
    }
  }

  const uniq = [...new Set(combos)].slice(0, 220);
  const dimCtx: MultiDimContext = {
    mode: input.originalName ? 'rename' : 'person',
    surname,
    gender: input.gender,
    yongShen: input.yongShen,
    jiShen: input.jiShen,
    birthDate: input.birthDate,
    birthTime: input.birthTime,
    birthPlace: input.birthPlace,
    dayMaster: input.dayMaster,
    wish: input.wish,
    poetryHint: input.poetryHint,
  };

  const scored = uniq
    .map((given) => {
      const base = scoreName({
        mode: 'person',
        name: given,
        surname,
        yongShen: input.yongShen,
        jiShen: input.jiShen,
        enableWuge: true,
      });
      const enriched = attachMethodsToCandidate(base, dimCtx);
      const wuge = computeWuge(surname, given);
      const chars = analyzeNameChars(given);
      return {
        ...enriched,
        styleTags: styleTagsFor(enriched, input.style),
        strokesSummary: chars.map((c) => `${c.char}${c.strokes}画`).join(' '),
        breakdown: {
          ...enriched.breakdown,
          wuge: wuge.score,
        },
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, count);

  return {
    mode: input.originalName ? 'rename' : 'person',
    generatedAt: new Date().toISOString(),
    candidates: scored,
    disclaimer: DISCLAIMER,
    meta: {
      surname,
      gender: input.gender,
      yongShen: input.yongShen,
      birthDate: input.birthDate,
      originalName: input.originalName,
      methods: ['用神补益', '三才五格', '康熙笔画', '音韵', '诗词', '天时地利人和'],
    },
  };
}

export function generateCompanyNames(input: CompanyGenerateInput): NamingGenerateResult {
  const count = Math.min(36, Math.max(8, input.count || 18));
  const yong = (input.yongShen || []).map(toWx).filter(Boolean) as Wuxing[];
  const pool = brandCharPool(yong);
  const kws = (input.keywords || []).map((k) => k.trim()).filter(Boolean).slice(0, 6);
  const tradeSeed = [
    ...(input.tradeName ? [input.tradeName.trim()] : []),
    ...kws,
  ].filter(Boolean);

  // 字号：用户核心词 + 引擎组合短名
  const syntheticCores = buildBrandCombos(pool, input.preferredLength || 2, kws).slice(0, 16);
  const tradeNames = extractTradeName(tradeSeed, syntheticCores);

  const patterns = buildCompanyNamePatterns({
    tradeNames,
    industry: input.industry,
    region: input.region,
    jurisdiction: (input.jurisdiction as CompanyJurisdiction) || 'CN',
    entityForm: (input.entityForm as CompanyEntityForm) || 'co_ltd',
    count: Math.max(count * 2, 28),
  });

  const userCores = new Set(
    [input.tradeName, ...kws]
      .map((s) => (s || '').trim())
      .filter(Boolean),
  );

  const dimCtx: MultiDimContext = {
    mode: 'company',
    yongShen: input.yongShen,
    jiShen: input.jiShen,
    birthDate: input.birthDate,
    birthTime: input.birthTime,
    birthPlace: input.birthPlace || input.region,
    dayMaster: input.dayMaster,
    industry: input.industry,
    region: input.region,
    wish: input.wish,
  };

  const scored: NameCandidate[] = patterns
    .map((p) => {
      // 打分用字号核心，展示用全称
      const base = scoreName({
        mode: 'company',
        name: p.brandCore,
        yongShen: input.yongShen,
        industry: input.industry,
        enableWuge: input.enableWuge,
      });
      // 完整法定名略加传播分（更像可注册主体）
      let score = base.score;
      if (/有限公司|Limited|LLC|Inc\.|Pte|株式会社|股份/.test(p.fullName)) score = Math.min(98, score + 6);
      if (p.patternLabel.includes('行政区')) score = Math.min(98, score + 3);
      if (input.industry && p.fullName.includes(input.industry.slice(0, 2))) {
        score = Math.min(98, score + 2);
      }
      // 用户输入的字号/关键词优先（对标「伙计→伙计科技有限公司」）
      if (userCores.has(p.brandCore) || [...userCores].some((u) => p.fullName.includes(u))) {
        score = Math.min(98, score + 18);
      }
      const draft: NameCandidate = {
        ...base,
        name: p.brandCore,
        fullName: p.fullName,
        english: p.english,
        score,
        breakdown: {
          ...base.breakdown,
          total: score,
          brandability: Math.min(98, (base.breakdown.brandability || 70) + 8),
        },
        reason: [
          p.patternLabel,
          input.industry ? `行业 ${input.industry}` : null,
          p.jurisdiction !== 'CN' ? `法域 ${p.jurisdiction}` : '大陆主体格式',
          base.reason,
        ]
          .filter(Boolean)
          .join(' · '),
        styleTags: [p.patternLabel, p.jurisdiction, input.industry || 'business'].filter(
          Boolean,
        ) as string[],
        jurisdiction: p.jurisdiction,
        entityForm: p.entityForm,
        patternLabel: p.patternLabel,
      };
      const enriched = attachMethodsToCandidate(draft, dimCtx);
      const chars = analyzeNameChars(p.brandCore);
      let finalScore = enriched.score;
      if (userCores.has(p.brandCore) || [...userCores].some((u) => p.fullName.includes(u))) {
        finalScore = Math.min(98, finalScore + 12);
      }
      if (/有限公司|Limited|LLC|Inc\./.test(p.fullName)) {
        finalScore = Math.min(98, finalScore + 4);
      }
      return {
        ...enriched,
        score: finalScore,
        strokesSummary: chars.map((c) => `${c.char}${c.strokes}画`).join(' '),
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, count);

  return {
    mode: 'company',
    generatedAt: new Date().toISOString(),
    candidates: scored,
    disclaimer:
      DISCLAIMER +
      ' 公司全称仅为命名结构示意，注册前请按当地公司法核验字号、行业表述与主体后缀是否可核名。',
    meta: {
      industry: input.industry,
      keywords: kws,
      tradeName: input.tradeName,
      region: input.region,
      jurisdiction: input.jurisdiction || 'CN',
      entityForm: input.entityForm || 'co_ltd',
    },
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

  const dimCtx: MultiDimContext = {
    mode: 'product',
    yongShen: input.yongShen,
    jiShen: input.jiShen,
    birthDate: input.birthDate,
    birthTime: input.birthTime,
    birthPlace: input.birthPlace || input.region,
    dayMaster: input.dayMaster,
    category: input.category,
    region: input.region,
    wish: input.wish,
  };

  const scored = [...new Set(combos)]
    .map((name) => {
      const base = scoreName({
        mode: 'product',
        name,
        industry: input.category,
        yongShen: input.yongShen,
      });
      const eng = input.bilingual ? toRoughPinyinBrand(name) : undefined;
      const draft: NameCandidate = {
        ...base,
        english: eng,
        styleTags: [style, input.category || 'product'].filter(Boolean) as string[],
        reason: `${base.reason} · 风格 ${styleLabel(style)}`,
      };
      const enriched = attachMethodsToCandidate(draft, dimCtx);
      const chars = analyzeNameChars(name);
      return {
        ...enriched,
        strokesSummary: chars.map((c) => `${c.char}${c.strokes}画`).join(' '),
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, count);

  return {
    mode: 'product',
    generatedAt: new Date().toISOString(),
    candidates: scored,
    disclaimer: DISCLAIMER,
    meta: { category: input.category, style, keywords: kws, birthDate: input.birthDate },
  };
}

export function generateByMode(
  mode: NamingMode,
  body: Record<string, unknown>,
): NamingGenerateResult {
  if (mode === 'rename') {
    return generatePersonNames({
      surname: str(body.surname) || '李',
      gender: (body.gender as PersonGenerateInput['gender']) || 'neutral',
      yongShen: arr(body.yongShen),
      jiShen: arr(body.jiShen),
      generationChar: str(body.generationChar),
      fixedCharPos: body.fixedCharPos === 'end' ? 'end' : 'middle',
      tabooChars: arr(body.tabooChars),
      style: (body.style as PersonGenerateInput['style']) || 'modern',
      nameLength:
        body.nameLength === '2' || body.nameLength === '3' ? body.nameLength : 'any',
      wish: str(body.wish),
      poetryHint: str(body.poetryHint),
      birthDate: str(body.birthDate),
      birthTime: str(body.birthTime),
      birthPlace: str(body.birthPlace),
      dayMaster: str(body.dayMaster),
      originalName: str(body.originalName) || '（原名）',
      count: num(body.count),
      enableWuge: body.enableWuge !== false,
    });
  }
  if (mode === 'company') {
    return generateCompanyNames({
      industry: str(body.industry),
      keywords: arr(body.keywords),
      tradeName: str(body.tradeName) || arr(body.keywords)[0],
      region: str(body.region),
      jurisdiction: str(body.jurisdiction) || 'CN',
      entityForm: str(body.entityForm) || 'co_ltd',
      preferredLength: (Number(body.preferredLength) as 2 | 3 | 4) || 2,
      yongShen: arr(body.yongShen),
      jiShen: arr(body.jiShen),
      birthDate: str(body.birthDate),
      birthTime: str(body.birthTime),
      birthPlace: str(body.birthPlace),
      dayMaster: str(body.dayMaster),
      wish: str(body.wish),
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
      yongShen: arr(body.yongShen),
      jiShen: arr(body.jiShen),
      birthDate: str(body.birthDate),
      birthTime: str(body.birthTime),
      birthPlace: str(body.birthPlace),
      dayMaster: str(body.dayMaster),
      region: str(body.region),
      wish: str(body.wish),
    });
  }
  return generatePersonNames({
    surname: str(body.surname) || '李',
    gender: (body.gender as PersonGenerateInput['gender']) || 'neutral',
    yongShen: arr(body.yongShen),
    jiShen: arr(body.jiShen),
    generationChar: str(body.generationChar),
    fixedCharPos: body.fixedCharPos === 'end' ? 'end' : 'middle',
    tabooChars: arr(body.tabooChars),
    style: (body.style as PersonGenerateInput['style']) || 'modern',
    nameLength:
      body.nameLength === '2' || body.nameLength === '3' ? body.nameLength : 'any',
    wish: str(body.wish),
    poetryHint: str(body.poetryHint),
    birthDate: str(body.birthDate),
    birthTime: str(body.birthTime),
    birthPlace: str(body.birthPlace),
    dayMaster: str(body.dayMaster),
    originalName: str(body.originalName),
    count: num(body.count),
    enableWuge: body.enableWuge !== false,
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
