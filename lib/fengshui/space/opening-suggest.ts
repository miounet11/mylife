/**
 * Heuristic + schema for multimodal door/window suggestions.
 * LLM path returns the same shape; heuristics always available offline.
 */

import type { SpaceVent } from './types';

export type SuggestedOpening = {
  kind: 'inlet' | 'outlet';
  x: number;
  y: number;
  azimuthDeg: number;
  spreadDeg: number;
  speed: number;
  intensity: number;
  halfLifeSec: number;
  label: string;
  confidence: number;
  reason: string;
};

const FACING_AZIMUTH: Record<string, number> = {
  东: 0,
  东南: 45,
  南: 90,
  西南: 135,
  西: 180,
  西北: 225,
  北: 270,
  东北: 315,
};

function clamp01(n: number) {
  return Math.max(0.04, Math.min(0.96, n));
}

/** Offline fallback when vision model unavailable */
export function heuristicOpenings(entranceFacing: string): SuggestedOpening[] {
  const face = FACING_AZIMUTH[entranceFacing] ?? 90;
  // Entrance near bottom of plan (y high), facing inward
  const inlet: SuggestedOpening = {
    kind: 'inlet',
    x: 0.5,
    y: 0.9,
    azimuthDeg: (face + 180) % 360,
    spreadDeg: 96,
    speed: 42,
    intensity: 2.4,
    halfLifeSec: 14,
    label: `主入口（${entranceFacing}）`,
    confidence: 0.55,
    reason: '按主入口朝向在平面底缘布置进风口，气流向室内推进。',
  };
  const outlet: SuggestedOpening = {
    kind: 'outlet',
    x: 0.5,
    y: 0.1,
    azimuthDeg: face,
    spreadDeg: 80,
    speed: 36,
    intensity: 1.8,
    halfLifeSec: 12,
    label: '对侧采光/回风窗',
    confidence: 0.45,
    reason: '对侧高位设出风口，避免直冲时可再加侧窗缓冲。',
  };
  const side: SuggestedOpening = {
    kind: 'outlet',
    x: 0.12,
    y: 0.45,
    azimuthDeg: 0,
    spreadDeg: 70,
    speed: 28,
    intensity: 1.4,
    halfLifeSec: 10,
    label: '侧向辅助窗',
    confidence: 0.35,
    reason: '侧窗用于缓解对穿直冲，并改善边角滞留。',
  };
  return [inlet, outlet, side];
}

export function openingsToVents(openings: SuggestedOpening[]): SpaceVent[] {
  return openings.map((o, i) => ({
    id: `suggest-${o.kind}-${i}-${Date.now()}`,
    kind: o.kind,
    x: clamp01(o.x),
    y: clamp01(o.y),
    azimuthDeg: ((o.azimuthDeg % 360) + 360) % 360,
    spreadDeg: o.spreadDeg || 80,
    speed: o.speed || 36,
    intensity: o.intensity || 1.8,
    halfLifeSec: o.halfLifeSec || 12,
    enabled: true,
  }));
}

export function parseOpeningsFromModelText(text: string): SuggestedOpening[] | null {
  if (!text) return null;
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const raw = (fenced?.[1] || text).trim();
  try {
    const parsed = JSON.parse(raw);
    const list = Array.isArray(parsed) ? parsed : parsed?.openings;
    if (!Array.isArray(list) || !list.length) return null;
    return list
      .slice(0, 6)
      .map((item: Record<string, unknown>, index: number) => {
        const kind = item.kind === 'outlet' ? 'outlet' : 'inlet';
        return {
          kind,
          x: clamp01(Number(item.x) || 0.5),
          y: clamp01(Number(item.y) || 0.5),
          azimuthDeg: Number(item.azimuthDeg) || 90,
          spreadDeg: Number(item.spreadDeg) || 80,
          speed: Number(item.speed) || 36,
          intensity: Number(item.intensity) || 1.8,
          halfLifeSec: Number(item.halfLifeSec) || 12,
          label: String(item.label || `${kind === 'inlet' ? '门' : '窗'} ${index + 1}`).slice(0, 40),
          confidence: Math.max(0, Math.min(1, Number(item.confidence) || 0.5)),
          reason: String(item.reason || '模型根据平面可见结构建议。').slice(0, 200),
        } satisfies SuggestedOpening;
      });
  } catch {
    return null;
  }
}

export const OPENING_VISION_SYSTEM = `你是户型/商铺平面结构分析助手。只根据图片中可见的门、窗、开口位置做结构化建议。
规则：
1. 坐标 x,y 使用归一化平面坐标：左上为 (0,0)，右下为 (1,1)，与屏幕一致（x 向右，y 向下）。
2. 门通常作 inlet（进风），窗/阳台门作 outlet（出风）；若只有门，可推断对侧高窗为 outlet。
3. azimuthDeg：0=东，90=北（屏幕向上），180=西，270=南；表示气流从开口吹向的方向。
4. 不要编造看不见的外局；不确定时降低 confidence。
5. 只输出 JSON，不要吉凶词汇。格式：
{"openings":[{"kind":"inlet|outlet","x":0.5,"y":0.9,"azimuthDeg":90,"spreadDeg":90,"speed":40,"intensity":2,"halfLifeSec":12,"label":"主入口","confidence":0.7,"reason":"..."}]}`;
