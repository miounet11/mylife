import type { Metadata } from 'next';
import { AppPage } from '@/components/layout/app-page';
import { XiangxueLabApp } from '@/components/xiangxue/xiangxue-lab-app';
import { buildPageMetadata } from '@/lib/seo';

export const metadata: Metadata = buildPageMetadata({
  title: '手相结构观察｜上传掌纹照片 + 可选生辰',
  description:
    '上传手掌照片观察生命线、智慧线、感情线等掌纹结构，可结合生辰。照片私有存储并可授权脱敏线图。非医学诊断。',
  path: '/tools/palmistry',
  keywords: ['手相', '掌纹', '手相分析', '生命线', '上传手相', '人生K线'],
});

export default function PalmistryPage() {
  return (
    <AppPage header={{ ctaHref: '/tools/physiognomy', ctaLabel: '面相', compact: true }}>
      <XiangxueLabApp kind="palm" />
    </AppPage>
  );
}
