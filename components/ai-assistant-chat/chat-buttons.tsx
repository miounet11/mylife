import { X } from 'lucide-react';
import {
  formatFileSize,
  getMaterialOption,
  type ChatMaterialDisplay,
} from '@/components/ai-assistant-chat/chat-helpers';

// v5-D60: FB Messenger 2017 风浅灰按钮 + tag 风 chip

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
      className="fb-btn block w-full px-3 py-2 text-left text-[13px] leading-5 text-[#1d2129] disabled:cursor-not-allowed disabled:opacity-60"
    >
      <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[#606770]">结构化追问</div>
      <div className="mt-1 text-[13px] text-[#1d2129]">{question}</div>
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
      className="fb-btn block w-full px-3 py-2 text-left disabled:cursor-not-allowed disabled:opacity-60"
    >
      <div className="text-[13px] font-semibold leading-5 text-[#1d2129]">{question}</div>
      <div className="mt-1 text-[12px] text-[#606770]">{helper}</div>
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
    <div className="group inline-flex max-w-full items-center gap-2 rounded-[4px] border border-[#dddfe2] bg-[#f5f6f7] px-2 py-1 text-[12px] text-[#1d2129]">
      {material.previewUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={material.previewUrl} alt={material.label} className="h-7 w-7 rounded-[3px] object-cover" />
      ) : (
        <span className="flex h-7 w-7 items-center justify-center rounded-[3px] bg-[#e9ebee] text-[#3b5998]">
          <Icon className="h-3.5 w-3.5" />
        </span>
      )}
      <span className="min-w-0">
        <span className="block font-semibold">{material.label}</span>
        {detail ? <span className="block max-w-[14rem] truncate text-xs text-[#606770]">{detail}</span> : null}
      </span>
      {!readOnly && onRemove ? (
        <button
          type="button"
          onClick={() => onRemove(material.id)}
          className="rounded-[3px] p-0.5 text-[#606770] transition hover:bg-[#dddfe2] hover:text-[#1d2129]"
          aria-label={`移除${material.label}`}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      ) : null}
    </div>
  );
}
