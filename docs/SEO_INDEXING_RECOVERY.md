# Google 收录与搜索表现：诊断与恢复方案

> 2026-08 观测 · 站点 `www.life-kline.com`  
> 结论：**不完全是「优化过度」一句话能概括**，但存在典型的 **爬取预算稀释 + 内容同质/工厂味 + 品牌竞争** 三重问题。

---

## 1. 现象（当前）

| 信号 | 观察 |
|------|------|
| `site:life-kline.com` | 能搜到，但以 **社区帖** 为主；知识/工具支柱偏少 |
| 品牌词 | 「人生K线」被大量开源/仿站分流（GitHub 克隆、lifekline.chat 等） |
| Sitemap | 曾高达 **~7700** URL，其中 **~79% 是 astro 组合页** |
| 内容系统 | Content OS 已开始补实体支柱，但大量仍为 draft |
| robots | 曾未显式列出 `/topics` `/astro`（虽有 `Allow: /`，但运营可读性差） |

---

## 2. 是不是「优化过度」？

**部分是，但不只是。**

### 2.1 像「过度 SEO」的部分（会伤收录质量）

1. **URL 工厂 / 爬取预算稀释**  
   星座日运 × 分区 × 上升 × 配对 × 周/月 → 海量近似页。Google 会：
   - 降低整站爬取优先级  
   - 把预算耗在薄页上  
   - 对「程序化页面」更敏感（Helpful Content / Spam 政策）

2. **全站 GEO 元数据堆叠**  
   `ai-answer-summary` / `entity-keywords` / 多重 hreflang 若出现在薄页上，像信号堆砌，价值低。

3. **AI 量产同质文**  
   结构模板相同、标题公式化、缺乏独特案例与一手数据 → 难进核心词。

4. **参数/语言变体**  
   `?lang=`、`/en`、`/zh-hant` 三重展开，若正文差异小，易被判重复。

### 2.2 不完全是过度优化的部分

| 因素 | 说明 |
|------|------|
| **品类竞争** | 八字/算命赛道 SEO 极卷；新站/新品牌要时间 |
| **品牌被分流** | 同名「人生K线」开源项目多，SERP 被 GitHub/仿站占位 |
| **YMYL 属性** | 命理靠近「决策/健康建议」边界，Google 对 E-E-A-T 更严 |
| **产品页私有化** | `/result` `/chat` 合理 noindex，导致「工具体验」难直接吃搜索 |
| **外链与品牌提及** | 若外链弱，再完美 on-page 也难 |

**一句话：过度程序化 SEO 在拖后腿，但根上还要「更少更好的页 + 更强的品牌与外链 + 真差异化内容」。**

---

## 3. 已落地的技术修复

| 改动 | 目的 |
|------|------|
| `app/sitemap.ts` 默认关闭 astro 日历农场 | Sitemap 从 ~7.7k 压到 evergreen + 短窗口 |
| 黄历日 URL `±45` → `±7` | 减少低价值日页 |
| `app/robots.ts` 显式 allow `/topics` `/astro` `/hehun` `/hotlist` | 主题库与热榜可发现 |
| Content OS **十维质量评分 + LLM 修复轮** | 无人审：depth/locale/FAQ/产品桥/反spam… |
| 达标自动 `published` | `publishReady` 直接入库可索引 |
| `/hotlist` 热榜 + 页脚热门关注 | 对标雷电热门榜与内链密度 |

环境开关：

```bash
# 若仍要密集星座日历 sitemap（不推荐默认开）
SITEMAP_INCLUDE_ASTRO_CALENDAR=1
```

---

## 4. 推荐方案（优先级）

### P0 · 本周必做

1. **提交并监控 Search Console**  
   - 属性：`https://www.life-kline.com`（含 www）  
   - 提交 `sitemap.xml`  
   - 看：已编入索引 / 已发现未编入 / 软 404 / 重复 / 已抓取未编入  

2. **发布高质量 Content OS draft**（score≥90）  
   ```bash
   npx tsx scripts/publish-content-os-drafts.ts --min-score 90 --limit 30
   ```

3. **Sitemap 瘦身后强制 re-crawl**  
   - GSC「网址检查」对 `/` `/analyze` `/knowledge` `/topics` `/dimensions` 请求编入索引  

4. **canonical 纪律**  
   - 语言变体必须 hreflang 互指正确；正文不同语言真不同，禁止空壳 en  

### P1 · 2–4 周

5. **内容从「工厂」改「资产」**  
   - 每周 3–5 篇 **人审** 支柱文：真实案例 + 可验证预测回访截图 + 独特方法论  
   - 少写「什么是八字」类百科撞车，多写「跳槽窗口怎么拆」「合婚双盘三步」  

6. **内链改成「意图漏斗」**  
   - 社区高流量帖 → 主题实体 `/topics/*` → 工具/十维度 → 邮箱保存  
   - 不要全站互链所有页  

7. **品牌 SERP 防守**  
   - 统一品牌：「人生K线 Life K-Line」+ 官方域名  
   - 知乎/小红书/X 固定挂官方链接（防仿站）  
   - 考虑 `Organization` + `WebSite` + `sameAs` JSON-LD  

8. **外链**  
   - 产品开源 README 指向 www（已有）  
   - 行业向导文章、播客、合作站  
   - 避免买卖链接  

### P2 · 持续

9. **Core Web Vitals** 主漏斗页（analyze/knowledge）  
10. **定期砍薄页**：连续 90 天无展示的组合页 noindex 或从 sitemap 剔除  
11. **Baidu / 国内渠道** 并行（Google  alone 不够）  

---

## 5. 不要再做的事

- 为刷量批量生成近重复 URL  
- 在正文写「SEO/转化/内容库」等内部词  
- 全站同一套段落换关键词  
- 把会员墙内容做成「有 title 无正文」的 soft-404  
- 同时冲 10 个国家 UI 半成品  

---

## 6. 成功指标（90 天）

| 指标 | 目标 |
|------|------|
| Sitemap URL 数 | < 1200（2026-08 已 ~900） |
| CMS published | 优先 < 100 高质量页，再靠 people-first 日增 |
| GSC「已编入索引」 | 稳步上升，软 404 下降 |
| 非品牌点击 | 知识/主题/工具词周环比 + |
| 核心页 | `/analyze` `/knowledge/*` `/topics/*` 有展示 |
| Content OS | 日产 3–10 且仅 `publishReady` 入库 |

---

## 7. 与产品的正确关系

搜索只负责 **发现**；转化靠 **工具体验 + 回访闭环**。  

雷电模拟器成功的关键是：**实体页真有下载意图与更新**，不是 sitemap 塞满。  
我们对应：**命运实体页真有排盘/十维度/回访**，而不是再堆 6000 个星座日页。
