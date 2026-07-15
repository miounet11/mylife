# Life K-Line 全球化标准（Globalization Standard）

> 目标：成为面向全球玄学 / 命理 / 决策节奏用户的可信产品。  
> 范围：产品体验 · 语言 · SEO · GEO（地域）· GEO（生成式引擎可引用）· 内容 · 合规。  
> 状态：高标准基线（2026-07）。未达标的能力按「分期」推进，**不降低验收线**。

---

## 0. 一句话战略

**用确定性结构引擎服务全球华人与国际用户：同一套事实，多语种表达，多市场入口，可被搜索与 AI 正确引用。**

我们不是「把中文站机翻一遍」。我们是：

| 层 | 含义 |
|----|------|
| **引擎层** | 八字/大运/节气等计算与结论结构，跨语言一致、可回访验证 |
| **表达层** | 简体 / 繁体 / 英文等专业表达，按市场与意图改写，不是词表替换 |
| **发现层** | SEO 拿流量，地域 GEO 接场景，生成式 GEO 被 AI 正确引用 |
| **信任层** | 合规边界、来源与不确定性可见，跨文化都站得住 |

---

## 1. 用户与市场分层（谁是全球）

### 1.1 一级市场（必须做好）

| 市场 | 语言 | 代表场景 | 入口重心 |
|------|------|----------|----------|
| **大中华简体** | `zh-CN` | 排盘、流年、十维度、会员报告 | `/` `/analyze` `/dimensions` |
| **繁体华语圈** | `zh-Hant`（TW/HK/MO） | 择日、改运、社区问答、黄历应用 | 同路径 + `lang=zh-Hant` / cookie |
| **全球英文** | `en` / `en-US` | World Yi、决策框架、海外 career/migrate | `/world-yi/en` + 逐步产品壳英文化 |
| **海外华人** | 简/繁 + 场景英文夹杂 | 迁移择城、跨境事业、时差出生地 | 内容 `locale: zh-US` / 工具 GEO |

### 1.2 二级市场（有内容与 schema，不强绑主路径）

- 新马华人（`zh-SG` / `zh-MY` 内容标签）
- 英国 / 欧洲英文（`en-GB` 内容标签，x-default 仍走全球英文）
- 其他语种：先 **不扩散 UI**；有需求再开「内容 locale」，避免半吊子 UI

### 1.3 用户意图分层（比国家更重要）

1. **工具意图**：立刻排盘 / 流年 / 维度判断  
2. **学习意图**：知识库、案例、World Yi 方法论  
3. **社区意图**：真实问题 + 专业解读  
4. **验证意图**：预测回访、邮件节点提醒  
5. **转化意图**：绑定邮箱、会员、专项服务  

全球化必须 **每条意图在目标语言下都有入口**，不能只有首页翻译。

---

## 2. 高标准定义（验收线）

### 2.1 语言标准

| 级别 | 要求 | 是否可上线 |
|------|------|------------|
| **L0 壳层** | 导航、页脚、CTA、登录/邮件 chrome 三语完整 | 最低可用 |
| **L1 转换** | 繁体：正文可 SC→TC（chinese-conv），UI 有手写繁体关键文案 | 华语市场可扩 |
| **L2 母语** | 英文/繁体关键漏斗页为 **原生撰写或专业译审**，禁止长文纯机翻上首页 | **目标态** |
| **L3 本地化** | 案例、合规语、货币/时区/地名、文化隐喻按市场改写 | 深度本地化 |

**硬规则：**

1. **同一事实，多语表达** — 引擎输出结构一致；禁止不同语言算出不同格局结论。  
2. **禁止「伪全球化」** — 英文 UI + 大段中文正文无标注，不算英文页达标。  
3. **用户选择优先于系统语言** — `?lang=` / cookie `lk_locale` > Accept-Language。  
4. **系统语言必须可用** — 首次访问按浏览器语言自动落入 `zh-CN` / `zh-Hant` / `en`。  
5. **可分享** — 语言状态可体现在 URL（`lang=`）与 hreflang，利于 SEO 与社交传播。

### 2.2 SEO 标准（搜索引擎）

**每一条可索引页必须：**

| 项 | 标准 |
|----|------|
| **Canonical** | 唯一规范 URL，绝对地址 `https://www.life-kline.com/...` |
| **hreflang** | 至少覆盖：`zh-CN` · `zh-Hant`（或 `zh-TW`/`zh-HK`）· `en` · `x-default`；互链完整、无死链 |
| **Title / Description** | 该语言原生撰写；禁简体 title 挂在 `lang=en` 页 |
| **OG locale** | 与页面语言一致（`zh_CN` / `zh_TW` / `en_US`） |
| **inLanguage** | JSON-LD 与页面语言一致 |
| **Sitemap** | 仅收录可索引、canonical 页；多语言可用 sitemap index 或 hreflang 注解，不制造重复 soft-404 |
| **robots** | 私有路径（登录后、admin、API）禁止索引 |
| **Core Web Vitals** | 主漏斗页 LCP/INP 不因多语言脚本显著恶化 |
| **内部链接** | 同语言簇优先互链；跨语言用明确的「语言/地区」入口，不做隐藏跳转 |

