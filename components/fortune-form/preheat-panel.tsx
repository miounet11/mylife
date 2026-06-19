'use client';

/**
 * 预热阅读卡 (v5-D3, 2026-05-16)
 *
 * 板块 3 升级：把"等待期"从空转转成"已经在看自己"。
 * 客户端用 lunar-javascript 在毫秒级算出四柱 + 日主 + 五行计数，
 * 在 FortuneProgress 右侧顶部直接展示给用户。
 *
 * 注意：这里是"展示用"快算结果，与服务端真太阳时校正后的最终四柱可能差 1 时辰；
 * 文末显式标注"以下为快算预览，最终结果以报告为准"，避免误导。
 */

import { useEffect, useMemo, useState } from 'react';
import { Solar } from 'lunar-javascript';
import { Sparkles } from 'lucide-react';

interface PreheatPanelProps {
  birthday?: string | null; // "YYYY-MM-DD HH:mm"
  unknownHour?: boolean;
  gender?: 0 | 1;
}

interface PreheatState {
  ready: boolean;
  bazi: { stem: string; branch: string; label: string }[];
  dayMaster: string;
  dayMasterElement: string;
  lunarText: string;
  fiveElements: { key: string; label: string; count: number; tone: string }[];
  zodiac: string;
}

const STEM_TO_ELEMENT: Record<string, { name: string; tone: string }> = {
  甲: { name: '木', tone: 'wood' },
  乙: { name: '木', tone: 'wood' },
  丙: { name: '火', tone: 'fire' },
  丁: { name: '火', tone: 'fire' },
  戊: { name: '土', tone: 'earth' },
  己: { name: '土', tone: 'earth' },
  庚: { name: '金', tone: 'metal' },
  辛: { name: '金', tone: 'metal' },
  壬: { name: '水', tone: 'water' },
  癸: { name: '水', tone: 'water' },
};

const BRANCH_TO_ELEMENT: Record<string, { name: string; tone: string }> = {
  子: { name: '水', tone: 'water' },
  丑: { name: '土', tone: 'earth' },
  寅: { name: '木', tone: 'wood' },
  卯: { name: '木', tone: 'wood' },
  辰: { name: '土', tone: 'earth' },
  巳: { name: '火', tone: 'fire' },
  午: { name: '火', tone: 'fire' },
  未: { name: '土', tone: 'earth' },
  申: { name: '金', tone: 'metal' },
  酉: { name: '金', tone: 'metal' },
  戌: { name: '土', tone: 'earth' },
  亥: { name: '水', tone: 'water' },
};

const ELEMENT_TONE_CLASS: Record<string, string> = {
  wood: 'bg-[rgba(34,139,34,0.10)] text-[#2f7d52] border-[rgba(34,139,34,0.20)]',
  fire: 'bg-[rgba(220,80,40,0.10)] text-[#c14a28] border-[rgba(220,80,40,0.22)]',
  earth: 'bg-[rgba(178,140,60,0.12)] text-[#8a6a2c] border-[rgba(178,140,60,0.24)]',
  metal: 'bg-[rgba(190,180,160,0.18)] text-[#6c5e44] border-[rgba(190,180,160,0.30)]',
  water: 'bg-[rgba(50,90,160,0.10)] text-[#3a5a9c] border-[rgba(50,90,160,0.22)]',
  unknown: 'bg-[color:var(--bg-elevated)] text-[color:var(--ink-3)] border-[color:var(--hairline)]',
};

const PILLAR_LABELS = ['年柱', '月柱', '日柱', '时柱'];

