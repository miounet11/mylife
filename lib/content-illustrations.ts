/**
 * Content illustration planner + resolver.
 *
 * Goal: every knowledge/case/insight article surfaces ≥3 explanatory figures
 * (cover + structure + timing/action/risk) for SEO, comprehension, and shareability.
 *
 * Resolution order:
 * 1. meta.illustrations (explicit)
 * 2. meta.visualAssets binding → library / static catalog
 * 3. keyword-scored **page-illustrations** catalog (gpt-image-2 batch, preferred)
 * 4. keyword-scored static visual-assets pack
 * 5. deterministic SVG diagram templates (always available)
 */

import {
  PAGE_ILLUSTRATION_CATALOG,
  publicSrc as pageIllustPublicSrc,
  type PageIllustrationEntry,
} from '@/lib/page-illustrations/catalog';

export type ContentFigureRole =
  | 'cover'
  | 'structure'
  | 'timing'
  | 'action'
  | 'risk'
  | 'comparison'
  | 'summary';

export type ContentFigureKind = 'library' | 'diagram' | 'generated';

export type ContentFigure = {
  id: string;
  role: ContentFigureRole;
  title: string;
  caption: string;
  alt: string;
  /** Public path, absolute URL, or empty when kind=diagram (rendered as SVG). */
  src: string;
  kind: ContentFigureKind;
  /** Insert after this section index; -1 = hero (before body). */
  afterSectionIndex: number;
  /** Visual-assets hub slug when available. */
  slug?: string;
  diagramVariant?: ContentDiagramVariant;
  moduleLabel?: string;
  width?: number;
  height?: number;
};

export type ContentDiagramVariant =
  | 'world-yi-six-step'
  | 'structure-timing-env'
  | 'decision-matrix'
  | 'risk-boundary'
  | 'kline-journey'
  | 'five-elements-cycle'
  | 'case-before-after';

export type ContentIllustrationSignal = {
  contentType?: string;
  slug?: string;
  title?: string;
  excerpt?: string | null;
  category?: string | null;
  tags?: string[] | null;
  meta?: Record<string, unknown> | null;
  sectionCount?: number;
  /** Content / UI locale → pick EN / zh-Hant diagram variants when ready */
  locale?: string | null;
};

export const MIN_CONTENT_ILLUSTRATIONS = 3;
export const TARGET_CONTENT_ILLUSTRATIONS = 4;

type CatalogEntry = {
  id: string;
  slug: string;
  title: string;
  src: string;
  alt: string;
  roles: ContentFigureRole[];
  keywords: string[];
  moduleLabel: string;
  /** Prefer page-illustrations (newer educational batch) over older visual-assets. */
  preferBoost?: number;
  kindHint?: ContentFigureKind;
};

const BASE = '/images/visual-assets';

