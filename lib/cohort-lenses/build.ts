import { buildCohortClaims, claimsForLens } from './claims';
import { getCohortFacts, parseBirthYear, regionLabel, resolveCohortRegion } from './cohorts';
import { COHORT_LENS_META, buildLensOverview } from './lenses';
import {
  emptyCalibration,
  rebuildDerived,
  sanitizeCalibration,
  summarizeCalibration,
} from './memory';
import {
  COHORT_LENS_IDS,
  type CohortCalibrationState,
  type CohortClaimView,
  type CohortLensId,
  type CohortMirrorView,
  type CohortStageView,
} from './types';

export interface BuildCohortMirrorInput {
  birthDate?: string | Date | number | null;
  birthYear?: number | null;
  birthPlace?: string | null;
  now?: Date;
  calibration?: CohortCalibrationState | null;
  locale?: string | null;
}

const STAGES: Array<Omit<CohortStageView, 'current'>> = [
  {
    id: '0-12',
    label: '童年 0–12',
    ageStart: 0,
    ageEnd: 12,
    priority: '安全、玩耍和被稳定照看',
    watch: '把成人焦虑写成孩子的性格',
    decision: '家庭节奏先稳，再加课',
  },
  {
    id: '13-22',
    label: '求学 13–22',
    ageStart: 13,
    ageEnd: 22,
    priority: '建立一种可迁移的学习方法',
    watch: '把单一考试通道当成整个人生',
    decision: '选赛道时保留一条可退的技能',
  },
  {
    id: '23-32',
    label: '立足 23–32',
    ageStart: 23,
    ageEnd: 32,
    priority: '把能力做成可验证的作品或岗位结果',
    watch: '用忙碌代替选择',
    decision: '三年内只深挖一条主技能',
  },
  {
    id: '33-42',
    label: '承压 33–42',
    ageStart: 33,
    ageEnd: 42,
    priority: '家庭、现金和职业三者排顺序',
    watch: '用「应该」压过身体信号',
    decision: '写清不能再拖的一件家事或一件职业事',
  },
  {
    id: '43-52',
    label: '重整 43–52',
    ageStart: 43,
    ageEnd: 52,
    priority: '把经验变成可交付的判断力',
    watch: '用旧身份拒绝更新',
    decision: '留下什么、交接什么，要有日期',
  },
  {
    id: '53-64',
    label: '收成 53–64',
    ageStart: 53,
    ageEnd: 64,
    priority: '健康节奏和传承安排',
    watch: '继续用年轻时的工时证明价值',
    decision: '减负清单比新项目更重要',
  },
  {
    id: '65-plus',
    label: '晚景 65+',
    ageStart: 65,
    ageEnd: 100,
    priority: '关系密度和日常节律',
    watch: '与世隔绝或过度被安排',
    decision: '每周固定两件自己能做主的事',
  },
];

export function resolveMirrorBirthYear(input: BuildCohortMirrorInput): number | null {
  if (typeof input.birthYear === 'number' && input.birthYear >= 1940 && input.birthYear <= 2035) {
    return input.birthYear;
  }
  return parseBirthYear(input.birthDate ?? null);
}

