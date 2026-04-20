import Database from 'better-sqlite3';
import path from 'path';
import { isLikelyRealUserReportName } from '../lib/report-sample-classifier';

type DemandPersona = {
  id: string;
  title: string;
  region: string;
  need: string;
  focusAreas: Array<'career' | 'wealth' | 'marriage' | 'health'>;
  needsTiming: boolean;
  needsRisk: boolean;
  overseasStyle: boolean;
};

type ExpertJudge = {
  id: string;
  label: string;
  evaluate: (report: LoadedReport) => { score: number; note: string };
};

type LoadedReport = {
  id: string;
  name: string;
  birthPlace: string;
  createdAt: string;
  llmUsed: boolean;
  deliveryTier: string;
  score: number;
  patternType: string;
  currentDaYun: string;
  currentLiuNian: string;
  summary: string;
  opening: string;
  explanation: string;
  advice: {
    career?: { specific?: string[]; timing?: string; avoid?: string[] };
    wealth?: { specific?: string[]; timing?: string; avoid?: string[] };
    marriage?: { specific?: string[]; timing?: string; avoid?: string[] };
    health?: { specific?: string[]; timing?: string; avoid?: string[] };
    yongShen?: string[];
    jiShen?: string[];
  };
};

type ReportSelectionMeta = {
  mode: 'fixed-default' | 'manual-ids' | 'recent-real';
  requestedCount: number;
  selectedCount: number;
  windowDays?: number;
  viewedFirst?: boolean;
};

const DEFAULT_REPORT_IDS = [
  'report_1774080788333_u5hmocpz7',
  'report_1774064077057_titsnot3j',
  'report_1774249832497_aztqslesx',
  'report_1774177658639_w0wtyb54k',
  'report_1774193441818_qranz4xn9',
  'report_1774169781233_mt0eiimd6',
  'report_1773777017437_3xcvankq5',
  'report_1773715911229_gq6d5z3dg',
];

