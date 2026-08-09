# 雷电运营逻辑 × Google 收录对齐宪法

> 状态：生产红线（2026-08）  
> 适用：Content OS、知识/案例/主题库、sitemap、自动发布  
> 北极星：**可收录、可排序的搜索点击 → 开聊/排盘**  
> 不是：published URL 数量、矩阵覆盖率、locale 展开数

---

## 0. 一句话

我们要学雷电的，不是「批量刷长尾 URL」，而是：

**真实实体做中枢 → 卫星内容解决具体问题 → 持续用新信息更新 → 内链到转化。**

Google 要的也是这个方向：People-first、可验证、独特价值、可抓取。  
任何「换个 tag 同一套句子」的量产，都是 doorway / scaled thin content，和雷电成功路径相反，也和收录逻辑冲突。

---

## 1. 雷电运营逻辑（正确理解）

以火影实体页 `https://www.ldmnq.com/app/20/` + 资讯中心 `https://www.ldmnq.com/news/` 为准：

| 层级 | 雷电怎么做 | 本质 | 人生K线对照 |
|------|------------|------|-------------|
| **实体页** | 介绍 + 版本/包体 + 安装 STEP + 截图 + 分类 | 一个真实供给物一页 | `/topics/*`、`/dimensions/*`、工具页、城市/行业实体 |
| **卫星内容** | `/20/zixun/` 公告、安装教程、角色攻略 | 挂在实体下，回答具体问题 | 挂在实体下的 knowledge/case：任务型决策文 |
| **新鲜度** | 版本更新、活动日期 | 真实事件驱动，不是空刷 | 流年窗口、产品能力更新、可回访预测、真实案例 |
| **枢纽** | 品类、榜单、热门关注 | 发现路径 + 内链 | `/hotlist`、`/topics`、页脚热门、知识库 |
| **CTA** | 下载雷电 / 启动游戏 | 有用之后再转化 | 免费排盘 → 十维度 → 邮箱保存 → 回访 |

资讯标题像「月灵风格怎么选」「电脑版安装教程」——**任务型 / 决策型**，不是「Best {tag} 2026」换皮。

---

## 2. Google 收录逻辑（生产红线）

| 高风险 | 我们曾踩/可能踩的坑 | 正确做法 |
|--------|---------------------|----------|
| Doorway / 模板矩阵 | 日主×语言×模板、城市×locale 同句式 | 禁同句式；无独特问题不生产；薄页 draft/noindex |
| Scaled thin AI | 短 guide、无真证据、模板回退当正文 | 门槛加高；必须实体绑定 + 可验证动作 + FAQ |
| 爬取预算稀释 | Sitemap 7k+ 星座日页 | 已瘦身；禁止再开日历农场默认 |
| 堆关键词 | meta 堆 SEO/GEO/运势词 | 标题自然；keywords ≤8；禁运营黑话 |
| 伪多语言 | 英页中文标题、繁体简体混 | locale 纯度硬门；无母语改写不上 en/zh-TW |

### Google 想要的

1. **People-first**：为真人决策写，不为算法凑页  
2. **可验证**：时间窗、动作、边界、回访路径  
3. **独特价值**：本站方法论（结构·时位·环境）+ 实体上下文，不可被任意 tag 替换  
4. **可抓取**：稳定 200、清晰 canonical、合理 sitemap、内链可达  

---

## 3. 内容生产宪法（强制）

### 3.1 实体优先（Entity Hub）

允许的实体中枢（有限集合，禁止无限笛卡尔积）：

- 人生决策问题（换工作、婚恋、迁城…）— 高意图  
- 十维度产品实体  
- 核心工具（排盘、合婚、起名…）  
- 方法论（世界易六步、大运流年）— 品牌差异化  
- 城市/行业 — **仅在有独特环境角时**，且优先 zh-CN  

**禁止**作为默认生产队列：

