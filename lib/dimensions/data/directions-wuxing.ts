export type DirectionElement = '木' | '火' | '土' | '金' | '水';

export interface DirectionEntry {
  element: DirectionElement;
  direction: string;
  layout: string;
  moveNote: string;
}

export const DIRECTION_CATALOG: DirectionEntry[] = [
  { element: '木', direction: '东 / 东南', layout: '绿植、书架、木质家具，宜清爽通风', moveNote: '春夏季搬家相对更顺' },
  { element: '火', direction: '南', layout: '采光充足、暖色点缀，避免长期强光直射', moveNote: '午时前后不宜大动土' },
  { element: '土', direction: '中宫 / 西南 / 东北', layout: '厚重稳定、收纳有序，忌长期杂乱堆叠', moveNote: '季末月适合整理家宅动线' },
  { element: '金', direction: '西 / 西北', layout: '金属质感适度、整洁利落，忌尖角直冲床位', moveNote: '秋冬宜做收纳与清洁' },
  { element: '水', direction: '北', layout: '水景适度、镜面不宜对床，保持流通不积水', moveNote: '冬季搬家注意防潮与保暖' },
];

const CN_TO_ELEMENT: Record<string, DirectionElement> = {
  木: '木', 火: '火', 土: '土', 金: '金', 水: '水',
};

export function resolveDirections(favorable: string[], unfavorable: string[]): {
  enhance: DirectionEntry[];
  reduce: DirectionEntry[];
} {
  const favorSet = new Set(favorable.map((item) => CN_TO_ELEMENT[item] || item));
  const avoidSet = new Set(unfavorable.map((item) => CN_TO_ELEMENT[item] || item));

  const enhance = DIRECTION_CATALOG.filter((item) => favorSet.has(item.element));
  const reduce = DIRECTION_CATALOG.filter((item) => avoidSet.has(item.element));

  return {
    enhance: enhance.length ? enhance : DIRECTION_CATALOG.slice(0, 2),
    reduce: reduce.slice(0, 2),
  };
}