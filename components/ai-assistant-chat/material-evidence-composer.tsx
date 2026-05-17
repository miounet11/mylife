import Link from 'next/link';
import type { ChangeEvent, RefObject } from 'react';
import { ImagePlus, Paperclip, Plus, ShieldCheck } from 'lucide-react';
import {
  type ChatMaterialDraft,
  type ChatMaterialKind,
  getMaterialOption,
  materialKindOptions,
  maxMaterialCount,
} from '@/components/ai-assistant-chat/chat-helpers';
import { MaterialChip } from '@/components/ai-assistant-chat/chat-buttons';

interface MaterialEvidenceComposerProps {
  materials: ChatMaterialDraft[];
  selectedKind: ChatMaterialKind;
  note: string;
  isAdding: boolean;
  error: string;
  disabled: boolean;
  fileInputRef: RefObject<HTMLInputElement | null>;
  onKindChange: (kind: ChatMaterialKind) => void;
  onNoteChange: (value: string) => void;
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onUploadClick: () => void;
  onAddText: () => void;
  onRemove: (materialId: string) => void;
}

export function MaterialEvidenceComposer({
  materials,
  selectedKind,
  note,
  isAdding,
  error,
  disabled,
  fileInputRef,
  onKindChange,
  onNoteChange,
  onFileChange,
  onUploadClick,
  onAddText,
  onRemove,
}: MaterialEvidenceComposerProps) {
  const selected = getMaterialOption(selectedKind);
  const SelectedIcon = selected.icon;
  const imageCount = materials.filter((item) => item.hasImage).length;

  return (
    <div className="rounded-[var(--radius)] border border-[color:var(--line)] bg-[color:var(--paper)] p-3">
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept={selected.accept}
        onChange={onFileChange}
        disabled={disabled || isAdding}
      />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[color:var(--accent-soft)] text-[color:var(--accent-strong)]">
            <Paperclip className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-bold text-[color:var(--ink)]">资料维度</div>
            <div className="text-xs text-[color:var(--muted)]">{materials.length} 份 · {imageCount} 张图片</div>
          </div>
        </div>
        <Link href="/docs/structured-chat" className="text-xs font-semibold text-[color:var(--accent-strong)]">
          Docs
        </Link>
      </div>

      <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
        {materialKindOptions.map((item) => {
          const Icon = item.icon;
          const active = item.kind === selectedKind;

          return (
            <button
              key={item.kind}
              type="button"
              onClick={() => onKindChange(item.kind)}
              disabled={disabled}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition ${
                active
                  ? 'border-[color:var(--accent)] bg-[color:var(--accent-soft)] text-[color:var(--accent-strong)]'
                  : 'border-[color:var(--line)] bg-[color:var(--paper)] text-[color:var(--muted)] hover:border-[color:var(--accent)] hover:text-[color:var(--ink)]'
              } disabled:cursor-not-allowed disabled:opacity-60`}
            >
              <Icon className="h-3.5 w-3.5" />
              {item.label}
            </button>
          );
        })}
      </div>

      <div className="mt-3 grid gap-2 md:grid-cols-[minmax(0,1fr)_auto_auto]">
        <div className="relative">
          <SelectedIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--muted)]" />
          <input
            value={note}
            onChange={(event) => onNoteChange(event.target.value)}
            placeholder={selected.placeholder}
            disabled={disabled}
            className="h-11 w-full rounded-lg border border-[color:var(--line)] bg-[color:var(--paper)] pl-9 pr-3 text-sm text-[color:var(--ink)] outline-none transition placeholder:text-[color:var(--muted)] focus:border-[color:var(--accent)] focus:ring-4 focus:ring-[color:var(--accent-soft)]"
          />
        </div>
        <button
          type="button"
          onClick={onUploadClick}
          disabled={disabled || isAdding || materials.length >= maxMaterialCount}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-[color:var(--line)] bg-[color:var(--paper)] px-3 text-xs font-semibold text-[color:var(--ink)] transition hover:border-[color:var(--accent)] disabled:cursor-not-allowed disabled:opacity-60"
          title="添加图片或文件"
        >
          <ImagePlus className="h-4 w-4" />
          {isAdding ? '读取中' : '图片/文件'}
        </button>
        <button
          type="button"
          onClick={onAddText}
          disabled={disabled || isAdding || materials.length >= maxMaterialCount}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[color:var(--bg-elevated)] px-3 text-xs font-semibold text-[color:var(--ink)] transition hover:bg-[color:var(--accent-soft)] disabled:cursor-not-allowed disabled:opacity-60"
          title="添加摘要"
        >
          <Plus className="h-4 w-4" />
          摘要
        </button>
      </div>

      {materials.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {materials.map((item) => (
            <MaterialChip key={item.id} material={item} onRemove={onRemove} />
          ))}
        </div>
      ) : null}

      <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] leading-5 text-[color:var(--muted)]">
        <span className="inline-flex items-center gap-1 rounded-full bg-[color:var(--bg-elevated)] px-2.5 py-1 font-semibold">
          <ShieldCheck className="h-3.5 w-3.5" />
          先遮挡证件号、住址、手机号
        </span>
        {selectedKind === 'legal_document' ? (
          <span className="rounded-full bg-[color:var(--signal-soft)] px-2.5 py-1 font-semibold text-[color:var(--signal-strong)]">文书只做结构阅读</span>
        ) : null}
        {error ? <span className="font-semibold text-[color:var(--signal-strong)]">{error}</span> : null}
      </div>
    </div>
  );
}
