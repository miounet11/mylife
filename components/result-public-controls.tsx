'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import QRCode from 'qrcode';
import {
  Copy,
  Download,
  Eye,
  EyeOff,
  ExternalLink,
  FileText,
  QrCode,
  Share2,
} from 'lucide-react';

const BRAND_NAME = '人生K线';
const DEFAULT_SITE_ORIGIN = 'https://www.life-kline.com';

type ShareHighlight = {
  label: string;
  value: string;
};

function getSiteOrigin() {
  if (typeof window === 'undefined') {
    return DEFAULT_SITE_ORIGIN;
  }

  const currentOrigin = window.location.origin;
  if (currentOrigin.includes('localhost') || currentOrigin.includes('127.0.0.1')) {
    return DEFAULT_SITE_ORIGIN;
  }

  return currentOrigin;
}

function buildAbsoluteUrl(path: string) {
  return `${getSiteOrigin()}${path}`;
}

function escapeHtml(input: string) {
  return input
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export default function ResultPublicControls({
  reportId,
  initialIsPublic,
  canManage,
  publicName,
  reportVersion,
  deliveryTierLabel,
  reasoningModeLabel,
  summary,
  nextFocusSummary,
  highlights,
}: {
  reportId: string;
  initialIsPublic: boolean;
  canManage: boolean;
  publicName: string;
  reportVersion: string;
  deliveryTierLabel: string;
  reasoningModeLabel: string;
  summary: string;
  nextFocusSummary: string;
  highlights: ShareHighlight[];
}) {
  const [isPublic, setIsPublic] = useState(initialIsPublic);
  const [loading, setLoading] = useState(false);
  const [copiedKey, setCopiedKey] = useState('');
  const [message, setMessage] = useState('');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const posterRef = useRef<HTMLDivElement | null>(null);

  const reportUrl = buildAbsoluteUrl(`/result/${reportId}`);
  const analyzeUrl = buildAbsoluteUrl('/analyze');
  const activeShareUrl = isPublic ? reportUrl : analyzeUrl;
  const activeShareTitle = isPublic ? `${publicName}的结构判断报告` : `${BRAND_NAME}判断入口`;
  const activeShareText = isPublic
    ? `${publicName}的结构判断报告`
    : `${BRAND_NAME}判断入口`;
  const posterFooter = isPublic
    ? '扫码查看结果'
    : '扫码进入入口';

  useEffect(() => {
    let cancelled = false;

    void QRCode.toDataURL(activeShareUrl, {
      margin: 1,
      width: 220,
      color: {
        dark: '#221a12',
        light: '#fffdf8',
      },
    })
      .then((dataUrl) => {
        if (!cancelled) {
          setQrCodeDataUrl(dataUrl);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setQrCodeDataUrl('');
        }
      });

    return () => {
      cancelled = true;
    };
  }, [activeShareUrl]);

  const showMessage = (value: string) => {
    setMessage(value);
    window.setTimeout(() => setMessage(''), 2200);
  };

  const handleCopy = async (value: string, key: string, successText: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedKey(key);
      showMessage(successText);
      window.setTimeout(() => setCopiedKey(''), 1800);
    } catch {
      showMessage('复制失败，请手动复制');
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: activeShareTitle,
          text: activeShareText,
          url: activeShareUrl,
        });
        showMessage('已打开系统分享');
        return;
      } catch {
        // fallback
      }
    }

    await handleCopy(activeShareUrl, 'share', '已复制分享链接');
  };

  const handleOpenX = () => {
    const text = isPublic
      ? `${publicName}的结构判断报告`
      : `${BRAND_NAME}判断入口`;
    const xUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(activeShareUrl)}`;
    window.open(xUrl, '_blank', 'noopener,noreferrer');
  };

  const handleExportImage = async () => {
    if (!posterRef.current) {
      showMessage('导出卡片未准备好');
      return;
    }

    try {
      const dataUrl = await toPng(posterRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: '#fffdf8',
      });
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `${reportId}-${isPublic ? 'report' : 'entry'}-share.png`;
      link.click();
      showMessage('分享长图已导出');
    } catch {
      showMessage('长图导出失败，请稍后重试');
    }
  };

  const handleExportDocument = () => {
    const printWindow = window.open('', '_blank', 'noopener,noreferrer,width=960,height=860');
    if (!printWindow) {
      showMessage('浏览器拦截了文档窗口');
      return;
    }

    const safeSummary = escapeHtml(summary);
    const safeNextFocus = escapeHtml(nextFocusSummary);
    const highlightMarkup = highlights
      .map((item) => {
        return `
          <div class="metric">
            <div class="metric-label">${escapeHtml(item.label)}</div>
            <div class="metric-value">${escapeHtml(item.value)}</div>
          </div>
        `;
      })
      .join('');

    const qrMarkup = qrCodeDataUrl
      ? `<img src="${qrCodeDataUrl}" alt="二维码" class="qr" />`
      : `<div class="qr qr-fallback">${escapeHtml(activeShareUrl)}</div>`;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="zh-CN">
        <head>
          <meta charset="utf-8" />
          <title>${escapeHtml(activeShareTitle)}</title>
          <style>
            :root {
              color-scheme: light;
            }
            * {
              box-sizing: border-box;
            }
            body {
              margin: 0;
              padding: 36px;
              font-family: "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
              color: #221a12;
              background: #f6f1e8;
            }
            .sheet {
              max-width: 920px;
              margin: 0 auto;
              border: 1px solid rgba(122, 95, 58, 0.16);
              border-radius: 28px;
              overflow: hidden;
              background: #fffdf8;
              box-shadow: 0 24px 60px rgba(80, 55, 24, 0.08);
            }
            .hero {
              padding: 36px;
              background: linear-gradient(135deg, rgba(178, 149, 93, 0.18), rgba(201, 125, 58, 0.08));
              border-bottom: 1px solid rgba(122, 95, 58, 0.16);
            }
            .eyebrow {
              font-size: 12px;
              letter-spacing: 0.24em;
              text-transform: uppercase;
              color: #6d5b46;
            }
            h1 {
              margin: 16px 0 0;
              font-size: 34px;
              line-height: 1.25;
            }
            p {
              margin: 0;
              line-height: 1.8;
            }
            .summary {
              margin-top: 18px;
              font-size: 16px;
              color: #4b4032;
            }
            .chips {
              display: flex;
              flex-wrap: wrap;
              gap: 10px;
              margin-top: 18px;
            }
            .chip {
              border-radius: 999px;
              background: rgba(178, 149, 93, 0.16);
              color: #8b7346;
              font-size: 12px;
              font-weight: 700;
              padding: 8px 12px;
            }
            .content {
              display: grid;
              grid-template-columns: minmax(0, 1.2fr) minmax(260px, 0.8fr);
              gap: 24px;
              padding: 28px 36px 36px;
            }
            .section-title {
              font-size: 13px;
              font-weight: 700;
              letter-spacing: 0.16em;
              text-transform: uppercase;
              color: #6d5b46;
            }
            .section-body {
              margin-top: 14px;
              font-size: 15px;
              color: #33271d;
            }
            .metrics {
              display: grid;
              gap: 12px;
              grid-template-columns: repeat(2, minmax(0, 1fr));
              margin-top: 18px;
            }
            .metric {
              border: 1px solid rgba(122, 95, 58, 0.16);
              border-radius: 18px;
              background: #fff;
              padding: 14px 16px;
            }
            .metric-label {
              font-size: 12px;
              letter-spacing: 0.14em;
              text-transform: uppercase;
              color: #6d5b46;
            }
            .metric-value {
              margin-top: 8px;
              font-size: 18px;
              font-weight: 700;
              color: #221a12;
            }
            .panel {
              border: 1px solid rgba(122, 95, 58, 0.16);
              border-radius: 22px;
              background: rgba(246, 241, 232, 0.55);
              padding: 20px;
            }
            .qr {
              width: 180px;
              height: 180px;
              border-radius: 22px;
              background: #fff;
              padding: 12px;
              display: block;
            }
            .qr-fallback {
              width: auto;
              height: auto;
              font-size: 12px;
              line-height: 1.7;
              word-break: break-all;
            }
            .url {
              margin-top: 12px;
              font-size: 12px;
              color: #6d5b46;
              word-break: break-all;
            }
            .footer {
              margin-top: 16px;
              font-size: 13px;
              color: #4b4032;
            }
            @media print {
              body {
                padding: 0;
                background: #fff;
              }
              .sheet {
                box-shadow: none;
                border: none;
                border-radius: 0;
              }
            }
          </style>
        </head>
        <body>
          <div class="sheet">
            <div class="hero">
              <div class="eyebrow">${BRAND_NAME} | ${escapeHtml(getSiteOrigin().replace(/^https?:\/\//, ''))}</div>
              <h1>${escapeHtml(activeShareTitle)}</h1>
              <p class="summary">${safeSummary}</p>
              <div class="chips">
                <span class="chip">${escapeHtml(reportVersion)}</span>
                <span class="chip">${escapeHtml(deliveryTierLabel)}</span>
                <span class="chip">${escapeHtml(reasoningModeLabel)}</span>
              </div>
            </div>
            <div class="content">
              <div>
                <div class="section-title">关键判断</div>
                <p class="section-body">${safeNextFocus}</p>
                <div class="metrics">${highlightMarkup}</div>
              </div>
              <div class="panel">
                <div class="section-title">${isPublic ? '扫码看结果' : '扫码去判断'}</div>
                <div class="section-body">${escapeHtml(posterFooter)}</div>
                <div style="margin-top:16px;">${qrMarkup}</div>
                <div class="url">${escapeHtml(activeShareUrl)}</div>
                <div class="footer">品牌名称：${BRAND_NAME}<br />域名：${escapeHtml(getSiteOrigin().replace(/^https?:\/\//, ''))}</div>
              </div>
            </div>
          </div>
          <script>
            window.addEventListener('load', function () {
              setTimeout(function () {
                window.print();
              }, 160);
            });
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
    showMessage('已打开文档导出窗口');
  };

  const handleTogglePublic = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/fortune/${reportId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublic: !isPublic }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || '更新失败');
      }
      setIsPublic(!!data.data?.isPublic);
    } catch {
      // keep current UI state on failure
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div
        ref={posterRef}
        className="overflow-hidden rounded-[1.75rem] border border-[color:var(--line)] bg-[linear-gradient(135deg,rgba(255,253,248,0.98),rgba(246,241,232,0.92))]"
      >
        <div className="border-b border-[color:var(--line)] bg-[linear-gradient(135deg,rgba(178,149,93,0.18),rgba(201,125,58,0.08))] px-5 py-5">
          <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[color:var(--muted)]">
            {BRAND_NAME} · {getSiteOrigin().replace(/^https?:\/\//, '')}
          </div>
          <div className="mt-3 text-2xl font-black leading-tight text-[color:var(--ink)]">
            {isPublic ? `${publicName}的结构判断结果` : `${BRAND_NAME} 判断入口`}
          </div>
          <p className="intro-copy mt-3 text-sm text-[color:var(--ink)]">{summary}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[color:var(--accent-strong)]">
              {reportVersion}
            </span>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[color:var(--accent-strong)]">
              {deliveryTierLabel}
            </span>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[color:var(--accent-strong)]">
              {reasoningModeLabel}
            </span>
          </div>
        </div>

        <div className="grid gap-4 px-5 py-5 md:grid-cols-[1.08fr_0.92fr]">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[color:var(--muted)]">传播重点</div>
            <div className="mt-3 rounded-[1.35rem] bg-white/80 px-4 py-4 text-xs leading-6 text-[color:var(--ink)]">
              {nextFocusSummary}
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {highlights.map((item) => (
                <div key={item.label} className="rounded-[1.25rem] border border-[color:var(--line)] bg-white px-4 py-4">
                  <div className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--muted)]">{item.label}</div>
                  <div className="mt-2 text-base font-bold text-[color:var(--ink)]">{item.value}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-[color:var(--line)] bg-white px-4 py-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-[color:var(--ink)]">
              <QrCode className="h-4 w-4 text-[color:var(--accent-strong)]" />
              {isPublic ? '扫码查看结果' : '扫码进入入口'}
            </div>
            <div className="mt-3 text-sm text-[color:var(--ink)]">{posterFooter}</div>
            <div className="mt-4 flex justify-center rounded-[1.5rem] bg-[rgba(246,241,232,0.7)] p-4">
              {qrCodeDataUrl ? (
                <Image
                  src={qrCodeDataUrl}
                  alt="分享二维码"
                  width={176}
                  height={176}
                  unoptimized
                  className="h-44 w-44 rounded-2xl bg-white p-3"
                />
              ) : (
                <div className="flex h-44 w-44 items-center justify-center rounded-2xl bg-white text-sm text-[color:var(--muted)]">
                  生成中...
                </div>
              )}
            </div>
            <div className="mt-3 break-all rounded-2xl bg-slate-50 px-4 py-3 text-sm text-[color:var(--ink)]">
              {activeShareUrl}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <button
          type="button"
          onClick={() => void handleShare()}
          className="action-secondary"
        >
          <Share2 className="h-4 w-4" />
          系统分享
        </button>

        <button
          type="button"
          onClick={() => void handleCopy(activeShareUrl, 'active', isPublic ? '已复制结果链接' : '已复制判断入口')}
          className="action-secondary"
        >
          <Copy className="h-4 w-4" />
          {copiedKey === 'active' ? '已复制链接' : isPublic ? '复制结果链接' : '复制判断入口'}
        </button>

        <button
          type="button"
          onClick={handleOpenX}
          className="action-secondary"
        >
          <ExternalLink className="h-4 w-4" />
          分享到 X.com
        </button>

        <button
          type="button"
          onClick={() => void handleExportImage()}
          className="action-secondary"
        >
          <Download className="h-4 w-4" />
          导出分享长图
        </button>

        <button
          type="button"
          onClick={handleExportDocument}
          className="action-secondary"
        >
          <FileText className="h-4 w-4" />
          导出文档 / PDF
        </button>

        <button
          type="button"
          onClick={() => void handleCopy(analyzeUrl, 'analyze', '已复制判断入口')}
          className="action-secondary"
        >
          <Copy className="h-4 w-4" />
          {copiedKey === 'analyze' ? '已复制入口' : '复制判断入口'}
        </button>

        {canManage && (
          <button
            type="button"
            onClick={() => void handleTogglePublic()}
            disabled={loading}
            className="sm:col-span-2 xl:col-span-3 inline-flex items-center justify-center gap-2 rounded-full bg-[linear-gradient(135deg,var(--accent),var(--accent-strong))] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {isPublic ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            {loading ? '更新中...' : isPublic ? '设为私密' : '创建分享页'}
          </button>
        )}
      </div>

      <div className="rounded-[1.4rem] bg-slate-50 px-4 py-3 text-sm text-[color:var(--ink)]">
        {message || (isPublic ? '当前公开' : '当前私密')}
      </div>
    </div>
  );
}
