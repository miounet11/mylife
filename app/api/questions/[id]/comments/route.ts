import { NextRequest, NextResponse } from 'next/server';
import { getPublicQuestionFeedItem } from '@/lib/public-growth-feed';
import { createPublicQuestionComment, listVisiblePublicQuestionComments } from '@/lib/public-question-comments';
import { checkRateLimit, getClientKey, RATE_LIMITS } from '@/lib/rate-limit';
import { getOrCreateGuestUserId } from '@/lib/user-utils';

interface RouteProps {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteProps) {
  const { id } = await params;
  const item = getPublicQuestionFeedItem(id);

  if (!item) {
    return NextResponse.json({ success: false, error: '公开问题不存在' }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    comments: listVisiblePublicQuestionComments(id),
  });
}

export async function POST(request: NextRequest, { params }: RouteProps) {
  const { id } = await params;
  const item = getPublicQuestionFeedItem(id);

  if (!item) {
    return NextResponse.json({ success: false, error: '公开问题不存在' }, { status: 404 });
  }

  const rateLimit = checkRateLimit(`public-comment:${getClientKey(request)}`, RATE_LIMITS.general);
  if (!rateLimit.allowed) {
    return NextResponse.json({ success: false, error: '留言太频繁，请稍后再试' }, { status: 429 });
  }

  try {
    const body = await request.json();
    const userId = await getOrCreateGuestUserId();
    const comment = await createPublicQuestionComment({
      questionId: id,
      questionText: item.question,
      userId,
      sessionId: userId,
      authorName: body?.authorName,
      content: body?.content,
      sourceContext: {
        route: `/questions/${id}`,
        title: item.title,
        contextLabel: item.contextLabel,
        answerSummary: item.answerSummary,
      },
    });

    return NextResponse.json({
      success: true,
      visible: comment.status === 'visible',
      message: comment.status === 'visible' ? '留言已发布' : '留言已提交，但未通过公开审核',
      comment: comment.status === 'visible' ? comment : null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : '留言失败，请稍后重试';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
