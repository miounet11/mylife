// v5-D56 (2026-05-21): 用户使用频率 & 留存分析
// 配套核心决策（cycle_anonymous_first_email_followup.md）：
//   匿名优先 → 让用户极致爽用 → 留存 + 频率 = 北极星。
// 数据源：analytics_events（user_id 含 guest_）。
//
// 性能：所有查询统一做 60s TTL memoize，避免 admin 页 5s 内多卡复算。

import { db } from '@/lib/database';

const TTL_MS = 60_000;

type CacheEntry<T> = { value: T; expiresAt: number };
const cache = new Map<string, CacheEntry<unknown>>();

function memoize<T>(key: string, build: () => T): T {
  const now = Date.now();
  const hit = cache.get(key) as CacheEntry<T> | undefined;
  if (hit && hit.expiresAt > now) return hit.value;
  const value = build();
  cache.set(key, { value, expiresAt: now + TTL_MS });
  return value;
}

export function invalidateUsageFrequencyCache() {
  cache.clear();
}

export interface ActiveUsersSnapshot {
  dau: number;       // 过去 1 天 distinct user_id
  wau: number;       // 过去 7 天
  mau: number;       // 过去 30 天
  stickinessDauWau: number; // dau / wau，0-1
  /** 当前 24h 不同 user_id（包含 guest_） */
  unique24h: number;
  /** 当前 24h 不同 session_id（更接近访问量） */
  sessions24h: number;
}

export function getActiveUsersSnapshot(): ActiveUsersSnapshot {
  return memoize('active-users', () => {
    // 把 user_id NULL 兜底为 session_id，让纯访客也计数；guest_xxx 已经是 user_id 的一种
    const row = db.prepare(`
      SELECT
        COUNT(DISTINCT CASE WHEN datetime(created_at) >= datetime('now','-1 day')   THEN COALESCE(NULLIF(user_id,''), session_id) END) AS dau,
        COUNT(DISTINCT CASE WHEN datetime(created_at) >= datetime('now','-7 days')  THEN COALESCE(NULLIF(user_id,''), session_id) END) AS wau,
        COUNT(DISTINCT CASE WHEN datetime(created_at) >= datetime('now','-30 days') THEN COALESCE(NULLIF(user_id,''), session_id) END) AS mau,
        COUNT(DISTINCT CASE WHEN datetime(created_at) >= datetime('now','-1 day')   THEN session_id END) AS sessions_24h
      FROM analytics_events
    `).get() as { dau: number; wau: number; mau: number; sessions_24h: number };
    return {
      dau: row.dau || 0,
      wau: row.wau || 0,
      mau: row.mau || 0,
      stickinessDauWau: row.wau ? Number((row.dau / row.wau).toFixed(3)) : 0,
      unique24h: row.dau || 0,
      sessions24h: row.sessions_24h || 0,
    };
  });
}

export interface RetentionBucket {
  cohortDay: string;     // YYYY-MM-DD 注册日（first_seen 日）
  cohortSize: number;
  d1: number;            // 注册后 +1 天回来的人数
  d7: number;
  d30: number;
  d1Rate: number;
  d7Rate: number;
  d30Rate: number;
}

export function getRetentionBuckets(): RetentionBucket[] {
  return memoize('retention-buckets', () => {
    // 过去 45 天每天的新用户队列 + 之后 1/7/30 天的回访
    const rows = db.prepare(`
      WITH user_keys AS (
        SELECT COALESCE(NULLIF(user_id,''), session_id) AS uk,
               date(created_at) AS d
        FROM analytics_events
        WHERE created_at IS NOT NULL
      ),
      first_seen AS (
        SELECT uk, MIN(d) AS cohort_day
        FROM user_keys
        GROUP BY uk
      ),
      activity AS (
        SELECT DISTINCT uk, d FROM user_keys
      ),
      cohorts AS (
        SELECT cohort_day,
               COUNT(*) AS cohort_size,
               SUM(CASE WHEN EXISTS(
                 SELECT 1 FROM activity a
                  WHERE a.uk = first_seen.uk
                    AND a.d = date(first_seen.cohort_day, '+1 day')
               ) THEN 1 ELSE 0 END) AS d1,
               SUM(CASE WHEN EXISTS(
                 SELECT 1 FROM activity a
                  WHERE a.uk = first_seen.uk
                    AND a.d >= date(first_seen.cohort_day, '+7 days')
                    AND a.d <  date(first_seen.cohort_day, '+8 days')
               ) THEN 1 ELSE 0 END) AS d7,
               SUM(CASE WHEN EXISTS(
                 SELECT 1 FROM activity a
                  WHERE a.uk = first_seen.uk
                    AND a.d >= date(first_seen.cohort_day, '+30 days')
                    AND a.d <  date(first_seen.cohort_day, '+31 days')
               ) THEN 1 ELSE 0 END) AS d30
        FROM first_seen
        WHERE cohort_day >= date('now','-45 days')
        GROUP BY cohort_day
      )
      SELECT cohort_day AS cohortDay, cohort_size AS cohortSize, d1, d7, d30
      FROM cohorts
      ORDER BY cohort_day DESC
      LIMIT 30
    `).all() as Array<{ cohortDay: string; cohortSize: number; d1: number; d7: number; d30: number }>;
    return rows.map((row) => ({
      cohortDay: row.cohortDay,
      cohortSize: row.cohortSize,
      d1: row.d1,
      d7: row.d7,
      d30: row.d30,
      d1Rate: row.cohortSize ? Number((row.d1 / row.cohortSize).toFixed(3)) : 0,
      d7Rate: row.cohortSize ? Number((row.d7 / row.cohortSize).toFixed(3)) : 0,
      d30Rate: row.cohortSize ? Number((row.d30 / row.cohortSize).toFixed(3)) : 0,
    }));
  });
}

