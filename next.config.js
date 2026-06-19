/** @type {import('next').NextConfig} */
const nextBuildWorkers = Number.parseInt(`${process.env.NEXT_BUILD_WORKERS || ''}`, 10);
const lowMemoryWorkerConfig = Number.isInteger(nextBuildWorkers) && nextBuildWorkers > 0
  ? {
      cpus: nextBuildWorkers,
      workerThreads: false,
    }
  : {};

const nextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: '/home/life-kline-next',
  distDir: process.env.NEXT_DIST_DIR || '.next',
  generateBuildId: () => {
    const buildIdOverride = `${process.env.NEXT_BUILD_ID_OVERRIDE || ''}`.trim();
    return buildIdOverride || null;
  },
  env: {
    NEXT_PUBLIC_BUILD_ID: `${process.env.NEXT_BUILD_ID_OVERRIDE || ''}`.trim(),
  },
  // v5-D119 (2026-05-25): 内容矩阵爆炸（4247 篇 knowledge + 200+ docs/topic）
  // 后部分页 SSG 单页 >60s，3 次重试全挂；放宽到 180s 让重型聚合页过线。
  staticPageGenerationTimeout: 180,
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          }
        ],
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'life-kline.com',
      }
    ],
    formats: ['image/avif', 'image/webp'],
  },
  experimental: {
    // v5-D84 (2026-05-24): 之前 cpus:1 是单 fork 时代为了不抢 LLM 链路 CPU 的妥协。
    // 现在 PM2 横向 3 实例（v5-D83）已分担负载，每实例默认放开多核 worker 让 SSR/RSC 编译并行。
    // 低内存服务器构建时用 NEXT_BUILD_WORKERS=1 或 LOW_MEMORY_BUILD=1 限制并发，避免 next build 被 OOM killer 打死。
    workerThreads: false,
    ...lowMemoryWorkerConfig,
    optimizePackageImports: ['lucide-react']
  },
  // === Stability Hardening (2026-05-31) ===
  // - Bounded app-level caches (see lib/utils BoundedSizeCache) + page force-dynamic for heavy paths
  //   protect against "Single item size exceeds maxSize" in Next IncrementalCache / fetch-cache.
  // - Heavy content gen (World Yi v2, knowledge synthesis, promote, agentic) MUST run exclusively
  //   on dedicated content-workers (life-kline-content-worker-*) via PM2. Web replicas (3001-3) stay
  //   render-only + light API.
  // - ISR revalidate kept only where safe; bulk publish paths use on-demand reval or dynamic.
  // - DB projections (lightweight list* in content-store) prevent full sections-JSON materialization
  //   on every snapshot/polling call from admin surfaces or health.
  // Verify: pm2 logs life-kline-stability-monitor ; curl http://127.0.0.1:3000/api/admin/system/health
  // Runbook: docs/stability-engineering-plan.md + OPERATIONS.md
  // === end ===
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [...(config.externals || []), 'lunar-javascript', 'better-sqlite3'];
    }
    return config;
  },
}

module.exports = nextConfig
