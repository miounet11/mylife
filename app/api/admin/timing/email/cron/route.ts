import { NextRequest, NextResponse } from 'next/server';
import {
  sendTimingMonthlyDigestEmail,
  sendTimingSolarTermEmail,
} from '@/lib/email';
import { resolveTimingProfileForReport } from '@/lib/life-timing/resolve-timing-profile';
import path from 'node:path';
import Database from 'better-sqlite3';
import type { TimingPoint } from '@/lib/life-timing/types';
import { generateId } from '@/lib/utils';

export const maxDuration = 60;

const LOCK_TTL_MS = 1000 * 60 * 5;
const RESERVATION_TTL_MS = 1000 * 60 * 15;
const DEFAULT_BATCH_SIZE = 50;
const MAX_BATCH_SIZE = 100;

function isAuthorized(request: NextRequest): boolean {
  const expected = process.env.TIMING_EMAIL_CRON_TOKEN || '';
  if (!expected) return false;
  const provided = request.headers.get('x-timing-email-cron-token') || '';
  return provided === expected;
}

interface SubRow {
  id: string;
  email: string;
  status: string;
  tags: string;
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ success: false, error: '无权限' }, { status: 403 });
  }

  const url = new URL(request.url);
  const mode = url.searchParams.get('mode') || 'auto';
  const batchSize = readBatchSize(url.searchParams.get('limit'));

  // auto = 根据日期判断要发什么
  const now = new Date();
  const day = now.getDate();
  const monthLabel = `${now.getFullYear()} 年 ${now.getMonth() + 1} 月`;
  const utmCampaign = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-monthly`;

  // 任务 1: 月度运势 — 每月 1-3 号都跑（容错）
  // 任务 2: 节气提醒 — 立春/立夏/立秋/立冬前 7 天
  const dispatchedMonthly = mode === 'monthly' || (mode === 'auto' && day <= 3);
  const dispatchedSolarTerm = mode === 'solar_term' || mode === 'auto';
  const solarTermInfo = findUpcomingSolarTerm(now);
  const campaignKey = [
    dispatchedMonthly ? utmCampaign : '',
    dispatchedSolarTerm && solarTermInfo ? solarTermInfo.campaign : '',
  ].filter(Boolean).join('|') || 'idle';
  const lockKey = `timing_email_cycle:${mode}:${campaignKey}`;
  const lockOwner = `timing-email-${mode}-${generateId()}`;

  if (!acquireTimingEmailLock(lockKey, lockOwner, {
    mode,
    batchSize,
    campaignKey,
  })) {
    return NextResponse.json({
      success: true,
      monthlySent: 0,
      solarTermSent: 0,
      skippedCount: 0,
      errors: [],
      mode,
      reason: 'already_running',
      timestamp: new Date().toISOString(),
    });
  }

  try {
    const subs = listActiveSubscriptions(batchSize);

    let monthlySent = 0;
    let solarTermSent = 0;
    let skippedCount = 0;
    const errors: string[] = [];

    for (const sub of subs) {
      let tags: string[] = [];
      try {
        tags = sub.tags ? JSON.parse(sub.tags) : [];
      } catch {
        tags = [];
      }

      // 找该订阅用户对应的最新报告
      const fortune = findLatestFortuneByEmail(sub.email);
      if (!fortune) {
        skippedCount++;
        continue;
      }

      // 用共享解析函数：缓存命中读 / 不命中现场 build + 立即填 fallback
      const resolved = resolveTimingProfileForReport(fortune.id);
      if (!resolved) {
        skippedCount++;
        continue;
      }
      const profile = resolved.record;

      // 月度
      if (dispatchedMonthly && tags.includes('timing:monthly')) {
        const reserved = reserveTimingEmail(sub.email, 'monthly', utmCampaign, fortune.id);
        if (!reserved) {
          skippedCount++;
        } else {
          try {
            const points = pickMonthPoints(profile.next_30_days, profile.next_12_months, now);
            await sendTimingMonthlyDigestEmail({
              email: sub.email,
              reportId: fortune.id,
              monthLabel,
              points: points.map((p) => ({
                date: p.endDate ? `${p.startDate} 至 ${p.endDate}` : p.startDate,
                title: p.userCopy?.title || p.rawReason.slice(0, 24),
                summary: p.userCopy?.summary || p.rawReason,
                todoSuggestions: p.userCopy?.todoSuggestions,
                avoidSuggestions: p.userCopy?.avoidSuggestions,
              })),
              utmCampaign,
              highlightFirstId: points[0]?.id,
            });
            markSent(sub.email, 'monthly', utmCampaign, fortune.id);
            monthlySent++;
          } catch (err) {
            const message = err instanceof Error ? err.message : `${err}`;
            markFailed(sub.email, 'monthly', utmCampaign, fortune.id, message);
            errors.push(`monthly[${sub.email}]: ${message}`);
          }
        }
      }

      // 节气
      if (
        dispatchedSolarTerm &&
        solarTermInfo &&
        tags.includes('timing:solar_terms')
      ) {
        const reserved = reserveTimingEmail(sub.email, 'solar_term', solarTermInfo.campaign, fortune.id);
        if (!reserved) {
          skippedCount++;
        } else {
          try {
            const stPoint = profile.next_30_days.find((p) => p.context.termName === solarTermInfo.name);
            await sendTimingSolarTermEmail({
              email: sub.email,
              reportId: fortune.id,
              termName: solarTermInfo.name,
              termDate: solarTermInfo.date,
              summary: stPoint?.userCopy?.summary || `${solarTermInfo.name}前 7 天，命理上能量切换的关键时段。注意作息和情绪。`,
              todoSuggestions: stPoint?.userCopy?.todoSuggestions || ['早睡早起', '减少应酬'],
              avoidSuggestions: stPoint?.userCopy?.avoidSuggestions || ['熬夜决策', '签长期合约'],
              utmCampaign: solarTermInfo.campaign,
            });
            markSent(sub.email, 'solar_term', solarTermInfo.campaign, fortune.id);
            solarTermSent++;
          } catch (err) {
            const message = err instanceof Error ? err.message : `${err}`;
            markFailed(sub.email, 'solar_term', solarTermInfo.campaign, fortune.id, message);
            errors.push(`solar_term[${sub.email}]: ${message}`);
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      monthlySent,
      solarTermSent,
      skippedCount,
      errors,
      mode,
      timestamp: new Date().toISOString(),
    });
  } finally {
    releaseTimingEmailLock(lockKey, lockOwner);
  }
}

function readBatchSize(rawLimit: string | null): number {
  const raw = rawLimit || process.env.TIMING_EMAIL_BATCH_SIZE || '';
  const parsed = raw ? Number(raw) : DEFAULT_BATCH_SIZE;
  if (!Number.isFinite(parsed)) {
    return DEFAULT_BATCH_SIZE;
  }

  return Math.min(MAX_BATCH_SIZE, Math.max(1, Math.floor(parsed)));
}

function listActiveSubscriptions(limit: number): SubRow[] {
  const db = new Database(path.join(process.cwd(), 'data', 'lifekline.db'), { readonly: true });
  try {
    return db.prepare(`
      SELECT id, email, status, tags FROM email_subscriptions
      WHERE status = 'active'
      ORDER BY datetime(updated_at) ASC, email ASC
      LIMIT ?
    `).all(limit) as SubRow[];
  } finally {
    db.close();
  }
}

function acquireTimingEmailLock(key: string, owner: string, meta?: Record<string, unknown>): boolean {
  if (process.env.TIMING_EMAIL_DISABLE_LOCK === '1') {
    return true;
  }

  const now = new Date();
  const nowIso = now.toISOString();
  const expiresAt = new Date(now.getTime() + LOCK_TTL_MS).toISOString();
  const db = new Database(path.join(process.cwd(), 'data', 'lifekline.db'));
  try {
    const result = db.prepare(`
      INSERT INTO system_locks (key, owner, locked_at, expires_at, meta, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET
        owner = excluded.owner,
        locked_at = excluded.locked_at,
        expires_at = excluded.expires_at,
        meta = excluded.meta,
        updated_at = excluded.updated_at
      WHERE datetime(system_locks.expires_at) <= datetime(?)
    `).run(
      key,
      owner,
      nowIso,
      expiresAt,
      JSON.stringify(meta || {}),
      nowIso,
      nowIso
    );
    return result.changes > 0;
  } finally {
    db.close();
  }
}

function releaseTimingEmailLock(key: string, owner: string) {
  if (process.env.TIMING_EMAIL_DISABLE_LOCK === '1') {
    return;
  }

  const db = new Database(path.join(process.cwd(), 'data', 'lifekline.db'));
  try {
    db.prepare(`DELETE FROM system_locks WHERE key = ? AND owner = ?`).run(key, owner);
  } finally {
    db.close();
  }
}

function findUpcomingSolarTerm(now: Date): { name: string; date: string; campaign: string } | null {
  // 检查未来 7 天内是否有立春/立夏/立秋/立冬
  const TERMS = ['立春', '立夏', '立秋', '立冬'] as const;
  // @ts-ignore
  const { Solar } = require('lunar-javascript');
  for (let i = 0; i <= 14; i++) {
    const checkDate = new Date(now);
    checkDate.setDate(checkDate.getDate() + i);
    const solar = Solar.fromYmd(checkDate.getFullYear(), checkDate.getMonth() + 1, checkDate.getDate());
    const jq = solar.getLunar().getJieQi();
    if (TERMS.includes(jq) && i >= 0 && i <= 7) {
      const dateStr = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`;
      return {
        name: jq,
        date: dateStr,
        campaign: `${dateStr}-${jq}`,
      };
    }
  }
  return null;
}

