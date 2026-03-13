import { NextRequest, NextResponse } from 'next/server';
import { createFortuneWithUser } from '@/lib/database';
import { getOrCreateGuestUserId } from '@/lib/user-utils';
import { calculateTrueSolarTime } from '@/lib/solar-time';
import { validateAnalyzeRequest } from '@/lib/validators';
import { checkRateLimit, RATE_LIMITS, getClientKey } from '@/lib/rate-limit';
import { trackServerEvent } from '@/lib/analytics';
import { CURRENT_REPORT_VERSION, generateVersionedReport } from '@/lib/report-pipeline';

// 设置 API 路由超时为 30 秒（Vercel/Next.js）
export const maxDuration = 30;
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
    const useDaylightSaving = Boolean(data.useDaylightSaving);
    const useSeparateZiHour = Boolean(data.useSeparateZiHour);
    const normalizedClock = useDaylightSaving
      ? toStandardClockTime(year, month, day, hour, minute, second)
      : { year, month, day, hour, minute, second };

    // 计算真太阳时
    let effectiveYear = normalizedClock.year;
    let effectiveMonth = normalizedClock.month;
    let effectiveDay = normalizedClock.day;
    let effectiveHour = normalizedClock.hour;
    let effectiveMinute = normalizedClock.minute;
    let effectiveSecond = normalizedClock.second;

    if (data.useSolarTime && longitude !== undefined) {
      const solarTimeInfo = calculateTrueSolarTime(
        normalizedClock.year,
        normalizedClock.month,
        normalizedClock.day,
        normalizedClock.hour,
        normalizedClock.minute,
        normalizedClock.second,
        longitude,
        timezone
      );
      effectiveYear = solarTimeInfo.year;
      effectiveMonth = solarTimeInfo.month;
      effectiveDay = solarTimeInfo.day;
      effectiveHour = solarTimeInfo.hour;
      effectiveMinute = solarTimeInfo.minute;
      effectiveSecond = solarTimeInfo.second;
      console.log(`[Solar Time] 钟表时间: ${normalizedClock.year}-${normalizedClock.month}-${normalizedClock.day} ${normalizedClock.hour}:${normalizedClock.minute}:${normalizedClock.second} → 真太阳时: ${effectiveYear}-${effectiveMonth}-${effectiveDay} ${effectiveHour}:${effectiveMinute}:${effectiveSecond} (修正${solarTimeInfo.correctionMinutes.toFixed(1)}分钟)`);
    }

    const effectiveBirthDate = new Date(effectiveYear, effectiveMonth - 1, effectiveDay);
    const effectiveBirthTime = `${String(effectiveHour).padStart(2, '0')}:${String(effectiveMinute).padStart(2, '0')}`;

    const { result: finalResult, llmUsed } = await generateVersionedReport({
      name: data.name,
      birthDate: effectiveBirthDate,
      birthTime: effectiveBirthTime,
      birthPlace: data.birthPlace || '北京',
      timezone,
      gender: data.gender || 'male',
      sect: useSeparateZiHour ? 1 : 2,
      source: 'analyze',
    });

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
        birthDate: data.birthDate as string,
        birthTime: data.birthTime as string,
        birthPlace: (data.birthPlace as string) || '北京',
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
        dayun: finalResult.dayun,
        shenSha: finalResult.shenSha,
        reportVersion: CURRENT_REPORT_VERSION,
        isPublic: false,
      }
    );

    trackServerEvent({
      userId,
      sessionId: userId,
      eventName: 'analyze_submitted',
      page: '/analyze',
      meta: {
        reportId,
        llmUsed,
        reportVersion: CURRENT_REPORT_VERSION,
        reasoningMode: finalResult.analysis?.reasoningMode || 'engine',
        useSolarTime: !!data.useSolarTime,
        useDaylightSaving: !!data.useDaylightSaving,
        useSeparateZiHour: !!data.useSeparateZiHour,
      },
    });

    trackServerEvent({
      userId,
      sessionId: userId,
      eventName: 'report_generated',
      page: `/result/${reportId}`,
      meta: {
        reportId,
        llmUsed,
        reportVersion: CURRENT_REPORT_VERSION,
        reasoningMode: finalResult.analysis?.reasoningMode || 'engine',
        pattern: finalResult.pattern?.type || '',
      },
    });

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

function toStandardClockTime(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  second: number
) {
  const utcDate = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
  utcDate.setUTCMinutes(utcDate.getUTCMinutes() - 60);

  return {
    year: utcDate.getUTCFullYear(),
    month: utcDate.getUTCMonth() + 1,
    day: utcDate.getUTCDate(),
    hour: utcDate.getUTCHours(),
    minute: utcDate.getUTCMinutes(),
    second: utcDate.getUTCSeconds(),
  };
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
