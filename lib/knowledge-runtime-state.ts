import fs from 'fs';
import path from 'path';

const STATE_DIR = path.join(process.cwd(), 'data', 'runtime');
const LOCK_FILE = path.join(STATE_DIR, 'knowledge-acquisition.lock.json');
const SNAPSHOT_FILE = path.join(STATE_DIR, 'knowledge-acquisition.snapshot.json');

export interface KnowledgeAcquisitionLock {
  runId: string;
  pid?: number;
  startedAt: string;
}

export interface KnowledgeAcquisitionSnapshot {
  status: 'idle' | 'running' | 'success' | 'error';
  runId?: string;
  pid?: number;
  startedAt?: string;
  finishedAt?: string;
  durationMs?: number;
  error?: string;
  cycle?: Record<string, unknown>;
  updatedAt: string;
}

export interface KnowledgeAcquisitionLockStatus {
  lock: KnowledgeAcquisitionLock | null;
  stale: boolean;
  ageMs: number;
}

function ensureStateDir() {
  fs.mkdirSync(STATE_DIR, { recursive: true });
}

function readJsonFile<T>(filePath: string): T | null {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T;
  } catch {
    return null;
  }
}

function writeJsonFile(filePath: string, value: unknown) {
  ensureStateDir();
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2), 'utf8');
}

export function createKnowledgeRunId() {
  return `knowledge_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function isKnowledgeAcquisitionLockStale(lock: KnowledgeAcquisitionLock | null, ttlMs: number) {
  if (!lock) {
    return false;
  }

  const startedAtMs = new Date(lock.startedAt).getTime();
  if (!Number.isFinite(startedAtMs)) {
    return true;
  }

  return Date.now() - startedAtMs > ttlMs;
}

export function readKnowledgeAcquisitionLockStatus(ttlMs: number): KnowledgeAcquisitionLockStatus {
  const lock = readJsonFile<KnowledgeAcquisitionLock>(LOCK_FILE);
  const startedAtMs = lock ? new Date(lock.startedAt).getTime() : 0;
  const ageMs = lock && Number.isFinite(startedAtMs)
    ? Math.max(0, Date.now() - startedAtMs)
    : 0;

  return {
    lock,
    stale: isKnowledgeAcquisitionLockStale(lock, ttlMs),
    ageMs,
  };
}

export function acquireKnowledgeAcquisitionLock(lock: KnowledgeAcquisitionLock, ttlMs = 1000 * 60 * 30) {
  try {
    ensureStateDir();
    const fd = fs.openSync(LOCK_FILE, 'wx');
    fs.writeFileSync(fd, JSON.stringify(lock, null, 2), 'utf8');
    fs.closeSync(fd);
    return {
      acquired: true as const,
      current: lock,
    };
  } catch (error: any) {
    if (error?.code !== 'EEXIST') {
      throw error;
    }

    return {
      acquired: false as const,
      current: readJsonFile<KnowledgeAcquisitionLock>(LOCK_FILE),
    };
  }
}

export function releaseKnowledgeAcquisitionLock(runId?: string) {
  const current = readJsonFile<KnowledgeAcquisitionLock>(LOCK_FILE);
  if (!current) {
    return false;
  }

  if (runId && current.runId !== runId) {
    return false;
  }

  try {
    fs.unlinkSync(LOCK_FILE);
    return true;
  } catch {
    return false;
  }
}

export function readKnowledgeAcquisitionLock() {
  return readJsonFile<KnowledgeAcquisitionLock>(LOCK_FILE);
}

export function acquireKnowledgeAcquisitionLockWithRecovery(
  lock: KnowledgeAcquisitionLock,
  ttlMs = 1000 * 60 * 30
) {
  const firstTry = acquireKnowledgeAcquisitionLock(lock, ttlMs);
  if (firstTry.acquired) {
    return {
      ...firstTry,
      recoveredStaleLock: false,
    };
  }

  const status = readKnowledgeAcquisitionLockStatus(ttlMs);
  if (!status.stale || !status.lock) {
    return {
      acquired: false as const,
      current: status.lock,
      recoveredStaleLock: false,
    };
  }

  releaseKnowledgeAcquisitionLock(status.lock.runId);
  const secondTry = acquireKnowledgeAcquisitionLock(lock, ttlMs);

  return {
    ...secondTry,
    recoveredStaleLock: secondTry.acquired,
  };
}

export function writeKnowledgeAcquisitionSnapshot(snapshot: Omit<KnowledgeAcquisitionSnapshot, 'updatedAt'>) {
  const payload: KnowledgeAcquisitionSnapshot = {
    ...snapshot,
    updatedAt: new Date().toISOString(),
  };
  writeJsonFile(SNAPSHOT_FILE, payload);
  return payload;
}

export function readKnowledgeAcquisitionSnapshot() {
  return readJsonFile<KnowledgeAcquisitionSnapshot>(SNAPSHOT_FILE);
}
