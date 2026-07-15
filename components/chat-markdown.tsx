'use client';

import ReactMarkdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';

// v5-D60: FB Messenger 2017 风 markdown 渲染（嵌在 AI 气泡 #f1f0f0 内）
// v5-D+ public article: 公开追问页用更清晰的阅读排版

type ChatMarkdownProps = {
  content: string;
  /** bubble = 聊天气泡；article = 公开解析长文（更大行高、分节卡片感） */
  variant?: 'bubble' | 'article';
};

export default function ChatMarkdown({ content, variant = 'bubble' }: ChatMarkdownProps) {
  const normalizedContent = normalizeChatMarkdown(content);
  const isArticle = variant === 'article';

  return (
    <div
      className={
        isArticle
          ? 'chat-markdown chat-markdown--article text-[14px] leading-[1.75] text-[color:var(--ink-2)] md:text-[15px]'
          : 'chat-markdown text-[14px] leading-5 text-[#1d2129]'
      }
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        components={{
          h1: ({ children }) => (
            <h1
              className={
                isArticle
                  ? 'mt-5 border-b border-[color:var(--hairline)] pb-2 text-[17px] font-bold tracking-[-0.01em] text-[color:var(--ink-1)] first:mt-0'
                  : 'mt-3 text-[16px] font-bold text-[#1d2129] first:mt-0'
              }
            >
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2
              className={
                isArticle
                  ? 'mt-5 flex items-start gap-2 text-[15px] font-bold tracking-[-0.01em] text-[color:var(--ink-1)] first:mt-0 md:text-[16px]'
                  : 'mt-3 text-[15px] font-bold text-[#1d2129] first:mt-0'
              }
            >
              {isArticle ? (
                <span className="mt-[0.35em] inline-block h-2 w-2 shrink-0 rounded-full bg-[color:var(--brand)]" aria-hidden />
              ) : null}
              <span>{children}</span>
            </h2>
          ),
          h3: ({ children }) => (
            <h3
              className={
                isArticle
                  ? 'mt-3.5 text-[14px] font-semibold text-[color:var(--ink-1)] first:mt-0'
                  : 'mt-2.5 text-[14px] font-semibold text-[#1d2129] first:mt-0'
              }
            >
              {children}
            </h3>
          ),
          p: ({ children }) => (
            <p
              className={
                isArticle
                  ? 'mt-2.5 text-[14px] leading-[1.75] text-[color:var(--ink-2)] first:mt-0 md:text-[15px]'
                  : 'mt-2 first:mt-0'
              }
            >
              {children}
            </p>
          ),
          ul: ({ children }) => (
            <ul
              className={
                isArticle
                  ? 'mt-2.5 list-disc space-y-2 pl-5 marker:text-[color:var(--brand-strong)]'
                  : 'mt-2 list-disc space-y-1 pl-5'
              }
            >
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol
              className={
                isArticle
                  ? 'mt-2.5 list-decimal space-y-2 pl-5 marker:font-semibold marker:text-[color:var(--brand-strong)]'
                  : 'mt-2 list-decimal space-y-1 pl-5'
              }
            >
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className={isArticle ? 'pl-1 leading-[1.7] text-[color:var(--ink-2)]' : 'pl-1'}>
              {children}
            </li>
          ),
          blockquote: ({ children }) => (
            <blockquote
              className={
                isArticle
                  ? 'mt-3 rounded-[var(--radius)] border-l-[3px] border-[color:var(--brand)] bg-[color:var(--brand-soft)]/40 px-3.5 py-2.5 text-[13px] leading-[1.65] text-[color:var(--ink-2)]'
                  : 'mt-2.5 rounded-[3px] border-l-[3px] border-[#3b5998] bg-white px-3 py-2 text-[#1d2129]'
              }
            >
              {children}
            </blockquote>
          ),
          hr: () => (
            <hr className={isArticle ? 'my-4 border-[color:var(--hairline)]' : 'my-3 border-[#dddfe2]'} />
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              target={href?.startsWith('http') ? '_blank' : undefined}
              rel={href?.startsWith('http') ? 'noreferrer' : undefined}
              className={
                isArticle
                  ? 'font-medium text-[color:var(--brand)] underline-offset-2 hover:underline'
                  : 'font-medium text-[#3b5998] hover:underline'
              }
            >
              {children}
            </a>
          ),
          table: ({ children }) => (
            <div
              className={
                isArticle
                  ? 'mt-3 overflow-x-auto rounded-[var(--radius)] border border-[color:var(--hairline)]'
                  : 'mt-2.5 overflow-x-auto rounded-[3px] border border-[#dddfe2]'
              }
            >
              <table className="min-w-full border-collapse bg-white text-left text-[13px]">{children}</table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className={isArticle ? 'bg-[color:var(--bg-sunken)]' : 'bg-[#f5f6f7]'}>{children}</thead>
          ),
          th: ({ children }) => (
            <th className="border-b border-[color:var(--hairline)] px-2.5 py-1.5 font-semibold text-[color:var(--ink-1)]">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border-b border-[color:var(--hairline)] px-2.5 py-1.5 align-top text-[color:var(--ink-2)]">
              {children}
            </td>
          ),
          pre: ({ children }) => (
            <pre className="mt-2.5 overflow-x-auto rounded-[var(--radius)] border border-[color:var(--hairline)] bg-[color:var(--bg-sunken)] px-3 py-2 font-mono text-[12px] leading-5 text-[color:var(--ink-1)]">
              {children}
            </pre>
          ),
          code: ({ className, children }) => {
            const value = String(children).replace(/\n$/, '');
            const isBlock = Boolean(className?.includes('language-')) || value.includes('\n');

            return isBlock ? (
              <code className="font-mono text-[12px] text-inherit">{children}</code>
            ) : (
              <code className="rounded-[3px] border border-[color:var(--hairline)] bg-[color:var(--bg-sunken)] px-1 py-0.5 font-mono text-[12px] text-[color:var(--ink-1)]">
                {children}
              </code>
            );
          },
          strong: ({ children }) => (
            <strong
              className={
                isArticle
                  ? 'font-semibold text-[color:var(--ink-1)]'
                  : 'font-semibold text-[#1d2129]'
              }
            >
              {children}
            </strong>
          ),
        }}
      >
        {normalizedContent}
      </ReactMarkdown>
    </div>
  );
}

