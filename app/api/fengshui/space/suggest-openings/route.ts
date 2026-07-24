import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getApiBaseUrl, getApiKey, getDefaultModel } from '@/lib/env';
import { createOpenAiCompatibleChatCompletion } from '@/lib/openai-compatible-chat';
import {
  heuristicOpenings,
  OPENING_VISION_SYSTEM,
  parseOpeningsFromModelText,
  type SuggestedOpening,
} from '@/lib/fengshui/space/opening-suggest';
import { trackServerEvent } from '@/lib/analytics';

export const runtime = 'nodejs';
export const maxDuration = 60;

const MAX_IMAGE_BYTES = 6 * 1024 * 1024;

function parseDataUrl(value: unknown) {
  const dataUrl = typeof value === 'string' ? value.trim() : '';
  const match = dataUrl.match(/^data:(image\/(?:png|jpe?g|webp|gif));base64,([A-Za-z0-9+/=\s]+)$/i);
  if (!match) return null;
  const payload = match[2].replace(/\s/g, '');
  const bytes = Math.floor((payload.length * 3) / 4);
  if (bytes <= 0 || bytes > MAX_IMAGE_BYTES) return null;
  return {
    dataUrl: `data:${match[1].toLowerCase()};base64,${payload}`,
    bytes,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const image = parseDataUrl(body?.imageDataUrl);
    const entranceFacing =
      typeof body?.entranceFacing === 'string' && body.entranceFacing.trim()
        ? body.entranceFacing.trim().slice(0, 8)
        : '南';

    if (!image) {
      return NextResponse.json(
        { success: false, error: '请上传有效平面图（png/jpg/webp，≤6MB）' },
        { status: 400 },
      );
    }

    const fallback = heuristicOpenings(entranceFacing);
    const apiKey = getApiKey();
    const baseURL = getApiBaseUrl();

    if (!apiKey) {
      void trackServerEvent({
        eventName: 'fengshui_opening_suggest',
        page: '/tools/fengshui-space',
        meta: { mode: 'heuristic', reason: 'no_api_key' },
      });
      return NextResponse.json({
        success: true,
        mode: 'heuristic',
        openings: fallback,
        message: '未配置视觉模型，已使用朝向启发式门窗位。',
      });
    }

    const openai = new OpenAI({ apiKey, baseURL: baseURL || undefined });
    const model = getDefaultModel() || 'gpt-4o-mini';

    let openings: SuggestedOpening[] | null = null;
    let mode: 'vision' | 'heuristic' = 'heuristic';
    let message = '';

    try {
      const completion = await createOpenAiCompatibleChatCompletion(
        openai,
        {
          model,
          temperature: 0.2,
          maxTokens: 900,
          messages: [
            { role: 'system', content: OPENING_VISION_SYSTEM },
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: `主入口朝向声明：${entranceFacing}。请识别图中门窗/开口，输出 JSON openings（1–5 个）。`,
                },
                {
                  type: 'image_url',
                  image_url: { url: image.dataUrl },
                },
              ],
            },
          ],
        },
        { timeout: 45_000 },
      );

      const text = completion.choices?.[0]?.message?.content || '';
      openings = parseOpeningsFromModelText(text);
      if (openings?.length) {
        mode = 'vision';
        message = '已根据户型图自动建议门窗位，可拖动微调。';
      } else {
        openings = fallback;
        message = '模型未返回可用坐标，已回退启发式门窗位。';
      }
    } catch (err) {
      console.error('[fengshui/suggest-openings] vision failed', err);
      openings = fallback;
      message = '视觉分析暂时不可用，已使用朝向启发式门窗位。';
    }

    void trackServerEvent({
      eventName: 'fengshui_opening_suggest',
      page: '/tools/fengshui-space',
      meta: { mode, count: openings.length, facing: entranceFacing },
    });

    return NextResponse.json({
      success: true,
      mode,
      openings,
      message,
    });
  } catch (error) {
    console.error('[fengshui/suggest-openings]', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '分析失败' },
      { status: 500 },
    );
  }
}
