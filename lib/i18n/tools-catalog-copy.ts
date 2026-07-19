/**
 * EN presentation for tools category catalog.
 * Chinese source of truth stays in `lib/portal-tools.ts` / `lib/portal-nav.ts`.
 * Match tool entries by href first, then by Chinese title.
 */

import type { PortalEntry } from '@/lib/portal-nav';
import type { ToolCategoryKey } from '@/lib/portal-tools';
import { TOOL_CATEGORY_META } from '@/lib/portal-tools';
import type { SiteLocale } from '@/lib/i18n/site-locale';
import { toSiteLocaleText } from '@/lib/i18n/site-locale';

type EntryFields = { title: string; description: string; cta?: string };

/** Category titles + descriptions (keys match TOOL_CATEGORY_META). */
const TOOL_CATEGORY_META_EN: Record<ToolCategoryKey, { title: string; description: string }> = {
  career: {
    title: 'Career tools',
    description: 'Role fit, stage reordering, and career rhythm checks.',
  },
  wealth: {
    title: 'Wealth tools',
    description: 'Quick reads on pace, capital protection, and expansion windows.',
  },
  relationship: {
    title: 'Relationship tools',
    description: 'Ordering, rhythm, and boundary structure.',
  },
  family: {
    title: 'Family tools',
    description: 'Generational roles, home environment, and family ordering.',
  },
  health: {
    title: 'Health tools',
    description: 'Recovery rhythm and system boundaries (not medical diagnosis).',
  },
  migration: {
    title: 'Migration tools',
    description: 'Stay-or-return, city fit, and environment reordering.',
  },
  application: {
    title: 'Application tools',
    description: 'Timing, naming, finding, and everyday judgment tools.',
  },
};

/**
 * Preferred lookup: full href (including query) → EN fields.
 * Covers TOOL_ENTRIES + CATEGORY_TOOLS destinations.
 */
