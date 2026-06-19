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

// v5-D60: FB Messenger 2017 风资料证据编辑器

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
    <div className="rounded-[3px] border border-[#dddfe2] bg-[#f5f6f7] p-2.5">
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
          <div className="flex h-8 w-8 items-center justify-center rounded-[3px] bg-white text-[#3b5998] border border-[#dddfe2]">
            <Paperclip className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="text-[13px] font-bold text-[#1d2129]">资料维度</div>
            <div className="text-xs text-[#606770]">{materials.length} 份 · {imageCount} 张图片</div>
          </div>
        </div>
        <Link href="/docs/structured-chat" className="text-[12px] font-semibold text-[#3b5998] hover:underline">
          Docs
        </Link>
      </div>

      <div className="mt-2.5 flex gap-1.5 overflow-x-auto pb-1">
        {materialKindOptions.map((item) => {
          const Icon = item.icon;
          const active = item.kind === selectedKind;

          return (
            <button
              key={item.kind}
              type="button"
              onClick={() => onKindChange(item.kind)}
              disabled={disabled}
              className={`inline-flex shrink-0 items-center gap-1 rounded-[3px] border px-2 py-1 text-xs font-semibold transition ${
                active
                  ? 'border-[#3b5998] bg-[#e7f3ff] text-[#365899]'
                  : 'border-[#dddfe2] bg-white text-[#606770] hover:border-[#3b5998] hover:text-[#1d2129]'
              } disabled:cursor-not-allowed disabled:opacity-60`}
            >
              <Icon className="h-3 w-3" />
              {item.label}
            </button>
          );
        })}
      </div>

      <div className="mt-2.5 grid gap-1.5 md:grid-cols-[minmax(0,1fr)_auto_auto]">
        <div className="relative">
          <SelectedIcon className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#606770]" />
          <input
            value={note}
            onChange={(event) => onNoteChange(event.target.value)}
            placeholder={selected.placeholder}
            disabled={disabled}
            className="fb-input h-9 w-full pl-8 pr-3 text-[13px]"
          />
        </div>
        <button
          type="button"
          onClick={onUploadClick}
          disabled={disabled || isAdding || materials.length >= maxMaterialCount}
          className="fb-btn inline-flex h-9 items-center justify-center gap-1 px-3 text-[12px] font-semibold text-[#1d2129] disabled:cursor-not-allowed disabled:opacity-60"
          title="添加图片或文件"
        >
          <ImagePlus className="h-3.5 w-3.5" />
          {isAdding ? '读取中' : '图片/文件'}
        </button>
        <button
          type="button"
          onClick={onAddText}
          disabled={disabled || isAdding || materials.length >= maxMaterialCount}
          className="fb-btn inline-flex h-9 items-center justify-center gap-1 px-3 text-[12px] font-semibold text-[#1d2129] disabled:cursor-not-allowed disabled:opacity-60"
          title="添加摘要"
        >
          <Plus className="h-3.5 w-3.5" />
          摘要
        </button>
      </div>

      {materials.length > 0 ? (
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {materials.map((item) => (
            <MaterialChip key={item.id} material={item} onRemove={onRemove} />
          ))}
        </div>
      ) : null}

      <div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-xs leading-4 text-[#606770]">
        <span className="inline-flex items-center gap-1 rounded-[3px] border border-[#dddfe2] bg-white px-2 py-0.5 font-semibold">
          <ShieldCheck className="h-3 w-3" />
          先遮挡证件号、住址、手机号
        </span>
        {selectedKind === 'legal_document' ? (
          <span className="rounded-[3px] border border-[#f0c674] bg-[#fff7e6] px-2 py-0.5 font-semibold text-[#a87f2c]">文书只做结构阅读</span>
        ) : null}
        {error ? <span className="font-semibold text-[#bd4c42]">{error}</span> : null}
      </div>
    </div>
  );
}
