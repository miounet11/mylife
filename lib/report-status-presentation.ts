/**
 * 用户向「报告状态」视图模型。
 *
 * 内部 qualityAudit / verify / upgradeJob 是工程信号；这里收敛成：
 * 1 条主结论 + 可信点 + 留意点 + 1 个主动作 + 可选进度。
 * 禁止再向用户并列输出互相打架的多套状态文案。
 *
 * Optional `locale`: if it starts with `en`, user-facing strings are English;
 * otherwise Simplified Chinese (zh-Hant stays zh-CN for this wave).
 */

export type UserReportReadiness = 'ready' | 'usable' | 'draft';

export type UserReportProgressState = 'none' | 'running' | 'queued' | 'done' | 'paused';

export type UserReportPrimaryActionKind =
  | 'none'
  | 'upgrade_now'
  | 'upgrade_queue'
  | 'reanalyze'
  | 'read_main';

export interface UserFacingReportStatus {
  readiness: UserReportReadiness;
  /** 徽章短文案，如「可直接用」 */
  badge: string;
  /** 主标题，一句说清能不能用 */
  title: string;
  /** 主说明，最多 2 句 */
  summary: string;
  /** 版本档位（用户友好，非 basic/simple） */
  editionLabel: string;
  /** 综合可信度 0–100，可选展示 */
  confidenceScore: number | null;
  /** 最多 3 条「可以信」 */
  trustPoints: string[];
  /** 最多 2 条「需要留意」 */
  cautionPoints: string[];
  /** 后台深化进度（单条） */
  progress: {
    state: UserReportProgressState;
    label: string;
    detail?: string;
  };
  primaryAction: {
    kind: UserReportPrimaryActionKind;
    label: string;
  };
  /** 折叠「明细」用，默认不对用户展开 */
  details: Array<{ label: string; value: string }>;
}

type VerifyVerdict = 'PASS' | 'WARN' | 'FAIL';

type QualityDimension = {
  key?: string;
  label?: string;
  score?: number;
  detail?: string;
};

type QualityAuditLike = {
  overallScore?: number;
  grade?: string;
  status?: 'ready' | 'watch' | 'retry';
  deliveryTier?: 'basic' | 'enhanced' | 'expert';
  targetAchieved?: boolean;
  summary?: string;
  dimensions?: QualityDimension[];
  strengths?: string[];
  concerns?: string[];
  blockingIssues?: string[];
  recommendedActions?: string[];
  nextActionLabel?: string;
};

type UpgradeJobLike = {
  status?: 'pending' | 'running' | 'retry' | 'completed' | 'failed' | 'cancelled';
  attempts?: number;
  maxAttempts?: number;
  lastError?: string;
  meta?: {
    strategy?: 'immediate' | 'queue' | 'defer';
    [key: string]: unknown;
  };
};

type OrchestrationLike = {
  successRate?: number;
  totalLlmCalls?: number;
  mode?: string;
  agentSources?: Record<string, string>;
  succeeded?: string[];
  failed?: string[];
};

type StatusLang = 'zh' | 'en';

type StatusCopy = ReturnType<typeof statusCopy>;

/** True when UI locale should use English status strings. */
export function isEnglishStatusLocale(locale?: string | null): boolean {
  const v = `${locale || ''}`.trim().toLowerCase().replace(/_/g, '-');
  return v === 'en' || v.startsWith('en-');
}

function statusLang(locale?: string | null): StatusLang {
  return isEnglishStatusLocale(locale) ? 'en' : 'zh';
}

