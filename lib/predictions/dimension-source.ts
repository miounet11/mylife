import type { DimensionSlug } from '@/lib/dimensions/types';
import { DIMENSION_BY_SLUG, getDimension } from '@/lib/dimensions/config';
import type { Prediction } from './types';

const SLUGS = Object.keys(DIMENSION_BY_SLUG) as DimensionSlug[];

/** reportId forms: dimension_fortune_*, dimension/fortune-rhythm/*, dim:fortune-rhythm:* */
const REPORT_ID_PATTERNS: Array<{ re: RegExp; slug: DimensionSlug }> = [
  { re: /^dimension[_/]fortune(?:-rhythm)?/i, slug: 'fortune-rhythm' },
  { re: /^dimension[_/]career(?:-industry)?/i, slug: 'career-industry' },
  { re: /^dimension[_/]invest(?:ment)?/i, slug: 'investment' },
  { re: /^dimension[_/]naming/i, slug: 'naming' },
  { re: /^dimension[_/]health/i, slug: 'health' },
  { re: /^dimension[_/]study(?:-career)?/i, slug: 'study-career' },
  { re: /^dimension[_/]marriage/i, slug: 'marriage' },
  { re: /^dimension[_/]partner(?:ship)?/i, slug: 'partnership' },
  { re: /^dimension[_/]living(?:-environment)?/i, slug: 'living-environment' },
  { re: /^dimension[_/]timing(?:-selection)?/i, slug: 'timing-selection' },
];

export function makeDimensionReportId(
  slug: DimensionSlug,
  birthSignature: string,
  explicit?: string,
): string {
  if (explicit) return explicit;
  return `dimension/${slug}/${birthSignature || 'anon'}/${Date.now()}`;
}

export function parseDimensionSlugFromReportId(reportId: string): DimensionSlug | null {
  if (!reportId) return null;
  // dimension/fortune-rhythm/...
  const pathMatch = reportId.match(/^dimension\/([a-z0-9-]+)/i);
  if (pathMatch) {
    const slug = pathMatch[1] as DimensionSlug;
    if (SLUGS.includes(slug)) return slug;
  }
  for (const item of REPORT_ID_PATTERNS) {
    if (item.re.test(reportId)) return item.slug;
  }
  return null;
}

export function resolvePredictionDimensionSlug(
  prediction: Pick<Prediction, 'dimensionSlug' | 'reportId' | 'evidence'>,
): DimensionSlug | null {
  if (prediction.dimensionSlug && SLUGS.includes(prediction.dimensionSlug as DimensionSlug)) {
    return prediction.dimensionSlug as DimensionSlug;
  }
  const fromReport = parseDimensionSlugFromReportId(prediction.reportId);
  if (fromReport) return fromReport;

  // Fallback: evidence may start with dimension title keywords
  const evidence = prediction.evidence || '';
  for (const slug of SLUGS) {
    const def = getDimension(slug);
    if (def && evidence.includes(def.title)) return slug;
  }
  return null;
}

export function attachDimensionSlugToPredictions(
  predictions: Prediction[],
  slug: DimensionSlug,
): Prediction[] {
  return predictions.map((item) => ({
    ...item,
    dimensionSlug: item.dimensionSlug || slug,
    source: item.source || 'dimension',
  }));
}

export function dimensionLabel(slug: string | null | undefined): string {
  if (!slug) return '报告';
  return getDimension(slug)?.title || slug;
}

export function filterPredictionsByDimension(
  predictions: Prediction[],
  slug: string | null | undefined,
): Prediction[] {
  if (!slug || slug === 'all') return predictions;
  return predictions.filter((item) => resolvePredictionDimensionSlug(item) === slug);
}

export function groupPredictionStatsByDimension(predictions: Prediction[]): Array<{
  slug: DimensionSlug | 'report';
  title: string;
  total: number;
  pending: number;
  hitRate: number;
}> {
  const buckets = new Map<string, Prediction[]>();
  for (const item of predictions) {
    const slug = resolvePredictionDimensionSlug(item) || 'report';
    const list = buckets.get(slug) || [];
    list.push(item);
    buckets.set(slug, list);
  }

  return [...buckets.entries()]
    .map(([slug, items]) => {
      const resolved = items.filter((item) => item.outcome && item.outcome !== 'pending');
      const fulfilled = resolved.filter((item) => item.outcome === 'fulfilled').length;
      const pending = items.filter((item) => !item.outcome || item.outcome === 'pending').length;
      return {
        slug: slug as DimensionSlug | 'report',
        title: slug === 'report' ? '完整报告' : dimensionLabel(slug),
        total: items.length,
        pending,
        hitRate: resolved.length ? fulfilled / resolved.length : 0,
      };
    })
    .sort((a, b) => b.total - a.total);
}
