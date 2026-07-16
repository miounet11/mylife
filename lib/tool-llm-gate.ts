/**
 * Free-tool LLM polish gate — merge only when engine tokens survive.
 * Used by tool-run-orchestrator enhanceToolResultWithLlm.
 */

import { ENGINE_HARD_CONTRACT, TOOL_ENGINE_CONTRACT } from '@/lib/ground-truth/hard-contract';
import {
  allTokensPresent,
  extractPreservedTokens,
  tokensPreservedInText,
} from '@/lib/ground-truth/preserve-tokens';

export type ToolLlmFields = {
  headline: string;
  summary: string;
  recommendedAction: string;
  riskReminder: string;
  whyItMatches: string;
  evidence: string[];
  premiumPreview: string[];
};

export type RawToolLlmFields = {
  headline?: unknown;
  summary?: unknown;
  recommendedAction?: unknown;
  riskReminder?: unknown;
  whyItMatches?: unknown;
  evidence?: unknown;
  premiumPreview?: unknown;
  deepDiveSections?: unknown;
  conversionBridge?: unknown;
};

function asText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => `${item || ''}`.trim()).filter(Boolean);
}

function fieldSurvives(original: string, candidate: string, extraTokens: string[]): boolean {
  if (!candidate || candidate.length < 8) return false;
  // Keep engine tokens from the deterministic field
  if (!tokensPreservedInText(original, candidate)) return false;
  // And structured pack tokens that appear in original
  const relevant = extraTokens.filter((t) => t && original.includes(t));
  if (relevant.length && !allTokensPresent(candidate, relevant)) return false;
  // Soft ban: fate absolute claims
  if (/一定|必然|注定|百分百|绝对会/.test(candidate) && !/一定|必然|注定|百分百|绝对会/.test(original)) {
    return false;
  }
  return true;
}

function mergeField(original: string, candidate: unknown, extraTokens: string[], minLen = 8): string {
  const text = asText(candidate);
  if (text.length < minLen) return original;
  return fieldSurvives(original, text, extraTokens) ? text : original;
}

function mergeEvidence(
  original: string[],
  candidate: unknown,
  extraTokens: string[],
): string[] {
  const values = asStringArray(candidate);
  if (values.length < 2) return original;
  // Require majority of original evidence tokens to survive in joined text
  const joinedOriginal = original.join(' ');
  const joinedNew = values.join(' ');
  const tokens = [
    ...extractPreservedTokens(joinedOriginal),
    ...extraTokens.filter((t) => joinedOriginal.includes(t)),
  ];
  const unique = [...new Set(tokens)];
  if (unique.length && !allTokensPresent(joinedNew, unique)) return original;
  return values.slice(0, 8);
}

/**
 * Merge LLM polish onto deterministic tool result with token gates.
 * Fields that drop engine facts fall back to engine text.
 */
export function mergeToolLlmWithPreserve(
  engine: ToolLlmFields,
  raw: RawToolLlmFields | null | undefined,
  preserveTokens: string[] = [],
): { result: ToolLlmFields; fieldsAccepted: number; fieldsRejected: number } {
  if (!raw) {
    return { result: engine, fieldsAccepted: 0, fieldsRejected: 0 };
  }

  const tokens = preserveTokens.filter(Boolean);
  let accepted = 0;
  let rejected = 0;

  const tryMerge = (orig: string, cand: unknown, minLen = 8): string => {
    const merged = mergeField(orig, cand, tokens, minLen);
    if (merged !== orig && asText(cand)) accepted += 1;
    else if (asText(cand) && asText(cand).length >= minLen) rejected += 1;
    return merged;
  };

  const evidence = mergeEvidence(engine.evidence, raw.evidence, tokens);
  if (evidence !== engine.evidence) accepted += 1;
  else if (asStringArray(raw.evidence).length >= 2) rejected += 1;

  const premium = asStringArray(raw.premiumPreview);
  const premiumPreview =
    premium.length >= 2 && !/一定发财|必涨|稳赚/.test(premium.join(''))
      ? premium.slice(0, 6)
      : engine.premiumPreview;
  if (premiumPreview !== engine.premiumPreview) accepted += 1;

  return {
    result: {
      headline: tryMerge(engine.headline, raw.headline, 10),
      summary: tryMerge(engine.summary, raw.summary, 20),
      recommendedAction: tryMerge(engine.recommendedAction, raw.recommendedAction, 10),
      riskReminder: tryMerge(engine.riskReminder, raw.riskReminder, 10),
      whyItMatches: tryMerge(engine.whyItMatches, raw.whyItMatches, 12),
      evidence,
      premiumPreview,
    },
    fieldsAccepted: accepted,
    fieldsRejected: rejected,
  };
}

export function buildToolEnhancementSystemPrompt(preserveTokens: string[] = []): string {
  const lock =
    preserveTokens.length > 0
      ? `【LOCKED_TOKENS · 输出必须保留字面】\n${preserveTokens.slice(0, 40).join('、')}`
      : '';
  return [
    '你是人生K线单项工具增强器。',
    '在 deterministic 引擎结果上做更有用的表达与落地解释，不改变底层命理结论。',
    ENGINE_HARD_CONTRACT,
    TOOL_ENGINE_CONTRACT,
    lock,
    '输出严格 JSON，字段：headline, summary, recommendedAction, riskReminder, whyItMatches, evidence, premiumPreview, deepDiveSections, conversionBridge。',
    'deepDiveSections 为 3-5 个对象：{"heading": string, "body": string}。',
    '必须克制、现代、非恐吓、非决定论；只谈结构、阶段、环境、动作、风险和复盘。',
    '不得改写日主、用神/忌神、大运干支、K线年份与分数。',
    '不要声称百分百预测，不要替代法律、医疗、财务等专业建议。',
  ]
    .filter(Boolean)
    .join('\n');
}

export function filterDeepDiveSections(
  sections: Array<{ heading: string; body: string }>,
  preserveTokens: string[],
): Array<{ heading: string; body: string }> {
  if (!sections.length) return [];
  const tokens = preserveTokens.filter(Boolean);
  return sections.filter((s) => {
    const text = `${s.heading} ${s.body}`;
    if (/一定|必然|注定|百分百|确诊|稳赚|保本/.test(text)) return false;
    // deep dive can be freer; only reject if it invents conflicting day-master claims
    const dm = tokens.find((t) => /^[甲乙丙丁戊己庚辛壬癸]$/.test(t));
    if (dm && /日主\s*[甲乙丙丁戊己庚辛壬癸]/.test(text) && !text.includes(`日主${dm}`) && !text.includes(`日主：${dm}`)) {
      return false;
    }
    return true;
  });
}
