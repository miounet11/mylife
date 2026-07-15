'use client';

import { useMemo, useState } from 'react';
import { Check, Copy, Link2, MessageCircle, Send, Share2, Sparkles } from 'lucide-react';
import {
  MOVEMENT_TAGLINE,
  SITE_CANONICAL,
  buildSharePlatforms,
  type SharePlatform,
  type SharePlatformId,
} from '@/lib/marketing-movement';
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

function PlatformGlyph({ id }: { id: SharePlatformId }) {
  const className = 'h-3.5 w-3.5 shrink-0';
  const badge = (label: string, size = 'text-[10px]') => (
    <span
      className={cn(
        className,
        'inline-flex items-center justify-center font-black leading-none',
        size
      )}
    >
      {label}
    </span>
  );
  switch (id) {
    case 'x':
      return badge('𝕏', 'text-[12px]');
    case 'facebook':
      return badge('f', 'text-[13px]');
    case 'tiktok':
      return badge('TT');
    case 'telegram':
      return <Send className={className} />;
    case 'whatsapp':
      return <MessageCircle className={className} />;
    case 'linkedin':
      return badge('in');
    case 'reddit':
      return badge('r/');
    case 'threads':
      return badge('@', 'text-[12px]');
    case 'line':
      return badge('LN', 'text-[9px]');
    case 'weibo':
      return badge('微', 'text-[11px]');
    case 'copy':
      return <Copy className={className} />;
    case 'system':
      return <Share2 className={className} />;
    default:
      return <Link2 className={className} />;
  }
}

const PRIMARY_IDS: SharePlatformId[] = [
  'x',
  'facebook',
  'tiktok',
  'telegram',
  'whatsapp',
  'threads',
  'weibo',
  'copy',
];

