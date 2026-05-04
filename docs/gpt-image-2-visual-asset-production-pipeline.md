# GPT-Image-2 视觉资产结构化生产、入库与纠错方案

本文档定义人生K线、世界易与命理/易学图库的长期图片生产系统。

它承接：

- [gpt-image-2-product-world-yi-visual-plan.md](./gpt-image-2-product-world-yi-visual-plan.md)
- [gpt-image-2-mingli-yixue-visual-library-1000.md](./gpt-image-2-mingli-yixue-visual-library-1000.md)

目标不是“生成一批图”，而是建立一个可重复执行、可入库、可纠错、可统一风格的视觉资产工厂。

---

## 0. 当前机制审查结论

截至本文档当前版本，机制已经从“分散脚本”升级为 Symphony-style 的结构化生产工作流：

`repo workflow contract -> typed config -> orchestrator -> per-asset isolated jobs -> retry/backoff -> server storage -> narrative -> batch snapshot -> human QA`

已经合理并且可以作为后续执行基线的部分：

- 图片体系已经拆成产品/世界易说明图、结构图、传播图、命理易学 1000 张图库。
- 项目内已新增 `life-kline-visual-asset-factory` skill，用于后续统一触发图片规划、生成、入库、质检和纠错流程。
- 当前内容系统已有 `content_entries.meta`，适合通过 `meta.visualAssets` 绑定图片，不需要破坏现有 `sections` 结构。
- 图片资产独立建表、内容页只引用资产 ID 的方向是合理的，避免图片、文章正文、社媒版本混在一起。
- 先做品牌垫图，再批量生产，是保证 1000 张以上图片风格一致的必要前置。
- `visual_assets`、`visual_asset_batches`、`visual_asset_reviews`、`visual_asset_corrections` 表已经进入数据库初始化逻辑。
- `data/visual-assets/manifests/brand-pads-v1.json` 已建立，10 张品牌垫图任务已可导入。
- `scripts/visual-assets/import-manifest.ts`、`request-images.ts`、`generate-narratives.ts` 已建立，并已收敛到共享 orchestrator 能力。
- `scripts/visual-assets/run-workflow.ts` 已建立，可执行完整图文生产工作流。
- `scripts/visual-assets/status.ts` 已建立，可输出批次状态快照。
- `lib/visual-assets.ts` 已封装 manifest 入库、prompt 组装、图片请求、解读内容生成、状态更新和 QA 记录。
- `lib/visual-asset-workflow.ts` 已建立，用于读取 repo-owned workflow contract。
- `lib/visual-asset-orchestrator.ts` 已建立，用于统一并发、重试、图片落盘、文章兜底和状态汇总。

尚未实现、不能误认为已经上线的部分：

- `/api/admin/visual-assets/*` 后台接口目前是建议接口，还没有实现。
- 管理后台的缩略图、QA、纠错、发布视图目前还没有实现。
- 真实调用 `gpt-image-2` 的供应商客户端已走 OpenAI-compatible Chat Completions；密钥必须通过环境变量提供，不能写入仓库。若供应商返回 401，应先检查 `VISUAL_ASSET_API_KEY` 是否有效。
- R2 上传仍未接入，目前先保存到服务器 `public/images/visual-assets/...`，provider 原始 URL 保留在 `qa_notes.providerImageUrl`。
- 后台审核界面仍需后续实现。

因此，当前最合理的下一步不是直接生成 1000 张图，而是先跑通最小生产闭环：

`品牌垫图 manifest -> workflow orchestrator -> prompt 生成 -> gpt-image-2-pro 生成 -> 下载到服务器 -> narrative 文章 -> status snapshot -> QA -> approved 入库 -> 再进入首批 100 张`

### 0.1 供应商与模型配置

图片生成默认走 OpenAI-compatible Chat Completions：

```text
VISUAL_ASSET_API_BASE_URL=https://www.gemiai.top/v1
VISUAL_ASSET_DEFAULT_MODEL=gpt-image-2
VISUAL_ASSET_CORE_MODEL=gpt-image-2-pro
VISUAL_ASSET_CONCURRENCY_LIMIT=6
VISUAL_ASSET_GENERATION_TIMEOUT_MS=180000
```

密钥只允许放在运行环境：

```text
VISUAL_ASSET_API_KEY=...
```

核心图片使用 `gpt-image-2-pro`：

