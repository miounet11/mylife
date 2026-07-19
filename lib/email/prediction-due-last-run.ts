/**
 * Ops visibility for prediction-due email cron last run.
 * Compact JSON under data/ops — aggregate counts only, no recipient bodies.
 */

import fs from 'node:fs';
import path from 'node:path';

export type PredictionDueLastRun = {
  success?: boolean;
  campaign?: string;
  sentCount?: number;
  skippedCount?: number;
  candidateRows?: number;
  recipientCount?: number;
  errors?: string[];
  reason?: string;
  timestamp: string;
};

function candidatePaths(): string[] {
  const cwd = process.cwd();
  return [
    path.join(cwd, 'data', 'ops', 'prediction-due-email-last-run.json'),
    path.join('/tmp', 'life-kline-prediction-due-email-last-run.json'),
  ];
}

export function writePredictionDueLastRun(
  payload: PredictionDueLastRun,
): { path: string | null } {
  const body: PredictionDueLastRun = {
    ...payload,
    timestamp: payload.timestamp || new Date().toISOString(),
    errors: Array.isArray(payload.errors) ? payload.errors.slice(0, 20) : [],
  };
  const json = `${JSON.stringify(body, null, 2)}\n`;
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

export function readPredictionDueLastRun(): {
  found: boolean;
  data: PredictionDueLastRun | null;
  path: string | null;
} {
  for (const filePath of candidatePaths()) {
    try {
      if (!fs.existsSync(filePath)) continue;
      const raw = fs.readFileSync(filePath, 'utf8');
      const data = JSON.parse(raw) as PredictionDueLastRun;
      return { found: true, data, path: filePath };
    } catch {
      // try next
    }
  }
  return { found: false, data: null, path: null };
}
