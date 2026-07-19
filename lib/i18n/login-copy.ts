/**
 * EN/zh chrome for /login (page hero, SEO, form labels & status).
 * Email OTP request/verify API logic stays in components/auth/login-form — do not translate payloads.
 * zh-Hant falls back to simplified conversion unless a traditional string is provided.
 */

import type { SiteLocale } from '@/lib/i18n/site-locale';
import { toSiteLocaleText } from '@/lib/i18n/site-locale';

type Tri = { 'zh-CN': string; 'zh-Hant'?: string; en: string };

function pick(locale: SiteLocale, map: Tri): string {
  if (locale === 'en') return map.en;
  if (locale === 'zh-Hant') return map['zh-Hant'] || toSiteLocaleText(map['zh-CN'], 'zh-Hant');
  return map['zh-CN'];
}

/** Page hero + SEO + header CTA for /login */
export function loginPageCopy(locale: SiteLocale) {
  return {
    metaTitle: pick(locale, {
      'zh-CN': '登录｜绑定邮箱保存报告',
      'zh-Hant': '登入｜綁定郵箱保存報告',
      en: 'Sign in · Save reports with email',
    }),
    metaDescription: pick(locale, {
      'zh-CN': '使用邮箱验证码登录，保存报告、管理订阅与档案资料。',
      'zh-Hant': '使用郵箱驗證碼登入，保存報告、管理訂閱與檔案資料。',
      en: 'Sign in with an email verification code to save reports, manage membership, and update your profile.',
    }),
    headerCta: pick(locale, {
      'zh-CN': '0 元领会员',
      'zh-Hant': '0 元領會員',
      en: 'Claim free membership',
    }),
    eyebrow: pick(locale, {
      'zh-CN': '账户',
      'zh-Hant': '帳戶',
      en: 'Account',
    }),
    title: pick(locale, {
      'zh-CN': '邮箱验证码登录',
      'zh-Hant': '郵箱驗證碼登入',
      en: 'Sign in with email code',
    }),
    description: pick(locale, {
      'zh-CN': '登录后可保存报告、管理订阅，并在活动期内 0 元开通会员。',
      'zh-Hant': '登入後可保存報告、管理訂閱，並在活動期內 0 元開通會員。',
      en: 'After sign-in you can save reports, manage membership, and claim ¥0 membership during the promo.',
    }),
    linkMembership: pick(locale, {
      'zh-CN': '会员说明',
      'zh-Hant': '會員說明',
      en: 'Membership info',
    }),
    linkAnalyze: pick(locale, {
      'zh-CN': '先排盘',
      'zh-Hant': '先排盤',
      en: 'Chart first',
    }),
    loading: pick(locale, {
      'zh-CN': '加载中…',
      'zh-Hant': '載入中…',
      en: 'Loading…',
    }),
  };
}

/** Client form chrome: labels, buttons, fallbacks (API error body kept as returned). */
export function loginFormCopy(locale: SiteLocale) {
  return {
    membershipNextHint: pick(locale, {
      'zh-CN': '限时免费会员：登录成功后将回到会员页，可 0 元领取季度/年度（无需支付）。',
      'zh-Hant': '限時免費會員：登入成功後將回到會員頁，可 0 元領取季度/年度（無需支付）。',
      en: 'Limited free membership: after sign-in you return to the membership page to claim quarterly or annual at ¥0 (no payment).',
    }),
    emailLabel: pick(locale, {
      'zh-CN': '邮箱',
      'zh-Hant': '郵箱',
      en: 'Email',
    }),
    emailPlaceholder: pick(locale, {
      'zh-CN': 'your@email.com',
      en: 'your@email.com',
    }),
    sendCode: pick(locale, {
      'zh-CN': '发送验证码',
      'zh-Hant': '發送驗證碼',
      en: 'Send code',
    }),
    /** Prefix only — email is rendered bold separately in the form. */
    codeSentPrefix: pick(locale, {
      'zh-CN': '验证码已发送至',
      'zh-Hant': '驗證碼已發送至',
      en: 'Code sent to',
    }),
    codeLabel: pick(locale, {
      'zh-CN': '6 位验证码',
      'zh-Hant': '6 位驗證碼',
      en: '6-digit code',
    }),
    adminPasswordLabel: pick(locale, {
      'zh-CN': '管理员二次密码',
      'zh-Hant': '管理員二次密碼',
      en: 'Admin secondary password',
    }),
    loginContinue: pick(locale, {
      'zh-CN': '登录并继续',
      'zh-Hant': '登入並繼續',
      en: 'Sign in & continue',
    }),
    changeEmail: pick(locale, {
      'zh-CN': '更换邮箱',
      'zh-Hant': '更換郵箱',
      en: 'Use a different email',
    }),
    sendFailed: pick(locale, {
      'zh-CN': '发送失败',
      'zh-Hant': '發送失敗',
      en: 'Failed to send code',
    }),
    codeSentDefault: pick(locale, {
      'zh-CN': '验证码已发送',
      'zh-Hant': '驗證碼已發送',
      en: 'Verification code sent',
    }),
    devCodePrefix: pick(locale, {
      'zh-CN': ' 开发验证码：',
      'zh-Hant': ' 開發驗證碼：',
      en: ' Dev code: ',
    }),
    verifyFailed: pick(locale, {
      'zh-CN': '验证失败',
      'zh-Hant': '驗證失敗',
      en: 'Verification failed',
    }),
  };
}