- 品牌垫图
- 首页和世界易 Hero 图
- 方法总式图
- 1000 张图库中的总览图、模块母版和高传播图

普通内容封面、知识插图和批量传播图默认使用 `gpt-image-2`。

每张图片都应同步生成一篇配套解读内容，写回：

- `visual_assets.narrative_title`
- `visual_assets.narrative_excerpt`
- `visual_assets.narrative_sections`

图片配套解读文章不走图片供应商，统一走主 LLM 通道：

```text
API_BASE_URL=https://ttqq.inping.com/v1
CONTENT_GENERATION_MODEL=grok-420-fast
VISUAL_ASSET_NARRATIVE_MODEL=grok-420-fast
```

如果未显式配置 `VISUAL_ASSET_NARRATIVE_MODEL`，系统默认复用 `CONTENT_GENERATION_MODEL`。

这些解读内容后续可以进入知识页、图片详情页、社媒图文说明或内容矩阵，提高站点质量。

### 0.2 Symphony-style 工作流入口

工作流契约：

```text
data/visual-assets/workflows/visual-production-v1.json
```

常用命令：

```bash
npm run visual:run -- --manifest=data/visual-assets/manifests/brand-pads-v1.json
npm run visual:run -- --manifest=data/visual-assets/manifests/brand-pads-v1.json --reset
npm run visual:run -- --manifest=data/visual-assets/manifests/brand-pads-v1.json --stages=images,narratives
npm run visual:status -- --batch=brand-pads-v1
```

该工作流借鉴 Symphony 的核心原则：

- repo 内保存工作流契约，避免运行逻辑散落在口头说明或临时脚本里。
- typed config 读取运行参数，包括并发、重试、存储、质量策略。
- orchestrator 负责批次状态、单图隔离、失败重试和最终快照。
- 每张图片任务独立成功/失败，不因单个供应商错误中断整批。
- 生产结果必须有可观测状态：状态分布、QA 状态、错误码、本地 URL、文章完成数。

### 0.3 图片文字与品牌规则

当前图片不再采用 SVG/HTML 后期拼字作为核心方案。

图片必须由 `gpt-image-2` / `gpt-image-2-pro` 直接生成：

- 主标题
- 关键说明标签
- 必要 CTA
- `世界易 / 人生K线 / www.life-kline.com` 品牌签名

品牌签名规则：

- 占画面约 4-7%。
- 优先放底部或右下。
- 不抢主体，不覆盖核心信息。
- 图片主体必须用于知识、结构、场景、路径、图解和内容表达。

服务器存储规则：

- provider 返回 URL 后立即下载到 `public/images/visual-assets/{batchId}/`。
- DB `public_url` 写本站路径。
- provider 原始 URL 写入 `qa_notes.providerImageUrl`。
- 后续接 R2 时，替换 orchestrator 的 storage 层，不改变 manifest 和 DB 主逻辑。

---

## 1. 总目标

### 1.1 生产目标

建立一套稳定流程：

`选题规划 -> 资产任务入库 -> 垫图/品牌参考 -> gpt-image-2 生成 -> 质量检查 -> 人工/自动纠错 -> 资产发布 -> 绑定内容/页面 -> 数据反馈 -> 下一批优化`

### 1.2 资产目标

所有图片必须服务三个层级：

- 产品说明：让用户看懂人生K线、世界易、测算、报告、工具、内容路径。
- 知识普及：让用户看懂易学、命理、五行、八卦、天干地支、起名、风水等传统知识。
- 传播转化：让用户愿意收藏、转发，并回到 `www.life-kline.com` 测算或阅读。

### 1.3 品牌目标

所有图片都要统一表达：

- 品牌：人生K线
- 学说：世界易
- 域名：`www.life-kline.com`
- 视觉气质：东方判断系统 + 现代产品智能 + 高信任编辑设计

---

## 2. 生产系统分层

