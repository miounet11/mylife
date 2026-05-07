// 十神配置图表组件
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface TenGod {
  self: string;
  output: string[];
  input: string[];
  control: string[];
  controlled: string[];
}

interface TenGodsChartProps {
  tenGods: TenGod;
}

export default function TenGodsChart({ tenGods }: TenGodsChartProps) {
  const categories = [
    { key: 'self', name: '自身', icon: '👤', color: 'purple' },
    { key: 'output', name: '生我', icon: '⬆️', color: 'green' },
    { key: 'input', name: '我克', icon: '📥', color: 'blue' },
    { key: 'control', name: '克我', icon: '⚔️', color: 'red' },
    { key: 'controlled', name: '我生', icon: '🌱', color: 'yellow' },
  ];

  return (
    <Card className="border border-[color:var(--hairline)] bg-[color:var(--paper)]">
      <CardHeader>
        <CardTitle>
          <div className="flex items-center space-x-3">
            <span className="text-3xl">🎭</span>
            <span className="text-2xl font-bold text-[color:var(--ink-1)]">十神配置</span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* 日主 */}
        <div className="mb-6 p-4 bg-[color:var(--brand-strong)] rounded-[var(--radius)] text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-3xl">👤</span>
              <div>
                <h3 className="font-bold text-xl">自身</h3>
                <p className="text-sm opacity-80">代表您自己，是八字的核心</p>
              </div>
            </div>
            <div className="text-3xl font-bold">
              {tenGods.self}
            </div>
          </div>
        </div>

        {/* 十神矩阵 */}
        <div className="space-y-4">
          {categories.map((category) => {
            const gods = tenGods[category.key as keyof TenGod] as string[];
            const colorMap = {
              purple: 'bg-[color:var(--brand-strong)] text-white border-[color:var(--brand)]',
              green: 'bg-[color:var(--data-up)] text-white border-[color:var(--data-up)]',
              blue: 'bg-[color:var(--env)] text-white border-[color:var(--env)]',
              red: 'bg-[color:var(--alert)] text-white border-[color:var(--alert)]',
              yellow: 'bg-[color:var(--signal)] text-[color:var(--ink-1)] border-[color:var(--signal)]',
            };

            return (
              <div key={category.key}>
                <h4 className="text-sm font-semibold text-[color:var(--ink-5)] mb-2">{category.name}</h4>
                <div className="flex flex-wrap gap-2">
                  {gods.map((god, index) => (
                    <GodBadge
                      key={index}
                      god={god}
                      icon={category.icon}
                      color={category.color}
                      gradient={colorMap[category.color as keyof typeof colorMap]}
                      description={getGodDescription(god)}
                    />
                  ))}
                  {gods.length === 0 && (
                    <span className="text-sm text-[color:var(--ink-5)] italic">无配置</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* 十神解读 */}
        <div className="mt-6 pt-6 border-t-2 border-[color:var(--brand-soft-2)]">
          <h4 className="font-bold text-[color:var(--ink-1)] mb-4 text-lg">十神解读</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {getGodDescriptions().map((desc, index) => (
              <div key={index} className="bg-white rounded-lg p-4 border border-[color:var(--hairline)]">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-xl">{desc.icon}</span>
                  <span className="font-semibold text-[color:var(--ink-1)]">{desc.god}</span>
                </div>
                <p className="text-sm text-[color:var(--ink-4)]">{desc.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 建议 */}
        <div className="mt-6 p-4 bg-[color:var(--brand-soft)] rounded-[var(--radius)] border border-[color:var(--brand-soft-2)]">
          <h4 className="font-bold text-[color:var(--ink-1)] mb-3">根据十神的建议</h4>
          <div className="space-y-2">
            {generateGodAdvice(tenGods).map((advice, index) => (
              <div key={index} className="flex items-start space-x-2">
                <span className="text-[color:var(--data-up)] mt-1">✓</span>
                <span className="text-sm text-[color:var(--ink-3)]">{advice}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function GodBadge({ god, icon, color, gradient, description }: any) {
  return (
    <div
      className={cn(
        "px-3 py-2 rounded-lg text-sm font-semibold border-2 transform hover:scale-105 transition cursor-pointer",
        gradient
      )}
      title={description}
    >
      <span className="mr-1">{icon}</span>
      <span>{god}</span>
    </div>
  );
}

function getGodDescriptions() {
  return [
    {
      god: '正印',
      icon: '📚',
      description: '代表长辈、贵人、知识、印星得用，必得贵人相助',
    },
    {
      god: '偏印',
      icon: '📖',
      description: '代表偏科的知识、技能、领悟、偏印得用，才华出众',
    },
    {
      god: '正财',
      icon: '💰',
      description: '代表正职收入、固定收入、妻星、正财得用，财运稳定',
    },
    {
      god: '偏财',
      icon: '💎',
      description: '代表副业收入、意外之财、偏财得用，财运亨通',
    },
    {
      god: '正官',
      icon: '👔',
      description: '代表事业、权力、夫星、正官得用，事业有成',
    },
    {
      god: '七杀',
      icon: '⚔️',
      description: '代表挑战、机遇、威严、七杀得用，权力在握',
    },
    {
      god: '伤官',
      icon: '🎨',
      description: '代表才华、表现、子女星、伤官得用，才华横溢',
    },
    {
      god: '食神',
      icon: '🌱',
      description: '代表口才、表现、享受、食神得用，衣食无忧',
    },
  ];
}

function getGodDescription(god: string): string {
  const descriptions: Record<string, string> = {
    '正印': '代表长辈、贵人、知识',
    '偏印': '代表偏科知识、技能',
    '正财': '代表正职收入、妻星',
    '偏财': '代表副业收入、意外之财',
    '正官': '代表事业、权力、夫星',
    '七杀': '代表挑战、机遇、威严',
    '伤官': '代表才华、表现、子女星',
    '食神': '代表口才、享受、子女星',
  };

  return descriptions[god] || '十神';
}

function generateGodAdvice(tenGods: TenGod): string[] {
  const advice: string[] = [];

  if (tenGods.output.includes('正印')) {
    advice.push('正印得用，必得贵人相助，学业有成，事业顺利');
  }

  if (tenGods.input.includes('正财')) {
    advice.push('正财得用，财运以正职工作为主，宜从事稳定的职业');
  }

  if (tenGods.control.includes('正官')) {
    advice.push('正官得用，事业运旺，宜从政、管理，有领导才能');
  }

  if (tenGods.controlled.includes('食神')) {
    advice.push('食神得用，才华横溢，口才极佳，宜从事艺术、表演');
  }

  if (tenGods.control.includes('七杀')) {
    advice.push('七杀得用，有威严，有决断力，宜从事司法、军警');
  }

  if (advice.length === 0) {
    advice.push('根据您的十神配置，平衡发展事业、财富、家庭');
  }

  return advice;
}
