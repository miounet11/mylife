import type { DimensionAdvisorInput, DimensionReport } from './types';
import { buildDimensionEnginePack } from './engine-pack';
import { rankIndustriesForElements } from './data/industries';
import {
  buildPrediction,
  clampConfidence,
  findKlinePoint,
  formatDateOffset,
  formatWuxingList,
  normalizeWuxingList,
  section,
} from './shared';

function roleAdvice(favorable: string[]): string[] {
  const tips: string[] = [];
  if (favorable.includes('木')) tips.push('策划、教育、增长类岗位更容易发挥「生发」结构优势。');
  if (favorable.includes('火')) tips.push('需要曝光、谈判、带团队的岗位更利于突破天花板。');
  if (favorable.includes('土')) tips.push('项目统筹、运营落地、资源整合类岗位匹配度更高。');
  if (favorable.includes('金')) tips.push('规则、风控、标准制定、质量体系类岗位匹配度较高。');
  if (favorable.includes('水')) tips.push('研究、数据、跨境、流动连接类岗位更易形成复利。');
  if (!tips.length) {
    tips.push('执行、交付、流程类岗位更容易积累确定性成果。');
    tips.push('先做深专业纵深，再考虑管理扩张。');
  }
  if (tips.length < 3) {
    tips.push('跳槽优先验证「可迁移成果 + 行业匹配」，而不是只看薪资涨幅。');
  }
  return tips.slice(0, 3);
}

