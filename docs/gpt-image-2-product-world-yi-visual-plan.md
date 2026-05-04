# GPT-Image-2 产品与世界易视觉生成方案

本文档用于规划一套可批量生成、可持续复用的图片体系，让用户不用读完长文，也能通过图片快速理解：

- 人生K线是什么
- 世界易是什么
- 测算、报告、工具、知识、案例、洞察之间如何连接
- 为什么世界易不是传统命理包装，而是一套面向 AI 时代的现代判断系统

执行目标不是做几张好看的插画，而是建立一套“视觉说明系统”。后续所有首页、世界易入口、测算页、结果页、工具页、知识页、案例页、洞察页、社媒封面，都应该从这套系统里取图或派生图。

命理分析、易学、五行、天干地支、康熙字典、风水、奇门遁甲、相学等专业普及图库，见扩展文档：

- [gpt-image-2-mingli-yixue-visual-library-1000.md](./gpt-image-2-mingli-yixue-visual-library-1000.md)

结构化生成、入库、纠错、品牌垫图和长期生产 skill，见生产管线文档：

- [gpt-image-2-visual-asset-production-pipeline.md](./gpt-image-2-visual-asset-production-pipeline.md)

---

## 1. 总目标

### 1.1 用户侧目标

用户看到图片后，需要在 3 秒内理解一个清楚问题：

- 我现在在哪里
- 这个产品能帮我判断什么
- 世界易的核心方法是什么
- 我下一步应该进入测算、读案例、用工具，还是继续理解体系

### 1.2 产品侧目标

图片体系要服务三个转化层：

1. 第一印象：让用户知道人生K线不是泛泛的玄学站，而是一个结构化判断产品。
2. 方法理解：把“结构、时位、环境、动作、风险、复盘”视觉化。
3. 路径推进：把内容阅读、个人测算、报告结果、单项工具、订阅和复访串起来。

### 1.3 内容侧目标

所有自动生成内容都应有可匹配的视觉封面或插图：

- 知识页：解释一个原理
- 案例页：呈现一个真实场景
- 洞察页：呈现城市、行业、年份、宏观环境
- 世界易主书页：呈现理论结构
- 工具页：呈现单项判断场景
- 报告页：呈现用户自己的结构、阶段与行动
- 社媒卡片：把站内内容拆成可传播的图文入口

---

## 2. 官方能力边界

目标模型：`gpt-image-2`

截至 2026-05-02 核对的官方说明要点：

- `gpt-image-2` 是 OpenAI GPT Image 系列的图像生成与编辑模型。
- 批量从文字生成图片时，优先使用 Image API 的 generations endpoint。
- 需要多轮编辑、参考图迭代、品牌风格延续时，可以使用 edits endpoint 或 Responses API 的 image generation tool。
- `size`、`quality`、`background` 支持 `auto` 选项，但 `gpt-image-2` 当前不支持透明背景，不能设置 `background: "transparent"`。
- 常用尺寸包括 `1024x1024`、`1536x1024`、`1024x1536`、`2048x1152`、`3840x2160`、`2160x3840`。
- 尺寸约束：最长边不超过 `3840px`，两边都必须是 `16px` 的倍数，长短边比例不超过 `3:1`，总像素在 `655,360` 到 `8,294,400` 之间。
- 质量建议：草稿用 `low`，最终上线图用 `medium` 或 `high`，大规模内容封面默认 `medium` 即可。
- 模型虽然文字渲染能力更强，但小字、复杂中文、密集图表文字仍可能不稳定。

项目执行原则：

- 图片里尽量不要生成可读中文小字。
- 中文标题、按钮文案、标签、数字由前端或设计层覆盖。
- 图片只负责结构、氛围、隐喻和构图。
- 对品牌主视觉、固定人物、固定图标系统，要用参考图做二次编辑，而不是每次重新发散。

官方参考：

- GPT Image 2 model: https://developers.openai.com/api/docs/models/gpt-image-2
- Image generation guide: https://developers.openai.com/api/docs/guides/image-generation
- Image generation tool guide: https://developers.openai.com/api/docs/guides/tools-image-generation

---

## 3. 视觉总方向

### 3.1 一句话风格

`东方判断系统 + 现代产品智能 + 高信任编辑设计`

视觉不走“算命先生、星座盘、廉价符咒”的路线，而是走“复杂现实里的判断仪表盘”。

### 3.2 关键词

- 结构
- 时位
- 环境
- 轨道
- 复盘
- 城市
- 人生六域
- 工具矩阵
- 内容宇宙
- 判断秩序
- AI 时代

### 3.3 推荐视觉元素

- 分层纸张、竹简、手稿、书页
- 产品界面层、数据卡片、报告面板
- 罗盘、时间轴、日晷、节气格
- 城市地图、行业网络、迁移路线
- 六边形模块、轨道、节点、连接线
- 墨色线稿、玉色光带、朱砂重点、暖金边框

### 3.4 禁止方向

- 水晶球
- 惊悚鬼神
- 廉价生肖贴纸
- 过度龙凤玄学
- 随机中文乱码
- 泛紫色 AI 霓虹
- 迷信恐吓式命运画面
- “被大师看透”的压迫感

### 3.5 色彩系统

建议生成提示词持续使用同一套色彩：

- Ink black：判断、结构、权威
- Warm parchment：东方书写、知识底层
- Jade teal：现代、理性、产品智能
- Cinnabar：重点行动、风险提示
- Muted gold：时间、价值、沉淀
- Fog gray：环境、噪音、复杂背景

---

## 4. 图片规格

### 4.1 主规格

| 用途 | 比例 | 推荐尺寸 | 质量 | 输出格式 |
| --- | --- | --- | --- | --- |
| 首页 / 世界易 Hero | 16:9 | `2048x1152` | `high` | `webp` 或 `png` |
| 页面章节插图 | 3:2 | `1536x1024` | `medium` | `webp` |
| 内容封面 | 4:5 | `1440x1800` 或 `1024x1280` | `medium` | `webp` |
| 移动端故事图 | 9:16 | `1080x1920` | `medium` | `webp` |
| 工具 / 模块卡片 | 1:1 | `1536x1536` | `medium` | `webp` |
| 超清品牌图 | 16:9 | `3840x2160` | `high` | `png` |

注意：如需严格符合官方边长倍数要求，尺寸两边都必须是 `16px` 的倍数。`1440x1800` 可用，`1080x1920` 中 `1080` 不是 `16px` 倍数，生产时建议改为 `1088x1920`。

### 4.2 文件命名

建议统一放置：

```text
public/images/world-yi/generated/
```

命名格式：

```text
{batch}-{id}-{slug}-{ratio}-{version}.{ext}
```

示例：

```text
a-a01-product-universe-16x9-v1.webp
b-b02-method-formula-16x9-v1.webp
g-g01-knowledge-cover-4x5-v1.webp
```

### 4.3 元数据格式

每张图都要有一条可追踪记录，后续可做成 JSON 或 CMS 字段：

```yaml
id: A01
file: public/images/world-yi/generated/a-a01-product-universe-16x9-v1.webp
title: 人生K线产品宇宙图
surface: home
ratio: 16:9
size: 2048x1152
model: gpt-image-2
quality: high
prompt: ...
overlayCopy: 结构、阶段、环境、下一步动作
alt: 人生K线从测算入口连接报告、工具、知识、案例和世界易体系的结构图
relatedRoutes:
  - /
  - /analyze
  - /world-yi
status: planned
```

---

## 5. 通用提示词模板

### 5.1 基础生成模板

```text
Draw a premium product education illustration for Life Kline and World Yi.

Visual direction:
A modern Eastern judgment system, structured, calm, high-trust, editorial product design.
It should feel like an AI-age decision system rooted in classical Yi thinking, not fortune-telling.

Subject:
{subject}

Must show:
{elements}

Composition:
{layout}

Style:
Cinematic editorial infographic, layered parchment and modern interface panels, subtle ink lines, jade teal light, cinnabar action accents, muted gold timing details, warm paper texture, clean negative space for Chinese overlay text.

Avoid:
Fortune teller, crystal ball, cheap zodiac icons, horror mysticism, random Chinese characters, cluttered small text, generic neon AI, purple SaaS default style.

Text rule:
Do not render readable small text. Use abstract label blocks only. Leave clear safe areas for Chinese overlay text added later.

Output:
Aspect ratio {ratio}, size {size}, high visual clarity, no transparent background.
```

### 5.2 参考图编辑模板

用于后期统一品牌风格、复用人物/界面/封面模板：

```text
Edit the reference image into the Life Kline / World Yi visual system.

Keep:
The overall composition, main subject position, and clean product education purpose.

Change:
Add a modern Eastern judgment-system atmosphere with layered parchment, ink structure lines, jade teal interface glow, cinnabar action markers, and muted gold timing details.

Remove:
Any clutter, fake small text, generic neon AI effects, fortune-telling props, scary mysticism, and decorative symbols that do not explain the product.

Leave:
Clear negative space for Chinese headline and subtitle overlays.

Do not:
Create readable Chinese text inside the image.
```

### 5.3 内容封面模板

```text
Draw a reusable editorial cover image for a Life Kline content article.

Article type:
{knowledge | case | insight}

Topic:
{topic}

User question answered:
{question}

Visual metaphor:
{metaphor}

Style:
Modern Eastern judgment-system editorial cover, warm parchment background, ink structure lines, jade teal data layer, cinnabar focal point, muted gold timing detail, calm and high-trust.

Layout:
Strong central visual, simple background, enough empty space at top-left and bottom-right for Chinese title overlay.

Avoid:
Readable generated text, random Chinese symbols, fortune teller, crystal ball, cheap zodiac, scary destiny, overdecorated mysticism.

Size:
{size}. Quality {quality}. No transparent background.
```

