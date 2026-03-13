import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '我的档案与长期复盘 | 人生K线',
  description: '集中查看个人资料、历史报告、关键事件和人生 K 线趋势，形成长期可复访的个人决策档案。',
  robots: {
    index: false,
    follow: false,
  },
};

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return children;
}
