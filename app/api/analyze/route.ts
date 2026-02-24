import { NextRequest, NextResponse } from 'next/server';
import { analyzeFortune } from '@/lib/fortune-engine';
import { generateFortuneInterpretation } from '@/lib/llm';
import { fortuneOperations, userOperations } from '@/lib/database';
import { getOrCreateGuestUserId } from '@/lib/user-utils';

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

    // 基础八字排盘分析 (Fact)
    const baseResult = analyzeFortune(
      data.name,
      birthDate,
      data.birthTime,
      data.birthPlace || '北京',
      data.timezone || 8,
      data.gender || 'male'
    );

    // 尝试调用 LLM 生成深度解析
    const llmInterpretation = await generateFortuneInterpretation(baseResult);
    
    // 合并结果: 如果 LLM 成功返回，则用 LLM 的结果覆盖基础结果的部分字段
    // 保留基础排盘的 basic 盘面和 evidence 统计等静态数据，覆盖解析性的文字
    const finalResult = {
      ...baseResult,
      basic: {
        ...baseResult.basic,
        description: llmInterpretation?.basic || baseResult.basic.description || ""
      },
      pattern: llmInterpretation?.pattern || baseResult.pattern,
      fiveElements: llmInterpretation?.fiveElements || baseResult.fiveElements,
      fortune: llmInterpretation?.fortune || baseResult.fortune,
      advice: llmInterpretation?.advice || baseResult.advice,
      analysis: llmInterpretation?.analysis || baseResult.analysis,
      evidence: {
        ...baseResult.evidence,
        celebrities: llmInterpretation?.evidence?.celebrities || baseResult.evidence.celebrities
      }
    };

    // 生成报告ID
    const reportId = generateReportId();
    
    // 获取或创建用户 ID (为演示，随机生成 guest ID)
    const userId = getOrCreateGuestUserId();
    
    try {
      // 确保存入 User (简单处理：插入不重复的用户)
      userOperations.create({
         id: userId,
         name: data.name,
         email: null,
         gender: data.gender || 'male',
         birthDate: data.birthDate,
         birthTime: data.birthTime,
         birthPlace: data.birthPlace || '北京',
         timezone: data.timezone || 8
      });
    } catch(e) {
      // ignore if user already exists or constraint fails
    }

    // 将结果存入数据库
    fortuneOperations.create({
      id: reportId,
      userId: userId,
      name: data.name,
      birthDate: data.birthDate,
      birthTime: data.birthTime,
      birthPlace: data.birthPlace || '北京',
      timezone: data.timezone || 8,
      gender: data.gender || 'male',
      bazi: finalResult.basic,
      fiveElements: finalResult.fiveElements,
      tenGods: finalResult.tenGods || {},
      pattern: finalResult.pattern,
      fortune: finalResult.fortune,
      advice: finalResult.advice,
      evidence: finalResult.evidence,
      analysis: finalResult.analysis
    });

    // 返回结果
    return NextResponse.json({
      success: true,
      reportId,
      result: finalResult,
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