export function buildCareerIndustryReport(input: DimensionAdvisorInput): DimensionReport {
  const pack = buildDimensionEnginePack(input);
  const { truthInput, birthSignature } = pack;
  const reportId = input.reportId || `dimension_career_${birthSignature}_${Date.now()}`;
  const yongShen = truthInput.yongShen;
  const favorable = normalizeWuxingList([...(yongShen?.yongShen || []), ...(yongShen?.xiShen || [])]);
  const unfavorable = normalizeWuxingList(yongShen?.jiShen || []);
  const { fit, avoid } = rankIndustriesForElements(favorable, unfavorable, { limit: 4, avoidLimit: 3 });

  const dayun = truthInput.dayun;
  const currentYear = new Date().getFullYear();
  const activeDayun =
    dayun?.currentDayun ||
    dayun?.dayunList?.find((item) => currentYear >= item.startYear && currentYear <= item.endYear);
  const careerPoint = findKlinePoint(truthInput.kline || [], currentYear);
  const careerScore = careerPoint?.career ?? 50;
  const confidenceBase = yongShen?.confidence?.score ? yongShen.confidence.score / 100 : 0.74;

  const switchReady = careerScore >= 58;
  const holdMode = careerScore <= 48;

  const sections = [
    section('core', '核心结论', [
      yongShen
        ? `日主${yongShen.dayMaster}（${yongShen.dayMasterElement}），用神偏${formatWuxingList(favorable)}，事业策略宜「补强项、避忌神行业」。`
        : '用神信息不足，以下行业建议基于五行分布基础推断。',
      `当前事业线评分约 ${Math.round(careerScore)} 分：${
        switchReady
          ? '窗口偏「可推进转换/升级」'
          : holdMode
            ? '窗口偏「守成验证，忌赌气离职」'
            : '窗口偏「小步切换，边做边验证」'
      }。`,
    ], 'positive'),
    section(
      'fit',
      '更适配行业 Top',
      fit.map(
        (item, index) =>
          `${index + 1}. ${item.name}（${item.element} · 匹配${item.score}）：适合 ${item.roles.join('、')}；依据：${item.reasons.slice(0, 2).join('；')}`,
      ),
      'positive',
    ),
    section(
      'avoid',
      '暂不建议主攻行业',
      avoid.map(
        (item) =>
          `${item.name}（${item.element}）：${item.reasons[0] || '与忌神更近'}；若已在该行业，宜做角色微调而非硬切换`,
      ),
      'warning',
    ),
    section('roles', '岗位类型建议', roleAdvice(favorable)),
    section('windows', '转换窗口', [
      activeDayun
        ? `当前大运 ${activeDayun.ganZhi || ''}（${activeDayun.startYear}-${activeDayun.endYear}）：${activeDayun.description || '宜在本运内完成一次职业定位校准。'}`
        : '大运信息有限，建议结合完整报告判断转换窗口。',
      switchReady
        ? '近 6-12 个月可推进「用神行业 + 可验证成果」的升级/转岗，但保持可逆路径。'
        : '近 6 个月优先在现有岗位做出可展示成果，再谈切换，降低切换成本。',
      holdMode
        ? '事业线偏弱阶段，避免赌气式裸辞；先完成现金流与能力备份。'
        : '若当前岗位与忌神行业重叠，可用「岗位内微调」过渡。',
    ]),
    section('evidence', '引擎证据', [
      yongShen
        ? `用神 ${formatWuxingList(yongShen.yongShen, '—')} / 喜神 ${formatWuxingList(yongShen.xiShen, '—')} / 忌神 ${formatWuxingList(yongShen.jiShen, '—')}；格局 ${yongShen.pattern?.pattern || '正格'}。`
        : '用神未完整解析，行业排序以降权兜底。',
      `事业线 ${currentYear} 年评分 ${Math.round(careerScore)}；匹配行业数 ${fit.length}，回避行业数 ${avoid.length}。`,
      yongShen?.confidence?.boundary ? `可信度边界：${yongShen.confidence.boundary}` : '出生时辰越完整，行业匹配置信度越高。',
    ], 'muted'),
    section('risks', '风险提醒', [
      '行业建议基于五行映射与用神匹配，不替代你的技能栈与市场机会评估。',
      '避免在运势低点窗口做「赌气式离职」，先完成现金流与能力备份。',
      '转岗成功标准：3 个月内能否交付 1 个可展示成果，而不是头衔变化本身。',
    ], 'muted'),
  ];

  const top = fit[0];
  const predictions = [
    buildPrediction(reportId, birthSignature, 'c1', {
      category: 'career',
      statement: top
        ? `未来6个月在「${top.name}」相关方向更易出现可验证突破（匹配分${top.score}）`
        : '未来6个月适合完成一次职业定位复盘',
      dueDate: formatDateOffset(180),
      confidence: clampConfidence(confidenceBase + 0.03),
      evidence: top
        ? `工作行业 · 用神匹配 ${top.name}（${top.element}）`
        : '工作行业 · 定位复盘窗口',
      window: '未来6个月',
      verifyChecklist: ['是否有新项目/新职责机会？', '成果是否可量化？', '是否贴近用神行业？'],
    }),
    buildPrediction(reportId, birthSignature, 'c2', {
      category: 'career',
      statement: switchReady
        ? `未来12个月内适合完成一次岗位或行业赛道的「小步切换」验证（事业线约${Math.round(careerScore)}分）`
        : `未来12个月内优先把现有岗位成果做厚，再评估切换（事业线约${Math.round(careerScore)}分）`,
      dueDate: formatDateOffset(365),
      confidence: clampConfidence(confidenceBase),
      evidence: `工作行业 · 事业线 ${Math.round(careerScore)} + 转换窗口`,
      window: '未来12个月',
      verifyChecklist: ['是否完成一次可展示的成果？', '切换成本是否可控？'],
    }),
    buildPrediction(reportId, birthSignature, 'c3', {
      category: 'career',
      statement: avoid[0]
        ? `未来90天在「${avoid[0].name}」方向宜守成，不宜高杠杆扩张`
        : '未来90天宜先稳住当前岗位基本盘',
      dueDate: formatDateOffset(90),
      confidence: clampConfidence(confidenceBase - 0.02),
      evidence: avoid[0]
        ? `工作行业 · 忌神提醒 ${avoid[0].name}`
        : '工作行业 · 90天守成窗口',
      window: '未来90天',
      verifyChecklist: ['是否避免了冲动决策？', '核心指标是否稳定？'],
    }),
  ];

  return {
    slug: 'career-industry',
    title: '工作行业研判',
    question: '我适合什么行业/岗位？什么时候适合跳槽？',
    generatedAt: new Date().toISOString(),
    birthSignature,
    sections,
    predictions,
    disclaimers: ['行业建议用于方向筛选，不构成就业或执业承诺。'],
    meta: {
      pattern: truthInput.pattern || yongShen?.pattern?.pattern || '正格',
      careerScore: Math.round(careerScore),
      topIndustry: top?.name || '',
      priority: 'p0',
    },
  };
}
