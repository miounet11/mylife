// 可信报告组件 - 建立信任的核心组件
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TrustReport({ result }: any) {
  if (!result) return null;

  const analysis = result.analysis || {};
  const basic = result.basic || { dayMaster: '', pillars: [] };
  const pillars = basic.pillars || [];
  const fiveElements = result.fiveElements || {};
  const tenGods = result.tenGods || { self: '未知', output: [], input: [], control: [], controlled: [] };
  const pattern = result.pattern || { type: '未知', quality: '', strength: '', description: '' };
  const fortune = result.fortune || { currentDaYun: '', currentLiuNian: '', interaction: '', nextYear: '' };
  const advice = result.advice || { career: {}, wealth: {}, marriage: {}, health: {} };
  const evidence = result.evidence || { statistics: {}, celebrities: [] };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      {/* 卷首语 - 权威感 */}
      <Card className="bg-slate-900 text-white border-0 shadow-xl overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 -translate-y-1/2 translate-x-1/2"></div>
        <CardHeader className="relative z-10 pb-2">
          <div className="inline-flex items-center space-x-2 mb-4">
            <span className="px-2.5 py-1 rounded bg-indigo-500/30 text-indigo-200 text-xs font-bold tracking-wider uppercase border border-indigo-400/20">
              权威命理报告 V2.0
            </span>
            <span className="text-slate-400 text-sm">真太阳时精确校准</span>
          </div>
          <CardTitle className="text-3xl md:text-4xl font-serif font-bold text-white tracking-tight">
            先天命局深度解析
          </CardTitle>
        </CardHeader>
        <CardContent className="relative z-10 pt-4">
          <blockquote className="border-l-2 border-indigo-500 pl-6 text-slate-300 text-lg leading-relaxed font-serif">
            {analysis.opening || '察天地之理，究阴阳之变。本报告基于严谨的天文历法与子平命理引擎生成。'}
          </blockquote>
        </CardContent>
      </Card>

      {/* 核心命盘 - 四柱八字 */}
      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <CardHeader className="bg-slate-50 border-b border-slate-100 py-4">
          <CardTitle className="text-lg font-bold text-slate-800 flex items-center">
            <div className="w-1.5 h-5 bg-indigo-600 rounded-full mr-3"></div>
            命盘排演 (四柱八字)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-4 gap-4 md:gap-6 text-center">
            {['年柱 (祖上/早年)', '月柱 (父母/青年)', '日柱 (自己/中年)', '时柱 (子女/晚年)'].map((label, idx) => {
              const pillar = pillars[idx] || { celestialStem: '-', earthlyBranch: '-', nayin: '-', hiddenStems: [] };
              const isDayMaster = idx === 2;
              return (
                <div key={idx} className={`relative flex flex-col p-4 rounded-xl border ${isDayMaster ? 'bg-indigo-50 border-indigo-200 ring-1 ring-indigo-500/20' : 'bg-white border-slate-100 shadow-sm'}`}>
                  {isDayMaster && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-xs font-bold px-3 py-0.5 rounded-full shadow-sm whitespace-nowrap">
                      日主 (元神)
                    </div>
                  )}
                  <div className="text-xs font-medium text-slate-500 mb-4 tracking-wide">{label}</div>
                  <div className="text-4xl md:text-5xl font-serif font-bold text-slate-900 mb-2">{pillar.celestialStem}</div>
                  <div className="text-4xl md:text-5xl font-serif font-bold text-slate-900 mb-4">{pillar.earthlyBranch}</div>
                  
                  <div className="mt-auto space-y-2 pt-4 border-t border-slate-100">
                    <div className="text-xs text-slate-500 flex justify-between px-1">
                      <span>纳音:</span>
                      <span className="font-semibold text-slate-700">{pillar.nayin}</span>
                    </div>
                    <div className="text-xs text-slate-500 flex justify-between px-1">
                      <span>藏干:</span>
                      <span className="font-semibold text-slate-700">{pillar.hiddenStems?.join(' ')}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 核心用神提示 */}
          {(advice.yongShen?.length > 0 || pattern.type) && (
            <div className="mt-8 bg-slate-50 rounded-lg p-5 border border-slate-200 flex flex-col md:flex-row gap-6 items-center">
              <div className="flex-1">
                <div className="text-sm font-bold text-slate-800 mb-1">本命格局</div>
                <div className="text-xl text-indigo-700 font-bold">{pattern.type}</div>
                <p className="text-sm text-slate-600 mt-2">{pattern.description}</p>
              </div>
              <div className="hidden md:block w-px h-16 bg-slate-200"></div>
              <div className="flex-1 grid grid-cols-2 gap-4 w-full">
                <div className="bg-white p-3 rounded border border-slate-100 shadow-sm text-center">
                  <div className="text-xs text-slate-500 mb-1 font-bold">核心用神 (大吉)</div>
                  <div className="text-lg font-bold text-emerald-600">{advice.yongShen?.join('、') || '-'}</div>
                </div>
                <div className="bg-white p-3 rounded border border-slate-100 shadow-sm text-center">
                  <div className="text-xs text-slate-500 mb-1 font-bold">核心忌神 (大凶)</div>
                  <div className="text-lg font-bold text-red-600">{advice.jiShen?.join('、') || '-'}</div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* 五行力量 */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="bg-slate-50 border-b border-slate-100 py-4">
            <CardTitle className="text-lg font-bold text-slate-800 flex items-center">
              <div className="w-1.5 h-5 bg-indigo-600 rounded-full mr-3"></div>
              五行力量分布
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {Object.entries(fiveElements).map(([key, value]: [string, any]) => {
                const colorMap: any = {
                  wood: 'bg-emerald-500',
                  fire: 'bg-rose-500',
                  earth: 'bg-amber-600',
                  metal: 'bg-slate-400',
                  water: 'bg-blue-500'
                };
                const cnMap: any = { wood: '木', fire: '火', earth: '土', metal: '金', water: '水' };
                return (
                  <div key={key} className="flex items-center">
                    <div className="w-10 text-sm font-bold text-slate-700">{cnMap[key]}</div>
                    <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden mx-3">
                      <div 
                        className={`h-full ${colorMap[key] || 'bg-indigo-500'} transition-all duration-1000`} 
                        style={{ width: `${value.strength}%` }}
                      ></div>
                    </div>
                    <div className="w-16 text-right text-sm font-mono text-slate-600">{value.strength.toFixed(1)}%</div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* 幸运元素 */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="bg-slate-50 border-b border-slate-100 py-4">
            <CardTitle className="text-lg font-bold text-slate-800 flex items-center">
              <div className="w-1.5 h-5 bg-indigo-600 rounded-full mr-3"></div>
              专属开运指南
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 text-center">
                <div className="text-xs font-bold text-slate-500 mb-2">有利方位</div>
                <div className="text-lg font-bold text-slate-800">{advice.directions?.join('、') || '无'}</div>
              </div>
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 text-center">
                <div className="text-xs font-bold text-slate-500 mb-2">幸运颜色</div>
                <div className="text-lg font-bold text-slate-800">{advice.colors?.join('、') || '无'}</div>
              </div>
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 text-center col-span-2">
                <div className="text-xs font-bold text-slate-500 mb-2">幸运数字</div>
                <div className="text-lg font-bold text-slate-800">{advice.numbers?.join('、') || '无'}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI深度解析建议 */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="bg-slate-50 border-b border-slate-100 py-4">
          <CardTitle className="text-lg font-bold text-slate-800 flex items-center">
            <div className="w-1.5 h-5 bg-indigo-600 rounded-full mr-3"></div>
            AI 深度解析与决策建议
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-slate-100">
            {/* 综合解析 */}
            <div className="p-6 md:p-8 bg-white">
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center">
                <span className="text-indigo-600 mr-2">✦</span> 命局总评
              </h3>
              <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{analysis.explanation}</p>
            </div>

            {/* 事业建议 */}
            <div className="p-6 md:p-8 bg-slate-50">
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center">
                <span className="text-indigo-600 mr-2">✦</span> 学业与事业发展
              </h3>
              <div className="space-y-4">
                <p className="text-slate-700 font-medium">{advice.career?.general}</p>
                <ul className="space-y-2">
                  {(advice.career?.specific || []).map((item: string, i: number) => (
                    <li key={i} className="flex items-start">
                      <span className="text-indigo-600 mr-2 mt-0.5">•</span>
                      <span className="text-slate-600">{item}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-4 bg-indigo-50/50 p-4 rounded border border-indigo-100 text-sm">
                  <span className="font-bold text-indigo-900">时机把握：</span>
                  <span className="text-indigo-800 ml-2">{advice.career?.timing}</span>
                </div>
              </div>
            </div>

            {/* 财富建议 */}
            <div className="p-6 md:p-8 bg-white">
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center">
                <span className="text-indigo-600 mr-2">✦</span> 财富与资产配置
              </h3>
              <div className="space-y-4">
                <p className="text-slate-700 font-medium">{advice.wealth?.general}</p>
                <ul className="space-y-2">
                  {(advice.wealth?.specific || []).map((item: string, i: number) => (
                    <li key={i} className="flex items-start">
                      <span className="text-indigo-600 mr-2 mt-0.5">•</span>
                      <span className="text-slate-600">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* 婚姻建议 */}
            <div className="p-6 md:p-8 bg-slate-50">
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center">
                <span className="text-indigo-600 mr-2">✦</span> 婚恋与人际关系
              </h3>
              <div className="space-y-4">
                <p className="text-slate-700 font-medium">{advice.marriage?.general}</p>
                <ul className="space-y-2">
                  {(advice.marriage?.specific || []).map((item: string, i: number) => (
                    <li key={i} className="flex items-start">
                      <span className="text-indigo-600 mr-2 mt-0.5">•</span>
                      <span className="text-slate-600">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
