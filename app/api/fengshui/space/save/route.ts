import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { toolSessionOperations } from '@/lib/database';
import { getMembershipStatus } from '@/lib/membership-store';
import { getOrCreateGuestUserId } from '@/lib/user-utils';
import { generateId } from '@/lib/utils';
import { trackServerEvent } from '@/lib/analytics';

export const runtime = 'nodejs';

const FREE_SAVE_LIMIT = 3;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const summary = body?.summary && typeof body.summary === 'object' ? body.summary : null;
    const metaIn = body?.meta && typeof body.meta === 'object' ? body.meta : {};
    const room = body?.room && typeof body.room === 'object' ? body.room : {};
    const vents = Array.isArray(body?.vents) ? body.vents.slice(0, 20) : [];
    const lights = Array.isArray(body?.lights) ? body.lights.slice(0, 12) : [];
    const structures = Array.isArray(body?.structures) ? body.structures.slice(0, 30) : [];
    const openings = Array.isArray(body?.openings) ? body.openings.slice(0, 12) : [];
    const note = typeof body?.note === 'string' ? body.note.trim().slice(0, 400) : '';

    if (!summary) {
      return NextResponse.json({ success: false, error: '缺少结构读数 summary' }, { status: 400 });
    }

    const auth = await getAuthSession();
    const sessionEmail =
      auth.authenticated && auth.user?.email
        ? String(auth.user.email).trim().toLowerCase()
        : '';

    let isMember = false;
    if (sessionEmail) {
      try {
        const status = getMembershipStatus(sessionEmail);
        isMember = status.member?.status === 'active';
      } catch {
        isMember = false;
      }
    }

    const userId =
      (auth.authenticated && auth.user?.id ? String(auth.user.id) : '') ||
      (await getOrCreateGuestUserId());

    // Free tier: limit recent saves for this tool
    let existingCount = 0;
    try {
      if (typeof toolSessionOperations.listByUserAndTool === 'function') {
        existingCount = toolSessionOperations.listByUserAndTool(userId, 'fengshui-space', 50).length;
      } else {
        existingCount = toolSessionOperations
          .listByUser(userId, 50)
          .filter((s: { toolSlug?: string }) => s.toolSlug === 'fengshui-space').length;
      }
    } catch {
      existingCount = 0;
    }

    if (!isMember && existingCount >= FREE_SAVE_LIMIT) {
      return NextResponse.json(
        {
          success: false,
          code: 'member_required',
          error: `免费额度已用完（${FREE_SAVE_LIMIT} 次存档）。开通会员可无限保存与回看空间场结果。`,
          loginUrl: `/login?next=${encodeURIComponent('/membership?source=fengshui_space_save')}`,
          membershipUrl: '/membership?source=fengshui_space_save',
          isMember: false,
          freeLimit: FREE_SAVE_LIMIT,
          used: existingCount,
        },
        { status: 403 },
      );
    }

    const sessionId = `tool_${generateId()}`;
    const input = {
      note,
      room,
      vents,
      lights,
      structures,
      openings,
      entranceFacing: room?.entranceFacing || null,
    };
    const result = {
      summary,
      meta: metaIn,
      savedAt: new Date().toISOString(),
      tool: 'fengshui-space',
      title: '空间场模拟',
    };
    const meta = {
      toolTitle: '空间场模拟工作台',
      category: 'application',
      isMember,
      email: sessionEmail || null,
      ventCount: vents.length,
      structureCount: structures.length,
      hasOpeningsSuggest: openings.length > 0,
      peakEnergy: summary?.peakEnergy ?? null,
      stagnationRatio: summary?.stagnationRatio ?? null,
    };

    toolSessionOperations.create({
      id: sessionId,
      userId,
      reportId: undefined,
      toolSlug: 'fengshui-space',
      status: 'completed',
      input,
      result,
      meta,
    });

    void trackServerEvent({
      eventName: 'fengshui_space_saved',
      page: '/tools/fengshui-space',
      meta: { sessionId, isMember: isMember ? 'true' : 'false', userId },
    });

    return NextResponse.json({
      success: true,
      sessionId,
      resultUrl: `/tool-result/${sessionId}`,
      isMember,
      freeLimit: FREE_SAVE_LIMIT,
      used: existingCount + 1,
      remaining: isMember ? null : Math.max(0, FREE_SAVE_LIMIT - existingCount - 1),
      message: isMember
        ? '已保存到会员档案，可随时回看。'
        : `已保存（免费额度 ${existingCount + 1}/${FREE_SAVE_LIMIT}）。开通会员可无限存档。`,
    });
  } catch (error) {
    console.error('[fengshui/space/save]', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '保存失败',
      },
      { status: 500 },
    );
  }
}

export async function GET() {
  try {
    const auth = await getAuthSession();
    const sessionEmail =
      auth.authenticated && auth.user?.email
        ? String(auth.user.email).trim().toLowerCase()
        : '';
    const userId =
      (auth.authenticated && auth.user?.id ? String(auth.user.id) : '') ||
      (await getOrCreateGuestUserId());

    let isMember = false;
    if (sessionEmail) {
      try {
        isMember = getMembershipStatus(sessionEmail).member?.status === 'active';
      } catch {
        isMember = false;
      }
    }

    let sessions: Array<Record<string, unknown>> = [];
    try {
      const rows =
        typeof toolSessionOperations.listByUserAndTool === 'function'
          ? toolSessionOperations.listByUserAndTool(userId, 'fengshui-space', 12)
          : toolSessionOperations
              .listByUser(userId, 30)
              .filter((s: { toolSlug?: string }) => s.toolSlug === 'fengshui-space')
              .slice(0, 12);
      sessions = rows.map((s: Record<string, unknown>) => ({
        id: s.id,
        createdAt: s.createdAt || s.created_at,
        toolSlug: s.toolSlug || s.tool_slug,
        status: s.status,
      }));
    } catch {
      sessions = [];
    }

    return NextResponse.json({
      success: true,
      isMember,
      authenticated: Boolean(sessionEmail),
      freeLimit: FREE_SAVE_LIMIT,
      used: sessions.length,
      sessions: isMember || sessions.length ? sessions : sessions.slice(0, FREE_SAVE_LIMIT),
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '查询失败' },
      { status: 500 },
    );
  }
}
