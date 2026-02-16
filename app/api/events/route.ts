// 事件API
import { NextRequest, NextResponse } from 'next/server';
import { eventOperations } from '@/lib/database';
import { generateId } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // 验证数据
    if (!data.userId || !data.type || !data.title || !data.date) {
      return NextResponse.json(
        { success: false, error: '缺少必要参数' },
        { status: 400 }
      );
    }

    // 生成事件ID
    const eventId = data.id || generateId();

    // 创建事件
    const result = eventOperations.create({
      id: eventId,
      userId: data.userId,
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

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const event = eventOperations.getById(params.id);

    if (!event) {
      return NextResponse.json(
        { success: false, error: '未找到事件' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: event,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[API] 获取事件失败:', error);
    return NextResponse.json(
      { success: false, error: '获取失败' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const updates = await request.json();

    // 更新事件
    const result = eventOperations.update(params.id, updates);

    return NextResponse.json({
      success: true,
      message: '事件更新成功',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[API] 更新事件失败:', error);
    return NextResponse.json(
      { success: false, error: '更新失败，请稍后重试' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const result = eventOperations.delete(params.id);

    return NextResponse.json({
      success: true,
      message: '事件删除成功',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[API] 删除事件失败:', error);
    return NextResponse.json(
      { success: false, error: '删除失败，请稍后重试' },
      { status: 500 }
    );
  }
}

// 获取用户的所有事件
export async function getAll(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url!);
    const userId = searchParams.get('userId');
    const type = searchParams.get('type');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: '缺少用户ID' },
        { status: 400 }
      );
    }

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
