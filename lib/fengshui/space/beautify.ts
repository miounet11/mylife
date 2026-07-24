/**
 * 一键 AI 美化：结构润色（确定性兜底）+ 可选 LLM 区划 + 彩平图 prompt
 */

import {
  CAD_ROOM_KINDS,
  furnitureForKind,
  recomputeZoneAreas,
  snapZone,
} from './cad-ops';
import type { FloorZone, FloorZoneKind } from './floor-plan-style';
import type { SpaceLabState, SpaceProfileLink } from './types';

const ALLOWED = new Set<string>(CAD_ROOM_KINDS);

export type BeautifyZoneIn = {
  id?: string;
  kind: string;
  x: number;
  y: number;
  w: number;
  h: number;
  label?: string;
  furniture?: string[];
};

export type BeautifyResult = {
  zones: FloorZone[];
  notes: string[];
  imagePrompt: string;
  mode: 'heuristic' | 'llm';
};

/** 无 LLM 时的确定性美化：补家具、规范 kind、轻推边界 */
export function heuristicBeautify(
  state: Pick<
    SpaceLabState,
    'room' | 'floorZones' | 'activeDomain' | 'profileLink' | 'layoutLabel' | 'presetTitle'
  >,
  zonesIn: BeautifyZoneIn[],
): BeautifyResult {
  const snapStep = 0.02;
  const notes: string[] = ['结构美化（本地规则）'];
  let zones: FloorZone[] = zonesIn.map((z, i) => {
    const kind = (ALLOWED.has(z.kind) ? z.kind : 'other') as FloorZoneKind;
    const s = snapZone(
      {
        x: clamp01(z.x),
        y: clamp01(z.y),
        w: Math.max(0.08, Math.min(0.9, z.w)),
        h: Math.max(0.08, Math.min(0.9, z.h)),
      },
      snapStep,
    );
    const furniture = (z.furniture?.length
      ? (z.furniture as FloorZone['furniture'])
      : furnitureForKind(kind)) as FloorZone['furniture'];
    return {
      id: z.id || `zone-${kind}-${i}`,
      kind,
      ...s,
      labelKey: kind,
      label: z.label,
      furniture,
    };
  });

  if (!zones.length) {
    zones = defaultZonesForDomain(state.activeDomain || 'residential');
    notes.push('原无分区，已生成标准示意分区');
  }

  zones = recomputeZoneAreas(zones, state.room.widthM, state.room.depthM);

  if (state.profileLink?.yongShen?.length) {
    notes.push(
      `已参考用神 ${state.profileLink.yongShen.join('、')} 保留房间结构，家具示意已补全`,
    );
  } else {
    notes.push('已补全房间家具示意与边界吸附');
  }

  return {
    zones,
    notes,
    imagePrompt: buildBeautifyImagePrompt(state, zones, state.profileLink),
    mode: 'heuristic',
  };
}

export function validateLlmZones(
  raw: unknown,
  widthM: number,
  depthM: number,
): FloorZone[] | null {
  if (!Array.isArray(raw) || raw.length === 0 || raw.length > 24) return null;
  const out: FloorZone[] = [];
  for (let i = 0; i < raw.length; i++) {
    const z = raw[i] as Record<string, unknown>;
    const kindRaw = String(z.kind || 'other');
    const kind = (ALLOWED.has(kindRaw) ? kindRaw : 'other') as FloorZoneKind;
    const x = Number(z.x);
    const y = Number(z.y);
    const w = Number(z.w);
    const h = Number(z.h);
    if (![x, y, w, h].every((n) => Number.isFinite(n))) continue;
    const s = snapZone(
      {
        x: clamp01(x),
        y: clamp01(y),
        w: Math.max(0.08, Math.min(0.85, w)),
        h: Math.max(0.08, Math.min(0.85, h)),
      },
      0.02,
    );
    out.push({
      id: String(z.id || `zone-${kind}-${i}-${Date.now().toString(36)}`),
      kind,
      ...s,
      labelKey: kind,
      label: typeof z.label === 'string' ? z.label.slice(0, 12) : undefined,
      furniture: Array.isArray(z.furniture)
        ? (z.furniture.slice(0, 4) as FloorZone['furniture'])
        : furnitureForKind(kind),
    });
  }
  if (!out.length) return null;
  return recomputeZoneAreas(out, widthM, depthM);
}