function pickMonthPoints(
  next30: TimingPoint[],
  next12: TimingPoint[],
  now: Date
): TimingPoint[] {
  // 取本月所有时点
  const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const all = [...next30, ...next12];
  return all.filter((p) => p.startDate.startsWith(ym)).slice(0, 5);
}

const _sentCache = new Set<string>();
function reserveTimingEmail(email: string, category: string, campaign: string, reportId: string | null): boolean {
  const key = `${email}|${category}|${campaign}`;
  if (_sentCache.has(key)) return false;

  const db = new Database(path.join(process.cwd(), 'data', 'lifekline.db'));
  try {
    const staleReservedBefore = new Date(Date.now() - RESERVATION_TTL_MS).toISOString();
    const existing = db.prepare(
      `SELECT status, sent_at FROM timing_email_log WHERE email = ? AND category = ? AND campaign = ? LIMIT 1`
    ).get(email, category, campaign) as { status?: string; sent_at?: string } | undefined;

    if (existing?.status === 'sent') {
      _sentCache.add(key);
      return false;
    }

    if (existing?.status === 'reserved' && (!existing.sent_at || new Date(existing.sent_at).getTime() > Date.now() - RESERVATION_TTL_MS)) {
      return false;
    }

    if (existing?.status === 'error' || existing?.status === 'reserved') {
      const result = db.prepare(`
        UPDATE timing_email_log
        SET status = 'reserved',
            report_id = ?,
            sent_at = datetime('now'),
            meta = ?
        WHERE email = ? AND category = ? AND campaign = ?
          AND (status = 'error' OR (status = 'reserved' AND datetime(sent_at) <= datetime(?)))
      `).run(reportId, JSON.stringify({ reservedAt: new Date().toISOString() }), email, category, campaign, staleReservedBefore);
      if (result.changes > 0) {
        _sentCache.add(key);
        return true;
      }
      return false;
    }

    const id = `tel_${generateId()}`;
    const result = db.prepare(`
      INSERT OR IGNORE INTO timing_email_log
        (id, email, category, campaign, report_id, status, meta)
      VALUES (?, ?, ?, ?, ?, 'reserved', ?)
    `).run(id, email, category, campaign, reportId, JSON.stringify({ reservedAt: new Date().toISOString() }));
    if (result.changes > 0) {
      _sentCache.add(key);
      return true;
    }
    return false;
  } finally {
    db.close();
  }
}

