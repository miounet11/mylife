import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { generateManagedContentDrafts, type GeneratedManagedContentDraft } from '@/lib/content-generation';
import { contentSignalOperations } from '@/lib/database';
import { buildGenerationInputFromSignal } from '@/lib/content-radar';
import { listManagedContentEntries, saveManagedContentEntry } from '@/lib/content-store';

export const maxDuration = 30;

async function ensureAdmin() {
  const session = await getAuthSession();
  if (!session.authenticated || session.user?.role !== 'admin') {
    return null;
  }
  return session.user;
}

function ensureUniqueSlugs(entries: GeneratedManagedContentDraft[]) {
  const existingSlugs = new Set(listManagedContentEntries().map((item) => item.slug));
  const batchSlugs = new Set<string>();

  return entries.map((entry) => {
    let slug = entry.slug;
    let suffix = 2;

    while (existingSlugs.has(slug) || batchSlugs.has(slug)) {
      slug = `${entry.slug}-${suffix}`;
      suffix += 1;
    }

    batchSlugs.add(slug);
    return {
      ...entry,
      slug,
    };
  });
}

export async function POST(request: NextRequest) {
  const user = await ensureAdmin();
  if (!user) {
    return NextResponse.json({ success: false, error: '无权限访问' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const signalId = `${body.signalId || ''}`.trim();
    if (!signalId) {
      return NextResponse.json({ success: false, error: '缺少热点信号 ID' }, { status: 400 });
    }

    const signal = contentSignalOperations.getById(signalId);
    if (!signal) {
      return NextResponse.json({ success: false, error: '热点信号不存在或已失效' }, { status: 404 });
    }

    const mode = body.mode === 'cluster' ? 'cluster' : 'single';
    const autoPublish = body.autoPublish === true;
    const generationInput = buildGenerationInputFromSignal(signal, {
      mode,
      status: autoPublish ? 'published' : 'draft',
      featured: body.featured === true,
    });
    const generated = await generateManagedContentDrafts(generationInput);
    const uniqueEntries = ensureUniqueSlugs(generated.entries);

    const savedEntries = uniqueEntries.map((entry) =>
      saveManagedContentEntry({
        id: '',
        contentType: entry.contentType,
        subtype: entry.subtype,
        slug: entry.slug,
        title: entry.title,
        name: entry.name,
        excerpt: entry.excerpt,
        category: entry.category,
        readTime: entry.readTime,
        tags: entry.tags,
        featured: entry.featured,
        seoTitle: entry.seoTitle,
        seoDescription: entry.seoDescription,
        sections: entry.sections,
        status: entry.status,
        source: `${entry.source}:radar-promote`,
        meta: {
          origin: 'content-radar',
          radarSignalId: signal.id,
          radarSourceId: signal.sourceId,
          radarSourceLabel: signal.sourceLabel,
          radarPlatform: signal.platform,
          radarUrl: signal.url,
          radarPublishedAt: signal.publishedAt || null,
          radarKeywords: signal.matchedKeywords || [],
          radarScore: signal.score || 0,
          promotionMode: mode,
        },
      }, user.id)
    );

    return NextResponse.json({
      success: true,
      signal,
      entries: savedEntries,
      meta: {
        generatedCount: savedEntries.length,
        llmSucceededCount: generated.llmSucceededCount,
        fallbackCount: generated.fallbackCount,
        promotionMode: mode,
      },
    });
  } catch (error) {
    console.error('[API] 热点转内容失败:', error);
    return NextResponse.json({ success: false, error: '热点转内容失败，请稍后重试' }, { status: 500 });
  }
}
