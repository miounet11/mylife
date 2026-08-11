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
      '推荐绑定邮箱：方便接收节点提醒、订阅内容与跨设备找回报告。也可用用户名+密码直接登录，不必每次验证码。',
    'zh-Hant':
      '推薦綁定郵箱：方便接收節點提醒、訂閱內容與跨裝置找回報告。也可用用戶名+密碼直接登入，不必每次驗證碼。',
    en: 'We recommend binding email for reminders, subscriptions, and restoring reports. You can also sign in with username + password — no code every time.',
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
        '支持账号密码、Google 与邮箱验证码。登录状态可长期保持。推荐绑定邮箱，方便订阅与提醒。',
      'zh-Hant':
        '支援帳號密碼、Google 與郵箱驗證碼。登入狀態可長期保持。推薦綁定郵箱，方便訂閱與提醒。',
      en: 'Sign in with password, Google, or email code. Sessions stay signed in. Binding email is recommended for subscriptions and reminders.',
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
    googleSignIn: pick(locale, {
      'zh-CN': '使用 Google 账号继续',
      'zh-Hant': '使用 Google 帳號繼續',
      en: 'Continue with Google',
    }),
    googleOrEmail: pick(locale, {
      'zh-CN': '或使用其他方式',
      'zh-Hant': '或使用其他方式',
      en: 'Or continue another way',
    }),
    tabPassword: pick(locale, {
      'zh-CN': '账号密码',
      'zh-Hant': '帳號密碼',
      en: 'Password',
    }),
    tabRegister: pick(locale, {
      'zh-CN': '注册',
      'zh-Hant': '註冊',
      en: 'Sign up',
    }),
    tabEmail: pick(locale, {
      'zh-CN': '邮箱验证码',
      'zh-Hant': '郵箱驗證碼',
      en: 'Email code',
    }),
    accountLabel: pick(locale, {
      'zh-CN': '用户名或邮箱',
      'zh-Hant': '用戶名或郵箱',
      en: 'Username or email',
    }),
    accountPlaceholder: pick(locale, {
      'zh-CN': 'username 或 your@email.com',
      en: 'username or your@email.com',
    }),
    usernameLabel: pick(locale, {
      'zh-CN': '用户名',
      'zh-Hant': '用戶名',
      en: 'Username',
    }),
    usernamePlaceholder: pick(locale, {
      'zh-CN': '3–32 位字母数字',
      'zh-Hant': '3–32 位字母數字',
      en: '3–32 letters or numbers',
    }),
    passwordLabel: pick(locale, {
      'zh-CN': '密码',
      'zh-Hant': '密碼',
      en: 'Password',
    }),
    passwordPlaceholder: pick(locale, {
      'zh-CN': '至少 6 位',
      'zh-Hant': '至少 6 位',
      en: 'At least 6 characters',
    }),
    emailOptionalLabel: pick(locale, {
      'zh-CN': '邮箱（可选，推荐）',
      'zh-Hant': '郵箱（可選，推薦）',
      en: 'Email (optional, recommended)',
    }),
    emailOptionalHint: pick(locale, {
      'zh-CN': '绑定邮箱方便订阅内容与节点提醒；可之后再绑。',
      'zh-Hant': '綁定郵箱方便訂閱內容與節點提醒；可之後再綁。',
      en: 'Bind email for subscriptions and reminders — you can do it later.',
    }),
    rememberMe: pick(locale, {
      'zh-CN': '保持登录（长期有效，本机更方便）',
      'zh-Hant': '保持登入（長期有效，本機更方便）',
      en: 'Stay signed in (long-lived on this device)',
    }),
    loginButton: pick(locale, {
      'zh-CN': '登录',
      'zh-Hant': '登入',
      en: 'Sign in',
    }),
    registerButton: pick(locale, {
      'zh-CN': '创建账号并登录',
      'zh-Hant': '建立帳號並登入',
      en: 'Create account & sign in',
    }),
    passwordLoginFailed: pick(locale, {
      'zh-CN': '登录失败',
      'zh-Hant': '登入失敗',
      en: 'Sign-in failed',
    }),
    registerFailed: pick(locale, {
      'zh-CN': '注册失败',
      'zh-Hant': '註冊失敗',
      en: 'Sign-up failed',
    }),
    googleError: pick(locale, {
      'zh-CN': 'Google 登录未完成，请重试或改用邮箱验证码',
      'zh-Hant': 'Google 登入未完成，請重試或改用郵箱驗證碼',
      en: 'Google sign-in did not finish. Try again or use an email code.',
    }),
    googleDenied: pick(locale, {
      'zh-CN': '已取消 Google 授权',
      'zh-Hant': '已取消 Google 授權',
      en: 'Google authorization was cancelled.',
    }),
    /** Gmail deliverability is weak on self-hosted SMTP (prod: ~0% code use vs QQ). */
    gmailDeliverabilityHint: pick(locale, {
      'zh-CN':
        'Gmail 用户请务必检查「垃圾邮件 / 促销」分类；若 2 分钟仍未收到，建议改用 QQ 邮箱或企业邮完成绑定。',
      'zh-Hant':
        'Gmail 用戶請務必檢查「垃圾郵件 / 促銷」分類；若 2 分鐘仍未收到，建議改用 QQ 郵箱或企業郵完成綁定。',
      en: 'Gmail often files our code under Spam/Promotions. If nothing in 2 minutes, try QQ or a work email.',
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
    resendWait: pick(locale, {
      'zh-CN': '秒后可重发',
      'zh-Hant': '秒後可重發',
      en: 's until resend',
    }),
    sendFailed: pick(locale, {
      'zh-CN': '发送失败',
      'zh-Hant': '發送失敗',
      en: 'Failed to send code',
    }),
    deliveryFailed: pick(locale, {
      'zh-CN': '邮件未送达，请检查邮箱地址或稍后重试（也请查看垃圾箱）',
      'zh-Hant': '郵件未送達，請檢查郵箱地址或稍後重試（也請查看垃圾箱）',
      en: 'Email not delivered. Check the address or retry shortly (and spam folder).',
    }),
    codeSentDefault: pick(locale, {
      'zh-CN': '验证码已发送',
      'zh-Hant': '驗證碼已發送',
      en: 'Verification code sent',
    }),
    spamHint: pick(locale, {
      'zh-CN': '未收到？请查看垃圾邮件/推广箱，或点重新发送。',
      'zh-Hant': '未收到？請查看垃圾郵件/推廣箱，或點重新發送。',
      en: 'No code? Check spam/promotions, or resend.',
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
