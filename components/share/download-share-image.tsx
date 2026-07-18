'use client';

import { useCallback, useState } from 'react';
import { Check, ImageDown, Loader2 } from 'lucide-react';

export type ShareImageDrawProps = {
  brand?: string;
  title: string;
  lines?: string[];
  footerLeft?: string;
  footerRight?: string;
  /** Optional absolute URL for share fallback */
  pageUrl?: string;
  /** PNG pixel size; default portrait 1080×1350 */
  width?: number;
  height?: number;
};

const DEFAULT_W = 1080;
const DEFAULT_H = 1350;

/** Soft wrap for canvas text; returns lines that fit maxWidth. */
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines = 4,
): string[] {
  const raw = text.trim();
  if (!raw) return [];
  // Prefer wrapping on CJK boundaries / spaces
  const chars = Array.from(raw);
  const lines: string[] = [];
  let current = '';

  for (const ch of chars) {
    const trial = current + ch;
    if (ctx.measureText(trial).width <= maxWidth) {
      current = trial;
    } else {
      if (current) lines.push(current);
      current = ch;
      if (lines.length >= maxLines) break;
    }
  }
  if (current && lines.length < maxLines) lines.push(current);
  if (lines.length === maxLines && chars.join('').length > lines.join('').length) {
    const last = lines[maxLines - 1];
    lines[maxLines - 1] =
      last.length > 1 ? `${last.slice(0, -1)}…` : last;
  }
  return lines;
}

/**
 * Draw a Linear/editorial conclusion PNG via Canvas 2D.
 * No html2canvas / heavy deps. Safe for 小红书 / 微信 style shares.
 */