---

## 6. 三层资产架构

后续图片库不应只做 20 张核心图。正确结构应该分成三层：

| 层级 | 数量 | 作用 | 主要用户场景 | 是否强转化 |
| --- | --- | --- | --- | --- |
| 说明性内容 | 20 张 | 让新用户快速看懂产品和世界易 | 首页、世界易页、测算页、结果页、工具页 | 强 |
| 结构性内容 | 100 张 | 把产品、报告、工具、世界易、内容矩阵全部图解化 | 站内页面、长文、主书、专题页、运营页 | 中强 |
| 传播性内容 | 100 到 300 张 | 让用户愿意保存、转发、分享，并回到测算入口 | 小红书、抖音、快手、视频号、朋友圈、繁体中文社群、海外华人社群 | 强 |

三层内容的关系：

- 说明性内容负责“第一次看懂”。
- 结构性内容负责“持续解释体系”。
- 传播性内容负责“不断把新用户带回测算”。

每张传播图都必须绑定一个下一步：

- 进入 `/analyze`
- 阅读对应知识页
- 阅读对应案例页
- 进入对应工具
- 订阅年度、月度或阶段窗口提醒

---

## 7. 核心图片批次

### Batch A：产品总览图

这组图解释人生K线产品本身，优先用于首页、测算页、登录后首页、关于页和转化页。

| ID | 图片名 | 回答的问题 | 投放位置 | 规格 | 重点 | 覆盖文案 | 优先级 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| A01 | 产品宇宙图 | 人生K线到底是什么 | `/`、`/world-yi` | 16:9 | 测算、报告、工具、知识、案例、世界易连接 | 看清结构、阶段、环境与下一步动作 | P0 |
| A02 | 用户旅程图 | 用户从内容到测算怎么走 | `/`、内容页 CTA | 16:9 / 4:5 | 阅读 -> 测算 -> 报告 -> 工具 -> 复访 | 从一个问题进入完整判断 | P0 |
| A03 | 报告解剖图 | 报告里面有哪些层 | `/analyze`、`/result/[id]` | 16:9 | 结构、阶段、环境、动作、风险 | 报告不是标签，是行动顺序 | P0 |
| A04 | 隐私与信任图 | 用户资料是否安全 | `/analyze`、报告页 | 3:2 | 私密空间、可选分享、无恐吓 | 默认私密，可选分享 | P1 |
| A05 | 复访成长图 | 一次测算后还做什么 | `/profile`、`/history` | 16:9 | 历史、工具记忆、月度更新 | 每一次反馈都会进入下一轮判断 | P1 |
| A06 | 产品价值对比图 | 和传统命理有什么不同 | 首页中段 | 3:2 | 术语解释 vs 行动判断 | 不止看命盘，更看现实动作 | P1 |

### Batch B：世界易理论图

这组图解释世界易，不直接卖产品，而是建立体系感、权威感和可传播的母语。

| ID | 图片名 | 回答的问题 | 投放位置 | 规格 | 重点 | 覆盖文案 | 优先级 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| B01 | 世界易总图 | 世界易是什么 | `/world-yi` Hero | 16:9 | 现代高维判断学说 | AI 时代的高维判断语言 | P0 |
| B02 | 方法总式图 | 世界易怎么判断 | `/world-yi`、报告页 | 16:9 | 结构 -> 时位 -> 环境 -> 动作 -> 风险 -> 复盘 | 先看结构，再定行动 | P0 |
| B03 | 六层引力图 | 为什么用户会被吸引 | `/world-yi` | 16:9 / 1:1 | 认知、情绪、身份、动作、语言、社会 | 六层引力模型 | P0 |
| B04 | 五大学理基础图 | 世界易的底层来自哪里 | `/world-yi`、主书页 | 16:9 | 易学、心理、哲学、宗教、神学 | 五大学理基础 | P1 |
| B05 | 不是算命图 | 和宿命论的边界是什么 | FAQ、世界易页 | 4:5 | 从被看透到拿回判断 | 不是制造恐惧，是恢复判断 | P0 |
| B06 | AI 时代定位图 | 为什么现在需要世界易 | `/world-yi/book` | 16:9 | 工业时代、信息时代、AI 时代 | 信息之后，最稀缺的是判断 | P1 |
| B07 | 十卷主书工程图 | 世界易内容体系有多大 | `/world-yi/book` | 16:9 | 十卷书、章节节点、版本治理 | 十卷主书初版 | P1 |
| B08 | 版本治理图 | 为什么要持续更新 | `/world-yi/publish` | 3:2 | 版本、复盘、公开答疑 | 学说不是静态口号，而是版本工程 | P2 |

### Batch C：应用领域图

这组图说明世界易如何落到现实生活，不让用户停留在抽象理论。

| ID | 图片名 | 回答的问题 | 投放位置 | 规格 | 重点 | 覆盖文案 | 优先级 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| C01 | 十二应用地图 | 世界易能判断哪些事 | `/world-yi/domains` | 16:9 | 命理、关系、事业、财富、健康、迁移、起名、寻物、择时、家宅、城市、行业 | 从个人到世界的判断地图 | P0 |
| C02 | 人生六域图 | 普通用户最关心哪些方向 | `/world-yi/domains`、工具中心 | 16:9 | 事业、财富、关系、健康、家庭、迁移 | 人生六域入口 | P0 |
| C03 | 生活应用图 | 起名、择时、寻物怎么进入体系 | 工具中心、生活工具页 | 3:2 | 起名、寻物、择时、家宅秩序 | 把判断落到日常动作 | P1 |
| C04 | 全球华人与英文层 | 海外用户如何理解 | `/world-yi/global`、`/world-yi/en` | 16:9 | 华语、繁中、英文、跨文化生活 | 世界易的全球表达 | P1 |
| C05 | 城市与行业环境图 | 环境如何影响个人 | 洞察页 | 16:9 / 4:5 | 城市、行业、年份、资源 | 同一结构，在不同环境里结果不同 | P1 |
| C06 | 关系与家庭图 | 关系不是只看合不合 | 关系工具、案例页 | 4:5 | 边界、节奏、承诺、代际 | 关系先看节奏，再看承诺 | P2 |
| C07 | 财富与事业图 | 事业财富如何分层判断 | 事业/财富工具页 | 4:5 | 赛道、窗口、现金流、风险 | 先定窗口，再谈扩张 | P2 |
| C08 | 健康恢复图 | 健康如何避免恐吓 | 健康工具页 | 4:5 | 透支、恢复、睡眠、边界 | 不制造焦虑，只提示节奏 | P2 |

### Batch D：120 工具中心图

这组图把 120 个单项工具产品化，强调“综合报告之后可以继续跑具体问题”。

| ID | 图片名 | 回答的问题 | 投放位置 | 规格 | 重点 | 覆盖文案 | 优先级 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| D01 | 120 工具星图 | 工具中心是什么 | `/tools` | 16:9 | 120 个单项工具围绕六域展开 | 120 个单项判断工具 | P0 |
| D02 | 报告后推荐工具图 | 报告和工具怎么连接 | `/result/[id]` | 16:9 | 报告结论 -> 推荐工具 | 综合判断之后，继续拆具体问题 | P0 |
| D03 | 工具记忆循环图 | 工具结果如何沉淀 | `/tool-result/[sessionId]`、历史页 | 16:9 | 工具会话、历史、后续上下文 | 每次工具运行都成为下一次上下文 | P1 |
| D04 | 六类工具入口图 | 用户如何选工具 | `/tools/category/[category]` | 3:2 | 事业、财富、关系、健康、家庭、迁移 | 按现实问题进入，而不是按术语进入 | P1 |
| D05 | 工具详情场景图 | 单项工具如何解释价值 | `/tools/[slug]` | 4:5 | 一个场景、一个问题、一个判断 | 一次只判断一个具体问题 | P2 |

### Batch E：内容与自动发布系统图

这组图说明内容不是随便发文章，而是增长引擎。

| ID | 图片名 | 回答的问题 | 投放位置 | 规格 | 重点 | 覆盖文案 | 优先级 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| E01 | 内容引擎图 | 内容如何从热点到发布 | 内部运营页、世界易发布页 | 16:9 | 热点扫描 -> 生成 -> 草稿 -> 发布 -> 数据 -> 下一队列 | 内容不是孤岛，是增长闭环 | P0 |
| E02 | 内容表面图 | 有哪些公开内容表面 | `/knowledge`、`/cases`、`/insights` | 16:9 | 知识、案例、洞察、主书、专题 | 每一篇内容都要导向判断入口 | P1 |
| E03 | 跨表面旅程图 | 文章如何导向工具和测算 | 内容页底部 | 16:9 | 相关文章、相关案例、相关工具、分析 CTA | 从阅读进入个人判断 | P0 |
| E04 | 2000 内容矩阵图 | 世界易内容规模如何扩展 | `/world-yi/matrix` | 16:9 | 2000 篇矩阵、分科、版本 | 从首批 120 篇到 2000 内容宇宙 | P1 |
| E05 | 质量治理图 | 自动内容如何避免失控 | 运营文档、后台 | 3:2 | 生成、审核、发布窗口、质量闸门 | 自动化必须有闸门 | P1 |

### Batch F：转化与服务图

