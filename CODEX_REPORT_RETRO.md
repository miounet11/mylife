# Codex Report Retro Guide

这是一份给 Codex 的单文件执行说明。

目标：

1. 固定提取最近窗口内的真实测算样本名单。
2. 区分真实样本和测试样本。
3. 判断主流程是否正常、报告是否大量 fallback/basic。
4. 给出下一轮升级、重算、改进的优先级。

只要用户让你做“最近测算复盘”“真实样本评估”“升级候选名单”“最近 24h / 7d 报告质量回顾”，就按这份文件执行。

## 1. 工作目录

始终在这个目录执行：

```bash
/home/life-kline-next
```

## 2. 先跑的命令

### 最近 24 小时复盘

```bash
npm run system:retro -- 1440 --save
```

### 最近 7 天复盘

```bash
npm run system:retro -- 10080 --save
```

### 最近 1 小时请求与故障

```bash
npm run system:requests -- 60
pm2 logs life-kline-next --lines 120 --nostream
```

## 3. 数据来源

优先使用：

- [`scripts/report-retro.js`](/home/life-kline-next/scripts/report-retro.js)
- [`data/runtime/report-retro.snapshot.json`](/home/life-kline-next/data/runtime/report-retro.snapshot.json)
- [`scripts/request-window.js`](/home/life-kline-next/scripts/request-window.js)
- PM2 主站日志

不要先凭感觉判断业务状态，先用这几个来源确认。

## 4. 统一口径

### 真实样本

优先看 `system:retro` 输出中的 `Real Reports`。

### 测试样本

优先看 `system:retro` 输出中的 `Likely Test Reports`。

默认这些名字大概率属于测试样本，不要混入真实版本评估：

- `测试A`
- `验证B`
- `测试用户`
- `测试用户2`
- `案例1`
- `案例2`
- `甲`
- `乙`
- `丙`
- `哈哈`
- `即时局`
- `x`

### 关键指标解释

- `reports.realLikely`
  说明最近窗口内真正值得进入版本评估池的报告数量。
- `reports.likelyTest`
  说明最近窗口内测试样本数量。
- `reports.viewedDistinct`
  说明有多少报告被真正打开过。
- `reports.fallbackRate`
  越高，越说明近期虽然能出报告，但增强质量主要靠回退维持。
- `reports.basicRate`
  越高，越说明结果多数停留在基础版，不足以代表理想交付质量。
- `reports.llmRate`
  越低，越说明近期 LLM 增强命中不足。
- `analytics.missingSessionPageViews`
  如果明显大于 0，要提醒用户：漏斗数据可能还混有旧 session、旁路请求或外部噪音。

## 5. 每次必须回答的问题

每次复盘都要回答下面这些问题：

1. 最近窗口内有没有真实用户？
2. 最近窗口内有没有真实测算完成？
3. 最近窗口内有没有有效报告产出？
4. 哪些是真实样本，哪些是测试样本？
5. 哪些真实报告被用户真正查看过？
6. 当前主要问题是主流程故障，还是 fallback/basic 比例过高？
7. 下一轮最该进入升级评估的 `5-10` 份报告是哪几份？

## 6. 输出结构

输出给用户时，优先按下面结构：

### A. 真实使用总结

至少说明：

- 是否有真实用户
- 是否有真实测算
- 是否有有效报告
- 最近窗口的核心数量

### B. 真实样本名单

优先列：

- `reportId`
- `name`
- `createdAt`
- `birthPlace`
- `score`
- `grade`
- `deliveryTier`
- `llmUsed`
- `viewed`

### C. 当前风险

重点看：

- `fallbackRate`
- `basicRate`
- `llmRate`
- `Failure Hotspots`
- 最近 1 小时请求和 PM2 日志

### D. 升级优先级

明确告诉用户：

- 哪些报告值得重算
- 哪些问题优先修
- 当前优先是修主流程，还是修增强质量，还是修数据观测

## 7. 优先级规则

### 先修主流程

如果出现下面任一情况：

- `analyze_failed` 明显增加
- 报告没生成
- 结果页打不开
- 用户点击后无结果

### 先修质量增强

如果出现下面情况：

- 主流程能走通
- 但 `fallbackRate` 很高
- 或 `basicRate` 很高
- 或真实用户已查看，但报告深度明显不够

### 先修数据观测

如果出现下面情况：

- 真实样本和测试样本混在一起
- 页面浏览与测算提交 session 断裂
- 无法稳定判断最近窗口业务表现

## 8. 升级评估名单怎么选

从 `Real Reports` 里挑，不要从测试样本里挑。

优先保留：

- 被真实用户查看过的报告
- 覆盖不同名字、地区、命局类型的报告
- 分数一般但有代表性的报告
- 能代表当前真实用户质量问题的报告

每轮建议保留 `5-10` 份，作为固定版本评估名单。

## 9. 当前默认结论方向

如果近期数据和之前类似，大概率是下面这种情况：

- 有真实用户
- 有真实测算
- 有报告产出
- 主流程基本可用
- 但大量报告仍然 fallback 到引擎输出
- 大量报告仍停留在 `basic`

这种情况下，不要误判为“系统没人用”或“系统完全坏了”，而是应判断为：

- 主流程优先级低于增强质量
- 真实样本池和升级评估名单优先级很高

## 10. 额外要求

- 不要把测试样本当成真实产品质量证据。
- 不要只给结论，必须给真实样本名单。
- 不要只看一条日志，必须结合 `system:retro` 和 `system:requests`。
- 如果已经生成了 [`data/runtime/report-retro.snapshot.json`](/home/life-kline-next/data/runtime/report-retro.snapshot.json)，优先读取它做总结。

## 11. 最短执行路径

如果用户只说一句“做最近报告复盘”，直接执行：

```bash
npm run system:retro -- 1440 --save
npm run system:requests -- 60
pm2 logs life-kline-next --lines 120 --nostream
```

然后按“真实使用总结 + 真实样本名单 + 当前风险 + 升级优先级”输出。
