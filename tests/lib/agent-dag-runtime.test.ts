/**
 * P1 第二阶段：DAG runtime 调度器测试。
 *
 * 关键不变量：
 *  - flag 关闭时：纯并行行为不变，所有 task 在同一波内
 *  - flag 开启时：wave 0 全部完成才能开始 wave 1，wave 1 完成才能开始 wave 2
 *  - 输出契约（results / succeeded / failed）与并行模式一致
 *  - 非核心 task（治理 agent）走 wave 99，不破坏现有调用方
 */
import { runDagAgents, runParallelAgents } from '@/lib/agentic-report/run-parallel-agents';
import type { AgentTask } from '@/lib/agentic-report/types';

function makeTask(key: string, startedAt: number[], finishedAt: number[]): AgentTask {
  return {
    key,
    input: undefined,
    execute: async () => {
      startedAt.push(Date.now());
      await new Promise((r) => setTimeout(r, 30));
      finishedAt.push(Date.now());
      return { key };
    },
  };
}

describe('runDagAgents · DAG 分波调度', () => {
  it('wave 0 必须先于 wave 1 完成（strategy 不能比 kline 早开始）', async () => {
    const started: Record<string, number> = {};
    const finished: Record<string, number> = {};
    const make = (key: string): AgentTask => ({
      key,
      input: undefined,
      execute: async () => {
        started[key] = Date.now();
        await new Promise((r) => setTimeout(r, 25));
        finished[key] = Date.now();
        return { key };
      },
    });
    const result = await runDagAgents([
      make('core_constitution'),
      make('kline_narrative'),
      make('temporal_spatial_advisor'),
      make('career_wealth'),
      make('relationship_family'),
      make('health_lifestyle'),
      make('strategy_advisor'),
    ]);
    expect(result.succeeded).toHaveLength(7);
    // strategy (wave 2) must start strictly after kline (wave 0) finishes
    expect(started.strategy_advisor).toBeGreaterThanOrEqual(finished.kline_narrative);
    expect(started.strategy_advisor).toBeGreaterThanOrEqual(finished.career_wealth);
    // career (wave 1) must start after core (wave 0) finishes
    expect(started.career_wealth).toBeGreaterThanOrEqual(finished.core_constitution);
  });

  it('未在 DAG 中的 task（如治理 agent）走 wave 99 兜底', async () => {
    const result = await runDagAgents([
      { key: 'core_constitution', input: undefined, execute: async () => ({}) },
      { key: 'consensus_reviewer', input: undefined, execute: async () => ({}) },
    ]);
    expect(result.succeeded).toContain('core_constitution');
    expect(result.succeeded).toContain('consensus_reviewer');
  });

  it('某个 wave 内的 task 失败不影响其他 wave 的 task 执行（顺序仍维持）', async () => {
    const result = await runDagAgents([
      {
        key: 'kline_narrative',
        input: undefined,
        execute: async () => {
          throw new Error('boom');
        },
      },
      { key: 'strategy_advisor', input: undefined, execute: async () => ({ ok: true }) },
    ]);
    expect(result.failed).toContain('kline_narrative');
    expect(result.succeeded).toContain('strategy_advisor');
  });
});

describe('runParallelAgents · feature flag 路由', () => {
  it('默认 flag 关闭时：行为与老版纯并行一致（所有 task 一起跑）', async () => {
    delete process.env.AGENT_DAG_SCHEDULER;
    const started: Record<string, number> = {};
    const make = (key: string): AgentTask => ({
      key,
      input: undefined,
      execute: async () => {
        started[key] = Date.now();
        await new Promise((r) => setTimeout(r, 20));
        return { key };
      },
    });
    const result = await runParallelAgents([
      make('core_constitution'),
      make('strategy_advisor'),
    ]);
    expect(result.succeeded).toHaveLength(2);
    // 两个 task 启动时间差应小于 task 内部 sleep（20ms）
    // 即纯并行下应几乎同时启动
    expect(Math.abs(started.strategy_advisor - started.core_constitution)).toBeLessThan(15);
  });
});
