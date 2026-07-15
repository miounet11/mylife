// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import {
  extractDocumentFromEmail,
  extractDocumentFromReport,
} from '@/lib/profile-document-extract';
import { createProfileDocument, getProfileSettings } from '@/lib/profile-settings-service';

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session.authenticated || !session.user?.id || !session.user.email) {
      return NextResponse.json({ success: false, error: '请先登录' }, { status: 401 });
    }

    const body = await request.json();
    const source = `${body.source || ''}`;
    const sourceId = `${body.sourceId || ''}`.trim();
    const fortuneId = typeof body.fortuneId === 'string' ? body.fortuneId : undefined;
    const autoSave = body.autoSave === true;

    if (!sourceId) {
      return NextResponse.json({ success: false, error: '缺少 sourceId' }, { status: 400 });
    }
    if (source !== 'email' && source !== 'report') {
      return NextResponse.json({ success: false, error: '不支持的提取来源' }, { status: 400 });
    }

    let draft = null as ReturnType<typeof extractDocumentFromEmail> | null;
    if (source === 'email' || source === 'email_thread') {
      draft = extractDocumentFromEmail(sourceId, session.user.email);
    } else if (source === 'report') {
      draft = extractDocumentFromReport(sourceId, session.user.id);
    }

    if (!draft) {
      return NextResponse.json({ success: false, error: '无法提取内容，来源不存在或无权访问' }, { status: 404 });
    }

    const targetFortuneId = fortuneId || draft.fortuneId || null;

    if (autoSave) {
      const saved = createProfileDocument(session.user.id, {
        fortuneId: targetFortuneId,
        title: draft.title,
        category: draft.category,
        content: draft.content,
        visibility: 'engine',
        pinned: false,
      });
      const settings = getProfileSettings(session.user.id, targetFortuneId || undefined);
      return NextResponse.json({
        success: true,
        saved: true,
        documentId: saved.id,
        draft,
        message: '已保存到附加文档',
        settings,
      });
    }

    return NextResponse.json({
      success: true,
      saved: false,
      draft: {
        ...draft,
        fortuneId: targetFortuneId,
      },
    });
  } catch (error: any) {
    const code = `${error?.message || ''}`;
    if (code === 'DOCUMENT_LIMIT_REACHED') {
      return NextResponse.json({ success: false, error: '附加文档已达上限（20 篇）' }, { status: 409 });
    }
    console.error('[API] profile document extract failed:', error);
    return NextResponse.json({ success: false, error: '提取失败，请稍后重试' }, { status: 500 });
  }
}