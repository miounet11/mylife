import {
  buildModelExecutionPlan,
  computeAttemptTimeouts,
  deriveModelHealthSnapshots,
  summarizeModelExecutionPlan,
  type ModelAttemptEvent,
  type ModelCircuitEvent,
} from '@/lib/llm-provider-health';

describe('llm provider health', () => {
  const models = ['gpt-5.2', 'grok-420-fast', 'auto'];

  it('pushes degraded model behind healthier fallbacks', () => {
    const attempts: ModelAttemptEvent[] = [
      { model: 'gpt-5.2', scope: 'report', success: false, latencyMs: 2500, createdAt: '2026-03-13T06:00:00.000Z' },
      { model: 'gpt-5.2', scope: 'report', success: false, latencyMs: 2600, createdAt: '2026-03-13T05:59:00.000Z' },
      { model: 'gpt-5.2', scope: 'report', success: false, latencyMs: 2550, createdAt: '2026-03-13T05:58:00.000Z' },
      { model: 'gpt-5.2', scope: 'report', success: false, latencyMs: 2500, createdAt: '2026-03-13T05:57:00.000Z' },
      { model: 'gpt-5.2', scope: 'report', success: false, latencyMs: 2450, createdAt: '2026-03-13T05:56:00.000Z' },
      { model: 'gpt-5.2', scope: 'report', success: true, latencyMs: 2300, createdAt: '2026-03-13T05:55:00.000Z' },
      { model: 'grok-420-fast', scope: 'report', success: true, latencyMs: 1600, createdAt: '2026-03-13T05:59:30.000Z' },
      { model: 'auto', scope: 'report', success: true, latencyMs: 1400, createdAt: '2026-03-13T05:59:20.000Z' },
    ];
    const circuits: ModelCircuitEvent[] = [];

    const snapshots = deriveModelHealthSnapshots({ models, attempts, circuits });
    const plan = buildModelExecutionPlan({ models, snapshots });

    expect(plan.orderedModels[0]).toBe('grok-420-fast');
    expect(plan.orderedModels[1]).toBe('auto');
    expect(plan.orderedModels[2]).toBe('gpt-5.2');
  });

  it('skips open circuit models until probe stage', () => {
    const attempts: ModelAttemptEvent[] = [];
    const circuits: ModelCircuitEvent[] = [
      {
        model: 'gpt-5.2',
        state: 'open',
        createdAt: '2026-03-13T06:00:00.000Z',
        reopenAt: '2026-03-13T06:20:00.000Z',
      },
    ];

    const snapshots = deriveModelHealthSnapshots({
      models,
      attempts,
      circuits,
      now: new Date('2026-03-13T06:10:00.000Z'),
    });
    const plan = buildModelExecutionPlan({
      models,
      snapshots,
      now: new Date('2026-03-13T06:10:00.000Z'),
    });

    expect(plan.orderedModels).toEqual(['grok-420-fast', 'auto']);
  });

  it('keeps explicit half-open models in probe stage instead of treating them as degraded', () => {
    const attempts: ModelAttemptEvent[] = [
      { model: 'gpt-5.2', scope: 'report', success: false, latencyMs: 2200, createdAt: '2026-03-13T06:00:00.000Z' },
      { model: 'gpt-5.2', scope: 'report', success: false, latencyMs: 2300, createdAt: '2026-03-13T05:59:00.000Z' },
      { model: 'gpt-5.2', scope: 'report', success: false, latencyMs: 2250, createdAt: '2026-03-13T05:58:00.000Z' },
      { model: 'gpt-5.2', scope: 'report', success: false, latencyMs: 2100, createdAt: '2026-03-13T05:57:00.000Z' },
      { model: 'gpt-5.2', scope: 'report', success: false, latencyMs: 2000, createdAt: '2026-03-13T05:56:00.000Z' },
      { model: 'gpt-5.2', scope: 'report', success: false, latencyMs: 2100, createdAt: '2026-03-13T05:55:00.000Z' },
      { model: 'grok-420-fast', scope: 'report', success: true, latencyMs: 1600, createdAt: '2026-03-13T05:59:30.000Z' },
    ];
    const circuits: ModelCircuitEvent[] = [
      {
        model: 'gpt-5.2',
        state: 'half-open',
        createdAt: '2026-03-13T06:10:00.000Z',
      },
    ];

    const snapshots = deriveModelHealthSnapshots({ models, attempts, circuits });
    const gptSnapshot = snapshots.find((item) => item.model === 'gpt-5.2');
    const plan = buildModelExecutionPlan({ models, snapshots });

    expect(gptSnapshot?.state).toBe('half-open');
    expect(plan.orderedModels).toEqual(['grok-420-fast', 'auto', 'gpt-5.2']);
  });

  it('summarizes ordered and skipped models for logs', () => {
    const attempts: ModelAttemptEvent[] = [];
    const circuits: ModelCircuitEvent[] = [
      {
        model: 'gpt-5.2',
        state: 'open',
        createdAt: '2026-03-13T06:00:00.000Z',
        reopenAt: '2026-03-13T06:20:00.000Z',
      },
    ];

    const snapshots = deriveModelHealthSnapshots({
      models,
      attempts,
      circuits,
      now: new Date('2026-03-13T06:10:00.000Z'),
    });
    const plan = buildModelExecutionPlan({
      models,
      snapshots,
      now: new Date('2026-03-13T06:10:00.000Z'),
    });
    const summary = summarizeModelExecutionPlan(plan);

    expect(summary.label).toContain('ordered=');
    expect(summary.label).toContain('skipped=gpt-5.2[open');
  });

  it('returns a recovered model to default order after consecutive successes', () => {
    const attempts: ModelAttemptEvent[] = [
      { model: 'gpt-5.2', scope: 'report', success: true, latencyMs: 1500, createdAt: '2026-03-13T06:11:00.000Z' },
      { model: 'gpt-5.2', scope: 'report', success: true, latencyMs: 1450, createdAt: '2026-03-13T06:10:00.000Z' },
      { model: 'gpt-5.2', scope: 'report', success: false, latencyMs: 2200, createdAt: '2026-03-13T06:09:00.000Z' },
      { model: 'gpt-5.2', scope: 'report', success: false, latencyMs: 2250, createdAt: '2026-03-13T06:08:00.000Z' },
      { model: 'gpt-5.2', scope: 'report', success: false, latencyMs: 2300, createdAt: '2026-03-13T06:07:00.000Z' },
      { model: 'gpt-5.2', scope: 'report', success: false, latencyMs: 2100, createdAt: '2026-03-13T06:06:00.000Z' },
      { model: 'grok-420-fast', scope: 'report', success: true, latencyMs: 1600, createdAt: '2026-03-13T06:10:30.000Z' },
    ];
    const circuits: ModelCircuitEvent[] = [
      {
        model: 'gpt-5.2',
        state: 'half-open',
        createdAt: '2026-03-13T06:10:00.000Z',
      },
    ];

    const snapshots = deriveModelHealthSnapshots({ models, attempts, circuits });
    const gptSnapshot = snapshots.find((item) => item.model === 'gpt-5.2');
    const plan = buildModelExecutionPlan({ models, snapshots });

    expect(gptSnapshot?.state).toBe('closed');
    expect(plan.orderedModels[0]).toBe('gpt-5.2');
  });

  it('splits total timeout budget across attempts', () => {
    expect(computeAttemptTimeouts(9000, 3).reduce((sum, item) => sum + item, 0)).toBe(9000);
    expect(computeAttemptTimeouts(6500, 3)).toHaveLength(3);
  });
});
