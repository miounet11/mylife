'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { SpaceGeoPlace } from '@/lib/fengshui/space/types';

type PlaceHit = SpaceGeoPlace & { mapsUrl?: string; embedUrl?: string };

/** 无定位权限时的默认城市中心（上海）— 也可被 IP 感知识别替换 */
const DEFAULT_CENTER = { lat: 31.2304, lng: 121.4737, label: '上海' };

type LeafletNS = {
  map: (el: HTMLElement, opts: object) => LeafletMap;
  tileLayer: (url: string, opts: object) => { addTo: (m: LeafletMap) => void };
  marker: (
    latlng: [number, number],
    opts?: object,
  ) => LeafletMarker;
  icon?: (opts: object) => unknown;
};

type LeafletMap = {
  setView: (latlng: [number, number], zoom: number) => LeafletMap;
  on: (ev: string, fn: (e: { latlng: { lat: number; lng: number } }) => void) => void;
  remove: () => void;
  invalidateSize: () => void;
};

type LeafletMarker = {
  addTo: (m: LeafletMap) => LeafletMarker;
  setLatLng: (latlng: [number, number]) => void;
  getLatLng: () => { lat: number; lng: number };
  on: (ev: string, fn: () => void) => void;
  dragging?: { enable: () => void };
};

let leafletLoadPromise: Promise<LeafletNS> | null = null;

function loadLeaflet(): Promise<LeafletNS> {
  if (typeof window === 'undefined') return Promise.reject(new Error('ssr'));
  const w = window as unknown as { L?: LeafletNS };
  if (w.L) return Promise.resolve(w.L);
  if (leafletLoadPromise) return leafletLoadPromise;

  leafletLoadPromise = new Promise((resolve, reject) => {
    const cssId = 'lk-leaflet-css';
    if (!document.getElementById(cssId)) {
      const link = document.createElement('link');
      link.id = cssId;
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }
    const existing = document.getElementById('lk-leaflet-js') as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener('load', () => {
        if (w.L) resolve(w.L);
        else reject(new Error('Leaflet load failed'));
      });
      return;
    }
    const script = document.createElement('script');
    script.id = 'lk-leaflet-js';
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.async = true;
    script.onload = () => {
      if (w.L) resolve(w.L);
      else reject(new Error('Leaflet missing'));
    };
    script.onerror = () => reject(new Error('Leaflet CDN error'));
    document.body.appendChild(script);
  });
  return leafletLoadPromise;
}

