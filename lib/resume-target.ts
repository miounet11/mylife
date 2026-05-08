import type { ResumeTarget } from '@/components/resume-bar';
import type { EventRecord, FortuneRecord, QuestionRecord } from '@/lib/user-types';

// v5-C1 server-side resume target resolver
// 优先级：最近聊天 → 待验证事件（最逾期）→ 最近报告

function formatRelativeShort(iso?: string | Date | null): string {
  if (!iso) return '';
  const t = typeof iso === 'string' ? new Date(iso).getTime() : iso.getTime();
  if (!Number.isFinite(t)) return '';
  const diff = Date.now() - t;
  if (diff < 60_000) return '刚刚';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} 分钟前`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)} 小时前`;
  if (diff < 7 * 86_400_000) return `${Math.floor(diff / 86_400_000)} 天前`;
  return new Date(t).toISOString().slice(0, 10);
}

function truncate(value: string, max = 60): string {
  if (!value) return '';
  if (value.length <= max) return value;
  return `${value.slice(0, max - 1)}…`;
}

export function resolveResumeTarget(params: {
  recentChat: QuestionRecord[];
  events: EventRecord[];
  reports: FortuneRecord[];
}): ResumeTarget | null {
  // ────── 1) 最近聊天（48 小时内有过会话）──────
  const sortedChat = [...params.recentChat].sort((a, b) => {
    const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return tb - ta;
  });
  const lastUserMsg = sortedChat.find((q) => q.category === 'chat_user');
  if (lastUserMsg && lastUserMsg.createdAt) {
    const ageMs = Date.now() - new Date(lastUserMsg.createdAt).getTime();
    if (ageMs < 7 * 86_400_000) {
      const reportId = (lastUserMsg.analysis as any)?.reportId
        || (lastUserMsg.analysis as any)?.report_id
        || null;
      const queryParts: string[] = [];
      if (reportId) queryParts.push(`reportId=${encodeURIComponent(reportId)}`);
      const href = queryParts.length > 0 ? `/chat?${queryParts.join('&')}` : '/chat';
      return {
        kind: 'continue_chat',
        label: `继续上次的判断`,
        subtitle: `${formatRelativeShort(lastUserMsg.createdAt)}你在问：「${truncate(lastUserMsg.question, 50)}」`,
        href,
        ctaLabel: '回到对话',
      };
    }
  }

  // ────── 2) 待验证事件（最逾期）──────
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayIso = today.toISOString().slice(0, 10);
  const pendingEvents = params.events.filter((e) => {
    const fb = e.userFeedback as any;
    return !fb || fb.wasAccurate === undefined;
  });
  // 按日期升序（最早的最逾期）取第一个
  pendingEvents.sort((a, b) => (a.date || '').localeCompare(b.date || ''));
  const oldestPending = pendingEvents.find((e) => e.date && e.date <= todayIso);
  if (oldestPending) {
    const overdueDays = oldestPending.date
      ? Math.floor((Date.now() - new Date(oldestPending.date).getTime()) / 86_400_000)
      : 0;
    return {
      kind: 'validate_event',
      label: oldestPending.title || '待回收的事件',
      subtitle: overdueDays > 0
        ? `已过去 ${overdueDays} 天，回收一下结果就能让下次判断更准。`
        : `今天就是预设的事件日期，结果如何？回收一下让判断更准。`,
      href: `/events?eventId=${encodeURIComponent(oldestPending.id)}`,
      ctaLabel: '立即回收',
      overdue: overdueDays > 7,
    };
  }

  // ────── 3) 最近报告（24 小时内创建但访问数低 or 最新报告引导回访）──────
  const sortedReports = [...params.reports].sort((a, b) => {
    const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return tb - ta;
  });
  const latest = sortedReports[0];
  if (latest && latest.id) {
    const dayMaster = (latest as any).analysis?.basic?.dayMaster || (latest as any).dayMaster || '';
    const pattern = (latest as any).analysis?.pattern?.type || '';
    const subtitleParts: string[] = [];
    if (latest.createdAt) subtitleParts.push(formatRelativeShort(latest.createdAt) + '生成');
    if (pattern) subtitleParts.push(`格局 ${pattern}`);
    if (dayMaster) subtitleParts.push(`日主 ${dayMaster}`);
    return {
      kind: 'continue_report',
      label: `接着看 ${(latest.name || '你').slice(0, 20)} 的判断`,
      subtitle: subtitleParts.join(' · ') || '继续追问报告里的下一个判断',
      href: `/result/${latest.id}`,
      ctaLabel: '继续追问',
    };
  }

  return null;
}
