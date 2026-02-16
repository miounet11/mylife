// 命理分析API
import { NextRequest, NextResponse } from 'next/server';
import { analyzeFortune } from '@/lib/fortune-engine';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // 验证数据
    if (!data.name || !data.birthDate || !data.birthTime) {
      return NextResponse.json(
        { success: false, error: '缺少必要参数' },
        { status: 400 }
      );
    }

    // 转换日期
    const birthDate = new Date(data.birthDate);
    const [year, month, day] = data.birthDate.split('-').map(Number);
    const [hour, minute] = data.birthTime.split(':').map(Number);

    // 验证日期有效性
    if (isNaN(birthDate.getTime())) {
      return NextResponse.json(
        { success: false, error: '无效的出生日期' },
        { status: 400 }
      );
    }

    // 分析命理
    const result = analyzeFortune(
      data.name,
      birthDate,
      data.birthTime,
      data.birthPlace || '北京',
      data.timezone || 8,
      data.gender || 'male'
    );

    // 生成报告ID
    const reportId = generateReportId();

    // 返回结果
    return NextResponse.json({
      success: true,
      reportId,
      result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[API] 命理分析失败:', error);
    return NextResponse.json(
      { success: false, error: '分析失败，请稍后重试' },
      { status: 500 }
    );
  }
}

// GET方法 - 获取分析状态
export async function GET(request: NextRequest) {
  return NextResponse.json({
    status: 'online',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
}

// 生成报告ID
function generateReportId(): string {
  return `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
