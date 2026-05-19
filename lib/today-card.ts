/**
 * v5-D37 今日一签 / Today Card
 *
 * 决策：从「报告产品」转向「时间产品」。
 * 用户每天打开 app，不是为了重新算命，而是看今天。
 *
 * 实现策略（MVP，不调 LLM）：
 *   - 取今日的日干支（用 lunar-javascript）
 *   - 与档案 dayMaster 比对，算出今日十神
 *   - 结合日支 vs 命局四柱地支的合/冲/刑/害，输出 do / avoid
 *   - 输出 1 句标题 + 3 个 do + 3 个 avoid + 1 个 window hint
 *
 * 不依赖：LLM、网络、用户历史事件。完全确定性，可 24h memoize。
 */

import { Solar } from 'lunar-javascript';
import type { FortuneRecord } from './user-types';
import {
  calculateShiShen,
  GAN_TO_WUXING,
  ZHI_CHONG,
  ZHI_HE,
  ZHI_XING,
  ZHI_HAI,
} from './bazi-constants';

// ---------------------------------------------------------------------------
// 类型
// ---------------------------------------------------------------------------

export interface TodayCardData {
  /** YYYY-MM-DD，今日（北京时区） */
  date: string;
  /** 今日干支柱，例如 "甲子日" */
  dayPillar: string;
  /** 今日天干 */
  dayStem: string;
  /** 今日地支 */
  dayBranch: string;
  /** 今日相对档案日主的十神，例如 "正财" */
  todayShiShen: string | null;
  /** 命格主气 vs 今日五行的关系标签 */
  toneLabel: 'auspicious' | 'neutral' | 'caution';
  /** 一句话标题（给玄学用户的口语化判断） */
  headline: string;
  /** 一段简短解释（30~60 字） */
  summary: string;
  /** 宜（最多 4 条） */
  doTags: string[];
  /** 忌（最多 4 条） */
  avoidTags: string[];
  /** 关键时段提示（一句口语） */
  windowHint: string;
  /** 关系命中：合 / 冲 / 刑 / 害 */
  relations: {
    he: string[];
    chong: string[];
    xing: string[];
    hai: string[];
  };
}

// ---------------------------------------------------------------------------
// 十神 → 宜 / 忌 文案表
// 设计原则：避免玄学黑话，给"可执行"的现代行为
// ---------------------------------------------------------------------------

interface ShiShenCopy {
  tone: 'auspicious' | 'neutral' | 'caution';
  headline: string;
  summary: string;
  do: string[];
  avoid: string[];
}

