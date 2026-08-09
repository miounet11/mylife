/**
 * Server-side client error ledger (JSONL) for chat/page crashes.
 * Complements site_feedback "页面临时出错".
 */

import fs from 'fs';
import path from 'path';

export type ClientErrorEntry = {
  id: string;
  at: string;
  route?: string | null;
  message: string;
  name?: string | null;
  digest?: string | null;
  stack?: string | null;
  componentStack?: string | null;
  userAgent?: string | null;
  userId?: string | null;
  meta?: Record<string, unknown>;
};

function rootDir() {
  return process.cwd();
}

function dayKey(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

export function clientErrorLogPath(day = dayKey()): string {
  return path.join(rootDir(), 'data', 'ops', 'client-errors', `${day}.jsonl`);
}

export function appendClientError(
  entry: Omit<ClientErrorEntry, 'id' | 'at'> & { id?: string; at?: string },
): ClientErrorEntry {
  const full: ClientErrorEntry = {
    id: entry.id || `cerr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    at: entry.at || new Date().toISOString(),
    route: entry.route || null,
    message: `${entry.message || 'unknown'}`.slice(0, 2000),
    name: entry.name || null,
    digest: entry.digest || null,
    stack: entry.stack ? `${entry.stack}`.slice(0, 4000) : null,
    componentStack: entry.componentStack ? `${entry.componentStack}`.slice(0, 2000) : null,
    userAgent: entry.userAgent ? `${entry.userAgent}`.slice(0, 400) : null,
    userId: entry.userId || null,
    meta: entry.meta || undefined,
  };

  try {
    const file = clientErrorLogPath();
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.appendFileSync(file, `${JSON.stringify(full)}\n`, 'utf8');
  } catch (e) {
    console.error('[client-error-log] append failed', e);
  }

  return full;
}

export function listClientErrors(options?: {
  days?: number;
  limit?: number;
  routeIncludes?: string;
}): ClientErrorEntry[] {
  const days = Math.max(1, Math.min(14, options?.days || 3));
  const limit = Math.max(1, Math.min(200, options?.limit || 50));
  const routeFilter = options?.routeIncludes || '';
  const out: ClientErrorEntry[] = [];

  for (let i = 0; i < days; i += 1) {
    const d = new Date(Date.now() - i * 86400000);
    const file = clientErrorLogPath(dayKey(d));
    if (!fs.existsSync(file)) continue;
    try {
      const lines = fs.readFileSync(file, 'utf8').split('\n').filter(Boolean);
      for (let j = lines.length - 1; j >= 0; j -= 1) {
        try {
          const row = JSON.parse(lines[j]) as ClientErrorEntry;
          if (routeFilter && !`${row.route || ''}`.includes(routeFilter)) continue;
          out.push(row);
          if (out.length >= limit) return out;
        } catch {
          // skip bad line
        }
      }
    } catch {
      // skip day
    }
  }

  return out;
}