**x-default 策略：**

- 产品主站默认：`x-default` → 简体主路径（最大存量与品牌）  
- World Yi 英文网关：`x-default` → `/world-yi/en`（国际方法论入口）  
- 不得全站混用两套互相矛盾的 x-default

**禁止：**

- 全站同一 canonical 挂多语言内容  
- 用 JS 事后替换正文却不更新 title/description/hreflang  
- 为刷量自动生成大量近似 URL（参数农场）

### 2.3 地域 GEO 标准（Geographic）

面向「人在哪里、问题发生在哪里」：

| 维度 | 标准 |
|------|------|
| **出生地 / 真太阳时** | 全球时区与地点可用；边界时辰可信度显式标注 |
| **迁移择城** | 内容与工具区分：大陆城市 / 海外华人城市 / 跨境生活 |
| **内容 geo meta** | 需要地域意图的文章携带 `geo.region` / `geo.placename`（已有 `public-content-seo`） |
| **案例地理** | 案例标注市场（海外 career、eldercare 等），避免「无地点抽象人设」 |
| **邮件与时序** | 提醒时间尊重用户时区偏好（后续） |

**内容 locale 标签（与 UI locale 解耦）：**

- UI：`zh-CN` \| `zh-Hant` \| `en`  
- Content：`zh-Hans` \| `zh-TW` \| `zh-HK` \| `zh-US` \| `en-US` \| `en-GB` \| `en-SG` …  
- 展示层用 `content-locale` 做分组（English / 繁體 / 简体），**不要把 content locale 直接当 UI cookie**

### 2.4 生成式 GEO 标准（Generative Engine Optimization）

目标：被 ChatGPT / Perplexity / Google AI Overview / 国内大模型 **正确引用**，而不是被编造。

每篇对外内容（知识/案例/World Yi）达标条件（与现有 `geoOptimization` 对齐并抬高）：

| 字段 | 最低标准 |
|------|----------|
| `geoReady` | `true` |
| `answerSummary` | ≥ 40 字（或英文 ≥ 25 词）可独立成答 |
| `searchIntents` | ≥ 3 条真实用户问法（含该语言） |
| `entityKeywords` | ≥ 5 个实体（术语、场景、地域、产品名） |
| **结构** | 先结论 → 依据 → 边界/不适用 → 下一步动作 |
| **可验证** | 尽量带可回访预测或明确时间窗 |
| **引用友好** | 短段落、小标题、列表；禁纯散文墙 |
| **合规句** | 娱乐/参考声明 + 非医疗/法律/投资建议 |

**AI 可见信号（页面层）：**

- `ai-answer-summary` / `search-intent` / `entity-keywords` meta（已有）  
- FAQ / HowTo / Article / QAPage JSON-LD 与正文一致  
- 社区答案：保留「先看判断 / 建议 / 风险」结构化，利于摘录  

### 2.5 产品与品牌标准

1. **品牌双语**：中文「人生K线」+ 英文 Life K-Line / World Yi 体系清晰分工  
   - Life K-Line = 个人报告与工具产品  
   - World Yi = 方法论与国际内容网关  
2. **主 CTA 一致**：免费生成 → 邮箱保存 → 深问/回访 → 会员  
3. **专业可信**：忌神神棍恐吓文案；强调结构、阶段、环境、动作  
4. **跨文化语气**：英文偏 decision framework；中文可保留术数术语但必须「人话翻译」  
5. **合规全球统一底线**：18+、非医疗/法律/投资建议；各地可加本地免责声明  

### 2.6 工程标准

| 项 | 标准 |
|----|------|
| **单一语言源** | `lib/i18n/site-locale.ts` + `ui-messages` + 邮件 `email-locale` 语义对齐 |
| **SSR 优先** | 可索引正文的语言应在 SSR 决定；客户端转换只作增强 |
| **Cookie** | `lk_locale`，一年；与邮件、分析 meta 可贯通 |
| **Vary** | 中间件 `Vary: Accept-Language, Cookie`，避免 CDN 串语 |
| **性能** | 繁体转换 / 英文字典不阻塞 LCP；长列表转换可分片 |
| **可测** | 每个语言至少 3 条冒烟：首页、analyze、一篇内容、一封邮件 |
| **禁止** | 把 `lib/database` 等 prod 核心在本地半成品覆盖 |

