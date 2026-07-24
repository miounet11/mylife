/**
 * 完整风水（空间场）报表 — 结构场 + 可选人宅合参
 */

import { DOMAIN_MODEL_META, isSpaceActiveDomain } from './domain-models';
import { ensureFloorZones } from './cad-ops';
import { buildBaziSpaceBridge, mergeBridgeIntoActions } from './bazi-space-bridge';
import type { SpaceLabState, SpaceSimResult } from './types';

export type FengshuiReportSection = {
  id: string;
  heading: string;
  body: string;
  tone?: 'default' | 'positive' | 'warning' | 'muted';
};

export type FengshuiSpaceReport = {
  schema: 'life-kline.fengshui-space-report.v1';
  generatedAt: string;
  title: string;
  summary: string;
  domain: string;
  domainLabel: string;
  metrics: {
    peakEnergy: number;
    avgEnergy: number;
    stagnationRatio: number;
    draftCorridor: number;
    lightBalance: number;
    nineStarBias: number;
    areaSqm: number;
  };
  layout: {
    title?: string | null;
    facing: string;
    sizeLabel: string;
    zoneCount: number;
    zones: Array<{ kind: string; label: string; areaSqm?: number }>;
  };
  geoPublic?: string | null;
  profileLinked: boolean;
  sections: FengshuiReportSection[];
  priorityActions: string[];
  disclaimer: string;
  planSnapshotDataUrl?: string | null;
};

