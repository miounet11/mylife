import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI 咨询 | 人生K线',
  description: '围绕你的命理报告继续提问，进一步看清重点问题、时间窗口和下一步建议。',
  robots: {
    index: false,
    follow: false,
  },
};

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  return children;
}
