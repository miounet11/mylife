# 🔧 技术重构详细方案 - Next.js 14 迁移指南

> 基于现有项目 /home/mylifek 的完整迁移指南

---

## 📦 1. 项目初始化

### 1.1 创建Next.js项目

```bash
# SSH到服务器
ssh root@167.160.188.70

# 进入项目目录
cd /home

# 创建Next.js项目
npx create-next-app@latest life-kline-next \
  --typescript \
  --tailwind \
  --app \
  --src-dir \
  --import-alias "@/*"

# 进入新项目
cd life-kline-next

# 安装依赖
npm install framer-motion recharts
npm install lunar-japanese iztro
npm install better-sqlite3
npm install qrcode.react html2canvas
npm install lucide-react
npm install ics uuid

# 开发依赖
npm install -D @types/node @types/react @types/react-dom
```

### 1.2 配置Prisma（可选，推荐）

```bash
# 安装Prisma
npm install prisma @prisma/client
npx prisma init

# 创建schema
```

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = "file:./lifekline.db"
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  fortunes  Fortune[]
}

model Fortune {
  id        String   @id @default(cuid())
  name      String
  birthDate DateTime
  data      Json
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

---

## 📂 2. 目录结构迁移

### 2.1 新项目结构

```
life-kline-next/
├── app/
│   ├── layout.tsx              # 根布局
│   ├── page.tsx               # 首页
│   ├── globals.css            # 全局样式
│   ├── fortune/              # 命理相关页面
│   │   ├── page.tsx         # 命理首页
│   │   ├── analyze/         # 分析页面
│   │   │   └── page.tsx
│   │   ├── result/          # 结果页面
│   │   │   └── [id]/
│   │   │       └── page.tsx
│   │   └── history/        # 历史记录
│   │       └── page.tsx
│   ├── about/               # 关于页面
│   │   └── page.tsx
│   ├── api/                # API路由
│   │   ├── analyze/
│   │   │   └── route.ts    # 命理分析API
│   │   ├── fortune/
│   │   │   └── route.ts    # 命理数据API
│   │   └── user/
│   │       └── route.ts    # 用户API
│   ├── sitemap.ts          # 动态Sitemap
│   ├── robots.ts           # Robots.txt
│   └── loading.tsx        # 全局加载组件
├── components/            # 可复用组件
│   ├── ui/               # UI组件
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   └── Card.tsx
│   ├── fortune/          # 命理组件
│   │   ├── FortuneForm.tsx
│   │   ├── FortuneChart.tsx
│   │   └── FortuneResult.tsx
│   └── layout/          # 布局组件
│       ├── Header.tsx
│       ├── Footer.tsx
│       └── Navigation.tsx
├── lib/                  # 工具函数
│   ├── fortuneEngine.ts  # 命理计算引擎
│   ├── lunar.ts         # 农历工具
│   ├── database.ts      # 数据库工具
│   └── utils.ts        # 通用工具
├── prisma/              # Prisma配置
│   └── schema.prisma
├── public/              # 静态资源
│   ├── images/
│   ├── icons/
│   └── favicon.png
├── types/               # TypeScript类型
│   ├── fortune.ts
│   └── api.ts
└── next.config.mjs      # Next.js配置
```

---

## 🔄 3. 核心组件迁移

### 3.1 根布局 (app/layout.tsx)

```tsx
import './globals.css';
import { Inter } from 'next/font/google';
import { Metadata } from 'next';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Suspense } from 'react';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: {
    default: '人生K线 | 八字命理可视化',
    template: '%s | 人生K线',
  },
  description: 'AI驱动的八字命理分析平台，将传统命理与现代数据可视化结合',
  keywords: ['八字', '命理', '算命', '紫微斗数', '运势'],
  authors: [{ name: '人生K线' }],
  creator: '人生K线',
  openGraph: {
    type: 'website',
    locale: 'zh_CN',
    url: 'https://life-kline.com',
    siteName: '人生K线',
    title: '人生K线 | 八字命理可视化',
    description: 'AI驱动的八字命理分析平台',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: '人生K线',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: '人生K线 | 八字命理可视化',
    description: 'AI驱动的八字命理分析平台',
    images: ['/twitter-image.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: '/favicon.png',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" className={inter.variable}>
      <body className="font-sans antialiased">
        <div className="flex min-h-screen flex-col">
          <Header />
          <main className="flex-1">
            <Suspense fallback={<LoadingSkeleton />}>
              {children}
            </Suspense>
          </main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
```

### 3.2 首页 (app/page.tsx)

```tsx
import { Metadata } from 'next';
import dynamic from 'next/dynamic';

// 动态导入以减少首屏加载
const FortuneForm = dynamic(() => import('@/components/fortune/FortuneForm'), {
  loading: () => <FormSkeleton />,
  ssr: false,
});

const FortuneFeatures = dynamic(
  () => import('@/components/fortune/FortuneFeatures'),
  {
    loading: () => <FeaturesSkeleton />,
  }
);

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <h1 className="mb-4 text-5xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
          人生K线
        </h1>
        <p className="mb-8 text-xl text-gray-700">
          AI驱动的八字命理分析平台
        </p>
        <FortuneForm />
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <FortuneFeatures />
      </section>
    </div>
  );
}

// Loading Skeletons
function FormSkeleton() {
  return (
    <div className="mx-auto max-w-md space-y-4">
      <div className="h-12 animate-pulse rounded bg-gray-200" />
      <div className="h-12 animate-pulse rounded bg-gray-200" />
      <div className="h-12 animate-pulse rounded bg-gray-200" />
    </div>
  );
}

function FeaturesSkeleton() {
  return (
    <div className="grid gap-8 md:grid-cols-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-64 animate-pulse rounded bg-gray-200" />
      ))}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-purple-600 border-t-transparent" />
    </div>
  );
}
```

### 3.3 命理表单组件 (components/fortune/FortuneForm.tsx)

```tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

interface FortuneFormData {
  name: string;
  gender: 'male' | 'female';
  birthDate: string;
  birthTime: string;
}

export default function FortuneForm() {
  const [formData, setFormData] = useState<FortuneFormData>({
    name: '',
    gender: 'male',
    birthDate: '',
    birthTime: '',
  });

  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.id) {
        router.push(`/fortune/result/${result.id}`);
      }
    } catch (error) {
      console.error('分析失败:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto max-w-md rounded-lg bg-white p-8 shadow-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    姓名
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full rounded-lg border px-4 py-2"
                    placeholder="请输入您的姓名"
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    性别
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        gender: e.target.value as 'male' | 'female',
                      })
                    }
                    className="w-full rounded-lg border px-4 py-2"
                    required
                  >
                    <option value="male">男</option>
                    <option value="female">女</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    出生日期
                  </label>
                  <input
                    type="date"
                    value={formData.birthDate}
                    onChange={(e) =>
                      setFormData({ ...formData, birthDate: e.target.value })
                    }
                    className="w-full rounded-lg border px-4 py-2"
                    required
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={() => setStep(2)}
                className="w-full rounded-lg bg-purple-600 py-3 text-white transition hover:bg-purple-700"
              >
                下一步
              </button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  出生时间
                </label>
                <input
                  type="time"
                  value={formData.birthTime}
                  onChange={(e) =>
                    setFormData({ ...formData, birthTime: e.target.value })
                  }
                  className="w-full rounded-lg border px-4 py-2"
                  required
                />
              </div>

              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 rounded-lg border py-3 text-gray-700 transition hover:bg-gray-50"
                >
                  上一步
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 rounded-lg bg-purple-600 py-3 text-white transition hover:bg-purple-700 disabled:opacity-50"
                >
                  {loading ? '分析中...' : '开始分析'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </form>
    </motion.div>
  );
}
```

---

## 🔌 4. API路由迁移

### 4.1 命理分析API (app/api/analyze/route.ts)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { analyzeFortune } from '@/lib/fortuneEngine';
import { saveFortuneResult } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    // 验证数据
    if (!data.name || !data.birthDate) {
      return NextResponse.json(
        { error: '缺少必要参数' },
        { status: 400 }
      );
    }

    // 分析命理
    const result = await analyzeFortune(data);

    // 保存结果
    const savedResult = await saveFortuneResult(result);

    return NextResponse.json({
      id: savedResult.id,
      success: true,
      result,
    });
  } catch (error) {
    console.error('[API] 分析失败:', error);
    return NextResponse.json(
      { error: '分析失败，请稍后重试' },
      { status: 500 }
    );
  }
}