| 层级 | 名称 | 作用 |
| --- | --- | --- |
| L1 | 资产规划层 | 定义图片主题、数量、用途、入口、优先级 |
| L2 | 结构化任务层 | 每张图一条任务，带 prompt、规格、品牌约束、质检项 |
| L3 | 垫图/参考图层 | 统一品牌、构图、配色、符号、页面适配 |
| L4 | 生成层 | 调用 `gpt-image-2` 生成或编辑 |
| L5 | 质检层 | 检查风格、知识、文字、安全、裁切、转化 |
| L6 | 纠错层 | 按错误类型重写 prompt 或走 edits 修复 |
| L7 | 入库层 | 保存资产、任务、版本、状态、页面绑定 |
| L8 | 投放层 | 绑定内容页、工具页、报告页、社媒模板 |
| L9 | 反馈层 | 记录点击、收藏、分享、测算转化，反推下一批 |

---

## 3. 推荐目录结构

当前项目还没有稳定的 `public/images` 目录时，首次生产时按以下结构创建：

```text
public/
  images/
    brand/
      life-kline/
        base-reference/
        logo-lockups/
        watermark/
        overlay-templates/
    world-yi/
      generated/
      reviewed/
      rejected/
      source-prompts/
    mingli-yixue/
      generated/
      reviewed/
      rejected/
      source-prompts/
    social/
      generated/
      reviewed/
      rejected/
data/
  visual-assets/
    manifests/
    batches/
    qa/
    corrections/
```

说明：

- `generated`：模型原始输出，不直接上线。
- `reviewed`：通过质检后可上线。
- `rejected`：失败图保留，用于纠错分析。
- `source-prompts`：每张图的 prompt、参数、参考图记录。
- `data/visual-assets`：结构化任务、质检、纠错与发布 manifest。

---

## 4. 数据库入库逻辑

### 4.1 当前内容表关系

当前项目已有 `content_entries` 表，包含：

- `content_type`
- `subtype`
- `slug`
- `title`
- `sections`
- `status`
- `meta`

图片资产不建议直接塞进 `sections`。推荐方式：

- 图片资产独立建表或独立 JSON manifest。
- 内容页通过 `content_entries.meta.visualAssets` 引用图片。
- 页面级图片通过页面配置或静态 manifest 引用。

### 4.2 推荐新增表：`visual_assets`

```sql
CREATE TABLE IF NOT EXISTS visual_assets (
  id TEXT PRIMARY KEY,
  asset_type TEXT NOT NULL,
  module TEXT NOT NULL,
  batch_id TEXT,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  prompt TEXT NOT NULL,
  negative_prompt TEXT,
  model TEXT NOT NULL DEFAULT 'gpt-image-2',
  size TEXT NOT NULL,
  ratio TEXT NOT NULL,
  quality TEXT NOT NULL DEFAULT 'medium',
  source_image_ids JSON,
  brand_reference_ids JSON,
  output_path TEXT,
  public_url TEXT,
  alt_text TEXT,
  overlay_copy_simplified TEXT,
  overlay_copy_traditional TEXT,
  overlay_copy_english TEXT,
  target_routes JSON,
  related_content_slugs JSON,
  related_tool_slugs JSON,
  related_report_themes JSON,
  status TEXT NOT NULL DEFAULT 'planned',
  qa_status TEXT NOT NULL DEFAULT 'pending',
  qa_score INTEGER DEFAULT 0,
  qa_notes JSON,
  correction_count INTEGER DEFAULT 0,
  latest_error_code TEXT,
  version INTEGER DEFAULT 1,
  meta JSON,
  created_by TEXT,
  updated_by TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
```

### 4.3 推荐新增表：`visual_asset_batches`

```sql
CREATE TABLE IF NOT EXISTS visual_asset_batches (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  library_key TEXT NOT NULL,
  module TEXT,
  target_count INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'planned',
  model TEXT NOT NULL DEFAULT 'gpt-image-2',
  brand_pack_id TEXT,
  manifest_path TEXT,
  generated_count INTEGER DEFAULT 0,
  approved_count INTEGER DEFAULT 0,
  rejected_count INTEGER DEFAULT 0,
  correction_count INTEGER DEFAULT 0,
  meta JSON,
  created_by TEXT,
  updated_by TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
```

### 4.4 推荐新增表：`visual_asset_reviews`

```sql
CREATE TABLE IF NOT EXISTS visual_asset_reviews (
  id TEXT PRIMARY KEY,
  asset_id TEXT NOT NULL,
  review_type TEXT NOT NULL,
  status TEXT NOT NULL,
  score INTEGER DEFAULT 0,
  error_codes JSON,
  notes JSON,
  reviewer TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY(asset_id) REFERENCES visual_assets(id)
);
```

