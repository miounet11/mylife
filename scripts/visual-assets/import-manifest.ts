import '../load-env';
import fs from 'fs';
import path from 'path';
import { importVisualAssetManifest, type VisualAssetManifest } from '@/lib/visual-assets';

function parseManifestPath() {
  const arg = process.argv.find((item) => item.startsWith('--manifest='));
  return arg ? arg.slice('--manifest='.length) : 'data/visual-assets/manifests/brand-pads-v1.json';
}

function readManifest(filePath: string): VisualAssetManifest {
  const absolutePath = path.resolve(process.cwd(), filePath);
  const raw = fs.readFileSync(absolutePath, 'utf8');
  return JSON.parse(raw) as VisualAssetManifest;
}

function main() {
  const manifestPath = parseManifestPath();
  const manifest = readManifest(manifestPath);
  const result = importVisualAssetManifest(manifest, {
    manifestPath,
    createdBy: 'script_visual_assets_import',
  });

  console.log(JSON.stringify({
    importedAt: new Date().toISOString(),
    manifestPath,
    batchId: result.batchId,
    importedCount: result.importedCount,
    assets: result.assets.map((asset) => ({
      id: asset.id,
      title: asset.title,
      model: asset.model,
      status: asset.status,
      qaStatus: asset.qaStatus,
    })),
  }, null, 2));
}

main();
