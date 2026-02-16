// AI助手对话组件 - 持续依赖的核心组件
'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, MoreHorizontal } from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  analysis?: {
    fortuneContext: string;
    personalized: boolean;
  };
}

export default function AIAssistantChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 模拟AI回复
  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages([...messages, userMessage]);
    setInput('');
    setIsTyping(true);

    // 模拟AI分析延迟
    await new Promise(resolve => setTimeout(resolve, 2000));

    const aiMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: await generateAIResponse(input, messages),
      timestamp: new Date(),
      analysis: {
        fortuneContext: '基于您的八字分析',
        personalized: true,
      },
    };

    setMessages(prev => [...prev, aiMessage]);
    setIsTyping(false);
  };

  const generateAIResponse = async (question: string, history: ChatMessage[]): Promise<string> => {
    // 这里应该调用实际的AI API
    // 暂时返回模拟响应
    const responses = [
      `根据您的八字，您最近问的"${question}"...从您的日主来看，${generateFortuneAnalysis()}。`,
      `关于"${question}"的问题，从您的命局来看，${generateSpecificAdvice()}。`,
      `您关心的${question}，从您的运势来看，${generateTimingAdvice()}。`,
    ];

    return responses[Math.floor(Math.random() * responses.length)];
  };

  const generateFortuneAnalysis = (): string => {
    const phrases = [
      '日主得令而旺，事业运势良好',
      '五行相生有情，财运亨通',
      '格局清奇，主事业有成',
      '印星得用，得贵人相助',
    ];
    return phrases[Math.floor(Math.random() * phrases.length)];
  };

  const generateSpecificAdvice = (): string => {
    const phrases = [
      '近期运势上升，宜把握机遇',
      '目前处于平稳期，宜稳中求进',
      '建议南方发展，有利于事业',
      '宜穿红色系衣服，提升运势',
    ];
    return phrases[Math.floor(Math.random() * phrases.length)];
  };

  const generateTimingAdvice = (): string => {
    const phrases = [
      '下月是您的黄金期，宜积极进取',
      '未来三个月运势平稳，按部就班',
      '今年下半年会有重大机遇，把握时机',
      '明年大运转换，宜做好规划',
    ];
    return phrases[Math.floor(Math.random() * phrases.length)];
  };

  const handleQuickQuestion = (question: string) => {
    setInput(question);
    handleSend();
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-white to-purple-50">
      {/* 对话标题栏 */}
      <div className="flex items-center justify-between border-b-2 border-purple-200 bg-white p-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-white">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">AI命理助手</h3>
            <p className="text-xs text-gray-500">24小时在线 · 专业解读</p>
          </div>
        </div>
        <button className="p-2 hover:bg-purple-50 rounded-lg transition">
          <MoreHorizontal className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {/* 对话区域 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* 欢迎消息 */}
        {messages.length === 0 && (
          <div className="text-center py-12 animate-fade-in">
            <div className="inline-flex items-center space-x-3 bg-purple-50 rounded-full px-6 py-3 mb-4">
              <span className="text-2xl">🤖</span>
              <span className="text-sm text-purple-700 font-medium">AI命理助手</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              我是您的专属命理AI
            </h2>
            <p className="text-gray-600 mb-6 leading-relaxed">
              24小时在线，随时回答您的命理问题。<br />
              基于您的八字，提供精准的个性化建议。
            </p>
            <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
              <QuickQuestionBtn
                icon="👔"
                question="我最近事业运如何？"
                onClick={() => handleQuickQuestion('我最近事业运如何？')}
              />
              <QuickQuestionBtn
                icon="💰"
                question="本月财运怎么样？"
                onClick={() => handleQuickQuestion('本月财运怎么样？')}
              />
              <QuickQuestionBtn
                icon="❤️"
                question="我什么时候结婚？"
                onClick={() => handleQuickQuestion('我什么时候结婚？')}
              />
              <QuickQuestionBtn
                icon="🧘"
                question="我最近健康怎么样？"
                onClick={() => handleQuickQuestion('我最近健康怎么样？')}
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
            <div className="bg-purple-100 rounded-lg px-4 py-3 max-w-md">
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
                <span className="text-sm text-purple-700">AI正在思考...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 输入区域 */}
      <div className="border-t border-purple-200 bg-white p-4">
        <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex space-x-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="问我任何命理问题..."
            className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:ring-purple-500 transition"
            disabled={isTyping}
          />
          <button
            type="submit"
            disabled={!input.trim() || isTyping}
            className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
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
      <div className="flex justify-end mb-4 animate-fade-in">
        <div className="bg-blue-600 text-white rounded-lg px-4 py-3 max-w-md">
          <p className="text-sm">{message.content}</p>
          <p className="text-xs text-blue-200 mt-1">
            {new Date(message.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start mb-4 animate-fade-in">
      <div className="bg-white border-2 border-purple-200 rounded-lg p-4 max-w-2xl shadow-md">
        {/* 个性化开头 */}
        <div className="mb-3 pb-3 border-b border-purple-100">
          <p className="text-purple-900 font-semibold mb-1">
            {message.analysis?.personalized && (
              <span className="inline-flex items-center space-x-2 mr-2">
                <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-600 text-xs flex items-center justify-center">✓</span>
              </span>
            )}
            {message.content.split('\n')[0]}
          </p>
        </div>

        {/* 命理分析 */}
        <div className="bg-purple-50 rounded-lg p-3 mb-3">
          <p className="text-sm text-gray-700 leading-relaxed">
            {message.content.split('\n').slice(1).join('\n')}
          </p>
        </div>

        {/* 具体建议 */}
        <div className="space-y-2">
          {message.content.split('\n').slice(2).map((line, i) => (
            line && (
              <div key={i} className="flex items-start">
                <span className="text-green-600 mr-2 mt-0.5">✓</span>
                <span className="text-sm text-gray-600">{line}</span>
              </div>
            )
          ))}
        </div>

        {/* 数据支撑 */}
        <div className="bg-gray-50 rounded-lg p-3 mt-3">
          <p className="text-xs text-gray-500">
            数据支撑：根据您的八字分析，{message.analysis?.fortuneContext}
          </p>
        </div>

        <p className="text-xs text-gray-400 mt-2">
          {new Date(message.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  );
}

function QuickQuestionBtn({ icon, question, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className="w-full bg-white border-2 border-purple-200 rounded-lg p-3 hover:border-purple-400 hover:shadow-md transition text-left"
    >
      <span className="text-xl mr-2">{icon}</span>
      <span className="text-sm text-gray-700">{question}</span>
    </button>
  );
}
