// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { emailInboxStore } from '@/lib/email-inbox-store';
import { validateEmail } from '@/lib/validators';

const CATEGORY_LABELS: Record<string, string> = {
  daily: '日常运势',
  monthly: '月度窗口',
  solar_term: '节气提醒',
  major_event: '命理大事',
  subscription: '订阅确认',
  lifecycle: '使用提醒',
  report: '报告更新',
};

export async function GET(request: NextRequest) {
  const email = request.nextUrl.searchParams.get('email') || '';
  const emailError = validateEmail(email);
  if (emailError) {
    return NextResponse.json({ success: false, error: emailError.message }, { status: 400 });
  }

  try {
    const session = await getAuthSession();
    const normalizedEmail = email.trim().toLowerCase();
    if (session.authenticated && session.user?.email) {
      const sessionEmail = session.user.email.trim().toLowerCase();
      if (sessionEmail !== normalizedEmail) {
        return NextResponse.json({ success: false, error: '只能查看当前登录邮箱的邮件记录' }, { status: 403 });
      }
    }

    emailInboxStore.backfillFromTimingLog(normalizedEmail, 40);
    const messages = emailInboxStore.listByEmail(normalizedEmail, 40).map((item) => ({
      ...item,
      categoryLabel: CATEGORY_LABELS[item.category] || '系统邮件',
      replyCount: emailInboxStore.listReplies(item.id).length,
    }));

    return NextResponse.json({
      success: true,
      email: normalizedEmail,
      total: messages.length,
      messages,
    });
  } catch (error) {
    console.error('[API] 获取邮件记录失败:', error);
    return NextResponse.json({ success: false, error: '获取失败，请稍后重试' }, { status: 500 });
  }
}