export function buildCohortMirror(input: BuildCohortMirrorInput): CohortMirrorView | null {
  const birthYear = resolveMirrorBirthYear(input);
  if (!birthYear) return null;

  const now = input.now || new Date();
  const currentAge = Math.max(0, now.getFullYear() - birthYear);
  const region = resolveCohortRegion(input.birthPlace);
  const facts = getCohortFacts(birthYear);
  const claims = buildCohortClaims(facts, region);
  const stored = sanitizeCalibration(input.calibration);
  const calibration = rebuildDerived(
    stored && stored.cohortKey === facts.key
      ? { ...stored, birthYear, region }
      : emptyCalibration({ birthYear, cohortKey: facts.key, region, now }),
    claims,
  );
  const judgmentByClaim = new Map(calibration.judgments.map((item) => [item.claimId, item]));

  const lenses = COHORT_LENS_IDS.map((lensId) => {
    const lensClaims = claimsForLens(claims, lensId).slice(0, 4).map((item) => {
      const judged = judgmentByClaim.get(item.id);
      const view: CohortClaimView = {
        id: item.id,
        lensId: item.lensId,
        text: item.text,
        checkPrompt: item.checkPrompt,
        dimension: item.dimension,
        forks: item.forks,
        verdict: judged?.verdict,
        note: judged?.note,
        forkId: judged?.forkId,
      };
      return view;
    });
    return {
      id: lensId,
      title: COHORT_LENS_META[lensId].title,
      subtitle: COHORT_LENS_META[lensId].subtitle,
      overview: buildLensOverview(lensId, facts, region),
      judged: lensClaims.some((item) => item.verdict),
      claims: lensClaims,
    };
  });

  const judgedClaims = lenses.reduce(
    (sum, lens) => sum + lens.claims.filter((item) => item.verdict).length,
    0,
  );
  const totalClaims = lenses.reduce((sum, lens) => sum + lens.claims.length, 0);
  const judgedLenses = lenses.filter((lens) => lens.judged).length;

  const stages = STAGES.map((stage) => ({
    ...stage,
    current: currentAge >= stage.ageStart && currentAge <= stage.ageEnd,
  }));

  const en = `${input.locale || ''}`.toLowerCase().startsWith('en');
  const headline = en
    ? `${birthYear} cohort · ${facts.generationName}`
    : `${birthYear} 年出生 · ${facts.generationName}`;
  const eraLine = `${facts.label}成长于「${facts.childhoodSetting}」。${region === 'cn-mainland' ? '' : `出生地按${regionLabel(region)}处理。`}`;
  const compareLine = `相对更早：${facts.olderContrast}。相对更晚：${facts.youngerContrast}。`;

  return {
    birthYear,
    currentAge,
    region,
    cohortKey: facts.key,
    cohortLabel: facts.label,
    generationName: facts.generationName,
    headline,
    eraLine,
    compareLine,
    disclaimer:
      '这是世代环境层，不是八字结构，更不是占星。共同经历只说明「最常见」，你标不像的条目会从个人上下文里拿掉。',
    lenses,
    stages,
    progress: {
      judgedLenses,
      totalLenses: COHORT_LENS_IDS.length,
      judgedClaims,
      totalClaims,
    },
    memory: {
      confirmed: calibration.confirmedTraits,
      denied: calibration.deniedTraits,
      summary: summarizeCalibration(calibration),
    },
    chatStarters: buildChatStarters(calibration, lenses.map((item) => item.id)),
  };
}

function buildChatStarters(
  state: CohortCalibrationState,
  _lensIds: CohortLensId[],
): string[] {
  const starters: string[] = [];
  if (state.confirmedTraits[0]) {
    starters.push(`结合我已确认的「${state.confirmedTraits[0]}」，事业和关系建议要不要改口径？`);
  }
  if (state.deniedTraits[0]) {
    starters.push(`我标了「${state.deniedTraits[0]}」，按我的实际情况重讲，不要再用同代套话。`);
  }
  const unjudged = COHORT_LENS_IDS.find(
    (id) => !state.judgments.some((item) => item.lensId === id),
  );
  if (unjudged) {
    const title = COHORT_LENS_META[unjudged].title;
    starters.push(`先别下新结论。按「${title}」问我 3 个能核对的问题，我来判断像不像。`);
  }
  if (!starters.length) {
    starters.push('用世代经历核对一下：你觉得我的童年、金钱观和关系模式，哪一条最像，哪一条最不像？');
  }
  return starters.slice(0, 3);
}

export function calibrationFromMirror(
  view: CohortMirrorView,
  previous?: CohortCalibrationState | null,
): CohortCalibrationState {
  const judgments = view.lenses.flatMap((lens) =>
    lens.claims
      .filter((claim) => claim.verdict)
      .map((claim) => ({
        claimId: claim.id,
        lensId: claim.lensId,
        verdict: claim.verdict!,
        note: claim.note,
        forkId: claim.forkId,
        judgedAt: previous?.judgments.find((item) => item.claimId === claim.id)?.judgedAt || new Date().toISOString(),
      })),
  );
  return rebuildDerived(
    {
      version: 1,
      birthYear: view.birthYear,
      cohortKey: view.cohortKey,
      region: view.region,
      judgments,
      confirmedTraits: view.memory.confirmed,
      deniedTraits: view.memory.denied,
      focusLenses: previous?.focusLenses || [],
      updatedAt: new Date().toISOString(),
    },
    buildCohortClaims(getCohortFacts(view.birthYear), view.region),
  );
}
