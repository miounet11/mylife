/**
 * Ops visibility for daily-window email cron last run.
 * Writes a small JSON file under data/ops (falls back to /tmp).
 * No PII beyond aggregate counts — never stores recipient bodies.
 */

import fs from 'node:fs';
import path from 'node:path';

export type DailyWindowLastRun = {
  mode: 'dryRun' | 'live' | 'error' | string;
  success?: boolean;
  campaign?: string;
  sentCount?: number;
  skippedCount?: number;
  candidateCount?: number;
  errors?: string[];
  softFail?: boolean;
  reason?: string;
  timestamp: string;
  /** Tip index / subject only — no HTML body */
  sample?: {
    subject?: string;
    tipIndex?: number;
    dateLabel?: string;
    locale?: string;
  };
  note?: string;
};

function candidatePaths(): string[] {
  const cwd = process.cwd();
  return [
    path.join(cwd, 'data', 'ops', 'daily-window-email-last-run.json'),
    path.join('/tmp', 'life-kline-daily-window-email-last-run.json'),
  ];
}

export function writeDailyWindowLastRun(payload: DailyWindowLastRun): { path: string | null } {
  const body: DailyWindowLastRun = {
    ...payload,
    timestamp: payload.timestamp || new Date().toISOString(),
  };
  // Strip bulky sample fields if someone passes full dryRun payload
  if (body.sample && typeof body.sample === 'object') {
    const s = body.sample as Record<string, unknown>;
    body.sample = {
      subject: typeof s.subject === 'string' ? s.subject : undefined,
      tipIndex: typeof s.tipIndex === 'number' ? s.tipIndex : undefined,
      dateLabel: typeof s.dateLabel === 'string' ? s.dateLabel : undefined,
      locale: typeof s.locale === 'string' ? s.locale : undefined,
    };
  }
  // Never persist full html/text from accidental spread
  const safe = { ...body } as Record<string, unknown>;
  delete safe.html;
  delete safe.text;
  if (safe.sample && typeof safe.sample === 'object') {
    const sm = safe.sample as Record<string, unknown>;
    delete sm.html;
    delete sm.text;
    delete sm.tip;
  }

  const json = `${JSON.stringify(safe, null, 2)}\n`;
  for (const filePath of candidatePaths()) {
    try {
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.writeFileSync(filePath, json, { encoding: 'utf8', mode: 0o600 });
      return { path: filePath };
    } catch {
      // try next
    }
  }
  return { path: null };
}

export function readDailyWindowLastRun(): {
  found: boolean;
  data: DailyWindowLastRun | null;
  path: string | null;
} {
  for (const filePath of candidatePaths()) {
    try {
      if (!fs.existsSync(filePath)) continue;
      const raw = fs.readFileSync(filePath, 'utf8');
      const data = JSON.parse(raw) as DailyWindowLastRun;
      return { found: true, data, path: filePath };
    } catch {
      // try next
    }
  }
  return { found: false, data: null, path: null };
}
