import type { CoreAgentKey } from '@/lib/agentic-report/agent-definitions';
import type { StructuredAgenticContext } from '@/lib/agentic-report/types';
import { buildPromptModules, injectPromptModules } from '@/lib/agentic-report/prompt-injector';
import { getAgentPrompt } from '@/lib/agentic-report/prompt-registry';
import { prependHardContract } from '@/lib/ground-truth/hard-contract';

/**
 * Build agent system/user prompts with hard contracts + LOCKED facts.
 *
 * Prefers production `lib/prompts` registry when present; falls back to
 * local `prompt-registry` + `prompt-injector` so sandbox and prod both
 * enforce engine fact locks.
 */
export function buildAgentPrompt(agentKey: CoreAgentKey, context: StructuredAgenticContext) {
  const modules = buildPromptModules(context);
  let system = '';
  let user = '';
  let temperature = 0.4;

  try {
    // Dynamic import keeps local sandbox working when lib/prompts is absent
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const prompts = require('@/lib/prompts') as {
      getPrompt?: (id: string) => unknown;
      buildPrompt?: (
        id: string,
        ctx: StructuredAgenticContext,
      ) => { system: string; user: string; temperature?: number };
    };
    const idMap: Record<CoreAgentKey, string> = {
      core_constitution: 'agentic.core_constitution',
      kline_narrative: 'agentic.kline_narrative',
      career_wealth: 'agentic.career_wealth',
      relationship_family: 'agentic.relationship_family',
      health_lifestyle: 'agentic.health_lifestyle',
      strategy_advisor: 'agentic.strategy_advisor',
      temporal_spatial_advisor: 'agentic.temporal_spatial_advisor',
    };
    const newId = idMap[agentKey];
    if (newId && typeof prompts.getPrompt === 'function' && prompts.getPrompt(newId) && typeof prompts.buildPrompt === 'function') {
      const built = prompts.buildPrompt(newId, context);
      system = built.system || '';
      user = built.user || '';
      temperature = built.temperature ?? 0.4;
    }
  } catch {
    // fall through to local registry
  }

  if (!system || !user) {
    const local = getAgentPrompt(agentKey);
    system = local.system;
    user = local.user;
    temperature = 0.4;
  }

  // Always inject {{LABEL}} modules + ensure hard contract + locked facts present
  system = prependHardContract(injectPromptModules(system, modules));
  user = injectPromptModules(user, modules);

  return {
    system,
    user,
    temperature,
  };
}
