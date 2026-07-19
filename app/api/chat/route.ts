// AI聊天API
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getOrCreateGuestUserId } from '@/lib/user-utils';
import { eventOperations, fortuneOperations, questionOperations, runInTransaction, toolSessionOperations } from '@/lib/database';
import { getApiBaseUrl, getApiKey, getChatLlmTimeoutMs, getDefaultModel } from '@/lib/env';
import { generateId } from '@/lib/utils';
import { validateQuestion } from '@/lib/validators';
import { checkRateLimit, RATE_LIMITS, getClientKey } from '@/lib/rate-limit';
import { trackServerEvent } from '@/lib/analytics';
import { buildChatExperienceContext, type ChatExperienceContext } from '@/lib/chat-context';
import { summarizePredictionRevisits } from '@/lib/predictions/revisit-stats';
import { getChatIntentSummaryHint, getChatIntentSystemPrompt, normalizeChatIntent, type ChatIntent } from '@/lib/chat-intent';
import { buildTacitKnowledgeSummary, sanitizeTacitKnowledgeInput } from '@/lib/tacit-knowledge';
import { createOpenAiCompatibleChatCompletion } from '@/lib/openai-compatible-chat';
import { recordModelAttempt } from '@/lib/llm-provider-health';
import { buildPrompt, getPrompt } from '@/lib/prompts';
import '@/lib/prompts/chat/main';
import '@/lib/prompts/chat/intents';
import { normalizeAttributionSource } from '@/lib/chat-entry';
import {
  appendAnswerStructureContract,
  CHAT_STRUCTURE_REPAIR_INSTRUCTION,
  scoreChatAnswerStructure,
} from '@/lib/chat-answer-contract';
import { applyEfcVerifyToAnswer } from '@/lib/chat-efc-verify';
import {
  appendTeacherToSystemPrompt,
  extractEngineFactBlockFromChatContext,
  extractGeoLinesFromChatContext,
  extractPracticeLinesFromChatContext,
  resolveChatTeacher,
} from '@/lib/chat-teacher-runtime';
import { buildProfileContextLines, snapshotFromSupplementList } from '@/lib/progressive-profile';
import { profileSupplementOperations } from '@/lib/profile-settings-store';

// 设置 API 路由超时为 240 秒
export const maxDuration = 240;

const DEFAULT_CHAT_LLM_TIMEOUT_MS = 240_000;
const MAX_CHAT_MATERIALS = 4;
const MAX_CHAT_IMAGE_BYTES = 1.8 * 1024 * 1024;

const chatMaterialLabels: Record<ChatMaterialKind, string> = {
  floor_plan: '户型图',
  face_photo: '面相照片',
  palm_photo: '手相照片',
  handwriting: '字迹资料',
  study_material: '学习材料',
  scene_photo: '场景照片',
  legal_document: '法院/合同文书',
  other_document: '其他资料',
};

type HistoryMessage = {
  role: 'user' | 'assistant';
  content: string;
};

type ChatMaterialKind = 'floor_plan' | 'face_photo' | 'palm_photo' | 'handwriting' | 'study_material' | 'scene_photo' | 'legal_document' | 'other_document';

type ChatCompletionTextPart = {
  type: 'text';
  text: string;
};

type ChatCompletionImagePart = {
  type: 'image_url';
  image_url: {
    url: string;
  };
};

type ChatCompletionContent = string | Array<ChatCompletionTextPart | ChatCompletionImagePart>;

type ChatMaterialInput = {
  id?: unknown;
  kind?: unknown;
  label?: unknown;
  note?: unknown;
  fileName?: unknown;
  mimeType?: unknown;
  size?: unknown;
  dataUrl?: unknown;
};

type SanitizedChatMaterial = {
  id: string;
  kind: ChatMaterialKind;
  label: string;
  note: string;
  fileName: string;
  mimeType: string;
  size: number;
  hasImage: boolean;
  imageIncluded: boolean;
  dataUrl?: string;
};

type QuestionRow = {
  id: string;
  category: string;
  question: string;
  analysis?: {
    answer?: string;
    llmUsed?: boolean;
    source?: string;
    reportId?: string | null;
    eventId?: string | null;
    focusAreas?: string[];
    turnId?: string;
    responseToQuestionId?: string | null;
    edited?: boolean;
    regenerated?: boolean;
    intent?: ChatIntent | null;
    tacitContext?: Record<string, unknown> | null;
    tacitSummary?: string | null;
    materials?: Array<Record<string, unknown>>;
    materialSummary?: string | null;
  };
  createdAt?: string;
  created_at?: string;
};

type TimelineMessage = QuestionRow & {
  role: 'user' | 'assistant';
  content: string;
};

// v5-D84 (2026-05-24): chat_context_loaded 抑制窗口 — 同 sessionId 10 分钟内只记一次。
// 进程内 Map（PM2 多实例 = 每实例独立窗口，可接受 — 最坏 3 实例 × 1 写 = 3 条/10min）。
const chatContextLoadedAt = new Map<string, number>();
const CHAT_CONTEXT_LOADED_TTL_MS = 10 * 60 * 1000;
function shouldRecordChatContextLoaded(sessionId: string): boolean {
  if (!sessionId) return true;
  const now = Date.now();
  const last = chatContextLoadedAt.get(sessionId);
  if (last && now - last < CHAT_CONTEXT_LOADED_TTL_MS) return false;
  chatContextLoadedAt.set(sessionId, now);
  // 简单 GC：超过 5000 条时清理过期项
  if (chatContextLoadedAt.size > 5000) {
    const expireBefore = now - CHAT_CONTEXT_LOADED_TTL_MS;
    for (const [k, v] of chatContextLoadedAt) {
      if (v < expireBefore) chatContextLoadedAt.delete(k);
    }
  }
  return true;
}

function shouldSkipChatContextAnalytics(userAgent?: string | null): boolean {
  const ua = `${userAgent || ''}`.trim().toLowerCase();
  // Empty UA is almost never a real browser product session.
  if (!ua) return true;
  return /bot|crawler|spider|slurp|facebookexternalhit|preview|headless|phantom|selenium|puppeteer|playwright|curl\/|wget|python-requests|go-http-client|scrapy|bytespider|baiduspider|yandex|semrush|ahrefs|petalbot|gptbot|claudebot|anthropic|bingpreview/.test(ua);
}

function isLikelyEmptyChatNoise(params: {
  requestedReportId?: string;
  boundReportId?: string | null;
  historyCount: number;
  source?: string | null;
  userAgent?: string | null;
}): boolean {
  if (shouldSkipChatContextAnalytics(params.userAgent)) return true;
  // Bound report or prior history = real product session.
  if (params.boundReportId || params.historyCount > 0) return false;

  const source = `${params.source || ''}`;
  // Cold / unowned opens dominate chat_context_loaded volume.
  // If the guest cannot bind the report and has no history, the load is not a real conversation start.
  // chat_page_viewed still captures the click intent via client analytics.
  if (
    /content_conversion_panel|content_detail_followup|tool_detail_runner_tip_chat|tool_premium_depth_panel|visual_asset|result_report_followup|result_cockpit|next_step_guide|report_event_capture|events_page|profile_page/.test(
      source,
    )
  ) {
    return true;
  }
  // Unowned reportId deep-link without history is low-signal (scrapers / stale shares).
  if (params.requestedReportId) return true;
  // Bare /chat cold open
  if (!source) return true;
  return false;
}


function clampChatText(value: unknown, maxLength: number) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

function isChatMaterialKind(value: unknown): value is ChatMaterialKind {
  return typeof value === 'string' && Object.prototype.hasOwnProperty.call(chatMaterialLabels, value);
}

function parseImageDataUrl(value: unknown) {
  const dataUrl = typeof value === 'string' ? value.trim() : '';
  const match = dataUrl.match(/^data:(image\/(?:png|jpe?g|webp|gif));base64,([A-Za-z0-9+/=\s]+)$/i);
  if (!match) {
    return null;
  }

  const normalizedPayload = match[2].replace(/\s/g, '');
  const estimatedBytes = Math.floor((normalizedPayload.length * 3) / 4);
  if (estimatedBytes <= 0 || estimatedBytes > MAX_CHAT_IMAGE_BYTES) {
    return null;
  }

  return {
    dataUrl: `data:${match[1].toLowerCase()};base64,${normalizedPayload}`,
    mimeType: match[1].toLowerCase(),
    estimatedBytes,
  };
}

