import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  readPredictionDueLastRun,
  writePredictionDueLastRun,
} from '@/lib/email/prediction-due-last-run';

describe('prediction-due email last-run', () => {
  it('writes and reads a compact snapshot', () => {
    const written = writePredictionDueLastRun({
      success: true,
      campaign: 'prediction-due-2099-01-02',
      sentCount: 1,
      skippedCount: 2,
      candidateRows: 5,
      recipientCount: 3,
      errors: [],
      timestamp: '2099-01-02T00:00:00.000Z',
    });
    assert.ok(written.path);
    const read = readPredictionDueLastRun();
    assert.equal(read.found, true);
    assert.equal(read.data?.campaign, 'prediction-due-2099-01-02');
    assert.equal(read.data?.sentCount, 1);
    assert.equal(read.data?.skippedCount, 2);
    assert.equal(read.data?.success, true);
  });

  it('caps errors at 20 entries', () => {
    const many = Array.from({ length: 30 }, (_, i) => `err-${i}`);
    writePredictionDueLastRun({
      success: false,
      campaign: 'prediction-due-cap-test',
      sentCount: 0,
      skippedCount: 0,
      errors: many,
      timestamp: '2099-01-03T00:00:00.000Z',
    });
    const read = readPredictionDueLastRun();
    assert.equal(read.found, true);
    assert.equal((read.data?.errors || []).length, 20);
  });
});
