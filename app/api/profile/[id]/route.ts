// 用户档案API
import { NextRequest, NextResponse } from 'next/server';
import { userOperations } from '@/lib/database';
import { generateId, formatDate } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // 验证数据
    if (!data.name || !data.birthDate || !data.birthTime || !data.gender) {
      return NextResponse.json(
        { success: false, error: '缺少必要参数' },
        { status: 400 }
      );
    }

    // 生成用户ID
    const userId = data.userId || generateId();

    // 创建用户
    const result = userOperations.create({
      id: userId,
      name: data.name,
      email: data.email || null,
      gender: data.gender,
      birthDate: data.birthDate,
      birthTime: data.birthTime,
      birthPlace: data.birthPlace || '北京',
      timezone: data.timezone || 8,
    });

    return NextResponse.json({
      success: true,
      userId,
      message: '用户档案创建成功',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[API] 创建用户档案失败:', error);
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
    const user = userOperations.getById(params.id);

    if (!user) {
      return NextResponse.json(
        { success: false, error: '未找到用户' },
        { status: 404 }
      );
    }

    // 获取用户的命理数据
    const fortunes = []; // 这里应该调用fortunes查询

    // 获取用户的事件
    const events = []; // 这里应该调用events查询

    return NextResponse.json({
      success: true,
      data: {
        user,
        fortunes: fortunes.slice(0, 5), // 最近5次分析
        events: events.slice(0, 10), // 最近10个事件
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[API] 获取用户档案失败:', error);
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

    // 更新用户
    const result = userOperations.update(params.id, updates);

    return NextResponse.json({
      success: true,
      message: '用户档案更新成功',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[API] 更新用户档案失败:', error);
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
    // 删除用户
    const result = userOperations.delete(params.id);

    return NextResponse.json({
      success: true,
      message: '用户档案删除成功',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[API] 删除用户档案失败:', error);
    return NextResponse.json(
      { success: false, error: '删除失败，请稍后重试' },
      { status: 500 }
    );
  }
}
