/**
 * Chat × 老师 运行时拼装
 *
 * 对标 GPTs/Projects：专家人设 + Project 上下文（报告/地理/实践）
 * 供 /api/chat 与本地兜底共用；不向用户展示内部编排术语。
 */

import {
  buildTeacherSystemPreamble,
  getTeacher,
  type TeacherDefinition,
  type TeacherId,
} from '@/lib/teachers';

export type ChatTeacherRequestBits = {
  teacher?: string | null;
  intent?: string | null;
  city?: string | null;
  /** 可选：服务端已整理的实践摘要行 */
  practiceLines?: string[] | null;
  /** 可选：服务端已整理的地理摘要行 */
  geoLines?: string[] | null;
  /** 用户资料库摘要行（渐进补全结果） */
  profileLines?: string[] | null;
  /** 报告短摘要（已有 context.summary 时可不再重复） */
  reportHint?: string | null;
};

/** intent / teacher 参数 → 老师定义 */
export function resolveChatTeacher(input: {
  teacher?: string | null;
  intent?: string | null;
}): TeacherDefinition {
  const raw = `${input.teacher || ''}`.trim();
  if (raw) return getTeacher(raw);

  const intent = `${input.intent || ''}`.trim().toLowerCase();
  const intentMap: Record<string, TeacherId> = {
    career: 'career',
    wealth: 'wealth',
    marriage: 'relationship',
    relationship: 'relationship',
    health: 'health',
    month: 'timing',
    risk: 'timing',
    timing: 'timing',
    move: 'geo',
    geo: 'geo',
    followup: 'practice',
    general: 'overview',
    overview: 'overview',
  };
  return getTeacher(intentMap[intent] || 'overview');
}

/**
 * 拼进 system 的老师附加块（接在主 system 之后）
 */
export function buildTeacherSystemAddon(bits: ChatTeacherRequestBits): {
  teacher: TeacherDefinition;
  addon: string;
} {
  const teacher = resolveChatTeacher(bits);
  const city = `${bits.city || ''}`.trim();
  const practice = (bits.practiceLines || []).map((x) => `${x}`.trim()).filter(Boolean).slice(0, 6);
  const geo = (bits.geoLines || []).map((x) => `${x}`.trim()).filter(Boolean).slice(0, 6);
  const profile = (bits.profileLines || []).map((x) => `${x}`.trim()).filter(Boolean).slice(0, 8);

  // 资料库中的现居城市可补 city
  const cityFromProfile = profile.find((p) => /现居城市=/.test(p));
  const effectiveCity =
    city ||
    (cityFromProfile ? cityFromProfile.replace(/^.*现居城市=/, '').split('；')[0]?.trim() : '') ||
    '';

  const lines = [
    '',
    '——',
    buildTeacherSystemPreamble(teacher),
    effectiveCity
      ? `用户关注/所在城市：${effectiveCity}。涉及节奏与选择时，把城市生活成本、行业环境与通勤现实纳入考虑；信息不足时说明边界。`
      : '',
    profile.length
      ? `用户资料库（对话中逐步确认，请当作可信背景）：\n${profile.map((p, i) => `${i + 1}. ${p}`).join('\n')}`
      : '',
    geo.length ? `地理相关上下文：\n${geo.map((g, i) => `${i + 1}. ${g}`).join('\n')}` : '',
    practice.length
      ? `用户已记录的实践/事件（请优先对照，勿空谈）：\n${practice.map((p, i) => `${i + 1}. ${p}`).join('\n')}`
      : '若用户尚未提供实践记录，可建议其把关键节点记入事件本后再回访，但不要强迫。',
    bits.reportHint ? `报告提示：${bits.reportHint}` : '',
    '若仍缺关键现实背景，可自然追问一句（例如城市、行业、关系状态），不要一次连问多项。',
    '回答时以该老师职责为边界；明显跨域时一句话点明，并建议换请对应老师深入。',
  ].filter(Boolean);

  return { teacher, addon: lines.join('\n') };
}

/**
 * 从 chat context 粗抽实践行（结构宽松，兼容不同字段）
 */
export function extractPracticeLinesFromChatContext(context: unknown): string[] {
  if (!context || typeof context !== 'object') return [];
  const c = context as Record<string, unknown>;
  const lines: string[] = [];

  const focused = c.focusedEvent as Record<string, unknown> | undefined;
  if (focused?.title) {
    const date = focused.date ? `（${focused.date}）` : '';
    lines.push(`关注事件：${focused.title}${date}`);
  }

  const events = (c.recentEvents || c.events || c.eventList) as unknown;
  if (Array.isArray(events)) {
    for (const ev of events.slice(0, 5)) {
      if (!ev || typeof ev !== 'object') continue;
      const e = ev as Record<string, unknown>;
      const title = `${e.title || e.name || ''}`.trim();
      if (!title) continue;
      const date = e.date ? ` · ${e.date}` : '';
      const status = e.validationStatus ? ` · ${e.validationStatus}` : '';
      lines.push(`${title}${date}${status}`);
    }
  }

  const focusAreas = c.focusAreas as unknown;
  if (Array.isArray(focusAreas)) {
    for (const a of focusAreas.slice(0, 3)) {
      const t = `${a || ''}`.trim();
      if (t) lines.push(`关注：${t}`);
    }
  }

  return lines.slice(0, 6);
}

export function extractGeoLinesFromChatContext(context: unknown, city?: string | null): string[] {
  const lines: string[] = [];
  const c = (context && typeof context === 'object' ? context : {}) as Record<string, unknown>;
  if (city) lines.push(`城市：${city}`);

  const report = c.report as Record<string, unknown> | undefined;
  if (report?.birthPlace) lines.push(`出生地：${report.birthPlace}`);
  if (report?.location) lines.push(`地点：${report.location}`);

  const spatial = c.spatial || c.geo || c.geography;
  if (typeof spatial === 'string' && spatial.trim()) lines.push(spatial.trim());
  if (spatial && typeof spatial === 'object') {
    const s = spatial as Record<string, unknown>;
    if (s.summary) lines.push(`${s.summary}`);
    if (Array.isArray(s.favorableDirections)) {
      lines.push(`较有利方位参考：${s.favorableDirections.slice(0, 4).join('、')}`);
    }
  }

  return lines.slice(0, 6);
}

/** 把 addon 接到已有 system 文本末尾 */
export function appendTeacherToSystemPrompt(systemContent: string, bits: ChatTeacherRequestBits): {
  systemContent: string;
  teacher: TeacherDefinition;
} {
  const { teacher, addon } = buildTeacherSystemAddon(bits);
  const base = `${systemContent || ''}`.trim();
  return {
    teacher,
    systemContent: base ? `${base}\n${addon}` : addon.trim(),
  };
}