- 十个日主 × 9 locale × 多模板  
- 12 个月 × 全部 locale 时令空刷  
- 无实体父节点的「孤岛 SEO 文」  
- 同一 angle 换 locale 并行生成（应先有主语言母版再本地化）

### 3.2 卫星内容（Satellite）

每篇必须回答 **一个具体任务/决策问题**，且：

| 字段 | 要求 |
|------|------|
| `parentEntity` | 必须挂实体 kind+slug |
| `userJob` | 用户任务一句话（如「判断今年要不要换工作」） |
| `uniqueAngle` | 本篇不可被替换的角度（禁止通用套话） |
| `searchIntents` | ≥3 条真实问法（该语言） |
| `evidenceHooks` | ≥2：结构层依据 / 时位窗 / 环境约束 / 可回访动作 |
| `cta` | 有用之后的产品路径，不硬广 |

### 3.3 新鲜度

允许更新驱动：

- 当前流年/月窗口的 **观察框架**（不是恐吓运势）  
- 产品能力更新（新工具、新维度）  
- 真实案例与回访结果（脱敏）  

禁止：

- 为「刷新 sitemap」而重写同文  
- 每月自动 12×locale 时令矩阵  

### 3.4 转化

顺序固定：

1. 把问题说清楚（有用）  
2. 给可执行下一步  
3. 再链到排盘 / 十维度 / 回访  

禁止：全文 CTA、恐吓逼转化。

---

## 4. 与旧 Content OS 的切割

| 旧习惯 | 新默认 |
|--------|--------|
| `buildContentOsMatrix` 全量 990 槽 | 仅作目录；生产用 `buildPeopleFirstQueue` |
| 缺口 missing 就造页 | 先问：是否独特问题？是否有父实体？ |
| auto-publish 看 overall≥82 | 另加：实体绑定、独特角度、反模板相似度、locale 纯度 |
| 多 locale 并行填坑 | 主语言（zh-CN）先成；有母版再 en/zh-TW 原生改写 |
| 北极星 = 发布数 | 北极星 = 可收录点击 → 开聊 |

---

## 5. 工程入口

| 模块 | 职责 |
|------|------|
| `lib/content-os/production-policy.ts` | 红线、相似度、是否允许生产 |
| `lib/content-os/matrix.ts` | 实体与卫星槽定义 |
| `lib/content-os/scheduler.ts` | **people-first 队列** 调度 |
| `lib/content-os/quality-dimensions.ts` | 含独特性/反 doorway |
| `lib/content-os/generator.ts` / `repair.ts` | 任务型文案，禁换皮 |
| `app/topics/*` | 实体中枢 |
| `app/hotlist` | 发现枢纽（非刷量） |

环境：

```bash
CONTENT_OS_MODE=people-first   # 默认；matrix-farm 仅调试
CONTENT_OS_AUTO_PUBLISH=1      # 仍须过严格门
CONTENT_OS_LOCALES=zh-CN       # 默认先主语言；扩语种显式开
CONTENT_OS_MAX_NEAR_DUP=0.72   # 与已发布标题/摘要相似度上限
```

---

## 6. 验收（每次发版自问）

1. 删掉实体名，这篇还像换皮吗？→ 是则不发  
2. 用户搜哪个真实问题会点进来？→ 答不出则不发  
3. 读完能否做一个 30 天可回访动作？→ 不能则返修  
4. 是否在 sitemap 里制造了无内链孤岛？→ 是则先补中枢内链  
5. 本周发布数上去了但 Search Console 点击没动？→ 停止扩量，先修质量  

---

## 7. 参考

- 雷电实体：`https://www.ldmnq.com/app/20/`  
- 雷电资讯：`https://www.ldmnq.com/news/`  
- Google：Helpful content / Spam policies（People-first，反对 scaled content abuse）  
- 站内：`docs/SEO_INDEXING_RECOVERY.md`、`docs/GLOBALIZATION_STANDARD.md`
