import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import {
  buildCoreReferenceSeedPlan,
  buildDomainAcquisitionPlans,
  listRecentlySeededKnowledgeSources,
  previewCoreReferenceSeedInputs,
  seedKnowledgeSourcePlans,
} from '@/lib/domain-acquisition-planner';
import { runKnowledgeAcquisitionCycle } from '@/lib/knowledge-acquisition';
import type { DomainKey } from '@/lib/domain-source-presets';

export const maxDuration = 30;

async function ensureAdmin() {
  const session = await getAuthSession();
  if (!session.authenticated || session.user?.role !== 'admin') {
    return null;
  }
  return session.user;
}

function readDomain(value: string | null): DomainKey | undefined {
  const normalized = `${value || ''}`.trim();
  if (!normalized) return undefined;

  const supported = new Set<DomainKey>([
    'metaphysics',
    'psychology',
    'philosophy',
    'history',
    'programming',
    'ai',
    'statistics',
    'astrology',
    'medicine',
    'law',
  ]);

  return supported.has(normalized as DomainKey) ? (normalized as DomainKey) : undefined;
}

export async function GET(request: NextRequest) {
  const user = await ensureAdmin();
  if (!user) {
    return NextResponse.json({ success: false, error: '无权限访问' }, { status: 403 });
  }

  const searchParams = request.nextUrl.searchParams;
  const domain = readDomain(searchParams.get('domain'));
  const limit = Number(searchParams.get('limit') || 18);

  return NextResponse.json({
    success: true,
    coreSeedPlan: buildCoreReferenceSeedPlan({ limit }),
    coreSeedPreview: previewCoreReferenceSeedInputs(limit),
    domainPlans: buildDomainAcquisitionPlans({
      domains: domain ? [domain] : undefined,
      nextWaveLimit: 5,
    }),
    recentSources: listRecentlySeededKnowledgeSources({ limit: 20 }),
  });
}

export async function POST(request: NextRequest) {
  const user = await ensureAdmin();
  if (!user) {
    return NextResponse.json({ success: false, error: '无权限访问' }, { status: 403 });
  }

  try {
    const body = await request.json();
    if (body.mode === 'cycle') {
      const cycle = await runKnowledgeAcquisitionCycle({
        refreshRadar: body.refreshRadar === true,
        coreLimit: typeof body.coreLimit === 'number' ? body.coreLimit : undefined,
        maxDomainsPerRun: typeof body.maxDomainsPerRun === 'number' ? body.maxDomainsPerRun : undefined,
        signalMinScore: typeof body.signalMinScore === 'number' ? body.signalMinScore : undefined,
        signalPromotionLimit: typeof body.signalPromotionLimit === 'number' ? body.signalPromotionLimit : undefined,
      });

      return NextResponse.json({
        success: true,
        cycle,
        coreSeedPlan: buildCoreReferenceSeedPlan({ limit: typeof body.coreLimit === 'number' ? body.coreLimit : 18 }),
        domainPlans: buildDomainAcquisitionPlans({ nextWaveLimit: 5 }),
        recentSources: listRecentlySeededKnowledgeSources({ limit: 20 }),
      });
    }

    const mode = body.mode === 'domain' ? 'domain' : 'core';
    const domain = readDomain(body.domain || null);
    const limit = typeof body.limit === 'number' ? body.limit : 18;

    if (mode === 'domain' && !domain) {
      return NextResponse.json({ success: false, error: '缺少有效 domain' }, { status: 400 });
    }

    const result = seedKnowledgeSourcePlans({
      mode,
      domain,
      limit,
    });

    return NextResponse.json({
      success: true,
      result,
      coreSeedPlan: buildCoreReferenceSeedPlan({ limit }),
      domainPlans: buildDomainAcquisitionPlans({
        domains: domain ? [domain] : undefined,
        nextWaveLimit: 5,
      }),
      recentSources: listRecentlySeededKnowledgeSources({ limit: 20 }),
    });
  } catch (error) {
    console.error('[API] 知识源入库失败:', error);
    return NextResponse.json({ success: false, error: '知识源入库失败' }, { status: 500 });
  }
}