const SHI_SHEN_COPY: Record<string, ShiShenCopy> = {
  '比肩': {
    tone: 'neutral',
    headline: '今天靠自己，别指望谁',
    summary: '同气相求的一天，做事讲求独立判断。合伙、借力效率低，自己干反而快。',
    do: ['独立完成关键事项', '复盘个人计划', '运动 / 健身', '整理工作环境'],
    avoid: ['和人合伙开新项目', '凑份子 / 借钱', '依赖他人推动', '冲动比拼面子'],
  },
  '劫财': {
    tone: 'caution',
    headline: '当心被人借走时间和钱',
    summary: '外缘看似热闹，实际容易破财耗神。不要在今日做财务承诺。',
    do: ['核对账单', '婉拒社交邀约', '把任务写下来再做', '小额慈善（化解）'],
    avoid: ['借钱 / 担保 / 投资', '过度社交', '与同行公开比拼', '冲动消费'],
  },
  '食神': {
    tone: 'auspicious',
    headline: '宜表达、宜创造、宜请客',
    summary: '思路顺、表达活、口福好的一天。适合输出内容、做提案、安排聚餐。',
    do: ['写文章 / 做内容', '关键提案 / 演讲', '约饭 / 请客', '陪伴小孩或父母'],
    avoid: ['只读不写', '回避表态', '节食 / 极端饮食', '关键决策推迟'],
  },
  '伤官': {
    tone: 'caution',
    headline: '才华横溢，但小心顶撞',
    summary: '思维敏锐、批判性强，效率高。但说话容易得罪上级、犯口舌是非。',
    do: ['做创意 / 设计 / 写作', '解技术难题', '健身泄能量', '梳理流程缺陷'],
    avoid: ['顶撞上司 / 长辈', '签合同', '当众争辩', '发情绪化朋友圈'],
  },
  '偏财': {
    tone: 'auspicious',
    headline: '宜谈钱、宜出门、宜社交',
    summary: '财气活络的一天，适合谈业务、对外联络、扩大资源圈。',
    do: ['谈业务 / 推进客户', '出差 / 出门见人', '副业推进', '请人吃饭'],
    avoid: ['宅在家不动', '错过回复消息', '抠门让对方下不来台', '高风险投机'],
  },
  '正财': {
    tone: 'auspicious',
    headline: '宜踏实做事、宜处理财务',
    summary: '稳进的一天，适合处理报销、合同、长期规划。不求快但求准。',
    do: ['报销 / 对账 / 报税', '签长期合同', '陪伴伴侣', '规划储蓄'],
    avoid: ['冲动消费', '换工作 / 跳槽', '高风险投机', '画大饼'],
  },
  '七杀': {
    tone: 'caution',
    headline: '压力大但能扛事的一天',
    summary: '挑战、竞争、被推到台前的一天。顶住能成事，硬扛会内伤。',
    do: ['处理硬骨头任务', '面对面谈判', '健身 / 出汗', '设定边界'],
    avoid: ['和强势对象正面对抗', '熬夜', '酒精 / 高糖', '推脱责任'],
  },
  '正官': {
    tone: 'auspicious',
    headline: '宜面试、宜见领导、宜守规矩',
    summary: '权威场合给你加分的一天。仪表整洁、按流程走，事半功倍。',
    do: ['面试 / 述职', '见领导 / 长辈', '签官方文件', '穿正装出席'],
    avoid: ['迟到 / 临场放鸽子', '挑战权威', '走灰色地带', '邋遢出门'],
  },
  '偏印': {
    tone: 'neutral',
    headline: '宜独处、宜学习、宜清淡',
    summary: '直觉强但容易钻牛角尖。适合做研究、独处充电，少社交、少应酬。',
    do: ['深度学习 / 读书', '冥想 / 独处', '清理无效社交', '研究新技能'],
    avoid: ['做关键决策', '签合同', '大餐 / 暴饮暴食', '应酬聚会'],
  },
  '正印': {
    tone: 'auspicious',
    headline: '贵人扶持，宜请教、宜签约',
    summary: '受庇护的一天，长辈 / 导师 / 制度都偏向你。适合求助、签字、办手续。',
    do: ['请教前辈 / 导师', '签合同 / 办证件', '陪父母', '复习 / 备考'],
    avoid: ['和长辈顶嘴', '错过截止日期', '推卸学习责任', '熬夜伤神'],
  },
};

const FALLBACK_COPY: ShiShenCopy = {
  tone: 'neutral',
  headline: '平稳的一天，按计划推进',
  summary: '今日无显著加成或损耗。把昨天没做完的事做完，比开新坑更划算。',
  do: ['完成昨日未完成事项', '回复积压消息', '运动 30 分钟', '早睡'],
  avoid: ['开新项目', '熬夜', '冲动决定', '过度刷手机'],
};

// ---------------------------------------------------------------------------
// 关系命中文案
// ---------------------------------------------------------------------------

function buildRelationHints(
  todayBranch: string,
  fortuneBranches: string[]
): {
  he: string[];
  chong: string[];
  xing: string[];
  hai: string[];
  extraDo: string[];
  extraAvoid: string[];
  windowAdjust: string | null;
} {
  const he: string[] = [];
  const chong: string[] = [];
  const xing: string[] = [];
  const hai: string[] = [];

  for (const b of fortuneBranches) {
    if (!b) continue;
    if (ZHI_HE[todayBranch] === b) he.push(b);
    if (ZHI_CHONG[todayBranch] === b) chong.push(b);
    if (ZHI_XING[todayBranch] === b) xing.push(b);
    if (ZHI_HAI[todayBranch] === b) hai.push(b);
  }

  const extraDo: string[] = [];
  const extraAvoid: string[] = [];
  let windowAdjust: string | null = null;

  if (he.length > 0) {
    extraDo.push('谈合作 / 修复关系');
  }
  if (chong.length > 0) {
    extraAvoid.push('远行 / 长途驾驶');
    windowAdjust = '今日命局有冲，重要会议尽量约上午，避免下半夜赶路。';
  }
  if (xing.length > 0) {
    extraAvoid.push('医院 / 诉讼相关事务');
  }
  if (hai.length > 0) {
    extraAvoid.push('与小人型同事正面接触');
  }

  return { he, chong, xing, hai, extraDo, extraAvoid, windowAdjust };
}

