import Link from 'next/link';
import { ArrowRight, MessageSquareText, BellRing, FileBarChart2 } from 'lucide-react';
import ResultCtaLink from '@/components/result-cta-link';

// v5-C1 (2026-05-08) 决策台风「继续上次」恢复条
// 用在 dashboard / profile 顶部 — 把回访用户的「上次走到哪了」直接抬到第一屏
//
// 优先级（取第一个匹配项）：
//   1) 最近聊天 → 'continue_chat'   带回最后一条会话
//   2) 待验证事件（最临近 / 最逾期）→ 'validate_event'
//   3) 最近报告 → 'continue_report'   引导回去看 / 接着追问
//
// 如果三者都没有，组件返回 null，dashboard 不浪费首屏。

export type ResumeTarget =
  | {
      kind: 'continue_chat';
      label: string;       // "继续上次的判断"
      subtitle: string;    // "你 3 小时前在问 …"
      href: string;        // /chat?reportId=...
      ctaLabel: string;    // "回到对话"
    }
  | {
      kind: 'validate_event';
      label: string;       // "验证 8 月初的窗口"
      subtitle: string;    // "事件已过 12 天还没回收"
      href: string;        // /events/[id]
      ctaLabel: string;    // "立即验证"
      overdue?: boolean;   // 是否逾期（用于配色）
    }
  | {
      kind: 'continue_report';
      label: string;       // "接着看 5 月 6 日的判断"
      subtitle: string;    // "格局：正官格 · 大运：戊申"
      href: string;        // /result/[id]
      ctaLabel: string;    // "继续追问"
    };

type ResumeBarProps = {
  target: ResumeTarget | null;
  // 用于埋点（来源：dashboard / profile / events / history）
  surface: string;
};

function iconForKind(kind: ResumeTarget['kind']) {
  if (kind === 'continue_chat') return <MessageSquareText className="h-4 w-4" />;
  if (kind === 'validate_event') return <BellRing className="h-4 w-4" />;
  return <FileBarChart2 className="h-4 w-4" />;
}

function toneForKind(kind: ResumeTarget['kind'], overdue: boolean) {
  if (kind === 'validate_event' && overdue) {
    return {
      bar: 'border-[color:var(--alert)] bg-[color:var(--alert-soft)]',
      eyebrow: 'text-[color:var(--alert)]',
      cta: 'bg-[color:var(--alert)] text-white hover:opacity-90',
    };
  }
  if (kind === 'validate_event') {
    return {
      bar: 'border-[color:var(--signal)] bg-[color:var(--signal-soft)]',
      eyebrow: 'text-[color:var(--signal-strong)]',
      cta: 'bg-[color:var(--signal-strong)] text-white hover:opacity-90',
    };
  }
  // continue_chat / continue_report — brand 色
  return {
    bar: 'border-[color:var(--brand-soft-2)] bg-[color:var(--brand-soft)]',
    eyebrow: 'text-[color:var(--brand-strong)]',
    cta: 'bg-[color:var(--brand-strong)] text-white hover:bg-[color:var(--brand-deep)]',
  };
}

function eyebrowText(kind: ResumeTarget['kind']): string {
  if (kind === 'continue_chat') return '继续上次的判断';
  if (kind === 'validate_event') return '该回收一个事件了';
  return '接着上次看';
}

export default function ResumeBar({ target, surface }: ResumeBarProps) {
  if (!target) return null;

  const overdue = target.kind === 'validate_event' && !!target.overdue;
  const tone = toneForKind(target.kind, overdue);

  return (
    <section
      className={`rounded-[var(--radius-md)] border ${tone.bar} p-4 md:p-5`}
      data-resume-bar={target.kind}
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3 min-w-0">
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius)] border border-[color:var(--hairline-strong)] bg-[color:var(--paper)] text-[color:var(--ink-2)]">
            {iconForKind(target.kind)}
          </div>
          <div className="flex-1 min-w-0">
            <div className={`text-[10px] font-bold uppercase tracking-[0.18em] ${tone.eyebrow}`}>
              {eyebrowText(target.kind)}
            </div>
            <div className="mt-1 truncate text-sm font-bold text-[color:var(--ink-1)] md:text-base">
              {target.label}
            </div>
            <div className="mt-0.5 line-clamp-2 text-xs leading-5 text-[color:var(--ink-3)]">
              {target.subtitle}
            </div>
          </div>
        </div>

        <ResultCtaLink
          href={target.href}
          page={`/${surface}`}
          target={`resume_bar:${target.kind}`}
          className={`inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-[var(--radius)] px-4 text-sm font-semibold ${tone.cta}`}
          meta={{
            surface,
            kind: target.kind,
            overdue: overdue ? 'true' : 'false',
          }}
        >
          {target.ctaLabel}
          <ArrowRight className="h-4 w-4" />
        </ResultCtaLink>
      </div>
    </section>
  );
}
