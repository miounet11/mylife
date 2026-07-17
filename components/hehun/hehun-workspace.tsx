'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { analyzeHehun, type HehunPersonInput, type HehunResult } from '@/lib/hehun-engine';
import {
  buildHehunHref,
  hehunBirthPairFromQuery,
  hehunFromBirthPair,
  hehunPersonFromQuery,
  personFromPillarSummary,
} from '@/lib/hehun-prefill';
import {
  loadRememberedHehunBirthPair,
  saveRememberedHehunBirthPair,
} from '@/lib/birth-form-storage';
import {
  birthDateInputMax,
  birthDateInputMin,
  validateBirthDateString,
} from '@/lib/birth-date-validate';
import KnowledgeBaseStamp from '@/components/knowledge-base-stamp';
import type { ProfileFortuneView, ProfileSettingsResponse } from '@/lib/profile-settings-types';
import { trackProductEvent } from '@/lib/product-analytics';

const GAN = '甲乙丙丁戊己庚辛壬癸'.split('');
const ZHI = '子丑寅卯辰巳午未申酉戌亥'.split('');

const EMPTY_A: HehunPersonInput = {
  name: '本人',
  dayMaster: '甲',
  dayBranch: '子',
  yongShen: ['木'],
  jiShen: ['金'],
};
const EMPTY_B: HehunPersonInput = {
  name: '对方',
  dayMaster: '庚',
  dayBranch: '午',
  yongShen: ['金'],
  jiShen: ['木'],
};

