'use client';

import { useCallback, useMemo, useState } from 'react';
import { Check, ImageDown, Loader2 } from 'lucide-react';
import {
  resolveReportChromeLocale,
  shareImageCopy,
} from '@/lib/i18n/report-chrome-copy';
import type { SiteLocale } from '@/lib/i18n/site-locale';

export type ShareImageDrawProps = {
  brand?: string;
  title: string;
  lines?: string[];
  footerLeft?: string;
  footerRight?: string;
  /** Canvas disclaimer line */
  disclaimer?: string;
  /** Optional absolute URL for share fallback */
  pageUrl?: string;
  /**
   * When set, draw a scannable QR (usually free /analyze invite).
   * Loaded at export time via public QR API (no npm dep).
   */
  qrUrl?: string;
  /** Caption under QR, e.g. 扫码免费测算 */
  qrCaption?: string;
  /** PNG pixel size; default portrait 1080×1350 */
  width?: number;
  height?: number;
  /** Filename prefix before title (default from locale) */
  filePrefix?: string;
  /** Text + URL share fallback trailing line */
  fallbackLine?: string;
  /**
   * Real Life K-Line overall scores (0–100) for bottom sparkline.
   * When present, replaces the abstract decorative bars.
   */
  sparkline?: number[];
  /** Index in sparkline for “you are here” (default last third) */
  sparklineHereIndex?: number;
  /** Preloaded QR image (set by exporter) */
  _qrImage?: HTMLImageElement | null;
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
/** Load QR via public endpoint (client-only; fails soft). */
export async function loadShareQrImage(
  data: string,
  size = 240,
): Promise<HTMLImageElement | null> {
  if (!data || typeof window === 'undefined') return null;
  try {
    const src = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=8&data=${encodeURIComponent(data)}`;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    await new Promise<void>((resolve, reject) => {
      const t = window.setTimeout(() => reject(new Error('qr timeout')), 8000);
      img.onload = () => {
        window.clearTimeout(t);
        resolve();
      };
      img.onerror = () => {
        window.clearTimeout(t);
        reject(new Error('qr error'));
      };
      img.src = src;
    });
    return img;
  } catch {
    return null;
  }
}

export function drawShareImageCanvas(props: ShareImageDrawProps): HTMLCanvasElement {
  const {
    brand = '人生K线',
    title,
    lines = [],
    footerLeft = '结构参考',
    footerRight = 'life-kline.com',
    disclaimer = '结构与节奏参考，不替代专业医疗 / 法律 / 投资意见。',
    width = DEFAULT_W,
    height = DEFAULT_H,
    sparkline,
    sparklineHereIndex,
    _qrImage,
    qrCaption = '扫码免费测算',
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
  ctx.fillStyle = 'rgba(11, 95, 85, 0.06)';
  ctx.fillRect(0, 0, width, Math.round(height * 0.018));

  // Bottom chart area: real sparkline when provided, else abstract bars
  const baseY = height * 0.72;
  drawBottomChart(ctx, {
    width,
    height,
    baseY,
    padX,
    sparkline,
    sparklineHereIndex,
  });

  // Brand mark square — teal plate + four-pillar K-line geometry
  const markSize = Math.round(width * 0.055);
  const markY = Math.round(height * 0.07);
  ctx.fillStyle = '#0b5f55';
  roundRect(ctx, padX, markY, markSize, markSize, 8);
  ctx.fill();
  // Four pillars (year/month/day solid/hour) in paper white
  const pillarInk = '#f5f7f2';
  const pW = markSize * 0.1;
  const pillars = [
    { x: 0.18, h: 0.42 },
    { x: 0.36, h: 0.58 },
    { x: 0.54, h: 0.72 }, // day pillar — solid "self"
    { x: 0.72, h: 0.38 },
  ];
  for (let i = 0; i < pillars.length; i++) {
    const p = pillars[i];
    const px = padX + markSize * p.x;
    const ph = markSize * p.h;
    const py = markY + markSize * 0.78 - ph;
    if (i === 2) {
      ctx.fillStyle = pillarInk;
      ctx.fillRect(px, py, pW, ph);
    } else {
      ctx.strokeStyle = pillarInk;
      ctx.lineWidth = Math.max(1.5, markSize * 0.06);
      ctx.strokeRect(px, py, pW, ph);
    }
  }
  // Gold signal diamond
  const dx = padX + markSize * 0.82;
  const dy = markY + markSize * 0.68;
  const dr = markSize * 0.08;
  ctx.fillStyle = '#c9a14a';
  ctx.beginPath();
  ctx.moveTo(dx, dy - dr);
  ctx.lineTo(dx + dr, dy);
  ctx.lineTo(dx, dy + dr);
  ctx.lineTo(dx - dr, dy);
  ctx.closePath();
  ctx.fill();

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
  ctx.fillStyle = 'rgba(11, 95, 85, 0.55)';
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

  // QR invite (bottom-right, above footer)
  if (_qrImage && _qrImage.complete && _qrImage.naturalWidth > 0) {
    const qrSize = Math.round(width * 0.168);
    const qrX = width - padX - qrSize;
    const qrY = height - Math.round(height * 0.22) - qrSize;
    // white plate
    ctx.fillStyle = '#ffffff';
    roundRect(ctx, qrX - 12, qrY - 12, qrSize + 24, qrSize + 48, 14);
    ctx.fill();
    ctx.strokeStyle = '#e6e8eb';
    ctx.lineWidth = 2;
    roundRect(ctx, qrX - 12, qrY - 12, qrSize + 24, qrSize + 48, 14);
    ctx.stroke();
    ctx.drawImage(_qrImage, qrX, qrY, qrSize, qrSize);
    ctx.fillStyle = '#3c4149';
    ctx.font = `600 ${Math.round(width * 0.018)}px ui-sans-serif, system-ui, "PingFang SC", "Noto Sans SC", sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(qrCaption, qrX + qrSize / 2, qrY + qrSize + 22);
    ctx.textAlign = 'left';
  }

  // Disclaimer
  const discY = height - Math.round(height * 0.12);
  ctx.fillStyle = '#8b929e';
  ctx.font = `400 ${Math.round(width * 0.02)}px ui-sans-serif, system-ui, "PingFang SC", "Noto Sans SC", sans-serif`;
  // leave room if QR present
  const discMaxW = _qrImage ? contentW * 0.62 : contentW;
  const discLines = wrapText(ctx, disclaimer, discMaxW, 2);
  let discDrawY = discY - (discLines.length > 1 ? Math.round(height * 0.018) : 0);
  for (const dl of discLines) {
    ctx.fillText(dl, padX, discDrawY);
    discDrawY += Math.round(height * 0.022);
  }

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

/** Bottom decoration: real Life K-Line sparkline or fallback abstract bars. */
function drawBottomChart(
  ctx: CanvasRenderingContext2D,
  opts: {
    width: number;
    height: number;
    baseY: number;
    padX: number;
    sparkline?: number[];
    sparklineHereIndex?: number;
  },
) {
  const { width, height, baseY, padX, sparkline, sparklineHereIndex } = opts;
  const scores = (sparkline || [])
    .map(Number)
    .filter((n) => Number.isFinite(n) && n > 0);

  // Baseline
  ctx.strokeStyle = '#d0d4db';
  ctx.setLineDash([6, 8]);
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, baseY);
  ctx.lineTo(width, baseY);
  ctx.stroke();
  ctx.setLineDash([]);

  if (scores.length >= 4) {
    const chartLeft = padX;
    const chartRight = width - padX;
    const chartW = chartRight - chartLeft;
    const chartTop = baseY - height * 0.22;
    const chartBottom = baseY - height * 0.02;
    const chartH = chartBottom - chartTop;
    const minS = Math.min(...scores);
    const maxS = Math.max(...scores);
    const span = Math.max(8, maxS - minS);
    const n = scores.length;
    const pts = scores.map((s, i) => {
      const x = chartLeft + (n === 1 ? chartW / 2 : (i / (n - 1)) * chartW);
      const t = (s - minS) / span;
      const y = chartBottom - t * chartH;
      return { x, y, s };
    });

    // Soft fill under curve
    ctx.beginPath();
    ctx.moveTo(pts[0]!.x, baseY);
    for (const p of pts) ctx.lineTo(p.x, p.y);
    ctx.lineTo(pts[pts.length - 1]!.x, baseY);
    ctx.closePath();
    const fill = ctx.createLinearGradient(0, chartTop, 0, baseY);
    fill.addColorStop(0, 'rgba(67, 56, 202, 0.18)');
    fill.addColorStop(1, 'rgba(67, 56, 202, 0.02)');
    ctx.fillStyle = fill;
    ctx.fill();

    // Line
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(67, 56, 202, 0.9)';
    ctx.lineWidth = Math.max(2.5, width * 0.0035);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    pts.forEach((p, i) => {
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    });
    ctx.stroke();

    // You-are-here marker
    let hereIdx =
      typeof sparklineHereIndex === 'number' &&
      sparklineHereIndex >= 0 &&
      sparklineHereIndex < n
        ? sparklineHereIndex
        : Math.min(n - 1, Math.max(0, Math.round(n * 0.72)));
    const here = pts[hereIdx]!;
    ctx.fillStyle = 'rgba(201, 162, 39, 0.95)';
    const ds = width * 0.012;
    ctx.beginPath();
    ctx.moveTo(here.x, here.y - ds * 1.4);
    ctx.lineTo(here.x + ds, here.y);
    ctx.lineTo(here.x, here.y + ds * 1.4);
    ctx.lineTo(here.x - ds, here.y);
    ctx.closePath();
    ctx.fill();

    // Tiny label
    ctx.fillStyle = '#6b7280';
    ctx.font = `500 ${Math.round(width * 0.016)}px ui-sans-serif, system-ui, "PingFang SC", sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('你在这里', here.x, baseY + height * 0.035);
    ctx.textAlign = 'left';
    return;
  }

  // Fallback abstract bars (legacy)
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
    roundRect(ctx, x, y, barW, h, 3);
    ctx.fill();
  });
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
  /** Busy / success button labels (defaults from locale) */
  generatingLabel?: string;
  downloadedLabel?: string;
  /** UI locale — English chrome when en; default zh-CN */
  locale?: string | null;
  /** Called after successful download / share attempt */
  onDone?: (result: 'downloaded' | 'shared' | 'copied') => void;
};

function resolveShareDrawProps(
  locale: SiteLocale,
  props: ShareImageDrawProps,
): ShareImageDrawProps {
  const chrome = shareImageCopy(locale);
  return {
    ...props,
    brand: props.brand ?? chrome.brand,
    footerLeft: props.footerLeft ?? chrome.footerLeft,
    disclaimer: props.disclaimer ?? chrome.disclaimer,
    filePrefix: props.filePrefix ?? chrome.filePrefix,
    fallbackLine: props.fallbackLine ?? chrome.fallbackLine,
  };
}

/**
 * Client control: draw branded 1080×1350 PNG via Canvas 2D and download.
 * Falls back to navigator.share(text+url) if canvas export fails.
 */
export function DownloadShareImageButton({
  className = '',
  label,
  generatingLabel,
  downloadedLabel,
  locale,
  onDone,
  ...drawProps
}: DownloadShareImageButtonProps) {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const siteLocale = resolveReportChromeLocale(locale);
  const chrome = useMemo(() => shareImageCopy(siteLocale), [siteLocale]);
  const resolvedLabel = label ?? chrome.label;
  const resolvedGenerating = generatingLabel ?? chrome.generating;
  const resolvedDownloaded = downloadedLabel ?? chrome.downloaded;

  const run = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    const resolved = resolveShareDrawProps(siteLocale, drawProps);
    try {
      let qrImage: HTMLImageElement | null = null;
      if (resolved.qrUrl) {
        qrImage = await loadShareQrImage(resolved.qrUrl);
      }
      const canvas = drawShareImageCanvas({ ...resolved, _qrImage: qrImage });
      const blob = await canvasToBlob(canvas);
      if (!blob) throw new Error('PNG encode failed');

      const safeTitle = (resolved.title || 'conclusion')
        .replace(/[^\w\u4e00-\u9fff·\-]+/g, '_')
        .slice(0, 40);
      const prefix = resolved.filePrefix || chrome.filePrefix;
      const filename = `${prefix}_${safeTitle || 'share'}.png`;

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
        resolved.pageUrl ||
        (typeof window !== 'undefined'
          ? window.location.href
          : 'https://www.life-kline.com/');
      const text = [
        resolved.brand || chrome.brand,
        resolved.title,
        ...(resolved.lines || []).filter(Boolean).slice(0, 3),
        resolved.fallbackLine || chrome.fallbackLine,
        pageUrl,
      ]
        .filter(Boolean)
        .join('\n');

      try {
        if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
          await navigator.share({
            title: (resolved.title || chrome.brand).slice(0, 80),
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
  }, [busy, chrome, drawProps, onDone, siteLocale]);

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
      {busy ? resolvedGenerating : done ? resolvedDownloaded : resolvedLabel}
    </button>
  );
}

/** Programmatic helper for callers that do not need the button UI. */
export async function downloadShareImage(
  props: ShareImageDrawProps & { locale?: string | null },
): Promise<'downloaded' | 'shared' | 'copied' | 'failed'> {
  try {
    const siteLocale = resolveReportChromeLocale(props.locale);
    const resolved = resolveShareDrawProps(siteLocale, props);
    const qrImage = resolved.qrUrl ? await loadShareQrImage(resolved.qrUrl) : null;
    const canvas = drawShareImageCanvas({ ...resolved, _qrImage: qrImage });
    const blob = await canvasToBlob(canvas);
    if (!blob) return 'failed';
    const safeTitle = (resolved.title || 'conclusion')
      .replace(/[^\w\u4e00-\u9fff·\-]+/g, '_')
      .slice(0, 40);
    const prefix = resolved.filePrefix || shareImageCopy(siteLocale).filePrefix;
    triggerDownload(blob, `${prefix}_${safeTitle || 'share'}.png`);
    void tryCopyImageBlob(blob);
    return 'downloaded';
  } catch {
    return 'failed';
  }
}
