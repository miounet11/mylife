// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getProfileSettings, upsertProfileSupplement } from '@/lib/profile-settings-service';
import { resolveProfileUserId } from '@/lib/profile-session';
import {
  PROFILE_SUPPLEMENT_DOMAINS,
  type SupplementDomain,
} from '@/lib/profile-settings-types';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ domain: string }> },
) {
  try {
    const { userId } = await resolveProfileUserId();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: '无法建立会话，请刷新后重试' },
        { status: 401 },
      );
    }

    const { domain } = await params;
    if (!(domain in PROFILE_SUPPLEMENT_DOMAINS)) {
      return NextResponse.json(
        { success: false, error: '不支持的补充资料类型' },
        { status: 400 },
      );
    }

    const body = await request.json();
    const fortuneId = typeof body.fortuneId === 'string' ? body.fortuneId : null;
    const fields = body.fields && typeof body.fields === 'object' ? body.fields : {};

    upsertProfileSupplement(
      userId,
      fortuneId,
      domain as SupplementDomain,
      fields,
    );

    const settings = getProfileSettings(userId, fortuneId);
    return NextResponse.json({
      success: true,
      message: '补充资料已保存',
      settings,
    });
  } catch (error: any) {
    if (`${error?.message || ''}` === 'FORTUNE_NOT_FOUND') {
      return NextResponse.json(
        { success: false, error: '未找到对应档案' },
        { status: 404 },
      );
    }

    console.error('[API] profile supplement PUT failed:', error);
    return NextResponse.json(
      { success: false, error: '保存失败，请稍后重试' },
      { status: 500 },
    );
  }
}