export function drawShareImageCanvas(props: ShareImageDrawProps): HTMLCanvasElement {
  const {
    brand = '人生K线',
    title,
    lines = [],
    footerLeft = '结构参考',
    footerRight = 'life-kline.com',
    width = DEFAULT_W,
    height = DEFAULT_H,
  } = props;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas 2D unavailable');
  }

  const padX = Math.round(width * 0.085);
  const contentW = width - padX * 2;

  // Background gradient (paper)
  const bg = ctx.createLinearGradient(0, 0, width * 0.2, height);
  bg.addColorStop(0, '#eef0f3');
  bg.addColorStop(0.42, '#ffffff');
  bg.addColorStop(1, '#f7f8f9');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  // Subtle top brand strip
  ctx.fillStyle = 'rgba(67, 56, 202, 0.06)';
  ctx.fillRect(0, 0, width, Math.round(height * 0.018));

  // Abstract K-line bars (bottom third)
  const baseY = height * 0.72;
  ctx.strokeStyle = '#d0d4db';
  ctx.setLineDash([6, 8]);
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, baseY);
  ctx.lineTo(width, baseY);
  ctx.stroke();
  ctx.setLineDash([]);

  const barSpecs = [
    [0.08, 0.12, 0.1],
    [0.16, 0.1, 0.13],
    [0.24, 0.11, 0.11],
    [0.32, 0.08, 0.15],
    [0.4, 0.09, 0.14],
    [0.48, 0.06, 0.18],
    [0.56, 0.085, 0.15],
    [0.64, 0.05, 0.2],
    [0.72, 0.08, 0.15],
    [0.8, 0.07, 0.17],
    [0.88, 0.1, 0.12],
  ] as const;
  const barW = width * 0.018;
  barSpecs.forEach(([xr, yOff, hFrac], i) => {
    const x = width * xr;
    const h = height * hFrac;
    const y = baseY - height * yOff - h * 0.35;
    const active = i === 7;
    ctx.fillStyle = active ? 'rgba(67, 56, 202, 0.88)' : 'rgba(208, 212, 219, 0.55)';
    const r = 3;
    roundRect(ctx, x, y, barW, h, r);
    ctx.fill();
  });

  // Gold diamond marker
  const dx = width * 0.84;
  const dy = baseY + height * 0.04;
  const ds = width * 0.016;
  ctx.fillStyle = 'rgba(201, 162, 39, 0.88)';
  ctx.beginPath();
  ctx.moveTo(dx, dy - ds);
  ctx.lineTo(dx + ds, dy);
  ctx.lineTo(dx, dy + ds);
  ctx.lineTo(dx - ds, dy);
  ctx.closePath();
  ctx.fill();

  // Brand mark square
  const markSize = Math.round(width * 0.055);
  const markY = Math.round(height * 0.07);
  ctx.fillStyle = '#4338ca';
  roundRect(ctx, padX, markY, markSize, markSize, 8);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = `700 ${Math.round(markSize * 0.48)}px ui-sans-serif, system-ui, "PingFang SC", "Noto Sans SC", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('K', padX + markSize / 2, markY + markSize / 2 + 1);

  // Brand text
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#0f1115';
  ctx.font = `600 ${Math.round(width * 0.032)}px ui-sans-serif, system-ui, "PingFang SC", "Noto Sans SC", sans-serif`;
  ctx.fillText(brand, padX + markSize + 16, markY + markSize * 0.42);
  ctx.fillStyle = '#8b929e';
  ctx.font = `500 ${Math.round(width * 0.018)}px ui-monospace, SFMono-Regular, Menlo, monospace`;
  ctx.fillText('LIFE KLINE', padX + markSize + 16, markY + markSize * 0.82);

  // Accent rule
  const ruleY = markY + markSize + Math.round(height * 0.04);
  ctx.fillStyle = 'rgba(67, 56, 202, 0.55)';
  ctx.fillRect(padX, ruleY, Math.round(width * 0.08), 2);

  // Title
  ctx.fillStyle = '#0f1115';
  const titleSize = Math.round(width * 0.052);
  ctx.font = `600 ${titleSize}px ui-sans-serif, system-ui, "PingFang SC", "Noto Sans SC", sans-serif`;
  const titleLines = wrapText(ctx, title, contentW, 3);
  let y = ruleY + Math.round(height * 0.05);
  const titleLineH = titleSize * 1.28;
  for (const tl of titleLines) {
    ctx.fillText(tl, padX, y);
    y += titleLineH;
  }

  // Supporting lines
  y += Math.round(height * 0.02);
  const bodySize = Math.round(width * 0.028);
  const bodyLineH = bodySize * 1.55;
  ctx.fillStyle = '#3c4149';
  ctx.font = `400 ${bodySize}px ui-sans-serif, system-ui, "PingFang SC", "Noto Sans SC", sans-serif`;
  const bodyLines = lines.filter(Boolean).slice(0, 3);
  for (const line of bodyLines) {
    const wrapped = wrapText(ctx, line, contentW, 2);
    for (const wl of wrapped) {
      ctx.fillText(wl, padX, y);
      y += bodyLineH;
    }
    y += Math.round(bodySize * 0.25);
  }

  // Disclaimer
  const discY = height - Math.round(height * 0.12);
  ctx.fillStyle = '#8b929e';
  ctx.font = `400 ${Math.round(width * 0.02)}px ui-sans-serif, system-ui, "PingFang SC", "Noto Sans SC", sans-serif`;
  const disc =
    '结构与节奏参考，不替代专业医疗 / 法律 / 投资意见。';
  ctx.fillText(disc, padX, discY);

  // Footer rule
  const footY = height - Math.round(height * 0.065);
  ctx.strokeStyle = '#e6e8eb';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(padX, footY - Math.round(height * 0.025));
  ctx.lineTo(width - padX, footY - Math.round(height * 0.025));
  ctx.stroke();

  ctx.fillStyle = '#6b7280';
  ctx.font = `500 ${Math.round(width * 0.022)}px ui-sans-serif, system-ui, "PingFang SC", "Noto Sans SC", sans-serif`;
  ctx.fillText(footerLeft, padX, footY);

  ctx.fillStyle = '#8b929e';
  ctx.font = `400 ${Math.round(width * 0.02)}px ui-monospace, SFMono-Regular, Menlo, monospace`;
  ctx.textAlign = 'right';
  ctx.fillText(footerRight, width - padX, footY);
  ctx.textAlign = 'left';

  return canvas;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/png');
  });
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.setTimeout(() => URL.revokeObjectURL(url), 4000);
}

async function tryCopyImageBlob(blob: Blob): Promise<boolean> {
  try {
    if (
      typeof navigator !== 'undefined' &&
      navigator.clipboard &&
      typeof ClipboardItem !== 'undefined'
    ) {
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob }),
      ]);
      return true;
    }
  } catch {
    /* clipboard image not supported */
  }
  return false;
}

export type DownloadShareImageButtonProps = ShareImageDrawProps & {
  className?: string;
  label?: string;
  /** Called after successful download / share attempt */
  onDone?: (result: 'downloaded' | 'shared' | 'copied') => void;
};

/**
 * Client control: draw branded 1080×1350 PNG via Canvas 2D and download.
 * Falls back to navigator.share(text+url) if canvas export fails.
 */
export function DownloadShareImageButton({
  className = '',
  label = '生成分享图',
  onDone,
  ...drawProps
}: DownloadShareImageButtonProps) {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const run = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    try {
      const canvas = drawShareImageCanvas(drawProps);
      const blob = await canvasToBlob(canvas);
      if (!blob) throw new Error('PNG encode failed');

      const safeTitle = (drawProps.title || 'conclusion')
        .replace(/[^\w\u4e00-\u9fff·\-]+/g, '_')
        .slice(0, 40);
      const filename = `人生K线_${safeTitle || 'share'}.png`;

      // Prefer download; try clipboard image in parallel when available
      triggerDownload(blob, filename);
      void tryCopyImageBlob(blob);

      // Optional Web Share with file when supported (mobile)
      try {
        const file = new File([blob], filename, { type: 'image/png' });
        const nav = navigator as Navigator & {
          canShare?: (data?: ShareData) => boolean;
        };
        if (
          typeof navigator.share === 'function' &&
          typeof nav.canShare === 'function' &&
          nav.canShare({ files: [file] })
        ) {
          // Do not auto-open share sheet after download — user already got the file.
          // Keep path for callers that want share-only; download is primary.
        }
      } catch {
        /* ignore share-file probe */
      }

      setDone(true);
      onDone?.('downloaded');
      window.setTimeout(() => setDone(false), 2000);
    } catch {
      // Text + URL fallback
      const pageUrl =
        drawProps.pageUrl ||
        (typeof window !== 'undefined'
          ? window.location.href
          : 'https://www.life-kline.com/');
      const text = [
        drawProps.brand || '人生K线',
        drawProps.title,
        ...(drawProps.lines || []).filter(Boolean).slice(0, 3),
        '结构参考 · life-kline.com',
        pageUrl,
      ]
        .filter(Boolean)
        .join('\n');

      try {
        if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
          await navigator.share({
            title: (drawProps.title || '人生K线').slice(0, 80),
            text,
            url: pageUrl,
          });
          setDone(true);
          onDone?.('shared');
          window.setTimeout(() => setDone(false), 2000);
          return;
        }
      } catch {
        /* fall through */
      }

      try {
        await navigator.clipboard.writeText(text);
        setDone(true);
        onDone?.('copied');
        window.setTimeout(() => setDone(false), 2000);
      } catch {
        /* ignore */
      }
    } finally {
      setBusy(false);
    }
  }, [busy, drawProps, onDone]);

  return (
    <button
      type="button"
      onClick={() => void run()}
      disabled={busy}
      className={
        className ||
        'inline-flex h-8 items-center gap-1.5 rounded-[6px] border border-[color:var(--hairline-strong)] bg-[color:var(--paper)] px-3 text-[12px] font-medium text-[color:var(--ink-2)] hover:border-[color:var(--brand)] disabled:opacity-60'
      }
    >
      {busy ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : done ? (
        <Check className="h-3.5 w-3.5 text-[color:var(--data-up)]" />
      ) : (
        <ImageDown className="h-3.5 w-3.5" />
      )}
      {busy ? '生成中…' : done ? '已下载' : label}
    </button>
  );
}

/** Programmatic helper for callers that do not need the button UI. */
export async function downloadShareImage(
  props: ShareImageDrawProps,
): Promise<'downloaded' | 'shared' | 'copied' | 'failed'> {
  try {
    const canvas = drawShareImageCanvas(props);
    const blob = await canvasToBlob(canvas);
    if (!blob) return 'failed';
    const safeTitle = (props.title || 'conclusion')
      .replace(/[^\w\u4e00-\u9fff·\-]+/g, '_')
      .slice(0, 40);
    triggerDownload(blob, `人生K线_${safeTitle || 'share'}.png`);
    void tryCopyImageBlob(blob);
    return 'downloaded';
  } catch {
    return 'failed';
  }
}