这组图用于把免费测算、报告深读、订阅、顾问式服务连接起来，但避免强销售感。

| ID | 图片名 | 回答的问题 | 投放位置 | 规格 | 重点 | 覆盖文案 | 优先级 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| F01 | 免费到深度服务图 | 为什么要升级 | 报告页、工具结果页 | 16:9 | 免费结论、深度报告、行动计划 | 从看懂结果到执行下一步 | P1 |
| F02 | 深度咨询工作流图 | 高阶服务交付什么 | Premium 区块 | 16:9 | 复盘、问题澄清、行动顺序 | 深度服务解决具体推进顺序 | P1 |
| F03 | 订阅复访图 | 为什么要订阅 | 内容页、结果页 | 4:5 | 月度提醒、窗口更新、历史连接 | 关键窗口到来前提醒你 | P2 |

### Batch G：社媒与 SEO 封面包

这组图解决大量内容发布的封面问题，应做成模板化生产。

| ID | 图片名 | 回答的问题 | 投放位置 | 规格 | 重点 | 覆盖文案 | 优先级 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| G01 | 知识页封面模板 | 解释型文章如何统一视觉 | `/knowledge/[slug]`、社媒 | 4:5 / 16:9 | 原理图、结构线、简洁焦点 | 标题由页面覆盖 | P0 |
| G02 | 案例页封面模板 | 场景型内容如何统一视觉 | `/cases/[slug]`、社媒 | 4:5 / 16:9 | 人物背影、现实场景、判断面板 | 标题由页面覆盖 | P0 |
| G03 | 洞察页封面模板 | 城市行业内容如何统一视觉 | `/insights/...`、社媒 | 4:5 / 16:9 | 城市地图、行业网络、年份光标 | 标题由页面覆盖 | P0 |
| G04 | 短视频开场图 | 抖音/快手/TikTok 如何承接 | 社媒 | 9:16 | 大留白、强焦点、标题安全区 | 问题句覆盖 | P1 |
| G05 | X/线程摘要图 | 观点卡如何传播 | X、LinkedIn | 16:9 | 一句观点、简洁图形隐喻 | 英文/中文观点覆盖 | P2 |
| G06 | 专题页封面模板 | 高热主题如何成组三件套 | 主题聚合页 | 16:9 / 4:5 | 知识、案例、洞察三联结构 | 一个主题，三种入口 | P1 |

---

## 8. 说明性内容：20 张

说明性内容目标：先覆盖用户最容易看到、最影响理解和转化的位置。它们不追求数量，而追求一次性把产品、世界易和用户路径讲清楚。

| 顺序 | ID | 页面 | 用途 |
| --- | --- | --- | --- |
| 1 | A01 | `/` | 首页产品宇宙 Hero / 中段解释 |
| 2 | A02 | `/`、内容页 | 用户从内容到测算的完整旅程 |
| 3 | A03 | `/analyze`、报告页 | 解释报告结构 |
| 4 | B01 | `/world-yi` | 世界易主视觉 |
| 5 | B02 | `/world-yi`、报告页 | 方法总式 |
| 6 | B03 | `/world-yi` | 六层引力模型 |
| 7 | B05 | FAQ、内容页 | 去宿命化说明 |
| 8 | C01 | `/world-yi/domains` | 应用总地图 |
| 9 | C02 | `/tools`、六域页 | 人生六域入口 |
| 10 | D01 | `/tools` | 120 工具星图 |
| 11 | D02 | `/result/[id]` | 报告后工具推荐 |
| 12 | E01 | `/world-yi/publish` | 内容引擎说明 |
| 13 | E03 | 内容页底部 | 跨表面旅程 |
| 14 | E04 | `/world-yi/matrix` | 2000 内容矩阵 |
| 15 | G01 | 知识页 | 知识封面母版 |
| 16 | G02 | 案例页 | 案例封面母版 |
| 17 | G03 | 洞察页 | 洞察封面母版 |
| 18 | G04 | 社媒 | 9:16 短视频封面母版 |
| 19 | C04 | `/world-yi/global` | 全球华人与英文层 |
| 20 | F01 | 报告页 | 免费到深度服务 |

---

## 9. 结构性内容：100 张

结构性内容目标：把世界易与人生K线的全部系统拆成可解释、可引用、可嵌入长文的图。它们不是社媒标题党，而是站内的“说明书图谱”。

### 9.1 结构性图片总配额

| 模块 | 数量 | 用途 |
| --- | --- | --- |
| S01 产品系统结构 | 10 张 | 解释首页、测算、报告、工具、内容、订阅、历史、复访 |
| S02 报告与测算结构 | 12 张 | 解释出生信息、真太阳时、结构判断、阶段判断、环境判断、行动建议 |
| S03 世界易理论结构 | 18 张 | 解释总式、六层引力、五大学理、时代定位、十卷主书、版本治理 |
| S04 人生六域结构 | 18 张 | 解释事业、财富、关系、健康、家庭、迁移各自的判断框架 |
| S05 120 工具结构 | 14 张 | 解释工具分类、报告后推荐、工具记忆、工具结果页、单项工具入口 |
| S06 内容矩阵结构 | 12 张 | 解释知识、案例、洞察、专题、2000 内容矩阵、自动发布和质量闸门 |
| S07 全球与多语言结构 | 8 张 | 解释简体、繁体、英文、海外华人、跨文化命理语言 |
| S08 转化与长期关系结构 | 8 张 | 解释免费到深度服务、订阅、月度提醒、复访成长、用户历史 |
| 合计 | 100 张 | 形成完整站内图解库 |

### 9.2 S01 产品系统结构，10 张

| ID | 图片主题 | 核心问题 | 投放位置 | 规格 |
| --- | --- | --- | --- | --- |
| S01-01 | 人生K线整体系统图 | 产品由哪些模块组成 | `/`、关于页 | 16:9 |
| S01-02 | 从一个问题到完整判断 | 用户问题如何进入系统 | `/`、`/analyze` | 16:9 |
| S01-03 | 内容到测算转化路径 | 文章如何导向测算 | 内容页 | 16:9 |
| S01-04 | 测算到报告路径 | 用户填写后得到什么 | `/analyze` | 3:2 |
| S01-05 | 报告到工具路径 | 综合判断如何拆成单项工具 | 报告页 | 16:9 |
| S01-06 | 工具到历史沉淀 | 工具结果如何变成后续上下文 | 工具结果页、历史页 | 16:9 |
| S01-07 | 首页信息架构 | 首页每个区块承担什么任务 | 首页设计文档 | 16:9 |
| S01-08 | 登录后个人成长面板 | 老用户如何继续使用 | `/profile` | 3:2 |
| S01-09 | 搜索/社媒/站内闭环 | 外部流量如何进入站内 | 运营文档 | 16:9 |
| S01-10 | 产品信任结构 | 隐私、非恐吓、可执行如何表达 | `/analyze`、FAQ | 3:2 |

### 9.3 S02 报告与测算结构，12 张

| ID | 图片主题 | 核心问题 | 投放位置 | 规格 |
| --- | --- | --- | --- | --- |
| S02-01 | 出生信息输入结构 | 为什么要填出生时间和地点 | `/analyze` | 3:2 |
| S02-02 | 真太阳时校正 | 为什么时间基准会影响判断 | 知识页、测算页 | 16:9 |
| S02-03 | 结构定位 | 报告先看什么稳定模式 | 报告页 | 16:9 |
| S02-04 | 阶段窗口 | 当前处在哪个阶段 | 报告页、工具页 | 16:9 |
| S02-05 | 环境放大器 | 城市、行业、家庭如何影响结果 | 报告页、洞察页 | 16:9 |
| S02-06 | 下一步动作 | 报告如何给行动顺序 | 报告页 | 3:2 |
| S02-07 | 风险边界 | 报告如何提示不该放大的方向 | 报告页 | 3:2 |
| S02-08 | 复盘循环 | 用户反馈如何进入下一轮 | 历史页 | 16:9 |
| S02-09 | 置信度与不确定性 | 只知道大概时辰怎么办 | FAQ、知识页 | 3:2 |
| S02-10 | 报告摘要层 | 用户如何先看重点 | 报告页 | 16:9 |
| S02-11 | 报告深读层 | 付费深度如何展开 | Premium 区块 | 16:9 |
| S02-12 | 报告分享边界 | 什么能分享、什么应保留私密 | 报告页 | 3:2 |

### 9.4 S03 世界易理论结构，18 张

| ID | 图片主题 | 核心问题 | 投放位置 | 规格 |
| --- | --- | --- | --- | --- |
| S03-01 | 世界易总定义 | 世界易一句话是什么 | `/world-yi` | 16:9 |
| S03-02 | AI 时代判断语言 | 为什么 AI 时代需要世界易 | `/world-yi/book` | 16:9 |
| S03-03 | 结构时位环境动作风险复盘 | 世界易怎么判断 | `/world-yi` | 16:9 |
| S03-04 | 六层引力 | 为什么用户愿意靠近 | `/world-yi` | 16:9 |
| S03-05 | 五大学理基础 | 理论根基是什么 | `/world-yi` | 16:9 |
| S03-06 | 易学现代翻译 | 旺衰、吉凶、用神如何现代化 | 知识页 | 3:2 |
| S03-07 | 不是宿命论 | 世界易和恐吓式命理的边界 | FAQ | 4:5 |
| S03-08 | 十卷主书结构 | 主书工程如何组织 | `/world-yi/book` | 16:9 |
| S03-09 | 版本治理 | 为什么持续更新 | `/world-yi/publish` | 3:2 |
| S03-10 | 人与世界双轴 | 不只看个人，也看环境 | `/world-yi/domains` | 16:9 |
| S03-11 | 天时地利人和 | 古典语言如何进入现代判断 | 知识页 | 3:2 |
| S03-12 | 时代迁移 | 工业、信息、AI 时代的判断变化 | 主书页 | 16:9 |
| S03-13 | 母语系统 | 为什么需要可记忆的判断语言 | 世界易页 | 3:2 |
| S03-14 | 宗教学心理学哲学神学汇流 | 人文学底座如何参与判断 | 主书页 | 16:9 |
| S03-15 | 从被看透到拿回判断 | 用户心理位置如何改变 | FAQ、社媒 | 4:5 |
| S03-16 | 判断不是答案，是顺序 | 世界易输出的本质是什么 | 知识页 | 3:2 |
| S03-17 | 世界易与产品表达 | 学说如何落进报告和工具 | `/world-yi` | 16:9 |
| S03-18 | 世界易内容宇宙 | 文档、主书、内容矩阵的关系 | `/world-yi/matrix` | 16:9 |

