[根目录](../CLAUDE.md) > **components**

# components/ - React UI 组件模块

> 模块职责：可复用的 React 组件库
> 最后更新：2026-02-24 22:18:52

---

## 变更记录 (Changelog)

### 2026-02-24
- ✅ 初始化组件模块文档
- ✅ 识别所有业务组件与 UI 组件

---

## 模块职责

`components/` 目录包含所有可复用的 React 组件，分为：
- **业务组件**：与命理分析业务逻辑紧密相关
- **UI 组件**：通用的界面元素（按钮、卡片、输入框等）
- **可视化组件**：图表与数据展示

---

## 入口与启动

### 组件导入规范
```typescript
// 业务组件
import FortuneForm from '@/components/fortune-form';
import AIAssistantChat from '@/components/ai-assistant-chat';

// UI 组件
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
```

---

## 对外接口（组件列表）

### 业务组件

#### 1. FortuneForm - 命理表单
**文件**：`fortune-form.tsx`
**类型**：客户端组件 (`'use client'`)

**功能**：
- 用户信息输入（姓名、性别）
- 出生时间选择（年月日时分秒）
- 全球城市选择器
- 真太阳时自动计算与展示
- 表单验证与提交

**Props**：
```typescript
interface FortuneFormProps {
  // 无 props，内部管理状态
}
```

**状态管理**：
```typescript
const [name, setName] = useState('');
const [gender, setGender] = useState<'male' | 'female'>('male');
const [city, setCity] = useState<CityData | null>(null);
const [year, setYear] = useState<number>(1990);
const [month, setMonth] = useState<number>(1);
const [day, setDay] = useState<number>(1);
const [hour, setHour] = useState<number>(12);
const [minute, setMinute] = useState<number>(0);
const [second, setSecond] = useState<number>(0);
```

**关键特性**：
- 动态天数计算（根据年月）
- 真太阳时实时预览
- 时辰对照显示
- 加载状态管理
- 错误提示

---

#### 2. CitySelector - 城市选择器
**文件**：`city-selector.tsx`
**类型**：客户端组件

**功能**：
- 全球城市搜索
- 拼音/英文/中文搜索支持
- 热门城市快捷选择
- 经纬度与时区信息展示

**Props**：
```typescript
interface CitySelectorProps {
  onSelect: (city: CityData | null) => void;
}
```

---

#### 3. FortuneProgress - 分析进度
**文件**：`fortune-progress.tsx`
**类型**：客户端组件

**功能**：
- 分析进度动画
- 步骤提示（排盘 → 分析 → 生成报告）
- 完成回调

**Props**：
```typescript
interface FortuneProgressProps {
  onComplete: () => void;
}
```

---

#### 4. FortuneKlineChart - K线图表
**文件**：`fortune-kline-chart.tsx`
**类型**：客户端组件

**功能**：
- 人生运势 K 线图可视化
- 基于 Recharts 实现
- 大运与流年展示

**Props**：
```typescript
interface FortuneKlineChartProps {
  data: Array<{
    year: number;
    fortune: number;
    event?: string;
  }>;
}
```

---

#### 5. FourPillarsChart - 四柱排盘
**文件**：`four-pillars-chart.tsx`
**类型**：客户端组件

**功能**：
- 四柱八字可视化展示
- 天干地支、藏干、纳音
- 地支关系（合冲刑害）

**Props**：
```typescript
interface FourPillarsChartProps {
  pillars: Pillar[];
}
```

---

#### 6. FiveElementsChart - 五行分析图
**文件**：`five-elements-chart.tsx`
**类型**：客户端组件

**功能**：
- 五行力量雷达图
- 五行旺衰对比
- 颜色编码展示

**Props**：
```typescript
interface FiveElementsChartProps {
  fiveElements: FiveElements;
}
```

---

#### 7. TenGodsChart - 十神配置图
**文件**：`ten-gods-chart.tsx`
**类型**：客户端组件

**功能**：
- 十神分布可视化
- 生我、我生、我克、克我分类
- 格局判断辅助

**Props**：
```typescript
interface TenGodsChartProps {
  tenGods: TenGods;
}
```

---

#### 8. AIAssistantChat - AI 助手对话
**文件**：`ai-assistant-chat.tsx`
**类型**：客户端组件

**功能**：
- 实时对话界面
- 消息历史展示
- 输入框与发送
- 加载状态

**Props**：
```typescript
interface AIAssistantChatProps {
  userId: string;
  initialMessages?: ChatMessage[];
}
```

---

#### 9. TrustReport - 可信报告
**文件**：`trust-report.tsx`
**类型**：客户端组件

**功能**：
- 完整命理分析报告展示
- 分段式内容呈现
- 数据支撑与证据展示
- 名人案例对比

**Props**：
```typescript
interface TrustReportProps {
  result: FortuneAnalysisResult;
}
```

---

#### 10. UserProfile - 用户档案
**文件**：`user-profile.tsx`
**类型**：客户端组件

**功能**：
- 用户基本信息展示
- 命理档案摘要
- 编辑入口

**Props**：
```typescript
interface UserProfileProps {
  profile: UserFortuneProfile;
}
```

---

#### 11. EventCalendar - 事件日历
**文件**：`event-calendar.tsx`
**类型**：客户端组件

**功能**：
- 月历视图
- 事件标记
- 日期选择

**Props**：
```typescript
interface EventCalendarProps {
  events: ImportantEvent[];
  onDateSelect: (date: Date) => void;
}
```

---

