import '../load-env';
import fs from 'node:fs';
import { reviewVisualAsset, type VisualAssetManualReviewStatus } from '@/lib/visual-assets';

type ReviewItem = {
  id: string;
  status: VisualAssetManualReviewStatus;
  score?: number;
  errors?: string[];
  note?: string;
  reviewer?: string;
  prompt?: string;
  queueCorrection?: boolean;
};

function parseStringArg(name: string, fallback = '') {
  const prefix = `--${name}=`;
  const arg = process.argv.find((item) => item.startsWith(prefix));
  return arg ? arg.slice(prefix.length) : fallback;
}

function readReviewItems(filePath: string): ReviewItem[] {
  const raw = JSON.parse(fs.readFileSync(filePath, 'utf8')) as unknown;
  if (!Array.isArray(raw)) {
    throw new Error('Review file must be a JSON array.');
  }
  return raw as ReviewItem[];
}

function main() {
  const filePath = parseStringArg('file');
  if (!filePath) {
    throw new Error('Missing --file=reviews.json');
  }

  const results = readReviewItems(filePath).map((item) => {
    if (!item.id) {
      throw new Error('Review item is missing id.');
    }
    const result = reviewVisualAsset(item.id, {
      status: item.status,
      score: item.score,
      errorCodes: item.errors || [],
      notes: {
        note: item.note || '',
        source: filePath,
      },
      reviewer: item.reviewer || 'manual_visual_reviewer',
      correctedPrompt: item.prompt,
      queueCorrection: Boolean(item.queueCorrection),
    });
    if (!result) {
      throw new Error(`Visual asset not found: ${item.id}`);
    }
    return {
      id: item.id,
      status: item.status,
      reviewId: result.reviewId,
      correction: result.correction,
      assetStatus: result.asset?.status,
      qaStatus: result.asset?.qaStatus,
      version: result.asset?.version,
      publicUrl: result.asset?.publicUrl,
      latestErrorCode: result.asset?.latestErrorCode,
    };
  });

  console.log(JSON.stringify({
    reviewedAt: new Date().toISOString(),
    count: results.length,
    results,
  }, null, 2));
}

try {
  main();
} catch (error) {
  console.error('[visual-assets:review-batch] failed:', error);
  process.exit(1);
}