export function buildFengshuiSpaceReport(
  state: SpaceLabState,
  result: SpaceSimResult,
  opts?: { planSnapshotDataUrl?: string | null; publicMode?: boolean },
): FengshuiSpaceReport {
  const domain = isSpaceActiveDomain(state.activeDomain) ? state.activeDomain : 'residential';
  const dm = DOMAIN_MODEL_META[domain];
  const bridge = buildBaziSpaceBridge(state);
  const merged = mergeBridgeIntoActions(result, bridge);
  const zones = ensureFloorZones(state);
  const areaSqm = Math.round(state.room.widthM * state.room.depthM * 10) / 10;
  const sizeLabel = `${state.room.widthM.toFixed(1)}×${state.room.depthM.toFixed(1)}×${state.room.heightM.toFixed(1)} m`;
  const layoutTitle = state.presetTitle || state.layoutLabel || dm.label;
  const geoPublic = opts?.publicMode
    ? redactGeo(state.geo?.address || state.geo?.name)
    : state.geo?.address || state.geo?.name || null;

  const zoneLines = zones.map((z) => {
    const label = z.label || z.kind;
    return z.areaSqm != null ? `· ${label} ${z.areaSqm}㎡` : `· ${label}`;
  });

  const ventLines = state.vents
    .filter((v) => v.enabled)
    .map(
      (v) =>
        `· ${v.kind === 'inlet' ? '进风/门' : '出风/窗'} @(${(v.x * 100).toFixed(0)}%,${(v.y * 100).toFixed(0)}%)`,
    );

  const sections: FengshuiReportSection[] = [
    {
      id: 'cover',
      heading: '封面摘要',
      body: [
        `业态：${dm.label} · 模型 ${dm.modelName}`,
        `方案：${layoutTitle}`,
        `体量：${sizeLabel} · 约 ${areaSqm}㎡ · 朝向 ${state.room.entranceFacing}`,
        geoPublic ? `区位：${geoPublic}` : null,
        bridge.linked
          ? `人宅：已关联主盘${bridge.dayMaster ? `（日主 ${bridge.dayMaster}）` : ''}`
          : '人宅：未关联八字（纯结构评估）',
      ]
        .filter(Boolean)
        .join('\n'),
      tone: 'default',
    },
    {
      id: 'metrics',
      heading: '场模拟读数',
      body: [
        `峰值能量 ${(result.summary.peakEnergy * 100).toFixed(0)}`,
        `均值能量 ${(result.summary.avgEnergy * 100).toFixed(0)}`,
        `滞留比 ${(result.summary.stagnationRatio * 100).toFixed(0)}%`,
        `通道比 ${(result.summary.draftCorridor * 100).toFixed(0)}%`,
        `采光平衡 ${(result.summary.lightBalance * 100).toFixed(0)}`,
        `九星偏向 ${(result.summary.nineStarBias * 100).toFixed(0)}`,
      ].join('\n'),
      tone: 'positive',
    },
    {
      id: 'layout',
      heading: '户型结构',
      body:
        zoneLines.length > 0
          ? `共 ${zones.length} 个房间块：\n${zoneLines.join('\n')}`
          : '暂无 CAD 房间分区，可在平面 CAD 中拖矩形创建房间。',
    },
    {
      id: 'openings',
      heading: '动线与开口',
      body:
        ventLines.length > 0
          ? ventLines.join('\n')
          : '未设置门窗/风口，建议至少保留一进一出。',
    },
    {
      id: 'structure',
      heading: '结构观察',
      body: merged.structuralNotes.map((n, i) => `${i + 1}. ${n}`).join('\n') || '—',
    },
    {
      id: 'overlay',
      heading: '方位叠图',
      body: [
        `当前模式：${state.planOverlayMode || 'none'}`,
        `主入口：${state.room.entranceFacing}`,
        `图面旋转：${state.room.planRotationDeg || 0}°`,
        bridge.overlayHint,
      ].join('\n'),
    },
  ];

  if (result.qimen?.summaryNotes?.length) {
    sections.push({
      id: 'qimen',
      heading: '奇门遁甲示意（教学层）',
      body: result.qimen.summaryNotes.join('\n'),
      tone: 'muted',
    });
  }

  sections.push({
    id: 'renzhai',
    heading: '人宅合参',
    body: bridge.linked
      ? [
          ...bridge.summaryLines,
          '',
          '宜强化：',
          ...bridge.enhanceNotes.map((n) => `· ${n}`),
          '',
          '宜收敛：',
          ...(bridge.reduceNotes.length
            ? bridge.reduceNotes.map((n) => `· ${n}`)
            : ['· 忌神方位不明显，以整洁通风为主']),
        ].join('\n')
      : bridge.entranceNote + '\n' + bridge.bedroomNote,
    tone: bridge.linked ? 'positive' : 'warning',
  });

  sections.push({
    id: 'actions',
    heading: '优先动作',
    body: merged.priorityActions.map((a, i) => `${i + 1}. ${a}`).join('\n') || '保持现状观察一周。',
    tone: 'positive',
  });

  sections.push({
    id: 'boundary',
    heading: '边界说明',
    body: [
      '本报表为结构场启发式评估与教学示意，不构成置业、装修、投资或殡葬法定意见。',
      '人宅合参基于用户授权关联的主盘用神，不承诺吉凶改变。',
      '重大工程请咨询持证专业人士。',
    ].join('\n'),
    tone: 'muted',
  });

  const title = `空间场完整报表 · ${dm.label} · ${layoutTitle}`.slice(0, 80);
  const summary =
    merged.structuralNotes[0] ||
    `约 ${areaSqm}㎡ ${dm.label}，峰值 ${(result.summary.peakEnergy * 100).toFixed(0)}，${
      bridge.linked ? '已做人宅合参' : '结构场独立评估'
    }`;

  return {
    schema: 'life-kline.fengshui-space-report.v1',
    generatedAt: new Date().toISOString(),
    title,
    summary: summary.slice(0, 200),
    domain,
    domainLabel: dm.label,
    metrics: {
      peakEnergy: result.summary.peakEnergy,
      avgEnergy: result.summary.avgEnergy,
      stagnationRatio: result.summary.stagnationRatio,
      draftCorridor: result.summary.draftCorridor,
      lightBalance: result.summary.lightBalance,
      nineStarBias: result.summary.nineStarBias,
      areaSqm,
    },
    layout: {
      title: layoutTitle,
      facing: state.room.entranceFacing,
      sizeLabel,
      zoneCount: zones.length,
      zones: zones.map((z) => ({
        kind: z.kind,
        label: z.label || z.kind,
        areaSqm: z.areaSqm,
      })),
    },
    geoPublic: geoPublic || null,
    profileLinked: bridge.linked,
    sections,
    priorityActions: merged.priorityActions,
    disclaimer:
      '结构启发式评估，供专业风水/选址讨论与客户沟通，不构成置业、投资或殡葬法定意见。',
    planSnapshotDataUrl: opts?.planSnapshotDataUrl || state.beautifyImageDataUrl || null,
  };
}

export function reportToPlainText(report: FengshuiSpaceReport): string {
  const lines = [
    `【${report.title}】`,
    report.generatedAt,
    report.summary,
    '',
    ...report.sections.flatMap((s) => [`## ${s.heading}`, s.body, '']),
    report.disclaimer,
    'https://www.life-kline.com/tools/fengshui-space',
  ];
  return lines.join('\n');
}

function redactGeo(raw?: string | null): string | null {
  if (!raw) return null;
  // drop street numbers / full precision
  return raw
    .replace(/\d{1,4}号.*/, '')
    .replace(/\d{5,}/g, '')
    .trim()
    .slice(0, 40) || '已脱敏区位';
}
