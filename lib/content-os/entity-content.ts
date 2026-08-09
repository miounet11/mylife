/**
 * Resolve published CMS content for destiny entity hubs (LDPlayer app-page depth).
 */

import {
  listManagedContentEntries,
  type ManagedContentEntry,
} from '@/lib/content-store';
import {
  listDestinyEntityHubs,
  type DestinyEntityKind,
} from '@/lib/content-os/matrix';

export type EntityContentCard = {
  id: string;
  title: string;
  excerpt: string;
  href: string;
  locale?: string;
  contentType: string;
  updatedAt?: string;
  score?: number;
};

function entryHref(entry: ManagedContentEntry) {
  if (entry.contentType === 'case') return `/cases/${entry.slug}`;
  if (entry.contentType === 'insight') {
    const subtype = entry.subtype || 'topic';
    return `/insights/${subtype}/${entry.slug}`;
  }
  return `/knowledge/${entry.slug}`;
}

function isContentOsPublished(entry: ManagedContentEntry) {
  if (entry.status !== 'published') return false;
  const source = `${entry.source || ''}`.toLowerCase();
  const matrixKey = `${(entry.meta as { matrixKey?: string } | undefined)?.matrixKey || ''}`;
  return source.includes('content-os') || matrixKey.length > 0 || source.includes('world-yi');
}

export function listPublishedContentOsEntries(limit = 40): EntityContentCard[] {
  return listManagedContentEntries()
    .filter(isContentOsPublished)
    .sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''))
    .slice(0, limit)
    .map((entry) => ({
      id: entry.id,
      title: entry.title,
      excerpt: entry.excerpt || '',
      href: entryHref(entry),
      locale: entry.locale || (entry.meta as { locale?: string } | undefined)?.locale,
      contentType: entry.contentType,
      updatedAt: entry.updatedAt,
      score: Number((entry.meta as { multiQuality?: { overall?: number } } | undefined)?.multiQuality?.overall || (entry.meta as { quality?: { score?: number } } | undefined)?.quality?.score || 0) || undefined,
    }));
}

export function listContentForEntity(params: {
  entityKind: DestinyEntityKind;
  entitySlug: string;
  limit?: number;
}): EntityContentCard[] {
  const limit = params.limit ?? 12;
  return listManagedContentEntries()
    .filter((entry) => {
      if (entry.status !== 'published') return false;
      const meta = entry.meta || {};
      const kind = `${meta.entityKind || ''}`;
      const slug = `${meta.entitySlug || ''}`;
      if (kind === params.entityKind && slug === params.entitySlug) return true;
      // Fallback: title/tags mention
      const text = `${entry.title} ${entry.tags?.join(' ') || ''} ${entry.slug}`.toLowerCase();
      return text.includes(params.entitySlug.toLowerCase());
    })
    .sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''))
    .slice(0, limit)
    .map((entry) => ({
      id: entry.id,
      title: entry.title,
      excerpt: entry.excerpt || '',
      href: entryHref(entry),
      locale: entry.locale,
      contentType: entry.contentType,
      updatedAt: entry.updatedAt,
    }));
}

/** LDPlayer-style hot list: mix entity hubs + latest published content */
export function buildHotlist(limit = 30) {
  const hubs = listDestinyEntityHubs().slice(0, 20).map((hub, index) => ({
    rank: index + 1,
    kind: 'entity' as const,
    title: hub.name,
    description: hub.description,
    href: hub.href,
    badge: hub.kind,
  }));

  const articles = listPublishedContentOsEntries(20).map((item, index) => ({
    rank: index + 1,
    kind: 'article' as const,
    title: item.title,
    description: item.excerpt,
    href: item.href,
    badge: item.contentType,
  }));

  // Interleave: entity, article, entity, article...
  const out: Array<{
    rank: number;
    kind: 'entity' | 'article';
    title: string;
    description: string;
    href: string;
    badge: string;
  }> = [];
  let e = 0;
  let a = 0;
  while (out.length < limit && (e < hubs.length || a < articles.length)) {
    if (e < hubs.length) {
      out.push({ ...hubs[e], rank: out.length + 1 });
      e += 1;
    }
    if (out.length >= limit) break;
    if (a < articles.length) {
      out.push({ ...articles[a], rank: out.length + 1 });
      a += 1;
    }
  }
  return out;
}
