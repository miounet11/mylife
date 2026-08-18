/** Client-safe inbox helpers and view types. No Node/fs. */

export type OpsInboxSnapshot = {
  generatedAt: string;
  feedback: {
    total: number;
    unread: number;
    lastAt: string | null;
    lastFreeformAt: string | null;
    lastFreeformPreview: string | null;
    last24h: number;
    last7d: number;
    freeformNew: number;
    byKind: Record<string, number>;
  };
  errors: {
    total: number;
    last24h: number;
    lastAt: string | null;
    groups: Array<{
      key: string;
      label: string;
      count: number;
      lastAt: string;
      sampleRoute: string | null;
      sampleMessage: string;
    }>;
  };
  cohort: {
    total: number;
    last24h: number;
    lastAt: string | null;
    byVerdict: Record<string, number>;
    byLens: Array<{ lensId: string; count: number }>;
  };
};

export function formatInboxAge(iso: string | null | undefined): string {
  if (!iso) return '尚无记录';
  const at = Date.parse(iso);
  if (!Number.isFinite(at)) return '尚无记录';
  const hours = Math.max(0, (Date.now() - at) / 36e5);
  if (hours < 1) return '不到 1 小时前';
  if (hours < 24) return `${Math.round(hours)} 小时前`;
  return `${Math.round(hours / 24)} 天前`;
}
