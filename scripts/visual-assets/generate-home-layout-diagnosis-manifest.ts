import '../load-env';
import fs from 'fs';
import path from 'path';
import {
  HOME_LAYOUT_DIAGNOSIS_VISUAL_BATCH_ID,
  buildHomeLayoutDiagnosisVisualManifest,
} from '@/lib/home-layout-diagnosis-visual-assets';

function parseOutPath() {
  const arg = process.argv.find((item) => item.startsWith('--out='));
  return arg
    ? arg.slice('--out='.length)
    : `data/visual-assets/manifests/${HOME_LAYOUT_DIAGNOSIS_VISUAL_BATCH_ID}.json`;
}

function main() {
  const outPath = parseOutPath();
  const absoluteOutPath = path.resolve(process.cwd(), outPath);
  const manifest = buildHomeLayoutDiagnosisVisualManifest();

  fs.mkdirSync(path.dirname(absoluteOutPath), { recursive: true });
  fs.writeFileSync(absoluteOutPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

  console.log(JSON.stringify({
    generatedAt: new Date().toISOString(),
    outPath,
    batchId: manifest.batch.id,
    targetCount: manifest.batch.targetCount,
    assetCount: manifest.assets.length,
    ratios: Array.from(new Set(manifest.assets.map((asset) => asset.ratio))),
  }, null, 2));
}

main();
