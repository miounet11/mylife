// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { createProfileDocument, getProfileSettings } from '@/lib/profile-settings-service';
import { resolveProfileUserId } from '@/lib/profile-session';
import type { ProfileDocumentCategory, ProfileDocumentVisibility } from '@/lib/profile-settings-types';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await resolveProfileUserId();
    if (!userId) {
      return NextResponse.json({ success: false, error: '无法建立会话，请刷新后重试' }, { status: 401 });
    }

    const body = await request.json();
    if (!body.title || !body.content) {
      return NextResponse.json({ success: false, error: '请填写标题和正文' }, { status: 400 });
    }

    const result = createProfileDocument(userId, {
      fortuneId: typeof body.fortuneId === 'string' ? body.fortuneId : null,
      title: body.title,
      category: (body.category || 'other') as ProfileDocumentCategory,
      content: body.content,
      visibility: (body.visibility || 'engine') as ProfileDocumentVisibility,
      pinned: body.pinned === true,
    });

    const settings = getProfileSettings(userId, body.fortuneId);
    return NextResponse.json({
      ...result,
      message: '附加文档已保存',
      settings,
    });
  } catch (error: any) {
    const code = `${error?.message || ''}`;
    if (code === 'DOCUMENT_LIMIT_REACHED') {
      return NextResponse.json({ success: false, error: '附加文档已达上限（20 篇）' }, { status: 409 });
    }
    if (code === 'PIN_LIMIT_REACHED') {
      return NextResponse.json({ success: false, error: '最多置顶 3 篇文档' }, { status: 409 });
    }
    if (code === 'DOCUMENT_CONTENT_REQUIRED') {
      return NextResponse.json({ success: false, error: '文档正文不能为空' }, { status: 400 });
    }
    console.error('[API] profile document POST failed:', error);
    return NextResponse.json({ success: false, error: '保存失败，请稍后重试' }, { status: 500 });
  }
}