### 4.5 推荐新增表：`visual_asset_corrections`

```sql
CREATE TABLE IF NOT EXISTS visual_asset_corrections (
  id TEXT PRIMARY KEY,
  asset_id TEXT NOT NULL,
  correction_round INTEGER NOT NULL,
  error_codes JSON NOT NULL,
  original_prompt TEXT NOT NULL,
  corrected_prompt TEXT NOT NULL,
  original_output_path TEXT,
  corrected_output_path TEXT,
  status TEXT NOT NULL DEFAULT 'planned',
  created_by TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY(asset_id) REFERENCES visual_assets(id)
);
```

### 4.6 内容绑定字段

写入 `content_entries.meta.visualAssets`：

```json
{
  "visualAssets": {
    "hero": "MY03-001",
    "cover": "MY03-001-4x5",
    "inline": ["MY03-002", "MY03-003"],
    "social": {
      "x": "MY03-001-16x9",
      "xiaohongshu": "MY03-001-4x5",
      "shortVideo": "MY03-001-9x16"
    }
  }
}
```

绑定规则：

- 每篇知识页至少有 `cover`。
- 高流量知识页至少有 `cover + inline + social`。
- 世界易专题页至少有 `hero + section illustrations`。
- 工具页优先绑定领域图，不要每个工具一开始都定制独立图。
- 流年、太岁、本命年等年度图片必须带 `meta.year`，方便未来替换。

---

## 5. 结构化任务格式

每张图必须先生成任务记录，再生成图片。

```json
{
  "id": "MY03-001",
  "libraryKey": "mingli-yixue",
  "module": "MY03",
  "assetType": "knowledge_diagram",
  "slug": "five-elements-overview",
  "title": "五行总览图",
  "subject": "五行金木水火土的整体关系",
  "userQuestion": "五行到底是什么？",
  "mustShow": [
    "金木水火土五个元素区域",
    "相生循环",
    "相克关系",
    "中心平衡点"
  ],
  "mustAvoid": [
    "恐吓式命运表达",
    "随机中文乱码",
    "廉价生肖贴纸",
    "过度玄幻法术效果"
  ],
  "brandPackId": "life-kline-world-yi-v1",
  "referenceImageIds": [
    "BRAND-BASE-001",
    "PAD-WY-001"
  ],
  "model": "gpt-image-2",
  "size": "2048x1152",
  "ratio": "16:9",
  "quality": "medium",
  "overlayCopySimplified": "金木水火土不是标签，是运行关系",
  "overlayCopyTraditional": "金木水火土不是標籤，是運行關係",
  "alt": "金木水火土五行关系的现代命理普及图",
  "targetRoutes": [
    "/knowledge/five-elements-overview",
    "/analyze"
  ],
  "relatedToolSlugs": [],
  "relatedReportThemes": [
    "five_elements",
    "structure"
  ],
  "riskLevel": "normal",
  "requiresHumanReview": true,
  "status": "planned"
}
```

---

## 6. 品牌垫图系统

为了保证 1000 张以上图片风格一致，必须先设计垫图，不要每张图从零随机生成。

### 6.1 垫图类型

| 垫图 ID | 名称 | 用途 |
| --- | --- | --- |
| `BRAND-BASE-001` | 人生K线品牌基底 | 所有图片统一配色、纸感、界面感 |
| `BRAND-LOGO-001` | 品牌水印位置 | 统一放置“人生K线 / www.life-kline.com” |
| `PAD-WY-001` | 世界易学说垫图 | 世界易、判断系统、理论结构 |
| `PAD-ML-001` | 命理教材垫图 | 五行、八字、天干地支、六爻 |
| `PAD-SOCIAL-001` | 社媒传播垫图 | 4:5、9:16 大标题安全区 |
| `PAD-REPORT-001` | 报告解释垫图 | 报告页、测算页、工具页 |
| `PAD-FS-001` | 风水空间垫图 | 平面图、空间动线、家宅恢复位 |
| `PAD-NAME-001` | 起名/康熙字典垫图 | 字典、纸页、字形结构 |
| `PAD-YI-001` | 易经/八卦垫图 | 阴阳、八卦、六十四卦 |
| `PAD-ETHICS-001` | 相学边界垫图 | 面相、手相、摸骨文化普及 |

### 6.2 品牌元素

品牌图中允许出现：