function statusCopy(lang: StatusLang) {
  if (lang === 'en') {
    return {
      badgeReady: 'Ready to use',
      titleReady: 'This report is ready as your current-stage reading baseline',
      summaryReady:
        'Chart structure, narrative, and internal checks are aligned. Treat core conclusions and the timing map as a decision baseline, then log real events for calibration as needed.',

      badgeDraft: 'Draft reference',
      titleDraft: 'This version is best treated as a draft reference',
      summaryDraft:
        'The base chart may exist, but key enrichment or checks are incomplete. Use structural direction first; do not treat short windows or fine-grained advice as final.',

      badgeStructureUsable: 'Structure ready',
      titleStructureUsable: 'Main structure is readable; multi-dimension depth and alignment checks are incomplete',
      summaryStructureUsable:
        'Four Pillars / Dayun / body text are formed—start with core conclusions. Multi-expert supplements are fallbacks; short-term timing and industry/geo alignment did not pass internal checks—treat those conservatively without discarding the whole chart.',

      badgeNeedsReview: 'Needs review',
      titleNeedsReview: 'Report is usable, but internal alignment did not pass',
      summaryNeedsReview:
        'Body and base content remain readable. Some judgments are misaligned; treat short windows and strategy tips as observations and prefer stable structural conclusions.',

      badgeReviewSuggested: 'Review suggested',
      titleReviewSuggested: 'Generally usable; some window tips need real-world checks',
      summaryReviewSuggested:
        'Core judgment is stable, with observation-level consistency notes. Separating long-term structure from short-term timing is safer when reading.',

      badgeUsable: 'Usable',
      titleUsable: 'This report is ready for normal reading',
      summaryUsableLlm: (edition: string) =>
        `Currently ${edition}. Core conclusions and advice are readable. Continue refining multi-dimension depth when convenient.`,
      summaryUsableBase: (edition: string) =>
        `Currently ${edition}. Main structure is in place; narrative depth can still be improved.`,

      trustEngine: 'Chart base is complete (pillars, elements, luck structure)',
      trustLlm: 'Narrative enhancement is done and readable',
      trustCoverage: 'Advice, windows, and trends are well covered',
      trustAgentic: 'Multi-dimension supplements and internal checks are aligned',
      trustConsistency: 'Internal consistency check passed',

      cautionMultiAgent: 'Multi-expert supplements did not fully run; related details may be template-like',
      cautionFail: 'Short-term timing, industry, and geo alignment did not pass—do not treat as hard conclusions',
      cautionWarn: 'Consistency is observation-level; validate window tips in small steps',
      cautionEvidenceThin: 'Some calculation steps still lack firm evidence or action items',
      cautionTemplate: 'Narrative still has template-like traces—prefer structural conclusions while reading',

      progressRunning: 'The system is improving this report',
      progressRunningDetail: 'You can read the current version first; it will update when complete.',
      progressQueued: 'Queued for improvement',
      progressQueuedDetail: 'It will continue automatically when its turn comes—no need to resubmit.',
      progressDone: 'Automatic improvement finished',
      progressDoneDetail: 'This is the version after the improvement flow ended.',
      progressPaused: 'Automatic improvement paused',
      pauseLlmUnavailable:
        'Enhancement service is temporarily unavailable; the current readable content is kept. Try “Continue improving” later.',
      pauseTargetNotReached:
        'Multiple deepen attempts still fell short of a higher delivery bar; the readable version is kept. Main structure remains readable.',
      pauseDefault:
        'Current readable content is kept. If the main conclusions are enough, read them; otherwise tap “Continue improving” later.',

      actionReadMain: 'Back to report body',
      actionInProgress: 'Improvement in progress',
      actionReanalyze: 'Recheck birth info and reanalyze',
      actionNone: 'No action needed',
      actionUpgrade: 'Continue improving this report',

      editionExpert: 'Full',
      editionEnhanced: 'Deep',
      editionStandard: 'Standard',
      editionBasic: 'Basic',

      verdictPass: 'Pass',
      verdictWarn: 'Watch',
      verdictFail: 'Fail',
      verdictNone: 'Not checked',

      detailOverall: 'Overall score',
      detailEngine: 'Chart base',
      detailLlm: 'Narrative completeness',
      detailAgentic: 'Multi-dimension supplements',
      detailAgenticFallback: 'Incomplete (rule fallback)',
      detailConsistency: 'Internal alignment check',
      detailCoverage: 'Content coverage',
    } as const;
  }

  return {
    badgeReady: '可直接用',
    titleReady: '这份报告可以直接作为当前阶段的阅读参考',
    summaryReady:
      '命盘结构、正文与内部检查整体对齐。你可以把主结论和时间地图当作决策基线，再按需记录真实事件做校准。',

    badgeDraft: '参考草稿',
    titleDraft: '当前版本更适合当作参考草稿',
    summaryDraft:
      '基础命盘可能已生成，但关键深化或检查未完成。请先看结构大方向，不要把短期窗口或细项建议当成最终结论。',

    badgeStructureUsable: '结构可用',
    titleStructureUsable: '主结构可读，多维深化与对齐检查尚未完成',
    summaryStructureUsable:
      '四柱/大运/正文已经成型，可以先读核心结论。多维专家补充目前是回退结果，短期时机与行业/地理对齐未通过内部检查——这些部分请保守参考，不必因此否定整份命盘。',

    badgeNeedsReview: '需复核',
    titleNeedsReview: '报告可用，但内部对齐检查未通过',
    summaryNeedsReview:
      '正文与底座内容仍可阅读。系统检测到部分判断之间未对齐，短期窗口与策略建议请当作观察项，优先相信稳定结构结论。',

    badgeReviewSuggested: '建议复核',
    titleReviewSuggested: '整体可用，部分窗口建议需结合现实复核',
    summaryReviewSuggested:
      '主判断稳定，但有观察级的一致性提示。阅读时把「长期结构」和「短期时机」分开看会更稳妥。',

    badgeUsable: '可用',
    titleUsable: '这份报告可以正常阅读使用',
    summaryUsableLlm: (edition: string) =>
      `当前为${edition}，主结论与建议已可阅读。若你需要更细的多维补充，可在方便时继续完善。`,
    summaryUsableBase: (edition: string) =>
      `当前为${edition}。主结构已给出；正文深度仍可继续完善。`,

    trustEngine: '命盘底座完整（四柱、五行、运势结构）',
    trustLlm: '正文已完成增强，解释可读',
    trustCoverage: '建议、窗口与趋势覆盖较全',
    trustAgentic: '多维补充与内部检查已对齐',
    trustConsistency: '内部一致性检查通过',

    cautionMultiAgent: '多维专家补充未真正完成，相关细项可能偏模板化',
    cautionFail: '短期时机、行业与地理等对齐检查未通过，勿当作硬结论',
    cautionWarn: '一致性处于观察级，窗口建议宜小步验证',
    cautionEvidenceThin: '部分测算环节的依据或行动项仍偏薄',
    cautionTemplate: '正文仍有模板化痕迹，阅读时以结构结论为准',

    progressRunning: '系统正在完善这份报告',
    progressRunningDetail: '你可以先阅读当前版本，完成后会自动更新。',
    progressQueued: '已排队等待完善',
    progressQueuedDetail: '轮到时会自动继续，无需反复提交。',
    progressDone: '自动完善已结束',
    progressDoneDetail: '当前为完善流程结束后的版本。',
    progressPaused: '自动完善已暂停',
    pauseLlmUnavailable: '增强服务暂时不可用，已保留当前可读内容。可稍后再试「继续完善」。',
    pauseTargetNotReached: '已多次尝试深化，仍未达到更高交付标准；当前可读版本已保留。主结构仍可阅读。',
    pauseDefault: '已保留当前可读内容。若主结论已够用，可直接阅读；需要时再点「继续完善」。',

    actionReadMain: '回到报告正文',
    actionInProgress: '完善进行中',
    actionReanalyze: '核对出生信息后重新测算',
    actionNone: '无需操作',
    actionUpgrade: '继续完善这份报告',

    editionExpert: '完整版',
    editionEnhanced: '深度版',
    editionStandard: '标准版',
    editionBasic: '基础版',

    verdictPass: '通过',
    verdictWarn: '观察',
    verdictFail: '未通过',
    verdictNone: '未检查',

    detailOverall: '综合评分',
    detailEngine: '命盘底座',
    detailLlm: '正文完整度',
    detailAgentic: '多维补充',
    detailAgenticFallback: '未完成（规则回退）',
    detailConsistency: '内部对齐检查',
    detailCoverage: '内容覆盖',
  } as const;
}

