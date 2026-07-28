import type { ReactNode } from 'react';
import { StickyAnalyzeBar } from '@/components/conversion/sticky-analyze-bar';

/**
 * 世界易全路径：底部粘性排盘 CTA（book / global / cases 等高 bounce 入口）
 * 子页可再挂 LightBirthBridge 做强转化
 */
export default function WorldYiLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <StickyAnalyzeBar
        source="world_yi_sticky"
        page="/world-yi"
        label="把世界易方法落到你自己的盘"
        sublabel="结构 · 时位 · 动作 → 生成结构报告"
        revealPx={200}
      />
    </>
  );
}
