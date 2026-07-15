import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import {
  checkFeedbackRateLimit,
  createSiteFeedback,
  isValidFeedbackCategory,
} from '@/lib/user-feedback-store';
import { notifyFeedbackReceived } from '@/lib/user-feedback-notify';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function clientIp(request: NextRequest) {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0]?.trim() || '';
  return request.headers.get('x-real-ip') || '';
}

export async function POST(request: NextRequest) {
  try {
    const ip = clientIp(request);
    if (!checkFeedbackRateLimit(ip || 'unknown', 8)) {
      return NextResponse.json(
        { success: false, error: '提交过于频繁，请稍后再试' },
        { status: 429 },
      );
    }

    const body = await request.json().catch(() => ({}));
    const category = `${body.category || ''}`.trim();
    const message = `${body.message || ''}`.trim();
    const pageUrl = `${body.pageUrl || body.url || ''}`.trim();

    if (!isValidFeedbackCategory(category)) {
      return NextResponse.json({ success: false, error: '请选择问题类型' }, { status: 400 });
    }
    if (message.length < 4) {
      return NextResponse.json({ success: false, error: '请填写至少 4 个字的说明' }, { status: 400 });
    }
    if (message.length > 4000) {
      return NextResponse.json({ success: false, error: '说明过长，请控制在 4000 字内' }, { status: 400 });
    }
    if (pageUrl && pageUrl.length > 1000) {
      return NextResponse.json({ success: false, error: '页面链接过长' }, { status: 400 });
    }

    let userId: string | null = null;
    try {
      const session = await getAuthSession();
      if (session.authenticated && session.user?.id) {
        userId = session.user.id;
      }
    } catch {
      // anonymous is fine
    }

    const record = createSiteFeedback({
      category,
      message,
      pageUrl: pageUrl || null,
      userAgent: request.headers.get('user-agent'),
      clientIp: ip || null,
      userId,
    });

    // Fire-and-forget notify; storage already succeeded.
    void notifyFeedbackReceived(record).catch((error) => {
      console.error('[feedback] notify async error', error);
    });

    return NextResponse.json({
      success: true,
      id: record.id,
      message: '已收到，我们会定期查看并优化。感谢反馈。',
    });
  } catch (error) {
    console.error('[feedback] POST failed', error);
    return NextResponse.json({ success: false, error: '提交失败，请稍后重试' }, { status: 500 });
  }
}
