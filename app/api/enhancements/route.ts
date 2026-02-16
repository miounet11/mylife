// 增运API
import { NextRequest, NextResponse } from 'next/server';
import { generateId } from '@/lib/utils';

export async function POST(request: NextRequest) {(request: NextRequest) {
  try {
    const data = await request.json();
    
    // 验证数据
    if (!data.userId || !data.type || !data.title) {
      return NextResponse.json(
        { success: false, error: '缺少必要参数' },
        { status: 400 }
      );
    }

    // 生成增运ID
    const enhancementId = generateId();

    // 创建增运记录
    const enhancement = {
      id: enhancementId,
      userId: data.userId,
      type: data.type, // 'color' | 'direction' | 'amulet' | 'ritual' | 'date'
      title: data.title,
      description: data.description,
      effectiveness: data.effectiveness || 7, // 有效期（天数）
      startDate: data.startDate || new Date().toISOString(),
      endDate: new Date(Date.now() + (data.effectiveness || 7) * 86400000).toISOString(),
      specificAdvice: {
        colors: data.colors || [],
        directions: data.directions || [],
        items: data.items || [],
        actions: data.actions || [],
      },
      usage: {
        timesUsed: 0,
        lastUsed: null,
        effectiveness: 0.8, // 默认有效性评分
      },
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      enhancementId,
      enhancement,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[API] 创建增运失败:', error);
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
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: '缺少用户ID' },
        { status: 400 }
      );
    }

    // 模拟获取增运记录
    const enhancements: any[] = [
      {
        id: '1',
        userId,
        type: 'color',
        title: '今日穿红色系衣服',
        description: '根据您的八字，今日火旺，宜穿红色系衣服增运',
        effectiveness: 1, // 1天
        startDate: new Date(Date.now() - 86400000).toISOString(),
        endDate: new Date(Date.now() + 86400000).toISOString(),
        specificAdvice: {
          colors: ['红色', '紫色'],
          directions: ['南方', '东南方'],
          items: ['红色T恤', '紫色围巾'],
          actions: ['穿红色衣服', '配紫色配饰'],
        },
        usage: {
          timesUsed: 1,
          lastUsed: new Date().toISOString(),
          effectiveness: 0.9,
        },
      },
      {
        id: '2',
        userId,
        type: 'direction',
        title: '南方为今日吉方',
        description: '根据您的八字，南方为今日吉方，宜往南方发展，利于事业和财运',
        effectiveness: 1,
        startDate: new Date(Date.now() - 86400000).toISOString(),
        endDate: new Date(Date.now() + 86400000).toISOString(),
        specificAdvice: {
          colors: ['红色', '紫色'],
          directions: ['南方', '东南方'],
          items: [],
          actions: ['往南方出差', '在南方开会', '南方客户拜访'],
        },
        usage: {
          timesUsed: 2,
          lastUsed: new Date().toISOString(),
          effectiveness: 0.85,
        },
      },
      {
        id: '3',
        userId,
        type: 'amulet',
        title: '佩戴紫水晶手串',
        description: '根据您的八字，紫水晶能增强火能量，适合在事业上升期佩戴',
        effectiveness: 90, // 90天
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 90 * 86400000).toISOString(),
        specificAdvice: {
          colors: ['紫色', '蓝色'],
          directions: ['南方', '西方'],
          items: ['紫水晶手串', '紫水晶项链'],
          actions: ['佩戴左手', '每天佩戴8小时', '定期净化'],
        },
        usage: {
          timesUsed: 10,
          lastUsed: new Date().toISOString(),
          effectiveness: 0.95,
        },
      },
      {
        id: '4',
        userId,
        type: 'ritual',
        title: '拜财神',
        description: '根据您的八字，今天财运一般，建议拜财神增运',
        effectiveness: 1,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 86400000).toISOString(),
        specificAdvice: {
          colors: ['红色', '金色'],
          directions: ['南方', '东北方'],
          items: ['香炉', '财神像', '水果供品'],
          actions: ['点三支香', '供奉水果', '念财神咒'],
        },
        usage: {
          timesUsed: 0,
          lastUsed: null,
          effectiveness: 0.8,
        },
      },
      {
        id: '5',
        userId,
        type: 'date',
        title: '1月20日是签约吉日',
        description: '根据您的八字，1月20日是签约吉日，事业运旺，宜把握机遇',
        effectiveness: 1,
        startDate: new Date('2024-01-20').toISOString(),
        endDate: new Date('2024-01-20').toISOString(),
        specificAdvice: {
          colors: ['红色', '紫色'],
          directions: ['南方'],
          items: [],
          actions: ['签订合同', '完成项目', '提交报告'],
        },
        usage: {
          timesUsed: 0,
          lastUsed: null,
          effectiveness: 1.0, // 预测准确性
        },
      },
    ];

    // 类型筛选
    const filteredEnhancements = type && type !== 'all'
      ? enhancements.filter(e => e.type === type)
      : enhancements;

    // 日期范围筛选
    const dateFiltered = startDate && endDate
      ? filteredEnhancements.filter(e => {
          const start = new Date(e.startDate);
          const end = new Date(e.endDate);
          const filterStart = new Date(startDate);
          const filterEnd = new Date(endDate);
          return start >= filterStart && end <= filterEnd;
        })
      : filteredEnhancements;

    // 按类型分组
    const grouped = dateFiltered.reduce((acc: any, item) => {
      if (!acc[item.type]) {
        acc[item.type] = [];
      }
      acc[item.type].push(item);
      return acc;
    }, {});

    // 计算统计
    const statistics = {
      total: dateFiltered.length,
      byType: {
        color: (grouped.color || []).length,
        direction: (grouped.direction || []).length,
        amulet: (grouped.amulet || []).length,
        ritual: (grouped.ritual || []).length,
        date: (grouped.date || []).length,
      },
      effectiveness: {
        average: dateFiltered.reduce((sum, item) => sum + item.usage.effectiveness, 0) / dateFiltered.length,
        max: Math.max(...dateFiltered.map(item => item.usage.effectiveness)),
        min: Math.min(...dateFiltered.map(item => item.usage.effectiveness)),
      },
    };

    return NextResponse.json({
      success: true,
      data: {
        enhancements: dateFiltered,
        grouped,
        statistics,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[API] 获取增运失败:', error);
    return NextResponse.json(
      { success: false, error: '获取失败，请稍后重试' },
      { status: 500 }
    );
  }
}

// 更新增运使用记录
export async function PUT(request: NextRequest) {(request: NextRequest) {
  try {
    const data = await request.json();
    const { enhancementId, userId } = data;

    if (!enhancementId || !userId) {
      return NextResponse.json(
        { success: false, error: '缺少必要参数' },
        { status: 400 }
      );
    }

    // 更新使用记录（这里简化，实际应该更新数据库）
    const updated = {
      timesUsed: (data.timesUsed || 0) + 1,
      lastUsed: new Date().toISOString(),
      effectiveness: data.effectiveness || 0.9,
    };

    return NextResponse.json({
      success: true,
      updated,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[API] 更新增运失败:', error);
    return NextResponse.json(
      { success: false, error: '更新失败，请稍后重试' },
      { status: 500 }
    );
  }
}

// 删除增运
export async function DELETE(request: NextRequest) {(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url!);
    const enhancementId = searchParams.get('id');

    if (!enhancementId) {
      return NextResponse.json(
        { success: false, error: '缺少增运ID' },
        { status: 400 }
      );
    }

    // 删除增运（这里简化，实际应该删除数据库中的记录）
    // 这里只是返回成功

    return NextResponse.json({
      success: true,
      message: '增运删除成功',
      enhancementId,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[API] 删除增运失败:', error);
    return NextResponse.json(
      { success: false, error: '删除失败，请稍后重试' },
      { status: 500 }
    );
  }
}
