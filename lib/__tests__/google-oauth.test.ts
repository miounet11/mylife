import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  decodeGoogleOAuthState,
  encodeGoogleOAuthState,
  sanitizeNext,
} from '@/lib/google-oauth';

describe('google oauth helpers', () => {
  it('sanitizes next path', () => {
    assert.equal(sanitizeNext('/profile'), '/profile');
    assert.equal(sanitizeNext('https://evil.com'), '/profile');
    assert.equal(sanitizeNext('//evil.com'), '/profile');
    assert.equal(sanitizeNext('/result/abc?x=1'), '/result/abc?x=1');
  });

  it('round-trips signed state', () => {
    process.env.GOOGLE_CLIENT_SECRET = 'test-secret-for-state';
    const state = encodeGoogleOAuthState({
      next: '/membership',
      reportId: 'r1',
      source: 'google',
    });
    const decoded = decodeGoogleOAuthState(state);
    assert.ok(decoded);
    assert.equal(decoded!.next, '/membership');
    assert.equal(decoded!.reportId, 'r1');
    assert.equal(decoded!.source, 'google');
    assert.ok(decoded!.nonce);
  });

  it('rejects tampered state', () => {
    process.env.GOOGLE_CLIENT_SECRET = 'test-secret-for-state';
    const state = encodeGoogleOAuthState({ next: '/profile' });
    const bad = state.slice(0, -2) + 'xx';
    assert.equal(decodeGoogleOAuthState(bad), null);
  });
});
