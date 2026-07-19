import type { MetadataRoute } from 'next';

/**
 * Web app manifest for lightweight PWA install (Add to Home Screen).
 * Served at /manifest.webmanifest by Next.js App Router.
 * Shell SW lives at public/sw.js (registered via components/pwa/register-sw.tsx).
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Life K-Line / 人生K线',
    short_name: '人生K线',
    description:
      '输入出生信息生成八字命盘、人生K线与流年大运；结构、阶段与下一步动作可回访验证。',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#f7f8f9',
    theme_color: '#f7f8f9',
    lang: 'zh-CN',
    categories: ['lifestyle', 'productivity', 'education'],
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
      {
        src: '/apple-icon',
        sizes: '180x180',
        type: 'image/png',
        purpose: 'any',
      },
    ],
    shortcuts: [
      {
        name: '生成报告',
        short_name: '报告',
        description: '填写出生信息生成判断报告',
        url: '/analyze',
      },
      {
        name: '个人中心',
        short_name: '中心',
        description: '查看档案与历史报告',
        url: '/profile',
      },
      {
        name: '订阅更新',
        short_name: '更新',
        description: '管理提醒与邮件偏好',
        url: '/updates',
      },
    ],
  };
}
