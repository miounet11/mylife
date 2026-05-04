import '../load-env';
import { getVisualAssetConcurrencyLimit } from '@/lib/env';
import {
  listVisualAssets,
  type VisualAssetStatus,
} from '@/lib/visual-assets';
import {
  generateVisualAssetImageWithWorkflow,
  loadVisualAssetWorkflow,
  mapWithConcurrency,
} from '@/lib/visual-asset-orchestrator';

function parseLimit() {
  const arg = process.argv.find((item) => item.startsWith('--limit='));
  const value = arg ? Number(arg.slice('--limit='.length)) : 3;
  return Number.isFinite(value) && value > 0 ? Math.min(Math.round(value), 20) : 3;
}

function parseStatus(): VisualAssetStatus | undefined {
  const arg = process.argv.find((item) => item.startsWith('--status='));
  return arg ? (arg.slice('--status='.length) as VisualAssetStatus) : 'prompt_ready';
}

function parseBatchId() {
  const arg = process.argv.find((item) => item.startsWith('--batch='));
  return arg ? arg.slice('--batch='.length) : undefined;
}

async function main() {
  const workflow = loadVisualAssetWorkflow();
  const assets = listVisualAssets({
    limit: parseLimit(),
    status: parseStatus(),
    batchId: parseBatchId(),
  });

  const concurrency = Math.min(getVisualAssetConcurrencyLimit(), workflow.runtime.maxConcurrentImageJobs);
  const results = await mapWithConcurrency(
    assets,
    concurrency,
    (asset) => generateVisualAssetImageWithWorkflow(workflow, asset)
  );

  console.log(JSON.stringify({
    generatedAt: new Date().toISOString(),
    requestedCount: assets.length,
    concurrency,
    results,
  }, null, 2));
}

main().catch((error) => {
  console.error('[visual-assets:request-images] failed:', error);
  process.exit(1);
});
