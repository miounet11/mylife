/**
 * 报告展示层规范化：
 * - 用神/五行英文 key → 中文
 * - 去掉“当前专家结果待补强”等占位噪音
 * - 压缩重复空白，避免同一结论在 UI 里显得脏乱
 */

const ELEMENT_EN_TO_CN: Record<string, string> = {
  wood: '木',
  fire: '火',
  earth: '土',
  metal: '金',
  water: '水',
  Wood: '木',
  Fire: '火',
  Earth: '土',
  Metal: '金',
  Water: '水',
};

const ELEMENT_CN = new Set(['木', '火', '土', '金', '水']);

const NOISE_PHRASES = [
  /当前专家结果待补强/g,
  /专家结果待补强/g,
  /当前结果待补强/g,
  /待补强/g,
  /\s*参考窗口\s*$/g,
];

export function localizeElementToken(token: string | null | undefined): string {
  const raw = `${token || ''}`.trim();
  if (!raw) return '';
  if (ELEMENT_CN.has(raw)) return raw;
  if (ELEMENT_EN_TO_CN[raw]) return ELEMENT_EN_TO_CN[raw];
  const lower = raw.toLowerCase();
  if (ELEMENT_EN_TO_CN[lower]) return ELEMENT_EN_TO_CN[lower];
  return raw;
}

export function localizeElementList(values?: Array<string | null | undefined> | null): string[] {
  if (!Array.isArray(values)) return [];
  const out: string[] = [];
  const seen = new Set<string>();
  for (const value of values) {
    const localized = localizeElementToken(value);
    if (!localized || seen.has(localized)) continue;
    seen.add(localized);
    out.push(localized);
  }
  return out;
}

/** 把自由文本里的 wood/fire/metal... 替换为中文五行（含 metal顺势 这类无边界拼接） */
export function localizeElementsInText(input: string): string {
  if (!input) return '';
  return input
    .replace(/\b(wood|fire|earth|metal|water)\b/gi, (match) => localizeElementToken(match))
    .replace(/(wood|fire|earth|metal|water)(?=顺势|为用|为喜|为忌|、|，|,|。|；|;|\s|$)/gi, (match) =>
      localizeElementToken(match)
    );
}

export function presentReportText(input: unknown, maxLen?: number): string {
  let text = `${input ?? ''}`.replace(/\s+/g, ' ').trim();
  if (!text) return '';

  for (const pattern of NOISE_PHRASES) {
    text = text.replace(pattern, '');
  }

  text = localizeElementsInText(text)
    .replace(/[，,]{2,}/g, '，')
    .replace(/[。.]{2,}/g, '。')
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+([，。；;：:])/g, '$1')
    .replace(/([，。；;：:])\s+/g, '$1')
    .replace(/^[，。；;\s]+|[，。；;\s]+$/g, '')
    .trim();

  if (maxLen && text.length > maxLen) {
    return `${text.slice(0, Math.max(0, maxLen - 1)).trim()}…`;
  }
  return text;
}

export function presentReportLines(
  values?: Array<string | null | undefined> | null,
  options?: { limit?: number; maxLen?: number }
): string[] {
  if (!Array.isArray(values)) return [];
  const limit = options?.limit ?? 8;
  const out: string[] = [];
  const seen = new Set<string>();
  for (const value of values) {
    const cleaned = presentReportText(value, options?.maxLen);
    if (!cleaned) continue;
    const key = cleaned.slice(0, 48);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(cleaned);
    if (out.length >= limit) break;
  }
  return out;
}

/** 归一化 advice 五行字段，供 report-v2 比较与展示共用 */
export function presentAdviceElements(advice?: {
  yongShen?: string[] | null;
  xiShen?: string[] | null;
  jiShen?: string[] | null;
  colors?: string[] | null;
  directions?: string[] | null;
} | null) {
  return {
    yongShen: localizeElementList(advice?.yongShen),
    xiShen: localizeElementList(advice?.xiShen),
    jiShen: localizeElementList(advice?.jiShen),
    colors: Array.isArray(advice?.colors) ? advice!.colors!.filter(Boolean) : [],
    directions: Array.isArray(advice?.directions) ? advice!.directions!.filter(Boolean) : [],
  };
}

export function withPresentedAdvice<T extends { advice?: any }>(result: T): T {
  if (!result || typeof result !== 'object') return result;
  const advice = result.advice || {};
  const presented = presentAdviceElements(advice);
  return {
    ...result,
    advice: {
      ...advice,
      yongShen: presented.yongShen.length ? presented.yongShen : advice.yongShen,
      xiShen: presented.xiShen.length ? presented.xiShen : advice.xiShen,
      jiShen: presented.jiShen.length ? presented.jiShen : advice.jiShen,
      career: advice.career
        ? {
            ...advice.career,
            general: presentReportText(advice.career.general),
            specific: presentReportLines(advice.career.specific),
            timing: presentReportText(advice.career.timing),
          }
        : advice.career,
      wealth: advice.wealth
        ? {
            ...advice.wealth,
            general: presentReportText(advice.wealth.general),
            specific: presentReportLines(advice.wealth.specific),
            timing: presentReportText(advice.wealth.timing),
          }
        : advice.wealth,
      marriage: advice.marriage
        ? {
            ...advice.marriage,
            general: presentReportText(advice.marriage.general),
            specific: presentReportLines(advice.marriage.specific),
            timing: presentReportText(advice.marriage.timing),
          }
        : advice.marriage,
      health: advice.health
        ? {
            ...advice.health,
            general: presentReportText(advice.health.general),
            specific: presentReportLines(advice.health.specific),
            timing: presentReportText(advice.health.timing),
          }
        : advice.health,
    },
    fortune: result.fortune
      ? {
          ...result.fortune,
          interaction: presentReportText((result as any).fortune?.interaction),
          nextYear: presentReportText((result as any).fortune?.nextYear),
          currentDaYun: presentReportText((result as any).fortune?.currentDaYun),
          currentLiuNian: presentReportText((result as any).fortune?.currentLiuNian),
        }
      : (result as any).fortune,
    pattern: (result as any).pattern
      ? {
          ...(result as any).pattern,
          description: presentReportText((result as any).pattern?.description),
        }
      : (result as any).pattern,
    analysis: (result as any).analysis
      ? {
          ...(result as any).analysis,
          opening: presentReportText((result as any).analysis?.opening),
          summary: presentReportText((result as any).analysis?.summary),
          explanation: presentReportText((result as any).analysis?.explanation),
          enhancementNotes: presentReportLines((result as any).analysis?.enhancementNotes, { limit: 12 }),
          judgmentBlocks: presentJudgmentBlocks((result as any).analysis?.judgmentBlocks),
        }
      : (result as any).analysis,
  };
}

function presentJudgmentBlocks(blocks: any) {
  if (!blocks || typeof blocks !== 'object') return blocks;
  const presentBlock = (block: any) => {
    if (!block || typeof block !== 'object') return block;
    return {
      ...block,
      headline: presentReportText(block.headline) || block.headline,
      summary: presentReportText(block.summary) || block.summary,
      detail: presentReportText(block.detail) || block.detail,
      evidence: presentReportLines(block.evidence, { limit: 8 }),
      points: presentReportLines(block.points, { limit: 8 }),
      actions: presentReportLines(block.actions, { limit: 8 }),
    };
  };
  return {
    ...blocks,
    pastValidation: presentBlock(blocks.pastValidation),
    presentDiagnosis: presentBlock(blocks.presentDiagnosis),
    futureGuidance: presentBlock(blocks.futureGuidance),
  };
}
