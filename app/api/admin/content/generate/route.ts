import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { generateManagedContentDrafts, type GeneratedManagedContentDraft } from '@/lib/content-generation';
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
    if (!`${body.topic || ''}`.trim()) {
      return NextResponse.json({ success: false, error: '请输入主题' }, { status: 400 });
    }

    const generated = await generateManagedContentDrafts({
      mode: body.mode === 'cluster' ? 'cluster' : 'single',
      contentType: body.contentType,
      subtype: body.subtype,
      topic: `${body.topic || ''}`.trim(),
      angle: `${body.angle || ''}`.trim(),
      platform: `${body.platform || ''}`.trim(),
      keywords: Array.isArray(body.keywords) ? body.keywords.map((item: unknown) => `${item || ''}`.trim()).filter(Boolean) : [],
      audience: `${body.audience || ''}`.trim(),
      entityName: `${body.entityName || ''}`.trim(),
      sourceSignals: `${body.sourceSignals || ''}`.trim(),
      status: body.status === 'published' ? 'published' : 'draft',
      featured: body.featured === true,
    });

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
        source: entry.source,
      }, user.id)
    );

    return NextResponse.json({
      success: true,
      entries: savedEntries,
      meta: {
        generatedCount: savedEntries.length,
        llmSucceededCount: generated.llmSucceededCount,
        fallbackCount: generated.fallbackCount,
      },
    });
  } catch (error) {
    console.error('[API] AI 生成内容失败:', error);
    return NextResponse.json({ success: false, error: 'AI 生成失败，请稍后重试' }, { status: 500 });
  }
}