const TOOL_ENTRY_EN_BY_HREF: Record<string, EntryFields> = {
  // TOOL_ENTRIES
  '/dimensions': {
    title: 'Ten dimensions deep judgment',
    description:
      'Fortune rhythm, career, investing, and other high-frequency questions—with verifiable predictions.',
    cta: 'Enter ten dimensions',
  },
  '/dimensions/fortune-rhythm': {
    title: 'Fortune rhythm judgment',
    description: 'Current stage, turning points, and action windows (P0 pick).',
    cta: 'Start judgment',
  },
  '/predictions': {
    title: 'Prediction check-in',
    description: 'See upcoming and due predictions; report hit/miss.',
    cta: 'Check in',
  },
  '/events': {
    title: 'Event calendar',
    description: 'Log real-world nodes, mark verification, close the loop with report predictions.',
    cta: 'Log event',
  },
  '/hehun': {
    title: 'Compatibility dual chart',
    description:
      'Enter both birth dates to compare charts; prefill from report/profile. Day master · spouse palace · favorable/unfavorable · dayun sync.',
    cta: 'Compare both birth dates',
  },
  '/teachers': {
    title: 'Consultants',
    description:
      'Pick by question: career, finance, relationships, geography, practice—answers with report and notes.',
    cta: 'Choose consultant',
  },
  '/chat': {
    title: 'Continue chat',
    description: 'Keep asking after binding a report; or start from Consultants.',
    cta: 'Go to chat',
  },
  '/expert-crm': {
    title: 'Pro CRM',
    description:
      'Local client scripts and follow-up queue for practitioners (talking points, commitments, follow-up dates).',
    cta: 'Open CRM',
  },
  '/tools/timing-yearly-window': {
    title: '2026 yearly main window',
    description: 'This year’s career, relationship, and wealth windows—no full report required.',
    cta: 'Free yearly window',
  },
  '/tools/application-palmistry-reading': {
    title: 'Palm structure observation',
    description: 'Upload a palm photo for structural observation (not medical diagnosis).',
    cta: 'Upload palm photo',
  },
  '/tools/daily-sign': {
    title: 'Daily sign',
    description: 'Quick daily rhythm cue—good for everyday return visits.',
    cta: 'Draw today’s sign',
  },

  // CATEGORY_TOOLS (unique / query-bearing hrefs)
  '/dimensions/partnership': {
    title: 'Partnership judgment',
    description: 'Partner profile, role split, and partnership risk.',
    cta: 'Start judgment',
  },
  '/dimensions/career-industry': {
    title: 'Career & industry deep judgment',
    description: 'Top-3 industry fit, role ideas, and switch windows.',
    cta: 'Start judgment',
  },
  '/analyze?intent=career&source=tool_category_career': {
    title: 'Career structure report',
    description: 'Full career rhythm and role-fit judgment.',
    cta: 'Generate report',
  },
  '/dimensions/investment': {
    title: 'Investment & capital rhythm',
    description: 'Capital style, asset fit, and this year’s advance/hold (not investment advice).',
    cta: 'Start judgment',
  },
  '/analyze?intent=wealth&source=tool_category_wealth': {
    title: 'Wealth structure report',
    description: 'Wealth rhythm, protection, and expansion judgment.',
    cta: 'Generate report',
  },
  '/knowledge/world-yi-wealth-rhythm': {
    title: 'World Yi on wealth',
    description: 'How wealth enters and stays in the system.',
    cta: 'Read',
  },
  '/dimensions/marriage': {
    title: 'Marriage timing deep judgment',
    description: 'Relationship windows, spouse palace, and communication rhythm.',
    cta: 'Start judgment',
  },
  '/analyze?intent=relationship&source=tool_category_relationship': {
    title: 'Relationship structure report',
    description: 'Ordering, rhythm, and repair paths.',
    cta: 'Generate report',
  },
  '/cases/world-yi-case-family-duty': {
    title: 'Family ordering case',
    description: 'See ordering issues inside conflict.',
    cta: 'Read case',
  },
  '/analyze?intent=relationship&source=tool_category_family': {
    title: 'Family structure report',
    description: 'Generational duty and family role split.',
    cta: 'Generate report',
  },
  '/knowledge/world-yi-family-generational-order': {
    title: 'World Yi on family',
    description: 'Generational order and modern family friction.',
    cta: 'Read',
  },
  '/dimensions/health': {
    title: 'Health rhythm',
    description: 'Constitution tendencies and recovery windows (not medical diagnosis).',
    cta: 'Start judgment',
  },
  '/analyze?intent=yearly&source=tool_category_health': {
    title: 'Yearly health rhythm',
    description: 'System-level recovery and pace observation.',
    cta: 'Generate report',
  },
  '/knowledge/world-yi-health-boundary': {
    title: 'Health boundaries',
    description: 'Metaphysical observation does not replace medical judgment.',
    cta: 'Read',
  },
  '/dimensions/living-environment': {
    title: 'Living environment judgment',
    description: 'Placement orientation and move windows for reference.',
    cta: 'Start judgment',
  },
  '/analyze?source=tool_category_migration': {
    title: 'Migration fit report',
    description: 'Stay-or-return decision and environment cost structure.',
    cta: 'Generate report',
  },
  '/insights/city/world-yi-vancouver': {
    title: 'Vancouver city note',
    description: 'Sample environment layer for overseas Chinese.',
    cta: 'Read insight',
  },
  '/knowledge/world-yi-migration-stage-logic': {
    title: 'World Yi on migration',
    description: 'Migration is re-matching, not just a map change.',
    cta: 'Read',
  },
  '/dimensions/timing-selection': {
    title: 'Timing selection judgment',
    description: 'Day scores plus suitable/avoid date lists.',
    cta: 'Start judgment',
  },
  '/dimensions/naming': {
    title: 'Naming / rename judgment',
    description: 'Name five-elements and favorable-element support scoring.',
    cta: 'Start judgment',
  },
  '/knowledge/world-yi-timing-selection': {
    title: 'World Yi on timing',
    description: 'Timing serves action order.',
    cta: 'Read',
  },
  '/knowledge/world-yi-naming-system': {
    title: 'World Yi on naming',
    description: 'Names as an environment-layer complement.',
    cta: 'Read',
  },
};

/**
 * Secondary lookup by Chinese source title (when href is missing or shared
 * destinations need a context-specific label).
 */
