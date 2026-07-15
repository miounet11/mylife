export type BodyElement = '木' | '火' | '土' | '金' | '水';

export interface BodySystemEntry {
  element: BodyElement;
  organ: string;
  tendency: string;
  care: string;
}

export const BODY_SYSTEMS: BodySystemEntry[] = [
  { element: '木', organ: '肝胆 / 筋络', tendency: '情绪压力、作息紊乱时易疲劳', care: '规律作息、适度舒展、少熬夜' },
  { element: '火', organ: '心 / 血脉', tendency: '高负荷期易心悸、睡眠浅', care: '控制咖啡因、保留静息时间' },
  { element: '土', organ: '脾胃 / 消化', tendency: '饮食不规律时易腹胀、精力波动', care: '三餐定时、少生冷、细嚼慢咽' },
  { element: '金', organ: '肺 / 皮毛', tendency: '换季或干燥环境易呼吸道敏感', care: '保湿通风、适度有氧、防过度耗气' },
  { element: '水', organ: '肾 / 骨髓', tendency: '长期透支后恢复变慢', care: '保证睡眠、补水、避免连续高压' },
];

const ELEMENT_FROM_DAY: Record<string, BodyElement> = {
  甲: '木', 乙: '木', 丙: '火', 丁: '火', 戊: '土', 己: '土', 庚: '金', 辛: '金', 壬: '水', 癸: '水',
};

export function resolveBodySystems(
  dayMaster: string,
  jiElements: string[],
  healthScore: number,
): { focus: BodySystemEntry[]; stable: BodySystemEntry[] } {
  const dayElement = ELEMENT_FROM_DAY[dayMaster] || '土';
  const jiSet = new Set(jiElements);

  const focus = BODY_SYSTEMS.filter(
    (item) => item.element === dayElement || jiSet.has(item.element) || healthScore < 52,
  ).slice(0, 2);

  const stable = BODY_SYSTEMS.filter((item) => !focus.includes(item)).slice(0, 2);

  return {
    focus: focus.length ? focus : BODY_SYSTEMS.slice(0, 2),
    stable,
  };
}