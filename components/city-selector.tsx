'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Clock3, MapPin, Search, X } from 'lucide-react';
import {
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
  const ref = useRef<HTMLDivElement>(null);

  const featuredLocations = useMemo(() => getFeaturedLocations().slice(0, 8), []);
  const searchResults = useMemo(() => searchLocations(query, 10), [query]);
  const quickLocations = useMemo(
    () => dedupeLocations([...(value ? [value] : []), ...recentLocations, ...featuredLocations]).slice(0, 10),
    [featuredLocations, recentLocations, value]
  );
  const keyboardOptions = query.trim() ? searchResults : quickLocations;

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
    setHighlightIndex(0);
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
        setQuery('');
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

  const handleSelect = (location: LocationOption | null) => {
    if (location) {
      persistRecentLocation(location);
    }

    onSelect(location);
    setQuery('');
    setIsOpen(false);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!keyboardOptions.length) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
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
      setQuery('');
    }
  };

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--ink-5)]" />
        <input
          type="text"
          value={isOpen ? query : value?.fullName || ''}
          onChange={(event) => {
            setQuery(event.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="未知地 / 北京时间，或搜索市区县"
          className="w-full rounded-[var(--radius)] border border-[color:var(--line)] bg-white px-11 py-3 text-sm text-[color:var(--ink)] outline-none transition focus:border-[color:var(--warm)] focus:ring-4 focus:ring-[rgba(201,125,58,0.12)]"
        />

        {(query || value) ? (
          <button
            type="button"
            onClick={() => handleSelect(null)}
            className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-[color:var(--bg-sunken)] text-[color:var(--ink-4)]"
            aria-label="清空出生地"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </div>

      <div className="mt-2 flex flex-wrap gap-2 text-xs text-[color:var(--muted)]">
        <span className="inline-flex items-center gap-1 rounded-full bg-[rgba(201,125,58,0.1)] px-3 py-1 text-[color:var(--warm)]">
          <MapPin className="h-3.5 w-3.5" />
          {value ? value.displayName : '未知地'}
        </span>
        <span className="rounded-full bg-[color:var(--bg-sunken)] px-3 py-1">
          {value ? getTimezoneDisplay(value) : '北京时间'}
        </span>
      </div>

      {isOpen ? (
        <div className="absolute left-0 right-0 top-[calc(100%+0.6rem)] z-30 rounded-[var(--radius)] border border-[color:var(--line)] bg-white p-3 shadow-[0_20px_48px_rgba(23,32,51,0.12)]">
          <button
            type="button"
            onClick={() => handleSelect(null)}
            className="mb-3 flex w-full items-center justify-between rounded-[var(--radius)] bg-[rgba(246,241,232,0.78)] px-4 py-3 text-left transition hover:bg-[rgba(246,241,232,1)]"
          >
            <div>
              <div className="text-sm font-semibold text-[color:var(--ink)]">不确定出生地，先按北京时间</div>
              <div className="mt-1 text-xs text-[color:var(--muted)]">先进入结果页，之后再补出生地也可以。</div>
            </div>
            <Clock3 className="h-4 w-4 text-[color:var(--warm)]" />
          </button>

          {query.trim() ? (
            searchResults.length > 0 ? (
              <div className="space-y-2">
                {searchResults.map((location, index) => (
                  <LocationResultButton
                    key={location.id}
                    active={index === highlightIndex}
                    location={location}
                    onClick={() => handleSelect(location)}
                    onMouseEnter={() => setHighlightIndex(index)}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-[var(--radius)] bg-[color:var(--bg-elevated)] px-4 py-5 text-sm text-[color:var(--muted)]">
                没找到对应地点，试试输入更上一级行政区或英文城市名。
              </div>
            )
          ) : (
            <div className="space-y-4">
              {recentLocations.length > 0 ? (
                <div>
                  <div className="mb-2 flex items-center gap-2 px-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">
                    <Clock3 className="h-3.5 w-3.5" />
                    最近使用
                  </div>
                  <div className="grid gap-2 md:grid-cols-2">
                    {recentLocations.map((location, index) => (
                      <LocationResultButton
                        key={location.id}
                        active={index === highlightIndex}
                        location={location}
                        onClick={() => handleSelect(location)}
                        onMouseEnter={() => setHighlightIndex(index)}
                      />
                    ))}
                  </div>
                </div>
              ) : null}

              <div>
                <div className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">
                  常用地点
                </div>
                <div className="flex flex-wrap gap-2">
                  {featuredLocations.map((location) => (
                    <button
                      key={location.id}
                      type="button"
                      onClick={() => handleSelect(location)}
                      className="inline-flex items-center gap-1.5 rounded-[var(--radius-sm)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] px-2 py-0.5 text-xs font-semibold text-[color:var(--ink-2)] transition hover:border-[color:var(--warm)] hover:bg-[rgba(201,125,58,0.08)]"
                    >
                      {location.displayName}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

function LocationResultButton({
  active,
  location,
  onClick,
  onMouseEnter,
}: {
  active: boolean;
  location: LocationOption;
  onClick: () => void;
  onMouseEnter: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      className={`flex w-full items-center justify-between rounded-[var(--radius)] border px-4 py-3 text-left transition ${
 active
          ? 'border-[color:var(--warm)] bg-[rgba(201,125,58,0.1)]'
          : 'border-[color:var(--line)] bg-white hover:bg-[color:var(--bg-elevated)]'
      }`}
    >
      <div className="min-w-0">
        <div className="truncate text-sm font-semibold text-[color:var(--ink)]">{location.displayName}</div>
        <div className="truncate text-xs text-[color:var(--muted)]">{location.fullName}</div>
      </div>
      <div className="ml-3 shrink-0 text-right text-[11px] text-[color:var(--muted)]">
        <div>{getTimezoneDisplay(location)}</div>
        <div>东经 {location.lng.toFixed(2)}°</div>
      </div>
    </button>
  );
}
