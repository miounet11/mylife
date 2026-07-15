/**
 * 对话渐进补全用户资料
 *
 * 原则（对标顶级产品「渐进建档」）：
 * - 每轮最多问 1 个缺口，可跳过，不打断主答
 * - 优先补对当前老师最有用的字段
 * - 从用户自然语言中抽取后写入 profile_supplements（合并不覆盖）
 * - 不对用户暴露「资料库/完整度算法」元叙事
 */

import {
  PROFILE_SUPPLEMENT_DOMAINS,
  type ProfileIntent,
  type SupplementDomain,
} from '@/lib/profile-settings-types';
import { listMissingRecommendations } from '@/lib/profile-supplement-recommendations';
import type { TeacherId } from '@/lib/teachers';

export type ProfileFieldSlot = {
  domain: SupplementDomain;
  fieldKey: string;
  label: string;
  /** 对话里怎么问（自然一句） */
  ask: string;
  /** 快捷选项（可选） */
  chips?: string[];
  priority: 'high' | 'medium';
};

export type ProgressiveProfileSnapshot = {
  domains: Record<string, Record<string, string>>;
};

/** 老师 → 意图（用于加权缺项） */
export function teacherToProfileIntent(teacherId: string | null | undefined): ProfileIntent | null {
  const map: Record<string, ProfileIntent> = {
    career: 'career',
    wealth: 'wealth',
    relationship: 'relationship',
    overview: 'yearly',
    timing: 'yearly',
    geo: 'yearly',
    practice: 'yearly',
    health: 'yearly',
    hehun: 'relationship',
    study: 'career',
    partnership: 'career',
  };
  return teacherId ? map[teacherId] || null : null;
}

/** 老师额外优先字段（在 intent 推荐之上） */
const TEACHER_FIELD_BOOST: Partial<Record<TeacherId, Array<{ domain: SupplementDomain; fieldKey: string }>>> = {
  geo: [
    { domain: 'residence', fieldKey: 'currentCity' },
    { domain: 'residence', fieldKey: 'plannedMove' },
    { domain: 'career', fieldKey: 'industry' },
  ],
  career: [
    { domain: 'career', fieldKey: 'industry' },
    { domain: 'career', fieldKey: 'role' },
    { domain: 'residence', fieldKey: 'currentCity' },
    { domain: 'goals', fieldKey: 'decisionPending' },
  ],
  wealth: [
    { domain: 'wealth', fieldKey: 'investmentStyle' },
    { domain: 'career', fieldKey: 'incomeStructure' },
    { domain: 'goals', fieldKey: 'twelveMonthGoal' },
  ],
  relationship: [
    { domain: 'relationship', fieldKey: 'status' },
    { domain: 'relationship', fieldKey: 'livingArrangement' },
    { domain: 'residence', fieldKey: 'currentCity' },
  ],
  health: [
    { domain: 'health', fieldKey: 'focusArea' },
    { domain: 'health', fieldKey: 'routine' },
  ],
  practice: [
    { domain: 'goals', fieldKey: 'primaryConcern' },
    { domain: 'goals', fieldKey: 'decisionPending' },
  ],
  overview: [
    { domain: 'goals', fieldKey: 'primaryConcern' },
    { domain: 'residence', fieldKey: 'currentCity' },
  ],
  timing: [
    { domain: 'goals', fieldKey: 'decisionPending' },
    { domain: 'residence', fieldKey: 'currentCity' },
  ],
};

const ASK_TEMPLATES: Record<string, { ask: string; chips?: string[] }> = {
  'residence.currentCity': {
    ask: '你现在主要在哪个城市生活或工作？补一下我好结合当地节奏说。',
    chips: ['北京', '上海', '广州', '深圳', '杭州', '成都', '海外'],
  },
  'residence.plannedMove': {
    ask: '近一两年有没有换城或搬家的打算？',
    chips: ['暂无', '考虑中', '已在计划'],
  },
  'career.industry': {
    ask: '你目前所在行业大致是？',
    chips: ['互联网', '金融', '教育', '制造', '自由职业', '体制内'],
  },
  'career.role': {
    ask: '你现在的岗位角色可以怎么概括？',
    chips: ['管理', '专业岗', '销售', '创业', '在读/待业'],
  },
  'career.workMode': {
    ask: '工作模式更接近哪一种？',
    chips: ['全职上班', '自由职业', '创业', '兼职'],
  },
  'career.incomeStructure': {
    ask: '收入结构更接近？',
    chips: ['固定薪资为主', '提成/项目制', '经营性收入', '混合'],
  },
  'goals.primaryConcern': {
    ask: '这阵子你最卡、最想弄清的一件事是什么？用一句话也行。',
  },
  'goals.twelveMonthGoal': {
    ask: '未来 12 个月，你最想做成的一件事是？',
  },
  'goals.decisionPending': {
    ask: '眼前有没有正在纠结的决定？（如跳槽、搬家、关系推进）',
    chips: ['跳槽/offer', '换城', '关系承诺', '暂无'],
  },
  'relationship.status': {
    ask: '目前的关系状态方便说一下吗？',
    chips: ['单身', '恋爱中', '已婚', '其他'],
  },
  'relationship.livingArrangement': {
    ask: '和重要他人目前是同城、异地还是同居？',
    chips: ['同城', '异地', '同居', '不适用'],
  },
  'wealth.investmentStyle': {
    ask: '财务上你更偏哪种风格？',
    chips: ['保守', '均衡', '偏进取'],
  },
  'wealth.debtPressure': {
    ask: '目前负债压力大致如何？',
    chips: ['无明显压力', '房贷车贷', '经营杠杆', '不便透露'],
  },
  'health.focusArea': {
    ask: '身体节律上你更想先照顾哪一块？（生活层面）',
    chips: ['睡眠', '情绪压力', '运动', '肠胃', '暂无特别'],
  },
  'health.routine': {
    ask: '最近作息大概怎样？',
    chips: ['较规律', '常熬夜', '不固定'],
  },
};