function markSent(email: string, category: string, campaign: string, reportId: string | null) {
  const key = `${email}|${category}|${campaign}`;
  _sentCache.add(key);
  const db = new Database(path.join(process.cwd(), 'data', 'lifekline.db'));
  try {
    db.prepare(`
      UPDATE timing_email_log
      SET status = 'sent',
          report_id = ?,
          sent_at = datetime('now'),
          meta = ?
      WHERE email = ? AND category = ? AND campaign = ?
    `).run(reportId, JSON.stringify({ sentAt: new Date().toISOString() }), email, category, campaign);
  } finally {
    db.close();
  }
}

function markFailed(email: string, category: string, campaign: string, reportId: string | null, error: string) {
  const key = `${email}|${category}|${campaign}`;
  _sentCache.delete(key);
  const db = new Database(path.join(process.cwd(), 'data', 'lifekline.db'));
  try {
    db.prepare(`
      UPDATE timing_email_log
      SET status = 'error',
          report_id = ?,
          meta = ?
      WHERE email = ? AND category = ? AND campaign = ? AND status = 'reserved'
    `).run(
      reportId,
      JSON.stringify({
        failedAt: new Date().toISOString(),
        error: error.slice(0, 500),
      }),
      email,
      category,
      campaign
    );
  } finally {
    db.close();
  }
}

function findLatestFortuneByEmail(email: string): { id: string; userId: string } | null {
  // 通过 user.email 找到 user，再找最新 fortune
  const db = new Database(path.join(process.cwd(), 'data', 'lifekline.db'), { readonly: true });
  try {
    const user = db.prepare('SELECT id FROM users WHERE email = ?').get(email) as { id: string } | undefined;
    if (!user) {
      // guest 订阅用户：找有这个 email 的 newsletter source 关联的最近 report
      // 简化处理：跳过没注册用户的订阅
      return null;
    }
    const fortune = db.prepare(
      'SELECT id, user_id FROM fortunes WHERE user_id = ? ORDER BY created_at DESC LIMIT 1'
    ).get(user.id) as { id: string; user_id: string } | undefined;
    if (!fortune) return null;
    return { id: fortune.id, userId: fortune.user_id };
  } finally {
    db.close();
  }
}
