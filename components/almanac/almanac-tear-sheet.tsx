/**
 * Traditional tear-off 黄历 style — denser layout inspired by paper calendars.
 */
import type { AlmanacDayPack, PersonalDayOverlay } from '@/lib/almanac/types';

const HOUR_BRANCH = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

function luckCell(luck: string) {
  if (luck === 'auspicious') return { t: '吉', cls: 'bg-emerald-100 text-emerald-900' };
  if (luck === 'inauspicious') return { t: '凶', cls: 'bg-amber-100 text-amber-950' };
  return { t: '中', cls: 'bg-stone-100 text-stone-700' };
}

export default function AlmanacTearSheet({
  pack,
  personal,
}: {
  pack: AlmanacDayPack;
  personal?: PersonalDayOverlay | null;
}) {
  return (
    <article
      className="overflow-hidden rounded-sm border-2 border-emerald-800/80 bg-[#f7faf4] text-emerald-950 shadow-md"
      data-almanac-skin="tear"
    >
      {/* Top bar like paper calendar header */}
      <div className="flex items-center justify-between border-b border-emerald-800/30 bg-emerald-900 px-3 py-1.5 text-[11px] font-semibold tracking-wide text-emerald-50">
        <span>
          {pack.year} · {pack.month}月
        </span>
        <span className="uppercase tracking-[0.2em]">{pack.weekdayEn.slice(0, 3)}</span>
        <span>
          {pack.lunar.yearGanZhi}年 · 农历{pack.lunar.monthSizeLabel || ''}
        </span>
      </div>

      <div className="grid gap-0 md:grid-cols-[1fr_1.1fr]">
        {/* Left: giant date */}
        <div className="relative border-b border-emerald-800/20 p-4 md:border-b-0 md:border-r">
          <div className="text-center">
            <div className="text-[11px] font-bold tracking-[0.2em] text-emerald-800/70">
              {pack.tianShenType || '通书'} · {pack.tianShen || '—'}
            </div>
            <div className="mt-1 font-black leading-none text-emerald-800" style={{ fontSize: 'clamp(4.5rem, 18vw, 7.5rem)' }}>
              {pack.day}
            </div>
            <div className="mt-2 text-[15px] font-bold">
              {pack.lunar.dayChinese}
              {pack.jieQi ? (
                <span className="ml-2 rounded border border-emerald-700 px-1.5 py-0.5 text-[12px]">
                  {pack.jieQi}
                </span>
              ) : null}
            </div>
            <div className="mt-1 text-[13px] text-emerald-900/80">
              {pack.weekdayLabel} · 日柱 {pack.lunar.dayGanZhi}
              {pack.nayin ? ` · ${pack.nayin}` : ''}
            </div>
            {pack.lunar.dayShengXiao ? (
              <div className="mt-1 text-[12px] text-emerald-800/70">日肖 · {pack.lunar.dayShengXiao}</div>
            ) : null}
          </div>

          {/* Side vertical slogans (decorative, like paper) */}
          <div
            className="pointer-events-none absolute bottom-4 left-2 hidden text-[10px] tracking-[0.35em] text-emerald-800/35 md:block"
            style={{ writingMode: 'vertical-rl' }}
          >
            结构为舟
          </div>
          <div
            className="pointer-events-none absolute bottom-4 right-2 hidden text-[10px] tracking-[0.35em] text-emerald-800/35 md:block"
            style={{ writingMode: 'vertical-rl' }}
          >
            通书为天
          </div>
        </div>

        {/* Right: dense tong-shu */}
        <div className="space-y-3 p-3 text-[12px] md:p-4">
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded border border-emerald-800/25 bg-white/70 p-2">
              <div className="text-[11px] font-black text-emerald-900">宜</div>
              <div className="mt-1 leading-relaxed text-emerald-950/90">
                {pack.yi.join(' ') || '—'}
              </div>
            </div>
            <div className="rounded border border-emerald-800/25 bg-white/70 p-2">
              <div className="text-[11px] font-black text-emerald-900">忌</div>
              <div className="mt-1 leading-relaxed text-emerald-950/90">
                {pack.ji.join(' ') || '—'}
              </div>
            </div>
          </div>

          {/* 12 hour strip like paper */}
          <div className="rounded border border-emerald-800/25 bg-white/80 p-2">
            <div className="mb-1 text-[11px] font-black">十二时辰</div>
            <div className="grid grid-cols-6 gap-1 sm:grid-cols-12">
              {pack.hours.map((h, i) => {
                const cell = luckCell(h.luck);
                const branch = HOUR_BRANCH[i] || h.ganZhi.slice(-1);
                return (
                  <div key={h.ganZhi + i} className="text-center">
                    <div className="text-[10px] font-bold text-emerald-900">{branch}</div>
                    <div className={`mt-0.5 rounded px-0.5 py-1 text-[11px] font-black ${cell.cls}`}>
                      {cell.t}
                    </div>
                    <div className="mt-0.5 text-[8px] leading-tight text-emerald-900/60">
                      {h.minHm?.slice(0, 5) || ''}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="rounded border border-emerald-800/20 bg-white/60 p-2">
              <div className="font-black">冲煞 · 胎神</div>
              <div className="mt-1">
                冲 {pack.chongShengXiao || pack.chong || '—'} · 煞{pack.sha || '—'}
              </div>
              <div className="mt-0.5">胎神 {pack.positions.tai || '—'}</div>
            </div>
            <div className="rounded border border-emerald-800/20 bg-white/60 p-2">
              <div className="font-black">吉神方位</div>
              <div className="mt-1">喜 {pack.positions.xi || '—'}</div>
              <div>福 {pack.positions.fu || '—'} · 财 {pack.positions.cai || '—'}</div>
            </div>
            <div className="rounded border border-emerald-800/20 bg-white/60 p-2">
              <div className="font-black">吉神 · 凶煞</div>
              <div className="mt-1 line-clamp-3">{pack.jiShen.join(' ') || '—'}</div>
              <div className="mt-0.5 line-clamp-2 text-emerald-900/70">{pack.xiongSha.join(' ') || '—'}</div>
            </div>
            <div className="rounded border border-emerald-800/20 bg-white/60 p-2">
              <div className="font-black">建除 · 宿 · 六曜</div>
              <div className="mt-1">
                {pack.zhiXing || '—'} · {pack.xiu || '—'}
                {pack.xiuLuck ? `（${pack.xiuLuck}）` : ''}
              </div>
              <div className="mt-0.5">
                六曜 {pack.liuYao || '—'} · 九星 {pack.nineStar || '—'}
              </div>
            </div>
          </div>

          {pack.pengZu.length ? (
            <div className="rounded border border-dashed border-emerald-800/30 p-2 text-[11px] leading-relaxed">
              <span className="font-black">彭祖百忌</span> {pack.pengZu.join('；')}
            </div>
          ) : null}

          {personal ? (
            <div className="rounded border-2 border-emerald-700 bg-emerald-50 p-2 text-[12px]">
              <div className="font-black">
                我的结构日运 · {personal.score}分 · {personal.stars}星
              </div>
              <div className="mt-1">{personal.moodLine}</div>
              {personal.topHours[0] ? (
                <div className="mt-1 text-[11px]">
                  较顺时：{personal.topHours.map((h) => h.timeLabel || h.ganZhi).join('、')}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      <div className="border-t border-emerald-800/25 bg-emerald-900/5 px-3 py-2 text-[10px] leading-relaxed text-emerald-900/70">
        撕页样式致敬传统挂历信息密度；潮汐/彩票等地方字段未收录。个人层来自日主用神引擎，非恐吓断语。
        {pack.xiuSong ? ` · ${pack.xiuSong.slice(0, 40)}…` : ''}
      </div>
    </article>
  );
}
