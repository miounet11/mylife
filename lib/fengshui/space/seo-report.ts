/**
 * Deterministic SEO/GEO reports from the live space engine.
 * Unique because preset × facing × area × optional 用神 actually change the field.
 */

import { createDefaultLabState, simulateSpaceField } from './field-sim';
import { applyPresetToState, filterPresets } from './layout-presets';
import { buildFengshuiSpaceReport, type FengshuiSpaceReport } from './full-report';
import { adviseSites } from './site-advisor';
import { buildBaziSpaceBridge } from './bazi-space-bridge';
import { ensureFloorZones } from './cad-ops';
import { pickLayerGrid } from './field-sim';
import type { SpaceLabState, SpaceSimResult } from './types';
import type { SpaceSeoScenario } from './seo-catalog';
import { measureSpaceKeywordCoverage } from './seo-keyword-map';
import { listSpaceSeoScenarios } from './seo-catalog';

export type SpaceSeoPublicReport = {
  slug: string;
  path: string;
  scenario: SpaceSeoScenario;
  title: string;
  summary: string;
  answerSummary: string;
  metrics: FengshuiSpaceReport['metrics'];
  sections: FengshuiSpaceReport['sections'];
  priorityActions: string[];
  faqs: Array<{ question: string; answer: string }>;
  ctaHref: string;
  ctaLabel: string;
  related: Array<{ href: string; label: string }>;
  disclaimer: string;
};

function pickPreset(s: SpaceSeoScenario) {
  const list = filterPresets({
    domain: s.domain,
    layout: s.layout,
    areaSqm: s.areaSqm,
  });
  if (!list.length) return filterPresets({ domain: s.domain })[0] || null;
  return (
    list.find((p) => p.room.entranceFacing === s.facing) ||
    list.find((p) => p.layout.includes(s.layout) || s.layout.includes(p.layout)) ||
    list[0]
  );
}

export type SpaceSeoLab = {
  state: SpaceLabState;
  result: SpaceSimResult;
  enhanceFacings: string[];
  reduceFacings: string[];
};

export type SpaceSeoSceneSnapshot = {
  slug: string;
  domain: string;
  widthM: number;
  depthM: number;
  facing: string;
  layout: string;
  yongLabel: string;
  zones: Array<{ id: string; kind: string; label: string; x: number; y: number; w: number; h: number }>;
  vents: Array<{ id: string; kind: string; x: number; y: number }>;
  enhanceFacings: string[];
  reduceFacings: string[];
  heat: number[];
  heatW: number;
};

function applyScenarioToState(s: SpaceSeoScenario): SpaceLabState {
  const preset = pickPreset(s);
  let state = createDefaultLabState();
  if (preset) {
    state = applyPresetToState(state, preset, { areaSqm: s.areaSqm });
  }
  state.room.entranceFacing = s.facing;
  state.planOverlayMode = 'bagua8';
  state.showCompass = true;
  state.cadEditMode = false;
  state.activeLayer = 'energy';
  state.floorZones = ensureFloorZones(state);
  if (s.cityName) {
    state.geo = {
      address: `${s.cityName}（城市级观察，无门牌）`,
      lat: 0,
      lng: 0,
      name: s.cityName,
      source: 'manual',
    };
  }
  if (s.yongShen?.length) {
    state.profileLink = {
      fortuneId: `demo-${s.slug}`,
      birthSignature: 'seo-demo',
      displayName: `示例 · 用神${s.yongShen.join('、')}`,
      dayMaster:
        s.yongShen[0] === '木'
          ? '甲'
          : s.yongShen[0] === '火'
            ? '丙'
            : s.yongShen[0] === '土'
              ? '戊'
              : s.yongShen[0] === '金'
                ? '庚'
                : '壬',
      yongShen: s.yongShen,
      xiShen: [],
      jiShen: s.jiShen || [],
      linkedAt: '2026-01-01T00:00:00.000Z',
    };
  }
  return state;
}

export function buildSpaceSeoLab(s: SpaceSeoScenario): SpaceSeoLab {
  const state = applyScenarioToState(s);
  const result = simulateSpaceField(state);
  const bridge = buildBaziSpaceBridge(state);
  return {
    state,
    result,
    enhanceFacings: bridge.enhanceFacings,
    reduceFacings: bridge.reduceFacings,
  };
}

