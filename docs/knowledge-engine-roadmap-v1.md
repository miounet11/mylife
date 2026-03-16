# 玄学 / 命理 / 易学资料引擎路线图 V1

## 目标

把当前站点的内容系统，从“能发知识文章与案例”升级为“可持续采集、归档、抽取、索引、发布”的资料引擎。

目标不是镜像别人的站点，更不是整站搬运，而是建立：

1. 合规的来源采集层
2. 可追溯的书目与出处层
3. 面向概念 / 流派 / 书籍 / 问题 / 案例的知识结构层
4. 对外发布的原创知识库与专题页层
5. 检索、推荐、关系跳转组成的资料系统

## 当前基础

仓库已具备以下能力：

- `content_entries`：可管理知识、案例、洞察内容
- `content_signals`：可管理外部热点 / 来源信号
- `content_radar`：可拉取 RSS / Atom 并打分
- `content_ops`：可围绕选题簇自动生成内容
- `/knowledge`、`/cases`：已有前台内容承接页

当前缺口不在“发文章”，而在“来源治理”和“知识结构化”：

- 没有来源文档表
- 没有版权 / 许可状态表
- 没有书目表
- 没有实体与关系表
- 没有面向古籍 / 流派 / 作者 / 问题的知识树

## 对 bb-browser / bb-sites 的判断

### 值得用的地方

`bb-browser` 适合做登录态页面采集与站点 CLI 化，尤其适合：

- 知乎问题页、回答页、搜索结果页
- 小红书搜索、笔记、评论
- B 站视频页、评论页、频道页
- YouTube transcript、评论、频道页
- Reddit / X / GitHub 等需要上下文拼装的页面

它的价值在于：

- 直接运行在用户真实浏览器上下文
- 利用已登录状态获取结构化结果
- 适合 Agent 驱动的“定点提取”
- 适合快速验证一个站点是否值得接入

### 不该承担的角色

`bb-browser` 不应成为主抓取底座：

- 不适合整站镜像
- 不适合大规模稳定批采
- 不适合直接保存整页 HTML 作为知识资产
- 不适合无差别复刻平台内容

结论：

- `bb-browser` 应作为“特种采集入口”
- `RSS / 官方公开页面 / 公版文本库` 应作为“主数据来源”

## 合规边界

### 可以做

- 保存标题、链接、作者、发布时间、平台、摘要、标签、互动信号
- 保存你自己的结构化提要、评论、知识点归纳、主题映射
- 生成导读、综述、比较、书单、问题地图、流派地图
- 对古籍、公版文本、开放许可资料做结构化整理

### 不应该做

- 复刻知乎 / CSDN / 小红书 / B 站等平台原文全文
- 批量重发平台评论、回答、图片、课程文本
- 把现代书籍译注、排版版本、PDF 直接搬进站内
- 用“稍微改写”掩盖实质性复制

### 权利模型

每条外部来源必须带 `rights_status`：

- `public_domain`
- `open_license`
- `licensed`
- `platform_restricted`
- `unknown`

对外发布规则：

- `public_domain` / `open_license`：可按许可范围再利用
- `licensed`：仅按授权范围使用
- `platform_restricted` / `unknown`：只保留摘要、索引、知识映射，不重发原文

## 资料源优先级

### 第一层：公版与开放资料

优先接入：

- Chinese Text Project
- 中文维基文库
- Open Library
- Internet Archive
- Project Gutenberg

这一层适合承接：

- 周易
- 道德经
- 清静经
- 参同契
- 推背图等公版文献
- 早期译本、古籍影印与公版索引

注意：

- 站点开放访问不等于你可以无条件批量抓取或再发布
- 即便是公版文本，也要区分原文、公版译本、现代注释版

### 第二层：官方 / 授权 / 稳定书目源

优先用于建立书目和版本信息：

- Open Library subject / edition 页面
- 出版社官网
- 作者官网
- 官方课程 / 公开讲义页面

这一层的目标是拿元数据，不是拿全文。

### 第三层：问题与讨论平台

适合提取“真实用户问题”和“热点议题”：

- 知乎
- 小红书
- B 站
- Reddit
- X / Twitter
- YouTube
- 豆瓣
- 微博

这一层产出应为：

- 高频问题
- 争议点
- 常见误解
- 推荐书单信号
- 站内选题输入

### 第四层：站点 CLI 化补采

通过 `bb-sites` 或自定义 adapter 接入：

- `zhihu/hot`
- `zhihu/question`
- `zhihu/search`
- `csdn/search`
- `youtube/transcript`
- `bilibili/video`
- `bilibili/comments`
- `xiaohongshu/search`
- `xiaohongshu/note`

