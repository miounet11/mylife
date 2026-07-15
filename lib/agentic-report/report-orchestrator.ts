// ── Report Orchestrator V6 ──
// Bridges app route { contextInput } with production pipeline { groundTruth, context }.

import type { AgentTask, PipelineResult } from './types';
import type { CreateContextInput } from './create-agentic-context';
import { createAgentTasks } from './create-agent-tasks';

export interface OrchestrateParams {
  contextInput?: CreateContextInput;
  groundTruth?: any;
  context?: any;
  tasks?: AgentTask[];
  enabled?: boolean;
}

function normalizePipelineResult(raw: any): PipelineResult {
  if (raw?.merged && raw?.run) {
    return raw as PipelineResult;
  }

  const agentResults =
    raw?.agentResults ||
    raw?.merged?.merged ||
    raw?.merged ||
    {};
  const successRate = Number(
    raw?.orchestration?.successRate ??
      raw?.merged?.successRate ??
      (Object.keys(agentResults).length ? 0.5 : 0),
  );
  const durationMs = Number(raw?.orchestration?.durationMs ?? raw?.run?.durationMs ?? 0);
  const failed = Array.isArray(raw?.orchestration?.failed)
    ? raw.orchestration.failed
    : Array.isArray(raw?.merged?.failedAgents)
      ? raw.merged.failedAgents
      : [];

  const tasks = Object.entries(agentResults).map(([agentKey, data]) => ({
    agentKey,
    status: 'ok' as const,
    data,
    timing: { startMs: 0, endMs: durationMs, durationMs },
  }));

  return {
    context: raw?.context,
    run: {
      tasks,
      successRate,
      durationMs,
    },
    merged: {
      merged: agentResults,
      successRate,
      failedAgents: failed,
      errors: raw?.orchestration?.errors || raw?.merged?.errors || [],
    },
    review: raw?.review,
    repair: raw?.repair,
    verify: raw?.verify,
    used: Boolean(raw?.used ?? successRate > 0),
    enabled: raw?.enabled !== false,
  } as PipelineResult;
}

export async function orchestrateAgenticReport(params: OrchestrateParams): Promise<PipelineResult> {
  const { runAgenticPipeline } = await import('./run-agentic-pipeline');

  // Shape A: app/api/report route → map to production { groundTruth, context }
  if (params?.contextInput) {
    const ci = params.contextInput;
    const groundTruth = {
      ...(ci.truthInput || {}),
      lifeProfile: ci.lifeProfile ?? ci.truthInput?.lifeProfile ?? null,
    };
    const context = {
      ...(ci.signalsInput || {}),
      report: ci.reportRaw,
    };

    // Production signature first (groundTruth/context object)
    try {
      const raw = await (runAgenticPipeline as any)({
        groundTruth,
        context,
        enabled: params.enabled !== false,
      });
      if (raw && (raw.context || raw.merged || raw.agentResults || raw.orchestration)) {
        return normalizePipelineResult(raw);
      }
    } catch (prodError) {
      console.warn(
        '[orchestrate] prod pipeline shape failed, trying local (contextInput, tasks)',
        prodError instanceof Error ? prodError.message : prodError,
      );
    }

    // Local signature: (contextInput, tasks)
    try {
      const tasks = params.tasks || createAgentTasks();
      const raw = await (runAgenticPipeline as any)(ci, tasks);
      return normalizePipelineResult(raw);
    } catch (localError) {
      console.error(
        '[orchestrate] local pipeline failed',
        localError instanceof Error ? localError.message : localError,
      );
      throw localError;
    }
  }

  // Shape B: production internal callers
  if (params?.groundTruth) {
    const raw = await (runAgenticPipeline as any)({
      groundTruth: params.groundTruth,
      context: params.context || {},
      enabled: params.enabled !== false,
      tasks: params.tasks,
    });
    return normalizePipelineResult(raw);
  }

  throw new Error('orchestrateAgenticReport requires contextInput or groundTruth');
}
