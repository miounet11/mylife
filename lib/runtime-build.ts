import fs from 'fs';
import path from 'path';

type RuntimeBuildInfo = {
  buildId: string;
  source: 'process-env' | 'filesystem' | 'unknown';
  filesystemBuildId: string | null;
  distDir: string | null;
};

let cachedBuildInfo: RuntimeBuildInfo | null = null;

function normalizeBuildId(value: string | undefined) {
  const normalized = `${value || ''}`.trim();
  return normalized || null;
}

function readBuildIdFile(candidate: string) {
  try {
    return normalizeBuildId(fs.readFileSync(candidate, 'utf8'));
  } catch {
    return null;
  }
}

function getBuildIdCandidates() {
  const nextDistDir = normalizeBuildId(process.env.NEXT_DIST_DIR) || '.next';
  const distDir = path.isAbsolute(nextDistDir)
    ? nextDistDir
    : path.join(process.cwd(), nextDistDir);

  return {
    distDir,
    files: [
      path.join(distDir, 'BUILD_ID'),
      path.join(process.cwd(), '.next', 'BUILD_ID'),
      path.join(process.cwd(), '.next', 'standalone', '.next', 'BUILD_ID'),
    ],
  };
}

export function getRuntimeBuildInfo(): RuntimeBuildInfo {
  if (cachedBuildInfo) {
    return cachedBuildInfo;
  }

  const processBuildId =
    normalizeBuildId(process.env.LIFE_KLINE_BUILD_ID)
    || normalizeBuildId(process.env.NEXT_BUILD_ID_OVERRIDE);
  const candidates = getBuildIdCandidates();
  const filesystemBuildId = candidates.files.map(readBuildIdFile).find(Boolean) || null;

  if (processBuildId) {
    cachedBuildInfo = {
      buildId: processBuildId,
      source: 'process-env',
      filesystemBuildId,
      distDir: candidates.distDir,
    };
    return cachedBuildInfo;
  }

  cachedBuildInfo = {
    buildId: filesystemBuildId || 'unknown-build',
    source: filesystemBuildId ? 'filesystem' : 'unknown',
    filesystemBuildId,
    distDir: candidates.distDir,
  };
  return cachedBuildInfo;
}

export function getRuntimeBuildId() {
  return getRuntimeBuildInfo().buildId;
}
