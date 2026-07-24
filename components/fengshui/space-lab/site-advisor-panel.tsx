'use client';

import { useMemo, useState } from 'react';
import type { SpaceGeoPlace } from '@/lib/fengshui/space/types';
import {
  SITE_PURPOSE_LABELS,
  type SiteAdviseResult,
  type SiteCandidateInput,
  type SiteCandidateResult,
  type SitePurpose,
} from '@/lib/fengshui/space/site-advisor';

type Draft = {
  id: string;
  label: string;
  address: string;
  lat: number;
  lng: number;
  facing: string;
  areaSqm: string;
  floor: string;
  industry: string;
  corner: boolean;
  streetFront: boolean;
  hasBackMountain: boolean;
  openMingTang: boolean;
  notes: string;
};

const FACINGS = ['', '东', '东南', '南', '西南', '西', '西北', '北', '东北'];

function newId() {
  return `c-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

function fromGeo(geo: SpaceGeoPlace | null, purpose: SitePurpose): Draft | null {
  if (!geo) return null;
  return {
    id: newId(),
    label: geo.name || geo.address.split(/[,，]/)[0] || '当前区位',
    address: geo.address,
    lat: geo.lat,
    lng: geo.lng,
    facing: '',
    areaSqm: purpose === 'yinzhai' ? '3' : purpose === 'shop' ? '60' : '90',
    floor: purpose === 'shop' ? '1' : '',
    industry: purpose === 'shop' ? '餐饮' : '',
    corner: false,
    streetFront: true,
    hasBackMountain: purpose === 'yinzhai',
    openMingTang: purpose === 'yinzhai',
    notes: '',
  };
}

export function SiteAdvisorPanel({
  currentGeo,
  onInjectWinner,
  onApplyDomain,
}: {
  currentGeo: SpaceGeoPlace | null;
  onInjectWinner: (place: SpaceGeoPlace, meta: SiteCandidateResult) => void;
  onApplyDomain?: (domain: SiteCandidateResult['suggestedDomain']) => void;
}) {
  const [purpose, setPurpose] = useState<SitePurpose>('house');
  const [candidates, setCandidates] = useState<Draft[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SiteAdviseResult | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = useMemo(
    () => result?.candidates.find((c) => c.id === selectedId) || result?.candidates[0] || null,
    [result, selectedId],
  );

  const addCurrent = () => {
    const d = fromGeo(currentGeo, purpose);
    if (!d) {
      setError('请先在上方「地图选址」搜索并注入一个地址');
      return;
    }
    setError(null);
    setCandidates((list) => {
      if (list.some((x) => Math.abs(x.lat - d.lat) < 1e-5 && Math.abs(x.lng - d.lng) < 1e-5)) {
        return list;
      }
      return [...list, d].slice(0, 6);
    });
  };

  const addBlank = () => {
    setCandidates((list) =>
      [
        ...list,
        {
          id: newId(),
          label: `候选 ${list.length + 1}`,
          address: '',
          lat: 0,
          lng: 0,
          facing: '',
          areaSqm: purpose === 'yinzhai' ? '3' : purpose === 'shop' ? '60' : '90',
          floor: purpose === 'shop' ? '1' : '',
          industry: purpose === 'shop' ? '零售' : '',
          corner: false,
          streetFront: true,
          hasBackMountain: false,
          openMingTang: false,
          notes: '',
        },
      ].slice(0, 6),
    );
  };

  const update = (id: string, patch: Partial<Draft>) => {
    setCandidates((list) => list.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  };

  const remove = (id: string) => {
    setCandidates((list) => list.filter((c) => c.id !== id));
  };

  const runAdvise = async () => {
    setBusy(true);
    setError(null);
    try {
      const payload: SiteCandidateInput[] = candidates
        .filter((c) => c.address.trim() && Number.isFinite(c.lat) && Number.isFinite(c.lng))
        .map((c) => ({
          id: c.id,
          label: c.label,
          address: c.address.trim(),
          lat: c.lat,
          lng: c.lng,
          facing: c.facing || undefined,
          areaSqm: c.areaSqm ? Number(c.areaSqm) : undefined,
          floor: c.floor ? Number(c.floor) : undefined,
          industry: c.industry || undefined,
          corner: c.corner,
          streetFront: c.streetFront,
          hasBackMountain: c.hasBackMountain,
          openMingTang: c.openMingTang,
          notes: c.notes || undefined,
        }));

      if (payload.length === 0) {
        throw new Error('请至少加入 1 个有效候选（需有地址与坐标，建议用地图注入）');
      }

      const res = await fetch('/api/fengshui/space/site-advise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ purpose, candidates: payload, enrichPoi: true }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || '评估失败');
      setResult(data.result as SiteAdviseResult);
      setSelectedId(data.result?.winnerId || data.result?.candidates?.[0]?.id || null);
    } catch (e) {
      setError(e instanceof Error ? e.message : '评估失败');
      setResult(null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3 rounded-xl border border-[color:var(--hairline)] bg-[color:var(--paper)] p-3 md:p-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-[color:var(--brand-strong)]">
            选址顾问 · 人流估算
          </div>
          <p className="mt-0.5 text-[12px] text-[color:var(--ink-4)]">
            多案对比：选阳宅 / 选铺面（含人流） / 选阴宅。可叠加 OSM 周边设施密度，结果可一键注入空间场。
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {(['house', 'shop', 'yinzhai'] as SitePurpose[]).map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => {
              setPurpose(p);
              setResult(null);
            }}
            className={`rounded-full px-3 py-1 text-[12px] font-semibold ${
              purpose === p
                ? 'bg-[color:var(--ink-1)] text-white'
                : 'border border-[color:var(--hairline)] text-[color:var(--ink-3)]'
            }`}
          >
            {SITE_PURPOSE_LABELS[p]}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={addCurrent}
          className="rounded-lg bg-[color:var(--ink-1)] px-3 py-1.5 text-[12px] font-semibold text-white"
        >
          加入当前地图区位
        </button>
        <button
          type="button"
          onClick={addBlank}
          className="rounded-lg border border-[color:var(--hairline)] px-3 py-1.5 text-[12px] text-[color:var(--ink-2)]"
        >
          手动加候选
        </button>
        <button
          type="button"
          disabled={busy || candidates.length === 0}
          onClick={() => void runAdvise()}
          className="rounded-lg border border-[color:var(--brand)] bg-[color:var(--brand-soft)] px-3 py-1.5 text-[12px] font-semibold text-[color:var(--brand-strong)] disabled:opacity-40"
        >
          {busy ? '评估中（含周边设施）…' : `对比评估 ${candidates.length} 案`}
        </button>
      </div>

      {error ? <p className="text-[12px] text-red-600">{error}</p> : null}

      {candidates.length > 0 ? (
        <ul className="space-y-2">
          {candidates.map((c, idx) => (
            <li
              key={c.id}
              className="rounded-lg border border-[color:var(--hairline)] bg-[color:var(--bg-sunken)]/40 p-2.5"
            >
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <span className="text-[11px] font-semibold text-[color:var(--ink-3)]">
                  候选 {idx + 1}
                </span>
                <button
                  type="button"
                  onClick={() => remove(c.id)}
                  className="text-[11px] text-[color:var(--ink-5)] underline"
                >
                  移除
                </button>
              </div>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                <label className="block space-y-0.5 text-[11px] sm:col-span-2">
                  <span className="text-[color:var(--ink-5)]">地址 / 坐标</span>
                  <input
                    value={c.address}
                    onChange={(e) => update(c.id, { address: e.target.value })}
                    className="fb-input h-8 w-full px-2 text-[12px]"
                    placeholder="用地图注入最准"
                  />
                  <span className="text-[10px] text-[color:var(--ink-5)]">
                    {c.lat && c.lng ? `${c.lat.toFixed(5)}, ${c.lng.toFixed(5)}` : '缺坐标，请从地图加入'}
                  </span>
                </label>
                <label className="block space-y-0.5 text-[11px]">
                  <span className="text-[color:var(--ink-5)]">简称</span>
                  <input
                    value={c.label}
                    onChange={(e) => update(c.id, { label: e.target.value })}
                    className="fb-input h-8 w-full px-2 text-[12px]"
                  />
                </label>
                <label className="block space-y-0.5 text-[11px]">
                  <span className="text-[color:var(--ink-5)]">朝向</span>
                  <select
                    value={c.facing}
                    onChange={(e) => update(c.id, { facing: e.target.value })}
                    className="fb-input h-8 w-full px-2 text-[12px]"
                  >
                    {FACINGS.map((f) => (
                      <option key={f || 'none'} value={f}>
                        {f || '未填'}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block space-y-0.5 text-[11px]">
                  <span className="text-[color:var(--ink-5)]">面积 ㎡</span>
                  <input
                    value={c.areaSqm}
                    onChange={(e) => update(c.id, { areaSqm: e.target.value })}
                    className="fb-input h-8 w-full px-2 text-[12px]"
                  />
                </label>
                {purpose === 'shop' ? (
                  <>
                    <label className="block space-y-0.5 text-[11px]">
                      <span className="text-[color:var(--ink-5)]">楼层</span>
                      <input
                        value={c.floor}
                        onChange={(e) => update(c.id, { floor: e.target.value })}
                        className="fb-input h-8 w-full px-2 text-[12px]"
                      />
                    </label>
                    <label className="block space-y-0.5 text-[11px]">
                      <span className="text-[color:var(--ink-5)]">业态</span>
                      <input
                        value={c.industry}
                        onChange={(e) => update(c.id, { industry: e.target.value })}
                        className="fb-input h-8 w-full px-2 text-[12px]"
                        placeholder="餐饮/零售/美业…"
                      />
                    </label>
                    <label className="flex items-center gap-1.5 text-[11px] text-[color:var(--ink-3)]">
                      <input
                        type="checkbox"
                        checked={c.corner}
                        onChange={(e) => update(c.id, { corner: e.target.checked })}
                      />
                      转角铺
                    </label>
                    <label className="flex items-center gap-1.5 text-[11px] text-[color:var(--ink-3)]">
                      <input
                        type="checkbox"
                        checked={c.streetFront}
                        onChange={(e) => update(c.id, { streetFront: e.target.checked })}
                      />
                      临街
                    </label>
                  </>
                ) : null}
                {purpose === 'yinzhai' ? (
                  <>
                    <label className="flex items-center gap-1.5 text-[11px] text-[color:var(--ink-3)]">
                      <input
                        type="checkbox"
                        checked={c.hasBackMountain}
                        onChange={(e) => update(c.id, { hasBackMountain: e.target.checked })}
                      />
                      有靠山/后靠
                    </label>
                    <label className="flex items-center gap-1.5 text-[11px] text-[color:var(--ink-3)]">
                      <input
                        type="checkbox"
                        checked={c.openMingTang}
                        onChange={(e) => update(c.id, { openMingTang: e.target.checked })}
                      />
                      明堂开阔
                    </label>
                  </>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-lg border border-dashed border-[color:var(--hairline)] px-3 py-4 text-center text-[12px] text-[color:var(--ink-5)]">
          先用地图搜地址并注入，再点「加入当前地图区位」；可加多案做{SITE_PURPOSE_LABELS[purpose]}对比。
        </p>
      )}

      {result ? (
        <div className="space-y-3 border-t border-[color:var(--hairline)] pt-3">
          <p className="text-[13px] font-medium text-[color:var(--ink-1)]">{result.summary}</p>
          <p className="text-[10px] leading-relaxed text-[color:var(--ink-5)]">{result.disclaimer}</p>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-[12px]">
              <thead>
                <tr className="border-b border-[color:var(--hairline)] text-[color:var(--ink-5)]">
                  <th className="py-1.5 pr-2 font-medium">候选</th>
                  <th className="py-1.5 pr-2 font-medium">综合</th>
                  <th className="py-1.5 pr-2 font-medium">人流</th>
                  <th className="py-1.5 pr-2 font-medium">日均(估)</th>
                  <th className="py-1.5 font-medium">建议</th>
                </tr>
              </thead>
              <tbody>
                {result.candidates.map((c) => (
                  <tr
                    key={c.id}
                    className={`cursor-pointer border-b border-[color:var(--hairline)]/60 ${
                      selected?.id === c.id ? 'bg-[color:var(--brand-soft)]/40' : ''
                    }`}
                    onClick={() => setSelectedId(c.id)}
                  >
                    <td className="py-1.5 pr-2 font-semibold text-[color:var(--ink-1)]">
                      {c.label}
                      {result.winnerId === c.id ? (
                        <span className="ml-1 text-[10px] font-bold text-emerald-700">领先</span>
                      ) : null}
                    </td>
                    <td className="py-1.5 pr-2 tabular-nums">{c.totalScore}</td>
                    <td className="py-1.5 pr-2">
                      {c.footTraffic.index} · {c.footTraffic.band}
                    </td>
                    <td className="py-1.5 pr-2 tabular-nums">{c.footTraffic.weekdayDaily}</td>
                    <td className="py-1.5 text-[color:var(--ink-4)]">{c.rankHint}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {selected ? (
            <div className="grid gap-3 lg:grid-cols-2">
              <div className="space-y-2">
                <div className="text-[11px] font-bold text-[color:var(--ink-2)]">
                  {selected.label} · 维度分
                </div>
                <ul className="space-y-1">
                  {selected.dimensions.map((d) => (
                    <li key={d.key} className="flex items-center gap-2 text-[11px]">
                      <span className="w-20 shrink-0 text-[color:var(--ink-4)]">{d.label}</span>
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[color:var(--bg-sunken)]">
                        <div
                          className="h-full rounded-full bg-[color:var(--brand)]"
                          style={{ width: `${d.score}%` }}
                        />
                      </div>
                      <span className="w-8 tabular-nums text-[color:var(--ink-2)]">{d.score}</span>
                    </li>
                  ))}
                </ul>
                <div className="text-[11px] text-[color:var(--ink-4)]">
                  <span className="font-semibold text-emerald-700">优势 </span>
                  {selected.pros.join('；') || '—'}
                </div>
                <div className="text-[11px] text-[color:var(--ink-4)]">
                  <span className="font-semibold text-amber-700">注意 </span>
                  {selected.cons.join('；') || '—'}
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-[11px] font-bold text-[color:var(--ink-2)]">
                  人流分时（相对强度）· {selected.footTraffic.peakHourLabel} 高峰
                </div>
                <div className="flex h-16 items-end gap-px rounded-lg bg-[color:var(--bg-sunken)] px-1 py-1">
                  {selected.footTraffic.hourly.map((h) => (
                    <div
                      key={h.hour}
                      title={`${h.hour}:00 → ${h.level}`}
                      className="flex-1 rounded-sm bg-[color:var(--brand)]/80"
                      style={{ height: `${Math.max(4, h.level)}%` }}
                    />
                  ))}
                </div>
                <p className="text-[10px] text-[color:var(--ink-5)]">
                  工作日约 {selected.footTraffic.weekdayDaily} / 周末约 {selected.footTraffic.weekendDaily}{' '}
                  人次级 · {selected.footTraffic.method}
                </p>
                <ul className="list-inside list-disc text-[11px] text-[color:var(--ink-3)]">
                  {selected.actions.map((a) => (
                    <li key={a}>{a}</li>
                  ))}
                </ul>
                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() =>
                      onInjectWinner(
                        {
                          address: selected.address,
                          lat: selected.lat,
                          lng: selected.lng,
                          name: selected.label,
                          source: 'manual',
                        },
                        selected,
                      )
                    }
                    className="rounded-lg bg-[color:var(--ink-1)] px-3 py-1.5 text-[12px] font-semibold text-white"
                  >
                    注入空间场并采用此址
                  </button>
                  {onApplyDomain ? (
                    <button
                      type="button"
                      onClick={() => onApplyDomain(selected.suggestedDomain)}
                      className="rounded-lg border border-[color:var(--hairline)] px-3 py-1.5 text-[12px] text-[color:var(--ink-2)]"
                    >
                      切换到推荐领域预设
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
