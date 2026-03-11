const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawnSync } = require('child_process');

const projectRoot = process.cwd();
const nextStaticDir = path.join(projectRoot, '.next', 'static');
const backupRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'lifekline-static-'));
const backupStaticDir = path.join(backupRoot, 'static');

function copyDirectory(source, target) {
  fs.mkdirSync(target, { recursive: true });

  for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
    const sourcePath = path.join(source, entry.name);
    const targetPath = path.join(target, entry.name);

    if (entry.isDirectory()) {
      copyDirectory(sourcePath, targetPath);
      continue;
    }

    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    fs.copyFileSync(sourcePath, targetPath);
  }
}

function mergeMissingFiles(source, target) {
  if (!fs.existsSync(source)) return;
  fs.mkdirSync(target, { recursive: true });

  for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
    const sourcePath = path.join(source, entry.name);
    const targetPath = path.join(target, entry.name);

    if (entry.isDirectory()) {
      mergeMissingFiles(sourcePath, targetPath);
      continue;
    }

    if (!fs.existsSync(targetPath)) {
      fs.mkdirSync(path.dirname(targetPath), { recursive: true });
      fs.copyFileSync(sourcePath, targetPath);
    }
  }
}

try {
  if (fs.existsSync(nextStaticDir)) {
    copyDirectory(nextStaticDir, backupStaticDir);
    console.log(`[build] Backed up previous .next/static to ${backupStaticDir}`);
  }

  const result = spawnSync(
    'node',
    ['--max-old-space-size=4096', 'node_modules/.bin/next', 'build'],
    {
      cwd: projectRoot,
      stdio: 'inherit',
      env: process.env,
    }
  );

  if (result.status !== 0) {
    process.exit(result.status || 1);
  }

  if (fs.existsSync(backupStaticDir) && fs.existsSync(nextStaticDir)) {
    mergeMissingFiles(backupStaticDir, nextStaticDir);
    console.log('[build] Restored previous static assets that were missing from the new build');
  }
} finally {
  fs.rmSync(backupRoot, { recursive: true, force: true });
}