#### 12. ImportantEvents - 重要事件列表
**文件**：`important-events.tsx`
**类型**：客户端组件

**功能**：
- 事件列表展示
- 事件详情查看
- 添加/编辑/删除

**Props**：
```typescript
interface ImportantEventsProps {
  events: ImportantEvent[];
  onEventClick: (event: ImportantEvent) => void;
}
```

---

### UI 基础组件 (ui/)

#### 1. Button - 按钮
**文件**：`ui/button.tsx`

**变体**：
- `default` - 默认样式
- `primary` - 主要按钮
- `secondary` - 次要按钮
- `outline` - 轮廓按钮
- `ghost` - 幽灵按钮

**Props**：
```typescript
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}
```

---

#### 2. Card - 卡片
**文件**：`ui/card.tsx`

**子组件**：
- `Card` - 卡片容器
- `CardHeader` - 卡片头部
- `CardTitle` - 卡片标题
- `CardDescription` - 卡片描述
- `CardContent` - 卡片内容
- `CardFooter` - 卡片底部

**Props**：
```typescript
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  // 继承标准 div 属性
}
```

---

#### 3. Input - 输入框
**文件**：`ui/input.tsx`

**Props**：
```typescript
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}
```

---

## 关键依赖与配置

### 核心依赖
```json
{
  "react": "^19.0.0",
  "lucide-react": "^0.561.0",
  "recharts": "^3.7.0",
  "clsx": "^2.1.1",
  "tailwind-merge": "^2.5.0"
}
```

### 工具函数
```typescript
// lib/utils.ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

---

## 数据模型

### 组件 Props 类型
所有类型定义在 `lib/user-types.ts` 中：

```typescript
// 四柱
export interface Pillar {
  celestialStem: string;
  earthlyBranch: string;
  hiddenStems: string[];
  nayin: string;
  fiveElements: any;
  relationships: any;
}

// 五行
export interface FiveElements {
  wood: { strength: number; quality: string; description: string };
  fire: { strength: number; quality: string; description: string };
  earth: { strength: number; quality: string; description: string };
  metal: { strength: number; quality: string; description: string };
  water: { strength: number; quality: string; description: string };
}

// 十神
export interface TenGods {
  self: string;
  output: string[];
  input: string[];
  control: string[];
  controlled: string[];
}
```

---

## 测试与质量

### 测试建议
1. **组件渲染测试**：验证组件正常渲染
2. **交互测试**：验证用户交互行为
3. **Props 测试**：验证不同 props 的渲染结果
4. **快照测试**：防止意外的 UI 变更

### 测试示例
```typescript
// tests/components/fortune-form.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import FortuneForm from '@/components/fortune-form';

describe('FortuneForm', () => {
  it('should render form fields', () => {
    render(<FortuneForm />);
    expect(screen.getByLabelText('姓名/昵称')).toBeInTheDocument();
    expect(screen.getByLabelText('性别')).toBeInTheDocument();
  });

  it('should submit form on valid input', async () => {
    render(<FortuneForm />);
    fireEvent.change(screen.getByLabelText('姓名/昵称'), {
      target: { value: '测试用户' }
    });
    // ...
  });
});
```

---

## 常见问题 (FAQ)

### Q: 如何创建新组件？
A:
1. 在 `components/` 下创建新文件
2. 定义组件 Props 接口
3. 实现组件逻辑
4. 导出组件

```typescript
// components/my-component.tsx
'use client'; // 如果需要客户端功能

import { useState } from 'react';

interface MyComponentProps {
  title: string;
}

export default function MyComponent({ title }: MyComponentProps) {
  return <div>{title}</div>;
}
```

### Q: 何时使用 'use client'？
A: 当组件需要以下功能时：
- React Hooks (useState, useEffect, etc.)
- 浏览器 API (window, document, etc.)
- 事件处理 (onClick, onChange, etc.)

### Q: 如何优化组件性能？
A:
- 使用 `React.memo` 避免不必要的重渲染
- 使用 `useMemo` 缓存计算结果
- 使用 `useCallback` 缓存函数引用
- 懒加载大型组件 (`next/dynamic`)

### Q: 如何处理组件样式？
A: 使用 Tailwind CSS 原子类 + `cn()` 工具函数：

```typescript
import { cn } from '@/lib/utils';

function MyComponent({ className }: { className?: string }) {
  return (
    <div className={cn('bg-white p-4 rounded', className)}>
      Content
    </div>
  );
}
```

---

## 相关文件清单

```
components/
├── fortune-form.tsx           # 命理表单
├── city-selector.tsx          # 城市选择器
├── fortune-progress.tsx       # 分析进度
├── fortune-kline-chart.tsx    # K线图表
├── four-pillars-chart.tsx     # 四柱排盘
├── five-elements-chart.tsx    # 五行分析图
├── ten-gods-chart.tsx         # 十神配置图
├── ai-assistant-chat.tsx      # AI 助手对话
├── trust-report.tsx           # 可信报告
├── trust-signals.tsx          # 信任信号
├── next-step-guide.tsx        # 下一步引导
├── user-profile.tsx           # 用户档案
├── event-calendar.tsx         # 事件日历
├── event-card.tsx             # 事件卡片
├── important-events.tsx       # 重要事件列表
└── ui/
    ├── button.tsx             # 按钮组件
    ├── card.tsx               # 卡片组件
    └── input.tsx              # 输入框组件
```

---

**下一步建议**：
1. 实现组件单元测试
2. 创建 Storybook 组件文档
3. 优化组件性能（React.memo）
4. 添加组件使用示例
