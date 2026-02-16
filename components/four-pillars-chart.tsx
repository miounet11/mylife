// 四柱排盘图表组件
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn, formatDateTime, getWuxing, getWuxingColor, getWuxingIcon, getNayin } from '@/lib/utils';

interface Pillar {
  celestialStem: string;  // 天干
  earthlyBranch: string;   // 地支
  hiddenStems: string[];   // 藏干
  nayin: string;           // 纳音
  wuxing: string;          // 五行
}

interface FourPillarsChartProps {
  pillars: Pillar[];
  birthDate: Date;
  birthTime: string;
}

export default function FourPillarsChart({ pillars, birthDate, birthTime }: FourPillarsChartProps) {
  const pillarNames = ['年柱', '月柱', '日柱', '时柱'];
  const palaceNames = ['祖上运', '父母宫', '夫妻宫', '子女宫'];

  return (
    <Card className="bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-300">
      <CardHeader>
        <CardTitle>
          <div className="flex items-center space-x-3">
            <span className="text-3xl">🔮</span>
            <span className="text-2xl font-bold text-gray-900">四柱排盘</span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* 出生信息 */}
        <div className="mb-6 bg-white rounded-lg p-4 border border-gray-200">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-xs text-gray-500 mb-1">出生日期</div>
              <div className="text-sm font-semibold text-gray-900">
                {formatDateTime(birthDate)}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">出生时间</div>
              <div className="text-sm font-semibold text-gray-900">
                {birthTime}
              </div>
            </div>
          </div>
        </div>

        {/* 四柱排盘表 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {pillars.map((pillar, index) => (
            <PillarCard
              key={index}
              pillar={pillar}
              name={pillarNames[index]}
              palace={palaceNames[index]}
              index={index}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function PillarCard({ pillar, name, palace, index }: any) {
  const wuxing = getWuxing(pillar.celestialStem);
  const wuxingColor = getWuxingColor(wuxing);
  const wuxingIcon = getWuxingIcon(wuxing);

  return (
    <div className="bg-white rounded-lg border-2 border-gray-200 overflow-hidden hover:shadow-xl transition transform hover:scale-105">
      {/* 柱头 */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-3">
        <div className="text-center">
          <div className="text-xs opacity-80">{palace}</div>
          <div className="font-bold">{name}</div>
        </div>
      </div>

      {/* 天干地支 */}
      <div className="p-4 text-center">
        <div className="flex items-center justify-center space-x-4 mb-4">
          {/* 天干 */}
          <div className="flex-1">
            <div className="text-xs text-gray-500 mb-1">天干</div>
            <div 
              className={cn(
                "text-3xl font-bold p-3 rounded-lg",
                wuxingColor
              )}
            >
              {pillar.celestialStem}
            </div>
          </div>

          {/* 地支 */}
          <div className="flex-1">
            <div className="text-xs text-gray-500 mb-1">地支</div>
            <div className="text-3xl font-bold text-gray-900 p-3 rounded-lg bg-gray-50">
              {pillar.earthlyBranch}
            </div>
          </div>
        </div>

        {/* 五行 */}
        <div className="mb-4 p-2 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">{wuxingIcon}</span>
            <span className="text-sm text-gray-700">
              {wuxing === 'wood' && '木'}
              {wuxing === 'fire' && '火'}
              {wuxing === 'earth' && '土'}
              {wuxing === 'metal' && '金'}
              {wuxing === 'water' && '水'}
            </span>
            <span className="text-xs text-gray-500 ml-auto">
              {getWuxing(pillar.celestialStem) === 'wood' && '木'}
              {getWuxing(pillar.celestialStem) === 'fire' && '火'}
              {getWuxing(pillar.celestialStem) === 'earth' && '土'}
              {getWuxing(pillar.celestialStem) === 'metal' && '金'}
              {getWuxing(pillar.celestialStem) === 'water' && '水'}
            </span>
          </div>
        </div>

        {/* 纳音 */}
        <div className="mb-4 p-2 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg">
          <div className="text-xs text-gray-500 mb-1">纳音</div>
          <div className="text-sm font-semibold text-gray-900">
            {pillar.nayin}
          </div>
        </div>

        {/* 藏干 */}
        {pillar.hiddenStems && pillar.hiddenStems.length > 0 && (
          <div className="p-2 bg-gray-50 rounded-lg">
            <div className="text-xs text-gray-500 mb-2">藏干</div>
            <div className="flex flex-wrap gap-2">
              {pillar.hiddenStems.map((stem, i) => {
                const hiddenWuxing = getWuxing(stem);
                const hiddenWuxingIcon = getWuxingIcon(hiddenWuxing);
                return (
                  <span 
                    key={i} 
                    className="flex items-center space-x-1 bg-white px-2 py-1 rounded-md border border-gray-200 text-sm"
                  >
                    <span>{hiddenWuxingIcon}</span>
                    <span>{stem}</span>
                    <span className="text-xs text-gray-500">
                      {getWuxing(stem) === 'wood' && '木'}
                      {getWuxing(stem) === 'fire' && '火'}
                      {getWuxing(stem) === 'earth' && '土'}
                      {getWuxing(stem) === 'metal' && '金'}
                      {getWuxing(stem) === 'water' && '水'}
                    </span>
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
