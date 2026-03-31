import type { Metadata } from 'next';
import { Suspense } from 'react';
import Script from 'next/script';
import BuildVersionGuard from '@/components/build-version-guard';
import GoogleAnalyticsRouteTracker from '@/components/google-analytics-route-tracker';
import { GOOGLE_ANALYTICS_ID } from '@/lib/google-analytics-config';
import { getRuntimeBuildId } from '@/lib/runtime-build';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://www.life-kline.com'),
  title: '人生K线 | 世界易系统入口，帮你看清结构、阶段与下一步动作',
  description: '基于世界易与真太阳时校正，把个人结构、阶段节奏、环境变量与行动建议组织成可持续使用的现代判断系统。',
  applicationName: '人生K线',
  keywords: [
    '人生K线',
    '世界易',
    '结构判断',
    '真太阳时',
    '判断报告',
    '阶段判断',
    '决策框架',
  ],
  authors: [{ name: '人生K线' }],
  creator: '人生K线',
  publisher: '人生K线',
  category: 'Education',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  icons: {
    icon: '/icon.svg',
    apple: '/icon.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const runtimeBuildId = getRuntimeBuildId();
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': 'https://www.life-kline.com/#website',
        url: 'https://www.life-kline.com',
        name: '人生K线',
        alternateName: 'Life Kline',
        inLanguage: ['zh-CN', 'en'],
        description: '世界易现代判断系统入口，连接结构、阶段、环境与行动建议。',
      },
      {
        '@type': 'Organization',
        '@id': 'https://www.life-kline.com/#organization',
        name: '人生K线',
        alternateName: 'Life Kline',
        url: 'https://www.life-kline.com',
        logo: 'https://www.life-kline.com/icon.svg',
      },
    ],
  };

  return (
    <html lang="zh-CN">
      <body className="bg-[color:var(--bg)] font-sans text-[color:var(--ink)] antialiased selection:bg-[color:var(--accent-soft)] selection:text-[color:var(--ink)]">
        <BuildVersionGuard initialBuildId={runtimeBuildId} />
        <Script id="site-structured-data" type="application/ld+json" strategy="beforeInteractive">
          {JSON.stringify(structuredData)}
        </Script>
        {GOOGLE_ANALYTICS_ID ? (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ANALYTICS_ID}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GOOGLE_ANALYTICS_ID}', {
                  send_page_view: false
                });
              `}
            </Script>
            <Suspense fallback={null}>
              <GoogleAnalyticsRouteTracker />
            </Suspense>
          </>
        ) : null}
        {children}
      </body>
    </html>
  );
}
