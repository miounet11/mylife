import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeSectionKeys,
  SECTION_RERUN_CATALOG,
} from '@/lib/experience-kernel/section-catalog';
import {
  appendLedgerTurn,
  buildSessionLedgerKey,
  readLedgerTurns,
} from '@/lib/experience-kernel/session-ledger';
import fs from 'fs';
import os from 'os';
import path from 'path';

describe('section catalog', () => {
  it('normalizes and caps agent keys', () => {
    assert.deepEqual(normalizeSectionKeys(['career_wealth', 'nope', 'strategy_advisor']), [
      'career_wealth',
      'strategy_advisor',
    ]);
    assert.equal(normalizeSectionKeys(['a', 'b']).length, 0);
    assert.ok(SECTION_RERUN_CATALOG.length >= 5);
  });
});

describe('session ledger', () => {
  it('appends and reads JSONL turns', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'lk-ledger-'));
    process.env.CHAT_LEDGER_DIR = dir;
    const key = buildSessionLedgerKey({ userId: 'u1', reportId: 'r1' });
    appendLedgerTurn(key, { role: 'user', content: 'hello', reportId: 'r1' });
    appendLedgerTurn(key, { role: 'assistant', content: 'world', reportId: 'r1', efcOk: true });
    const turns = readLedgerTurns(key, 10);
    assert.equal(turns.length, 2);
    assert.equal(turns[0].role, 'user');
    assert.equal(turns[1].content, 'world');
    fs.rmSync(dir, { recursive: true, force: true });
    delete process.env.CHAT_LEDGER_DIR;
  });
});