function buildPreheat(birthday: string | null | undefined, unknownHour: boolean): PreheatState {
  if (!birthday) {
    return {
      ready: false,
      bazi: [],
      dayMaster: '—',
      dayMasterElement: '—',
      lunarText: '—',
      fiveElements: [],
      zodiac: '—',
    };
  }

  try {
    const [datePart, timePart] = birthday.split(' ');
    const [y, m, d] = datePart.split('-').map(Number);
    const [hh, mm] = (timePart || '00:00').split(':').map(Number);

    const solar = Solar.fromYmdHms(y, m, d, unknownHour ? 0 : hh, mm || 0, 0);
    const lunar = solar.getLunar();
    const eightChar = lunar.getEightChar();

    const pillars = [
      { stem: eightChar.getYear()[0], branch: eightChar.getYear()[1], label: PILLAR_LABELS[0] },
      { stem: eightChar.getMonth()[0], branch: eightChar.getMonth()[1], label: PILLAR_LABELS[1] },
      { stem: eightChar.getDay()[0], branch: eightChar.getDay()[1], label: PILLAR_LABELS[2] },
      { stem: eightChar.getTime()[0], branch: eightChar.getTime()[1], label: PILLAR_LABELS[3] },
    ];

    // 时柱未知时不参与五行计数
    const validPillars = unknownHour ? pillars.slice(0, 3) : pillars;

    const counter: Record<string, number> = { wood: 0, fire: 0, earth: 0, metal: 0, water: 0 };
    validPillars.forEach((p) => {
      const stemEl = STEM_TO_ELEMENT[p.stem];
      const branchEl = BRANCH_TO_ELEMENT[p.branch];
      if (stemEl) counter[stemEl.tone] = (counter[stemEl.tone] || 0) + 1;
      if (branchEl) counter[branchEl.tone] = (counter[branchEl.tone] || 0) + 1;
    });

    const fiveElements = [
      { key: 'wood', label: '木', count: counter.wood, tone: 'wood' },
      { key: 'fire', label: '火', count: counter.fire, tone: 'fire' },
      { key: 'earth', label: '土', count: counter.earth, tone: 'earth' },
      { key: 'metal', label: '金', count: counter.metal, tone: 'metal' },
      { key: 'water', label: '水', count: counter.water, tone: 'water' },
    ].sort((a, b) => b.count - a.count);

    const dayMaster = pillars[2].stem || '—';
    const dayMasterElement = STEM_TO_ELEMENT[dayMaster]?.name || '—';

    return {
      ready: true,
      bazi: pillars,
      dayMaster,
      dayMasterElement,
      lunarText: `${lunar.getYearInChinese()}年${lunar.getMonthInChinese()}月${lunar.getDayInChinese()}`,
      fiveElements,
      zodiac: lunar.getYearShengXiao() || '',
    };
  } catch {
    return {
      ready: false,
      bazi: [],
      dayMaster: '—',
      dayMasterElement: '—',
      lunarText: '—',
      fiveElements: [],
      zodiac: '—',
    };
  }
}

