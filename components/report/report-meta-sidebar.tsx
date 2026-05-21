// v5-D60 (2026-05-21) 报告页 FB 2017 风右侧 meta sidebar
// Why: 报告 meta（生成时间 / 质量分 / 版本 / 模型链路 / 公开私有）原本散落在
//      主流和 ReportEnginePanel，timeline 风需要一个集中、稳定的 260px 右栏，
//      让中央阅读区聚焦内容，元数据 + 相关索引收敛到右栏。
// How: 接简单 props，纯展示；移动端整体折叠到主流下方。

import Link from 'next/link';

interface MetaItem {
  label: string;
  value: string;
}

interface ReportMetaSidebarProps {
  reportId: string;
  isPublic: boolean;
  generatedAt?: string | null;
  qualityLabel?: string | null;
  qualityScore?: number | null;
  reportVersion?: string | null;
  reasoningMode?: string | null;
  modelChainLabel?: string | null;
  /** 额外信息条 */
  extra?: MetaItem[];
  /** 标题（默认「报告信息」） */
  title?: string;
  /** 右栏底部插槽，例如相关报告/工具推荐摘要 */
  children?: React.ReactNode;
}

function formatDate(input?: string | null): string | null {
  if (!input) return null;
  try {
    const d = new Date(input);
    if (Number.isNaN(d.getTime())) return null;
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  } catch {
    return null;
  }
}

export default function ReportMetaSidebar({
  reportId,
  isPublic,
  generatedAt,
  qualityLabel,
  qualityScore,
  reportVersion,
  reasoningMode,
  modelChainLabel,
  extra,
  title = '报告信息',
  children,
}: ReportMetaSidebarProps) {
  const items: MetaItem[] = [];
  const generatedLabel = formatDate(generatedAt);
  if (generatedLabel) items.push({ label: '生成时间', value: generatedLabel });
  if (qualityLabel) {
    items.push({
      label: '质量',
      value: typeof qualityScore === 'number' ? `${qualityLabel} · ${qualityScore}` : qualityLabel,
    });
  } else if (typeof qualityScore === 'number') {
    items.push({ label: '质量', value: String(qualityScore) });
  }
  if (reportVersion) items.push({ label: '版本', value: reportVersion });
  if (reasoningMode) items.push({ label: '判断模式', value: reasoningMode });
  if (modelChainLabel) items.push({ label: '模型链路', value: modelChainLabel });
  items.push({ label: '可见性', value: isPublic ? '公开' : '私有' });
  if (extra) items.push(...extra);

  return (
    <aside
      aria-label="报告元数据"
      className="w-full lg:w-[260px] lg:shrink-0 space-y-2"
    >
      <section className="fb-card">
        <div className="fb-section-title border-b border-[color:var(--hairline)] px-3 py-2 text-[13px] font-bold text-[#3b5998]">
          {title}
        </div>
        <dl className="px-3 py-2 text-[13px] leading-[1.34]">
          {items.map((item) => (
            <div key={`${item.label}-${item.value}`} className="flex items-baseline justify-between gap-2 py-1">
              <dt className="text-[12px] text-[color:var(--ink-4)]">{item.label}</dt>
              <dd className="text-right font-semibold text-[color:var(--ink-1)]">{item.value}</dd>
            </div>
          ))}
        </dl>
        <div className="border-t border-[color:var(--hairline)] px-3 py-2">
          <Link
            href={`/r/${reportId}`}
            className="text-[12px] text-[#3b5998] hover:underline"
          >
            查看时间地图视图 →
          </Link>
        </div>
      </section>

      {children}
    </aside>
  );
}
