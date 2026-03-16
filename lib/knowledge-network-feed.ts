import {
  getManagedContentEntryBySlug,
  isPublicKnowledgeEntry,
  listPublishedManagedContentEntriesByType,
  type ManagedContentEntry,
} from '@/lib/content-store';

export interface KnowledgeNetworkEntry {
  entry: ManagedContentEntry;
  topicEntityId: string | null;
  topicName: string | null;
  synthesisType: string | null;
  qualityScore: number;
  relatedTopicNames: string[];
}

export interface KnowledgeTopicHub {
  topicKey: string;
  topicSlug: string;
  topicEntityId: string | null;
  topicName: string;
  entryCount: number;
  synthesisTypes: string[];
  relatedTopicNames: string[];
  leadEntry: KnowledgeNetworkEntry;
  entries: KnowledgeNetworkEntry[];
}

const TITLE_SUFFIXES = [
  '专题总览',
  '概念词汇表',
  '问题地图',
  '问题簇综述',
  '书单路径',
  '书目阶梯',
];

function sanitizeTopicSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

function uniqueStrings(values: string[]) {
  return [...new Set(values.map((item) => `${item || ''}`.trim()).filter(Boolean))];
}

function readString(meta: Record<string, unknown> | undefined, key: string) {
  const value = meta?.[key];
  return typeof value === 'string' ? value.trim() : '';
}

function readStringArray(meta: Record<string, unknown> | undefined, key: string) {
  const value = meta?.[key];
  return Array.isArray(value)
    ? uniqueStrings(value.filter((item): item is string => typeof item === 'string'))
    : [];
}

function readNumber(meta: Record<string, unknown> | undefined, key: string) {
  const value = meta?.[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function deriveTopicName(entry: ManagedContentEntry) {
  const metaName = readString(entry.meta, 'topicName');
  if (metaName) {
    return metaName;
  }

  for (const suffix of TITLE_SUFFIXES) {
    if (entry.title.endsWith(suffix)) {
      return entry.title.slice(0, entry.title.length - suffix.length).trim();
    }
  }

  return '';
}

function toNetworkEntry(entry: ManagedContentEntry): KnowledgeNetworkEntry {
  const topicName = deriveTopicName(entry);
  const topicEntityId = readString(entry.meta, 'topicEntityId') || null;
  const synthesisType = readString(entry.meta, 'synthesisType') || null;

  return {
    entry,
    topicEntityId,
    topicName: topicName || null,
    synthesisType,
    qualityScore: readNumber(entry.meta, 'qualityScore'),
    relatedTopicNames: readStringArray(entry.meta, 'relatedTopicNames'),
  };
}

function sortNetworkEntries(entries: KnowledgeNetworkEntry[]) {
  return entries
    .slice()
    .sort((left, right) => (
      right.qualityScore - left.qualityScore
      || Number(right.entry.featured) - Number(left.entry.featured)
      || right.entry.updatedAt.localeCompare(left.entry.updatedAt)
    ));
}

function buildTopicKey(entry: KnowledgeNetworkEntry) {
  if (entry.topicEntityId) {
    return `topic:${entry.topicEntityId}`;
  }

  if (entry.topicName) {
    return `topic-name:${entry.topicName.toLowerCase()}`;
  }

  return `slug:${entry.entry.slug}`;
}

export function listPublishedKnowledgeNetworkEntries() {
  return listPublishedManagedContentEntriesByType('knowledge')
    .filter((entry) => isPublicKnowledgeEntry(entry))
    .map(toNetworkEntry);
}

export function listKnowledgeTopicHubs(params?: {
  limit?: number;
}) {
  const limit = params?.limit ?? 6;
  const groups = new Map<string, KnowledgeNetworkEntry[]>();

  listPublishedKnowledgeNetworkEntries()
    .filter((item) => item.synthesisType || item.topicEntityId || item.topicName)
    .forEach((item) => {
      const key = buildTopicKey(item);
      const current = groups.get(key) || [];
      current.push(item);
      groups.set(key, current);
    });

  return Array.from(groups.entries())
    .map(([topicKey, entries]) => {
      const sortedEntries = sortNetworkEntries(entries);
      const leadEntry = sortedEntries[0];

      return leadEntry ? {
        topicKey,
        topicSlug: sanitizeTopicSlug(leadEntry.topicEntityId || leadEntry.topicName || leadEntry.entry.slug) || leadEntry.entry.slug,
        topicEntityId: leadEntry.topicEntityId,
        topicName: leadEntry.topicName || leadEntry.entry.title,
        entryCount: sortedEntries.length,
        synthesisTypes: uniqueStrings(sortedEntries.map((item) => item.synthesisType || 'article')),
        relatedTopicNames: uniqueStrings(sortedEntries.flatMap((item) => item.relatedTopicNames)).filter((item) => item !== leadEntry.topicName),
        leadEntry,
        entries: sortedEntries,
      } satisfies KnowledgeTopicHub : null;
    })
    .filter((item): item is KnowledgeTopicHub => !!item)
    .sort((left, right) => (
      right.entryCount - left.entryCount
      || right.leadEntry.qualityScore - left.leadEntry.qualityScore
      || right.leadEntry.entry.updatedAt.localeCompare(left.leadEntry.entry.updatedAt)
    ))
    .slice(0, Math.max(1, limit));
}

export function getKnowledgeTopicHubBySlug(slug: string) {
  return listKnowledgeTopicHubs({ limit: 30 })
    .find((hub) => hub.entries.some((item) => item.entry.slug === slug)) || null;
}

export function getKnowledgeTopicHubByTopicSlug(topicSlug: string) {
  return listKnowledgeTopicHubs({ limit: 60 })
    .find((hub) => hub.topicSlug === topicSlug) || null;
}

export function listKnowledgeTopicHubRoutes(limit = 60) {
  return listKnowledgeTopicHubs({ limit })
    .map((hub) => ({
      topicSlug: hub.topicSlug,
      updatedAt: hub.leadEntry.entry.updatedAt,
    }));
}

export function getRelatedKnowledgeEntries(slug: string, limit = 4) {
  const current = getManagedContentEntryBySlug('knowledge', slug);
  if (!current) {
    return [];
  }

  const currentEntry = toNetworkEntry(current);
  const currentTags = new Set(current.tags);

  return listPublishedKnowledgeNetworkEntries()
    .filter((item) => item.entry.slug !== slug)
    .map((item) => {
      let score = 0;

      if (currentEntry.topicEntityId && item.topicEntityId === currentEntry.topicEntityId) {
        score += 8;
      }
      if (currentEntry.topicName && item.topicName === currentEntry.topicName) {
        score += 6;
      }
      if (currentEntry.synthesisType && item.synthesisType === currentEntry.synthesisType) {
        score += 1.2;
      }
      if (currentEntry.relatedTopicNames.includes(item.topicName || '')) {
        score += 2.5;
      }
      if (item.relatedTopicNames.includes(currentEntry.topicName || '')) {
        score += 2.5;
      }
      if (current.category && item.entry.category === current.category) {
        score += 0.8;
      }

      const sharedTags = item.entry.tags.filter((tag) => currentTags.has(tag));
      score += sharedTags.length * 1.4;
      score += item.qualityScore / 100;

      return {
        item,
        score,
      };
    })
    .filter((item) => item.score > 0)
    .sort((left, right) => right.score - left.score || right.item.entry.updatedAt.localeCompare(left.item.entry.updatedAt))
    .slice(0, Math.max(1, limit))
    .map((item) => item.item);
}