// ---------------------------------------------------------------------------
// 默认时辰窗口
// ---------------------------------------------------------------------------

function buildWindowHint(toneLabel: 'auspicious' | 'neutral' | 'caution'): string {
  if (toneLabel === 'auspicious') return '上午 9–11 点最旺，重要事尽量约在这个时段。';
  if (toneLabel === 'caution') return '下午 3–5 点情绪最容易波动，关键沟通避开。';
  return '今日节奏平稳，按你日常工作高峰时段安排即可。';
}

// ---------------------------------------------------------------------------
// 主函数：buildTodayCard
// ---------------------------------------------------------------------------

export function buildTodayCardForFortune(
  fortune: Pick<FortuneRecord, 'id' | 'bazi'>,
  date: Date = new Date()
): TodayCardData | null {
  const dayMaster = fortune?.bazi?.dayMaster;
  const pillars = fortune?.bazi?.pillars;
  if (!dayMaster || !Array.isArray(pillars) || pillars.length < 4) return null;

  // 用北京时区的今日日期取干支
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  const solar = Solar.fromYmd(y, m, d);
  const lunar = solar.getLunar();
  const dayStem: string = lunar.getDayGan();
  const dayBranch: string = lunar.getDayZhi();

  const todayShiShen = calculateShiShen(dayMaster, dayStem);
  const copy = (todayShiShen && SHI_SHEN_COPY[todayShiShen]) || FALLBACK_COPY;

  // 命局地支
  const fortuneBranches = pillars.map((p: any) => p?.earthlyBranch).filter(Boolean);
  const rel = buildRelationHints(dayBranch, fortuneBranches);

  const doTags = dedupe([...copy.do, ...rel.extraDo]).slice(0, 4);
  const avoidTags = dedupe([...copy.avoid, ...rel.extraAvoid]).slice(0, 4);

  // 关系修正 tone：原本 auspicious 但今日冲命局，下调到 neutral
  let toneLabel = copy.tone;
  if (toneLabel === 'auspicious' && rel.chong.length > 0) toneLabel = 'neutral';
  if (rel.chong.length > 0 && rel.xing.length > 0) toneLabel = 'caution';

  const windowHint = rel.windowAdjust || buildWindowHint(toneLabel);

  const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

  return {
    date: dateStr,
    dayPillar: `${dayStem}${dayBranch}日`,
    dayStem,
    dayBranch,
    todayShiShen,
    toneLabel,
    headline: copy.headline,
    summary: copy.summary,
    doTags,
    avoidTags,
    windowHint,
    relations: {
      he: rel.he,
      chong: rel.chong,
      xing: rel.xing,
      hai: rel.hai,
    },
  };
}

function dedupe(arr: string[]): string[] {
  const out: string[] = [];
  for (const x of arr) {
    if (!out.includes(x)) out.push(x);
  }
  return out;
}

// ---------------------------------------------------------------------------
// 进程内 memoize：同 fortune + 同日期 缓存 24h
// 多进程 PM2 下每个 worker 各自一份，可接受（数据是纯确定函数）
// ---------------------------------------------------------------------------

const TTL_MS = 24 * 60 * 60 * 1000;
const cache = new Map<string, { value: TodayCardData; expiresAt: number }>();

export function buildTodayCardMemoized(
  fortune: Pick<FortuneRecord, 'id' | 'bazi'>,
  now: Date = new Date()
): TodayCardData | null {
  const dateKey = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
  const key = `${fortune.id}:${dateKey}`;
  const hit = cache.get(key);
  const t = now.getTime();
  if (hit && hit.expiresAt > t) return hit.value;
  const value = buildTodayCardForFortune(fortune, now);
  if (value) cache.set(key, { value, expiresAt: t + TTL_MS });
  return value;
}
