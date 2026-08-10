# Content OS · 全域内容操作系统

> 对标：雷电模拟器 [ldmnq.com](https://www.ldmnq.com/) 内容与 SEO 体系  
> 中心：人生命运（结构 · 时位 · 环境 · 动作 · 风险）  
> 引擎：自建 SpaceXAI 网关 `https://ttqq.inping.com` · 文本 `auto` · 配图 `z-image-turbo`  
> 状态：2026-08 落地骨架 + 更新闭环  
>
> **生产宪法（必读）**：[`docs/ldplayer-ops-and-google-alignment.md`](./ldplayer-ops-and-google-alignment.md)  
> 学雷电的是「实体中枢 → 卫星问题 → 真实更新 → 转化」，**不是**批量刷长尾 URL。  
> 北极星：**可收录搜索点击 → 开聊/排盘**，不是 published 数量。

---

## 1. 雷电模拟器为什么能吃到全域 SEO

| 能力 | 雷电怎么做 | 人生K线对标 |
|------|------------|-------------|
| **实体页海量覆盖** | `/app/{id}/` 每个游戏/应用一页 | `/topics/{entity}` 每个命运实体一页 |
| **资讯/攻略流** | `/zixun/` `/news/` 持续更新 | knowledge / cases / seasonal pulse |
| **帮助中心** | help 子域 FAQ/教程 | `/docs` + FAQ 槽位 |
| **社区** | 论坛 UGC + SEO | `/community` + forum 管线 |
| **榜单/热度** | 热门榜/应用榜/预约榜 | 主题优先级 + 兴趣集群 + 雷达信号 |
| **内链密度** | 页脚热门、相关游戏、下载 CTA | 主题互链 → 十维度/工具 → 排盘 CTA |
| **多语言多国家** | 多站点/多语 | Content locale：zh-CN/TW/HK/SG/MY/US + en-US/GB/SG |
| **持续生产** | 日更资讯 × 实体 | Content OS 矩阵缺口 + 过期刷新 |

核心洞察：**不是「多写几篇文章」**，而是 **实体 × 模板 × 语言 × 更新节奏** 的工业体系。

---

## 2. 命运实体矩阵（Destiny Matrix）

### 2.1 实体类型（Entity）

| Kind | 示例 | 路径 |
|------|------|------|
| life-question | 该不该换工作、什么时候结婚 | `/topics/q-*` |
| dimension | 十维度（事业/财富/关系…） | `/topics/dimension-*` |
| city | 上海/纽约/悉尼…（GEO_CITY_SEEDS） | `/topics/city-*` |
| industry | 互联网/金融/医疗… | `/topics/industry-*` |
| day-master | 甲木…癸水 | `/topics/day-master-*` |
| life-stage | 18-25 / 26-35 … | `/topics/stage-*` |
| tool | 排盘/合婚/起名/风水… | `/topics/tool-*` |
| methodology | 世界易六步、大运流年 | knowledge pillars |
| seasonal | 年月节奏观察 | 时令 SEO 新鲜度 |
| faq | 时辰未知、隐私、免费够不够 | docs / answer-engine |

### 2.2 内容模板（Template）

- `pillar-guide` — 长支柱 SEO（对标 app 详情深度）
- `how-to` — 教程/清单
- `case-study` — 决策案例
- `comparison` — 对比选型
- `listicle` — 榜单/合集
- `seasonal-pulse` — 月度/年度时令
- `locale-local` — 市场本地化改写
- `answer-engine` — 生成式搜索可引用 Q&A

### 2.3 语言与市场

见 `CONTENT_OS_LOCALES`：`zh-CN` `zh-TW` `zh-HK` `zh-SG` `zh-MY` `zh-US` `en-US` `en-GB` `en-SG`。

对齐 `docs/GLOBALIZATION_STANDARD.md`：

- 引擎结论跨语言一致
- 英文/繁体为原生改写（L2），禁止伪全球化
- hreflang + answerSummary + searchIntents + entityKeywords

### 2.4 规模量级（冷启动估算）

仅 zh-CN 主市场已达数百槽位；全 locale 展开后可达 **千级+** 可生成主题。  
用优先级 + 覆盖度控制日产量，避免 soft-404 农场。

---

## 3. 更新机制与逻辑

```
雷达/兴趣信号 ──┐
矩阵缺口 missing ─┼→ Run Plan → LLM 生成 → 质量门 → draft 落库/落盘
过期 stale ──────┤                              ↓
多语言扩展 ──────┘                    审核/自动发布窗口
                                              ↓
                                    主题页内链 + Sitemap + CTA
```

### 3.1 调度优先级

1. **missing** 高优先级实体（P0 维度、高需求人生问题、方法论）
2. **stale** 超过 `refreshDays` 的已发布内容
3. **draft** 推进可发布草稿
4. **locale expand** 已有 zh-CN 支柱 → 扩繁体/英文

### 3.2 质量门（沿用 content-generation）

- 小节 ≥ 4、段落充分、SEO 描述够长
- 禁止内部工程词（SEO/转化/内容库…）
- GEO：`answerSummary` + `searchIntents` + `entityKeywords`

### 3.3 生产节奏建议

| 通道 | 频率 | 说明 |
|------|------|------|
| Content OS batch | 每日 4–12 篇 | 矩阵缺口 + 时令 |
| content-scheduler | 已有 PM2 | 兴趣驱动发布 |
| content-radar | 已有 | 外部/内部热点入队 |
| forum-daemon | 已有 | UGC 问答长尾 |
| 人工专题 | 每周 | 方法论/产品故事 L2 英文 |

### 3.4 环境变量

```bash
# 文本（默认已指向 ttqq）
API_BASE_URL=https://ttqq.inping.com/v1
OPENAI_API_KEY=sk-...          # 或 API_KEY / CONTENT_OS_API_KEY
CONTENT_GENERATION_MODEL=auto  # 或 CONTENT_OS_TEXT_MODEL

# 配图
VISUAL_ASSET_DEFAULT_MODEL=z-image-turbo
# 或 CONTENT_OS_IMAGE_MODEL=z-image-turbo

# Cron
CONTENT_OS_CRON_TOKEN=...
CONTENT_GENERATION_CRON_TOKEN=...
```

**禁止把 key 写进 git。** 生产只写 `.env.local` / PM2 env。

---

## 4. 代码入口

| 模块 | 作用 |
|------|------|
| `lib/content-os/pipeline.ts` | **v3 主流水线** generate→score→repair→unique→publish |
| `lib/content-os/production-policy.ts` | 生产红线 / 近重 / locale 扩展 |
| `lib/content-os/demand-signals.ts` | 社区真实提问 → 实体卫星 |
| `lib/content-os/matrix.ts` | 实体目录 + people-first catalog |
| `lib/content-os/client.ts` | ttqq chat + image |
| `lib/content-os/generator.ts` | 槽位 → 初稿 |
| `lib/content-os/quality-dimensions.ts` | 十维质量 |
| `lib/content-os/repair.ts` | LLM 修复 / 全量重写 |
| `lib/content-os/scheduler.ts` | 计划 + 持久化 + 自动发布 |
| `app/topics/*` | 实体中枢 |
| `app/hotlist` | 发现枢纽 |
| `app/api/admin/content-os` | GET 状态 / POST 跑一轮 |
| `scripts/content-os-run.ts` | CLI v3 |
| `lib/content-generation.ts` | 既有 Socratic 生成器（content-ops 用） |

### CLI

```bash
npx tsx scripts/content-os-run.ts --dry-run
npx tsx scripts/content-os-run.ts --limit 3 --locales zh-CN,en-US
npx tsx scripts/content-os-run.ts --limit 2 --with-image
```

### HTTP

```bash
# 状态
curl -H "x-content-os-token: $TOKEN" \
  "https://www.life-kline.com/api/admin/content-os?limit=8"

# 跑一轮
curl -X POST -H "x-content-os-token: $TOKEN" \
  -H "content-type: application/json" \
  -d '{"limit":4,"locales":["zh-CN","en-US"],"withImage":false}' \
  "https://www.life-kline.com/api/admin/content-os"
```

草稿落盘：`content/os-drafts/YYYY-MM-DD/*.json`  
状态：`content/os-state/last-run.json`

---

## 5. 与现有管线关系

- **不取代** `content-ops` / interest-driven / radar / forum
- **补齐** 战略层：实体矩阵 + 多语言 + 主题枢纽 + 自建 LLM 火力生成
- 生产 `content-store` 为 SQLite CMS；本地 stub 内存 + 文件草稿
- 部署时：Content OS 生成 draft → 质量门 → `saveManagedContentEntry` → scheduler 窗口发布

---

## 6. 90 天里程碑

| 阶段 | 目标 |
|------|------|
| D0–7 | 矩阵上线、主题库可索引、日产 4–8 篇 zh-CN 支柱 |
| D8–30 | 繁体 + en-US 扩写、城市/行业实体全覆盖、sitemap 纳入 topics |
| D31–60 | 时令月更自动化、兴趣信号反哺矩阵优先级、内链组件 |
| D61–90 | 二级市场（SG/MY/GB）、生成式 GEO 抽检、转化漏斗报表 |

---

## 7. 合规与品牌

- 18+；非医疗/法律/投资建议
- 禁止恐吓式「本命年必死」文案
- 英文偏 decision framework；中文可保留术数术语但必须人话翻译
- 品牌：中文「人生K线」+ Life K-Line / World Yi 分工清晰