const TOOL_ENTRY_EN_BY_TITLE: Record<string, EntryFields> = {
  人际合作研判: {
    title: 'Partnership judgment',
    description: 'Partner profile, role split, and partnership risk.',
    cta: 'Start judgment',
  },
  工作行业深度研判: {
    title: 'Career & industry deep judgment',
    description: 'Top-3 industry fit, role ideas, and switch windows.',
    cta: 'Start judgment',
  },
  事业结构报告: {
    title: 'Career structure report',
    description: 'Full career rhythm and role-fit judgment.',
    cta: 'Generate report',
  },
  '2026 年度主窗口': {
    title: '2026 yearly main window',
    description: 'This year’s main window for career push.',
    cta: 'Free test',
  },
  事件验证: {
    title: 'Event verification',
    description: 'Log career milestones and backtest judgments.',
    cta: 'Log event',
  },
  投资理财节奏: {
    title: 'Investment & capital rhythm',
    description: 'Capital style, asset fit, and this year’s advance/hold (not investment advice).',
    cta: 'Start judgment',
  },
  财富结构报告: {
    title: 'Wealth structure report',
    description: 'Wealth rhythm, protection, and expansion judgment.',
    cta: 'Generate report',
  },
  '2026 流年窗口': {
    title: '2026 yearly window',
    description: 'Quick yearly wealth rhythm read.',
    cta: 'Free test',
  },
  世界易财富观: {
    title: 'World Yi on wealth',
    description: 'How wealth enters and stays in the system.',
    cta: 'Read',
  },
  谈婚论嫁深度研判: {
    title: 'Marriage timing deep judgment',
    description: 'Relationship windows, spouse palace, and communication rhythm.',
    cta: 'Start judgment',
  },
  合婚双盘: {
    title: 'Compatibility dual chart',
    description: 'Day master · spouse palace · favorable/unfavorable · dayun sync, with your chart loaded.',
    cta: 'Compare charts',
  },
  关系结构报告: {
    title: 'Relationship structure report',
    description: 'Ordering, rhythm, and repair paths.',
    cta: 'Generate report',
  },
  今日一签: {
    title: 'Daily sign',
    description: 'Light relationship rhythm cue.',
    cta: 'Draw a sign',
  },
  家庭排序案例: {
    title: 'Family ordering case',
    description: 'See ordering issues inside conflict.',
    cta: 'Read case',
  },
  家庭结构报告: {
    title: 'Family structure report',
    description: 'Generational duty and family role split.',
    cta: 'Generate report',
  },
  世界易家庭观: {
    title: 'World Yi on family',
    description: 'Generational order and modern family friction.',
    cta: 'Read',
  },
  家庭事件记录: {
    title: 'Family event log',
    description: 'Record key family nodes.',
    cta: 'Log event',
  },
  身体健康节奏: {
    title: 'Health rhythm',
    description: 'Constitution tendencies and recovery windows (not medical diagnosis).',
    cta: 'Start judgment',
  },
  年度健康节奏: {
    title: 'Yearly health rhythm',
    description: 'System-level recovery and pace observation.',
    cta: 'Generate report',
  },
  健康边界: {
    title: 'Health boundaries',
    description: 'Metaphysical observation does not replace medical judgment.',
    cta: 'Read',
  },
  今日节律: {
    title: 'Daily rhythm',
    description: 'Light daily state cue.',
    cta: 'Draw a sign',
  },
  居家环境研判: {
    title: 'Living environment judgment',
    description: 'Placement orientation and move windows for reference.',
    cta: 'Start judgment',
  },
  迁移匹配报告: {
    title: 'Migration fit report',
    description: 'Stay-or-return decision and environment cost structure.',
    cta: 'Generate report',
  },
  温哥华城市观察: {
    title: 'Vancouver city note',
    description: 'Sample environment layer for overseas Chinese.',
    cta: 'Read insight',
  },
  世界易迁移观: {
    title: 'World Yi on migration',
    description: 'Migration is re-matching, not just a map change.',
    cta: 'Read',
  },
  择时办事研判: {
    title: 'Timing selection judgment',
    description: 'Day scores plus suitable/avoid date lists.',
    cta: 'Start judgment',
  },
  '起名 / 改名研判': {
    title: 'Naming / rename judgment',
    description: 'Name five-elements and favorable-element support scoring.',
    cta: 'Start judgment',
  },
  运势节奏研判: {
    title: 'Fortune rhythm judgment',
    description: 'Current stage, turning points, and action windows.',
    cta: 'Start judgment',
  },
  事件日历: {
    title: 'Event calendar',
    description: 'Log nodes, verification feedback, calibrate the next round.',
    cta: 'Log event',
  },
  结构追问: {
    title: 'Structural follow-up',
    description: 'Keep asking against a bound report—anchor truth.',
    cta: 'Ask more',
  },
  '专业 CRM': {
    title: 'Pro CRM',
    description: 'Local client scripts and follow-ups (for practice).',
    cta: 'Open CRM',
  },
  '2026 择时窗口': {
    title: '2026 timing window',
    description: 'Yearly main window and rhythm cues.',
    cta: 'Free test',
  },
  世界易择时观: {
    title: 'World Yi on timing',
    description: 'Timing serves action order.',
    cta: 'Read',
  },
  世界易起名观: {
    title: 'World Yi on naming',
    description: 'Names as an environment-layer complement.',
    cta: 'Read',
  },
  // TOOL_ENTRIES titles (fallback if href map misses)
  十维度深度研判: {
    title: 'Ten dimensions deep judgment',
    description:
      'Fortune rhythm, career, investing, and other high-frequency questions—with verifiable predictions.',
    cta: 'Enter ten dimensions',
  },
  预测回访: {
    title: 'Prediction check-in',
    description: 'See upcoming and due predictions; report hit/miss.',
    cta: 'Check in',
  },
  请老师: {
    title: 'Consultants',
    description:
      'Pick by question: career, finance, relationships, geography, practice—answers with report and notes.',
    cta: 'Choose consultant',
  },
  继续对话: {
    title: 'Continue chat',
    description: 'Keep asking after binding a report; or start from Consultants.',
    cta: 'Go to chat',
  },
  '2026 流年 / 年度主窗口': {
    title: '2026 yearly main window',
    description: 'This year’s career, relationship, and wealth windows—no full report required.',
    cta: 'Free yearly window',
  },
  手相结构观察: {
    title: 'Palm structure observation',
    description: 'Upload a palm photo for structural observation (not medical diagnosis).',
    cta: 'Upload palm photo',
  },
};

