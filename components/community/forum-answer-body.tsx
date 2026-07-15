/**
 * Renders forum master/official answers more like a real person talking,
 * instead of raw markdown template labels (**建议** / **风险提示**).
 *
 * Also converts leftover markdown links/bold into readable UI.
 */

import Link from 'next/link';
import type { ReactNode } from 'react';

type AnswerBlock =
  | { type: 'lead'; text: string }
  | { type: 'section'; key: string; label: string; text: string; tone: 'judge' | 'advice' | 'risk' | 'other' }
  | { type: 'closing'; text: string };

const SECTION_RULES: Array<{
  match: RegExp;
  key: string;
  label: string;
  tone: 'judge' | 'advice' | 'risk' | 'other';
}> = [
  { match: /^(初步判断|先看结论|核心判断|结论)$/, key: 'judge', label: '我先这么看', tone: 'judge' },
  { match: /^(建议|行动建议|怎么做|你可以这样|操作建议)$/, key: 'advice', label: '要我说', tone: 'advice' },
  { match: /^(风险提示|风险|注意|提醒|边界)$/, key: 'risk', label: '另外提一句', tone: 'risk' },
];

function stripMarkdownInline(line: string) {
  return line
    .replace(/^\s*[-*•]\s+/, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/__(.+?)__/g, '$1')
    .replace(/^>\s?/, '')
    .trim();
}

/** Inline markdown → React nodes (links + residual bold). */
export function renderInlineMarkdown(text: string): ReactNode {
  const source = `${text || ''}`;
  if (!source) return null;

  const nodes: ReactNode[] = [];
  const re = /\[([^\]]+)\]\(([^)\s]+)\)|\*\*([^*]+)\*\*|__([^_]+)__/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = re.exec(source)) !== null) {
    if (match.index > last) {
      nodes.push(source.slice(last, match.index));
    }
    if (match[1] && match[2]) {
      const href = match[2].trim();
      const label = match[1].trim();
      const isInternal = href.startsWith('/') && !href.startsWith('//');
      if (isInternal) {
        nodes.push(
          <Link
            key={`lnk-${key++}`}
            href={href}
            className="font-medium text-[color:var(--brand)] underline-offset-2 hover:underline"
          >
            {label}
          </Link>,
        );
      } else {
        nodes.push(
          <a
            key={`lnk-${key++}`}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-[color:var(--brand)] underline-offset-2 hover:underline"
          >
            {label}
          </a>,
        );
      }
    } else {
      const bold = (match[3] || match[4] || '').trim();
      nodes.push(
        <strong key={`b-${key++}`} className="font-semibold text-[color:var(--ink-1)]">
          {bold}
        </strong>,
      );
    }
    last = match.index + match[0].length;
  }

  if (last < source.length) {
    nodes.push(source.slice(last));
  }

  return nodes.length === 1 ? nodes[0] : nodes;
}

function renderMultiline(text: string, className: string) {
  const lines = `${text || ''}`.split('\n');
  return (
    <div className={className}>
      {lines.map((line, i) => (
        <p key={i} className={i === 0 ? undefined : 'mt-[0.35em]'}>
          {line ? renderInlineMarkdown(line) : <span className="inline-block h-[0.6em]" />}
        </p>
      ))}
    </div>
  );
}

/** Detect a section heading line like **建议** / 建议： / **初步判断** */
function matchHeading(raw: string): {
  label: string;
  rest: string;
  tone: 'judge' | 'advice' | 'risk' | 'other';
  key: string;
} | null {
  const line = raw.trim();
  if (!line) return null;

  // **建议**  or **建议**：xxx
  const bold = line.match(/^\*\*\s*([^*]+?)\s*\*\*\s*[:：]?\s*(.*)$/);
  // 建议：xxx
  const plain = line.match(/^(初步判断|建议|风险提示|行动建议|注意|提醒)\s*[:：]?\s*(.*)$/);

  const titleRaw = (bold?.[1] || plain?.[1] || '').trim().replace(/[:：]\s*$/, '');
  if (!titleRaw) return null;

  // plain match only if whole-ish heading (avoid matching mid-sentence 建议)
  if (!bold && plain) {
    const restProbe = (plain[2] || '').trim();
    if (!restProbe && !/^(初步判断|建议|风险提示|行动建议|注意|提醒)$/.test(titleRaw)) {
      return null;
    }
    if (restProbe.length > 40 && !line.includes('：') && !line.includes(':')) {
      return null;
    }
  }

  const rest = (bold?.[2] || plain?.[2] || '').trim();
  for (const rule of SECTION_RULES) {
    if (rule.match.test(titleRaw)) {
      return { label: rule.label, rest, tone: rule.tone, key: rule.key };
    }
  }
  // only promote unknown headings when they were bolded
  if (bold) {
    return { label: titleRaw, rest, tone: 'other', key: 'other' };
  }
  return null;
}

