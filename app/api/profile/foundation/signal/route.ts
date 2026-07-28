/**
 * 客户端工具（如合婚）结果写回人生数据底座
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { toolSessionOperations } from '@/lib/database';
import {
  writeDimensionToFoundation,
  writeGenericToolToFoundation,
  writeHehunToFoundation,
} from '@/lib/life-foundation/writeback';
import { getOrCreateGuestUserId } from '@/lib/user-utils';
import { generateId } from '@/lib/utils';
import { trackServerEvent } from '@/lib/analytics';

export const runtime = 'nodejs';

type SignalKind = 'hehun' | 'dimension' | 'tool';

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession();
    const userId = session.user?.id || (await getOrCreateGuestUserId());
    if (!userId) {
      return NextResponse.json({ success: false, error: '无法建立会话' }, { status: 401 });
    }

    const body = await request.json();
    const kind = String(body?.kind || '') as SignalKind;
    const fortuneId = body?.fortuneId ? String(body.fortuneId) : null;
    const persistSession = body?.persistSession !== false;

    let foundationWritten = false;
    let sessionId: string | null = body?.sessionId ? String(body.sessionId) : null;

    if (kind === 'hehun') {
      const score = Number(body?.score);
      const headline = `${body?.headline || ''}`.trim();
      if (!Number.isFinite(score) || !headline) {
        return NextResponse.json({ success: false, error: '缺少合婚分数或头条' }, { status: 400 });
      }
      if (persistSession && !sessionId) {
        sessionId = `tool_${generateId()}`;
        try {
          toolSessionOperations.create({
            id: sessionId,
            userId,
            toolSlug: 'hehun',
            status: 'completed',
            input: {
              fortuneId,
              partnerLabel: body?.partnerLabel || null,
            },
            result: {
              score,
              band: body?.band || null,
              headline,
              summary: body?.summary || headline,
              tool: 'hehun',
              title: '合婚双盘',
              savedAt: new Date().toISOString(),
            },
            meta: {
              toolTitle: '合婚双盘',
              category: 'relationship',
              fortuneId,
              score,
              band: body?.band || null,
            },
          });
        } catch (e) {
          console.warn('[foundation/signal] hehun session skipped', e);
        }
      }
      const wb = writeHehunToFoundation({
        userId,
        fortuneId,
        sessionId,
        score,
        band: body?.band ? String(body.band) : null,
        headline,
        summary: body?.summary ? String(body.summary) : headline,
        partnerLabel: body?.partnerLabel ? String(body.partnerLabel) : null,
      });
      foundationWritten = wb.ok;
      trackServerEvent({
        eventName: 'hehun_run',
        page: '/hehun',
        userId,
        meta: { foundationWritten, score, sessionId },
      });
    } else if (kind === 'dimension') {
      const slug = `${body?.slug || ''}`.trim();
      const title = `${body?.title || slug}`.trim();
      const summary = `${body?.summary || ''}`.trim();
      if (!slug || !summary) {
        return NextResponse.json({ success: false, error: '缺少维度 slug 或摘要' }, { status: 400 });
      }
      if (persistSession && !sessionId) {
        sessionId = `tool_${generateId()}`;
        try {
          toolSessionOperations.create({
            id: sessionId,
            userId,
            toolSlug: `dimension-${slug}`,
            status: 'completed',
            input: { slug, fortuneId, reportId: body?.reportId || null },
            result: {
              slug,
              title,
              summary,
              tool: `dimension-${slug}`,
              title2: title,
              savedAt: new Date().toISOString(),
            },
            meta: {
              toolTitle: title,
              category: 'dimensions',
              slug,
              fortuneId,
            },
          });
        } catch (e) {
          console.warn('[foundation/signal] dimension session skipped', e);
        }
      }
      const wb = writeDimensionToFoundation({
        userId,
        fortuneId,
        sessionId,
        slug,
        title,
        summary,
        predictionCount: Number(body?.predictionCount) || 0,
      });
      foundationWritten = wb.ok;
    } else if (kind === 'tool') {
      const toolSlug = `${body?.toolSlug || ''}`.trim();
      const toolTitle = `${body?.toolTitle || toolSlug}`.trim();
      if (!toolSlug) {
        return NextResponse.json({ success: false, error: '缺少 toolSlug' }, { status: 400 });
      }
      if (!sessionId) sessionId = `tool_${generateId()}`;
      const wb = writeGenericToolToFoundation({
        userId,
        fortuneId,
        sessionId,
        toolSlug,
        toolTitle,
        summary: body?.summary ? String(body.summary) : toolTitle,
        qualityScore: body?.qualityScore != null ? Number(body.qualityScore) : null,
      });
      foundationWritten = wb.ok;
    } else {
      return NextResponse.json(
        { success: false, error: 'kind 须为 hehun | dimension | tool' },
        { status: 400 },
      );
    }

    return NextResponse.json({
      success: true,
      foundationWritten,
      sessionId,
      kind,
    });
  } catch (error) {
    console.error('[API] foundation signal POST failed:', error);
    return NextResponse.json({ success: false, error: '写回失败' }, { status: 500 });
  }
}
