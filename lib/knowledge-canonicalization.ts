import type {
  BibliographyEntryRecord,
  KnowledgeEntityRecord,
} from '@/lib/knowledge-base-store';

export interface CanonicalCluster<T> {
  key: string;
  label: string;
  aliases: string[];
  items: T[];
}

export function normalizeKnowledgeLabel(value: string) {
  return `${value || ''}`
    .trim()
    .toLowerCase()
    .replace(/[《》"'`]+/g, '')
    .replace(/\s+/g, '')
    .replace(/[?？!！,，.。:：;；()（）[\]【】{}]/g, '');
}

function uniqueStrings(values: string[]) {
  return [...new Set(values.map((item) => `${item || ''}`.trim()).filter(Boolean))];
}

function buildEntityAliasPool(entity: KnowledgeEntityRecord) {
  return uniqueStrings([entity.name, ...(entity.aliases || [])]);
}

function buildBookAliasPool(book: BibliographyEntryRecord) {
  return uniqueStrings([
    book.title,
    ...(book.altTitles || []),
    book.originalTitle || '',
  ]);
}

export function clusterKnowledgeEntities(entities: KnowledgeEntityRecord[]): CanonicalCluster<KnowledgeEntityRecord>[] {
  const clusters = new Map<string, CanonicalCluster<KnowledgeEntityRecord>>();

  entities.forEach((entity) => {
    const aliasPool = buildEntityAliasPool(entity);
    const key = normalizeKnowledgeLabel(aliasPool[0] || entity.slug || entity.name);
    const existing = clusters.get(key);

    if (existing) {
      existing.items.push(entity);
      existing.aliases = uniqueStrings([...existing.aliases, ...aliasPool]);
      return;
    }

    clusters.set(key, {
      key,
      label: entity.name,
      aliases: aliasPool,
      items: [entity],
    });
  });

  return [...clusters.values()];
}

export function clusterBibliographyEntries(books: BibliographyEntryRecord[]): CanonicalCluster<BibliographyEntryRecord>[] {
  const clusters = new Map<string, CanonicalCluster<BibliographyEntryRecord>>();

  books.forEach((book) => {
    const aliasPool = buildBookAliasPool(book);
    const key = normalizeKnowledgeLabel(aliasPool[0] || book.slug || book.title);
    const existing = clusters.get(key);

    if (existing) {
      existing.items.push(book);
      existing.aliases = uniqueStrings([...existing.aliases, ...aliasPool]);
      return;
    }

    clusters.set(key, {
      key,
      label: book.title,
      aliases: aliasPool,
      items: [book],
    });
  });

  return [...clusters.values()];
}

export function dedupeKnowledgeEntities(entities: KnowledgeEntityRecord[]) {
  return clusterKnowledgeEntities(entities).map((cluster) =>
    cluster.items
      .slice()
      .sort((left, right) => (
        new Date(right.updatedAt || right.createdAt || 0).getTime() - new Date(left.updatedAt || left.createdAt || 0).getTime()
        || right.aliases.length - left.aliases.length
      ))[0]
  ).filter((item): item is KnowledgeEntityRecord => !!item);
}

export function dedupeBibliographyEntries(books: BibliographyEntryRecord[]) {
  return clusterBibliographyEntries(books).map((cluster) =>
    cluster.items
      .slice()
      .sort((left, right) => (
        new Date(right.updatedAt || right.createdAt || 0).getTime() - new Date(left.updatedAt || left.createdAt || 0).getTime()
        || (right.altTitles?.length || 0) - (left.altTitles?.length || 0)
      ))[0]
  ).filter((item): item is BibliographyEntryRecord => !!item);
}
