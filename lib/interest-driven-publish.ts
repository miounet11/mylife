import {
  applyEditorialPillarBalanceBoost,
  buildRecentPillarPublishCounts,
  scoreEditorialMissionFit,
} from '@/lib/content-editorial-mission';
import {
  buildInterestClusterPriorities,
  isBacklogPublishableEntry,
  matchEntryClusters,
  type InterestClusterPriority,
} from '@/lib/content-interest-signals';
import type { ManagedContentEntry } from '@/lib/content-store';

export type InterestDrivenCandidate = {
  entry: ManagedContentEntry;
  clusterKey: string;
  clusterTitle: string;
  score: number;
  reasons: string[];
};

function normalizeTitleKey(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

function buildPublishedTitleKeys(entries: ManagedContentEntry[]) {
  return new Set(
    entries
      .filter((entry) => entry.status === 'published')
      .map((entry) => normalizeTitleKey(entry.title)),
  );
}

function scoreInterestDraft(params: {
  entry: ManagedContentEntry;
  clusterPriority: InterestClusterPriority;
  recentPillarCounts: ReturnType<typeof buildRecentPillarPublishCounts>;
  now: Date;
}) {
  const { entry, clusterPriority, recentPillarCounts, now } = params;
  let score = clusterPriority.priorityScore;
  const reasons = [
    `兴趣主题：${clusterPriority.cluster.title}`,
    `需求分 ${clusterPriority.demandScore}`,
  ];
  const missionFit = scoreEditorialMissionFit(entry);
  score += missionFit.score;
  reasons.push(...missionFit.reasons);

  if (entry.contentType === clusterPriority.cluster.primaryType) {
    score += 24;
    reasons.push(`匹配主类型 ${entry.contentType}`);
  }

  if (clusterPriority.signal > 0) {
    score += Math.min(clusterPriority.signal * 3, 48);
    reasons.push(`近 30 天用户信号 ${clusterPriority.signal}`);
  }

  if (clusterPriority.publishedCount === 0) {
    score += 30;
    reasons.push('该主题尚无已发布内容');
  } else if (clusterPriority.publishedCount < 3) {
    score += 12;
    reasons.push(`该主题已发布 ${clusterPriority.publishedCount} 篇，仍可补充`);
  }

  const updatedAt = Date.parse(entry.updatedAt || '');
  if (Number.isFinite(updatedAt)) {
    const ageHours = Math.max(0, (now.getTime() - updatedAt) / 3_600_000);
    const freshnessBoost = Math.max(0, 72 - ageHours);
    score += freshnessBoost;
    reasons.push(`稿龄加权 +${Math.round(freshnessBoost)}`);
  }

  const tagBoost = Math.min(entry.tags.length * 2, 16);
  score += tagBoost;

  const balanced = applyEditorialPillarBalanceBoost({
    score,
    reasons,
    pillars: missionFit.pillars,
    recentPillarCounts,
  });

  return {
    score: Math.round(balanced.score),
    reasons: balanced.reasons,
  };
}

export function selectInterestDrivenCandidates(params: {
  entries: ManagedContentEntry[];
  clusterSignalBuckets: Record<string, number>;
  limit: number;
  excludeIds?: Set<string>;
  now?: Date;
}): InterestDrivenCandidate[] {
  const now = params.now || new Date();
  const excludeIds = params.excludeIds || new Set<string>();
  const publishedTitleKeys = buildPublishedTitleKeys(params.entries);
  const clusterPriorities = buildInterestClusterPriorities({
    entries: params.entries,
    clusterSignalBuckets: params.clusterSignalBuckets,
  });
  const clusterPriorityByKey = new Map(
    clusterPriorities.map((item) => [item.cluster.key, item]),
  );
  const recentPillarCounts = buildRecentPillarPublishCounts(params.entries);

  const ranked: InterestDrivenCandidate[] = [];

  for (const entry of params.entries) {
    if (entry.status !== 'draft' || excludeIds.has(entry.id)) {
      continue;
    }
    if (!isBacklogPublishableEntry(entry)) {
      continue;
    }

    const titleKey = normalizeTitleKey(entry.title);
    if (publishedTitleKeys.has(titleKey)) {
      continue;
    }

    const matchedClusters = matchEntryClusters(entry);
    if (matchedClusters.length === 0) {
      continue;
    }

    const bestCluster = matchedClusters
      .map((cluster) => clusterPriorityByKey.get(cluster.key))
      .filter((item): item is InterestClusterPriority => !!item)
      .sort((left, right) => right.priorityScore - left.priorityScore)[0];

    if (!bestCluster) {
      continue;
    }

    const scored = scoreInterestDraft({
      entry,
      clusterPriority: bestCluster,
      recentPillarCounts,
      now,
    });

    ranked.push({
      entry,
      clusterKey: bestCluster.cluster.key,
      clusterTitle: bestCluster.cluster.title,
      score: scored.score,
      reasons: scored.reasons,
    });
  }

  return ranked
    .sort((left, right) => right.score - left.score || right.entry.updatedAt.localeCompare(left.entry.updatedAt))
    .slice(0, Math.max(0, params.limit));
}