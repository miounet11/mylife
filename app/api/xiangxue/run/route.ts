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

function asSectionList(raw: unknown): Array<{ title: string; body: string; tag?: string }> | undefined {
  if (!Array.isArray(raw)) return undefined;
  return raw.map((o) => {
    const row = o as { title?: string; body?: string; tag?: string };
    return {
      title: String(row.title || ''),
      body: String(row.body || ''),
      tag: row.tag ? String(row.tag) : undefined,
    };
  });
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

    const userNote = body?.note ? String(body.note).slice(0, 200) : undefined;

    let core = heuristicXiangxue({
      kind,
      media,
      hasBirth: birthCtx.source !== 'none',
      yongShen: birthCtx.yongShen,
      dayMaster: birthCtx.dayMaster,
      side: body?.side ? String(body.side) : undefined,
      gender: body?.gender ? String(body.gender) : undefined,
      note: userNote,
    });

    let llmUsed = false;
    const apiKey = getApiKey();
    if (apiKey && body?.useLlm !== false) {
      try {
        const client = new OpenAI({ apiKey, baseURL: getApiBaseUrl() || undefined });
        const models = [getDefaultModel() || 'auto', 'auto', 'gpt-4o-mini'].filter(
          (v, i, a) => v && a.indexOf(v) === i,
        );
        let parsed: Record<string, unknown> | null = null;
        for (const model of models) {
          try {
            const completion = await Promise.race([
              createOpenAiCompatibleChatCompletion(
                client,
                {
                  model,
                  temperature: 0.32,
                  maxTokens: 3600,
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
                            task:
                              kind === 'face'
                                ? 'face_report_v3_physical_then_mingli'
                                : 'palm_report_v3_physical_then_mingli',
                            readingOrder: [
                              'physical_imaging',
                              'physical_structure',
                              'physical_features',
                              'mingli_qi',
                              'mingli_bazi_cross',
                              'synthesis_actions',
                            ],
                            framework:
                              kind === 'face'
                                ? ['三庭', '五眼', '五官', '十二宫教学', '用神交叉']
                                : ['手型', '三主线', '事业线/太阳线', '掌丘', '用神节奏'],
                            gender: body?.gender,
                            side: body?.side,
                            yongShen: birthCtx.yongShen,
                            dayMaster: birthCtx.dayMaster,
                            birthDate: birthCtx.birthDate,
                            hasBirth: birthCtx.source !== 'none',
                            note: userNote,
                            dimIds:
                              kind === 'face'
                                ? [
                                    'photo',
                                    'pose',
                                    'symmetry',
                                    'santine',
                                    'wuyan',
                                    'forehead',
                                    'brow_eye',
                                    'nose',
                                    'mouth',
                                    'jaw',
                                    'cheek_chin',
                                    'skin_light',
                                    'tianshi',
                                    'sancai',
                                    'shiergong',
                                    'wuguan_qi',
                                    'yongshen_cross',
                                    'spirit',
                                    'expression',
                                  ]
                                : [
                                    'photo',
                                    'frame',
                                    'hand_shape',
                                    'life_line',
                                    'head_line',
                                    'heart_line',
                                    'fate_line',
                                    'sun_line',
                                    'mounts',
                                    'texture',
                                    'fingers',
                                    'tianshi',
                                    'three_lines',
                                    'mount_qi',
                                    'yongshen_cross',
                                    'action_rhythm',
                                    'balance',
                                    'self_review',
                                  ],
                            instruction:
                              '严格先写物理层可见结构（逐项检查清单），再写命理交叉教学层，最后综合行动。无生辰则命理层标明弱提示。看不清写弱证据，禁止编造与恐吓。输出完整 JSON。',
                          }),
                        },
                        { type: 'image_url', image_url: { url: image.dataUrl } },
                      ],
                    },
                  ],
                },
                { timeout: 58_000 },
              ),
              new Promise<null>((resolve) => setTimeout(() => resolve(null), 28_000)),
            ]);
            if (!completion) continue;
            const text = completion.choices?.[0]?.message?.content || '';
            parsed = parseJsonObject(text);
            if (parsed) break;
          } catch (e) {
            console.error('[xiangxue/vision]', model, e);
          }
        }

        if (parsed) {
          core = mergeLlmXiangxue(core, {
            summary: typeof parsed.summary === 'string' ? parsed.summary : undefined,
            physicalHeadline:
              typeof parsed.physicalHeadline === 'string' ? parsed.physicalHeadline : undefined,
            mingliHeadline:
              typeof parsed.mingliHeadline === 'string' ? parsed.mingliHeadline : undefined,
            synthesisHeadline:
              typeof parsed.synthesisHeadline === 'string' ? parsed.synthesisHeadline : undefined,
            physicalSections: asSectionList(parsed.physicalSections),
            mingliSections: asSectionList(parsed.mingliSections),
            metaSections: asSectionList(parsed.metaSections),
            observations: Array.isArray(parsed.observations)
              ? (
                  parsed.observations as Array<{
                    title?: string;
                    body?: string;
                    layer?: string;
                  }>
                ).map((o) => ({
                  title: String(o.title || '观察'),
                  body: String(o.body || ''),
                  layer: o.layer,
                }))
              : undefined,
            actions: Array.isArray(parsed.actions)
              ? (parsed.actions as unknown[]).map(String)
              : undefined,
            strengths: Array.isArray(parsed.strengths)
              ? (parsed.strengths as unknown[]).map(String)
              : undefined,
            watchpoints: Array.isArray(parsed.watchpoints)
              ? (parsed.watchpoints as unknown[]).map(String)
              : undefined,
            dimNotes:
              parsed.dimNotes && typeof parsed.dimNotes === 'object'
                ? (parsed.dimNotes as Record<string, string>)
                : undefined,
            dimScores:
              parsed.dimScores && typeof parsed.dimScores === 'object'
                ? (parsed.dimScores as Record<string, number>)
                : undefined,
            dimConfidence:
              parsed.dimConfidence && typeof parsed.dimConfidence === 'object'
                ? (parsed.dimConfidence as Record<string, number>)
                : undefined,
            tags: Array.isArray(parsed.tags) ? (parsed.tags as unknown[]).map(String) : undefined,
            photoTips: Array.isArray(parsed.photoTips)
              ? (parsed.photoTips as unknown[]).map(String)
              : undefined,
            frameworkNotes:
              parsed.frameworkNotes && typeof parsed.frameworkNotes === 'object'
                ? (parsed.frameworkNotes as Record<string, string>)
                : undefined,
          });
          llmUsed = true;
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
        schema: result.schema,
        sha256: media.sha256,
      },
    });

    trackServerEvent({
      eventName: 'tool_run_completed',
      page: kind === 'face' ? '/tools/physiognomy' : '/tools/palmistry',
      meta: { action: 'xiangxue_run', kind, sessionId, llmUsed, r2: Boolean(media.r2Key), schema: result.schema },
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
      message: llmUsed
        ? '系统报告已生成（物理 → 命理 · 含视觉模型）'
        : '系统报告已生成（物理 → 命理 · 结构引擎；视觉模型不可用时）',
    });
  } catch (error) {
    console.error('[xiangxue/run]', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '分析失败' },
      { status: 500 },
    );
  }
}
