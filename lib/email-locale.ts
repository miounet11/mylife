/**
 * Email locale resolution + copy for Life K-Line transactional mail.
 * Supported: zh-CN (简体) · zh-Hant (繁體) · en
 */

export type EmailLocale = 'zh-CN' | 'zh-Hant' | 'en';

export type EmailLocaleInput = {
  language?: string | null;
  locale?: string | null;
  email?: string | null;
  acceptLanguage?: string | null;
};

const TRADITIONAL_HINT =
  /zh[-_]?(tw|hk|mo|hant)|chinese[-_]?trad|繁體|繁体|台灣|台湾|香港|澳門|澳门/i;
const ENGLISH_HINT = /^en\b|english/i;
const SIMPLIFIED_HINT = /zh[-_]?(cn|sg|hans)|chinese[-_]?simp|简体|簡體/i;

/** Normalize arbitrary language tags into one of our three email locales. */
export function normalizeEmailLocale(raw?: string | null): EmailLocale | null {
  if (!raw) return null;
  const v = raw.trim().toLowerCase().replace(/_/g, '-');
  if (!v) return null;
  if (ENGLISH_HINT.test(v) || v === 'en' || v.startsWith('en-')) return 'en';
  if (TRADITIONAL_HINT.test(v) || v === 'zh-tw' || v === 'zh-hk' || v === 'zh-mo' || v === 'zh-hant') {
    return 'zh-Hant';
  }
  if (SIMPLIFIED_HINT.test(v) || v === 'zh' || v === 'zh-cn' || v === 'zh-sg' || v === 'zh-hans') {
    return 'zh-CN';
  }
  if (v.startsWith('zh')) return 'zh-CN';
  return null;
}

function localeFromAcceptLanguage(header?: string | null): EmailLocale | null {
  if (!header) return null;
  const parts = header.split(',').map((part) => {
    const [tag, ...params] = part.trim().split(';');
    const q = params.find((p) => p.trim().startsWith('q='));
    const quality = q ? Number(q.split('=')[1]) || 0 : 1;
    return { tag: tag.trim(), quality };
  });
  parts.sort((a, b) => b.quality - a.quality);
  for (const { tag } of parts) {
    const hit = normalizeEmailLocale(tag);
    if (hit) return hit;
  }
  return null;
}

/** Lightweight email-domain / TLD hints when no explicit preference. */
function localeFromEmail(email?: string | null): EmailLocale | null {
  if (!email) return null;
  const domain = email.trim().toLowerCase().split('@')[1] || '';
  if (!domain) return null;

  if (
    /\.(tw|hk|mo)$/.test(domain)
    || domain.endsWith('.edu.tw')
    || domain.includes('yahoo.com.tw')
    || domain.includes('hotmail.com.tw')
    || domain.includes('seed.net.tw')
    || domain.includes('pchome.com.tw')
    || domain.includes('hinet.net')
  ) {
    return 'zh-Hant';
  }

  // Common English-only regions — soft hint only
  if (
    /\.(uk|us|au|ca|nz|ie|sg)$/.test(domain)
    || domain.endsWith('.edu')
    || domain.endsWith('.edu.au')
  ) {
    return 'en';
  }

  return null;
}

/**
 * Resolve email locale from explicit prefs → Accept-Language → email domain → zh-CN.
 */
export function resolveEmailLocale(input: EmailLocaleInput = {}): EmailLocale {
  return (
    normalizeEmailLocale(input.locale)
    || normalizeEmailLocale(input.language)
    || localeFromAcceptLanguage(input.acceptLanguage)
    || localeFromEmail(input.email)
    || 'zh-CN'
  );
}

/** Convert Simplified Chinese text to Traditional when locale is zh-Hant. */
export function localizeText(text: string, locale: EmailLocale): string {
  if (!text) return text;
  if (locale !== 'zh-Hant') return text;
  try {
    // chinese-conv is available on production; optional locally.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('chinese-conv') as { tify?: (s: string) => string };
    if (typeof mod.tify === 'function') return mod.tify(text);
  } catch {
    // fall through
  }
  return text;
}

