import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { buildAstroFromBirth, WESTERN_SIGN_OPTIONS } from '@/lib/life-foundation';
import {
  ensureProfileSettingsSchema,
  profileChangeLogOperations,
  profileSupplementOperations,
} from '@/lib/profile-settings-store';
import { getOrCreateGuestUserId } from '@/lib/user-utils';
import { trackServerEvent } from '@/lib/analytics';

export const runtime = 'nodejs';

const ALLOWED_SIGNS = new Set(WESTERN_SIGN_OPTIONS.map((s) => s.label));

function normalizeSign(raw: unknown): string {
  const s = `${raw || ''}`.trim();
  if (!s) return '';
  if (ALLOWED_SIGNS.has(s)) return s;
  // allow "天秤" without 座
  const withZuo = s.endsWith('座') ? s : `${s}座`;
  if (ALLOWED_SIGNS.has(withZuo)) return withZuo;
  return s.slice(0, 12);
}

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession();
    const userId = session.user?.id || (await getOrCreateGuestUserId());
    if (!userId) {
      return NextResponse.json({ success: false, error: '无法建立会话' }, { status: 401 });
    }

    const body = await request.json();
    const fortuneId = body?.fortuneId ? String(body.fortuneId) : null;
    const birthDate = body?.birthDate ? String(body.birthDate) : '';

    ensureProfileSettingsSchema();
    const computed = birthDate ? buildAstroFromBirth(birthDate) : null;

    const fields: Record<string, string> = {};
    const sun = normalizeSign(body?.sunSign) || computed?.sunSign || '';
    const moon = normalizeSign(body?.moonSign);
    const rising = normalizeSign(body?.risingSign);
    const cz = `${body?.chineseZodiac || computed?.chineseZodiac || ''}`.trim().slice(0, 8);
    const note = `${body?.astroNote || ''}`.trim().slice(0, 200);

    if (sun) fields.sunSign = sun;
    if (cz) fields.chineseZodiac = cz;
    if (moon) fields.moonSign = moon;
    if (rising) fields.risingSign = rising;
    if (note) fields.astroNote = note;

    if (Object.keys(fields).length === 0) {
      return NextResponse.json({ success: false, error: '没有可保存的星盘字段' }, { status: 400 });
    }

    profileSupplementOperations.upsert({
      userId,
      fortuneId,
      domain: 'astro',
      fields,
    });

    profileChangeLogOperations.create({
      userId,
      fortuneId,
      changeType: 'astro_update',
      fieldPath: 'astro',
      newValue: [fields.sunSign, fields.chineseZodiac, fields.moonSign, fields.risingSign]
        .filter(Boolean)
        .join(' · '),
      triggeredRecalc: false,
      meta: { summary: '更新星盘' },
    });

    trackServerEvent({
      userId,
      eventName: 'foundation_astro_saved',
      page: '/profile/foundation',
      meta: { hasMoon: Boolean(moon), hasRising: Boolean(rising) },
    });

    return NextResponse.json({
      success: true,
      fields,
      computed,
    });
  } catch (error) {
    console.error('[API] foundation astro POST failed:', error);
    return NextResponse.json({ success: false, error: '保存失败' }, { status: 500 });
  }
}
