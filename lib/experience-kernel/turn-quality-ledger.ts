/**
 * Per-turn chat quality ledger (X-Tavern-inspired quality engine).
 * Append-only JSONL under data/chat-quality/<day>.jsonl for ops/admin.
 */

import fs from 'fs';
import path from 'path';

export type TurnQualityRecord = {
  id: string;
  at: string;
  sessionKey?: string | null;
  userId?: string | null;
  reportId?: string | null;
  teacherId?: string | null;
  intent?: string | null;
  stream?: boolean;
  llmUsed?: boolean;
  efcOk?: boolean;
  efcIssues?: string[];
  structureFilled?: number | null;
  structureRich?: boolean | null;
  structureThin?: boolean | null;
  structureRepaired?: boolean | null;
  /** Time to first token (stream) or full completion (json) */
  latencyMs?: number | null;
  ttftMs?: number | null;
  answerChars?: number | null;
  questionChars?: number | null;
  memoryBudget?: {
    usedChars?: number;
    layersKept?: string[];
    historyTurnsKept?: number;
  } | null;
  fallbackReason?: string | null;
};

function qualityRoot(): string {
  // Prefer sibling of chat-ledgers so ops finds both under data/
  return (
    process.env.CHAT_QUALITY_DIR ||
    path.join(process.cwd(), 'data', 'chat-ledgers', 'quality')
  );
}

/** List recent day keys (newest first) */
export function listTurnQualityDays(limit = 7): string[] {
  try {
    const dir = qualityRoot();
    if (!fs.existsSync(dir)) return [];
    return fs
      .readdirSync(dir)
      .filter((f) => /^\d{4}-\d{2}-\d{2}\.jsonl$/.test(f))
      .map((f) => f.replace(/\.jsonl$/, ''))
      .sort()
      .reverse()
      .slice(0, limit);
  } catch {
    return [];
  }
}

function dayKey(d = new Date()): string {
  return d.toISOString().slice(0, 10);
}

export function appendTurnQuality(record: Omit<TurnQualityRecord, 'id' | 'at'> & {
  id?: string;
  at?: string;
}): TurnQualityRecord | null {
  try {
    const dir = qualityRoot();
    fs.mkdirSync(dir, { recursive: true });
    const full: TurnQualityRecord = {
      id: record.id || `q_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
      at: record.at || new Date().toISOString(),
      ...record,
    };
    const file = path.join(dir, `${dayKey()}.jsonl`);
    fs.appendFileSync(file, `${JSON.stringify(full)}\n`, 'utf8');
    return full;
  } catch (err) {
    console.warn('[turn-quality] append failed', err instanceof Error ? err.message : err);
    return null;
  }
}

export function summarizeTurnQualityDay(day?: string): {
  day: string;
  count: number;
  llmRate: number;
  efcOkRate: number;
  structureThinRate: number;
  avgLatencyMs: number | null;
  avgTtftMs: number | null;
} {
  const key = day || dayKey();
  const file = path.join(qualityRoot(), `${key}.jsonl`);
  const empty = {
    day: key,
    count: 0,
    llmRate: 0,
    efcOkRate: 0,
    structureThinRate: 0,
    avgLatencyMs: null as number | null,
    avgTtftMs: null as number | null,
  };
  try {
    if (!fs.existsSync(file)) return empty;
    const lines = fs.readFileSync(file, 'utf8').split('\n').filter(Boolean);
    let llm = 0;
    let efcOk = 0;
    let thin = 0;
    let latSum = 0;
    let latN = 0;
    let ttftSum = 0;
    let ttftN = 0;
    for (const line of lines) {
      try {
        const r = JSON.parse(line) as TurnQualityRecord;
        if (r.llmUsed) llm += 1;
        if (r.efcOk !== false) efcOk += 1;
        if (r.structureThin) thin += 1;
        if (typeof r.latencyMs === 'number') {
          latSum += r.latencyMs;
          latN += 1;
        }
        if (typeof r.ttftMs === 'number') {
          ttftSum += r.ttftMs;
          ttftN += 1;
        }
      } catch {
        // skip
      }
    }
    const n = lines.length || 1;
    return {
      day: key,
      count: lines.length,
      llmRate: llm / n,
      efcOkRate: efcOk / n,
      structureThinRate: thin / n,
      avgLatencyMs: latN ? Math.round(latSum / latN) : null,
      avgTtftMs: ttftN ? Math.round(ttftSum / ttftN) : null,
    };
  } catch {
    return empty;
  }
}
