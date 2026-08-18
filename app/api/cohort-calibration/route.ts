import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { getCurrentUserId } from '@/lib/user-utils';
import { fortuneOperations } from '@/lib/database';
import {
  applyJudgments,
  buildCohortClaims,
  emptyCalibration,
  getCohortFacts,
  mergeCalibrations,
  parseBirthYear,
  resolveCohortKey,
  resolveCohortRegion,
  sanitizeCalibration,
  sanitizeJudgment,
  summarizeCalibration,
} from '@/lib/cohort-lenses';
import { findLifeProfileForUser, upsertLifeProfilesForUser } from '@/lib/life-profile/server-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const hits = new Map<string, { count: number; resetAt: number }>();

function rateLimited(key: string, limit = 20): boolean {
  const now = Date.now();
  const row = hits.get(key);
  if (!row || now > row.resetAt) {
    hits.set(key, { count: 1, resetAt: now + 60_000 });
    return false;
  }
  row.count += 1;
  return row.count > limit;
}

function clientIp(request: NextRequest) {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0]?.trim() || '';
  return request.headers.get('x-real-ip') || 'unknown';
}

function readFortune(reportId: string): any | null {
  const ops = fortuneOperations as {
    getById?: (id: string) => any;
    findById?: (id: string) => any;
  };
  const fn = ops.getById || ops.findById;
  if (typeof fn !== 'function') return null;
  return fn(reportId) || null;
}

function writeFortune(reportId: string, patch: Record<string, unknown>): boolean {
  const update = (fortuneOperations as { update?: (id: string, patch: Record<string, unknown>) => unknown }).update;
  if (typeof update !== 'function') return false;
  update(reportId, patch);
  return true;
}

export async function GET(request: NextRequest) {
  const reportId = `${request.nextUrl.searchParams.get('reportId') || ''}`.trim();
  const birthSignature = `${request.nextUrl.searchParams.get('birthSignature') || ''}`.trim();
  if (!reportId && !birthSignature) {
    return NextResponse.json({ success: false, error: '缺少 reportId' }, { status: 400 });
  }

  let fromReport = null as ReturnType<typeof sanitizeCalibration>;
  if (reportId) {
    const fortune = readFortune(reportId);
    fromReport = sanitizeCalibration(fortune?.analysis?.cohortCalibration);
  }

  let fromProfile = null as ReturnType<typeof sanitizeCalibration>;
  try {
    const session = await getAuthSession();
    if (session.authenticated && session.user?.id) {
      const profile = findLifeProfileForUser(session.user.id, birthSignature || null);
      fromProfile = sanitizeCalibration(profile?.cohortCalibration);
    }
  } catch {
    fromProfile = null;
  }

  const calibration = mergeCalibrations(fromProfile, fromReport);
  return NextResponse.json({
    success: true,
    calibration,
    summary: summarizeCalibration(calibration),
  });
}

export async function POST(request: NextRequest) {
  if (rateLimited(clientIp(request))) {
    return NextResponse.json({ success: false, error: '提交过于频繁，请稍后再试' }, { status: 429 });
  }

  const body = await request.json().catch(() => ({}));
  const reportId = `${body.reportId || ''}`.trim();
  const birthSignature = `${body.birthSignature || ''}`.trim();
  const birthPlace = `${body.birthPlace || ''}`.trim();
  const birthYear =
    Number(body.birthYear) ||
    parseBirthYear(body.birthDate) ||
    null;
  if (!birthYear) {
    return NextResponse.json({ success: false, error: '缺少出生年份' }, { status: 400 });
  }

  const incoming = Array.isArray(body.judgments)
    ? body.judgments
    : body.judgment
      ? [body.judgment]
      : [];
  const judgments = incoming
    .map((item: unknown) => sanitizeJudgment(item))
    .filter(Boolean);
  if (!judgments.length) {
    return NextResponse.json({ success: false, error: '缺少有效判断' }, { status: 400 });
  }

  const region = resolveCohortRegion(birthPlace);
  const cohortKey = resolveCohortKey(birthYear);
  const claims = buildCohortClaims(getCohortFacts(birthYear), region);

  let previous = sanitizeCalibration(body.previous);
  if (reportId) {
    const fortune = readFortune(reportId);
    previous = mergeCalibrations(previous, sanitizeCalibration(fortune?.analysis?.cohortCalibration));
  }

  let userId: string | null = null;
  try {
    userId = await getCurrentUserId();
  } catch {
    userId = null;
  }
  if (!userId) {
    try {
      const session = await getAuthSession();
      if (session.authenticated && session.user?.id) userId = session.user.id;
    } catch {
      userId = null;
    }
  }

  if (userId && birthSignature) {
    const profile = findLifeProfileForUser(userId, birthSignature);
    previous = mergeCalibrations(previous, sanitizeCalibration(profile?.cohortCalibration));
  }

  const next = applyJudgments(
    previous ||
      emptyCalibration({
        birthYear,
        cohortKey,
        region,
      }),
    judgments,
    claims,
  );

  let reportSaved = false;
  if (reportId) {
    const fortune = readFortune(reportId);
    if (fortune) {
      const ownerId = `${fortune.userId || ''}`.trim();
      const canWrite = !ownerId || !userId || ownerId === userId;
      if (canWrite) {
        reportSaved = writeFortune(reportId, {
          analysis: {
            ...(fortune.analysis || {}),
            cohortCalibration: next,
          },
        });
      }
    }
  }

  let profileSaved = 0;
  if (userId && birthSignature) {
    const existing = findLifeProfileForUser(userId, birthSignature);
    const now = new Date().toISOString();
    profileSaved = upsertLifeProfilesForUser(userId, [
      {
        birthSignature,
        yongShen: existing?.yongShen || null,
        pattern: existing?.pattern || '正格',
        keyEvents: existing?.keyEvents || [],
        predictionOutcomes: existing?.predictionOutcomes || [],
        calibrationScore: existing?.calibrationScore || 0,
        calibrationByCategory: existing?.calibrationByCategory || {},
        learningProgress: existing?.learningProgress || {},
        lastReportId: existing?.lastReportId || reportId || '',
        reportCount: existing?.reportCount || 0,
        cohortCalibration: next,
        createdAt: existing?.createdAt || now,
        updatedAt: now,
      },
    ]);
  }

  return NextResponse.json({
    success: true,
    calibration: next,
    summary: summarizeCalibration(next),
    reportSaved,
    profileSaved,
  });
}
