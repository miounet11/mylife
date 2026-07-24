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
    title: '手相观察结果',
    description: '手相结构观察结果',
    path: `/tools/palmistry/result/${sessionId}`,
    noIndex: true,
  });
}

export default async function PalmistryResultPage({ params }: Props) {
  const { sessionId } = await params;
  const row = toolSessionOperations.getById(sessionId) as {
    toolSlug?: string;
    result?: XiangxueSessionResult;
  } | null;
  if (!row?.result || row.toolSlug !== 'palmistry') notFound();
  return (
    <AppPage header={{ ctaHref: '/tools/palmistry', ctaLabel: '再测', compact: true }}>
      <XiangxueResultView sessionId={sessionId} result={row.result} />
    </AppPage>
  );
}
