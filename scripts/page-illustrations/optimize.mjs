#!/usr/bin/env node
/**
 * Optimize raw illustrations → webp under public/images/page-illustrations/
 * Usage: node scripts/page-illustrations/optimize.mjs [--in dir] [--out dir]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../..');
const inDir = process.argv.includes('--in')
  ? path.resolve(process.argv[process.argv.indexOf('--in') + 1])
  : path.join(root, 'public/images/page-illustrations/raw');
const outDir = process.argv.includes('--out')
  ? path.resolve(process.argv[process.argv.indexOf('--out') + 1])
  : path.join(root, 'public/images/page-illustrations');

fs.mkdirSync(outDir, { recursive: true });

async function main() {
  let sharp;
  try {
    sharp = (await import('sharp')).default;
  } catch {
    console.error('sharp not installed; copy raw files as-is (png/jpg). npm i -D sharp');
    if (!fs.existsSync(inDir)) {
      console.log('no raw dir', inDir);
      return;
    }
    for (const name of fs.readdirSync(inDir)) {
      const src = path.join(inDir, name);
      if (!fs.statSync(src).isFile()) continue;
      fs.copyFileSync(src, path.join(outDir, name));
      console.log('copied', name);
    }
    return;
  }

  if (!fs.existsSync(inDir)) {
    console.log('no raw dir', inDir);
    return;
  }

  for (const name of fs.readdirSync(inDir)) {
    const src = path.join(inDir, name);
    if (!fs.statSync(src).isFile()) continue;
    if (!/\.(png|jpe?g|webp)$/i.test(name)) continue;
    const base = name.replace(/\.[^.]+$/, '');
    const dest = path.join(outDir, `${base}.webp`);
    await sharp(src)
      .resize({ width: 1600, withoutEnlargement: true })
      .webp({ quality: 82 })
      .toFile(dest);
    console.log('webp', path.basename(dest));
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