### 9.5 S04 人生六域结构，18 张

| ID | 图片主题 | 核心问题 | 投放位置 | 规格 |
| --- | --- | --- | --- | --- |
| S04-01 | 人生六域总图 | 六域如何覆盖现实问题 | `/world-yi/domains`、`/tools` | 16:9 |
| S04-02 | 事业结构图 | 事业看赛道、位置、权限、窗口 | 事业工具页 | 4:5 |
| S04-03 | 财富结构图 | 财富看现金流、扩张、风险、定价 | 财富工具页 | 4:5 |
| S04-04 | 关系结构图 | 关系看节奏、边界、承诺、修复 | 关系工具页 | 4:5 |
| S04-05 | 健康结构图 | 健康看透支、恢复、睡眠、环境 | 健康工具页 | 4:5 |
| S04-06 | 家庭结构图 | 家庭看责任、代际、照护、家宅 | 家庭工具页 | 4:5 |
| S04-07 | 迁移结构图 | 迁移看城市、身份、成本、落地 | 迁移工具页 | 4:5 |
| S04-08 | 事业年度窗口 | 换工作、升职、创业如何判断 | 事业内容页 | 16:9 |
| S04-09 | 财富年度窗口 | 扩张、投资、现金流如何判断 | 财富内容页 | 16:9 |
| S04-10 | 关系年度窗口 | 动婚、复合、分手如何判断 | 关系内容页 | 16:9 |
| S04-11 | 健康恢复窗口 | 透支和恢复如何分阶段 | 健康内容页 | 16:9 |
| S04-12 | 家庭责任窗口 | 父母、孩子、伴侣如何排序 | 家庭内容页 | 16:9 |
| S04-13 | 迁移落地窗口 | 出国、回国、双城如何判断 | 迁移内容页 | 16:9 |
| S04-14 | 六域相互影响 | 事业、关系、家庭如何互相牵动 | 报告页 | 16:9 |
| S04-15 | 领域优先级 | 当前应该先处理哪个域 | 报告页 | 3:2 |
| S04-16 | 同一问题跨域判断 | 一个问题为什么不能只看单点 | 案例页 | 16:9 |
| S04-17 | 六域工具推荐 | 报告如何推荐工具 | 报告页、工具页 | 16:9 |
| S04-18 | 六域内容入口 | 每个领域对应知识与案例 | `/knowledge`、`/cases` | 16:9 |

### 9.6 S05 120 工具结构，14 张

| ID | 图片主题 | 核心问题 | 投放位置 | 规格 |
| --- | --- | --- | --- | --- |
| S05-01 | 120 工具总星图 | 工具中心为什么不是单一测算 | `/tools` | 16:9 |
| S05-02 | 单项工具原则 | 一次只判断一个具体问题 | 工具详情页 | 3:2 |
| S05-03 | 报告后工具推荐 | 为什么报告后继续跑工具 | 报告页 | 16:9 |
| S05-04 | 工具结果页结构 | 工具结果如何阅读 | 工具结果页 | 16:9 |
| S05-05 | 工具历史沉淀 | 工具如何形成个人上下文 | 历史页 | 16:9 |
| S05-06 | 事业工具组 | 20 个事业工具如何组织 | 事业分类页 | 4:5 |
| S05-07 | 财富工具组 | 20 个财富工具如何组织 | 财富分类页 | 4:5 |
| S05-08 | 关系工具组 | 20 个关系工具如何组织 | 关系分类页 | 4:5 |
| S05-09 | 健康工具组 | 15 个健康工具如何组织 | 健康分类页 | 4:5 |
| S05-10 | 家庭工具组 | 15 个家庭工具如何组织 | 家庭分类页 | 4:5 |
| S05-11 | 迁移工具组 | 15 个迁移工具如何组织 | 迁移分类页 | 4:5 |
| S05-12 | 阶段窗口工具组 | 时间窗口工具如何使用 | 时间工具页 | 4:5 |
| S05-13 | 生活应用工具组 | 起名、择时、寻物、家宅如何使用 | 应用工具页 | 4:5 |
| S05-14 | 工具到付费服务 | 什么时候需要深度服务 | 工具结果页 | 16:9 |

### 9.7 S06 内容矩阵结构，12 张

| ID | 图片主题 | 核心问题 | 投放位置 | 规格 |
| --- | --- | --- | --- | --- |
| S06-01 | 内容增长闭环 | 热点如何变成站内内容 | 运营页 | 16:9 |
| S06-02 | 知识案例洞察三件套 | 一个主题如何拆三种页面 | 内容运营页 | 16:9 |
| S06-03 | 知识页结构 | 解释型内容如何组织 | 知识页 | 3:2 |
| S06-04 | 案例页结构 | 场景型内容如何组织 | 案例页 | 3:2 |
| S06-05 | 洞察页结构 | 城市行业内容如何组织 | 洞察页 | 3:2 |
| S06-06 | 2000 内容矩阵 | 世界易内容规模如何扩张 | `/world-yi/matrix` | 16:9 |
| S06-07 | 首批 120 篇矩阵 | 首批公开内容如何覆盖 | `/world-yi/matrix` | 16:9 |
| S06-08 | 自动发布队列 | 草稿、审核、发布窗口如何运行 | 发布页 | 16:9 |
| S06-09 | 质量闸门 | 自动内容如何避免失控 | 运营页 | 3:2 |
| S06-10 | 内链网络 | 内容如何互相推荐 | 内容页 | 16:9 |
| S06-11 | 内容到工具推荐 | 文章如何推荐工具 | 内容页 | 16:9 |
| S06-12 | 内容到报告升级 | 阅读如何进入个人判断 | 内容页 | 16:9 |

### 9.8 S07 全球与多语言结构，8 张

| ID | 图片主题 | 核心问题 | 投放位置 | 规格 |
| --- | --- | --- | --- | --- |
| S07-01 | 简体中文路径 | 大陆与简中用户如何阅读 | 知识页 | 16:9 |
| S07-02 | 繁体中文路径 | 港台与繁中用户如何阅读 | 繁体专题 | 16:9 |
| S07-03 | 英文路径 | 英文读者如何理解世界易 | `/world-yi/en` | 16:9 |
| S07-04 | 海外华人路径 | 跨文化生活如何进入判断 | `/world-yi/global` | 16:9 |
| S07-05 | 术语翻译层 | 八字、时位、结构如何翻译 | 多语言文档 | 3:2 |
| S07-06 | 传统到现代语言 | 古典概念如何避免误读 | FAQ | 3:2 |
| S07-07 | 全球城市环境 | 城市、国家、迁移如何影响判断 | 洞察页 | 16:9 |
| S07-08 | 文化身份与家庭结构 | 海外家庭、代际、身份如何判断 | 案例页 | 16:9 |

### 9.9 S08 转化与长期关系结构，8 张

| ID | 图片主题 | 核心问题 | 投放位置 | 规格 |
| --- | --- | --- | --- | --- |
| S08-01 | 免费测算到深度报告 | 为什么升级 | 报告页 | 16:9 |
| S08-02 | 深度服务工作流 | 高阶服务如何交付 | Premium 页 | 16:9 |
| S08-03 | 月度提醒 | 为什么要订阅 | 报告页、内容页 | 4:5 |
| S08-04 | 年度窗口提醒 | 流年变化如何通知用户 | 订阅页 | 4:5 |
| S08-05 | 复访成长轨迹 | 用户历史如何形成长期价值 | `/profile` | 16:9 |
| S08-06 | 重大事件回填 | 用户反馈如何改善下一次判断 | 事件页 | 16:9 |
| S08-07 | 低焦虑转化 | 如何不靠恐吓卖服务 | 报告页 | 3:2 |
| S08-08 | 从阅读到订阅 | 内容页如何形成长期关系 | 内容页 | 16:9 |

---

## 10. 传播性内容：100 到 300 张

传播性内容目标：让用户愿意保存、转发、分享，并通过图片回到人生K线测算或相关内容。它们要更强标题感、更明确场景、更适合社媒，但仍不能走恐吓和廉价玄学。

### 10.1 传播图三种语言版本

| 版本 | 目标用户 | 文案策略 | 优先级 |
| --- | --- | --- | --- |
| 简体中文 | 大陆用户、简中搜索、站内主内容 | 问题句、年份句、行动句 | P0 |
| 繁体中文 | 港台、海外华人、繁中社群 | 语气更自然，避免大陆平台口号感 | P0 |
| 英文/双语 | 海外华人、英文读者、TikTok/X | 概念解释 + practical timing | P1 |

