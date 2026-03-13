'use client';

import ReactMarkdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';

export default function ChatMarkdown({ content }: { content: string }) {
  return (
    <div className="chat-markdown text-sm leading-7 text-[color:var(--ink)]">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        components={{
          h1: ({ children }) => <h1 className="mt-5 text-xl font-bold text-[color:var(--ink)] first:mt-0">{children}</h1>,
          h2: ({ children }) => <h2 className="mt-5 text-lg font-bold text-[color:var(--ink)] first:mt-0">{children}</h2>,
          h3: ({ children }) => <h3 className="mt-4 text-base font-semibold text-[color:var(--ink)] first:mt-0">{children}</h3>,
          p: ({ children }) => <p className="mt-3 first:mt-0">{children}</p>,
          ul: ({ children }) => <ul className="mt-3 list-disc space-y-2 pl-5">{children}</ul>,
          ol: ({ children }) => <ol className="mt-3 list-decimal space-y-2 pl-5">{children}</ol>,
          li: ({ children }) => <li className="pl-1">{children}</li>,
          blockquote: ({ children }) => (
            <blockquote className="mt-4 rounded-r-2xl border-l-4 border-[color:var(--accent)] bg-[color:var(--accent-soft)]/50 px-4 py-3 text-[color:var(--ink)]">
              {children}
            </blockquote>
          ),
          hr: () => <hr className="my-4 border-[color:var(--line)]" />,
          a: ({ href, children }) => (
            <a
              href={href}
              target={href?.startsWith('http') ? '_blank' : undefined}
              rel={href?.startsWith('http') ? 'noreferrer' : undefined}
              className="font-medium text-[color:var(--accent-strong)] underline underline-offset-4"
            >
              {children}
            </a>
          ),
          table: ({ children }) => (
            <div className="mt-4 overflow-x-auto rounded-2xl border border-[color:var(--line)]">
              <table className="min-w-full border-collapse bg-white text-left text-sm">{children}</table>
            </div>
          ),
          thead: ({ children }) => <thead className="bg-slate-50">{children}</thead>,
          th: ({ children }) => <th className="border-b border-[color:var(--line)] px-3 py-2 font-semibold text-[color:var(--ink)]">{children}</th>,
          td: ({ children }) => <td className="border-b border-[color:var(--line)] px-3 py-2 align-top text-[color:var(--ink)]">{children}</td>,
          pre: ({ children }) => (
            <pre className="mt-4 overflow-x-auto rounded-2xl bg-slate-950 px-4 py-4 text-[13px] leading-6 text-slate-100">{children}</pre>
          ),
          code: ({ className, children }) => {
            const value = String(children).replace(/\n$/, '');
            const isBlock = Boolean(className?.includes('language-')) || value.includes('\n');

            return isBlock ? (
              <code className="font-mono text-[13px] text-inherit">{children}</code>
            ) : (
              <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[13px] text-[color:var(--ink)]">{children}</code>
            );
          },
          strong: ({ children }) => <strong className="font-semibold text-[color:var(--ink)]">{children}</strong>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
