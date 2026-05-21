'use client';

import ReactMarkdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';

// v5-D60: FB Messenger 2017 风 markdown 渲染（嵌在 AI 气泡 #f1f0f0 内）

export default function ChatMarkdown({ content }: { content: string }) {
  const normalizedContent = normalizeChatMarkdown(content);

  return (
    <div className="chat-markdown text-[14px] leading-5 text-[#1d2129]">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        components={{
          h1: ({ children }) => <h1 className="mt-3 text-[16px] font-bold text-[#1d2129] first:mt-0">{children}</h1>,
          h2: ({ children }) => <h2 className="mt-3 text-[15px] font-bold text-[#1d2129] first:mt-0">{children}</h2>,
          h3: ({ children }) => <h3 className="mt-2.5 text-[14px] font-semibold text-[#1d2129] first:mt-0">{children}</h3>,
          p: ({ children }) => <p className="mt-2 first:mt-0">{children}</p>,
          ul: ({ children }) => <ul className="mt-2 list-disc space-y-1 pl-5">{children}</ul>,
          ol: ({ children }) => <ol className="mt-2 list-decimal space-y-1 pl-5">{children}</ol>,
          li: ({ children }) => <li className="pl-1">{children}</li>,
          blockquote: ({ children }) => (
            <blockquote className="mt-2.5 rounded-[3px] border-l-[3px] border-[#3b5998] bg-white px-3 py-2 text-[#1d2129]">
              {children}
            </blockquote>
          ),
          hr: () => <hr className="my-3 border-[#dddfe2]" />,
          a: ({ href, children }) => (
            <a
              href={href}
              target={href?.startsWith('http') ? '_blank' : undefined}
              rel={href?.startsWith('http') ? 'noreferrer' : undefined}
              className="font-medium text-[#3b5998] hover:underline"
            >
              {children}
            </a>
          ),
          table: ({ children }) => (
            <div className="mt-2.5 overflow-x-auto rounded-[3px] border border-[#dddfe2]">
              <table className="min-w-full border-collapse bg-white text-left text-[13px]">{children}</table>
            </div>
          ),
          thead: ({ children }) => <thead className="bg-[#f5f6f7]">{children}</thead>,
          th: ({ children }) => <th className="border-b border-[#dddfe2] px-2.5 py-1.5 font-semibold text-[#1d2129]">{children}</th>,
          td: ({ children }) => <td className="border-b border-[#dddfe2] px-2.5 py-1.5 align-top text-[#1d2129]">{children}</td>,
          pre: ({ children }) => (
            <pre className="mt-2.5 overflow-x-auto rounded-[3px] border border-[#dddfe2] bg-white px-3 py-2 font-mono text-[12px] leading-5 text-[#1d2129]">{children}</pre>
          ),
          code: ({ className, children }) => {
            const value = String(children).replace(/\n$/, '');
            const isBlock = Boolean(className?.includes('language-')) || value.includes('\n');

            return isBlock ? (
              <code className="font-mono text-[12px] text-inherit">{children}</code>
            ) : (
              <code className="rounded-[3px] bg-white px-1 py-0.5 font-mono text-[12px] text-[#1d2129] border border-[#dddfe2]">{children}</code>
            );
          },
          strong: ({ children }) => <strong className="font-semibold text-[#1d2129]">{children}</strong>,
        }}
      >
        {normalizedContent}
      </ReactMarkdown>
    </div>
  );
}

function normalizeChatMarkdown(content: string) {
  return `${content || ''}`
    .replace(/\r\n/g, '\n')
    .replace(/^\s*[•●◦▪▸►]\s+/gm, '- ')
    .replace(/^(\s*)(\d+)[、．](\s+)/gm, '$1$2.$3')
    .replace(/^(\s{0,3}#{1,6})([^\s#])/gm, '$1 $2')
    .replace(/([^\n])\n(- |\d+\. |>|#{1,6} )/g, '$1\n\n$2')
    .replace(/```([\w-]+)?\n?([\s\S]*?)```/g, (_match, lang = '', body = '') => {
      const normalizedBody = `${body}`.replace(/\n{3,}/g, '\n\n').trimEnd();
      return `\`\`\`${lang}\n${normalizedBody}\n\`\`\``;
    })
    .trim();
}
