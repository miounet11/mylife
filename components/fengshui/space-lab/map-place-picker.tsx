'use client';

import { useState } from 'react';
import type { SpaceGeoPlace } from '@/lib/fengshui/space/types';

type PlaceHit = SpaceGeoPlace & { mapsUrl?: string; embedUrl?: string };

export function MapPlacePicker({
  value,
  onSelect,
}: {
  value: SpaceGeoPlace | null;
  onSelect: (place: SpaceGeoPlace) => void;
}) {
  const [q, setQ] = useState(value?.address || '');
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<PlaceHit[]>([]);
  const [hint, setHint] = useState<string | null>(null);
  const [embed, setEmbed] = useState<string | null>(value ? mapsEmbed(value.lat, value.lng) : null);

  const search = async () => {
    if (!q.trim()) return;
    setLoading(true);
    setHint(null);
    try {
      const res = await fetch(`/api/geo/place-search?q=${encodeURIComponent(q.trim())}`);
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || '搜索失败');
      setItems(data.items || []);
      setHint(data.hint || null);
      if (data.items?.[0]?.embedUrl) setEmbed(data.items[0].embedUrl);
    } catch (e) {
      setHint(e instanceof Error ? e.message : '搜索失败');
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2 rounded-xl border border-[color:var(--hairline)] bg-[color:var(--paper)] p-3">
      <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-[color:var(--brand-strong)]">
        地图选址 · 一键注入
      </div>
      <p className="text-[11px] text-[color:var(--ink-4)]">
        搜索地址后点选结果，将坐标与地址注入空间场；公开笔记会自动脱敏门牌。
      </p>
      <div className="flex gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && void search()}
          placeholder="城市 + 小区/路名，如：上海 静安 南京西路"
          className="fb-input h-9 min-w-0 flex-1 px-2 text-[13px]"
        />
        <button
          type="button"
          disabled={loading}
          onClick={() => void search()}
          className="h-9 shrink-0 rounded-lg bg-[color:var(--ink-1)] px-3 text-[12px] font-semibold text-white disabled:opacity-40"
        >
          {loading ? '…' : '搜索'}
        </button>
      </div>
      {hint ? <p className="text-[11px] text-[color:var(--ink-5)]">{hint}</p> : null}

      {items.length > 0 ? (
        <ul className="max-h-36 space-y-1 overflow-y-auto text-[12px]">
          {items.map((it) => (
            <li key={`${it.lat}-${it.lng}-${it.address}`}>
              <button
                type="button"
                className="w-full rounded-lg border border-[color:var(--hairline)] px-2 py-1.5 text-left hover:bg-[color:var(--bg-sunken)]"
                onClick={() => {
                  onSelect({
                    address: it.address,
                    lat: it.lat,
                    lng: it.lng,
                    placeId: it.placeId,
                    name: it.name,
                    source: it.source,
                  });
                  setEmbed(it.embedUrl || mapsEmbed(it.lat, it.lng));
                  setQ(it.address);
                }}
              >
                <div className="font-medium text-[color:var(--ink-1)]">{it.name || it.address}</div>
                <div className="text-[10px] text-[color:var(--ink-5)]">
                  {it.lat.toFixed(5)}, {it.lng.toFixed(5)} · {it.source}
                </div>
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {embed ? (
        <div className="overflow-hidden rounded-lg border border-[color:var(--hairline)]">
          <iframe title="map" src={embed} className="h-44 w-full" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
        </div>
      ) : null}

      {value ? (
        <div className="flex flex-wrap items-center gap-2 text-[11px] text-[color:var(--ink-3)]">
          <span className="font-semibold text-emerald-700">已注入</span>
          <span className="line-clamp-1">{value.address}</span>
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${value.lat},${value.lng}`}
            target="_blank"
            rel="noreferrer"
            className="text-[color:var(--brand-strong)] underline"
          >
            Google 地图
          </a>
        </div>
      ) : null}
    </div>
  );
}

function mapsEmbed(lat: number, lng: number) {
  return `https://www.google.com/maps?q=${lat},${lng}&z=17&output=embed`;
}
