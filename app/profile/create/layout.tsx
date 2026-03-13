import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '创建个人档案 | 人生K线',
  description: '创建个人命理档案，统一沉淀出生信息、分析记录与后续复盘数据。',
  robots: {
    index: false,
    follow: false,
  },
};

export default function CreateProfileLayout({ children }: { children: React.ReactNode }) {
  return children;
}
