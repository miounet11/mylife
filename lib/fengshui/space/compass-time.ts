/** 时辰 · 方位 · 九星示意（教学近似，非精密飞星盘） */

const DIZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'] as const;

const FACING_ELEMENT: Record<string, string> = {
  东: 'wood',
  东南: 'wood',
  南: 'fire',
  西南: 'earth',
  西: 'metal',
  西北: 'metal',
  北: 'water',
  东北: 'earth',
};

const ELEMENT_CN: Record<string, string> = {
  wood: '木',
  fire: '火',
  earth: '土',
  metal: '金',
  water: '水',
};

/** 传统时辰（双小时） */
export function hourToDizhi(hour: number): string {
  const h = ((Math.floor(hour) % 24) + 24) % 24;
  // 23-1 子, 1-3 丑, ...
  const idx = Math.floor(((h + 1) % 24) / 2);
  return DIZHI[idx];
}

export function dizhiIndex(hour: number): number {
  const h = ((Math.floor(hour) % 24) + 24) % 24;
  return Math.floor(((h + 1) % 24) / 2);
}

/** 太阳方位：正午南=180° 简化（地理北坐标系：0 北 90 东 180 南 270 西）→ 转为东=0 逆时针 */
export function sunAzimuthDeg(hour: number, minute = 0): number {
  const t = hour + minute / 60;
  // 6:00 东=0, 12:00 南=90? Wait — panel uses 出风方向 东=0 style
  // Use: 6→0°(东), 12→90°(南), 18→180°(西), 0→270°(北)
  const solar = ((t - 6) / 24) * 360;
  return ((solar % 360) + 360) % 360;
}

export function moonPhaseLabel(day: number): string {
  const d = ((day - 1) % 30) + 1;
  if (d <= 3 || d >= 28) return '朔月';
  if (d <= 7) return '蛾眉月';
  if (d <= 11) return '上弦月';
  if (d <= 16) return '望月';
  if (d <= 20) return '亏凸月';
  if (d <= 24) return '下弦月';
  return '残月';
}

/** 简化九星：按年支+时辰循环挂名，仅用于倍率示意 */
const STAR_CYCLE = [
  { name: '一白贪狼', element: 'water', bias: 1.05 },
  { name: '二黑巨门', element: 'earth', bias: 0.92 },
  { name: '三碧禄存', element: 'wood', bias: 1.02 },
  { name: '四绿文曲', element: 'wood', bias: 1.04 },
  { name: '五黄廉贞', element: 'earth', bias: 0.88 },
  { name: '六白武曲', element: 'metal', bias: 1.06 },
  { name: '七赤破军', element: 'metal', bias: 0.95 },
  { name: '八白左辅', element: 'earth', bias: 1.08 },
  { name: '九紫右弼', element: 'fire', bias: 1.12 },
] as const;

export function resolveNineStar(year: number, hour: number) {
  const idx = (year + dizhiIndex(hour)) % 9;
  return STAR_CYCLE[idx];
}

export function entranceElement(facing: string): string {
  return FACING_ELEMENT[facing] || 'earth';
}

export function entranceElementCn(facing: string): string {
  return ELEMENT_CN[entranceElement(facing)] || '土';
}

export function azimuthToFacingLabel(deg: number): string {
  const d = ((deg % 360) + 360) % 360;
  const labels = ['东', '东南', '南', '西南', '西', '西北', '北', '东北'];
  const idx = Math.round(d / 45) % 8;
  return labels[idx];
}

export { DIZHI, ELEMENT_CN, FACING_ELEMENT };
