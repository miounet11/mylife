'use client';

import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';
import { trackFunnel } from '@/components/funnel-tracker';

type Props = {
  reportId?: string | null;
  intent?: string | null;
  source?: string | null;
  /** compact = thin bar; card = larger empty-state panel */
  variant?: 'bar' | 'card';
};

function buildAnalyzeHref(intent?: string | null, source?: string | null) {
  const params = new URLSearchParams();
  params.set('source', source || 'chat_empty');
  if (intent) params.set('intent', intent);
  return `/analyze?${params.toString()}`;
}

/**
 * Shown when /chat has no reportId. Primary conversion lever:
 * most chat_context_loaded events are cold starts with zero messages.
 */
export default function ChatReportGate({
  reportId,
  intent,
  source,
  variant = 'card',
}: Props) {
  if (reportId) return null;

  const href = buildAnalyzeHref(intent, source || 'chat_empty');

  if (variant === 'bar') {
    return (
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#f0c36d] bg-[#fff8e8] px-3 py-2 text-[12px] text-[#1d2129]">
        <span className="font-semibold">
          尚未绑定报告 — 先生成结构报告，再追问命中率更高
        </span>
        <Link
          href={href}
          onClick={() =>
            trackFunnel('chat_to_analyze_click', {
              source: source || 'chat_empty',
              intent: intent || 'career',
            })
          }
          className="inline-flex items-center gap-1 rounded-[3px] bg-[#3b5998] px-2.5 py-1 text-[12px] font-bold text-white no-underline hover:opacity-90 hover:no-underline"
        >
          去生成报告
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-3 mt-3 rounded-[3px] border border-[#f0c36d] bg-[#fff8e8] px-3 py-3 md:mx-4">
      <div className="flex items-start gap-2">
        <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#3b5998] text-white">
          <Sparkles className="h-3.5 w-3.5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-[14px] font-bold text-[#1d2129]">先有报告，再追问</div>
          <p className="mt-1 text-[12px] leading-[1.55] text-[#606770]">
            当前是冷启动会话，没有绑定命盘报告。自由闲聊可以继续，但事业/财运/窗口类判断会缺少结构依据。
            建议先花 1 分钟生成完整报告，再带着问题回来。
          </p>
          <div className="mt-2.5 flex flex-wrap gap-2">
            <Link
              href={href}
              onClick={() =>
                trackFunnel('chat_to_analyze_click', {
                  source: source || 'chat_empty',
                  intent: intent || 'career',
                  surface: 'card',
                })
              }
              className="inline-flex h-9 items-center gap-1.5 rounded-[3px] bg-[#3b5998] px-3 text-[13px] font-bold text-white no-underline hover:opacity-90 hover:no-underline"
            >
              立即生成结构报告
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <span className="inline-flex h-9 items-center text-[11px] text-[#606770]">
              也可先在下方自由提问（依据偏弱）
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