---

## 3. URL 与信息架构

### 3.1 推荐模型（当前阶段）

采用 **同路径 + 语言参数/cookie + 专用英文网关**，而非立刻上 `/en/...` 全站镜像：

```
/analyze                     → UI 随 locale；SEO 主实体简体
/analyze?lang=zh-Hant        → 繁体
/analyze?lang=en             → 英文壳（L0/L1）
/world-yi/en                 → 英文内容网关（L2）
/knowledge/[slug]            → 按 content.locale 出 hreflang 与语言
/community/[slug]?lang=…     → 社区简繁（及未来 en 摘要）
```

### 3.2 何时升级到路径前缀 `/en` `/zh-hant`

当满足：

- 英文核心漏斗（首页模块、analyze、结果摘要）达到 **L2 母语**  
- 有稳定英文 sitemap 与 Search Console 属性  
- 内部链接与 canonical 矩阵测试通过  

再迁移，避免半路径半参数长期双栈。

### 3.3 hreflang 矩阵（页面级）

对「同一意图」的页面：

```
zh-CN     → https://www.life-kline.com{path}
zh-Hant   → https://www.life-kline.com{path}?lang=zh-Hant
en        → https://www.life-kline.com{path}?lang=en
           或 /world-yi/en/...（若该意图仅有英文内容实体）
x-default → 主市场路径（见 2.2）
```

**内容文章**若有多语版本，应用 **不同 slug 实体 + 双向 hreflang**，不要只靠客户端转繁。

---

## 4. 内容生产标准（全球化供给）

### 4.1 内容类型与语言优先级

| 类型 | zh-CN | zh-Hant | en | 备注 |
|------|-------|---------|-----|------|
| 产品漏斗页 | P0 | P0 | P0 壳 / P1 母语 | 转化生死线 |
| 十维度 / 工具说明 | P0 | P1 | P1 | 术语表统一 |
| 知识库 | P0 | P1 转繁+审 | P1 选题制 | geoReady 强制 |
| 案例库 | P0 | P1 | P1 海外案例 | 带市场标签 |
| World Yi | P0 | P1 | **P0** | 国际主阵地 |
| 社区 Q&A | P0 | P0 转繁 | P2 摘要 | 结构化答案 |
| 邮件 | P0 | P0 | P0 | 已三语 chrome |

### 4.2 选题 GEO 矩阵（示例）

| 意图 | 简体选题 | 繁体选题 | 英文选题 |
|------|----------|----------|----------|
| 事业 | 升职/跳槽窗口 | 转职/创业择日 | Career reset overseas |
| 迁移 | 国内择城 | 港台移动、出海 | City fit / immigration timing |
| 婚恋 | 谈婚论嫁节奏 | 姻缘与择日 | Relationship timing language |
| 财富 | 投资节奏（合规） | 理财节奏 | Capital allocation rhythm |
| 健康 | 作息与压力（非医疗） | 作息与压力 | Energy & burnout framing |

### 4.3 发布门槛（DoD）

一篇「全球可发」内容必须：

- [ ] 明确 `locale` + 可选 `market`  
- [ ] `geoReady` 四件套（summary / intents / entities / 结构）  
- [ ] canonical + hreflang（若有姊妹语种）  
- [ ] 内链到：工具 CTA + 相关知识/案例 + 同语言枢纽  
- [ ] 合规句与适用边界  
- [ ] 标题不含夸张保证（「必中」「包过」等）

---

## 5. 技术落地地图（与现状对齐）

### 5.1 已具备

- UI 三语自动检测：`lk_locale` + Accept-Language + 顶栏切换  
- 邮件三语 chrome + 繁体转换  
- 社区 `?lang=` + 简繁转换  
- `lib/public-content-seo`：hreflang、geo meta、AI summary meta  
- `content-locale` 分组（English / 繁體 / 简体）  
- World Yi English gateway `/world-yi/en`  
- 内容侧 `geoOptimization` 字段与海外选题种子  

### 5.2 缺口（相对本标准）

| 缺口 | 影响 | 优先级 |
|------|------|--------|
| `lib/seo.ts` 默认仅 `zh-CN` hreflang | 产品页国际化 SEO 不完整 | **P0** |
| 英文产品漏斗非母语 | 国际转化弱 | **P0** |
| Sitemap 无多语言展开 | 发现效率 | P1 |
| 内容简繁/英实体未系统成对 | hreflang 空转 | P1 |
| 客户端转繁/短语英文化 ≠ SSR | 抓取与分享预览偏差 | P1 |
| GSC 多区域属性与 hreflang 监控 | 无法验收 | P1 |
| 时区 / 出生地全球 UX | 海外排盘信任 | P1 |
| 二级语种 UI | 过早扩散有害 | 不做（暂） |

