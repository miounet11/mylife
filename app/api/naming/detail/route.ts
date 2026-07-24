import { NextRequest, NextResponse } from 'next/server';
import { toolSessionOperations } from '@/lib/database';
import { enhanceNameDetailWithLlm } from '@/lib/naming/llm-enhance';
import { findCandidate, type NamingSessionResult } from '@/lib/naming/session-report';
import type { NamingMode } from '@/lib/naming';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const sessionId = String(body?.sessionId || '');
    const nameKey = String(body?.name || body?.nameKey || '');
    if (!sessionId || !nameKey) {
      return NextResponse.json(
        { success: false, error: '缺少 sessionId 或 name' },
        { status: 400 },
      );
    }

    const row = toolSessionOperations.getById(sessionId) as {
      result?: NamingSessionResult & { candidates?: NamingSessionResult['candidates'] };
      input?: Record<string, unknown>;
      userId?: string;
    } | null;

    if (!row?.result) {
      return NextResponse.json({ success: false, error: '会话不存在' }, { status: 404 });
    }

    const result = row.result as NamingSessionResult;
    const candidates = result.candidates || [];
    const candidate = findCandidate(candidates, nameKey);
    const displayName = candidate?.fullName || candidate?.name || decodeURIComponent(nameKey);
    const mode = (result.mode || 'person') as NamingMode;

    const detail = await enhanceNameDetailWithLlm({
      mode,
      name: displayName,
      candidate,
      context: (result.input || row.input || {}) as Record<string, unknown>,
    });

    return NextResponse.json({
      success: true,
      name: displayName,
      candidate,
      detail,
      sessionId,
    });
  } catch (error) {
    console.error('[naming/detail]', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '详解失败' },
      { status: 500 },
    );
  }
}
