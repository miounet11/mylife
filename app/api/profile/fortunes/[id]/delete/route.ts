// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getProfileSettings, softDeleteProfileFortune } from '@/lib/profile-settings-service';
import { resolveProfileUserId } from '@/lib/profile-session';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { userId } = await resolveProfileUserId();
    if (!userId) {
      return NextResponse.json({ success: false, error: '无法建立会话，请刷新后重试' }, { status: 401 });
    }

    const { id } = await params;
    softDeleteProfileFortune(userId, id);
    const settings = getProfileSettings(userId);

    return NextResponse.json({
      success: true,
      message: '档案已删除',
      settings,
    });
  } catch (error: any) {
    const code = `${error?.message || ''}`;
    if (code === 'FORTUNE_NOT_FOUND') {
      return NextResponse.json({ success: false, error: '未找到对应档案' }, { status: 404 });
    }
    if (code === 'LAST_FORTUNE_PROTECTED') {
      return NextResponse.json({ success: false, error: '至少保留一份档案' }, { status: 409 });
    }
    if (code === 'PRIMARY_FORTUNE_PROTECTED') {
      return NextResponse.json({ success: false, error: '默认档案不能直接删除，请先切换默认档案' }, { status: 409 });
    }
    console.error('[API] profile fortune delete failed:', error);
    return NextResponse.json({ success: false, error: '删除失败，请稍后重试' }, { status: 500 });
  }
}
