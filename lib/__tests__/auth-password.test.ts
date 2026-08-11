import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  hashPassword,
  isValidPassword,
  isValidUsername,
  verifyPassword,
} from '@/lib/auth-password';

describe('auth password helpers', () => {
  it('validates username rules', () => {
    assert.equal(isValidUsername('ab'), false);
    assert.equal(isValidUsername('abc'), true);
    assert.equal(isValidUsername('user_01'), true);
    assert.equal(isValidUsername('Bad Name'), false);
  });

  it('validates password length', () => {
    assert.equal(isValidPassword('12345'), false);
    assert.equal(isValidPassword('123456'), true);
  });

  it('hashes and verifies password', () => {
    const hash = hashPassword('secret-pass');
    assert.ok(hash.startsWith('scrypt$'));
    assert.equal(verifyPassword('secret-pass', hash), true);
    assert.equal(verifyPassword('wrong', hash), false);
  });
});