这一层只做“补采”和“验证”，不做主仓。

## 知识树设计

建议把知识库扩成 8 个顶层对象：

1. `topic`
2. `concept`
3. `book`
4. `person`
5. `school`
6. `question`
7. `case`
8. `source_document`

### 推荐顶层目录

#### 1. 基础原理

- 阴阳
- 五行
- 天干地支
- 藏干
- 纳音
- 十神
- 格局
- 调候
- 用神 / 忌神

#### 2. 八字体系

- 排盘方法
- 真太阳时
- 节气边界
- 大运 / 流年 / 流月
- 断事边界
- 常见流派差异

#### 3. 易学体系

- 周易经文
- 十翼
- 卦象系统
- 爻位系统
- 占筮方法
- 梅花易数
- 六爻

#### 4. 相关术数

- 紫微斗数
- 奇门遁甲
- 风水
- 姓名学
- 数字系统

#### 5. 应用专题

- 职业
- 婚恋
- 财富
- 城市迁移
- 升学
- 健康压力
- 家庭关系

#### 6. 方法论

- 命理能解决什么
- 命理不能解决什么
- 证据边界
- 常见误区
- 如何做长期验证

#### 7. 书籍体系

- 原典
- 注本
- 导论
- 流派代表作
- 入门路径
- 版本比较

#### 8. 问题地图

- “八字到底准不准”
- “真太阳时有没有必要”
- “看命盘先看什么”
- “易经占卜和八字的区别”
- “哪些书适合入门”

## 数据模型建议

在现有 `content_entries` 和 `content_signals` 之外，新增以下表。

### 1. `source_documents`

记录所有外部来源的归一化条目。

建议字段：

- `id`
- `source_type`：`rss | site | manual | import`
- `platform`
- `source_id`
- `canonical_url`
- `title`
- `author`
- `published_at`
- `language`
- `summary`
- `tags`
- `raw_meta`
- `rights_status`
- `license_name`
- `reuse_policy`
- `content_hash`
- `created_at`
- `updated_at`

### 2. `bibliography_entries`

记录书籍、古籍、版本、译本、出版社信息。

建议字段：

- `id`
- `title`
- `alt_titles`
- `original_title`
- `author`
- `translators`
- `editors`
- `dynasty_or_period`
- `publication_year`
- `edition_note`
- `publisher`
- `isbn`
- `language`
- `book_type`：`classic | commentary | modern_intro | research | translation`
- `rights_status`
- `source_url`
- `summary`
- `tags`
- `created_at`
- `updated_at`

### 3. `knowledge_entities`

统一管理概念、人物、流派、术语。

建议字段：

- `id`
- `entity_type`：`concept | person | school | method | place | text`
- `name`
- `aliases`
- `slug`
- `summary`
- `description`
- `tags`
- `meta`
- `created_at`
- `updated_at`

### 4. `knowledge_relations`

表达实体之间的关系。

建议字段：

- `id`
- `subject_entity_id`
- `relation_type`
- `object_entity_id`
- `evidence_source_id`
- `confidence_score`
- `created_at`

关系示例：

- `book -> discusses -> concept`
- `school -> interprets -> classic`
- `person -> authored -> book`
- `question -> references -> concept`
- `content_entry -> cites -> source_document`

### 5. `knowledge_fragments`

保存经过清洗的可引用片段或观点摘要，而非整页原文。

建议字段：

- `id`
- `source_document_id`
- `fragment_type`：`summary | quote | claim | question | outline`
- `content`
- `offset_hint`
- `rights_status`
- `review_status`
- `created_at`

### 6. `content_citations`

让站内文章可以溯源到资料来源。

建议字段：

- `id`
- `content_entry_id`
- `source_document_id`
- `citation_label`
- `citation_url`
- `usage_type`：`reference | inspiration | quote | bibliography`
- `created_at`

## 采集流程

### A. 内容信号层

目标：发现问题、热词、书名、流派争议。

来源：

- RSSHub
- 官方 RSS / Atom
- Google News
- 平台热榜
- `bb-browser site`

产出：

- `content_signals`
- 候选问题
- 候选专题
- 候选书单

### B. 来源文档层

目标：把信号沉淀为结构化来源。

处理步骤：

1. 去重
2. 提取标题 / 作者 / 时间 / URL
3. 提取摘要和关键术语
4. 标注权利状态
5. 标注是否允许进入发布链

产出：

- `source_documents`

### C. 知识抽取层

目标：把来源变成知识对象与关系。

处理步骤：

