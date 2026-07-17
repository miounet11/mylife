import {
  Check,
  CheckCircle2,
  Copy,
  Pencil,
  RotateCcw,
  ThumbsDown,
  ThumbsUp,
  Trash2,
  X,
} from 'lucide-react';
import ChatMarkdown from '@/components/chat-markdown';
import {
  type ChatFeedbackRating,
  type ChatMessage,
  formatChatTime,
  isSyntheticOpeningMessage,
} from '@/components/ai-assistant-chat/chat-helpers';
import { parseChatAnswerStructure } from '@/lib/chat-answer-contract';

// v5-D60: FB Messenger 2017 风气泡
// 用户：靠右 #3b5998 白字圆角 18px
// AI：靠左 #f1f0f0 黑字圆角 18px

interface MessageBubbleProps {
  message: ChatMessage;
  previousUserQuestion: string;
  onSaveEvent: (question: string, answer: string, key: string) => void;
  onDelete: (messageId: string) => void;
  onRegenerate: (messageId: string) => void;
  onStartEdit: (message: ChatMessage) => void;
  onCancelEdit: () => void;
  onSubmitEdit: (messageId: string) => void;
  onFeedback?: (messageId: string, rating: ChatFeedbackRating) => void;
  isEditing: boolean;
  editingContent: string;
  onEditingContentChange: (value: string) => void;
  isSaving: boolean;
  isSaved: boolean;
  isActing: boolean;
  onCopy: (messageId: string, content: string) => void;
  copied: boolean;
}

const FB_BLUE = '#3b5998';
const AI_BUBBLE_BG = '#f1f0f0';

