/**
 * Traditional tear-off 万年历 / 通书 sheet.
 * Visual language: cream paper, vermillion stamps, dense classic fields.
 */
import type { ReactNode } from 'react';
import type { AlmanacDayPack, PersonalDayOverlay } from '@/lib/almanac/types';

const HOUR_BRANCH = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

const paper = {
  bg: 'bg-[#faf6eb]',
  ink: 'text-[#1c1410]',
  muted: 'text-[#5c4a3a]',
  red: 'text-[#9b1b1b]',
  redBg: 'bg-[#9b1b1b]',
  redSoft: 'bg-[#f3e2d8]',
  border: 'border-[#8b4513]/45',
  line: 'border-[#c4a574]/55',
  frame: 'border-[#7a1f1f]',
  sealGood: 'bg-[#9b1b1b] text-[#faf6eb]',
  sealBad: 'bg-[#3d2914] text-[#faf6eb]',
  jiCell: 'bg-[#f3e2d8] text-[#9b1b1b]',
  xiongCell: 'bg-[#ebe4d4] text-[#5c4a3a]',
  midCell: 'bg-[#f5f0e4] text-[#6b5a48]',
};

function luckCell(luck: string) {
  if (luck === 'auspicious') return { t: '吉', cls: paper.jiCell };
  if (luck === 'inauspicious') return { t: '凶', cls: paper.xiongCell };
  return { t: '中', cls: paper.midCell };
}

function Field({
  label,
  children,
  className = '',
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`min-w-0 ${className}`}>
      <div
        className={`mb-0.5 text-[11px] font-bold tracking-[0.12em] ${paper.red}`}
        style={{ fontFamily: '"Songti SC","Noto Serif SC","Source Han Serif SC",serif' }}
      >
        {label}
      </div>
      <div className={`text-[12px] leading-relaxed ${paper.ink}`}>{children}</div>
    </div>
  );
}

