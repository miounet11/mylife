import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  readTimingEmailLastRun,
  writeTimingEmailLastRun,
} from '@/lib/email/timing-email-last-run';

describe('timing email last-run', () => {
  it('writes and reads a compact snapshot', () => {
    const written = writeTimingEmailLastRun({
      mode: 'daily',
      success: true,
      dailySent: 1,
      skippedCount: 2,
      monthlySent: 0,
      solarTermSent: 0,
      majorEventSent: 0,
      errors: [],
      timestamp: '2099-01-02T00:00:00.000Z',
      campaignKey: 'daily:2099-01-02',
    });
    assert.ok(written.path);
    const read = readTimingEmailLastRun();
    assert.equal(read.found, true);
    assert.equal(read.data?.mode, 'daily');
    assert.equal(read.data?.dailySent, 1);
  });
});
