/**
 * Content multi-locale entity pairs for true hreflang sisters.
 * Conventions:
 *   foo-en  ↔  foo
 *   world-yi-en-x  ↔  world-yi-x
 *   gua-*-en  ↔  gua-*
 * zh-Hant uses same slug + /zh-hant path prefix (SC→TC display), not a separate slug.
 */

import { absoluteUrl, withLocalePrefix } from '@/lib/seo';

export type ContentPathKind = 'knowledge' | 'case' | 'insight';

export type ContentLocalePair = {
  slug: string;
  path: string;
  locale: 'zh-Hans' | 'zh-Hant' | 'en' | string;
};

/** Candidate sister slug(s) for a content slug. */
export function candidateSisterSlugs(slug: string): string[] {
  const s = `${slug || ''}`.trim();
  if (!s) return [];

  const out = new Set<string>();

  // explicit -en suffix (gua-…-en, article-en)
  if (/-en$/i.test(s)) {
    out.add(s.replace(/-en$/i, ''));
  } else {
    out.add(`${s}-en`);
  }

  // world-yi-en-xxx ↔ world-yi-xxx
  if (s.startsWith('world-yi-en-')) {
    out.add(`world-yi-${s.slice('world-yi-en-'.length)}`);
  } else if (s.startsWith('world-yi-') && !s.startsWith('world-yi-en-')) {
    out.add(`world-yi-en-${s.slice('world-yi-'.length)}`);
  }

  // case helpers: world-yi-case-x ↔ world-yi-en-case-x (rare)
  if (s.startsWith('world-yi-case-')) {
    out.add(`world-yi-en-case-${s.slice('world-yi-case-'.length)}`);
  }

  out.delete(s);
  return Array.from(out);
}

export function contentPathFor(
  kind: ContentPathKind,
  slug: string,
  insightType?: string | null
): string {
  if (kind === 'case') return `/cases/${slug}`;
  if (kind === 'insight') {
    const t = insightType || 'city';
    return `/insights/${t}/${slug}`;
  }
  return `/knowledge/${slug}`;
}

/**
 * Build hreflang map when a true sister entity exists.
 * Falls back to UI-locale path prefixes for the same slug (product matrix).
 */
export function buildContentEntityLanguageAlternates(input: {
  kind: ContentPathKind;
  slug: string;
  insightType?: string | null;
  contentLocale?: string | null;
  /** Return true if a published article exists for this slug (+ optional kind) */
  sisterExists: (slug: string) => boolean;
}): Record<string, string> {
  const selfPath = contentPathFor(input.kind, input.slug, input.insightType);
  const isEnEntity =
    `${input.contentLocale || ''}`.toLowerCase().startsWith('en')
    || /-en$/i.test(input.slug)
    || input.slug.startsWith('world-yi-en-');

  const sisters = candidateSisterSlugs(input.slug).filter((s) => input.sisterExists(s));
  const zhSlug = isEnEntity ? (sisters[0] || input.slug) : input.slug;
  const enSlug = isEnEntity
    ? input.slug
    : sisters.find((s) => /-en$/i.test(s) || s.startsWith('world-yi-en-')) || null;

  const zhPath = contentPathFor(input.kind, zhSlug, input.insightType);
  const enPath = enSlug
    ? contentPathFor(input.kind, enSlug, input.insightType)
    : withLocalePrefix(selfPath, 'en');

  // True entity pair: EN has its own slug; zh-Hant still shares zh slug + prefix
  return {
    'zh-CN': absoluteUrl(zhPath),
    'zh-Hant': absoluteUrl(withLocalePrefix(zhPath, 'zh-Hant')),
    'zh-TW': absoluteUrl(withLocalePrefix(zhPath, 'zh-Hant')),
    'zh-HK': absoluteUrl(withLocalePrefix(zhPath, 'zh-Hant')),
    en: absoluteUrl(enPath),
    'x-default': absoluteUrl(isEnEntity && enSlug ? enPath : zhPath),
  };
}

/** UI badge: sister link for in-page language switch to true entity */
export function resolveContentSisterLink(input: {
  kind: ContentPathKind;
  slug: string;
  insightType?: string | null;
  contentLocale?: string | null;
  sisterExists: (slug: string) => boolean;
}): { href: string; label: string } | null {
  const isEn =
    `${input.contentLocale || ''}`.toLowerCase().startsWith('en')
    || /-en$/i.test(input.slug)
    || input.slug.startsWith('world-yi-en-');

  for (const sister of candidateSisterSlugs(input.slug)) {
    if (!input.sisterExists(sister)) continue;
    const href = contentPathFor(input.kind, sister, input.insightType);
    return {
      href,
      label: isEn ? '中文版' : 'English version',
    };
  }
  return null;
}
