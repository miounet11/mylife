// 事件API
import { NextRequest, NextResponse } from 'next/server';
import { eventOperations } from '@/lib/database';
import { syncReportFeedbackLoop } from '@/lib/report-feedback-loop';
import { generateId } from '@/lib/utils';
import { getOrCreateGuestUserId } from '@/lib/user-utils';
import { validateEventRequest } from '@/lib/validators';
import { trackServerEvent } from '@/lib/analytics';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const userId = await getOrCreateGuestUserId();
    const source = typeof data.source === 'string' ? data.source : 'manual';

    // 完整输入验证
    const validation = validateEventRequest(data);
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.errors[0].message, errors: validation.errors },
        { status: 400 }
      );
    }

    // 生成事件ID
    const eventId = data.id || generateId();

    // 创建事件
    eventOperations.create({
      id: eventId,
      userId,
      type: data.type,
      title: data.title,
      date: data.date,
      time: data.time,
      description: data.description,
      impact: data.impact || 'neutral',
      fortuneAnalysis: data.fortuneAnalysis || {},
      userFeedback: {},
      followUpAdvice: data.followUpAdvice || {},
      reminderEnabled: data.reminderEnabled || false,
      reminderAdvanceDays: data.reminderAdvanceDays || 60,
      reminderMethod: data.reminderMethod || 'app',
    });

    trackServerEvent({
      userId,
      sessionId: userId,
      eventName: 'event_created',
      page: '/events',
      meta: {
        eventId,
        type: data.type,
        reminderEnabled: !!data.reminderEnabled,
        source,
        reportId: data.fortuneAnalysis?.reportId || null,
      },
    });

    if (source === 'result_report') {
      trackServerEvent({
        userId,
        sessionId: userId,
        eventName: 'report_event_saved_from_result',
        page: typeof data.page === 'string' ? data.page : '/result',
        meta: {
          eventId,
          type: data.type,
          reportId: data.fortuneAnalysis?.reportId || null,
          suggestionKey: data.fortuneAnalysis?.suggestionKey || null,
        },
      });
    }

    if (source === 'chat_message') {
      trackServerEvent({
        userId,
        sessionId: userId,
        eventName: 'chat_event_saved',
        page: typeof data.page === 'string' ? data.page : '/chat',
        meta: {
          eventId,
          type: data.type,
          reportId: data.fortuneAnalysis?.reportId || null,
        },
      });
    }

    const linkedReportId = data.fortuneAnalysis?.reportId;
    if (typeof linkedReportId === 'string' && linkedReportId) {
      syncReportFeedbackLoop(linkedReportId);
    }

    return NextResponse.json({
      success: true,
      eventId,
      message: '事件创建成功',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[API] 创建事件失败:', error);
    return NextResponse.json(
      { success: false, error: '创建失败，请稍后重试' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const userId = await getOrCreateGuestUserId();
    const data = await request.json();
    const eventId = data.id;

    if (!eventId) {
      return NextResponse.json(
        { success: false, error: '缺少事件ID' },
        { status: 400 }
      );
    }

    const existing = eventOperations.getById(eventId);
    if (!existing || existing.userId !== userId) {
      return NextResponse.json(
        { success: false, error: '事件不存在' },
        { status: 404 }
      );
    }

    const updates: Record<string, unknown> = {};

    if (data.title !== undefined) updates.title = data.title;
    if (data.type !== undefined) updates.type = data.type;
    if (data.date !== undefined) updates.date = data.date;
    if (data.time !== undefined) updates.time = data.time;
    if (data.description !== undefined) updates.description = data.description;
    if (data.impact !== undefined) updates.impact = data.impact;
    if (data.fortuneAnalysis !== undefined) updates.fortuneAnalysis = data.fortuneAnalysis;
    if (data.userFeedback !== undefined) updates.userFeedback = data.userFeedback;
    if (data.followUpAdvice !== undefined) updates.followUpAdvice = data.followUpAdvice;
    if (data.reminderEnabled !== undefined) updates.reminderEnabled = !!data.reminderEnabled;
    if (data.reminderAdvanceDays !== undefined) updates.reminderAdvanceDays = data.reminderAdvanceDays;
    if (data.reminderMethod !== undefined) updates.reminderMethod = data.reminderMethod;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { success: false, error: '没有可更新字段' },
        { status: 400 }
      );
    }

    eventOperations.update(eventId, updates);
    const updated = eventOperations.getById(eventId);
    const previousReportId = (existing.fortuneAnalysis as { reportId?: string } | undefined)?.reportId;
    const nextReportId = (updated?.fortuneAnalysis as { reportId?: string } | undefined)?.reportId;

    trackServerEvent({
      userId,
      sessionId: userId,
      eventName: 'event_updated',
      page: '/events',
      meta: {
        eventId,
        updatedFields: Object.keys(updates),
      },
    });

    if (data.userFeedback !== undefined) {
      trackServerEvent({
        userId,
        sessionId: userId,
        eventName: 'event_feedback_recorded',
        page: '/events',
        meta: {
          eventId,
          wasAccurate: data.userFeedback?.wasAccurate ?? null,
        },
      });
    }

    if (previousReportId) {
      syncReportFeedbackLoop(previousReportId);
    }
    if (nextReportId && nextReportId !== previousReportId) {
      syncReportFeedbackLoop(nextReportId);
    }

    return NextResponse.json({
      success: true,
      data: updated,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[API] 更新事件失败:', error);
    return NextResponse.json(
      { success: false, error: '更新失败' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userId = await getOrCreateGuestUserId();
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('id');

    if (!eventId) {
      return NextResponse.json(
        { success: false, error: '缺少事件ID' },
        { status: 400 }
      );
    }

    const existing = eventOperations.getById(eventId);
    if (!existing || existing.userId !== userId) {
      return NextResponse.json(
        { success: false, error: '事件不存在' },
        { status: 404 }
      );
    }

    const linkedReportId = (existing.fortuneAnalysis as { reportId?: string } | undefined)?.reportId;
    eventOperations.delete(eventId);

    trackServerEvent({
      userId,
      sessionId: userId,
      eventName: 'event_deleted',
      page: '/events',
      meta: {
        eventId,
      },
    });

    if (linkedReportId) {
      syncReportFeedbackLoop(linkedReportId);
    }

    return NextResponse.json({
      success: true,
      message: '事件已删除',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[API] 删除事件失败:', error);
    return NextResponse.json(
      { success: false, error: '删除失败' },
      { status: 500 }
    );
  }
}

// 获取用户的所有事件
export async function GET(request: NextRequest) {
  try {
    const userId = await getOrCreateGuestUserId();
    const { searchParams } = new URL(request.url!);
    const type = searchParams.get('type');
    const reportId = searchParams.get('reportId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    let events;

    if (startDate && endDate) {
      events = eventOperations.getByDateRange(userId, startDate, endDate);
    } else {
      events = eventOperations.getByUserId(userId);
    }

    // 如果有类型筛选
    if (type && type !== 'all') {
      events = events.filter((event: any) => event.type === type);
    }

    if (reportId) {
      events = events.filter(
        (event: any) => (event.fortuneAnalysis as { reportId?: string } | undefined)?.reportId === reportId
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        events,
        total: events.length,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[API] 获取事件列表失败:', error);
    return NextResponse.json(
      { success: false, error: '获取失败' },
      { status: 500 }
    );
  }
}
