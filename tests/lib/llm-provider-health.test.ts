const mockAnalyticsCreate = jest.fn();
let attemptRows: Array<{ created_at: string; meta: string }> = [];
let circuitRows: Array<{ created_at: string; meta: string }> = [];

jest.mock('@/lib/database', () => ({
  analyticsOperations: {
    create: (...args: unknown[]) => mockAnalyticsCreate(...args),
    rawQuery: (sql: string) => sql.includes("event_name = 'llm_model_attempt'") ? attemptRows : circuitRows,
  },
}));

import { describe, expect, test, beforeEach } from '@jest/globals';
import {
  deriveModelHealthSnapshots,
  isImmediateOpenFailure,
  readBoundedPositiveIntEnv,
  readBoundedUnitRateEnv,
  recordModelAttempt,
} from '@/lib/llm-provider-health';

describe('llm provider health immediate open failures', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    attemptRows = [];
    circuitRows = [];
  });

  test('treats provider cooling and upstream forbidden as immediate-open failures', () => {
    expect(isImmediateOpenFailure('Error', '403 {"error":"token_cooling","message":"Grok token cooling"}')).toBe(true);
    expect(isImmediateOpenFailure('Error', '403 {"error":"upstream_forbidden","upstream_reason":"blocked_user"}')).toBe(true);
    expect(isImmediateOpenFailure('Error', `500 {"detail":"The 'gpt-5.2-codex' model is not supported when using Codex with a ChatGPT account."}`)).toBe(true);
  });

  test('treats repeated aborts and timeouts as immediate-open failures', () => {
    expect(isImmediateOpenFailure('AbortError', 'Request was aborted.')).toBe(true);
    expect(isImmediateOpenFailure('Error', 'The request timed out after 8000ms')).toBe(true);
  });

  test('does not mark parse failures as immediate-open failures', () => {
    expect(isImmediateOpenFailure('SyntaxError', 'Unexpected token')).toBe(false);
    expect(isImmediateOpenFailure('Error', 'JSON_PARSE_FAILED:auto')).toBe(false);
  });

  test('does not reopen from stale failures after recent recovery successes', () => {
    const now = new Date().toISOString();
    attemptRows = [
      buildAttemptRow(true, now),
      buildAttemptRow(true, now),
      buildAttemptRow(false, now, 'AbortError', 'Request was aborted'),
      buildAttemptRow(false, now, 'AbortError', 'Request was aborted'),
    ];
    circuitRows = [buildCircuitRow('closed', now)];

    recordModelAttempt({ model: 'auto', scope: 'agent', success: true, latencyMs: 100 });

    expect(mockAnalyticsCreate).toHaveBeenCalledTimes(1);
    expect(mockAnalyticsCreate).not.toHaveBeenCalledWith(expect.objectContaining({
      eventName: 'llm_model_circuit_changed',
    }));
  });

  test('drops stale half-open circuits back to closed', () => {
    const snapshots = deriveModelHealthSnapshots({
      models: ['auto'],
      attempts: [],
      circuits: [
        {
          model: 'auto',
          state: 'half-open',
          createdAt: '2026-03-30T00:00:00.000Z',
          reopenAt: '2026-03-30T00:08:00.000Z',
        },
      ],
      now: new Date('2026-03-30T03:30:00.000Z'),
    });

    expect(snapshots[0]?.state).toBe('closed');
    expect(snapshots[0]?.reopenAt).toBeUndefined();
  });

  test('keeps recently reopened circuits in half-open state', () => {
    const snapshots = deriveModelHealthSnapshots({
      models: ['auto'],
      attempts: [],
      circuits: [
        {
          model: 'auto',
          state: 'open',
          createdAt: '2026-03-30T03:20:00.000Z',
          reopenAt: '2026-03-30T03:24:00.000Z',
        },
      ],
      now: new Date('2026-03-30T03:30:00.000Z'),
    });

    expect(snapshots[0]?.state).toBe('half-open');
  });

  test('does not emit duplicate open circuit events while already open', () => {
    const now = new Date().toISOString();
    attemptRows = [
      buildAttemptRow(false, now, 'AbortError', 'Request was aborted'),
      buildAttemptRow(false, now, 'AbortError', 'Request was aborted'),
    ];
    circuitRows = [buildCircuitRow('open', now, new Date(Date.now() + 8 * 60 * 1000).toISOString())];

    recordModelAttempt({ model: 'auto', scope: 'agent', success: false, latencyMs: 100, errorType: 'AbortError', errorMessage: 'Request was aborted' });

    expect(mockAnalyticsCreate).toHaveBeenCalledTimes(1);
    expect(mockAnalyticsCreate).not.toHaveBeenCalledWith(expect.objectContaining({
      eventName: 'llm_model_circuit_changed',
    }));
  });

  test('emits half-open only after cooldown elapsed', () => {
    const expiredReopenAt = new Date(Date.now() - 60_000).toISOString();
    circuitRows = [buildCircuitRow('open', new Date(Date.now() - 10 * 60_000).toISOString(), expiredReopenAt)];

    recordModelAttempt({ model: 'auto', scope: 'agent', success: true, latencyMs: 100 });

    expect(mockAnalyticsCreate).toHaveBeenCalledWith(expect.objectContaining({
      eventName: 'llm_model_circuit_changed',
      meta: expect.objectContaining({ state: 'half-open', reason: 'cooldown_elapsed' }),
    }));
  });

  test('allows half-open failures to reopen the circuit', () => {
    const now = new Date().toISOString();
    attemptRows = [
      buildAttemptRow(false, now, 'AbortError', 'Request was aborted'),
      buildAttemptRow(false, now, 'AbortError', 'Request was aborted'),
    ];
    circuitRows = [buildCircuitRow('half-open', now)];

    recordModelAttempt({ model: 'auto', scope: 'agent', success: false, latencyMs: 100, errorType: 'AbortError', errorMessage: 'Request was aborted' });

    expect(mockAnalyticsCreate).toHaveBeenCalledWith(expect.objectContaining({
      eventName: 'llm_model_circuit_changed',
      meta: expect.objectContaining({ state: 'open', previousState: 'half-open' }),
    }));
  });

  test('emits recovered closed circuit after success streak', () => {
    const now = new Date().toISOString();
    attemptRows = [
      buildAttemptRow(true, now),
      buildAttemptRow(true, now),
    ];
    circuitRows = [buildCircuitRow('half-open', now)];

    recordModelAttempt({ model: 'auto', scope: 'agent', success: true, latencyMs: 100 });

    expect(mockAnalyticsCreate).toHaveBeenCalledWith(expect.objectContaining({
      eventName: 'llm_model_circuit_changed',
      meta: expect.objectContaining({ state: 'closed', reason: 'recovered' }),
    }));
  });

  test('bounds integer and rate environment overrides', () => {
    const originalEnv = process.env;
    process.env = { ...originalEnv };
    try {
      process.env.TEST_INT = '0';
      expect(readBoundedPositiveIntEnv('TEST_INT', 30, { min: 1, max: 1440 })).toBe(30);

      process.env.TEST_INT = '1441';
      expect(readBoundedPositiveIntEnv('TEST_INT', 30, { min: 1, max: 1440 })).toBe(30);

      process.env.TEST_INT = '60';
      expect(readBoundedPositiveIntEnv('TEST_INT', 30, { min: 1, max: 1440 })).toBe(60);

      process.env.TEST_RATE = '1.5';
      expect(readBoundedUnitRateEnv('TEST_RATE', 0.7, { min: 0.05, max: 1 })).toBe(0.7);

      process.env.TEST_RATE = '0.8';
      expect(readBoundedUnitRateEnv('TEST_RATE', 0.7, { min: 0.05, max: 1 })).toBe(0.8);
    } finally {
      process.env = originalEnv;
    }
  });
});

function buildAttemptRow(success: boolean, createdAt: string, errorType?: string, errorMessage?: string) {
  return {
    created_at: createdAt,
    meta: JSON.stringify({ model: 'auto', scope: 'agent', success, latencyMs: 100, errorType, errorMessage }),
  };
}

function buildCircuitRow(state: 'closed' | 'degraded' | 'half-open' | 'open', createdAt: string, reopenAt?: string) {
  return {
    created_at: createdAt,
    meta: JSON.stringify({ model: 'auto', scope: 'agent', state, reopenAt }),
  };
}
