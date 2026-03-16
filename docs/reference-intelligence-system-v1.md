# 参考智能系统 V1

## 目标

把外部抓取到的资料、书目、问题与知识实体，转成可被命理引擎和 Agent 消费的结构化参照层。

这个系统不替代命盘底座，而是增强三类能力：

1. `准确性`：让时间、空间、关系类判断有更多外部证据约束
2. `有效性`：把热点问题与现实环境变化映射进当前判断
3. `权威性`：让回答能带着来源层与经典层的支撑

## 核心原则

### 1. 命盘是底层，外部知识是解释层

- 四柱、用神、格局、大运、流年仍是核心结构
- 外部资料用于增强时间窗口、地理环境、人际协同的解释和校正
- 不能让热点内容覆盖命盘本身的稳定判断

### 2. 外部资料必须先结构化，再进入模型

不能把抓来的网页直接丢给模型。必须先经过：

1. 来源归一化
2. 权利状态标注
3. 参照维度识别
4. 权重与方向识别
5. 状态向量微调
6. prompt / context 注入

### 3. 以天时、地利、人和作为第一层参照框架

- `天时`：节气、真太阳时、流年、大运、宏观周期、行业周期、时机窗口
- `地利`：城市、迁移、方位、居住与办公环境、气候偏性、空间布局
- `人和`：婚恋、合作、团队、家庭角色、贵人、关系协同与冲突

## 当前已落地模块

### 知识底座

- `lib/knowledge-taxonomy.ts`
- `lib/knowledge-base-store.ts`
- `lib/knowledge-ingestion.ts`

这些模块负责：

- 定义知识主题与来源种子
- 管理 `source_documents / bibliography_entries / knowledge_entities / knowledge_relations`
- 把 `content_signals` 晋升成正式来源文档

### 参考智能层

- `lib/reference-intelligence.ts`
- `lib/reference-engine-bridge.ts`

这些模块负责：

- 把来源、书目、实体映射成 `天时 / 地利 / 人和` 证据
- 计算各维度分值、权重和模型指令
- 输出 `state vector adjustment`
- 生成可注入 Agent 上下文的 overlay

## 数据流

### Step 1. 信号进入来源层

来源可以来自：

- RSS / Atom
- `bb-browser site`
- 手动导入
- 公开书目与公版文本库

信号先进入：

- `content_signals`

然后通过晋升逻辑进入：

- `source_documents`

### Step 2. 来源进入参照识别

`reference-intelligence` 会读取：

- `source_documents`
- `bibliography_entries`
- `knowledge_entities`

并根据关键词和语义规则识别：

- 属于天时、地利还是人和
- 偏支持、偏中性还是偏谨慎
- 权威度应当加权还是降权

### Step 3. 产出参考智能包

输出结构包括：

- `dimensions.tianShi`
- `dimensions.diLi`
- `dimensions.renHe`
- `authority`
- `stateVectorAdjustment`
- `recommendedEngineWeights`
- `modelDirectives`

### Step 4. 进入引擎与 Agent

通过 `reference-engine-bridge`：

- 校准 `stateVector.current`
- 生成 `timingHints / geoHints / humanHints`
- 生成参考引用列表
- 供后续 prompt 注入器或上下文构造器使用

## 权重逻辑

### 权威加权

系统会优先提高以下来源权重：

- `public_domain`
- `open_license`
- 经典书目
- Canonical 平台，如：
  - `ctext`
  - `wikisource`
  - `openlibrary`
  - `internet-archive`
  - `gutenberg`

会保守下调以下来源权重：

- `platform_restricted`

### 时间新鲜度

近期来源会增加一部分时效权重，适合：

- 行业周期
- 城市趋势
- 热门问题
- 舆论变化

但时效性不能盖过经典和结构性知识。

## 这套系统对模型的实际价值

### 1. 提升时间判断质量

当天时维度证据强时：

- 更适合强调节气、阶段、时机、行业周期
- 回答不会只停在“适合 / 不适合”
- 会更清楚地解释“为什么是这个窗口”

### 2. 提升城市与迁移判断质量

当地利维度证据强时：

- 更适合解释城市迁移、定居、办公环境、方位布局
- 可以把个人命盘倾向和城市 / 空间参照结合
- 能减少“纯凭命局抽象判断城市”的空泛感

### 3. 提升关系与合作判断质量

当人和维度证据强时：

- 更适合解释婚恋、合作、家庭、团队问题
- 可以把互动质量和现实协同条件纳入判断
- 能降低“只看单点吉凶”的粗糙度

## 当前边界

当前版本仍是规则驱动，不是知识图谱推理引擎。

已经解决：

- 来源归档
- 维度归类
- 权重估计
- 状态向量微调
- prompt / context overlay

尚未解决：

- 自动实体对齐到现有 Agent context
- 基于 relations 的跨来源推理
- 对同一问题的多源争议消歧
- 真实线上反馈闭环后的动态校准

## 下一步接入顺序

1. 在 Agent context 构造阶段加入 `reference overlay`
2. 在状态向量生成阶段加入 `stateVectorAdjustment`
3. 在后台增加参考智能面板，展示：
   - 各维度得分
   - 主要证据
   - 权威度
   - 当前校准方向
4. 在书目页、问题页、专题页展示参考来源与引用链

## 当前仓内对应文件

- `lib/knowledge-taxonomy.ts`
- `lib/knowledge-base-store.ts`
- `lib/knowledge-ingestion.ts`
- `lib/reference-intelligence.ts`
- `lib/reference-engine-bridge.ts`

## 结论

这套系统的意义不是“多抓点内容”，而是把抓来的内容变成真正可被命理产品使用的参考结构。

只有这样，外部知识才会真正提升：

- 结构解释能力
- 现实贴合度
- 回答可信度
- 长期知识资产价值
