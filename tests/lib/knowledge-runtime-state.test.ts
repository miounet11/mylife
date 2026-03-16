import { afterEach, describe, expect, test } from '@jest/globals';
import {
  acquireKnowledgeAcquisitionLockWithRecovery,
  createKnowledgeRunId,
  readKnowledgeAcquisitionLockStatus,
  releaseKnowledgeAcquisitionLock,
  writeKnowledgeAcquisitionSnapshot,
  readKnowledgeAcquisitionSnapshot,
} from '@/lib/knowledge-runtime-state';

describe('knowledge runtime state', () => {
  afterEach(() => {
    const status = readKnowledgeAcquisitionLockStatus(1);
    if (status.lock?.runId) {
      releaseKnowledgeAcquisitionLock(status.lock.runId);
    }
  });

  test('acquires and reports a healthy lock', () => {
    const runId = createKnowledgeRunId();
    const startedAt = new Date().toISOString();
    const lock = acquireKnowledgeAcquisitionLockWithRecovery({
      runId,
      startedAt,
      pid: process.pid,
    }, 60_000);

    const status = readKnowledgeAcquisitionLockStatus(60_000);

    expect(lock.acquired).toBe(true);
    expect(lock.recoveredStaleLock).toBe(false);
    expect(status.lock?.runId).toBe(runId);
    expect(status.stale).toBe(false);

    releaseKnowledgeAcquisitionLock(runId);
  });

  test('recovers a stale lock automatically', () => {
    const staleRunId = createKnowledgeRunId();
    const staleStartedAt = new Date(Date.now() - 120_000).toISOString();
    const staleLock = acquireKnowledgeAcquisitionLockWithRecovery({
      runId: staleRunId,
      startedAt: staleStartedAt,
      pid: process.pid,
    }, 60_000);

    expect(staleLock.acquired).toBe(true);

    const recoveredRunId = createKnowledgeRunId();
    const recovered = acquireKnowledgeAcquisitionLockWithRecovery({
      runId: recoveredRunId,
      startedAt: new Date().toISOString(),
      pid: process.pid,
    }, 1);

    const status = readKnowledgeAcquisitionLockStatus(60_000);

    expect(recovered.acquired).toBe(true);
    expect(recovered.recoveredStaleLock).toBe(true);
    expect(status.lock?.runId).toBe(recoveredRunId);

    releaseKnowledgeAcquisitionLock(recoveredRunId);
  });

  test('writes and reads the latest acquisition snapshot', () => {
    const snapshot = writeKnowledgeAcquisitionSnapshot({
      status: 'success',
      runId: createKnowledgeRunId(),
      pid: process.pid,
      startedAt: new Date(Date.now() - 2000).toISOString(),
      finishedAt: new Date().toISOString(),
      durationMs: 2000,
      cycle: { publishedCount: 3 },
    });

    const loaded = readKnowledgeAcquisitionSnapshot();

    expect(loaded?.status).toBe('success');
    expect(loaded?.runId).toBe(snapshot.runId);
    expect((loaded?.cycle as { publishedCount?: number } | undefined)?.publishedCount).toBe(3);
  });
});