export function buildBeautifyImagePrompt(
  state: Pick<SpaceLabState, 'room' | 'activeDomain' | 'layoutLabel' | 'presetTitle'>,
  zones: FloorZone[],
  link?: SpaceProfileLink | null,
): string {
  const labels = zones
    .map((z) => `${z.label || z.kind}(${(z.areaSqm || 0).toFixed(0)}㎡)`)
    .join(', ');
  const domain = state.activeDomain || 'residential';
  return [
    'Top-down Chinese residential color floor plan illustration, architectural presentation style,',
    'soft pastel room fills, wood grain, clean labels in Chinese, white walls, north-up,',
    `domain ${domain}, entrance facing ${state.room.entranceFacing},`,
    `rooms: ${labels || 'open plan'},`,
    `scale about ${state.room.widthM.toFixed(0)} by ${state.room.depthM.toFixed(0)} meters,`,
    link?.yongShen?.length
      ? `harmonious layout preference elements ${link.yongShen.join(' ')},`
      : '',
    'no people, no watermark, no mystic symbols, professional real-estate brochure quality',
  ]
    .filter(Boolean)
    .join(' ');
}

export function buildBeautifyLlmSystemPrompt(): string {
  return `You are a floor-plan CAD assistant for Chinese fengshui teaching tools.
Return ONLY valid JSON: {"zones":[{"id":"string","kind":"living|bedroom|bath|kitchen|balcony|corridor|storage|shop|office|yard|other","x":0-1,"y":0-1,"w":0-1,"h":0-1,"label":"optional","furniture":["bed"|"sofa"|"table"|"toilet"|"sink"|"stove"|"desk"]}],"notes":["..."]}
Rules: keep rooms inside 0..1; avoid heavy overlaps; kinds whitelist only; improve furniture and labels; do not invent mystic luck claims.`;
}

export function buildBeautifyLlmUserPrompt(input: {
  domain: string;
  facing: string;
  widthM: number;
  depthM: number;
  zones: BeautifyZoneIn[];
  yongShen?: string[];
}): string {
  return JSON.stringify(
    {
      task: 'beautify_floor_zones',
      domain: input.domain,
      entranceFacing: input.facing,
      sizeM: { w: input.widthM, d: input.depthM },
      yongShen: input.yongShen || [],
      currentZones: input.zones,
    },
    null,
    0,
  );
}

function clamp01(v: number) {
  return Math.max(0, Math.min(1, v));
}

function defaultZonesForDomain(domain: string): FloorZone[] {
  const base: BeautifyZoneIn[] =
    domain === 'shop'
      ? [
          { kind: 'shop', x: 0.05, y: 0.05, w: 0.55, h: 0.9 },
          { kind: 'storage', x: 0.65, y: 0.05, w: 0.3, h: 0.4 },
          { kind: 'bath', x: 0.65, y: 0.55, w: 0.3, h: 0.25 },
        ]
      : domain === 'office'
        ? [
            { kind: 'office', x: 0.05, y: 0.05, w: 0.6, h: 0.9 },
            { kind: 'corridor', x: 0.68, y: 0.05, w: 0.12, h: 0.9 },
            { kind: 'bath', x: 0.82, y: 0.05, w: 0.13, h: 0.25 },
          ]
        : [
            { kind: 'living', x: 0.05, y: 0.05, w: 0.45, h: 0.55 },
            { kind: 'bedroom', x: 0.55, y: 0.05, w: 0.4, h: 0.4 },
            { kind: 'kitchen', x: 0.05, y: 0.65, w: 0.3, h: 0.3 },
            { kind: 'bath', x: 0.4, y: 0.65, w: 0.2, h: 0.25 },
            { kind: 'balcony', x: 0.55, y: 0.55, w: 0.4, h: 0.15 },
          ];
  return base.map((z, i) => {
    const kind = z.kind as FloorZoneKind;
    return {
      id: `zone-${kind}-${i}`,
      kind,
      ...snapZone({ x: z.x, y: z.y, w: z.w, h: z.h }, 0.02),
      labelKey: kind,
      furniture: furnitureForKind(kind),
    };
  });
}