/** Curated catalog from production static packs (always safe to reference). */
export const CONTENT_ILLUSTRATION_CATALOG: CatalogEntry[] = [
  {
    id: 'PWY01-002',
    slug: 'world-yi-six-step-method',
    title: '世界易六步判断法',
    src: `${BASE}/product-world-yi-explainers-v1/world-yi-six-step-method-v2.png`,
    alt: '世界易结构时位环境行动风险复盘六步判断法图解',
    roles: ['cover', 'structure', 'summary'],
    keywords: ['世界易', '方法', '判断', '结构', '六步', '决策'],
    moduleLabel: '世界易方法',
  },
  {
    id: 'PWY01-001',
    slug: 'life-kline-product-universe',
    title: '人生K线产品宇宙图',
    src: `${BASE}/product-world-yi-explainers-v1/life-kline-product-universe-v1.png`,
    alt: '人生K线从测算到报告工具知识案例复访的产品路径图',
    roles: ['cover', 'summary'],
    keywords: ['人生k线', '报告', '工具', '知识', '路径', '产品'],
    moduleLabel: '产品路径',
  },
  {
    id: 'PWY01-003',
    slug: 'first-report-reading-path',
    title: '第一份报告阅读路径',
    src: `${BASE}/product-world-yi-explainers-v1/first-report-reading-path-v1.png`,
    alt: '第一份人生K线报告阅读路径图解',
    roles: ['structure', 'action'],
    keywords: ['报告', '阅读', '测算', '生辰', '首份'],
    moduleLabel: '报告阅读',
  },
  {
    id: 'PWY01-004',
    slug: 'deep-report-layer-map',
    title: '深入报告层级地图',
    src: `${BASE}/product-world-yi-explainers-v1/deep-report-layer-map-v1.png`,
    alt: '深入报告通向事业关系财富健康迁移的层级地图',
    roles: ['structure', 'comparison'],
    keywords: ['深入', '层级', '事业', '关系', '财富', '健康', '迁移'],
    moduleLabel: '报告阅读',
  },
  {
    id: 'PWY01-005',
    slug: 'content-system-map',
    title: '内容体系地图',
    src: `${BASE}/product-world-yi-explainers-v1/content-system-map-v1.png`,
    alt: '知识案例洞察工具与报告内容体系地图',
    roles: ['cover', 'structure'],
    keywords: ['知识', '案例', '内容', '体系', '百科'],
    moduleLabel: '内容体系',
  },
  {
    id: 'PWY01-006',
    slug: 'not-fatalism-boundary',
    title: '非宿命论边界图',
    src: `${BASE}/product-world-yi-explainers-v1/not-fatalism-boundary-v1.png`,
    alt: '命理判断的非恐吓非决定论边界说明图',
    roles: ['risk', 'summary'],
    keywords: ['风险', '边界', '宿命', '恐吓', '克制'],
    moduleLabel: '风险边界',
  },
  {
    id: 'PWY01-007',
    slug: 'tool-center-matrix',
    title: '工具中心矩阵',
    src: `${BASE}/product-world-yi-explainers-v1/tool-center-120-matrix-v1.png`,
    alt: '人生K线工具中心问题拆解矩阵图',
    roles: ['action', 'comparison'],
    keywords: ['工具', '验证', '行动', '矩阵'],
    moduleLabel: '工具矩阵',
  },
  {
    id: 'PWY01-008',
    slug: 'bazi-time-correction-map',
    title: '真太阳时校正图',
    src: `${BASE}/product-world-yi-explainers-v1/bazi-time-correction-map-v1.png`,
    alt: '真太阳时与出生地经度校正对命盘影响图解',
    roles: ['timing', 'structure'],
    keywords: ['真太阳时', '时差', '经度', '出生', '排盘', '时间'],
    moduleLabel: '时位校正',
  },
  {
    id: 'PWY01-009',
    slug: 'five-elements-modern-translation',
    title: '五行现代翻译图',
    src: `${BASE}/product-world-yi-explainers-v1/five-elements-modern-translation-v1.png`,
    alt: '五行概念到现代判断语言的翻译图解',
    roles: ['structure', 'comparison'],
    keywords: ['五行', '金', '木', '水', '火', '土'],
    moduleLabel: '命理易学',
  },
  {
    id: 'MYF-four-pillars',
    slug: 'four-pillars-bazi-structure',
    title: '四柱八字结构图',
    src: `${BASE}/mingli-yixue-foundations-v1/four-pillars-bazi-structure-v1.png`,
    alt: '年月日时四柱八字结构图解',
    roles: ['structure', 'cover'],
    keywords: ['八字', '四柱', '年柱', '月柱', '日柱', '时柱', '排盘'],
    moduleLabel: '命理易学',
  },
  {
    id: 'MYF-ten-gods',
    slug: 'ten-gods-relationship-functions',
    title: '十神关系功能图',
    src: `${BASE}/mingli-yixue-foundations-v1/ten-gods-relationship-functions-v1.png`,
    alt: '十神关系与现代功能角色对照图',
    roles: ['structure', 'comparison'],
    keywords: ['十神', '比劫', '食伤', '财才', '官杀', '印绶'],
    moduleLabel: '命理易学',
  },
  {
    id: 'MYF-generating',
    slug: 'five-elements-generating-cycle',
    title: '五行相生循环图',
    src: `${BASE}/mingli-yixue-foundations-v1/five-elements-generating-cycle-v1.png`,
    alt: '五行相生循环结构图解',
    roles: ['structure', 'timing'],
    keywords: ['五行', '相生', '循环'],
    moduleLabel: '命理易学',
  },
  {
    id: 'MYF-controlling',
    slug: 'five-elements-controlling-cycle',
    title: '五行相克循环图',
    src: `${BASE}/mingli-yixue-foundations-v1/five-elements-controlling-cycle-v1.png`,
    alt: '五行相克与制衡关系图解',
    roles: ['risk', 'structure'],
    keywords: ['五行', '相克', '制衡', '冲突'],
    moduleLabel: '命理易学',
  },
  {
    id: 'MYF-dayun',
    slug: 'great-luck-yearly-flow-map',
    title: '大运流年时间轴',
    src: `${BASE}/mingli-yixue-foundations-v1/great-luck-yearly-flow-map-v1.png`,
    alt: '大运与流年时间轴图解',
    roles: ['timing', 'cover'],
    keywords: ['大运', '流年', '时间轴', '阶段', '窗口'],
    moduleLabel: '时位节奏',
  },
  {
    id: 'MYF-terms',
    slug: 'traditional-terms-to-modern-judgment',
    title: '传统术语现代判断图',
    src: `${BASE}/mingli-yixue-foundations-v1/traditional-terms-to-modern-judgment-v1.png`,
    alt: '传统命理术语到现代判断语言的映射图',
    roles: ['comparison', 'summary'],
    keywords: ['术语', '翻译', '入门', '读懂', '现代'],
    moduleLabel: '命理易学',
  },
];

