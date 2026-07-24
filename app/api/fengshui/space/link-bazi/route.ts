import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { fortuneOperations } from '@/lib/database';
import { getOrCreateGuestUserId } from '@/lib/user-utils';
import { profileLinkFromFortuneRow } from '@/lib/fengshui/space/bazi-space-bridge';
import type { SpaceProfileLink } from '@/lib/fengshui/space/types';

export const runtime = 'nodejs';

/**
 * GET: 读取当前用户主盘并转为 SpaceProfileLink
 * POST body { fortuneId? }: 指定档案
 */
export async function GET(request: NextRequest) {
  return link(request);
}

export async function POST(request: NextRequest) {
  return link(request);
}

async function link(request: NextRequest) {
  try {
    const auth = await getAuthSession();
    const userId =
      (auth.authenticated && auth.user?.id ? String(auth.user.id) : '') ||
      (await getOrCreateGuestUserId());

    let fortuneId: string | null = null;
    if (request.method === 'POST') {
      try {
        const body = await request.json();
        fortuneId = body?.fortuneId ? String(body.fortuneId) : null;
      } catch {
        fortuneId = null;
      }
    } else {
      fortuneId = request.nextUrl.searchParams.get('fortuneId');
    }

    const rows = (
      (fortuneOperations as { getByUserId?: (id: string) => unknown[] }).getByUserId?.(
        userId,
      ) || []
    ) as Array<Record<string, unknown>>;

    const live = rows.filter((r) => !r.deletedAt && !r.deleted_at);
    if (!live.length) {
      return NextResponse.json({
        success: false,
        code: 'no_fortune',
        error: '还没有命盘。请先完成八字排盘后再关联。',
        analyzeUrl: '/analyze?source=fengshui_space_link',
        authenticated: Boolean(auth.authenticated),
      });
    }

    let row = fortuneId ? live.find((r) => String(r.id) === fortuneId) : null;
    if (!row) {
      row =
        live.find((r) => r.isPrimary === true || r.isPrimary === 1) ||
        live.find((r) => r.relation === 'self') ||
        live[0];
    }

    // Prefer full getById if available
    const full =
      ((fortuneOperations as { getById?: (id: string) => unknown }).getById?.(
        String(row.id),
      ) as Record<string, unknown> | null) || row;

    let link: SpaceProfileLink | null = profileLinkFromFortuneRow({
      id: String(full.id || row.id),
      name: String(full.name || row.name || ''),
      birthSignature: String(full.birthSignature || full.birth_signature || ''),
      bazi: full.bazi || full.analysis || full.result,
      analysis: full.analysis,
      truthInput: full.truthInput || full.truth_input,
    });

    // If yongShen empty, try nested result.analysis
    if (link && !link.yongShen.length) {
      const result = (full.result || full.analysis || {}) as Record<string, unknown>;
      const y =
        (result.yongShen as { yongShen?: string[]; xiShen?: string[]; jiShen?: string[] }) ||
        ((result.truthInput as Record<string, unknown>)?.yongShen as {
          yongShen?: string[];
          xiShen?: string[];
          jiShen?: string[];
        });
      if (y) {
        link = {
          ...link,
          yongShen: [...(y.yongShen || []), ...(y.xiShen || [])].filter(Boolean).slice(0, 6),
          jiShen: [...(y.jiShen || [])].filter(Boolean).slice(0, 6),
        };
      }
    }

    if (!link) {
      return NextResponse.json({
        success: false,
        error: '无法解析命盘用神，请打开完整报告后重试。',
        reportUrl: `/result/${row.id}`,
      });
    }

    return NextResponse.json({
      success: true,
      profileLink: link,
      fortunes: live.slice(0, 8).map((r) => ({
        id: String(r.id),
        name: String(r.name || '未命名'),
        isPrimary: Boolean(r.isPrimary === true || r.isPrimary === 1),
        pillarSummary: null as string | null,
      })),
      message: link.yongShen.length
        ? `已关联主盘${link.displayName ? `「${link.displayName}」` : ''} · 用神 ${link.yongShen.join('、')}`
        : `已关联主盘${link.displayName ? `「${link.displayName}」` : ''}（用神待引擎补全，仍可做人宅方位对照）`,
    });
  } catch (error) {
    console.error('[link-bazi]', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '关联失败' },
      { status: 500 },
    );
  }
}
