'use client';

import { FormEvent, useMemo, useState } from 'react';
import { MessageCircle, Send } from 'lucide-react';
import type { PublicQuestionComment } from '@/lib/public-question-comments';

interface PublicQuestionCommentsProps {
  questionId: string;
  initialComments: PublicQuestionComment[];
}

export default function PublicQuestionComments({ questionId, initialComments }: PublicQuestionCommentsProps) {
  const [comments, setComments] = useState(initialComments);
  const [authorName, setAuthorName] = useState('');
  const [content, setContent] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting'>('idle');
  const [message, setMessage] = useState('');

  const canSubmit = useMemo(() => content.trim().length >= 2 && status !== 'submitting', [content, status]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;

    setStatus('submitting');
    setMessage('');

    try {
      const response = await fetch(`/api/questions/${questionId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ authorName, content }),
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || '留言失败');
      }

      if (data.comment) {
        setComments((current) => [...current, data.comment]);
      }
      setContent('');
      setAuthorName('');
      setMessage(data.message || '留言已提交');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '留言失败，请稍后重试');
    } finally {
      setStatus('idle');
    }
  }

  return (
    <section className="rounded-[var(--radius-lg)] border border-[color:var(--hairline)] bg-[color:var(--paper)] p-4 md:p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-sm font-black text-[color:var(--ink-1)]">
            <MessageCircle className="h-4 w-4 text-[color:var(--brand-strong)]" />
            公开留言
          </div>
          <p className="mt-1 text-xs leading-5 text-[color:var(--ink-5)]">正常追问会显示；广告、引流、政治内容会自动隐藏。</p>
        </div>
        <span className="rounded-full bg-[color:var(--bg-sunken)] px-2.5 py-1 text-xs font-bold text-[color:var(--ink-4)]">{comments.length} 条</span>
      </div>

      <form onSubmit={handleSubmit} className="mt-4 grid gap-3">
        <input
          value={authorName}
          onChange={(event) => setAuthorName(event.target.value)}
          maxLength={24}
          placeholder="昵称（可不填）"
          className="h-10 rounded-[var(--radius)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] px-3 text-sm outline-none focus:border-[color:var(--brand)]"
        />
        <textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          maxLength={600}
          rows={4}
          placeholder="写下你的追问、反馈或相似经历。"
          className="resize-none rounded-[var(--radius)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] px-3 py-2 text-sm leading-6 outline-none focus:border-[color:var(--brand)]"
        />
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-[color:var(--ink-5)]">{content.length}/600</span>
          <button
            type="submit"
            disabled={!canSubmit}
            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-[var(--radius)] bg-[color:var(--brand)] px-4 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
            {status === 'submitting' ? '审核中' : '发布留言'}
          </button>
        </div>
        {message && <div className="rounded-[var(--radius)] bg-[color:var(--bg-sunken)] px-3 py-2 text-xs font-semibold text-[color:var(--ink-4)]">{message}</div>}
      </form>

      <div className="mt-5 grid gap-3">
        {comments.length === 0 ? (
          <div className="rounded-[var(--radius)] border border-dashed border-[color:var(--hairline-strong)] p-4 text-sm leading-6 text-[color:var(--ink-5)]">
            还没有公开留言。你可以先补一个更具体的对象、时间点和担心的风险。
          </div>
        ) : comments.map((comment) => (
          <div key={comment.id} className="rounded-[var(--radius)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] p-3">
            <div className="flex items-center justify-between gap-3 text-xs text-[color:var(--ink-5)]">
              <span className="font-bold text-[color:var(--ink-3)]">{comment.authorName || '匿名用户'}</span>
              {comment.createdAt && <time>{new Date(comment.createdAt).toLocaleDateString('zh-CN')}</time>}
            </div>
            <p className="mt-2 whitespace-pre-line text-sm leading-7 text-[color:var(--ink-2)]">{comment.content}</p>
            {comment.assetTags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {comment.assetTags.slice(0, 4).map((tag) => (
                  <span key={tag} className="rounded-full bg-[color:var(--bg-sunken)] px-2 py-0.5 text-[10px] font-bold text-[color:var(--ink-5)]">
                    {tag}
                  </span>
                ))}
              </div>
            )}
            {comment.engineReply && (
              <div className="mt-3 rounded-[var(--radius)] border border-[color:var(--hairline)] bg-[color:var(--paper)] p-3">
                <div className="text-[11px] font-black text-[color:var(--brand-strong)]">WorldYi 回应</div>
                <p className="mt-1 text-xs leading-6 text-[color:var(--ink-3)]">{comment.engineReply}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