const PERSONAS: DemandPersona[] = [
  { id: 'career-switch-cn', title: '大厂转型用户', region: '中国一线城市', need: '我现在该不该换工作', focusAreas: ['career', 'wealth'], needsTiming: true, needsRisk: true, overseasStyle: false },
  { id: 'startup-founder', title: '创业试错用户', region: '深圳 / 杭州', need: '我该不该继续压资源创业', focusAreas: ['career', 'wealth'], needsTiming: true, needsRisk: true, overseasStyle: false },
  { id: 'marriage-window', title: '婚恋窗口用户', region: '上海 / 成都', need: '我现在适不适合进入婚恋承诺', focusAreas: ['marriage'], needsTiming: true, needsRisk: true, overseasStyle: false },
  { id: 'health-burnout', title: '高压疲劳用户', region: '北京 / 广州', need: '我的状态会不会先垮在身体上', focusAreas: ['health'], needsTiming: false, needsRisk: true, overseasStyle: false },
  { id: 'wealth-allocation', title: '资产配置用户', region: '上海 / 香港', need: '我现在该进攻还是先保守', focusAreas: ['wealth'], needsTiming: true, needsRisk: true, overseasStyle: true },
  { id: 'student-exam', title: '升学考试用户', region: '中国新一线', need: '我这两年是否适合冲考试与证书', focusAreas: ['career'], needsTiming: true, needsRisk: false, overseasStyle: false },
  { id: 'relationship-repair', title: '关系修复用户', region: '北京 / 南京', need: '这段关系该修还是该放', focusAreas: ['marriage'], needsTiming: false, needsRisk: true, overseasStyle: false },
  { id: 'new-mother', title: '家庭节奏用户', region: '中国沿海城市', need: '家庭和个人节奏怎么排优先级', focusAreas: ['marriage', 'health'], needsTiming: false, needsRisk: true, overseasStyle: false },
  { id: 'immigration-us', title: '北美迁移用户', region: '美国 / 加拿大', need: '是否适合搬迁或留在海外', focusAreas: ['career', 'wealth'], needsTiming: true, needsRisk: true, overseasStyle: true },
  { id: 'immigration-au', title: '澳新定居用户', region: '澳洲 / 新西兰', need: '迁移后事业和家庭怎么取舍', focusAreas: ['career', 'marriage'], needsTiming: true, needsRisk: true, overseasStyle: true },
  { id: 'hk-finance', title: '香港金融从业者', region: '香港', need: '高波动阶段该不该加仓职业赌注', focusAreas: ['career', 'wealth'], needsTiming: true, needsRisk: true, overseasStyle: true },
  { id: 'singapore-manager', title: '新加坡管理层用户', region: '新加坡', need: '我该不该接更重的管理职责', focusAreas: ['career', 'health'], needsTiming: true, needsRisk: true, overseasStyle: true },
  { id: 'overseas-parent', title: '海外家长用户', region: '北美华人家庭', need: '孩子教育与家庭节奏如何排', focusAreas: ['marriage', 'health'], needsTiming: false, needsRisk: true, overseasStyle: true },
  { id: 'returnee-choice', title: '海归去留用户', region: '英国 / 美国海归', need: '该回国还是留海外继续布局', focusAreas: ['career', 'wealth'], needsTiming: true, needsRisk: true, overseasStyle: true },
  { id: 'creative-freelancer', title: '自由职业者', region: '温哥华 / 洛杉矶', need: '创作型职业今年该扩张还是收缩', focusAreas: ['career', 'wealth'], needsTiming: true, needsRisk: true, overseasStyle: true },
  { id: 'second-marriage', title: '再婚决策用户', region: '海外华人社区', need: '再进入婚姻前最该防什么', focusAreas: ['marriage', 'wealth'], needsTiming: false, needsRisk: true, overseasStyle: true },
  { id: 'midlife-reset', title: '中年重启用户', region: '国内 / 海外混合', need: '40岁后重启该从哪里下手', focusAreas: ['career', 'health'], needsTiming: true, needsRisk: true, overseasStyle: true },
  { id: 'family-business', title: '家族生意用户', region: '东南亚华人', need: '家族事业和个人独立怎么平衡', focusAreas: ['career', 'wealth', 'marriage'], needsTiming: true, needsRisk: true, overseasStyle: true },
  { id: 'property-decision', title: '买房置业用户', region: '北上深 / 海外置业', need: '今年适不适合做重资产决策', focusAreas: ['wealth'], needsTiming: true, needsRisk: true, overseasStyle: true },
  { id: 'eldercare-pressure', title: '养老照护用户', region: '海外独生子女家庭', need: '事业和家庭照护冲突怎么排', focusAreas: ['career', 'health', 'marriage'], needsTiming: false, needsRisk: true, overseasStyle: true },
];

const BANNED_TERMS = [
  'macro_cycle',
  'solar_terms',
  'geography',
  'industry_cycle',
  '解释增强即可',
  '格局清正',
  '富贵之命',
];

const SECTION_LABELS = ['主判断：', '判断依据：', '现在先做：', '风险提醒：'];

const EXPERT_JUDGES: ExpertJudge[] = [
  {
    id: 'ziping-structure',
    label: '子平格局派',
    evaluate: (report) => {
      const hasPattern = Boolean(report.patternType);
      const hasYongJi = (report.advice.yongShen || []).length > 0 && (report.advice.jiShen || []).length > 0;
      const score = clamp(1 + Number(hasPattern) * 2 + Number(hasYongJi) * 2, 1, 5);
      return { score, note: hasPattern && hasYongJi ? '格局与用忌主线明确。' : '格局或用忌主线仍偏弱。' };
    },
  },
  {
    id: 'timing-flow',
    label: '大运流年派',
    evaluate: (report) => {
      const hasFlow = Boolean(report.currentDaYun) && Boolean(report.currentLiuNian);
      const hasTiming = hasTimingSignal(report);
      const score = clamp(1 + Number(hasFlow) * 2 + Number(hasTiming) * 2, 1, 5);
      return { score, note: hasTiming ? '时间窗口可用于决策排序。' : '时机感还不够前置。' };
    },
  },
  {
    id: 'practical-advisor',
    label: '实务决策派',
    evaluate: (report) => {
      const actions = collectSpecificAdvice(report, ['career', 'wealth', 'marriage', 'health']).length;
      const risks = collectAvoidAdvice(report, ['career', 'wealth', 'marriage', 'health']).length;
      const score = clamp(1 + Number(actions >= 2) * 2 + Number(risks >= 1) * 2, 1, 5);
      return { score, note: actions >= 2 && risks >= 1 ? '动作与避坑都比较明确。' : '动作或风险还不够落地。' };
    },
  },
  {
    id: 'language-discipline',
    label: '文本洁净派',
    evaluate: (report) => {
      const clean = !hasBannedTerms(report) && !hasDuplicateYearRange(report.explanation);
      const hasSections = hasStructuredSections(report.explanation);
      const score = clamp(1 + Number(clean) * 2 + Number(hasSections) * 2, 1, 5);
      return { score, note: clean ? '没有明显工程痕迹和坏窗口。' : '仍有模板痕迹或异常词。' };
    },
  },
  {
    id: 'overseas-editor',
    label: '海外华人编辑',
    evaluate: (report) => {
      const concise = report.summary.length > 0 && report.summary.length <= 60;
      const direct = hasStructuredSections(report.explanation);
      const score = clamp(1 + Number(concise) * 2 + Number(direct) * 2, 1, 5);
      return { score, note: concise && direct ? '第一屏就能抓到结论。' : '还需要用户自己从长文里找重点。' };
    },
  },
];

