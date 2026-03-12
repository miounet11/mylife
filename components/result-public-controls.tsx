'use client';

import { useState } from 'react';
import { Copy, Eye, EyeOff, Share2 } from 'lucide-react';

export default function ResultPublicControls({
  reportId,
  initialIsPublic,
  canManage,
  publicName,
}: {
  reportId: string;
  initialIsPublic: boolean;
  canManage: boolean;
  publicName: string;
}) {
  const [isPublic, setIsPublic] = useState(initialIsPublic);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareUrl =
    typeof window !== 'undefined' ? window.location.href : `https://life-kline.com/result/${reportId}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  const handleShare = async () => {
    if (!isPublic) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${publicName}的命理分析报告`,
          text: '查看这份公开命理分析结果',
          url: shareUrl,
        });
        return;
      } catch {
        // fallback
      }
    }

    await handleCopy();
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
    <div className="grid gap-3 sm:grid-cols-2">
      <button
        type="button"
        onClick={() => void handleShare()}
        disabled={!isPublic}
        className="inline-flex items-center justify-center gap-2 rounded-full border border-[color:var(--line)] bg-white px-4 py-3 text-sm font-semibold text-[color:var(--ink)]"
      >
        <Share2 className="h-4 w-4" />
        {isPublic ? '分享结果页' : '先公开后再分享'}
      </button>

      <button
        type="button"
        onClick={() => void handleCopy()}
        disabled={!isPublic}
        className="inline-flex items-center justify-center gap-2 rounded-full border border-[color:var(--line)] bg-white px-4 py-3 text-sm font-semibold text-[color:var(--ink)]"
      >
        <Copy className="h-4 w-4" />
        {isPublic ? (copied ? '已复制链接' : '复制链接') : '当前为私密报告'}
      </button>

      {canManage && (
        <button
          type="button"
          onClick={() => void handleTogglePublic()}
          disabled={loading}
          className="sm:col-span-2 inline-flex items-center justify-center gap-2 rounded-full bg-[linear-gradient(135deg,var(--accent),var(--accent-strong))] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
        >
          {isPublic ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          {loading ? '更新中...' : isPublic ? '当前公开，点击设为私密' : '当前私密，点击创建分享页'}
        </button>
      )}
    </div>
  );
}
