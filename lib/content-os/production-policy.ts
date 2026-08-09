/**
 * People-first production policy — LDPlayer ops × Google indexing red lines.
 * See docs/ldplayer-ops-and-google-alignment.md
 *
 * North star: indexable search clicks → open chat / free chart
 * NOT: published URL count or matrix coverage %.
 */

import type { ManagedContentEntry } from '@/lib/content-store';
import type { DestinyMatrixSlot, ContentOsLocale } from '@/lib/content-os/matrix';

export type ContentOsMode = 'people-first' | 'matrix-farm';

/** Default production locales: primary language first. Expand only after hub exists. */
export const PEOPLE_FIRST_DEFAULT_LOCALES: ContentOsLocale[] = ['zh-CN'];

export const PEOPLE_FIRST_EXPANSION_LOCALES: ContentOsLocale[] = [
  'zh-TW',
  'en-US',
];

/** Entity kinds allowed as production hubs (finite set). */
export const PRODUCTION_HUB_KINDS = new Set([
  'life-question',
  'dimension',
  'tool',
  'methodology',
  'city',
  'industry',
  'faq',
]);

/** Kinds that are high doorway-risk if cartesian-expanded. */
export const DOORWAY_RISK_KINDS = new Set([
  'day-master',
  'life-stage',
  'seasonal',
]);

export function resolveContentOsMode(): ContentOsMode {
  const raw = `${process.env.CONTENT_OS_MODE || 'people-first'}`.trim().toLowerCase();
  if (raw === 'matrix-farm' || raw === 'farm' || raw === 'matrix') return 'matrix-farm';
  return 'people-first';
}

export function resolveProductionLocales(override?: ContentOsLocale[]): ContentOsLocale[] {
  if (override?.length) return override;
  const fromEnv = `${process.env.CONTENT_OS_LOCALES || ''}`
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean) as ContentOsLocale[];
  if (fromEnv.length) return fromEnv;
  return [...PEOPLE_FIRST_DEFAULT_LOCALES];
}

export function maxNearDuplicateRatio() {
  const n = Number(process.env.CONTENT_OS_MAX_NEAR_DUP || 0.72);
  return Number.isFinite(n) ? Math.min(0.95, Math.max(0.4, n)) : 0.72;
}

/** Simple token Jaccard for Chinese/English titles + excerpts. */
export function textSimilarity(a: string, b: string): number {
  const tok = (s: string) =>
    new Set(
      s
        .toLowerCase()
        .replace(/[^\p{L}\p{N}\s]/gu, ' ')
        .split(/\s+/)
        .flatMap((w) => {
          // Also split CJK into bigrams for better Chinese similarity
          if (/[\u4e00-\u9fff]/.test(w) && w.length > 1) {
            const grams: string[] = [];
            for (let i = 0; i < w.length - 1; i += 1) grams.push(w.slice(i, i + 2));
            return grams.length ? grams : [w];
          }
          return w.length >= 2 ? [w] : [];
        })
        .filter(Boolean),
    );
  const A = tok(a);
  const B = tok(b);
  if (!A.size || !B.size) return 0;
  let inter = 0;
  for (const t of A) if (B.has(t)) inter += 1;
  return inter / (A.size + B.size - inter);
}

export function entryFingerprint(entry: Pick<ManagedContentEntry, 'title' | 'excerpt' | 'seoDescription'>) {
  return `${entry.title || ''}\n${entry.excerpt || ''}\n${entry.seoDescription || ''}`;
}

export function slotFingerprint(slot: DestinyMatrixSlot) {
  return `${slot.topic}\n${slot.angle}\n${(slot.searchIntents || []).join(' ')}`;
}

export type ProductionGateResult = {
  allow: boolean;
  reasons: string[];
  nearDupSlug?: string;
  nearDupScore?: number;
};

/**
 * Hard gate before LLM spend or publish.
 * Enforces entity hub + unique problem (anti-doorway).
 */