// 添加缓存
export const dynamic = 'force-dynamic';
```

### 4.2 命理数据API (app/api/fortune/[id]/route.ts)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getFortuneById } from '@/lib/database';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const fortune = await getFortuneById(params.id);

    if (!fortune) {
      return NextResponse.json(
        { error: '未找到命理分析' },
        { status: 404 }
      );
    }

    return NextResponse.json(fortune);
  } catch (error) {
    console.error('[API] 获取失败:', error);
    return NextResponse.json(
      { error: '获取失败' },
      { status: 500 }
    );
  }
}

// 启用缓存
export const revalidate = 3600; // 1小时
```

---

## 🎨 5. 样式迁移

### 5.1 全局样式 (app/globals.css)

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --foreground-rgb: 0, 0, 0;
  --background-start-rgb: 214, 219, 220;
  --background-end-rgb: 255, 255, 255;
  --primary: #663399;
  --secondary: #6366f1;
}

@media (prefers-color-scheme: dark) {
  :root {
    --foreground-rgb: 255, 255, 255;
    --background-start-rgb: 0, 0, 0;
    --background-end-rgb: 0, 0, 0;
  }
}

body {
  color: rgb(var(--foreground-rgb));
  background: linear-gradient(
      to bottom,
      transparent,
      rgb(var(--background-end-rgb))
    )
    rgb(var(--background-start-rgb));
}

