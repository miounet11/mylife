// AI助手对话组件 - 持续依赖的核心组件
'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Bot } from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  llmUsed?: boolean;
  analysis?: {
    fortuneContext: string;
    personalized: boolean;
  };
}

interface QuickQuestionBtnProps {
  icon: string;
  question: string;
  onClick: () => void;
  disabled?: boolean;
}

export default function AIAssistantChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        setError('');
        setLoadingHistory(true);
        const res = await fetch('/api/chat', { cache: 'no-store' });
        const data = await res.json();
        if (!res.ok || !data.success) {
          setError(data.error || '加载聊天历史失败');
          return;
        }

        const mapped: ChatMessage[] = (data.history || []).map((item: any) => ({
          id: item.id,
          role: item.role,
          content: item.content || '',
          timestamp: item.timestamp ? new Date(item.timestamp) : new Date(),
          llmUsed: item.role === 'assistant' ? !!item.llmUsed : undefined,
          analysis: item.role === 'assistant'
            ? {
                fortuneContext: item.llmUsed ? '基于实时LLM推演' : '当前使用兜底回复',
                personalized: !!item.llmUsed,
              }
            : undefined,
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
      id: Date.now().toString(),
      role: 'user',
      content: question,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);
    setError('');

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || 'AI回复失败，请稍后重试');
        return;
      }

      const llmUsed = !!data.llmUsed;
      const aiMessage: ChatMessage = {
        id: `${Date.now()}_assistant`,
        role: 'assistant',
        content: data.answer || '大师暂时在休息，请稍后再问。',
        timestamp: new Date(),
        llmUsed,
        analysis: {
          fortuneContext: llmUsed ? '基于实时LLM推演' : '当前使用兜底回复',
          personalized: llmUsed,
        },
      };

      setMessages((prev) => [...prev, aiMessage]);
      if (!llmUsed) {
        setError('当前回答由兜底策略生成，LLM暂不可用。');
      }
    } catch {
      setError('网络异常，AI回复失败');
    } finally {
      setIsTyping(false);
    }
  };

  const handleSend = async () => {
    await sendQuestion(input);
  };

  const handleQuickQuestion = async (question: string) => {
    await sendQuestion(question);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* 对话标题栏 */}
      <div className="flex items-center border-b border-slate-200 bg-white p-4">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded bg-indigo-600 flex items-center justify-center text-white">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">AI命理助手</h3>
            <p className="text-xs text-slate-500">连续对话 · 已接入历史上下文</p>
          </div>
        </div>
      </div>

      {/* 对话区域 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {error && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 px-3 py-2 rounded text-sm">
            {error}
          </div>
        )}

        {loadingHistory && (
          <div className="text-center text-sm text-slate-500 py-8">正在加载历史对话...</div>
        )}

        {/* 欢迎消息 */}
        {messages.length === 0 && !loadingHistory && (
          <div className="text-center py-10">
            <h2 className="text-xl font-semibold text-slate-900 mb-2">开始一次命理问答</h2>
            <p className="text-slate-600 mb-6 leading-relaxed">
              你可以直接提问，或使用下面的常见问题快速开始。
            </p>
            <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
              <QuickQuestionBtn
                icon="👔"
                question="我最近事业运如何？"
                onClick={() => handleQuickQuestion('我最近事业运如何？')}
                disabled={isTyping || loadingHistory}
              />
              <QuickQuestionBtn
                icon="💰"
                question="本月财运怎么样？"
                onClick={() => handleQuickQuestion('本月财运怎么样？')}
                disabled={isTyping || loadingHistory}
              />
              <QuickQuestionBtn
                icon="❤️"
                question="我什么时候结婚？"
                onClick={() => handleQuickQuestion('我什么时候结婚？')}
                disabled={isTyping || loadingHistory}
              />
              <QuickQuestionBtn
                icon="🧘"
                question="我最近健康怎么样？"
                onClick={() => handleQuickQuestion('我最近健康怎么样？')}
                disabled={isTyping || loadingHistory}
              />
            </div>
          </div>
        )}

        {/* 消息列表 */}
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}

        {/* 正在输入 */}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-slate-100 rounded px-4 py-2 max-w-md text-sm text-slate-600">
              AI正在思考...
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 输入区域 */}
      <div className="border-t border-slate-200 bg-white p-4">
        <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex space-x-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="问我任何命理问题..."
            className="flex-1 px-4 py-3 border border-slate-300 rounded focus:outline-none focus:border-indigo-500"
            disabled={isTyping}
          />
          <button
            type="submit"
            disabled={!input.trim() || isTyping}
            className="bg-indigo-600 text-white px-5 py-3 rounded font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  if (message.role === 'user') {
    return (
      <div className="flex justify-end mb-4">
        <div className="bg-indigo-600 text-white rounded px-4 py-3 max-w-md">
          <p className="text-sm">{message.content}</p>
          <p className="text-xs text-indigo-100 mt-1">
            {new Date(message.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start mb-4">
      <div className="bg-white border border-slate-200 rounded p-4 max-w-2xl">
        <div className="mb-2 flex items-center gap-2">
          <span className="text-sm font-medium text-slate-800">命理回复</span>
          {message.llmUsed === false && (
            <span className="text-[11px] px-2 py-0.5 rounded bg-amber-100 text-amber-700">兜底</span>
          )}
        </div>

        <div className="bg-slate-50 rounded p-3 mb-3">
          <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{message.content}</p>
        </div>

        <div className="bg-slate-50 rounded p-2 mt-3">
          <p className="text-xs text-slate-500">
            {message.llmUsed ? '基于实时LLM推演' : '当前使用兜底回复'}
          </p>
        </div>

        <p className="text-xs text-slate-400 mt-2">
          {new Date(message.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  );
}

function QuickQuestionBtn({ icon, question, onClick, disabled = false }: QuickQuestionBtnProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="w-full bg-white border border-slate-200 rounded p-3 hover:border-indigo-300 transition text-left disabled:opacity-60 disabled:cursor-not-allowed"
    >
      <span className="text-xl mr-2">{icon}</span>
      <span className="text-sm text-slate-700">{question}</span>
    </button>
  );
}
