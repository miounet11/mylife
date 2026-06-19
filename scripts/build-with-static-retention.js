const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const { spawnSync } = require('child_process');
const { readPositiveIntegerEnv } = require('./ops-env.js');

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
const buildIdOverride = `${process.env.NEXT_BUILD_ID_OVERRIDE || ''}`.trim();
const buildId = buildIdOverride || createBuildId();
const lowMemoryBuild = process.env.LOW_MEMORY_BUILD === '1'
  || (process.env.LOW_MEMORY_BUILD !== '0' && os.totalmem() <= 5 * 1024 * 1024 * 1024);
const buildOldSpaceMb = readPositiveIntegerEnv(
  'NEXT_BUILD_MAX_OLD_SPACE_MB',
  lowMemoryBuild ? 2048 : 4096,
  { min: 512, max: 8192 }
);
const nextBuildWorkers = readPositiveIntegerEnv(
  'NEXT_BUILD_WORKERS',
  lowMemoryBuild ? 1 : 0,
  { min: 0, max: 16 }
);
const staleManagedBuildMaxAgeMs = readPositiveIntegerEnv('STALE_NEXT_BUILD_MAX_AGE_MS', 24 * 60 * 60 * 1000, {
  min: 60 * 60 * 1000,
  max: 30 * 24 * 60 * 60 * 1000,
});

const requiredBuildArtifacts = [
  'BUILD_ID',
  'prerender-manifest.json',
  'routes-manifest.json',
  'server',
  'static',
];
const textDistDirReferenceExtensions = new Set([
  '.html',
  '.js',
  '.json',
  '.map',
  '.mjs',
  '.nft.json',
  '.txt',
  '.wasm.map',
]);
const originalTsconfig = fs.existsSync(tsconfigPath)
  ? fs.readFileSync(tsconfigPath, 'utf8')
  : null;

class BuildScriptError extends Error {
  constructor(message, exitCode = 1) {
    super(message);
    this.exitCode = exitCode;
  }
}

function removeDirectory(targetPath) {
  fs.rmSync(targetPath, {
    recursive: true,
    force: true,
    maxRetries: 6,
    retryDelay: 250,
  });
}

function isManagedTemporaryBuildDirName(name) {
  return /^\.next-(?:build|previous)-\d+-\d+$/.test(name);
}

function getManagedTemporaryBuildDirAgeMs(name, now = Date.now()) {
  const match = name.match(/^\.next-(?:build|previous)-\d+-(\d+)$/);
  const createdAt = match ? Number(match[1]) : 0;
  if (!Number.isFinite(createdAt) || createdAt <= 0) return 0;
  return Math.max(0, now - createdAt);
}

function cleanupStaleManagedBuildDirs() {
  if (process.env.STALE_NEXT_BUILD_CLEANUP === '0') {
    return;
  }

  let removed = 0;
  for (const entry of fs.readdirSync(projectRoot, { withFileTypes: true })) {
    if (!entry.isDirectory() || !isManagedTemporaryBuildDirName(entry.name)) {
      continue;
    }

    if (getManagedTemporaryBuildDirAgeMs(entry.name) < staleManagedBuildMaxAgeMs) {
      continue;
    }

    removeDirectory(path.join(projectRoot, entry.name));
    removed += 1;
  }

  if (removed > 0) {
    console.log(`[build] Removed ${removed} stale managed Next.js build dir(s)`);
  }
}