- `人生K线`
- `世界易`
- `www.life-kline.com`
- 结构、阶段、环境、动作
- 温润纸色、墨线、玉青、朱砂、暖金
- 产品界面卡片、罗盘、时间轴、报告面板

品牌图中禁止出现：

- 随机中文乱码
- 占卜摊位、大师凝视、恐吓表情
- 夸张符咒、鬼神、廉价生肖贴纸
- 过度霓虹 AI 背景
- 难以裁切的中心小字

### 6.3 垫图生成原则

第一轮必须先生成 10 张垫图，人工选定主风格后，再进入大批量生产。

每张正式图都应继承：

- 同一套颜色
- 同一套纸张/界面质感
- 同一套安全留白
- 同一套水印位置
- 同一套“无小字、前端叠字”的规则

---

## 7. Prompt 组装逻辑

最终 prompt 不能手写散落，必须由结构化字段组装。

### 7.1 Prompt 结构

```text
Draw a premium educational illustration for Life Kline / World Yi.

Brand:
Life Kline, World Yi, www.life-kline.com.

Visual system:
Modern Eastern judgment system, warm parchment, ink black structure lines, jade teal reasoning layer, cinnabar focal point, muted gold timing details, high-trust editorial product design.

Subject:
{subject}

User question:
{userQuestion}

Must show:
{mustShow}

Composition:
{ratio} image, {layout}, large safe area for Chinese title overlay, no dense generated text.

Brand placement:
Leave a clean lower-right area for a small Life Kline / www.life-kline.com watermark added later. Do not render the watermark text yourself unless explicitly requested.

Avoid:
{mustAvoid}

Text rule:
Do not render readable small text. Use abstract label blocks only. Chinese, Traditional Chinese, and English copy will be overlaid later.

Output:
Size {size}, quality {quality}, no transparent background.
```

### 7.2 负面 Prompt 固定库

每张图默认追加：

```text
Avoid fortune teller, crystal ball, cheap zodiac stickers, horror mysticism, random Chinese characters, fake small text, deterministic destiny claims, sensational fear marketing, purple SaaS default style, generic neon AI, cluttered diagrams.
```

敏感主题追加：

```text
For physiognomy, palmistry, bone reading, or body-related topics: use abstract cultural line art only. Do not analyze real people, faces, hands, bodies, health, personality, wealth, or destiny.
```

---

## 8. 质量检查逻辑

### 8.1 自动检查项

| 检查项 | 规则 | 失败代码 |
| --- | --- | --- |
| 文件存在 | 输出文件存在且可读 | `FILE_MISSING` |
| 尺寸正确 | 与任务 size 一致 | `SIZE_MISMATCH` |
| 比例正确 | 与任务 ratio 一致 | `RATIO_MISMATCH` |
| 文件大小 | 不能为 0，不能异常过大 | `FILE_SIZE_INVALID` |
| 命名正确 | 符合 `{module}-{id}-{slug}-{ratio}-{version}` | `NAMING_INVALID` |
| 元数据完整 | id、prompt、alt、route、status 不为空 | `META_INCOMPLETE` |
| 目标路由存在 | `targetRoutes` 可解析或有计划页面 | `ROUTE_INVALID` |
| 年度字段 | 流年/太岁/本命年图必须有 year | `YEAR_META_MISSING` |

### 8.2 人工/模型辅助检查项

| 检查项 | 通过标准 | 失败代码 |
| --- | --- | --- |
| 品牌一致 | 看起来属于人生K线/世界易 | `BRAND_DRIFT` |
| 主题清楚 | 3 秒内能看懂一个主题 | `CONCEPT_BLUR` |
| 无中文乱码 | 没有伪中文、小字乱码 | `TEXT_ARTIFACT` |
| 无恐吓 | 不制造灾祸、倒霉、必然失败 | `FEAR_TONE` |
| 无决定论 | 不把命理/相学写成必然结果 | `DETERMINISM` |
| 知识准确 | 五行、天干地支、八卦等关系无明显错误 | `KNOWLEDGE_ERROR` |
| 敏感合规 | 相学/手相/摸骨不用真实人图 | `SENSITIVE_RISK` |
| 可裁切 | 移动端和社媒裁切后主体仍清楚 | `CROP_RISK` |
| 有转化路径 | 能导向测算、工具、内容或订阅 | `NO_CONVERSION_PATH` |

