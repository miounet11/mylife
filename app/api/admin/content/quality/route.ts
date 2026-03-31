import { NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { getAdminQualityWorkboard } from '@/lib/admin-quality-workboard';
import type { ToolRepairStatus } from '@/lib/tool-repair-workflow';
import { syncToolRepairWorkflow, updateToolRepairWorkflow } from '@/lib/tool-repair-workflow';

async function ensureAdmin() {
  const session = await getAuthSession();
  if (!session.authenticated || session.user?.role !== 'admin') {
    return null;
  }
  return session.user;
}

export async function GET() {
  const user = await ensureAdmin();
  if (!user) {
    return NextResponse.json({ success: false, error: '无权限访问' }, { status: 403 });
  }

  const workboard = getAdminQualityWorkboard();
  const toolRepairWorkflow = syncToolRepairWorkflow(
    workboard.prioritizedToolFixes.map((item) => ({
      slug: item.slug,
      title: item.title,
      pagePath: item.pagePath,
      priorityScore: item.priorityScore,
      gapType: workboard.prioritizedToolJourneyGaps.find((gap) => gap.slug === item.slug)?.gapType || null,
      metrics: {
        detailViews: item.detailViews,
        ctaStartRate: item.ctaStartRate,
        ctaToRunRate: item.ctaToRunRate,
        runFailureRate: item.runFailureRate,
        premiumRate: item.premiumRate,
      },
    }))
  );

  return NextResponse.json({
    success: true,
    workboard,
    toolRepairWorkflow,
  });
}

export async function POST(request: Request) {
  const user = await ensureAdmin();
  if (!user) {
    return NextResponse.json({ success: false, error: '无权限访问' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const slug = typeof body?.slug === 'string' ? body.slug.trim() : '';
    const status = typeof body?.status === 'string' ? body.status.trim() as ToolRepairStatus : undefined;
    const owner = typeof body?.owner === 'string' ? body.owner : undefined;
    const notes = typeof body?.notes === 'string' ? body.notes : undefined;

    if (!slug) {
      return NextResponse.json({ success: false, error: '缺少工具 slug' }, { status: 400 });
    }
    if (status && !['todo', 'in_progress', 'verified'].includes(status)) {
      return NextResponse.json({ success: false, error: '状态无效' }, { status: 400 });
    }

    const updated = updateToolRepairWorkflow({
      slug,
      status,
      owner,
      notes,
    });
    if (!updated) {
      return NextResponse.json({ success: false, error: '未找到对应工具工单' }, { status: 404 });
    }

    const workboard = getAdminQualityWorkboard();
    const toolRepairWorkflow = syncToolRepairWorkflow(
      workboard.prioritizedToolFixes.map((item) => ({
        slug: item.slug,
        title: item.title,
        pagePath: item.pagePath,
        priorityScore: item.priorityScore,
        gapType: workboard.prioritizedToolJourneyGaps.find((gap) => gap.slug === item.slug)?.gapType || null,
        metrics: {
          detailViews: item.detailViews,
          ctaStartRate: item.ctaStartRate,
          ctaToRunRate: item.ctaToRunRate,
          runFailureRate: item.runFailureRate,
          premiumRate: item.premiumRate,
        },
      }))
    );
    return NextResponse.json({
      success: true,
      updated,
      workboard,
      toolRepairWorkflow,
    });
  } catch {
    return NextResponse.json({ success: false, error: '更新工单失败' }, { status: 500 });
  }
}
