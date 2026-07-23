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

/** Shared “why bind email” line — used on login + membership surfaces. */
export function emailBindWhyCopy(locale: SiteLocale) {
  return pick(locale, {
    'zh-CN':
      '绑定邮箱是为了后续方便召回你、跨设备找回报告，并与你保持持续关系（节点提醒、回访建议）。无需密码，验证码即可。',
    'zh-Hant':
      '綁定郵箱是為了後續方便召回你、跨裝置找回報告，並與你保持持續關係（節點提醒、回訪建議）。無需密碼，驗證碼即可。',
    en: 'We bind email so we can reach you later, restore reports across devices, and keep an ongoing relationship (timing notes, follow-ups). No password — code only.',
  });
}

/** Page hero + SEO + header CTA for /login */
export function loginPageCopy(locale: SiteLocale) {
  return {
    metaTitle: pick(locale, {
      'zh-CN': '绑定邮箱｜一键验证 · 保存报告与会员',
      'zh-Hant': '綁定郵箱｜一鍵驗證 · 保存報告與會員',
      en: 'Bind email · one code · save reports & membership',
    }),
    metaDescription: pick(locale, {
      'zh-CN':
        '用邮箱验证码绑定账号：方便后续召回、跨设备回看报告，并保持持续关系。无需密码。',
      'zh-Hant':
        '用郵箱驗證碼綁定帳號：方便後續召回、跨裝置回看報告，並保持持續關係。無需密碼。',
      en: 'Bind with an email code so we can reach you later, reopen reports on any device, and stay in touch. No password.',
    }),
    headerCta: pick(locale, {
      'zh-CN': '0 元领会员',
      'zh-Hant': '0 元領會員',
      en: 'Claim free membership',
    }),
    eyebrow: pick(locale, {
      'zh-CN': '只需邮箱',
      'zh-Hant': '只需郵箱',
      en: 'Email only',
    }),
    title: pick(locale, {
      'zh-CN': '绑定邮箱，方便后续召回',
      'zh-Hant': '綁定郵箱，方便後續召回',
      en: 'Bind email so we can reach you later',
    }),
    description: pick(locale, {
      'zh-CN':
        '验证码登录，无需设密码。绑定后可保存报告、领取会员，并在关键节点收到轻量提醒，保持持续关系。',
      'zh-Hant':
        '驗證碼登入，無需設密碼。綁定後可保存報告、領取會員，並在關鍵節點收到輕量提醒，保持持續關係。',
      en: 'Code sign-in, no password. After binding you can save reports, claim membership, and get light timing notes so we stay in touch.',
    }),
    linkMembership: pick(locale, {
      'zh-CN': '领会员',
      'zh-Hant': '領會員',
      en: 'Claim membership',
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
    emailWhy: emailBindWhyCopy(locale),
    membershipNextHint: pick(locale, {
      'zh-CN':
        '两步完成：① 填邮箱收验证码 ② 回到会员页一点开通（活动期 ¥0，无需支付）。绑定邮箱是为了后续方便召回你、保持持续关系。',
      'zh-Hant':
        '兩步完成：① 填郵箱收驗證碼 ② 回到會員頁一點開通（活動期 ¥0，無需支付）。綁定郵箱是為了後續方便召回你、保持持續關係。',
      en: 'Two steps: ① enter email for a code ② claim membership at ¥0 on the next page (no payment). We bind email so we can reach you later and keep an ongoing relationship.',
    }),
    benefits: [
      pick(locale, {
        'zh-CN': '后续方便召回你',
        'zh-Hant': '後續方便召回你',
        en: 'Reach you later',
      }),
      pick(locale, {
        'zh-CN': '跨设备找回报告',
        'zh-Hant': '跨裝置找回報告',
        en: 'Restore reports anywhere',
      }),
      pick(locale, {
        'zh-CN': '保持持续关系',
        'zh-Hant': '保持持續關係',
        en: 'Stay in touch',
      }),
    ] as const,
    emailLabel: pick(locale, {
      'zh-CN': '常用邮箱',
      'zh-Hant': '常用郵箱',
      en: 'Your email',
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
    sendCodeHint: pick(locale, {
      'zh-CN': '免费 · 无需密码 · 约 1 分钟',
      'zh-Hant': '免費 · 無需密碼 · 約 1 分鐘',
      en: 'Free · no password · about 1 minute',
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
      'zh-CN': '完成绑定',
      'zh-Hant': '完成綁定',
      en: 'Finish binding',
    }),
    loginContinueMembership: pick(locale, {
      'zh-CN': '完成绑定并领取会员',
      'zh-Hant': '完成綁定並領取會員',
      en: 'Bind & claim membership',
    }),
    changeEmail: pick(locale, {
      'zh-CN': '换个邮箱',
      'zh-Hant': '換個郵箱',
      en: 'Use a different email',
    }),
    resendCode: pick(locale, {
      'zh-CN': '重新发送',
      'zh-Hant': '重新發送',
      en: 'Resend code',
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