图片本身仍不建议生成大量文字。传播标题由设计模板覆盖，但每张图必须规划对应标题。

### 10.2 传播图片规格

| 平台/用途 | 比例 | 尺寸 | 主要形式 |
| --- | --- | --- | --- |
| 小红书 / Instagram | 4:5 | `1440x1808` | 封面、收藏卡 |
| 抖音 / 快手 / 视频号 / TikTok | 9:16 | `1088x1920` | 开场图、短视频首帧 |
| 朋友圈 / Telegram / WhatsApp | 1:1 | `1536x1536` | 转发卡、年度提醒 |
| X / LinkedIn / OG | 16:9 | `2048x1152` | 观点卡、链接预览 |
| 站内专题推荐 | 3:2 | `1536x1024` | 专题头图、文章插图 |

### 10.3 传播图主题池总览

| 主题组 | 建议数量 | 核心传播点 | 主要入口 |
| --- | --- | --- | --- |
| P01 流年太岁与年度窗口 | 30 到 60 张 | 年份、太岁、本命年、犯太岁、年度变化 | 年度专题、测算 |
| P02 本命年与生肖传播 | 20 到 40 张 | 本命年不是只穿红，重点是结构与风险 | 测算、知识页 |
| P03 事业与换工作 | 20 到 40 张 | 跳槽、升职、创业、行业窗口 | 事业工具 |
| P04 财富与现金流 | 15 到 30 张 | 偏财、正财、扩张、投资、现金流 | 财富工具 |
| P05 关系与婚恋 | 20 到 40 张 | 动婚、分手、复合、旧人、关系节奏 | 关系工具 |
| P06 健康与恢复 | 10 到 20 张 | 透支、睡眠、恢复、压力窗口 | 健康工具 |
| P07 家庭与代际 | 10 到 20 张 | 父母、孩子、伴侣、家宅秩序 | 家庭工具 |
| P08 迁移与城市 | 10 到 25 张 | 出国、回国、城市适配、双城生活 | 迁移工具 |
| P09 真太阳时与命盘误差 | 10 到 20 张 | 出生时间、地点、时柱变化 | 测算入口 |
| P10 AI 命理与世界易辨识 | 10 到 20 张 | 如何判断不是硬编码，不是套话 | 世界易页 |
| P11 繁体中文专题卡 | 30 到 60 张 | 港台、海外华人、繁中语境传播 | 繁体专题 |
| P12 节气与月度提醒 | 15 到 30 张 | 立春、清明、端午、中秋、冬至等窗口 | 订阅、月度提醒 |

基础版先做 100 张，增长版扩到 300 张。

### 10.4 基础版 100 张配额

| 主题组 | 张数 | 说明 |
| --- | --- | --- |
| P01 流年太岁与年度窗口 | 15 | 先覆盖 2026 丙午、太岁、本命年、年度窗口 |
| P02 本命年与生肖传播 | 10 | 马年、本命年、生肖误区、风险边界 |
| P03 事业与换工作 | 10 | 跳槽、升职、创业、转岗、面试 |
| P04 财富与现金流 | 8 | 偏财、正财、扩张、投资、现金流 |
| P05 关系与婚恋 | 12 | 动婚、复合、分手、旧人、承诺 |
| P06 健康与恢复 | 6 | 透支、睡眠、恢复、压力 |
| P07 家庭与代际 | 6 | 家庭责任、父母压力、孩子节奏、家宅 |
| P08 迁移与城市 | 7 | 出国、回国、城市适配、双城 |
| P09 真太阳时与命盘误差 | 6 | 真太阳时、时柱、大概时辰 |
| P10 AI 命理与世界易辨识 | 6 | AI 命理、套话、世界易判断 |
| P11 繁体中文专题卡 | 10 | 繁体版本高传播标题 |
| P12 节气与月度提醒 | 4 | 立春、清明、中秋、冬至 |
| 合计 | 100 | 第一轮传播图 |

### 10.5 增长版 300 张配额

| 主题组 | 张数 | 说明 |
| --- | --- | --- |
| P01 流年太岁与年度窗口 | 45 | 覆盖年度、季度、月份、太岁误区 |
| P02 本命年与生肖传播 | 30 | 12 生肖 + 本命年 + 犯太岁解释 |
| P03 事业与换工作 | 30 | 事业高频场景全覆盖 |
| P04 财富与现金流 | 25 | 正财、偏财、投资、负债、消费纪律 |
| P05 关系与婚恋 | 35 | 婚恋、旧人、复合、分手、承诺、家庭阻力 |
| P06 健康与恢复 | 18 | 透支、睡眠、压力、恢复、照护 |
| P07 家庭与代际 | 18 | 父母、孩子、伴侣、家宅、代际 |
| P08 迁移与城市 | 22 | 出国、回国、留学、双城、身份成本 |
| P09 真太阳时与命盘误差 | 15 | 出生时间、地点、时差、时柱 |
| P10 AI 命理与世界易辨识 | 15 | AI 内容可信度、结构化判断、非硬编码 |
| P11 繁体中文专题卡 | 30 | 港台、海外华人、繁中热点表达 |
| P12 节气与月度提醒 | 17 | 24 节气精选 + 月度窗口 |
| 合计 | 300 | 完整传播图库 |

### 10.6 P01 流年太岁与年度窗口，示例 30 张

| ID | 标题方向 | 简体覆盖文案 | 繁体覆盖文案 | 入口 |
| --- | --- | --- | --- | --- |
| P01-01 | 2026 丙午年总入口 | 2026 丙午年，你真正要看的不是生肖，是结构 | 2026 丙午年，真正要看的不是生肖，而是你的結構 | `/analyze` |
| P01-02 | 流年不是一句好运坏运 | 流年不是判你好运坏运，而是看今年哪里被放大 | 流年不是一句好運壞運，而是看今年哪裡被放大 | 知识页 |
| P01-03 | 太岁解释 | 太岁不是吓人的词，它提醒你今年哪条线最容易波动 | 太歲不是嚇人的詞，它提醒你今年哪條線最容易波動 | 知识页 |
| P01-04 | 犯太岁去恐吓 | 犯太岁不等于倒霉，重点是别把风险放大 | 犯太歲不等於倒楣，重點是別把風險放大 | 知识页 |
| P01-05 | 年度事业窗口 | 今年适不适合换工作，先看窗口，不先看冲动 | 今年適不適合換工作，先看窗口，不先看衝動 | 事业工具 |
| P01-06 | 年度财富窗口 | 偏财起来时，最先看的不是机会，是承受力 | 偏財起來時，最先看的不是機會，是承受力 | 财富工具 |
| P01-07 | 年度关系窗口 | 动婚年份到了，关系也要看节奏和边界 | 動婚年份到了，關係也要看節奏和邊界 | 关系工具 |
| P01-08 | 年度健康窗口 | 今年最该避开的，可能不是事，是长期透支 | 今年最該避開的，可能不是事，是長期透支 | 健康工具 |
| P01-09 | 年度迁移窗口 | 今年想换城市，先看落地成本和身份压力 | 今年想換城市，先看落地成本和身份壓力 | 迁移工具 |
| P01-10 | 年度家庭窗口 | 家庭压力变大时，先排序责任，不先硬扛 | 家庭壓力變大時，先排序責任，不先硬扛 | 家庭工具 |
| P01-11 | 立春年度切换 | 年度判断从立春开始看，别只看农历新年 | 年度判斷從立春開始看，別只看農曆新年 | 知识页 |
| P01-12 | 年度关键词 | 今年的关键词不是玄学，是阶段位置 | 今年的關鍵詞不是玄學，是階段位置 | `/analyze` |
| P01-13 | 年度风险 | 今年最怕的不是没机会，是错把压力当机会 | 今年最怕的不是沒機會，是錯把壓力當機會 | 报告页 |
| P01-14 | 年度复盘 | 去年没走通的事，今年要先复盘结构 | 去年沒走通的事，今年要先複盤結構 | 历史页 |
| P01-15 | 年度订阅 | 关键窗口到来前，先提醒自己别误判 | 關鍵窗口到來前，先提醒自己別誤判 | 订阅 |
| P01-16 | 太岁与行动 | 太岁不是让你怕，是让你调整动作 | 太歲不是讓你怕，是讓你調整動作 | 知识页 |
| P01-17 | 流年与城市 | 同一年份，在不同城市，落地感会不同 | 同一年份，在不同城市，落地感會不同 | 洞察页 |
| P01-18 | 流年与行业 | 行业环境会放大或压住你的年度窗口 | 行業環境會放大或壓住你的年度窗口 | 洞察页 |
| P01-19 | 年度贵人与合作 | 合作机会出现时，先看关系结构能不能承接 | 合作機會出現時，先看關係結構能不能承接 | 事业工具 |
| P01-20 | 年度旧事回潮 | 旧人旧事回来，不一定是缘分，也可能是复盘 | 舊人舊事回來，不一定是緣分，也可能是複盤 | 关系工具 |
| P01-21 | 年度现金流 | 赚钱窗口来了，也要先守住现金流 | 賺錢窗口來了，也要先守住現金流 | 财富工具 |
| P01-22 | 年度家宅 | 家宅不稳时，人很难稳定判断 | 家宅不穩時，人很難穩定判斷 | 家庭工具 |
| P01-23 | 年度压力峰值 | 压力最大的月份，往往最容易做错决定 | 壓力最大的月份，往往最容易做錯決定 | 月度提醒 |
| P01-24 | 年度启动窗口 | 该启动的时候别拖，该暂停的时候别硬冲 | 該啟動的時候別拖，該暫停的時候別硬衝 | 阶段工具 |
| P01-25 | 年度修复窗口 | 有些年份不适合扩张，适合修复 | 有些年份不適合擴張，適合修復 | 报告页 |
| P01-26 | 年度曝光窗口 | 被看见之前，先确认能不能承接 | 被看見之前，先確認能不能承接 | 事业工具 |
| P01-27 | 年度关系边界 | 今年关系的重点，可能是边界不是结果 | 今年關係的重點，可能是邊界不是結果 | 关系工具 |
| P01-28 | 年度投资风险 | 运势不是投资建议，承受力才是第一层判断 | 運勢不是投資建議，承受力才是第一層判斷 | 财富工具 |
| P01-29 | 年度身份变化 | 迁移、婚姻、职业都会改变身份成本 | 遷移、婚姻、職業都會改變身份成本 | 迁移工具 |
| P01-30 | 年度总 CTA | 先看你的结构，再判断今年该怎么走 | 先看你的結構，再判斷今年該怎麼走 | `/analyze` |

