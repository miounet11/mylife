'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Check,
  Copy,
  Crosshair,
  Github,
  Rocket,
  Send,
  ShieldAlert,
} from 'lucide-react';
import { SectionHeader } from '@/components/layout/section-header';
import SocialShareBar from '@/components/social-share-bar';
import {
  GROWTH_PLAYS,
  MOVEMENT_MISSION,
  MOVEMENT_TAGLINE,
  SHARE_LINES,
  SHIP_LOG,
  SITE_CANONICAL,
  buildSharePlatforms,
  buildTwitterIntent,
} from '@/lib/marketing-movement';
import {
  OFFICIAL_GITHUB_URL,
  OFFICIAL_TELEGRAM_HANDLE,
  OFFICIAL_TELEGRAM_URL,
} from '@/lib/site-social';
import { cn } from '@/lib/utils';

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const el = document.createElement('textarea');
      el.value = text;
      el.setAttribute('readonly', '');
      el.style.position = 'fixed';
      el.style.left = '-9999px';
      document.body.appendChild(el);
      el.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(el);
      return ok;
    } catch {
      return false;
    }
  }
}

export default function MarketingMovementPanel({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const onCopy = async (id: string, text: string) => {
    const ok = await copyText(text);
    setCopiedId(ok ? id : null);
    window.setTimeout(() => {
      setCopiedId((current) => (current === id ? null : current));
    }, 2000);
  };

  return (
    <section className={cn('space-y-4', className)} aria-label="传播与运动">
      {/* Do NOT use .fb-card here — it forces paper bg + ink text and washes out the dark hero. */}
      <div
        className="overflow-hidden rounded-[var(--radius-lg,16px)] border border-slate-800 shadow-[0_12px_40px_rgba(15,23,42,0.18)]"
        style={{
          background: 'linear-gradient(145deg, #0b1220 0%, #111827 48%, #1e1b4b 100%)',
          color: '#f8fafc',
        }}
      >
        <div className="relative p-5 md:p-7">
          <div
            className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full blur-3xl"
            style={{ background: 'rgba(59, 130, 246, 0.35)' }}
          />
          <div
            className="pointer-events-none absolute -bottom-12 left-8 h-40 w-40 rounded-full blur-3xl"
            style={{ background: 'rgba(251, 146, 60, 0.28)' }}
          />

          <div className="relative z-[1]">
            <div
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.08em]"
              style={{
                border: '1px solid rgba(255,255,255,0.18)',
                background: 'rgba(255,255,255,0.1)',
                color: 'rgba(248,250,252,0.88)',
              }}
            >
              <Rocket className="h-3.5 w-3.5" style={{ color: '#fdba74' }} />
              {MOVEMENT_MISSION.eyebrow}
            </div>
            <h2
              className="mt-3 max-w-3xl text-[22px] font-black leading-[1.25] tracking-[-0.02em] md:text-[28px]"
              style={{ color: '#ffffff' }}
            >
              {MOVEMENT_MISSION.title}
            </h2>
            <p
              className="mt-3 max-w-3xl text-[14px] leading-[1.65] md:text-[15px]"
              style={{ color: 'rgba(226,232,240,0.92)' }}
            >
              {MOVEMENT_MISSION.lead}
            </p>
            <p
              className="mt-4 inline-block rounded-[var(--radius)] px-3 py-2 text-[14px] font-bold"
              style={{
                border: '1px solid rgba(253, 186, 116, 0.45)',
                background: 'rgba(251, 146, 60, 0.18)',
                color: '#ffedd5',
              }}
            >
              「{MOVEMENT_TAGLINE}」
            </p>

            <div className="mt-5 space-y-3">
              <SocialShareBar
                text={MOVEMENT_TAGLINE}
                url={SITE_CANONICAL}
                title="人生K线 · Life K-Line"
                tone="dark"
                compact={false}
                primaryLabel="一键分享人生K线"
              />
              <div className="flex flex-wrap gap-2">
                <Link
                  href="/#analyze-workspace"
                  className="inline-flex h-9 items-center gap-1.5 rounded-[var(--radius)] px-3.5 text-[12px] font-bold no-underline transition hover:no-underline"
                  style={{
                    border: '1px solid rgba(255,255,255,0.28)',
                    background: 'rgba(255,255,255,0.12)',
                    color: '#ffffff',
                  }}
                >
                  先免费测算 <ArrowRight className="h-3.5 w-3.5" />
                </Link>
                <a
                  href={OFFICIAL_GITHUB_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-9 items-center gap-1.5 rounded-[var(--radius)] px-3.5 text-[12px] font-bold no-underline transition hover:no-underline"
                  style={{
                    border: '1px solid rgba(255,255,255,0.28)',
                    background: 'transparent',
                    color: 'rgba(248,250,252,0.95)',
                  }}
                >
                  <Github className="h-3.5 w-3.5" />
                  开源仓库
                </a>
                <a
                  href={OFFICIAL_TELEGRAM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-9 items-center gap-1.5 rounded-[var(--radius)] px-3.5 text-[12px] font-bold no-underline transition hover:no-underline"
                  style={{
                    border: '1px solid rgba(255,255,255,0.28)',
                    background: 'transparent',
                    color: 'rgba(248,250,252,0.95)',
                  }}
                >
                  <Send className="h-3.5 w-3.5" />
                  {OFFICIAL_TELEGRAM_HANDLE}
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {!compact ? (
        <>
          <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
            {MOVEMENT_MISSION.principles.map((item) => (
              <article key={item.key} className="fb-card p-4">
                <div className="text-[11px] font-bold uppercase tracking-[0.06em] text-[color:var(--brand-strong)]">
                  {item.title}
                </div>
                <p className="mt-2 text-[12px] leading-[1.55] text-[color:var(--ink-3)]">{item.body}</p>
              </article>
            ))}
          </div>

          <div id="enemies" className="grid gap-3 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="fb-card p-4 md:p-5">
              <div className="flex items-center gap-1.5 text-[13px] font-bold text-[color:var(--ink-1)]">
                <ShieldAlert className="h-4 w-4 text-red-500" />
                我们明确反对
              </div>
              <ul className="mt-3 space-y-2">
                {MOVEMENT_MISSION.enemies.map((item) => (
                  <li
                    key={item.label}
                    className="rounded-[var(--radius)] border border-red-100 bg-red-50/60 px-3 py-2"
                  >
                    <div className="text-[13px] font-semibold text-red-700">{item.label}</div>
                    <div className="mt-0.5 text-[11px] text-red-700/80">{item.why}</div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="fb-card p-4 md:p-5">
              <div className="flex items-center gap-1.5 text-[13px] font-bold text-[color:var(--ink-1)]">
                <Crosshair className="h-4 w-4 text-[color:var(--brand-strong)]" />
                我们公开承诺
              </div>
              <ul className="mt-3 space-y-2">
                {MOVEMENT_MISSION.promises.map((line) => (
                  <li key={line} className="flex items-start gap-2 text-[13px] text-[color:var(--ink-2)]">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-4 rounded-[var(--radius)] border border-[color:var(--hairline)] bg-[color:var(--bg-sunken)]/50 p-3">
                <div className="text-[11px] font-semibold text-[color:var(--ink-4)]">近期公开进展</div>
                <ul className="mt-2 space-y-1.5">
                  {SHIP_LOG.slice(0, 4).map((item) => (
                    <li key={`${item.date}-${item.title}`} className="flex gap-2 text-[12px]">
                      <span className="shrink-0 font-mono text-[color:var(--brand-strong)]">{item.date}</span>
                      <span className="text-[color:var(--ink-2)]">
                        <span className="font-semibold">{item.title}</span>
                        <span className="text-[color:var(--ink-4)]"> · {item.impact}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div id="share-lines" className="space-y-3">
            <SectionHeader
              eyebrow="可复制传播"
              title="像发推一样：短、有立场、能行动"
              description="马斯克式传播的核心不是硬广，而是可复述的立场句 + 可点开的演示。点复制即可转发。"
            />
            <div className="grid gap-2.5 md:grid-cols-2">
              {SHARE_LINES.map((line) => (
                <div key={line.id} className="fb-card flex flex-col p-3.5 md:p-4">
                  <div className="text-[10px] font-bold uppercase tracking-[0.06em] text-[color:var(--ink-4)]">
                    {line.channel}
                  </div>
                  <p className="mt-2 flex-1 text-[13px] font-medium leading-[1.55] text-[color:var(--ink-1)]">
                    {line.text}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => void onCopy(line.id, line.text)}
                      className="inline-flex h-8 items-center gap-1.5 rounded-[var(--radius)] border border-[color:var(--hairline)] bg-[color:var(--paper)] px-2.5 text-[11px] font-semibold text-[color:var(--ink-2)] transition hover:border-[color:var(--brand)] hover:text-[color:var(--brand-strong)]"
                    >
                      {copiedId === line.id ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-600" /> 已复制
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" /> 复制金句
                        </>
                      )}
                    </button>
                    {(() => {
                      const platforms = buildSharePlatforms({
                        text: line.text,
                        url: SITE_CANONICAL,
                      });
                      const quick = platforms.filter((p) =>
                        ['x', 'facebook', 'tiktok', 'telegram', 'whatsapp'].includes(p.id)
                      );
                      return quick.map((platform) => {
                        if (platform.copyFirst && platform.href) {
                          return (
                            <button
                              key={platform.id}
                              type="button"
                              onClick={() => {
                                void (async () => {
                                  await copyText(
                                    line.text.includes(SITE_CANONICAL)
                                      ? line.text
                                      : `${line.text}\n${SITE_CANONICAL}`
                                  );
                                  window.open(platform.href!, '_blank', 'noopener,noreferrer');
                                })();
                              }}
                              className="inline-flex h-8 items-center gap-1.5 rounded-[var(--radius)] border border-[color:var(--hairline)] px-2.5 text-[11px] font-semibold text-[color:var(--ink-3)] transition hover:border-[color:var(--ink-3)]"
                            >
                              {platform.label}
                            </button>
                          );
                        }
                        return (
                          <a
                            key={platform.id}
                            href={platform.href || buildTwitterIntent(line.text)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex h-8 items-center gap-1.5 rounded-[var(--radius)] border border-[color:var(--hairline)] px-2.5 text-[11px] font-semibold text-[color:var(--ink-3)] no-underline hover:border-[color:var(--ink-3)] hover:no-underline"
                          >
                            {platform.label}
                          </a>
                        );
                      });
                    })()}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <SectionHeader
              eyebrow="增长动作清单"
              title="传播不是玄学，是可重复的动作"
              description="先 wow，再金句，再立场，再开源透明，最后社区承接——每一步都能点。"
            />
            <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
              {GROWTH_PLAYS.map((play) => {
                const external = play.href.startsWith('http');
                const inner = (
                  <>
                    <div className="font-mono text-[11px] font-bold text-[color:var(--brand-strong)]">{play.step}</div>
                    <div className="mt-1 text-[14px] font-bold text-[color:var(--ink-1)]">{play.title}</div>
                    <p className="mt-1.5 flex-1 text-[12px] leading-[1.55] text-[color:var(--ink-3)]">{play.body}</p>
                    <div className="mt-3 inline-flex items-center gap-1 text-[12px] font-bold text-[color:var(--brand)]">
                      {play.cta} <ArrowRight className="h-3.5 w-3.5" />
                    </div>
                  </>
                );
                const className =
                  'fb-card flex h-full flex-col p-4 transition hover:border-[color:var(--brand)] hover:no-underline';
                if (external) {
                  return (
                    <a key={play.step} href={play.href} target="_blank" rel="noopener noreferrer" className={className}>
                      {inner}
                    </a>
                  );
                }
                return (
                  <Link key={play.step} href={play.href} className={className}>
                    {inner}
                  </Link>
                );
              })}
            </div>
          </div>
        </>
      ) : null}
    </section>
  );
}
