// @ts-nocheck
import { NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { getMembershipStatus, getSavedReports } from '@/lib/membership-store';
import { getMembershipPlan } from '@/lib/membership-plans';
import {
  canFreeUpgradeToAnnual,
  isMembershipFreePromoActive,
  MEMBERSHIP_FREE_PROMO_END,
} from '@/lib/membership-promo';

export const runtime = 'nodejs';

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    let email = (searchParams.get('email') || '').trim().toLowerCase();

    const auth = await getAuthSession();
    const sessionEmail =
      auth.authenticated && auth.user?.email
        ? String(auth.user.email).trim().toLowerCase()
        : '';

    // Prefer session email (registered user). Query email only if it matches session or no session.
    if (sessionEmail) {
      if (email && email !== sessionEmail) {
        return NextResponse.json({ error: '只能查询当前登录邮箱的会员状态' }, { status: 403 });
      }
      email = sessionEmail;
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        {
          error: 'Valid email is required',
          code: 'email_required',
          promoActive: isMembershipFreePromoActive(),
          promoEnds: MEMBERSHIP_FREE_PROMO_END,
        },
        { status: 400 },
      );
    }

    const status = getMembershipStatus(email);
    const savedReports = getSavedReports(email, 3);
    const plan = status.member?.plan ? getMembershipPlan(status.member.plan) : null;
    const isActive = status.member?.status === 'active';
    const promoActive = isMembershipFreePromoActive();

    return NextResponse.json({
      ok: true,
      email,
      authenticated: Boolean(sessionEmail),
      status: status.member?.status || 'unknown',
      plan: status.member?.plan || null,
      planName: plan?.name || null,
      expiresAt: status.member?.expiresAt || null,
      savedReportsCount: status.savedReportsCount,
      latestLeadAt: status.latestLeadAt,
      savedReports: savedReports.map((report) => ({
        id: report.id,
        birthDate: report.birthDate,
        intent: report.intent,
        createdAt: report.createdAt,
      })),
      isActive,
      promoActive,
      promoEnds: MEMBERSHIP_FREE_PROMO_END,
      canUpgradeToAnnual: canFreeUpgradeToAnnual({
        currentPlan: status.member?.plan || null,
        isActive,
      }),
      displayPriceCny: promoActive ? 0 : null,
    });
  } catch (err: any) {
    console.error('[membership status]', err);
    return NextResponse.json({ error: err?.message || 'Internal error' }, { status: 500 });
  }
}