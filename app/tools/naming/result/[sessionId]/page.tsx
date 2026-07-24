import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { AppPage } from '@/components/layout/app-page';
import { NamingResultView } from '@/components/naming/naming-result-view';
import { toolSessionOperations } from '@/lib/database';
import type { NamingSessionResult } from '@/lib/naming';
import { buildPageMetadata } from '@/lib/seo';

type Props = { params: Promise<{ sessionId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { sessionId } = await params;
  return buildPageMetadata({
    title: '起名方案结果',
    description: '个人/公司/产品起名结果与 AI 测算',
    path: `/tools/naming/result/${sessionId}`,
    noIndex: true,
  });
}

export default async function NamingResultPage({ params }: Props) {
  const { sessionId } = await params;
  // session id is unguessable; avoid cookie writes in RSC (getOrCreateGuestUserId)
  const row = toolSessionOperations.getById(sessionId) as {
    toolSlug?: string;
    result?: NamingSessionResult;
  } | null;

  if (!row?.result || row.toolSlug !== 'naming-lab') {
    notFound();
  }

  const result = row.result as NamingSessionResult;
  if (!result.candidates?.length || !result.title) {
    notFound();
  }

  return (
    <AppPage header={{ ctaHref: '/tools/naming', ctaLabel: '新方案', compact: true }}>
      <NamingResultView sessionId={sessionId} result={result} />
    </AppPage>
  );
}
