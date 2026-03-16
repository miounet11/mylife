const fs = require('fs');
const path = require('path');

const runtimeDir = path.join(process.cwd(), 'data', 'runtime');
const snapshotFile = path.join(runtimeDir, 'knowledge-acquisition.snapshot.json');
const lockFile = path.join(runtimeDir, 'knowledge-acquisition.lock.json');

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

const snapshot = readJson(snapshotFile);
const lock = readJson(lockFile);
const ttlMs = Math.max(60_000, Number(process.env.KNOWLEDGE_ACQUISITION_LOCK_TTL_MS || 1000 * 60 * 45));
const lockAgeMs = lock?.startedAt ? Math.max(0, Date.now() - new Date(lock.startedAt).getTime()) : 0;
const lockStale = !!lock && (!Number.isFinite(lockAgeMs) || lockAgeMs > ttlMs);

console.log(JSON.stringify({
  snapshot,
  lock: {
    current: lock,
    ageMs: lockAgeMs,
    stale: lockStale,
    ttlMs,
  },
  checkedAt: new Date().toISOString(),
}, null, 2));
