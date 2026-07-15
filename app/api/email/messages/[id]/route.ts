// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { emailInboxStore } from '@/lib/email-inbox-store';

const CATEGORY_LABELS: Record<string, string> = {
  daily: '日常运势',
  monthly: '月度窗口',
  solar_term: '节气提醒',
  major_event: '命理大事',
  subscription: '订阅确认',
  lifecycle: '使用提醒',
  report: '报告更新',
};

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const message = emailInboxStore.getById(id);
    if (!message) {
      return NextResponse.json({ success: false, error: '邮件不存在' }, { status: 404 });
    }

    const session = await getAuthSession();
    const requestEmail = request.nextUrl.searchParams.get('email')?.trim().toLowerCase() || '';
    if (session.authenticated && session.user?.email) {
      const sessionEmail = session.user.email.trim().toLowerCase();
      if (sessionEmail !== message.email) {
        return NextResponse.json({ success: false, error: '无权查看此邮件' }, { status: 403 });
      }
    } else if (requestEmail && requestEmail !== message.email) {
      return NextResponse.json({ success: false, error: '邮箱不匹配' }, { status: 403 });
    }

    const replies = emailInboxStore.listReplies(message.id);
    return NextResponse.json({
      success: true,
      message: {
        ...message,
        categoryLabel: CATEGORY_LABELS[message.category] || '系统邮件',
      },
      replies,
    });
  } catch (error) {
    console.error('[API] 获取邮件详情失败:', error);
    return NextResponse.json({ success: false, error: '获取失败，请稍后重试' }, { status: 500 });
  }
}