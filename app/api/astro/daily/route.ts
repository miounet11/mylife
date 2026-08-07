import { NextRequest, NextResponse } from 'next/server';
import { buildAstroDailyMatchPack } from '@/lib/astro/daily-match-engine';
import type { AstroDailyIdentity } from '@/lib/astro/daily-match-types';
import type { SignKey } from '@/lib/astro/types';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const date = `${sp.get('date') || ''}`.trim();
  const kind = `${sp.get('kind') || ''}`.trim();

  let identity: AstroDailyIdentity | null = null;
  if (kind === 'sign') {
    identity = { kind: 'sign', key: `${sp.get('key') || ''}` as SignKey };
  } else if (kind === 'zone') {
    identity = { kind: 'zone', id: `${sp.get('id') || ''}` };
  } else if (kind === 'rising') {
    identity = { kind: 'rising', key: `${sp.get('key') || ''}` as SignKey };
  } else if (kind === 'birth') {
    identity = {
      kind: 'birth',
      birthDate: `${sp.get('birth') || sp.get('birthDate') || ''}`,
      birthHour: sp.get('hour') != null ? Number(sp.get('hour')) : 12,
    };
  } else if (kind === 'element') {
    identity = { kind: 'element', slug: `${sp.get('slug') || sp.get('key') || ''}` };
  } else if (kind === 'modality') {
    identity = { kind: 'modality', slug: `${sp.get('slug') || sp.get('key') || ''}` };
  } else if (kind === 'shengxiao') {
    identity = { kind: 'shengxiao', slug: `${sp.get('slug') || sp.get('key') || ''}` };
  }

  if (!date || !identity) {
    return NextResponse.json(
      {
        success: false,
        error: 'Need date + kind=sign|zone|rising|birth|element|modality|shengxiao',
      },
      { status: 400 },
    );
  }

  const pack = buildAstroDailyMatchPack(date, identity);
  if (!pack) {
    return NextResponse.json({ success: false, error: 'Unable to build match pack' }, { status: 404 });
  }
  return NextResponse.json({ success: true, pack });
}