function main() {
  const args = process.argv.slice(2);
  const jsonOnly = args.includes('--json');
  const reportIds = args.filter((arg) => !arg.startsWith('--'));
  const db = new Database(path.resolve(process.cwd(), 'data/lifekline.db'), { readonly: true });
  const selection = resolveSelection(args, reportIds, db);
  const targetIds = selection.ids;
  const reports = loadReports(db, targetIds);

  const output = {
    generatedAt: new Date().toISOString(),
    personaCount: PERSONAS.length,
    expertJudgeCount: EXPERT_JUDGES.length,
    selection: selection.meta,
    reports: reports.map((report) => evaluateReport(report)),
  };

  if (jsonOnly) {
    console.log(JSON.stringify(output, null, 2));
    return;
  }

  console.log(renderText(output));
}

function resolveSelection(
  args: string[],
  reportIds: string[],
  db: InstanceType<typeof Database>
) {
  const recentRealRaw = readFlagValue(args, '--recent-real');
  if (recentRealRaw !== null) {
    const requestedCount = clampPositiveInt(recentRealRaw, 8);
    const windowDays = clampPositiveInt(readFlagValue(args, '--window-days'), 30);
    const ids = selectRecentRealReportIds(db, {
      limit: requestedCount,
      windowDays,
    });
    return {
      ids,
      meta: {
        mode: 'recent-real' as const,
        requestedCount,
        selectedCount: ids.length,
        windowDays,
        viewedFirst: true,
      },
    };
  }

  if (reportIds.length > 0) {
    return {
      ids: reportIds,
      meta: {
        mode: 'manual-ids' as const,
        requestedCount: reportIds.length,
        selectedCount: reportIds.length,
      },
    };
  }

  return {
    ids: DEFAULT_REPORT_IDS,
    meta: {
      mode: 'fixed-default' as const,
      requestedCount: DEFAULT_REPORT_IDS.length,
      selectedCount: DEFAULT_REPORT_IDS.length,
    },
  };
}

function selectRecentRealReportIds(
  db: InstanceType<typeof Database>,
  params: {
    limit: number;
    windowDays: number;
  }
) {
  const rows = db.prepare(`
    SELECT
      f.id,
      f.name,
      f.created_at,
      EXISTS(
        SELECT 1
        FROM analytics_events a
        WHERE a.event_name = 'report_viewed'
          AND json_extract(a.meta, '$.reportId') = f.id
      ) AS viewed
    FROM fortunes f
    WHERE datetime(f.created_at) >= datetime('now', ?)
    ORDER BY viewed DESC, datetime(f.created_at) DESC
    LIMIT 200
  `).all(`-${params.windowDays} days`) as Array<{
    id: string;
    name: string;
    created_at: string;
    viewed: number;
  }>;

  return rows
    .filter((row) => isLikelyRealUserReportName(row.name))
    .slice(0, params.limit)
    .map((row) => row.id);
}

function readFlagValue(args: string[], flag: string) {
  const exactIndex = args.indexOf(flag);
  if (exactIndex >= 0) {
    const next = args[exactIndex + 1];
    if (!next || next.startsWith('--')) {
      return '';
    }
    return next;
  }

  const matched = args.find((arg) => arg.startsWith(`${flag}=`));
  if (!matched) {
    return null;
  }

  return matched.slice(flag.length + 1);
}

