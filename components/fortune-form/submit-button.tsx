'use client';

type SubmitButtonProps = {
  canSubmit: boolean;
  loading?: boolean;
  label: string;
  error?: string;
};

export default function SubmitButton({ canSubmit, loading, label, error }: SubmitButtonProps) {
  return (
    <>
      {error ? (
        <div
          role="alert"
          className="rounded-[var(--radius-md)] border border-[#f1c5c5] bg-[#fff6f6] px-4 py-3 text-[14px] text-[#c24545]"
        >
          {error}
        </div>
      ) : null}

      {/* 桌面端：静态嵌入主卡 */}
      <button
        type="submit"
        disabled={!canSubmit || loading}
        className={`hidden md:flex h-12 w-full items-center justify-center rounded-full text-base font-bold transition md:h-14 ${
          canSubmit && !loading
            ? 'bg-[color:var(--ink-1)] text-white hover:bg-[color:var(--brand-deep)]'
            : 'bg-[#d8d2c6] text-[#7c7467]'
        }`}
      >
        {loading ? '生成中…' : label}
      </button>

      {/* 移动端：sticky footer + safe-area */}
      <div
        className="
          md:hidden fixed inset-x-0 bottom-0 z-40
          border-t border-[color:var(--hairline)] bg-[color:var(--paper)]/95 backdrop-blur
          px-3 pt-2 pb-[max(12px,env(safe-area-inset-bottom))]
        "
      >
        <button
          type="submit"
          disabled={!canSubmit || loading}
          className={`flex h-12 w-full items-center justify-center rounded-full text-base font-bold transition ${
            canSubmit && !loading
              ? 'bg-[color:var(--ink-1)] text-white'
              : 'bg-[#d8d2c6] text-[#7c7467]'
          }`}
        >
          {loading ? '生成中…' : label}
        </button>
      </div>

      {/* 移动端 sticky 占位，避免最后一项被遮挡 */}
      <div className="md:hidden h-20" aria-hidden />
    </>
  );
}
