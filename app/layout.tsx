import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://www.life-kline.com'),
  title: '人生K线 | 看清命局结构、当前阶段与下一步动作',
  description: '基于真太阳时修正与结构化命理引擎，输出命局结构、阶段节奏、行动建议与验证闭环。',
  alternates: {
    canonical: 'https://www.life-kline.com',
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
  return (
    <html lang="zh-CN">
      <body className="bg-[color:var(--bg)] font-sans text-[color:var(--ink)] antialiased selection:bg-[color:var(--accent-soft)] selection:text-[color:var(--ink)]">
        {children}
      </body>
    </html>
  );
}
