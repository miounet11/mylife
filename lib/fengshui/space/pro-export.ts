/**
 * 专业用户导出：结构场会话 JSON / 可读简报
 */

import { DOMAIN_MODEL_META } from './domain-models';
import type { SpaceLabState, SpaceSimResult } from './types';
import { isSpaceActiveDomain } from './domain-models';

export type ProSessionExport = {
  schema: 'life-kline.space-lab.v1';
  exportedAt: string;
  product: string;
  domain: string;
  domainLabel: string;
  modelName: string;
  preset: { id?: string | null; title?: string | null };
  geo: SpaceLabState['geo'];
  room: SpaceLabState['room'];
  activeLayer: string;
  metrics: {
    peakEnergy: number;
    avgEnergy: number;
    stagnationRatio: number;
    draftCorridor: number;
    lightBalance: number;
    nineStarBias: number;
  };
  structuralNotes: string[];
  priorityActions: string[];
  meta: SpaceSimResult['meta'];
  qimen?: SpaceSimResult['qimen'];
  disclaimer: string;
};

export function buildProSessionExport(
  state: SpaceLabState,
  result: SpaceSimResult,
): ProSessionExport {
  const domain = isSpaceActiveDomain(state.activeDomain) ? state.activeDomain : 'residential';
  const dm = DOMAIN_MODEL_META[domain];
  return {
    schema: 'life-kline.space-lab.v1',
    exportedAt: new Date().toISOString(),
    product: '人生K线 · 空间场专业会话',
    domain,
    domainLabel: dm.label,
    modelName: dm.modelName,
    preset: { id: state.presetId, title: state.presetTitle },
    geo: state.geo,
    room: state.room,
    activeLayer: state.activeLayer,
    metrics: {
      peakEnergy: result.summary.peakEnergy,
      avgEnergy: result.summary.avgEnergy,
      stagnationRatio: result.summary.stagnationRatio,
      draftCorridor: result.summary.draftCorridor,
      lightBalance: result.summary.lightBalance,
      nineStarBias: result.summary.nineStarBias,
    },
    structuralNotes: result.summary.structuralNotes,
    priorityActions: result.summary.priorityActions,
    meta: result.meta,
    qimen: result.qimen,
    disclaimer:
      '结构启发式评估，供专业风水/选址讨论与客户沟通，不构成置业、投资或殡葬法定意见。',
  };
}

export function buildProBriefText(exp: ProSessionExport): string {
  const lines = [
    `【人生K线 · 空间场专业简报】`,
    `导出：${exp.exportedAt}`,
    `业态：${exp.domainLabel} · 模型 ${exp.modelName}`,
    exp.preset.title ? `方案：${exp.preset.title}` : null,
    exp.geo?.address ? `区位：${exp.geo.address}` : null,
    `体量：${exp.room.widthM.toFixed(1)}×${exp.room.depthM.toFixed(1)}×${exp.room.heightM.toFixed(1)}m · 朝向 ${exp.room.entranceFacing}`,
    `层：${exp.activeLayer} · ${exp.meta.dizhiHour}时 · ${exp.meta.nineStarLabel}`,
    `峰值 ${(exp.metrics.peakEnergy * 100).toFixed(0)} · 均值 ${(exp.metrics.avgEnergy * 100).toFixed(0)} · 滞留 ${(exp.metrics.stagnationRatio * 100).toFixed(0)}% · 通道 ${(exp.metrics.draftCorridor * 100).toFixed(0)}%`,
    `结构：`,
    ...exp.structuralNotes.map((n) => `· ${n}`),
    `优先动作：`,
    ...exp.priorityActions.map((a, i) => `${i + 1}. ${a}`),
    exp.disclaimer,
    `https://www.life-kline.com/tools/fengshui-space`,
  ].filter(Boolean);
  return lines.join('\n');
}

export function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
