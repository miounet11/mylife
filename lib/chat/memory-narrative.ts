/**
 * Archive / revisit memory narrative for consultant opening.
 * Competitive differentiator: 「越聊越懂我 / 根据你的回访」 when real signals exist.
 *
 * Never invent hit rates or counts — only format numbers the caller provides.
 */

export type MemoryNarrativeInput = {
  /** 已回访预测条数（含命中/未命中等已标记结果） */
  predictionCount?: number;
  /** 命中条数；仅在与 predictionCount 同时可信时使用 */
  hitCount?: number;
  /** 事件记录条数 */
  eventCount?: number;
  /** 最近一条事件/对照标签 */
  lastEventLabel?: string;
};

function asNonNegInt(value: unknown): number | undefined {
  if (value == null || value === '') return undefined;
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return undefined;
  return Math.floor(n);
}

/**
 * Build a short Chinese memory line for opening chrome.
 * @returns null when there are no usable signals
 */
export function buildMemoryNarrative(input: MemoryNarrativeInput = {}): string | null {
  const predictionCount = asNonNegInt(input.predictionCount);
  const hitCount = asNonNegInt(input.hitCount);
  const eventCount = asNonNegInt(input.eventCount);
  const lastEventLabel = `${input.lastEventLabel || ''}`.trim();

  const hasPredictions = predictionCount != null && predictionCount > 0;
  const hasEvents = eventCount != null && eventCount > 0;
  const hasLabel = Boolean(lastEventLabel);

  if (!hasPredictions && !hasEvents && !hasLabel) {
    return null;
  }

  // Only pair hitCount with predictionCount when both are defined and hit ≤ total.
  const hitsUsable =
    hasPredictions &&
    hitCount != null &&
    hitCount >= 0 &&
    hitCount <= (predictionCount as number);

  const clauses: string[] = [];

  if (hasPredictions) {
    if (hitsUsable) {
      clauses.push(`你已回访 ${predictionCount} 条预测（命中 ${hitCount}）`);
    } else {
      clauses.push(`你已回访 ${predictionCount} 条预测`);
    }
  }

  if (hasEvents) {
    clauses.push(
      hasPredictions
        ? `另有 ${eventCount} 条事件记录`
        : `你已记录 ${eventCount} 条事件`,
    );
  }

  if (hasLabel) {
    clauses.push(`最近对照「${lastEventLabel}」`);
  }

  if (!clauses.length) return null;

  const head = `${clauses.join('；')}。`;

  // Stance only from real hit ratio — never invent rates.
  let stance = '下面会根据你的回访更懂你的节奏。';
  if (hitsUsable && predictionCount! > 0) {
    const ratio = hitCount! / predictionCount!;
    if (ratio >= 0.6) {
      stance = '下面会更偏推进，继续用可验证点校准。';
    } else if (ratio <= 0.35) {
      stance = '下面会更偏保守，先稳住再验证。';
    } else {
      stance = '下面会按你的回访校准，稳中求进。';
    }
  }

  return `${head}${stance}`;
}

/**
 * Map chat experience context → memory narrative input.
 * Uses event validation summary when present; does not invent prediction stats.
 *
 * TODO(prod): enrich chat API context with real prediction revisit stats
 * (e.g. from predictions store / life-profile outcomes: total revisited + fulfilled hits)
 * and pass predictionCount / hitCount explicitly instead of mapping event validation only.
 */
export function memoryInputFromChatContext(
  context:
    | {
        validationSummary?: {
          accurateCount?: number;
          driftCount?: number;
          pendingCount?: number;
        } | null;
        confirmedPastEventCount?: number;
        recentEvents?: Array<{ title?: string | null }> | null;
        focusedEvent?: { title?: string | null } | null;
        /** Optional: when chat API starts returning prediction revisit counts */
        predictionCount?: number;
        hitCount?: number;
        predictionStats?: {
          predictionCount?: number;
          hitCount?: number;
        } | null;
      }
    | null
    | undefined,
): MemoryNarrativeInput | null {
  if (!context) return null;

  const explicitPred =
    asNonNegInt(context.predictionStats?.predictionCount) ??
    asNonNegInt(context.predictionCount);
  const explicitHit =
    asNonNegInt(context.predictionStats?.hitCount) ?? asNonNegInt(context.hitCount);

  // Fallback: treated event validations as revisit loop signals (not invented rates).
  const accurate = asNonNegInt(context.validationSummary?.accurateCount) ?? 0;
  const drift = asNonNegInt(context.validationSummary?.driftCount) ?? 0;
  const resolvedFromEvents = accurate + drift;

  const predictionCount =
    explicitPred != null && explicitPred > 0
      ? explicitPred
      : resolvedFromEvents > 0
        ? resolvedFromEvents
        : undefined;

  const hitCount =
    explicitPred != null && explicitPred > 0
      ? explicitHit
      : resolvedFromEvents > 0
        ? accurate
        : undefined;

  const recent = context.recentEvents || [];
  const eventCount =
    asNonNegInt(context.confirmedPastEventCount) ??
    (recent.length > 0 ? recent.length : undefined);

  const lastEventLabel =
    `${context.focusedEvent?.title || recent[0]?.title || ''}`.trim() || undefined;

  if (
    (predictionCount == null || predictionCount <= 0) &&
    (eventCount == null || eventCount <= 0) &&
    !lastEventLabel
  ) {
    return null;
  }

  return {
    predictionCount,
    hitCount,
    eventCount,
    lastEventLabel,
  };
}
