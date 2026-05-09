'use client';

type SubmitButtonProps = {
  canSubmit: boolean;
  label: string;
  error?: string;
};

export default function SubmitButton({ canSubmit, label, error }: SubmitButtonProps) {
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

      <button
        type="submit"
        disabled={!canSubmit}
        className={`flex h-12 w-full items-center justify-center rounded-full text-base font-bold transition md:h-14 ${
          canSubmit ? 'bg-[color:var(--ink)] text-white' : 'bg-[#d8d2c6] text-[#7c7467]'
        }`}
      >
        {label}
      </button>
    </>
  );
}
