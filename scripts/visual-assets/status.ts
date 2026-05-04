import '../load-env';
import { summarizeVisualAssetBatch } from '@/lib/visual-asset-orchestrator';

function parseBatchId() {
  const arg = process.argv.find((item) => item.startsWith('--batch='));
  return arg ? arg.slice('--batch='.length) : 'brand-pads-v1';
}

function parseLimit() {
  const arg = process.argv.find((item) => item.startsWith('--limit='));
  const value = arg ? Number(arg.slice('--limit='.length)) : 500;
  return Number.isFinite(value) && value > 0 ? Math.round(value) : 500;
}

console.log(JSON.stringify({
  generatedAt: new Date().toISOString(),
  ...summarizeVisualAssetBatch(parseBatchId(), parseLimit()),
}, null, 2));
