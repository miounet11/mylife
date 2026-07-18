import type { ContentFigure } from '@/lib/content-illustrations';
import {
  listBySurface,
  publicSrc,
  type PageIllustrationEntry,
  type PageIllustLocale,
  PAGE_ILLUSTRATION_CATALOG,
} from '@/lib/page-illustrations/catalog';

export function entryToContentFigure(
  entry: PageIllustrationEntry,
  afterSectionIndex = -1,
): ContentFigure {
  return {
    id: entry.id,
    role: entry.role,
    title: entry.title,
    caption: entry.caption,
    alt: entry.alt,
    src: entry.ready ? publicSrc(entry) : '',
    kind: entry.ready ? 'generated' : 'diagram',
    afterSectionIndex,
    moduleLabel: entry.tags[0],
    width: entry.width || 1600,
    height: entry.height || 900,
    diagramVariant: entry.ready ? undefined : 'structure-timing-env',
  };
}

/** Figures for a product surface (docs, teachers, tools, …). Only ready assets. */
export function resolvePageIllustrations(
  surface: string,
  opts?: {
    includePendingDiagrams?: boolean;
    limit?: number;
    locale?: PageIllustLocale;
  },
): ContentFigure[] {
  const limit = opts?.limit ?? 4;
  const rows = listBySurface(surface, opts?.locale);
  // Prefer one locale per base (avoid showing EN+CN of same diagram)
  const seenBase = new Set<string>();
  const picked: PageIllustrationEntry[] = [];
  for (const e of rows) {
    if (!(e.ready || opts?.includePendingDiagrams)) continue;
    const base = e.variantOf || e.id;
    if (seenBase.has(base)) continue;
    seenBase.add(base);
    picked.push(e);
    if (picked.length >= limit) break;
  }
  return picked.map((e, i) => entryToContentFigure(e, i === 0 ? -1 : i - 1));
}

/** Full entry list for SEO JSON-LD (same pick as resolve). */
export function resolvePageIllustrationEntries(
  surface: string,
  opts?: { limit?: number; locale?: PageIllustLocale },
): PageIllustrationEntry[] {
  const limit = opts?.limit ?? 4;
  const rows = listBySurface(surface, opts?.locale);
  const seenBase = new Set<string>();
  const picked: PageIllustrationEntry[] = [];
  for (const e of rows) {
    if (!e.ready) continue;
    const base = e.variantOf || e.id;
    if (seenBase.has(base)) continue;
    seenBase.add(base);
    picked.push(e);
    if (picked.length >= limit) break;
  }
  return picked;
}

/** Report chapter injection by cite keys (first key preferred, de-duped). */
export function resolveReportIllustrations(params: {
  keys?: string[];
  section?: string;
  limit?: number;
}): ContentFigure[] {
  const keys =
    params.keys ||
    (params.section
      ? sectionToKeys(params.section)
      : ['cover', 'reading-path', 'decision-loop']);
  const limit = params.limit ?? 3;
  const seen = new Set<string>();
  const picked: PageIllustrationEntry[] = [];
  for (const key of keys) {
    for (const entry of PAGE_ILLUSTRATION_CATALOG) {
      if (!entry.ready) continue;
      if (!(entry.reportCiteKeys || []).includes(key)) continue;
      if (seen.has(entry.id)) continue;
      seen.add(entry.id);
      picked.push(entry);
      if (picked.length >= limit) {
        return picked.map((e, i) => entryToContentFigure(e, i === 0 ? -1 : 0));
      }
    }
  }
  return picked.map((e, i) => entryToContentFigure(e, i === 0 ? -1 : 0));
}

function sectionToKeys(section: string): string[] {
  const s = section.toLowerCase();
  if (/cover|封面|导读|阅读/.test(s)) return ['cover', 'reading-path'];
  if (/timing|大运|流年|窗口/.test(s)) return ['dayun', 'timing'];
  if (/用神|日主|结构|格局/.test(s)) return ['yongshen', 'structure'];
  if (/决策|动作|验证|结论/.test(s)) return ['decision-loop', 'validation'];
  if (/边界|风险|克制/.test(s)) return ['boundary'];
  return ['reading-path', 'decision-loop'];
}

export function getCatalogEntry(id: string): PageIllustrationEntry | undefined {
  return PAGE_ILLUSTRATION_CATALOG.find((e) => e.id === id);
}