export default function HehunWorkspace() {
  const search = useSearchParams();
  const [a, setA] = useState<HehunPersonInput>(EMPTY_A);
  const [b, setB] = useState<HehunPersonInput>(EMPTY_B);
  const [fortunes, setFortunes] = useState<ProfileFortuneView[]>([]);
  const [loadNote, setLoadNote] = useState('');
  const [result, setResult] = useState<HehunResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [booted, setBooted] = useState(false);
  const [birthA, setBirthA] = useState({ date: '', time: '12:00', gender: 'male' as 'male' | 'female', name: '本人' });
  const [birthB, setBirthB] = useState({ date: '', time: '12:00', gender: 'female' as 'male' | 'female', name: '对方' });
  const [birthBusy, setBirthBusy] = useState(false);
  const [birthNote, setBirthNote] = useState('');
  const [shareNote, setShareNote] = useState('');

  useEffect(() => {
    trackProductEvent('hehun_page_viewed', {
      hasPrefill: Boolean(search.get('aDm') || search.get('reportId') || search.get('aBirth')),
      reportId: search.get('reportId') || '',
    });
  }, [search]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const fromQueryA = hehunPersonFromQuery('a', search);
      const fromQueryB = hehunPersonFromQuery('b', search);
      const birthPair = hehunBirthPairFromQuery(search);
      let usedBirthShare = false;

      if (birthPair.a) {
        setBirthA({
          date: birthPair.a.birthDate,
          time: birthPair.a.birthTime,
          gender: birthPair.a.gender,
          name: birthPair.a.name,
        });
      }
      if (birthPair.b) {
        setBirthB({
          date: birthPair.b.birthDate,
          time: birthPair.b.birthTime,
          gender: birthPair.b.gender,
          name: birthPair.b.name,
        });
      }

      // Share link with birth pair → recompute engine persons
      if (birthPair.a && birthPair.b && !fromQueryA) {
        try {
          const { personA, personB } = hehunFromBirthPair(
            {
              birthDate: birthPair.a.birthDate,
              birthTime: birthPair.a.birthTime,
              gender: birthPair.a.gender,
              name: birthPair.a.name,
            },
            {
              birthDate: birthPair.b.birthDate,
              birthTime: birthPair.b.birthTime,
              gender: birthPair.b.gender,
              name: birthPair.b.name,
            },
          );
          if (!cancelled) {
            setA(personA);
            setB(personB);
            const r = analyzeHehun(personA, personB);
            setResult(r);
            usedBirthShare = true;
            setLoadNote('已从分享链接用双方生日重算合婚结果。');
            setBirthNote(
              `${personA.name} ${personA.dayMaster}${personA.dayBranch} × ${personB.name} ${personB.dayMaster}${personB.dayBranch}`,
            );
          }
        } catch {
          // fall through
        }
      } else if (!birthPair.a && !birthPair.b) {
        const remembered = loadRememberedHehunBirthPair();
        if (remembered && !cancelled) {
          setBirthA({
            date: remembered.a.birthDate,
            time: remembered.a.birthTime,
            gender: remembered.a.gender,
            name: remembered.a.name,
          });
          setBirthB({
            date: remembered.b.birthDate,
            time: remembered.b.birthTime,
            gender: remembered.b.gender,
            name: remembered.b.name,
          });
          setBirthNote('已填入本机记住的双方生日，可直接对盘。');
        }
      }

      if (fromQueryA) {
        setA(fromQueryA);
        if (fromQueryA.currentDayunGanZhi || fromQueryA.dayMaster) {
          trackProductEvent('hehun_prefill_used', {
            reportId: search.get('reportId') || '',
            hasDayun: Boolean(fromQueryA.currentDayunGanZhi),
          });
        }
      }
      if (fromQueryB) setB(fromQueryB);

      try {
        const res = await fetch('/api/profile/settings', { cache: 'no-store' });
        const data = (await res.json()) as ProfileSettingsResponse & { success?: boolean };
        if (!cancelled && res.ok && data.success && Array.isArray(data.fortunes)) {
          setFortunes(data.fortunes);
          if (!fromQueryA && !usedBirthShare) {
            const primary = data.fortunes.find((f) => f.isPrimary) || data.fortunes[0];
            if (primary) {
              const person = personFromPillarSummary(primary.pillarSummary, {
                name: primary.name || primary.relationLabel || '本人',
              });
              if (person) {
                setA(person);
                setLoadNote(`已从档案载入：${person.name}（${person.dayMaster}${person.dayBranch}）`);
              } else {
                setLoadNote('档案有命盘但缺四柱摘要，请手动选日柱；完整报告页可一键带入。');
              }
            }
          } else if (fromQueryA) {
            setLoadNote('已从报告/链接预填甲方，可再从档案选乙方伴侣。');
          }
        } else if (!fromQueryA && !usedBirthShare && !cancelled) {
          setLoadNote('未登录或无档案时，可填双方生日对盘，或手动填写日柱。');
        }
      } catch {
        if (!cancelled && !usedBirthShare) setLoadNote('档案读取失败，可填双方生日或手动日柱。');
      } finally {
        if (!cancelled) setBooted(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [search]);

  const canRun = useMemo(() => a.dayMaster && a.dayBranch && b.dayMaster && b.dayBranch, [a, b]);

  function applyFortune(side: 'a' | 'b', fortuneId: string) {
    const f = fortunes.find((x) => x.id === fortuneId);
    if (!f) return;
    const person = personFromPillarSummary(f.pillarSummary, {
      name: f.name || f.relationLabel || (side === 'a' ? '本人' : '对方'),
    });
    if (!person) {
      setLoadNote(`「${f.name || f.relation}」暂无四柱摘要，请打开其报告后从报告入口进入合婚。`);
      return;
    }
    if (side === 'a') setA(person);
    else setB(person);
    setLoadNote(`已载入${side === 'a' ? '甲方' : '乙方'}：${person.name} ${person.dayMaster}${person.dayBranch}`);
  }

  function run() {
    const r = analyzeHehun(a, b);
    setResult(r);
    trackProductEvent('hehun_run', {
      score: r.score,
      layers: r.layers.length,
      hasDayun: Boolean(a.currentDayunGanZhi || b.currentDayunGanZhi),
      source: 'manual_or_profile',
    });
  }

  function runFromBirth() {
    const checkA = validateBirthDateString(birthA.date);
    const checkB = validateBirthDateString(birthB.date);
    if (!checkA.ok) {
      setBirthNote(`甲方：${checkA.message || '请填写有效出生日期'}`);
      return;
    }
    if (!checkB.ok) {
      setBirthNote(`乙方：${checkB.message || '请填写有效出生日期'}`);
      return;
    }
    setBirthBusy(true);
    setBirthNote('');
    try {
      const { personA, personB } = hehunFromBirthPair(
        {
          birthDate: checkA.dateKey || birthA.date,
          birthTime: birthA.time || '12:00',
          gender: birthA.gender,
          name: birthA.name || '甲方',
        },
        {
          birthDate: checkB.dateKey || birthB.date,
          birthTime: birthB.time || '12:00',
          gender: birthB.gender,
          name: birthB.name || '乙方',
        },
      );
      setA(personA);
      setB(personB);
      const r = analyzeHehun(personA, personB);
      setResult(r);
      saveRememberedHehunBirthPair({
        a: {
          birthDate: birthA.date,
          birthTime: birthA.time || '12:00',
          gender: birthA.gender,
          name: birthA.name || '本人',
        },
        b: {
          birthDate: birthB.date,
          birthTime: birthB.time || '12:00',
          gender: birthB.gender,
          name: birthB.name || '对方',
        },
      });
      setBirthNote(
        `已用双方出生信息重算引擎：${personA.name} ${personA.dayMaster}${personA.dayBranch}` +
          (personA.currentDayunGanZhi ? ` · 运${personA.currentDayunGanZhi}` : '') +
          ` × ${personB.name} ${personB.dayMaster}${personB.dayBranch}` +
          (personB.currentDayunGanZhi ? ` · 运${personB.currentDayunGanZhi}` : ''),
      );
      trackProductEvent('hehun_run', {
        score: r.score,
        layers: r.layers.length,
        hasDayun: Boolean(personA.currentDayunGanZhi || personB.currentDayunGanZhi),
        source: 'birth_pair',
      });
    } catch (error) {
      setBirthNote(error instanceof Error ? error.message : '出生信息无法排盘，请检查日期时辰');
    } finally {
      setBirthBusy(false);
    }
  }

  async function copyPlain() {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.plainForCouple);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  }

  async function copyShareLink() {
    // 隐私默认：不附带真实姓名，仅结构 + 生日参数
    const href = buildHehunHref({
      personA: a,
      personB: b,
      birthA: birthA.date
        ? {
            birthDate: birthA.date,
            birthTime: birthA.time,
            gender: birthA.gender,
          }
        : null,
      birthB: birthB.date
        ? {
            birthDate: birthB.date,
            birthTime: birthB.time,
            gender: birthB.gender,
          }
        : null,
      privacy: true,
    });
    const url =
      typeof window !== 'undefined' ? `${window.location.origin}${href}` : href;
    try {
      await navigator.clipboard.writeText(url);
      setShareNote('分享链接已复制（不含姓名；仅日柱/生日参数，对方打开可重算）');
      setTimeout(() => setShareNote(''), 2800);
      trackProductEvent('hehun_run', {
        score: result?.score || 0,
        layers: result?.layers.length || 0,
        source: 'share_link_privacy',
      });
    } catch {
      setShareNote('复制失败，请手动复制地址栏参数');
    }
  }

  if (!booted) {
    return <div className="rounded-[12px] border border-[#e2e8f0] bg-white p-6 text-[13px] text-[#64748b]">载入合婚工具…</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <KnowledgeBaseStamp />
        <p className="text-[11px] text-[#64748b]">
          {a.currentDayunGanZhi || b.currentDayunGanZhi
            ? '四层：日主 · 夫妻宫 · 用忌 · 大运同步'
            : '三层：日主互动 · 夫妻宫 · 用忌互补（补大运后可开同步层）'}
        </p>
      </div>

      {loadNote ? (
        <p className="rounded-[8px] border border-[#e9e5ff] bg-[#f5f3ff] px-3 py-2 text-[12px] text-[#5b21b6]">
          {loadNote}
        </p>
      ) : null}

      <div className="rounded-[12px] border border-[#e2e8f0] bg-white p-4">
        <div className="text-[13px] font-semibold text-[#0f172a]">双方生日对盘（无需完整报告）</div>
        <p className="mt-1 text-[11px] text-[#64748b]">
          填双方出生信息，引擎即时排出日主、用忌与现行大运后再合婚对照。
        </p>
        <div className="mt-3 grid gap-3 lg:grid-cols-2">
          <BirthSideForm title="甲方出生" value={birthA} onChange={setBirthA} />
          <BirthSideForm title="乙方出生" value={birthB} onChange={setBirthB} />
        </div>
        {birthNote ? (
          <p className="mt-2 rounded-[8px] border border-[#e9e5ff] bg-[#f5f3ff] px-3 py-2 text-[12px] text-[#5b21b6]">
            {birthNote}
          </p>
        ) : null}
        <button
          type="button"
          disabled={birthBusy || !birthA.date || !birthB.date}
          onClick={runFromBirth}
          className="mt-3 inline-flex h-10 items-center justify-center rounded-[var(--radius-sm)] border border-[color:var(--ink-1)] bg-white px-5 text-[14px] font-medium text-[color:var(--ink-1)] disabled:opacity-50"
        >
          {birthBusy ? '排盘中…' : '用双方生日开始合婚'}
        </button>
      </div>

      {fortunes.length > 0 ? (
        <div className="grid gap-3 rounded-[12px] border border-[#e2e8f0] bg-white p-4 sm:grid-cols-2">
          <label className="block text-[11px] font-semibold text-[#64748b]">
            从档案选甲方
            <select
              className="mt-1 w-full rounded-[8px] border border-[#e2e8f0] px-2 py-2 text-[13px]"
              defaultValue=""
              onChange={(e) => e.target.value && applyFortune('a', e.target.value)}
            >
              <option value="">选择档案…</option>
              {fortunes.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name || f.relationLabel || f.relation}
                  {f.pillarSummary ? ` · ${f.pillarSummary.slice(0, 12)}` : ''}
                  {f.isPrimary ? '（主）' : ''}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-[11px] font-semibold text-[#64748b]">
            从档案选乙方（伴侣）
            <select
              className="mt-1 w-full rounded-[8px] border border-[#e2e8f0] px-2 py-2 text-[13px]"
              defaultValue=""
              onChange={(e) => e.target.value && applyFortune('b', e.target.value)}
            >
              <option value="">选择伴侣/对方档案…</option>
              {fortunes.map((f) => (
                <option key={`b-${f.id}`} value={f.id}>
                  {f.name || f.relationLabel || f.relation}
                  {f.relation && f.relation !== 'self' ? ` · ${f.relationLabel || f.relation}` : ''}
                </option>
              ))}
            </select>
          </label>
          <p className="sm:col-span-2 text-[11px] text-[#94a3b8]">
            提示：在
            <Link href="/profile" className="mx-1 text-[color:var(--ink-1)] underline-offset-2 hover:underline">
              我的档案
            </Link>
            添加「配偶」关系命盘后，可在此一键对照。
          </p>
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <PersonForm title="甲方" value={a} onChange={setA} />
        <PersonForm title="乙方" value={b} onChange={setB} />
      </div>

      <button
        type="button"
        disabled={!canRun}
        onClick={run}
        className="inline-flex h-10 items-center justify-center rounded-[var(--radius-sm)] bg-[color:var(--ink-1)] px-5 text-[14px] font-medium text-white disabled:opacity-50"
      >
        开始合婚对照
      </button>

      {result ? (
        <div className="space-y-4 border-y border-[color:var(--hairline)] py-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <div className="text-[11px] font-medium text-[color:var(--ink-5)]">{result.knowledgeStamp}</div>
              <h2 className="mt-1 text-[16px] font-semibold text-[color:var(--ink-1)]">{result.headline}</h2>
              <p className="mt-1 text-[12px] text-[color:var(--ink-5)]">
                {result.personA.name} {result.personA.dayPillar}
                {result.personA.dayun ? ` · 运${result.personA.dayun}` : ''} × {result.personB.name}{' '}
                {result.personB.dayPillar}
                {result.personB.dayun ? ` · 运${result.personB.dayun}` : ''}
              </p>
            </div>
            <div className="text-right">
              <div className="font-mono text-[24px] tabular-nums text-[color:var(--ink-1)]">{result.score}</div>
              <div className="text-[11px] text-[color:var(--ink-5)]">{result.band}</div>
            </div>
          </div>

          <div
            className={`grid gap-0 border-t border-[color:var(--hairline)] ${
              result.layers.length >= 4 ? 'md:grid-cols-2 xl:grid-cols-4' : 'md:grid-cols-3'
            }`}
          >
            {result.layers.map((layer) => (
              <div
                key={layer.key}
                className="border-b border-[color:var(--hairline)] py-3 md:border-r md:px-3 md:first:pl-0 md:last:border-r-0"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <div className="text-[12px] font-medium text-[color:var(--ink-1)]">{layer.title}</div>
                  <span className="font-mono text-[12px] tabular-nums text-[color:var(--ink-5)]">
                    {layer.score}
                  </span>
                </div>
                <p className="mt-1.5 text-[12px] leading-[1.55] text-[color:var(--ink-3)]">{layer.summary}</p>
                <ul className="mt-2 space-y-0.5">
                  {layer.details.map((d) => (
                    <li key={d} className="text-[11px] text-[color:var(--ink-5)]">
                      · {d}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="grid gap-0 border-t border-[color:var(--hairline)] md:grid-cols-2">
            <div className="border-b border-[color:var(--hairline)] py-3 md:border-b-0 md:border-r md:pr-4">
              <div className="text-[11px] font-medium text-[color:var(--ink-5)]">宜做</div>
              <ul className="mt-1.5 space-y-1">
                {result.doList.map((x) => (
                  <li key={x} className="text-[12px] text-[color:var(--ink-2)]">
                    · {x}
                  </li>
                ))}
              </ul>
            </div>
            <div className="py-3 md:pl-4">
              <div className="text-[11px] font-medium text-[color:var(--ink-5)]">慎做</div>
              <ul className="mt-1.5 space-y-1">
                {result.avoidList.map((x) => (
                  <li key={x} className="text-[12px] text-[color:var(--ink-2)]">
                    · {x}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="border-t border-[color:var(--hairline)] pt-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div className="text-[12px] font-medium text-[color:var(--ink-1)]">白话交付</div>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={copyPlain}
                  className="text-[12px] text-[color:var(--ink-2)] underline-offset-2 hover:underline"
                >
                  {copied ? '已复制白话' : '复制白话'}
                </button>
                <button
                  type="button"
                  onClick={copyShareLink}
                  className="text-[12px] text-[color:var(--ink-2)] underline-offset-2 hover:underline"
                >
                  复制分享链接
                </button>
              </div>
            </div>
            {shareNote ? (
              <p className="mt-1 text-[11px] text-[color:var(--brand-strong)]">{shareNote}</p>
            ) : null}
            <pre className="mt-2 whitespace-pre-wrap font-sans text-[12px] leading-[1.65] text-[color:var(--ink-3)]">
              {result.plainForCouple}
            </pre>
          </div>

          <div className="border-t border-[color:var(--hairline)] pt-3">
            <div className="text-[12px] font-medium text-[color:var(--ink-1)]">专业底稿</div>
            <ul className="mt-1.5 space-y-1">
              {result.proNotes.map((n) => (
                <li key={n} className="text-[12px] text-[color:var(--ink-5)]">
                  · {n}
                </li>
              ))}
            </ul>
          </div>

          <p className="text-[11px] text-[color:var(--ink-5)]">
            合婚用于相处与节奏参考，不替代双方现实选择与法律咨询。
          </p>
        </div>
      ) : null}
    </div>
  );
}

function BirthSideForm({
  title,
  value,
  onChange,
}: {
  title: string;
  value: { date: string; time: string; gender: 'male' | 'female'; name: string };
  onChange: (v: { date: string; time: string; gender: 'male' | 'female'; name: string }) => void;
}) {
  return (
    <div className="rounded-[var(--radius)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] p-3">
      <div className="birth-form-title">{title}</div>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <label className="birth-form-label">
          日期
          <input
            type="date"
            className="birth-form-control"
            min={birthDateInputMin()}
            max={birthDateInputMax()}
            value={value.date}
            onChange={(e) => onChange({ ...value, date: e.target.value })}
          />
        </label>
        <label className="birth-form-label">
          时辰
          <input
            type="time"
            className="birth-form-control"
            value={value.time}
            onChange={(e) => onChange({ ...value, time: e.target.value })}
          />
        </label>
        <label className="birth-form-label">
          性别
          <select
            className="birth-form-control"
            value={value.gender}
            onChange={(e) =>
              onChange({ ...value, gender: e.target.value === 'female' ? 'female' : 'male' })
            }
          >
            <option value="male">男</option>
            <option value="female">女</option>
          </select>
        </label>
        <label className="birth-form-label">
          称呼
          <input
            className="birth-form-control"
            value={value.name}
            onChange={(e) => onChange({ ...value, name: e.target.value })}
          />
        </label>
      </div>
    </div>
  );
}

function PersonForm({
  title,
  value,
  onChange,
}: {
  title: string;
  value: HehunPersonInput;
  onChange: (v: HehunPersonInput) => void;
}) {
  return (
    <div className="rounded-[12px] border border-[#e2e8f0] bg-white p-4">
      <div className="text-[13px] font-bold text-[#0f172a]">{title}</div>
      <label className="mt-3 block text-[11px] font-semibold text-[#64748b]">
        称呼
        <input
          className="mt-1 w-full rounded-[8px] border border-[#e2e8f0] px-3 py-2 text-[13px]"
          value={value.name || ''}
          onChange={(e) => onChange({ ...value, name: e.target.value })}
        />
      </label>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <label className="block text-[11px] font-semibold text-[#64748b]">
          日主
          <select
            className="mt-1 w-full rounded-[8px] border border-[#e2e8f0] px-2 py-2 text-[13px]"
            value={value.dayMaster}
            onChange={(e) => onChange({ ...value, dayMaster: e.target.value })}
          >
            {GAN.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-[11px] font-semibold text-[#64748b]">
          日支（夫妻宫）
          <select
            className="mt-1 w-full rounded-[8px] border border-[#e2e8f0] px-2 py-2 text-[13px]"
            value={value.dayBranch}
            onChange={(e) => onChange({ ...value, dayBranch: e.target.value })}
          >
            {ZHI.map((z) => (
              <option key={z} value={z}>
                {z}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="mt-3 block text-[11px] font-semibold text-[#64748b]">
        用神（逗号分隔）
        <input
          className="mt-1 w-full rounded-[8px] border border-[#e2e8f0] px-3 py-2 text-[13px]"
          value={(value.yongShen || []).join(',')}
          onChange={(e) =>
            onChange({
              ...value,
              yongShen: e.target.value
                .split(/[,，\s]+/)
                .map((s) => s.trim())
                .filter(Boolean),
            })
          }
        />
      </label>
      <label className="mt-3 block text-[11px] font-semibold text-[#64748b]">
        忌神（逗号分隔）
        <input
          className="mt-1 w-full rounded-[8px] border border-[#e2e8f0] px-3 py-2 text-[13px]"
          value={(value.jiShen || []).join(',')}
          onChange={(e) =>
            onChange({
              ...value,
              jiShen: e.target.value
                .split(/[,，\s]+/)
                .map((s) => s.trim())
                .filter(Boolean),
            })
          }
        />
      </label>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <label className="block text-[11px] font-semibold text-[#64748b]">
          现行大运
          <input
            className="mt-1 w-full rounded-[8px] border border-[#e2e8f0] px-3 py-2 text-[13px]"
            placeholder="如：壬寅"
            value={value.currentDayunGanZhi || ''}
            onChange={(e) =>
              onChange({
                ...value,
                currentDayunGanZhi: e.target.value.trim().slice(0, 2) || undefined,
              })
            }
          />
        </label>
        <label className="block text-[11px] font-semibold text-[#64748b]">
          大运品质
          <select
            className="mt-1 w-full rounded-[8px] border border-[#e2e8f0] px-2 py-2 text-[13px]"
            value={value.currentDayunQuality || ''}
            onChange={(e) =>
              onChange({
                ...value,
                currentDayunQuality: e.target.value || undefined,
              })
            }
          >
            <option value="">未填</option>
            <option value="excellent">极顺</option>
            <option value="good">偏顺</option>
            <option value="neutral">中平</option>
            <option value="bad">偏紧</option>
            <option value="poor">承压</option>
          </select>
        </label>
      </div>
      <label className="mt-2 block text-[11px] font-semibold text-[#64748b]">
        大运起止年（可选）
        <input
          className="mt-1 w-full rounded-[8px] border border-[#e2e8f0] px-3 py-2 text-[13px]"
          placeholder="如：2024-2033"
          value={value.currentDayunYears || ''}
          onChange={(e) =>
            onChange({
              ...value,
              currentDayunYears: e.target.value.trim() || undefined,
            })
          }
        />
      </label>
      {value.currentDayunGanZhi ? (
        <p className="mt-2 text-[11px] text-[color:var(--ink-5)]">
          已填大运 {value.currentDayunGanZhi}
          {value.currentDayunQuality ? ` · ${value.currentDayunQuality}` : ''}
          {value.currentDayunYears ? ` · ${value.currentDayunYears}` : ''}
          ，对照时将启用「大运同步」层
        </p>
      ) : (
        <p className="mt-2 text-[10px] text-[#94a3b8]">
          从报告「合婚双盘（带入本盘）」进入可自动带入现行大运
        </p>
      )}
    </div>
  );
}
