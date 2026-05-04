import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import {
  buildFallbackVisualAssetNarrative,
  createVisualAssetCorrection,
  generateVisualAssetNarrative,
  importVisualAssetManifest,
  listVisualAssets,
  requestVisualAssetImage,
  runVisualAssetAutoQa,
  saveVisualAssetNarrative,
  updateVisualAssetNarrativeError,
  updateVisualAssetStatus,
  type VisualAssetManifest,
  type VisualAssetRecord,
  type VisualAssetStatus,
} from '@/lib/visual-assets';
import {
  DEFAULT_VISUAL_ASSET_WORKFLOW_PATH,
  loadVisualAssetWorkflow,
  type VisualAssetWorkflow,
} from '@/lib/visual-asset-workflow';
export { loadVisualAssetWorkflow } from '@/lib/visual-asset-workflow';

export type VisualAssetRunOptions = {
  manifestPath: string;
  workflowPath?: string;
  batchId?: string;
  assetIds?: string[];
  limit?: number;
  reset?: boolean;
  stages?: Array<'import' | 'images' | 'narratives' | 'snapshot'>;
};

export type VisualAssetRunEvent = {
  at: string;
  stage: string;
  event: string;
  assetId?: string;
  status?: string;
  error?: string;
  meta?: Record<string, unknown>;
};

export type VisualAssetRunResult = {
  workflowId: string;
  manifestPath: string;
  batchId: string;
  startedAt: string;
  completedAt: string;
  events: VisualAssetRunEvent[];
  summary: ReturnType<typeof summarizeVisualAssetBatch>;
};

type VisualAssetJobResult = {
  id: string;
  title: string;
  status?: string;
  publicUrl?: string | null;
  error?: string;
  fallback?: boolean;
};

function nowIso() {
  return new Date().toISOString();
}

function readManifest(filePath: string): VisualAssetManifest {
  const absolutePath = path.resolve(process.cwd(), filePath);
  return JSON.parse(fs.readFileSync(absolutePath, 'utf8')) as VisualAssetManifest;
}

function createEventRecorder() {
  const events: VisualAssetRunEvent[] = [];
  return {
    events,
    push(event: Omit<VisualAssetRunEvent, 'at'>) {
      events.push({ at: nowIso(), ...event });
    },
  };
}

function shouldRunStage(options: VisualAssetRunOptions, stage: 'import' | 'images' | 'narratives' | 'snapshot') {
  return !options.stages?.length || options.stages.includes(stage);
}

function clampLimit(value: number | undefined, fallback: number) {
  return Number.isFinite(value) && Number(value) > 0 ? Math.round(Number(value)) : fallback;
}

function filterAssetsByIds(assets: VisualAssetRecord[], assetIds?: string[]) {
  const ids = new Set((assetIds || []).map((id) => id.trim()).filter(Boolean));
  if (ids.size === 0) return assets;
  return assets.filter((asset) => ids.has(asset.id));
}

export async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  handler: (item: T, index: number) => Promise<R>
) {
  const results: R[] = [];
  let nextIndex = 0;
  const workerCount = Math.min(Math.max(concurrency, 1), items.length || 1);

  async function worker() {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex;
      nextIndex += 1;
      results[currentIndex] = await handler(items[currentIndex], currentIndex);
    }
  }

  await Promise.all(Array.from({ length: workerCount }, () => worker()));
  return results;
}

function isAuthError(message: string) {
  return /\b(401|403)\b|invalid token|unauthorized|forbidden|invalid api key/i.test(message);
}

export function readImageUrlFromProviderResponse(parsed: Record<string, unknown>, raw = '') {
  const direct = typeof parsed.image_url === 'string' ? parsed.image_url : '';
  if (direct) return direct;

  const data = Array.isArray(parsed.data) ? parsed.data : [];
  for (const item of data) {
    if (item && typeof item === 'object' && typeof (item as any).url === 'string') {
      return (item as any).url as string;
    }
    if (item && typeof item === 'object' && typeof (item as any).image_url === 'string') {
      return (item as any).image_url as string;
    }
  }

  const markdownImage = raw.match(/!\[[^\]]*]\((https?:\/\/[^)\s]+)\)/i);
  if (markdownImage?.[1]) return markdownImage[1];

  const firstUrl = raw.match(/https?:\/\/[^\s)"'<>]+/i);
  if (firstUrl?.[0]) return firstUrl[0];

  return '';
}

