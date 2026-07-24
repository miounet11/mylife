import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { toolSessionOperations } from '@/lib/database';
import { getOrCreateGuestUserId } from '@/lib/user-utils';
import { generateId } from '@/lib/utils';
import { trackServerEvent } from '@/lib/analytics';
import { simulateSpaceField } from '@/lib/fengshui/space/field-sim';
import {
  buildFengshuiSpaceReport,
  reportToPlainText,
  type FengshuiSpaceReport,
} from '@/lib/fengshui/space/full-report';
import type { SpaceLabState } from '@/lib/fengshui/space/types';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const state = body?.state as SpaceLabState | undefined;
    if (!state?.room?.widthM) {
      return NextResponse.json({ success: false, error: '缺少空间状态' }, { status: 400 });
    }

    const planSnapshotDataUrl =
      typeof body?.planSnapshotDataUrl === 'string' && body.planSnapshotDataUrl.startsWith('data:image')
        ? body.planSnapshotDataUrl.slice(0, 500_000)
        : state.beautifyImageDataUrl || null;

    const persist = body?.persist !== false;
    const result = simulateSpaceField(state);
    const report: FengshuiSpaceReport = buildFengshuiSpaceReport(state, result, {
      planSnapshotDataUrl,
      publicMode: false,
    });
    const plainText = reportToPlainText(report);

    let sessionId: string | null = null;
    if (persist) {
      const auth = await getAuthSession();
      const userId =
        (auth.authenticated && auth.user?.id ? String(auth.user.id) : '') ||
        (await getOrCreateGuestUserId());
      sessionId = `tool_${generateId()}`;
      toolSessionOperations.create({
        id: sessionId,
        userId,
        toolSlug: 'fengshui-space-report',
        input: {
          domain: state.activeDomain,
          room: state.room,
          profileLink: state.profileLink
            ? {
                fortuneId: state.profileLink.fortuneId,
                birthSignature: state.profileLink.birthSignature,
                dayMaster: state.profileLink.dayMaster,
              }
            : null,
        },
        result: {
          report,
          plainText,
          summary: result.summary,
          tool: 'fengshui-space-report',
          title: report.title,
          savedAt: report.generatedAt,
        },
        meta: {
          toolTitle: '空间场完整报表',
          category: 'application',
          domain: state.activeDomain,
          profileLinked: report.profileLinked,
          fortuneId: state.profileLink?.fortuneId || null,
        },
      });
    }

    trackServerEvent({
      eventName: 'tool_run_completed',
      page: '/tools/fengshui-space',
      meta: {
        action: 'space_full_report',
        domain: state.activeDomain,
        profileLinked: report.profileLinked,
        sessionId,
      },
    });

    return NextResponse.json({
      success: true,
      report,
      plainText,
      sessionId,
      resultUrl: sessionId ? `/tool-result/${sessionId}` : null,
    });
  } catch (error) {
    console.error('[full-report]', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '报表生成失败' },
      { status: 500 },
    );
  }
}