const DIAGRAM_DEFS: Array<{
  role: ContentFigureRole;
  variant: ContentDiagramVariant;
  title: string;
  caption: string;
  keywords: string[];
}> = [
  {
    role: 'structure',
    variant: 'world-yi-six-step',
    title: '世界易六步总式',
    caption: '先结构，再时位与环境，然后行动、管风险、做复盘——避免只贴吉凶标签。',
    keywords: ['结构', '方法', '判断', '世界易'],
  },
  {
    role: 'timing',
    variant: 'structure-timing-env',
    title: '结构 · 时位 · 环境',
    caption: '同一结构在不同阶段与环境下，可执行动作完全不同。',
    keywords: ['时位', '阶段', '环境', '窗口', '大运', '流年'],
  },
  {
    role: 'action',
    variant: 'decision-matrix',
    title: '推进 / 观望 / 收敛 决策矩阵',
    caption: '把“感觉”落成可验证动作：推进、观望还是收敛。',
    keywords: ['决策', '行动', '选择', '推进', '观望'],
  },
  {
    role: 'risk',
    variant: 'risk-boundary',
    title: '风险与边界',
    caption: '先划定不可越界的红线，再谈机会扩张。',
    keywords: ['风险', '边界', '合伙', '婚姻', '消耗'],
  },
  {
    role: 'summary',
    variant: 'kline-journey',
    title: '从阅读到验证的路径',
    caption: '看懂图解后，下一步是工具验证或生成个人报告。',
    keywords: ['报告', '工具', '路径', '验证'],
  },
  {
    role: 'structure',
    variant: 'five-elements-cycle',
    title: '五行生克简图',
    caption: '用生克关系理解张力来源，而不是孤立看某一行强弱。',
    keywords: ['五行', '相生', '相克'],
  },
  {
    role: 'comparison',
    variant: 'case-before-after',
    title: '案例前后对照',
    caption: '先辨结构错位，再看动作修正后的阶段变化。',
    keywords: ['案例', '对照', '修正', '前后'],
  },
];

