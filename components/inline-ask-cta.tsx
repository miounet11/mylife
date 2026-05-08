import { MessageCircleQuestion, ArrowRight } from 'lucide-react';
import { buildChatHref } from '@/lib/chat-entry';
import ResultCtaLink from '@/components/result-cta-link';

// v5-B2 (2026-05-08) 章节级内联追问按钮
// 用在报告每个章节尾部（current-state / rhythm-timeline / blueprint / scenario 等）
// 点击后带章节锚点 + 预填问题进入聊天
//
// 为什么：
//   用户读到某一章有疑问时，需要一个"我来问问这一段"的明确入口
//   而不是翻回报告顶部 / 找聊天页图标
//
// 埋点：
//   source=result_chapter_ask
//   chapter=current-state|rhythm|blueprint|scenario|validation|action
//   target=result_chapter_ask:${chapter}

type InlineAskCTAProps = {
  reportId: string;
  // 章节标识（用于埋点 + 聊天上下文定位）
  chapter: string;
  // 显示的 label（短版）
  label?: string;
  // 点击后预填到聊天的完整问题
  question: string;
  // 聊天路由 intent
  intent?: string;
  ctaStrategyKey?: string | null;
  sourceFamily?: string | null;
  // 视觉变体 - inline 紧凑 / block 独立块
  variant?: 'inline' | 'block';
};

export default function InlineAskCTA({
  reportId,
  chapter,
  label = '我来问问这一段',
  question,
  intent,
  ctaStrategyKey,
  sourceFamily,
  variant = 'inline',
}: InlineAskCTAProps) {
  const href = buildChatHref({
    reportId,
    intent: intent || `chapter:${chapter}`,
    question,
    source: `result_chapter_ask:${chapter}`,
    ctaStrategyKey: ctaStrategyKey || null,
    sourceFamily: sourceFamily || null,
  });

  if (variant === 'block') {
    return (
      <div className="mt-4 rounded-[var(--radius)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] p-3">
        <div className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-[color:var(--ink-5)]">
          <MessageCircleQuestion className="h-3 w-3" />
          这一段可以接着问
        </div>
        <ResultCtaLink
          href={href}
          page={`/result/${reportId}`}
          target={`result_chapter_ask:${chapter}`}
          className="mt-2 group flex items-center justify-between gap-2 rounded-[var(--radius-sm)] border border-[color:var(--hairline-strong)] bg-[color:var(--paper)] px-3 py-2 text-xs font-semibold leading-5 text-[color:var(--ink-2)] transition hover:border-[color:var(--brand)] hover:bg-[color:var(--brand-soft)]"
          meta={{
            reportId,
            source: `result_chapter_ask:${chapter}`,
            chapter,
            intent: intent || `chapter:${chapter}`,
            ctaStrategyKey: ctaStrategyKey || null,
            sourceFamily: sourceFamily || null,
          }}
        >
          <span>{label}</span>
          <ArrowRight className="h-3.5 w-3.5 shrink-0 text-[color:var(--ink-5)] transition group-hover:text-[color:var(--brand-strong)]" />
        </ResultCtaLink>
      </div>
    );
  }

  // inline variant — 紧凑，塞到章节末尾最后一行
  return (
    <ResultCtaLink
      href={href}
      page={`/result/${reportId}`}
      target={`result_chapter_ask:${chapter}`}
      className="group inline-flex h-7 items-center gap-1.5 rounded-[var(--radius-sm)] border border-[color:var(--hairline)] bg-[color:var(--paper)] px-2 text-[11px] font-semibold text-[color:var(--ink-3)] transition hover:border-[color:var(--brand)] hover:text-[color:var(--brand-strong)]"
      meta={{
        reportId,
        source: `result_chapter_ask:${chapter}`,
        chapter,
        intent: intent || `chapter:${chapter}`,
        ctaStrategyKey: ctaStrategyKey || null,
        sourceFamily: sourceFamily || null,
      }}
    >
      <MessageCircleQuestion className="h-3 w-3" />
      {label}
    </ResultCtaLink>
  );
}
