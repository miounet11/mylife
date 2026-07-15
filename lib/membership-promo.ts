/**
 * Limited-time free membership campaign (no payment gateway).
 * Through 2026-12-31 end-of-day (Asia/Shanghai), registered users can activate
 * quarterly/annual membership at ¥0. Quarterly members may free-upgrade to annual.
 */

import type { MembershipPlanId } from '@/lib/membership-plans';
import { MEMBERSHIP_PLANS } from '@/lib/membership-plans';

/** Inclusive end of free campaign (local China calendar day). */
export const MEMBERSHIP_FREE_PROMO_END = '2026-12-31';

export function getMembershipFreePromoEndDate(): Date {
  // End of day CST = 2026-12-31 15:59:59.999 UTC
  return new Date('2026-12-31T15:59:59.999Z');
}

export function isMembershipFreePromoActive(now = new Date()): boolean {
  if (process.env.MEMBERSHIP_FORCE_PAID === 'true') return false;
  if (process.env.MEMBERSHIP_FORCE_FREE === 'true') return true;
  return now.getTime() <= getMembershipFreePromoEndDate().getTime();
}

export function getMembershipPromoCopy(locale: 'zh-CN' | 'zh-Hant' | 'en' = 'zh-CN') {
  if (locale === 'en') {
    return {
      badge: 'Limited free until Dec 31, 2026',
      title: '¥0 membership — no payment required',
      body: 'Register with email, then claim quarterly or annual membership for free. Quarterly members can free-upgrade to annual during this campaign.',
      ctaQuarterly: 'Claim quarterly free',
      ctaAnnual: 'Claim annual free',
      ctaUpgrade: 'Free upgrade to annual',
      needLogin: 'Please sign in with email first (registered account required).',
      priceNote: 'List price shown for reference · checkout is ¥0 during promo',
    };
  }
  if (locale === 'zh-Hant') {
    return {
      badge: '限時免費至 2026-12-31',
      title: '¥0 開通會員 · 無需支付',
      body: '先註冊/登入郵箱，即可 0 元領取季度或年度會員。活動期內季度會員可免費升級年度。',
      ctaQuarterly: '0 元領取季度會員',
      ctaAnnual: '0 元領取年度會員',
      ctaUpgrade: '免費升級年度會員',
      needLogin: '請先郵箱登入（需註冊會員）。',
      priceNote: '標價僅供對照 · 活動期結算為 ¥0',
    };
  }
  return {
    badge: '限时免费至 2026-12-31',
    title: '¥0 开通会员 · 无需支付',
    body: '先注册/登录邮箱，即可 0 元领取季度或年度会员。活动期内季度会员可免费升级年度。',
    ctaQuarterly: '0 元领取季度会员',
    ctaAnnual: '0 元领取年度会员',
    ctaUpgrade: '免费升级年度会员',
    needLogin: '请先邮箱登录（需注册会员）。',
    priceNote: '标价仅供对照 · 活动期结算为 ¥0',
  };
}

export function getDisplayPriceCny(planId: MembershipPlanId, now = new Date()): number {
  if (isMembershipFreePromoActive(now)) return 0;
  return MEMBERSHIP_PLANS.find((p) => p.id === planId)?.priceCny ?? 0;
}

export function canFreeUpgradeToAnnual(input: {
  currentPlan: MembershipPlanId | null | undefined;
  isActive: boolean;
  now?: Date;
}): boolean {
  if (!isMembershipFreePromoActive(input.now)) return false;
  if (!input.isActive) return false;
  return input.currentPlan === 'quarterly';
}
