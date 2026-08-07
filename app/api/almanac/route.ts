// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { buildAlmanacDayPack, buildAlmanacMonthGrid, todayDateString } from '@/lib/almanac/day-pack';
import {
  buildPersonalDayOverlay,
  resolveDayMasterFromBirth,
  type PersonalDayInput,
} from '@/lib/almanac/personal-day';
import { getAuthSession } from '@/lib/auth';
import { getOrCreateGuestUserId } from '@/lib/user-utils';

function parseMonth(year: number, month: number) {
  const y = Number.isFinite(year) ? year : new Date().getFullYear();
  const m = Number.isFinite(month) && month >= 1 && month <= 12 ? month : new Date().getMonth() + 1;
  return { year: y, month: m };
}

async function resolvePersonalInput(userId: string | null): Promise<PersonalDayInput | null> {
  if (!userId) return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { fortuneOperations } = require('@/lib/database') as {
      fortuneOperations?: {
        listByUser?: (uid: string) => Array<{
          isPrimary?: boolean;
          birthDate?: string;
          birthTime?: string;
          result?: { pillars?: Array<{ celestialStem?: string; earthlyBranch?: string }>; yongShen?: string[] };
        }>;
      };
    };
    const list = fortuneOperations?.listByUser?.(userId) || [];
    const primary = list.find((f) => f.isPrimary) || list[0];
    if (!primary) return null;

    const pillars = primary.result?.pillars;
    if (Array.isArray(pillars) && pillars[2]?.celestialStem) {
      return {
        dayMaster: pillars[2].celestialStem,
        dayBranch: pillars[2].earthlyBranch || '',
        yongShen: Array.isArray(primary.result?.yongShen) ? primary.result.yongShen : [],
      };
    }

    if (primary.birthDate) {
      let hour = 12;
      const tm = `${primary.birthTime || ''}`.match(/(\d{1,2})/);
      if (tm) hour = Math.min(23, Math.max(0, Number(tm[1])));
      const resolved = resolveDayMasterFromBirth(primary.birthDate, hour);
      if (resolved) {
        return {
          dayMaster: resolved.dayMaster,
          dayBranch: resolved.dayBranch,
          dayPillar: resolved.dayPillar,
          yongShen: Array.isArray(primary.result?.yongShen) ? primary.result.yongShen : [],
        };
      }
    }
  } catch {
    // local stub / missing ops
  }
  return null;
}

export async function GET(request: NextRequest) {
  try {
    const sp = request.nextUrl.searchParams;
    const today = todayDateString();
    const dateParam = `${sp.get('date') || today}`.trim();
    const yearParam = Number(sp.get('year'));
    const monthParam = Number(sp.get('month'));

    const fromDate = dateParam.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    const { year, month } = parseMonth(
      Number.isFinite(yearParam) ? yearParam : fromDate ? Number(fromDate[1]) : new Date().getFullYear(),
      Number.isFinite(monthParam)
        ? monthParam
        : fromDate
          ? Number(fromDate[2])
          : new Date().getMonth() + 1,
    );

    const selectedDate = fromDate ? dateParam : today;
    const cells = buildAlmanacMonthGrid(year, month);
    const selected = buildAlmanacDayPack(selectedDate);

    const session = await getAuthSession();
    const userId = session.user?.id || (await getOrCreateGuestUserId().catch(() => null));
    let personal = null;
    if (selected) {
      // Query overrides for light birth bridge
      const dm = `${sp.get('dayMaster') || ''}`.trim();
      const birthDate = `${sp.get('birthDate') || ''}`.trim();
      let input: PersonalDayInput | null = null;
      if (dm) {
        input = {
          dayMaster: dm,
          dayBranch: `${sp.get('dayBranch') || ''}`.trim(),
          yongShen: `${sp.get('yongShen') || ''}`
            .split(/[,，\s]+/)
            .map((x) => x.trim())
            .filter(Boolean),
        };
      } else if (birthDate) {
        const resolved = resolveDayMasterFromBirth(birthDate);
        if (resolved) {
          input = {
            dayMaster: resolved.dayMaster,
            dayBranch: resolved.dayBranch,
            dayPillar: resolved.dayPillar,
          };
        }
      } else {
        input = await resolvePersonalInput(userId);
      }
      if (input) personal = buildPersonalDayOverlay(selected, input);
    }

    return NextResponse.json({
      success: true,
      year,
      month,
      today,
      cells,
      selected,
      personal,
      authenticated: Boolean(session.authenticated),
    });
  } catch (error) {
    console.error('[API] almanac GET failed', error);
    return NextResponse.json({ success: false, error: '万年历加载失败' }, { status: 500 });
  }
}
