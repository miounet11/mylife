/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: '/home/life-kline-next',
  distDir: process.env.NEXT_DIST_DIR || '.next',
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
    // 现在 PM2 横向 3 实例（v5-D83）已分担负载，每实例放开多核 worker 让 SSR/RSC 编译并行。
    workerThreads: false,
    optimizePackageImports: ['lucide-react']
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [...(config.externals || []), 'lunar-javascript', 'better-sqlite3'];
    }
    return config;
  },
}

module.exports = nextConfig
