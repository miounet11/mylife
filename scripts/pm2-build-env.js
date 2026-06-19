const fs = require('node:fs');
const path = require('node:path');

const BUILD_ID_PATH = path.join(process.cwd(), '.next', 'BUILD_ID');

function normalizeBuildId(value) {
  const normalized = `${value || ''}`.trim();
  return normalized || '';
}

function readFilesystemBuildId() {
  try {
    return normalizeBuildId(fs.readFileSync(BUILD_ID_PATH, 'utf8'));
  } catch {
    return '';
  }
}

function readCurrentBuildId() {
  return readFilesystemBuildId() || normalizeBuildId(process.env.LIFE_KLINE_BUILD_ID);
}

function withBuildIdEnv(buildId, baseEnv = process.env) {
  const normalized = normalizeBuildId(buildId);
  if (!normalized) {
    return { ...baseEnv };
  }
  return {
    ...baseEnv,
    LIFE_KLINE_BUILD_ID: normalized,
  };
}

function withCurrentBuildEnv(baseEnv = process.env) {
  return withBuildIdEnv(readCurrentBuildId(), baseEnv);
}

module.exports = {
  readCurrentBuildId,
  withBuildIdEnv,
  withCurrentBuildEnv,
};
