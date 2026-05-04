import { describe, expect, test } from '@jest/globals';
import { deriveModelHealthSnapshots, isImmediateOpenFailure } from '@/lib/llm-provider-health';

describe('llm provider health immediate open failures', () => {
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
});
