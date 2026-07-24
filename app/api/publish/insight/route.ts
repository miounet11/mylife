import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getAuthSession } from '@/lib/auth';
import { toolSessionOperations } from '@/lib/database';
import { getApiBaseUrl, getApiKey, getDefaultModel } from '@/lib/env';
import { createOpenAiCompatibleChatCompletion } from '@/lib/openai-compatible-chat';
import { getOrCreateGuestUserId } from '@/lib/user-utils';
import { generateId } from '@/lib/utils';
import { trackServerEvent } from '@/lib/analytics';
import { redactRecord, redactText, redactAddress } from '@/lib/publish/privacy-redact';
import {
  buildChatInsightDraft,
  buildNamingInsightDraft,
  buildSpaceFullReportDraft,
  buildSpaceInsightDraft,
  type PublicInsightDraft,
} from '@/lib/publish/insight-from-session';

export const runtime = 'nodejs';
export const maxDuration = 90;

const MODEL_FAST = 'grok-4.3-fast';
const MODEL_HIGH = 'grok-4.3-high';

function resolveModel(raw: unknown) {
  const s = typeof raw === 'string' ? raw.trim().toLowerCase() : '';
  if (s.includes('high')) return MODEL_HIGH;
  if (s.includes('fast')) return MODEL_FAST;
  return getDefaultModel() || MODEL_FAST;
}

/**
 * POST: 将空间测算 / 对话内容脱敏后生成公开文章并写入 tool_sessions
 * GET ?id= 读取公开文章
 */
