import { X } from 'lucide-react';
import {
  formatFileSize,
  getMaterialOption,
  type ChatMaterialDisplay,
} from '@/components/ai-assistant-chat/chat-helpers';

interface QuickQuestionButtonProps {
  question: string;
  onClick: () => void;
  disabled?: boolean;
}

export function QuickQuestionButton({ question, onClick, disabled = false }: QuickQuestionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="rounded-[var(--radius-md)] border border-[color:var(--line)] bg-[color:var(--paper)] px-4 py-4 text-left text-xs leading-6 text-[color:var(--ink)] transition hover:border-[color:var(--accent)] hover:bg-[color:var(--accent-soft)] disabled:cursor-not-allowed disabled:opacity-60"
    >
      <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">结构化追问</div>
      <div className="mt-2">{question}</div>
    </button>
  );
}

interface CorrectionPromptButtonProps {
  question: string;
  helper: string;
  onClick: () => void;
  disabled?: boolean;
}

export function CorrectionPromptButton({
  question,
  helper,
  onClick,
  disabled = false,
}: CorrectionPromptButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="rounded-[var(--radius-md)] border border-[color:var(--signal)] bg-[color:var(--paper)] px-4 py-4 text-left transition hover:border-[color:var(--signal)] hover:bg-[color:var(--signal-soft)] disabled:cursor-not-allowed disabled:opacity-60"
    >
      <div className="text-sm font-semibold leading-7 text-[color:var(--ink)]">{question}</div>
      <div className="mt-2 text-xs text-[color:var(--muted)]">{helper}</div>
    </button>
  );
}

interface MaterialChipProps {
  material: ChatMaterialDisplay;
  onRemove?: (materialId: string) => void;
  readOnly?: boolean;
}

export function MaterialChip({ material, onRemove, readOnly = false }: MaterialChipProps) {
  const option = getMaterialOption(material.kind);
  const Icon = option.icon;
  const detail = [
    material.fileName || material.note || '',
    formatFileSize(material.size),
    material.imageIncluded ? '已带图' : material.hasImage ? '图片摘要' : '',
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <div className="group inline-flex max-w-full items-center gap-2 rounded-lg border border-[color:var(--line)] bg-[color:var(--paper)] px-2.5 py-2 text-xs text-[color:var(--ink)]">
      {material.previewUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={material.previewUrl} alt={material.label} className="h-8 w-8 rounded-md object-cover" />
      ) : (
        <span className="flex h-8 w-8 items-center justify-center rounded-md bg-[color:var(--accent-soft)] text-[color:var(--accent-strong)]">
          <Icon className="h-4 w-4" />
        </span>
      )}
      <span className="min-w-0">
        <span className="block font-bold">{material.label}</span>
        {detail ? <span className="block max-w-[14rem] truncate text-[11px] text-[color:var(--muted)]">{detail}</span> : null}
      </span>
      {!readOnly && onRemove ? (
        <button
          type="button"
          onClick={() => onRemove(material.id)}
          className="rounded-full p-1 text-[color:var(--muted)] transition hover:bg-[color:var(--bg-sunken)] hover:text-[color:var(--ink)]"
          aria-label={`移除${material.label}`}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      ) : null}
    </div>
  );
}
