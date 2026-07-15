# Life Kline V6 Premium Upgrade — Architecture

## 设计原则
- **确定性引擎 + 专家 LLM 表达** → 分离不可改写的事实与人性化表达
- **五行量化 → 现实映射** → 每个分数都要能解释"这意味着什么"
- **从"报告"到"洞察产品"** → 不只是文字，而是可交互的可视化数据
- **合规与信任透明** → 所有不确定性显式标注，免责声明强制执行

---

## V6 新增组件

### A. 命盘结构 → 视觉数据层
| 组件 | 输入 | 输出 | 用途 |
|------|------|------|------|
| `lib/chart-data-builder.ts` | EngineGroundTruth + pillars | 图表数据 JSON | 雷达图、桑基图、K线图 |
| `lib/mindmap-builder.ts` | AgentResults + context | 思维导图节点树 | 可视化命局结构 |
| `lib/dashboard-builder.ts` | 全量 report | Dashboard sections | 一页式总览 |

### B. 增强 Agent
| Agent | 职责升级 |
|-------|---------|
| `chart_visual_master` (NEW) | 把引擎数据翻译成可视化描述 + 图表配置 |
| `mindmap_architect` (NEW) | 生成命局思维导图：五行→十神→格局→建议的树形结构 |
| `annual_forecast` (NEW) | 年度精算报告：12 月逐月推演 + 关键日期标注 |
| `core_constitution` | + 体质/性格/决策风格的深度解读 |
| `strategy_advisor` | + 决策矩阵（紧迫度 vs 影响力） |

### C. K-line 算法 V2
- 移除 `Math.sin()` 人造周期
- 基于大运天干地支 + 流年 + 用神匹配度的加权计算
- 每季度/每年分数有明确五行依据

### D. 输出格式升级
- 思维导图 JSON（兼容 markmap/mermaid）
- 命盘雷达图数据
- 年度热力日历
- 人生阶段时间轴

### E. 话术库 V3
- 每个类别 30+ 条目
- 动态模板引擎：用神/忌神/格局/大运 填入可变槽位
- 区分"日常版"和"精算版"两套口吻
