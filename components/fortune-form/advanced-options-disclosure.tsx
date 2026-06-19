'use client';

import PriorityDisclosure from '../priority-disclosure';
import TacitKnowledgeComposer from '../tacit-knowledge-composer';
import {
  createEmptyTacitKnowledgeInput,
  type TacitKnowledgeInput,
} from '@/lib/tacit-knowledge';
import type { CaseTypeOption, PaipanInfoData } from '@/lib/paipan-form';

const SETTING_MIDNIGHT_KEY = 'setting_midnight';

type SetTimeInfoEntry = { name: string; value: 0 | 1 };

type AdvancedOptionsDisclosureProps = {
  infoData: PaipanInfoData;
  onInfoDataChange: (patch: Partial<PaipanInfoData>) => void;
  caseTypes: CaseTypeOption[];
  setTimeInfo: SetTimeInfoEntry[];
  onSetTimeInfoChange: (next: SetTimeInfoEntry[]) => void;
  tacitContext: TacitKnowledgeInput;
  onTacitChange: (next: TacitKnowledgeInput) => void;
  tacitExpanded: boolean;
  onTacitExpandedChange: (next: boolean) => void;
};

export default function AdvancedOptionsDisclosure({
  infoData,
  onInfoDataChange,
  caseTypes,
  setTimeInfo,
  onSetTimeInfoChange,
  tacitContext,
  onTacitChange,
  tacitExpanded,
  onTacitExpandedChange,
}: AdvancedOptionsDisclosureProps) {
  const handleSetTimeToggle = (index: number) => {
    const next = setTimeInfo.map((entry, idx) =>
      idx === index
        ? { ...entry, value: (entry.value === 1 ? 0 : 1) as 0 | 1 }
        : entry,
    );

    if (index === 0) {
      onInfoDataChange({ xls: next[0].value as 0 | 1 });
    }

    if (index === 2) {
      try {
        window.localStorage.setItem(SETTING_MIDNIGHT_KEY, String(next[2].value));
      } catch {
        // localStorage 不可用时静默忽略，仅本次会话生效
      }
    }

    onSetTimeInfoChange(next);
  };

  return (
    <PriorityDisclosure
      label="可选"
      title="姓名、判断主题、时间修正与默会信息"
      description="不影响提交；需要更细判断时再打开。"
      className="shadow-none md:block"
    >
      <div className="grid gap-3">
        <label className="block rounded-[var(--radius)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)]/70 px-3 py-3">
          <div className="text-xs tracking-[0.08em] uppercase text-[color:var(--ink-4)]">命主姓名</div>
          <input
            value={infoData.username}
            onChange={(event) => onInfoDataChange({ username: event.target.value })}
            placeholder="可填写本人、家人或案例对象姓名"
            maxLength={30}
            className="mt-2 h-11 w-full rounded-[var(--radius)] border border-[color:var(--hairline-strong)] bg-[color:var(--paper)] px-3 text-base text-[color:var(--ink-1)] outline-none transition focus:border-[color:var(--brand)] focus:ring-2 focus:ring-[color:var(--brand-soft-2)] placeholder:text-[color:var(--ink-5)]"
          />
          <div className="mt-1 text-xs text-[color:var(--ink-5)]">
            最多 30 个字符（emoji 占 2 字符）
          </div>
        </label>

        <div className="rounded-[var(--radius)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)]/70 px-3 py-3">
          <div className="text-xs tracking-[0.08em] uppercase text-[color:var(--ink-4)]">判断主题</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {caseTypes.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onInfoDataChange({ typeId: item.id })}
                className={`rounded-full border px-3 py-1.5 text-sm font-semibold transition ${
                  infoData.typeId === item.id
                    ? 'border-[color:var(--brand)] bg-[color:var(--brand-soft)] text-[color:var(--brand-strong)]'
                    : 'border-[color:var(--hairline)] bg-[color:var(--paper)] text-[color:var(--ink-4)] hover:text-[color:var(--ink-2)]'
                }`}
              >
                {item.name}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-[var(--radius)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)]/70 px-3 py-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-xs tracking-[0.08em] uppercase text-[color:var(--ink-4)]">时间修正与保存</div>
              <div className="mt-1 text-sm leading-6 text-[color:var(--ink-4)]">默认使用真太阳时。</div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-[color:var(--ink-2)]">保存</span>
              <button
                type="button"
                role="switch"
                aria-checked={infoData.isSave}
                onClick={() => onInfoDataChange({ isSave: !infoData.isSave })}
                className={`relative h-[28px] w-[46px] rounded-full transition ${
                  infoData.isSave ? 'bg-[color:var(--brand)]' : 'bg-[#d6d6d6]'
                }`}
              >
                <span
                  className={`absolute top-[2px] h-[24px] w-[24px] rounded-full bg-[color:var(--paper)] transition ${
                    infoData.isSave ? 'left-[20px]' : 'left-[2px]'
                  }`}
                />
              </button>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {setTimeInfo.map((item, index) => (
              <button
                key={item.name}
                type="button"
                aria-pressed={item.value === 1}
                onClick={() => handleSetTimeToggle(index)}
                className={`rounded-full border px-3 py-1.5 text-sm font-semibold transition ${
                  item.value === 1
                    ? 'border-[color:var(--brand)] bg-[color:var(--brand-soft)] text-[color:var(--brand-strong)]'
                    : 'border-[color:var(--hairline)] bg-[color:var(--paper)] text-[color:var(--ink-4)] hover:text-[color:var(--ink-2)]'
                }`}
              >
                {item.name}
              </button>
            ))}
          </div>
        </div>

        <TacitKnowledgeComposer
          value={tacitContext}
          onChange={onTacitChange}
          title="一些无法直接说出来的东西，也可以先交给系统"
          description="先选状态、身体信号、关系气氛，再补一句最怕发生什么。"
          collapsedLabel="补充当前状态"
          emptyHint="这一步不是必填。"
          summaryLabel="本次默会输入："
          expanded={tacitExpanded}
          onExpandedChange={onTacitExpandedChange}
          onReset={() => onTacitChange(createEmptyTacitKnowledgeInput())}
          variant="analyze"
        />
      </div>
    </PriorityDisclosure>
  );
}
