import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { AppPage } from '@/components/layout/app-page';
import { NamingDetailView } from '@/components/naming/naming-detail-view';
import { toolSessionOperations } from '@/lib/database';
import {
  decodeNameKey,
  findCandidate,
  type NamingSessionResult,
} from '@/lib/naming';
import { buildPageMetadata } from '@/lib/seo';

type Props = {
  params: Promise<{ sessionId: string; name: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { name } = await params;
  const display = decodeNameKey(name);
  return buildPageMetadata({
    title: `${display} · 起名详解`,
    description: '单名下一级 AI 详解',
    path: `/tools/naming`,
    noIndex: true,
  });
}

export default async function NamingNameDetailPage({ params }: Props) {
  const { sessionId, name: nameParam } = await params;
  const row = toolSessionOperations.getById(sessionId) as {
    toolSlug?: string;
    result?: NamingSessionResult;
  } | null;

  if (!row?.result || row.toolSlug !== 'naming-lab') {
    notFound();
  }

  const result = row.result as NamingSessionResult;
  const candidate = findCandidate(result.candidates || [], nameParam);
  const displayName =
    candidate?.fullName || candidate?.name || decodeNameKey(nameParam);

  return (
    <AppPage
      header={{
        ctaHref: `/tools/naming/result/${sessionId}`,
        ctaLabel: '返回方案',
        compact: true,
      }}
    >
      <NamingDetailView
        sessionId={sessionId}
        name={displayName}
        candidate={candidate}
        result={result}
      />
    </AppPage>
  );
}
