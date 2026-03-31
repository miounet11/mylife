# Skills

这个文件把当前项目已经沉淀出的可复用能力写成统一规则。目标不是写概念说明，而是把以后会反复调用的方法、入口、约束和验证方式固定下来。

## 1. Life Kline Growth Engine

适用场景：

- 主测算、120 工具、文章、案例之间的协同增长
- 报告页、工具页、工具结果页、首页、档案页、历史页的联动
- 用户上下文继承、复访、转化、持续测算链路

核心原则：

- 保持 120 个工具为配置驱动，不拆成 120 套独立实现
- 优先改共享元数据和共享渲染，不做页面级重复逻辑
- 如果一个页面要推荐另一个页面，优先走统一 journey 系统
- 不移除用户上下文沉淀，工具历史必须能被后续测算继承

关键文件：

- [lib/tools.ts](/home/life-kline-next/lib/tools.ts)
- [lib/tool-context.ts](/home/life-kline-next/lib/tool-context.ts)
- [lib/content-store.ts](/home/life-kline-next/lib/content-store.ts)
- [lib/surface-journeys.ts](/home/life-kline-next/lib/surface-journeys.ts)
- [app/result/[id]/page.tsx](/home/life-kline-next/app/result/[id]/page.tsx)
- [app/tools/[slug]/page.tsx](/home/life-kline-next/app/tools/[slug]/page.tsx)
- [app/tool-result/[sessionId]/page.tsx](/home/life-kline-next/app/tool-result/[sessionId]/page.tsx)
- [app/knowledge/[slug]/page.tsx](/home/life-kline-next/app/knowledge/[slug]/page.tsx)
- [app/cases/[slug]/page.tsx](/home/life-kline-next/app/cases/[slug]/page.tsx)
- [app/page.tsx](/home/life-kline-next/app/page.tsx)
- [app/profile/page.tsx](/home/life-kline-next/app/profile/page.tsx)
- [app/history/page.tsx](/home/life-kline-next/app/history/page.tsx)

工作顺序：

1. 先确认任务属于工具层、journey 层、还是内容自动联动层。
2. 先读对应核心文件，再读渲染页面。
3. 优先补共享元数据，再补共享组件，最后才补局部页面。
4. 改完先跑最小测试，再跑 lint，再跑 build。

## 2. Tool Center

适用场景：

- 120 工具目录、详情页、结果页
- 工具的免费层、付费层、案例、FAQ、异议处理、下一步链路
- 工具的精品化、钩子、转化、上下文继承

规则：

- 所有工具定义统一从 [lib/tools.ts](/home/life-kline-next/lib/tools.ts) 出
- 页面只消费 metadata，不在页面里散写业务判断
- 下一步工具推荐优先走 `nextToolSlugs`
- 高价值工具的专属包装也优先放在 metadata 中

当前工具能力已经包含：

- hook / freeValueLine / paidValueLine
- freeInsights / premiumModules
- caseStories
- premiumOutcomes
- objectionAnswers
- faqItems
- featuredBadge / signaturePromise / decisionLens / premiumWhyNow

内容承接默认规则：

- 文章页和案例页不要只停在“继续阅读”
- 优先用自动关联的 `relatedToolSlugs` 找主承接工具
- 内容页先承接到工具免费层，再承接到专项需求提交
- 复用共享承接组件，不在单页散写一套新的卖点和表单

相关组件：

- [components/tool-runner.tsx](/home/life-kline-next/components/tool-runner.tsx)
- [components/tool-memory-panel.tsx](/home/life-kline-next/components/tool-memory-panel.tsx)
- [components/tool-case-stories-panel.tsx](/home/life-kline-next/components/tool-case-stories-panel.tsx)
- [components/tool-journey-panel.tsx](/home/life-kline-next/components/tool-journey-panel.tsx)
- [components/tool-conversion-panel.tsx](/home/life-kline-next/components/tool-conversion-panel.tsx)
- [components/tool-premium-depth-panel.tsx](/home/life-kline-next/components/tool-premium-depth-panel.tsx)
- [components/tool-premium-request-panel.tsx](/home/life-kline-next/components/tool-premium-request-panel.tsx)
- [components/tool-editorial-panel.tsx](/home/life-kline-next/components/tool-editorial-panel.tsx)

## 3. Surface Journeys

适用场景：

- 报告页、工具页、文章页、案例页之间的统一导流
- 首页、档案页、历史页的个人化下一步推荐
- 主测算 -> 工具 -> 文章 -> 案例 的整条协同路径

核心文件：

- [lib/surface-journeys.ts](/home/life-kline-next/lib/surface-journeys.ts)

主方法：

- `buildJourneyForTool`
- `buildJourneyForReport`
- `buildJourneyForContent`
- `buildPersonalizedJourney`

输出结构固定为四组卡片：

