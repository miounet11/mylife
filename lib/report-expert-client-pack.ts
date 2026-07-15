/**
 * 专业版 · 对客交付包（话术 + 解释方式）
 * 给从业者：3 分钟口播 + 白话案主版 + 专业底稿要点
 * 语气：2026 当代商业/生活语境，不堆砌古籍腔。
 */

import type { ExpertDeskView } from '@/lib/report-expert-view';
import { KNOWLEDGE_BASE } from '@/lib/knowledge-base-meta';
import { presentReportText } from '@/lib/report-presentation';

export interface ExpertClientPack {
  /** 开场 30 秒 */
  opening: string;
  /** 3 分钟口播结构 */
  scriptBeats: Array<{ beat: string; line: string }>;
  /** 可直接发给案主的白话结论 */
  clientPlain: string;
  /** 专业自留底稿要点 */
  proNotes: string[];
  /** 异议处理 */
  objections: Array<{ concern: string; reply: string }>;
  /** 结束行动建议 */
  closingActions: string[];
  /** 边界与合规 */
  disclaimer: string;
  /** 一键复制全文 */
  copyAll: string;
  knowledgeStamp: string;
}

export function buildExpertClientPack(desk: ExpertDeskView): ExpertClientPack {
  const name = desk.input.name !== '—' ? desk.input.name : '案主';
  const dm = desk.dayMaster || '日主';
  const pattern = desk.pattern.type || '格局';
  const yong = desk.yongJi.yongShen.join('、') || '用神';
  const ji = desk.yongJi.jiShen.join('、') || '忌神';
  const dayun = desk.dayun.current?.ganZhi || desk.suiyun.dayunGanZhi || '当前大运';
  const liunian = desk.liunian.currentGanZhi || desk.suiyun.liunianGanZhi || '流年';

  const career = desk.domains.find((d) => d.key === 'career');
  const marriage = desk.domains.find((d) => d.key === 'marriage');
  const health = desk.domains.find((d) => d.key === 'health');
  const wealth = desk.domains.find((d) => d.key === 'wealth');
  const careerMap = desk.domains.find((d) => d.key === 'career-map');

  const industryHint =
    careerMap?.specific?.find((s) => s.startsWith('主适'))?.replace(/^主适：/, '') ||
    desk.cosmos.industries[0]?.industry ||
    '与用神匹配的赛道';

  const opening = `${name}你好。我们不靠玄学吓人或空泛励志，而是用结构化命盘 + ${KNOWLEDGE_BASE.shortLabel} 做可执行判断。先讲清楚结构，再落到事业、关系、身体与近窗节奏。`;

  const scriptBeats = [
    {
      beat: '1. 结构定位（约 40 秒）',
      line: `${name}日主为${dm}，格局参考「${pattern}」。喜用侧重${yong}，需要防守的是${ji}。今天所有建议都围绕“顺着${yong}、避开${ji}”展开。`,
    },
    {
      beat: '2. 岁运与阶段（约 40 秒）',
      line: `当前大运 ${dayun}，流年 ${liunian}。${presentReportText(desk.suiyun.summary, 160) || '岁运交互决定了今年的进攻/防守姿态。'}节气处于${desk.cosmos.temporal.solarTerm}，宏观环境：${desk.cosmos.economicCycle?.label || '过渡段'}。`,
    },
    {
      beat: '3. 事业与行业（约 40 秒）',
      line: career
        ? `事业上：${presentReportText(career.general, 140)} 行业可优先对照「${industryHint}」。${career.timing ? `时机：${career.timing}` : ''}`
        : `事业宜按用神${yong}选赛道，行业周期里可关注 ${desk.cosmos.industries
            .slice(0, 2)
            .map((i) => i.industry)
            .join('、') || '综合赛道'}。`,
    },
    {
      beat: '4. 关系与婚配（约 30 秒）',
      line: marriage
        ? `关系上：${presentReportText(marriage.general, 120)}${marriage.timing ? ` 节奏：${marriage.timing}` : ''}`
        : '关系议题优先看沟通边界与人生阶段压力，而不是单看“合不合”。',
    },
    {
      beat: '5. 身体与节奏（约 20 秒）',
      line: health
        ? `身体节奏：${presentReportText(health.general, 100)} 这是生活节律建议，不构成医疗诊断。`
        : '身体上优先保证睡眠与压力管理，高负荷窗口不要硬推。',
    },
    {
      beat: '6. 收束行动（约 20 秒）',
      line: `近 30 天只抓两件事：顺着${yong}做一件可验证的小事；把${ji}相关的冲动决策按下。${desk.cosmos.human.relationshipFocus}`,
    },
  ];

  const clientPlain = [
    `【给 ${name} 的白话结论 · ${KNOWLEDGE_BASE.shortLabel}】`,
    ``,
    `1）你的结构关键词：日主${dm}，参考格局「${pattern}」，宜顺 ${yong}，慎 ${ji}。`,
    `2）当前阶段：大运 ${dayun} × 流年 ${liunian}；节气 ${desk.cosmos.temporal.solarTerm}。`,
    career ? `3）事业：${presentReportText(career.general, 160)}` : `3）事业：先选与 ${yong} 同向的岗位/项目。`,
    wealth ? `4）财富：${presentReportText(wealth.general, 120)}` : `4）财富：先现金流与技能变现，再谈扩张。`,
    marriage ? `5）关系：${presentReportText(marriage.general, 120)}` : `5）关系：先同步节奏与边界。`,
    health ? `6）身体：${presentReportText(health.general, 100)}（生活建议，非医疗结论）` : `6）身体：作息优先。`,
    `7）近窗：${desk.cosmos.domainTimeline[0] ? `${desk.cosmos.domainTimeline[0].year} 四维均分约 ${avg(desk.cosmos.domainTimeline[0])}` : '见报告近窗表'}。`,
    ``,
    `建议 30 天内完成 1 件可验证行动，再回来对照报告。`,
  ].join('\n');

  const proNotes = [
    `四柱：${desk.pillars.map((p) => p.ganZhi).join(' ')} · 空亡 ${desk.kongWang.join('') || '—'}`,
    `用忌：用 ${yong} / 喜 ${desk.yongJi.xiShen.join('、') || '—'} / 忌 ${ji}`,
    `岁运：${desk.suiyun.dayunGanZhi} × ${desk.suiyun.liunianGanZhi} · ${desk.suiyun.notes[0] || ''}`,
    `时空：${desk.cosmos.temporal.liuNian} · ${desk.cosmos.temporal.phaseLabel} · 来源 ${desk.cosmos.source}`,
    `天时地利人和：${desk.cosmos.stateVector.map((s) => `${s.label}${s.value || '—'}`).join(' / ')}`,
    career?.drivers?.length ? `事业驱动：${career.drivers.slice(0, 3).join('；')}` : '',
    marriage?.risks?.length ? `关系风险：${marriage.risks.slice(0, 2).join('；')}` : '',
    desk.boost.colors.length ? `增运色：${desk.boost.colors.join('、')}` : '',
  ].filter(Boolean);

  const objections = [
    {
      concern: '这是不是封建迷信？',
      reply: `我们把它当作结构化决策系统：把出生信息映射为可对照的节奏与偏好，再用 ${KNOWLEDGE_BASE.shortLabel} 对齐当代行业与生活场景。最终仍以你的现实反馈校准。`,
    },
    {
      concern: '为什么和别的师傅说法不一样？',
      reply: '差异通常来自排盘口径（真太阳时/节气）、用神取法与是否纳入大运流年。你可以要求对方给出“因为所以”的推演链，我们这页专业版就是按链展示的。',
    },
    {
      concern: '能不能保证发财/结婚？',
      reply: '不能、也不应保证。我们给的是概率与窗口管理：降低错误动作、提高正确动作的密度。具体医疗、法律、投资请咨询持证专业人士。',
    },
  ];

  const closingActions = [
    `写下一件 30 天内可完成、且顺着 ${yong} 的行动`,
    '把报告中的避险月标进日历',
    '30 天后带着结果回来做回访对照（预测/事件）',
  ];

  const disclaimer =
    '本交付仅供文化决策与自我管理参考，不构成医疗、法律或投资建议。专业版话术供从业者组织表达，案主决策仍以自身判断与持证顾问意见为准。';

  const copyAll = [
    opening,
    '',
    ...scriptBeats.map((b) => `${b.beat}\n${b.line}`),
    '',
    clientPlain,
    '',
    '【异议应答】',
    ...objections.map((o) => `Q: ${o.concern}\nA: ${o.reply}`),
    '',
    '【收束】',
    ...closingActions.map((a, i) => `${i + 1}. ${a}`),
    '',
    disclaimer,
    KNOWLEDGE_BASE.publicClaim,
  ].join('\n');

  return {
    opening,
    scriptBeats,
    clientPlain,
    proNotes,
    objections,
    closingActions,
    disclaimer,
    copyAll,
    knowledgeStamp: KNOWLEDGE_BASE.shortLabel,
  };
}

function avg(row: { career: number; wealth: number; marriage: number; health: number }) {
  return Math.round((row.career + row.wealth + row.marriage + row.health) / 4);
}
