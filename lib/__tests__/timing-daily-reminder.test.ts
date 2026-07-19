import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { sendTimingDailyReminderEmail } from '@/lib/email/timing-daily-reminder';

describe('timing daily reminder sender', () => {
  it('exports a callable function', () => {
    assert.equal(typeof sendTimingDailyReminderEmail, 'function');
  });

  it('builds and attempts send without throwing on missing mail (or returns result)', async () => {
    // In sandbox, mail may be unconfigured — should not throw TypeError "is not a function"
    let threw: unknown = null;
    let result: unknown = null;
    try {
      result = await sendTimingDailyReminderEmail({
        email: 'test@example.com',
        reportId: 'rep_test',
        dateLabel: '2026-07-19',
        focusItems: [{ key: 'k', label: '事业', value: '稳住节奏', category: 'action' }],
        highlights: ['关注点：稳住节奏'],
        dailyTip: '先完成一件小事',
        cautionTip: '避免并行高成本决策',
        utmCampaign: '2026-07-19',
      });
    } catch (err) {
      threw = err;
    }
    // Either resolves (ok/fail object) or throws mail config — never "is not a function"
    if (threw) {
      const msg = threw instanceof Error ? threw.message : String(threw);
      assert.ok(!/is not a function/i.test(msg), msg);
    } else {
      assert.ok(result !== undefined);
    }
  });
});