function normalizeText(value: string) {
  return value.toLowerCase().replace(/[_-]/g, ' ').replace(/\s+/g, ' ').trim();
}

function readString(meta: Record<string, unknown> | null | undefined, key: string) {
  const value = meta?.[key];
  return typeof value === 'string' ? value.trim() : '';
}

function readStringArray(meta: Record<string, unknown> | null | undefined, key: string) {
  const value = meta?.[key];
  if (!Array.isArray(value)) return [] as string[];
  return value.map((item) => `${item}`.trim()).filter(Boolean);
}

function signalText(entry: ContentIllustrationSignal) {
  return normalizeText(
    [
      entry.title || '',
      entry.excerpt || '',
      entry.category || '',
      entry.slug || '',
      entry.contentType || '',
      ...(entry.tags || []),
      ...readStringArray(entry.meta, 'relatedReportThemes'),
      ...readStringArray(entry.meta, 'relatedToolSlugs'),
    ].join(' '),
  );
}

function scoreCatalog(entry: CatalogEntry, text: string, preferredRole?: ContentFigureRole) {
  let score = entry.preferBoost || 0;
  for (const keyword of entry.keywords) {
    if (text.includes(normalizeText(keyword))) score += 8;
  }
  if (preferredRole && entry.roles.includes(preferredRole)) score += 6;
  if (text.includes(normalizeText(entry.title))) score += 4;
  return score;
}

function sectionAnchors(sectionCount: number, figureCount: number): number[] {
  // Hero + evenly spaced after sections
  if (sectionCount <= 0) return Array.from({ length: figureCount }, () => -1);
  const anchors = [-1];
  const bodySlots = Math.max(0, figureCount - 1);
  if (bodySlots === 0) return anchors;
  for (let i = 0; i < bodySlots; i += 1) {
    const ratio = (i + 1) / (bodySlots + 1);
    anchors.push(Math.min(sectionCount - 1, Math.max(0, Math.floor(ratio * sectionCount) - 1)));
  }
  // Ensure uniqueness by walking forward
  const used = new Set<number>([-1]);
  return anchors.map((anchor, index) => {
    if (index === 0) return -1;
    let next = anchor;
    while (used.has(next) && next < sectionCount - 1) next += 1;
    if (used.has(next)) {
      next = Math.max(0, sectionCount - 1 - (index % sectionCount));
    }
    used.add(next);
    return next;
  });
}

function parseExplicitIllustrations(meta: Record<string, unknown> | null | undefined): ContentFigure[] {
  const raw = meta?.illustrations;
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item, index) => {
      if (!item || typeof item !== 'object') return null;
      const row = item as Record<string, unknown>;
      const title = typeof row.title === 'string' ? row.title : `图解 ${index + 1}`;
      const src = typeof row.src === 'string' ? row.src : '';
      const kind = (row.kind as ContentFigureKind) || (src ? 'library' : 'diagram');
      return {
        id: typeof row.id === 'string' ? row.id : `ill_${index}`,
        role: (row.role as ContentFigureRole) || 'structure',
        title,
        caption: typeof row.caption === 'string' ? row.caption : '',
        alt: typeof row.alt === 'string' ? row.alt : title,
        src,
        kind,
        afterSectionIndex: typeof row.afterSectionIndex === 'number' ? row.afterSectionIndex : index === 0 ? -1 : index - 1,
        diagramVariant: row.diagramVariant as ContentDiagramVariant | undefined,
        moduleLabel: typeof row.moduleLabel === 'string' ? row.moduleLabel : undefined,
        width: typeof row.width === 'number' ? row.width : 1280,
        height: typeof row.height === 'number' ? row.height : 720,
      } satisfies ContentFigure;
    })
    .filter((item): item is ContentFigure => Boolean(item));
}

