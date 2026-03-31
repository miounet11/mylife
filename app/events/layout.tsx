import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '事件中心与验证工作台 | 人生K线',
  description: '统一管理报告关联事件、验证结果、偏差纠偏与提醒节点，让结构判断真正进入长期复盘。',
  robots: {
    index: false,
    follow: false,
  },
};

export default function EventsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
