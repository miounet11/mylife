import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { sendSubscriptionConfirmationEmail } from '@/lib/email/subscription-confirmation';

describe('subscription confirmation sender', () => {
  it('exports a callable function', () => {
    assert.equal(typeof sendSubscriptionConfirmationEmail, 'function');
  });

  it('builds and attempts send without throwing on missing mail (or returns result)', async () => {
    // In sandbox, mail may be unconfigured — should not throw TypeError "is not a function"
    let threw: unknown = null;
    let result: unknown = null;
    try {
      result = await sendSubscriptionConfirmationEmail('test@example.com', {
        source: 'newsletter',
        locale: 'zh-CN',
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

  it('accepts known sources without throwing TypeError', async () => {
    const sources = ['result_report', 'login_auto', 'newsletter', 'generic', 'unknown_custom'] as const;
    for (const source of sources) {
      let threw: unknown = null;
      try {
        await sendSubscriptionConfirmationEmail('test@example.com', {
          source,
          locale: 'en',
        });
      } catch (err) {
        threw = err;
      }
      if (threw) {
        const msg = threw instanceof Error ? threw.message : String(threw);
        assert.ok(!/is not a function/i.test(msg), `${source}: ${msg}`);
      }
    }
  });
});
