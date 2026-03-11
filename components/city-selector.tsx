'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Clock3, MapPin, Search, Sparkles, X } from 'lucide-react';
import {
  buildChinaLocation,
  getChinaCities,
  getChinaDistricts,
  getChinaProvinces,
  getChinaRegionSummary,
  getFeaturedLocations,
  getTimezoneDisplay,
  searchLocations,
  type LocationOption,
} from '@/lib/location-engine';

interface CitySelectorProps {
  value?: LocationOption | null;
  onSelect: (city: LocationOption | null) => void;
}

const RECENT_STORAGE_KEY = 'life-kline-recent-locations';
const RECENT_LIMIT = 6;

function dedupeLocations(items: LocationOption[]) {
  return items.filter((item, index, array) => index === array.findIndex((current) => current.id === item.id));
}

export default function CitySelector({ value, onSelect }: CitySelectorProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(0);
  const [recentLocations, setRecentLocations] = useState<LocationOption[]>([]);
  const [provinceName, setProvinceName] = useState('北京市');
  const [cityName, setCityName] = useState('北京市');
  const [districtName, setDistrictName] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  const featuredLocations = useMemo(() => getFeaturedLocations(), []);
  const regionSummary = useMemo(() => getChinaRegionSummary(), []);
  const provinces = useMemo(() => getChinaProvinces(), []);
  const cities = useMemo(() => getChinaCities(provinceName), [provinceName]);
  const districts = useMemo(() => getChinaDistricts(provinceName, cityName), [provinceName, cityName]);

  useEffect(() => {
    try {
      const savedValue = window.localStorage.getItem(RECENT_STORAGE_KEY);
      if (!savedValue) return;
      const parsed = JSON.parse(savedValue) as LocationOption[];
      setRecentLocations(dedupeLocations(parsed).slice(0, RECENT_LIMIT));
    } catch {
      window.localStorage.removeItem(RECENT_STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    const currentCity = cities[0]?.name;
    if (!cities.some((city) => city.name === cityName) && currentCity) {
      setCityName(currentCity);
    }
  }, [cities, cityName]);

  useEffect(() => {
    if (districts.length === 0) {
      setDistrictName('');
      return;
    }

    if (!districts.some((district) => district.name === districtName)) {
      setDistrictName(districts[0]?.name || '');
    }
  }, [districtName, districts]);

  const searchResults = useMemo(() => searchLocations(query, 12), [query]);
  const quickLocations = useMemo(
    () => dedupeLocations([...(value ? [value] : []), ...recentLocations, ...featuredLocations]),
    [featuredLocations, recentLocations, value]
  );
  const keyboardOptions = query.trim() ? searchResults : quickLocations;

  useEffect(() => {
    setHighlightIndex(0);
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const persistRecentLocation = (location: LocationOption) => {
    const nextRecent = dedupeLocations([location, ...recentLocations]).slice(0, RECENT_LIMIT);
    setRecentLocations(nextRecent);
    window.localStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify(nextRecent));
  };

  const handleSelect = (location: LocationOption) => {
    onSelect(location);
    persistRecentLocation(location);
    setQuery('');
    setIsOpen(false);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!keyboardOptions.length) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setIsOpen(true);
      setHighlightIndex((current) => Math.min(current + 1, keyboardOptions.length - 1));
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setHighlightIndex((current) => Math.max(current - 1, 0));
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      const selected = keyboardOptions[highlightIndex];
      if (selected) {
        handleSelect(selected);
      }
    }

    if (event.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div ref={ref} className="space-y-4">
      {value ? (
        <div className="rounded-[1.5rem] border border-[color:var(--accent)] bg-[color:var(--accent-soft)] p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-11 w-11 items-center justify-center rounded-2xl bg-white/85 text-[color:var(--accent-strong)]">
                <MapPin className="h-4 w-4" />
              </div>
              <div>
                <div className="font-semibold text-[color:var(--ink)]">{value.displayName}</div>
                <div className="mt-1 text-xs leading-6 text-[color:var(--muted)]">{value.fullName}</div>
                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full bg-white/80 px-3 py-1 text-[color:var(--accent-strong)]">
                    经度 {value.lng.toFixed(4)}°
                  </span>
                  <span className="rounded-full bg-white/80 px-3 py-1 text-[color:var(--accent-strong)]">
                    {getTimezoneDisplay(value)}
                  </span>
                  <span className="rounded-full bg-white/80 px-3 py-1 text-[color:var(--accent-strong)]">
                    {value.scope === 'china' ? '中国行政区划库' : '海外城市库'}
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onSelect(null)}
              className="inline-flex items-center gap-1 rounded-full bg-white/85 px-3 py-1.5 text-xs font-medium text-[color:var(--ink)]"
            >
              <X className="h-3 w-3" />
              清空
            </button>
          </div>
        </div>
      ) : null}

      <div className="rounded-[1.5rem] border border-[color:var(--line)] bg-white p-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-[color:var(--ink)]">
          <Search className="h-4 w-4 text-[color:var(--warm)]" />
          搜索出生地点
        </div>
        <p className="mt-1 text-xs leading-6 text-[color:var(--muted)]">
          现在不是只有城市表，而是中国省/市/区县库 + 海外城市库。可直接搜区县、城市、英文地名。
        </p>

        <div className="relative mt-3">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder="例如 海淀区 / 朝阳 / 上海浦东 / Tokyo / Los Angeles"
            className="w-full rounded-[1.5rem] border border-[color:var(--line)] bg-[rgba(246,241,232,0.55)] px-11 py-3.5 text-[color:var(--ink)] outline-none transition focus:border-[color:var(--accent)] focus:ring-4 focus:ring-[color:var(--accent-soft)]"
          />
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {featuredLocations.slice(0, 8).map((location) => (
            <button
              key={location.id}
              type="button"
              onClick={() => handleSelect(location)}
              className="rounded-full bg-[rgba(15,118,110,0.08)] px-3 py-1.5 text-xs font-semibold text-[color:var(--accent-strong)] transition hover:bg-[rgba(15,118,110,0.14)]"
            >
              {location.displayName}
            </button>
          ))}
        </div>
      </div>

      {isOpen ? (
        <div className="rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-3 shadow-[0_24px_60px_rgba(23,32,51,0.16)]">
          {query.trim() ? (
            searchResults.length > 0 ? (
              <div className="space-y-2">
                <div className="px-2 text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--muted)]">
                  搜索结果
                </div>
                {searchResults.map((location, index) => (
                  <LocationResultButton
                    key={location.id}
                    location={location}
                    active={index === highlightIndex}
                    onMouseEnter={() => setHighlightIndex(index)}
                    onClick={() => handleSelect(location)}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-[1.25rem] bg-[rgba(246,241,232,0.72)] px-4 py-5">
                <div className="flex items-center gap-2 text-sm font-semibold text-[color:var(--ink)]">
                  <Sparkles className="h-4 w-4 text-[color:var(--warm)]" />
                  没找到完全匹配的地点
                </div>
                <div className="mt-2 text-sm leading-7 text-[color:var(--muted)]">
                  可以尝试更上一级行政区，或改用英文地名搜索。例如 “朝阳区” 改成 “北京市 朝阳区”，海外用 “New York”。
                </div>
              </div>
            )
          ) : (
            <div className="space-y-4">
              {recentLocations.length > 0 ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 px-2 text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--muted)]">
                    <Clock3 className="h-3.5 w-3.5" />
                    最近选择
                  </div>
                  <div className="grid gap-2 md:grid-cols-2">
                    {recentLocations.map((location, index) => (
                      <LocationResultButton
                        key={location.id}
                        location={location}
                        active={index === highlightIndex}
                        onMouseEnter={() => setHighlightIndex(index)}
                        onClick={() => handleSelect(location)}
                      />
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="rounded-[1.25rem] border border-[color:var(--line)] bg-white p-4">
                <div className="text-sm font-semibold text-[color:var(--ink)]">中国省市区直选</div>
                <div className="mt-1 text-xs leading-6 text-[color:var(--muted)]">
                  已接入 {regionSummary.provinceCount} 个省级区域、{regionSummary.cityCount} 个城市、{regionSummary.districtCount} 个区县节点。
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  <SelectField
                    label="省"
                    value={provinceName}
                    onChange={(nextValue) => setProvinceName(nextValue)}
                    options={provinces.map((item) => ({ label: item, value: item }))}
                  />
                  <SelectField
                    label="市"
                    value={cityName}
                    onChange={(nextValue) => setCityName(nextValue)}
                    options={cities.map((item) => ({ label: item.name, value: item.name }))}
                  />
                  <SelectField
                    label="区县"
                    value={districtName}
                    onChange={(nextValue) => setDistrictName(nextValue)}
                    options={[
                      { label: '不细分区县', value: '' },
                      ...districts.map((item) => ({ label: item.name, value: item.name })),
                    ]}
                  />
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const location = buildChinaLocation(provinceName, cityName, districtName || undefined);
                    if (location) {
                      handleSelect(location);
                    }
                  }}
                  className="mt-4 inline-flex items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--accent),var(--accent-strong))] px-5 py-2.5 text-sm font-semibold text-white"
                >
                  使用这个出生地点
                </button>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 px-2 text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--muted)]">
                  <Sparkles className="h-3.5 w-3.5" />
                  常用地点
                </div>
                <div className="grid gap-2 md:grid-cols-2">
                  {featuredLocations.map((location, index) => {
                    const resultIndex = recentLocations.length + index;
                    return (
                      <LocationResultButton
                        key={location.id}
                        location={location}
                        active={resultIndex === highlightIndex}
                        onMouseEnter={() => setHighlightIndex(resultIndex)}
                        onClick={() => handleSelect(location)}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ label: string; value: string }>;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold text-[color:var(--muted)]">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-[color:var(--line)] bg-white px-3 py-3 text-sm text-[color:var(--ink)] outline-none transition focus:border-[color:var(--accent)]"
      >
        {options.map((option) => (
          <option key={`${label}-${option.value}`} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function LocationResultButton({
  location,
  active,
  onMouseEnter,
  onClick,
}: {
  location: LocationOption;
  active: boolean;
  onMouseEnter: () => void;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onMouseEnter={onMouseEnter}
      onClick={onClick}
      className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition ${
        active
          ? 'border-[color:var(--accent)] bg-[color:var(--accent-soft)]'
          : 'border-[color:var(--line)] bg-white hover:bg-slate-50'
      }`}
    >
      <div>
        <div className="font-medium text-[color:var(--ink)]">{location.displayName}</div>
        <div className="mt-1 text-xs text-[color:var(--muted)]">{location.fullName}</div>
      </div>
      <div className="text-right text-xs text-[color:var(--accent-strong)]">
        <div>{getTimezoneDisplay(location)}</div>
        <div className="mt-1">经度 {location.lng.toFixed(2)}°</div>
      </div>
    </button>
  );
}