function bindingIds(meta: Record<string, unknown> | null | undefined): string[] {
  const binding = meta?.visualAssets;
  if (!binding || typeof binding !== 'object') return [];
  const row = binding as Record<string, unknown>;
  const ids = [
    typeof row.hero === 'string' ? row.hero : '',
    typeof row.cover === 'string' ? row.cover : '',
    ...(Array.isArray(row.inline) ? row.inline.map((item) => `${item}`) : []),
    ...(row.social && typeof row.social === 'object'
      ? Object.values(row.social as Record<string, unknown>).map((item) => `${item}`)
      : []),
  ];
  return [...new Set(ids.map((item) => item.trim()).filter(Boolean))];
}

function figureFromCatalog(
  entry: CatalogEntry,
  role: ContentFigureRole,
  afterSectionIndex: number,
  captionOverride?: string,
): ContentFigure {
  return {
    id: entry.id,
    role,
    title: entry.title,
    caption: captionOverride || `${entry.title}：把抽象判断拆成可看见的结构关系。`,
    alt: entry.alt,
    src: entry.src,
    kind: entry.kindHint || (entry.src.includes('/page-illustrations/') ? 'generated' : 'library'),
    afterSectionIndex,
    slug: entry.slug,
    moduleLabel: entry.moduleLabel,
    width: entry.src.includes('/page-illustrations/') ? 1600 : 1280,
    height: entry.src.includes('/page-illustrations/') ? 900 : 720,
  };
}

/** Normalize product/content locale → illustration language bucket. */
function illustLocaleBucket(locale?: string | null): 'zh-CN' | 'zh-Hant' | 'en' {
  const v = `${locale || 'zh-CN'}`.toLowerCase();
  if (v.startsWith('en')) return 'en';
  if (v.includes('hant') || v === 'zh-tw' || v === 'zh-hk' || v === 'zh-mo') return 'zh-Hant';
  return 'zh-CN';
}

/** Map ready page-illustration catalog into content figure scoring pool. */
function pageIllustrationsAsCatalog(preferLocale?: string | null): CatalogEntry[] {
  const want = illustLocaleBucket(preferLocale);
  return PAGE_ILLUSTRATION_CATALOG.filter((e) => e.ready && e.filename)
    .filter((e: PageIllustrationEntry) => {
      const loc = e.locale || 'zh-CN';
      // Keep zh-CN bases + matching locale variants; drop other-language sisters
      // so English pages do not surface simplified-Chinese-only GEO/hub diagrams by accident.
      if (loc === 'zh-CN' || loc === want) return true;
      return false;
    })
    .map((e: PageIllustrationEntry) => {
      const loc = e.locale || 'zh-CN';
      const localeBoost = loc === want ? 8 : 0;
      return {
        id: e.id,
        slug: e.id.toLowerCase().replace(/_/g, '-'),
        title: e.title,
        src: pageIllustPublicSrc(e),
        // SEO alt: keep catalog alt (already multi-keyword); minor city/GEO boost below
        alt: e.alt,
        roles: [e.role as ContentFigureRole],
        keywords: [
          ...e.tags,
          e.title,
          e.caption,
          ...(e.surfaces || []),
          ...(e.reportCiteKeys || []),
        ],
        moduleLabel: e.tags[0] || '页面图解',
        preferBoost: 12 + localeBoost,
        kindHint: 'generated' as ContentFigureKind,
      };
    });
}

function allScoredCatalogs(preferLocale?: string | null): CatalogEntry[] {
  return [...pageIllustrationsAsCatalog(preferLocale), ...CONTENT_ILLUSTRATION_CATALOG];
}

