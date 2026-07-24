import { NextRequest, NextResponse } from 'next/server';
import { generateByMode, type NamingMode } from '@/lib/naming';
import { trackServerEvent } from '@/lib/analytics';

export const runtime = 'nodejs';

function parseMode(raw: unknown): NamingMode {
  if (raw === 'company' || raw === 'product' || raw === 'person') return raw;
  return 'person';
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const mode = parseMode(body?.mode);
    const result = generateByMode(mode, body || {});

    trackServerEvent({
      eventName: 'tool_run_completed',
      page: '/tools/naming',
      meta: { action: 'naming_generate', mode, count: result.candidates.length },
    });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('[naming/generate]', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '生成失败' },
      { status: 500 },
    );
  }
}
