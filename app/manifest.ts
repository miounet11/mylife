import type { MetadataRoute } from 'next';

// PWA install metadata — 决策台风
// 安卓 / iOS 添加到主屏幕时显示的应用元信息
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: '人生K线 · LIFE KLINE',
    short_name: '人生K线',
    description: '看清你的结构、阶段、环境与下一步动作。基于世界易与真太阳时校正的现代判断系统。',
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#f5f7f2',
    theme_color: '#0b5f55',
    lang: 'zh-CN',
    scope: '/',
    categories: ['productivity', 'lifestyle', 'education'],
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
        name: '生成新报告',
        short_name: '新报告',
        description: '填写出生信息生成判断报告',
        url: '/analyze',
      },
      {
        name: '我的中心',
        short_name: '中心',
        description: '查看历史报告与事件',
        url: '/dashboard',
      },
      {
        name: 'AI 助手',
        short_name: '助手',
        description: '对话式深度解读',
        url: '/chat',
      },
    ],
  };
}
