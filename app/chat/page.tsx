// AI聊天页面 - 完整版本
'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

// 动态导入以减少首屏加载
const AIAssistantChat = dynamic(() => import('@/components/ai-assistant-chat'), {
  loading: () => <ChatSkeleton />,
});

export default function ChatPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-slate-600 hover:text-indigo-600">
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">返回首页</span>
          </Link>
          <h1 className="text-lg font-semibold text-slate-900">AI命理助手</h1>
          <Link href="/profile" className="text-sm text-slate-600 hover:text-indigo-600">
            我的档案
          </Link>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-6">
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden h-[calc(100vh-112px)]">
            <AIAssistantChat />
        </div>
      </main>
    </div>
  );
}

// 骨架组件
function ChatSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="h-16 bg-white border-b border-slate-200"></div>

      <div className="max-w-5xl mx-auto px-4 py-4">
        <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-4 h-[calc(100vh-112px)]">
          <div className="h-12 bg-slate-100 rounded animate-pulse"></div>
          <div className="h-48 bg-slate-100 rounded animate-pulse"></div>
          <div className="h-28 bg-slate-100 rounded animate-pulse"></div>
        </div>
      </div>
    </div>
  );
}
