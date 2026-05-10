# Sub-Spec B1: 新结果页 MVP — 时间地图可见

**日期**：2026-05-10
**状态**：执行中
**依赖**：Sub-Spec A 完成 ✅
**后续**：B2 LLM 包装 / B3 视觉精细化

---

## 目标

把 Sub-Spec A 引擎输出的 TimingProfile **上到一个真实可访问的页面** `/r/[id]`，让用户看到未来的时间地图。

不等 LLM 包装完美，先让数据能被看见。

## 成功标准

1. 新路径 `/r/[id]` 可访问，显示 6 区块
2. 页面能读取 / 展示 TimingProfile 内容（含 30 天 / 12 月 / 5 年）
3. 数据库缓存机制工作：首次请求计算 profile 并缓存，后续直接读
4. 老路径 `/result/[id]` 保持不变
5. Feature flag `NEXT_PUBLIC_RESULT_V2` 控制新报告生成时是否返回 `/r/[id]`
6. 不阻塞现有功能（老流程 100% 可用）

## 不在范围（留给 B2/B3）

- LLM 文案包装（timing-narrator agent）→ B2
- 邮箱收集 modal / sticky → B3
- 精致视觉动画 → B3
- 折叠详情区的完整命理展示 → B3

---

## 架构

```
┌────────────────────────────────────────────────────┐
│ 数据库：user_timing_profiles 表（新）                │
│  user_id PK + JSON columns for profile data          │
│  缓存 TimingProfile，birth_signature 变更触发重算     │
└────────────────────────────────────────────────────┘
                     ↑
                     │
┌────────────────────┴────────────────────────────────┐
│ 路由：/r/[id]                                         │
│  Server Component                                     │
│  1. 读 fortune 表拿报告                               │
│  2. 读 user_timing_profiles 缓存                      │
│  3. 如无缓存或 signature 变更 → buildTimingProfile    │
│  4. 渲染 6 区块 Server Component                      │
└────────────────────────────────────────────────────┘
                     ↓
         <ResultV2Page>
            ├── <PortraitBlock />        区块 1: 你是这样的人
            ├── <PastValidationBlock />  区块 2: 过去印证
            ├── <Next30DaysBlock />      区块 3: 未来 30 天
            ├── <Next12MonthsBlock />    区块 4: 未来 12 个月
            ├── <Next5YearsBlock />      区块 5: 未来 5 年
            └── <DetailedFoldBlock />    区块 6: 详细命理（折叠）
```

## 关键决策

### 1. Profile 计算时机

**首次访问 `/r/[id]` 时 lazy 计算**，不在 `/analyze` 时计算。理由：
- 大多数报告的用户不会看新页面（flag=0 时）
- 延迟计算让加载命中缓存的路径极快
- buildTimingProfile 需要 fortune 已存（pillars/dayun 必需）

### 2. 缓存失效

按 `birthSignature`（生日+年柱）+ `computed_for_year`（命理年）双键判断：
- 生日不变 + 还在同一命理年 → 用缓存
- 过了立春 → 重算
- 重新测算（如填错生日改了） → 重算

### 3. 文案策略（B1 版本）

所有区块**直接显示 TimingPoint.rawReason**。简单诚实：
- 虽然含少量术语（如"丙午流年"），但配上时间锚点仍可理解
- 用户看到真实命理依据比套模板的"你可能..."强
- B2 LLM 包装后换成自然语言

### 4. 不强制重定向

`/result/[id]` 保留原貌。`/r/[id]` 单独运行。未来如果验证新页面好，再做 redirect。

---

## 文件结构

```
新建：
app/r/[id]/page.tsx                     Server Component 主页
components/result-v2/
├── portrait-block.tsx                  区块 1
├── past-validation-block.tsx           区块 2
├── next-30-days-block.tsx              区块 3
├── next-12-months-block.tsx            区块 4
├── next-5-years-block.tsx              区块 5
├── detailed-fold-block.tsx             区块 6（占位，内容简单）
└── timing-point-card.tsx               共享组件（时点卡）

lib/life-timing/timing-profile-store.ts  读写 SQLite 缓存
lib/database.ts                          加 user_timing_profiles 表
lib/services/pillar-calculator.service.ts 无改动，只引用

tests/lib/life-timing/timing-profile-store.test.ts  缓存测试

.env.example + ecosystem.config.js       加 NEXT_PUBLIC_RESULT_V2
```

总：8 新文件 + 2 修改 + 1 测试文件，约 900 行。

---

## 数据库 schema

```sql
CREATE TABLE IF NOT EXISTS user_timing_profiles (
  user_id TEXT PRIMARY KEY,
  report_id TEXT,
  birth_signature TEXT NOT NULL,
  bazi_pillars TEXT NOT NULL,
  computed_for_year TEXT NOT NULL,
  past_validations TEXT NOT NULL,    -- JSON
  next_30_days TEXT NOT NULL,         -- JSON
  next_12_months TEXT NOT NULL,       -- JSON
  next_5_years TEXT NOT NULL,         -- JSON
  computed_at TEXT NOT NULL DEFAULT (datetime('now')),
  schema_version INTEGER NOT NULL DEFAULT 1,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_user_timing_profiles_report ON user_timing_profiles(report_id);
```

---

## 验收

- [ ] `/r/{reportId}` 访问返回 200 和 6 区块内容
- [ ] 首次访问 < 500ms（含计算），二次访问 < 100ms（读缓存）
- [ ] flag=0 时 /analyze 依然返回 /result 路径
- [ ] flag=1 时 /analyze 返回 /r 路径
- [ ] 单元测试 timing-profile-store CRUD 通过
- [ ] `npm run lint && npm run build` 通过

---

## B1 完成后的 B2 / B3 范围

### B2（后续）
- 新建 timing-narrator agent（沿用 agentic-report 框架）
- 每个 TimingPoint.userCopy 填充（title/summary/todo/avoid）
- 报告生成时触发（异步，不阻塞返回）
- narrator_status: pending/done/fallback

### B3（后续）
- 邮箱收集 modal（节点点击触发）
- 底部 sticky 邮箱区
- 时间轴可视化图（区块 4）
- 详细命理依据完整展开
- 响应式移动端优化
