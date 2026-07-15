// ── Review Utilities V6 ──

import type { AgentTaskResult } from '../types';

export function asAgentResult(data: any, mode: 'structured' | 'summary' = 'structured'): any {
  if (mode === 'summary') {
    return { summary: typeof data === 'string' ? data : JSON.stringify(data) };
  }
  return data;
}

export function containsAny(text: string, keywords: string[]): boolean {
  const lower = text.toLowerCase();
  return keywords.some(k => lower.includes(k.toLowerCase()));
}
