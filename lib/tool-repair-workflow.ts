import fs from 'fs';
import path from 'path';

export type ToolRepairStatus = 'todo' | 'in_progress' | 'verified';

export interface ToolRepairMetricsSnapshot {
  detailViews: number;
  ctaStartRate: number;
  ctaToRunRate: number;
  runFailureRate: number;
  premiumRate: number;
}

export interface ToolRepairCandidate {
  slug: string;
  title: string;
  pagePath: string;
  priorityScore: number;
  gapType?: string | null;
  metrics: ToolRepairMetricsSnapshot;
}

export interface ToolRepairWorkflowItem {
  slug: string;
  title: string;
  pagePath: string;
  status: ToolRepairStatus;
  owner: string;
  notes: string;
  priorityScore: number;
  gapType: string | null;
  createdAt: string;
  updatedAt: string;
  baseline: ToolRepairMetricsSnapshot;
  latest: ToolRepairMetricsSnapshot;
  delta: ToolRepairMetricsSnapshot;
}

interface ToolRepairWorkflowStorage {
  items: ToolRepairWorkflowItem[];
}

const runtimeDir = path.join(process.cwd(), 'data', 'runtime');
const workflowPath = path.join(runtimeDir, 'tool-repair-workflow.json');

function ensureRuntimeDir() {
  if (!fs.existsSync(runtimeDir)) {
    fs.mkdirSync(runtimeDir, { recursive: true });
  }
}

function emptyStorage(): ToolRepairWorkflowStorage {
  return { items: [] };
}

function readStorage(): ToolRepairWorkflowStorage {
  try {
    if (!fs.existsSync(workflowPath)) {
      return emptyStorage();
    }
    const raw = fs.readFileSync(workflowPath, 'utf8');
    if (!raw.trim()) {
      return emptyStorage();
    }
    const parsed = JSON.parse(raw) as ToolRepairWorkflowStorage;
    return Array.isArray(parsed.items) ? parsed : emptyStorage();
  } catch {
    return emptyStorage();
  }
}

function writeStorage(storage: ToolRepairWorkflowStorage) {
  ensureRuntimeDir();
  fs.writeFileSync(workflowPath, JSON.stringify(storage, null, 2), 'utf8');
}

function clampRate(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(-100, Math.min(100, Math.round(value)));
}

function sanitizeMetrics(metrics: ToolRepairMetricsSnapshot): ToolRepairMetricsSnapshot {
  return {
    detailViews: Math.max(0, Math.round(metrics.detailViews || 0)),
    ctaStartRate: clampRate(metrics.ctaStartRate || 0),
    ctaToRunRate: clampRate(metrics.ctaToRunRate || 0),
    runFailureRate: clampRate(metrics.runFailureRate || 0),
    premiumRate: clampRate(metrics.premiumRate || 0),
  };
}

function computeDelta(
  baseline: ToolRepairMetricsSnapshot,
  latest: ToolRepairMetricsSnapshot,
): ToolRepairMetricsSnapshot {
  return {
    detailViews: latest.detailViews - baseline.detailViews,
    ctaStartRate: latest.ctaStartRate - baseline.ctaStartRate,
    ctaToRunRate: latest.ctaToRunRate - baseline.ctaToRunRate,
    runFailureRate: latest.runFailureRate - baseline.runFailureRate,
    premiumRate: latest.premiumRate - baseline.premiumRate,
  };
}

function toWorkflowItem(candidate: ToolRepairCandidate): ToolRepairWorkflowItem {
  const now = new Date().toISOString();
  const baseline = sanitizeMetrics(candidate.metrics);
  return {
    slug: candidate.slug,
    title: candidate.title,
    pagePath: candidate.pagePath,
    status: 'todo',
    owner: '',
    notes: '',
    priorityScore: Math.max(0, Math.round(candidate.priorityScore || 0)),
    gapType: candidate.gapType || null,
    createdAt: now,
    updatedAt: now,
    baseline,
    latest: baseline,
    delta: {
      detailViews: 0,
      ctaStartRate: 0,
      ctaToRunRate: 0,
      runFailureRate: 0,
      premiumRate: 0,
    },
  };
}

export function syncToolRepairWorkflow(candidates: ToolRepairCandidate[]) {
  const storage = readStorage();
  const bySlug = new Map(storage.items.map((item) => [item.slug, item]));
  let changed = false;

  for (const candidate of candidates) {
    if (!candidate.slug) continue;
    const existing = bySlug.get(candidate.slug);
    const latest = sanitizeMetrics(candidate.metrics);
    if (!existing) {
      const created = toWorkflowItem(candidate);
      storage.items.push(created);
      bySlug.set(created.slug, created);
      changed = true;
      continue;
    }

    const delta = computeDelta(existing.baseline, latest);
    const nextItem: ToolRepairWorkflowItem = {
      ...existing,
      title: candidate.title || existing.title,
      pagePath: candidate.pagePath || existing.pagePath,
      priorityScore: Math.max(0, Math.round(candidate.priorityScore || existing.priorityScore)),
      gapType: candidate.gapType || existing.gapType || null,
      latest,
      delta,
    };
    bySlug.set(nextItem.slug, nextItem);
    changed = true;
  }

  if (changed) {
    storage.items = Array.from(bySlug.values());
    writeStorage(storage);
  }

  return storage.items
    .sort((left, right) => right.priorityScore - left.priorityScore || right.latest.detailViews - left.latest.detailViews)
    .slice(0, 30);
}

export function listToolRepairWorkflow() {
  const storage = readStorage();
  return storage.items
    .sort((left, right) => right.priorityScore - left.priorityScore || right.latest.detailViews - left.latest.detailViews)
    .slice(0, 30);
}

export function updateToolRepairWorkflow(input: {
  slug: string;
  status?: ToolRepairStatus;
  owner?: string;
  notes?: string;
}) {
  const storage = readStorage();
  const targetIndex = storage.items.findIndex((item) => item.slug === input.slug);
  if (targetIndex < 0) {
    return null;
  }

  const now = new Date().toISOString();
  const current = storage.items[targetIndex];
  const next: ToolRepairWorkflowItem = {
    ...current,
    status: input.status || current.status,
    owner: typeof input.owner === 'string' ? input.owner.trim() : current.owner,
    notes: typeof input.notes === 'string' ? input.notes.trim() : current.notes,
    updatedAt: now,
  };

  if (input.status === 'verified') {
    // Freeze latest performance as the new baseline when marked verified.
    next.baseline = { ...next.latest };
    next.delta = {
      detailViews: 0,
      ctaStartRate: 0,
      ctaToRunRate: 0,
      runFailureRate: 0,
      premiumRate: 0,
    };
  }

  storage.items[targetIndex] = next;
  writeStorage(storage);
  return next;
}