### 10.7 P02 本命年与生肖传播，示例 20 张

| ID | 标题方向 | 简体覆盖文案 | 繁体覆盖文案 | 入口 |
| --- | --- | --- | --- | --- |
| P02-01 | 本命年去恐吓 | 本命年不是一定倒霉，而是结构更容易被放大 | 本命年不是一定倒楣，而是結構更容易被放大 | 知识页 |
| P02-02 | 本命年行动 | 本命年最重要的不是穿红，是少做错方向的决定 | 本命年最重要的不是穿紅，是少做錯方向的決定 | `/analyze` |
| P02-03 | 本命年事业 | 本命年换工作，先看是不是被压力推着走 | 本命年換工作，先看是不是被壓力推著走 | 事业工具 |
| P02-04 | 本命年财富 | 本命年不要只看财运，要先看现金流风险 | 本命年不要只看財運，要先看現金流風險 | 财富工具 |
| P02-05 | 本命年关系 | 本命年关系波动，先分清修复还是消耗 | 本命年關係波動，先分清修復還是消耗 | 关系工具 |
| P02-06 | 本命年健康 | 本命年更要看长期透支，而不是只看吉凶 | 本命年更要看長期透支，而不是只看吉凶 | 健康工具 |
| P02-07 | 生肖误区 | 生肖只能给入口，不能替代个人结构 | 生肖只能給入口，不能替代個人結構 | 知识页 |
| P02-08 | 生肖马传播 | 属马的人，2026 年别只看本命年标签 | 屬馬的人，2026 年別只看本命年標籤 | `/analyze` |
| P02-09 | 生肖与时辰 | 同一生肖，不同时辰可能完全不是一种节奏 | 同一生肖，不同時辰可能完全不是一種節奏 | 真太阳时页 |
| P02-10 | 生肖与城市 | 同一生肖，在不同城市承受的压力不一样 | 同一生肖，在不同城市承受的壓力不一樣 | 洞察页 |
| P02-11 | 生肖与关系 | 生肖合不合，不如关系节奏能不能承接 | 生肖合不合，不如關係節奏能不能承接 | 关系工具 |
| P02-12 | 生肖与财富 | 生肖财运不能替你判断杠杆和风险 | 生肖財運不能替你判斷槓桿和風險 | 财富工具 |
| P02-13 | 生肖与事业 | 生肖不是职业建议，阶段窗口才是重点 | 生肖不是職業建議，階段窗口才是重點 | 事业工具 |
| P02-14 | 生肖与迁移 | 想换城市，别只看生肖，看落地成本 | 想換城市，別只看生肖，看落地成本 | 迁移工具 |
| P02-15 | 本命年复盘 | 本命年适合复盘过去一轮怎么走过来的 | 本命年適合複盤過去一輪怎麼走過來的 | 历史页 |
| P02-16 | 本命年风险 | 本命年最怕情绪上头，把小风险做大 | 本命年最怕情緒上頭，把小風險做大 | 报告页 |
| P02-17 | 本命年机会 | 本命年也有机会，但要看你能不能承接 | 本命年也有機會，但要看你能不能承接 | `/analyze` |
| P02-18 | 犯太岁分类 | 犯太岁不是同一种问题，要分结构看 | 犯太歲不是同一種問題，要分結構看 | 知识页 |
| P02-19 | 太岁与本命年 | 太岁、本命年都只是入口，不是最终判断 | 太歲、本命年都只是入口，不是最終判斷 | 世界易页 |
| P02-20 | 本命年 CTA | 别用生肖吓自己，先看你的个人结构 | 別用生肖嚇自己，先看你的個人結構 | `/analyze` |

### 10.8 P11 繁体中文专题卡，示例 30 张

繁体中文传播卡不只是简体转繁体。语气要更像港台与海外华人自然表达，减少“玄学焦虑”和大陆平台式标题。

| ID | 繁体覆盖文案 | 主题 | 入口 |
| --- | --- | --- | --- |
| P11-01 | 你不是沒有方向，只是還沒看清自己現在的位置 | 总入口 | `/analyze` |
| P11-02 | 今年真正要看的，不是運氣，而是你能承受什麼 | 流年 | 报告页 |
| P11-03 | 太歲不是用來嚇人的，是提醒你哪裡容易失衡 | 太岁 | 知识页 |
| P11-04 | 本命年不是一定不好，是更需要穩住節奏 | 本命年 | 知识页 |
| P11-05 | 換工作之前，先看你是被機會拉動，還是被壓力推走 | 事业 | 事业工具 |
| P11-06 | 感情不是只看有沒有緣分，也要看能不能承接 | 关系 | 关系工具 |
| P11-07 | 財運不是叫你冒險，先看現金流能不能撐住 | 财富 | 财富工具 |
| P11-08 | 適合出走的人，也要看落地成本和身份壓力 | 迁移 | 迁移工具 |
| P11-09 | 家庭壓力不是靠硬撐解決，要先排出責任順序 | 家庭 | 家庭工具 |
| P11-10 | 身體不是突然垮掉，很多訊號早就出現了 | 健康 | 健康工具 |
| P11-11 | 舊人回來，不一定是重來，也可能是讓你重新看清 | 关系 | 关系工具 |
| P11-12 | 今年適不適合結婚，不能只看年份，要看關係節奏 | 婚恋 | 关系工具 |
| P11-13 | 創業不是只看膽量，要看窗口、承受力和退路 | 创业 | 事业工具 |
| P11-14 | 有些年份適合擴張，有些年份適合修補 | 流年 | 报告页 |
| P11-15 | 你要的不是被算準，而是知道下一步怎麼走 | 世界易 | 世界易页 |
| P11-16 | 真太陽時會影響時柱，也會影響你對自己的理解 | 真太阳时 | 知识页 |
| P11-17 | 同一個命盤，換一座城市，落地感可能完全不同 | 城市 | 洞察页 |
| P11-18 | 關係裡最難的不是選擇，是看清彼此的節奏 | 关系 | 案例页 |
| P11-19 | 當你一直做錯決定，問題可能不在努力，而在時位 | 方法 | 世界易页 |
| P11-20 | 世界易不是要你相信命，而是重新拿回判斷 | 世界易 | `/world-yi` |
| P11-21 | 年度窗口來之前，先知道自己該進還是該守 | 年度提醒 | 订阅 |
| P11-22 | 有些焦慮不是你想太多，是環境真的在放大壓力 | 环境 | 洞察页 |
| P11-23 | 適合你的賽道，不一定是現在最熱門的賽道 | 事业 | 事业工具 |
| P11-24 | 財富要看進帳，也要看流失和承受力 | 财富 | 财富工具 |
| P11-25 | 分手不是唯一答案，修復也不是永遠正確 | 关系 | 关系工具 |
| P11-26 | 出國、回國、留下，都不是單純的好壞選擇 | 迁移 | 迁移工具 |
| P11-27 | 家宅秩序穩了，人做決定會穩很多 | 家庭 | 家宅工具 |
| P11-28 | AI 可以給答案，但你仍然需要判斷順序 | AI 命理 | 知识页 |
| P11-29 | 看報告不是為了貼標籤，是為了找到行動順序 | 报告 | 报告页 |
| P11-30 | 先看結構，再看今年怎麼走 | CTA | `/analyze` |

### 10.9 传播图提示词模板

```text
Draw a shareable social cover image for Life Kline / World Yi.

Audience:
{Simplified Chinese users | Traditional Chinese users in Taiwan, Hong Kong, and overseas Chinese communities | global Chinese bilingual users}

Topic:
{topic}

User emotion:
{anxiety | curiosity | relationship uncertainty | career decision pressure | yearly timing concern}

Visual metaphor:
{metaphor}

Composition:
{4:5 vertical cover | 9:16 mobile story | 1:1 share card | 16:9 link card}. Use one strong central visual, large clean headline safe area, and a clear secondary safe area for CTA overlay.

Style:
Modern Eastern judgment-system editorial design, warm parchment, ink black structure, jade teal reasoning layer, cinnabar focal point, muted gold timing detail, calm but shareable.

Avoid:
Fortune teller, crystal ball, cheap zodiac icons, scary destiny, random Chinese characters, cluttered small text, sensational fear marketing, generic neon AI.

Text rule:
Do not render readable text. The Chinese or Traditional Chinese headline will be overlaid later.

Output:
Size {size}, quality medium, no transparent background.
```