function sanitizeChatMaterials(input: unknown): SanitizedChatMaterial[] {
  if (!Array.isArray(input)) return [];

  return input
    .slice(0, MAX_CHAT_MATERIALS)
    .map((item, index) => {
      const raw = (item || {}) as ChatMaterialInput;
      const kind = isChatMaterialKind(raw.kind) ? raw.kind : 'other_document';
      const image = parseImageDataUrl(raw.dataUrl);
      const rawMimeType = clampChatText(raw.mimeType, 80).toLowerCase();
      const mimeType = image?.mimeType || rawMimeType;
      const size = typeof raw.size === 'number' && Number.isFinite(raw.size) ? Math.max(0, Math.floor(raw.size)) : image?.estimatedBytes || 0;

      return {
        id: clampChatText(raw.id, 80) || `material_${index + 1}`,
        kind,
        label: clampChatText(raw.label, 40) || chatMaterialLabels[kind],
        note: clampChatText(raw.note, 600),
        fileName: clampChatText(raw.fileName, 160),
        mimeType,
        size,
        hasImage: Boolean(image || mimeType.startsWith('image/')),
        imageIncluded: Boolean(image),
        dataUrl: image?.dataUrl,
      };
    })
    .filter((item) => item.note || item.fileName || item.imageIncluded);
}

function buildSafeMaterialRecords(materials: SanitizedChatMaterial[]) {
  return materials.map(({ dataUrl, ...item }) => item);
}

function buildMaterialSummary(materials: SanitizedChatMaterial[]) {
  if (!materials.length) return '';

  const lines = materials.map((item, index) => {
    const parts = [
      `${index + 1}. ${item.label}`,
      item.fileName ? `文件：${item.fileName}` : '',
      item.note ? `摘要：${item.note}` : '',
      item.imageIncluded ? '图片已随本轮发送' : item.hasImage ? '图片过大或未随本轮发送，仅参考摘要' : '',
    ].filter(Boolean);
    return parts.join('；');
  });

  return [
    '用户本轮补充资料维度：',
    ...lines,
  ].join('\n');
}

function buildUserContentWithMaterials(question: string, materialSummary: string, materials: SanitizedChatMaterial[]): ChatCompletionContent {
  const imageMaterials = materials.filter((item) => item.imageIncluded && item.dataUrl).slice(0, 3);
  const text = materialSummary ? `${question}\n\n${materialSummary}` : question;
  if (!imageMaterials.length) {
    return text;
  }

  return [
    { type: 'text', text },
    ...imageMaterials.map((item) => ({
      type: 'image_url' as const,
      image_url: {
        url: item.dataUrl as string,
      },
    })),
  ];
}

function classifyChatFallbackReason(error?: unknown) {
  if (!error) return 'empty_response';

  const name = error instanceof Error ? error.name : '';
  const message = error instanceof Error ? error.message : String(error);
  const combined = `${name} ${message}`.toLowerCase();

  if (combined.includes('abort') || combined.includes('timeout') || combined.includes('timed out')) {
    return 'timeout_abort';
  }

  if (
    combined.includes('model is not supported')
    || combined.includes('unsupported model')
    || combined.includes('not supported when using codex with a chatgpt account')
  ) {
    return 'unsupported_model';
  }

  return 'single_model_failed';
}