function clampPositiveInt(value: string | null, fallback: number) {
  const parsed = Number.parseInt(`${value || ''}`, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return parsed;
}

function loadReports(db: InstanceType<typeof Database>, ids: string[]) {
  const stmt = db.prepare(`
    SELECT id, name, birth_place, created_at, advice, analysis, pattern, fortune
    FROM fortunes
    WHERE id = ?
  `);

  return ids
    .map((id) => {
      const row = stmt.get(id) as {
        id: string;
        name: string;
        birth_place?: string | null;
        created_at: string;
        advice?: string | null;
        analysis?: string | null;
        pattern?: string | null;
        fortune?: string | null;
      } | undefined;
      if (!row) return null;

      const advice = safeJson(row.advice) as LoadedReport['advice'];
      const analysis = safeJson(row.analysis) as Record<string, unknown>;
      const pattern = safeJson(row.pattern) as Record<string, unknown>;
      const fortune = safeJson(row.fortune) as Record<string, unknown>;
      const qualityAudit = (analysis.qualityAudit || {}) as Record<string, unknown>;

      return {
        id: row.id,
        name: row.name,
        birthPlace: `${row.birth_place || ''}`.trim(),
        createdAt: row.created_at,
        llmUsed: analysis.llmUsed === true,
        deliveryTier: `${qualityAudit.deliveryTier || ''}` || 'basic',
        score: Number(qualityAudit.overallScore || 0),
        patternType: `${pattern.type || ''}`.trim(),
        currentDaYun: `${fortune.currentDaYun || ''}`.trim(),
        currentLiuNian: `${fortune.currentLiuNian || ''}`.trim(),
        summary: `${analysis.summary || ''}`.trim(),
        opening: `${analysis.opening || ''}`.trim(),
        explanation: `${analysis.explanation || ''}`.trim(),
        advice,
      } satisfies LoadedReport;
    })
    .filter((item): item is LoadedReport => !!item);
}

function evaluateReport(report: LoadedReport) {
  const personaScores = PERSONAS.map((persona) => {
    const adviceCoverage = collectSpecificAdvice(report, persona.focusAreas).length;
    const riskCoverage = collectAvoidAdvice(report, persona.focusAreas).length;
    let score = 1;

    if (report.summary.length > 0) score += 1;
    if (hasStructuredSections(report.explanation)) score += 1;
    if (adviceCoverage > 0) score += 1;
    if (!persona.needsTiming || hasTimingSignal(report, persona.focusAreas)) score += 1;
    if (!persona.needsRisk || riskCoverage > 0 || report.explanation.includes('风险提醒：')) score += 1;
    if (persona.overseasStyle && hasBannedTerms(report)) score -= 1;

    const finalScore = clamp(score, 1, 5);
    return {
      id: persona.id,
      title: persona.title,
      region: persona.region,
      need: persona.need,
      score: finalScore,
      note: buildPersonaNote(persona, report, adviceCoverage, riskCoverage),
    };
  });

  const expertScores = EXPERT_JUDGES.map((judge) => ({
    id: judge.id,
    label: judge.label,
    ...judge.evaluate(report),
  }));

  const personaAverage = average(personaScores.map((item) => item.score));
  const expertAverage = average(expertScores.map((item) => item.score));
  const weakPersonas = personaScores
    .filter((item) => item.score <= 3)
    .sort((left, right) => left.score - right.score)
    .slice(0, 4);

  return {
    id: report.id,
    name: report.name,
    birthPlace: report.birthPlace,
    createdAt: report.createdAt,
    deliveryTier: report.deliveryTier,
    llmUsed: report.llmUsed,
    score: report.score,
    summary: report.summary,
    personaAverage,
    expertAverage,
    blocked: {
      hasBannedTerms: hasBannedTerms(report),
      hasDuplicateYearRange: hasDuplicateYearRange(report.explanation),
      hasStructuredSections: hasStructuredSections(report.explanation),
      missingSummary: report.summary.length === 0,
    },
    weakPersonas,
    expertScores,
  };
}

function buildPersonaNote(
  persona: DemandPersona,
  report: LoadedReport,
  adviceCoverage: number,
  riskCoverage: number
) {
  if (report.summary.length === 0) {
    return '第一眼没有拿到结论。';
  }
  if (!hasStructuredSections(report.explanation)) {
    return '正文还不是决策结构，用户需要自己提炼重点。';
  }
  if (adviceCoverage === 0) {
    return '对该画像最关心的场景没有给出具体动作。';
  }
  if (persona.needsRisk && riskCoverage === 0) {
    return '动作有了，但没有明确告诉用户先别做什么。';
  }
  if (persona.needsTiming && !hasTimingSignal(report, persona.focusAreas)) {
    return '方向基本有，但时机窗口还不够明确。';
  }
  if (persona.overseasStyle && hasBannedTerms(report)) {
    return '结论可读，但工程痕迹会明显破坏信任。';
  }
  return '主判断、动作和风险基本能覆盖这个画像的核心需求。';
}

function collectSpecificAdvice(
  report: LoadedReport,
  focusAreas: Array<'career' | 'wealth' | 'marriage' | 'health'>
) {
  return focusAreas.flatMap((area) => report.advice[area]?.specific || []).filter(Boolean);
}

function collectAvoidAdvice(
  report: LoadedReport,
  focusAreas: Array<'career' | 'wealth' | 'marriage' | 'health'>
) {
  return focusAreas.flatMap((area) => report.advice[area]?.avoid || []).filter(Boolean);
}

function hasStructuredSections(explanation: string) {
  return SECTION_LABELS.every((label) => explanation.includes(label));
}

function hasTimingSignal(
  report: LoadedReport,
  focusAreas: Array<'career' | 'wealth' | 'marriage' | 'health'> = ['career', 'wealth', 'marriage', 'health']
) {
  if (report.currentDaYun || report.currentLiuNian) {
    return true;
  }

  return focusAreas.some((area) => Boolean(report.advice[area]?.timing));
}

function hasBannedTerms(report: LoadedReport) {
  const combined = `${report.summary} ${report.opening} ${report.explanation}`;
  return BANNED_TERMS.some((term) => combined.includes(term));
}

function hasDuplicateYearRange(value: string) {
  return /(\d{4})-\1/.test(value);
}

function safeJson(value?: string | null) {
  if (!value) return {};
  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
}

function average(values: number[]) {
  if (values.length === 0) return 0;
  return Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 100) / 100;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function renderText(payload: {
  generatedAt: string;
  personaCount: number;
  expertJudgeCount: number;
  selection: ReportSelectionMeta;
  reports: Array<ReturnType<typeof evaluateReport>>;
}) {
  const lines: string[] = [];
  lines.push('# Report Demand Eval');
  lines.push('');
  lines.push(`- generatedAt: ${payload.generatedAt}`);
  lines.push(`- personaCount: ${payload.personaCount}`);
  lines.push(`- expertJudgeCount: ${payload.expertJudgeCount}`);
  lines.push(`- selection.mode: ${payload.selection.mode}`);
  lines.push(`- selection.requestedCount: ${payload.selection.requestedCount}`);
  lines.push(`- selection.selectedCount: ${payload.selection.selectedCount}`);
  if (payload.selection.windowDays) {
    lines.push(`- selection.windowDays: ${payload.selection.windowDays}`);
  }
  lines.push('');

  for (const report of payload.reports) {
    lines.push(`## ${report.name} | ${report.id}`);
    lines.push(`- deliveryTier: ${report.deliveryTier} | llmUsed=${report.llmUsed ? '1' : '0'} | qualityScore=${report.score}`);
    lines.push(`- personaAverage: ${report.personaAverage}`);
    lines.push(`- expertAverage: ${report.expertAverage}`);
    lines.push(`- blocked: summary=${report.blocked.missingSummary ? 'missing' : 'ok'} sections=${report.blocked.hasStructuredSections ? 'ok' : 'missing'} banned=${report.blocked.hasBannedTerms ? 'yes' : 'no'} dupYear=${report.blocked.hasDuplicateYearRange ? 'yes' : 'no'}`);
    lines.push(`- summary: ${report.summary || 'N/A'}`);
    lines.push('- weakPersonas:');
    for (const persona of report.weakPersonas) {
      lines.push(`  - ${persona.title}(${persona.score}): ${persona.note}`);
    }
    lines.push('- expertPanel:');
    for (const judge of report.expertScores) {
      lines.push(`  - ${judge.label}(${judge.score}): ${judge.note}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

main();
