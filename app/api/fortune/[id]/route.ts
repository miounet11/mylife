// 命理数据API
import { NextRequest, NextResponse } from 'next/server';

// 模拟数据库（实际应该用SQLite）
const fortuneDatabase = new Map();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const reportId = params.id;
    const fortuneData = fortuneDatabase.get(reportId);

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

    // 保存到数据库
    fortuneDatabase.set(reportId, fortuneData);

    return NextResponse.json({
      success: true,
      message: '命理数据已保存',
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
