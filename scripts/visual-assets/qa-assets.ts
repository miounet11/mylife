import '../load-env';
import fs from 'node:fs';
import sharp from 'sharp';
import { loadVisualAssetWorkflow } from '@/lib/visual-asset-workflow';
import {
  listVisualAssets,
  runVisualAssetAutoQa,
  type VisualAssetStatus,
} from '@/lib/visual-assets';

function parseStringArg(name: string, fallback = '') {
  const prefix = `--${name}=`;
  const arg = process.argv.find((item) => item.startsWith(prefix));
  return arg ? arg.slice(prefix.length) : fallback;
}

function parseLimit() {
  const raw = parseStringArg('limit', '200');
  const value = Number(raw);
  return Number.isFinite(value) && value > 0 ? Math.round(value) : 200;
}

function parseStatus(): VisualAssetStatus | undefined {
  const raw = parseStringArg('status');
  return raw ? raw as VisualAssetStatus : undefined;
}

async function getLocalImageMeta(outputPath?: string | null) {
  if (!outputPath || !fs.existsSync(outputPath)) {
    return {
      exists: false,
      bytes: 0,
      width: undefined,
      height: undefined,
      contentType: undefined,
    };
  }

  const stat = fs.statSync(outputPath);
  const metadata = await sharp(outputPath).metadata();
  const format = metadata.format || 'png';
  return {
    exists: true,
    bytes: stat.size,
    width: metadata.width,
    height: metadata.height,
    contentType: `image/${format === 'jpg' ? 'jpeg' : format}`,
  };
}

async function main() {
  const batchId = parseStringArg('batch', 'brand-pads-v1');
  const workflow = loadVisualAssetWorkflow(parseStringArg('workflow') || undefined);
  const assets = listVisualAssets({
    batchId,
    status: parseStatus(),
    limit: parseLimit(),
  }).filter((asset) => asset.outputPath || asset.publicUrl);

  const results = [];
  for (const asset of assets) {
    const meta = await getLocalImageMeta(asset.outputPath);
    const qa = runVisualAssetAutoQa(asset, {
      workflowId: workflow.id,
      providerImageUrl: typeof asset.qaNotes.providerImageUrl === 'string' ? asset.qaNotes.providerImageUrl : undefined,
      providerReturnedBase64: Boolean(asset.qaNotes.providerReturnedBase64),
      storageBytes: meta.bytes,
      actualImageWidth: meta.width,
      actualImageHeight: meta.height,
      contentType: meta.contentType,
    });
    results.push({
      id: asset.id,
      title: asset.title,
      outputPath: asset.outputPath,
      image: meta,
      status: qa.status,
      score: qa.score,
      errorCodes: qa.errorCodes,
      warnings: qa.warnings,
    });
  }

  console.log(JSON.stringify({
    generatedAt: new Date().toISOString(),
    batchId,
    count: results.length,
    results,
  }, null, 2));
}

main().catch((error) => {
  console.error('[visual-assets:qa-assets] failed:', error);
  process.exit(1);
});
