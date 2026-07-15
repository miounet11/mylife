// @ts-nocheck
import { NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { getMembershipPlan } from '@/lib/membership-plans';
import {
  canFreeUpgradeToAnnual,
  isMembershipFreePromoActive,
} from '@/lib/membership-promo';
import {
  activateMembership,
  buildCheckoutUrl,
  createCheckoutSession,
  getMembershipStatus,
} from '@/lib/membership-store';

export const runtime = 'nodejs';

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const emailRaw = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const planId = typeof body.plan === 'string' ? body.plan : '';
    const source = typeof body.source === 'string' ? body.source.slice(0, 64) : 'membership_page';
    const mockCheckout = process.env.MEMBERSHIP_MOCK_CHECKOUT === 'true';
    const freePromo = isMembershipFreePromoActive();

    const auth = await getAuthSession();
    const sessionEmail = auth.authenticated && auth.user?.email
      ? String(auth.user.email).trim().toLowerCase()
      : '';

    // Free promo / production free claim: must be a registered (logged-in) user.
    if (freePromo || process.env.MEMBERSHIP_REQUIRE_AUTH === 'true') {
      if (!auth.authenticated || !sessionEmail || !isValidEmail(sessionEmail)) {
        return NextResponse.json(
          {
            error: '请先邮箱登录后再开通会员',
            code: 'login_required',
            loginUrl: `/login?next=${encodeURIComponent('/membership')}`,
          },
          { status: 401 },
        );
      }
    }

    const email = freePromo || sessionEmail
      ? (sessionEmail || emailRaw)
      : emailRaw;

    // When logged in, only allow claiming for the session email (prevents gifting to arbitrary addresses).
    if (sessionEmail && emailRaw && emailRaw !== sessionEmail) {
      return NextResponse.json(
        { error: '会员只能开通到当前登录邮箱', code: 'email_mismatch' },
        { status: 403 },
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: '请填写有效邮箱' }, { status: 400 });
    }

    const plan = getMembershipPlan(planId);
    if (!plan) {
      return NextResponse.json({ error: '无效的会员方案' }, { status: 400 });
    }

    const current = getMembershipStatus(email);
    const alreadyActive = current.member?.status === 'active';
    const currentPlan = current.member?.plan || null;

    // Already on annual and still active → no need to repurchase
    if (alreadyActive && currentPlan === 'annual' && plan.id === 'annual') {
      return NextResponse.json({
        ok: true,
        mode: 'already_active',
        plan: 'annual',
        email,
        member: current.member,
        message: '你已是年度会员，可直接使用会员权益。',
      });
    }

    // Quarterly free upgrade → annual during promo
    if (
      plan.id === 'annual' &&
      canFreeUpgradeToAnnual({
        currentPlan: currentPlan as 'quarterly' | 'annual' | null,
        isActive: alreadyActive,
      })
    ) {
      const checkout = createCheckoutSession({
        email,
        plan: 'annual',
        source: `${source}_free_upgrade`,
        checkoutUrl: null,
      });
      const member = activateMembership({
        email,
        plan: 'annual',
        source: `${source}_free_upgrade`,
        extendIfLater: true,
      });
      return NextResponse.json({
        ok: true,
        mode: 'activated',
        priceCny: 0,
        promo: true,
        upgradedFrom: 'quarterly',
        sessionId: checkout.id,
        member,
        plan: 'annual',
        email,
        message: '已免费升级为年度会员，立即生效。',
      });
    }

    // Already quarterly and requesting quarterly again
    if (alreadyActive && currentPlan === 'quarterly' && plan.id === 'quarterly') {
      return NextResponse.json({
        ok: true,
        mode: 'already_active',
        plan: 'quarterly',
        email,
        member: current.member,
        canUpgradeToAnnual: canFreeUpgradeToAnnual({
          currentPlan: 'quarterly',
          isActive: true,
        }),
        message: '你已是季度会员。活动期内可免费升级年度会员。',
      });
    }

    const checkoutSession = createCheckoutSession({
      email,
      plan: plan.id,
      source: freePromo ? `${source}_free_promo` : source,
      checkoutUrl: null,
    });

    // Paid gateway URL only when promo is off
    if (!freePromo) {
      const checkoutUrl = buildCheckoutUrl(checkoutSession.id, plan.id, email);
      if (checkoutUrl) {
        return NextResponse.json({
          ok: true,
          mode: 'redirect',
          sessionId: checkoutSession.id,
          checkoutUrl,
          plan: plan.id,
          email,
          priceCny: plan.priceCny,
        });
      }
    }

    // Free promo: immediate activate at ¥0 (also covers mock/dev)
    if (freePromo || mockCheckout || process.env.NODE_ENV === 'development') {
      const member = activateMembership({
        email,
        plan: plan.id,
        source: freePromo ? `${source}_free_promo` : source || 'checkout',
      });

      return NextResponse.json({
        ok: true,
        mode: 'activated',
        priceCny: freePromo ? 0 : plan.priceCny,
        promo: freePromo,
        sessionId: checkoutSession.id,
        member,
        plan: plan.id,
        email,
        message: freePromo
          ? `限时免费：${plan.name}已开通（¥0），可立即使用会员功能。`
          : '开发环境已模拟开通会员。',
      });
    }

    return NextResponse.json({
      ok: true,
      mode: 'waitlist',
      sessionId: checkoutSession.id,
      plan: plan.id,
      email,
      message: '已记录开通意向。支付通道配置完成后，我们会通过邮箱发送开通链接。',
    });
  } catch (err: any) {
    console.error('[membership checkout]', err);
    return NextResponse.json({ error: err?.message || 'Internal error' }, { status: 500 });
  }
}
