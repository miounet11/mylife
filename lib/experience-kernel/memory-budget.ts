/**
 * Chat memory budget allocator (X-Tavern-inspired).
 * Assemble model context by priority layers under a char budget —
 * not by dumping the entire report summary every turn.
 *
 * Layers (high → low priority):
 *  1. Engine fact lock (EFC) — never truncated below min
 *  2. Calibration (denied past events / score)
 *  3. Seven-day actions
 *  4. Compact report spine (pattern / dayun / top focus)
 *  5. Recent history (newest first; older dropped first)
 *  6. Soft extras (tacit, materials, intent hint) — cut first
 */

export type MemoryBudgetLayer = {
  key: string;
  priority: number; // lower = keep first
  text: string;
  minChars?: number;
};

export type MemoryBudgetResult = {
  systemContext: string;
  history: Array<{ role: 'user' | 'assistant'; content: string }>;
  stats: {
    budgetChars: number;
    usedChars: number;
    layersKept: string[];
    layersDropped: string[];
    historyTurnsKept: number;
    historyTurnsDropped: number;
  };
};

const DEFAULT_BUDGET = 10_000; // ~approx system+context chars before history
const DEFAULT_HISTORY_TURNS = 8;
const MAX_LAYER_CHARS = 2_400;

function trimLayer(text: string, max = MAX_LAYER_CHARS): string {
  const t = `${text || ''}`.replace(/\s+/g, ' ').trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

/**
 * Build priority layers from chat experience context + free-form summary.
 */
export function buildChatMemoryLayers(input: {
  engineFactBlock?: string | null;
  report?: {
    dayMaster?: string | null;
    yongShen?: string[] | null;
    currentDaYun?: string | null;
    patternType?: string | null;
  } | null;
  sevenDayActions?: string[] | null;
  calibrationScore?: number | null;
  calibrationDenied?: string[] | null;
  focusAreas?: string[] | null;
  tacitSummary?: string | null;
  materialSummary?: string | null;
  intentHint?: string | null;
  unboundNote?: string | null;
  /** Full legacy summary — only soft extras extracted if structured fields empty */
  rawSummary?: string | null;
  /** Working memory from last assistant (open loops / verify points) */
  workingMemory?: string | null;
}): MemoryBudgetLayer[] {
  const layers: MemoryBudgetLayer[] = [];

  const efc = `${input.engineFactBlock || ''}`.trim();
  if (efc) {
    layers.push({
      key: 'engine_efc',
      priority: 0,
      text: `【引擎真值锁定 · EFC】\n${trimLayer(efc, 1_800)}`,
      minChars: 200,
    });
  } else if (input.unboundNote) {
    layers.push({
      key: 'unbound',
      priority: 0,
      text: trimLayer(input.unboundNote, 400),
      minChars: 40,
    });
  }

  const calParts: string[] = [];
  if (typeof input.calibrationScore === 'number') {
    calParts.push(`用户校准分 ${input.calibrationScore}/100`);
  }
  if (input.calibrationDenied?.length) {
    calParts.push(
      `已标记未发生（禁止再断言）：${input.calibrationDenied.slice(0, 4).join('；')}`,
    );
  }
  if (calParts.length) {
    layers.push({
      key: 'calibration',
      priority: 1,
      text: `【用户校准】${calParts.join('。')}`,
      minChars: 20,
    });
  }

  const actions = (input.sevenDayActions || []).map((a) => `${a}`.trim()).filter(Boolean);
  if (actions.length) {
    layers.push({
      key: 'seven_day',
      priority: 2,
      text: `【近7天可执行】${actions.slice(0, 3).join('；')}`,
      minChars: 30,
    });
  }

  const wm = `${input.workingMemory || ''}`.trim();
  if (wm) {
    layers.push({
      key: 'working_memory',
      priority: 2,
      text: `【会话工作记忆 · 承接上一轮】${trimLayer(wm, 600)}`,
      minChars: 24,
    });
  }

  const spine: string[] = [];
  if (input.report?.dayMaster) spine.push(`日主${input.report.dayMaster}`);
  if (input.report?.yongShen?.length) spine.push(`用神${input.report.yongShen.join('、')}`);
  if (input.report?.currentDaYun) spine.push(`大运${input.report.currentDaYun}`);
  if (input.report?.patternType) spine.push(`格局${input.report.patternType}`);
  if (input.focusAreas?.length) {
    spine.push(`焦点：${input.focusAreas.slice(0, 4).join('、')}`);
  }
  if (spine.length) {
    layers.push({
      key: 'report_spine',
      priority: 3,
      text: `【报告骨架】${spine.join(' · ')}`,
      minChars: 20,
    });
  }

  if (input.intentHint) {
    layers.push({
      key: 'intent',
      priority: 5,
      text: trimLayer(input.intentHint, 500),
    });
  }
  if (input.tacitSummary) {
    layers.push({
      key: 'tacit',
      priority: 6,
      text: `【默会补充】${trimLayer(input.tacitSummary, 400)}`,
    });
  }
  if (input.materialSummary) {
    layers.push({
      key: 'materials',
      priority: 6,
      text: `【附件】${trimLayer(input.materialSummary, 400)}`,
    });
  }

  // Soft: only keep a short slice of raw summary if structured layers thin
  const raw = `${input.rawSummary || ''}`.trim();
  if (raw && layers.filter((l) => l.priority <= 3).length < 2) {
    layers.push({
      key: 'raw_summary_soft',
      priority: 7,
      text: trimLayer(raw, 1_200),
    });
  }

  return layers.sort((a, b) => a.priority - b.priority);
}

/**
 * Fit layers + history into char budget. History is newest-first keep.
 */
export function allocateChatMemoryBudget(input: {
  layers: MemoryBudgetLayer[];
  history: Array<{ role: 'user' | 'assistant'; content: string }>;
  budgetChars?: number;
  maxHistoryTurns?: number;
}): MemoryBudgetResult {
  const budget = Math.max(800, input.budgetChars ?? DEFAULT_BUDGET);
  const maxTurns = input.maxHistoryTurns ?? DEFAULT_HISTORY_TURNS;

  const layersKept: string[] = [];
  const layersDropped: string[] = [];
  let used = 0;
  const keptTexts: string[] = [];

  for (const layer of input.layers) {
    const text = layer.text.trim();
    if (!text) continue;
    const remaining = budget - used;
    if (remaining < 40) {
      layersDropped.push(layer.key);
      continue;
    }
    const cost = text.length + 2;
    if (cost <= remaining) {
      keptTexts.push(text);
      layersKept.push(layer.key);
      used += cost;
      continue;
    }
    // High-priority: force-fit into remaining (hard cap)
    if (layer.priority <= 2 || layer.minChars) {
      const sliced = trimLayer(text, Math.max(32, remaining - 2));
      if (sliced.length >= 20) {
        keptTexts.push(sliced);
        layersKept.push(layer.key);
        used += sliced.length + 2;
        continue;
      }
    }
    layersDropped.push(layer.key);
  }

  // Hard cap system blob
  let systemContext = keptTexts.join('\n\n');
  if (systemContext.length > budget) {
    systemContext = systemContext.slice(0, budget - 1) + '…';
    used = systemContext.length;
  }

  // History: keep newest N that fit leftover (reserve ~35% for history if available)
  const historyBudget = Math.max(1_200, Math.floor(budget * 0.35));
  let historyUsed = 0;
  const historyNewestFirst = [...input.history].reverse();
  const keptHistoryRev: Array<{ role: 'user' | 'assistant'; content: string }> = [];
  let dropped = 0;

  for (const turn of historyNewestFirst) {
    if (keptHistoryRev.length >= maxTurns) {
      dropped += 1;
      continue;
    }
    const content = trimLayer(turn.content, 1_200);
    const cost = content.length + 8;
    if (historyUsed + cost > historyBudget) {
      dropped += 1;
      continue;
    }
    keptHistoryRev.push({ role: turn.role, content });
    historyUsed += cost;
  }

  const history = keptHistoryRev.reverse();
  if (!systemContext) {
    systemContext = keptTexts.join('\n\n');
  }

  return {
    systemContext,
    history,
    stats: {
      budgetChars: budget,
      usedChars: systemContext.length + historyUsed,
      layersKept,
      layersDropped,
      historyTurnsKept: history.length,
      historyTurnsDropped: dropped,
    },
  };
}
