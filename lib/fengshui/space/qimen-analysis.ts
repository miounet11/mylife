/**
 * 空间场 · 奇门遁甲结构示意
 * 教学/结构近似：按时辰与日柱推八门九宫强度，不输出吉凶断语。
 */

import type { QimenPalaceNote, QimenSpaceReading, SpaceTimeState } from './types';
import { dizhiIndex, hourToDizhi } from './compass-time';

const DOORS = ['休门', '生门', '伤门', '杜门', '景门', '死门', '惊门', '开门'] as const;
const STARS = ['天蓬', '天芮', '天冲', '天辅', '天禽', '天心', '天柱', '天任', '天英'] as const;

/** 八门结构倾向（非吉凶）：流动/汇聚/阻滞/展示… */
const DOOR_HINT: Record<string, { hint: string; intensity: number }> = {
  休门: { hint: '宜静养、收纳与低噪声功能', intensity: 0.55 },
  生门: { hint: '宜动线发起、经营展示与采光面', intensity: 0.92 },
  伤门: { hint: '宜通道、设备区，避免久坐作业', intensity: 0.48 },
  杜门: { hint: '宜私密、储藏与隔断加强', intensity: 0.5 },
  景门: { hint: '宜窗景、会客与视觉焦点', intensity: 0.78 },
  死门: { hint: '宜低活动、仓储，不宜主入口正对', intensity: 0.35 },
  惊门: { hint: '宜警示/安防设备，注意噪声源', intensity: 0.42 },
  开门: { hint: '宜主入口、会谈与对外连接', intensity: 0.95 },
};

const STEM = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
const BRANCH = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

function dayPillarFromYmd(y: number, m: number, d: number): string {
  // 简化日柱：儒略日近似（结构示意用）
  const t = Math.floor(Date.UTC(y, m - 1, d) / 86400000);
  const stem = STEM[((t + 9) % 10 + 10) % 10];
  const branch = BRANCH[((t + 1) % 12 + 12) % 12];
  return `${stem}${branch}`;
}

function hourPillar(day: string, hour: number): string {
  const dayStem = day[0] || '甲';
  const dayStemIdx = Math.max(0, STEM.indexOf(dayStem));
  const hIdx = dizhiIndex(hour);
  // 五鼠遁简化
  const start = [0, 2, 4, 6, 8, 0, 2, 4, 6, 8][dayStemIdx] ?? 0;
  const stem = STEM[(start + hIdx) % 10];
  return `${stem}${BRANCH[hIdx]}`;
}

/**
 * 起局序号示意：按日支+时支折叠到 1–9 局
 */
function juNumber(day: string, hour: number): number {
  const dayBranch = day[1] || '子';
  const b = Math.max(0, BRANCH.indexOf(dayBranch));
  const h = dizhiIndex(hour);
  return ((b + h) % 9) + 1;
}

export function analyzeQimenSpace(time: SpaceTimeState, entranceFacing: string): QimenSpaceReading {
  let hour = time.hour;
  let minute = time.minute;
  if (time.followClock) {
    const n = new Date();
    hour = n.getHours();
    minute = n.getMinutes();
  }
  const day = dayPillarFromYmd(time.year, time.month, time.day);
  const hourP = hourPillar(day, hour);
  const ju = juNumber(day, hour);
  const hIdx = dizhiIndex(hour);

  const palaces: QimenPalaceNote[] = [];
  for (let i = 0; i < 9; i++) {
    const door = DOORS[(i + hIdx + ju) % DOORS.length];
    const star = STARS[(i + ju) % STARS.length];
    const meta = DOOR_HINT[door] || { hint: '结构观察', intensity: 0.5 };
    palaces.push({
      index: i,
      door,
      star,
      structuralHint: meta.hint,
      intensity: meta.intensity,
    });
  }

  // 值符值使：取时辰偏移宫
  const valueFu = STARS[(hIdx + ju) % STARS.length];
  const valueShi = DOORS[(hIdx + ju) % DOORS.length];

  const entryPalace = (() => {
    // 南入口偏下宫 7/8/6，北偏上 1/2/0 …
    if (entranceFacing.includes('南')) return 7;
    if (entranceFacing.includes('北')) return 1;
    if (entranceFacing.includes('东')) return 5;
    if (entranceFacing.includes('西')) return 3;
    return 4;
  })();

  const entry = palaces[entryPalace];
  const summaryNotes = [
    `时干支 ${hourP} · 日干支 ${day} · 示意 ${ju} 局（结构推演，非军用精密盘）。`,
    `值符示意「${valueFu}」，值使示意「${valueShi}」。`,
    `主入口朝「${entranceFacing}」落入第 ${entryPalace + 1} 宫：${entry.door}/${entry.star} — ${entry.structuralHint}。`,
  ];

  const actions: string[] = [];
  if (entry.door === '死门' || entry.door === '惊门') {
    actions.push('入口宫偏阻滞/警觉：加强门斗缓冲与照明，避免入口直对仓储死角。');
  }
  if (entry.door === '开门' || entry.door === '生门') {
    actions.push('入口宫偏通达/生发：保持门面通透与接待动线，勿堆高遮挡。');
  }
  const high = [...palaces].sort((a, b) => b.intensity - a.intensity).slice(0, 2);
  actions.push(
    `高活动宜落在 ${high.map((p) => `第${p.index + 1}宫(${p.door})`).join('、')} 一带（展示/会客/作业）。`,
  );
  actions.push('奇门层与热力叠加时，以动线可验证为准，不替代实测与法规。');

  return {
    juLabel: `${ju}局示意`,
    valueFu,
    valueShi,
    hourPillar: hourP,
    dayPillar: day,
    palaces,
    summaryNotes,
    actions: actions.slice(0, 4),
  };
}

/** 将九宫强度映射到 grid */
export function qimenGridFromReading(
  reading: QimenSpaceReading,
  w: number,
  h: number,
): Float32Array {
  const g = new Float32Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const px = Math.min(2, Math.floor((x / w) * 3));
      const py = Math.min(2, Math.floor((y / h) * 3));
      const palace = py * 3 + px;
      g[y * w + x] = reading.palaces[palace]?.intensity ?? 0.5;
    }
  }
  // normalize
  let max = 0;
  for (let i = 0; i < g.length; i++) max = Math.max(max, g[i]);
  if (max > 0) {
    for (let i = 0; i < g.length; i++) g[i] /= max;
  }
  return g;
}

export { hourToDizhi };
