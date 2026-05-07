import OpenAI from 'openai';
import { db } from '@/lib/database';
import {
  getVisualAssetCoreModel,
  getVisualAssetDefaultModel,
  getVisualAssetNarrativeModel,
} from '@/lib/env';
import { resolveRuntimeLlmProviders } from '@/lib/llm-provider-configs';
import { createOpenAiCompatibleChatCompletion } from '@/lib/openai-compatible-chat';
import { generateId } from '@/lib/utils';

export type VisualAssetStatus =
  | 'planned'
  | 'prompt_ready'
  | 'queued'
  | 'generating'
  | 'generated'
  | 'auto_checked'
  | 'needs_review'
  | 'approved'
  | 'published'
  | 'needs_correction'
  | 'rejected'
  | 'retired';

export type VisualAssetQaStatus =
  | 'pending'
  | 'auto_passed'
  | 'needs_review'
  | 'approved'
  | 'rejected'
  | 'needs_correction'
  | 'retired';

export type VisualAssetRecord = {
  id: string;
  assetType: string;
  module: string;
  batchId?: string | null;
  slug: string;
  title: string;
  description?: string | null;
  prompt: string;
  negativePrompt?: string | null;
  model: string;
  size: string;
  ratio: string;
  quality: string;
  sourceImageIds: string[];
  brandReferenceIds: string[];
  outputPath?: string | null;
  publicUrl?: string | null;
  altText?: string | null;
  overlayCopySimplified?: string | null;
  overlayCopyTraditional?: string | null;
  overlayCopyEnglish?: string | null;
  narrativeTitle?: string | null;
  narrativeExcerpt?: string | null;
  narrativeSections: Array<{ heading: string; body: string }>;
  targetRoutes: string[];
  relatedContentSlugs: string[];
  relatedToolSlugs: string[];
  relatedReportThemes: string[];
  status: VisualAssetStatus;
  qaStatus: VisualAssetQaStatus;
  qaScore: number;
  qaNotes: Record<string, unknown>;
  correctionCount: number;
  latestErrorCode?: string | null;
  version: number;
  meta: Record<string, unknown>;
  createdBy?: string | null;
  updatedBy?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type VisualAssetManifest = {
  batch: {
    id: string;
    name: string;
    libraryKey: string;
    module?: string;
    targetCount?: number;
    model?: string;
    brandPackId?: string;
    meta?: Record<string, unknown>;
  };
  assets: Array<Partial<VisualAssetRecord> & {
    id: string;
    assetType: string;
    module: string;
    slug: string;
    title: string;
    subject?: string;
    userQuestion?: string;
    mustShow?: string[];
    mustAvoid?: string[];
    labelCopySimplified?: string[];
    labelCopyTraditional?: string[];
    ctaCopySimplified?: string;
    ctaCopyTraditional?: string;
    layout?: string;
    core?: boolean;
  }>;
};

export type VisualAssetAutoQaResult = {
  status: 'needs_review' | 'needs_correction';
  score: number;
  errorCodes: string[];
  warnings: string[];
  notes: Record<string, unknown>;
};

export type VisualAssetAutoQaParams = {
  workflowId?: string;
  providerImageUrl?: string;
  providerReturnedBase64?: boolean;
  storageBytes?: number;
  actualImageWidth?: number;
  actualImageHeight?: number;
  contentType?: string;
};

export type VisualAssetManualReviewStatus =
  | 'approved'
  | 'needs_review'
  | 'needs_correction'
  | 'rejected';

type RawVisualAssetRow = Record<string, any>;
type RawVisualAssetBatchRow = Record<string, any>;

const DEFAULT_NEGATIVE_PROMPT = [
  'fortune teller',
  'crystal ball',
  'cheap zodiac stickers',
  'horror mysticism',
  'random unreadable Chinese characters',
  'fake tiny text',
  'misspelled brand text',
  'deterministic destiny claims',
  'sensational fear marketing',
  'purple SaaS default style',
  'generic neon AI',
  'cluttered diagrams',
].join(', ');

function buildFallbackNarrativeSections(asset: VisualAssetRecord) {
  const subject = `${asset.meta?.subject || asset.description || asset.title}`.trim();
  return [
    {
      heading: '这张图要说明什么',
      body: `${asset.title}用于说明人生K线 / 世界易中的一个核心判断场景：先看结构，再看时间、环境与行动。它不是把命运说成固定结论，而是把复杂信息拆成可理解、可复盘的层次。`,
    },
    {
      heading: '如何理解画面结构',
      body: subject
        ? `画面围绕“${subject}”展开，重点呈现主题、关系、边界和转化路径。用户可以把它当作阅读报告、工具测算或知识文章时的视觉索引。`
        : '画面重点呈现主题、关系、边界和转化路径。用户可以把它当作阅读报告、工具测算或知识文章时的视觉索引。',
    },
    {
      heading: '使用边界',
      body: '所有命理、易学和相学内容都应作为文化解释与结构化思考工具使用，不做恐吓式判断，也不替代法律、医疗、财务或现实决策中的专业意见。',
    },
  ];
}

export function buildFallbackVisualAssetNarrative(asset: VisualAssetRecord) {
  return {
    title: asset.narrativeTitle || asset.title,
    excerpt: asset.narrativeExcerpt || asset.description || `${asset.title}用于说明人生K线 / 世界易的结构化判断方法。`,
    sections: buildFallbackNarrativeSections(asset),
  };
}

export function saveVisualAssetNarrative(assetId: string, narrative: {
  title: string;
  excerpt: string;
  sections: Array<{ heading: string; body: string }>;
  updatedBy?: string;
}) {
  db.prepare(`
    UPDATE visual_assets
    SET narrative_title = ?, narrative_excerpt = ?, narrative_sections = ?, updated_by = ?, updated_at = ?
    WHERE id = ?
  `).run(
    narrative.title.trim(),
    narrative.excerpt.trim(),
    stringifyJson(narrative.sections),
    narrative.updatedBy || 'system_visual_assets_narrative',
    new Date().toISOString(),
    assetId
  );

  return getVisualAssetById(assetId);
}

function parseJson<T>(value: unknown, fallback: T): T {
  if (typeof value !== 'string' || !value.trim()) return fallback;
  const trimmed = value.trim();
  try {
    return JSON.parse(trimmed) as T;
  } catch {
    const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fenced?.[1]) {
      try {
        return JSON.parse(fenced[1].trim()) as T;
      } catch {
        return fallback;
      }
    }

    const start = trimmed.indexOf('{');
    const end = trimmed.lastIndexOf('}');
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(trimmed.slice(start, end + 1)) as T;
      } catch {
        return fallback;
      }
    }

    return fallback;
  }
}