function normalizeBase64ImagePayload(payload: string) {
  const dataUrl = payload.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,([\s\S]+)$/);
  if (dataUrl?.[2]) {
    return {
      b64Json: dataUrl[2].replace(/\s+/g, ''),
      contentType: dataUrl[1],
    };
  }

  return {
    b64Json: payload.replace(/\s+/g, ''),
    contentType: 'image/png',
  };
}

export function readImageBase64FromProviderResponse(parsed: Record<string, unknown>, raw = '') {
  const readPayload = (value: unknown) => (typeof value === 'string' && value.trim() ? value.trim() : '');
  const direct = readPayload(parsed.b64_json) || readPayload(parsed.image_base64) || readPayload(parsed.base64);
  if (direct) {
    return normalizeBase64ImagePayload(direct);
  }

  const data = Array.isArray(parsed.data) ? parsed.data : [];
  for (const item of data) {
    if (!item || typeof item !== 'object') continue;
    const payload = readPayload((item as any).b64_json) || readPayload((item as any).image_base64) || readPayload((item as any).base64);
    if (payload) {
      return normalizeBase64ImagePayload(payload);
    }
  }

  const dataUrl = raw.match(/data:(image\/[a-zA-Z0-9.+-]+);base64,([a-zA-Z0-9+/=\s]+)/);
  if (dataUrl?.[2]) {
    return {
      b64Json: dataUrl[2].replace(/\s+/g, ''),
      contentType: dataUrl[1],
    };
  }

  return null;
}

function inferImageExtension(contentType: string, url = '') {
  if (contentType.includes('image/png')) return 'png';
  if (contentType.includes('image/jpeg') || contentType.includes('image/jpg')) return 'jpg';
  if (contentType.includes('image/webp')) return 'webp';

  try {
    const pathname = new URL(url).pathname;
    const ext = path.extname(pathname).replace('.', '').toLowerCase();
    return ['png', 'jpg', 'jpeg', 'webp'].includes(ext) ? (ext === 'jpeg' ? 'jpg' : ext) : 'png';
  } catch {
    return 'png';
  }
}

async function writeVisualAssetImageBufferToServer(
  workflow: VisualAssetWorkflow,
  asset: VisualAssetRecord,
  buffer: Buffer,
  contentType: string,
  sourceUrl = ''
) {
  const ext = inferImageExtension(contentType.toLowerCase(), sourceUrl);
  let metadata: { width?: number; height?: number; format?: string } = {};
  try {
    const sharp = (await import('sharp')).default;
    const imageMetadata = await sharp(buffer).metadata();
    metadata = {
      width: imageMetadata.width,
      height: imageMetadata.height,
      format: imageMetadata.format,
    };
  } catch {
    metadata = {};
  }
  const batchId = asset.batchId || 'unbatched';
  const filename = `${asset.slug || asset.id}-v${asset.version || 1}.${ext}`;
  const relativePath = path.posix.join(workflow.storage.localPublicRoot.replace(/^public\/?/, ''), batchId, filename);
  const outputPath = path.join(process.cwd(), 'public', relativePath);

  await fsp.mkdir(path.dirname(outputPath), { recursive: true });
  await fsp.writeFile(outputPath, buffer);

  return {
    outputPath,
    publicUrl: `/${relativePath}`,
    bytes: buffer.length,
    contentType,
    width: metadata.width || null,
    height: metadata.height || null,
    format: metadata.format || null,
  };
}

export async function saveVisualAssetImageToServer(
  workflow: VisualAssetWorkflow,
  asset: VisualAssetRecord,
  imageUrl: string
) {
  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error(`IMAGE_DOWNLOAD_FAILED ${response.status} ${response.statusText}`.trim());
  }

  const contentType = response.headers.get('content-type') || '';
  if (contentType && !contentType.toLowerCase().startsWith('image/')) {
    throw new Error(`IMAGE_DOWNLOAD_INVALID_CONTENT_TYPE ${contentType}`);
  }

  return writeVisualAssetImageBufferToServer(
    workflow,
    asset,
    Buffer.from(await response.arrayBuffer()),
    contentType || 'image/png',
    imageUrl
  );
}

