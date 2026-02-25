'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { searchCities, type CityData } from '@/lib/cities';

interface CitySelectorProps {
  value: CityData | null;
  onChange: (city: CityData) => void;
}

export default function CitySelector({ value, onChange }: CitySelectorProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CityData[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [hlIdx, setHlIdx] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  const doSearch = useCallback((q: string) => {
    setResults(searchCities(q, 12));
    setHlIdx(0);
  }, []);

  const handleSelect = (city: CityData) => {
    onChange(city);
    setQuery('');
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) { if (e.key === 'ArrowDown') { doSearch(query); setIsOpen(true); e.preventDefault(); } return; }
    if (e.key === 'ArrowDown') { e.preventDefault(); setHlIdx(i => Math.min(i + 1, results.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setHlIdx(i => Math.max(i - 1, 0)); }
    else if (e.key === 'Enter') { e.preventDefault(); if (results[hlIdx]) handleSelect(results[hlIdx]); }
    else if (e.key === 'Escape') setIsOpen(false);
  };

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  return (
    <div ref={ref} className="relative">
      {value ? (
        <div className="flex items-center justify-between px-4 py-3 border-2 border-purple-300 bg-purple-50 rounded-lg">
          <div>
            <span className="font-semibold text-gray-900">{value.name}</span>
            <span className="text-xs text-gray-500 ml-2">{value.nameEn}, {value.country}</span>
            <span className="text-xs text-purple-600 ml-2">E{value.lng.toFixed(2)}° UTC{value.tz >= 0 ? '+' : ''}{value.tz}</span>
          </div>
          <button type="button" onClick={() => { onChange(null as any); setIsOpen(false); }} className="text-sm text-purple-600 hover:text-purple-800">更换</button>
        </div>
      ) : (
        <input
          type="text"
          value={query}
          onChange={e => { setQuery(e.target.value); doSearch(e.target.value); setIsOpen(true); }}
          onFocus={() => { doSearch(query); setIsOpen(true); }}
          onKeyDown={handleKeyDown}
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:ring-purple-500 transition"
          placeholder="搜索城市（中文/英文）如：北京、Shanghai、Tokyo"
        />
      )}
      {isOpen && results.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-64 overflow-y-auto">
          {results.map((city, i) => (
            <button
              key={`${city.nameEn}-${city.lng}`}
              type="button"
              className={`w-full text-left px-4 py-2.5 flex items-center justify-between hover:bg-purple-50 transition ${i === hlIdx ? 'bg-purple-50' : ''}`}
              onClick={() => handleSelect(city)}
              onMouseEnter={() => setHlIdx(i)}
            >
              <div>
                <span className="font-medium text-gray-900">{city.name}</span>
                <span className="text-sm text-gray-500 ml-2">{city.nameEn}</span>
                {city.province && <span className="text-xs text-gray-400 ml-1">({city.province})</span>}
              </div>
              <div className="text-xs text-gray-400">{city.country} · UTC{city.tz >= 0 ? '+' : ''}{city.tz}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