export async function GET(request: NextRequest) {
  try {
    const id = new URL(request.url).searchParams.get('id') || '';
    if (!id) {
      // list recent public
      const userId = await getOrCreateGuestUserId();
      void userId;
      // no global list without admin; return empty
      return NextResponse.json({ success: true, items: [] });
    }

    const row = toolSessionOperations.getById(id) as Record<string, unknown> | null;
    if (!row) {
      return NextResponse.json({ success: false, error: '未找到' }, { status: 404 });
    }
    const meta = (row.meta || {}) as Record<string, unknown>;
    const result = (row.result || {}) as Record<string, unknown>;
    if (!meta.public && !result.public) {
      return NextResponse.json({ success: false, error: '该内容未公开' }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      id: row.id,
      createdAt: row.createdAt || row.created_at,
      article: result.article || result,
      meta: redactRecord({
        sourceType: meta.sourceType,
        domain: meta.domain,
        model: meta.model,
      }),
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '读取失败' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const rawSource = String(body?.sourceType || 'space_lab');
    const sourceType =
      rawSource === 'chat'
        ? 'chat'
        : rawSource === 'tool'
          ? 'tool'
          : rawSource === 'naming'
            ? 'naming'
            : rawSource === 'space_report'
              ? 'space_report'
              : 'space_lab';
    const useLlm = body?.useLlm !== false;
    const model = resolveModel(body?.model);
    const titleHint = typeof body?.title === 'string' ? body.title.trim().slice(0, 80) : '';

    const auth = await getAuthSession();
    const userId =
      (auth.authenticated && auth.user?.id ? String(auth.user.id) : '') ||
      (await getOrCreateGuestUserId());

    // Build draft from payload
    let draft: PublicInsightDraft;
    if (sourceType === 'chat') {
      const messages = Array.isArray(body?.messages) ? body.messages : [];
      const joined = messages
        .slice(-30)
        .map((m: { role?: string; content?: string }) => {
          const role = m.role === 'assistant' ? '答' : '问';
          return `${role}：${redactText(String(m.content || ''))}`;
        })
        .join('\n');
      draft = buildChatInsightDraft({
        topic: titleHint || String(body?.topic || '结构对话'),
        rawSummary: joined.slice(0, 4000),
      });
    } else if (sourceType === 'naming') {
      const candidates = Array.isArray(body?.candidates) ? body.candidates : [];
      draft = buildNamingInsightDraft({
        mode:
          body?.namingMode === 'company'
            ? 'company'
            : body?.namingMode === 'product'
              ? 'product'
              : 'person',
        surnameOrBrand: body?.surnameOrBrand
          ? redactText(String(body.surnameOrBrand)).slice(0, 20)
          : undefined,
        candidates: candidates.slice(0, 16).map((c: { name?: string; score?: number; reason?: string }) => ({
          name: redactText(String(c.name || '')).slice(0, 24),
          score: Number(c.score) || 0,
          reason: c.reason ? redactText(String(c.reason)).slice(0, 80) : undefined,
        })),
        summary: body?.summary ? redactText(String(body.summary)) : undefined,
      });
    } else if (sourceType === 'space_report') {
      const report = body?.report || {};
      const sections = Array.isArray(report.sections)
        ? report.sections.map((s: { heading?: string; body?: string }) => ({
            heading: redactText(String(s.heading || '章节')).slice(0, 40),
            body: redactText(String(s.body || '')).slice(0, 4000),
          }))
        : [];
      const snap =
        typeof body?.planSnapshotDataUrl === 'string' &&
        body.planSnapshotDataUrl.startsWith('data:image')
          ? String(body.planSnapshotDataUrl).slice(0, 450_000)
          : typeof report.planSnapshotDataUrl === 'string'
            ? String(report.planSnapshotDataUrl).slice(0, 450_000)
            : null;
      draft = buildSpaceFullReportDraft({
        title: report.title ? redactText(String(report.title)) : undefined,
        summary: report.summary ? redactText(String(report.summary)) : undefined,
        sections,
        metrics: report.metrics && typeof report.metrics === 'object' ? report.metrics : undefined,
        layoutTitle: String(body?.layoutTitle || report.layout?.title || '空间观察'),
        areaSqm: Number(body?.areaSqm || report.metrics?.areaSqm) || undefined,
        geoAddressPublic: body?.geoAddress
          ? redactAddress(String(body.geoAddress))
          : report.geoPublic
            ? redactAddress(String(report.geoPublic))
            : null,
        profileLinked: Boolean(report.profileLinked),
        planSnapshotDataUrl: snap,
        priorityActions: Array.isArray(report.priorityActions)
          ? report.priorityActions.map((s: string) => redactText(s))
          : [],
      });
    } else {
      const summary = body?.summary || {};
      const qimen = body?.qimen || {};
      draft = buildSpaceInsightDraft({
        summaryNotes: Array.isArray(summary.structuralNotes)
          ? summary.structuralNotes.map((s: string) => redactText(s))
          : [],
        actions: Array.isArray(summary.priorityActions)
          ? summary.priorityActions.map((s: string) => redactText(s))
          : [],
        qimenNotes: Array.isArray(qimen.summaryNotes)
          ? qimen.summaryNotes.map((s: string) => redactText(s))
          : [],
        layoutTitle: String(body?.layoutTitle || '空间观察'),
        areaSqm: Number(body?.areaSqm) || undefined,
        geoAddressPublic: body?.geoAddress ? redactAddress(String(body.geoAddress)) : null,
      });
    }

    if (titleHint) draft.title = titleHint;

    // Optional LLM polish
    if (useLlm) {
      const apiKey = getApiKey();
      if (apiKey) {
        try {
          const openai = new OpenAI({ apiKey, baseURL: getApiBaseUrl() || undefined });
          const completion = await createOpenAiCompatibleChatCompletion(
            openai,
            {
              model,
              temperature: 0.4,
              maxTokens: 1200,
              messages: [
                {
                  role: 'system',
                  content:
                    '你是命理/空间结构内容编辑。把用户测算摘要改写成可公开的科普短文。禁止出现吉凶恐吓、手机号、邮箱、精确门牌。输出 JSON：{"title":"","summary":"","sections":[{"heading":"","body":""}],"tags":[]}',
                },
                {
                  role: 'user',
                  content: JSON.stringify(redactRecord(draft)),
                },
              ],
            },
            { timeout: 50_000 },
          );
          const text = completion.choices?.[0]?.message?.content || '';
          const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
          const parsed = JSON.parse((fenced?.[1] || text).trim());
          if (parsed?.title && Array.isArray(parsed.sections)) {
            draft = {
              title: redactText(String(parsed.title)).slice(0, 80),
              summary: redactText(String(parsed.summary || draft.summary)).slice(0, 200),
              sections: parsed.sections.slice(0, 8).map((s: { heading?: string; body?: string }) => ({
                heading: redactText(String(s.heading || '章节')).slice(0, 40),
                body: redactText(String(s.body || '')).slice(0, 3000),
              })),
              tags: Array.isArray(parsed.tags)
                ? parsed.tags.map((t: string) => String(t).slice(0, 20)).slice(0, 8)
                : draft.tags,
              sourceType: draft.sourceType,
              domain: draft.domain,
            };
          }
        } catch (err) {
          console.error('[publish/insight] llm polish failed', err);
        }
      }
    }

    const sessionId = `tool_${generateId()}`;
    const article = {
      public: true,
      ...draft,
      publishedAt: new Date().toISOString(),
    };

    const isSpaceReport = sourceType === 'space_report';
    const isNaming = sourceType === 'naming';
    const publicPath = isSpaceReport
      ? `/share/space/${sessionId}`
      : isNaming
        ? `/share/naming/${sessionId}`
        : `/share/insight/${sessionId}`;

    toolSessionOperations.create({
      id: sessionId,
      userId,
      toolSlug: isSpaceReport
        ? 'public-space-report'
        : isNaming
          ? 'public-naming'
          : 'public-insight',
      status: 'completed',
      input: redactRecord({
        sourceType,
        layoutTitle: body?.layoutTitle,
        hasGeo: Boolean(body?.geoAddress),
      }) as Record<string, unknown>,
      result: { public: true, article },
      meta: {
        public: true,
        sourceType,
        model: useLlm ? model : null,
        toolTitle: isSpaceReport
          ? '公开空间场报表'
          : isNaming
            ? '公开起名短名单'
            : '公开结构笔记',
        category: 'insights',
      },
    });

    void trackServerEvent({
      eventName: 'public_insight_published',
      page: publicPath,
      meta: { sessionId, sourceType, model },
    });

    return NextResponse.json({
      success: true,
      id: sessionId,
      url: publicPath,
      article: draft,
      message: isSpaceReport
        ? '已发布完整空间场公开报表，他人可打开链接查看。'
        : isNaming
          ? '已发布起名短名单（已脱敏）。'
          : '已生成脱敏公开笔记，可分享链接。',
    });
  } catch (error) {
    console.error('[publish/insight]', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '发布失败' },
      { status: 500 },
    );
  }
}