export function gateSlotForProduction(
  slot: DestinyMatrixSlot,
  published: ManagedContentEntry[],
  options?: { mode?: ContentOsMode },
): ProductionGateResult {
  const mode = options?.mode || resolveContentOsMode();
  const reasons: string[] = [];

  if (mode === 'people-first') {
    if (DOORWAY_RISK_KINDS.has(slot.entityKind) && slot.locale !== 'zh-CN') {
      reasons.push('doorway-risk kind only allowed in primary locale after hub quality proven');
    }
    if (slot.entityKind === 'seasonal') {
      const month = new Date().getMonth() + 1;
      const slugMonth = Number(`${slot.entitySlug}`.split('-m')[1] || 0);
      if (slugMonth && slugMonth !== month) {
        reasons.push('seasonal only for current calendar month (real freshness, not farm)');
      }
    }
    // Block comparison template spam for low-priority tools in farm mode only — keep how-to
    if (slot.template === 'listicle') {
      reasons.push('listicle template disabled in people-first (thin ranking risk)');
    }
  }

  // Must have a concrete user job (topic is not enough if empty angle)
  if (!`${slot.topic || ''}`.trim() || `${slot.topic}`.trim().length < 8) {
    reasons.push('missing concrete user job / topic');
  }
  if (!`${slot.angle || ''}`.trim() || `${slot.angle}`.trim().length < 12) {
    reasons.push('missing unique angle');
  }
  if (!slot.searchIntents?.length || slot.searchIntents.length < 2) {
    reasons.push('need ≥2 real search intents');
  }
  if (!slot.relatedCta?.href) {
    reasons.push('missing product CTA path');
  }

  // Near-duplicate against published corpus
  const fp = slotFingerprint(slot);
  const maxDup = maxNearDuplicateRatio();
  let best = 0;
  let bestSlug = '';
  for (const entry of published) {
    if (entry.status !== 'published' && entry.status !== 'draft') continue;
    const score = textSimilarity(fp, entryFingerprint(entry));
    if (score > best) {
      best = score;
      bestSlug = entry.slug;
    }
  }
  if (best >= maxDup) {
    reasons.push(`near-duplicate of existing content (${bestSlug}, sim=${best.toFixed(2)})`);
    return {
      allow: false,
      reasons,
      nearDupSlug: bestSlug,
      nearDupScore: best,
    };
  }

  // Same matrixKey already published → prefer refresh path, not new URL
  const matrixHit = published.find((e) => {
    const mk = `${(e.meta as { matrixKey?: string } | undefined)?.matrixKey || ''}`;
    return mk === slot.key && e.status === 'published';
  });
  if (matrixHit) {
    reasons.push(`matrix key already published as ${matrixHit.slug}; use refresh not new doorway URL`);
    return {
      allow: false,
      reasons,
      nearDupSlug: matrixHit.slug,
      nearDupScore: 1,
    };
  }

  return {
    allow: reasons.length === 0,
    reasons,
    nearDupScore: best || undefined,
    nearDupSlug: bestSlug || undefined,
  };
}

/**
 * Locale expansion: only after primary zh-CN satellite exists for same entity.
 */
export function canExpandLocale(params: {
  slot: DestinyMatrixSlot;
  published: ManagedContentEntry[];
}): boolean {
  if (params.slot.locale === 'zh-CN') return true;
  const hasPrimary = params.published.some((e) => {
    if (e.status !== 'published') return false;
    const meta = e.meta || {};
    return (
      `${meta.entityKind || ''}` === params.slot.entityKind &&
      `${meta.entitySlug || ''}` === params.slot.entitySlug &&
      (`${e.locale || meta.locale || ''}` === 'zh-CN' ||
        `${e.locale || meta.locale || ''}` === 'zh-Hans' ||
        !e.locale)
    );
  });
  return hasPrimary;
}

export function peopleFirstPriorityBoost(slot: DestinyMatrixSlot): number {
  let boost = 0;
  // High-intent life decisions first (LDPlayer "how to install" style tasks)
  if (slot.entityKind === 'life-question') boost += 40;
  if (slot.entityKind === 'dimension') boost += 30;
  if (slot.entityKind === 'methodology') boost += 28;
  if (slot.entityKind === 'tool' && slot.template === 'how-to') boost += 25;
  if (slot.entityKind === 'faq') boost += 20;
  if (slot.entityKind === 'city' || slot.entityKind === 'industry') boost += 10;
  // Penalize doorway-prone
  if (slot.entityKind === 'day-master') boost -= 25;
  if (slot.entityKind === 'life-stage') boost -= 20;
  if (slot.entityKind === 'seasonal') boost -= 15;
  if (slot.template === 'comparison') boost -= 10;
  // Primary locale first
  if (slot.locale === 'zh-CN') boost += 15;
  if (slot.locale.startsWith('en')) boost -= 5;
  return boost;
}

export const PRODUCTION_CONSTITUTION_SUMMARY = {
  northStar: 'indexable search clicks → open chat / free chart',
  notNorthStar: 'published URL count',
  learnFromLdplayer: 'entity hub → satellite problem content → real updates → CTA',
  ban: [
    'template matrix doorway pages',
    'scaled thin AI with swappable tags',
    'seasonal/locale cartesian farms',
    'keyword stuffing / SEO jargon in body',
  ],
} as const;
