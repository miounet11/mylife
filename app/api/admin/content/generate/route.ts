import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { enqueueContentGenerationJob, getContentGenerationJob } from '@/lib/content-generation-jobs';
import type { ContentGenerationInput } from '@/lib/content-generation';

export const maxDuration = 30;

async function ensureAdmin() {
  const session = await getAuthSession();
  if (!session.authenticated || session.user?.role !== 'admin') {
    return null;
  }
  return session.user;
}

function buildInput(body: any): ContentGenerationInput {
  return {
    mode: body.mode === 'cluster' ? 'cluster' : 'single',
    contentType: body.contentType,
    subtype: body.subtype,
    topic: `${body.topic || ''}`.trim(),
    angle: `${body.angle || ''}`.trim(),
    platform: `${body.platform || ''}`.trim(),
    keywords: Array.isArray(body.keywords)
      ? body.keywords.map((item: unknown) => `${item || ''}`.trim()).filter(Boolean)
      : [],
    audience: `${body.audience || ''}`.trim(),
    locale: `${body.locale || ''}`.trim() || undefined,
    market: `${body.market || ''}`.trim(),
    entityName: `${body.entityName || ''}`.trim(),
    sourceSignals: `${body.sourceSignals || ''}`.trim(),
    status: body.status === 'published' ? 'published' : 'draft',
    featured: body.featured === true,
  };
}

function buildJobSummary(job: ReturnType<typeof getContentGenerationJob>) {
  if (!job) {
    return null;
  }

  const result = (job.result || {}) as {
    entries?: unknown[];
  };
  const entries = Array.isArray(result.entries) ? result.entries : [];

  return {
    id: job.id,
    status: job.status,
    attempts: job.attempts || 0,
    maxAttempts: job.maxAttempts || 0,
    generatedCount: job.generatedCount || 0,
    llmSucceededCount: job.llmSucceededCount || 0,
    fallbackCount: job.fallbackCount || 0,
    nextRunAt: job.nextRunAt || null,
    lockedAt: job.lockedAt || null,
    lastError: job.lastError || null,
    createdAt: job.createdAt || null,
    updatedAt: job.updatedAt || null,
    meta: job.meta || {},
    entries,
  };
}

export async function POST(request: NextRequest) {
  const user = await ensureAdmin();
  if (!user) {
    return NextResponse.json({ success: false, error: '无权限访问' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const input = buildInput(body);

    if (!input.topic.trim()) {
      return NextResponse.json({ success: false, error: '请输入主题' }, { status: 400 });
    }

    const job = enqueueContentGenerationJob({
      userId: user.id,
      input,
      meta: {
        trigger: 'admin-api',
      },
    });

    return NextResponse.json({
      success: true,
      async: true,
      job: buildJobSummary(job),
      pollAfterMs: 3000,
    }, { status: 202 });
  } catch (error) {
    console.error('[API] 创建内容生成任务失败:', error);
    return NextResponse.json({ success: false, error: '内容生成任务创建失败' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const user = await ensureAdmin();
  if (!user) {
    return NextResponse.json({ success: false, error: '无权限访问' }, { status: 403 });
  }

  const url = 'nextUrl' in request && request.nextUrl
    ? request.nextUrl
    : new URL(request.url);
  const jobId = `${url.searchParams.get('jobId') || ''}`.trim();
  if (!jobId) {
    return NextResponse.json({ success: false, error: '缺少任务 ID' }, { status: 400 });
  }

  const job = getContentGenerationJob(jobId);
  if (!job) {
    return NextResponse.json({ success: false, error: '任务不存在' }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    job: buildJobSummary(job),
    pollAfterMs: ['pending', 'running', 'retry'].includes(job.status) ? 3000 : null,
  });
}