export default function PreheatPanel({ birthday, unknownHour = false, gender }: PreheatPanelProps) {
  const [animateInIdx, setAnimateInIdx] = useState(0);
  const state = useMemo(() => buildPreheat(birthday, unknownHour), [birthday, unknownHour]);
  const maxCount = useMemo(
    () => state.fiveElements.reduce((m, f) => Math.max(m, f.count), 0) || 1,
    [state.fiveElements]
  );

  useEffect(() => {
    if (!state.ready) return;
    setAnimateInIdx(0);
    const id = window.setInterval(() => {
      setAnimateInIdx((idx) => (idx >= 4 ? idx : idx + 1));
    }, 120);
    return () => window.clearInterval(id);
  }, [state.ready]);

  if (!state.ready) {
    return null;
  }

  const dayMasterTone = STEM_TO_ELEMENT[state.dayMaster]?.tone || 'unknown';
  const dayMasterClass = ELEMENT_TONE_CLASS[dayMasterTone] || ELEMENT_TONE_CLASS.unknown;

  return (
    <div className="rounded-[var(--radius-md)] border border-[color:var(--brand-soft-2)] bg-[linear-gradient(180deg,var(--brand-tint)_0%,var(--paper)_60%)] p-4 md:p-5">
      <div className="flex items-center justify-between gap-2">
        <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.16em] text-[color:var(--brand-strong)]">
          <Sparkles className="h-3 w-3" />
          快算预览 · 报告生成中
        </div>
        <div className="rounded-full bg-[color:var(--paper)] px-2 py-0.5 text-xs font-semibold text-[color:var(--ink-4)]">
          {state.zodiac ? `${state.zodiac}年` : ''}
        </div>
      </div>

      {/* 四柱 */}
      <div className="mt-3 grid grid-cols-4 gap-1.5">
        {state.bazi.map((p, i) => {
          const stemEl = STEM_TO_ELEMENT[p.stem]?.tone || 'unknown';
          const branchEl = BRANCH_TO_ELEMENT[p.branch]?.tone || 'unknown';
          const isUnknown = unknownHour && i === 3;
          const visible = i <= animateInIdx;
          return (
            <div
              key={i}
              className={`rounded-[var(--radius)] border bg-[color:var(--paper)] px-1 py-2 text-center transition-all duration-300 ${
                visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1'
              } ${
                i === 2
                  ? 'border-[color:var(--brand-strong)] shadow-[0_0_0_1px_var(--brand-strong)]'
                  : 'border-[color:var(--hairline)]'
              }`}
            >
              <div className="text-xs font-semibold uppercase tracking-wider text-[color:var(--ink-5)]">
                {p.label}
              </div>
              {isUnknown ? (
                <div className="mt-1 font-mono text-2xl font-black text-[color:var(--ink-5)]">—</div>
              ) : (
                <div className="mt-0.5 leading-none">
                  <div
                    className={`mx-auto inline-flex h-7 w-7 items-center justify-center rounded font-black ${
                      ELEMENT_TONE_CLASS[stemEl] || ELEMENT_TONE_CLASS.unknown
                    }`}
                  >
                    {p.stem}
                  </div>
                  <div
                    className={`mx-auto mt-1 inline-flex h-7 w-7 items-center justify-center rounded font-black ${
                      ELEMENT_TONE_CLASS[branchEl] || ELEMENT_TONE_CLASS.unknown
                    }`}
                  >
                    {p.branch}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 日主 + 农历 */}
      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
        <span
          className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 font-bold ${dayMasterClass}`}
        >
          <span className="opacity-60">日主</span>
          <span>{state.dayMaster}</span>
          <span className="opacity-60">{state.dayMasterElement}</span>
        </span>
        <span className="text-[color:var(--ink-4)]">{state.lunarText}</span>
        {gender !== undefined ? (
          <span className="text-[color:var(--ink-5)]">· {gender === 1 ? '乾造' : '坤造'}</span>
        ) : null}
      </div>

      {/* 五行分布 */}
      <div className="mt-4 space-y-1.5">
        <div className="text-xs font-bold uppercase tracking-wider text-[color:var(--ink-5)]">
          五行分布（快算）
        </div>
        {state.fiveElements.map((f, idx) => {
          const widthPct = (f.count / maxCount) * 100;
          const visible = idx <= animateInIdx;
          return (
            <div key={f.key} className="flex items-center gap-2">
              <span className={`w-6 shrink-0 text-center text-xs font-black ${
                ELEMENT_TONE_CLASS[f.tone].split(' ').filter((s) => s.startsWith('text-'))[0] || ''
              }`}>
                {f.label}
              </span>
              <div className="relative h-2.5 flex-1 overflow-hidden rounded-full bg-[color:var(--bg-sunken)]">
                <div
                  className={`h-full rounded-full transition-all duration-500 ease-out ${
                    f.tone === 'wood' ? 'bg-[#2f7d52]' :
                    f.tone === 'fire' ? 'bg-[#c14a28]' :
                    f.tone === 'earth' ? 'bg-[#8a6a2c]' :
                    f.tone === 'metal' ? 'bg-[#6c5e44]' :
                    'bg-[#3a5a9c]'
                  }`}
                  style={{ width: visible ? `${widthPct}%` : '0%' }}
                />
              </div>
              <span className="w-5 shrink-0 text-right font-mono text-xs font-bold tabular-nums text-[color:var(--ink-2)]">
                {f.count}
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-3 text-xs leading-5 text-[color:var(--ink-5)]">
        以上为客户端快算预览。完整报告会基于真太阳时与节气分钟级修正后的结构生成，最终以报告为准。
      </div>
    </div>
  );
}
