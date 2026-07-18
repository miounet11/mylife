import type { Metadata } from 'next';
import AnalyticsPageView from '@/components/analytics-page-view';
import { PageIllustrationStrip } from '@/components/content/page-illustration-strip';
import { AppPage } from '@/components/layout/app-page';
import { FocusHero } from '@/components/layout/focus-hero';
import MembershipClient from './membership-client';

export const metadata: Metadata = {
  title: '限时免费会员｜0 元开通季度/年度 · 邮箱注册即可',
  description:
    '2026-12-31 前限时免费：注册登录后 0 元开通季度或年度会员，享受完整报告与回看权益；季度可免费升级年度。',
  keywords: ['免费会员', '八字会员', '限时免费', '邮箱保存八字报告', '人生K线会员'],
  alternates: { canonical: '/membership' },
  openGraph: {
    title: '限时免费会员｜0 元开通',
    description: '登录邮箱即可 0 元领取会员权益，无需支付。活动截至 2026-12-31。',
    url: '/membership',
    type: 'website',
  },
};

const membershipJsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebPage',
      '@id': 'https://www.life-kline.com/membership#webpage',
      url: 'https://www.life-kline.com/membership',
      name: 'Life K-Line 会员完整报告',
      description: '开通会员解锁完整八字命理分析，并用邮箱保存报告。',
      inLanguage: 'zh-CN',
      isPartOf: { '@id': 'https://www.life-kline.com/#website' },
    },
    {
      '@type': 'Product',
      name: 'Life K-Line 年度会员',
      description: '完整事业财运婚恋健康分析、流年大运详解、邮箱永久保存报告。',
      brand: { '@type': 'Brand', name: 'Life K-Line' },
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'CNY',
        availability: 'https://schema.org/InStock',
        url: 'https://www.life-kline.com/membership?source=seo_offer',
        priceValidUntil: '2026-12-31',
        description: '限时免费至 2026-12-31，需邮箱登录后领取',
      },
    },
  ],
};

export default function MembershipPage() {
  return (
    <AppPage header={{ ctaHref: '/login?next=%2Fmembership', ctaLabel: '登录领会员', compact: true }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(membershipJsonLd) }}
      />
      <AnalyticsPageView eventName="membership_page_viewed" page="/membership" />
      <div className="mx-auto max-w-3xl space-y-6 px-4 py-6 pb-16 md:py-8">
        <FocusHero
          eyebrow="限时免费至 2026-12-31"
          title="¥0 开通会员"
          description="登录邮箱后可 0 元开通季度或年度会员；季度可免费升级年度。开通后立即生效。"
        />
        <PageIllustrationStrip surface="membership/hub" title="会员能做什么" compact limit={1} />
        <MembershipClient />
      </div>
    </AppPage>
  );
}