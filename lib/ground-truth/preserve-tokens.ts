/**
 * Token preservation for engine→LLM paraphrase gates.
 * Shared by dimensions enhance, agentic verify, and chat locks.
 */

const TOKEN_PATTERNS: RegExp[] = [
  /\d{4}-\d{2}-\d{2}/g,
  /\d{4}年(?:Q[1-4]|[上下]半年)?/g,
  /\d{4}年/g,
  /Q[1-4]/g,
  /\d+(?:\.\d+)?分/g,
  /\d+(?:\.\d+)?%/g,
  /[甲乙丙丁戊己庚辛壬癸][子丑寅卯辰巳午未申酉戌亥]/g,
  /[甲乙丙丁戊己庚辛壬癸][木火土金水]/g,
  /[木火土金水]/g,
  /(?:正|偏)(?:印|财|官)|七杀|食神|伤官|比肩|劫财|日主/g,
];

/** Extract tokens that must survive LLM paraphrasing. */
export function extractPreservedTokens(text: string): string[] {
  const found = new Set<string>();
  for (const pattern of TOKEN_PATTERNS) {
    // Reset lastIndex for global regex reuse safety
    pattern.lastIndex = 0;
    const matches = text.match(pattern);
    if (matches) {
      for (const match of matches) found.add(match);
    }
  }
  return [...found];
}

export function tokensPreservedInItems(original: string[], enhanced: string[]): boolean {
  if (original.length !== enhanced.length) return false;

  const originalTokens = extractPreservedTokens(original.join(' '));
  if (!originalTokens.length) return true;

  const enhancedText = enhanced.join(' ');
  return originalTokens.every((token) => enhancedText.includes(token));
}

export function tokensPreservedInText(original: string, enhanced: string): boolean {
  return tokensPreservedInItems([original], [enhanced]);
}

/** Build a lock list from structured engine fields (not free text). */
export function lockedFactsToPreserveTokens(facts: {
  dayMaster?: string;
  pillars?: string[];
  yongShen?: string[];
  xiShen?: string[];
  jiShen?: string[];
  dayunGanZhi?: string[];
  anchorYears?: number[];
  scores?: Array<string | number>;
}): string[] {
  const tokens = new Set<string>();
  if (facts.dayMaster) tokens.add(facts.dayMaster);
  for (const p of facts.pillars || []) if (p) tokens.add(p);
  for (const e of [...(facts.yongShen || []), ...(facts.xiShen || []), ...(facts.jiShen || [])]) {
    if (e) tokens.add(e);
  }
  for (const g of facts.dayunGanZhi || []) if (g) tokens.add(g);
  for (const y of facts.anchorYears || []) if (Number.isFinite(y)) tokens.add(String(y));
  for (const s of facts.scores || []) {
    const t = `${s}`.trim();
    if (t) tokens.add(t);
  }
  return [...tokens];
}

export function allTokensPresent(text: string, tokens: string[]): boolean {
  if (!tokens.length) return true;
  return tokens.every((token) => token && text.includes(token));
}
