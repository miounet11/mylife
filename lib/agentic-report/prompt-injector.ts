import type { AgentPromptModule, StructuredAgenticContext } from '@/lib/agentic-report/types';

export function buildPromptModules(context: StructuredAgenticContext): AgentPromptModule[] {
  return [
    {
      label: 'ENGINE_CONSTITUTION',
      content: JSON.stringify(context.engine.constitution, null, 2),
    },
    {
      label: 'ENGINE_TEN_GODS_TABLE',
      content: JSON.stringify(context.engine.tenGodsTable, null, 2),
    },
    {
      label: 'ENGINE_DAYUN_WINDOWS',
      content: JSON.stringify(context.engine.dayun.windows, null, 2),
    },
    {
      label: 'ENGINE_KLINE_ANCHORS',
      content: JSON.stringify(context.engine.kline.anchorPoints, null, 2),
    },
    {
      label: 'CONTEXT_TEMPORAL',
      content: JSON.stringify(context.context.temporal, null, 2),
    },
    {
      label: 'CONTEXT_MACRO',
      content: JSON.stringify(context.context.macroCycles, null, 2),
    },
    {
      label: 'CONTEXT_GEO_CLIMATE',
      content: JSON.stringify(context.context.geoClimate, null, 2),
    },
    {
      label: 'CONTEXT_SPATIAL',
      content: JSON.stringify(context.context.spatialFactors, null, 2),
    },
  ];
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
