// 工具函数 - className合并
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// 日期格式化
export function formatDate(date: Date): string {
  if (Number.isNaN(date.getTime())) {
    return '--';
  }

  return formatLocalDateKey(date);
}

export function formatLocalDateKey(date: Date): string {
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export function formatDateTime(date: Date): string {
  if (Number.isNaN(date.getTime())) {
    return '--';
  }

  return `${formatDate(date)} ${formatTime(date)}`;
}

export function formatTime(date: Date): string {
  if (Number.isNaN(date.getTime())) {
    return '--:--';
  }

  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

export function parseLocalDate(value?: string): Date | null {
  if (!value) {
    return null;
  }

  const matched = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (matched) {
    const year = Number(matched[1]);
    const month = Number(matched[2]);
    const day = Number(matched[3]);
    const parsed = new Date(year, month - 1, day);

    if (
      Number.isNaN(parsed.getTime()) ||
      parsed.getFullYear() !== year ||
      parsed.getMonth() !== month - 1 ||
      parsed.getDate() !== day
    ) {
      return null;
    }

    return parsed;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function getTodayLocalDateKey(now = new Date()): string {
  return formatLocalDateKey(now);
}

export function getCurrentLocalMonthKey(now = new Date()): string {
  const dateKey = formatLocalDateKey(now);
  return dateKey ? dateKey.slice(0, 7) : '';
}

// 延迟函数
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export type AbortControllerRef = {
  current: AbortController | null;
};

export type FetchJsonWithTimeoutOptions = Omit<RequestInit, 'signal'> & {
  timeoutMs: number;
  timeoutReason: string;
  controllerRef?: AbortControllerRef;
  supersedeReason?: string;
};

export function isAbortLikeError(error: unknown) {
  if (typeof error === 'string') {
    return error.includes('abort') || error.includes('timeout') || error.includes('unmounted') || error.includes('superseded');
  }

  if (typeof DOMException !== 'undefined' && error instanceof DOMException && error.name === 'AbortError') {
    return true;
  }

  if (error instanceof Error) {
    const combined = `${error.name} ${error.message}`.toLowerCase();
    return combined.includes('abort') || combined.includes('timeout') || combined.includes('timed out');
  }

  return false;
}

export function abortControllerRef(controllerRef: AbortControllerRef, reason: string) {
  controllerRef.current?.abort(reason);
  controllerRef.current = null;
}

export async function fetchJsonWithTimeout<T>(
  url: string,
  options: FetchJsonWithTimeoutOptions,
) {
  const {
    timeoutMs,
    timeoutReason,
    controllerRef,
    supersedeReason = 'request-superseded',
    ...requestOptions
  } = options;

  controllerRef?.current?.abort(supersedeReason);

  const controller = new AbortController();
  if (controllerRef) {
    controllerRef.current = controller;
  }

  const timeoutId = setTimeout(() => {
    controller.abort(timeoutReason);
  }, timeoutMs);

  try {
    const response = await fetch(url, {
      ...requestOptions,
      signal: controller.signal,
    });
    const data = (await response.json()) as T;
    return { response, data };
  } catch (error) {
    if (controller.signal.aborted && controller.signal.reason) {
      throw controller.signal.reason;
    }

    throw error;
  } finally {
    clearTimeout(timeoutId);
    if (controllerRef?.current === controller) {
      controllerRef.current = null;
    }
  }
}

// 生成唯一ID
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// 数字格式化
export function formatNumber(num: number): string {
  if (num >= 100000000) {
    return `${(num / 100000000).toFixed(1)}亿`;
  }
  if (num >= 10000) {
    return `${(num / 10000).toFixed(1)}万`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}千`;
  }
  return num.toString();
}

// 百分比格式化
export function formatPercent(num: number): string {
  return `${(num * 100).toFixed(1)}%`;
}

// 截断文本
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

// 验证邮箱
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// 验证手机号
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^1[3-9]\d{9}$/;
  return phoneRegex.test(phone);
}

// 计算年龄
export function calculateAge(birthDate: Date): number {
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

// 获取天干
export function getGan(zhi: string): string {
  const ganMap: Record<string, string> = {
    '子': '壬', '丑': '癸', '寅': '壬', '卯': '壬',
    '辰': '甲', '巳': '甲', '午': '丙', '未': '丙',
    '申': '庚', '酉': '庚', '戌': '戊', '亥': '戊',
  };
  return ganMap[zhi] || '';
}

// 获取地支
export function getZhi(gan: string): string {
  const zhiMap: Record<string, string> = {
    '甲': '子', '乙': '丑', '丙': '寅', '丁': '卯',
    '戊': '辰', '己': '巳', '庚': '午', '辛': '未',
    '壬': '申', '癸': '酉',
  };
  return zhiMap[gan] || '';
}

// 获取五行
export function getWuxing(char: string): 'wood' | 'fire' | 'earth' | 'metal' | 'water' {
  const wuxingMap: Record<string, 'wood' | 'fire' | 'earth' | 'metal' | 'water'> = {
    '甲': 'wood', '乙': 'wood', '丙': 'fire', '丁': 'fire',
    '戊': 'earth', '己': 'earth', '庚': 'metal', '辛': 'metal',
    '壬': 'water', '癸': 'water',
    '子': 'water', '丑': 'earth', '寅': 'wood', '卯': 'wood',
    '辰': 'earth', '巳': 'fire', '午': 'fire', '未': 'earth',
    '申': 'metal', '酉': 'metal', '戌': 'earth', '亥': 'water',
  };
  return wuxingMap[char] || 'earth';
}

// 获取纳音
export function getNayin(gan: string, zhi: string): string {
  const nayinMap: Record<string, string> = {
    '甲子': '海中金', '乙丑': '海中金', '丙寅': '炉中火',
    '丁卯': '炉中火', '戊辰': '大驿土', '己巳': '大驿土',
    '庚午': '路旁土', '辛未': '路旁土', '壬申': '剑锋金',
    '癸酉': '剑锋金', '甲戌': '山头火', '乙亥': '山头火',
    '丙子': '涧下水', '丁丑': '涧下水', '戊寅': '城头土',
    '己卯': '城头土', '庚辰': '白蜡金', '辛巳': '白蜡金',
    '壬午': '杨柳木', '癸未': '杨柳木', '甲申': '石榴木',
    '乙酉': '石榴木', '丙戌': '大驿土', '丁亥': '大驿土',
  };
  return nayinMap[`${gan}${zhi}`] || '';
}

// 获取颜色
export function getWuxingColor(wuxing: string): string {
  const colorMap: Record<string, string> = {
    wood: 'bg-green-500 text-green-600 border-green-600',
    fire: 'bg-red-500 text-red-600 border-red-600',
    earth: 'bg-yellow-500 text-yellow-600 border-yellow-600',
    metal: 'bg-gray-400 text-gray-500 border-gray-500',
    water: 'bg-blue-500 text-blue-600 border-blue-600',
  };
  return colorMap[wuxing] || 'bg-gray-400';
}

// 获取图标
export function getWuxingIcon(wuxing: string): string {
  const iconMap: Record<string, string> = {
    wood: '🌳',
    fire: '🔥',
    earth: '🌍',
    metal: '⛏️',
    water: '💧',
  };
  return iconMap[wuxing] || '🌍';
}

// 复制到剪贴板
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('复制失败:', error);
    return false;
  }
}

// 下载文件
export function downloadFile(data: string, filename: string, type: string = 'text/plain') {
  const blob = new Blob([data], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// 本地存储
export const localStorage = {
  get: (key: string) => {
    if (typeof window === 'undefined') return null;
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  },
  set: (key: string, value: any) => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(key, JSON.stringify(value));
  },
  remove: (key: string) => {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem(key);
  },
  clear: () => {
    if (typeof window === 'undefined') return;
    window.localStorage.clear();
  },
};

// Session storage
export const sessionStorage = {
  get: (key: string) => {
    if (typeof window === 'undefined') return null;
    const item = window.sessionStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  },
  set: (key: string, value: any) => {
    if (typeof window === 'undefined') return;
    window.sessionStorage.setItem(key, JSON.stringify(value));
  },
  remove: (key: string) => {
    if (typeof window === 'undefined') return;
    window.sessionStorage.removeItem(key);
  },
  clear: () => {
    if (typeof window === 'undefined') return;
    window.sessionStorage.clear();
  },
};

/**
 * BoundedSizeCache - Production stability guard (highest-dimension fix).
 * Prevents unbounded in-memory growth that triggers Next IncrementalCache "maxSize" errors,
 * heap bloat on web instances, and event-loop stalls during content/LLM work.
 *
 * Used for: content-ops snapshots, world-yi publication ledgers, generator outputs, agentic results.
 * Default caps keep individual snapshots <4-8MB and entry counts low.
 * Eviction: TTL + size-based LRU (oldest first) + entry count cap.
 *
 * IMPORTANT: Server-side only. Do not import in client components.
 * Usage:
 *   import { BoundedSizeCache, contentSnapshotCache } from '@/lib/utils';
 *   const key = `snapshot-${Date.now()}`;
 *   let snap = contentSnapshotCache.get(key);
 *   if (!snap) { snap = expensiveBuild(); contentSnapshotCache.set(key, snap, roughSize); }
 */
export interface BoundedCacheOptions {
  maxSizeBytes?: number;
  maxEntries?: number;
  ttlMs?: number;
}

export class BoundedSizeCache<T> {
  private store = new Map<string, { value: T; size: number; expiresAt: number }>();
  private currentSize = 0;
  private readonly maxSize: number;
  private readonly maxEntries: number;
  private readonly ttl: number;

  constructor(opts: BoundedCacheOptions = {}) {
    this.maxSize = opts.maxSizeBytes ?? 8 * 1024 * 1024; // 8MB hard cap per cache instance
    this.maxEntries = opts.maxEntries ?? 200;
    this.ttl = opts.ttlMs ?? 3 * 60 * 1000; // 3min default short TTL for heavy objects
  }

  private evictExpired() {
    const now = Date.now();
    for (const [k, v] of this.store) {
      if (v.expiresAt < now) {
        this.currentSize -= v.size;
        this.store.delete(k);
      }
    }
  }

  private evictIfNeeded(neededBytes: number) {
    this.evictExpired();
    while (
      (this.currentSize + neededBytes > this.maxSize || this.store.size >= this.maxEntries) &&
      this.store.size > 0
    ) {
      // Evict oldest (Map preserves insertion order)
      const firstKey = this.store.keys().next().value as string | undefined;
      if (!firstKey) break;
      const entry = this.store.get(firstKey);
      if (entry) {
        this.currentSize -= entry.size;
        this.store.delete(firstKey);
      }
    }
  }

  set(key: string, value: T, estimatedSizeBytes?: number): void {
    // Rough size: prefer caller estimate; fallback to JSON (expensive but only on set path)
    let size = estimatedSizeBytes;
    if (size == null) {
      try {
        size = Buffer.byteLength(JSON.stringify(value), 'utf8');
      } catch {
        size = 1024; // conservative fallback
      }
    }
    this.evictIfNeeded(size);

    const expiresAt = Date.now() + this.ttl;
    const old = this.store.get(key);
    if (old) {
      this.currentSize -= old.size;
    }
    this.store.set(key, { value, size, expiresAt });
    this.currentSize += size;
  }

  get(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (entry.expiresAt < Date.now()) {
      this.currentSize -= entry.size;
      this.store.delete(key);
      return undefined;
    }
    return entry.value;
  }

  getStats() {
    this.evictExpired();
    return {
      entries: this.store.size,
      approxBytes: this.currentSize,
      maxBytes: this.maxSize,
      maxEntries: this.maxEntries,
      utilization: this.maxSize > 0 ? Math.round((this.currentSize / this.maxSize) * 1000) / 10 : 0,
    };
  }

  clear(): void {
    this.store.clear();
    this.currentSize = 0;
  }

  // For stability-monitor / metrics
  getMemoryPressure(): number {
    this.evictExpired();
    return this.maxSize > 0 ? this.currentSize / this.maxSize : 0;
  }
}

// Shared singleton for content snapshot / scheduler state (used across ops + admin surfaces)
export const contentSnapshotCache = new BoundedSizeCache<any>({
  maxSizeBytes: 6 * 1024 * 1024, // ~6MB cap - protects against full 4000+ entry graphs
  maxEntries: 12,
  ttlMs: 90 * 1000, // 90s - long enough for admin polling, short for heavy campaigns
});

// Shared for world-yi publication mechanism snapshots (ledgers can be large)
export const worldYiPublicationCache = new BoundedSizeCache<any>({
  maxSizeBytes: 4 * 1024 * 1024,
  maxEntries: 8,
  ttlMs: 60 * 1000,
});

// Shared for agentic / generator intermediate large outputs (before DB persist)
export const heavyGenerationCache = new BoundedSizeCache<any>({
  maxSizeBytes: 12 * 1024 * 1024, // allow bigger for LLM structured results during worker runs
  maxEntries: 30,
  ttlMs: 4 * 60 * 1000,
});