1. 实体识别：书名、作者、术语、流派
2. 术语归一：例如“用神 / 喜用神 / 喜忌”
3. 问题抽取：一句话问题化
4. 观点抽取：正反观点归并
5. 建关系：书籍、概念、案例之间互联

产出：

- `knowledge_entities`
- `knowledge_relations`
- `knowledge_fragments`

### D. 发布层

对外仅发布原创整理页：

- 知识条目页
- 问题综述页
- 书单页
- 版本比较页
- 流派比较页
- 入门路径页
- 案例页

## 玄学 / 命理 / 易学首批来源清单

### 公版经典与基础文本

- 周易 / 易经
- 系辞
- 说卦
- 序卦
- 杂卦
- 道德经
- 清静经
- 周易参同契

### 八字与命理方向

首批应先做“书目 + 评价 + 学派位置”，不先碰全文搬运：

- 滴天髓
- 子平真诠
- 渊海子平
- 三命通会
- 穷通宝鉴
- 神峰通考

### 问答与热点来源

- 知乎：易经、八字、玄学、命理、风水、紫微、奇门相关问题
- 小红书：书单、入门帖、争议帖、经验帖
- B 站：课程、书单、入门视频评论
- 豆瓣：书籍页、书评页、书单页
- YouTube / Reddit：英文世界的 I Ching / Chinese astrology / feng shui 讨论

### 资料型来源

- Chinese Text Project
- 中文维基文库
- Open Library
- Internet Archive
- Project Gutenberg

## 产品形态建议

前台不要只保留 `/knowledge` 一种内容面，建议扩成：

- `/knowledge`：知识文章
- `/topics/[slug]`：专题总览
- `/books/[slug]`：书目与版本页
- `/questions/[slug]`：问题综述页
- `/schools/[slug]`：流派页
- `/sources/[slug]`：来源索引页，仅内部或半公开

每个对象页都应支持：

- 摘要
- 关联概念
- 关联书籍
- 关联问题
- 参考来源
- 继续测算 / 继续咨询入口

## 对现有代码的建议接法

### 第一阶段

只扩库，不改前台结构：

- 在 `lib/database.ts` 增加 4 到 6 张新表
- 在 `lib/user-types.ts` 增加新记录类型
- 在 `lib/` 下增加 `source-store`、`bibliography-store`、`knowledge-graph-store`
- 在 `content_radar` 里增加 `site` 型来源入口

### 第二阶段

新增后台能力：

- 来源导入面板
- 权利状态审核面板
- 书目去重面板
- 实体合并面板
- 引用检查面板

### 第三阶段

新增前台内容面：

- 书籍页
- 问题页
- 专题页
- 流派页

## 首批站点接入顺序

### P0

- RSSHub
- Google News
- Chinese Text Project
- 中文维基文库
- Open Library

### P1

- 知乎
- B 站
- YouTube
- 豆瓣

### P2

- 小红书
- 微博
- Reddit
- X / Twitter

原则：

- 先做高价值、低风险、可持续源
- 后做需要登录态和页面适配的源

## 30 / 60 / 90 天落地节奏

### 30 天

- 定义新表结构
- 打通 `source_documents` 入库
- 建立首批古籍 / 书目 / 问题分类法
- 接入 5 个基础来源
- 产出 30 个种子主题

### 60 天

- 接入知乎 / B 站 / YouTube 定向采集
- 建立 200 条书目记录
- 建立 500 条来源记录
- 发布首批专题页、书单页、问题页

### 90 天

- 建立实体关系图
- 建立引用链路
- 跑通“来源 -> 知识对象 -> 发布页 -> 转化入口”闭环
- 把内容系统升级为资料检索系统

## 立即执行建议

1. 不把“整站复刻”设为目标，改为“来源索引 + 知识抽取 + 原创发布”。
2. 先围绕公版经典和公开书目，建立合法的一手资料底盘。
3. 用 `bb-browser` 只补知乎 / 小红书 / B 站等登录态页面的结构化信息。
4. 先做书目页和问题页，这两类最容易形成长期搜索资产。
5. 所有外部来源都强制带 `rights_status`，没有这个字段就不准入发布链。

## 这份路线图对应的直接下一步

如果进入实施阶段，建议按以下顺序推进：

1. 扩数据库 schema
2. 新增来源与书目 store
3. 新增后台导入 / 审核面板
4. 增加 1 条 `bb-browser` 接入链路用于知乎问题采集
5. 新增 `/books` 与 `/questions` 两个前台内容面

完成这一步后，站点会从“命理产品 + 内容页”进入“命理产品 + 资料库 + 内容引擎”的阶段。
