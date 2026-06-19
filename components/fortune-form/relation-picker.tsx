'use client';

// v5-D39 多档案：可选 relation chip 行
// 张一鸣定调："多档案是使用频次的杠杆"——但 relation 必须可选，不阻断单档案用户。
// 默认空（=自己），用户主动点 chip 才进入"算关心的人"心智。

import { RELATION_OPTIONS, type RelationKey } from '@/lib/relation';

type Props = {
  value: RelationKey | null;
  label: string;
  onChange: (next: RelationKey | null) => void;
  onLabelChange: (next: string) => void;
};

export default function RelationPicker({ value, label, onChange, onLabelChange }: Props) {
  return (
    <div className="rounded-md border border-[color:var(--hairline)] bg-[color:var(--paper)] px-3 py-2.5 md:py-3">
      <div className="flex items-center justify-between">
        <div className="text-xs tracking-[0.08em] uppercase text-[color:var(--ink-4)]">
          这是谁的命盘？<span className="ml-1 text-xs normal-case text-[color:var(--ink-5)]">（可选）</span>
        </div>
        {value && (
          <button
            type="button"
            onClick={() => {
              onChange(null);
              onLabelChange('');
            }}
            className="text-xs text-[color:var(--ink-5)] hover:text-[color:var(--ink-3)]"
          >
            清除
          </button>
        )}
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {RELATION_OPTIONS.map((opt) => {
          const selected = value === opt.key;
          return (
            <button
              key={opt.key}
              type="button"
              onClick={() => {
                onChange(selected ? null : opt.key);
                if (opt.key !== 'other') onLabelChange('');
              }}
              className={`min-h-9 rounded-full border px-3 text-xs font-semibold transition ${
                selected
                  ? 'border-[color:var(--brand-strong)] bg-[color:var(--brand-strong)] text-white'
                  : 'border-[color:var(--hairline)] bg-[color:var(--paper)] text-[color:var(--ink-3)] hover:border-[color:var(--brand-soft-2)]'
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
      {value === 'other' && (
        <input
          type="text"
          value={label}
          onChange={(e) => onLabelChange(e.target.value)}
          placeholder="自定义昵称（如：大宝、老李）"
          maxLength={20}
          className="mt-2 w-full rounded-md border border-[color:var(--hairline)] bg-white px-3 py-2 text-sm focus:border-[color:var(--brand-strong)] focus:outline-none"
        />
      )}
    </div>
  );
}