export interface FrequencyDistribution {
  /** 「访问天数」桶：1 / 2-3 / 4-7 / 8+ */
  oneDay: number;
  twoToThree: number;
  fourToSeven: number;
  eightPlus: number;
  totalUsers30d: number;
}

export function getFrequencyDistribution(): FrequencyDistribution {
  return memoize('frequency-distribution', () => {
    const row = db.prepare(`
      WITH user_days AS (
        SELECT COALESCE(NULLIF(user_id,''), session_id) AS uk,
               date(created_at) AS d
        FROM analytics_events
        WHERE datetime(created_at) >= datetime('now','-30 days')
        GROUP BY uk, d
      ),
      user_counts AS (
        SELECT uk, COUNT(*) AS days_used
        FROM user_days
        GROUP BY uk
      )
      SELECT
        SUM(CASE WHEN days_used = 1 THEN 1 ELSE 0 END) AS one_day,
        SUM(CASE WHEN days_used BETWEEN 2 AND 3 THEN 1 ELSE 0 END) AS two_to_three,
        SUM(CASE WHEN days_used BETWEEN 4 AND 7 THEN 1 ELSE 0 END) AS four_to_seven,
        SUM(CASE WHEN days_used >= 8 THEN 1 ELSE 0 END) AS eight_plus,
        COUNT(*) AS total_users
      FROM user_counts
    `).get() as {
      one_day: number; two_to_three: number; four_to_seven: number; eight_plus: number; total_users: number;
    };
    return {
      oneDay: row.one_day || 0,
      twoToThree: row.two_to_three || 0,
      fourToSeven: row.four_to_seven || 0,
      eightPlus: row.eight_plus || 0,
      totalUsers30d: row.total_users || 0,
    };
  });
}

export interface EmailCaptureFunnel {
  totalUsers30d: number;
  /** 30 天里访问 ≥3 天的用户（「值得请求邮箱」的群体） */
  qualifiedUsers: number;
  /** 这些用户里实际有邮箱的（users 表 email IS NOT NULL） */
  qualifiedWithEmail: number;
  /** 全量用户里有邮箱的 */
  totalWithEmail: number;
  qualifiedEmailRate: number;
}

export function getEmailCaptureFunnel(): EmailCaptureFunnel {
  return memoize('email-capture', () => {
    const row = db.prepare(`
      WITH user_days AS (
        SELECT COALESCE(NULLIF(ae.user_id,''), ae.session_id) AS uk,
               date(ae.created_at) AS d,
               ae.user_id
        FROM analytics_events ae
        WHERE datetime(ae.created_at) >= datetime('now','-30 days')
        GROUP BY uk, d
      ),
      user_counts AS (
        SELECT uk, MAX(user_id) AS user_id, COUNT(*) AS days_used
        FROM user_days
        GROUP BY uk
      )
      SELECT
        COUNT(*) AS total_users,
        SUM(CASE WHEN days_used >= 3 THEN 1 ELSE 0 END) AS qualified,
        SUM(CASE WHEN days_used >= 3 AND u.email IS NOT NULL AND trim(u.email) <> '' THEN 1 ELSE 0 END) AS qualified_with_email,
        SUM(CASE WHEN u.email IS NOT NULL AND trim(u.email) <> '' THEN 1 ELSE 0 END) AS total_with_email
      FROM user_counts uc
      LEFT JOIN users u ON u.id = uc.user_id
    `).get() as {
      total_users: number; qualified: number; qualified_with_email: number; total_with_email: number;
    };
    const qualified = row.qualified || 0;
    return {
      totalUsers30d: row.total_users || 0,
      qualifiedUsers: qualified,
      qualifiedWithEmail: row.qualified_with_email || 0,
      totalWithEmail: row.total_with_email || 0,
      qualifiedEmailRate: qualified ? Number(((row.qualified_with_email || 0) / qualified).toFixed(3)) : 0,
    };
  });
}

export interface UsageFrequencyDashboard {
  active: ActiveUsersSnapshot;
  frequency: FrequencyDistribution;
  retention: RetentionBucket[];
  emailFunnel: EmailCaptureFunnel;
}

export function getUsageFrequencyDashboard(): UsageFrequencyDashboard {
  return {
    active: getActiveUsersSnapshot(),
    frequency: getFrequencyDistribution(),
    retention: getRetentionBuckets(),
    emailFunnel: getEmailCaptureFunnel(),
  };
}
