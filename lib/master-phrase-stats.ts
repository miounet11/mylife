import { MasterPhrases } from '@/lib/master-phrases';
import type { PhraseTemplate } from '@/lib/master-phrases-v3';
import {
  V6_ADVICE,
  V6_ANCIENT_QUOTES,
  V6_CLOSINGS,
  V6_FIVE_ELEMENTS,
  V6_OPENINGS,
  V6_PATTERN_PHRASES,
  V6_TIMING,
} from '@/lib/master-phrases-v3';

function countPhraseTemplates(templates: PhraseTemplate[]) {
  return templates.length;
}

function countStringLists(record: Record<string, string[]>) {
  return Object.values(record).reduce((sum, list) => sum + list.length, 0);
}

function countFiveElements(
  record: Record<string, { strong: string[]; weak: string[]; balanced?: string[] }>,
) {
  return Object.values(record).reduce(
    (sum, bucket) => sum + bucket.strong.length + bucket.weak.length + (bucket.balanced?.length || 0),
    0,
  );
}

function countAdvice(record: Record<string, PhraseTemplate[]>) {
  return Object.values(record).reduce((sum, list) => sum + list.length, 0);
}

function countLegacyPhrases(value: unknown): number {
  if (typeof value === 'string') {
    return 1;
  }

  if (Array.isArray(value)) {
    return value.reduce((sum, item) => sum + countLegacyPhrases(item), 0);
  }

  if (!value || typeof value !== 'object') {
    return 0;
  }

  return Object.entries(value as Record<string, unknown>).reduce((sum, [key, item]) => {
    if (['opening', 'description', 'judgment', 'timing', 'advice', 'closing', 'type'].includes(key)) {
      return sum;
    }

    return sum + countLegacyPhrases(item);
  }, 0);
}

let cachedCount: number | null = null;

export function getMasterPhraseCount(): number {
  if (cachedCount !== null) {
    return cachedCount;
  }

  const v3Count =
    countPhraseTemplates(V6_OPENINGS)
    + countFiveElements(V6_FIVE_ELEMENTS)
    + countStringLists(V6_PATTERN_PHRASES)
    + countAdvice(V6_ADVICE)
    + V6_ANCIENT_QUOTES.length
    + countPhraseTemplates(V6_TIMING)
    + countPhraseTemplates(V6_CLOSINGS);

  cachedCount = v3Count + countLegacyPhrases(MasterPhrases);
  return cachedCount;
}