/**
 * 人宅合参：将用户主盘用神映射到空间场建议（不强制改几何）
 */

import { resolveDirections } from '@/lib/dimensions/data/directions-wuxing';
import type { SpaceLabState, SpaceProfileLink, SpaceSimResult } from './types';

export type BaziSpaceBridge = {
  linked: boolean;
  dayMaster?: string;
  yongShen: string[];
  jiShen: string[];
  enhanceNotes: string[];
  reduceNotes: string[];
  entranceNote: string;
  bedroomNote: string;
  overlayHint: string;
  summaryLines: string[];
};

const FACING_ELEMENT: Record<string, string> = {
  东: '木',
  东南: '木',
  南: '火',
  西南: '土',
  西: '金',
  西北: '金',
  北: '水',
  东北: '土',
};

export function buildBaziSpaceBridge(
  state: Pick<SpaceLabState, 'room' | 'profileLink' | 'activeDomain' | 'planOverlayMode'>,
): BaziSpaceBridge {
  const link = state.profileLink;
  if (!link || (!link.yongShen?.length && !link.jiShen?.length)) {
    return {
      linked: false,
      yongShen: [],
      jiShen: [],
      enhanceNotes: [],
      reduceNotes: [],
      entranceNote: '未关联八字：以下为纯结构场观察，可点「关联我的八字」做人宅合参。',
      bedroomNote: '关联主盘后，将给出主卧/静区与用神方位的合参建议。',
      overlayHint: '可开八方位/九宫叠图做结构对照。',
      summaryLines: ['未绑定八字 · 结构场独立评估'],
    };
  }

  const yong = link.yongShen || [];
  const ji = link.jiShen || [];
  const { enhance, reduce } = resolveDirections(yong, ji);
  const facing = state.room.entranceFacing || '南';
  const faceEl = FACING_ELEMENT[facing] || '土';
  const yongSet = new Set(yong);
  const entranceMatch = yongSet.has(faceEl);

  const enhanceNotes = enhance.map(
    (e) => `${e.direction}（${e.element}）：${e.layout}`,
  );
  const reduceNotes = reduce.map(
    (e) => `${e.direction}（${e.element}）：宜收敛杂物与高耗能堆叠`,
  );

  const entranceNote = entranceMatch
    ? `主入口朝${facing}（五行偏${faceEl}），与用神（${yong.join('、') || '—'}）同气相求，结构上利于「接气」。`
    : `主入口朝${facing}（五行偏${faceEl}），用神偏${yong.join('、') || '待判定'}：可在用神方位加强采光/绿植/整洁，而非强改朝向。`;

  const bedroomNote =
    enhance[0]
      ? `静区/主卧宜优先靠向 ${enhance[0].direction}；忌神侧保持简洁、少堆电器。`
      : '静区宜通风采光稳定，忌长期杂乱。';

  const overlayHint =
    state.planOverlayMode && state.planOverlayMode !== 'none'
      ? `当前叠图 ${state.planOverlayMode}：对照用神方位检查家具与动线。`
      : '建议打开「八方位」叠图，对照用神方位微调家具与门窗。';

  const who = link.displayName ? `宅主 ${link.displayName}` : '宅主主盘';
  const dm = link.dayMaster ? `日主 ${link.dayMaster}` : '';

  return {
    linked: true,
    dayMaster: link.dayMaster,
    yongShen: yong,
    jiShen: ji,
    enhanceNotes,
    reduceNotes,
    entranceNote,
    bedroomNote,
    overlayHint,
    summaryLines: [
      `${who}${dm ? ` · ${dm}` : ''}`,
      `用神/喜神：${yong.join('、') || '—'}`,
      ji.length ? `忌神：${ji.join('、')}` : '忌神：不明显',
      entranceNote,
      bedroomNote,
    ],
  };
}

/** 将人宅合参注入场模拟优先动作（不改网格） */
export function mergeBridgeIntoActions(
  result: SpaceSimResult,
  bridge: BaziSpaceBridge,
): { structuralNotes: string[]; priorityActions: string[] } {
  const structuralNotes = [...(result.summary.structuralNotes || [])];
  const priorityActions = [...(result.summary.priorityActions || [])];

  if (!bridge.linked) {
    if (!structuralNotes.some((n) => n.includes('未关联八字'))) {
      structuralNotes.push(bridge.entranceNote);
    }
    return { structuralNotes, priorityActions };
  }

  for (const line of bridge.summaryLines.slice(0, 3)) {
    if (!structuralNotes.includes(line)) structuralNotes.unshift(line);
  }
  if (bridge.enhanceNotes[0] && !priorityActions.some((a) => a.includes('用神方位'))) {
    priorityActions.unshift(`用神方位强化：${bridge.enhanceNotes[0]}`);
  }
  if (bridge.reduceNotes[0] && !priorityActions.some((a) => a.includes('忌神'))) {
    priorityActions.push(`忌神方位收敛：${bridge.reduceNotes[0]}`);
  }
  if (!priorityActions.some((a) => a.includes('叠图'))) {
    priorityActions.push(bridge.overlayHint);
  }

  return {
    structuralNotes: structuralNotes.slice(0, 12),
    priorityActions: priorityActions.slice(0, 10),
  };
}

export function profileLinkFromFortuneRow(row: {
  id?: string;
  fortuneId?: string;
  name?: string;
  displayName?: string;
  birthSignature?: string;
  bazi?: unknown;
  analysis?: unknown;
  truthInput?: unknown;
}): SpaceProfileLink | null {
  const fortuneId = String(row.fortuneId || row.id || '').trim();
  if (!fortuneId) return null;

  const bazi =
    (typeof row.bazi === 'object' && row.bazi) ||
    (typeof row.analysis === 'object' && row.analysis) ||
    (typeof row.truthInput === 'object' && row.truthInput) ||
    {};
  const rec = bazi as Record<string, unknown>;
  const yongRaw =
    (rec.yongShen as { yongShen?: string[]; xiShen?: string[]; jiShen?: string[] }) ||
    (rec.yong_shen as { yongShen?: string[]; xiShen?: string[]; jiShen?: string[] }) ||
    {};
  const yongShen = [
    ...((yongRaw.yongShen as string[]) || []),
    ...((yongRaw.xiShen as string[]) || []),
  ].filter(Boolean);
  const jiShen = [...((yongRaw.jiShen as string[]) || [])].filter(Boolean);

  // nested analysis.yongShen
  if (!yongShen.length && rec.analysis && typeof rec.analysis === 'object') {
    const a = rec.analysis as Record<string, unknown>;
    const y = a.yongShen as { yongShen?: string[]; xiShen?: string[]; jiShen?: string[] };
    if (y) {
      yongShen.push(...(y.yongShen || []), ...(y.xiShen || []));
      jiShen.push(...(y.jiShen || []));
    }
  }

  const pillars = (rec.pillars as Array<{ gan?: string; zhi?: string }>) || [];
  const dayPillar = pillars[2];
  const dayMaster =
    (rec.dayMaster as string) ||
    (rec.day_master as string) ||
    (dayPillar?.gan ? String(dayPillar.gan) : undefined);

  const birthSignature =
    String(row.birthSignature || rec.birthSignature || fortuneId).slice(0, 80);

  return {
    fortuneId,
    birthSignature,
    displayName: String(row.displayName || row.name || '').slice(0, 40) || undefined,
    dayMaster,
    yongShen: [...new Set(yongShen)].slice(0, 6),
    jiShen: [...new Set(jiShen)].slice(0, 6),
    linkedAt: new Date().toISOString(),
  };
}
