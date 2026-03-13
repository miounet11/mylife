import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '邮箱登录与账号绑定 | 人生K线',
  description: '使用邮箱验证码登录并绑定分析结果、事件记录与订阅状态，形成长期可持续的账户关系。',
  robots: {
    index: false,
    follow: false,
  },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
