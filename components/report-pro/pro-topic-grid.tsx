'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { ProTopicCard } from '@/lib/report-pro-view';
import ProScoreBar from '@/components/report-pro/pro-score-bar';
import { buildTopicChatHref } from '@/lib/chat-entry';
import { buildTopicDeepLinks } from '@/lib/need-map';
import { READING_PATH_HINT } from '@/lib/content-voice';

export default function ProTopicGrid({
  topics,
  reportId,
}: {
  topics: ProTopicCard[];
  reportId?: string;
}) {
  if (!topics.length) return null;

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h2 className="text-[14px] font-semibold text-[color:var(--ink-1)]">人生议题</h2>
          <p className="mt-0.5 max-w-xl text-[12px] leading-[1.45] text-[color:var(--ink-5)]">
            {READING_PATH_HINT}
          </p>
        </div>
        <span className="text-[11px] text-[color:var(--ink-5)]">有疑问可继续问老师</span>
      </div>
      <div className="divide-y divide-[color:var(--hairline)] border-t border-[color:var(--hairline)]">
        {topics.map((topic, index) => (
          <TopicCard key={topic.key} topic={topic} reportId={reportId} defaultFaqOpen={index === 0} />
        ))}
      </div>
    </section>
  );
}

function TopicCard({
  topic,
  reportId,
  defaultFaqOpen = false,
}: {
  topic: ProTopicCard;
  reportId?: string;
  defaultFaqOpen?: boolean;
}) {
  const [open, setOpen] = useState(true);
  const [faqOpen, setFaqOpen] = useState(defaultFaqOpen);
  const chatHref = reportId ? buildTopicChatHref(reportId, topic.key, topic.title) : null;
  const deep = reportId ? buildTopicDeepLinks(reportId, topic.key) : null;

  return (
    <article className="py-4">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-[14px] font-semibold text-[color:var(--ink-1)]">{topic.title}</h3>
        <ProScoreBar score10={topic.score10} compact />
      </div>

      {topic.tags.length > 0 ? (
        <div className="mt-1.5 text-[11px] text-[color:var(--ink-5)]">{topic.tags.join(' · ')}</div>
      ) : null}

      <div className="mt-3 space-y-3">
        <Block label="① 结论" body={topic.summary} />
        {topic.why ? <Block label="② 为什么" body={topic.why} muted /> : null}
        {open && topic.how && topic.how.length > 0 ? (
          <div>
            <div className="text-[11px] font-medium text-[color:var(--ink-5)]">③ 怎么做</div>
            <ol className="mt-1.5 space-y-1">
              {topic.how.map((h, i) => (
                <li key={h} className="flex gap-2 text-[12px] leading-[1.6] text-[color:var(--ink-2)]">
                  <span className="font-mono text-[11px] text-[color:var(--ink-5)]">{i + 1}.</span>
                  <span>{h}</span>
                </li>
              ))}
            </ol>
          </div>
        ) : null}
        {open && topic.verify ? <Block label="④ 如何验证" body={topic.verify} muted /> : null}
        {open && topic.fullText && topic.fullText !== topic.summary ? (
          <div className="border-t border-dashed border-[color:var(--hairline)] pt-2">
            <div className="text-[11px] font-medium text-[color:var(--ink-5)]">展开说明</div>
            <p className="mt-1 whitespace-pre-wrap text-[12px] leading-[1.7] text-[color:var(--ink-2)]">
              {topic.fullText}
            </p>
          </div>
        ) : null}
      </div>

      {topic.faq && topic.faq.length > 0 ? (
        <div className="mt-3 border-t border-[color:var(--hairline)] pt-2.5">
          <button
            type="button"
            onClick={() => setFaqOpen((v) => !v)}
            className="text-[12px] text-[color:var(--ink-2)] underline-offset-2 hover:underline"
          >
            {faqOpen ? '收起常见问题' : '常见问题'}
          </button>
          {faqOpen ? (
            <ul className="mt-2 space-y-2">
              {topic.faq.map((item) => (
                <li key={item.q} className="text-[12px] leading-[1.55]">
                  <div className="font-medium text-[color:var(--ink-1)]">Q：{item.q}</div>
                  <div className="mt-0.5 text-[color:var(--ink-5)]">A：{item.a}</div>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[12px]">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="text-[color:var(--ink-4)] underline-offset-2 hover:underline"
        >
          {open ? '收起步骤' : '展开怎么做'}
        </button>
        {chatHref ? (
          <Link href={chatHref} className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
            请教对应老师
          </Link>
        ) : null}
        {deep?.dimensionHref ? (
          <Link
            href={deep.dimensionHref}
            className="text-[color:var(--ink-2)] underline-offset-2 hover:underline"
          >
            {deep.dimensionLabel}
          </Link>
        ) : null}
      </div>
    </article>
  );
}

function Block({
  label,
  body,
  muted,
}: {
  label: string;
  body: string;
  muted?: boolean;
}) {
  return (
    <div>
      <div className="text-[11px] font-medium text-[color:var(--ink-5)]">{label}</div>
      <p
        className={`mt-0.5 text-[12px] leading-[1.65] md:text-[13px] ${
          muted ? 'text-[color:var(--ink-3)]' : 'text-[color:var(--ink-1)]'
        }`}
      >
        {body}
      </p>
    </div>
  );
}