export function MessageBubble({
  message,
  previousUserQuestion,
  onSaveEvent,
  onDelete,
  onRegenerate,
  onStartEdit,
  onCancelEdit,
  onSubmitEdit,
  onFeedback,
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
  const feedback = message.feedbackRating || null;
  const isOpening = isSyntheticOpeningMessage(message);
  const structured =
    message.role === 'assistant' && !isOpening
      ? parseChatAnswerStructure(message.content)
      : null;
  const verifyHint = structured?.verify || '';

  if (message.role === 'user') {
    return (
      <div className="flex justify-end">
        <div
          className="max-w-[80%] rounded-[18px] px-4 py-2 text-[14px] leading-5 text-white"
          style={{ background: FB_BLUE }}
        >
          {isEditing ? (
            <div className="space-y-2">
              <textarea
                value={editingContent}
                onChange={(event) => onEditingContentChange(event.target.value)}
                rows={3}
                className="w-full resize-none rounded-[3px] border border-white/30 bg-white px-3 py-2 text-[13px] leading-5 text-[#1d2129] outline-none"
                placeholder="修改你的问题"
              />
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="text-white/80">修改后基于这条问题重算后续回答。</span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={onCancelEdit}
                    className="inline-flex items-center gap-1 rounded-[3px] border border-white/40 bg-white/10 px-2 py-1 text-xs font-semibold text-white"
                  >
                    <X className="h-3 w-3" />
                    取消
                  </button>
                  <button
                    type="button"
                    onClick={() => onSubmitEdit(message.id)}
                    disabled={isActing}
                    className="inline-flex items-center gap-1 rounded-[3px] bg-white px-2 py-1 text-xs font-bold text-[#3b5998] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Check className="h-3 w-3" />
                    {isActing ? '提交中...' : '重新提交'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              <p className="whitespace-pre-wrap break-words">{message.content}</p>
              {message.tacitSummary ? (
                <div className="mt-2 rounded-[4px] border border-white/25 bg-white/10 px-2 py-1.5 text-[12px] leading-5">
                  <div className="font-semibold">本轮默会信息</div>
                  <div className="mt-0.5 text-white/85">{message.tacitSummary}</div>
                </div>
              ) : null}
              {message.materials?.length ? (
                <div className="mt-2 rounded-[4px] border border-white/25 bg-white/10 px-2 py-1.5 text-[12px] leading-5">
                  <div className="font-semibold">本轮资料</div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {message.materials.map((material) => (
                      <span
                        key={material.id}
                        className="rounded-[3px] border border-white/30 bg-white/10 px-1.5 py-0.5 text-xs font-semibold"
                      >
                        {material.label}{material.hasImage ? ' · 图片' : ''}
                      </span>
                    ))}
                  </div>
                  {message.materialSummary ? <div className="mt-1 text-white/85">{message.materialSummary}</div> : null}
                </div>
              ) : null}
              <div className="mt-1.5 flex flex-wrap items-center justify-end gap-1.5 text-xs text-white/80">
                <span>{time}</span>
                {message.edited ? (
                  <span className="rounded-[3px] border border-white/30 px-1 py-0.5 font-semibold">已编辑</span>
                ) : null}
                {message.tacitSummary ? (
                  <span className="rounded-[3px] border border-white/30 px-1 py-0.5 font-semibold">默会</span>
                ) : null}
                {message.materials?.length ? (
                  <span className="rounded-[3px] border border-white/30 px-1 py-0.5 font-semibold">资料</span>
                ) : null}
                <button
                  type="button"
                  onClick={() => onStartEdit(message)}
                  className="inline-flex items-center gap-1 rounded-[3px] border border-white/30 px-1.5 py-0.5 font-semibold text-white/90 hover:bg-white/10"
                >
                  <Pencil className="h-3 w-3" />
                  编辑
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(message.id)}
                  disabled={isActing}
                  className="inline-flex items-center gap-1 rounded-[3px] border border-white/30 px-1.5 py-0.5 font-semibold text-white/90 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Trash2 className="h-3 w-3" />
                  {isActing ? '...' : '删除'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start">
      <div
        className={`${isOpening ? 'max-w-[92%]' : 'max-w-[80%]'} rounded-[18px] px-4 py-2.5 text-[14px] text-[#1d2129]`}
        style={{ background: AI_BUBBLE_BG }}
      >
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="font-bold text-[#1d2129]">{isOpening ? '顾问开场' : '结构回复'}</span>
          {isOpening ? (
            <span className="rounded-[3px] bg-white px-1.5 py-0.5 font-semibold text-[#606770]">开场</span>
          ) : null}
          {!isOpening && message.llmUsed === false && (
            <span className="rounded-[3px] bg-[#fff7e6] px-1.5 py-0.5 font-semibold text-[#a87f2c]">待重试</span>
          )}
          {!isOpening && message.regenerated ? (
            <span className="rounded-[3px] bg-white px-1.5 py-0.5 font-semibold text-[#606770]">已重生成</span>
          ) : null}
          {!isOpening && message.edited ? (
            <span className="rounded-[3px] bg-white px-1.5 py-0.5 font-semibold text-[#606770]">源问题已编辑</span>
          ) : null}
        </div>
        <div className="mt-1.5">
          {isOpening ? (
            <p className="whitespace-pre-wrap break-words text-[14px] leading-5 text-[#1d2129]">
              {message.content}
            </p>
          ) : (
            <ChatMarkdown content={message.content} />
          )}
        </div>
        {verifyHint ? (
          <div className="mt-2 rounded-[6px] border border-[#d4e4f7] bg-[#f0f6ff] px-2.5 py-1.5 text-[11px] leading-[1.45] text-[#365899]">
            <span className="font-semibold">验证点</span>
            <span className="ml-1">{verifyHint}</span>
          </div>
        ) : null}
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-[#606770]">
          <span>
            {isOpening
              ? '本地开场 · 点下方议题或一键开口即可开始'
              : message.llmUsed
                ? '结合当前报告与对话内容生成'
                : message.fallbackReason
                  ? `简化回答（${message.fallbackReason}）；可点重生成。`
                  : '这次没有拿到可用解析，未硬编答案；可点重生成。'}
          </span>
          <div className="flex flex-wrap items-center gap-1.5">
            {time ? <span>{time}</span> : null}
            {!isOpening && onFeedback ? (
              <>
                <button
                  type="button"
                  onClick={() => onFeedback(message.id, 'helpful')}
                  disabled={isActing}
                  className={`fb-btn inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-60 ${
                    feedback === 'helpful' ? 'text-[#2f7d52]' : 'text-[#1d2129]'
                  }`}
                  aria-label="有用"
                  title="有用"
                >
                  <ThumbsUp className="h-3 w-3" />
                  有用
                </button>
                <button
                  type="button"
                  onClick={() => onFeedback(message.id, 'not_helpful')}
                  disabled={isActing}
                  className={`fb-btn inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-60 ${
                    feedback === 'not_helpful' ? 'text-[#c0392b]' : 'text-[#1d2129]'
                  }`}
                  aria-label="不实或无帮助"
                  title="不实或无帮助"
                >
                  <ThumbsDown className="h-3 w-3" />
                  无帮助
                </button>
                <button
                  type="button"
                  onClick={() => onFeedback(message.id, 'empty')}
                  disabled={isActing}
                  className={`fb-btn inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-60 ${
                    feedback === 'empty' ? 'text-[#a87f2c]' : 'text-[#1d2129]'
                  }`}
                  title="太空 / 套话"
                >
                  太空
                </button>
              </>
            ) : null}
            {!isOpening ? (
              <button
                type="button"
                onClick={() => onRegenerate(message.id)}
                disabled={isActing}
                className="fb-btn inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-[#1d2129] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RotateCcw className="h-3 w-3" />
                {isActing ? '...' : '重生成'}
              </button>
            ) : null}
            {!isOpening && previousUserQuestion ? (
              <button
                type="button"
                onClick={() => onSaveEvent(previousUserQuestion, message.content, message.id)}
                disabled={isSaving || isSaved}
                className="fb-btn inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-[#1d2129] disabled:cursor-not-allowed disabled:opacity-60"
                title={verifyHint ? `将验证点记入事件：${verifyHint}` : '把结论记入事件日历以便回访'}
              >
                {isSaved ? <CheckCircle2 className="h-3 w-3 text-[#2f7d52]" /> : null}
                {isSaved ? '已记验证' : isSaving ? '保存中...' : '记验证点'}
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => onCopy(message.id, message.content)}
              className="fb-btn inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-[#1d2129]"
            >
              <Copy className="h-3 w-3" />
              {copied ? '已复制' : '复制'}
            </button>
            <button
              type="button"
              onClick={() => onDelete(message.id)}
              disabled={isActing}
              className="fb-btn inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-[#1d2129] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Trash2 className="h-3 w-3" />
              删除
            </button>
          </div>
        </div>
        {!isOpening && feedback ? (
          <div className="mt-1.5 text-[11px] text-[#8a8d91]">
            已记录反馈：
            {feedback === 'helpful' ? '有用' : feedback === 'not_helpful' ? '无帮助' : '太空/套话'}
          </div>
        ) : null}
      </div>
    </div>
  );
}