export function buildUserFacingReportStatus(input: {
  llmUsed?: boolean;
  agenticUsed?: boolean;
  consistencyScore?: number;
  verifyVerdict?: VerifyVerdict;
  qualityAudit?: QualityAuditLike | null;
  upgradeJob?: UpgradeJobLike | null;
  generatedFrom?: string;
  orchestration?: OrchestrationLike | null;
  canManage?: boolean;
  /** UI locale; `en*` → English labels, else Chinese */
  locale?: string | null;
}): UserFacingReportStatus {
  const lang = statusLang(input.locale);
  const c = statusCopy(lang);

  const audit = input.qualityAudit || {};
  const dimensions = Array.isArray(audit.dimensions) ? audit.dimensions : [];
  const dim = (key: string) => dimensions.find((d) => d.key === key);

  const engineScore = num(dim('engine')?.score);
  const llmScore = num(dim('llm')?.score);
  const agenticScore = num(dim('agentic')?.score);
  const consistencyScore =
    num(input.consistencyScore) ?? num(dim('consistency')?.score);
  const completenessScore = num(dim('completeness')?.score);
  const overallScore = num(audit.overallScore);

  const llmUsed = !!input.llmUsed;
  const agenticUsed = !!input.agenticUsed;
  const verdict = input.verifyVerdict;
  const agentsAreFallback = isAgentFallback(input.orchestration);
  const multiAgentEmpty =
    agentsAreFallback ||
    (num(input.orchestration?.totalLlmCalls) === 0 &&
      (input.orchestration?.mode === 'deterministic-expert' ||
        input.orchestration?.mode === 'engine' ||
        !input.orchestration?.mode));

  // —— 主结论（唯一权威）——
  const readiness = deriveReadiness({
    verdict,
    overallScore,
    engineScore,
    llmScore,
    llmUsed,
    multiAgentEmpty,
    auditStatus: audit.status,
    targetAchieved: !!audit.targetAchieved,
  });

  const editionLabel = mapEditionLabel(c, audit.deliveryTier, readiness, llmUsed);
  const confidenceScore = overallScore;

  const { title, summary, badge } = buildHeadline(c, {
    readiness,
    llmUsed,
    multiAgentEmpty,
    verdict,
    consistencyScore,
    generatedFrom: input.generatedFrom,
    editionLabel,
  });

  const trustPoints = buildTrustPoints(c, {
    engineScore,
    llmScore,
    completenessScore,
    llmUsed,
    agenticUsed: agenticUsed && !multiAgentEmpty,
    verdict,
  });

  const cautionPoints = buildCautionPoints(c, {
    readiness,
    verdict,
    consistencyScore,
    multiAgentEmpty,
    agenticScore,
    concerns: audit.concerns,
  });

  const progress = buildProgress(c, input.upgradeJob);
  const primaryAction = buildPrimaryAction(c, {
    readiness,
    canManage: !!input.canManage,
    multiAgentEmpty,
    verdict,
    upgradeStatus: input.upgradeJob?.status,
  });

  const details: Array<{ label: string; value: string }> = [];
  if (confidenceScore != null) {
    details.push({ label: c.detailOverall, value: `${confidenceScore}` });
  }
  if (engineScore != null) details.push({ label: c.detailEngine, value: `${engineScore}` });
  if (llmScore != null) details.push({ label: c.detailLlm, value: `${llmScore}` });
  if (agenticScore != null) {
    details.push({
      label: c.detailAgentic,
      value: multiAgentEmpty ? c.detailAgenticFallback : `${agenticScore}`,
    });
  }
  if (consistencyScore != null) {
    details.push({
      label: c.detailConsistency,
      value: `${formatVerdictShort(c, verdict)} · ${consistencyScore}`,
    });
  }
  if (completenessScore != null) {
    details.push({ label: c.detailCoverage, value: `${completenessScore}` });
  }

  return {
    readiness,
    badge,
    title,
    summary,
    editionLabel,
    confidenceScore,
    trustPoints,
    cautionPoints,
    progress,
    primaryAction,
    details,
  };
}