export default function SocialShareBar({
  text = MOVEMENT_TAGLINE,
  url = SITE_CANONICAL,
  title = '人生K线 · Life K-Line',
  className,
  tone = 'dark',
  compact = false,
  primaryLabel = '一键分享人生K线',
}: {
  text?: string;
  url?: string;
  title?: string;
  className?: string;
  tone?: 'dark' | 'light';
  compact?: boolean;
  primaryLabel?: string;
}) {
  const [hint, setHint] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<SharePlatformId | null>(null);
  const [open, setOpen] = useState(!compact);

  const platforms = useMemo(
    () => buildSharePlatforms({ text, url, title }),
    [text, url, title]
  );
  const visible = platforms.filter((p) => PRIMARY_IDS.includes(p.id));
  const shareBody = text.includes(url) ? text : `${text}\n${url}`;

  const flash = (id: SharePlatformId | null, message: string) => {
    setActiveId(id);
    setHint(message);
    window.setTimeout(() => {
      setActiveId((current) => (current === id ? null : current));
    }, 2200);
  };

  const openPlatform = async (platform: SharePlatform) => {
    if (platform.id === 'system') {
      if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
        try {
          await navigator.share({ title, text, url });
          flash('system', platform.hint || '已唤起系统分享');
          return;
        } catch {
          // cancelled
          return;
        }
      }
      const ok = await copyText(shareBody);
      flash('system', ok ? '当前设备无系统分享，已复制文案与链接' : '分享失败，请手动复制');
      return;
    }

    if (platform.id === 'copy' || platform.copyFirst || !platform.href) {
      const ok = await copyText(shareBody);
      if (!ok) {
        flash(platform.id, '复制失败，请长按选择文本');
        return;
      }
      if (platform.href) {
        window.open(platform.href, '_blank', 'noopener,noreferrer');
        flash(platform.id, platform.hint || '已复制，请在打开的页面粘贴');
      } else {
        flash(platform.id, platform.hint || '已复制');
      }
      return;
    }

    window.open(platform.href, '_blank', 'noopener,noreferrer');
    flash(platform.id, platform.hint || `已打开 ${platform.label}`);
  };

  const onPrimaryShare = async () => {
    // 移动端优先系统分享（可直达 X / FB / TikTok App）
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({ title, text, url });
        flash('system', '已唤起系统分享（可选 X / Facebook / TikTok 等）');
        return;
      } catch {
        // fall through to platform panel
      }
    }
    setOpen(true);
    // 桌面：直接打开 X 发帖框作为默认一键路径
    const x = platforms.find((p) => p.id === 'x');
    if (x?.href) {
      window.open(x.href, '_blank', 'noopener,noreferrer');
      flash('x', '已打开 X 发帖；也可点下方其它平台');
      return;
    }
    flash(null, '请选择下方平台一键转发');
  };

  const isDark = tone === 'dark';
  const chipStyle = isDark
    ? {
        border: '1px solid rgba(255,255,255,0.22)',
        background: 'rgba(255,255,255,0.1)',
        color: 'rgba(248,250,252,0.96)',
      }
    : undefined;

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void onPrimaryShare()}
          className={cn(
            'inline-flex h-9 items-center gap-1.5 rounded-[var(--radius)] px-3.5 text-[12px] font-bold transition hover:opacity-95',
            !isDark &&
              'border border-[color:var(--hairline)] bg-[color:var(--paper)] text-[color:var(--ink-1)] hover:border-[color:var(--brand)]'
          )}
          style={
            isDark
              ? { background: '#ffffff', color: '#0f172a' }
              : undefined
          }
        >
          <Sparkles
            className="h-3.5 w-3.5"
            style={isDark ? { color: '#1d4ed8' } : undefined}
          />
          {primaryLabel}
        </button>
        {!open ? (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className={cn(
              'inline-flex h-9 items-center gap-1.5 rounded-[var(--radius)] px-3 text-[12px] font-semibold transition',
              !isDark &&
                'border border-[color:var(--hairline)] text-[color:var(--ink-2)] hover:border-[color:var(--brand)]'
            )}
            style={chipStyle}
          >
            <Share2 className="h-3.5 w-3.5" />
            更多平台
          </button>
        ) : null}
      </div>

      {open ? (
        <div
          className={cn(
            'flex flex-wrap gap-1.5',
            !isDark && 'rounded-[var(--radius)] border border-[color:var(--hairline)] bg-[color:var(--bg-sunken)]/40 p-2'
          )}
          role="group"
          aria-label="社交平台一键分享"
        >
          {visible.map((platform) => {
            const active = activeId === platform.id;
            return (
              <button
                key={platform.id}
                type="button"
                onClick={() => void openPlatform(platform)}
                title={platform.hint || platform.label}
                className={cn(
                  'inline-flex h-8 items-center gap-1 rounded-full px-2.5 text-[11px] font-semibold transition hover:opacity-95',
                  !isDark &&
                    'border border-[color:var(--hairline)] bg-[color:var(--paper)] text-[color:var(--ink-2)] hover:border-[color:var(--brand)] hover:text-[color:var(--brand-strong)]',
                  active && !isDark && 'border-emerald-300 text-emerald-700'
                )}
                style={
                  isDark
                    ? {
                        border: active
                          ? '1px solid rgba(167,243,208,0.55)'
                          : '1px solid rgba(255,255,255,0.2)',
                        background: active
                          ? 'rgba(16,185,129,0.22)'
                          : 'rgba(255,255,255,0.1)',
                        color: active ? '#a7f3d0' : 'rgba(248,250,252,0.95)',
                      }
                    : undefined
                }
              >
                {active && platform.id === 'copy' ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <PlatformGlyph id={platform.id} />
                )}
                {platform.label}
              </button>
            );
          })}
        </div>
      ) : null}

      {hint ? (
        <p
          className="text-[11px] font-medium"
          style={isDark ? { color: '#a7f3d0' } : undefined}
          role="status"
        >
          {hint}
        </p>
      ) : open ? (
        <p
          className="text-[11px]"
          style={isDark ? { color: 'rgba(226,232,240,0.72)' } : undefined}
        >
          点平台按钮会直接打开对应分享页；TikTok 会先复制文案再打开创作页。
        </p>
      ) : null}
    </div>
  );
}
