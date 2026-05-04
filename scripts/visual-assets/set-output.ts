import '../load-env';
import { updateVisualAssetStatus } from '@/lib/visual-assets';
import { db } from '@/lib/database';

function parseStringArg(name: string, fallback = '') {
  const prefix = `--${name}=`;
  const arg = process.argv.find((item) => item.startsWith(prefix));
  return arg ? arg.slice(prefix.length) : fallback;
}

function parseNumberArg(name: string) {
  const raw = parseStringArg(name);
  const value = Number(raw);
  return Number.isFinite(value) && value > 0 ? Math.round(value) : undefined;
}

function main() {
  const id = parseStringArg('id');
  const publicUrl = parseStringArg('public-url');
  const outputPath = parseStringArg('output-path');
  const version = parseNumberArg('version');
  if (!id || !publicUrl || !outputPath) {
    throw new Error('Missing --id, --public-url, or --output-path.');
  }

  const asset = updateVisualAssetStatus(id, {
    status: 'approved',
    qaStatus: 'approved',
    publicUrl,
    outputPath,
    latestErrorCode: null,
    updatedBy: 'visual_asset_set_output',
  });

  if (version) {
    db.prepare(`
      UPDATE visual_assets
      SET version = ?, updated_by = ?, updated_at = ?
      WHERE id = ?
    `).run(version, 'visual_asset_set_output', new Date().toISOString(), id);
  }

  console.log(JSON.stringify({
    updatedAt: new Date().toISOString(),
    asset: asset ? { id: asset.id, status: 'approved', qaStatus: 'approved', publicUrl, outputPath, version: version || asset.version } : null,
  }, null, 2));
}

try {
  main();
} catch (error) {
  console.error('[visual-assets:set-output] failed:', error);
  process.exit(1);
}
