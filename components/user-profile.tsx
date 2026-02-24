// 用户档案组件
'use client';

import { useState } from 'react';
import { Edit } from 'lucide-react';

export default function UserProfile() {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
      {/* 柱头 */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center">
              <span className="text-2xl">👤</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">张先生</h2>
              <p className="text-white opacity-80">男 · 35岁 · 北京</p>
            </div>
          </div>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="flex items-center space-x-2 bg-white text-purple-600 px-4 py-2 rounded-lg font-semibold hover:bg-purple-50 transition"
          >
            <Edit className="w-4 h-4" />
            {isEditing ? '保存' : '编辑'}
          </button>
        </div>
      </div>

      {/* 命理摘要 */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-purple-50 rounded-lg p-4">
            <h3 className="font-bold text-purple-900 mb-2">日主</h3>
            <p className="text-2xl font-bold text-purple-600">甲木</p>
          </div>
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="font-bold text-blue-900 mb-2">格局</h3>
            <p className="text-lg font-semibold text-blue-700">从杀格</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <h3 className="font-bold text-green-900 mb-2">大运</h3>
            <p className="text-lg font-semibold text-green-700">丙子大运</p>
          </div>
        </div>

        {/* 出生信息 */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="font-bold text-gray-900 mb-2">出生信息</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">出生日期</span>
                <span className="font-semibold text-gray-900">1989年3月15日</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">出生时间</span>
                <span className="font-semibold text-gray-900">上午8:30</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">出生地</span>
                <span className="font-semibold text-gray-900">北京市</span>
              </div>
            </div>
          </div>
          <div>
            <h3 className="font-bold text-gray-900 mb-2">统计信息</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">使用天数</span>
                <span className="font-semibold text-gray-900">127天</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">分析次数</span>
                <span className="font-semibold text-gray-900">34次</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">保存事件</span>
                <span className="font-semibold text-gray-900">8个</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

