'use client';

import { ChevronDown, ChevronUp, RotateCcw } from 'lucide-react';
import {
  TACIT_BODY_OPTIONS,
  TACIT_RELATIONSHIP_OPTIONS,
  TACIT_STATE_OPTIONS,
  buildTacitKnowledgeSummary,
  hasTacitKnowledgeInput,
  type TacitKnowledgeInput,
} from '@/lib/tacit-knowledge';

interface TacitKnowledgeComposerProps {
  value: TacitKnowledgeInput;
  onChange: (value: TacitKnowledgeInput) => void;
  title: string;
  description: string;
  collapsedLabel: string;
  emptyHint: string;
  summaryLabel: string;
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
  onReset: () => void;
  variant?: 'analyze' | 'chat';
  restoreLabel?: string;
  onRestore?: () => void;
  canRestore?: boolean;
}

const GROUPS = [
  { title: '当前状态', options: TACIT_STATE_OPTIONS, key: 'stateKeywords' as const },
  { title: '身体信号', options: TACIT_BODY_OPTIONS, key: 'bodySignals' as const },
  { title: '关系 / 环境', options: TACIT_RELATIONSHIP_OPTIONS, key: 'relationshipSignals' as const },
];

const LEVELS = [
  { label: '压力强度', key: 'pressureLevel' as const },
  { label: '清晰程度', key: 'clarityLevel' as const },
  { label: '紧迫程度', key: 'urgencyLevel' as const },
];

