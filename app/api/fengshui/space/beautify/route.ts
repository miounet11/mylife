import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getApiBaseUrl, getApiKey } from '@/lib/env';
import { createOpenAiCompatibleChatCompletion } from '@/lib/openai-compatible-chat';
import { generateImageB64 } from '@/lib/llm-image-client';
import { ensureFloorZones } from '@/lib/fengshui/space/cad-ops';
import {
  buildBeautifyLlmSystemPrompt,
  buildBeautifyLlmUserPrompt,
  heuristicBeautify,
  validateLlmZones,
  type BeautifyZoneIn,
} from '@/lib/fengshui/space/beautify';
import { structuresFromZones } from '@/lib/fengshui/space/cad-ops';
import type { SpaceLabState } from '@/lib/fengshui/space/types';
import { trackServerEvent } from '@/lib/analytics';

export const runtime = 'nodejs';
export const maxDuration = 90;

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
    const state = (body?.state || {}) as Partial<SpaceLabState>;
    const wantImage = body?.generateImage !== false;
    const useLlm = body?.useLlm !== false;

    if (!state.room?.widthM || !state.room?.depthM) {
      return NextResponse.json({ success: false, error: '缺少房间尺寸' }, { status: 400 });
    }

    const zonesIn: BeautifyZoneIn[] = ensureFloorZones(state as SpaceLabState).map((z) => ({
      id: z.id,
      kind: z.kind,
      x: z.x,
      y: z.y,
      w: z.w,
      h: z.h,
      label: z.label,
      furniture: z.furniture,
    }));

    let result = heuristicBeautify(
      {
        room: state.room,
        floorZones: state.floorZones,
        activeDomain: state.activeDomain || 'residential',
        profileLink: state.profileLink,
        layoutLabel: state.layoutLabel,
        presetTitle: state.presetTitle,
      },
      zonesIn,
    );

    // Optional LLM structure polish
    if (useLlm) {
      try {
        const apiKey = getApiKey();
        const baseURL = getApiBaseUrl();
        if (apiKey) {
          const client = new OpenAI({ apiKey, baseURL });
          const completion = await createOpenAiCompatibleChatCompletion(client, {
            model: 'grok-4.3-fast',
            temperature: 0.4,
            messages: [
              { role: 'system', content: buildBeautifyLlmSystemPrompt() },
              {
                role: 'user',
                content: buildBeautifyLlmUserPrompt({
                  domain: state.activeDomain || 'residential',
                  facing: state.room.entranceFacing || '南',
                  widthM: state.room.widthM,
                  depthM: state.room.depthM,
                  zones: zonesIn,
                  yongShen: state.profileLink?.yongShen,
                }),
              },
            ],
          });
          const text = completion.choices?.[0]?.message?.content || '';
          const parsed = parseJsonObject(text);
          const llmZones = parsed ? validateLlmZones(parsed.zones, state.room.widthM, state.room.depthM) : null;
          if (llmZones?.length) {
            const notes = Array.isArray(parsed?.notes)
              ? (parsed!.notes as string[]).map(String).slice(0, 6)
              : ['LLM 结构润色'];
            result = {
              zones: llmZones,
              notes,
              imagePrompt: result.imagePrompt,
              mode: 'llm',
            };
          }
        }
      } catch (err) {
        console.error('[beautify] llm failed, heuristic kept', err);
      }
    }

    let beautifyImageDataUrl: string | null = null;
    let imageError: string | null = null;
    if (wantImage) {
      try {
        const img = await generateImageB64({
          prompt: result.imagePrompt,
          size: '1024x1024',
        });
        beautifyImageDataUrl = `data:image/png;base64,${img.b64}`;
      } catch (err) {
        imageError = err instanceof Error ? err.message : 'image failed';
      }
    }

    const structures = structuresFromZones(result.zones).map((s, i) => ({
      ...s,
      id: `beautify-${i}`,
    }));

    trackServerEvent({
      eventName: 'tool_run_completed',
      page: '/tools/fengshui-space',
      meta: {
        action: 'space_beautify',
        mode: result.mode,
        zones: result.zones.length,
        hasImage: Boolean(beautifyImageDataUrl),
      },
    });

    return NextResponse.json({
      success: true,
      mode: result.mode,
      notes: result.notes,
      zones: result.zones,
      structures,
      beautifyImageDataUrl,
      imageError,
      message: beautifyImageDataUrl
        ? '已美化户型结构并生成彩平图'
        : imageError
          ? `结构已美化；彩平图暂不可用（${imageError.slice(0, 80)}）`
          : '已美化户型结构',
    });
  } catch (error) {
    console.error('[beautify]', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '美化失败' },
      { status: 500 },
    );
  }
}
