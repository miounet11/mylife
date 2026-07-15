import type { AgentTask, CoreAgentKey, StructuredAgenticContext } from './types';
import { AGENT_DEFINITIONS, CORE_AGENT_KEYS } from './agent-definitions';
import { getAgentPrompt } from './prompt-registry';
import { buildPromptModules, injectPromptModules } from './prompt-injector';
import { callJsonLLM } from './llm-client';

function createTask(key: CoreAgentKey): AgentTask {
  const definition = AGENT_DEFINITIONS[key];

  return {
    id: `task-${key}`,
    key,
    role: definition.role,
    wave: definition.wave,
    dependsOn: definition.dependsOn,
    timeoutMs: 30000,
    retryable: key === 'core_constitution' || key === 'strategy_advisor',
    run: async (ctx: StructuredAgenticContext) => {
      const prompt = getAgentPrompt(key);
      const modules = buildPromptModules(ctx);
      const system = injectPromptModules(prompt.system, modules);
      const user = injectPromptModules(prompt.user, modules);
      const data = await callJsonLLM<Record<string, unknown>>({
        system,
        user,
        temperature: 0.35,
        timeoutMs: 28000,
      });
      return data;
    },
  };
}

export function createAgentTasks(): AgentTask[] {
  return CORE_AGENT_KEYS.map((key) => createTask(key));
}