/* 自定义滚动条 */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
}

::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #555;
}

/* 打印样式 */
@media print {
  .no-print {
    display: none !important;
  }
}
```

---

## 🚀 6. 部署配置

### 6.1 Next.js配置 (next.config.mjs)

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  compress: true,
  poweredByHeader: false,

  images: {
    domains: ['life-kline.com', 'www.life-kline.com'],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
  },

  experimental: {
    serverActions: true,
    optimizePackageImports: ['lucide-react', 'framer-motion'],
  },

  // 性能优化
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // Webpack优化
  webpack: (config) => {
    config.externals.push({
      'utf-8-validate': 'commonjs utf-8-validate',
      'bufferutil': 'commonjs bufferutil',
    });
    return config;
  },
};

export default nextConfig;
```

### 6.2 环境变量 (.env.local)

```env
# 数据库
DATABASE_URL="file:./lifekline.db"

# API密钥
ANTHROPIC_API_KEY=""
GEMINI_API_KEY=""

# NextAuth
NEXTAUTH_URL="https://life-kline.com"
NEXTAUTH_SECRET=""

# 分析
NEXT_PUBLIC_GA_ID="G-XXXXXXXXXX"
```

### 6.3 PM2配置 (ecosystem.config.js)

```javascript
module.exports = {
  apps: [
    {
      name: 'life-kline-next',
      script: 'node_modules/next/dist/bin/next',
      args: 'start',
      cwd: '/home/life-kline-next',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      error_file: '/root/.pm2/logs/life-kline-next-error.log',
      out_file: '/root/.pm2/logs/life-kline-next-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      max_memory_restart: '500M',
      watch: false,
      restart_delay: 4000,
    },
  ],
};
```

