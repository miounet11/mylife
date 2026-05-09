'use client';

type SubmitButtonProps = {
  canSubmit: boolean;
  loading?: boolean;
  label: string;
  error?: string;
};

const ENABLED_CLASSES =
  'bg-[color:var(--ink-1)] text-white hover:bg-[color:var(--brand-deep)]';
const DISABLED_CLASSES =
  'bg-[color:var(--bg-sunken)] text-[color:var(--ink-5)] cursor-not-allowed';

function CtaButton({
  canSubmit,
  loading,
  label,
  className,
}: {
  canSubmit: boolean;
  loading?: boolean;
  label: string;
  className: string;
}) {
  const enabled = canSubmit && !loading;
  return (
    <button
      type="submit"
      disabled={!enabled}
      className={`${className} flex h-12 w-full items-center justify-center rounded-full text-base font-bold transition disabled:cursor-not-allowed ${
        enabled ? ENABLED_CLASSES : DISABLED_CLASSES
      }`}
    >
      {loading ? '生成中…' : label}
    </button>
  );
}

export default function SubmitButton({ canSubmit, loading, label, error }: SubmitButtonProps) {
  return (
    <>
      {error ? (
        <div
          role="alert"
          className="rounded-[var(--radius-md)] border border-[color:var(--alert)]/40 bg-[color:var(--alert-soft)] px-4 py-3 text-[14px] text-[color:var(--alert)]"
        >
          {error}
        </div>
      ) : null}

      {/* 桌面端：静态嵌入主卡 */}
      <CtaButton
        canSubmit={canSubmit}
        loading={loading}
        label={label}
        className="hidden md:flex md:h-14"
      />

      {/* 移动端：sticky footer + safe-area */}
      <div
        className="
          md:hidden fixed inset-x-0 bottom-0 z-40
          border-t border-[color:var(--hairline)] bg-[color:var(--paper)]/95 backdrop-blur
          px-3 pt-2 pb-[max(12px,env(safe-area-inset-bottom))]
        "
      >
        <CtaButton
          canSubmit={canSubmit}
          loading={loading}
          label={label}
          className=""
        />
      </div>

      {/* 移动端 sticky 占位，避免最后一项被遮挡 */}
      <div className="md:hidden h-20" aria-hidden />
    </>
  );
}
