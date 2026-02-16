// 提醒API
import { NextRequest, NextResponse } from 'next/server';
import { eventOperations } from '@/lib/database';
import { generateId } from '@/lib/utils';

export async function POST(request: NextRequest) {(request: NextRequest) {
  try {
    const data = await request.json();
    
    // 验证数据
    if (!data.userId || !data.eventId) {
      return NextResponse.json(
        { success: false, error: '缺少必要参数' },
        { status: 400 }
      );
    }

    // 生成提醒ID
    const reminderId = generateId();

    // 创建提醒（这里简化，实际应该有独立的提醒表）
    const reminder = {
      id: reminderId,
      userId: data.userId,
      eventId: data.eventId,
      type: data.type || 'app', // 'app' | 'email' | 'sms'
      advanceDays: data.advanceDays || 60,
      enabled: data.enabled || true,
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      reminderId,
      reminder,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[API] 创建提醒失败:', error);
    return NextResponse.json(
      { success: false, error: '创建失败，请稍后重试' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url!);
    const userId = searchParams.get('userId');
    const type = searchParams.get('type');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: '缺少用户ID' },
        { status: 400 }
      );
    }

    // 获取用户的提醒（这里简化，实际应该查询提醒表）
    const reminders = [
      {
        id: '1',
        userId,
        eventId: 'event_1',
        type: 'app',
        title: '面试技术总监职位',
        datetime: new Date(Date.now() + 3600000).toISOString(), // 1小时后
        advanceDays: 60,
        message: '根据您的八字，今天事业运上升，面试成功率90%',
      },
      {
        id: '2',
        userId,
        eventId: 'event_2',
        type: 'email',
        title: '签订重要合同',
        datetime: new Date(Date.now() + 86400000).toISOString(), // 1天后
        advanceDays: 1440,
        message: '根据您的八字，1月20日是签约吉日，事业运旺',
      },
      {
        id: '3',
        userId,
        eventId: 'event_3',
        type: 'app',
        title: '⚠️ 健康化灾预警',
        datetime: new Date(Date.now() + 259200000).toISOString(), // 3天后
        advanceDays: 4320,
        message: '未来7天（农历二月初一至初七）注意脾胃健康，宜清淡饮食',
        severity: 'medium',
        type: 'warning',
      },
    ];

    // 类型筛选
    const filteredReminders = type && type !== 'all'
      ? reminders.filter((r: any) => r.type === type || r.type === 'warning')
      : reminders;

    return NextResponse.json({
      success: true,
      reminders: filteredReminders,
      total: filteredReminders.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[API] 获取提醒失败:', error);
    return NextResponse.json(
      { success: false, error: '获取失败，请稍后重试' },
      { status: 500 }
    );
  }
}

// 删除提醒
export async function DELETE(request: NextRequest) {(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url!);
    const reminderId = searchParams.get('id');

    if (!reminderId) {
      return NextResponse.json(
        { success: false, error: '缺少提醒ID' },
        { status: 400 }
      );
    }

    // 删除提醒（这里简化，实际应该删除提醒表中的记录）
    // 这里只是返回成功

    return NextResponse.json({
      success: true,
      message: '提醒删除成功',
      reminderId,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[API] 删除提醒失败:', error);
    return NextResponse.json(
      { success: false, error: '删除失败，请稍后重试' },
      { status: 500 }
    );
  }
}