### 6.4 Nginx配置 (/etc/nginx/sites-available/life-kline-next)

```nginx
server {
    server_name www.life-kline.com life-kline.com;

    # 日志
    access_log /var/log/nginx/lifekline-next-access.log;
    error_log /var/log/nginx/lifekline-next-error.log;

    # Gzip压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript
               application/javascript application/json application/xml+rss;

    # 静态资源缓存
    location /_next/static/ {
        proxy_pass http://localhost:3000;
        proxy_cache_valid 200 365d;
        add_header X-Cache-Status $upstream_cache_status;
        add_header Cache-Control "public, immutable";
    }

    # 图片缓存
    location /_next/image {
        proxy_pass http://localhost:3000;
        proxy_cache_valid 200 365d;
        add_header X-Cache-Status $upstream_cache_status;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    # API路由
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_connect_timeout 600s;
        proxy_send_timeout 600s;
        proxy_read_timeout 600s;
        proxy_buffering off;
        proxy_set_header Connection '';
        proxy_http_version 1.1;
        chunked_transfer_encoding on;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # 主应用
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # 健康检查
    location /health {
        access_log off;
        return 200 "OK\n";
        add_header Content-Type text/plain;
    }

    # SSL配置
    listen 443 ssl http2;
    ssl_certificate /etc/letsencrypt/live/www.life-kline.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/www.life-kline.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
}

# HTTP重定向
server {
    if ($host = life-kline.com) {
        return 301 https://$host$request_uri;
    }
    if ($host = www.life-kline.com) {
        return 301 https://$host$request_uri;
    }
    listen 80;
    server_name www.life-kline.com life-kline.com;
    return 404;
}
```

---

## 📊 7. 监控和日志

### 7.1 错误监控

```typescript
// app/error.tsx
'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // 上报错误到监控服务
    console.error('Application error:', error);
    // reportError(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <div className="text-center">
        <h2 className="mb-4 text-2xl font-bold text-gray-900">
          出错了
        </h2>
        <p className="mb-4 text-gray-600">
          {error.message || '未知错误'}
        </p>
        <button
          onClick={reset}
          className="rounded-lg bg-purple-600 px-6 py-3 text-white hover:bg-purple-700"
        >
          重试
        </button>
      </div>
    </div>
  );
}
```

### 7.2 性能监控

```typescript
// app/not-found.tsx
export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <h2 className="text-2xl font-bold">页面未找到</h2>
      <p>404 - Page Not Found</p>
    </div>
  );
}

// 添加Web Vitals监控
// app/layout.tsx
export function reportWebVitals(metric: any) {
  if (window.gtag) {
    window.gtag('event', metric.name, {
      value: Math.round(
        metric.name === 'CLS' ? metric.value * 1000 : metric.value
      ),
      event_label: metric.id,
      non_interaction: true,
    });
  }
}
```

---

## 🔄 8. 迁移检查清单

### Phase 1: 初始化
- [ ] 创建Next.js项目
- [ ] 安装依赖
- [ ] 配置TypeScript
- [ ] 配置Tailwind CSS

### Phase 2: 核心组件
- [ ] 迁移根布局
- [ ] 迁移首页
- [ ] 迁移命理表单
- [ ] 迁移命理结果

### Phase 3: API路由
- [ ] 迁移分析API
- [ ] 迁移命理数据API
- [ ] 迁移用户API

### Phase 4: 性能优化
- [ ] 添加代码分割
- [ ] 配置图片优化
- [ ] 配置缓存策略
- [ ] 添加Service Worker

### Phase 5: SEO优化
- [ ] 添加元数据
- [ ] 添加结构化数据
- [ ] 生成Sitemap
- [ ] 生成Robots.txt

### Phase 6: 部署
- [ ] 配置PM2
- [ ] 配置Nginx
- [ ] 配置SSL
- [ ] 测试部署

---

**准备好了吗？开始迁移吧！** 🚀