/** Map city names / slugs → page-illustration GEO ids (zh-CN base). */
const GEO_CITY_MATCHERS: Array<{ id: string; needles: string[] }> = [
  { id: 'PI-GEO-SHANGHAI', needles: ['shanghai', '上海'] },
  { id: 'PI-GEO-SHENZHEN', needles: ['shenzhen', '深圳'] },
  { id: 'PI-GEO-BEIJING', needles: ['beijing', '北京'] },
  { id: 'PI-GEO-NEW_YORK', needles: ['new-york', 'new york', '纽约', '紐約'] },
  { id: 'PI-GEO-SYDNEY', needles: ['sydney', '悉尼', '雪梨'] },
  { id: 'PI-GEO-LONDON', needles: ['london', '伦敦', '倫敦'] },
  { id: 'PI-GEO-TOKYO', needles: ['tokyo', '东京', '東京'] },
  { id: 'PI-GEO-LOS_ANGELES', needles: ['los-angeles', 'los angeles', '洛杉矶', '洛杉磯'] },
  { id: 'PI-GEO-SINGAPORE', needles: ['singapore', '新加坡'] },
  { id: 'PI-GEO-HONG_KONG', needles: ['hong-kong', 'hong kong', '香港'] },
  { id: 'PI-GEO-VANCOUVER', needles: ['vancouver', '温哥华', '溫哥華'] },
  { id: 'PI-GEO-TORONTO', needles: ['toronto', '多伦多', '多倫多'] },
];

/** Prefer locale variant id (…-EN / …-HANT) then fall back to zh-CN base. */
function geoCatalogIdForLocale(baseId: string, locale?: string | null): string[] {
  const bucket = illustLocaleBucket(locale);
  if (bucket === 'en') return [`${baseId}-EN`, baseId];
  if (bucket === 'zh-Hant') return [`${baseId}-HANT`, baseId];
  return [baseId];
}

/** SEO-oriented alt templates for GEO city figures (Google Image seed keywords). */
function geoSeoAlt(catalog: CatalogEntry, locale?: string | null): string {
  const bucket = illustLocaleBucket(locale);
  if (catalog.alt && catalog.alt.length > 24) return catalog.alt;
  if (bucket === 'en') {
    return `${catalog.title} — Life K-Line city environment diagram for overseas Chinese: cost, role density, life rhythm`;
  }
  if (bucket === 'zh-Hant') {
    return `${catalog.title}｜人生K線城市環境層示意：成本結構、角色密度、生活節奏`;
  }
  return `${catalog.title}｜人生K线城市环境层观察：成本结构、角色密度、生活节奏、迁移择城`;
}

function catalogEntryById(id: string): CatalogEntry | undefined {
  const e = PAGE_ILLUSTRATION_CATALOG.find((row) => row.ready && row.id === id && row.filename);
  if (!e) return undefined;
  return {
    id: e.id,
    slug: e.id.toLowerCase().replace(/_/g, '-'),
    title: e.title,
    src: pageIllustPublicSrc(e),
    alt: e.alt,
    roles: [e.role as ContentFigureRole],
    keywords: e.tags,
    moduleLabel: e.tags[0] || 'GEO',
    preferBoost: 20,
    kindHint: 'generated' as ContentFigureKind,
  };
}

function pickGeoCityFigure(
  entry: ContentIllustrationSignal,
  afterSectionIndex: number,
): ContentFigure | null {
  const hay = normalizeText(
    [entry.slug || '', entry.title || '', entry.excerpt || '', entry.category || ''].join(' '),
  );
  if (!hay) return null;
  for (const m of GEO_CITY_MATCHERS) {
    if (!m.needles.some((n) => hay.includes(normalizeText(n)))) continue;
    let catalog: CatalogEntry | undefined;
    for (const id of geoCatalogIdForLocale(m.id, entry.locale)) {
      catalog = catalogEntryById(id);
      if (catalog?.src) break;
    }
    if (!catalog || !catalog.src) continue;
    const fig = figureFromCatalog(catalog, 'cover', afterSectionIndex, catalog.title);
    fig.alt = geoSeoAlt(catalog, entry.locale);
    return fig;
  }
  return null;
}

