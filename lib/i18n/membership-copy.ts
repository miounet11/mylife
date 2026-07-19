/**
 * EN/zh chrome for /membership (page hero, SEO, client steps & status).
 * Pricing/promo logic stays in lib/membership-plans + lib/membership-promo.
 * Honest free-promo framing — not superstition marketing.
 */

import type { SiteLocale } from '@/lib/i18n/site-locale';
import { toSiteLocaleText } from '@/lib/i18n/site-locale';
import type { MembershipPlanId } from '@/lib/membership-plans';
import { MEMBERSHIP_FREE_PROMO_END } from '@/lib/membership-promo';

type Tri = { 'zh-CN': string; 'zh-Hant'?: string; en: string };

function pick(locale: SiteLocale, map: Tri): string {
  if (locale === 'en') return map.en;
  if (locale === 'zh-Hant') return map['zh-Hant'] || toSiteLocaleText(map['zh-CN'], 'zh-Hant');
  return map['zh-CN'];
}

/** Page hero + SEO + header CTA for /membership */
export function membershipPageCopy(locale: SiteLocale) {
  return {
    metaTitle: pick(locale, {
      'zh-CN': '限时免费会员｜0 元开通季度/年度 · 邮箱注册即可',
      'zh-Hant': '限時免費會員｜0 元開通季度/年度 · 郵箱註冊即可',
      en: 'Free membership promo | Claim quarterly or annual at ¥0 with email signup',
    }),
    metaDescription: pick(locale, {
      'zh-CN':
        '2026-12-31 前限时免费：注册登录后 0 元开通季度或年度会员，享受完整报告与回看权益；季度可免费升级年度。',
      'zh-Hant':
        '2026-12-31 前限時免費：註冊登入後 0 元開通季度或年度會員，享受完整報告與回看權益；季度可免費升級年度。',
      en: 'Limited free until Dec 31, 2026: sign in with email, claim quarterly or annual membership at ¥0 for full reports and replay. Free upgrade from quarterly to annual during the promo.',
    }),
    metaKeywords: [
      '免费会员',
      '八字会员',
      '限时免费',
      '邮箱保存八字报告',
      '人生K线会员',
      'free membership',
      'bazi membership',
      'email report save',
    ],
    headerCta: pick(locale, {
      'zh-CN': '登录领会员',
      'zh-Hant': '登入領會員',
      en: 'Sign in to claim',
    }),
    eyebrow: pick(locale, {
      'zh-CN': `限时免费至 ${MEMBERSHIP_FREE_PROMO_END}`,
      'zh-Hant': `限時免費至 ${MEMBERSHIP_FREE_PROMO_END}`,
      en: `Limited free until ${MEMBERSHIP_FREE_PROMO_END}`,
    }),
    title: pick(locale, {
      'zh-CN': '¥0 开通会员',
      'zh-Hant': '¥0 開通會員',
      en: '¥0 membership',
    }),
    description: pick(locale, {
      'zh-CN': '登录邮箱后可 0 元开通季度或年度会员；季度可免费升级年度。开通后立即生效。',
      'zh-Hant': '登入郵箱後可 0 元開通季度或年度會員；季度可免費升級年度。開通後立即生效。',
      en: 'Sign in with email to claim quarterly or annual membership at ¥0. Free upgrade from quarterly to annual. Activates immediately.',
    }),
    stripTitle: pick(locale, {
      'zh-CN': '会员能做什么',
      'zh-Hant': '會員能做什麼',
      en: 'What membership unlocks',
    }),
    jsonLdPageName: pick(locale, {
      'zh-CN': 'Life K-Line 会员完整报告',
      'zh-Hant': 'Life K-Line 會員完整報告',
      en: 'Life K-Line membership full reports',
    }),
    jsonLdPageDescription: pick(locale, {
      'zh-CN': '开通会员解锁完整八字命理分析，并用邮箱保存报告。',
      'zh-Hant': '開通會員解鎖完整八字命理分析，並用郵箱保存報告。',
      en: 'Membership unlocks full Bazi structure reports and email-saved history.',
    }),
    jsonLdProductName: pick(locale, {
      'zh-CN': 'Life K-Line 年度会员',
      'zh-Hant': 'Life K-Line 年度會員',
      en: 'Life K-Line annual membership',
    }),
    jsonLdProductDescription: pick(locale, {
      'zh-CN': '完整事业财运婚恋健康分析、流年大运详解、邮箱永久保存报告。',
      'zh-Hant': '完整事業財運婚戀健康分析、流年大運詳解、郵箱永久保存報告。',
      en: 'Full career, wealth, relationship, and health analysis; yearly and luck-cycle detail; email-saved reports.',
    }),
    jsonLdOfferDescription: pick(locale, {
      'zh-CN': '限时免费至 2026-12-31，需邮箱登录后领取',
      'zh-Hant': '限時免費至 2026-12-31，需郵箱登入後領取',
      en: 'Limited free until Dec 31, 2026 — claim after email sign-in',
    }),
    jsonLdInLanguage: locale === 'en' ? 'en' : locale === 'zh-Hant' ? 'zh-Hant' : 'zh-CN',
  };
}

