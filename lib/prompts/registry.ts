/**
 * Prompt 注册表。所有迁移完成的 PromptSpec 在这里登记。
 *
 * 业务代码不要直接 import 具体 spec 文件，统一走 getPrompt()。
 * 这样新旧实现切换、A/B 灰度、评测注入都集中在一处。
 */
import type { BuiltPrompt, PromptSpec, PromptStage } from './types';

const REGISTRY = new Map<PromptStage, PromptSpec<any>>();

export function registerPrompt<I>(spec: PromptSpec<I>): void {
  if (REGISTRY.has(spec.id)) {
    throw new Error(`Prompt ${spec.id} already registered (version=${REGISTRY.get(spec.id)?.version})`);
  }
  REGISTRY.set(spec.id, spec);
}

export function getPrompt<I = unknown>(id: PromptStage): PromptSpec<I> | undefined {
  return REGISTRY.get(id) as PromptSpec<I> | undefined;
}

export function listPrompts(): PromptSpec<unknown>[] {
  return [...REGISTRY.values()];
}

/**
 * 标准化构建：把 PromptSpec 拼成 { system, user } 两段。
 * 这是唯一允许把 PromptSpec 翻译成字符串的地方。
 */
export function buildPrompt<I>(id: PromptStage, input: I): BuiltPrompt {
  const spec = getPrompt<I>(id);
  if (!spec) {
    throw new Error(`Prompt ${id} not registered`);
  }
  const system = [
    spec.persona,
    '',
    `[任务]\n${spec.task}`,
    spec.hardConstraints.length ? `\n[硬约束·违反即失败]\n${spec.hardConstraints.map((c, i) => `H${i + 1}. ${c}`).join('\n')}` : '',
    spec.softPreferences.length ? `\n[软偏好·评分项]\n${spec.softPreferences.map((c, i) => `S${i + 1}. ${c}`).join('\n')}` : '',
    spec.antiPatterns.length ? `\n[反模式·禁止输出]\n${spec.antiPatterns.map((c, i) => `A${i + 1}. ${c}`).join('\n')}` : '',
    `\n[输出 Schema]\n${spec.outputSchemaDoc}`,
  ]
    .filter(Boolean)
    .join('\n');

  const user = spec.buildInput(input);

  return {
    system,
    user,
    temperature: spec.temperature,
    meta: { id: spec.id, version: spec.version },
  };
}

/** 评测用：导出原始 spec 字段（不格式化），方便快照 diff。 */
export function dumpPrompt(id: PromptStage): Record<string, unknown> | null {
  const spec = REGISTRY.get(id);
  if (!spec) return null;
  return {
    id: spec.id,
    version: spec.version,
    persona: spec.persona,
    task: spec.task,
    hardConstraints: spec.hardConstraints,
    softPreferences: spec.softPreferences,
    antiPatterns: spec.antiPatterns,
    outputSchemaDoc: spec.outputSchemaDoc,
    temperature: spec.temperature,
    legacy: spec.legacy ?? false,
  };
}