function figureFromDiagram(
  def: (typeof DIAGRAM_DEFS)[number],
  afterSectionIndex: number,
  titleHint?: string,
): ContentFigure {
  return {
    id: `diagram_${def.variant}`,
    role: def.role,
    title: titleHint ? `${def.title} · ${titleHint.slice(0, 18)}` : def.title,
    caption: def.caption,
    alt: def.title,
    src: '',
    kind: 'diagram',
    afterSectionIndex,
    diagramVariant: def.variant,
    moduleLabel: '图解模板',
    width: 1280,
    height: 720,
  };
}

/**
 * Resolve ≥ MIN_CONTENT_ILLUSTRATIONS figures for an article.
 */
export function resolveContentIllustrations(
  entry: ContentIllustrationSignal,
  options?: { min?: number; target?: number },
): ContentFigure[] {
  const min = options?.min ?? MIN_CONTENT_ILLUSTRATIONS;
  const target = Math.max(min, options?.target ?? TARGET_CONTENT_ILLUSTRATIONS);
  const sectionCount = Math.max(0, entry.sectionCount || 0);
  const text = signalText(entry);
  const explicit = parseExplicitIllustrations(entry.meta);
  if (explicit.length >= min) {
    return explicit.slice(0, Math.max(target, explicit.length));
  }

  const selected: ContentFigure[] = [...explicit];
  const usedIds = new Set(selected.map((item) => item.id));
  const usedSrc = new Set(selected.map((item) => item.src).filter(Boolean));
  const anchors = sectionAnchors(sectionCount, target);
  const rolePlan: ContentFigureRole[] = ['cover', 'structure', 'timing', 'action', 'risk', 'summary'].slice(0, target) as ContentFigureRole[];

  const pooled = allScoredCatalogs(entry.locale);

  // Prefer bound library / page-illust ids
  const bound = bindingIds(entry.meta);
  for (const id of bound) {
    if (selected.length >= target) break;
    const catalog = pooled.find((item) => item.id === id || item.slug === id);
    if (!catalog || usedIds.has(catalog.id) || usedSrc.has(catalog.src)) continue;
    const role = rolePlan[selected.length] || 'structure';
    const fig = figureFromCatalog(catalog, role, anchors[selected.length] ?? 0);
    selected.push(fig);
    usedIds.add(fig.id);
    usedSrc.add(fig.src);
  }

  // GEO city: inject matching city diagram first (locale-aware EN/Hant/zh-CN)
  const cityFig = pickGeoCityFigure(entry, anchors[0] ?? -1);
  if (cityFig && !usedIds.has(cityFig.id) && !usedSrc.has(cityFig.src || '')) {
    selected.unshift(cityFig);
    usedIds.add(cityFig.id);
    if (cityFig.src) usedSrc.add(cityFig.src);
    while (selected.length > target) {
      const dropped = selected.pop();
      if (dropped) usedIds.delete(dropped.id);
    }
  }

  // Keyword scored catalog (page-illustrations boosted via preferBoost + locale)
  const scored = pooled
    .map((item) => ({
      item,
      score: scoreCatalog(item, text, rolePlan[selected.length]),
    }))
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score);

  for (const row of scored) {
    if (selected.length >= target) break;
    if (usedIds.has(row.item.id) || usedSrc.has(row.item.src)) continue;
    const role = rolePlan[selected.length] || row.item.roles[0] || 'structure';
    const fig = figureFromCatalog(row.item, role, anchors[selected.length] ?? 0);
    selected.push(fig);
    usedIds.add(fig.id);
    usedSrc.add(fig.src);
  }

  // Soft fallbacks by content type — page-illust ids first, then legacy visual-assets
  const typeFallback =
    entry.contentType === 'case'
      ? ['PI-CASES-01', 'PI-REPORT-DECISION-01', 'PI-BOUNDARY-01', 'PWY01-002', 'PWY01-003']
      : entry.contentType === 'insight'
        ? ['PI-KLINE-01', 'PI-LEARN-01', 'PI-REPORT-TIMING-01', 'PWY01-001']
        : ['PI-KNOWLEDGE-01', 'PI-YONGSHEN-01', 'PI-FIVE-ELEMENTS-01', 'PI-BAZI-PILLARS-01', 'PWY01-002'];
  for (const id of typeFallback) {
    if (selected.length >= target) break;
    const catalog = pooled.find((item) => item.id === id);
    if (!catalog || usedIds.has(catalog.id) || usedSrc.has(catalog.src)) continue;
    const role = rolePlan[selected.length] || 'structure';
    selected.push(figureFromCatalog(catalog, role, anchors[selected.length] ?? 0));
    usedIds.add(catalog.id);
    usedSrc.add(catalog.src);
  }

  // Diagram templates fill remaining slots (always available)
  const diagramPool = [...DIAGRAM_DEFS].sort((left, right) => {
    const leftHit = left.keywords.some((keyword) => text.includes(normalizeText(keyword))) ? 1 : 0;
    const rightHit = right.keywords.some((keyword) => text.includes(normalizeText(keyword))) ? 1 : 0;
    return rightHit - leftHit;
  });
  for (const def of diagramPool) {
    if (selected.length >= target) break;
    if (usedIds.has(`diagram_${def.variant}`)) continue;
    selected.push(figureFromDiagram(def, anchors[selected.length] ?? 0, entry.title));
    usedIds.add(`diagram_${def.variant}`);
  }

  while (selected.length < min) {
    const def = DIAGRAM_DEFS[selected.length % DIAGRAM_DEFS.length];
    selected.push(figureFromDiagram(def, anchors[selected.length] ?? 0, entry.title));
  }

  return selected.slice(0, Math.max(target, selected.length));
}

