import type { AgentPromptModule, StructuredAgenticContext } from '@/lib/agentic-report/types';

function compactForPrompt(value: unknown, depth: number = 0): unknown {
  if (value == null) return value;
  if (typeof value === 'string') {
    return value.length > 240 ? `${value.slice(0, 240)}...` : value;
  }
  if (typeof value !== 'object') {
    return value;
  }
  if (depth >= 6) {
    return '[trimmed]';
  }
  if (Array.isArray(value)) {
    if (value.length <= 12) {
      return value.map((item) => compactForPrompt(item, depth + 1));
    }
    const head = value.slice(0, 6);
    const tail = value.slice(-6);
    return [...head, ...tail].map((item) => compactForPrompt(item, depth + 1));
  }

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, item]) => [key, compactForPrompt(item, depth + 1)])
  );
}

export function buildPromptModules(context: StructuredAgenticContext): AgentPromptModule[] {
  const modules: AgentPromptModule[] = [
    {
      label: 'ENGINE_CONSTITUTION',
      content: JSON.stringify(compactForPrompt(context.engine.constitution)),
    },
    {
      label: 'ENGINE_TEN_GODS_TABLE',
      content: JSON.stringify(compactForPrompt(context.engine.tenGodsTable)),
    },
    {
      label: 'ENGINE_DAYUN_WINDOWS',
      content: JSON.stringify(compactForPrompt(context.engine.dayun.windows)),
    },
    {
      label: 'ENGINE_KLINE_ANCHORS',
      content: JSON.stringify(compactForPrompt(context.engine.kline.anchorPoints)),
    },
    {
      label: 'CONTEXT_TEMPORAL',
      content: JSON.stringify(compactForPrompt(context.context.temporal)),
    },
    {
      label: 'CONTEXT_MACRO',
      content: JSON.stringify(compactForPrompt(context.context.macroCycles)),
    },
    {
      label: 'CONTEXT_GEO_CLIMATE',
      content: JSON.stringify(compactForPrompt(context.context.geoClimate)),
    },
    {
      label: 'CONTEXT_SPATIAL',
      content: JSON.stringify(compactForPrompt(context.context.spatialFactors)),
    },
    {
      label: 'CONTEXT_HUMAN',
      content: JSON.stringify(compactForPrompt(context.context.humanFactors)),
    },
    {
      label: 'CONTEXT_WORLD_STATE',
      content: JSON.stringify(compactForPrompt(context.context.worldState)),
    },
  ];

  if (context.context.referenceIntelligence?.pack) {
    modules.push({
      label: 'REFERENCE_INTELLIGENCE',
      content: JSON.stringify(compactForPrompt(context.context.referenceIntelligence.pack)),
    });
  }

  if (context.context.referenceIntelligence?.overlay) {
    modules.push({
      label: 'REFERENCE_OVERLAY',
      content: JSON.stringify(compactForPrompt(context.context.referenceIntelligence.overlay)),
    });
  }

  return modules;
}

export function injectPromptModules(basePrompt: string, modules: AgentPromptModule[]) {
  return modules.reduce((prompt, module) => {
    const placeholder = `{{${module.label}}}`;
    return prompt.includes(placeholder)
      ? prompt.replace(placeholder, module.content)
      : `${prompt}\n\n[${module.label}]\n${module.content}`;
  }, basePrompt);
}

export function buildRerunConstraintBlock(constraints: string[]) {
  if (!constraints.length) return '';
  return `\n\n[RETRY_CONSTRAINTS]\n${constraints.map((item, index) => `${index + 1}. ${item}`).join('\n')}`;
}
