// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { buildAlmanacDayPack, buildAlmanacMonthGrid, todayDateString } from '@/lib/almanac/day-pack';
import { buildPersonalDayOverlay } from '@/lib/almanac/personal-day';
import {
  buildChartFromBirth,
  resolveUserChartForAlmanac,
  type UserChartSnapshot,
} from '@/lib/almanac/resolve-user-chart';
import { getAuthSession } from '@/lib/auth';
import { getOrCreateGuestUserId } from '@/lib/user-utils';

function parseMonth(year: number, month: number) {
  const y = Number.isFinite(year) ? year : new Date().getFullYear();
  const m = Number.isFinite(month) && month >= 1 && month <= 12 ? month : new Date().getMonth() + 1;
  return { year: y, month: m };
}

async function resolveChart(request: NextRequest, userId: string | null): Promise<UserChartSnapshot | null> {
  const sp = request.nextUrl.searchParams;
  const dm = `${sp.get('dayMaster') || ''}`.trim();
  const birthDate = `${sp.get('birthDate') || ''}`.trim();

  if (dm) {
    return {
      source: 'query',
      dayMaster: dm,
      dayBranch: `${sp.get('dayBranch') || ''}`.trim(),
      yongShen: `${sp.get('yongShen') || ''}`
        .split(/[,，\s]+/)
        .map((x) => x.trim())
        .filter(Boolean),
    };
  }
  if (birthDate) {
    return (
      buildChartFromBirth({
        birthDate,
        birthTime: sp.get('birthTime'),
        birthPlace: sp.get('birthPlace'),
      }) || null
    );
  }
  return resolveUserChartForAlmanac(userId);
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
    const chart = await resolveChart(request, userId);
    let personal = null;
    if (selected && chart) {
      personal = buildPersonalDayOverlay(selected, chart);
    }

    return NextResponse.json({
      success: true,
      year,
      month,
      today,
      cells,
      selected,
      personal,
      chart: chart
        ? {
            dayMaster: chart.dayMaster,
            dayBranch: chart.dayBranch,
            dayPillar: chart.dayPillar,
            yongShen: chart.yongShen,
            dayMasterElement: chart.dayMasterElement,
            strengthDesc: chart.strengthDesc,
            source: chart.source,
            bazi: chart.bazi,
          }
        : null,
      canonicalPath: `/almanac/${selectedDate}`,
      authenticated: Boolean(session.authenticated),
    });
  } catch (error) {
    console.error('[API] almanac GET failed', error);
    return NextResponse.json({ success: false, error: '万年历加载失败' }, { status: 500 });
  }
}
