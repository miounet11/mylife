[根目录](../../CLAUDE.md) > [app](../CLAUDE.md) > **api**

# app/api/ - RESTful API 接口模块

> 模块职责：后端 API 接口实现与业务逻辑处理
> 最后更新：2026-02-24 22:18:52

---

## 变更记录 (Changelog)

### 2026-02-24
- ✅ 初始化 API 模块文档
- ✅ 识别所有 API 端点

---

## 模块职责

`app/api/` 目录实现了所有后端 API 接口，负责：
- **命理分析**：八字排盘与深度解析
- **AI 对话**：智能问答与持续对话
- **用户管理**：档案创建与更新
- **事件管理**：重要事件 CRUD 操作
- **数据查询**：历史记录与统计数据

---

## 入口与启动

### API 路由约定
Next.js App Router 使用 `route.ts` 文件定义 API 端点：

```typescript
// app/api/example/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json({ data: 'example' });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  return NextResponse.json({ success: true });
}
```

---

## 对外接口（API 端点）

### 1. 命理分析 API
**端点**：`POST /api/analyze`
**文件**：`analyze/route.ts`

**功能**：
- 接收用户出生信息
- 计算真太阳时修正
- 执行八字排盘分析
- 调用 LLM 生成深度解析
- 存储分析结果到数据库
- 返回报告 ID

**请求体**：
```typescript
{
  name: string;              // 姓名
  gender: 'male' | 'female'; // 性别
  birthDate: string;         // 出生日期 YYYY-MM-DD
  birthTime: string;         // 出生时间 HH:mm
  birthSecond?: number;      // 出生秒数
  birthPlace: string;        // 出生地点
  timezone: number;          // 时区
  longitude: number;         // 经度
  latitude: number;          // 纬度
  useSolarTime: boolean;     // 是否使用真太阳时
}
```

**响应体**：
```typescript
{
  success: boolean;
  reportId: string;          // 报告 ID
  result: FortuneAnalysisResult; // 分析结果
  llm: {
    used: boolean;           // 是否使用 LLM
    fallbackToEngine: boolean; // 是否回退到引擎
  };
  timestamp: string;         // ISO 时间戳
}
```

**核心逻辑**：
```typescript
// 1. 验证输入数据
// 2. 计算真太阳时
const solarTimeInfo = calculateTrueSolarTime(...);

// 3. 基础八字排盘
const baseResult = analyzeFortune(...);

// 4. LLM 深度解析（可选）
const llmInterpretation = await generateFortuneInterpretation(baseResult);

// 5. 合并结果
const finalResult = { ...baseResult, ...llmInterpretation };

// 6. 存储到数据库
fortuneOperations.create({ id: reportId, ...finalResult });

// 7. 返回结果
return NextResponse.json({ success: true, reportId, result: finalResult });
```

---

### 2. 获取命理报告 API
**端点**：`GET /api/fortune/[id]`
**文件**：`fortune/[id]/route.ts`

**功能**：
- 根据报告 ID 查询数据库
- 返回完整的命理分析结果

**路径参数**：
- `id` - 报告 ID

**响应体**：
```typescript
{
  success: boolean;
  data: FortuneAnalysisResult | null;
}
```

---

### 3. AI 对话 API
**端点**：`POST /api/chat`
**文件**：`chat/route.ts`

**功能**：
- 接收用户问题
- 加载用户命理档案
- 调用 LLM 生成回答
- 保存对话历史

**请求体**：
```typescript
{
  userId: string;            // 用户 ID
  message: string;           // 用户消息
  sessionId?: string;        // 会话 ID（可选）
}
```

**响应体**：
```typescript
{
  success: boolean;
  reply: string;             // AI 回复
  sessionId: string;         // 会话 ID
}
```

---

### 4. 用户档案 API
**端点**：`GET/PUT /api/profile/[id]`
**文件**：`profile/[id]/route.ts`

**功能**：
- GET：查询用户档案
- PUT：更新用户档案

**GET 响应体**：
```typescript
{
  success: boolean;
  data: UserFortuneProfile | null;
}
```

**PUT 请求体**：
```typescript
{
  name?: string;
  preferences?: {
    notification: boolean;
    detailLevel: 'basic' | 'detailed' | 'expert';
    language: string;
  };
}
```

---

### 5. 事件管理 API
**端点**：`GET/POST /api/events`
**文件**：`events/route.ts`

**功能**：
- GET：查询用户事件列表
- POST：创建新事件

**GET 查询参数**：
- `userId` - 用户 ID
- `startDate` - 开始日期（可选）
- `endDate` - 结束日期（可选）

**POST 请求体**：
```typescript
{
  userId: string;
  type: 'career' | 'wealth' | 'marriage' | 'health' | 'family' | 'other';
  title: string;
  date: string;              // YYYY-MM-DD
  time?: string;             // HH:mm
  description?: string;
  impact: 'positive' | 'negative' | 'neutral';
}
```

