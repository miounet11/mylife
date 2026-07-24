import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getAuthSession } from '@/lib/auth';
import { toolSessionOperations } from '@/lib/database';
import { getApiBaseUrl, getApiKey, getDefaultModel } from '@/lib/env';
import { createOpenAiCompatibleChatCompletion } from '@/lib/openai-compatible-chat';
import { resolveNamingBirthContext } from '@/lib/naming/birth-context';
import { getOrCreateGuestUserId } from '@/lib/user-utils';
import { generateId } from '@/lib/utils';
import { trackServerEvent } from '@/lib/analytics';
import { parseImageDataUrl, saveUserMedia } from '@/lib/user-media-store';
import {
  FACE_VISION_SYSTEM,
  PALM_VISION_SYSTEM,
  heuristicXiangxue,
  mergeLlmXiangxue,
  type XiangxueKind,
  type XiangxueSessionResult,
} from '@/lib/xiangxue';

export const runtime = 'nodejs';
export const maxDuration = 90;

function parseKind(raw: unknown): XiangxueKind {
  return raw === 'palm' ? 'palm' : 'face';
}

function parseJsonObject(text: string): Record<string, unknown> | null {
  const t = text.trim();
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fence ? fence[1].trim() : t;
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    const i = raw.indexOf('{');
    const j = raw.lastIndexOf('}');
    if (i >= 0 && j > i) {
      try {
        return JSON.parse(raw.slice(i, j + 1)) as Record<string, unknown>;
      } catch {
        return null;
      }
    }
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const kind = parseKind(body?.kind);
    const image = parseImageDataUrl(body?.imageDataUrl);
    if (!image) {
      return NextResponse.json(
        { success: false, error: '请上传清晰照片（jpg/png/webp，≤6MB）' },
        { status: 400 },
      );
    }

    const auth = await getAuthSession();
    const userId =
      (auth.authenticated && auth.user?.id ? String(auth.user.id) : '') ||
      (await getOrCreateGuestUserId());

    const birthCtx = resolveNamingBirthContext({
      birthDate: body?.birthDate ? String(body.birthDate) : undefined,
      birthTime: body?.birthTime ? String(body.birthTime) : undefined,
      birthPlace: body?.birthPlace ? String(body.birthPlace) : undefined,
      gender: body?.gender ? String(body.gender) : undefined,
      yongShen: Array.isArray(body?.yongShen) ? body.yongShen.map(String) : undefined,
      fortuneId: body?.fortuneId ? String(body.fortuneId) : undefined,
    });

    const media = saveUserMedia({
      userId,
      kind: kind === 'face' ? 'face' : 'palm',
      buffer: image.buffer,
      mime: image.mime,
      purpose: `xiangxue_${kind}`,
    });

    let core = heuristicXiangxue({
      kind,
      media,
      hasBirth: birthCtx.source !== 'none',
      yongShen: birthCtx.yongShen,
      side: body?.side ? String(body.side) : undefined,
      gender: body?.gender ? String(body.gender) : undefined,
    });

    let llmUsed = false;
    const apiKey = getApiKey();
    if (apiKey && body?.useLlm !== false) {
      try {
        const client = new OpenAI({ apiKey, baseURL: getApiBaseUrl() || undefined });
        const model = getDefaultModel() || 'auto';
        const completion = await Promise.race([
          createOpenAiCompatibleChatCompletion(
            client,
            {
              model,
              temperature: 0.3,
              maxTokens: 1200,
              messages: [
                {
                  role: 'system',
                  content: kind === 'face' ? FACE_VISION_SYSTEM : PALM_VISION_SYSTEM,
                },
                {
                  role: 'user',
                  content: [
                    {
                      type: 'text',
                      text: JSON.stringify({
                        task: kind === 'face' ? 'face_structure' : 'palm_structure',
                        gender: body?.gender,
                        side: body?.side,
                        yongShen: birthCtx.yongShen,
                        note: body?.note ? String(body.note).slice(0, 200) : undefined,
                      }),
                    },
                    { type: 'image_url', image_url: { url: image.dataUrl } },
                  ],
                },
              ],
            },
            { timeout: 50_000 },
          ),
          new Promise<null>((resolve) => setTimeout(() => resolve(null), 18_000)),
        ]);

        if (completion) {
          const text = completion.choices?.[0]?.message?.content || '';
          const parsed = parseJsonObject(text);
          if (parsed) {
            core = mergeLlmXiangxue(core, {
              summary: typeof parsed.summary === 'string' ? parsed.summary : undefined,
              observations: Array.isArray(parsed.observations)
                ? (parsed.observations as Array<{ title?: string; body?: string }>).map((o) => ({
                    title: String(o.title || '观察'),
                    body: String(o.body || ''),
                  }))
                : undefined,
              actions: Array.isArray(parsed.actions)
                ? (parsed.actions as unknown[]).map(String)
                : undefined,
              dimNotes:
                parsed.dimNotes && typeof parsed.dimNotes === 'object'
                  ? (parsed.dimNotes as Record<string, string>)
                  : undefined,
              tags: Array.isArray(parsed.tags) ? (parsed.tags as unknown[]).map(String) : undefined,
            });
            llmUsed = true;
          }
        }
      } catch (err) {
        console.error('[xiangxue/vision]', err);
      }
    }

    const allowSeo = body?.allowSeoLineArt === true;
    const result: XiangxueSessionResult = {
      ...core,
      media: {
        id: media.id,
        publicPath: media.publicPath,
        r2Key: media.r2Key,
        kind: media.kind,
        allowSeoLineArt: allowSeo,
      },
      birth:
        birthCtx.source !== 'none'
          ? {
              birthDate: birthCtx.birthDate,
              gender: birthCtx.gender,
              yongShen: birthCtx.yongShen,
              dayMaster: birthCtx.dayMaster,
              note: birthCtx.note,
            }
          : undefined,
      llmUsed,
    };

    const sessionId = `tool_${generateId()}`;
    toolSessionOperations.create({
      id: sessionId,
      userId,
      toolSlug: kind === 'face' ? 'physiognomy' : 'palmistry',
      status: 'completed',
      input: {
        kind,
        mediaId: media.id,
        side: body?.side || null,
        birthDate: birthCtx.birthDate || null,
        allowSeoLineArt: allowSeo,
      },
      result: {
        ...result,
        tool: kind === 'face' ? 'physiognomy' : 'palmistry',
        title: result.title,
        savedAt: result.generatedAt,
      },
      meta: {
        toolTitle: result.title,
        category: 'application',
        kind,
        mediaId: media.id,
        publicPath: media.publicPath,
        r2Key: media.r2Key,
        allowSeoLineArt: allowSeo,
        llmUsed,
        sha256: media.sha256,
      },
    });

    trackServerEvent({
      eventName: 'tool_run_completed',
      page: kind === 'face' ? '/tools/physiognomy' : '/tools/palmistry',
      meta: { action: 'xiangxue_run', kind, sessionId, llmUsed, r2: Boolean(media.r2Key) },
    });

    return NextResponse.json({
      success: true,
      sessionId,
      resultUrl: `/tools/${kind === 'face' ? 'physiognomy' : 'palmistry'}/result/${sessionId}`,
      result,
      media: {
        id: media.id,
        publicPath: media.publicPath,
        r2Key: media.r2Key,
      },
      message: llmUsed ? '结构观察已生成（含视觉模型）' : '结构观察已生成（启发式；视觉模型不可用时）',
    });
  } catch (error) {
    console.error('[xiangxue/run]', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '分析失败' },
      { status: 500 },
    );
  }
}
