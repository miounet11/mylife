// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import {
  sendTimingMajorEventEmail,
  sendTimingMonthlyDigestEmail,
  sendTimingSolarTermEmail,
} from '@/lib/email';
// Daily sender lives outside protected lib/email.ts (was missing → cron TypeError)
import { sendTimingDailyReminderEmail } from '@/lib/email/timing-daily-reminder';
import { writeTimingEmailLastRun } from '@/lib/email/timing-email-last-run';
import {
  parseEmailSubscriptionMeta,
  type EmailFocusItem,
} from '@/lib/email-subscription-focus';
import { resolveTimingProfileForReport } from '@/lib/life-timing/resolve-timing-profile';
import type { MajorTransition } from '@/lib/life-timing/types';
import path from 'node:path';
import Database from 'better-sqlite3';
import type { TimingPoint } from '@/lib/life-timing/types';
import { recordTimingEmailToInbox } from '@/lib/email-inbox-recorder';
import {
  buildProfileContextPack,
  buildProfilePersonalizationNote,
} from '@/lib/profile-context-builder';
import { buildEmailSubscriptionFocusFooterHtml } from '@/lib/profile-focus-copy';
import { getAppBaseUrl } from '@/lib/env';
import { formatLocalDateKey, generateId } from '@/lib/utils';

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
  meta?: string | null;
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ success: false, error: '无权限' }, { status: 403 });
  }

  const url = new URL(request.url);
  const mode = url.searchParams.get('mode') || 'auto';
  const batchSize = readBatchSize(url.searchParams.get('limit'));

  const now = new Date();
  const day = now.getDate();
  const monthLabel = `${now.getFullYear()} 年 ${now.getMonth() + 1} 月`;
  const utmCampaign = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-monthly`;
  const dailyCampaign = formatLocalDateKey(now);

  const dispatchedMonthly = mode === 'monthly' || (mode === 'auto' && day <= 3);
  const dispatchedSolarTerm = mode === 'solar_term' || mode === 'auto';
  const dispatchedDaily = mode === 'daily' || mode === 'auto';
  const dispatchedMajor = mode === 'major_event' || mode === 'auto';
  const solarTermInfo = findUpcomingSolarTerm(now);
  const campaignKey = [
    dispatchedMonthly ? utmCampaign : '',
    dispatchedSolarTerm && solarTermInfo ? solarTermInfo.campaign : '',
    dispatchedDaily ? `daily:${dailyCampaign}` : '',
    dispatchedMajor ? 'major:auto' : '',
  ].filter(Boolean).join('|') || 'idle';
  const lockKey = `timing_email_cycle:${mode}:${campaignKey}`;
  const lockOwner = `timing-email-${mode}-${generateId()}`;

  if (!acquireTimingEmailLock(lockKey, lockOwner, {
    mode,
    batchSize,
    campaignKey,
  })) {
    const lockedPayload = {
      success: true,
      monthlySent: 0,
      solarTermSent: 0,
      dailySent: 0,
      majorEventSent: 0,
      skippedCount: 0,
      errors: [],
      mode,
      reason: 'already_running',
      timestamp: new Date().toISOString(),
    };
    writeTimingEmailLastRun({
      mode,
      success: true,
      reason: 'already_running',
      campaignKey,
      monthlySent: 0,
      solarTermSent: 0,
      dailySent: 0,
      majorEventSent: 0,
      skippedCount: 0,
      errors: [],
      timestamp: lockedPayload.timestamp,
    });
    return NextResponse.json(lockedPayload);
  }

  try {
    const subs = listActiveSubscriptions(batchSize);

    let monthlySent = 0;
    let solarTermSent = 0;
    let dailySent = 0;
    let majorEventSent = 0;
    let skippedCount = 0;
    const errors: string[] = [];

    for (const sub of subs) {
      let tags: string[] = [];
      try {
        tags = sub.tags ? JSON.parse(sub.tags) : [];
      } catch {
        tags = [];
      }
      const subscriptionMeta = parseEmailSubscriptionMeta(sub.meta);
      const focusItems = subscriptionMeta.focusItems || [];
      const preferredReportId = subscriptionMeta.focusReportId || null;

      const fortune = findLatestFortuneByEmail(sub.email, preferredReportId);
      if (!fortune) {
        skippedCount++;
        continue;
      }

      const resolved = resolveTimingProfileForReport(fortune.id);
      if (!resolved) {
        skippedCount++;
        continue;
      }
      const profile = resolved.record;
      const profileContext = buildProfileContextPack(fortune.userId, fortune.id);
      const profileNote = profileContext ? buildProfilePersonalizationNote(profileContext) : '';
      const profileArchiveFooterHtml = buildEmailSubscriptionFocusFooterHtml({
        focusReportId: fortune.id,
        focusFortuneName: fortune.name || null,
        focusFortuneRelation: fortune.relation || null,
        focusFortuneRelationLabel: fortune.relationLabel || null,
      }, getAppBaseUrl().replace(/\/$/, ''));

      if (dispatchedMonthly && tags.includes('timing:monthly')) {
        const reserved = reserveTimingEmail(sub.email, 'monthly', utmCampaign, fortune.id);
        if (!reserved) {
          skippedCount++;
        } else {
          try {
            const points = pickMonthPoints(profile.next_30_days, profile.next_12_months, now, focusItems);
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
              profileArchiveFooterHtml,
              focusItems,
            });
            markSent(sub.email, 'monthly', utmCampaign, fortune.id);
            recordTimingEmailToInbox({
              email: sub.email,
              reportId: fortune.id,
              category: 'monthly',
              campaign: utmCampaign,
              subject: `${monthLabel} · 月度窗口提醒`,
              preview: points.length > 0
                ? `本月 ${points.length} 个关键时点：${points.slice(0, 2).map((p) => p.userCopy?.title || p.rawReason.slice(0, 12)).join('、')}`
                : `${monthLabel} 整体平稳，建议按日常节奏推进。`,
              bodyText: points.map((p) => `${p.userCopy?.summary || p.rawReason}`).join('\n'),
              focusItems,
            });
            monthlySent++;
          } catch (err) {
            const message = err instanceof Error ? err.message : `${err}`;
            markFailed(sub.email, 'monthly', utmCampaign, fortune.id, message);
            errors.push(`monthly[${sub.email}]: ${message}`);
          }
        }
      }

      if (
        dispatchedSolarTerm
        && solarTermInfo
        && tags.includes('timing:solar_terms')
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
              profileArchiveFooterHtml,
            });
            markSent(sub.email, 'solar_term', solarTermInfo.campaign, fortune.id);
            recordTimingEmailToInbox({
              email: sub.email,
              reportId: fortune.id,
              category: 'solar_term',
              campaign: solarTermInfo.campaign,
              subject: `${solarTermInfo.name}前 7 天 · 节气过渡提醒`,
              preview: stPoint?.userCopy?.summary || `${solarTermInfo.name}前 7 天，注意作息和情绪切换。`,
              focusItems,
            });
            solarTermSent++;
          } catch (err) {
            const message = err instanceof Error ? err.message : `${err}`;
            markFailed(sub.email, 'solar_term', solarTermInfo.campaign, fortune.id, message);
            errors.push(`solar_term[${sub.email}]: ${message}`);
          }
        }
      }

      if (dispatchedDaily && tags.includes('timing:daily')) {
        const reserved = reserveTimingEmail(sub.email, 'daily', dailyCampaign, fortune.id);
        if (!reserved) {
          skippedCount++;
        } else {
          try {
            const dailyContent = buildDailyReminderContent(profile.next_30_days, now, focusItems);
            const personalizedHighlights = profileNote
              ? [profileNote, ...dailyContent.highlights]
              : dailyContent.highlights;
            await sendTimingDailyReminderEmail({
              email: sub.email,
              reportId: fortune.id,
              dateLabel: dailyCampaign,
              focusItems,
              highlights: personalizedHighlights,
              dailyTip: dailyContent.dailyTip,
              cautionTip: dailyContent.cautionTip,
              utmCampaign: dailyCampaign,
              profileArchiveFooterHtml,
            });
            markSent(sub.email, 'daily', dailyCampaign, fortune.id);
            recordTimingEmailToInbox({
              email: sub.email,
              reportId: fortune.id,
              category: 'daily',
              campaign: dailyCampaign,
              subject: `${dailyCampaign} · 今日运势提醒`,
              preview: profileNote
                ? `${profileNote} · ${dailyContent.dailyTip}`
                : `${dailyContent.dailyTip} 注意：${dailyContent.cautionTip}`,
              bodyText: [...personalizedHighlights, `今天适合：${dailyContent.dailyTip}`, `今天注意：${dailyContent.cautionTip}`].join('\n'),
              focusItems,
            });
            dailySent++;
          } catch (err) {
            const message = err instanceof Error ? err.message : `${err}`;
            markFailed(sub.email, 'daily', dailyCampaign, fortune.id, message);
            errors.push(`daily[${sub.email}]: ${message}`);
          }
        }
      }

      if (dispatchedMajor && tags.includes('timing:major_events')) {
        const upcomingMajor = pickUpcomingMajorTransitions(profile.next_5_years, now);
        for (const major of upcomingMajor) {
          const campaign = `${major.campaignPrefix}-${major.year}`;
          const reserved = reserveTimingEmail(sub.email, 'major_event', campaign, fortune.id);
          if (!reserved) {
            skippedCount++;
            continue;
          }

          try {
            await sendTimingMajorEventEmail({
              email: sub.email,
              reportId: fortune.id,
              eventType: major.eventType,
              eventLabel: major.eventLabel,
              summary: major.summary,
              todoSuggestions: major.todoSuggestions,
              avoidSuggestions: major.avoidSuggestions,
              utmCampaign: campaign,
              profileArchiveFooterHtml,
            });
            markSent(sub.email, 'major_event', campaign, fortune.id);
            recordTimingEmailToInbox({
              email: sub.email,
              reportId: fortune.id,
              category: 'major_event',
              campaign,
              subject: `${major.eventLabel} · 命理大事提醒`,
              preview: major.summary,
              bodyText: [
                major.summary,
                `建议：${major.todoSuggestions.join('；')}`,
                `避免：${major.avoidSuggestions.join('；')}`,
              ].join('\n'),
              focusItems,
            });
            majorEventSent++;
          } catch (err) {
            const message = err instanceof Error ? err.message : `${err}`;
            markFailed(sub.email, 'major_event', campaign, fortune.id, message);
            errors.push(`major_event[${sub.email}]: ${message}`);
          }
        }
      }
    }

    const resultPayload = {
      success: true,
      monthlySent,
      solarTermSent,
      dailySent,
      majorEventSent,
      skippedCount,
      errors,
      mode,
      timestamp: new Date().toISOString(),
    };
    const written = writeTimingEmailLastRun({
      mode,
      success: true,
      campaignKey,
      monthlySent,
      solarTermSent,
      dailySent,
      majorEventSent,
      skippedCount,
      errors: errors.slice(0, 20),
      timestamp: resultPayload.timestamp,
    });
    return NextResponse.json({ ...resultPayload, lastRunPath: written.path });
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
      SELECT id, email, status, tags, meta FROM email_subscriptions
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
  now: Date,
  focusItems: EmailFocusItem[],
): TimingPoint[] {
  const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const all = [...next30, ...next12];
  const monthPoints = all.filter((p) => p.startDate.startsWith(ym));

  if (focusItems.length === 0) {
    return monthPoints.slice(0, 5);
  }

  const focusLabels = focusItems.map((item) => item.label);
  const prioritized = monthPoints.filter((point) => {
    const haystack = `${point.userCopy?.title || ''}${point.rawReason}${point.userCopy?.summary || ''}`;
    return focusLabels.some((label) => haystack.includes(label) || label.includes(haystack.slice(0, 6)));
  });

  const merged = [...prioritized, ...monthPoints];
  const unique: TimingPoint[] = [];
  for (const point of merged) {
    if (unique.some((item) => item.id === point.id)) continue;
    unique.push(point);
    if (unique.length >= 5) break;
  }
  return unique;
}

function buildDailyReminderContent(
  next30: TimingPoint[],
  now: Date,
  focusItems: EmailFocusItem[],
) {
  const todayKey = formatLocalDateKey(now);
  const todayPoints = next30.filter((point) => point.startDate <= todayKey && (!point.endDate || point.endDate >= todayKey));
  const focusHighlights = focusItems.map((item) => `${item.label}：${item.value}`);
  const pointHighlights = todayPoints.slice(0, 2).map((point) => (
    point.userCopy?.summary || point.rawReason
  ));

  const highlights = [...focusHighlights, ...pointHighlights].filter(Boolean).slice(0, 3);
  const primaryPoint = todayPoints[0];
  const dailyTip = primaryPoint?.userCopy?.todoSuggestions?.[0]
    || (focusItems[0] ? `今天优先围绕「${focusItems[0].label}」做一个小动作，并记录反馈。` : '今天先稳住节奏，把一件最重要的小事做完。');
  const cautionTip = primaryPoint?.userCopy?.avoidSuggestions?.[0]
    || (focusItems[0] ? `避免在「${focusItems[0].label}」相关事项上冲动决策。` : '避免同时推进多个高成本决定。');

  return {
    highlights,
    dailyTip,
    cautionTip,
  };
}

function pickUpcomingMajorTransitions(
  transitions: MajorTransition[],
  now: Date,
) {
  const horizon = new Date(now);
  horizon.setDate(horizon.getDate() + 30);

  return transitions
    .filter((item) => {
      const eventDate = new Date(`${item.year}-01-01`);
      return eventDate >= now && eventDate <= horizon;
    })
    .map((item) => {
      if (item.type === 'dayun_shift') {
        return {
          year: item.year,
          campaignPrefix: 'dayun-shift',
          eventType: 'dayun_shift' as const,
          eventLabel: '换大运关键期',
          summary: item.rawReason || '大运交接前后，节奏和重心都会发生变化，宜先观察再定策。',
          todoSuggestions: ['梳理未来三年的主线目标', '减少一次性押注式决策'],
          avoidSuggestions: ['仓促换赛道', '忽视身体与情绪信号'],
        };
      }
      if (item.type === 'sui_yun_bing_lin') {
        return {
          year: item.year,
          campaignPrefix: 'sui-yun-binglin',
          eventType: 'sui_yun_bing_lin' as const,
          eventLabel: '岁运并临',
          summary: item.rawReason || '岁运并临是命理上的高敏感阶段，宜稳不宜躁。',
          todoSuggestions: ['把关键决策拆小步验证', '保持规律作息'],
          avoidSuggestions: ['高风险扩张', '情绪化处理冲突'],
        };
      }
      return {
        year: item.year,
        campaignPrefix: 'tai-sui',
        eventType: 'tai_sui' as const,
        eventLabel: '本命年 / 太岁年',
        summary: item.rawReason || '太岁年更适合守正出奇，先稳住基本盘。',
        todoSuggestions: ['减少不必要折腾', '提前准备缓冲资金'],
        avoidSuggestions: ['冲动投资', '过度透支健康'],
      };
    });
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

type FortuneEmailRef = {
  id: string;
  userId: string;
  name?: string | null;
  relation?: string | null;
  relationLabel?: string | null;
};

function mapFortuneEmailRef(row: {
  id: string;
  user_id: string;
  name?: string | null;
  relation?: string | null;
  relation_label?: string | null;
}): FortuneEmailRef {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name || null,
    relation: row.relation || null,
    relationLabel: row.relation_label || null,
  };
}

function findLatestFortuneByEmail(email: string, preferredReportId?: string | null): FortuneEmailRef | null {
  const db = new Database(path.join(process.cwd(), 'data', 'lifekline.db'), { readonly: true });
  try {
    if (preferredReportId) {
      const preferred = db.prepare(
        'SELECT id, user_id, name, relation, relation_label FROM fortunes WHERE id = ? LIMIT 1'
      ).get(preferredReportId) as {
        id: string;
        user_id: string;
        name?: string | null;
        relation?: string | null;
        relation_label?: string | null;
      } | undefined;
      if (preferred) {
        return mapFortuneEmailRef(preferred);
      }
    }

    const user = db.prepare('SELECT id FROM users WHERE email = ?').get(email) as { id: string } | undefined;
    if (!user) {
      return null;
    }
    const fortune = db.prepare(
      'SELECT id, user_id, name, relation, relation_label FROM fortunes WHERE user_id = ? ORDER BY created_at DESC LIMIT 1'
    ).get(user.id) as {
      id: string;
      user_id: string;
      name?: string | null;
      relation?: string | null;
      relation_label?: string | null;
    } | undefined;
    if (!fortune) return null;
    return mapFortuneEmailRef(fortune);
  } finally {
    db.close();
  }
}