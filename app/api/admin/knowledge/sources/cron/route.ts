import { NextRequest, NextResponse } from 'next/server';
import { runKnowledgeAcquisitionCycle } from '@/lib/knowledge-acquisition';
import {
  acquireKnowledgeAcquisitionLockWithRecovery,
  createKnowledgeRunId,
  readKnowledgeAcquisitionLockStatus,
  readKnowledgeAcquisitionSnapshot,
  releaseKnowledgeAcquisitionLock,
  writeKnowledgeAcquisitionSnapshot,
} from '@/lib/knowledge-runtime-state';

export const maxDuration = 30;

function readLockTtlMs() {
  return Math.max(60_000, Number(process.env.KNOWLEDGE_ACQUISITION_LOCK_TTL_MS || 1000 * 60 * 45));
}

function isAuthorized(request: NextRequest) {
  const expected = `${process.env.KNOWLEDGE_ACQUISITION_CRON_TOKEN || process.env.CONTENT_RADAR_CRON_TOKEN || ''}`.trim();
  if (!expected) {
    return false;
  }

  return request.headers.get('x-knowledge-cron-token') === expected;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ success: false, error: '无权限访问' }, { status: 403 });
  }

  const ttlMs = readLockTtlMs();
  return NextResponse.json({
    success: true,
    snapshot: readKnowledgeAcquisitionSnapshot(),
    lock: readKnowledgeAcquisitionLockStatus(ttlMs),
    lockTtlMs: ttlMs,
    timestamp: new Date().toISOString(),
  });
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ success: false, error: '无权限访问' }, { status: 403 });
  }

  const ttlMs = readLockTtlMs();
  const runId = createKnowledgeRunId();
  const startedAt = new Date().toISOString();
  const lock = acquireKnowledgeAcquisitionLockWithRecovery({
    runId,
    pid: process.pid,
    startedAt,
  }, ttlMs);

  if (!lock.acquired) {
    return NextResponse.json({
      success: false,
      error: '知识采集任务正在运行中',
      code: 'knowledge_cycle_already_running',
      lock: lock.current,
      lockTtlMs: ttlMs,
      snapshot: readKnowledgeAcquisitionSnapshot(),
      timestamp: new Date().toISOString(),
    }, { status: 409 });
  }

  writeKnowledgeAcquisitionSnapshot({
    status: 'running',
    runId,
    pid: process.pid,
    startedAt,
  });

  try {
    const result = await runKnowledgeAcquisitionCycle();
    const finishedAt = new Date().toISOString();
    const durationMs = new Date(finishedAt).getTime() - new Date(startedAt).getTime();
    const snapshot = writeKnowledgeAcquisitionSnapshot({
      status: 'success',
      runId,
      pid: process.pid,
      startedAt,
      finishedAt,
      durationMs,
      cycle: result as unknown as Record<string, unknown>,
    });
    releaseKnowledgeAcquisitionLock(runId);
    return NextResponse.json({
      success: true,
      ...result,
      runId,
      recoveredStaleLock: lock.recoveredStaleLock,
      lockTtlMs: ttlMs,
      durationMs,
      snapshot,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const finishedAt = new Date().toISOString();
    const durationMs = new Date(finishedAt).getTime() - new Date(startedAt).getTime();
    const message = error instanceof Error ? error.message : '知识采集任务执行失败';
    const snapshot = writeKnowledgeAcquisitionSnapshot({
      status: 'error',
      runId,
      pid: process.pid,
      startedAt,
      finishedAt,
      durationMs,
      error: message,
    });
    releaseKnowledgeAcquisitionLock(runId);
    console.error('[API] 知识采集任务执行失败:', error);
    return NextResponse.json({
      success: false,
      error: '知识采集任务执行失败',
      detail: message,
      runId,
      recoveredStaleLock: lock.recoveredStaleLock,
      lockTtlMs: ttlMs,
      durationMs,
      snapshot,
    }, { status: 500 });
  }
}
