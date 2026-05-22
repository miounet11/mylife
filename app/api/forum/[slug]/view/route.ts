// v5-D69 forum bumpView 客户端 API
// 把详情页 SSR 时的同步写抽离出来，让 page 走 ISR（revalidate=300）。

import { NextResponse } from 'next/server';
import { forumQuestionOperations } from '@/lib/database';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug: rawSlug } = await params;
    const slug = decodeURIComponent(rawSlug);
    if (!slug || slug.length > 200) {
      return NextResponse.json({ ok: false, reason: 'bad_slug' }, { status: 400 });
    }
    forumQuestionOperations.bumpView(slug);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[forum/view] error:', err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