export default function TacitKnowledgeComposer({
  value,
  onChange,
  title,
  description,
  collapsedLabel,
  emptyHint,
  summaryLabel,
  expanded,
  onExpandedChange,
  onReset,
  variant = 'analyze',
  restoreLabel,
  onRestore,
  canRestore = false,
}: TacitKnowledgeComposerProps) {
  const summary = buildTacitKnowledgeSummary(value);
  const hasValue = hasTacitKnowledgeInput(value);
  const isAnalyze = variant === 'analyze';

  const toggleTacitItem = (
    key: 'stateKeywords' | 'bodySignals' | 'relationshipSignals',
    item: string
  ) => {
    const list = value[key] || [];
    onChange({
      ...value,
      [key]: list.includes(item)
        ? list.filter((entry) => entry !== item)
        : [...list, item].slice(0, 6),
    });
  };

  const updateLevel = (key: 'pressureLevel' | 'clarityLevel' | 'urgencyLevel', next: number) => {
    onChange({
      ...value,
      [key]: next,
    });
  };

  const updateText = (key: 'unsaidFear' | 'freeNote', next: string, limit: number) => {
    onChange({
      ...value,
      [key]: next.slice(0, limit),
    });
  };

  return (
    <div className={isAnalyze ? 'rounded-[var(--radius-md)] border border-[#ece7da] bg-[#faf7f1] px-4 py-4' : 'rounded-[var(--radius)] border border-[color:var(--line)] bg-[color:var(--accent-soft)]/40 p-4'}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className={isAnalyze ? 'text-[15px] font-semibold text-[#3f392f]' : 'text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]'}>
            {title}
          </div>
          <div className={isAnalyze ? 'mt-2 text-[13px] leading-6 text-[#6a6356]' : 'mt-2 text-xs leading-6 text-[color:var(--muted)]'}>
            {description}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {canRestore && onRestore ? (
            <button
              type="button"
              onClick={onRestore}
              className={isAnalyze ? 'rounded-full border border-[#e6decf] bg-white px-3 py-2 text-[12px] font-semibold text-[#6a6356]' : 'rounded-full border border-[color:var(--line)] bg-white px-3 py-2 text-xs font-semibold text-[color:var(--ink)]'}
            >
              {restoreLabel || '沿用上一轮'}
            </button>
          ) : null}
          {hasValue ? (
            <button
              type="button"
              onClick={onReset}
              className={isAnalyze ? 'inline-flex items-center gap-1 rounded-full border border-[#e6decf] bg-white px-3 py-2 text-[12px] font-semibold text-[#6a6356]' : 'inline-flex items-center gap-1 rounded-full border border-[color:var(--line)] bg-white px-3 py-2 text-xs font-semibold text-[color:var(--ink)]'}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              清空
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => onExpandedChange(!expanded)}
            className={isAnalyze ? 'inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-[12px] font-semibold text-[#8b6a2f]' : 'inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-xs font-semibold text-[color:var(--accent-strong)]'}
          >
            {hasValue ? summaryLabel : collapsedLabel}
            {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {!expanded ? (
        <div className={isAnalyze ? 'mt-4 rounded-[var(--radius-md)] border border-[#efe1bf] bg-[#fffaf0] px-4 py-3 text-[13px] leading-6 text-[#6a5840]' : 'mt-3 rounded-[var(--radius)] bg-white/85 px-4 py-3 text-xs leading-6 text-[color:var(--ink)]'}>
          {hasValue ? (
            <>
              <span className={isAnalyze ? 'font-semibold text-[#8b6a2f]' : 'font-semibold text-[color:var(--accent-strong)]'}>{summaryLabel}</span>
              {summary}
            </>
          ) : (
            emptyHint
          )}
        </div>
      ) : null}

      {expanded ? (
        <div className="mt-4 space-y-4">
          {GROUPS.map(({ title: groupTitle, options, key }) => (
            <div key={groupTitle}>
              <div className={isAnalyze ? 'text-[12px] tracking-[0.18em] text-[#9a927f]' : 'text-xs text-[color:var(--muted)]'}>{groupTitle}</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {options.map((item) => {
                  const selected = (value[key] || []).includes(item);
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => toggleTacitItem(key, item)}
                      className={isAnalyze
                        ? `rounded-full px-3 py-2 text-[12px] font-semibold transition ${selected ? 'bg-[#f5ecda] text-[#8b6a2f]' : 'border border-[#e6decf] bg-white text-[#6a6356]'}`
                        : `rounded-full px-3 py-1.5 text-xs font-semibold transition ${selected ? 'bg-white text-[color:var(--accent-strong)]' : 'border border-[color:var(--line)] bg-transparent text-[color:var(--muted)]'}`}
                    >
                      {item}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          <div className="grid gap-3 md:grid-cols-3">
            {LEVELS.map(({ label, key }) => (
              <label
                key={label}
                className={isAnalyze ? 'rounded-[var(--radius-md)] bg-white/90 px-4 py-3 text-[13px] text-[#4b4439]' : 'rounded-[var(--radius)] bg-white/80 px-3 py-3 text-xs text-[color:var(--ink)]'}
              >
                <div className="flex items-center justify-between gap-3">
                  <span>{label}</span>
                  <span className={isAnalyze ? 'font-semibold text-[#8b6a2f]' : 'font-semibold text-[color:var(--accent-strong)]'}>{value[key] || 3}/5</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={5}
                  step={1}
                  value={value[key] || 3}
                  onChange={(event) => updateLevel(key, Number(event.target.value))}
                  className={isAnalyze ? 'mt-3 w-full accent-[#b2955d]' : 'mt-2 w-full accent-[color:var(--accent-strong)]'}
                />
              </label>
            ))}
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <label className={isAnalyze ? 'rounded-[var(--radius-md)] bg-white/90 px-4 py-3 text-[13px] text-[#4b4439]' : 'rounded-[var(--radius)] bg-white/80 px-3 py-3 text-xs text-[color:var(--ink)]'}>
              <div className={isAnalyze ? 'text-[12px] tracking-[0.18em] text-[#9a927f]' : 'text-xs text-[color:var(--muted)]'}>最怕发生什么</div>
              <input
                value={value.unsaidFear || ''}
                onChange={(event) => updateText('unsaidFear', event.target.value, 80)}
                placeholder={isAnalyze ? '例如：我一旦表态，就没有回旋了' : '最怕发生什么'}
                className={isAnalyze ? 'mt-2 h-[40px] w-full rounded-[var(--radius)] border border-[#ececec] px-3 text-[14px] outline-none placeholder:text-[#c8c1b5]' : 'mt-2 h-11 w-full rounded-[var(--radius)] border border-[color:var(--line)] bg-white px-4 text-sm text-[color:var(--ink)] outline-none'}
              />
            </label>
            <label className={isAnalyze ? 'rounded-[var(--radius-md)] bg-white/90 px-4 py-3 text-[13px] text-[#4b4439]' : 'rounded-[var(--radius)] bg-white/80 px-3 py-3 text-xs text-[color:var(--ink)]'}>
              <div className={isAnalyze ? 'text-[12px] tracking-[0.18em] text-[#9a927f]' : 'text-xs text-[color:var(--muted)]'}>一句说不清的补充</div>
              <input
                value={value.freeNote || ''}
                onChange={(event) => updateText('freeNote', event.target.value, 160)}
                placeholder={isAnalyze ? '例如：不是没有答案，是身体已经先抗拒了' : '一句还说不清的补充'}
                className={isAnalyze ? 'mt-2 h-[40px] w-full rounded-[var(--radius)] border border-[#ececec] px-3 text-[14px] outline-none placeholder:text-[#c8c1b5]' : 'mt-2 h-11 w-full rounded-[var(--radius)] border border-[color:var(--line)] bg-white px-4 text-sm text-[color:var(--ink)] outline-none'}
              />
            </label>
          </div>

          {hasValue ? (
            <div className={isAnalyze ? 'rounded-[var(--radius-md)] border border-[#efe1bf] bg-[#fffaf0] px-4 py-3 text-[13px] leading-6 text-[#6a5840]' : 'rounded-[var(--radius)] bg-white/85 px-4 py-3 text-xs leading-6 text-[color:var(--ink)]'}>
              <span className={isAnalyze ? 'font-semibold text-[#8b6a2f]' : 'font-semibold text-[color:var(--accent-strong)]'}>{summaryLabel}</span>
              {summary}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