- reportCard
- toolCards
- knowledgeCards
- caseCards

规则：

- 新页面需要协同推荐时，先接这个系统，不要单独重写推荐器
- 能走统一评分和统一卡片结构，就不要做一页一套
- 如果某个 surface 有特殊需要，也应建立在统一 journey 输出上扩展

相关组件：

- [components/surface-journey-panel.tsx](/home/life-kline-next/components/surface-journey-panel.tsx)
- [components/personal-journey-hub.tsx](/home/life-kline-next/components/personal-journey-hub.tsx)

## 4. Content Auto Linking

适用场景：

- 内容保存、内容生成、内容发布
- 文章/案例自动挂到报告主轴和工具链
- 不依赖人工参与的自动协同

核心文件：

- [lib/content-store.ts](/home/life-kline-next/lib/content-store.ts)

核心方法：

- `saveManagedContentEntry`
- `normalizeManagedContentMeta`
- `getManagedContentJourneyMeta`

自动补齐内容：

- `relatedReportThemes`
- `relatedToolSlugs`
- `relatedKnowledgeSlugs`
- `relatedCaseSlugs`
- `journeyAutomation`

自动规则优先级：

1. 先保留显式传入的人工 meta
2. 缺失关系字段时自动补主轴和工具
3. 标题/标签过泛时，再用分类和已有主轴兜底
4. 仍然判断不强时，知识内容默认挂一组高频工具，避免断链

当前状态：

- 内容保存时自动联动
- 内容保存时自动补相关文章和相关案例，不要求人工挂链
- 老内容和种子内容可以通过统一刷新机制自动升级到最新关系规则
- 知识发布链跑完后自动联动仍然保留
- 前台 journey 系统优先消费这些自动关系

内容承接默认规则：

- 文章页和案例页不要只停在“继续阅读”
- 优先用自动关联的 `relatedToolSlugs` 找主承接工具
- 内容页先承接到工具免费层，再承接到专项需求提交
- 复用共享承接组件，不在单页散写一套新的卖点和表单

个人化成交规则：

- 首页、历史页、档案页不能只有推荐卡片，还要有“个人升级面板”
- 优先基于最近报告和最近工具记录确定主承接工具
- 面板里必须同时给出：主工具、回报告入口、一个内容入口、一个付费升级点
- 这层能力优先复用统一 summary / panel，不在三个页面各写一套逻辑

质量诊断规则：

- 后台不能只显示漏斗和跳出数字，还要给出可执行诊断
- 内容质量要同时看内容本身质量、联动能力、PV 和跳出
- 工具质量要同时看包装完整度、详情到开跑、结果到专项和跳出
- 高跳出页面要区分内容页、工具页、关键导流页，不同页面给不同改法

## 5. 后台内容协同运营

虽然当前方向是不需要人工参与，但后台仍然保留协同能力，用于兜底和运营强化。

核心入口：

- [components/content-admin-console.tsx](/home/life-kline-next/components/content-admin-console.tsx)

支持字段：

- `relatedToolSlugs`
- `relatedReportThemes`
- `relatedKnowledgeSlugs`
- `relatedCaseSlugs`

支持能力：

- 单篇编辑
- 批量勾选内容后统一挂主轴和工具
- 按工具分类快速载入推荐工具

规则：

- 人工字段是覆盖和增强，不是默认前提
- 自动联动必须先可用，人工配置只是提高精度

## 6. 验证标准

每次改动都按最小相关测试 -> lint -> build 的顺序来。

常用命令：

```bash
npm run test -- --runInBand tests/lib/tools.test.ts tests/app/api/tools-run-route.test.ts tests/lib/sitemap-tools.test.ts
npm run test -- --runInBand tests/lib/content-store.test.ts tests/lib/knowledge-publication-ops.test.ts
npm run lint
npm run build
```

当前关键测试覆盖：

- [tests/lib/tools.test.ts](/home/life-kline-next/tests/lib/tools.test.ts)
- [tests/app/api/tools-run-route.test.ts](/home/life-kline-next/tests/app/api/tools-run-route.test.ts)
- [tests/lib/sitemap-tools.test.ts](/home/life-kline-next/tests/lib/sitemap-tools.test.ts)
- [tests/lib/content-store.test.ts](/home/life-kline-next/tests/lib/content-store.test.ts)
- [tests/lib/knowledge-publication-ops.test.ts](/home/life-kline-next/tests/lib/knowledge-publication-ops.test.ts)

## 7. 默认方法

以后如果任务落在这条线上，默认做法是：

1. 先判断问题属于工具、journey、还是内容自动联动。
2. 优先更新共享元数据和共享规则。
3. 再让页面去消费这些共享结果。
4. 保持主测算、工具、文章、案例、历史上下文始终互相可达。
5. 默认让系统自动运转，不把人工配置当成必要前提。
