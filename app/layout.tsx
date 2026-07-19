import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import './globals.css';
import { cookies, headers } from 'next/headers';
import { LocaleProvider } from '@/components/i18n/locale-provider';
import AutoLocalize from '@/components/i18n/auto-localize';
import SiteFeedbackWidget from '@/components/site-feedback-widget';
import RegisterServiceWorker from '@/components/pwa/register-sw';
import {
  LOCALE_COOKIE,
  LOCALE_HEADER,
  htmlLangAttr,
  resolveSiteLocale,
} from '@/lib/i18n/site-locale';
import { getGoogleAnalyticsId } from '@/lib/env';
import { TEXT_SCALE_BOOT_SCRIPT } from '@/lib/text-scale';

const siteUrl = 'https://www.life-kline.com';
const siteName = 'Life K-Line 命运K线';
const siteDescription =
  '免费输入出生信息生成八字命盘、人生K线运势曲线与流年大运；十维度深度研判覆盖事业行业、投资节奏、婚恋、健康、起名与迁移择城，结论可回访验证。';
const seoKeywords = [
  '免费八字命理分析',
  '八字排盘',
  '出生日期八字分析',
  '生辰八字测算',
  '人生运势曲线',
  '人生K线',
  '流年大运',
  '十维度研判',
  '运势节奏分析',
  '事业行业匹配',
  '投资理财节奏',
  '谈婚论嫁择时',
  '海外华人运势',
  '迁移择城',
  '世界易',
  '会员命理报告',
];

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: siteName,
  title: {
    default: 'Life K-Line 命运K线｜免费八字排盘、人生运势曲线与会员报告',
    template: '%s｜Life K-Line 命运K线',
  },
  description: siteDescription,
  keywords: seoKeywords,
  // Lightweight PWA: Next also auto-links app/manifest.ts → /manifest.webmanifest
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [{ url: '/icon.svg', type: 'image/svg+xml' }],
    apple: [{ url: '/apple-icon', sizes: '180x180', type: 'image/png' }],
  },
  appleWebApp: {
    capable: true,
    title: '人生K线',
    statusBarStyle: 'default',
  },
  formatDetection: {
    telephone: false,
  },
  alternates: {
    canonical: '/',
    languages: {
      'zh-CN': '/',
      'zh-Hant': '/?lang=zh-Hant',
      'zh-TW': '/?lang=zh-Hant',
      'zh-HK': '/?lang=zh-Hant',
      en: '/?lang=en',
      'x-default': '/',
    },
  },
  authors: [{ name: siteName, url: siteUrl }],
  creator: siteName,
  publisher: siteName,
  category: '八字命理分析与人生运势工具',
  openGraph: {
    type: 'website',
    locale: 'zh_CN',
    url: '/',
    siteName,
    title: 'Life K-Line 命运K线｜八字命理结构分析与人生运势曲线',
    description: siteDescription,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Life K-Line 命运K线｜八字命理结构分析与人生运势曲线',
    description: siteDescription,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-snippet': -1,
      'max-image-preview': 'large',
      'max-video-preview': -1,
    },
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#f7f8f9',
};

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: siteName,
  url: siteUrl,
};

const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: siteName,
  url: siteUrl,
  description: siteDescription,
  inLanguage: 'zh-CN',
  potentialAction: [
    {
      '@type': 'SearchAction',
      target: `${siteUrl}/analyze?keyword={search_term_string}&source=seo_search`,
      'query-input': 'required name=search_term_string',
    },
    {
      '@type': 'RegisterAction',
      name: '绑定邮箱保存会员报告',
      target: `${siteUrl}/analyze?source=global_register_action`,
    },
  ],
};

const webApplicationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: siteName,
  url: siteUrl,
  applicationCategory: 'LifestyleApplication',
  operatingSystem: 'Web',
  inLanguage: 'zh-CN',
  description: siteDescription,
  featureList: [
    '免费八字命盘生成',
    '人生运势曲线可视化',
    '十维度深度场景研判',
    '可验证预测回访',
    '流年大运趋势分析',
    '海外华人 GEO 城市观察',
    '邮箱保存会员完整报告',
  ],
  audience: {
    '@type': 'Audience',
    audienceType: '关注八字命理、流年运势、十维度场景判断与海外迁移决策的中文用户',
  },
  areaServed: [
    { '@type': 'Place', name: '中国' },
    { '@type': 'Place', name: '海外华人社区' },
  ],
  offers: {
    '@type': 'Offer',
    category: '会员命理分析报告',
    availability: 'https://schema.org/InStock',
    url: `${siteUrl}/membership?source=global_jsonld_offer`,
  },
};

const conversionFunnelJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  name: 'Life K-Line 免费报告到会员完整报告路径',
  itemListElement: [
    {
      '@type': 'ListItem',
      position: 1,
      name: '免费生成八字命理报告',
      url: `${siteUrl}/analyze?source=global_funnel_generate`,
    },
    {
      '@type': 'ListItem',
      position: 2,
      name: '绑定邮箱保存报告',
      url: `${siteUrl}/analyze?source=global_funnel_email`,
    },
    {
      '@type': 'ListItem',
      position: 3,
      name: '开通会员解锁完整分析',
      url: `${siteUrl}/membership?source=global_funnel_member`,
    },
  ],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const headerStore = await headers();
  const locale = resolveSiteLocale({
    cookieLang: cookieStore.get(LOCALE_COOKIE)?.value || headerStore.get(LOCALE_HEADER),
    acceptLanguage: headerStore.get('accept-language'),
  });
  const googleAnalyticsId = getGoogleAnalyticsId();

  return (
    <html lang={htmlLangAttr(locale)} data-locale={locale}>
      <body className="min-h-screen antialiased">
        <Script id="text-scale-boot" strategy="beforeInteractive">
          {TEXT_SCALE_BOOT_SCRIPT}
        </Script>
        {googleAnalyticsId ? (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${googleAnalyticsId}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${googleAnalyticsId}');`}
            </Script>
          </>
        ) : null}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(webApplicationJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(conversionFunnelJsonLd) }}
        />
        <LocaleProvider initialLocale={locale}>
          {children}
          <AutoLocalize />
          <SiteFeedbackWidget />
          <RegisterServiceWorker />
        </LocaleProvider>
      </body>
    </html>
  );
}