export default function AlmanacTearSheet({
  pack,
  personal,
}: {
  pack: AlmanacDayPack;
  personal?: PersonalDayOverlay | null;
}) {
  const serif = { fontFamily: '"Songti SC","Noto Serif SC","Source Han Serif SC","STSong",serif' };

  return (
    <article
      className={`relative overflow-hidden rounded-sm border-2 ${paper.frame} ${paper.bg} shadow-[0_8px_28px_rgba(80,40,20,0.12)]`}
      data-almanac-skin="tear"
      style={serif}
    >
      {/* Outer double-line frame feel */}
      <div className={`pointer-events-none absolute inset-1 border border-[#c4a574]/50`} aria-hidden />

      {/* ── 顶栏：年号 · 农历月 · 公历 ── */}
      <header
        className={`relative flex flex-wrap items-center justify-between gap-2 border-b-2 ${paper.frame} ${paper.redBg} px-3 py-2 text-[11px] font-semibold tracking-wide text-[#faf6eb] sm:px-4`}
      >
        <span className="tracking-[0.08em]">
          {pack.lunar.yearGanZhi || ''}
          {pack.lunar.yearShengXiao ? `（${pack.lunar.yearShengXiao}）` : ''}年
        </span>
        <span className="text-[13px] font-bold tracking-[0.2em]">
          农历{pack.lunar.monthChinese}
          {pack.lunar.monthSizeLabel ? `·${pack.lunar.monthSizeLabel}` : ''}
        </span>
        <span>
          公元{pack.year}年{pack.month}月
        </span>
      </header>

      {/* ── 主区：大日 + 宜忌 ── */}
      <div className="relative grid md:grid-cols-[minmax(0,0.95fr)_minmax(0,1.15fr)]">
        {/* 左侧：撕页大日 */}
        <div
          className={`relative flex flex-col items-center justify-center border-b-2 md:border-b-0 md:border-r-2 ${paper.frame} px-3 py-5 sm:py-6`}
        >
          {/* 天神角标 */}
          <div
            className={`absolute left-3 top-3 rounded-sm border ${paper.border} ${paper.redSoft} px-1.5 py-0.5 text-[10px] font-bold ${paper.red}`}
          >
            {pack.tianShenType || '通书'}
            {pack.tianShen ? ` · ${pack.tianShen}` : ''}
          </div>
          {pack.jieQi ? (
            <div
              className={`absolute right-3 top-3 rounded-sm ${paper.redBg} px-2 py-0.5 text-[11px] font-bold text-[#faf6eb]`}
            >
              {pack.jieQi}
            </div>
          ) : null}

          <div className={`mt-4 text-[12px] font-semibold tracking-[0.35em] ${paper.muted}`}>
            {pack.weekdayLabel}
          </div>

          {/* 朱红大日 — 撕页核心 */}
          <div
            className={`mt-1 font-black leading-none ${paper.red}`}
            style={{ fontSize: 'clamp(5.5rem, 22vw, 8.5rem)', letterSpacing: '-0.04em' }}
          >
            {String(pack.day).padStart(2, '0')}
          </div>

          <div className={`mt-2 text-[18px] font-bold tracking-wide ${paper.ink}`}>
            {pack.lunar.dayChinese || pack.lunar.lunarText}
          </div>
          <div className={`mt-1 text-[13px] ${paper.muted}`}>
            日柱 <span className={`font-bold ${paper.red}`}>{pack.lunar.dayGanZhi}</span>
            {pack.nayin ? ` · ${pack.nayin}` : ''}
          </div>
          {pack.lunar.dayShengXiao ? (
            <div className={`mt-0.5 text-[12px] ${paper.muted}`}>
              日肖 · {pack.lunar.dayShengXiao}
              {pack.chongShengXiao ? ` · 冲${pack.chongShengXiao}` : ''}
            </div>
          ) : null}

          {(pack.festivals || []).length > 0 ? (
            <div className={`mt-3 max-w-[90%] text-center text-[11px] leading-snug ${paper.red}`}>
              {pack.festivals.slice(0, 3).join(' · ')}
            </div>
          ) : null}

          {/* 竖排点缀 */}
          <div
            className={`pointer-events-none absolute bottom-6 left-2 hidden text-[10px] tracking-[0.45em] opacity-30 md:block ${paper.red}`}
            style={{ writingMode: 'vertical-rl' }}
            aria-hidden
          >
            人生K线
          </div>
        </div>

        {/* 右侧：宜忌 + 冲煞方位 */}
        <div className="flex flex-col">
          <div className={`grid flex-1 grid-cols-2 divide-x-2 ${paper.frame}`}>
            <div className="p-3 sm:p-4">
              <div
                className={`inline-flex h-8 min-w-[2rem] items-center justify-center rounded-sm px-2 text-[16px] font-black tracking-widest ${paper.sealGood}`}
              >
                宜
              </div>
              <ul className={`mt-2 space-y-1 text-[13px] leading-relaxed ${paper.ink}`}>
                {(pack.yi.length ? pack.yi : ['从简行事']).map((item) => (
                  <li key={item} className="flex gap-1.5">
                    <span className={`${paper.red} shrink-0`}>·</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="p-3 sm:p-4">
              <div
                className={`inline-flex h-8 min-w-[2rem] items-center justify-center rounded-sm px-2 text-[16px] font-black tracking-widest ${paper.sealBad}`}
              >
                忌
              </div>
              <ul className={`mt-2 space-y-1 text-[13px] leading-relaxed ${paper.ink}`}>
                {(pack.ji.length ? pack.ji : ['—']).map((item) => (
                  <li key={item} className="flex gap-1.5">
                    <span className={`${paper.muted} shrink-0`}>·</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* 冲煞 · 方位 · 胎神 */}
          <div
            className={`grid grid-cols-2 gap-x-3 gap-y-2 border-t-2 ${paper.frame} px-3 py-2.5 text-[11px] sm:grid-cols-3 sm:px-4`}
          >
            <Field label="冲煞">
              冲{pack.chongShengXiao || pack.chong || '—'} · 煞{pack.sha || '—'}
            </Field>
            <Field label="胎神">{pack.positions.tai || '—'}</Field>
            <Field label="吉神方位" className="col-span-2 sm:col-span-1">
              喜{pack.positions.xi || '—'} · 福{pack.positions.fu || '—'} · 财
              {pack.positions.cai || '—'}
            </Field>
          </div>
        </div>
      </div>

      {/* ── 十二时辰 ── */}
      <section className={`border-t-2 ${paper.frame} px-2 py-3 sm:px-4`}>
        <div className="mb-2 flex items-baseline justify-between gap-2">
          <h3 className={`text-[13px] font-bold tracking-[0.2em] ${paper.red}`}>十二时辰</h3>
          <span className={`text-[10px] ${paper.muted}`}>黄道为吉 · 黑道宜慎</span>
        </div>
        <div className="grid grid-cols-6 gap-1 sm:grid-cols-12 sm:gap-1.5">
          {pack.hours.map((h, i) => {
            const cell = luckCell(h.luck);
            const branch = HOUR_BRANCH[i] || h.ganZhi.slice(-1);
            return (
              <div
                key={h.ganZhi + i}
                className={`rounded-sm border ${paper.line} bg-[#fffdf7]/80 px-0.5 py-1.5 text-center`}
              >
                <div className={`text-[12px] font-bold ${paper.ink}`}>{branch}</div>
                <div
                  className={`mx-auto mt-1 flex h-6 w-6 items-center justify-center rounded-sm text-[12px] font-black ${cell.cls}`}
                >
                  {cell.t}
                </div>
                <div className={`mt-1 truncate text-[9px] ${paper.muted}`}>{h.ganZhi}</div>
                <div className={`truncate text-[8px] leading-tight ${paper.muted}`}>
                  {h.minHm?.slice(0, 5) || ''}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── 通书细目 ── */}
      <section
        className={`grid grid-cols-2 gap-3 border-t ${paper.line} px-3 py-3 text-[11px] sm:grid-cols-4 sm:px-4`}
      >
        <Field label="建除">
          {pack.zhiXing || '—'}
          {pack.dayLu ? ` · 禄${pack.dayLu}` : ''}
        </Field>
        <Field label="二十八宿">
          {pack.xiu || '—'}
          {pack.xiuLuck ? `（${pack.xiuLuck}）` : ''}
        </Field>
        <Field label="六曜 · 九星">
          {pack.liuYao || '—'} · {pack.nineStar || '—'}
        </Field>
        <Field label="物候">
          {[pack.season, pack.hou, pack.wuHou].filter(Boolean).join(' · ') || '—'}
        </Field>
        <Field label="吉神" className="col-span-2">
          {pack.jiShen.join('、') || '—'}
        </Field>
        <Field label="凶煞" className="col-span-2">
          {pack.xiongSha.join('、') || '—'}
        </Field>
      </section>

      {pack.pengZu.length ? (
        <div
          className={`border-t ${paper.line} px-3 py-2.5 text-[11px] leading-relaxed sm:px-4 ${paper.muted}`}
        >
          <span className={`mr-2 font-bold ${paper.red}`}>彭祖百忌</span>
          {pack.pengZu.join('；')}
        </div>
      ) : null}

      {pack.xiuSong ? (
        <div
          className={`border-t ${paper.line} px-3 py-2 text-[11px] italic leading-relaxed sm:px-4 ${paper.muted}`}
        >
          {pack.xiuSong}
        </div>
      ) : null}

      {/* ── 个人结构层（非恐吓） ── */}
      {personal ? (
        <div
          className={`border-t-2 ${paper.frame} ${paper.redSoft} px-3 py-3 sm:px-4`}
        >
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center rounded-sm ${paper.redBg} px-2 py-0.5 text-[11px] font-bold text-[#faf6eb]`}
            >
              我的结构日运
            </span>
            <span className={`text-[18px] font-black ${paper.red}`}>{personal.score}</span>
            <span className={`text-[12px] tracking-widest ${paper.red}`}>
              {'★'.repeat(personal.stars)}
              <span className="opacity-30">{'★'.repeat(5 - personal.stars)}</span>
            </span>
            <span className={`text-[11px] ${paper.muted}`}>
              日主{personal.dayMaster}
              {personal.yongShen?.length ? ` · 用神${personal.yongShen.join('')}` : ''}
            </span>
          </div>
          <p className={`mt-1.5 text-[13px] leading-relaxed ${paper.ink}`}>{personal.moodLine}</p>
          {personal.topHours[0] ? (
            <p className={`mt-1 text-[11px] ${paper.muted}`}>
              较顺时辰：
              {personal.topHours.map((h) => h.timeLabel || h.ganZhi).join('、')}
            </p>
          ) : null}
        </div>
      ) : null}

      <footer
        className={`border-t ${paper.line} bg-[#f3efe3] px-3 py-2 text-[10px] leading-relaxed sm:px-4 ${paper.muted}`}
      >
        通书宜忌与十二时辰为公共层；个人日运来自日主用神结构匹配，作节奏参考，非医疗投资建议。潮汐、地方彩票等未收录。
        {' · '}
        <a href={`/astro/day/${pack.date}`} className={`font-semibold underline-offset-2 hover:underline ${paper.red}`}>
          星座日入口
        </a>
        {' · '}
        <a href={`/astro/day/${pack.date}/compare`} className={`font-semibold underline-offset-2 hover:underline ${paper.red}`}>
          十二座对比
        </a>
        {' · '}
        <a href="/astro" className={`font-semibold underline-offset-2 hover:underline ${paper.red}`}>
          生日查日运
        </a>
      </footer>
    </article>
  );
}
