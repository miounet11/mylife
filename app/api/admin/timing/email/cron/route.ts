import { NextRequest, NextResponse } from 'next/server';
import {
  sendTimingMonthlyDigestEmail,
  sendTimingSolarTermEmail,
} from '@/lib/email';
import { resolveTimingProfileForReport } from '@/lib/life-timing/resolve-timing-profile';
import path from 'node:path';
import Database from 'better-sqlite3';
import type { TimingPoint } from '@/lib/life-timing/types';

export const maxDuration = 60;

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

  // auto = 根据日期判断要发什么
  const now = new Date();
  const day = now.getDate();
  const monthLabel = `${now.getFullYear()} 年 ${now.getMonth() + 1} 月`;
  const utmCampaign = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-monthly`;

  // 任务 1: 月度运势 — 每月 1-3 号都跑（容错）
  // 任务 2: 节气提醒 — 立春/立夏/立秋/立冬前 7 天
  const dispatchedMonthly = mode === 'monthly' || (mode === 'auto' && day <= 3);
  const dispatchedSolarTerm = mode === 'solar_term' || mode === 'auto';

  const db = new Database(path.join(process.cwd(), 'data', 'lifekline.db'), { readonly: true });
  const subs = db.prepare(`
    SELECT id, email, status, tags FROM email_subscriptions
    WHERE status = 'active'
  `).all() as SubRow[];
  db.close();

  let monthlySent = 0;
  let solarTermSent = 0;
  const errors: string[] = [];

  // 找接近的节气
  const solarTermInfo = findUpcomingSolarTerm(now);

  for (const sub of subs) {
    let tags: string[] = [];
    try {
      tags = sub.tags ? JSON.parse(sub.tags) : [];
    } catch {
      tags = [];
    }

    // 找该订阅用户对应的最新报告
    const fortune = findLatestFortuneByEmail(sub.email);
    if (!fortune) continue;

    // 用共享解析函数：缓存命中读 / 不命中现场 build + 立即填 fallback
    const resolved = resolveTimingProfileForReport(fortune.id);
    if (!resolved) continue;
    const profile = resolved.record;

    // 月度
    if (dispatchedMonthly && tags.includes('timing:monthly') && !alreadySent(sub.email, 'monthly', utmCampaign)) {
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
        errors.push(`monthly[${sub.email}]: ${err instanceof Error ? err.message : err}`);
      }
    }

    // 节气
    if (
      dispatchedSolarTerm &&
      solarTermInfo &&
      tags.includes('timing:solar_terms') &&
      !alreadySent(sub.email, 'solar_term', solarTermInfo.campaign)
    ) {
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
        errors.push(`solar_term[${sub.email}]: ${err instanceof Error ? err.message : err}`);
      }
    }
  }

  return NextResponse.json({
    success: true,
    monthlySent,
    solarTermSent,
    errors,
    mode,
    timestamp: new Date().toISOString(),
  });
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
function alreadySent(email: string, category: string, campaign: string): boolean {
  // 内存快路径
  const key = `${email}|${category}|${campaign}`;
  if (_sentCache.has(key)) return true;
  // 数据库持久化检查
  const db = new Database(path.join(process.cwd(), 'data', 'lifekline.db'), { readonly: true });
  try {
    const row = db.prepare(
      `SELECT id FROM timing_email_log WHERE email = ? AND category = ? AND campaign = ? LIMIT 1`
    ).get(email, category, campaign);
    if (row) {
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
    const id = `tel_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    db.prepare(`
      INSERT OR IGNORE INTO timing_email_log
        (id, email, category, campaign, report_id, status)
      VALUES (?, ?, ?, ?, ?, 'sent')
    `).run(id, email, category, campaign, reportId);
  } catch {
    // ignore
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