async function reverseGeocode(lat: number, lng: number): Promise<{
  address: string;
  name?: string;
  placeId?: string;
  city?: string;
  source: SpaceGeoPlace['source'];
}> {
  try {
    const res = await fetch(`/api/geo/reverse?lat=${lat}&lng=${lng}`);
    const data = await res.json();
    if (data?.success) {
      return {
        address: data.address || `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
        name: data.name,
        placeId: data.placeId,
        city: data.city,
        source: data.provider === 'google' ? 'google' : 'nominatim',
      };
    }
  } catch {
    /* fall through */
  }
  return {
    address: `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
    name: '选中位置',
    source: 'manual',
  };
}

export function MapPlacePicker({
  value,
  onSelect,
  compact = false,
  autoLocate = true,
}: {
  value: SpaceGeoPlace | null;
  onSelect: (place: SpaceGeoPlace) => void;
  compact?: boolean;
  /** 打开即请求定位并显示地图，无需先搜索 */
  autoLocate?: boolean;
}) {
  const mapElRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markerRef = useRef<LeafletMarker | null>(null);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  const [q, setQ] = useState(value?.address || '');
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [items, setItems] = useState<PlaceHit[]>([]);
  const [hint, setHint] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [status, setStatus] = useState<string>('正在准备地图…');

  const applyLatLng = useCallback(
    async (lat: number, lng: number, opts?: { inject?: boolean; quiet?: boolean }) => {
      if (!opts?.quiet) setStatus('解析地址…');
      const rev = await reverseGeocode(lat, lng);
      const place: SpaceGeoPlace = {
        address: rev.address,
        lat,
        lng,
        name: rev.name,
        placeId: rev.placeId,
        source: rev.source,
      };
      setQ(rev.address);
      if (opts?.inject !== false) {
        onSelectRef.current(place);
      }
      setStatus(rev.city ? `当前：${rev.city}` : '可拖动标记或点击地图选点');
      return place;
    },
    [],
  );

  const moveMarker = useCallback((lat: number, lng: number, zoom?: number) => {
    markerRef.current?.setLatLng([lat, lng]);
    const m = mapRef.current as (LeafletMap & { getZoom?: () => number }) | null;
    if (!m) return;
    const z = zoom ?? m.getZoom?.() ?? 15;
    m.setView([lat, lng], z);
  }, []);

  // Init map once
  useEffect(() => {
    let cancelled = false;
    let resizeObs: ResizeObserver | null = null;

    void (async () => {
      try {
        const L = await loadLeaflet();
        if (cancelled || !mapElRef.current) return;

        // Fix default icon paths for CDN leaflet
        const DefaultIcon = (L as unknown as { Icon: { Default: { mergeOptions: (o: object) => void; prototype: { _getIconUrl?: unknown }; } } }).Icon?.Default;
        if (DefaultIcon) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          delete (DefaultIcon.prototype as any)._getIconUrl;
          DefaultIcon.mergeOptions({
            iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
            iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
            shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
          });
        }

        const startLat = value?.lat || DEFAULT_CENTER.lat;
        const startLng = value?.lng || DEFAULT_CENTER.lng;

        const map = L.map(mapElRef.current, {
          zoomControl: true,
          attributionControl: true,
        }).setView([startLat, startLng], value ? 16 : 12);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '&copy; OpenStreetMap',
        }).addTo(map);

        const marker = L.marker([startLat, startLng], { draggable: true }).addTo(map);
        marker.dragging?.enable();

        marker.on('dragend', () => {
          const ll = marker.getLatLng();
          void applyLatLng(ll.lat, ll.lng);
        });

        map.on('click', (e) => {
          marker.setLatLng([e.latlng.lat, e.latlng.lng]);
          void applyLatLng(e.latlng.lat, e.latlng.lng);
        });

        mapRef.current = map;
        markerRef.current = marker;
        setMapReady(true);
        setStatus('拖动红标或点击地图选点');

        // Keep tiles sized when panel flexes
        resizeObs = new ResizeObserver(() => {
          map.invalidateSize();
        });
        resizeObs.observe(mapElRef.current);
        setTimeout(() => map.invalidateSize(), 80);
      } catch {
        setStatus('地图加载失败，仍可用搜索');
      }
    })();

    return () => {
      cancelled = true;
      resizeObs?.disconnect();
      try {
        mapRef.current?.remove();
      } catch {
        /* ignore */
      }
      mapRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount once
  }, []);

  // Auto geolocation on open
  useEffect(() => {
    if (!autoLocate || !mapReady) return;
    if (value?.lat && value?.lng) {
      moveMarker(value.lat, value.lng);
      setQ(value.address);
      setStatus('已使用注入区位');
      return;
    }

    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setStatus(`默认 ${DEFAULT_CENTER.label}，可授权定位或拖动选点`);
      void applyLatLng(DEFAULT_CENTER.lat, DEFAULT_CENTER.lng, { inject: true });
      moveMarker(DEFAULT_CENTER.lat, DEFAULT_CENTER.lng);
      return;
    }

    setLocating(true);
    setStatus('请求定位权限，以显示您所在城市…');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        moveMarker(lat, lng);
        void applyLatLng(lat, lng, { inject: true });
      },
      () => {
        setLocating(false);
        setHint('未授权定位，已落在默认城市；可搜索或拖动标记');
        moveMarker(DEFAULT_CENTER.lat, DEFAULT_CENTER.lng);
        void applyLatLng(DEFAULT_CENTER.lat, DEFAULT_CENTER.lng, { inject: true });
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapReady, autoLocate]);

  const relocate = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setHint('浏览器不支持定位');
      return;
    }
    setLocating(true);
    setStatus('正在获取当前位置…');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        moveMarker(pos.coords.latitude, pos.coords.longitude);
        void applyLatLng(pos.coords.latitude, pos.coords.longitude);
      },
      () => {
        setLocating(false);
        setHint('定位失败，请检查权限或手动拖动');
      },
      { enableHighAccuracy: true, timeout: 12000 },
    );
  };

  const search = async () => {
    if (!q.trim()) return;
    setLoading(true);
    setHint(null);
    try {
      const res = await fetch(`/api/geo/place-search?q=${encodeURIComponent(q.trim())}`);
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || '搜索失败');
      const list = ((data.items || []) as PlaceHit[]).slice(0, 4);
      setItems(list);
      setHint(data.hint || null);
      // 首条结果直接落到地图上（像买房站）
      if (list[0]) {
        moveMarker(list[0].lat, list[0].lng);
        void applyLatLng(list[0].lat, list[0].lng, { inject: true });
      }
    } catch (e) {
      setHint(e instanceof Error ? e.message : '搜索失败');
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={
        compact
          ? 'flex h-full min-h-0 flex-col gap-1.5 overflow-hidden'
          : 'flex flex-col gap-2 rounded-xl border border-[color:var(--hairline)] bg-[color:var(--paper)] p-3'
      }
    >
      <div className="flex shrink-0 items-center justify-between gap-2">
        <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-[color:var(--brand-strong)]">
          地图选址
        </div>
        <button
          type="button"
          onClick={relocate}
          disabled={locating}
          className="rounded-full border border-[color:var(--hairline)] px-2.5 py-0.5 text-[10px] font-semibold text-[color:var(--ink-2)] hover:bg-[color:var(--bg-sunken)] disabled:opacity-50"
        >
          {locating ? '定位中…' : '定位到我'}
        </button>
      </div>

      <p className="shrink-0 text-[10px] leading-snug text-[color:var(--ink-4)]">
        {status}
        <span className="text-[color:var(--ink-5)]"> · 拖动标记 / 点击地图即可注入</span>
      </p>

      {/* 地图始终展示 — 无需先搜索 */}
      <div
        className={`relative min-h-0 w-full overflow-hidden rounded-lg border border-[color:var(--hairline)] bg-[#e8eef5] ${
          compact ? 'flex-1' : 'h-56'
        }`}
      >
        <div ref={mapElRef} className="absolute inset-0 z-0 h-full w-full" />
        {!mapReady ? (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#e8eef5] text-[12px] text-[color:var(--ink-4)]">
            加载可交互地图…
          </div>
        ) : null}
      </div>

      <div className="flex shrink-0 gap-1.5">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && void search()}
          placeholder="搜索小区 / 路名（可选）"
          className="fb-input h-8 min-w-0 flex-1 px-2 text-[12px]"
        />
        <button
          type="button"
          disabled={loading}
          onClick={() => void search()}
          className="h-8 shrink-0 rounded-lg bg-[color:var(--ink-1)] px-2.5 text-[11px] font-semibold text-white disabled:opacity-40"
        >
          {loading ? '…' : '搜'}
        </button>
      </div>

      {hint ? <p className="line-clamp-1 shrink-0 text-[10px] text-[color:var(--ink-5)]">{hint}</p> : null}

      {items.length > 0 ? (
        <ul className="grid shrink-0 grid-cols-1 gap-0.5">
          {items.map((it) => (
            <li key={`${it.lat}-${it.lng}-${it.address}`}>
              <button
                type="button"
                className="w-full rounded-md border border-[color:var(--hairline)] px-2 py-1 text-left hover:bg-[color:var(--bg-sunken)]"
                onClick={() => {
                  moveMarker(it.lat, it.lng);
                  void applyLatLng(it.lat, it.lng);
                  setItems([]);
                }}
              >
                <div className="line-clamp-1 text-[11px] font-medium text-[color:var(--ink-1)]">
                  {it.name || it.address}
                </div>
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {value ? (
        <div className="flex shrink-0 items-center gap-1.5 border-t border-[color:var(--hairline)] pt-1.5 text-[10px] text-[color:var(--ink-3)]">
          <span className="font-semibold text-emerald-700">已注入</span>
          <span className="min-w-0 flex-1 truncate">{value.address}</span>
        </div>
      ) : null}
    </div>
  );
}
