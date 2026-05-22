'use client';

type SubmitButtonProps = {
  canSubmit: boolean;
  loading?: boolean;
  label: string;
  error?: string;
  /** 弹窗打开时隐藏移动端 sticky CTA，避免叠加在弹窗之上 */
  modalOpen?: boolean;
};

const ENABLED_CLASSES =
  'bg-[color:var(--fb-blue)] text-white hover:bg-[#365899]';
const DISABLED_CLASSES =
  'bg-[#f5f6f7] text-[color:var(--fb-ink-4)] border border-[#dddfe2] cursor-not-allowed';

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
      className={`${className} flex h-12 w-full items-center justify-center rounded-[2px] text-base font-bold transition disabled:cursor-not-allowed ${
        enabled ? ENABLED_CLASSES : DISABLED_CLASSES
      }`}
    >
      {loading ? '生成中…' : label}
    </button>
  );
}

export default function SubmitButton({ canSubmit, loading, label, error, modalOpen }: SubmitButtonProps) {
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

      {/* 移动端：sticky footer + safe-area；弹窗打开时隐藏 */}
      <div
        aria-hidden={modalOpen}
        className={`
          md:hidden fixed inset-x-0 bottom-0 z-40
          border-t border-[color:var(--hairline)] bg-[color:var(--paper)]/95 backdrop-blur
          px-3 pt-2 pb-[max(12px,env(safe-area-inset-bottom))]
          ${modalOpen ? 'hidden' : ''}
        `}
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
