export interface ShichenOption {
  name: string;
  label: string;
  range: string;
  alias: string;
  period: 'night' | 'dawn' | 'morning' | 'noon' | 'afternoon' | 'evening';
  midHour: number;
}

export const SHICHEN_OPTIONS: ShichenOption[] = [
  { name: '子', label: '子时', range: '23:00-01:00', alias: '夜半', period: 'night', midHour: 0 },
  { name: '丑', label: '丑时', range: '01:00-03:00', alias: '鸡鸣', period: 'night', midHour: 2 },
  { name: '寅', label: '寅时', range: '03:00-05:00', alias: '平旦', period: 'dawn', midHour: 4 },
  { name: '卯', label: '卯时', range: '05:00-07:00', alias: '日出', period: 'dawn', midHour: 6 },
  { name: '辰', label: '辰时', range: '07:00-09:00', alias: '食时', period: 'morning', midHour: 8 },
  { name: '巳', label: '巳时', range: '09:00-11:00', alias: '隅中', period: 'morning', midHour: 10 },
  { name: '午', label: '午时', range: '11:00-13:00', alias: '日中', period: 'noon', midHour: 12 },
  { name: '未', label: '未时', range: '13:00-15:00', alias: '日昳', period: 'afternoon', midHour: 14 },
  { name: '申', label: '申时', range: '15:00-17:00', alias: '晡时', period: 'afternoon', midHour: 16 },
  { name: '酉', label: '酉时', range: '17:00-19:00', alias: '日入', period: 'evening', midHour: 18 },
  { name: '戌', label: '戌时', range: '19:00-21:00', alias: '黄昏', period: 'evening', midHour: 20 },
  { name: '亥', label: '亥时', range: '21:00-23:00', alias: '人定', period: 'night', midHour: 22 },
];

export function getShichenOption(hour: number): ShichenOption {
  if (hour === 23 || hour === 0) {
    return SHICHEN_OPTIONS[0];
  }

  const index = Math.floor((hour + 1) / 2);
  return SHICHEN_OPTIONS[index] || SHICHEN_OPTIONS[0];
}

export function getShichenLabel(hour: number): string {
  const option = getShichenOption(hour);
  return `${option.label}(${option.range})`;
}
