/**
 * 共用：把 StructuredAgenticContext 拼成 user prompt 字符串。
 * 各 agent 只需声明"读取顺序"和"哪几段提到最前"，剩下交给本工具。
 *
 * v2 升级（context 精简）：默认 strict=true，只输出 readingOrder 里声明的 label，
 * 不再追加其余 ALL_LABELS。这能让 health/relationship 这类不需要 MACRO/SPATIAL
 * 的 agent 直接省掉对应段，平均 token 节省 30~50%。
 * 老行为可通过 strict=false 显式恢复。
 */
import { buildPromptModules, injectPromptModules } from '@/lib/agentic-report/prompt-injector';
import type { StructuredAgenticContext } from '@/lib/agentic-report/types';

const ALL_LABELS = [
  'ENGINE_CONSTITUTION',
  'ENGINE_TEN_GODS_TABLE',
  'ENGINE_KLINE_ANCHORS',
  'ENGINE_KLINE_WINDOWS',
  'ENGINE_DAYUN_WINDOWS',
  'CONTEXT_TEMPORAL',
  'CONTEXT_MACRO',
  'CONTEXT_GEO_CLIMATE',
  'CONTEXT_SPATIAL',
  'CONTEXT_HUMAN',
  'CONTEXT_WORLD_STATE',
];

export interface AgentInputOptions {
  /** 读取顺序提示，按重要性排序的 label 列表（人类可读） */
  readingOrder: string[];
  /** 自定义旁注，例如"流年节气作为节奏校准" */
  notes?: string[];
  /**
   * 是否严格裁剪：true 仅注入 readingOrder 中的 label；false 追加其余 ALL_LABELS。
   * 默认 true。
   */
  strict?: boolean;
}

export function buildAgentUserPrompt(
  ctx: StructuredAgenticContext,
  options: AgentInputOptions
): string {
  const strict = options.strict ?? true;
  // prompt-injector 默认不输出 ENGINE_KLINE_WINDOWS，单独补一段。
  const klineWindowsModule = {
    label: 'ENGINE_KLINE_WINDOWS',
    content: JSON.stringify(ctx.engine?.kline?.windows ?? []),
  };
  const modules = [klineWindowsModule, ...buildPromptModules(ctx)];

  const readingOrderLines = options.readingOrder.map((label, i) => `${i + 1}) ${label}`);
  const headerLines: string[] = ['[读取顺序]', ...readingOrderLines];
  if (options.notes?.length) {
    headerLines.push('', '[读取要点]', ...options.notes.map((n) => `- ${n}`));
  }

  // strict=true：只输出 readingOrder；strict=false：追加其余 ALL_LABELS。
  const ordered = strict
    ? options.readingOrder
    : [
        ...options.readingOrder,
        ...ALL_LABELS.filter((l) => !options.readingOrder.includes(l)),
      ];
  const sectionLines = ordered.flatMap((label) => ['', `[${label}]`, `{{${label}}}`]);

  // strict 模式只用 readingOrder 中提到的 module，避免 injectPromptModules 的兜底
  // append 行为把未被提及的 module 拼到末尾。
  const usedModules = strict
    ? modules.filter((m) => ordered.includes(m.label))
    : modules;

  return injectPromptModules([...headerLines, ...sectionLines].join('\n'), usedModules);
}