### 5.3 分期（不砍标准，只排期）

**Phase A — 发现与壳正确（2–3 周）**

1. 统一 `buildPageMetadata` / 布局：全站产品页 hreflang 矩阵  
2. 首页 + analyze + result 摘要：英文 L2 关键模块  
3. Sitemap：对主路径输出语言 alternate（或 sitemap index）  
4. GSC：确认 www 规范域、提交 sitemap、监控「网页有 soft 404 / hreflang」  

**Phase B — 内容全球供给（持续）**

1. 每周：N 篇 zh + 对译/转繁 + 1 篇 en World Yi/案例  
2. 全部新内容强制 geoReady 质检  
3. 知识/案例列表按 locale group 筛选与徽章  

**Phase C — 路径级国际化（条件触发）**

1. `/en/*` 产品镜像或子域评估  
2. 英文结果页结构化摘要 SSR  
3. 支付/会员若出海再开本地化合规  

---

## 6. 度量（没有数就不叫高标准）

### 6.1 产品

- 各 `lk_locale` 的：访问 → analyze 提交 → 报告打开 → 邮箱绑定 → 回访  
- 英文/繁体路径转化率 vs 简体（比值，不唯绝对量）  

### 6.2 SEO

- 三语（或两语+en 网关）索引覆盖率  
- 主关键词：品牌词 +「八字」「流年」「bazi chart」「four pillars」等  
- hreflang 错误数 → 0  
- 自然搜索中国际占比（国家/语言维度）  

### 6.3 GEO（生成式）

- 抽检：用固定 20 问问主流 AI，是否引用本站、是否结论与引擎一致  
- `geoReady` 内容占比 → ≥ 90% 新发内容  
- AI 引用带来的进站（可打 `utm` / referrer 观察）  

### 6.4 质量红线

- 英文页中文正文占比过高且无说明 → 缺陷  
- 不同语言结论矛盾 → P0 事故  
- 无合规声明的预测承诺 → 禁止发布  

---

## 7. 文案与术语原则

1. **术语表（Glossary）**：八字、大运、用神、十神等 — 中英对照固定，禁止同页多种译法。  
2. **英文定位**：Destiny structure / life rhythm / decision timing — 避免 occult scam 语感。  
3. **繁体**：台湾用词优先（軟體级 UI 可用「設定/資訊」等），专名可保留传统术数用字。  
4. **语气**：克制、可执行、可验证；全球统一。  

---

## 8. 决策备忘（写进标准以免反复争论）

| 议题 | 决议 |
|------|------|
| 是否立刻全站 `/en` 路径？ | **否**。先壳 + World Yi 网关 + hreflang，再镜像。 |
| 繁体是否必须人工全文？ | UI 人工；长文可转繁 + 抽审；高流量页人工。 |
| 英文是否机翻报告全文？ | **否**。先结构化摘要与关键结论母语化。 |
| 是否做日/韩/越 UI？ | 内容可试，UI 暂不开放。 |
| SEO 与产品谁优先？ | **可索引发现页 SEO 优先；登录后深度报告产品优先。** |
| GEO 两个含义？ | 地域 + 生成式引用 **都要做**，字段与验收分开。 |

---

## 9. 与代码的锚点

| 能力 | 路径 |
|------|------|
| UI locale | `lib/i18n/site-locale.ts`, `components/i18n/*`, `middleware.ts` |
| 邮件 locale | `lib/email-locale.ts`, `lib/email-layout.ts` |
| 内容 SEO/GEO | `lib/public-content-seo.ts`, `lib/content-locale.ts` |
| 产品 SEO 默认 | `lib/seo.ts`（需升到本标准 hreflang） |
| 英文网关 | `app/world-yi/en/**` |
| 内容 geo 字段 | content-store `geoOptimization` |
| 社区简繁 | `lib/i18n/zh-locale.ts` + community pages |

---

## 10. 结论

全球化高标准不是「多几个语言按钮」，而是：

1. **全球用户能被正确语言接住**（系统语言 + 手动 + 记住）  
2. **搜索与 AI 能发现并正确引用**（SEO + 生成式 GEO）  
3. **地域场景说得通**（出生地、迁移、海外华人）  
4. **引擎事实不随语言漂移**  
5. **合规与专业语气全球统一**  

当前站已具备语言壳与内容 GEO 字段的基础；下一阶段的主攻是：  
**产品页 hreflang 统一、英文漏斗母语化、内容多语实体与 sitemap、geoReady 质检门禁。**

任何降低上述验收线的「快速机翻全站」方案，默认否决。
