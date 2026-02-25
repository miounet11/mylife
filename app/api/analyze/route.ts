import { NextRequest, NextResponse } from 'next/server';
import { analyzeFortune } from '@/lib/fortune-engine';
import { generateFortuneInterpretation } from '@/lib/llm';
import { createFortuneWithUser } from '@/lib/database';
import { getOrCreateGuestUserId } from '@/lib/user-utils';
import { calculateTrueSolarTime } from '@/lib/solar-time';
import { validateAnalyzeRequest } from '@/lib/validators';
import { checkRateLimit, RATE_LIMITS, getClientKey } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    // 速率限制
    const clientKey = getClientKey(request);
    const rateLimit = checkRateLimit(`analyze:${clientKey}`, RATE_LIMITS.analyze);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, error: '请求过于频繁，请稍后再试' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil((rateLimit.resetAt - Date.now()) / 1000)) } }
      );
    }

    const data = await request.json();

    // 完整输入验证
    const validation = validateAnalyzeRequest(data);
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.errors[0].message, errors: validation.errors },
        { status: 400 }
      );
    }

    // 转换日期
    const [year, month, day] = (data.birthDate as string).split('-').map(Number);
    const [hour, minute] = (data.birthTime as string).split(':').map(Number);
    const second = (data.birthSecond as number) || 0;
    const longitude = (data.longitude as number) || 116.407;
    const timezone = (data.timezone as number) || 8;
    const birthDate = new Date(year, month - 1, day);

    // 计算真太阳时
    let solarTimeInfo = null;
    let effectiveYear = year;
    let effectiveMonth = month;
    let effectiveDay = day;
    let effectiveHour = hour;
    let effectiveMinute = minute;
    let effectiveSecond = second;

    if (data.useSolarTime && longitude !== undefined) {
      solarTimeInfo = calculateTrueSolarTime(year, month, day, hour, minute, second, longitude, timezone);
      effectiveYear = solarTimeInfo.year;
      effectiveMonth = solarTimeInfo.month;
      effectiveDay = solarTimeInfo.day;
      effectiveHour = solarTimeInfo.hour;
      effectiveMinute = solarTimeInfo.minute;
      effectiveSecond = solarTimeInfo.second;
      console.log(`[Solar Time] 钟表时间: ${year}-${month}-${day} ${hour}:${minute}:${second} → 真太阳时: ${effectiveYear}-${effectiveMonth}-${effectiveDay} ${effectiveHour}:${effectiveMinute}:${effectiveSecond} (修正${solarTimeInfo.correctionMinutes.toFixed(1)}分钟)`);
    }

    const effectiveBirthDate = new Date(effectiveYear, effectiveMonth - 1, effectiveDay);
    const effectiveBirthTime = `${String(effectiveHour).padStart(2, '0')}:${String(effectiveMinute).padStart(2, '0')}`;

    // 基础八字排盘分析 (使用真太阳时)
    const baseResult = analyzeFortune(
      data.name,
      effectiveBirthDate,
      effectiveBirthTime,
      data.birthPlace || '北京',
      timezone,
      data.gender || 'male'
    );

    // 尝试调用 LLM 生成深度解析
    const llmInterpretation = await generateFortuneInterpretation(baseResult);
    const llmUsed = !!llmInterpretation;
    
    // 合并结果: 如果 LLM 成功返回，则用 LLM 的结果覆盖基础结果的部分字段
    // 保留基础排盘的 basic 盘面和 evidence 统计等静态数据，覆盖解析性的文字
    const finalResult = {
      ...baseResult,
      basic: {
        ...baseResult.basic,
        name: data.name,
      },
      pattern: {
        ...baseResult.pattern,
        ...(llmInterpretation?.pattern || {}),
        // 保留引擎的权威格局type，LLM只覆盖description
        type: baseResult.pattern?.type || llmInterpretation?.pattern?.type || '正格',
      },
      fiveElements: llmInterpretation?.fiveElements || baseResult.fiveElements,
      fortune: llmInterpretation?.fortune || baseResult.fortune,
      advice: {
        ...(llmInterpretation?.advice || baseResult.advice),
        // 保留引擎权威的用神忌神数据，LLM不可覆盖
        yongShen: (baseResult.advice as any)?.yongShen || [],
        jiShen: (baseResult.advice as any)?.jiShen || [],
        xiShen: (baseResult.advice as any)?.xiShen || [],
        colors: (baseResult.advice as any)?.colors || [],
        directions: (baseResult.advice as any)?.directions || [],
        numbers: (baseResult.advice as any)?.numbers || [],
      },
      analysis: {
        ...(llmInterpretation?.analysis || baseResult.analysis),
        llmUsed, // 记录是否使用了 LLM
      },
      evidence: {
        ...baseResult.evidence,
        celebrities: llmInterpretation?.evidence?.celebrities || baseResult.evidence.celebrities
      }
    };

    // 生成报告ID
    const reportId = generateReportId();
    
    // 获取或创建用户 ID (基于Cookie)
    const userId = await getOrCreateGuestUserId();

    // 事务：更新用户档案 + 存储命理数据（原子操作）
    createFortuneWithUser(
      userId,
      {
        name: data.name as string,
        gender: (data.gender as 'male' | 'female') || 'male',
        birth_date: data.birthDate as string,
        birth_time: data.birthTime as string,
        birth_place: (data.birthPlace as string) || '北京',
        timezone: (data.timezone as number) || 8,
      },
      {
        id: reportId,
        userId,
        name: data.name as string,
        birthDate: data.birthDate as string,
        birthTime: data.birthTime as string,
        birthPlace: (data.birthPlace as string) || '北京',
        timezone: (data.timezone as number) || 8,
        gender: (data.gender as 'male' | 'female') || 'male',
        bazi: finalResult.basic,
        fiveElements: finalResult.fiveElements,
        tenGods: finalResult.tenGods || {},
        pattern: finalResult.pattern,
        fortune: finalResult.fortune,
        advice: finalResult.advice as import('@/lib/user-types').FortuneAdvice,
        evidence: finalResult.evidence,
        analysis: finalResult.analysis,
        klineData: finalResult.klineData,
      }
    );

    // 返回结果
    return NextResponse.json({
      success: true,
      reportId,
      result: finalResult,
      llm: {
        used: llmUsed,
        fallbackToEngine: !llmUsed,
      },
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