/** Map of fixed UI strings used across email chrome + common templates. */
export type EmailChromeCopy = {
  brandMark: string;
  brandSub: string;
  manageSubscription: string;
  unsubscribe: string;
  autoNotice: string;
  legal: string;
  openSite: string;
  defaultGreetingName: string;
  securityTip: string;
  doNotShareCode: string;
  ignoreIfNotYou: string;
  codeExpires: string;
  yourCodeIs: string;
  viewOnSite: string;
};

const CHROME: Record<EmailLocale, EmailChromeCopy> = {
  'zh-CN': {
    brandMark: '人生K线',
    brandSub: 'LIFE KLINE',
    manageSubscription: '管理订阅',
    unsubscribe: '退订',
    autoNotice: '这是一封自动发送的邮件，请勿直接回复。',
    legal: '本邮件仅供 18 岁以上成年人参考与娱乐使用，不构成医疗、法律、投资或重大决策建议。',
    openSite: '打开官网',
    defaultGreetingName: '朋友',
    securityTip: '安全提示',
    doNotShareCode: '请勿将验证码告诉他人',
    ignoreIfNotYou: '如非本人操作，请忽略此邮件',
    codeExpires: '验证码有效期 5 分钟',
    yourCodeIs: '你的验证码',
    viewOnSite: '在站内查看',
  },
  'zh-Hant': {
    brandMark: '人生K線',
    brandSub: 'LIFE KLINE',
    manageSubscription: '管理訂閱',
    unsubscribe: '退訂',
    autoNotice: '這是一封自動發送的郵件，請勿直接回覆。',
    legal: '本郵件僅供 18 歲以上成年人參考與娛樂使用，不構成醫療、法律、投資或重大決策建議。',
    openSite: '打開官網',
    defaultGreetingName: '朋友',
    securityTip: '安全提示',
    doNotShareCode: '請勿將驗證碼告訴他人',
    ignoreIfNotYou: '如非本人操作，請忽略此郵件',
    codeExpires: '驗證碼有效期 5 分鐘',
    yourCodeIs: '你的驗證碼',
    viewOnSite: '在站內查看',
  },
  en: {
    brandMark: 'Life K-Line',
    brandSub: 'LIFE KLINE',
    manageSubscription: 'Manage subscription',
    unsubscribe: 'Unsubscribe',
    autoNotice: 'This is an automated message. Please do not reply directly.',
    legal: 'For adults 18+ for reference and entertainment only. Not medical, legal, investment, or major-decision advice.',
    openSite: 'Visit website',
    defaultGreetingName: 'there',
    securityTip: 'Security tip',
    doNotShareCode: 'Never share this code with anyone',
    ignoreIfNotYou: 'If you did not request this, you can ignore this email',
    codeExpires: 'This code expires in 5 minutes',
    yourCodeIs: 'Your verification code',
    viewOnSite: 'View on site',
  },
};

export function getEmailChrome(locale: EmailLocale): EmailChromeCopy {
  return CHROME[locale] || CHROME['zh-CN'];
}

/** Pick a string from a tri-lingual map, then apply TC conversion if needed. */
export function pickLocaleString(
  locale: EmailLocale,
  map: { 'zh-CN': string; 'zh-Hant'?: string; en?: string }
): string {
  if (locale === 'en' && map.en) return map.en;
  if (locale === 'zh-Hant') {
    return map['zh-Hant'] || localizeText(map['zh-CN'], 'zh-Hant');
  }
  return map['zh-CN'];
}

export function htmlLang(locale: EmailLocale): string {
  if (locale === 'en') return 'en';
  if (locale === 'zh-Hant') return 'zh-Hant';
  return 'zh-CN';
}
