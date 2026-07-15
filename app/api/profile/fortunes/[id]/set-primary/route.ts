// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getProfileSettings, setPrimaryProfileFortune } from '@/lib/profile-settings-service';
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
    setPrimaryProfileFortune(userId, id);
    const settings = getProfileSettings(userId, id);

    return NextResponse.json({
      success: true,
      message: '已设为默认档案',
      settings,
    });
  } catch (error: any) {
    if (`${error?.message || ''}` === 'FORTUNE_NOT_FOUND') {
      return NextResponse.json({ success: false, error: '未找到对应档案' }, { status: 404 });
    }
    console.error('[API] profile set-primary failed:', error);
    return NextResponse.json({ success: false, error: '设置失败，请稍后重试' }, { status: 500 });
  }
}
