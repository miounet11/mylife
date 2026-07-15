# LK Design System v2

**对标：** Linear（布局节奏 / 8px 网格 / 控件高度 / 图标尺度）  
**气质：** 专业冷静（中性灰壳层 + 克制 indigo 品牌色）  
**范围一期：** tokens + Header / Footer / AppPage + 基础卡/钮/输入

## 原则

1. **壳层浅色专业** — 不再使用 Facebook 蓝顶栏全站染色  
2. **Ming 暗色仅图表** — `theme-ming` / `premium-card` 只用于报告内嵌可视化  
3. **8px 间距** — `--space-*` 为唯一间距源；避免随意 `11px/12px` 碎片字号  
4. **控件高度统一** — 28 / 32 / 36 / 40（`--control-h-*`）  
5. **图标** — Lucide，默认 16px，导航 14–16，触控区 ≥ 32  
6. **字重克制** — 标题 600–650，避免大面积 800/900  

## Token 速查

| 用途 | Token | 值（约） |
|------|--------|----------|
| 页面背景 | `--bg` | `#f7f8f9` |
| 卡片 | `--paper` | `#fff` |
| 正文 | `--text-body` | 14px / 1.55 |
| 品牌 | `--brand` | `#4f46e5` |
| 圆角控件 | `--radius` | 8px |
| 圆角卡片 | `--radius-md` | 10px |
| 阴影 | `--shadow-card` | 轻投影 + hairline |

## 类名兼容

旧类名 `fb-*` 仍可用，样式已映射到 v2：

- `fb-chrome` → 浅色顶栏  
- `fb-card` / `fb-btn` / `fb-input` → Linear 控件感  

新代码优先 `lk-*`（`lk-card` / `lk-btn` / `lk-input`）。

## 部署注意

生产保护路径（`scripts/production-protected-paths.sh`）含：

- `components/site-header.tsx`
- `components/site-footer.tsx`

发布壳层改动时需显式纳入 deploy，或在生产侧同步，**不要**被 design-system 脚本误恢复为旧 FB 壳。

## 二期进度

1. ~~`analyze` 工作台（Linear workspace 节奏）~~ **已完成（本地）**  
   - `components/analyze/analyze-workspace.tsx`  
   - `components/analyze/portal-rail.tsx`  
2. ~~`result` 报告阅读（Notion 长文结构 + 现有 Ming 图）~~ **已完成（本地）**  
   - `app/result/[id]/page.tsx`、`report-viewer`、cover / reading-path / cockpit / rails  
   - CSS：`.lk-report-stack` / `.lk-report-section-title` / `.lk-report-prose`  
   - Ming 图表区（`theme-ming` / `life-kline-summary-card`）保持暗色专业感  
3. ~~`profile/settings`（Stripe 设置页表单密度）~~ **已完成（本地）**  
   - `app/profile/settings/page.tsx`（max-w-5xl 内容栏）  
   - `components/profile-settings-panel.tsx`（表头/Tab/表单/底栏）  
   - `profile-settings-summary-banner`、`profile-rail`  
4. 清理页面内硬编码 `text-[11px]` / `text-[12px]`，改 token  
5. 生产显式部署：`globals.css` + header/footer + 上述壳层页面（注意 protected paths）
