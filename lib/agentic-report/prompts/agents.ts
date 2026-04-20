import { buildPromptModules, injectPromptModules } from '@/lib/agentic-report/prompt-injector';
import type { CoreAgentKey } from '@/lib/agentic-report/agent-definitions';
import { getAgentSchemaDoc } from '@/lib/agentic-report/schemas/agents';
import type { StructuredAgenticContext } from '@/lib/agentic-report/types';
import { WORLD_YI_DELIVERY_DIRECTIVE, WORLD_YI_DOCTRINE_BRIEF } from '@/lib/world-yi-doctrine';

const AGENT_TASKS: Record<CoreAgentKey, { title: string; task: string; temperature: number }> = {
  core_constitution: {
    title: '核心命局专家',
    task: '解释命局底盘、优势、风险、性格主轴，禁止改写日主强弱和用忌神。要把命局结构和世界状态引擎连起来，说明这个结构在当前世界阶段里如何落地。',
    temperature: 0.45,
  },
  kline_narrative: {
    title: '人生K线专家',
    task: '围绕K线锚点、阶段、窗口解释高低起伏，任何年份判断必须与K线分数一致。要把阶段变化和现实世界状态的顺逆势一起说明。',
    temperature: 0.55,
  },
  career_wealth: {
    title: '事业财富专家',
    task: '结合命局、K线和世界运行状态引擎，输出事业路径、财富方式和风控建议。重点解释什么是顺势，什么只是环境幻觉。',
    temperature: 0.55,
  },
  relationship_family: {
    title: '关系家庭专家',
    task: '聚焦婚恋、家庭、合作边界和关系修复，不得和关系窗口冲突。要把 tacit 状态、家庭旧秩序和现实代价纳入判断。',
    temperature: 0.55,
  },
  health_lifestyle: {
    title: '健康生活方式专家',
    task: '聚焦体质、压力、作息和长期生活方式建议，不制造恐慌。要把身体信号当成真实输入，而不是边角信息。',
    temperature: 0.45,
  },
  strategy_advisor: {
    title: '决策顾问',
    task: '把前面分析收束为未来1-3年的可执行动作和优先级。直接下主判断，不要犹豫，但必须服从命局结构、世界状态和 tacit 输入。',
    temperature: 0.5,
  },
  temporal_spatial_advisor: {
    title: '天时地利人和顾问',
    task: '结合节气、立春、国运、行业运、地理气候和方位，回答什么时候、在哪里、顺着什么大势做什么。重点给出现实可用的世界运行状态判断。',
    temperature: 0.5,
  },
};

export function buildAgentPrompt(agentKey: CoreAgentKey, context: StructuredAgenticContext) {
  const config = AGENT_TASKS[agentKey];
  const modules = buildPromptModules(context);

  const system = [
    `你是 Life Kline V4 的${config.title}。`,
    '你只能解释和建议，不能改写引擎真相。',
    WORLD_YI_DOCTRINE_BRIEF,
    WORLD_YI_DELIVERY_DIRECTIVE,
    '你必须输出纯JSON对象，第一个字符是{，最后一个字符是}。',
    '任何涉及年份、阶段、窗口、方位、行业的建议，都必须与输入事实一致。',
  ].join('\n');

  const baseUser = `
[AGENT_ROLE]
${config.title}

[AGENT_TASK]
${config.task}

[ENGINE_CONSTITUTION]
{{ENGINE_CONSTITUTION}}

[ENGINE_TEN_GODS_TABLE]
{{ENGINE_TEN_GODS_TABLE}}

[ENGINE_DAYUN_WINDOWS]
{{ENGINE_DAYUN_WINDOWS}}

[ENGINE_KLINE_ANCHORS]
{{ENGINE_KLINE_ANCHORS}}

[CONTEXT_TEMPORAL]
{{CONTEXT_TEMPORAL}}

[CONTEXT_MACRO]
{{CONTEXT_MACRO}}

[CONTEXT_GEO_CLIMATE]
{{CONTEXT_GEO_CLIMATE}}

[CONTEXT_SPATIAL]
{{CONTEXT_SPATIAL}}

[CONTEXT_HUMAN]
{{CONTEXT_HUMAN}}

[CONTEXT_WORLD_STATE]
{{CONTEXT_WORLD_STATE}}

[OUTPUT_SCHEMA]
${getAgentSchemaDoc(agentKey)}
`;

  return {
    system,
    user: injectPromptModules(baseUser, modules),
    temperature: config.temperature,
  };
}
