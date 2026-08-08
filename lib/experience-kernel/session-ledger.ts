/**
 * Chat session ledger — local-first append log (JSONL-shaped).
 * Mirrors grok-build session authority: user-visible turns are durable and inspectable.
 *
 * Storage: data/chat-ledgers/<sessionKey>.jsonl (created on first append).
 * Does not require database schema changes.
 */

import fs from 'fs';
import path from 'path';

export type LedgerTurnRole = 'user' | 'assistant' | 'system' | 'meta';

export type LedgerTurn = {
  id: string;
  at: string;
  role: LedgerTurnRole;
  content: string;
  reportId?: string | null;
  teacherId?: string | null;
  skillId?: string | null;
  efcOk?: boolean;
  stream?: boolean;
  meta?: Record<string, unknown>;
};

export type LedgerSummary = {
  sessionKey: string;
  reportId?: string | null;
  turnCount: number;
  lastAt?: string;
  path: string;
};

function ledgerRoot(): string {
  const root = process.env.CHAT_LEDGER_DIR || path.join(process.cwd(), 'data', 'chat-ledgers');
  return root;
}

function safeKey(raw: string): string {
  return `${raw || 'anon'}`
    .replace(/[^a-zA-Z0-9._-]+/g, '_')
    .slice(0, 120) || 'anon';
}

export function resolveLedgerPath(sessionKey: string): string {
  return path.join(ledgerRoot(), `${safeKey(sessionKey)}.jsonl`);
}

export function appendLedgerTurn(
  sessionKey: string,
  turn: Omit<LedgerTurn, 'id' | 'at'> & { id?: string; at?: string },
): LedgerTurn | null {
  try {
    const dir = ledgerRoot();
    fs.mkdirSync(dir, { recursive: true });
    const full: LedgerTurn = {
      id: turn.id || `t_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
      at: turn.at || new Date().toISOString(),
      role: turn.role,
      content: `${turn.content || ''}`.slice(0, 12000),
      reportId: turn.reportId ?? null,
      teacherId: turn.teacherId ?? null,
      skillId: turn.skillId ?? null,
      efcOk: turn.efcOk,
      stream: turn.stream,
      meta: turn.meta,
    };
    fs.appendFileSync(resolveLedgerPath(sessionKey), `${JSON.stringify(full)}\n`, 'utf8');
    return full;
  } catch (err) {
    console.warn('[session-ledger] append failed', err instanceof Error ? err.message : err);
    return null;
  }
}

export function readLedgerTurns(sessionKey: string, limit = 80): LedgerTurn[] {
  try {
    const file = resolveLedgerPath(sessionKey);
    if (!fs.existsSync(file)) return [];
    const raw = fs.readFileSync(file, 'utf8');
    const lines = raw.split('\n').filter(Boolean);
    const slice = lines.slice(-Math.max(1, Math.min(limit, 200)));
    const out: LedgerTurn[] = [];
    for (const line of slice) {
      try {
        out.push(JSON.parse(line) as LedgerTurn);
      } catch {
        // skip corrupt
      }
    }
    return out;
  } catch {
    return [];
  }
}

export function summarizeLedger(sessionKey: string): LedgerSummary {
  const turns = readLedgerTurns(sessionKey, 200);
  const last = turns[turns.length - 1];
  return {
    sessionKey: safeKey(sessionKey),
    reportId: last?.reportId ?? null,
    turnCount: turns.length,
    lastAt: last?.at,
    path: resolveLedgerPath(sessionKey),
  };
}

/** Prefer report-bound key so multi-device same report shares continuity when guest id stable */
export function buildSessionLedgerKey(params: {
  userId?: string | null;
  reportId?: string | null;
  clientKey?: string | null;
}): string {
  const user = `${params.userId || ''}`.trim();
  const report = `${params.reportId || ''}`.trim();
  const client = `${params.clientKey || ''}`.trim();
  if (user && report) return `u_${user}__r_${report}`;
  if (user) return `u_${user}`;
  if (client && report) return `c_${client}__r_${report}`;
  if (client) return `c_${client}`;
  return `anon_${Date.now()}`;
}
