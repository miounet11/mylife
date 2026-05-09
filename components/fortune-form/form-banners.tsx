'use client';

type FormBannersProps = {
  hasEmailDelivery: boolean;
  verifiedEmail?: string;
  returnHref?: string;
  returnLabel?: string;
  returnSource?: string;
};

export default function FormBanners({
  hasEmailDelivery,
  verifiedEmail,
  returnHref,
  returnLabel,
  returnSource,
}: FormBannersProps) {
  if (!hasEmailDelivery && !(returnHref && returnLabel)) {
    return null;
  }

  return (
    <div className="space-y-2">
      {returnHref && returnLabel ? (
        <div className="rounded-[var(--radius)] border border-[color:var(--signal)] bg-[color:var(--signal-soft)] px-3 py-2 text-xs leading-5">
          <div className="font-mono text-[10px] tracking-[0.08em] uppercase text-[color:var(--signal-strong)]">
            当前目标
          </div>
          <div className="mt-0.5 text-[color:var(--ink-2)]">
            你是从「{returnLabel}」回来补综合判断的，完成后会带你回到原来的工具继续。
            {returnSource ? (
              <span className="ml-1 font-mono text-[color:var(--ink-5)]">· {returnSource}</span>
            ) : null}
          </div>
        </div>
      ) : null}

      {hasEmailDelivery && verifiedEmail ? (
        <div className="rounded-[var(--radius)] border border-[color:var(--data-up)]/40 bg-[rgba(47,125,82,0.06)] px-3 py-2 text-xs leading-5">
          <div className="font-mono text-[10px] tracking-[0.08em] uppercase text-[color:var(--data-up)]">
            结果通知
          </div>
          <div className="mt-0.5 text-[color:var(--ink-2)]">
            报告完成后邮件发送到{' '}
            <span className="font-mono text-[color:var(--data-up)]">{verifiedEmail}</span>
          </div>
        </div>
      ) : null}
    </div>
  );
}
