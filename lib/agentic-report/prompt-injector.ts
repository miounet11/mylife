// ── Prompt Injector V6 ──
// Injects structured context blocks into prompt templates via {{LABEL}} placeholders

import type { StructuredAgenticContext } from './types';
import { ENGINE_HARD_CONTRACT } from '@/lib/ground-truth/hard-contract';
import { buildLockedFacts, type LockedEngineFacts } from '@/lib/ground-truth/pack';

export interface PromptModule {
  label: string;
  content: string;
}

const MAX_STR_LEN = 200;
const MAX_ARR_LEN = 10;

function compact(json: string): string {
  try {
    const obj = JSON.parse(json);
    const compacted = compactValue(obj, 0);
    return JSON.stringify(compacted, null, 2);
  } catch {
    return json;
  }
}

function compactValue(val: any, depth: number): any {
  if (depth > 5) return '[trimmed:max_depth]';
  if (typeof val === 'string' && val.length > MAX_STR_LEN) {
    return val.slice(0, MAX_STR_LEN) + '…';
  }
  if (Array.isArray(val)) {
    if (val.length > MAX_ARR_LEN) {
      return [
        ...val.slice(0, MAX_ARR_LEN / 2).map(v => compactValue(v, depth + 1)),
        `[${val.length - MAX_ARR_LEN} more items]`,
        ...val.slice(-MAX_ARR_LEN / 2).map(v => compactValue(v, depth + 1)),
      ];
    }
    return val.map(v => compactValue(v, depth + 1));
  }
  if (typeof val === 'object' && val !== null) {
    const out: Record<string, any> = {};
    for (const [k, v] of Object.entries(val)) {
      out[k] = compactValue(v, depth + 1);
    }
    return out;
  }
  return val;
}

function buildUserLifeContext(ctx: StructuredAgenticContext): string {
  const life = ctx?.lifeProfile || ctx?.engine?.lifeProfile;
  if (!life) return '无历史档案，按首次报告处理。';

  const lines: string[] = [];
  if (life.hasPreviousReports) {
    lines.push(`用户已有历史报告，整体命中率约 ${Math.round((life.calibrationScore || 0) * 100)}%。`);
  }
  if (life.recentEvents?.length) {
    lines.push(
      `近期真实事件：${life.recentEvents
        .slice(0, 3)
        .map((event) => `${event.date} ${event.title}`)
        .join('；')}`,
    );
  }
  if (life.focusAreas?.length) {
    lines.push(`用户历史关注领域：${life.focusAreas.join('、')}。`);
  }
  if (life.pastPredictionsSummary?.length) {
    lines.push(
      `历史预测：${life.pastPredictionsSummary
        .map((item) => `${item.category}命中率${Math.round((item.hitRate || 0) * 100)}%`)
        .join('；')}`,
    );
  }
  if (life.preferredTone) {
    lines.push(`表达偏好：${life.preferredTone}。`);
  }
  const progress = life.learningProgress || {};
  const completedTracks = Object.entries(progress)
    .filter(([, value]) => Number(value) >= 0.6)
    .map(([key]) => key);
  if (completedTracks.length) {
    lines.push(`已完成学习路径：${completedTracks.join('、')}，可适当提升专业深度。`);
  }

  return lines.length ? lines.join('\n') : '档案存在但暂无足够反馈，保持通俗解释。';
}

function buildUncertaintyNotes(ctx: StructuredAgenticContext): string {
  const notes = ctx?.engine?.lifeProfile?.uncertaintyNotes || [];
  if (notes.length) return notes.join('\n');
  return '按引擎置信边界输出，时辰或地点不确定时主动标注降级范围。';
}

function buildLockedFactsModule(engine: StructuredAgenticContext['engine'] | undefined): string {
  if (!engine) return '{}';
  try {
    const facts: LockedEngineFacts = buildLockedFacts(engine);
    return compact(JSON.stringify(facts));
  } catch {
    return '{}';
  }
}

export function buildPromptModules(ctx: StructuredAgenticContext): PromptModule[] {
  const engine = ctx?.engine;
  const context = ctx?.context;

  const safe = (value: unknown, fallback: string) => {
    try {
      return compact(JSON.stringify(value ?? {}));
    } catch {
      return fallback;
    }
  };

  return [
    { label: 'ENGINE_HARD_CONTRACT', content: ENGINE_HARD_CONTRACT },
    { label: 'ENGINE_CONSTITUTION', content: safe(engine?.constitution, '{}') },
    {
      label: 'ENGINE_TEN_GODS_TABLE',
      content: safe(Array.isArray(engine?.tenGodsTable) ? engine.tenGodsTable.slice(0, 4) : [], '[]'),
    },
    {
      label: 'ENGINE_KLINE_ANCHORS',
      content: safe(
        Array.isArray(engine?.kline?.anchorPoints) ? engine.kline.anchorPoints.slice(0, 8) : [],
        '[]',
      ),
    },
    {
      label: 'ENGINE_KLINE_WINDOWS',
      content: safe(Array.isArray(engine?.kline?.windows) ? engine.kline.windows.slice(0, 6) : [], '[]'),
    },
    {
      label: 'ENGINE_DAYUN_WINDOWS',
      content: safe(Array.isArray(engine?.dayun?.windows) ? engine.dayun.windows : [], '[]'),
    },
    {
      label: 'ENGINE_PILLARS',
      content: safe(Array.isArray(engine?.pillars) ? engine.pillars : [], '[]'),
    },
    { label: 'LOCKED_ENGINE_FACTS', content: buildLockedFactsModule(engine) },
    { label: 'CONTEXT_TEMPORAL', content: safe(context?.temporal, '{}') },
    { label: 'CONTEXT_MACRO', content: safe(context?.macroCycles, '{}') },
    { label: 'CONTEXT_GEO_CLIMATE', content: safe(context?.geoClimate, '{}') },
    { label: 'CONTEXT_SPATIAL', content: safe(context?.spatialFactors, '{}') },
    { label: 'CONTEXT_HUMAN', content: safe(context?.humanFactors, '{}') },
    { label: 'CONTEXT_WORLD_STATE', content: safe(context?.worldState, '{}') },
    { label: 'USER_LIFE_CONTEXT', content: buildUserLifeContext(ctx) },
    { label: 'UNCERTAINTY_NOTES', content: buildUncertaintyNotes(ctx) },
  ];
}

export function injectPromptModules(basePrompt: string, modules: PromptModule[]): string {
  let result = basePrompt;
  for (const mod of modules) {
    result = result.replace(new RegExp(`\\{\\{${mod.label}\\}\\}`, 'g'), mod.content);
  }
  // Always append locked facts if template forgot the placeholder
  const locked = modules.find((m) => m.label === 'LOCKED_ENGINE_FACTS');
  const hard = modules.find((m) => m.label === 'ENGINE_HARD_CONTRACT');
  if (hard?.content && !result.includes('【引擎硬约束')) {
    result = `${hard.content}\n\n${result}`;
  }
  if (locked?.content && !result.includes('LOCKED_ENGINE_FACTS') && !result.includes(locked.content.slice(0, 40))) {
    result = `${result}\n\n【LOCKED_ENGINE_FACTS · 输出中须保留字面】\n${locked.content}`;
  }
  return result;
}
