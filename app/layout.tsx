import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://life-kline.com'),
  title: '人生K线 | 权威八字命理分析引擎',
  description: '基于天文历法与传统命理学，提供精准的命运轨迹与决策参考。高考、升学、事业关键节点决策辅助工具。',
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
  return (
    <html lang="zh-CN">
      <body className="bg-[color:var(--bg)] font-sans text-[color:var(--ink)] antialiased selection:bg-[color:var(--accent-soft)] selection:text-[color:var(--ink)]">
        {children}
      </body>
    </html>
  );
}
