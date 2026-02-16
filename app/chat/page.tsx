// AI聊天页面 - 完整版本
'use client';

import dynamic from 'next/dynamic';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Send, Bot, User, Loader2, MoreHorizontal, Settings, History } from 'lucide-react';
import { generateId } from '@/lib/utils';
import { cn } from '@/lib/utils';

// 动态导入以减少首屏加载
const AIAssistantChat = dynamic(() => import('@/components/ai-assistant-chat'), {
  loading: () => <ChatSkeleton />,
});

export default function ChatPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex flex-col h-screen bg-gradient-to-b from-white to-purple-50">
      {/* 顶部导航 */}
      <nav className="bg-white shadow-md border-b border-gray-200">
        <div className="flex items-center justify-between h-16 px-4">
          {/* Logo和标题 */}
          <Link href="/" className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-white font-bold">
              K
            </div>
            <div className="text-xl font-bold text-gray-900 hidden md:block">
              人生K线
            </div>
          </Link>

          {/* 标题 */}
          <h1 className="text-2xl font-bold text-gray-900">
            AI命理助手
          </h1>

          {/* 右侧操作 */}
          <div className="flex items-center space-x-4">
            <button className="p-2 hover:bg-purple-50 rounded-lg transition">
              <History className="w-5 h-5 text-gray-500" />
            </button>
            <button className="p-2 hover:bg-purple-50 rounded-lg transition">
              <Settings className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>
      </nav>

      {/* 主内容 */}
      <main className="flex-1 overflow-hidden">
        <div className="flex h-full">
          {/* 左侧：对话区域 */}
          <div className="flex-1 overflow-hidden">
            <AIAssistantChat />
          </div>

          {/* 右侧：信息面板（可选） */}
          <aside className="hidden lg:block w-80 bg-white border-l border-gray-200 p-4 overflow-y-auto">
            <h3 className="font-bold text-gray-900 mb-4 text-lg">使用指南</h3>
            
            <div className="space-y-3 mb-6">
              <div className="p-3 bg-purple-50 rounded-lg">
                <h4 className="font-semibold text-purple-900 mb-2">💡 常见问题</h4>
                <ul className="space-y-2 text-sm text-purple-700">
                  <li>我最近事业运如何？</li>
                  <li>本月财运怎么样？</li>
                  <li>我什么时候结婚？</li>
                  <li>我最近健康怎么样？</li>
                </ul>
              </div>
              
              <div className="p-3 bg-blue-50 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">🔮 命理功能</h4>
                <ul className="space-y-2 text-sm text-blue-700">
                  <li>查看我的八字</li>
                  <li>查看我的运势</li>
                  <li>查看我的事件</li>
                  <li>查看我的档案</li>
                </ul>
              </div>
              
              <div className="p-3 bg-green-50 rounded-lg">
                <h4 className="font-semibold text-green-900 mb-2">✨ 增运技巧</h4>
                <ul className="space-y-2 text-sm text-green-700">
                  <li>今日吉方：南方</li>
                  <li>今日吉色：红色系</li>
                  <li>今日吉事：签约</li>
                  <li>今日忌事：开业</li>
                </ul>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <h4 className="font-bold text-gray-900 mb-3">使用统计</h4>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>今日提问：</span>
                  <span className="font-semibold">3次</span>
                </div>
                <div className="flex justify-between">
                  <span>累计提问：</span>
                  <span className="font-semibold">127次</span>
                </div>
                <div className="flex justify-between">
                  <span>使用天数：</span>
                  <span className="font-semibold">45天</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-200">
              <Link
                href="/profile"
                className="block text-center bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:shadow-lg transition"
              >
                查看我的完整档案 →
              </Link>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

// 骨架组件
function ChatSkeleton() {
  return (
    <div className="flex flex-col h-screen bg-gradient-to-b from-white to-purple-50">
      {/* 导航栏 */}
      <div className="h-16 bg-white shadow-md animate-pulse"></div>

      {/* 主内容 */}
      <div className="flex-1 flex space-y-4 p-4">
        <div className="h-20 bg-gray-200 rounded-xl animate-pulse"></div>
        
        {/* 消息列表 */}
        <div className="space-y-4 flex-1">
          <div className="h-64 bg-gray-200 rounded-xl animate-pulse"></div>
          <div className="flex justify-end">
            <div className="w-3/4 h-20 bg-gray-200 rounded-xl animate-pulse"></div>
          </div>
          <div className="flex justify-start">
            <div className="w-3/4 h-28 bg-gray-200 rounded-xl animate-pulse"></div>
          </div>
          <div className="h-20 bg-gray-200 rounded-xl animate-pulse"></div>
          <div className="h-20 bg-gray-200 rounded-xl animate-pulse"></div>
        </div>
      </div>

      {/* 输入区域 */}
      <div className="p-4 border-t border-gray-200">
        <div className="h-14 bg-gray-200 rounded-xl animate-pulse"></div>
      </div>
    </div>
  );
}
