'use client';

/**
 * Sticky Chapter Ask Dock (v5-D4, 2026-05-16)
 *
 * 板块 4 升级：把报告页 5 处分散的 InlineAskCTA 收敛成一个浮动追问坞。
 * - 移动端：固定在视口底部
 * - 桌面端：固定在右下角
 * 通过 IntersectionObserver 监听 5 个章节锚点，根据当前可视区域切换预填问题。
 *
 * Why: 用户读完一段才想问，原来要回头找 inline 按钮；现在 dock 跟着章节走，
 *      读到哪就问到哪，预填问题随章节实时切换。
 * How: chapters 通过 props 传入（reportId/章节文案在 server 组件构造，dock 只负责切换）。
 */

import { useEffect, useRef, useState } from 'react';
import { MessageCircleQuestion, ArrowRight, X } from 'lucide-react';
import { buildChatHref } from '@/lib/chat-entry';
import ResultCtaLink from '@/components/result-cta-link';

export interface DockChapter {
  /** 对应 DOM 锚点 id（不含 #） */
  anchorId: string;
  /** 章节内部 key（用于埋点） */
  chapter: string;
  /** dock 上显示的短标题 */
  label: string;
  /** 跳转到 chat 时的预填问题 */
  question: string;
  /** 聊天 intent */
  intent?: string;
}

interface ChapterAskDockProps {
  reportId: string;
  chapters: DockChapter[];
  ctaStrategyKey?: string | null;
  sourceFamily?: string | null;
}

export default function ChapterAskDock({
  reportId,
  chapters,
  ctaStrategyKey,
  sourceFamily,
}: ChapterAskDockProps) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const lastIdxRef = useRef(0);

  useEffect(() => {
    if (!chapters.length) return;

    const observers: IntersectionObserver[] = [];
    const ratios: number[] = new Array(chapters.length).fill(0);

    chapters.forEach((ch, idx) => {
      const el = document.getElementById(ch.anchorId);
      if (!el) return;
      const observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            ratios[idx] = entry.isIntersecting ? entry.intersectionRatio : 0;
          }
          // 选当前可见比例最高的 chapter
          let best = -1;
          let bestRatio = 0;
          for (let i = 0; i < ratios.length; i += 1) {
            if (ratios[i] > bestRatio) {
              bestRatio = ratios[i];
              best = i;
            }
          }
          if (best >= 0 && best !== lastIdxRef.current) {
            lastIdxRef.current = best;
            setActiveIdx(best);
          }
          setVisible(bestRatio > 0);
        },
        {
          // 触顶 80px / 触底 30% 之内都算"正在阅读"
          rootMargin: '-80px 0px -30% 0px',
          threshold: [0, 0.15, 0.35, 0.6, 0.9],
        },
      );
      observer.observe(el);
      observers.push(observer);
    });

    return () => {
      observers.forEach((o) => o.disconnect());
    };
  }, [chapters]);

  if (dismissed || !visible || !chapters.length) return null;

  const current = chapters[activeIdx] || chapters[0];
  const href = buildChatHref({
    reportId,
    intent: current.intent || `chapter:${current.chapter}`,
    question: current.question,
    source: `result_chapter_ask:${current.chapter}`,
    ctaStrategyKey: ctaStrategyKey || null,
    sourceFamily: sourceFamily || null,
  });

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-3 z-40 flex justify-center px-3 md:inset-x-auto md:right-5 md:bottom-6 md:justify-end md:px-0"
      role="complementary"
      aria-label="章节追问浮动栏"
    >
      <div className="pointer-events-auto w-full max-w-md rounded-[var(--radius-md)] border border-[color:var(--brand-soft-2)] bg-[color:var(--paper)] p-3 shadow-[0_8px_24px_-12px_rgba(0,0,0,0.25)] backdrop-blur supports-[backdrop-filter]:bg-[color:var(--paper)]/95 md:w-[360px]">
        <div className="flex items-center justify-between gap-2">
          <div className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[color:var(--brand-strong)]">
            <MessageCircleQuestion className="h-3 w-3" />
            正在读 · {current.label}
          </div>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="-mr-1 -mt-1 rounded p-1 text-[color:var(--ink-5)] transition hover:bg-[color:var(--bg-elevated)] hover:text-[color:var(--ink-2)]"
            aria-label="关闭追问坞"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="mt-1.5 line-clamp-2 text-xs leading-5 text-[color:var(--ink-3)]">
          {current.question}
        </div>

        <ResultCtaLink
          href={href}
          page={`/result/${reportId}`}
          target={`result_chapter_ask:${current.chapter}`}
          className="group mt-2 flex items-center justify-between gap-2 rounded-[var(--radius-sm)] border border-[color:var(--brand)] bg-[color:var(--brand-soft)] px-3 py-2 text-xs font-semibold text-[color:var(--brand-strong)] transition hover:bg-[color:var(--brand-soft-2)]"
          meta={{
            reportId,
            source: `result_chapter_ask:${current.chapter}`,
            chapter: current.chapter,
            intent: current.intent || `chapter:${current.chapter}`,
            ctaStrategyKey: ctaStrategyKey || null,
            sourceFamily: sourceFamily || null,
            dock: true,
          }}
        >
          <span>我来问问这一段</span>
          <ArrowRight className="h-3.5 w-3.5 shrink-0 transition group-hover:translate-x-0.5" />
        </ResultCtaLink>
      </div>
    </div>
  );
}