function fieldMeta(domain: SupplementDomain, fieldKey: string) {
  const def = PROFILE_SUPPLEMENT_DOMAINS[domain]?.fields.find((f) => f.key === fieldKey);
  return def;
}

function isFilled(snapshot: ProgressiveProfileSnapshot, domain: SupplementDomain, fieldKey: string) {
  return Boolean(`${snapshot.domains[domain]?.[fieldKey] || ''}`.trim());
}

/**
 * 下一条最值得问的补全（可空 = 暂不问）
 */
export function pickNextProfileSlot(params: {
  teacherId?: string | null;
  snapshot: ProgressiveProfileSnapshot;
  /** 本会话已问过/跳过的 key，避免连问 */
  askedKeys?: string[];
}): ProfileFieldSlot | null {
  const teacherId = (params.teacherId || 'overview') as TeacherId;
  const asked = new Set(params.askedKeys || []);
  const intent = teacherToProfileIntent(teacherId);

  const candidates: ProfileFieldSlot[] = [];

  const boost = TEACHER_FIELD_BOOST[teacherId] || [];
  for (const b of boost) {
    if (isFilled(params.snapshot, b.domain, b.fieldKey)) continue;
    const key = `${b.domain}.${b.fieldKey}`;
    if (asked.has(key)) continue;
    const meta = fieldMeta(b.domain, b.fieldKey);
    if (!meta) continue;
    const tpl = ASK_TEMPLATES[key] || { ask: `方便补充一下「${meta.label}」吗？` };
    candidates.push({
      domain: b.domain,
      fieldKey: b.fieldKey,
      label: meta.label,
      ask: tpl.ask,
      chips: tpl.chips,
      priority: 'high',
    });
  }

  const missing = listMissingRecommendations(intent, params.snapshot.domains);
  for (const m of missing) {
    const key = `${m.domain}.${m.fieldKey}`;
    if (asked.has(key)) continue;
    if (isFilled(params.snapshot, m.domain, m.fieldKey)) continue;
    if (candidates.some((c) => c.domain === m.domain && c.fieldKey === m.fieldKey)) continue;
    const tpl = ASK_TEMPLATES[key] || { ask: `方便补充一下「${m.label}」吗？` };
    candidates.push({
      domain: m.domain,
      fieldKey: m.fieldKey,
      label: m.label,
      ask: tpl.ask,
      chips: tpl.chips,
      priority: m.priority,
    });
  }

  candidates.sort((a, b) => (a.priority === 'high' ? 0 : 1) - (b.priority === 'high' ? 0 : 1));
  return candidates[0] || null;
}

export type ExtractedProfileField = {
  domain: SupplementDomain;
  fieldKey: string;
  value: string;
  confidence: number;
};

/**
 * 从用户一句话里尽量抽出资料字段（规则优先，稳妥不瞎猜）
 */