function createBuildId() {
  let candidate = '';
  do {
    candidate = `lk_${Date.now().toString(36)}_${crypto.randomBytes(8).toString('hex')}`;
  } while (/ad/i.test(candidate));
  return candidate;
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

function shouldRewriteDistDirReference(filePath) {
  const baseName = path.basename(filePath);
  return textDistDirReferenceExtensions.has(path.extname(filePath))
    || baseName.endsWith('.nft.json')
    || baseName.endsWith('.wasm.map');
}

function rewriteStagedDistDirReferences(buildDir, fromName, toName) {
  const needle = Buffer.from(fromName);
  let fileCount = 0;
  let occurrenceCount = 0;

  function visit(targetPath) {
    for (const entry of fs.readdirSync(targetPath, { withFileTypes: true })) {
      const entryPath = path.join(targetPath, entry.name);
      if (entry.isDirectory()) {
        visit(entryPath);
        continue;
      }

      const content = fs.readFileSync(entryPath);
      if (content.indexOf(needle) === -1) {
        continue;
      }

      if (!shouldRewriteDistDirReference(entryPath)) {
        throw new Error(`[build] Refusing to rewrite staged distDir reference in non-text artifact: ${path.relative(projectRoot, entryPath)}`);
      }

      const text = content.toString('utf8');
      const occurrences = text.split(fromName).length - 1;
      if (occurrences <= 0) {
        continue;
      }

      fs.writeFileSync(entryPath, text.replaceAll(fromName, toName));
      fileCount += 1;
      occurrenceCount += occurrences;
    }
  }

  visit(buildDir);
  if (fileCount > 0) {
    console.log(`[build] Rewrote ${occurrenceCount} staged distDir reference(s) in ${fileCount} file(s)`);
  }
}

function findStagedDistDirReferences(buildDir, stagedName, limit = 12) {
  const needle = Buffer.from(stagedName);
  const matches = [];

  function visit(targetPath) {
    if (matches.length >= limit) return;

    for (const entry of fs.readdirSync(targetPath, { withFileTypes: true })) {
      if (matches.length >= limit) return;
      const entryPath = path.join(targetPath, entry.name);

      if (entry.isDirectory()) {
        visit(entryPath);
        continue;
      }

      const content = fs.readFileSync(entryPath);
      if (content.indexOf(needle) !== -1) {
        matches.push(path.relative(projectRoot, entryPath));
      }
    }
  }

  visit(buildDir);
  return matches;
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

function removeBuildCache(buildDir) {
  const cacheDir = path.join(buildDir, 'cache');
  if (!fs.existsSync(cacheDir)) return;
  removeDirectory(cacheDir);
  console.log('[build] Removed staged Next.js build cache before promotion');
}

function validateBuildArtifacts(buildDir) {
  const missing = requiredBuildArtifacts.filter((entry) => !fs.existsSync(path.join(buildDir, entry)));
  if (missing.length) {
    throw new Error(`[build] Next build is missing required artifact(s): ${missing.join(', ')}`);
  }
}

function validateBuildId(buildDir, expectedBuildId) {
  const actualBuildId = fs.readFileSync(path.join(buildDir, 'BUILD_ID'), 'utf8').trim();
  if (actualBuildId !== expectedBuildId) {
    throw new Error(`[build] BUILD_ID mismatch: expected ${expectedBuildId}, got ${actualBuildId || '<empty>'}`);
  }
}

function validateNoStagedDistDirReferences(buildDir, stagedName) {
  const matches = findStagedDistDirReferences(buildDir, stagedName);
  if (matches.length) {
    throw new Error(`[build] Staged distDir reference(s) remain after rewrite: ${matches.join(', ')}`);
  }
}

function restoreTsconfigIfChanged() {
  if (originalTsconfig === null || !fs.existsSync(tsconfigPath)) return;
  const current = fs.readFileSync(tsconfigPath, 'utf8');
  if (current === originalTsconfig) return;
  fs.writeFileSync(tsconfigPath, originalTsconfig);
  console.log('[build] Restored tsconfig.json after staged Next.js build');
}

let exitCode = 0;

try {
  console.log(`[build] Using buildId ${buildId}`);
  console.log(`[build] Node old-space=${buildOldSpaceMb}MB${nextBuildWorkers > 0 ? `, Next workers=${nextBuildWorkers}` : ''}${lowMemoryBuild ? ' (low-memory mode)' : ''}`);

  if (process.env.NEXT_BUILD_DRY_PROBE === '1') {
    process.exit(0);
  }

  cleanupStaleManagedBuildDirs();

  if (fs.existsSync(nextStaticDir)) {
    copyDirectory(nextStaticDir, backupStaticDir);
    console.log(`[build] Backed up previous .next/static to ${backupStaticDir}`);
  }

  removeDirectory(stagingBuildDir);

  const nextBuildEnv = {
    ...process.env,
    NEXT_DIST_DIR: stagingBuildName,
    NEXT_BUILD_ID_OVERRIDE: buildId,
  };

  if (nextBuildWorkers > 0) {
    nextBuildEnv.NEXT_BUILD_WORKERS = `${nextBuildWorkers}`;
  }

  const result = spawnSync(
    'node',
    [`--max-old-space-size=${buildOldSpaceMb}`, 'node_modules/.bin/next', 'build'],
    {
      cwd: projectRoot,
      stdio: 'inherit',
      env: nextBuildEnv,
    }
  );

  if (result.status !== 0) {
    removeDirectory(stagingBuildDir);
    throw new BuildScriptError(`[build] Next build failed with exit code ${result.status || 1}`, result.status || 1);
  }

  try {
    validateBuildArtifacts(stagingBuildDir);
    validateBuildId(stagingBuildDir, buildId);
    removeBuildCache(stagingBuildDir);
    rewriteStagedDistDirReferences(stagingBuildDir, stagingBuildName, '.next');
    validateNoStagedDistDirReferences(stagingBuildDir, stagingBuildName);
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    removeDirectory(stagingBuildDir);
    throw new BuildScriptError('[build] Staged build validation failed', 1);
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
} catch (error) {
  if (error instanceof BuildScriptError) {
    console.error(error.message);
    exitCode = error.exitCode;
  } else {
    console.error(error instanceof Error ? error.message : error);
    exitCode = 1;
  }
} finally {
  restoreTsconfigIfChanged();
  removeDirectory(backupRoot);
  removeDirectory(stagingBuildDir);
}

if (exitCode !== 0) {
  process.exit(exitCode);
}
