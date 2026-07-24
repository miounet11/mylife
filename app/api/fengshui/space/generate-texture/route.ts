import { NextRequest, NextResponse } from 'next/server';
import fs from 'node:fs/promises';
import path from 'node:path';

export const runtime = 'nodejs';
export const maxDuration = 120;

/**
 * 可选：服务端调用图像模型补充物料贴图。
 * 优先 XAI_API_KEY + grok-imagine-image-lite
 * 回退 PAGE_ILLUST / LLM_IMAGE (inping OpenAI-compatible)
 *
 * POST { key: 'floor_wood', prompt?: string, force?: boolean }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const key = String(body.key || '').replace(/[^a-z0-9_]/gi, '');
    if (!key) {
      return NextResponse.json({ success: false, error: '需要 key' }, { status: 400 });
    }

    const outDir = path.join(process.cwd(), 'public/images/fengshui-space/textures');
    const outFile = path.join(outDir, `${key}.jpg`);
    const force = Boolean(body.force);

    try {
      await fs.access(outFile);
      if (!force) {
        return NextResponse.json({
          success: true,
          cached: true,
          url: `/images/fengshui-space/textures/${key}.jpg`,
        });
      }
    } catch {
      // missing — generate
    }

    const prompt =
      String(body.prompt || '').trim() ||
      `Seamless tileable architectural material texture "${key}", orthographic, high detail, no text, no watermark, square 1:1, photorealistic PBR albedo`;

    const model =
      process.env.FENGSHUI_TEXTURE_MODEL ||
      process.env.GROK_IMAGINE_IMAGE_MODEL ||
      'grok-imagine-image-lite';

    // 1) xAI Imagine
    const xaiKey = process.env.XAI_API_KEY || process.env.GROK_API_KEY || '';
    const xaiBase = (process.env.XAI_API_BASE || 'https://api.x.ai/v1').replace(/\/$/, '');

    // 2) OpenAI-compatible image API (inping etc.)
    const compatKey =
      process.env.PAGE_ILLUST_API_KEY ||
      process.env.LLM_IMAGE_PRIMARY_API_KEY ||
      process.env.VISUAL_ASSET_PRIMARY_API_KEY ||
      '';
    const compatBase = (
      process.env.PAGE_ILLUST_API_BASE ||
      process.env.LLM_IMAGE_PRIMARY_BASE_URL ||
      'https://ttqq.inping.com'
    ).replace(/\/$/, '');

    let b64: string | null = null;
    let usedModel = model;
    let provider = '';

    if (xaiKey) {
      try {
        const res = await fetch(`${xaiBase}/images/generations`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${xaiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model,
            prompt,
            n: 1,
            response_format: 'b64_json',
            // aspect if supported
            aspect_ratio: '1:1',
          }),
        });
        const data = await res.json();
        b64 =
          data?.data?.[0]?.b64_json ||
          data?.data?.[0]?.b64 ||
          null;
        if (b64) {
          provider = 'xai';
          usedModel = model;
        } else if (!res.ok) {
          console.warn('[generate-texture] xai', res.status, JSON.stringify(data).slice(0, 200));
        }
      } catch (e) {
        console.warn('[generate-texture] xai fail', e);
      }
    }

    if (!b64 && compatKey) {
      try {
        const fallbackModel =
          process.env.PAGE_ILLUST_MODEL_TURBO ||
          process.env.LLM_IMAGE_PRIMARY_MODEL ||
          'z-image-turbo';
        const res = await fetch(`${compatBase}/v1/images/generations`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${compatKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: fallbackModel,
            prompt,
            n: 1,
            size: '1024x1024',
            response_format: 'b64_json',
          }),
        });
        const data = await res.json();
        b64 = data?.data?.[0]?.b64_json || null;
        if (b64) {
          provider = 'compat';
          usedModel = fallbackModel;
        }
      } catch (e) {
        console.warn('[generate-texture] compat fail', e);
      }
    }

    if (!b64) {
      return NextResponse.json(
        {
          success: false,
          error:
            '图像生成失败：请配置 XAI_API_KEY（grok-imagine-image-lite）或 PAGE_ILLUST_API_KEY。静态贴图包已预置在 /images/fengshui-space/textures/',
          hint: '预置 12 张 seamless 贴图已随部署提供，无需再生成即可使用。',
        },
        { status: 503 },
      );
    }

    await fs.mkdir(outDir, { recursive: true });
    const buf = Buffer.from(b64, 'base64');
    await fs.writeFile(outFile, buf);

    return NextResponse.json({
      success: true,
      cached: false,
      url: `/images/fengshui-space/textures/${key}.jpg`,
      provider,
      model: usedModel,
      bytes: buf.length,
    });
  } catch (error) {
    console.error('[generate-texture]', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '生成失败' },
      { status: 500 },
    );
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    texturesBase: '/images/fengshui-space/textures/',
    modelPreference: 'grok-imagine-image-lite',
    usage: 'POST { key, prompt?, force? }',
  });
}
