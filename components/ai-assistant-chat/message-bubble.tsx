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
import {
  parseChatAnswerStructure,
  scoreChatAnswerStructure,
} from '@/lib/chat-answer-contract';
import { splitEfcNoticeFromAnswer } from '@/lib/chat-efc-verify';
import { isEnglishUiLocale } from '@/lib/i18n/teacher-copy';

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
  locale?: string | null;
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
  locale,
}: MessageBubbleProps) {
  const en = isEnglishUiLocale(locale);
  const t = (zh: string, enText: string) => (en ? enText : zh);
  const time = formatChatTime(message.timestamp);
  const feedback = message.feedbackRating || null;
  const isOpening = isSyntheticOpeningMessage(message);
  const efcSplit =
    message.role === 'assistant' && !isOpening
      ? splitEfcNoticeFromAnswer(message.content)
      : { body: message.content, efcFlagged: false, issuesLine: '' };
  const displayContent = efcSplit.body || message.content;
  const efcFlagged =
    message.efcOk === false || efcSplit.efcFlagged || (message.efcIssues?.length || 0) > 0;
  const efcIssuesLine =
    (message.efcIssues && message.efcIssues.length > 0
      ? message.efcIssues.join(en ? '; ' : '；')
      : efcSplit.issuesLine) || '';

  const structured =
    message.role === 'assistant' && !isOpening
      ? parseChatAnswerStructure(displayContent)
      : null;
  const structureScore = structured ? scoreChatAnswerStructure(structured) : null;
  const verifyHint = structured?.verify || '';
  const showDecisionCard = Boolean(
    structured && (structureScore?.isRich || message.structureRich),
  );

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
                placeholder={t('修改你的问题', 'Edit your question')}
              />
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="text-white/80">
                  {t('修改后基于这条问题重算后续回答。', 'Later replies will be recomputed from this question.')}
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={onCancelEdit}
                    className="inline-flex items-center gap-1 rounded-[3px] border border-white/40 bg-white/10 px-2 py-1 text-xs font-semibold text-white"
                  >
                    <X className="h-3 w-3" />
                    {t('取消', 'Cancel')}
                  </button>
                  <button
                    type="button"
                    onClick={() => onSubmitEdit(message.id)}
                    disabled={isActing}
                    className="inline-flex items-center gap-1 rounded-[3px] bg-white px-2 py-1 text-xs font-bold text-[#3b5998] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Check className="h-3 w-3" />
                    {isActing ? t('提交中...', 'Submitting…') : t('重新提交', 'Resubmit')}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              <p className="whitespace-pre-wrap break-words">{message.content}</p>
              {message.tacitSummary ? (
                <div className="mt-2 rounded-[4px] border border-white/25 bg-white/10 px-2 py-1.5 text-[12px] leading-5">
                  <div className="font-semibold">{t('本轮默会信息', 'This turn’s tacit context')}</div>
                  <div className="mt-0.5 text-white/85">{message.tacitSummary}</div>
                </div>
              ) : null}
              {message.materials?.length ? (
                <div className="mt-2 rounded-[4px] border border-white/25 bg-white/10 px-2 py-1.5 text-[12px] leading-5">
                  <div className="font-semibold">{t('本轮资料', 'This turn’s materials')}</div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {message.materials.map((material) => (
                      <span
                        key={material.id}
                        className="rounded-[3px] border border-white/30 bg-white/10 px-1.5 py-0.5 text-xs font-semibold"
                      >
                        {material.label}
                        {material.hasImage ? t(' · 图片', ' · image') : ''}
                      </span>
                    ))}
                  </div>
                  {message.materialSummary ? (
                    <div className="mt-1 text-white/85">{message.materialSummary}</div>
                  ) : null}
                </div>
              ) : null}
              <div className="mt-1.5 flex flex-wrap items-center justify-end gap-1.5 text-xs text-white/80">
                <span>{time}</span>
                {message.edited ? (
                  <span className="rounded-[3px] border border-white/30 px-1 py-0.5 font-semibold">
                    {t('已编辑', 'Edited')}
                  </span>
                ) : null}
                {message.tacitSummary ? (
                  <span className="rounded-[3px] border border-white/30 px-1 py-0.5 font-semibold">
                    {t('默会', 'Tacit')}
                  </span>
                ) : null}
                {message.materials?.length ? (
                  <span className="rounded-[3px] border border-white/30 px-1 py-0.5 font-semibold">
                    {t('资料', 'Materials')}
                  </span>
                ) : null}
                <button
                  type="button"
                  onClick={() => onStartEdit(message)}
                  className="inline-flex items-center gap-1 rounded-[3px] border border-white/30 px-1.5 py-0.5 font-semibold text-white/90 hover:bg-white/10"
                >
                  <Pencil className="h-3 w-3" />
                  {t('编辑', 'Edit')}
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(message.id)}
                  disabled={isActing}
                  className="inline-flex items-center gap-1 rounded-[3px] border border-white/30 px-1.5 py-0.5 font-semibold text-white/90 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Trash2 className="h-3 w-3" />
                  {isActing ? '...' : t('删除', 'Delete')}
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
          <span className="font-bold text-[#1d2129]">
            {isOpening ? t('顾问开场', 'Consultant opening') : t('结构回复', 'Structure reply')}
          </span>
          {isOpening ? (
            <span className="rounded-[3px] bg-white px-1.5 py-0.5 font-semibold text-[#606770]">
              {t('开场', 'Opening')}
            </span>
          ) : null}
          {!isOpening && message.llmUsed === false && (
            <span className="rounded-[3px] bg-[#fff7e6] px-1.5 py-0.5 font-semibold text-[#a87f2c]">
              {t('待重试', 'Retry later')}
            </span>
          )}
          {!isOpening && message.regenerated ? (
            <span className="rounded-[3px] bg-white px-1.5 py-0.5 font-semibold text-[#606770]">
              {t('已重生成', 'Regenerated')}
            </span>
          ) : null}
          {!isOpening && message.edited ? (
            <span className="rounded-[3px] bg-white px-1.5 py-0.5 font-semibold text-[#606770]">
              {t('源问题已编辑', 'Source edited')}
            </span>
          ) : null}
        </div>
        <div className="mt-1.5">
          {isOpening ? (
            <p className="whitespace-pre-wrap break-words text-[14px] leading-5 text-[#1d2129]">
              {message.content}
            </p>
          ) : (
            <ChatMarkdown content={displayContent} />
          )}
        </div>
        {efcFlagged ? (
          <div className="mt-2 rounded-[6px] border border-[#f0c36d] bg-[#fff8e6] px-2.5 py-1.5 text-[11px] leading-[1.45] text-[#7a5b00]">
            <span className="font-semibold">{t('真值校验', 'Truth check')}</span>
            <span className="ml-1">
              {t(
                '本回答部分字段可能与报告锁定的日主/用忌不完全一致',
                'Some fields may not fully match the report’s locked day master / favorable elements',
              )}
              {efcIssuesLine ? `：${efcIssuesLine}` : en ? '.' : '。'}
              {t('请以报告为准，或点「重生成」。', ' Trust the report, or tap Regenerate.')}
            </span>
          </div>
        ) : null}
        {showDecisionCard && structured ? (
          <div className="mt-2 space-y-1.5 rounded-[8px] border border-[#e4e6eb] bg-white px-2.5 py-2">
            <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#8a8d91]">
              {t('决策摘要', 'Decision summary')} · {structureScore?.filled}/{structureScore?.max}
            </div>
            {structured.conclusion ? (
              <div className="text-[12px] leading-[1.45] text-[#1d2129]">
                <span className="font-semibold text-[#3b5998]">{t('结论', 'Conclusion')}</span>
                <span className="ml-1.5">{structured.conclusion}</span>
              </div>
            ) : null}
            {structured.today || structured.in7d || structured.in30d ? (
              <div className="grid gap-1 sm:grid-cols-3">
                {[
                  { label: t('今天', 'Today'), value: structured.today },
                  { label: t('7天', '7d'), value: structured.in7d },
                  { label: t('30天', '30d'), value: structured.in30d },
                ]
                  .filter((row) => row.value)
                  .map((row) => (
                    <div
                      key={row.label}
                      className="rounded-[4px] border border-[#f0f0f0] bg-[#fafbfc] px-2 py-1.5 text-[11px] leading-[1.4] text-[#1d2129]"
                    >
                      <div className="font-semibold text-[#606770]">{row.label}</div>
                      <div className="mt-0.5">{row.value}</div>
                    </div>
                  ))}
              </div>
            ) : null}
            {structured.risk ? (
              <div className="text-[11px] leading-[1.4] text-[#7a5b00]">
                <span className="font-semibold">{t('风险', 'Risk')}</span>
                <span className="ml-1">{structured.risk}</span>
              </div>
            ) : null}
            {structured.basis ? (
              <div className="text-[11px] leading-[1.4] text-[#606770]">
                <span className="font-semibold">{t('依据', 'Basis')}</span>
                <span className="ml-1">{structured.basis}</span>
              </div>
            ) : null}
          </div>
        ) : null}
        {verifyHint ? (
          <div className="mt-2 rounded-[6px] border border-[#d4e4f7] bg-[#f0f6ff] px-2.5 py-1.5 text-[11px] leading-[1.45] text-[#365899]">
            <span className="font-semibold">{t('验证点', 'Verify')}</span>
            <span className="ml-1">{verifyHint}</span>
          </div>
        ) : null}
        {!isOpening &&
        (structureScore?.isThin || message.structureThin) &&
        message.llmUsed !== false ? (
          <div className="mt-1.5 text-[11px] leading-[1.4] text-[#8a8d91]">
            {t(
              '本条未完全按「依据 → 结论 → 动作 → 验证」展开',
              'This reply did not fully expand basis → conclusion → action → verify',
            )}
            {structureScore?.missing?.length
              ? en
                ? ` (missing ${structureScore.missing.slice(0, 3).join(', ')})`
                : `（缺 ${structureScore.missing.slice(0, 3).join('、')}）`
              : ''}
            {t('，可点重生成。', '. You can regenerate.')}
          </div>
        ) : null}
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-[#606770]">
          <span>
            {isOpening
              ? t(
                  '本地开场 · 点下方议题或一键开口即可开始',
                  'Local opening · tap a topic or starter below to begin',
                )
              : message.llmUsed
                ? t('结合当前报告与对话内容生成', 'Generated from the current report and conversation')
                : message.fallbackReason
                  ? t(
                      `简化回答（${message.fallbackReason}）；可点重生成。`,
                      `Simplified answer (${message.fallbackReason}); you can regenerate.`,
                    )
                  : t(
                      '这次没有拿到可用解析，未硬编答案；可点重生成。',
                      'No usable parse this time — no invented answer. You can regenerate.',
                    )}
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
                  aria-label={t('有用', 'Helpful')}
                  title={t('有用', 'Helpful')}
                >
                  <ThumbsUp className="h-3 w-3" />
                  {t('有用', 'Helpful')}
                </button>
                <button
                  type="button"
                  onClick={() => onFeedback(message.id, 'not_helpful')}
                  disabled={isActing}
                  className={`fb-btn inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-60 ${
                    feedback === 'not_helpful' ? 'text-[#c0392b]' : 'text-[#1d2129]'
                  }`}
                  aria-label={t('不实或无帮助', 'Not helpful')}
                  title={t('不实或无帮助', 'Not helpful')}
                >
                  <ThumbsDown className="h-3 w-3" />
                  {t('无帮助', 'Not helpful')}
                </button>
                <button
                  type="button"
                  onClick={() => onFeedback(message.id, 'empty')}
                  disabled={isActing}
                  className={`fb-btn inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-60 ${
                    feedback === 'empty' ? 'text-[#a87f2c]' : 'text-[#1d2129]'
                  }`}
                  title={t('太空 / 套话', 'Too vague / generic')}
                >
                  {t('太空', 'Vague')}
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
                {isActing ? '...' : t('重生成', 'Regenerate')}
              </button>
            ) : null}
            {!isOpening && previousUserQuestion ? (
              <button
                type="button"
                onClick={() => onSaveEvent(previousUserQuestion, message.content, message.id)}
                disabled={isSaving || isSaved}
                className="fb-btn inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-[#1d2129] disabled:cursor-not-allowed disabled:opacity-60"
                title={
                  verifyHint
                    ? t(`将验证点记入事件：${verifyHint}`, `Save verify point to events: ${verifyHint}`)
                    : t('把结论记入事件日历以便回访', 'Save the conclusion to the event calendar for revisit')
                }
              >
                {isSaved ? <CheckCircle2 className="h-3 w-3 text-[#2f7d52]" /> : null}
                {isSaved
                  ? t('已记验证', 'Saved verify')
                  : isSaving
                    ? t('保存中...', 'Saving…')
                    : t('记验证点', 'Save verify')}
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => onCopy(message.id, message.content)}
              className="fb-btn inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-[#1d2129]"
            >
              <Copy className="h-3 w-3" />
              {copied ? t('已复制', 'Copied') : t('复制', 'Copy')}
            </button>
            <button
              type="button"
              onClick={() => onDelete(message.id)}
              disabled={isActing}
              className="fb-btn inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-[#1d2129] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Trash2 className="h-3 w-3" />
              {t('删除', 'Delete')}
            </button>
          </div>
        </div>
        {!isOpening && feedback ? (
          <div className="mt-1.5 text-[11px] text-[#8a8d91]">
            {t('已记录反馈：', 'Feedback saved: ')}
            {feedback === 'helpful'
              ? t('有用', 'Helpful')
              : feedback === 'not_helpful'
                ? t('无帮助', 'Not helpful')
                : t('太空/套话', 'Vague / generic')}
          </div>
        ) : null}
      </div>
    </div>
  );
}