### 10.10 传播图转化规则

每张传播图必须在资产表中写清：

- 主题组
- 简体标题
- 繁体标题
- 目标用户情绪
- 对应站内入口
- 对应工具或内容 slug
- 是否适合年度复用
- 是否需要按年份更新

不可上线的传播图：

- 只制造恐惧，没有下一步动作。
- 只讲生肖，没有引导用户进入个人结构判断。
- 只讲“好运/倒霉”，没有风险边界和行动建议。
- 只适合社媒热闹，无法回到测算、报告、工具或内容。

---

## 11. 高优先级成品提示词

以下提示词可直接作为第一批生成的起点。生产时只需要替换尺寸、质量和输出格式。

### A01：产品宇宙图

```text
Draw a premium product universe illustration for Life Kline.

Subject:
Life Kline as a structured personal judgment product that connects analysis, report, tools, knowledge articles, case studies, insights, profile history, and World Yi.

Must show:
A central personal analysis cockpit, connected to six surrounding surfaces: report, 120 single-purpose tools, knowledge, cases, environmental insights, and World Yi doctrine. Show the flow from a user question into structured judgment and then into next actions.

Composition:
16:9 wide hero image. Central cockpit in the middle, orbiting modules around it, soft connecting lines, clear negative space on the left for a Chinese headline. The structure should feel like a product map, not a mystical altar.

Style:
Cinematic editorial infographic, layered parchment and modern interface panels, subtle ink lines, jade teal data glow, cinnabar action accents, muted gold timing details, warm paper texture, high-trust product design.

Avoid:
Fortune teller, crystal ball, cheap zodiac icons, horror mysticism, random Chinese characters, cluttered small text, generic neon AI, purple SaaS default style.

Text rule:
Do not render readable text. Use abstract label blocks only.

Output:
Aspect ratio 16:9, size 2048x1152, quality high, no transparent background.
```

### A02：用户旅程图

```text
Draw a Life Kline user journey illustration.

Subject:
A user starts from a public content article, enters personal analysis, receives a structured report, runs recommended tools, saves history, and returns for future timing updates.

Must show:
Five connected stages: content reading, analysis form, personal report, tool recommendation, history and revisit loop. Use visual panels instead of readable text.

Composition:
A left-to-right flow with a human silhouette or user avatar moving through calm product interface gates. Each stage should be distinct but connected by a warm gold timing line. Leave top-left and bottom-right safe areas for Chinese overlay copy.

Style:
Modern Eastern product education illustration, warm parchment background, clean interface layers, ink structure lines, jade teal highlights, cinnabar action markers, muted gold timeline.

Avoid:
Mystical fortune telling, scary destiny, small generated text, random symbols, generic AI neon, overdecorated interface clutter.

Output:
Aspect ratio 16:9, size 2048x1152, quality high, no transparent background.
```

### B02：世界易方法总式图

```text
Draw an editorial infographic for the core method of World Yi.

Subject:
The World Yi judgment formula: structure, timing-position, environment, action, risk, review.

Must show:
Six abstract stations arranged as a clear judgment sequence. Structure should look like a stable foundation, timing-position like a calendar or sundial, environment like city and family pressure fields, action like a focused path, risk like a cinnabar warning mark, review like a loop returning feedback into the system.

Composition:
16:9 wide diagram, six stations connected by a single elegant line. No readable text inside the image. Leave a large clean title safe area at the top.

Style:
High-trust modern Eastern judgment system, layered paper and interface panels, ink-black structure lines, jade teal reasoning layer, cinnabar risk marker, muted gold time indicators, calm and precise.

Avoid:
Crystal ball, fortune teller, random Chinese words, dense small labels, scary mysticism, zodiac stickers, generic sci-fi neon.

Output:
Aspect ratio 16:9, size 2048x1152, quality high, no transparent background.
```

### B03：六层引力模型图

```text
Draw a premium conceptual illustration for the six attraction layers of World Yi.

Subject:
World Yi attracts users through cognition, emotion, identity, action, language, and social belonging.

Must show:
Six translucent layers around a central calm human figure or decision core. Each layer should be visually distinct: cognitive clarity, emotional settling, identity restoration, action compression, memorable language, and community belonging.

Composition:
Centered layered orbit diagram, symmetrical but not rigid, suitable for a World Yi doctrine page. Use abstract blocks only, no readable text. Leave side space for Chinese explanations.

Style:
Editorial, philosophical, warm parchment and ink, jade teal translucent layers, subtle gold orbit lines, cinnabar focal point for action, modern product intelligence.

Avoid:
Religious cult aesthetics, mystical fear, fortune-telling props, random Chinese text, cluttered chart labels, neon AI cliché.

Output:
Aspect ratio 16:9, size 2048x1152, quality high, no transparent background.
```

### C01：十二应用地图

```text
Draw a World Yi application-domain map.

Subject:
World Yi applies to personal destiny analysis, relationships, career, wealth, health, migration, naming, lost item recovery, timing selection, home order, city observation, and industry observation.

Must show:
A large map-like constellation with twelve distinct domain islands or nodes around a central World Yi judgment compass. Some nodes should feel personal, some domestic, some urban, some global.

Composition:
16:9 wide map, central compass, twelve surrounding nodes connected by subtle ink and jade lines. Leave a clean header safe zone. Do not put readable labels inside the image.

Style:
Modern Eastern decision atlas, parchment map texture, ink linework, jade teal connections, cinnabar focus points, muted gold coordinates, calm and authoritative.

Avoid:
Fantasy map cliché, dragon-heavy mysticism, random Chinese characters, zodiac sticker style, cluttered tiny labels.

Output:
Aspect ratio 16:9, size 2048x1152, quality high, no transparent background.
```

### D01：120 工具星图

```text
Draw a product illustration for the Life Kline 120 single-purpose tool center.

Subject:
120 tools organized around life domains, each tool answers one specific real-life question after the comprehensive report.

Must show:
A central report core connected to many small tool modules grouped into six major clusters: career, wealth, relationship, health, family, and migration. The visual should imply scale without requiring all 120 tools to be individually readable.

Composition:
16:9 wide constellation diagram. Central report panel, six orbit clusters, many small abstract cards. Leave a clean area for a headline and CTA overlay.

Style:
High-trust product system map, warm parchment base, modern interface cards, ink structure lines, jade teal cluster glow, cinnabar selected next-action path, muted gold timing details.

Avoid:
Clutter, readable tiny text, generic app dashboard, random icons, fortune teller, crystal ball, cheap horoscope symbols.

Output:
Aspect ratio 16:9, size 2048x1152, quality high, no transparent background.
```

### E01：内容引擎图

```text
Draw a system illustration for the Life Kline content growth engine.

Subject:
Public topics and social signals become site content, then content sends users into analysis, tools, subscriptions, and future content planning.

Must show:
A circular pipeline: signal radar, topic selection, AI-assisted generation, draft review, scheduled publishing, analytics, and next queue. Connect the pipeline to public pages: knowledge, cases, insights, World Yi book, and analysis entry.

Composition:
16:9 operational system map, clear circular flow, product surfaces on the outer ring, quality gate in the middle. Leave right-side safe space for Chinese overlay copy.

Style:
Modern editorial operations map, layered paper plus interface panels, ink black structure, jade teal data flow, cinnabar quality gate, muted gold publishing schedule.

Avoid:
Factory cliché, generic automation robot, random Chinese text, cluttered small labels, neon AI dashboard.

Output:
Aspect ratio 16:9, size 2048x1152, quality high, no transparent background.
```

### G01：知识页封面母版

```text
Draw a reusable editorial cover template for Life Kline knowledge articles.

Subject:
An explanatory knowledge article about World Yi, timing, structure, true solar time, relationship rhythm, career windows, wealth risk, or environment influence.

Must show:
One clear conceptual metaphor: a calm judgment compass over layered paper, with subtle interface cards and a single highlighted cinnabar point. The cover must be generic enough to support many article titles added later.

Composition:
4:5 vertical cover, strong central visual, quiet background, large empty area at top-left for a Chinese title and smaller empty area near bottom for subtitle and CTA.

Style:
Premium Chinese editorial cover, warm parchment, ink lines, jade teal reasoning layer, muted gold timing marks, high trust, no sensationalism.

Avoid:
Generated readable text, random Chinese symbols, fortune teller, zodiac icons, scary destiny, overdecorated mysticism, generic AI neon.

Output:
Aspect ratio 4:5, size 1440x1808, quality medium, no transparent background.
```

---

## 12. 页面投放规划

### 9.1 首页 `/`

建议投放：

- A01 产品宇宙图：解释整站是什么。
- A02 用户旅程图：解释从问题到判断的路径。
- B02 方法总式图：把世界易方法压缩成产品语言。
- C02 人生六域图：引导进入工具和内容。

首页图片不宜太玄，应该更像高信任产品和判断系统。

### 9.2 世界易总入口 `/world-yi`

建议投放：

- B01 世界易总图
- B02 方法总式图
- B03 六层引力模型图
- B04 五大学理基础图
- B05 不是算命图

这里可以更理论、更宏大，但每张图仍然只解释一个问题。

### 9.3 测算入口 `/analyze`

建议投放：

- A03 报告解剖图
- A04 隐私与信任图
- A02 用户旅程图的轻量版本

测算页图片要降低用户填写出生信息时的心理负担，强调“默认私密、可执行、非恐吓”。

### 9.4 结果页 `/result/[id]`

建议投放：

- A03 报告解剖图
- B02 方法总式图
- D02 报告后推荐工具图
- F01 免费到深度服务图