export function parseForumAnswerBody(body: string): AnswerBlock[] {
  const text = `${body || ''}`.replace(/\r\n/g, '\n').trim();
  if (!text) return [];

  const lines = text.split('\n');
  const blocks: AnswerBlock[] = [];
  let mode: 'lead' | 'section' | 'closing' = 'lead';
  let lead: string[] = [];
  let closing: string[] = [];
  let current: { key: string; label: string; tone: 'judge' | 'advice' | 'risk' | 'other'; lines: string[] } | null =
    null;

  const flushSection = () => {
    if (!current) return;
    // Keep link markdown for renderInlineMarkdown; only strip list/blockquote markers here.
    const bodyText = current.lines
      .map((line) =>
        line
          .replace(/^\s*[-*•]\s+/, '')
          .replace(/^>\s?/, '')
          .trim(),
      )
      .filter((line, idx, arr) => line || (idx > 0 && idx < arr.length - 1))
      .join('\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
    if (bodyText) {
      blocks.push({
        type: 'section',
        key: current.key,
        label: current.label,
        tone: current.tone,
        text: bodyText,
      });
    }
    current = null;
  };

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();
    if (!trimmed) {
      if (mode === 'lead' && lead.length) lead.push('');
      else if (mode === 'section' && current) current.lines.push('');
      else if (mode === 'closing' && closing.length) closing.push('');
      continue;
    }

    // horizontal rule → end of structured body, rest is closing chatty line
    if (/^---+$/.test(trimmed)) {
      flushSection();
      mode = 'closing';
      continue;
    }

    const heading = matchHeading(trimmed);
    if (heading) {
      flushSection();
      mode = 'section';
      current = {
        key: heading.key,
        label: heading.label,
        tone: heading.tone,
        lines: heading.rest ? [heading.rest] : [],
      };
      continue;
    }

    // Preserve markdown links/bold for inline renderer; only light-normalize list/quote.
    const soft = trimmed.replace(/^\s*[-*•]\s+/, '').replace(/^>\s?/, '');

    if (mode === 'lead') {
      lead.push(soft);
    } else if (mode === 'section' && current) {
      current.lines.push(soft);
    } else {
      closing.push(soft);
    }
  }
  flushSection();

  const out: AnswerBlock[] = [];
  const leadText = lead.join('\n').replace(/\n{3,}/g, '\n\n').trim();
  if (leadText) out.push({ type: 'lead', text: leadText });
  out.push(...blocks);
  const closingText = closing.join('\n').replace(/\n{3,}/g, '\n\n').trim();
  if (closingText) out.push({ type: 'closing', text: closingText });

  if (!out.length) {
    out.push({ type: 'lead', text: text });
  }
  return out;
}

function SectionView({
  tone,
  label,
  text,
}: {
  tone: 'judge' | 'advice' | 'risk' | 'other';
  label: string;
  text: string;
}) {
  if (tone === 'advice') {
    return (
      <div className="relative overflow-hidden rounded-[var(--radius-md)] border border-[color:var(--success-soft)] bg-[color:var(--success-soft)]/70 px-3.5 py-3">
        <div className="mb-1.5 flex items-center gap-1.5">
          <span
            className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[color:var(--success)]/12 text-[11px] font-semibold text-[color:var(--success)]"
            aria-hidden
          >
            说
          </span>
          <span className="text-[12px] font-semibold text-[color:var(--success)]">{label}</span>
        </div>
        {renderMultiline(text, 'text-[15px] font-medium leading-[1.7] text-[color:var(--ink-1)]')}
      </div>
    );
  }

  if (tone === 'judge') {
    return (
      <div className="rounded-[var(--radius)] bg-[color:var(--brand-soft)]/70 px-3.5 py-2.5">
        <div className="mb-1 text-[11px] font-semibold tracking-wide text-[color:var(--brand-strong)]">
          {label}
        </div>
        {renderMultiline(text, 'text-[14px] leading-[1.65] text-[color:var(--ink-2)]')}
      </div>
    );
  }

  if (tone === 'risk') {
    return (
      <div className="flex gap-2 rounded-[var(--radius)] border border-dashed border-amber-200 bg-amber-50/80 px-3.5 py-2.5">
        <span className="mt-[2px] shrink-0 text-[12px] text-amber-700" aria-hidden>
          ※
        </span>
        <div className="min-w-0">
          <div className="mb-1 text-[11px] font-semibold text-amber-800">{label}</div>
          {renderMultiline(text, 'text-[13px] leading-[1.6] text-[color:var(--ink-2)]')}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-r-[var(--radius)] border-l-[3px] border-[color:var(--hairline-strong)] bg-[color:var(--bg-sunken)]/70 px-3.5 py-2.5">
      <div className="mb-1 text-[11px] font-semibold text-[color:var(--ink-4)]">{label}</div>
      {renderMultiline(text, 'text-[14px] leading-[1.65] text-[color:var(--ink-1)]')}
    </div>
  );
}

export default function ForumAnswerBody({
  body,
  className = '',
}: {
  body: string;
  className?: string;
}) {
  const blocks = parseForumAnswerBody(body);

  return (
    <div className={`space-y-3 ${className}`}>
      {blocks.map((block, index) => {
        if (block.type === 'lead') {
          return (
            <div key={`lead-${index}`}>
              {renderMultiline(block.text, 'text-[15px] leading-[1.7] text-[color:var(--ink-1)]')}
            </div>
          );
        }

        if (block.type === 'closing') {
          return (
            <div
              key={`closing-${index}`}
              className="border-t border-[color:var(--hairline)] pt-3"
            >
              {renderMultiline(block.text, 'text-[14px] leading-[1.65] text-[color:var(--ink-2)]')}
            </div>
          );
        }

        return (
          <SectionView
            key={`${block.key}-${index}`}
            tone={block.tone}
            label={block.label}
            text={block.text}
          />
        );
      })}
    </div>
  );
}
