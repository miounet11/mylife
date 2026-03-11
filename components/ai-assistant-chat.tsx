'use client';

import { useEffect, useRef, useState } from 'react';
import { Bot, Send, Sparkles } from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  llmUsed?: boolean;
}

interface QuickQuestionButtonProps {
  question: string;
  onClick: () => void;
  disabled?: boolean;
}

const quickQuestions = [
  '我最近事业运如何？',
  '接下来三个月财运怎么样？',
  '我该如何判断一段关系是否值得推进？',
  '今年最需要规避的风险是什么？',
];

export default function AIAssistantChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        setLoadingHistory(true);
        setError('');
        const response = await fetch('/api/chat', { cache: 'no-store' });
        const data = await response.json();
        if (!response.ok || !data.success) {
          setError(data.error || '加载聊天历史失败');
          return;
        }

        const mapped = (data.history || []).map((item: any) => ({
          id: item.id,
          role: item.role,
          content: item.content || '',
          timestamp: item.timestamp ? new Date(item.timestamp) : new Date(),
          llmUsed: item.role === 'assistant' ? !!item.llmUsed : undefined,
        }));

        setMessages(mapped);
      } catch {
        setError('网络异常，加载聊天历史失败');
      } finally {
        setLoadingHistory(false);
      }
    };

    loadHistory();
  }, []);

  const sendQuestion = async (rawQuestion: string) => {
    if (isTyping || loadingHistory) return;
    const question = rawQuestion.trim();
    if (!question) return;

    const userMessage: ChatMessage = {
      id: `${Date.now()}_user`,
      role: 'user',
      content: question,
      timestamp: new Date(),
    };

    setMessages((current) => [...current, userMessage]);
    setInput('');
    setIsTyping(true);
    setError('');

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        setError(data.error || 'AI 回复失败，请稍后重试');
        return;
      }

      setMessages((current) => [
        ...current,
        {
          id: `${Date.now()}_assistant`,
          role: 'assistant',
          content: data.answer || '当前无法生成答案，请稍后重试。',
          timestamp: new Date(),
          llmUsed: !!data.llmUsed,
        },
      ]);

      if (!data.llmUsed) {
        setError('当前回答由兜底策略生成，深度模型暂时不可用。');
      }
    } catch {
      setError('网络异常，AI 回复失败');
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex h-full flex-col bg-transparent">
      <div className="border-b border-white/60 bg-white/70 p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[color:var(--accent-soft)] text-[color:var(--accent-strong)]">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-semibold text-[color:var(--ink)]">AI 命理助手</h2>
            <p className="text-sm text-[color:var(--muted)]">看完报告后继续追问，把理解变成行动。</p>
          </div>
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-5">
        {error && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {error}
          </div>
        )}

        {loadingHistory && <div className="py-10 text-center text-sm text-[color:var(--muted)]">正在载入对话历史...</div>}

        {!loadingHistory && messages.length === 0 && (
          <div className="space-y-6 rounded-[1.75rem] bg-white/75 p-6">
            <div>
              <div className="section-label">
                <Sparkles className="h-3.5 w-3.5" />
                快速开始
              </div>
              <h3 className="mt-4 text-2xl font-bold text-[color:var(--ink)]">先问一个具体问题</h3>
              <p className="mt-2 text-sm leading-7 text-[color:var(--muted)]">
                比如“我应该在什么时间推进跳槽？”、“今年适合投入新关系吗？”这类问题更容易得到有用回答。
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {quickQuestions.map((question) => (
                <QuickQuestionButton
                  key={question}
                  question={question}
                  onClick={() => sendQuestion(question)}
                  disabled={isTyping || loadingHistory}
                />
              ))}
            </div>
          </div>
        )}

        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}

        {isTyping && (
          <div className="flex justify-start">
            <div className="rounded-[1.5rem] bg-white px-4 py-3 text-sm text-[color:var(--muted)]">AI 正在推演，请稍候...</div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-white/60 bg-white/70 p-5">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void sendQuestion(input);
          }}
          className="flex items-end gap-3"
        >
          <div className="flex-1">
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="输入你最关心的一个问题..."
              rows={2}
              className="w-full resize-none rounded-[1.5rem] border border-[color:var(--line)] bg-white px-4 py-3 text-[color:var(--ink)] outline-none transition focus:border-[color:var(--accent)] focus:ring-4 focus:ring-[color:var(--accent-soft)]"
              disabled={isTyping}
            />
          </div>
          <button
            type="submit"
            disabled={!input.trim() || isTyping}
            className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--accent),var(--accent-strong))] text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const time = new Date(message.timestamp).toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  });

  if (message.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-2xl rounded-[1.75rem] bg-[linear-gradient(135deg,var(--accent),var(--accent-strong))] px-5 py-4 text-white shadow-[0_14px_32px_rgba(15,118,110,0.18)]">
          <p className="text-sm leading-7">{message.content}</p>
          <p className="mt-2 text-xs text-white/75">{time}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start">
      <div className="max-w-3xl rounded-[1.75rem] border border-[color:var(--line)] bg-white px-5 py-4 shadow-[0_16px_32px_rgba(23,32,51,0.06)]">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-[color:var(--ink)]">命理回复</span>
          {message.llmUsed === false && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700">兜底模式</span>
          )}
        </div>
        <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[color:var(--ink)]">{message.content}</p>
        <div className="mt-4 flex items-center justify-between text-xs text-[color:var(--muted)]">
          <span>{message.llmUsed ? '基于实时模型与上下文生成' : '当前为兜底回答'}</span>
          <span>{time}</span>
        </div>
      </div>
    </div>
  );
}

function QuickQuestionButton({ question, onClick, disabled = false }: QuickQuestionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="rounded-[1.5rem] border border-[color:var(--line)] bg-white px-4 py-4 text-left text-sm leading-7 text-[color:var(--ink)] transition hover:border-[color:var(--accent)] hover:bg-[color:var(--accent-soft)] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {question}
    </button>
  );
}
