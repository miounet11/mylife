const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawnSync } = require('child_process');

const projectRoot = process.cwd();
const tsconfigPath = path.join(projectRoot, 'tsconfig.json');
const nextBuildDir = path.join(projectRoot, '.next');
const nextStaticDir = path.join(projectRoot, '.next', 'static');
const backupRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'lifekline-static-'));
const backupStaticDir = path.join(backupRoot, 'static');
const stagingBuildName = `.next-build-${process.pid}-${Date.now()}`;
const stagingBuildDir = path.join(projectRoot, stagingBuildName);
const stagingStaticDir = path.join(stagingBuildDir, 'static');
const previousNextDir = path.join(projectRoot, `.next-previous-${process.pid}-${Date.now()}`);

const requiredBuildArtifacts = [
  'BUILD_ID',
  'prerender-manifest.json',
  'routes-manifest.json',
  'server',
  'static',
];
const originalTsconfig = fs.existsSync(tsconfigPath)
  ? fs.readFileSync(tsconfigPath, 'utf8')
  : null;

function removeDirectory(targetPath) {
  fs.rmSync(targetPath, {
    recursive: true,
    force: true,
    maxRetries: 6,
    retryDelay: 250,
  });
}

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

function validateBuildArtifacts(buildDir) {
  const missing = requiredBuildArtifacts.filter((entry) => !fs.existsSync(path.join(buildDir, entry)));
  if (missing.length) {
    throw new Error(`[build] Next build is missing required artifact(s): ${missing.join(', ')}`);
  }
}

function restoreTsconfigIfChanged() {
  if (originalTsconfig === null || !fs.existsSync(tsconfigPath)) return;
  const current = fs.readFileSync(tsconfigPath, 'utf8');
  if (current === originalTsconfig) return;
  fs.writeFileSync(tsconfigPath, originalTsconfig);
  console.log('[build] Restored tsconfig.json after staged Next.js build');
}

try {
  if (fs.existsSync(nextStaticDir)) {
    copyDirectory(nextStaticDir, backupStaticDir);
    console.log(`[build] Backed up previous .next/static to ${backupStaticDir}`);
  }

  removeDirectory(stagingBuildDir);

  const result = spawnSync(
    'node',
    ['--max-old-space-size=4096', 'node_modules/.bin/next', 'build'],
    {
      cwd: projectRoot,
      stdio: 'inherit',
      env: {
        ...process.env,
        NEXT_DIST_DIR: stagingBuildName,
      },
    }
  );

  if (result.status !== 0) {
    removeDirectory(stagingBuildDir);
    process.exit(result.status || 1);
  }

  try {
    validateBuildArtifacts(stagingBuildDir);
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    removeDirectory(stagingBuildDir);
    process.exit(1);
  }

  if (fs.existsSync(backupStaticDir) && fs.existsSync(stagingStaticDir)) {
    mergeMissingFiles(backupStaticDir, stagingStaticDir);
    console.log('[build] Restored previous static assets that were missing from the new build');
  }

  if (fs.existsSync(nextBuildDir)) {
    fs.renameSync(nextBuildDir, previousNextDir);
    console.log(`[build] Moved previous .next build directory to ${previousNextDir}`);
  }

  try {
    fs.renameSync(stagingBuildDir, nextBuildDir);
    console.log('[build] Promoted staged Next.js build to .next');
  } catch (error) {
    if (!fs.existsSync(nextBuildDir) && fs.existsSync(previousNextDir)) {
      fs.renameSync(previousNextDir, nextBuildDir);
      console.error('[build] Failed to promote staged build; restored previous .next build directory');
    }
    throw error;
  }

  removeDirectory(previousNextDir);
} finally {
  restoreTsconfigIfChanged();
  removeDirectory(backupRoot);
  removeDirectory(stagingBuildDir);
}
