import type { Metadata } from 'next';
import { AppPage } from '@/components/layout/app-page';
import { XiangxueLabApp } from '@/components/xiangxue/xiangxue-lab-app';
import { buildPageMetadata } from '@/lib/seo';

export const metadata: Metadata = buildPageMetadata({
  title: '面相结构观察｜上传照片 + 可选生辰',
  description:
    '上传面部照片获得面相文化结构观察，可结合生辰用神做天时交叉。照片关联用户私有存储，非医学诊断、非定命。',
  path: '/tools/physiognomy',
  keywords: ['面相', '面相分析', '上传照片面相', '相学', '人生K线'],
});

export default function PhysiognomyPage() {
  return (
    <AppPage header={{ ctaHref: '/tools/palmistry', ctaLabel: '手相', compact: true }}>
      <XiangxueLabApp kind="face" />
    </AppPage>
  );
}
