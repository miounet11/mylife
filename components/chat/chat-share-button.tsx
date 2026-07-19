'use client';

import { useState } from 'react';
import { Check, Share2 } from 'lucide-react';

/** Minimal share control for chat chrome — does not steal vertical space. */
export function ChatShareButton({
  title,
  text,
  path,
  locale,
}: {
  title: string;
  text: string;
  path: string;
  /** When en, button labels switch to English */
  locale?: string | null;
}) {
  const [done, setDone] = useState(false);
  const en = `${locale || ''}`.toLowerCase().startsWith('en');

  const run = async () => {
    const url =
      typeof window !== 'undefined'
        ? `${window.location.origin}${path.startsWith('/') ? path : `/${path}`}`
        : `https://www.life-kline.com${path}`;
    const body = `${text}\n${url}`;
    try {
      if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
        await navigator.share({ title, text, url });
        setDone(true);
        window.setTimeout(() => setDone(false), 1600);
        return;
      }
    } catch {
      /* fall through */
    }
    try {
      await navigator.clipboard.writeText(body);
      setDone(true);
      window.setTimeout(() => setDone(false), 1600);
    } catch {
      /* ignore */
    }
  };

  return (
    <button
      type="button"
      onClick={() => void run()}
      className="inline-flex items-center gap-0.5 underline-offset-2 hover:text-[color:var(--ink-1)] hover:underline"
      title={en ? 'Share opening link' : '分享开场链接'}
    >
      {done ? <Check className="h-3 w-3" /> : <Share2 className="h-3 w-3" />}
      {done ? (en ? 'Copied' : '已复制') : en ? 'Share' : '分享'}
    </button>
  );
}
