// 命理数据API
import { NextRequest, NextResponse } from 'next/server';
import { fortuneOperations } from '@/lib/database';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<Record<string, string>> }
) {
  try {
    const resolvedParams = await params;
    const reportId = resolvedParams.id;
    const fortuneData = fortuneOperations.getById(reportId);

    if (!fortuneData) {
      return NextResponse.json(
        { success: false, error: '未找到命理数据' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: fortuneData,
    });
  } catch (error) {
    console.error('[API] 获取命理数据失败:', error);
    return NextResponse.json(
      { success: false, error: '获取失败' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const reportId = data.reportId;
    const fortuneData = data.result;

    if (!reportId || !fortuneData) {
      return NextResponse.json(
        { success: false, error: '缺少必要参数' },
        { status: 400 }
      );
    }

    // 注意：主流程由 /api/analyze 写库，这里仅作为兼容接口保留
    const existing = fortuneOperations.getById(reportId);
    if (!existing) {
      return NextResponse.json(
        { success: false, error: '请通过分析接口创建报告' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '命理数据已存在',
      reportId,
    });
  } catch (error) {
    console.error('[API] 保存命理数据失败:', error);
    return NextResponse.json(
      { success: false, error: '保存失败' },
      { status: 500 }
    );
  }
}
