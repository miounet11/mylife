import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { AppPage } from '@/components/layout/app-page';
import { XiangxueResultView } from '@/components/xiangxue/xiangxue-result-view';
import { toolSessionOperations } from '@/lib/database';
import type { XiangxueSessionResult } from '@/lib/xiangxue';
import { buildPageMetadata } from '@/lib/seo';

type Props = { params: Promise<{ sessionId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { sessionId } = await params;
  return buildPageMetadata({
    title: '面相系统报告',
    description: '面相系统报告：物理结构 → 命理交叉 → 综合行动',
    path: `/tools/physiognomy/result/${sessionId}`,
    noIndex: true,
  });
}

export default async function PhysiognomyResultPage({ params }: Props) {
  const { sessionId } = await params;
  const row = toolSessionOperations.getById(sessionId) as {
    toolSlug?: string;
    result?: XiangxueSessionResult;
  } | null;
  if (!row?.result || row.toolSlug !== 'physiognomy') notFound();
  return (
    <AppPage header={{ ctaHref: '/tools/physiognomy', ctaLabel: '再测', compact: true }}>
      <XiangxueResultView sessionId={sessionId} result={row.result} />
    </AppPage>
  );
}