function deriveReadiness(params: {
  verdict?: VerifyVerdict;
  overallScore: number | null;
  engineScore: number | null;
  llmScore: number | null;
  llmUsed: boolean;
  multiAgentEmpty: boolean;
  auditStatus?: 'ready' | 'watch' | 'retry';
  targetAchieved: boolean;
}): UserReportReadiness {
  if (params.targetAchieved && params.verdict === 'PASS') {
    return 'ready';
  }

  const structureSolid =
    (params.engineScore != null && params.engineScore >= 85) ||
    (params.llmUsed && (params.llmScore == null || params.llmScore >= 75));

  // 多专家未真正跑通 + 校验 FAIL：主结构仍可能可读 → usable，不当「废稿」吓退
  if (params.verdict === 'FAIL') {
    if (structureSolid) return 'usable';
    return 'draft';
  }

  if (params.verdict === 'PASS' && (params.overallScore == null || params.overallScore >= 80)) {
    return 'ready';
  }

  if (params.verdict === 'WARN') {
    return structureSolid ? 'usable' : 'draft';
  }

  if (params.auditStatus === 'ready' && !params.multiAgentEmpty) {
    return 'ready';
  }

  if (params.llmUsed || structureSolid) {
    return 'usable';
  }

  if (params.auditStatus === 'retry') {
    return 'draft';
  }

  return 'usable';
}

