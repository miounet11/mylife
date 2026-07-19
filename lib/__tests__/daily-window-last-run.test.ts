import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, it } from 'node:test';
import {
  readDailyWindowLastRun,
  writeDailyWindowLastRun,
} from '@/lib/email/daily-window-last-run';

describe('daily-window last-run', () => {
  it('writes and reads a compact last-run snapshot', () => {
    const written = writeDailyWindowLastRun({
      mode: 'dryRun',
      success: true,
      campaign: '2099-01-01',
      timestamp: '2099-01-01T00:00:00.000Z',
      sample: {
        subject: 'test subject',
        tipIndex: 3,
        dateLabel: '2099-01-01',
        locale: 'zh-CN',
      },
      note: 'unit test',
    });
    assert.ok(written.path, 'should write to a path');
    assert.ok(fs.existsSync(written.path!));

    const read = readDailyWindowLastRun();
    assert.equal(read.found, true);
    assert.equal(read.data?.mode, 'dryRun');
    assert.equal(read.data?.campaign, '2099-01-01');
    assert.equal(read.data?.sample?.subject, 'test subject');
    // no html leak
    assert.equal((read.data as any)?.html, undefined);
  });
});