### 8.3 QA 状态

| 状态 | 含义 |
| --- | --- |
| `pending` | 未检查 |
| `auto_passed` | 自动检查通过 |
| `needs_review` | 需要人工/模型辅助复核 |
| `approved` | 可上线 |
| `rejected` | 不可上线 |
| `needs_correction` | 需要修正 prompt 或 edits |
| `retired` | 已下线 |

---

## 9. 纠错逻辑

### 9.1 纠错优先级

1. 知识错误：必须重做。
2. 安全边界错误：必须重做。
3. 品牌漂移：用垫图或 edits 修正。
4. 文字乱码：重做或转为更大留白。
5. 构图问题：优先 edits 修正。
6. 色彩小偏差：可进入后期统一。

### 9.2 错误码到修正策略

| 错误码 | 修正策略 |
| --- | --- |
| `BRAND_DRIFT` | 加强品牌垫图，追加 Life Kline visual system 描述 |
| `CONCEPT_BLUR` | 减少元素，只保留一个中心隐喻 |
| `TEXT_ARTIFACT` | 明确 no readable text, abstract label blocks only |
| `FEAR_TONE` | 改成 calm educational, non-fatalistic, no fear marketing |
| `DETERMINISM` | 加入 cultural education, structural reference, no prediction |
| `KNOWLEDGE_ERROR` | 修正 mustShow，必要时人工重写 prompt |
| `SENSITIVE_RISK` | 改为 abstract line-art, no real face/hand/body |
| `CROP_RISK` | 改成 centered subject + larger negative space |
| `NO_CONVERSION_PATH` | 在 metadata 补 targetRoutes 和 overlay CTA |

### 9.3 纠错 Prompt 模板

```text
Revise the previous image generation prompt.

Problem:
{errorCodes}

Correction goal:
{correctionGoal}

Keep:
Life Kline / World Yi brand style, warm parchment, ink black, jade teal, cinnabar, muted gold, clean editorial design.

Change:
{specificChanges}

Avoid:
{expandedAvoidRules}

Text rule:
No readable generated text. Leave safe space for overlay copy.
```

### 9.4 版本规则

- 每次重做，`version + 1`。
- `v1` 原图不删除，移动到 `rejected` 或保留为历史。
- 纠错记录写入 `visual_asset_corrections`。
- 同一个资产最多自动纠错 3 次，超过后转人工。

---

## 10. 入库状态机

```text
planned
  -> prompt_ready
  -> queued
  -> generating
  -> generated
  -> auto_checked
  -> needs_review
  -> approved
  -> published
```

异常路径：

```text
generated
  -> needs_correction
  -> queued
  -> generating
```

失败路径：

```text
generated
  -> rejected
```

下线路径：

```text
published
  -> retired
```

---

## 11. 批次生产策略

### 11.1 第一批：品牌垫图 10 张

先做：

- `BRAND-BASE-001`
- `BRAND-LOGO-001`
- `PAD-WY-001`
- `PAD-ML-001`
- `PAD-SOCIAL-001`
- `PAD-REPORT-001`
- `PAD-FS-001`
- `PAD-NAME-001`
- `PAD-YI-001`
- `PAD-ETHICS-001`

没有通过垫图，不进入 1000 张量产。

### 11.2 第二批：首批验证 100 张

来自命理图库文档的首批 100 张：

- 五行
- 阴阳八卦
- 天干地支
- 四柱八字
- 流年太岁
- 康熙字典
- 风水
- 奇门
- 相学边界

目标：

- 验证风格
- 验证知识准确性
- 验证分享和点击测算

### 11.3 第三批：结构库 300 张

优先补：

- 五行完整组
- 天干地支完整组
- 四柱十神组
- 流年太岁组
- 康熙字典/起名组

### 11.4 第四批：完整 1000 张

在前三批 QA 通过率稳定后，再补齐：

- 六十四卦 64 张
- 风水家宅完整组
- 奇门三式组
- 相学文化普及组
- 社媒封面母版

---

## 12. 脚本与接口建议

### 12.0 最小实现顺序

为了避免机制失控，代码实现必须按以下顺序推进：