async function generateAIResponse(
  question: string,
  userHistory: HistoryMessage[],
  contextSummary: string,
  options?: {
    intent?: ChatIntent;
    context?: ChatExperienceContext;
    materials?: SanitizedChatMaterial[];
    materialSummary?: string;
    teacherId?: string | null;
    city?: string | null;
    profileLines?: string[] | null;
  }
): Promise<{
  answer: string;
  llmUsed: boolean;
  fallbackReason?: string;
  efcOk?: boolean;
  efcIssues?: string[];
  structureFilled?: number;
  structureRich?: boolean;
  structureThin?: boolean;
  structureRepaired?: boolean;
}> {
  const apiKey = getApiKey();
  const fallbackAnswer = buildFallbackChatAnswer(question, options?.context, options?.intent);
  if (!apiKey) {
    console.warn('[LLM Chat] API_KEY is not set.');
    return {
      answer: fallbackAnswer,
      llmUsed: false,
      fallbackReason: 'missing_api_key',
      efcOk: true,
      efcIssues: [],
    };
  }

  const openai = new OpenAI({
    apiKey,
    baseURL: getApiBaseUrl(),
  });

  const intentPrompt = getChatIntentSystemPrompt(options?.intent);
  const intentSummaryHint = getChatIntentSummaryHint(options?.intent);
  const materialSummary = options?.materialSummary || buildMaterialSummary(options?.materials || []);
  const userContent = buildUserContentWithMaterials(question, materialSummary, options?.materials || []);

  // v2 chat.main spec：把 contextSummary / intentPrompt / materialSummary / 多模态边界拼成结构化 system。
  // 多模态分支按需触发 —— 没有对应附件就不污染 prompt。
  const intentNormalized = normalizeChatIntent(options?.intent);
  const materials = options?.materials || [];
  const hasImage = materials.some((m) => /^image\//i.test(m?.mimeType || '') || /\.(jpe?g|png|webp|gif)$/i.test(m?.fileName || ''));
  const hasDoc = materials.some((m) => /pdf|word|excel|text|json|application/i.test(m?.mimeType || ''));
  const hasPalmistry = intentNormalized === 'palmistry-reading' || (hasImage && /palmistry|手相/i.test(materialSummary));
  const hasHomeLayout = intentNormalized === 'home-layout-diagnosis' || (hasImage && /户型|home.?layout|floor.?plan/i.test(materialSummary));
  const hasFaceOrHandwriting = hasImage && !hasPalmistry && !hasHomeLayout;

  let systemContent: string;
  if (getPrompt('chat.main')) {
    const built = buildPrompt('chat.main', {
      contextSummary,
      intentPrompt,
      intentSummaryHint,
      materialSummary,
      hasPalmistry,
      hasHomeLayout,
      hasDocument: hasDoc,
      hasFaceOrHandwriting,
    });
    systemContent = `${built.system}\n\n${built.user}`;
  } else {
    systemContent = [
      '你是一位精通传统子平八字、滴天髓等命理学，同时又懂得现代心理学和职场发展的顶级AI命理大师。',
      '你必须优先引用用户当前报告里的结构、用神、行运阶段、未来窗口和已记录现实事件，不要给空泛套话。',
      '每次回答都尽量包含：1）判断依据 2）当前阶段建议 3）风险提醒 4）若适合，建议把节点落成事件。',
      '若某结论受时辰或短期节奏影响较大，要明确提示不确定性。',
      '若用户补充图片、字迹、学习材料、户型图或文书，只把它们作为辅助上下文：不要识别人脸身份，不要作医疗、法律、金融等确定性判断，不要复述敏感个人信息。',
      '涉及法院文书、合同、诉讼材料时，只做结构化阅读、关键风险、下一步待核实问题，并明确重大事项应交由律师或专业人士处理。',
      '面相、手相、字迹、场景图像不能作为唯一依据；回答必须回到结构、时间、事件和用户可执行动作。',
      '涉及手相照片时，只做可见掌纹、掌丘、手型和照片质量的相学文化观察；不得判断疾病、寿命、身份、人格定论、财富必然、婚姻必然或命运定数。',
      '涉及户型图时，只分析可见平面结构、动线、采光通风、厨卫干扰、卧室安稳、收纳与形势问题；方向和外局缺失时必须说明边界，不编造外部环境。',
      intentPrompt,
      contextSummary,
      materialSummary,
      intentSummaryHint,
    ].join('\n');
  }

  
  // 老师人设 + 地理/实践 + 引擎 EFC（对标 GPTs × Project 上下文）
  {
    const teacherBits = {
      teacher: options?.teacherId,
      intent: options?.intent,
      city: options?.city,
      practiceLines: extractPracticeLinesFromChatContext(options?.context),
      geoLines: extractGeoLinesFromChatContext(options?.context, options?.city),
      profileLines: options?.profileLines || [],
      // 优先 structured engineFactBlock，否则从 summary 截取 EFC 段
      engineFactBlock: extractEngineFactBlockFromChatContext(options?.context),
      reportHint: options?.context?.report
        ? `日主${options.context.report.dayMaster} · 用神${(options.context.report.yongShen || []).join('、') || '—'} · 大运${options.context.report.currentDaYun}`
        : null,
    };
    const withTeacher = appendTeacherToSystemPrompt(systemContent, teacherBits);
    systemContent = withTeacher.systemContent;
  }

  // Top-product: force 结论/依据/三时窗/验证点 for event loop
  systemContent = appendAnswerStructureContract(systemContent);

const baseMessages: Array<{ role: 'system' | 'user' | 'assistant'; content: ChatCompletionContent }> = [
    {
      role: 'system',
      content: systemContent,
    },
    ...userHistory.map((item) => ({ role: item.role, content: item.content })),
    { role: 'user', content: userContent },
  ];

  const model = getDefaultModel();
  const chatTimeoutMs = getChatLlmTimeoutMs() || DEFAULT_CHAT_LLM_TIMEOUT_MS;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), chatTimeoutMs);
  const startedAt = Date.now();

  try {
    console.log(`[LLM Chat] single model ${model}; timeout=${chatTimeoutMs}ms; retries=0`);
    const completion = await createOpenAiCompatibleChatCompletion(openai, {
      model,
      messages: baseMessages,
      temperature: 0.7,
      maxTokens: 1200,
      reasoningEffort: 'low',
    }, {
      signal: controller.signal,
      timeout: chatTimeoutMs,
      maxRetries: 0,
    });

    const content = completion.choices?.[0]?.message?.content?.trim();
    if (!content) {
      console.error(`[LLM Chat] Model ${model} returned empty content`);
      recordModelAttempt({
        model,
        scope: 'chat',
        success: false,
        latencyMs: Date.now() - startedAt,
        errorType: 'empty',
        traceLabel: 'chat:main',
      });
      return {
        answer: fallbackAnswer,
        llmUsed: false,
        fallbackReason: classifyChatFallbackReason(),
        efcOk: true,
        efcIssues: [],
      };
    }

    recordModelAttempt({
      model,
      scope: 'chat',
      success: true,
      latencyMs: Date.now() - startedAt,
      traceLabel: 'chat:main',
    });

    // EFC integrity: soft flag if day master / yong shen contradicted
    const report = options?.context?.report;
    const verified = applyEfcVerifyToAnswer(content, report
      ? {
          dayMaster: report.dayMaster,
          yongShen: report.yongShen,
          // jiShen may not be on ChatReportContext — optional
          jiShen: (report as { jiShen?: string[] }).jiShen,
          currentDaYun: report.currentDaYun,
        }
      : null);

    if (!verified.efcOk) {
      try {
        trackServerEvent({
          eventName: 'chat_efc_flagged' as any,
          page: '/chat',
          meta: {
            issues: verified.efcIssues,
            reportId: report?.id || null,
            intent: options?.intent || null,
            teacherId: options?.teacherId || null,
          },
        });
      } catch {
        // never block answer
      }
    }

    let finalAnswer = verified.answer;
    let efcOk = verified.efcOk;
    let efcIssues = verified.efcIssues;
    let structure = scoreChatAnswerStructure(finalAnswer);
    let structureRepaired = false;

    // Soft one-shot repair when first pass is structure-thin (decision product quality).
    if (structure.isThin && finalAnswer.length >= 40) {
      try {
        console.log('[LLM Chat] structure thin → one repair pass');
        const repairCompletion = await createOpenAiCompatibleChatCompletion(
          openai,
          {
            model,
            messages: [
              { role: 'system', content: systemContent },
              ...userHistory.map((item) => ({
                role: item.role as 'user' | 'assistant',
                content: item.content,
              })),
              { role: 'user', content: userContent },
              { role: 'assistant', content: finalAnswer },
              { role: 'user', content: CHAT_STRUCTURE_REPAIR_INSTRUCTION },
            ],
            temperature: 0.35,
            maxTokens: 1200,
            reasoningEffort: 'low',
          },
          {
            signal: controller.signal,
            timeout: Math.min(chatTimeoutMs, 90_000),
            maxRetries: 0,
          },
        );
        const repairedRaw = repairCompletion.choices?.[0]?.message?.content?.trim() || '';
        if (repairedRaw.length >= 60) {
          const reVerified = applyEfcVerifyToAnswer(
            repairedRaw,
            report
              ? {
                  dayMaster: report.dayMaster,
                  yongShen: report.yongShen,
                  jiShen: (report as { jiShen?: string[] }).jiShen,
                  currentDaYun: report.currentDaYun,
                }
              : null,
          );
          const reScore = scoreChatAnswerStructure(reVerified.answer);
          if (
            reScore.filled > structure.filled ||
            reScore.isRich ||
            (structure.isThin && !reScore.isThin)
          ) {
            finalAnswer = reVerified.answer;
            efcOk = reVerified.efcOk;
            efcIssues = reVerified.efcIssues;
            structure = reScore;
            structureRepaired = true;
            if (!reVerified.efcOk) {
              try {
                trackServerEvent({
                  eventName: 'chat_efc_flagged' as any,
                  page: '/chat',
                  meta: {
                    issues: reVerified.efcIssues,
                    reportId: report?.id || null,
                    intent: options?.intent || null,
                    teacherId: options?.teacherId || null,
                    phase: 'structure_repair',
                  },
                });
              } catch {
                // ignore
              }
            }
          }
        }
      } catch (repairError) {
        console.warn('[LLM Chat] structure repair skipped', repairError);
      }
    }

    try {
      trackServerEvent({
        eventName: 'chat_structure_scored' as any,
        page: '/chat',
        meta: {
          filled: structure.filled,
          max: structure.max,
          isRich: structure.isRich ? 1 : 0,
          isThin: structure.isThin ? 1 : 0,
          repaired: structureRepaired ? 1 : 0,
          missing: structure.missing.slice(0, 5),
          efcOk: efcOk ? 1 : 0,
          reportId: report?.id || null,
          intent: options?.intent || null,
          teacherId: options?.teacherId || null,
        },
      });
    } catch {
      // never block answer
    }

    return {
      answer: finalAnswer,
      llmUsed: true,
      fallbackReason: undefined,
      efcOk,
      efcIssues,
      structureFilled: structure.filled,
      structureRich: structure.isRich,
      structureThin: structure.isThin,
      structureRepaired,
    };
  } catch (error) {
    recordModelAttempt({
      model,
      scope: 'chat',
      success: false,
      latencyMs: Date.now() - startedAt,
      errorType: error instanceof Error ? error.name || 'error' : 'error',
      errorMessage: error instanceof Error ? error.message : String(error),
      traceLabel: 'chat:main',
    });
    console.error(`[LLM Chat] Single model ${model} failed:`, error);
    return {
      answer: fallbackAnswer,
      llmUsed: false,
      fallbackReason: classifyChatFallbackReason(error),
      efcOk: true,
      efcIssues: [],
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

function trackChatCompleted(params: {
  userId: string;
  sessionId?: string | null;
  userAgent?: string | null;
  action: 'ask' | 'regenerate' | 'edit' | 'delete' | 'load';
  reportId?: string | null;
  eventId?: string | null;
  intent?: ChatIntent | null;
  source?: string | null;
  ctaStrategyKey?: string | null;
  sourceFamily?: string | null;
  llmUsed?: boolean;
  durationMs: number;
  fallbackReason?: string;
  historyCount?: number;
  questionLength?: number;
  materialCount?: number;
  truncatedCount?: number;
  deletedCount?: number;
}) {
  trackServerEvent({
    userId: params.userId,
    sessionId: params.sessionId || params.userId,
    userAgent: params.userAgent,
    eventName: 'chat_completed',
    page: '/chat',
    meta: {
      action: params.action,
      reportId: params.reportId || null,
      eventId: params.eventId || null,
      intent: params.intent || null,
      source: params.source || null,
      ctaStrategyKey: params.ctaStrategyKey || null,
      sourceFamily: params.sourceFamily || null,
      llmUsed: params.llmUsed,
      durationMs: params.durationMs,
      fallbackReason: params.fallbackReason || null,
      historyCount: params.historyCount,
      questionLength: params.questionLength,
      materialCount: params.materialCount,
      truncatedCount: params.truncatedCount,
      deletedCount: params.deletedCount,
    },
  });
}

function trackChatFailed(params: {
  userId?: string | null;
  sessionId?: string | null;
  userAgent?: string | null;
  action: 'ask' | 'regenerate' | 'edit' | 'delete' | 'load';
  reportId?: string | null;
  eventId?: string | null;
  intent?: ChatIntent | null;
  source?: string | null;
  ctaStrategyKey?: string | null;
  sourceFamily?: string | null;
  durationMs: number;
  error: unknown;
}) {
  trackServerEvent({
    userId: params.userId || undefined,
    sessionId: params.sessionId || params.userId || undefined,
    userAgent: params.userAgent,
    eventName: 'chat_failed',
    page: '/chat',
    meta: {
      action: params.action,
      reportId: params.reportId || null,
      eventId: params.eventId || null,
      intent: params.intent || null,
      source: params.source || null,
      ctaStrategyKey: params.ctaStrategyKey || null,
      sourceFamily: params.sourceFamily || null,
      durationMs: params.durationMs,
      error: params.error instanceof Error ? params.error.message : 'unknown',
    },
  });
}


function resolveFallbackContextLabels(context?: ChatExperienceContext) {
  const report = context?.report;
  if (report?.topScenario || report?.bestWindow || report?.riskWindow) {
    return {
      topScenario: report.topScenario || '当前阶段主轴',
      bestWindow: report.bestWindow || '近期可参考窗口',
      riskWindow: report.riskWindow || '近期需收敛的窗口',
      hasReport: true,
    };
  }

  const focusAreas = (context?.focusAreas || []).filter(Boolean);
  const topScenario = focusAreas[0] || '尚未绑定结构报告';
  const bestWindow = focusAreas.find((item) => /窗口|阶段|用神|格局|大运|流年/.test(item)) || '需先生成报告后再判断窗口';
  const riskWindow = focusAreas.find((item) => /风险|规避|透支|压力/.test(item)) || '需结合你的具体时间和担心点再判断';

  return {
    topScenario,
    bestWindow,
    riskWindow,
    hasReport: false,
  };
}

function buildFallbackChatAnswer(
  question: string,
  context?: ChatExperienceContext,
  intent?: ChatIntent
) {
  const report = context?.report;
  const focusedEvent = context?.focusedEvent;
  const { topScenario, bestWindow, riskWindow, hasReport } = resolveFallbackContextLabels(context);

  switch (intent) {
    case 'event-simulation':
      return [
        '先按事件推演模式给你一个可执行版判断。',
        `当前更适合围绕“${topScenario}”来推进，这件事不要一次性压上，优先看 ${bestWindow}，对 ${riskWindow} 保持风控。`,
        '建议节奏：先小范围试探和摸清对方反馈，再进入关键谈判，最后才做正式确认或资源投入。',
        '风险提醒：如果对方反馈反复、推进成本突然升高、你自己开始情绪化加码，就不适合继续硬推。',
        `你可以继续把事件补充为“对象是谁、目标是什么、最晚决策时间是什么”，我再按 ${bestWindow} 和 ${riskWindow} 给你拆细一步。`,
      ].join('\n');
    case 'event-verdict':
      return [
        '先按断事专项给你一个倾向判断。',
        `这件事当前不适合只凭冲动下结论，更像“可以推进，但必须带条件筛选”。核心依据还是 ${topScenario} 与窗口强弱的配合。`,
        `如果你要推进，优先把动作压到 ${bestWindow} 附近；如果现实必须提前做，就一定先缩小试错成本。`,
        '最该防的不是完全不能做，而是判断还没坐实就提前重投入。',
        '你可以继续补一句“这件事最担心失去什么”，我再把倾向判断收窄得更明确。',
      ].join('\n');
    case 'event-review':
      return [
        '先按事件剖析模式给你一个复盘框架。',
        focusedEvent
          ? `这次更适合围绕“${focusedEvent.title}”复盘，先区分偏差来自时机、执行，还是信息判断。`
          : '这次更像要先把偏差来源拆清楚，而不是急着给自己下结论。',
        `如果事情发生在 ${riskWindow} 一类弱窗口，偏差更容易来自时机过早或节奏过满；如果明明靠近 ${bestWindow} 仍然失手，就更要复盘执行链和信息判断。`,
        '下一步建议：先写下当时的目标、实际动作、对方反馈和终局结果，我再帮你判断更像哪里出了偏差。',
      ].join('\n');
    case 'meihua-enhancement':
      return [
        '先按摇卦 / 梅花易增强的短周期模式给你一个收敛判断。',
        `这类问题不看长线空话，重点是接下来 7 天到 30 天的波动。当前更适合先观察对方信号和即时变数，再决定要不要在 ${bestWindow} 前后落动作。`,
        `如果现实已经逼近决策点，就先做最小动作验证，不要在 ${riskWindow} 一类承压节点重押。`,
        '你可以继续把问题缩成 A / B 两个选项，我会按短周期判断继续帮你收口。',
      ].join('\n');
    case 'palmistry-reading':
      return [
        '这次没有拿到可用的深度解析结果，所以不硬编手相判断。',
        '你可以直接点“重生成”。如果照片不清，请补一张掌心正对镜头、自然光、掌纹清晰的图片，并说明左手/右手、惯用手和当前最想问的问题。',
        '边界先说清：手相只能做传统相学文化观察，不能判断疾病、寿命、身份、人格定论、财富必然、婚姻必然或命运定数。',
      ].join('\n');
    case 'home-layout-diagnosis':
      return [
        '这次没有拿到可用的深度解析结果，所以不硬编户型判断。',
        '你可以直接点“重生成”。如果户型信息不足，请补充入户门、阳台、厨房、卫生间、卧室、客厅、主要窗位和方向；方向不明就说明“方向不确定”。',
        '边界先说清：这里只分析可见平面结构、动线、采光通风、厨卫干扰、卧室安稳和收纳，不替代建筑、消防、装修或物业专业意见。',
      ].join('\n');
    default:
      return hasReport
        ? [
            '这次解析服务暂时不可用，所以不硬编答案。',
            `已保留你的问题和当前报告上下文：主线“${topScenario}”，参考窗口 ${bestWindow}，风险窗口 ${riskWindow}。`,
            '你可以直接点“重生成”。如果问题很急，请补一句“对象 + 时间点 + 最担心的风险”，系统会用同一上下文重新尝试。',
          ].join('\n')
        : [
            '这次解析服务暂时不可用，且你还没有绑定八字结构报告，所以不硬编命局答案。',
            `已保留你的问题，当前只能先按通用框架收敛：关注“${topScenario}”。`,
            '请先到工作台生成你的结构报告，再回到这里追问；或补一句“对象 + 时间点 + 最担心的风险”后点“重生成”。',
          ].join('\n');
  }
}

function buildHistoryFromRows(rows: QuestionRow[]): HistoryMessage[] {
  const chatRows = rows
    .filter((row) => row.category === 'chat_user' || row.category === 'chat_assistant')
    .sort(
      (a, b) =>
        new Date(a.createdAt || a.created_at || 0).getTime() - new Date(b.createdAt || b.created_at || 0).getTime()
    );

  return chatRows
    .map((row) => {
      if (row.category === 'chat_assistant') {
        return {
          role: 'assistant',
          content: row.analysis?.answer || row.question || '',
        } as HistoryMessage;
      }

      return {
        role: 'user',
        content: row.question || '',
      } as HistoryMessage;
    })
    .filter((item) => !!item.content);
}

function getSortedChatRows(userId: string, limit = 100): TimelineMessage[] {
  const rows = (questionOperations.getChatByUserId(userId, limit) || []) as QuestionRow[];
  return rows.map((row) => ({
    ...row,
    role: row.category === 'chat_assistant' ? 'assistant' : 'user',
    content: row.category === 'chat_assistant' ? (row.analysis?.answer || row.question || '') : (row.question || ''),
  }));
}

function buildHistoryBeforeIndex(rows: TimelineMessage[], endExclusive: number) {
  return buildHistoryFromRows(rows.slice(0, endExclusive)).slice(-12);
}

function findMessageIndex(rows: TimelineMessage[], messageId: string) {
  return rows.findIndex((row) => row.id === messageId);
}

function findPairedAssistantIndex(rows: TimelineMessage[], userIndex: number) {
  const target = rows[userIndex];
  if (!target || target.role !== 'user') return -1;

  for (let index = userIndex + 1; index < rows.length; index += 1) {
    const row = rows[index];
    if (row.role === 'user') {
      return -1;
    }
    if (row.role === 'assistant') {
      const linkedId = row.analysis?.responseToQuestionId;
      if (!linkedId || linkedId === target.id) {
        return index;
      }
    }
  }

  return -1;
}

function findRelatedUserIndex(rows: TimelineMessage[], assistantIndex: number) {
  const target = rows[assistantIndex];
  if (!target || target.role !== 'assistant') return -1;

  const linkedId = target.analysis?.responseToQuestionId;
  if (linkedId) {
    const linkedIndex = rows.findIndex((row) => row.id === linkedId);
    if (linkedIndex >= 0) {
      return linkedIndex;
    }
  }

  for (let index = assistantIndex - 1; index >= 0; index -= 1) {
    if (rows[index].role === 'user') {
      return index;
    }
  }

  return -1;
}

function toHistoryPayload(rows: TimelineMessage[]) {
  return rows.map((row) => ({
    id: row.id,
    role: row.role,
    content: row.content,
    llmUsed: row.role === 'assistant' ? !!row.analysis?.llmUsed : undefined,
    edited: !!row.analysis?.edited,
    regenerated: !!row.analysis?.regenerated,
    reportId: row.analysis?.reportId || null,
    eventId: row.analysis?.eventId || null,
    intent: row.analysis?.intent || null,
    responseToQuestionId: row.analysis?.responseToQuestionId || null,
    tacitContext: row.role === 'user' ? row.analysis?.tacitContext || null : null,
    tacitSummary: row.role === 'user' ? row.analysis?.tacitSummary || null : null,
    materials: row.role === 'user' && Array.isArray(row.analysis?.materials) ? row.analysis.materials : [],
    materialSummary: row.role === 'user' ? row.analysis?.materialSummary || null : null,
    feedbackRating:
      row.role === 'assistant'
        ? (row.analysis?.userFeedback?.rating as string | undefined) || null
        : null,
    fallbackReason:
      row.role === 'assistant' ? (row.analysis?.fallbackReason as string | undefined) || null : null,
    efcOk:
      row.role === 'assistant'
        ? row.analysis?.efcOk === undefined
          ? null
          : !!row.analysis?.efcOk
        : null,
    efcIssues:
      row.role === 'assistant' && Array.isArray(row.analysis?.efcIssues)
        ? row.analysis.efcIssues
        : [],
    structureFilled:
      row.role === 'assistant' && row.analysis?.structureFilled != null
        ? Number(row.analysis.structureFilled)
        : null,
    structureRich:
      row.role === 'assistant' && row.analysis?.structureRich != null
        ? !!row.analysis.structureRich
        : null,
    structureThin:
      row.role === 'assistant' && row.analysis?.structureThin != null
        ? !!row.analysis.structureThin
        : null,
    timestamp: row.createdAt || row.created_at,
  }));
}

function resolveRequestedReportId(request: NextRequest, bodyReportId?: string) {
  const url = new URL(request.url);
  return bodyReportId || url.searchParams.get('reportId') || undefined;
}

function resolveRequestedEventId(request: NextRequest, bodyEventId?: string) {
  const url = new URL(request.url);
  return bodyEventId || url.searchParams.get('eventId') || undefined;
}

function resolveRequestedIntent(request: NextRequest, bodyIntent?: string) {
  const url = new URL(request.url);
  return normalizeChatIntent(bodyIntent || url.searchParams.get('intent'));
}

function resolveRequestedSource(request: NextRequest, bodySource?: string) {
  const url = new URL(request.url);
  const source = normalizeAttributionSource(bodySource || url.searchParams.get('source') || '');
  return source || undefined;
}

function resolveRequestedCtaStrategyKey(request: NextRequest, bodyCtaStrategyKey?: string) {
  const url = new URL(request.url);
  const ctaStrategyKey = `${bodyCtaStrategyKey || url.searchParams.get('ctaStrategyKey') || ''}`.trim();
  return ctaStrategyKey || undefined;
}

function resolveRequestedSourceFamily(request: NextRequest, bodySourceFamily?: string) {
  const url = new URL(request.url);
  const sourceFamily = `${bodySourceFamily || url.searchParams.get('sourceFamily') || ''}`.trim();
  return sourceFamily || undefined;
}

function getChatReport(userId: string, requestedReportId?: string) {
  if (requestedReportId) {
    const report = fortuneOperations.getById(requestedReportId);
    if (report) {
      // Owner always OK
      if (report.userId === userId) {
        return report;
      }
      // Explicit deep-link / cookie 切换：公开报告允许只读锚定（不写回 ownership）
      // DB 默认 is_public=1；私有报告 (isPublic===false) 仍拒绝跨 guest 读取
      if (report.isPublic !== false) {
        return report;
      }
    }
  }

  return fortuneOperations.getByUserId(userId)?.[0] || null;
}

/**
 * Soft-load prediction revisit stats for memory narrative.
 * server-store is prod DB-backed; require is optional so local stubs never crash chat.
 * Only attaches when the session has a bound report (report session).
 */
function loadPredictionRevisitStatsForChat(
  userId: string,
  reportId?: string | null,
): ChatExperienceContext['predictionStats'] {
  if (!userId || !reportId) return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const store = require('@/lib/predictions/server-store') as {
      listPredictionsForUser?: (id: string) => Array<{
        reportId?: string;
        outcome?: string;
        status?: string;
        result?: string;
        score?: number;
      }>;
    };
    const listFn = store?.listPredictionsForUser;
    if (typeof listFn !== 'function') return null;
    const all = listFn(userId);
    if (!Array.isArray(all)) return null;
    const scoped = all.filter((row) => row && row.reportId === reportId);
    return summarizePredictionRevisits(scoped);
  } catch {
    return null;
  }
}

function buildChatPayload(
  userId: string,
  requestedReportId?: string,
  requestedEventId?: string,
  requestedIntent?: ChatIntent
) {
  const report = getChatReport(userId, requestedReportId);
  const events = eventOperations.getByUserId(userId).slice(0, 8);
  const toolSessions = toolSessionOperations.listByUser(userId, 8);

  const context = buildChatExperienceContext({
    report,
    events,
    toolSessions,
    focusEventId: requestedEventId,
    intent: requestedIntent,
  });

  const predictionStats = loadPredictionRevisitStatsForChat(
    userId,
    context.report?.id || report?.id || requestedReportId || null,
  );
  if (predictionStats) {
    return { ...context, predictionStats };
  }
  return context;
}

function rowMatchesScope(
  row: TimelineMessage,
  requestedReportId?: string,
  requestedEventId?: string,
  requestedIntent?: ChatIntent
) {
  const rowReportId = row.analysis?.reportId || '';
  const rowEventId = row.analysis?.eventId || '';
  const rowIntent = normalizeChatIntent(row.analysis?.intent || undefined);

  if (requestedIntent && rowIntent !== requestedIntent) {
    return false;
  }

  if (requestedEventId) {
    return rowEventId === requestedEventId;
  }

  if (requestedReportId) {
    return rowReportId === requestedReportId;
  }

  return true;
}

function getScopedChatRows(
  userId: string,
  requestedReportId?: string,
  requestedEventId?: string,
  requestedIntent?: ChatIntent,
  limit = 100
) {
  return getSortedChatRows(userId, limit).filter((row) => rowMatchesScope(row, requestedReportId, requestedEventId, requestedIntent));
}

export async function POST(request: NextRequest) {
  const requestStartedAt = Date.now();
  const userAgent = request.headers.get('user-agent');
  let userId = '';
  let sessionId = '';
  let requestedIntent: ChatIntent | undefined;
  let requestedReportId: string | undefined;
  let requestedEventId: string | undefined;
  let requestedSource: string | undefined;
  let requestedCtaStrategyKey: string | undefined;
  let requestedSourceFamily: string | undefined;
  try {
    const clientKey = getClientKey(request);
    sessionId = clientKey;
    const rateLimit = checkRateLimit(`chat:${clientKey}`, RATE_LIMITS.chat);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, error: '消息发送过于频繁，请稍后再试' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil((rateLimit.resetAt - Date.now()) / 1000)) } }
      );
    }

    const data = await request.json();
    const question = (data?.question || '').trim();
    const tacitContext = sanitizeTacitKnowledgeInput(data?.tacitContext);
    const tacitSummary = buildTacitKnowledgeSummary(tacitContext);
    const materials = sanitizeChatMaterials(data?.materials);
    const materialSummary = buildMaterialSummary(materials);
    const safeMaterials = buildSafeMaterialRecords(materials);
    userId = await getOrCreateGuestUserId();
    requestedReportId = resolveRequestedReportId(request, typeof data?.reportId === 'string' ? data.reportId : undefined);
    requestedEventId = resolveRequestedEventId(request, typeof data?.eventId === 'string' ? data.eventId : undefined);
    requestedIntent = resolveRequestedIntent(request, typeof data?.intent === 'string' ? data.intent : undefined);
    const requestedTeacherId = typeof data?.teacher === 'string' ? data.teacher.trim() : (typeof data?.teacherId === 'string' ? data.teacherId.trim() : '');
    const requestedCity = typeof data?.city === 'string' ? data.city.trim() : '';
    requestedSource = resolveRequestedSource(request, typeof data?.source === 'string' ? data.source : undefined);
    requestedCtaStrategyKey = resolveRequestedCtaStrategyKey(request, typeof data?.ctaStrategyKey === 'string' ? data.ctaStrategyKey : undefined);
    requestedSourceFamily = resolveRequestedSourceFamily(request, typeof data?.sourceFamily === 'string' ? data.sourceFamily : undefined);

    const questionErr = validateQuestion(question);
    if (questionErr) {
      return NextResponse.json(
        { success: false, error: questionErr.message },
        { status: 400 }
      );
    }

    const context = buildChatPayload(userId, requestedReportId, requestedEventId, requestedIntent);
    const scopeReportId = context.report?.id || requestedReportId;
    const scopeEventId = context.focusedEvent?.id || requestedEventId;
    const previousRows = getScopedChatRows(userId, scopeReportId, scopeEventId, requestedIntent, 60);
    const userHistory = buildHistoryFromRows(previousRows).slice(-12);
    const reportBound = Boolean(context.report?.id || context.engineFactBlock);
    const contextSummary = [
      context.summary,
      !reportBound
        ? '【系统】本轮未绑定引擎真值。若用户提及「这份报告/用神/日主」，先说明需从报告页进入，禁止编造命盘。'
        : '',
      tacitSummary ? `用户本轮补充了一层默会信息：${tacitSummary}。回答时要把这些没有被完整说清的信号视为有效输入。` : '',
    ].filter(Boolean).join('\n');
    let profileLinesForTeacher: string[] = [];
    try {
      const rows = profileSupplementOperations.listByUser(userId, null);
      const snap = snapshotFromSupplementList(rows.map((r: any) => ({ domain: r.domain, fields: r.fields || {} })));
      profileLinesForTeacher = buildProfileContextLines(snap);
    } catch (e) {
      console.warn('[chat] profile lines load failed', e);
    }
    const {
      answer,
      llmUsed,
      fallbackReason,
      efcOk,
      efcIssues,
      structureFilled,
      structureRich,
      structureThin,
      structureRepaired,
    } = await generateAIResponse(question, userHistory, contextSummary, {
      intent: requestedIntent,
      context,
      materials,
      materialSummary,
      teacherId: requestedTeacherId || null,
      city: requestedCity || null,
      profileLines: profileLinesForTeacher || [],
    });
    const turnId = generateId();
    const userMessageId = generateId();
    const assistantMessageId = generateId();

    questionOperations.create({
      id: userMessageId,
      userId,
      question,
      category: 'chat_user',
      analysis: {
        source: 'chat_api',
        reportId: context.report?.id || requestedReportId || null,
        eventId: context.focusedEvent?.id || null,
        focusAreas: context.focusAreas,
        turnId,
        intent: requestedIntent || null,
        tacitContext: tacitContext || null,
        tacitSummary: tacitSummary || null,
        materials: safeMaterials,
        materialSummary: materialSummary || null,
      },
    });

    questionOperations.create({
      id: assistantMessageId,
      userId,
      question: answer,
      category: 'chat_assistant',
      analysis: {
        source: llmUsed ? 'llm' : 'fallback',
        answer,
        llmUsed,
        fallbackReason: fallbackReason || null,
        efcOk: efcOk !== false,
        efcIssues: efcIssues || [],
        structureFilled: structureFilled ?? null,
        structureRich: structureRich ?? null,
        structureThin: structureThin ?? null,
        structureRepaired: structureRepaired ? true : false,
        reportId: context.report?.id || requestedReportId || null,
        eventId: context.focusedEvent?.id || null,
        turnId,
        responseToQuestionId: userMessageId,
        intent: requestedIntent || null,
      },
    });

    const palmPhotoCount = materials.filter((item) => item.kind === 'palm_photo').length;
    const imageMaterialCount = materials.filter((item) => item.imageIncluded).length;

    if (requestedIntent === 'palmistry-reading' && palmPhotoCount > 0) {
      trackServerEvent({
        userId,
        sessionId,
        userAgent,
        eventName: 'tool_image_upload_started',
        page: '/chat',
        meta: {
          phase: 'server_confirmed',
          confirmed: true,
          toolSlug: 'application-palmistry-reading',
          intent: requestedIntent,
          source: requestedSource || null,
          ctaStrategyKey: requestedCtaStrategyKey || null,
          sourceFamily: requestedSourceFamily || null,
          materialCount: materials.length,
          palmPhotoCount,
          imageMaterialCount,
          reportId: context.report?.id || requestedReportId || null,
          eventId: context.focusedEvent?.id || null,
        },
      });
    }

    trackServerEvent({
      userId,
      sessionId,
      userAgent,
      eventName: 'chat_message_sent',
      page: '/chat',
      meta: {
        llmUsed,
        durationMs: Date.now() - requestStartedAt,
        fallbackReason: fallbackReason || null,
        questionLength: question.length,
        tacitSignalCount: tacitContext ? 1 : 0,
        materialCount: materials.length,
        materialKinds: materials.map((item) => item.kind),
        imageMaterialCount,
        reportId: context.report?.id || requestedReportId || null,
        eventId: context.focusedEvent?.id || null,
        intent: requestedIntent || null,
        source: requestedSource || null,
        ctaStrategyKey: requestedCtaStrategyKey || null,
        sourceFamily: requestedSourceFamily || null,
      },
    });
    trackChatCompleted({
      userId,
      sessionId,
      userAgent,
      action: 'ask',
      reportId: context.report?.id || requestedReportId || null,
      eventId: context.focusedEvent?.id || null,
      intent: requestedIntent || null,
      source: requestedSource || null,
      ctaStrategyKey: requestedCtaStrategyKey || null,
      sourceFamily: requestedSourceFamily || null,
      llmUsed,
      durationMs: Date.now() - requestStartedAt,
      fallbackReason,
      historyCount: previousRows.length,
      questionLength: question.length,
      materialCount: materials.length,
    });

    return NextResponse.json({
      success: true,
      answer,
      llmUsed,
      efcOk: efcOk !== false,
      efcIssues: efcIssues || [],
      structure: {
        filled: structureFilled ?? null,
        isRich: structureRich ?? null,
        isThin: structureThin ?? null,
      },
      userId,
      context,
      intent: requestedIntent || null,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[API] AI聊天失败:', error);
    trackChatFailed({
      userId,
      sessionId,
      userAgent,
      action: 'ask',
      reportId: requestedReportId,
      eventId: requestedEventId,
      intent: requestedIntent || null,
      source: requestedSource || null,
      ctaStrategyKey: requestedCtaStrategyKey || null,
      sourceFamily: requestedSourceFamily || null,
      durationMs: Date.now() - requestStartedAt,
      error,
    });
    return NextResponse.json(
      { success: false, error: '聊天失败，请稍后重试' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  const requestStartedAt = Date.now();
  const userAgent = request.headers.get('user-agent');
  let userId = '';
  let sessionId = '';
  let requestedIntent: ChatIntent | undefined;
  let requestedReportId: string | undefined;
  let requestedEventId: string | undefined;
  let requestedSource: string | undefined;
  let requestedCtaStrategyKey: string | undefined;
  let requestedSourceFamily: string | undefined;
  let trackedAction: 'regenerate' | 'edit' = 'edit';
  try {
    const clientKey = getClientKey(request);
    sessionId = clientKey;
    const rateLimit = checkRateLimit(`chat:${clientKey}`, RATE_LIMITS.chat);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, error: '消息操作过于频繁，请稍后再试' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil((rateLimit.resetAt - Date.now()) / 1000)) } }
      );
    }

    const data = await request.json();
    const action = typeof data?.action === 'string' ? data.action : '';
    const messageId = typeof data?.messageId === 'string' ? data.messageId : '';
    const content = typeof data?.content === 'string' ? data.content.trim() : '';
    userId = await getOrCreateGuestUserId();
    requestedReportId = resolveRequestedReportId(request, typeof data?.reportId === 'string' ? data.reportId : undefined);
    requestedEventId = resolveRequestedEventId(request, typeof data?.eventId === 'string' ? data.eventId : undefined);
    requestedIntent = resolveRequestedIntent(request, typeof data?.intent === 'string' ? data.intent : undefined);
    requestedSource = resolveRequestedSource(request, typeof data?.source === 'string' ? data.source : undefined);
    requestedCtaStrategyKey = resolveRequestedCtaStrategyKey(request, typeof data?.ctaStrategyKey === 'string' ? data.ctaStrategyKey : undefined);
    requestedSourceFamily = resolveRequestedSourceFamily(request, typeof data?.sourceFamily === 'string' ? data.sourceFamily : undefined);
    const rows = getScopedChatRows(userId, requestedReportId, requestedEventId, requestedIntent, 100);
    const targetIndex = findMessageIndex(rows, messageId);

    if (!messageId || targetIndex < 0) {
      return NextResponse.json({ success: false, error: '未找到对应消息' }, { status: 404 });
    }

    const target = rows[targetIndex];
    const context = buildChatPayload(userId, requestedReportId, requestedEventId, requestedIntent);

    // User rating on assistant reply — stores into analysis.userFeedback for optimization.
    if (action === 'feedback') {
      if (target.role !== 'assistant') {
        return NextResponse.json({ success: false, error: '只能评价回答消息' }, { status: 400 });
      }
      const ratingRaw = typeof data?.rating === 'string' ? data.rating.trim() : '';
      const rating =
        ratingRaw === 'helpful' || ratingRaw === 'not_helpful' || ratingRaw === 'empty'
          ? ratingRaw
          : '';
      if (!rating) {
        return NextResponse.json(
          { success: false, error: '评价类型无效（helpful / not_helpful / empty）' },
          { status: 400 },
        );
      }
      const note =
        typeof data?.note === 'string' ? data.note.trim().slice(0, 200) : '';
      const userFeedback = {
        rating,
        note: note || null,
        at: new Date().toISOString(),
      };
      questionOperations.update(target.id, {
        analysis: {
          ...(target.analysis || {}),
          userFeedback,
        },
        // Column exists on questions; update uses raw keys as SQL columns.
        ...({ user_feedback: JSON.stringify(userFeedback) } as Record<string, unknown>),
      } as any);

      trackServerEvent({
        userId,
        sessionId,
        userAgent,
        eventName: 'chat_feedback',
        page: '/chat',
        meta: {
          messageId: target.id,
          rating,
          hasNote: Boolean(note),
          llmUsed: !!target.analysis?.llmUsed,
          fallbackReason: target.analysis?.fallbackReason || null,
          reportId: target.analysis?.reportId || requestedReportId || null,
          intent: target.analysis?.intent || requestedIntent || null,
          source: requestedSource || null,
        },
      });

      return NextResponse.json({
        success: true,
        data: { messageId: target.id, rating, userFeedback },
        timestamp: new Date().toISOString(),
      });
    }

    if (action === 'regenerate') {
      trackedAction = 'regenerate';
      if (target.role !== 'assistant') {
        return NextResponse.json({ success: false, error: '只能重新生成回答消息' }, { status: 400 });
      }

      const userIndex = findRelatedUserIndex(rows, targetIndex);
      if (userIndex < 0) {
        return NextResponse.json({ success: false, error: '缺少对应提问，无法重新生成' }, { status: 400 });
      }

      const userQuestion = rows[userIndex].question.trim();
      const questionErr = validateQuestion(userQuestion);
      if (questionErr) {
        return NextResponse.json({ success: false, error: questionErr.message }, { status: 400 });
      }

      const historyBefore = buildHistoryBeforeIndex(rows, userIndex);
      const existingMaterials = sanitizeChatMaterials(rows[userIndex].analysis?.materials || []);
      const existingMaterialSummary = `${rows[userIndex].analysis?.materialSummary || ''}`.trim() || buildMaterialSummary(existingMaterials);
      const userTacitSummary = `${rows[userIndex].analysis?.tacitSummary || ''}`.trim();
      const regenerationContextSummary = [
        context.summary,
        userTacitSummary ? `用户本轮补充了一层默会信息：${userTacitSummary}。回答时要把这些没有被完整说清的信号视为有效输入。` : '',
      ].filter(Boolean).join('\n');
      const {
        answer,
        llmUsed,
        fallbackReason,
        efcOk,
        efcIssues,
        structureFilled,
        structureRich,
        structureThin,
        structureRepaired,
      } = await generateAIResponse(userQuestion, historyBefore, regenerationContextSummary, {
        intent: requestedIntent,
        context,
        materials: existingMaterials,
        materialSummary: existingMaterialSummary,
      });
      const trailingIds = rows.slice(targetIndex + 1).map((row) => row.id);

      runInTransaction(() => {
        if (trailingIds.length > 0) {
          questionOperations.deleteMany(trailingIds);
        }

        questionOperations.update(target.id, {
          question: answer,
          analysis: {
            ...(target.analysis || {}),
            source: llmUsed ? 'llm' : 'fallback',
            answer,
            llmUsed,
            fallbackReason: fallbackReason || null,
            efcOk: efcOk !== false,
            efcIssues: efcIssues || [],
            structureFilled: structureFilled ?? null,
            structureRich: structureRich ?? null,
            structureThin: structureThin ?? null,
            structureRepaired: structureRepaired ? true : false,
            reportId: context.report?.id || requestedReportId || null,
            eventId: context.focusedEvent?.id || null,
            responseToQuestionId: rows[userIndex].id,
            regenerated: true,
            intent: requestedIntent || null,
          },
        });
      });

      trackServerEvent({
        userId,
        sessionId,
        userAgent,
        eventName: 'chat_message_sent',
        page: '/chat',
        meta: {
          action: 'regenerate',
          reportId: context.report?.id || requestedReportId || null,
          eventId: context.focusedEvent?.id || null,
          llmUsed,
          durationMs: Date.now() - requestStartedAt,
          fallbackReason: fallbackReason || null,
          truncatedCount: trailingIds.length,
          intent: requestedIntent || null,
          source: requestedSource || null,
          ctaStrategyKey: requestedCtaStrategyKey || null,
          sourceFamily: requestedSourceFamily || null,
        },
      });
      trackChatCompleted({
        userId,
        sessionId,
        userAgent,
        action: 'regenerate',
        reportId: context.report?.id || requestedReportId || null,
        eventId: context.focusedEvent?.id || null,
        intent: requestedIntent || null,
        source: requestedSource || null,
        ctaStrategyKey: requestedCtaStrategyKey || null,
        sourceFamily: requestedSourceFamily || null,
        llmUsed,
        durationMs: Date.now() - requestStartedAt,
        fallbackReason,
        truncatedCount: trailingIds.length,
      });

      return NextResponse.json({
        success: true,
        answer,
        llmUsed,
        efcOk: efcOk !== false,
        efcIssues: efcIssues || [],
        structure: {
          filled: structureFilled ?? null,
          isRich: structureRich ?? null,
          isThin: structureThin ?? null,
        },
        context,
        intent: requestedIntent || null,
        truncatedCount: trailingIds.length,
        timestamp: new Date().toISOString(),
      });
    }

    if (action === 'edit') {
      trackedAction = 'edit';
      if (target.role !== 'user') {
        return NextResponse.json({ success: false, error: '只能编辑已发送的问题' }, { status: 400 });
      }

      const questionErr = validateQuestion(content);
      if (questionErr) {
        return NextResponse.json({ success: false, error: questionErr.message }, { status: 400 });
      }

      const assistantIndex = findPairedAssistantIndex(rows, targetIndex);
      const historyBefore = buildHistoryBeforeIndex(rows, targetIndex);
      const existingMaterials = sanitizeChatMaterials(target.analysis?.materials || []);
      const existingMaterialSummary = `${target.analysis?.materialSummary || ''}`.trim() || buildMaterialSummary(existingMaterials);
      const userTacitSummary = `${target.analysis?.tacitSummary || ''}`.trim();
      const editContextSummary = [
        context.summary,
        userTacitSummary ? `用户本轮补充了一层默会信息：${userTacitSummary}。回答时要把这些没有被完整说清的信号视为有效输入。` : '',
      ].filter(Boolean).join('\n');
      const {
        answer,
        llmUsed,
        fallbackReason,
        efcOk,
        efcIssues,
        structureFilled,
        structureRich,
        structureThin,
        structureRepaired,
      } = await generateAIResponse(content, historyBefore, editContextSummary, {
        intent: requestedIntent,
        context,
        materials: existingMaterials,
        materialSummary: existingMaterialSummary,
      });
      const trailingStart = assistantIndex >= 0 ? assistantIndex + 1 : targetIndex + 1;
      const trailingIds = rows.slice(trailingStart).map((row) => row.id);
      const assistantId = assistantIndex >= 0 ? rows[assistantIndex].id : generateId();
      const assistantAnalysisExtras = {
        efcOk: efcOk !== false,
        efcIssues: efcIssues || [],
        structureFilled: structureFilled ?? null,
        structureRich: structureRich ?? null,
        structureThin: structureThin ?? null,
        structureRepaired: structureRepaired ? true : false,
      };

      runInTransaction(() => {
        questionOperations.update(target.id, {
          question: content,
          analysis: {
            ...(target.analysis || {}),
            source: 'chat_api',
            reportId: context.report?.id || requestedReportId || null,
            eventId: context.focusedEvent?.id || null,
            focusAreas: context.focusAreas,
            edited: true,
            intent: requestedIntent || null,
          },
        });

        if (assistantIndex >= 0) {
          questionOperations.update(assistantId, {
            question: answer,
            analysis: {
              ...(rows[assistantIndex].analysis || {}),
              source: llmUsed ? 'llm' : 'fallback',
              answer,
              llmUsed,
              fallbackReason: fallbackReason || null,
              ...assistantAnalysisExtras,
              reportId: context.report?.id || requestedReportId || null,
              eventId: context.focusedEvent?.id || null,
              responseToQuestionId: target.id,
              edited: true,
              regenerated: true,
              intent: requestedIntent || null,
            },
          });
        } else {
          questionOperations.create({
            id: assistantId,
            userId,
            question: answer,
            category: 'chat_assistant',
            analysis: {
              source: llmUsed ? 'llm' : 'fallback',
              answer,
              llmUsed,
              fallbackReason: fallbackReason || null,
              ...assistantAnalysisExtras,
              reportId: context.report?.id || requestedReportId || null,
              eventId: context.focusedEvent?.id || null,
              responseToQuestionId: target.id,
              turnId: target.analysis?.turnId || generateId(),
              edited: true,
              regenerated: true,
              intent: requestedIntent || null,
            },
          });
        }

        if (trailingIds.length > 0) {
          questionOperations.deleteMany(trailingIds);
        }
      });

      trackServerEvent({
        userId,
        sessionId,
        userAgent,
        eventName: 'chat_message_sent',
        page: '/chat',
        meta: {
          action: 'edit',
          reportId: context.report?.id || requestedReportId || null,
          eventId: context.focusedEvent?.id || null,
          llmUsed,
          durationMs: Date.now() - requestStartedAt,
          fallbackReason: fallbackReason || null,
          truncatedCount: trailingIds.length,
          intent: requestedIntent || null,
          source: requestedSource || null,
          ctaStrategyKey: requestedCtaStrategyKey || null,
          sourceFamily: requestedSourceFamily || null,
        },
      });
      trackChatCompleted({
        userId,
        sessionId,
        userAgent,
        action: 'edit',
        reportId: context.report?.id || requestedReportId || null,
        eventId: context.focusedEvent?.id || null,
        intent: requestedIntent || null,
        source: requestedSource || null,
        ctaStrategyKey: requestedCtaStrategyKey || null,
        sourceFamily: requestedSourceFamily || null,
        llmUsed,
        durationMs: Date.now() - requestStartedAt,
        fallbackReason,
        truncatedCount: trailingIds.length,
        questionLength: content.length,
      });

      return NextResponse.json({
        success: true,
        answer,
        llmUsed,
        efcOk: efcOk !== false,
        efcIssues: efcIssues || [],
        structure: {
          filled: structureFilled ?? null,
          isRich: structureRich ?? null,
          isThin: structureThin ?? null,
        },
        context,
        intent: requestedIntent || null,
        truncatedCount: trailingIds.length,
        timestamp: new Date().toISOString(),
      });
    }

    return NextResponse.json({ success: false, error: '不支持的消息操作' }, { status: 400 });
  } catch (error) {
    console.error('[API] 更新聊天消息失败:', error);
    trackChatFailed({
      userId,
      sessionId,
      userAgent,
      action: trackedAction,
      reportId: requestedReportId,
      eventId: requestedEventId,
      intent: requestedIntent || null,
      source: requestedSource || null,
      ctaStrategyKey: requestedCtaStrategyKey || null,
      sourceFamily: requestedSourceFamily || null,
      durationMs: Date.now() - requestStartedAt,
      error,
    });
    return NextResponse.json(
      { success: false, error: '更新聊天消息失败' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const requestStartedAt = Date.now();
  const userAgent = request.headers.get('user-agent');
  let userId = '';
  let sessionId = '';
  let requestedIntent: ChatIntent | undefined;
  let requestedReportId: string | undefined;
  let requestedEventId: string | undefined;
  let requestedSource: string | undefined;
  let requestedCtaStrategyKey: string | undefined;
  let requestedSourceFamily: string | undefined;
  try {
    sessionId = getClientKey(request);
    const data = await request.json();
    const messageId = typeof data?.messageId === 'string' ? data.messageId : '';
    userId = await getOrCreateGuestUserId();
    requestedReportId = resolveRequestedReportId(request, typeof data?.reportId === 'string' ? data.reportId : undefined);
    requestedEventId = resolveRequestedEventId(request, typeof data?.eventId === 'string' ? data.eventId : undefined);
    requestedIntent = resolveRequestedIntent(request, typeof data?.intent === 'string' ? data.intent : undefined);
    requestedSource = resolveRequestedSource(request, typeof data?.source === 'string' ? data.source : undefined);
    requestedCtaStrategyKey = resolveRequestedCtaStrategyKey(request, typeof data?.ctaStrategyKey === 'string' ? data.ctaStrategyKey : undefined);
    requestedSourceFamily = resolveRequestedSourceFamily(request, typeof data?.sourceFamily === 'string' ? data.sourceFamily : undefined);
    const rows = getScopedChatRows(userId, requestedReportId, requestedEventId, requestedIntent, 100);
    const targetIndex = findMessageIndex(rows, messageId);

    if (!messageId || targetIndex < 0) {
      return NextResponse.json({ success: false, error: '未找到对应消息' }, { status: 404 });
    }

    const target = rows[targetIndex];
    const context = buildChatPayload(userId, requestedReportId, requestedEventId, requestedIntent);
    let deleteUntilIndex = targetIndex;

    if (target.role === 'user') {
      const assistantIndex = findPairedAssistantIndex(rows, targetIndex);
      deleteUntilIndex = assistantIndex >= 0 ? assistantIndex : targetIndex;
    }

    const deleteIds = rows.slice(targetIndex, deleteUntilIndex + 1).map((row) => row.id);
    const trailingIds = rows.slice(deleteUntilIndex + 1).map((row) => row.id);
    const allIds = [...deleteIds, ...trailingIds];

    questionOperations.deleteMany(allIds);

    trackServerEvent({
      userId,
      sessionId,
      userAgent,
      eventName: 'chat_message_sent',
      page: '/chat',
      meta: {
          action: 'delete',
          reportId: context.report?.id || requestedReportId || null,
          eventId: context.focusedEvent?.id || null,
          durationMs: Date.now() - requestStartedAt,
          deletedCount: allIds.length,
          intent: requestedIntent || null,
          source: requestedSource || null,
          ctaStrategyKey: requestedCtaStrategyKey || null,
          sourceFamily: requestedSourceFamily || null,
        },
      });
    trackChatCompleted({
      userId,
      sessionId,
      userAgent,
      action: 'delete',
      reportId: context.report?.id || requestedReportId || null,
      eventId: context.focusedEvent?.id || null,
      intent: requestedIntent || null,
      source: requestedSource || null,
      ctaStrategyKey: requestedCtaStrategyKey || null,
      sourceFamily: requestedSourceFamily || null,
      durationMs: Date.now() - requestStartedAt,
      deletedCount: allIds.length,
      truncatedCount: trailingIds.length,
    });

    return NextResponse.json({
      success: true,
      deletedCount: allIds.length,
      truncatedCount: trailingIds.length,
      context,
      intent: requestedIntent || null,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[API] 删除聊天消息失败:', error);
    trackChatFailed({
      userId,
      sessionId,
      userAgent,
      action: 'delete',
      reportId: requestedReportId,
      eventId: requestedEventId,
      intent: requestedIntent || null,
      source: requestedSource || null,
      ctaStrategyKey: requestedCtaStrategyKey || null,
      sourceFamily: requestedSourceFamily || null,
      durationMs: Date.now() - requestStartedAt,
      error,
    });
    return NextResponse.json(
      { success: false, error: '删除聊天消息失败' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const requestStartedAt = Date.now();
  const userAgent = request.headers.get('user-agent');
  let userId = '';
  let sessionId = '';
  let requestedIntent: ChatIntent | undefined;
  let requestedReportId: string | undefined;
  let requestedEventId: string | undefined;
  let requestedSource: string | undefined;
  let requestedCtaStrategyKey: string | undefined;
  let requestedSourceFamily: string | undefined;
  try {
    sessionId = getClientKey(request);
    userId = await getOrCreateGuestUserId();
    requestedReportId = resolveRequestedReportId(request);
    requestedEventId = resolveRequestedEventId(request);
    requestedIntent = resolveRequestedIntent(request);
    requestedSource = resolveRequestedSource(request);
    requestedCtaStrategyKey = resolveRequestedCtaStrategyKey(request);
    requestedSourceFamily = resolveRequestedSourceFamily(request);
    const rows = getScopedChatRows(userId, requestedReportId, requestedEventId, requestedIntent, 100);
    const context = buildChatPayload(userId, requestedReportId, requestedEventId, requestedIntent);
    const history = toHistoryPayload(rows);

    // v5-D84 (2026-05-24): chat_context_loaded 抑制噪音 — 同 session 10 分钟内只写一次。
    // 之前 90 天累计 695k 条 = 76% 全部 analytics 体量，DB 严重膨胀。
    // 真实业务诉求是「这个 session 进入过 chat 页」，不是「轮询了多少次」。
    const boundReportId = context.report?.id || null;
    const skipNoise = isLikelyEmptyChatNoise({
      requestedReportId,
      boundReportId,
      historyCount: history.length,
      source: requestedSource || null,
      userAgent,
    });
    // Keep product signal: only record non-noise loads (or always record with flags if bound/history).
    if (!skipNoise && shouldRecordChatContextLoaded(sessionId)) {
      trackServerEvent({
        userId,
        sessionId,
        userAgent,
        eventName: 'chat_context_loaded',
        page: '/chat',
        meta: {
          // bound report for this guest (ownership-checked)
          reportId: boundReportId,
          requestedReportId: requestedReportId || null,
          boundReportId,
          reportBound: Boolean(boundReportId),
          eventId: context.focusedEvent?.id || null,
          durationMs: Date.now() - requestStartedAt,
          historyCount: history.length,
          recentEvents: context.recentEvents.length,
          intent: requestedIntent || null,
          source: requestedSource || null,
          ctaStrategyKey: requestedCtaStrategyKey || null,
          sourceFamily: requestedSourceFamily || null,
          noiseFiltered: false,
        },
      });
    }
    // v5-D28 (2026-05-18): 移除 chat_completed{action:load} 双写。
    // chat_context_loaded 已是 GET /api/chat 的事实事件，再写 chat_completed 会让
    // 聚合 chatCompletedCount 99% 是 load（D23 噪音 31972/32183）。失真严重。
    // GET 不再写 chat_completed；后续聚合应只看 ask/regenerate/edit/delete。

    return NextResponse.json({
      success: true,
      userId,
      history,
      context,
      intent: requestedIntent || null,
      requestedReportId: requestedReportId || null,
      boundReportId,
      contextBound: Boolean(boundReportId),
      contextBindError:
        requestedReportId && !boundReportId
          ? 'report_not_owned_by_session'
          : null,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[API] 获取聊天历史失败:', error);
    trackChatFailed({
      userId,
      sessionId,
      userAgent,
      action: 'load',
      reportId: requestedReportId,
      eventId: requestedEventId,
      intent: requestedIntent || null,
      source: requestedSource || null,
      ctaStrategyKey: requestedCtaStrategyKey || null,
      sourceFamily: requestedSourceFamily || null,
      durationMs: Date.now() - requestStartedAt,
      error,
    });
    return NextResponse.json(
      { success: false, error: '获取聊天历史失败' },
      { status: 500 }
    );
  }
}
