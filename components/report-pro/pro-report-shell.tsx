import Link from 'next/link';
import type { ProReportView } from '@/lib/report-pro-view';
import type { FortuneAnalysisResult } from '@/lib/user-types';
import { buildDecisionSheet } from '@/lib/report-decision-sheet';
import { buildDecisionPacks } from '@/lib/decision-packs';
import { buildHehunHref, personFromProView } from '@/lib/hehun-prefill';
import type { KlineCalibrationMarker } from '@/lib/kline-calibration';
import { buildEngineSurfaceFromProView } from '@/lib/engine-surface';
import ProPillarsBar from '@/components/report-pro/pro-pillars-bar';
import ProOverviewCard from '@/components/report-pro/pro-overview-card';
import ProOutlookPair from '@/components/report-pro/pro-outlook-pair';
import ProTopicGrid from '@/components/report-pro/pro-topic-grid';
import ProBeginnerGuide from '@/components/report-pro/pro-beginner-guide';
import ProElementsCard from '@/components/report-pro/pro-elements-card';
import YongShenStaleBanner from '@/components/report/yongshen-stale-banner';
import ReportErrorButton from '@/components/report/report-error-button';
import ProTimeScores from '@/components/report-pro/pro-time-scores';
import ProRiskAlerts from '@/components/report-pro/pro-risk-alerts';
import ProActionBar from '@/components/report-pro/pro-action-bar';
import ProMonthStrip from '@/components/report-pro/pro-month-strip';
import ProDecisionSheet from '@/components/report-pro/pro-decision-sheet';
import ProNeedMap from '@/components/report-pro/pro-need-map';
import ProPredictionsStrip from '@/components/report-pro/pro-predictions-strip';
import ProDecisionPacks from '@/components/report-pro/pro-decision-packs';
import ProRevisitStrip from '@/components/report-pro/pro-revisit-strip';
import ProLearningPath from '@/components/report-pro/pro-learning-path';
import ProKlineLiveIsland from '@/components/kline/pro-kline-live-island';
import TeacherPicker from '@/components/teachers/teacher-picker';
import ReportConsultantCards from '@/components/report/report-consultant-cards';
import { ReportIllustrationCite } from '@/components/report/report-illustration-cite';
import KnowledgeBaseStamp from '@/components/knowledge-base-stamp';
import ProAnalyticsBeacon from '@/components/report-pro/pro-analytics-beacon';
import { ReportToolsStrip } from '@/components/report/report-tools-strip';
import { ReportFoundationStrip } from '@/components/report/report-foundation-strip';
import ReportEmailCapture from '@/components/report/report-email-capture';
import AccountSavePanel from '@/components/auth/account-save-panel';
import ReportShareViral from '@/components/share/report-share-viral';
import EngineSurfaceMount from '@/components/engine-surface/engine-surface-mount';
import EngineSurfaceCite from '@/components/engine-surface/engine-surface-cite';

/**
 * 正常用户主报告（默认阅读）：
 * 决策一页通 → 行动条 → 结论 → 四柱 → 人生K线 → 命理总评 → 喜用 → 时间 → 避险 → 议题
 * K 线用引擎 klineData（大运/流年加权），排盘细读在「专业版」。
 */