1. 在 `lib/database.ts` 增加 `visual_assets`、`visual_asset_batches`、`visual_asset_reviews`、`visual_asset_corrections` 表。
2. 新增 `lib/visual-assets.ts`，封装资产创建、更新、QA、纠错、发布和内容绑定，不在 API route 里直接写 SQL。
3. 新增 `data/visual-assets/manifests/brand-pads-v1.json`，先入库 10 张品牌垫图任务。
4. 新增 `scripts/visual-assets/import-manifest.ts`，把 JSON manifest 写入 `visual_assets` 和 `visual_asset_batches`。
5. 新增 `scripts/visual-assets/build-prompts.ts`，从结构化字段组装 prompt，不手写散落 prompt。
6. 先人工或半自动生成 10 张品牌垫图，写回 `output_path`，运行 QA。
7. 垫图全部 `approved` 后，再导入命理图库首批 100 张 manifest。
8. 最后再做后台 API 和管理界面。

这套顺序的核心原因是：先把资产状态和品牌基底稳定下来，再扩大图片数量。

### 12.1 最小脚本集合

后续实现时建议新增：

```text
scripts/visual-assets/seed-brand-pads.ts
scripts/visual-assets/import-manifest.ts
scripts/visual-assets/build-prompts.ts
scripts/visual-assets/run-gpt-image-2-batch.ts
scripts/visual-assets/qa-assets.ts
scripts/visual-assets/correct-assets.ts
scripts/visual-assets/publish-assets.ts
```

### 12.2 API 建议

```text
GET  /api/admin/visual-assets
POST /api/admin/visual-assets/import
POST /api/admin/visual-assets/generate
POST /api/admin/visual-assets/review
POST /api/admin/visual-assets/correct
POST /api/admin/visual-assets/publish
```

### 12.3 管理后台建议

后台需要展示：

- 批次状态
- 资产缩略图
- prompt
- 参考图
- QA 错误码
- 纠错历史
- 绑定页面
- 发布状态

---

## 13. 正确内容保障机制

### 13.1 知识口径来源

命理/易学类图片必须优先依据项目内文档：

- `docs/world-yi-system-overview-v1.0.0.1.md`
- `docs/world-yi-knowledge-architecture-v1.0.0.1.md`
- `docs/world-yi-book-v1-volume-3.md`
- `docs/world-yi-book-v1-volume-7.md`
- `docs/gpt-image-2-mingli-yixue-visual-library-1000.md`

### 13.2 不能让模型自由发挥的部分

以下内容必须由结构化字段给出，不能让模型自己编：

- 五行相生相克关系
- 十天干顺序与五行
- 十二地支顺序与生肖
- 八卦名称与结构
- 六十四卦编号
- 太岁、本命年、犯太岁的非恐吓边界
- 康熙笔画与简繁异体的边界说明
- 相学/手相/摸骨只能文化普及的限制

### 13.3 人工复核要求

以下图片必须人工复核：

- MY04 天干地支关系图
- MY05 四柱八字/十神/用神图
- MY06 太岁/本命年/流年传播图
- MY07 六十四卦/六爻图
- MY08 起名/康熙字典/字五行图
- MY10 奇门遁甲图
- MY11 相学/手相/摸骨图

---

## 14. 品牌一致性规则

### 14.1 固定品牌句

所有批次任务都默认带：

```text
Life Kline / World Yi / www.life-kline.com
```

但图片里不强制生成可读水印。推荐后期覆盖水印，避免模型生成乱码。

### 14.2 固定视觉方向

```text
Modern Eastern judgment system, warm parchment, ink black structure lines, jade teal reasoning layer, cinnabar focal point, muted gold timing details, high-trust editorial product design.
```

### 14.3 固定留白

每张图必须留：

- 标题区
- 副标题区
- CTA 区
- 小水印区

### 14.4 固定 CTA 方向

根据场景选择：

- 开始测算：`/analyze`
- 看世界易：`/world-yi`
- 看工具：`/tools`
- 看知识：`/knowledge`
- 看案例：`/cases`

---

## 15. 结论

视觉资产生产必须产品化。

正确做法是：

- 先做品牌垫图。
- 再做结构化任务。
- 再生成图片。
- 再质检。
- 再纠错。
- 再入库。
- 再绑定内容和页面。
- 最后用数据反推下一批。

这样才能保证 1000 张、3000 张甚至更多图片都保持：

- 风格一致
- 知识正确
- 可追踪
- 可纠错
- 可发布
- 可转化
