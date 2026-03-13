// 重构版 API - 使用 Repository + Service 模式
import { NextRequest, NextResponse } from 'next/server';
import { FortuneAnalyzerService } from '@/lib/services';
import { getFortuneRepository, getUserRepository } from '@/lib/repositories';
import { generateFortuneInterpretation } from '@/lib/llm';
import { getOrCreateGuestUserId } from '@/lib/user-utils';
import { calculateTrueSolarTime } from '@/lib/solar-time';
import { validateAnalyzeRequest } from '@/lib/validators';
import { checkRateLimit, RATE_LIMITS, getClientKey } from '@/lib/rate-limit';
import type { FortuneAnalysisInput } from '@/lib/services';
import { trackServerEvent } from '@/lib/analytics';
import { CURRENT_REPORT_VERSION } from '@/lib/report-pipeline';

export const maxDuration = 30;
const ANALYZE_LLM_TIMEOUT_MS = 3500;
const ANALYZE_LLM_BUDGET_MS = 4000;
const REPORT_VERSION = CURRENT_REPORT_VERSION;

export async function POST(request: NextRequest) {
  try {
    // 1. 速率限制
    const clientKey = getClientKey(request);
    const rateLimit = checkRateLimit(`analyze:${clientKey}`, RATE_LIMITS.analyze);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, error: '请求过于频繁，请稍后再试' },
        {
          status: 429,
          headers: { 'Retry-After': String(Math.ceil((rateLimit.resetAt - Date.now()) / 1000)) }
        }
      );
    }

    // 2. 验证输入
    const data = await request.json();
    const validation = validateAnalyzeRequest(data);
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.errors[0].message, errors: validation.errors },
        { status: 400 }
      );
    }

    // 3. 解析日期时间
    const { effectiveDate, effectiveTime } = parseDateTime(data);

    // 4. 执行命理分析 (使用新的 Service 层)
    const analyzerService = new FortuneAnalyzerService();
    const input: FortuneAnalysisInput = {
      name: data.name,
      birthDate: effectiveDate,
      birthTime: effectiveTime,
      birthPlace: data.birthPlace || '北京',
      timezone: data.timezone || 8,
      gender: data.gender || 'male',
    };

    const baseResult = analyzerService.analyze(input);

    // 5. LLM 增强 (可选)
    const llmResult = await enhanceWithLLM(baseResult);
    const finalResult = {
      ...mergeLLMResult(baseResult, llmResult),
      reportVersion: REPORT_VERSION,
    };

    // 6. 持久化 (使用新的 Repository 层)
    const reportId = generateReportId();
    const userId = await getOrCreateGuestUserId();

    await saveAnalysisResult({
      reportId,
      userId,
      data,
      result: finalResult,
    });

    trackServerEvent({
      userId,
      sessionId: userId,
      eventName: 'analyze_submitted',
      page: '/analyze',
      meta: {
        reportId,
        llmUsed: !!llmResult,
        reportVersion: REPORT_VERSION,
      },
    });

    trackServerEvent({
      userId,
      sessionId: userId,
      eventName: 'report_generated',
      page: `/result/${reportId}`,
      meta: {
        reportId,
        llmUsed: !!llmResult,
        reportVersion: REPORT_VERSION,
        pattern: finalResult.pattern?.type || '',
      },
    });

    // 7. 返回结果
    return NextResponse.json({
      success: true,
      reportId,
      result: finalResult,
      llm: {
        used: !!llmResult,
        fallbackToEngine: !llmResult,
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

export async function GET(request: NextRequest) {
  return NextResponse.json({
    status: 'online',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
  });
}

// ============ Helper Functions ============

function parseDateTime(data: any) {
  const [year, month, day] = data.birthDate.split('-').map(Number);
  const [hour, minute] = data.birthTime.split(':').map(Number);
  const second = data.birthSecond || 0;
  const longitude = data.longitude || 116.407;
  const timezone = data.timezone || 8;

  let effectiveYear = year;
  let effectiveMonth = month;
  let effectiveDay = day;
  let effectiveHour = hour;
  let effectiveMinute = minute;
  let effectiveSecond = second;
  let solarTimeInfo = null;

  if (data.useSolarTime && longitude !== undefined) {
    solarTimeInfo = calculateTrueSolarTime(
      year, month, day, hour, minute, second, longitude, timezone
    );
    effectiveYear = solarTimeInfo.year;
    effectiveMonth = solarTimeInfo.month;
    effectiveDay = solarTimeInfo.day;
    effectiveHour = solarTimeInfo.hour;
    effectiveMinute = solarTimeInfo.minute;
    effectiveSecond = solarTimeInfo.second;
    console.log(
      `[Solar Time] ${year}-${month}-${day} ${hour}:${minute}:${second} → ` +
      `${effectiveYear}-${effectiveMonth}-${effectiveDay} ${effectiveHour}:${effectiveMinute}:${effectiveSecond} ` +
      `(修正${solarTimeInfo.correctionMinutes.toFixed(1)}分钟)`
    );
  }

  const effectiveDate = new Date(effectiveYear, effectiveMonth - 1, effectiveDay);
  const effectiveTime = `${String(effectiveHour).padStart(2, '0')}:${String(effectiveMinute).padStart(2, '0')}`;

  return { effectiveDate, effectiveTime, solarTimeInfo };
}

async function enhanceWithLLM(baseResult: any) {
  let routeTimeoutId: ReturnType<typeof setTimeout> | undefined;

  try {
    console.log(`[API] Starting LLM interpretation with ${ANALYZE_LLM_TIMEOUT_MS}ms timeout...`);
    const llmStartTime = Date.now();
    const llmInterpretation = await Promise.race([
      generateFortuneInterpretation(baseResult, ANALYZE_LLM_TIMEOUT_MS),
      new Promise<null>((resolve) => {
        routeTimeoutId = setTimeout(() => {
          console.warn(`[API] LLM exceeded route budget after ${ANALYZE_LLM_BUDGET_MS}ms`);
          resolve(null);
        }, ANALYZE_LLM_BUDGET_MS);
      }),
    ]);
    const llmDuration = Date.now() - llmStartTime;
    console.log(`[API] LLM interpretation ${llmInterpretation ? 'succeeded' : 'fell back to engine'} in ${llmDuration}ms`);
    return llmInterpretation;
  } catch (error) {
    console.error('[API] LLM enhancement failed:', error);
    return null;
  } finally {
    if (routeTimeoutId) {
      clearTimeout(routeTimeoutId);
    }
  }
}

function mergeLLMResult(baseResult: any, llmResult: any) {
  if (!llmResult) return baseResult;

  return {
    ...baseResult,
    pattern: {
      ...baseResult.pattern,
      ...(llmResult.pattern || {}),
      type: baseResult.pattern?.type || llmResult.pattern?.type || '正格',
    },
    fiveElements: llmResult.fiveElements || baseResult.fiveElements,
    fortune: llmResult.fortune || baseResult.fortune,
    advice: {
      ...(llmResult.advice || baseResult.advice),
      yongShen: baseResult.advice?.yongShen || [],
      jiShen: baseResult.advice?.jiShen || [],
      xiShen: baseResult.advice?.xiShen || [],
      colors: baseResult.advice?.colors || [],
      directions: baseResult.advice?.directions || [],
      numbers: baseResult.advice?.numbers || [],
    },
    analysis: {
      ...(llmResult.analysis || baseResult.analysis),
      llmUsed: !!llmResult,
    },
    evidence: {
      ...baseResult.evidence,
      celebrities: llmResult.evidence?.celebrities || baseResult.evidence.celebrities,
    },
  };
}

async function saveAnalysisResult(params: {
  reportId: string;
  userId: string;
  data: any;
  result: any;
}) {
  const { reportId, userId, data, result } = params;

  const userRepo = getUserRepository();
  const fortuneRepo = getFortuneRepository();

  // 更新用户档案
  userRepo.updateProfile(userId, {
    name: data.name,
    birthPlace: data.birthPlace || '北京',
    timezone: data.timezone || 8,
  });

  // 保存命理记录
  fortuneRepo.create({
    id: reportId,
    userId,
    name: data.name,
    birthDate: data.birthDate,
    birthTime: data.birthTime,
    birthPlace: data.birthPlace || '北京',
    timezone: data.timezone || 8,
    gender: data.gender || 'male',
    bazi: result.basic,
    fiveElements: result.fiveElements,
    tenGods: result.tenGods || {},
    pattern: result.pattern,
    fortune: result.fortune,
    advice: result.advice,
    evidence: result.evidence,
    analysis: result.analysis,
    klineData: result.klineData,
    dayun: result.dayun,
    shenSha: result.shenSha,
    reportVersion: REPORT_VERSION,
    isPublic: false,
  });
}

function generateReportId(): string {
  return `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