function stringifyJson(value: unknown) {
  return JSON.stringify(value ?? null);
}

function readStringArray(value: unknown) {
  if (Array.isArray(value)) {
    return value.map((item) => `${item || ''}`.trim()).filter(Boolean);
  }
  return [];
}

function mapVisualAssetRow(row: RawVisualAssetRow): VisualAssetRecord {
  return {
    id: row.id,
    assetType: row.asset_type,
    module: row.module,
    batchId: row.batch_id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    prompt: row.prompt,
    negativePrompt: row.negative_prompt,
    model: row.model,
    size: row.size,
    ratio: row.ratio,
    quality: row.quality,
    sourceImageIds: parseJson(row.source_image_ids, []),
    brandReferenceIds: parseJson(row.brand_reference_ids, []),
    outputPath: row.output_path,
    publicUrl: row.public_url,
    altText: row.alt_text,
    overlayCopySimplified: row.overlay_copy_simplified,
    overlayCopyTraditional: row.overlay_copy_traditional,
    overlayCopyEnglish: row.overlay_copy_english,
    narrativeTitle: row.narrative_title,
    narrativeExcerpt: row.narrative_excerpt,
    narrativeSections: parseJson(row.narrative_sections, []),
    targetRoutes: parseJson(row.target_routes, []),
    relatedContentSlugs: parseJson(row.related_content_slugs, []),
    relatedToolSlugs: parseJson(row.related_tool_slugs, []),
    relatedReportThemes: parseJson(row.related_report_themes, []),
    status: row.status,
    qaStatus: row.qa_status,
    qaScore: Number(row.qa_score || 0),
    qaNotes: parseJson(row.qa_notes, {}),
    correctionCount: Number(row.correction_count || 0),
    latestErrorCode: row.latest_error_code,
    version: Number(row.version || 1),
    meta: parseJson(row.meta, {}),
    createdBy: row.created_by,
    updatedBy: row.updated_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function resolveAssetModel(asset: Partial<VisualAssetRecord> & { core?: boolean }) {
  if (asset.model) return asset.model;
  return asset.core ? getVisualAssetCoreModel() : getVisualAssetDefaultModel();
}

function resolveVisualComposition(asset: {
  slug?: string;
  title: string;
  meta?: Record<string, unknown>;
  layout?: string;
}) {
  const explicit = `${asset.layout || asset.meta?.layout || ''}`.trim();
  if (explicit) return explicit;

  const slug = asset.slug || '';
  const title = asset.title || '';
  if (/kangxi|naming|康熙|起名/.test(`${slug} ${title}`)) {
    return 'museum-grade aggregate knowledge board: central Kangxi dictionary spread, 8-12 surrounding content modules, radical/stroke/meaning/sound/context stations, flow arrows, miniature paper cards, seals, and clear hierarchy';
  }
  if (/social|传播/.test(`${slug} ${title}`)) {
    return 'shareable editorial poster: bold symbolic center, strong headline, three compact insight cards, bottom call-to-action strip, rich background details';
  }
  if (/report|报告/.test(`${slug} ${title}`)) {
    return 'product cockpit infographic: central report interface, four surrounding analysis panels, timeline strip, next-action path, layered product UI depth';
  }
  if (/feng|风水/.test(`${slug} ${title}`)) {
    return 'architectural spatial infographic: abstract floor plan, airflow and movement paths, zones, markers, layered light, and environmental reasoning cards';
  }
  if (/bagua|yijing|易经|八卦/.test(`${slug} ${title}`)) {
    return 'cosmology diagram board: yin-yang origin, bagua ring, hexagram structure, change path, annotated symbolic layers and classical-modern interface panels';
  }
  if (/ethics|相学|手相|摸骨/.test(`${slug} ${title}`)) {
    return 'cultural ethics education board: abstract manuscript diagrams, boundary line, non-identifiable face and palm schematics, risk and respect modules';
  }
  if (/world-yi|世界易/.test(`${slug} ${title}`)) {
    return 'doctrine system map: central judgment compass, six reasoning paths, layered book-interface surfaces, timeline and review loop';
  }
  if (/brand|品牌/.test(`${slug} ${title}`)) {
    return 'brand system board: material palette, interface cards, symbolic diagram layers, rhythm grid, and compact brand signature area';
  }

  return 'premium educational infographic with a distinctive symbolic center, modular knowledge cards, directional paths, rich details, and clear visual hierarchy';
}

export function buildVisualAssetPrompt(asset: {
  title: string;
  slug?: string;
  description?: string | null;
  meta?: Record<string, unknown>;
  ratio?: string;
  size?: string;
  quality?: string;
  subject?: string;
  userQuestion?: string;
  mustShow?: string[];
  mustAvoid?: string[];
  labelCopySimplified?: string[];
  labelCopyTraditional?: string[];
  ctaCopySimplified?: string;
  ctaCopyTraditional?: string;
  layout?: string;
}) {
  const meta = asset.meta || {};
  const subject = asset.subject || `${meta.subject || asset.description || asset.title}`;
  const userQuestion = asset.userQuestion || `${meta.userQuestion || ''}`.trim() || `What should users understand from ${asset.title}?`;
  const simplifiedCopy = `${(asset as any).overlayCopySimplified || meta.overlayCopySimplified || asset.title}`.trim();
  const traditionalCopy = `${(asset as any).overlayCopyTraditional || meta.overlayCopyTraditional || ''}`.trim();
  const englishCopy = `${(asset as any).overlayCopyEnglish || meta.overlayCopyEnglish || 'Life Kline / World Yi'}`.trim();
  const labelCopySimplified = asset.labelCopySimplified?.length
    ? asset.labelCopySimplified
    : readStringArray(meta.labelCopySimplified);
  const labelCopyTraditional = asset.labelCopyTraditional?.length
    ? asset.labelCopyTraditional
    : readStringArray(meta.labelCopyTraditional);
  const ctaCopySimplified = `${asset.ctaCopySimplified || meta.ctaCopySimplified || ''}`.trim();
  const ctaCopyTraditional = `${asset.ctaCopyTraditional || meta.ctaCopyTraditional || ''}`.trim();
  const composition = resolveVisualComposition(asset);
  const mustShow = asset.mustShow?.length
    ? asset.mustShow
    : readStringArray(meta.mustShow);
  const mustAvoid = [
    ...readStringArray(meta.mustAvoid),
    ...(asset.mustAvoid || []),
  ];

  return [
    'Draw a premium educational illustration for Life Kline / World Yi.',
    '',
    'Brand:',
    'Life Kline, World Yi, www.life-kline.com.',
    '',
    'Visual system:',
    'Modern Eastern judgment system, warm parchment, ink black structure lines, jade teal reasoning layer, cinnabar focal point, muted gold timing details, high-trust editorial product design.',
    '',
    'Subject:',
    subject,
    '',
    'User question:',
    userQuestion,
    '',
    'Must show:',
    mustShow.length ? mustShow.map((item) => `- ${item}`).join('\n') : '- One clear central metaphor that explains the concept.',
    '',
    'Required in-image text:',
    `- Main Chinese headline, large and readable: ${simplifiedCopy || asset.title}`,
    traditionalCopy ? `- Traditional Chinese support line, readable and smaller than the main headline: ${traditionalCopy}` : '- Optional Traditional Chinese support line only if it improves the layout.',
    labelCopySimplified.length
      ? `- Use these exact Simplified Chinese labels only, large enough to read: ${labelCopySimplified.join(' / ')}`
      : '- Add only 3 to 6 short Chinese labels when needed, each 2 to 6 characters, large enough to read.',
    labelCopyTraditional.length
      ? `- Optional Traditional Chinese label equivalents, only where space allows: ${labelCopyTraditional.join(' / ')}`
      : '- Do not add extra dense Traditional Chinese labels unless explicitly provided.',
    ctaCopySimplified ? `- Optional CTA strip, exact Simplified Chinese: ${ctaCopySimplified}` : '- Optional CTA strip only if the layout remains clean.',
    ctaCopyTraditional ? `- Optional CTA strip, exact Traditional Chinese: ${ctaCopyTraditional}` : '- Do not invent extra CTA text.',
    `- Brand signature, small and exact: 世界易 / 人生K线 · www.life-kline.com`,
    englishCopy ? `- Optional secondary micro signature: ${englishCopy}` : '- No secondary English signature required.',
    '- Text must be part of the generated image, not added later.',
    '- Render Chinese characters carefully, with editorial poster typography, no garbled glyphs.',
    '- Use only the required headline, provided short labels, optional CTA, and compact brand signature as readable text.',
    '- Do not invent extra Chinese paragraphs, duplicated subtitles, fake body copy, pseudo-characters, tiny microtext, or unreadable table text.',
    '- If a module needs detail, show it as icons, color blocks, abstract short strokes, visual texture, arrows, cards, or diagrams, not readable false text.',
    '- No readable text should be smaller than about 2% of canvas height.',
    '',
    'Brand layout rule:',
    '- Keep "世界易 / 人生K线 / www.life-kline.com" as a compact signature only, preferably lower-right or bottom margin.',
    '- Brand signature should occupy about 4-7% of the canvas, never dominate the image.',
    '- The visual content and educational explanation must occupy the majority of the canvas.',
    '',
    'Composition:',
    `${asset.ratio || '16:9'} image, ${composition}, integrated title and explanation typography, enough breathing room, rich but organized content, no generic template repetition.`,
    '',
    'Content richness:',
    '- Use GPT-Image-2 generation capability fully: layered scenes, symbolic objects, diagrams, texture details, miniature modules, meaningful arrows, cards, timelines, grids, and visual metaphors.',
    '- Every image in the batch should have a distinct central composition and narrative silhouette while sharing the same brand palette.',
    '- Avoid empty decorative backgrounds; fill the image with useful, legible, educational visual information.',
    '',
    'Brand placement:',
    'Render a small but readable 世界易 / 人生K线 / www.life-kline.com brand mark as part of the image, restrained and secondary.',
    '',
    'Avoid:',
    [DEFAULT_NEGATIVE_PROMPT, ...mustAvoid].filter(Boolean).join(', '),
    '',
    'Text rule:',
    'Do render the required title, exact provided labels, optional CTA and brand text directly in the image. Do not use placeholder text, fake text, unreadable microtext, invented paragraphs, dense tables, duplicated copy, or later overlay assumptions.',
    '',
    'Output:',
    `Size ${asset.size || '2048x1152'}, quality ${asset.quality || 'medium'}, no transparent background.`,
  ].join('\n');
}

export function upsertVisualAssetBatch(input: VisualAssetManifest['batch'] & {
  status?: string;
  manifestPath?: string;
  createdBy?: string;
}) {
  const now = new Date().toISOString();
  const existing = db.prepare(`SELECT id FROM visual_asset_batches WHERE id = ?`).get(input.id) as RawVisualAssetBatchRow | undefined;

  if (existing) {
    db.prepare(`
      UPDATE visual_asset_batches
      SET name = ?, library_key = ?, module = ?, target_count = ?, status = ?, model = ?, brand_pack_id = ?,
          manifest_path = ?, meta = ?, updated_by = ?, updated_at = ?
      WHERE id = ?
    `).run(
      input.name,
      input.libraryKey,
      input.module || null,
      input.targetCount || 0,
      input.status || 'planned',
      input.model || getVisualAssetDefaultModel(),
      input.brandPackId || null,
      input.manifestPath || null,
      stringifyJson(input.meta || {}),
      input.createdBy || 'system_visual_assets',
      now,
      input.id
    );
    return;
  }

  db.prepare(`
    INSERT INTO visual_asset_batches (
      id, name, library_key, module, target_count, status, model, brand_pack_id, manifest_path,
      meta, created_by, updated_by, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    input.id,
    input.name,
    input.libraryKey,
    input.module || null,
    input.targetCount || 0,
    input.status || 'planned',
    input.model || getVisualAssetDefaultModel(),
    input.brandPackId || null,
    input.manifestPath || null,
    stringifyJson(input.meta || {}),
    input.createdBy || 'system_visual_assets',
    input.createdBy || 'system_visual_assets',
    now,
    now
  );
}

export function upsertVisualAsset(input: Partial<VisualAssetRecord> & {
  id: string;
  assetType: string;
  module: string;
  slug: string;
  title: string;
  subject?: string;
  userQuestion?: string;
  mustShow?: string[];
  mustAvoid?: string[];
  labelCopySimplified?: string[];
  labelCopyTraditional?: string[];
  ctaCopySimplified?: string;
  ctaCopyTraditional?: string;
  layout?: string;
  core?: boolean;
}) {
  const now = new Date().toISOString();
  const meta = {
    ...(input.meta || {}),
    subject: input.subject || input.meta?.subject,
    userQuestion: input.userQuestion || input.meta?.userQuestion,
    mustShow: input.mustShow || input.meta?.mustShow,
    mustAvoid: input.mustAvoid || input.meta?.mustAvoid,
    labelCopySimplified: input.labelCopySimplified || input.meta?.labelCopySimplified,
    labelCopyTraditional: input.labelCopyTraditional || input.meta?.labelCopyTraditional,
    ctaCopySimplified: input.ctaCopySimplified || input.meta?.ctaCopySimplified,
    ctaCopyTraditional: input.ctaCopyTraditional || input.meta?.ctaCopyTraditional,
    layout: input.layout || input.meta?.layout,
    core: input.core || input.meta?.core || false,
  };
  const model = resolveAssetModel(input);
  const incomingPrompt = input.prompt || buildVisualAssetPrompt({
    ...input,
    meta,
  });
  const existing = db.prepare(`SELECT id FROM visual_assets WHERE id = ?`).get(input.id) as RawVisualAssetRow | undefined;
  const existingAsset = existing ? getVisualAssetById(input.id) : null;
  const shouldPreserveProductionState = Boolean(existingAsset?.publicUrl || existingAsset?.outputPath);
  const shouldPreserveQueuedCorrectionPrompt = Boolean(
    existingAsset
    && existingAsset.status === 'prompt_ready'
    && existingAsset.correctionCount > 0
    && existingAsset.latestErrorCode
  );
  const prompt = shouldPreserveProductionState || shouldPreserveQueuedCorrectionPrompt ? existingAsset!.prompt : incomingPrompt;
  const status = shouldPreserveProductionState ? existingAsset!.status : input.status || 'prompt_ready';
  const qaStatus = shouldPreserveProductionState ? existingAsset!.qaStatus : input.qaStatus || 'pending';
  const outputPath = input.outputPath !== undefined ? input.outputPath : existingAsset?.outputPath || null;
  const publicUrl = input.publicUrl !== undefined ? input.publicUrl : existingAsset?.publicUrl || null;
  const narrativeTitle = input.narrativeTitle !== undefined ? input.narrativeTitle : existingAsset?.narrativeTitle || null;
  const narrativeExcerpt = input.narrativeExcerpt !== undefined ? input.narrativeExcerpt : existingAsset?.narrativeExcerpt || null;
  const narrativeSections = input.narrativeSections?.length ? input.narrativeSections : existingAsset?.narrativeSections || [];
  const qaScore = shouldPreserveProductionState ? existingAsset!.qaScore : input.qaScore || 0;
  const qaNotes = input.qaNotes && Object.keys(input.qaNotes).length > 0 ? input.qaNotes : existingAsset?.qaNotes || {};
  const correctionCount = shouldPreserveProductionState ? existingAsset!.correctionCount : input.correctionCount || 0;
  const latestErrorCode = input.latestErrorCode !== undefined ? input.latestErrorCode : existingAsset?.latestErrorCode || null;
  const version = input.version || existingAsset?.version || 1;
  const values = [
    input.assetType,
    input.module,
    input.batchId || null,
    input.slug,
    input.title,
    input.description || null,
    prompt,
    input.negativePrompt || DEFAULT_NEGATIVE_PROMPT,
    model,
    input.size || '2048x1152',
    input.ratio || '16:9',
    input.quality || 'medium',
    stringifyJson(input.sourceImageIds || []),
    stringifyJson(input.brandReferenceIds || []),
    outputPath,
    publicUrl,
    input.altText || null,
    input.overlayCopySimplified || null,
    input.overlayCopyTraditional || null,
    input.overlayCopyEnglish || null,
    narrativeTitle,
    narrativeExcerpt,
    stringifyJson(narrativeSections),
    stringifyJson(input.targetRoutes || []),
    stringifyJson(input.relatedContentSlugs || []),
    stringifyJson(input.relatedToolSlugs || []),
    stringifyJson(input.relatedReportThemes || []),
    status,
    qaStatus,
    qaScore,
    stringifyJson(qaNotes),
    correctionCount,
    latestErrorCode,
    version,
    stringifyJson(meta),
    input.updatedBy || input.createdBy || 'system_visual_assets',
    now,
  ];

  if (existing) {
    db.prepare(`
      UPDATE visual_assets
      SET asset_type = ?, module = ?, batch_id = ?, slug = ?, title = ?, description = ?, prompt = ?,
          negative_prompt = ?, model = ?, size = ?, ratio = ?, quality = ?, source_image_ids = ?,
          brand_reference_ids = ?, output_path = ?, public_url = ?, alt_text = ?,
          overlay_copy_simplified = ?, overlay_copy_traditional = ?, overlay_copy_english = ?,
          narrative_title = ?, narrative_excerpt = ?, narrative_sections = ?, target_routes = ?,
          related_content_slugs = ?, related_tool_slugs = ?, related_report_themes = ?, status = ?,
          qa_status = ?, qa_score = ?, qa_notes = ?, correction_count = ?, latest_error_code = ?,
          version = ?, meta = ?, updated_by = ?, updated_at = ?
      WHERE id = ?
    `).run(...values, input.id);
    return getVisualAssetById(input.id);
  }

  db.prepare(`
    INSERT INTO visual_assets (
      id, asset_type, module, batch_id, slug, title, description, prompt, negative_prompt, model,
      size, ratio, quality, source_image_ids, brand_reference_ids, output_path, public_url, alt_text,
      overlay_copy_simplified, overlay_copy_traditional, overlay_copy_english, narrative_title,
      narrative_excerpt, narrative_sections, target_routes, related_content_slugs, related_tool_slugs,
      related_report_themes, status, qa_status, qa_score, qa_notes, correction_count, latest_error_code,
      version, meta, created_by, updated_by, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(input.id, ...values.slice(0, -2), input.createdBy || 'system_visual_assets', input.updatedBy || input.createdBy || 'system_visual_assets', now, now);

  return getVisualAssetById(input.id);
}

export function importVisualAssetManifest(manifest: VisualAssetManifest, params?: {
  manifestPath?: string;
  createdBy?: string;
}) {
  return db.transaction(() => {
    upsertVisualAssetBatch({
      ...manifest.batch,
      targetCount: manifest.batch.targetCount || manifest.assets.length,
      manifestPath: params?.manifestPath,
      createdBy: params?.createdBy,
    });

    const assets = manifest.assets.map((asset) => upsertVisualAsset({
      ...asset,
      batchId: manifest.batch.id,
      model: asset.model || manifest.batch.model || undefined,
      brandReferenceIds: asset.brandReferenceIds?.length
        ? asset.brandReferenceIds
        : [manifest.batch.brandPackId || 'life-kline-world-yi-v1'].filter(Boolean),
      createdBy: params?.createdBy || 'system_visual_assets',
    })).filter(Boolean) as VisualAssetRecord[];

    return {
      batchId: manifest.batch.id,
      importedCount: assets.length,
      assets,
    };
  })();
}

export function getVisualAssetById(id: string) {
  const row = db.prepare(`SELECT * FROM visual_assets WHERE id = ? LIMIT 1`).get(id) as RawVisualAssetRow | undefined;
  return row ? mapVisualAssetRow(row) : null;
}

export function listVisualAssets(params?: {
  status?: VisualAssetStatus;
  qaStatus?: VisualAssetQaStatus;
  batchId?: string;
  limit?: number;
}) {
  const clauses: string[] = [];
  const values: Array<string | number> = [];

  if (params?.status) {
    clauses.push('status = ?');
    values.push(params.status);
  }
  if (params?.qaStatus) {
    clauses.push('qa_status = ?');
    values.push(params.qaStatus);
  }
  if (params?.batchId) {
    clauses.push('batch_id = ?');
    values.push(params.batchId);
  }

  values.push(params?.limit || 50);
  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const rows = db.prepare(`
    SELECT * FROM visual_assets
    ${where}
    ORDER BY datetime(updated_at) ASC, datetime(created_at) ASC
    LIMIT ?
  `).all(...values) as RawVisualAssetRow[];

  return rows.map(mapVisualAssetRow);
}

export function updateVisualAssetStatus(id: string, params: {
  status?: VisualAssetStatus;
  qaStatus?: VisualAssetQaStatus;
  outputPath?: string;
  publicUrl?: string;
  qaScore?: number;
  qaNotes?: Record<string, unknown>;
  latestErrorCode?: string | null;
  updatedBy?: string;
}) {
  const current = getVisualAssetById(id);
  if (!current) return null;

  db.prepare(`
    UPDATE visual_assets
    SET status = ?, qa_status = ?, output_path = ?, public_url = ?, qa_score = ?, qa_notes = ?,
        latest_error_code = ?, updated_by = ?, updated_at = ?
    WHERE id = ?
  `).run(
    params.status || current.status,
    params.qaStatus || current.qaStatus,
    params.outputPath !== undefined ? params.outputPath : current.outputPath || null,
    params.publicUrl !== undefined ? params.publicUrl : current.publicUrl || null,
    params.qaScore !== undefined ? params.qaScore : current.qaScore,
    stringifyJson(params.qaNotes || current.qaNotes || {}),
    params.latestErrorCode !== undefined ? params.latestErrorCode : current.latestErrorCode || null,
    params.updatedBy || 'system_visual_assets',
    new Date().toISOString(),
    id
  );

  return getVisualAssetById(id);
}

function mapManualReviewStatusToAssetStatus(status: VisualAssetManualReviewStatus): {
  status: VisualAssetStatus;
  qaStatus: VisualAssetQaStatus;
} {
  if (status === 'approved') {
    return { status: 'approved', qaStatus: 'approved' };
  }
  if (status === 'rejected') {
    return { status: 'rejected', qaStatus: 'rejected' };
  }
  if (status === 'needs_correction') {
    return { status: 'needs_correction', qaStatus: 'needs_correction' };
  }
  return { status: 'needs_review', qaStatus: 'needs_review' };
}

export function reviewVisualAsset(assetId: string, params: {
  status: VisualAssetManualReviewStatus;
  score?: number;
  errorCodes?: string[];
  notes?: Record<string, unknown>;
  reviewer?: string;
  correctedPrompt?: string;
  queueCorrection?: boolean;
}) {
  const current = getVisualAssetById(assetId);
  if (!current) return null;

  const errorCodes = params.errorCodes || [];
  const mapped = mapManualReviewStatusToAssetStatus(params.status);
  const reviewId = createVisualAssetReview(assetId, {
    reviewType: 'manual_review',
    status: params.status,
    score: params.score,
    errorCodes,
    notes: {
      ...(params.notes || {}),
      reviewedAt: new Date().toISOString(),
      queueCorrection: Boolean(params.queueCorrection),
    },
    reviewer: params.reviewer || 'manual_visual_reviewer',
  });

  let correction: ReturnType<typeof createVisualAssetCorrection> | null = null;
  if (params.status === 'needs_correction') {
    correction = createVisualAssetCorrection(assetId, {
      errorCodes: errorCodes.length ? errorCodes : ['MANUAL_REVIEW_NEEDS_CORRECTION'],
      originalPrompt: current.prompt,
      correctedPrompt: params.correctedPrompt || buildCorrectionPrompt(
        current,
        errorCodes.length ? errorCodes : ['MANUAL_REVIEW_NEEDS_CORRECTION']
      ),
      originalOutputPath: current.outputPath,
      status: params.queueCorrection ? 'queued' : 'planned',
      createdBy: params.reviewer || 'manual_visual_reviewer',
    });
  }

  const shouldQueueCorrection = params.status === 'needs_correction' && params.queueCorrection;
  if (shouldQueueCorrection) {
    const correctedPrompt = params.correctedPrompt || buildCorrectionPrompt(
      current,
      errorCodes.length ? errorCodes : ['MANUAL_REVIEW_NEEDS_CORRECTION']
    );
    db.prepare(`
      UPDATE visual_assets
      SET status = ?, qa_status = ?, prompt = ?, output_path = ?, public_url = ?,
          version = ?, latest_error_code = ?, qa_notes = ?, updated_by = ?, updated_at = ?
      WHERE id = ?
    `).run(
      'prompt_ready',
      'pending',
      correctedPrompt,
      null,
      null,
      current.version + 1,
      errorCodes[0] || 'MANUAL_REVIEW_NEEDS_CORRECTION',
      stringifyJson({
        ...(current.qaNotes || {}),
        manualReview: {
          status: params.status,
          errorCodes,
          notes: params.notes || {},
          reviewId,
          correction,
          queuedAt: new Date().toISOString(),
          previousVersion: current.version,
          previousOutputPath: current.outputPath,
          previousPublicUrl: current.publicUrl,
        },
      }),
      params.reviewer || 'manual_visual_reviewer',
      new Date().toISOString(),
      assetId
    );
    return {
      reviewId,
      correction,
      asset: getVisualAssetById(assetId),
    };
  }

  const asset = updateVisualAssetStatus(assetId, {
    status: mapped.status,
    qaStatus: mapped.qaStatus,
    latestErrorCode: errorCodes[0] || (params.status === 'approved' ? null : current.latestErrorCode || null),
    qaNotes: {
      ...(current.qaNotes || {}),
      manualReview: {
        status: params.status,
        errorCodes,
        notes: params.notes || {},
        reviewId,
        correction,
        reviewedAt: new Date().toISOString(),
      },
    },
    updatedBy: params.reviewer || 'manual_visual_reviewer',
  });

  return {
    reviewId,
    correction,
    asset,
  };
}

export function createVisualAssetCorrection(assetId: string, params: {
  errorCodes: string[];
  originalPrompt: string;
  correctedPrompt: string;
  originalOutputPath?: string | null;
  correctedOutputPath?: string | null;
  status?: string;
  createdBy?: string;
}) {
  const current = getVisualAssetById(assetId);
  if (!current) return null;
  const correctionRound = current.correctionCount + 1;
  const id = `visual_correction_${generateId()}`;

  db.prepare(`
    INSERT INTO visual_asset_corrections (
      id, asset_id, correction_round, error_codes, original_prompt, corrected_prompt,
      original_output_path, corrected_output_path, status, created_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    assetId,
    correctionRound,
    stringifyJson(params.errorCodes || []),
    params.originalPrompt,
    params.correctedPrompt,
    params.originalOutputPath || current.outputPath || null,
    params.correctedOutputPath || null,
    params.status || 'planned',
    params.createdBy || 'system_visual_assets_correction'
  );

  db.prepare(`
    UPDATE visual_assets
    SET correction_count = ?, latest_error_code = ?, updated_by = ?, updated_at = ?
    WHERE id = ?
  `).run(
    correctionRound,
    params.errorCodes[0] || current.latestErrorCode || null,
    params.createdBy || 'system_visual_assets_correction',
    new Date().toISOString(),
    assetId
  );

  return {
    id,
    correctionRound,
  };
}

function buildCorrectionPrompt(asset: VisualAssetRecord, errorCodes: string[]) {
  return [
    asset.prompt,
    '',
    'Correction requirements:',
    ...errorCodes.map((code) => `- Fix ${code}.`),
    '- Preserve the Life Kline / World Yi visual system.',
    '- Keep title, explanation labels, and www.life-kline.com readable inside the generated image.',
    '- Keep brand signature compact at 4-7% of the canvas.',
    '- Remove dense sidebars, tiny captions, fake paragraph text, duplicated subtitles, and pseudo-Chinese microcopy.',
    '- Use only large readable headline, six short module labels, optional CTA, and compact brand signature.',
    '- Convert detail into icons, arrows, color fields, diagrams, short strokes, and cards without readable body text.',
    '- No readable text should be smaller than about 2% of canvas height.',
    '- Avoid fear-based or deterministic metaphysics claims.',
  ].join('\n');
}

export function evaluateVisualAssetAutoQa(asset: VisualAssetRecord, params?: VisualAssetAutoQaParams): VisualAssetAutoQaResult {
  const errorCodes: string[] = [];
  const warnings: string[] = [];
  const prompt = asset.prompt || '';
  const negativePrompt = asset.negativePrompt || '';
  const textContract = [
    asset.overlayCopySimplified,
    asset.overlayCopyTraditional,
    asset.overlayCopyEnglish,
    asset.title,
  ].filter(Boolean).join(' ');

  if (!asset.outputPath || !asset.publicUrl) {
    errorCodes.push('SERVER_STORAGE_MISSING');
  }
  const expectedSize = `${asset.size || ''}`.match(/^(\d+)x(\d+)$/);
  const expectedWidth = expectedSize ? Number(expectedSize[1]) : 0;
  const expectedHeight = expectedSize ? Number(expectedSize[2]) : 0;
  const actualWidth = params?.actualImageWidth || 0;
  const actualHeight = params?.actualImageHeight || 0;
  if (expectedWidth > 0 && expectedHeight > 0) {
    if (actualWidth > 0 && actualHeight > 0) {
      const expectedRatio = expectedWidth / expectedHeight;
      const actualRatio = actualWidth / actualHeight;
      if (Math.abs(expectedRatio - actualRatio) > 0.04) {
        errorCodes.push('IMAGE_ASPECT_RATIO_MISMATCH');
      }
      if (actualWidth < expectedWidth * 0.9 || actualHeight < expectedHeight * 0.9) {
        warnings.push('IMAGE_SIZE_LOWER_THAN_REQUESTED');
      }
    } else if (asset.outputPath || asset.publicUrl) {
      warnings.push('IMAGE_DIMENSIONS_UNKNOWN');
    }
  }
  if (params?.storageBytes !== undefined && params.storageBytes < 120_000) {
    warnings.push('IMAGE_FILE_UNUSUALLY_SMALL');
  }
  if (!prompt.includes('www.life-kline.com')) {
    errorCodes.push('BRAND_DOMAIN_MISSING_IN_PROMPT');
  }
  if (!/Text must be part of the generated image|Required in-image text/i.test(prompt)) {
    errorCodes.push('IN_IMAGE_TEXT_CONTRACT_MISSING');
  }
  if (!/4-7%|compact signature/i.test(prompt)) {
    warnings.push('BRAND_SIGNATURE_SIZE_NOT_EXPLICIT');
  }
  if (/readable generated Chinese text|no readable text|without readable text/i.test(negativePrompt)) {
    errorCodes.push('PROMPT_TEXT_CONFLICT');
  }
  if (!/non-deterministic|non-determinism|Avoid fear|fear-based|deterministic destiny/i.test(prompt)) {
    warnings.push('SAFETY_BOUNDARY_WEAK');
  }
  if (asset.ratio === '4:5' && !/headline|CTA|call-to-action/i.test(prompt)) {
    warnings.push('SOCIAL_LAYOUT_CTA_WEAK');
  }
  if (!textContract.includes('世界易') && !textContract.includes('人生K线') && !prompt.includes('世界易')) {
    warnings.push('CHINESE_BRAND_COPY_WEAK');
  }

  const score = Math.max(0, 100 - errorCodes.length * 22 - warnings.length * 6);
  const status: VisualAssetAutoQaResult['status'] = errorCodes.length > 0 ? 'needs_correction' : 'needs_review';
  const notes = {
    workflowId: params?.workflowId,
    providerImageUrl: params?.providerImageUrl,
    providerReturnedBase64: params?.providerReturnedBase64 || false,
    storageBytes: params?.storageBytes || null,
    actualImageWidth: params?.actualImageWidth || null,
    actualImageHeight: params?.actualImageHeight || null,
    contentType: params?.contentType || null,
    expectedSize: asset.size,
    checkedAt: new Date().toISOString(),
    requiresHumanReviewBeforePublish: true,
  };

  return {
    status,
    score,
    errorCodes,
    warnings,
    notes,
  };
}

export function runVisualAssetAutoQa(asset: VisualAssetRecord, params?: VisualAssetAutoQaParams) {
  const qa = evaluateVisualAssetAutoQa(asset, params);

  createVisualAssetReview(asset.id, {
    reviewType: 'auto_qa',
    status: qa.status,
    score: qa.score,
    errorCodes: qa.errorCodes,
    notes: {
      ...qa.notes,
      warnings: qa.warnings,
    },
    reviewer: 'visual_asset_auto_qa',
  });

  if (qa.errorCodes.length > 0) {
    createVisualAssetCorrection(asset.id, {
      errorCodes: qa.errorCodes,
      originalPrompt: asset.prompt,
      correctedPrompt: buildCorrectionPrompt(asset, qa.errorCodes),
      originalOutputPath: asset.outputPath,
      status: 'planned',
      createdBy: 'visual_asset_auto_qa',
    });
  }

  const updated = updateVisualAssetStatus(asset.id, {
    status: qa.errorCodes.length > 0
      ? 'needs_correction'
      : asset.status === 'approved' || asset.status === 'published'
        ? asset.status
        : 'auto_checked',
    qaStatus: qa.errorCodes.length > 0
      ? 'needs_correction'
      : asset.qaStatus === 'approved'
        ? 'approved'
        : 'needs_review',
    qaScore: qa.score,
    latestErrorCode: qa.errorCodes[0] || null,
    qaNotes: {
      ...(asset.qaNotes || {}),
      autoQa: {
        status: qa.status,
        score: qa.score,
        errorCodes: qa.errorCodes,
        warnings: qa.warnings,
        ...qa.notes,
      },
    },
    updatedBy: 'visual_asset_auto_qa',
  });

  return {
    ...qa,
    updated,
  };
}

export async function requestVisualAssetImage(asset: VisualAssetRecord) {
  const providers = resolveRuntimeLlmProviders('image');
  if (providers.length === 0) {
    throw new Error('No image LLM provider is configured');
  }

  let lastError: unknown = null;
  for (const provider of providers) {
    const client = new OpenAI({
      apiKey: provider.apiKey,
      baseURL: provider.baseUrl,
      timeout: provider.timeoutMs,
      maxRetries: provider.maxRetries,
    });

    try {
      const completion = await createOpenAiCompatibleChatCompletion(client, {
        model: provider.model || asset.model || getVisualAssetDefaultModel(),
        messages: [
          {
            role: 'system',
            content: 'You generate image assets for Life Kline / World Yi. Return only JSON with image_url or b64_json when available.',
          },
          {
            role: 'user',
            content: asset.prompt,
          },
        ],
        maxTokens: 1200,
        temperature: 0.2,
      });

      const content = completion.choices?.[0]?.message?.content?.trim() || '';
      return {
        raw: content,
        parsed: parseJson<Record<string, unknown>>(content, {}),
        provider: {
          id: provider.id,
          name: provider.name,
          source: provider.source,
          model: provider.model,
          baseUrl: provider.baseUrl,
        },
      };
    } catch (error) {
      lastError = error;
      console.warn(`[Visual Asset] image provider failed: ${provider.id} model=${provider.model}`, error instanceof Error ? error.message : error);
    }
  }

  throw lastError instanceof Error ? lastError : new Error('All image LLM providers failed');
}

export async function generateVisualAssetNarrative(asset: VisualAssetRecord) {
  const providers = resolveRuntimeLlmProviders('article');
  if (providers.length === 0) {
    throw new Error('No article LLM provider is configured');
  }

  let content = '';
  let lastError: unknown = null;
  for (const provider of providers) {
    const client = new OpenAI({
      apiKey: provider.apiKey,
      baseURL: provider.baseUrl,
      timeout: provider.timeoutMs,
      maxRetries: provider.maxRetries,
    });

    try {
      const completion = await createOpenAiCompatibleChatCompletion(client, {
        model: provider.model || getVisualAssetNarrativeModel(),
        messages: [
          {
            role: 'system',
            content: [
              '你为人生K线 / 世界易图片资产生成配套中文解读文章。',
              '输出严格 JSON：{"title":string,"excerpt":string,"sections":[{"heading":string,"body":string}]}。',
              '内容必须现代、克制、非恐吓、非决定论，并导向结构、时位、环境、动作、风险。',
            ].join('\n'),
          },
          {
            role: 'user',
            content: JSON.stringify({
              id: asset.id,
              title: asset.title,
              description: asset.description,
              prompt: asset.prompt,
              overlayCopySimplified: asset.overlayCopySimplified,
              overlayCopyTraditional: asset.overlayCopyTraditional,
              targetRoutes: asset.targetRoutes,
              relatedReportThemes: asset.relatedReportThemes,
              meta: asset.meta,
            }, null, 2),
          },
        ],
        maxTokens: 1200,
        temperature: 0.45,
        responseFormat: { type: 'json_object' },
      });
      content = completion.choices?.[0]?.message?.content?.trim() || '';
      if (content) break;
      lastError = new Error(`EMPTY_NARRATIVE:${provider.id}`);
    } catch (error) {
      lastError = error;
      console.warn(`[Visual Asset] narrative provider failed: ${provider.id} model=${provider.model}`, error instanceof Error ? error.message : error);
    }
  }
  if (!content && lastError) {
    throw lastError instanceof Error ? lastError : new Error('All article LLM providers failed');
  }
  const parsed = parseJson<{
    title?: string;
    excerpt?: string;
    sections?: Array<{ heading?: string; body?: string }>;
  }>(content, {});

  const generatedSections = Array.isArray(parsed.sections)
    ? parsed.sections
      .map((section) => ({
        heading: `${section.heading || ''}`.trim(),
        body: `${section.body || ''}`.trim(),
      }))
      .filter((section) => section.heading && section.body)
    : [];
  const fallback = buildFallbackVisualAssetNarrative(asset);
  const sections = generatedSections.length > 0 ? generatedSections : fallback.sections;

  return saveVisualAssetNarrative(asset.id, {
    title: `${parsed.title || fallback.title}`.trim(),
    excerpt: `${parsed.excerpt || fallback.excerpt}`.trim(),
    sections,
  });
}

export function updateVisualAssetNarrativeError(assetId: string, error: unknown) {
  const current = getVisualAssetById(assetId);
  if (!current) return null;
  const message = error instanceof Error ? error.message : String(error);

  db.prepare(`
    UPDATE visual_assets
    SET qa_notes = ?, latest_error_code = ?, updated_by = ?, updated_at = ?
    WHERE id = ?
  `).run(
    stringifyJson({
      ...(current.qaNotes || {}),
      narrativeError: message,
      narrativeErrorAt: new Date().toISOString(),
    }),
    'NARRATIVE_GENERATION_FAILED',
    'system_visual_assets_narrative',
    new Date().toISOString(),
    assetId
  );

  return getVisualAssetById(assetId);
}

export function createVisualAssetReview(assetId: string, params: {
  reviewType: string;
  status: string;
  score?: number;
  errorCodes?: string[];
  notes?: Record<string, unknown>;
  reviewer?: string;
}) {
  const id = `visual_review_${generateId()}`;
  db.prepare(`
    INSERT INTO visual_asset_reviews (
      id, asset_id, review_type, status, score, error_codes, notes, reviewer
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    assetId,
    params.reviewType,
    params.status,
    params.score || 0,
    stringifyJson(params.errorCodes || []),
    stringifyJson(params.notes || {}),
    params.reviewer || 'system_visual_assets'
  );
  return id;
}