function buildHeadline(
  c: StatusCopy,
  params: {
    readiness: UserReportReadiness;
    llmUsed: boolean;
    multiAgentEmpty: boolean;
    verdict?: VerifyVerdict;
    consistencyScore: number | null;
    generatedFrom?: string;
    editionLabel: string;
  }
): Pick<UserFacingReportStatus, 'title' | 'summary' | 'badge'> {
  if (params.readiness === 'ready') {
    return {
      badge: c.badgeReady,
      title: c.titleReady,
      summary: c.summaryReady,
    };
  }

  if (params.readiness === 'draft') {
    return {
      badge: c.badgeDraft,
      title: c.titleDraft,
      summary: c.summaryDraft,
    };
  }

  // usable
  if (params.multiAgentEmpty && params.verdict === 'FAIL') {
    return {
      badge: c.badgeStructureUsable,
      title: c.titleStructureUsable,
      summary: c.summaryStructureUsable,
    };
  }

  if (params.verdict === 'FAIL') {
    return {
      badge: c.badgeNeedsReview,
      title: c.titleNeedsReview,
      summary: c.summaryNeedsReview,
    };
  }

  if (params.verdict === 'WARN') {
    return {
      badge: c.badgeReviewSuggested,
      title: c.titleReviewSuggested,
      summary: c.summaryReviewSuggested,
    };
  }

  return {
    badge: c.badgeUsable,
    title: c.titleUsable,
    summary: params.llmUsed
      ? c.summaryUsableLlm(params.editionLabel)
      : c.summaryUsableBase(params.editionLabel),
  };
}

function buildTrustPoints(
  c: StatusCopy,
  params: {
    engineScore: number | null;
    llmScore: number | null;
    completenessScore: number | null;
    llmUsed: boolean;
    agenticUsed: boolean;
    verdict?: VerifyVerdict;
  }
): string[] {
  const points: string[] = [];
  if (params.engineScore != null && params.engineScore >= 85) {
    points.push(c.trustEngine);
  }
  if (params.llmUsed && (params.llmScore == null || params.llmScore >= 80)) {
    points.push(c.trustLlm);
  }
  if (params.completenessScore != null && params.completenessScore >= 85) {
    points.push(c.trustCoverage);
  }
  if (params.agenticUsed && params.verdict === 'PASS') {
    points.push(c.trustAgentic);
  }
  if (params.verdict === 'PASS' && points.length < 3) {
    points.push(c.trustConsistency);
  }
  return unique(points).slice(0, 3);
}

function buildCautionPoints(
  c: StatusCopy,
  params: {
    readiness: UserReportReadiness;
    verdict?: VerifyVerdict;
    consistencyScore: number | null;
    multiAgentEmpty: boolean;
    agenticScore: number | null;
    concerns?: string[];
  }
): string[] {
  const points: string[] = [];

  if (params.multiAgentEmpty) {
    points.push(c.cautionMultiAgent);
  }

  if (params.verdict === 'FAIL') {
    points.push(c.cautionFail);
  } else if (params.verdict === 'WARN') {
    points.push(c.cautionWarn);
  }

  // 从工程 concerns 里挑用户能懂、且未重复的
  for (const raw of params.concerns || []) {
    if (points.length >= 2) break;
    const rewritten = rewriteConcern(c, raw);
    if (!rewritten) continue;
    if (points.some((p) => similar(p, rewritten))) continue;
    // 跳过会吓人又不准的「必须重测出生」类（除非结构也崩了）
    if (params.readiness !== 'draft' && /出生|重新测算|重算|birth|reanalyze/i.test(rewritten)) continue;
    points.push(rewritten);
  }

  return unique(points).slice(0, 2);
}

function rewriteConcern(c: StatusCopy, raw: string): string | null {
  const text = sanitizeInternalJargon(raw).trim();
  if (!text) return null;
  if (/证据链不完整|evidence\s*chain/i.test(text)) {
    return c.cautionEvidenceThin;
  }
  if (/未形成有效的多维|多维补充判断|multi[- ]?dimension|multi[- ]?expert/i.test(text)) {
    return null; // 已由 multiAgentEmpty 覆盖
  }
  if (/一致性校验未通过|consistency\s*(check|verification)?\s*(failed|did not pass)/i.test(text)) {
    return null; // 已由 verdict FAIL 覆盖
  }
  if (/模板化|提示词残留|template[- ]?like|prompt\s*residue/i.test(text)) {
    return c.cautionTemplate;
  }
  return text.length > 48 ? `${text.slice(0, 46)}…` : text;
}