结果页图片要帮助用户继续行动，而不是停留在“看完报告”。

### 9.5 工具中心 `/tools`

建议投放：

- D01 120 工具星图
- C02 人生六域图
- D04 六类工具入口图

工具页要突出“一个工具解决一个具体问题”，避免用户以为工具只是报告的重复。

### 9.6 工具详情页 `/tools/[slug]`

建议投放：

- D05 工具详情场景图
- 对应领域的 C06 / C07 / C08 派生图

每个工具可以不单独生成完全独立大图，先按领域和场景模板生成，后续再根据高访问工具补专属图。

### 9.7 知识页 `/knowledge/[slug]`

建议投放：

- G01 知识页封面模板
- E03 跨表面旅程图
- 对应主题的领域图

知识页封面要服务 SEO 与社媒分享，标题由页面覆盖。

### 9.8 案例页 `/cases/[slug]`

建议投放：

- G02 案例页封面模板
- A02 用户旅程图局部
- 对应现实场景图

案例页图片要有“真实生活问题”的感受，但不要生成具体可识别人物。

### 9.9 洞察页 `/insights/...`

建议投放：

- G03 洞察页封面模板
- C05 城市与行业环境图

洞察页视觉要突出“环境会改变同一结构的落地结果”。

### 9.10 世界易专题页

建议投放：

- `/world-yi/book`：B07 十卷主书工程图、B06 AI 时代定位图
- `/world-yi/domains`：C01 十二应用地图、C02 人生六域图
- `/world-yi/global`：C04 全球华人与英文层
- `/world-yi/matrix`：E04 2000 内容矩阵图
- `/world-yi/publish`：E01 内容引擎图、E05 质量治理图

---

## 13. 批量生产节奏

### Phase 1：说明性内容，20 张

目的：

- 覆盖首页、世界易页、测算页、结果页、工具中心、内容封面母版。

产出：

- 20 张核心图
- 3 个封面母版
- 1 套视觉规范
- 1 套提示词可复用模板

建议周期：

- 1 到 2 天生成草稿
- 1 天筛选和修订
- 1 天接入页面

### Phase 2：结构性内容，100 张

目的：

- 把人生K线、世界易、报告、工具、内容矩阵、全球路径和长期转化全部图解化。

产出：

- S01 到 S08 共 100 张结构图
- 站内页面插图
- 主书、专题、长文可复用图谱
- 运营页与后台说明图

优先顺序：

1. 产品系统结构
2. 报告与测算结构
3. 世界易理论结构
4. 人生六域结构
5. 120 工具结构
6. 内容矩阵结构
7. 全球与多语言结构
8. 转化与长期关系结构

建议周期：

- 2 到 3 天生成第一轮草稿
- 1 到 2 天筛选和统一风格
- 2 到 4 天分批接入站内页面和内容模板

### Phase 3：传播性内容基础版，100 张

目的：

- 先覆盖流年太岁、本命年、事业、财富、关系、真太阳时、繁体中文等高传播主题。

产出：

- 100 张传播图
- 简体标题与繁体标题
- 4:5、9:16、1:1、16:9 的平台适配版本
- 每张图绑定测算、知识、案例或工具入口

优先顺序：

1. 流年太岁与年度窗口
2. 本命年与生肖传播
3. 关系与婚恋
4. 事业与换工作
5. 财富与现金流
6. 繁体中文专题卡
7. 真太阳时与命盘误差
8. AI 命理与世界易辨识

### Phase 4：传播性内容增长版，300 张

目的：

- 把第一轮验证有效的传播主题扩展成年度可复用图库，支撑全年内容分发。

生成方式：

- 不为每篇文章从零设计。
- 先建立主题模板，再按标题、领域、场景、年份、用户问题做批量变体。
- 同一主题至少产出简体、繁体、社媒竖版、站内横版。

重要规则：

- 社媒图必须保留大标题安全区。
- 标题不要靠图片生成，统一由模板覆盖。
- 每个热点主题至少有“知识封面、案例封面、洞察封面”三件套。
- 所有流年、太岁、本命年图片都要避免恐吓，必须导向个人结构判断。

---

## 14. 批量生成 CSV 字段建议

后续可以用 CSV 或 JSON 驱动脚本批量调用 `gpt-image-2`。

```csv
id,batch,title,contentType,surface,route,ratio,size,quality,subject,elements,layout,overlayCopy,alt,priority,status
A01,A,产品宇宙图,product,home,/,16:9,2048x1152,high,"Life Kline product universe","analysis, report, tools, knowledge, cases, insights, World Yi","central cockpit with orbiting surfaces","看清结构、阶段、环境与下一步动作","人生K线产品宇宙结构图",P0,planned
```

字段说明：

- `id`：固定资产编号。
- `batch`：A 到 G。
- `contentType`：product、doctrine、domain、tool、content、premium、social。
- `surface`：home、world-yi、analyze、result、tools、knowledge、case、insight、social。
- `route`：目标页面。
- `ratio`：页面需要的比例。
- `size`：符合官方约束的尺寸。
- `quality`：草稿 `low`，上线 `medium` 或 `high`。
- `subject`：图片主题。
- `elements`：必须出现的视觉元素。
- `layout`：构图要求。
- `overlayCopy`：后续前端覆盖文案。
- `alt`：无障碍与 SEO 描述。
- `priority`：P0、P1、P2。
- `status`：planned、drafted、approved、published、retired。

---

## 15. 质量检查清单

每张图上线前必须检查：

- 是否 3 秒内解释了一个明确问题。
- 是否符合“东方判断系统 + 现代产品智能”的方向。
- 是否避免了水晶球、恐吓、廉价生肖、随机中文。
- 是否有足够的中文标题覆盖空间。
- 是否没有难以阅读的小字。
- 是否在移动端裁切后仍然能看懂主体。
- 是否和世界易母语一致：结构、时位、环境、动作、风险、复盘。
- 是否能导向用户下一步：测算、报告、工具、继续阅读或订阅。
- 是否有 alt 文案和投放页面记录。
- 是否没有把世界易表达成宿命论。

---

## 16. 失败样式处理

如果生成结果出现问题，按以下方式修正：

| 问题 | 修正提示 |
| --- | --- |
| 图片太玄 | Add more modern product interface panels, reduce mystical symbols, make it feel like a decision system. |
| 图片太 SaaS | Add warm parchment, ink structure lines, muted gold timing marks, and Eastern editorial depth. |
| 中文乱码 | Remove all readable text, use abstract label blocks only, leave empty title space. |
| 画面太乱 | Simplify to one central metaphor, reduce nodes by half, use more negative space. |
| 太像占卜 | Remove fortune teller props, crystal balls, zodiac icons, and destiny fear. Focus on structured judgment and next action. |
| 缺少转化感 | Add a clear path from user question to analysis, report, tool, and next action. |
| 品牌不统一 | Use the Life Kline visual system: parchment, ink black, jade teal, cinnabar, muted gold, modern interface layers. |

---

## 17. 与内容体系的绑定规则

### 14.1 知识内容

知识页图片应解释“原理”。

适合图形：

- 方法图
- 时间轴
- 结构分层
- 概念对照
- 判断公式

典型选题：

- 真太阳时为什么重要
- 丙午流年如何影响事业窗口
- 为什么报告最重要的是动作而不是术语
- AI 命理是否可靠，如何判断不是硬编码

### 14.2 案例内容

案例页图片应解释“场景”。

适合图形：

- 人物站在现实分岔路前
- 职业、关系、家庭、迁移的压力场
- 一个问题进入报告和工具的路径
- 冲突、恢复、重建的阶段图

典型选题：

- 换工作前，真正该看的是时机不是标签
- 动婚年份到了，为什么关系还是推进困难
- 只知道大概时辰，系统如何做稳定判断

### 14.3 洞察内容

洞察页图片应解释“环境”。

适合图形：

- 城市地图
- 行业网络
- 年份窗口
- 宏观压力场
- 同一结构在不同城市中的变化

典型选题：

- 北京、上海、深圳的城市运如何影响同一命盘
- 2026 科技行业是进攻还是稳现金流
- 离火九运下哪些行业更容易波动

### 14.4 世界易内容

世界易专题图片应解释“体系”。

适合图形：

- 学说总图
- 十卷主书工程
- 六层引力
- 五大学理基础
- 2000 内容矩阵
- 全球传播路径

---

## 18. 推荐执行顺序

1. 先生成 A01、B01、B02、D01、G01、G02、G03，建立基础视觉风格。
2. 选出 1 套主风格后，用 edits endpoint 统一其他图片，不要每张都重新发散。
3. 完成说明性 20 张，接入首页、世界易页、测算页、报告页、工具页和内容页封面。
4. 生成结构性 100 张，先接入世界易、报告、工具、内容矩阵、全球路径，再补运营说明页。
5. 生成传播性基础版 100 张，重点验证流年太岁、本命年、关系、事业、财富、繁体中文卡片。
6. 根据收藏、转发、点击测算和工具运行数据，把有效主题扩展到传播性增长版 300 张。

---

## 19. 结论

人生K线和世界易的图片体系，应围绕一个核心判断建立：

`用户不是来看玄学装饰的，而是来恢复判断秩序的。`

所以所有图片都要共同传达：

- 世界易是 AI 时代的高维判断语言。
- 人生K线是把世界易落到个人测算、报告、工具、内容和复访里的产品系统。
- 每一张图都应该把用户从“我被命运解释”带向“我可以看清结构，然后做下一步动作”。
