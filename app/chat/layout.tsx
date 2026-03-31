import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '结构追问 | 人生K线',
  description: '围绕你的判断报告继续做世界易结构追问，进一步看清重点问题、时间窗口和下一步建议。',
  robots: {
    index: false,
    follow: false,
  },
};

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  return children;
}