function buildProgress(
  c: StatusCopy,
  job?: UpgradeJobLike | null
): UserFacingReportStatus['progress'] {
  if (!job?.status) {
    return { state: 'none', label: '' };
  }

  switch (job.status) {
    case 'running':
      return {
        state: 'running',
        label: c.progressRunning,
        detail: c.progressRunningDetail,
      };
    case 'pending':
    case 'retry':
      return {
        state: 'queued',
        label: c.progressQueued,
        detail: c.progressQueuedDetail,
      };
    case 'completed':
      return {
        state: 'done',
        label: c.progressDone,
        detail: c.progressDoneDetail,
      };
    case 'failed':
    case 'cancelled':
      return {
        state: 'paused',
        label: c.progressPaused,
        detail: formatUpgradePauseReason(c, job.lastError),
      };
    default:
      return { state: 'none', label: '' };
  }
}

function formatUpgradePauseReason(c: StatusCopy, lastError?: string): string {
  if (lastError === 'LLM_UNAVAILABLE' || lastError === 'PROVIDER_UNHEALTHY') {
    return c.pauseLlmUnavailable;
  }
  if (lastError === 'TARGET_NOT_REACHED') {
    return c.pauseTargetNotReached;
  }
  return c.pauseDefault;
}

function buildPrimaryAction(
  c: StatusCopy,
  params: {
    readiness: UserReportReadiness;
    canManage: boolean;
    multiAgentEmpty: boolean;
    verdict?: VerifyVerdict;
    upgradeStatus?: UpgradeJobLike['status'];
  }
): UserFacingReportStatus['primaryAction'] {
  if (!params.canManage) {
    return { kind: 'read_main', label: c.actionReadMain };
  }

  if (params.upgradeStatus === 'running' || params.upgradeStatus === 'pending' || params.upgradeStatus === 'retry') {
    return { kind: 'none', label: c.actionInProgress };
  }

  // 结构都站不住时才引导重测
  if (params.readiness === 'draft' && params.verdict === 'FAIL' && !params.multiAgentEmpty) {
    return { kind: 'reanalyze', label: c.actionReanalyze };
  }

  if (params.readiness === 'ready') {
    return { kind: 'none', label: c.actionNone };
  }

  // 最常见：可用但未深化完 → 继续完善（而不是吓人「重算」）
  if (params.multiAgentEmpty || params.verdict === 'FAIL' || params.verdict === 'WARN') {
    return { kind: 'upgrade_now', label: c.actionUpgrade };
  }

  return { kind: 'upgrade_now', label: c.actionUpgrade };
}

function mapEditionLabel(
  c: StatusCopy,
  tier?: 'basic' | 'enhanced' | 'expert',
  readiness?: UserReportReadiness,
  llmUsed?: boolean
): string {
  if (tier === 'expert') return c.editionExpert;
  if (tier === 'enhanced') return c.editionEnhanced;
  // basic 不要再说「简单报告」——用户会以为内容很少
  if (llmUsed || readiness === 'usable' || readiness === 'ready') return c.editionStandard;
  return c.editionBasic;
}

function formatVerdictShort(c: StatusCopy, verdict?: VerifyVerdict): string {
  if (verdict === 'PASS') return c.verdictPass;
  if (verdict === 'WARN') return c.verdictWarn;
  if (verdict === 'FAIL') return c.verdictFail;
  return c.verdictNone;
}

function isAgentFallback(orchestration?: OrchestrationLike | null): boolean {
  const sources = orchestration?.agentSources;
  if (!sources || typeof sources !== 'object') return false;
  const values = Object.values(sources);
  if (values.length === 0) return false;
  const fallbackCount = values.filter((v) => v === 'fallback' || v === 'rule' || v === 'deterministic').length;
  return fallbackCount >= Math.max(1, Math.ceil(values.length * 0.7));
}

function sanitizeInternalJargon(value: string): string {
  return value
    .replace(/并发\s*Agent|并发专家链路|Agentic|Agent/gi, '多维补充')
    .replace(/LLM|大模型|主模型|上游模型/gi, '正文增强')
    .replace(/deterministic|确定性引擎/gi, '基础结构')
    .replace(/Fallback\s*链|fallback/gi, '规则回退')
    .replace(/evidence\/actions/gi, '依据与行动项')
    .replace(/TARGET_NOT_REACHED/gi, '未达更高标准')
    .replace(/\s+/g, ' ')
    .trim();
}

function num(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? Math.round(value) : null;
}

function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

function similar(a: string, b: string): boolean {
  const na = a.replace(/\s/g, '');
  const nb = b.replace(/\s/g, '');
  return na.includes(nb.slice(0, 10)) || nb.includes(na.slice(0, 10));
}
