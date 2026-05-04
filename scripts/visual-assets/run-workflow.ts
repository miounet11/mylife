import '../load-env';
import { runVisualAssetWorkflow } from '@/lib/visual-asset-orchestrator';

function parseStringArg(name: string, fallback = '') {
  const prefix = `--${name}=`;
  const arg = process.argv.find((item) => item.startsWith(prefix));
  return arg ? arg.slice(prefix.length) : fallback;
}

function parseLimit() {
  const raw = parseStringArg('limit');
  const value = raw ? Number(raw) : undefined;
  return Number.isFinite(value) && Number(value) > 0 ? Math.round(Number(value)) : undefined;
}

function parseBooleanFlag(name: string) {
  return process.argv.includes(`--${name}`);
}

function parseStages() {
  const raw = parseStringArg('stages');
  if (!raw) return undefined;
  const allowed = new Set(['import', 'images', 'narratives', 'snapshot']);
  const stages = raw.split(',').map((item) => item.trim()).filter((item) => allowed.has(item));
  return stages.length ? stages as Array<'import' | 'images' | 'narratives' | 'snapshot'> : undefined;
}

function parseAssetIds() {
  const raw = parseStringArg('ids');
  return raw ? raw.split(',').map((item) => item.trim()).filter(Boolean) : undefined;
}

async function main() {
  const result = await runVisualAssetWorkflow({
    manifestPath: parseStringArg('manifest', 'data/visual-assets/manifests/brand-pads-v1.json'),
    workflowPath: parseStringArg('workflow') || undefined,
    batchId: parseStringArg('batch') || undefined,
    assetIds: parseAssetIds(),
    limit: parseLimit(),
    reset: parseBooleanFlag('reset'),
    stages: parseStages(),
  });

  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error('[visual-assets:run-workflow] failed:', error);
  process.exit(1);
});