export function normalizeChatMarkdown(content: string) {
  return `${content || ''}`
    .replace(/\r\n/g, '\n')
    // bullet glyphs → markdown list
    .replace(/^\s*[•●◦▪▸►·]\s+/gm, '- ')
    // "* **label**" already list-like; ensure single space after marker
    .replace(/^(\s*)\*\s+(?=\*\*|[\u4e00-\u9fa5A-Za-z0-9])/gm, '$1- ')
    // Chinese ordered list "1、" / "1．"
    .replace(/^(\s*)(\d+)[、．](\s*)/gm, '$1$2.$3')
    // "1) 标题" at line start → keep readable; if bold-wrapped already handled upstream
    .replace(/^(\s*)(\d+)\)(\s+)/gm, '$1$2.$3')
    // heading hash needs space
    .replace(/^(\s{0,3}#{1,6})([^\s#])/gm, '$1 $2')
    // blank line before block structures for GFM
    .replace(/([^\n])\n(- |\d+\. |>|#{1,6} )/g, '$1\n\n$2')
    .replace(/```([\w-]+)?\n?([\s\S]*?)```/g, (_match, lang = '', body = '') => {
      const normalizedBody = `${body}`.replace(/\n{3,}/g, '\n\n').trimEnd();
      return `\`\`\`${lang}\n${normalizedBody}\n\`\`\``;
    })
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