---

### 6. 历史记录 API
**端点**：`GET /api/history`
**文件**：`history/route.ts`

**功能**：
- 查询用户所有历史分析记录
- 支持分页与排序

**查询参数**：
- `userId` - 用户 ID
- `page` - 页码（默认 1）
- `limit` - 每页数量（默认 10）

**响应体**：
```typescript
{
  success: boolean;
  data: {
    items: FortuneAnalysisResult[];
    total: number;
    page: number;
    limit: number;
  };
}
```

---

### 7. 提醒管理 API
**端点**：`GET/POST /api/reminders`
**文件**：`reminders/route.ts`

**功能**：
- GET：查询用户提醒列表
- POST：创建新提醒

---

### 8. 增运建议 API
**端点**：`GET/POST /api/enhancements`
**文件**：`enhancements/route.ts`

**功能**：
- GET：查询增运建议
- POST：创建增运记录

---

## 关键依赖与配置

### 核心依赖
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { analyzeFortune } from '@/lib/fortune-engine';
import { generateFortuneInterpretation } from '@/lib/llm';
import { fortuneOperations, userOperations } from '@/lib/database';
import { calculateTrueSolarTime } from '@/lib/solar-time';
```

### 错误处理模式
```typescript
try {
  // API 逻辑
  return NextResponse.json({ success: true, data });
} catch (error) {
  console.error('[API] Error:', error);
  return NextResponse.json(
    { success: false, error: '服务器错误' },
    { status: 500 }
  );
}
```

### 响应格式规范
```typescript
// 成功响应
{
  success: true,
  data: any,
  timestamp?: string
}

// 错误响应
{
  success: false,
  error: string,
  code?: string
}
```

---

## 数据模型

### API 请求/响应类型
所有类型定义在 `lib/user-types.ts` 中：

```typescript
// 命理分析结果
export interface FortuneAnalysisResult {
  basic: { dayMaster: string; pillars: Pillar[] };
  fiveElements: FiveElements;
  tenGods: TenGods;
  pattern: Pattern;
  fortune: any;
  advice: any;
  evidence: any;
  analysis: { opening: string; explanation: string };
}

// 用户档案
export interface UserFortuneProfile {
  id: string;
  name: string;
  birthDate: Date;
  birthTime: string;
  birthPlace: string;
  timezone: number;
  gender: 'male' | 'female';
  bazi: any;
  // ...
}
```

---

## 测试与质量

### 测试建议
1. **单元测试**：测试每个 API 端点的逻辑
2. **集成测试**：测试 API 与数据库的交互
3. **性能测试**：测试 API 响应时间
4. **错误处理测试**：测试各种错误场景

### 测试示例
```typescript
// tests/api/analyze.test.ts
describe('POST /api/analyze', () => {
  it('should return report ID on success', async () => {
    const response = await fetch('/api/analyze', {
      method: 'POST',
      body: JSON.stringify({
        name: '测试用户',
        gender: 'male',
        birthDate: '1990-01-01',
        birthTime: '12:00',
        // ...
      })
    });
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.reportId).toBeDefined();
  });
});
```

---

## 常见问题 (FAQ)

### Q: 如何调试 API 接口？
A: 使用 `console.log` 或 `console.error` 输出日志，查看服务端控制台。

### Q: 如何处理 CORS 问题？
A: Next.js API 路由默认支持同源请求。跨域需要配置 headers。

```typescript
export async function GET(request: NextRequest) {
  return NextResponse.json(
    { data: 'example' },
    {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE',
      }
    }
  );
}
```

### Q: 如何优化 API 性能？
A:
- 使用数据库索引
- 实现缓存机制
- 异步处理耗时操作
- 限制响应数据大小

### Q: 如何保护 API 安全？
A:
- 实现身份验证（JWT）
- 添加请求频率限制
- 验证输入数据
- 使用 HTTPS

---

## 相关文件清单

```
app/api/
├── analyze/
│   └── route.ts            # 命理分析 API
├── fortune/
│   └── [id]/
│       └── route.ts        # 获取报告 API
├── chat/
│   └── route.ts            # AI 对话 API
├── profile/
│   └── [id]/
│       └── route.ts        # 用户档案 API
├── events/
│   └── route.ts            # 事件管理 API
├── history/
│   └── route.ts            # 历史记录 API
├── reminders/
│   └── route.ts            # 提醒管理 API
└── enhancements/
    └── route.ts            # 增运建议 API
```

---

**下一步建议**：
1. 实现 API 单元测试
2. 添加请求验证中间件
3. 实现 API 文档（Swagger/OpenAPI）
4. 添加性能监控