export default function ProReportShell({
  view,
  klineData,
  summaryHref,
  expertHref,
  publicName,
  reportId,
  canManage = false,
  birthTimeUncertain = false,
  currentDayun = null,
  currentDaYunText,
  birthYear,
  consultantWindows,
  locale,
  dayun,
  calibrationMarkers,
  birthDate,
  birthTime,
  birthPlace,
  gender,
  analysis,
  fiveElements,
  tenGods,
  shenSha,
}: {
  view: ProReportView;
  klineData?: FortuneAnalysisResult['klineData'] | null;
  summaryHref: string;
  /** 专业版：排盘 / 命理分析参考 */
  expertHref?: string;
  publicName?: string;
  reportId: string;
  canManage?: boolean;
  /** 时辰不确定时降低婚期/短窗表述确定性 */
  birthTimeUncertain?: boolean;
  /** 当前大运（合婚同步层预填） */
  currentDayun?: {
    ganZhi?: string;
    quality?: string;
    yongShenMatch?: string;
    startYear?: number;
    endYear?: number;
  } | null;
  currentDaYunText?: string;
  /** 出生公历年，人生 80 年 K 线轴 */
  birthYear?: number;
  /** 首屏顾问卡窗口（best / risk） */
  consultantWindows?: { best?: string; risk?: string } | null;
  /** UI locale for consultant / reading chrome */
  locale?: string | null;
  /** 全量大运（色带） */
  dayun?: FortuneAnalysisResult['dayun'] | unknown;
  /** 用户校准节点 → K 线标注 */
  calibrationMarkers?: KlineCalibrationMarker[] | null;
  /** 出生公历日（引擎身份 / 结构台） */
  birthDate?: string | null;
  birthTime?: string | null;
  birthPlace?: string | null;
  gender?: string | null;
  analysis?: unknown;
  fiveElements?: unknown;
  tenGods?: unknown;
  shenSha?: unknown;
}) {
  const decisionSheet = buildDecisionSheet(view);
  const decisionPacks = buildDecisionPacks(view, reportId);
  const dayPillar = view.pillars.find((p) => p.label === '日柱') || view.pillars[2];
  const hehunHref = buildHehunHref({
    reportId,
    personA: personFromProView({
      name: publicName || '本人',
      dayMaster: view.dayMaster,
      dayPillarGanZhi: dayPillar?.ganZhi,
      yongShen: view.elements.yongShen,
      jiShen: view.elements.jiShen,
      currentDaYunText: currentDaYunText || view.subtitle,
      currentDayun,
    }),
  });

  const enginePack = buildEngineSurfaceFromProView({
    view,
    reportId,
    klineData,
    dayun,
    birthDate,
    birthTime,
    birthPlace,
    gender,
    analysis,
    fiveElements,
    tenGods,
    shenSha,
  });

  return (
    <div id="pro-reading" className="scroll-mt-header space-y-4 md:space-y-5">
      <ProAnalyticsBeacon reportId={reportId} surface="mass" />
      {/* 账号保存优先（密码/Google），再邮箱订阅 — 降低 guest 流失 */}
      <AccountSavePanel
        reportId={reportId}
        source="pro_report_shell_top"
        nextHref={`/result/${reportId}`}
      />
      <ReportEmailCapture
        reportId={reportId}
        surfaceKey="pro_report_shell_top"
        variant="inline"
        visitThreshold={1}
      />
      {/* 人生数据底座：完整度 + 一键补缺 */}
      <ReportFoundationStrip reportId={reportId} source="pro_report_shell" />
      {/* 工具分发：报告入口是金矿 session */}
      <ReportToolsStrip
        reportId={reportId}
        dayMaster={view.dayMaster}
        yongShen={view.elements?.yongShen}
        source="pro_report_shell"
        compact
      />
      {view.elements?.yongShenStale ? (
        <YongShenStaleBanner
          reportId={reportId}
          strengthDesc={view.elements.strengthDesc}
          yongShen={view.elements.yongShen}
        />
      ) : null}
      <section className="border-b border-[color:var(--hairline)] pb-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <div className="text-[12px] font-medium text-[color:var(--ink-5)]">你的报告</div>
              <KnowledgeBaseStamp />
              <ReportErrorButton
                compact
                reportId={reportId}
                category="content_wrong"
                label="整份报错"
                presetMessage={`【报告报错】\n报告ID：${reportId}\n\n问题描述：\n`}
              />
            </div>
            <h1 className="mt-1.5 text-[18px] font-semibold leading-snug tracking-[-0.02em] text-[color:var(--ink-1)] md:text-[22px]">
              {publicName ? `${publicName} · ` : ''}
              {view.title}
            </h1>
            <p className="mt-1.5 max-w-2xl text-[13px] leading-[1.55] text-[color:var(--ink-5)]">
              {view.subtitle}
            </p>
          </div>
          <nav className="flex shrink-0 flex-wrap gap-x-4 gap-y-1 text-[13px]">
            <a href="#pro-decision" className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
              决策一页通
            </a>
            <a href="#report-consultants" className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
              问顾问
            </a>
            <a href="#pro-action" className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
              现在怎么做
            </a>
            <a href="#pro-risks" className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
              避险
            </a>
            <a href="#engine-surface" className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
              引擎结构
            </a>
            <Link
              href={`/predictions?reportId=${encodeURIComponent(reportId)}`}
              className="text-[color:var(--ink-2)] underline-offset-2 hover:underline"
            >
              预测回访
            </Link>
            <Link
              href={summaryHref}
              className="text-[color:var(--ink-3)] underline-offset-2 hover:underline"
            >
              摘要
            </Link>
            <a
              href={expertHref || '#expert-edition'}
              className="text-[color:var(--ink-3)] underline-offset-2 hover:underline"
              title="排盘与命理细读，供专业人士参考"
            >
              专业参考
            </a>
          </nav>
        </div>

        <ol className="mt-3 grid gap-1.5 text-[12px] leading-5 text-[color:var(--ink-5)] sm:grid-cols-2">
          <li>
            <a href="#pro-decision" className="text-[color:var(--ink-3)] underline-offset-2 hover:underline">
              ① 决策一页通
            </a>
          </li>
          <li>
            <a href="#report-consultants" className="underline-offset-2 hover:underline">
              ② 先问一位顾问
            </a>
          </li>
          <li>
            <a href="#pro-action" className="underline-offset-2 hover:underline">
              ③ 现在怎么做
            </a>
          </li>
          <li>
            <a href="#pro-kline" className="underline-offset-2 hover:underline">
              ④ 人生 K 线
            </a>
          </li>
          <li>
            <a href="#pro-overview" className="underline-offset-2 hover:underline">
              ⑤ 命理总评
            </a>
          </li>
          <li>
            <a href="#pro-elements" className="underline-offset-2 hover:underline">
              ⑥ 喜用 / 趋利避害
            </a>
          </li>
          <li>
            <a href="#pro-time" className="underline-offset-2 hover:underline">
              ⑦ 本月·今年·明年
            </a>
          </li>
          <li>
            <a href="#pro-risks" className="underline-offset-2 hover:underline">
              ⑧ 重点避险
            </a>
          </li>
          <li>
            <a href="#engine-surface" className="underline-offset-2 hover:underline">
              ⑨ 引擎结构台
            </a>
          </li>
          <li>
            <a href="#pro-topics" className="underline-offset-2 hover:underline">
              ⑩ 议题 · 继续问
            </a>
          </li>
          <li>
            <a href="#pro-teachers" className="underline-offset-2 hover:underline">
              ⑪ 问老师
            </a>
          </li>
          <li>
            <a href="#pro-learn" className="underline-offset-2 hover:underline">
              ⑫ 相关阅读
            </a>
          </li>
        </ol>
      </section>

      <EngineSurfaceCite
        pack={enginePack}
        modules={['pillars', 'yongji', 'kline', 'months', 'dayun', 'almanac']}
        label="决策与叙事都挂在同一套引擎结构上"
      />

      <ReportIllustrationCite
        keys={['cover', 'reading-path']}
        title="怎么读本报告"
        limit={1}
      />

      <ProDecisionSheet
        sheet={decisionSheet}
        reportId={reportId}
        birthTimeUncertain={birthTimeUncertain}
        publicName={publicName}
      />

      <ReportConsultantCards
        reportId={reportId}
        windows={consultantWindows}
        source={`report:${reportId}:first_screen`}
        locale={locale}
      />

      <ProRevisitStrip reportId={reportId} revisitHint={decisionSheet.revisitWhen} />

      <ProNeedMap reportId={reportId} hehunHref={hehunHref} />

      <ReportIllustrationCite
        keys={['decision-loop']}
        title="动作闭环"
        limit={1}
      />

      <ProActionBar action={view.nowAction} />

      <div id="pro-guide" className="scroll-mt-header">
        <ProBeginnerGuide
          oneLiner={view.overview.oneLiner}
          guide={view.beginnerGuide}
          overviewScore={view.overview.score10}
        />
      </div>

      <ReportIllustrationCite keys={['dayun', 'timing']} title="大运与节奏" limit={1} />

      {/* 人生 K 线：client island，校准后即时标到图上（无需刷新） */}
      <ProKlineLiveIsland
        reportId={reportId}
        klineData={klineData}
        peak={view.klinePeak}
        trough={view.klineTrough}
        birthYear={
          birthYear ||
          (() => {
            const years = Array.isArray(klineData)
              ? klineData.map((p) => p.year).filter((y): y is number => typeof y === 'number')
              : [];
            if (years.length && Math.max(...years) - Math.min(...years) >= 40) {
              return Math.min(...years);
            }
            return undefined;
          })()
        }
        yongShen={view.elements.yongShen}
        jiShen={view.elements.jiShen}
        dayun={dayun}
        publicName={publicName}
        locale={locale}
        initialMarkers={calibrationMarkers}
        between={
          <div id="pro-pillars" className="scroll-mt-header">
            <ProPillarsBar pillars={view.pillars} />
          </div>
        }
      />

      <div id="pro-overview" className="scroll-mt-header">
        <ProOverviewCard overview={view.overview} />
      </div>

      <div id="pro-elements" className="scroll-mt-header space-y-3">
        <ReportIllustrationCite keys={['yongshen', 'structure']} title="结构示意" limit={1} />
        <ProElementsCard elements={view.elements} reportId={reportId} />
      </div>

      <div id="pro-time" className="scroll-mt-header">
        <ProTimeScores scores={view.timeScores} />
      </div>

      <ProMonthStrip items={view.monthStrip} />

      <div id="pro-risks" className="scroll-mt-header space-y-3">
        <ReportIllustrationCite keys={['boundary']} title="判断边界" limit={1} />
        <ProRiskAlerts alerts={view.riskAlerts} reportId={reportId} canManage={canManage} />
      </div>

      {/* 引擎结构台：四柱/用忌/大运/K线/近月/通书 — 与叙事同盘可引用 */}
      <EngineSurfaceMount
        pack={enginePack}
        prefer={['pillars', 'yongji', 'kline', 'months', 'dayun', 'almanac', 'risks']}
        title="引擎结构台"
      />

      <div id="pro-outlook" className="scroll-mt-header">
        <ProOutlookPair month={view.month} year={view.year} />
        {view.nextYear ? (
          <div className="mt-3">
            <NextYearCard block={view.nextYear} />
          </div>
        ) : null}
      </div>

      <div id="pro-topics" className="scroll-mt-header">
        <ProTopicGrid topics={view.topics} reportId={reportId} />
      </div>

      <TeacherPicker
        reportId={reportId}
        source={`report:${reportId}:shell`}
        title="问老师"
        subtitle="一位老师专一事；结合本盘作答，需要时再换老师"
      />

      <ProLearningPath view={view} reportId={reportId} />

      <ReportIllustrationCite keys={['validation']} title="验证闭环" limit={1} />
      <ProPredictionsStrip reportId={reportId} view={view} />

      <ProDecisionPacks packs={decisionPacks} />

      <ReportShareViral
        reportId={reportId}
        publicName={publicName}
        locale={locale}
        headline={[
          view.dayMaster ? `日主${view.dayMaster}` : '',
          view.patternLabel || '',
          view.overview.oneLiner?.slice(0, 48) || view.title,
        ]
          .filter(Boolean)
          .join(' · ')}
        lines={[
          view.elements.yongShen?.length
            ? `用神 ${view.elements.yongShen.slice(0, 3).join('、')}`
            : '',
          view.klinePeak
            ? `高点参考 ${view.klinePeak.year} · ${view.klinePeak.label || view.klinePeak.score}`
            : '',
          view.nowAction?.doThis
            ? `现在宜：${String(view.nowAction.doThis).slice(0, 40)}`
            : '结构与节奏参考 · 免费再测一份',
        ].filter(Boolean)}
      />

      <nav className="flex flex-wrap gap-x-4 gap-y-1 border-t border-[color:var(--hairline)] pt-4 text-[13px]">
        <Link href={hehunHref} className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
          合婚双盘
        </Link>
        <Link
          href={`/dimensions/timing-selection?reportId=${encodeURIComponent(reportId)}`}
          className="text-[color:var(--ink-2)] underline-offset-2 hover:underline"
        >
          择日
        </Link>
        <Link
          href={`/events?reportId=${encodeURIComponent(reportId)}`}
          className="text-[color:var(--ink-2)] underline-offset-2 hover:underline"
        >
          事件日历
        </Link>
        <Link
          href={`/predictions?reportId=${encodeURIComponent(reportId)}`}
          className="text-[color:var(--ink-2)] underline-offset-2 hover:underline"
        >
          预测回访
        </Link>
        <Link
          href={`/dimensions/naming?reportId=${encodeURIComponent(reportId)}`}
          className="text-[color:var(--ink-2)] underline-offset-2 hover:underline"
        >
          起名
        </Link>
        <Link href="/expert-crm" className="text-[color:var(--ink-3)] underline-offset-2 hover:underline">
          专业 CRM
        </Link>
        <Link
          href={expertHref || '#expert-edition'}
          className="text-[color:var(--ink-3)] underline-offset-2 hover:underline"
        >
          专业排盘
        </Link>
      </nav>

      <KnowledgeBaseStamp variant="footer" className="px-1" />
    </div>
  );
}

function NextYearCard({
  block,
}: {
  block: NonNullable<ProReportView['nextYear']>;
}) {
  return (
    <article className="border-y border-[color:var(--hairline)] py-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-[14px] font-semibold text-[color:var(--ink-1)]">{block.title}</h3>
        {typeof block.score10 === 'number' ? (
          <span className="font-mono text-[12px] tabular-nums text-[color:var(--ink-5)]">
            {block.score10}/10
          </span>
        ) : null}
      </div>
      <p className="mt-2 text-[13px] leading-[1.65] text-[color:var(--ink-2)]">{block.body}</p>
      {block.tags.length > 0 ? (
        <div className="mt-2 text-[12px] text-[color:var(--ink-5)]">{block.tags.join(' · ')}</div>
      ) : null}
    </article>
  );
}
