// 内存速率限制器（无外部依赖）

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// 定期清理过期条目（每5分钟），.unref() 确保不阻止进程退出
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (entry.resetAt < now) store.delete(key);
  }
}, 5 * 60 * 1000).unref();

export interface RateLimitConfig {
  windowMs: number;   // 时间窗口（毫秒）
  maxRequests: number; // 最大请求数
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * 检查速率限制
 * @param key 限流键（通常是 IP 或 userId）
 * @param config 限流配置
 */
export function checkRateLimit(key: string, config: RateLimitConfig): RateLimitResult {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || entry.resetAt < now) {
    // 新窗口
    store.set(key, { count: 1, resetAt: now + config.windowMs });
    return { allowed: true, remaining: config.maxRequests - 1, resetAt: now + config.windowMs };
  }

  if (entry.count >= config.maxRequests) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count++;
  return { allowed: true, remaining: config.maxRequests - entry.count, resetAt: entry.resetAt };
}

// 预定义限流配置
export const RATE_LIMITS = {
  // 命理分析：每分钟5次
  analyze: { windowMs: 60 * 1000, maxRequests: 5 },
  // AI 聊天：每分钟10次
  chat: { windowMs: 60 * 1000, maxRequests: 10 },
  // 通用 API：每分钟30次
  general: { windowMs: 60 * 1000, maxRequests: 30 },
} as const;

/**
 * 从请求中提取客户端标识
 */
export function getClientKey(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded?.split(',')[0]?.trim() || 'unknown';
  return ip;
}
