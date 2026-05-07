// 五行分析图表组件
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface FiveElements {
  wood: { strength: number; quality: string; description: string };
  fire: { strength: number; quality: string; description: string };
  earth: { strength: number; quality: string; description: string };
  metal: { strength: number; quality: string; description: string };
  water: { strength: number; quality: string; description: string };
}

interface FiveElementsChartProps {
  fiveElements: FiveElements;
}

export default function FiveElementsChart({ fiveElements }: FiveElementsChartProps) {
  const elements = [
    { key: 'wood', name: '木', icon: '🌳', color: 'from-green-500 to-green-600', ...fiveElements.wood },
    { key: 'fire', name: '火', icon: '🔥', color: 'from-red-500 to-red-600', ...fiveElements.fire },
    { key: 'earth', name: '土', icon: '🌍', color: 'from-yellow-500 to-yellow-600', ...fiveElements.earth },
    { key: 'metal', name: '金', icon: '⛏️', color: 'from-gray-400 to-gray-500', ...fiveElements.metal },
    { key: 'water', name: '水', icon: '💧', color: 'from-blue-500 to-blue-600', ...fiveElements.water },
  ];

  const maxStrength = Math.max(...elements.map(e => e.strength));

  return (
    <Card className="bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-300">
      <CardHeader>
        <CardTitle>
          <div className="flex items-center space-x-3">
            <span className="text-3xl">🌊</span>
            <span className="text-2xl font-bold text-gray-900">五行分析</span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* 柱状图 */}
        <div className="mb-8 bg-white rounded-xl p-6 shadow-md">
          <div className="space-y-4">
            {elements.map((element) => (
              <ElementBar
                key={element.key}
                element={element}
                maxStrength={maxStrength}
              />
            ))}
          </div>
        </div>

        {/* 详细卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {elements.map((element) => (
            <ElementCard key={element.key} element={element} />
          ))}
        </div>

        {/* 分析总结 */}
        <div className="mt-8 bg-gradient-to-r from-purple-100 to-blue-100 rounded-xl p-6">
          <h4 className="text-lg font-bold text-gray-900 mb-3">五行分析总结</h4>
          <div className="space-y-2 text-sm text-gray-700">
            {elements.map((element) => {
              if (element.strength >= 25) {
                return (
                  <div key={element.key} className="flex items-start space-x-2">
                    <span className="text-[color:var(--data-up)]">✓</span>
                    <span>
                      <strong>{element.name}旺</strong> - {element.description}
                    </span>
                  </div>
                );
              }
              return null;
            })}
            <div className="pt-3 border-t-2 border-[color:var(--brand-soft-2)] mt-3">
              <p className="text-[color:var(--brand-deep)] font-medium">
                {getSummary(elements)}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ElementBar({ element, maxStrength }: any) {
  const widthPercentage = (element.strength / maxStrength) * 100;
  const isWeak = element.quality === 'weak';
  const isStrong = element.quality === 'strong';

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <span className="text-2xl">{element.icon}</span>
          <span className="font-semibold text-gray-900">{element.name}</span>
          <span className="text-sm text-gray-600">({element.strength}%)</span>
        </div>
        <span className={cn(
          "text-xs font-bold px-2 py-1 rounded",
          isStrong && "bg-[color:var(--data-up)] text-white",
          element.quality === 'medium' && "bg-[color:var(--env)] text-white",
          isWeak && "bg-orange-500 text-white"
        )}>
          {isStrong && '旺'}
          {element.quality === 'medium' && '平'}
          {isWeak && '弱'}
        </span>
      </div>
      <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500",
            element.color
          )}
          style={{ width: `${widthPercentage}%` }}
        />
      </div>
    </div>
  );
}

function ElementCard({ element }: any) {
  const isStrong = element.quality === 'strong';
  const isWeak = element.quality === 'weak';

  return (
    <div className={cn(
      "bg-white rounded-xl p-4 shadow-md hover:shadow-xl transition transform hover:scale-105 border-2",
      isStrong && "border-[color:var(--data-up)]",
      element.quality === 'medium' && "border-[color:var(--env)]",
      isWeak && "border-orange-400"
    )}>
      {/* 标题 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <span className="text-2xl">{element.icon}</span>
          <span className="font-bold text-gray-900">{element.name}</span>
        </div>
        <span className={cn(
          "text-xs font-bold px-2 py-1 rounded",
          isStrong && "bg-[color:var(--data-up)] text-white",
          element.quality === 'medium' && "bg-[color:var(--env)] text-white",
          isWeak && "bg-orange-500 text-white"
        )}>
          {element.strength}%
        </span>
      </div>

      {/* 描述 */}
      <p className="text-sm text-gray-600 mb-3">{element.description}</p>

      {/* 状态指示 */}
      <div className="flex items-center space-x-2 text-xs">
        {isStrong && (
          <>
            <span className="text-[color:var(--data-up)]">✓</span>
            <span className="text-[color:var(--data-up)] font-medium">旺盛</span>
          </>
        )}
        {element.quality === 'medium' && (
          <>
            <span className="text-[color:var(--env)]">✓</span>
            <span className="text-[color:var(--env)] font-medium">适中</span>
          </>
        )}
        {isWeak && (
          <>
            <span className="text-orange-600">!</span>
            <span className="text-orange-700 font-medium">偏弱</span>
          </>
        )}
        <span className="text-gray-500">建议：</span>
        {isStrong && <span className="text-[color:var(--data-up)]">保持现状</span>}
        {element.quality === 'medium' && <span className="text-[color:var(--env)]">平衡调节</span>}
        {isWeak && <span className="text-orange-600">宜补宜扶</span>}
      </div>
    </div>
  );
}

function getSummary(elements: any[]): string {
  const strongElements = elements.filter(e => e.quality === 'strong');
  const weakElements = elements.filter(e => e.quality === 'weak');

  if (strongElements.length >= 3) {
    return `您的命局五行${strongElements.map(e => e.name).join('、')}旺盛，能量充沛，宜进取创业，把握机遇。`;
  }

  if (weakElements.length >= 3) {
    return `您的命局五行${weakElements.map(e => e.name).join('、')}偏弱，宜${weakElements.map(e => e.name).join('、')}对应的颜色和方位来增运。`;
  }

  const maxElement = elements.reduce((max, elem) =>
    elem.strength > max.strength ? elem : max
  );

  return `您的命局以${maxElement.name}为主，${maxElement.description}，可以重点发展${maxElement.name}相关的方面。`;
}
