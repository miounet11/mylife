import '../load-env';
import {
  listVisualAssets,
  type VisualAssetStatus,
} from '@/lib/visual-assets';
import {
  generateVisualAssetNarrativeWithWorkflow,
  loadVisualAssetWorkflow,
  mapWithConcurrency,
} from '@/lib/visual-asset-orchestrator';

function parseLimit() {
  const arg = process.argv.find((item) => item.startsWith('--limit='));
  const value = arg ? Number(arg.slice('--limit='.length)) : 10;
  return Number.isFinite(value) && value > 0 ? Math.min(Math.round(value), 50) : 10;
}

function parseStatus(): VisualAssetStatus | undefined {
  const arg = process.argv.find((item) => item.startsWith('--status='));
  return arg ? (arg.slice('--status='.length) as VisualAssetStatus) : undefined;
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
  }).filter((asset) => (asset.publicUrl || asset.outputPath) && (!asset.narrativeTitle || asset.narrativeSections.length === 0));

  const results = await mapWithConcurrency(
    assets,
    workflow.runtime.maxConcurrentNarrativeJobs,
    (asset) => generateVisualAssetNarrativeWithWorkflow(workflow, asset)
  );

  console.log(JSON.stringify({
    generatedAt: new Date().toISOString(),
    requestedCount: assets.length,
    concurrency: workflow.runtime.maxConcurrentNarrativeJobs,
    results,
  }, null, 2));
}

main().catch((error) => {
  console.error('[visual-assets:narratives] failed:', error);
  process.exit(1);
});
