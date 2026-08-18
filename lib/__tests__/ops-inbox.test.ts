import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { classifyFeedbackSignal, feedbackSignalLabel } from '@/lib/feedback-signal';
import { formatInboxAge } from '@/lib/ops-inbox-view';

describe('ops inbox helpers', () => {
  it('classifies generation-layer notes as cohort', () => {
    assert.equal(classifyFeedbackSignal('世代校准：金钱思维不像'), 'cohort');
    assert.equal(feedbackSignalLabel('cohort'), '世代校准');
  });

  it('formats recency without inventing a date', () => {
    assert.equal(formatInboxAge(null), '尚无记录');
    const hourAgo = new Date(Date.now() - 90 * 60 * 1000).toISOString();
    assert.match(formatInboxAge(hourAgo), /小时前/);
    const threeDays = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
    assert.match(formatInboxAge(threeDays), /天前/);
  });
});
