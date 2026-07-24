import { NextRequest, NextResponse } from 'next/server';
import { scoreName, type NamingMode } from '@/lib/naming';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const name = String(body?.name || '').trim();
    if (!name) {
      return NextResponse.json({ success: false, error: '请输入名字' }, { status: 400 });
    }
    const mode: NamingMode =
      body?.mode === 'company' || body?.mode === 'product' ? body.mode : 'person';

    const candidate = scoreName({
      mode,
      name,
      surname: body?.surname ? String(body.surname) : undefined,
      yongShen: Array.isArray(body?.yongShen) ? body.yongShen.map(String) : undefined,
      jiShen: Array.isArray(body?.jiShen) ? body.jiShen.map(String) : undefined,
      industry: body?.industry ? String(body.industry) : undefined,
      enableWuge: body?.enableWuge === true,
    });

    return NextResponse.json({ success: true, candidate });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '评分失败' },
      { status: 500 },
    );
  }
}