export async function saveVisualAssetBase64ImageToServer(
  workflow: VisualAssetWorkflow,
  asset: VisualAssetRecord,
  payload: { b64Json: string; contentType?: string }
) {
  if (!payload.b64Json) {
    throw new Error('IMAGE_BASE64_EMPTY');
  }

  return writeVisualAssetImageBufferToServer(
    workflow,
    asset,
    Buffer.from(payload.b64Json, 'base64'),
    payload.contentType || 'image/png'
  );
}

async function sleep(ms: number) {
  if (ms <= 0) return;
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function withRetry<T>(
  workflow: VisualAssetWorkflow,
  operation: () => Promise<T>,
  onFailedAttempt?: (attempt: number, error: unknown, nextDelayMs: number) => void
) {
  let lastError: unknown;
  const maxAttempts = Math.max(workflow.runtime.maxAttempts, 1);

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (attempt >= maxAttempts) break;
      const nextDelayMs = Math.min(
        workflow.runtime.retryMaxDelayMs,
        workflow.runtime.retryBaseDelayMs * 2 ** (attempt - 1)
      );
      onFailedAttempt?.(attempt, error, nextDelayMs);
      await sleep(nextDelayMs);
    }
  }

  throw lastError;
}

export async function generateVisualAssetImageWithWorkflow(
  workflow: VisualAssetWorkflow,
  asset: VisualAssetRecord,
  recordEvent?: (event: Omit<VisualAssetRunEvent, 'at'>) => void
): Promise<VisualAssetJobResult> {
  updateVisualAssetStatus(asset.id, {
    status: 'generating',
    updatedBy: 'visual_asset_orchestrator',
  });

  try {
    return await withRetry(
      workflow,
      async () => {
        const response = await requestVisualAssetImage(asset);
        const providerImageUrl = readImageUrlFromProviderResponse(response.parsed, response.raw);
        const providerImageBase64 = providerImageUrl
          ? null
          : readImageBase64FromProviderResponse(response.parsed, response.raw);
        const stored = providerImageUrl
          ? await saveVisualAssetImageToServer(workflow, asset, providerImageUrl)
          : providerImageBase64
            ? await saveVisualAssetBase64ImageToServer(workflow, asset, providerImageBase64)
          : null;
        const generated = updateVisualAssetStatus(asset.id, {
          status: stored ? 'generated' : 'needs_review',
          qaStatus: stored ? 'needs_review' : 'needs_review',
          outputPath: stored?.outputPath,
          publicUrl: stored?.publicUrl,
          latestErrorCode: stored ? null : 'PROVIDER_RESPONSE_MISSING_IMAGE_URL',
          qaNotes: {
            providerResponse: response.parsed,
            providerImageUrl,
            providerReturnedBase64: Boolean(providerImageBase64),
            localImage: stored,
            raw: response.raw.slice(0, 4000),
            workflowId: workflow.id,
          },
          updatedBy: 'visual_asset_orchestrator',
        });
        const checked = generated && stored
          ? runVisualAssetAutoQa(generated, {
            workflowId: workflow.id,
            providerImageUrl,
            providerReturnedBase64: Boolean(providerImageBase64),
            storageBytes: stored.bytes,
            actualImageWidth: stored.width || undefined,
            actualImageHeight: stored.height || undefined,
            contentType: stored.contentType,
          }).updated
          : generated;

        return {
          id: asset.id,
          title: asset.title,
          status: checked?.status,
          publicUrl: checked?.publicUrl,
        };
      },
      (attempt, error, nextDelayMs) => {
        recordEvent?.({
          stage: 'images',
          event: 'retry_scheduled',
          assetId: asset.id,
          error: error instanceof Error ? error.message : String(error),
          meta: { attempt, nextDelayMs },
        });
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const authError = isAuthError(message);
    if (!authError) {
      createVisualAssetCorrection(asset.id, {
        errorCodes: ['PROVIDER_REQUEST_FAILED'],
        originalPrompt: asset.prompt,
        correctedPrompt: [
          asset.prompt,
          '',
          'Correction requirements:',
          '- Provider request failed before a usable image was stored.',
          '- Preserve all required in-image text, brand signature, and educational diagram structure.',
          '- Keep the generated text readable and compact.',
          '- Avoid deterministic or fear-based claims.',
        ].join('\n'),
        originalOutputPath: asset.outputPath,
        status: 'planned',
        createdBy: 'visual_asset_orchestrator',
      });
    }
    updateVisualAssetStatus(asset.id, {
      status: authError ? 'prompt_ready' : 'needs_correction',
      qaStatus: authError ? 'pending' : 'needs_correction',
      latestErrorCode: authError ? 'PROVIDER_AUTH_FAILED' : 'PROVIDER_REQUEST_FAILED',
      qaNotes: { error: message, workflowId: workflow.id },
      updatedBy: 'visual_asset_orchestrator',
    });
    return {
      id: asset.id,
      title: asset.title,
      error: message,
    };
  }
}

export async function generateVisualAssetNarrativeWithWorkflow(
  workflow: VisualAssetWorkflow,
  asset: VisualAssetRecord,
  recordEvent?: (event: Omit<VisualAssetRunEvent, 'at'>) => void
): Promise<VisualAssetJobResult> {
  try {
    const updated = await withRetry(
      workflow,
      () => generateVisualAssetNarrative(asset),
      (attempt, error, nextDelayMs) => {
        recordEvent?.({
          stage: 'narratives',
          event: 'retry_scheduled',
          assetId: asset.id,
          error: error instanceof Error ? error.message : String(error),
          meta: { attempt, nextDelayMs },
        });
      }
    );

    return {
      id: asset.id,
      title: updated?.narrativeTitle || asset.title,
      status: updated?.status,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    updateVisualAssetNarrativeError(asset.id, error);
    const fallback = buildFallbackVisualAssetNarrative(asset);
    saveVisualAssetNarrative(asset.id, {
      ...fallback,
      updatedBy: 'visual_asset_orchestrator_narrative_fallback',
    });
    return {
      id: asset.id,
      title: fallback.title,
      fallback: true,
      error: message,
    };
  }
}

export function summarizeVisualAssetBatch(batchId: string, limit = 500) {
  const assets = listVisualAssets({ batchId, limit });
  const countBy = (selector: (asset: VisualAssetRecord) => string | null | undefined) => (
    assets.reduce<Record<string, number>>((acc, asset) => {
      const key = selector(asset) || 'none';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {})
  );

  return {
    batchId,
    count: assets.length,
    status: countBy((asset) => asset.status),
    qaStatus: countBy((asset) => asset.qaStatus),
    latestErrors: countBy((asset) => asset.latestErrorCode),
    generatedImages: assets.filter((asset) => Boolean(asset.publicUrl)).length,
    localImages: assets.filter((asset) => Boolean(asset.outputPath)).length,
    narrativesComplete: assets.filter((asset) => asset.narrativeSections.length > 0).length,
    items: assets.map((asset) => ({
      id: asset.id,
      title: asset.title,
      status: asset.status,
      qaStatus: asset.qaStatus,
      publicUrl: asset.publicUrl,
      outputPath: asset.outputPath,
      narrativeSections: asset.narrativeSections.length,
      latestErrorCode: asset.latestErrorCode,
    })),
  };
}

export async function runVisualAssetWorkflow(options: VisualAssetRunOptions): Promise<VisualAssetRunResult> {
  const workflow = loadVisualAssetWorkflow(options.workflowPath || DEFAULT_VISUAL_ASSET_WORKFLOW_PATH);
  const recorder = createEventRecorder();
  const startedAt = nowIso();
  const manifest = readManifest(options.manifestPath);
  const batchId = options.batchId || manifest.batch.id;

  recorder.push({
    stage: 'workflow',
    event: 'started',
    meta: {
      workflowId: workflow.id,
      manifestPath: options.manifestPath,
      batchId,
    },
  });

  if (workflow.stages.importManifest && shouldRunStage(options, 'import')) {
    const imported = importVisualAssetManifest(manifest, {
      manifestPath: options.manifestPath,
      createdBy: 'visual_asset_orchestrator',
    });
    recorder.push({
      stage: 'import',
      event: 'completed',
      meta: { importedCount: imported.importedCount },
    });
  }

  if (options.reset) {
    const assets = filterAssetsByIds(
      listVisualAssets({ batchId, limit: Math.max(manifest.assets.length || 50, clampLimit(options.limit, manifest.assets.length || 50)) }),
      options.assetIds
    ).slice(0, clampLimit(options.limit, manifest.assets.length || 50));
    for (const asset of assets) {
      updateVisualAssetStatus(asset.id, {
        status: 'prompt_ready',
        qaStatus: 'pending',
        publicUrl: '',
        outputPath: '',
        latestErrorCode: null,
        qaNotes: {
          resetBy: 'visual_asset_orchestrator',
          resetAt: nowIso(),
          previousPublicUrl: asset.publicUrl,
          previousOutputPath: asset.outputPath,
        },
        updatedBy: 'visual_asset_orchestrator_reset',
      });
    }
    recorder.push({
      stage: 'workflow',
      event: 'reset_completed',
      meta: { resetCount: assets.length },
    });
  }

  if (workflow.stages.generateImages && shouldRunStage(options, 'images')) {
    const assets = filterAssetsByIds(
      listVisualAssets({
        batchId,
        status: 'prompt_ready' as VisualAssetStatus,
        limit: Math.max(manifest.assets.length || 50, clampLimit(options.limit, manifest.assets.length || 50)),
      }),
      options.assetIds
    ).slice(0, clampLimit(options.limit, manifest.assets.length || 50));
    recorder.push({
      stage: 'images',
      event: 'started',
      meta: { count: assets.length, concurrency: workflow.runtime.maxConcurrentImageJobs },
    });
    const results = await mapWithConcurrency(
      assets,
      workflow.runtime.maxConcurrentImageJobs,
      async (asset) => {
        const result = await generateVisualAssetImageWithWorkflow(workflow, asset, recorder.push);
        recorder.push({
          stage: 'images',
          event: result.error ? 'asset_failed' : 'asset_completed',
          assetId: asset.id,
          status: result.status,
          error: result.error,
          meta: { publicUrl: result.publicUrl },
        });
        return result;
      }
    );
    recorder.push({
      stage: 'images',
      event: 'completed',
      meta: {
        count: results.length,
        failed: results.filter((result) => result.error).length,
      },
    });
  }

  if (workflow.stages.generateNarratives && shouldRunStage(options, 'narratives')) {
    const assets = listVisualAssets({
      batchId,
      limit: Math.max(manifest.assets.length || 50, clampLimit(options.limit, manifest.assets.length || 50)),
    })
      .filter((asset) => !options.assetIds?.length || options.assetIds.includes(asset.id))
      .filter((asset) => (asset.publicUrl || asset.outputPath) && (!asset.narrativeTitle || asset.narrativeSections.length === 0))
      .slice(0, clampLimit(options.limit, manifest.assets.length || 50));
    recorder.push({
      stage: 'narratives',
      event: 'started',
      meta: { count: assets.length, concurrency: workflow.runtime.maxConcurrentNarrativeJobs },
    });
    const results = await mapWithConcurrency(
      assets,
      workflow.runtime.maxConcurrentNarrativeJobs,
      async (asset) => {
        const result = await generateVisualAssetNarrativeWithWorkflow(workflow, asset, recorder.push);
        recorder.push({
          stage: 'narratives',
          event: result.error ? 'asset_failed_with_fallback' : 'asset_completed',
          assetId: asset.id,
          error: result.error,
          meta: { fallback: result.fallback || false },
        });
        return result;
      }
    );
    recorder.push({
      stage: 'narratives',
      event: 'completed',
      meta: {
        count: results.length,
        fallback: results.filter((result) => result.fallback).length,
      },
    });
  }

  const summary = summarizeVisualAssetBatch(batchId);
  recorder.push({
    stage: 'snapshot',
    event: 'completed',
    meta: summary,
  });

  return {
    workflowId: workflow.id,
    manifestPath: options.manifestPath,
    batchId,
    startedAt,
    completedAt: nowIso(),
    events: recorder.events,
    summary,
  };
}
