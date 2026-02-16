import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Life Kline - 命理分析',
  description: 'AI 命理助手',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  )
}
