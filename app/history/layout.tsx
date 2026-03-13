import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '历史分析记录 | 人生K线',
  description: '查看历史命理分析记录，快速回到结果页继续复盘、对比和深问。',
  robots: {
    index: false,
    follow: false,
  },
};

export default function HistoryLayout({ children }: { children: React.ReactNode }) {
  return children;
}
