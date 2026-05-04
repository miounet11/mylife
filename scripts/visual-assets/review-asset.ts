import '../load-env';
import {
  reviewVisualAsset,
  type VisualAssetManualReviewStatus,
} from '@/lib/visual-assets';

function parseStringArg(name: string, fallback = '') {
  const prefix = `--${name}=`;
  const arg = process.argv.find((item) => item.startsWith(prefix));
  return arg ? arg.slice(prefix.length) : fallback;
}

function parseBooleanFlag(name: string) {
  return process.argv.includes(`--${name}`);
}

function parseErrorCodes() {
  return parseStringArg('errors')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseScore() {
  const raw = parseStringArg('score');
  const score = Number(raw);
  return Number.isFinite(score) ? Math.max(0, Math.min(100, Math.round(score))) : undefined;
}

function parseStatus(): VisualAssetManualReviewStatus {
  const raw = parseStringArg('status', 'needs_review');
  if (['approved', 'needs_review', 'needs_correction', 'rejected'].includes(raw)) {
    return raw as VisualAssetManualReviewStatus;
  }
  throw new Error(`Invalid --status=${raw}. Use approved, needs_review, needs_correction, rejected.`);
}

function main() {
  const id = parseStringArg('id');
  if (!id) {
    throw new Error('Missing --id=ASSET_ID');
  }

  const result = reviewVisualAsset(id, {
    status: parseStatus(),
    score: parseScore(),
    errorCodes: parseErrorCodes(),
    notes: {
      note: parseStringArg('note'),
      source: 'scripts/visual-assets/review-asset.ts',
    },
    reviewer: parseStringArg('reviewer', 'manual_visual_reviewer'),
    correctedPrompt: parseStringArg('prompt'),
    queueCorrection: parseBooleanFlag('queue-correction'),
  });

  if (!result) {
    throw new Error(`Visual asset not found: ${id}`);
  }

  console.log(JSON.stringify({
    reviewedAt: new Date().toISOString(),
    id,
    result,
  }, null, 2));
}

try {
  main();
} catch (error) {
  console.error('[visual-assets:review-asset] failed:', error);
  process.exit(1);
}
