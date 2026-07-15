/**
 * 用户向「报告状态」视图模型。
 *
 * 内部 qualityAudit / verify / upgradeJob 是工程信号；这里收敛成：
 * 1 条主结论 + 可信点 + 留意点 + 1 个主动作 + 可选进度。
 * 禁止再向用户并列输出互相打架的多套状态文案。
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
}): UserFacingReportStatus {
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

  const editionLabel = mapEditionLabel(audit.deliveryTier, readiness, llmUsed);
  const confidenceScore = overallScore;

  const { title, summary, badge } = buildHeadline({
    readiness,
    llmUsed,
    multiAgentEmpty,
    verdict,
    consistencyScore,
    generatedFrom: input.generatedFrom,
    editionLabel,
  });

  const trustPoints = buildTrustPoints({
    engineScore,
    llmScore,
    completenessScore,
    llmUsed,
    agenticUsed: agenticUsed && !multiAgentEmpty,
    verdict,
  });

  const cautionPoints = buildCautionPoints({
    readiness,
    verdict,
    consistencyScore,
    multiAgentEmpty,
    agenticScore,
    concerns: audit.concerns,
  });

  const progress = buildProgress(input.upgradeJob);
  const primaryAction = buildPrimaryAction({
    readiness,
    canManage: !!input.canManage,
    multiAgentEmpty,
    verdict,
    upgradeStatus: input.upgradeJob?.status,
  });

  const details: Array<{ label: string; value: string }> = [];
  if (confidenceScore != null) {
    details.push({ label: '综合评分', value: `${confidenceScore}` });
  }
  if (engineScore != null) details.push({ label: '命盘底座', value: `${engineScore}` });
  if (llmScore != null) details.push({ label: '正文完整度', value: `${llmScore}` });
  if (agenticScore != null) {
    details.push({
      label: '多维补充',
      value: multiAgentEmpty ? '未完成（规则回退）' : `${agenticScore}`,
    });
  }
  if (consistencyScore != null) {
    details.push({
      label: '内部对齐检查',
      value: `${formatVerdictShort(verdict)} · ${consistencyScore}`,
    });
  }
  if (completenessScore != null) {
    details.push({ label: '内容覆盖', value: `${completenessScore}` });
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

function buildHeadline(params: {
  readiness: UserReportReadiness;
  llmUsed: boolean;
  multiAgentEmpty: boolean;
  verdict?: VerifyVerdict;
  consistencyScore: number | null;
  generatedFrom?: string;
  editionLabel: string;
}): Pick<UserFacingReportStatus, 'title' | 'summary' | 'badge'> {
  if (params.readiness === 'ready') {
    return {
      badge: '可直接用',
      title: '这份报告可以直接作为当前阶段的阅读参考',
      summary:
        '命盘结构、正文与内部检查整体对齐。你可以把主结论和时间地图当作决策基线，再按需记录真实事件做校准。',
    };
  }

  if (params.readiness === 'draft') {
    return {
      badge: '参考草稿',
      title: '当前版本更适合当作参考草稿',
      summary:
        '基础命盘可能已生成，但关键深化或检查未完成。请先看结构大方向，不要把短期窗口或细项建议当成最终结论。',
    };
  }

  // usable
  if (params.multiAgentEmpty && params.verdict === 'FAIL') {
    return {
      badge: '结构可用',
      title: '主结构可读，多维深化与对齐检查尚未完成',
      summary:
        '四柱/大运/正文已经成型，可以先读核心结论。多维专家补充目前是回退结果，短期时机与行业/地理对齐未通过内部检查——这些部分请保守参考，不必因此否定整份命盘。',
    };
  }

  if (params.verdict === 'FAIL') {
    return {
      badge: '需复核',
      title: '报告可用，但内部对齐检查未通过',
      summary:
        '正文与底座内容仍可阅读。系统检测到部分判断之间未对齐，短期窗口与策略建议请当作观察项，优先相信稳定结构结论。',
    };
  }

  if (params.verdict === 'WARN') {
    return {
      badge: '建议复核',
      title: '整体可用，部分窗口建议需结合现实复核',
      summary:
        '主判断稳定，但有观察级的一致性提示。阅读时把「长期结构」和「短期时机」分开看会更稳妥。',
    };
  }

  return {
    badge: '可用',
    title: '这份报告可以正常阅读使用',
    summary: params.llmUsed
      ? `当前为${params.editionLabel}，主结论与建议已可阅读。若你需要更细的多维补充，可在方便时继续完善。`
      : `当前为${params.editionLabel}。主结构已给出；正文深度仍可继续完善。`,
  };
}

function buildTrustPoints(params: {
  engineScore: number | null;
  llmScore: number | null;
  completenessScore: number | null;
  llmUsed: boolean;
  agenticUsed: boolean;
  verdict?: VerifyVerdict;
}): string[] {
  const points: string[] = [];
  if (params.engineScore != null && params.engineScore >= 85) {
    points.push('命盘底座完整（四柱、五行、运势结构）');
  }
  if (params.llmUsed && (params.llmScore == null || params.llmScore >= 80)) {
    points.push('正文已完成增强，解释可读');
  }
  if (params.completenessScore != null && params.completenessScore >= 85) {
    points.push('建议、窗口与趋势覆盖较全');
  }
  if (params.agenticUsed && params.verdict === 'PASS') {
    points.push('多维补充与内部检查已对齐');
  }
  if (params.verdict === 'PASS' && points.length < 3) {
    points.push('内部一致性检查通过');
  }
  return unique(points).slice(0, 3);
}

function buildCautionPoints(params: {
  readiness: UserReportReadiness;
  verdict?: VerifyVerdict;
  consistencyScore: number | null;
  multiAgentEmpty: boolean;
  agenticScore: number | null;
  concerns?: string[];
}): string[] {
  const points: string[] = [];

  if (params.multiAgentEmpty) {
    points.push('多维专家补充未真正完成，相关细项可能偏模板化');
  }

  if (params.verdict === 'FAIL') {
    points.push('短期时机、行业与地理等对齐检查未通过，勿当作硬结论');
  } else if (params.verdict === 'WARN') {
    points.push('一致性处于观察级，窗口建议宜小步验证');
  }

  // 从工程 concerns 里挑用户能懂、且未重复的
  for (const raw of params.concerns || []) {
    if (points.length >= 2) break;
    const rewritten = rewriteConcern(raw);
    if (!rewritten) continue;
    if (points.some((p) => similar(p, rewritten))) continue;
    // 跳过会吓人又不准的「必须重测出生」类（除非结构也崩了）
    if (params.readiness !== 'draft' && /出生|重新测算|重算/.test(rewritten)) continue;
    points.push(rewritten);
  }

  return unique(points).slice(0, 2);
}

function rewriteConcern(raw: string): string | null {
  const text = sanitizeInternalJargon(raw).trim();
  if (!text) return null;
  if (/证据链不完整/.test(text)) {
    return '部分测算环节的依据或行动项仍偏薄';
  }
  if (/未形成有效的多维|多维补充判断/.test(text)) {
    return null; // 已由 multiAgentEmpty 覆盖
  }
  if (/一致性校验未通过/.test(text)) {
    return null; // 已由 verdict FAIL 覆盖
  }
  if (/模板化|提示词残留/.test(text)) {
    return '正文仍有模板化痕迹，阅读时以结构结论为准';
  }
  return text.length > 48 ? `${text.slice(0, 46)}…` : text;
}

function buildProgress(job?: UpgradeJobLike | null): UserFacingReportStatus['progress'] {
  if (!job?.status) {
    return { state: 'none', label: '' };
  }

  switch (job.status) {
    case 'running':
      return {
        state: 'running',
        label: '系统正在完善这份报告',
        detail: '你可以先阅读当前版本，完成后会自动更新。',
      };
    case 'pending':
    case 'retry':
      return {
        state: 'queued',
        label: '已排队等待完善',
        detail: '轮到时会自动继续，无需反复提交。',
      };
    case 'completed':
      return {
        state: 'done',
        label: '自动完善已结束',
        detail: '当前为完善流程结束后的版本。',
      };
    case 'failed':
    case 'cancelled':
      return {
        state: 'paused',
        label: '自动完善已暂停',
        detail: formatUpgradePauseReason(job.lastError),
      };
    default:
      return { state: 'none', label: '' };
  }
}

function formatUpgradePauseReason(lastError?: string): string {
  if (lastError === 'LLM_UNAVAILABLE' || lastError === 'PROVIDER_UNHEALTHY') {
    return '增强服务暂时不可用，已保留当前可读内容。可稍后再试「继续完善」。';
  }
  if (lastError === 'TARGET_NOT_REACHED') {
    return '已多次尝试深化，仍未达到更高交付标准；当前可读版本已保留。主结构仍可阅读。';
  }
  return '已保留当前可读内容。若主结论已够用，可直接阅读；需要时再点「继续完善」。';
}

function buildPrimaryAction(params: {
  readiness: UserReportReadiness;
  canManage: boolean;
  multiAgentEmpty: boolean;
  verdict?: VerifyVerdict;
  upgradeStatus?: UpgradeJobLike['status'];
}): UserFacingReportStatus['primaryAction'] {
  if (!params.canManage) {
    return { kind: 'read_main', label: '回到报告正文' };
  }

  if (params.upgradeStatus === 'running' || params.upgradeStatus === 'pending' || params.upgradeStatus === 'retry') {
    return { kind: 'none', label: '完善进行中' };
  }

  // 结构都站不住时才引导重测
  if (params.readiness === 'draft' && params.verdict === 'FAIL' && !params.multiAgentEmpty) {
    return { kind: 'reanalyze', label: '核对出生信息后重新测算' };
  }

  if (params.readiness === 'ready') {
    return { kind: 'none', label: '无需操作' };
  }

  // 最常见：可用但未深化完 → 继续完善（而不是吓人「重算」）
  if (params.multiAgentEmpty || params.verdict === 'FAIL' || params.verdict === 'WARN') {
    return { kind: 'upgrade_now', label: '继续完善这份报告' };
  }

  return { kind: 'upgrade_now', label: '继续完善这份报告' };
}

function mapEditionLabel(
  tier?: 'basic' | 'enhanced' | 'expert',
  readiness?: UserReportReadiness,
  llmUsed?: boolean
): string {
  if (tier === 'expert') return '完整版';
  if (tier === 'enhanced') return '深度版';
  // basic 不要再说「简单报告」——用户会以为内容很少
  if (llmUsed || readiness === 'usable' || readiness === 'ready') return '标准版';
  return '基础版';
}

function formatVerdictShort(verdict?: VerifyVerdict): string {
  if (verdict === 'PASS') return '通过';
  if (verdict === 'WARN') return '观察';
  if (verdict === 'FAIL') return '未通过';
  return '未检查';
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