function localizeZhFields(entry: PortalEntry, locale: 'zh-Hant'): PortalEntry {
  return {
    ...entry,
    title: toSiteLocaleText(entry.title, locale),
    description: toSiteLocaleText(entry.description, locale),
    ...(entry.cta ? { cta: toSiteLocaleText(entry.cta, locale) } : {}),
  };
}

/** Localized category meta; Chinese source remains TOOL_CATEGORY_META. */
export function toolCategoryMetaCopy(
  locale: SiteLocale,
  key: ToolCategoryKey,
): { title: string; description: string } {
  const base = TOOL_CATEGORY_META[key];
  if (locale === 'en') {
    return TOOL_CATEGORY_META_EN[key] ?? base;
  }
  if (locale === 'zh-Hant') {
    return {
      title: toSiteLocaleText(base.title, 'zh-Hant'),
      description: toSiteLocaleText(base.description, 'zh-Hant'),
    };
  }
  return { title: base.title, description: base.description };
}

function applyEntryFields(entry: PortalEntry, fields: EntryFields): PortalEntry {
  return {
    href: entry.href,
    title: fields.title,
    description: fields.description,
    ...(fields.cta !== undefined
      ? { cta: fields.cta }
      : entry.cta
        ? { cta: entry.cta }
        : {}),
  };
}

/**
 * Present a portal tool entry for the active locale.
 * EN: match by href first (preferred), then by Chinese title; otherwise keep source.
 * zh-Hant: traditionalize source strings. zh-CN: pass-through.
 */
export function presentToolEntry(entry: PortalEntry, locale: SiteLocale): PortalEntry {
  if (locale === 'zh-CN') return entry;
  if (locale === 'zh-Hant') return localizeZhFields(entry, 'zh-Hant');

  const byHref = TOOL_ENTRY_EN_BY_HREF[entry.href];
  if (byHref) return applyEntryFields(entry, byHref);

  const byTitle = TOOL_ENTRY_EN_BY_TITLE[entry.title];
  if (byTitle) return applyEntryFields(entry, byTitle);

  return entry;
}

/** Map a list of entries (recommended tools / category tools). */
export function presentToolEntries(entries: PortalEntry[], locale: SiteLocale): PortalEntry[] {
  return entries.map((entry) => presentToolEntry(entry, locale));
}

/** Category page chrome (not in portal-tools). */
export function toolCategoryPageCopy(locale: SiteLocale) {
  const en = locale === 'en';
  const hant = locale === 'zh-Hant';
  const t = (zh: string, enText: string) => {
    if (en) return enText;
    if (hant) return toSiteLocaleText(zh, 'zh-Hant');
    return zh;
  };
  return {
    metaFallback: t('工具分类', 'Tool category'),
    metaSuffix: t('工具中心', 'Tools hub'),
    ctaDimensions: t('十维度', 'Ten dimensions'),
    eyebrow: t('工具分类', 'Tool category'),
    relatedDimensions: t('相关十维度', 'Related dimensions'),
    fullReport: t('完整报告', 'Full report'),
    allTools: t('全部工具', 'All tools'),
    capabilityTitle: (categoryTitle: string) =>
      en
        ? `${categoryTitle}: what it solves`
        : hant
          ? toSiteLocaleText(`${categoryTitle}：能解决什么`, 'zh-Hant')
          : `${categoryTitle}：能解决什么`,
    similarScenes: t('同类场景', 'Similar scenes'),
    similarScenesDesc: t(
      '工具适合快测；场景研判带结构判断。',
      'Tools are for quick checks; scene judgment adds structure.',
    ),
    toolsInCategory: t('本类工具', 'Tools in this category'),
  };
}
