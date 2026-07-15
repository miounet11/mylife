// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import {
  deleteProfileDocument,
  getProfileSettings,
  updateProfileDocument,
} from '@/lib/profile-settings-service';
import { resolveProfileUserId } from '@/lib/profile-session';
import type { ProfileDocumentCategory, ProfileDocumentVisibility } from '@/lib/profile-settings-types';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { userId } = await resolveProfileUserId();
    if (!userId) {
      return NextResponse.json({ success: false, error: '无法建立会话，请刷新后重试' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    updateProfileDocument(userId, id, {
      title: body.title,
      category: body.category as ProfileDocumentCategory | undefined,
      content: body.content,
      visibility: body.visibility as ProfileDocumentVisibility | undefined,
      pinned: typeof body.pinned === 'boolean' ? body.pinned : undefined,
    });

    const settings = getProfileSettings(userId, body.fortuneId);
    return NextResponse.json({
      success: true,
      message: '附加文档已更新',
      settings,
    });
  } catch (error: any) {
    const code = `${error?.message || ''}`;
    if (code === 'DOCUMENT_NOT_FOUND') {
      return NextResponse.json({ success: false, error: '文档不存在' }, { status: 404 });
    }
    if (code === 'PIN_LIMIT_REACHED') {
      return NextResponse.json({ success: false, error: '最多置顶 3 篇文档' }, { status: 409 });
    }
    console.error('[API] profile document PATCH failed:', error);
    return NextResponse.json({ success: false, error: '更新失败，请稍后重试' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { userId } = await resolveProfileUserId();
    if (!userId) {
      return NextResponse.json({ success: false, error: '无法建立会话，请刷新后重试' }, { status: 401 });
    }

    const { id } = await params;
    deleteProfileDocument(userId, id);
    const fortuneId = request.nextUrl.searchParams.get('fortuneId');
    const settings = getProfileSettings(userId, fortuneId);

    return NextResponse.json({
      success: true,
      message: '附加文档已删除',
      settings,
    });
  } catch (error: any) {
    if (`${error?.message || ''}` === 'DOCUMENT_NOT_FOUND') {
      return NextResponse.json({ success: false, error: '文档不存在' }, { status: 404 });
    }
    console.error('[API] profile document DELETE failed:', error);
    return NextResponse.json({ success: false, error: '删除失败，请稍后重试' }, { status: 500 });
  }
}