/** Localized plan name / period label (pricing still from MEMBERSHIP_PLANS). */
export function membershipPlanChrome(locale: SiteLocale, planId: MembershipPlanId) {
  if (planId === 'quarterly') {
    return {
      name: pick(locale, {
        'zh-CN': '季度会员',
        'zh-Hant': '季度會員',
        en: 'Quarterly',
      }),
      periodLabel: pick(locale, {
        'zh-CN': '/ 季',
        'zh-Hant': '/ 季',
        en: '/ quarter',
      }),
    };
  }
  return {
    name: pick(locale, {
      'zh-CN': '年度会员',
      'zh-Hant': '年度會員',
      en: 'Annual',
    }),
    periodLabel: pick(locale, {
      'zh-CN': '/ 年',
      'zh-Hant': '/ 年',
      en: '/ year',
    }),
  };
}

/** Client UI: steps, status, tiers, FAQ, CTAs, messages */
export function membershipClientCopy(locale: SiteLocale) {
  const dateLocale = locale === 'en' ? 'en-US' : locale === 'zh-Hant' ? 'zh-TW' : 'zh-CN';

  return {
    dateLocale,

    // Promo steps (ordered list under promo banner)
    promoSteps: [
      pick(locale, {
        'zh-CN': '邮箱登录（注册会员）',
        'zh-Hant': '郵箱登入（註冊會員）',
        en: 'Sign in with email (register if needed)',
      }),
      pick(locale, {
        'zh-CN': '选择季度 / 年度',
        'zh-Hant': '選擇季度 / 年度',
        en: 'Choose quarterly or annual',
      }),
      pick(locale, {
        'zh-CN': '¥0 开通，立即生效',
        'zh-Hant': '¥0 開通，立即生效',
        en: 'Claim at ¥0 — active immediately',
      }),
    ] as const,

    loginFirst: pick(locale, {
      'zh-CN': '先登录 / 注册邮箱',
      'zh-Hant': '先登入 / 註冊郵箱',
      en: 'Sign in / register with email first',
    }),
    needLoginHint: pick(locale, {
      'zh-CN': '未登录无法领取',
      'zh-Hant': '未登入無法領取',
      en: 'Sign-in required to claim',
    }),
    loggedInReady: (email: string) =>
      pick(locale, {
        'zh-CN': `已登录：${email} · 可直接 0 元开通`,
        'zh-Hant': `已登入：${email} · 可直接 0 元開通`,
        en: `Signed in as ${email} · ready to claim at ¥0`,
      }),

    // Three-step cards
    steps: {
      promo: [
        {
          title: pick(locale, {
            'zh-CN': '登录邮箱',
            'zh-Hant': '登入郵箱',
            en: 'Sign in with email',
          }),
          text: pick(locale, {
            'zh-CN': '注册会员后才能领取',
            'zh-Hant': '註冊會員後才能領取',
            en: 'A registered account is required to claim',
          }),
        },
        {
          title: pick(locale, {
            'zh-CN': '选择会员方案',
            'zh-Hant': '選擇會員方案',
            en: 'Pick a plan',
          }),
          text: pick(locale, {
            'zh-CN': '季度 / 年度 · 活动期 ¥0',
            'zh-Hant': '季度 / 年度 · 活動期 ¥0',
            en: 'Quarterly or annual · ¥0 during promo',
          }),
        },
        {
          title: pick(locale, {
            'zh-CN': '0 元开通',
            'zh-Hant': '0 元開通',
            en: 'Claim free',
          }),
          text: pick(locale, {
            'zh-CN': '立即享受会员功能',
            'zh-Hant': '立即享受會員功能',
            en: 'Member features unlock right away',
          }),
        },
      ],
      paid: [
        {
          title: pick(locale, {
            'zh-CN': '绑定邮箱',
            'zh-Hant': '綁定郵箱',
            en: 'Link email',
          }),
          text: pick(locale, {
            'zh-CN': '把当前报告与你的邮箱关联',
            'zh-Hant': '把當前報告與你的郵箱關聯',
            en: 'Associate reports with your email',
          }),
        },
        {
          title: pick(locale, {
            'zh-CN': '选择会员方案',
            'zh-Hant': '選擇會員方案',
            en: 'Pick a plan',
          }),
          text: pick(locale, {
            'zh-CN': '按年或按季解锁完整版',
            'zh-Hant': '按年或按季解鎖完整版',
            en: 'Unlock the full edition yearly or quarterly',
          }),
        },
        {
          title: pick(locale, {
            'zh-CN': '随时回看',
            'zh-Hant': '隨時回看',
            en: 'Replay anytime',
          }),
          text: pick(locale, {
            'zh-CN': '后续年度更新优先查看',
            'zh-Hant': '後續年度更新優先查看',
            en: 'Priority access to later yearly updates',
          }),
        },
      ],
    },

    // Active membership status card
    statusEyebrow: pick(locale, {
      'zh-CN': '当前会员状态',
      'zh-Hant': '當前會員狀態',
      en: 'Your membership',
    }),
    statusActiveTitle: (planName: string) =>
      pick(locale, {
        'zh-CN': `你已开通 ${planName}`,
        'zh-Hant': `你已開通 ${planName}`,
        en: `You have ${planName} membership`,
      }),
    statusMemberFallback: pick(locale, {
      'zh-CN': '会员',
      'zh-Hant': '會員',
      en: 'member',
    }),
    statusExpires: (dateLabel: string) =>
      pick(locale, {
        'zh-CN': `到期时间：${dateLabel}`,
        'zh-Hant': `到期時間：${dateLabel}`,
        en: `Expires: ${dateLabel}`,
      }),
    statusLongTerm: pick(locale, {
      'zh-CN': '长期有效',
      'zh-Hant': '長期有效',
      en: 'No expiry',
    }),
    statusSavedReports: (count: number) =>
      pick(locale, {
        'zh-CN': `已保存报告 ${count} 份`,
        'zh-Hant': `已保存報告 ${count} 份`,
        en: `${count} saved report${count === 1 ? '' : 's'}`,
      }),
    continueReports: pick(locale, {
      'zh-CN': '继续生成或查看报告',
      'zh-Hant': '繼續生成或查看報告',
      en: 'Generate or open reports',
    }),

    // Tier comparison
    freeTierTitle: pick(locale, {
      'zh-CN': '免费版',
      'zh-Hant': '免費版',
      en: 'Free tier',
    }),
    freeTierDesc: pick(locale, {
      'zh-CN': '适合第一次了解命盘结构与阶段节奏。',
      'zh-Hant': '適合第一次了解命盤結構與階段節奏。',
      en: 'A first look at chart structure and life-stage rhythm.',
    }),
    freeTierFeatures: [
      pick(locale, {
        'zh-CN': '八字结构与五行强弱概览',
        'zh-Hant': '八字結構與五行強弱概覽',
        en: 'Bazi structure and five-element overview',
      }),
      pick(locale, {
        'zh-CN': '人生K线趋势与阶段判断',
        'zh-Hant': '人生K線趨勢與階段判斷',
        en: 'Life K-Line trend and stage read',
      }),
      pick(locale, {
        'zh-CN': '按问题类型组织的免费摘要',
        'zh-Hant': '按問題類型組織的免費摘要',
        en: 'Free summary organized by question type',
      }),
      pick(locale, {
        'zh-CN': '出生时间可信度边界提示',
        'zh-Hant': '出生時間可信度邊界提示',
        en: 'Birth-time confidence boundary notes',
      }),
    ],
    memberTierTitle: pick(locale, {
      'zh-CN': '会员版',
      'zh-Hant': '會員版',
      en: 'Member tier',
    }),
    memberTierDesc: pick(locale, {
      'zh-CN': '适合需要长期回看、做年度规划的用户。',
      'zh-Hant': '適合需要長期回看、做年度規劃的用戶。',
      en: 'For long-term replay and yearly planning.',
    }),
    memberTierFeatures: [
      pick(locale, {
        'zh-CN': '完整事业、财运、婚恋、健康四维分析',
        'zh-Hant': '完整事業、財運、婚戀、健康四維分析',
        en: 'Full career, wealth, relationship, and health analysis',
      }),
      pick(locale, {
        'zh-CN': '流年大运与关键人生窗口详解',
        'zh-Hant': '流年大運與關鍵人生窗口詳解',
        en: 'Yearly cycles and key life-window detail',
      }),
      pick(locale, {
        'zh-CN': '年度策略与月份节奏提醒',
        'zh-Hant': '年度策略與月份節奏提醒',
        en: 'Yearly strategy and monthly rhythm notes',
      }),
      pick(locale, {
        'zh-CN': '邮箱永久保存报告，随时回看',
        'zh-Hant': '郵箱永久保存報告，隨時回看',
        en: 'Email-saved reports you can reopen anytime',
      }),
      pick(locale, {
        'zh-CN': '后续年度运势更新优先查看',
        'zh-Hant': '後續年度運勢更新優先查看',
        en: 'Priority access to later yearly updates',
      }),
    ],

    // Plan features shown on cards (annual / quarterly)
    planFeatures: {
      annual: [
        pick(locale, {
          'zh-CN': '完整事业、财运、婚恋、健康四维分析',
          en: 'Full four-dimension analysis',
        }),
        pick(locale, {
          'zh-CN': '流年大运与关键人生窗口详解',
          en: 'Yearly & luck-cycle window detail',
        }),
        pick(locale, {
          'zh-CN': '年度策略与月份节奏提醒',
          en: 'Yearly strategy & monthly rhythm',
        }),
        pick(locale, {
          'zh-CN': '邮箱永久保存报告，随时回看',
          en: 'Email-saved reports anytime',
        }),
        pick(locale, {
          'zh-CN': '后续年度运势更新优先查看',
          en: 'Priority yearly updates',
        }),
      ],
      quarterly: [
        pick(locale, {
          'zh-CN': '解锁会员完整版报告全文',
          en: 'Full member report text',
        }),
        pick(locale, {
          'zh-CN': '事业财运婚恋健康细分解读',
          en: 'Career / wealth / relationship / health detail',
        }),
        pick(locale, {
          'zh-CN': '当前流年与大运深度分析',
          en: 'Current year & luck-cycle depth',
        }),
        pick(locale, {
          'zh-CN': '邮箱保存报告 90 天回看',
          en: 'Email-saved reports for 90 days',
        }),
      ],
    } as Record<MembershipPlanId, string[]>,

    // Plan picker section
    selectPlanTitle: pick(locale, {
      'zh-CN': '选择会员方案',
      'zh-Hant': '選擇會員方案',
      en: 'Choose a plan',
    }),
    selectPlanDescPromo: (end: string, priceNote: string) =>
      pick(locale, {
        'zh-CN': `活动截止 ${end} · ${priceNote}`,
        'zh-Hant': `活動截止 ${end} · ${priceNote}`,
        en: `Promo ends ${end} · ${priceNote}`,
      }),
    selectPlanDescPaid: pick(locale, {
      'zh-CN': '邮箱会自动从登录态带入，减少重复填写。',
      'zh-Hant': '郵箱會自動從登入態帶入，減少重複填寫。',
      en: 'Email is filled from your sign-in session when available.',
    }),
    badgeFree: pick(locale, {
      'zh-CN': '限时免费',
      'zh-Hant': '限時免費',
      en: 'Limited free',
    }),
    badgeRecommended: pick(locale, {
      'zh-CN': '推荐',
      'zh-Hant': '推薦',
      en: 'Recommended',
    }),
    emailPlaceholderAuth: pick(locale, {
      'zh-CN': '已绑定登录邮箱',
      'zh-Hant': '已綁定登入郵箱',
      en: 'Signed-in email',
    }),
    emailPlaceholderGuest: pick(locale, {
      'zh-CN': '请先登录后自动填入邮箱',
      'zh-Hant': '請先登入後自動填入郵箱',
      en: 'Sign in first — email fills in automatically',
    }),
    alreadyAnnual: pick(locale, {
      'zh-CN': '已是年度会员',
      'zh-Hant': '已是年度會員',
      en: 'Already annual member',
    }),
    processing: pick(locale, {
      'zh-CN': '处理中...',
      'zh-Hant': '處理中...',
      en: 'Processing…',
    }),
    activatePlan: (planName: string) =>
      pick(locale, {
        'zh-CN': `开通${planName}`,
        'zh-Hant': `開通${planName}`,
        en: `Activate ${planName}`,
      }),
    notLoggedIn: pick(locale, {
      'zh-CN': '未登录？',
      'zh-Hant': '未登入？',
      en: 'Not signed in?',
    }),
    loginRegister: pick(locale, {
      'zh-CN': '邮箱登录 / 注册',
      'zh-Hant': '郵箱登入 / 註冊',
      en: 'Email sign-in / register',
    }),
    claimAfterLogin: pick(locale, {
      'zh-CN': '后再领取会员。',
      'zh-Hant': '後再領取會員。',
      en: ' then claim membership.',
    }),
    statusLoading: pick(locale, {
      'zh-CN': '正在查询会员状态…',
      'zh-Hant': '正在查詢會員狀態…',
      en: 'Checking membership status…',
    }),

    // Checkout fallback messages
    successActivatedPromo: pick(locale, {
      'zh-CN': '会员已开通（限时免费 ¥0）。你现在可以使用会员功能。',
      'zh-Hant': '會員已開通（限時免費 ¥0）。你現在可以使用會員功能。',
      en: 'Membership activated (promo free ¥0). Member features are available now.',
    }),
    successActivated: pick(locale, {
      'zh-CN': '会员已开通。你现在可以回看完整报告与年度提醒。',
      'zh-Hant': '會員已開通。你現在可以回看完整報告與年度提醒。',
      en: 'Membership activated. You can reopen full reports and yearly notes.',
    }),
    successRecorded: pick(locale, {
      'zh-CN': '已记录开通意向，我们会通过邮箱发送下一步指引。',
      'zh-Hant': '已記錄開通意向，我們會通過郵箱發送下一步指引。',
      en: 'We recorded your intent and will email next steps.',
    }),
    errorCheckout: pick(locale, {
      'zh-CN': '开通失败，请稍后重试。',
      'zh-Hant': '開通失敗，請稍後重試。',
      en: 'Could not activate. Please try again later.',
    }),
    errorStatus: pick(locale, {
      'zh-CN': '状态查询失败',
      'zh-Hant': '狀態查詢失敗',
      en: 'Status lookup failed',
    }),

    // FAQ
    faqTitle: pick(locale, {
      'zh-CN': '常见问题',
      'zh-Hant': '常見問題',
      en: 'FAQ',
    }),
    faqItems: [
      {
        q: pick(locale, {
          'zh-CN': '开通后能看到什么？',
          'zh-Hant': '開通後能看到什麼？',
          en: 'What do I unlock?',
        }),
        a: pick(locale, {
          'zh-CN':
            '完整事业、财运、婚恋、健康分析，以及流年大运与关键窗口的详细解读。',
          'zh-Hant':
            '完整事業、財運、婚戀、健康分析，以及流年大運與關鍵窗口的詳細解讀。',
          en: 'Full career, wealth, relationship, and health analysis, plus yearly cycles and key-window detail.',
        }),
      },
      {
        q: pick(locale, {
          'zh-CN': '为什么必须登录？',
          'zh-Hant': '為什麼必須登入？',
          en: 'Why is sign-in required?',
        }),
        a: pick(locale, {
          'zh-CN':
            '会员权益绑定注册邮箱，便于跨设备回看与后续提醒，也避免匿名滥用。',
          'zh-Hant':
            '會員權益綁定註冊郵箱，便於跨裝置回看與後續提醒，也避免匿名濫用。',
          en: 'Benefits attach to your registered email for cross-device replay and reminders, and to limit anonymous abuse.',
        }),
      },
      {
        q: pick(locale, {
          'zh-CN': '限时免费到什么时候？',
          'zh-Hant': '限時免費到什麼時候？',
          en: 'How long is the free promo?',
        }),
        a: pick(locale, {
          'zh-CN': `活动截至 ${MEMBERSHIP_FREE_PROMO_END}。期内开通季度 / 年度均为 ¥0；季度可免费升级年度。`,
          'zh-Hant': `活動截至 ${MEMBERSHIP_FREE_PROMO_END}。期內開通季度 / 年度均為 ¥0；季度可免費升級年度。`,
          en: `Promo ends ${MEMBERSHIP_FREE_PROMO_END}. Quarterly and annual are both ¥0 during the promo; quarterly can free-upgrade to annual.`,
        }),
      },
    ],
    faqAnalyze: {
      q: pick(locale, {
        'zh-CN': '还没生成报告可以开通吗？',
        'zh-Hant': '還沒生成報告可以開通嗎？',
        en: 'Can I claim before generating a report?',
      }),
      aPrefix: pick(locale, {
        'zh-CN': '可以。开通后可先',
        'zh-Hant': '可以。開通後可先',
        en: 'Yes. After claiming you can',
      }),
      aLink: pick(locale, {
        'zh-CN': ' 免费测算 ',
        'zh-Hant': ' 免費測算 ',
        en: ' run a free chart ',
      }),
      aSuffix: pick(locale, {
        'zh-CN': '，报告会按会员权益保存。',
        'zh-Hant': '，報告會按會員權益保存。',
        en: ', and reports save under member benefits.',
      }),
    },
  };
}