export function snapshotSpaceSeoScene(s: SpaceSeoScenario, lab?: SpaceSeoLab): SpaceSeoSceneSnapshot {
  const pack = lab || buildSpaceSeoLab(s);
  const zones = ensureFloorZones(pack.state);
  const heatW = 12;
  const grid = pickLayerGrid(pack.result.grids, 'energy');
  const gw = pack.result.grids.width;
  const gh = pack.result.grids.height;
  const heat: number[] = [];
  for (let y = 0; y < heatW; y++) {
    for (let x = 0; x < heatW; x++) {
      const gx = Math.min(gw - 1, Math.floor(((x + 0.5) / heatW) * gw));
      const gy = Math.min(gh - 1, Math.floor(((y + 0.5) / heatW) * gh));
      heat.push(grid[gy * gw + gx] || 0);
    }
  }
  const KIND_CN: Record<string, string> = {
    living: '客厅',
    bedroom: '卧室',
    bath: '卫',
    kitchen: '厨',
    balcony: '阳台',
    corridor: '过道',
    storage: '储',
    shop: '铺',
    office: '办公',
    yard: '院',
  };
  return {
    slug: s.slug,
    domain: pack.state.activeDomain,
    widthM: pack.state.room.widthM,
    depthM: pack.state.room.depthM,
    facing: pack.state.room.entranceFacing,
    layout: s.layout,
    yongLabel: (s.yongShen || []).join('、'),
    zones: zones.map((z) => ({
      id: z.id,
      kind: z.kind,
      label: z.label || KIND_CN[z.kind] || z.kind,
      x: z.x,
      y: z.y,
      w: z.w,
      h: z.h,
    })),
    vents: pack.state.vents.filter((v) => v.enabled).map((v) => ({ id: v.id, kind: v.kind, x: v.x, y: v.y })),
    enhanceFacings: pack.enhanceFacings,
    reduceFacings: pack.reduceFacings,
    heat,
    heatW,
  };
}

export function workbenchHref(s: SpaceSeoScenario): string {
  const q = new URLSearchParams();
  q.set('source', `seo_space_${s.cluster}`);
  if (s.facing) q.set('facing', s.facing);
  const preset = pickPreset(s);
  if (preset?.id) q.set('preset', preset.id);
  if (s.areaSqm) q.set('area', String(s.areaSqm));
  return `/tools/fengshui-space?${q.toString()}`;
}

export function buildSpaceSeoReport(s: SpaceSeoScenario): SpaceSeoPublicReport {
  const lab = buildSpaceSeoLab(s);
  const { state, result: sim } = lab;
  const built = buildFengshuiSpaceReport(state, sim);

  if (s.cityName && (s.job === '选铺' || s.domain === 'shop')) {
    const site = adviseSites('shop', [
      {
        label: `${s.cityName}示意点`,
        address: `${s.cityName} 商业 地铁`,
        lat: 31.2,
        lng: 121.4,
        facing: s.facing,
        areaSqm: s.areaSqm,
        streetFront: true,
        industry: s.layout.includes('餐') ? '餐饮' : '零售',
      },
    ]);
    if (site.summary) {
      built.sections = [
        ...built.sections,
        {
          id: 'city-site',
          heading: `${s.cityName}选址对照`,
          body: `${s.cityNote || ''}\n${site.summary}\n${site.candidates[0]?.actions?.slice(0, 3).join('\n') || ''}`,
        },
      ];
    }
  }

  const lead = s.cityNote ? `${s.angle} ${s.cityNote}` : s.angle;
  const summary = `${lead} 本页为「${s.layout} · ${s.facing}向 · 约${s.areaSqm}㎡」结构示意，峰值 ${(built.metrics.peakEnergy * 100).toFixed(0)}，滞留 ${(built.metrics.stagnationRatio * 100).toFixed(0)}%。`;

  const related = listSpaceSeoScenarios()
    .filter((x) => x.slug !== s.slug && (x.cluster === s.cluster || x.layout === s.layout || x.facing === s.facing))
    .slice(0, 6)
    .map((x) => ({ href: `/insights/space/${x.slug}`, label: x.title }));

  return {
    slug: s.slug,
    path: `/insights/space/${s.slug}`,
    scenario: s,
    title: s.title,
    summary: summary.slice(0, 220),
    answerSummary: `${s.angle} 用空间场对${s.layout}朝${s.facing}做结构观察（光、风、滞留、通道），并可叠日主用神做人宅合参。结论供对比，不构成置业或殡葬法定意见。`.slice(
      0,
      220,
    ),
    metrics: built.metrics,
    sections: built.sections,
    priorityActions: built.priorityActions,
    faqs: s.faqs,
    ctaHref: workbenchHref(s),
    ctaLabel: '在工作台打开此方案',
    related,
    disclaimer: built.disclaimer,
  };
}

export function spaceSeoHaystack(s: SpaceSeoScenario): string {
  return [s.title, s.intent, s.angle, s.job, s.layout, s.facing, s.cityName, ...(s.keywords || [])]
    .filter(Boolean)
    .join(' ');
}

export function spaceSeoCoverage() {
  const entries = listSpaceSeoScenarios().map((s) => ({ haystack: spaceSeoHaystack(s) }));
  return {
    reports: listSpaceSeoScenarios().length,
    ...measureSpaceKeywordCoverage(entries),
  };
}
