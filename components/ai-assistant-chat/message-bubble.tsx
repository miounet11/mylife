import {
  Check,
  CheckCircle2,
  Copy,
  Pencil,
  RotateCcw,
  Trash2,
  X,
} from 'lucide-react';
import ChatMarkdown from '@/components/chat-markdown';
import {
  type ChatMessage,
  formatChatTime,
} from '@/components/ai-assistant-chat/chat-helpers';

interface MessageBubbleProps {
  message: ChatMessage;
  previousUserQuestion: string;
  onSaveEvent: (question: string, answer: string, key: string) => void;
  onDelete: (messageId: string) => void;
  onRegenerate: (messageId: string) => void;
  onStartEdit: (message: ChatMessage) => void;
  onCancelEdit: () => void;
  onSubmitEdit: (messageId: string) => void;
  isEditing: boolean;
  editingContent: string;
  onEditingContentChange: (value: string) => void;
  isSaving: boolean;
  isSaved: boolean;
  isActing: boolean;
  onCopy: (messageId: string, content: string) => void;
  copied: boolean;
}

export function MessageBubble({
  message,
  previousUserQuestion,
  onSaveEvent,
  onDelete,
  onRegenerate,
  onStartEdit,
  onCancelEdit,
  onSubmitEdit,
  isEditing,
  editingContent,
  onEditingContentChange,
  isSaving,
  isSaved,
  isActing,
  onCopy,
  copied,
}: MessageBubbleProps) {
  const time = formatChatTime(message.timestamp);

  if (message.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-2xl rounded-[var(--radius-md)] bg-[linear-gradient(135deg,var(--accent),var(--accent-strong))] px-5 py-4 text-white shadow-[0_14px_32px_rgba(178,149,93,0.2)]">
          {isEditing ? (
            <div className="space-y-3">
              <textarea
                value={editingContent}
                onChange={(event) => onEditingContentChange(event.target.value)}
                rows={3}
                className="w-full resize-none rounded-[var(--radius)] border border-white/20 bg-[color:var(--paper)] px-4 py-3 text-xs leading-6 text-white outline-none placeholder:text-white/60"
                placeholder="修改你的问题"
              />
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="text-xs text-white/70">修改后会基于这条问题重新生成后续回答。</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onCancelEdit}
                    className="inline-flex items-center gap-2 rounded-full border border-white/20 px-3 py-2 text-xs font-semibold text-white/88"
                  >
                    <X className="h-3.5 w-3.5" />
                    取消
                  </button>
                  <button
                    type="button"
                    onClick={() => onSubmitEdit(message.id)}
                    disabled={isActing}
                    className="inline-flex items-center gap-2 rounded-full bg-[color:var(--paper)] px-3 py-2 text-xs font-semibold text-[color:var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Check className="h-3.5 w-3.5" />
                    {isActing ? '提交中...' : '重新提交'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              <p className="text-xs leading-6">{message.content}</p>
              {message.tacitSummary ? (
                <div className="mt-3 rounded-[var(--radius)] border border-white/18 bg-[color:var(--paper)] px-3 py-2.5 text-[11px] leading-6 text-white/90">
                  <div className="font-semibold text-white">本轮默会信息</div>
                  <div className="mt-1 text-white/82">{message.tacitSummary}</div>
                </div>
              ) : null}
              {message.materials?.length ? (
                <div className="mt-3 rounded-[var(--radius)] border border-white/18 bg-[color:var(--paper)] px-3 py-2.5 text-[11px] leading-6 text-white/90">
                  <div className="font-semibold text-white">本轮资料</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {message.materials.map((material) => (
                      <span key={material.id} className="rounded-full border border-white/20 bg-[color:var(--paper)] px-2.5 py-1 font-semibold text-white/88">
                        {material.label}{material.hasImage ? ' · 图片' : ''}
                      </span>
                    ))}
                  </div>
                  {message.materialSummary ? <div className="mt-2 text-white/82">{message.materialSummary}</div> : null}
                </div>
              ) : null}
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-white/75">
                <div className="flex items-center gap-2">
                  <span>{time}</span>
                  {message.edited ? (
                    <span className="rounded-full border border-white/20 px-2 py-0.5 font-semibold text-white/88">已编辑</span>
                  ) : null}
                  {message.tacitSummary ? (
                    <span className="rounded-full border border-white/20 px-2 py-0.5 font-semibold text-white/88">已带默会信息</span>
                  ) : null}
                  {message.materials?.length ? (
                    <span className="rounded-full border border-white/20 px-2 py-0.5 font-semibold text-white/88">已带资料</span>
                  ) : null}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onStartEdit(message)}
                    className="inline-flex items-center gap-1 rounded-full border border-white/20 px-3 py-1.5 font-semibold text-white/88"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    编辑
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(message.id)}
                    disabled={isActing}
                    className="inline-flex items-center gap-1 rounded-full border border-white/20 px-3 py-1.5 font-semibold text-white/88 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    {isActing ? '删除中...' : '删除'}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start">
      <div className="max-w-3xl rounded-[var(--radius-md)] border border-[color:var(--line)] bg-[color:var(--paper)] px-5 py-4 shadow-[0_16px_32px_rgba(23,32,51,0.06)]">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-[color:var(--ink)]">结构回复</span>
          {message.llmUsed === false && (
            <span className="rounded-full bg-[rgba(201,161,74,0.16)] px-2 py-0.5 text-[11px] font-semibold text-[color:var(--signal-strong)]">待重试</span>
          )}
          {message.regenerated ? (
            <span className="rounded-full bg-[color:var(--bg-sunken)] px-2 py-0.5 text-[11px] font-semibold text-[color:var(--muted)]">已重生成</span>
          ) : null}
          {message.edited ? (
            <span className="rounded-full bg-[color:var(--bg-sunken)] px-2 py-0.5 text-[11px] font-semibold text-[color:var(--muted)]">源问题已编辑</span>
          ) : null}
        </div>
        <div className="mt-3">
          <ChatMarkdown content={message.content} />
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-[color:var(--muted)]">
          <span>
            {message.llmUsed
              ? '结合当前报告与对话内容生成'
              : '这次没有拿到可用解析，未硬编答案；可点重生成重新尝试。'}
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <span>{time}</span>
            <button
              type="button"
              onClick={() => onRegenerate(message.id)}
              disabled={isActing}
              className="inline-flex items-center gap-2 rounded-full bg-[color:var(--bg-elevated)] px-3 py-2 font-semibold text-[color:var(--ink)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RotateCcw className="h-4 w-4" />
              {isActing ? '处理中...' : '重生成'}
            </button>
            {previousUserQuestion && (
              <button
                type="button"
                onClick={() => onSaveEvent(previousUserQuestion, message.content, message.id)}
                disabled={isSaving || isSaved}
                className="inline-flex items-center gap-2 rounded-full bg-[color:var(--bg-elevated)] px-3 py-2 text-xs font-semibold text-[color:var(--ink)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaved ? <CheckCircle2 className="h-4 w-4 text-[color:var(--data-up)]" /> : null}
                {isSaved ? '已记下' : isSaving ? '保存中...' : '记提醒'}
              </button>
            )}
            <button
              type="button"
              onClick={() => onCopy(message.id, message.content)}
              className="inline-flex items-center gap-2 rounded-full bg-[color:var(--bg-elevated)] px-3 py-2 font-semibold text-[color:var(--ink)]"
            >
              <Copy className="h-4 w-4" />
              {copied ? '已复制' : '复制'}
            </button>
            <button
              type="button"
              onClick={() => onDelete(message.id)}
              disabled={isActing}
              className="inline-flex items-center gap-2 rounded-full bg-[color:var(--bg-elevated)] px-3 py-2 font-semibold text-[color:var(--ink)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Trash2 className="h-4 w-4" />
              删除
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
