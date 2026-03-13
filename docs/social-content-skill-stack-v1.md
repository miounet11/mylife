# 社媒内容抓取 Skill 方案 V1

## 结论

当前不建议直接把来源不明的 ClawHub 社区 skill 接进生产。

我采用的是两层方案：

1. 安装一个稳定的浏览底座 skill：`playwright`
2. 创建我们自己的内容情报 skill：`social-content-intelligence`

## 已落地

### 已安装 skill

- `playwright`
  - 来源：`openai/skills`
  - 用途：当 RSS/API 不够时，做页面级抓取和可视化抽取

### 已创建 skill

- `social-content-intelligence`
  - 路径：`/root/.codex/skills/social-content-intelligence`
  - 用途：抓取热点、归一化内容信号、给后续内容生成提供输入

## 推荐上游

### 主推荐

- RSSHub
  - https://github.com/DIYgod/RSSHub
  - 适合作为公开内容趋势源的第一层

### 备选 fallback

- TikTok Scraper
  - https://github.com/drawrowfly/tiktok-scraper
- Douyin + TikTok Python Package
  - https://github.com/Evil0ctal/Douyin_Tiktok_Scraper_PyPi

## 为什么这样选

- 更稳：先用 RSS / 公开源，减少反爬风险
- 更轻：不需要一开始就维护重型采集系统
- 更安全：不直接信任 ClawHub 上来源不明的技能
- 更适合我们的产品：我们要的是选题信号，不是无限制下载整站内容

## 下一步

1. 把 RSSHub / Playwright / fallback scraper 包装成统一的内容雷达任务
2. 产出结构化 JSON 到站点内容运营系统
3. 将高热词与现有内容缺口自动合并，驱动下一轮自动生成
4. 再决定是否把某些高价值来源做成定时任务

## 当前站内接入

已接入：

- 后台 API：`/api/admin/content/radar`
- 定时 API：`/api/admin/content/radar/cron`
- 后台面板：内容雷达
- PM2 守护进程：`life-kline-radar`
- 可选闭环开关：
  - `CONTENT_RADAR_AUTO_GENERATE=1`
  - `CONTENT_RADAR_AUTO_PUBLISH=1`

内容雷达当前优先抓取公开 RSS / Atom 源，后续再逐步加 Playwright 页面提取和定向 fallback scraper。