/** Build meta payload to persist on publish (does not require image API). */
export function buildIllustrationMetaForEntry(entry: ContentIllustrationSignal) {
  const illustrations = resolveContentIllustrations(entry, {
    min: MIN_CONTENT_ILLUSTRATIONS,
    target: TARGET_CONTENT_ILLUSTRATIONS,
  });
  const libraryIds = illustrations
    .filter((item) => item.kind === 'library')
    .map((item) => item.id);

  return {
    illustrations,
    illustrationCount: illustrations.length,
    illustrationReady: illustrations.length >= MIN_CONTENT_ILLUSTRATIONS,
    illustrationVersion: 'content-illu-v1',
    visualAssets: {
      hero: libraryIds[0] || illustrations[0]?.id,
      cover: libraryIds[0] || illustrations[0]?.id,
      inline: libraryIds.slice(1),
      social: libraryIds[2] ? { default: libraryIds[2] } : {},
    },
  };
}

export function groupFiguresBySection(figures: ContentFigure[], sectionCount: number) {
  const hero: ContentFigure[] = [];
  const afterSection: ContentFigure[][] = Array.from({ length: Math.max(sectionCount, 0) }, () => []);
  const trailing: ContentFigure[] = [];

  for (const figure of figures) {
    if (figure.afterSectionIndex < 0) {
      hero.push(figure);
      continue;
    }
    if (figure.afterSectionIndex >= sectionCount) {
      trailing.push(figure);
      continue;
    }
    afterSection[figure.afterSectionIndex].push(figure);
  }

  return { hero, afterSection, trailing };
}

export function illustrationSeoImages(figures: ContentFigure[]) {
  return figures
    .filter((item) => item.src && item.kind !== 'diagram')
    .slice(0, 4)
    .map((item) => ({
      url: item.src.startsWith('http') ? item.src : `https://www.life-kline.com${item.src}`,
      alt: item.alt,
      width: item.width || 1280,
      height: item.height || 720,
    }));
}
