// 命理表单组件 - 核心输入组件（单页快速填写）
'use client';

import { useState } from 'react';
import FortuneProgress from './fortune-progress';

interface FortuneFormData {
  name: string;
  gender: 'male' | 'female';
  birthDate: string;
  birthTime: string;
  birthPlace: string;
  timezone: number;
}

export default function FortuneForm() {
  const [formData, setFormData] = useState<FortuneFormData>({
    name: '',
    gender: 'male',
    birthDate: '',
    birthTime: '',
    birthPlace: '',
    timezone: 8,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        window.location.href = `/result/${result.reportId}`;
      } else {
        setError(result.error || '分析失败，请重试');
      }
    } catch (err) {
      console.error('分析失败:', err);
      setError('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-2xl p-8">
      {/* 大师话术开头 */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center space-x-3 bg-purple-50 rounded-full px-6 py-3 mb-4">
          <span className="text-2xl">🔮</span>
          <span className="text-sm text-purple-700 font-medium">AI命理大师</span>
        </div>
        <p className="text-lg text-gray-700 leading-relaxed">
          <span className="text-purple-600 font-semibold">填写您的出生信息，即刻获取命理分析</span>
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* 姓名 + 性别 */}
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">姓名</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:ring-purple-500 transition"
              placeholder="请输入您的姓名"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">性别</label>
            <select
              value={formData.gender}
              onChange={(e) => setFormData({ ...formData, gender: e.target.value as 'male' | 'female' })}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:ring-purple-500 transition"
            >
              <option value="male">男</option>
              <option value="female">女</option>
            </select>
          </div>
        </div>

        {/* 出生日期 + 出生时间 */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">出生日期</label>
            <input
              type="date"
              value={formData.birthDate}
              onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:ring-purple-500 transition"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">出生时间</label>
            <input
              type="time"
              value={formData.birthTime}
              onChange={(e) => setFormData({ ...formData, birthTime: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:ring-purple-500 transition"
              required
            />
          </div>
        </div>

        {/* 出生地 + 时区 */}
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">出生地</label>
            <input
              type="text"
              value={formData.birthPlace}
              onChange={(e) => setFormData({ ...formData, birthPlace: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:ring-purple-500 transition"
              placeholder="如：北京市"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">时区</label>
            <select
              value={formData.timezone}
              onChange={(e) => setFormData({ ...formData, timezone: parseInt(e.target.value) })}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:ring-purple-500 transition"
            >
              <option value="8">东八区</option>
              <option value="9">东九区</option>
              <option value="7">东七区</option>
              <option value="-8">西八区</option>
              <option value="-5">西五区</option>
            </select>
          </div>
        </div>

        <div className="bg-purple-50 rounded-lg p-3">
          <p className="text-sm text-purple-700">
            💡 出生时间越精确，命理分析越准确。
          </p>
        </div>

        {/* 提交按钮 */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-4 px-6 rounded-lg text-lg font-semibold hover:shadow-lg transform hover:scale-[1.02] transition disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          {loading ? (
            <span className="flex items-center justify-center space-x-3">
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              <span>正在分析中...</span>
            </span>
          ) : (
            '开始命理分析'
          )}
        </button>
      </form>
    </div>
  );
}
