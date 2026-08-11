import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, it, before, afterEach } from 'node:test';
import {
  canUseResend,
  getResendBudgetSnapshot,
  isGmailAddress,
  isResendQuotaError,
  markResendExhausted,
  recordResendSend,
  resendBudgetDayKey,
} from '@/lib/mail-resend-budget';

describe('mail resend budget', () => {
  let tmpDir: string;
  let prev: Record<string, string | undefined> = {};

  before(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'resend-budget-'));
    for (const key of [
      'MAIL_RESEND_BUDGET_DIR',
      'MAIL_RESEND_DAILY_BUDGET',
      'MAIL_RESEND_AUTH_RESERVE',
      'MAIL_RESEND_GMAIL_ONLY',
      'MAIL_RESEND_SKIP_BULK',
    ]) {
      prev[key] = process.env[key];
    }
    process.env.MAIL_RESEND_BUDGET_DIR = tmpDir;
    process.env.MAIL_RESEND_DAILY_BUDGET = '10';
    process.env.MAIL_RESEND_AUTH_RESERVE = '3';
    process.env.MAIL_RESEND_GMAIL_ONLY = 'true';
    process.env.MAIL_RESEND_SKIP_BULK = 'true';
  });

  afterEach(() => {
    const file = path.join(tmpDir, 'resend-daily-budget.json');
    try {
      fs.unlinkSync(file);
    } catch {
      /* ignore */
    }
  });

  it('detects gmail addresses', () => {
    assert.equal(isGmailAddress('a@gmail.com'), true);
    assert.equal(isGmailAddress('a@googlemail.com'), true);
    assert.equal(isGmailAddress('a@qq.com'), false);
    assert.equal(isGmailAddress('a@163.com'), false);
  });

  it('blocks non-gmail when gmail-only', () => {
    const gate = canUseResend({ to: 'user@qq.com', priority: 'auth' });
    assert.equal(gate.allowed, false);
    assert.equal(gate.reason, 'resend_gmail_only');
  });

  it('allows gmail auth and records usage', () => {
    const gate = canUseResend({ to: 'a@gmail.com', priority: 'auth' });
    assert.equal(gate.allowed, true);
    recordResendSend('auth');
    const snap = getResendBudgetSnapshot();
    assert.equal(snap.day, resendBudgetDayKey());
    assert.equal(snap.used, 1);
    assert.equal(snap.authUsed, 1);
  });

  it('skips bulk even for gmail', () => {
    const gate = canUseResend({
      to: 'bulk@gmail.com',
      priority: 'bulk',
    });
    assert.equal(gate.allowed, false);
    assert.equal(gate.reason, 'resend_skip_bulk');
  });

  it('holds auth reserve for non-auth mail', () => {
    // dailyBudget 10, reserve 3 → non-auth may use 7
    for (let i = 0; i < 7; i += 1) {
      const g = canUseResend({ to: 'x@gmail.com', priority: 'transactional' });
      assert.equal(g.allowed, true, `allow #${i + 1}`);
      recordResendSend('transactional');
    }
    const blocked = canUseResend({
      to: 'y@gmail.com',
      priority: 'transactional',
    });
    assert.equal(blocked.allowed, false);
    assert.equal(blocked.reason, 'resend_auth_reserve');
    const authStill = canUseResend({ to: 'z@gmail.com', priority: 'auth' });
    assert.equal(authStill.allowed, true);
  });

  it('marks exhausted on quota error', () => {
    assert.equal(
      isResendQuotaError('You have reached your daily email sending quota.'),
      true,
    );
    markResendExhausted('quota');
    const gate = canUseResend({ to: 'z@gmail.com', priority: 'auth' });
    assert.equal(gate.allowed, false);
    assert.equal(gate.reason, 'resend_budget_exhausted');
  });
});
