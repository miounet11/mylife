// 可信报告组件 - 建立信任的核心组件
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TrustReport({ result }: any) {
  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* 开头 - 仪式感 */}
      <Card className="bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200">
        <CardHeader>
          <CardTitle className="text-center">
            <div className="inline-flex items-center space-x-3 mb-2">
              <span className="text-4xl">✨</span>
              <span className="text-3xl font-bold text-purple-900">您的命理分析报告</span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <blockquote className="border-l-4 border-purple-600 pl-6 italic text-gray-700 text-lg leading-relaxed">
            "{result.analysis.opening}"
          </blockquote>
        </CardContent>
      </Card>

      {/* 精确性展示 */}
      <Card>
        <CardHeader>
          <CardTitle>
            <div className="flex items-center space-x-2">
              <span className="text-2xl">🎯</span>
              <span className="font-bold text-gray-900">精确性验证</span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold">
                1
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 mb-1">四柱排盘 - 毫秒级精确</h4>
                <p className="text-sm text-gray-600">根据您提供的出生信息，精确计算到分钟。</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold">
                2
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 mb-1">藏干纳音 - 全面考虑</h4>
                <p className="text-sm text-gray-600">不仅计算天干地支，还考虑藏干、纳音，深度分析命局。</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold">
                3
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 mb-1">时柱精确 - 不用近似</h4>
                <p className="text-sm text-gray-600">避免粗略估算，使用精确算法计算时柱。</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 深度分析 */}
      <Card>
        <CardHeader>
          <CardTitle>
            <div className="flex items-center space-x-2">
              <span className="text-2xl">📊</span>
              <span className="font-bold text-gray-900">深度命局分析</span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* 五行分析 */}
            <div className="bg-purple-50 rounded-lg p-6">
              <h3 className="font-bold text-purple-900 mb-4 text-xl">五行分析</h3>
              <div className="space-y-3">
                {Object.entries(result.fiveElements).map(([key, value]) => (
                  <div key={key} className="border-l-4 border-purple-600 pl-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold text-gray-900 capitalize">{key}</span>
                      <span className="text-purple-600 font-bold">{value.strength}%</span>
                    </div>
                    <p className="text-sm text-gray-600">{value.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 十神配置 */}
            <div className="bg-blue-50 rounded-lg p-6">
              <h3 className="font-bold text-blue-900 mb-4 text-xl">十神配置</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                    <span className="text-sm text-gray-700">自身：</span>
                    <span className="font-semibold text-gray-900">{result.tenGods.self}</span>
                  </div>
                  <p className="text-xs text-gray-500 ml-4">代表您自己，是八字的核心</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                    <span className="text-sm text-gray-700">生我：</span>
                    <span className="font-semibold text-gray-900">{result.tenGods.output.join(', ')}</span>
                  </div>
                  <p className="text-xs text-gray-500 ml-4">代表长辈、贵人、知识</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                    <span className="text-sm text-gray-700">我克：</span>
                    <span className="font-semibold text-gray-900">{result.tenGods.control.join(', ')}</span>
                  </div>
                  <p className="text-xs text-gray-500 ml-4">代表财富、物质、妻星</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full bg-red-500"></span>
                    <span className="text-sm text-gray-700">克我：</span>
                    <span className="font-semibold text-gray-900">{result.tenGods.controlled.join(', ')}</span>
                  </div>
                  <p className="text-xs text-gray-500 ml-4">代表事业、权力、夫星</p>
                </div>
              </div>
            </div>

            {/* 格局判断 */}
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg p-6 text-white">
              <h3 className="font-bold mb-4 text-xl">格局判断</h3>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <span className="text-2xl">🏆</span>
                  <div className="flex-1">
                    <p className="font-semibold text-lg mb-1">{result.pattern.type}</p>
                    <p className="text-sm opacity-90">{result.pattern.quality} - {result.pattern.strength}</p>
                  </div>
                </div>
                <p className="text-base leading-relaxed opacity-90">
                  {result.pattern.description}
                </p>
                <blockquote className="mt-4 pl-4 border-l-4 border-white opacity-30 italic">
                  《子平真诠》云："格局者，乃命之大旨也。"
                </blockquote>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 运势分析 */}
      <Card>
        <CardHeader>
          <CardTitle>
            <div className="flex items-center space-x-2">
              <span className="text-2xl">📈</span>
              <span className="font-bold text-gray-900">运势分析</span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="border-l-4 border-purple-600 pl-4">
              <h4 className="font-semibold text-gray-900 mb-2">当前大运</h4>
              <p className="text-sm text-gray-600">{result.fortune.currentDaYun}</p>
              <p className="text-xs text-gray-500">{result.fortune.interaction}</p>
            </div>

            <div className="border-l-4 border-blue-600 pl-4">
              <h4 className="font-semibold text-gray-900 mb-2">当前流年</h4>
              <p className="text-sm text-gray-600">{result.fortune.currentLiuNian}</p>
            </div>

            <div className="border-l-4 border-green-600 pl-4">
              <h4 className="font-semibold text-gray-900 mb-2">明年运势</h4>
              <p className="text-sm text-gray-600">{result.fortune.nextYear}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 个性化建议 */}
      <Card>
        <CardHeader>
          <CardTitle>
            <div className="flex items-center space-x-2">
              <span className="text-2xl">💡</span>
              <span className="font-bold text-gray-900">个性化建议</span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 事业建议 */}
            <div className="bg-purple-50 rounded-lg p-6">
              <h3 className="font-bold text-purple-900 mb-4 text-xl flex items-center">
                <span>👔</span>
                <span className="ml-2">事业建议</span>
              </h3>
              <div className="space-y-2">
                <p className="text-sm text-gray-700 font-medium">{result.advice.career.general}</p>
                <ul className="space-y-1">
                  {result.advice.career.specific.slice(0, 3).map((advice, i) => (
                    <li key={i} className="flex items-start">
                      <span className="text-green-600 mr-2">✓</span>
                      <span className="text-sm text-gray-600">{advice}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-4 p-3 bg-white rounded border border-purple-200">
                  <p className="text-xs text-gray-500 mb-1">最佳时机：</p>
                  <p className="text-sm text-purple-600 font-semibold">{result.advice.career.timing}</p>
                </div>
              </div>
            </div>

            {/* 财富建议 */}
            <div className="bg-blue-50 rounded-lg p-6">
              <h3 className="font-bold text-blue-900 mb-4 text-xl flex items-center">
                <span>💰</span>
                <span className="ml-2">财富建议</span>
              </h3>
              <div className="space-y-2">
                <p className="text-sm text-gray-700 font-medium">{result.advice.wealth.general}</p>
                <ul className="space-y-1">
                  {result.advice.wealth.specific.slice(0, 3).map((advice, i) => (
                    <li key={i} className="flex items-start">
                      <span className="text-green-600 mr-2">✓</span>
                      <span className="text-sm text-gray-600">{advice}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-4 p-3 bg-white rounded border border-blue-200">
                  <p className="text-xs text-gray-500 mb-1">求财吉方：</p>
                  <p className="text-sm text-blue-600 font-semibold">{result.advice.wealth.direction}</p>
                </div>
              </div>
            </div>

            {/* 婚姻建议 */}
            <div className="bg-pink-50 rounded-lg p-6">
              <h3 className="font-bold text-pink-900 mb-4 text-xl flex items-center">
                <span>❤️</span>
                <span className="ml-2">婚姻建议</span>
              </h3>
              <div className="space-y-2">
                <p className="text-sm text-gray-700 font-medium">{result.advice.marriage.general}</p>
                <ul className="space-y-1">
                  {result.advice.marriage.specific.slice(0, 3).map((advice, i) => (
                    <li key={i} className="flex items-start">
                      <span className="text-green-600 mr-2">✓</span>
                      <span className="text-sm text-gray-600">{advice}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* 健康建议 */}
            <div className="bg-green-50 rounded-lg p-6">
              <h3 className="font-bold text-green-900 mb-4 text-xl flex items-center">
                <span>💪</span>
                <span className="ml-2">健康建议</span>
              </h3>
              <div className="space-y-2">
                <p className="text-sm text-gray-700 font-medium">{result.advice.health.general}</p>
                <ul className="space-y-1">
                  {result.advice.health.specific.slice(0, 3).map((advice, i) => (
                    <li key={i} className="flex items-start">
                      <span className="text-green-600 mr-2">✓</span>
                      <span className="text-sm text-gray-600">{advice}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 数据支撑 */}
      <Card>
        <CardHeader>
          <CardTitle>
            <div className="flex items-center space-x-2">
              <span className="text-2xl">📊</span>
              <span className="font-bold text-gray-900">数据支撑</span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="bg-gray-50 rounded-lg p-6">
              <h4 className="font-semibold text-gray-900 mb-3 text-lg">统计验证</h4>
              <p className="text-sm text-gray-600 mb-2">
                在{result.evidence.statistics.totalSamples}个样本中，与您的命局相似的有{result.evidence.statistics.similarCases}个，
                其中{result.evidence.statistics.successRate * 100}%事业有成，平均年收入{result.evidence.statistics.averageIncome}，
                平均年龄{result.evidence.statistics.averageAge}岁。
              </p>
            </div>

            <div className="bg-purple-50 rounded-lg p-6">
              <h4 className="font-semibold text-purple-900 mb-3 text-lg">名人八字对比</h4>
              <p className="text-sm text-gray-600 mb-2">与您命局相似的名人：</p>
              <div className="space-y-3">
                {result.evidence.celebrities.map((celeb, i) => (
                  <div key={i} className="border-l-4 border-purple-600 pl-4">
                    <p className="font-semibold text-gray-900">{celeb.name}</p>
                    <p className="text-sm text-gray-600">{celeb.similar.join(', ')}</p>
                    <p className="text-xs text-gray-500 italic">{celeb.lesson}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 祝福结尾 */}
      <Card className="bg-gradient-to-r from-purple-900 to-blue-900 text-white">
        <CardContent className="text-center py-8">
          <h3 className="text-2xl font-bold mb-4">{result.analysis.closing}</h3>
          <button className="mt-6 bg-white text-purple-900 px-8 py-3 rounded-lg font-bold hover:bg-purple-50 transition transform hover:scale-105">
            创建永久档案，让AI持续为您服务 →
          </button>
        </CardContent>
      </Card>
    </div>
  );
}
