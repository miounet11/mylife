// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { fortuneOperations } from '@/lib/database';
import { sendEmailReplyAnswerMail } from '@/lib/email-reply-mail';
import { emailInboxStore } from '@/lib/email-inbox-store';
import { generateProfessionalEmailReply } from '@/lib/email-reply-assistant';
import { buildProfileContextPack, formatProfileContextForPrompt } from '@/lib/profile-context-builder';
import { isEmailDeliveryConfigured } from '@/lib/email';
import { validateEmail } from '@/lib/validators';
import { trackServerEvent } from '@/lib/analytics';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const email = `${body.email || ''}`;
    const question = `${body.question || ''}`.trim();

    const emailError = validateEmail(email);
    if (emailError) {
      return NextResponse.json({ success: false, error: emailError.message }, { status: 400 });
    }

    if (!question || question.length < 4) {
      return NextResponse.json({ success: false, error: '请至少输入 4 个字的追问内容' }, { status: 400 });
    }

    if (question.length > 1200) {
      return NextResponse.json({ success: false, error: '追问内容过长，请精简后重试' }, { status: 400 });
    }

    const message = emailInboxStore.getById(id);
    if (!message) {
      return NextResponse.json({ success: false, error: '邮件不存在' }, { status: 404 });
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (message.email !== normalizedEmail) {
      return NextResponse.json({ success: false, error: '只能回复发送到你邮箱的消息' }, { status: 403 });
    }

    const session = await getAuthSession();
    if (session.authenticated && session.user?.email) {
      const sessionEmail = session.user.email.trim().toLowerCase();
      if (sessionEmail !== normalizedEmail) {
        return NextResponse.json({ success: false, error: '邮箱与当前登录账户不一致' }, { status: 403 });
      }
    }

    const inbound = emailInboxStore.createInboundReply({
      inboxMessageId: message.id,
      email: normalizedEmail,
      body: question,
      channel: 'web',
    });
    if (!inbound) {
      return NextResponse.json({ success: false, error: '创建追问失败' }, { status: 500 });
    }

    let reportSummary = '';
    const focusItems = Array.isArray(message.meta?.focusItems)
      ? (message.meta?.focusItems as Array<{ label: string; value: string }>)
      : [];

    if (message.reportId) {
      const report = fortuneOperations.getById(message.reportId);
      if (report) {
        const bazi = report.bazi as { dayMaster?: string } | undefined;
        const pattern = report.pattern as { type?: string } | undefined;
        reportSummary = [
          bazi?.dayMaster ? `日主 ${bazi.dayMaster}` : '',
          pattern?.type ? `格局 ${pattern.type}` : '',
          report.fortune ? `当前大运 ${(report.fortune as { currentDaYun?: string }).currentDaYun || ''}` : '',
        ].filter(Boolean).join(' · ');
      }
    }

    let profileContextSummary = '';
    if (session.authenticated && session.user?.id) {
      const profileContext = buildProfileContextPack(session.user.id, message.reportId || null);
      if (profileContext) {
        profileContextSummary = formatProfileContextForPrompt(profileContext);
      }
    }

    const llmResult = await generateProfessionalEmailReply({
      userQuestion: question,
      message: {
        subject: message.subject,
        preview: message.preview,
        category: message.category,
        reportSummary,
        profileContextSummary,
        focusItems,
      },
    });

    if (!llmResult?.answer) {
      emailInboxStore.markReplyFailed(inbound.id, 'llm_empty_response');
      return NextResponse.json({ success: false, error: '专业回复生成失败，请稍后重试' }, { status: 503 });
    }

    const answered = emailInboxStore.markReplyAnswered(inbound.id, llmResult.answer, llmResult.model);

    if (isEmailDeliveryConfigured()) {
      void sendEmailReplyAnswerMail({
        email: normalizedEmail,
        subject: message.subject,
        originalPreview: message.preview,
        userQuestion: question,
        answer: llmResult.answer,
        messageId: message.id,
        reportId: message.reportId,
      }).catch((error) => {
        console.error('[EmailReply] send answer mail failed:', error);
      });
    }

    trackServerEvent({
      eventName: 'email_message_replied',
      page: '/updates/messages',
      userAgent: request.headers.get('user-agent'),
      meta: {
        messageId: message.id,
        category: message.category,
        emailDomain: normalizedEmail.split('@')[1] || '',
      },
    });

    return NextResponse.json({
      success: true,
      reply: answered,
      answer: llmResult.answer,
    });
  } catch (error) {
    console.error('[API] 邮件追问失败:', error);
    return NextResponse.json({ success: false, error: '追问失败，请稍后重试' }, { status: 500 });
  }
}