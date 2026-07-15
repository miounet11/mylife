/**
 * 对外知识基线 · 与时俱进的版本戳
 *
 * 用户可见声明：采用「YYYY年M月」结构化知识库与引擎口径。
 * 滚动更新时只改本文件常量即可。
 * 勿在此写入产品运营逻辑、漏斗或 SEO 策略表述。
 */

export const KNOWLEDGE_BASE = {
  /** 机器可读版本 */
  version: '2026-07',
  /** 对外短标签 */
  shortLabel: '2026年7月知识库',
  /** 完整声明（页脚/专业版） */
  label: '2026年7月结构化知识库',
  /** ISO 日期，便于程序比对 */
  updatedAt: '2026-07-01',
  /** 覆盖范围（对外说明用：学科内容，非运营叙事） */
  scope: [
    '八字结构与用神喜忌',
    '大运流年与人生K线',
    '当代行业与宏观周期',
    '地理空间与方位建议',
    '人生阶段与关系节奏',
    '可验证预测与回访',
  ] as const,
  /** 一句对外可复用文案 */
  publicClaim:
    '本系统测算与解释采用 2026 年 7 月最新结构化知识库与引擎口径（含当代行业周期、地理空间与人生阶段），不是静态古籍摘录。',
  /** 页脚更短 */
  footerLine: '知识基线 · 2026年7月 · 持续校准中',
} as const;

export type KnowledgeBaseMeta = typeof KNOWLEDGE_BASE;

export function knowledgeBaseStampText(mode: 'short' | 'full' | 'footer' = 'short'): string {
  if (mode === 'full') return KNOWLEDGE_BASE.publicClaim;
  if (mode === 'footer') return KNOWLEDGE_BASE.footerLine;
  return KNOWLEDGE_BASE.shortLabel;
}
