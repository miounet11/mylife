import { NextRequest, NextResponse } from 'next/server';
import fs from 'node:fs/promises';
import path from 'node:path';
import {
  defaultImageModel,
  generateImageB64,
  imageGatewayInfo,
} from '@/lib/llm-image-client';

export const runtime = 'nodejs';
export const maxDuration = 120;

/**
 * 物料贴图生成 — 统一走聚合中转站 inping（OpenAI-compatible）
 * 默认模型：grok-imagine-image-lite
 *
 * POST { key: 'floor_wood', prompt?: string, force?: boolean, model?: string }
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
          gateway: imageGatewayInfo(),
        });
      }
    } catch {
      // generate
    }

    const prompt =
      String(body.prompt || '').trim() ||
      `Seamless tileable architectural material texture "${key}", orthographic, high detail, no text, no watermark, square 1:1, photorealistic PBR albedo`;

    const model = String(body.model || defaultImageModel());

    const result = await generateImageB64({ prompt, model, size: '1024x1024' });

    await fs.mkdir(outDir, { recursive: true });
    const buf = Buffer.from(result.b64, 'base64');
    // write as jpg name even if png bytes — browsers tolerate; optional convert later
    await fs.writeFile(outFile, buf);

    return NextResponse.json({
      success: true,
      cached: false,
      url: `/images/fengshui-space/textures/${key}.jpg`,
      provider: result.provider,
      model: result.model,
      bytes: buf.length,
      gateway: imageGatewayInfo(),
    });
  } catch (error) {
    console.error('[generate-texture]', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '生成失败',
        gateway: imageGatewayInfo(),
        hint: '确认 PAGE_ILLUST_API_KEY / LLM_IMAGE_PRIMARY_API_KEY 指向 https://ttqq.inping.com 且模型为 grok-imagine-image-lite',
      },
      { status: 500 },
    );
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    texturesBase: '/images/fengshui-space/textures/',
    gateway: imageGatewayInfo(),
    usage: 'POST { key, prompt?, force?, model? }',
  });
}
