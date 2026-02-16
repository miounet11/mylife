// 命理表单组件 - 核心输入组件
'use client';

import { useState } from 'react';

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
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      
      const result = await response.json();
      
      if (result.success) {
        // 跳转到可信报告页
        window.location.href = `/trust-report/${result.id}`;
      }
    } catch (error) {
      console.error('分析失败:', error);
      alert('分析失败，请重试');
    } finally {
      setLoading(false);
    }
  };
  
  const handleNext = () => {
    setStep(step + 1);
  };
  
  const handlePrev = () => {
    setStep(step - 1);
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-2xl p-8">
      {/* 大师话术开头 */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center space-x-3 bg-purple-50 rounded-full px-6 py-3 mb-4">
          <span className="text-2xl">🔮</span>
          <span className="text-sm text-purple-700 font-medium">AI命理大师</span>
        </div>
        <p className="text-xl text-gray-700 leading-relaxed">
          <span className="text-purple-600 font-semibold">细观您的八字，命理之象，历历在目。</span>
          <br />
          让我为您进行精准的命理分析...
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 步骤1：基本信息 */}
        {step === 1 && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                您的姓名
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:ring-purple-500 transition"
                placeholder="请输入您的姓名"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  性别
                </label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value as 'male' | 'female' })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:ring-purple-500 transition"
                  required
                >
                  <option value="male">男</option>
                  <option value="female">女</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  出生时区
                </label>
                <select
                  value={formData.timezone}
                  onChange={(e) => setFormData({ ...formData, timezone: parseInt(e.target.value) })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:ring-purple-500 transition"
                  required
                >
                  <option value="8">东八区 (北京时间)</option>
                  <option value="9">东九区 (日本/韩国)</option>
                  <option value="7">东七区 (曼谷)</option>
                  <option value="-8">西八区 (美国西)</option>
                  <option value="-5">东五区 (澳洲)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                出生地
              </label>
              <input
                type="text"
                value={formData.birthPlace}
                onChange={(e) => setFormData({ ...formData, birthPlace: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:ring-purple-500 transition"
                placeholder="如：北京市/广东省"
                required
              />
            </div>

            <button
              type="button"
              onClick={handleNext}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-4 px-6 rounded-lg font-semibold hover:shadow-lg transform hover:scale-105 transition"
            >
              下一步 →
            </button>
          </div>
        )}

        {/* 步骤2：出生时间 */}
        {step === 2 && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                出生日期
              </label>
              <input
                type="date"
                value={formData.birthDate}
                onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:ring-purple-500 transition"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                出生时间 (精确到分钟)
              </label>
              <input
                type="time"
                value={formData.birthTime}
                onChange={(e) => setFormData({ ...formData, birthTime: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:ring-purple-500 transition"
                required
              />
            </div>

            <div className="bg-purple-50 rounded-lg p-4 mb-4">
              <p className="text-sm text-purple-700">
                <span className="font-semibold">💡 时间提示：</span>
                出生时间越精确，命理分析越准确。请务必提供准确的出生时间。
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={handlePrev}
                className="w-full bg-white text-gray-700 border-2 border-gray-300 py-3 px-6 rounded-lg font-semibold hover:bg-gray-50 transition"
              >
                ← 上一步
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:shadow-lg transform hover:scale-105 transition"
              >
                下一步 →
              </button>
            </div>
          </div>
        )}

        {/* 步骤3：确认提交 */}
        {step === 3 && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6 mb-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">请确认您的信息</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">姓名：</span>
                  <span className="font-semibold text-gray-900">{formData.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">性别：</span>
                  <span className="font-semibold text-gray-900">{formData.gender === 'male' ? '男' : '女'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">出生日期：</span>
                  <span className="font-semibold text-gray-900">{formData.birthDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">出生时间：</span>
                  <span className="font-semibold text-gray-900">{formData.birthTime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">出生地：</span>
                  <span className="font-semibold text-gray-900">{formData.birthPlace}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4 mb-6">
              <input
                type="checkbox"
                id="agree"
                className="w-5 h-5 text-purple-600 rounded border-2 border-purple-300 focus:ring-purple-500"
                required
              />
              <label htmlFor="agree" className="text-sm text-gray-700">
                我已确认以上信息准确无误
              </label>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={handlePrev}
                className="w-full bg-white text-gray-700 border-2 border-gray-300 py-3 px-6 rounded-lg font-semibold hover:bg-gray-50 transition"
              >
                ← 修改信息
              </button>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-4 px-6 rounded-lg font-semibold hover:shadow-lg transform hover:scale-105 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '正在分析...' : '开始精准分析 →'}
              </button>
            </div>
          </div>
        )}

        {/* 提交中 */}
        {loading && (
          <div className="text-center py-12 animate-pulse">
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 border-4 border-purple-300 border-t-purple-600 rounded-full animate-spin"></div>
            </div>
            <p className="text-lg text-purple-600 font-medium">
              正在为您进行精准的命理分析...
            </p>
            <p className="text-sm text-gray-600">
              细观您的八字，命理之象，历历在目...
            </p>
          </div>
        )}
      </form>
    </div>
  );
}