export function extractProfileFieldsFromMessage(
  message: string,
  hint?: { domain?: SupplementDomain; fieldKey?: string } | null,
): ExtractedProfileField[] {
  const text = `${message || ''}`.trim();
  if (!text || text.length > 500) return [];
  const out: ExtractedProfileField[] = [];

  // 若上一轮明确在问某字段，整句可直接当作该字段（排除明显否定/跳过）
  if (hint?.domain && hint?.fieldKey) {
    if (!/^(跳过|不说|不想|算了|下次|无|没有|保密|不便)/.test(text)) {
      const cleaned = text.replace(/^(我|目前|现在)?(是|在|属于)?/, '').trim() || text;
      if (cleaned.length >= 1 && cleaned.length <= 80) {
        out.push({
          domain: hint.domain,
          fieldKey: hint.fieldKey,
          value: cleaned.slice(0, 80),
          confidence: 0.72,
        });
      }
    }
  }

  // 城市
  const cityMatch =
    text.match(/(?:现居|住在|在|来自|城市(?:是|：|:)?)\s*([一-龥A-Za-z]{2,12}(?:市|州|县|区)?)/) ||
    text.match(/^(北京|上海|广州|深圳|杭州|成都|重庆|武汉|西安|南京|苏州|天津|长沙|郑州|青岛|厦门|香港|台北|海外)/);
  if (cityMatch) {
    const city = cityMatch[1].replace(/[，。！？\s].*$/, '').slice(0, 20);
    if (city && !out.some((x) => x.fieldKey === 'currentCity')) {
      out.push({ domain: 'residence', fieldKey: 'currentCity', value: city, confidence: 0.85 });
    }
  }

  // 关系状态
  if (/单身/.test(text)) {
    out.push({ domain: 'relationship', fieldKey: 'status', value: '单身', confidence: 0.9 });
  } else if (/已婚|结婚了/.test(text)) {
    out.push({ domain: 'relationship', fieldKey: 'status', value: '已婚', confidence: 0.9 });
  } else if (/恋爱|在谈|有对象/.test(text)) {
    out.push({ domain: 'relationship', fieldKey: 'status', value: '恋爱中', confidence: 0.8 });
  }

  if (/异地/.test(text)) {
    out.push({ domain: 'relationship', fieldKey: 'livingArrangement', value: '异地', confidence: 0.85 });
  } else if (/同居/.test(text)) {
    out.push({ domain: 'relationship', fieldKey: 'livingArrangement', value: '同居', confidence: 0.85 });
  }

  // 行业
  const industryMatch = text.match(/(?:行业(?:是|：|:)?|做)\s*([一-龥A-Za-z0-9]{2,16})/);
  const industries = ['互联网', '金融', '教育', '制造', '医疗', '房产', '自由职业', '体制内', '零售', '传媒'];
  for (const ind of industries) {
    if (text.includes(ind)) {
      out.push({ domain: 'career', fieldKey: 'industry', value: ind, confidence: 0.88 });
      break;
    }
  }
  if (industryMatch && !out.some((x) => x.fieldKey === 'industry')) {
    out.push({
      domain: 'career',
      fieldKey: 'industry',
      value: industryMatch[1].slice(0, 20),
      confidence: 0.7,
    });
  }

  // 投资风格
  if (/保守/.test(text) && /投资|理财|风格|风险/.test(text)) {
    out.push({ domain: 'wealth', fieldKey: 'investmentStyle', value: '保守', confidence: 0.8 });
  } else if (/激进|进取/.test(text) && /投资|理财|风格/.test(text)) {
    out.push({ domain: 'wealth', fieldKey: 'investmentStyle', value: '偏进取', confidence: 0.8 });
  }

  // 作息
  if (/熬夜/.test(text)) {
    out.push({ domain: 'health', fieldKey: 'routine', value: '常熬夜', confidence: 0.8 });
  } else if (/规律作息|作息规律/.test(text)) {
    out.push({ domain: 'health', fieldKey: 'routine', value: '较规律', confidence: 0.8 });
  }

  // 去重：同 field 留 confidence 最高
  const best = new Map<string, ExtractedProfileField>();
  for (const item of out) {
    const k = `${item.domain}.${item.fieldKey}`;
    const prev = best.get(k);
    if (!prev || item.confidence > prev.confidence) best.set(k, item);
  }
  return [...best.values()].filter((x) => x.confidence >= 0.68);
}

/** 写入用的合并：旧字段 + 新字段 */
export function mergeDomainFields(
  existing: Record<string, string> | undefined,
  patch: Record<string, string>,
): Record<string, string> {
  return {
    ...(existing || {}),
    ...Object.fromEntries(
      Object.entries(patch)
        .map(([k, v]) => [k, `${v || ''}`.trim()])
        .filter(([, v]) => v.length > 0),
    ),
  };
}

/** 给老师 system / 上下文用的短摘要 */
export function buildProfileContextLines(snapshot: ProgressiveProfileSnapshot): string[] {
  const lines: string[] = [];
  const order: SupplementDomain[] = ['residence', 'career', 'goals', 'relationship', 'wealth', 'health'];
  for (const domain of order) {
    const fields = snapshot.domains[domain];
    if (!fields) continue;
    const parts = Object.entries(fields)
      .filter(([, v]) => `${v || ''}`.trim())
      .map(([k, v]) => {
        const label = fieldMeta(domain, k)?.label || k;
        return `${label}=${v}`;
      });
    if (parts.length) {
      lines.push(`${PROFILE_SUPPLEMENT_DOMAINS[domain].label}：${parts.join('；')}`);
    }
  }
  return lines.slice(0, 8);
}

export function snapshotFromSupplementList(
  rows: Array<{ domain: string; fields: Record<string, string> }>,
): ProgressiveProfileSnapshot {
  const domains: Record<string, Record<string, string>> = {};
  for (const row of rows) {
    domains[row.domain] = { ...(row.fields || {}) };
  }
  return { domains };
}

export function slotKey(slot: ProfileFieldSlot) {
  return `${slot.domain}.${slot.fieldKey}`;
}
