[根目录](../CLAUDE.md) > **lib**

# lib/ - 核心业务逻辑库

> 模块职责：命理分析引擎、数据库操作、工具函数
> 最后更新：2026-02-24 22:18:52

---

## 变更记录 (Changelog)

### 2026-02-24
- ✅ 初始化核心库模块文档
- ✅ 识别所有核心业务逻辑文件

---

## 模块职责

`lib/` 目录是项目的核心业务逻辑层，包含：
- **命理分析引擎**：八字排盘、五行分析、用神判断
- **数据库操作**：SQLite CRUD 封装
- **LLM 集成**：AI 深度解析生成
- **工具函数**：真太阳时计算、城市数据、类型定义

---

## 入口与启动

### 核心引擎初始化
```typescript
// 数据库初始化（自动执行）
import { initializeDatabase } from '@/lib/database';
initializeDatabase();

// 命理分析
import { analyzeFortune } from '@/lib/fortune-engine';
const result = analyzeFortune(name, birthDate, birthTime, birthPlace, timezone, gender);
```

---

## 对外接口（核心模块）

### 1. fortune-engine.ts - 命理分析引擎
**职责**：八字排盘与命理分析核心逻辑

#### 主要函数

##### calculateFourPillars()
**功能**：计算四柱八字

```typescript
export const calculateFourPillars = (
  birthDate: Date,
  birthTime: string,
  timezone: number
): Pillar[] => {
  // 使用 lunar-javascript 精确计算
  const solar = Solar.fromYmdHms(year, month, day, hour, minute, 0);
  const lunar = solar.getLunar();
  const ec = lunar.getEightChar();

  // 返回四柱数组 [年柱, 月柱, 日柱, 时柱]
  return [
    buildPillar(ec.getYearGan(), ec.getYearZhi(), ec.getYearNaYin()),
    buildPillar(ec.getMonthGan(), ec.getMonthZhi(), ec.getMonthNaYin()),
    buildPillar(ec.getDayGan(), ec.getDayZhi(), ec.getDayNaYin()),
    buildPillar(ec.getTimeGan(), ec.getTimeZhi(), ec.getTimeNaYin()),
  ];
}
```

**返回值**：
```typescript
interface Pillar {
  celestialStem: string;      // 天干
  earthlyBranch: string;      // 地支
  hiddenStems: string[];      // 藏干
  nayin: string;              // 纳音
  fiveElements: {
    main: string;             // 主五行
    hidden: string[];         // 藏干五行
    strength: number;         // 强度
  };
  relationships: {
    combination: string[];    // 合
    clash: string[];          // 冲
    penalty: string[];        // 刑
    harm: string[];           // 害
  };
}
```

---

##### analyzeFortune()
**功能**：完整命理分析（主入口）

```typescript
export const analyzeFortune = (
  name: string,
  birthDate: Date,
  birthTime: string,
  birthPlace: string,
  timezone: number = 8,
  gender: 'male' | 'female'
): FortuneAnalysisResult => {
  // 1. 计算四柱
  const pillars = calculateFourPillars(birthDate, birthTime, timezone);

  // 2. 权威用神分析
  const yongShenResult = determineYongShen(baziStr);

  // 3. 权威十神分析
  const shiShenAnalysis = generateBaziShiShenAnalysis(baziStr);

  // 4. 五行力量计算
  const fiveElements = buildFiveElements(baziStr, pillars);

  // 5. 十神配置
  const tenGods = buildTenGods(pillars, dayMaster, shiShenAnalysis);

  // 6. 格局判断
  const pattern = buildPattern(yongShenResult);

  // 7. 运势分析
  const fortune = buildFortuneTrend(baziStr, birthDate, gender, yongShenResult);

  // 8. 生成建议
  const advice = buildAdvice(yongShenResult, luckyElements);

  // 9. 数据支撑
  const evidence = generateEvidence(pillars);

  return { basic, fiveElements, tenGods, pattern, fortune, advice, evidence, analysis };
}
```

**返回值**：`FortuneAnalysisResult` 完整分析结果

---

### 2. bazi-analyzer.ts - 权威八字分析器
**职责**：用神判断、格局识别、十神分析

#### 主要函数

##### determineYongShen()
**功能**：判断用神、忌神、喜神

```typescript
export function determineYongShen(bazi: string[]): YongShenResult {
  // 1. 计算日主强弱
  const strength = calculateDayMasterStrength(bazi);

  // 2. 判断特殊格局（从格、化格、专旺）
  const specialPattern = detectSpecialPattern(bazi);

  // 3. 调候用神（季节调节）
  const tiaohou = determineTiaohou(bazi);

  // 4. 通关用神（化解冲克）
  const tongguan = determineTongguan(bazi);

  // 5. 综合判断用神
  return {
    yongShen: ['火', '木'],      // 用神
    jiShen: ['金', '水'],        // 忌神
    xiShen: ['土'],              // 喜神
    strength: 'weak',            // 日主强弱
    strengthDesc: '偏弱',
    analysis: '日主偏弱，需火木生扶...',
    pattern: specialPattern,
    tiaohuo: tiaohou,
    tongguan: tongguan
  };
}
```

---

##### generateBaziShiShenAnalysis()
**功能**：生成十神分析

```typescript
export function generateBaziShiShenAnalysis(bazi: string[]): ShiShenAnalysis {
  const dayMaster = bazi[2][0]; // 日主天干

  // 计算每柱的十神
  const shiShenMap = bazi.map((pillar, idx) => {
    if (idx === 2) return null; // 日柱天干是日主本身
    return calculateShiShen(dayMaster, pillar[0]);
  });

  return {
    distribution: shiShenMap,
    analysis: '正财透干，财运亨通...',
    strengths: ['正财', '食神'],
    weaknesses: ['七杀']
  };
}
```

---

### 3. bazi-constants.ts - 命理常量库
**职责**：天干地支、五行、十神等常量定义

#### 核心常量

```typescript
// 天干五行映射
export const GAN_TO_WUXING: Record<string, string> = {
  '甲': '木', '乙': '木',
  '丙': '火', '丁': '火',
  '戊': '土', '己': '土',
  '庚': '金', '辛': '金',
  '壬': '水', '癸': '水',
};

// 地支藏干
export const ZHI_CANG_GAN: Record<string, string[]> = {
  '子': ['癸'],
  '丑': ['己', '癸', '辛'],
  '寅': ['甲', '丙', '戊'],
  // ...
};

// 地支六合
export const ZHI_HE: Record<string, string> = {
  '子': '丑', '丑': '子',
  '寅': '亥', '亥': '寅',
  // ...
};

// 地支六冲
export const ZHI_CHONG: Record<string, string> = {
  '子': '午', '午': '子',
  '丑': '未', '未': '丑',
  // ...
};

// 十神计算
export function calculateShiShen(dayMaster: string, otherGan: string): string {
  // 根据五行生克关系计算十神
  // 返回：比肩、劫财、食神、伤官、偏财、正财、七杀、正官、偏印、正印
}
```

---

### 4. database.ts - 数据库操作
**职责**：SQLite 数据库 CRUD 封装

#### 数据库初始化

```typescript
export function initializeDatabase() {
  // 创建表结构
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (...)
    CREATE TABLE IF NOT EXISTS fortunes (...)
    CREATE TABLE IF NOT EXISTS events (...)
    CREATE TABLE IF NOT EXISTS questions (...)
    CREATE TABLE IF NOT EXISTS sessions (...)
  `);

  // 创建索引
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_fortunes_user_id ON fortunes(user_id);
    CREATE INDEX IF NOT EXISTS idx_events_user_id ON events(user_id);
  `);
}
```

#### 操作接口

```typescript
// 用户操作
export const userOperations = {
  create: (user: any) => { /* ... */ },
  getById: (id: string) => { /* ... */ },
  getByEmail: (email: string) => { /* ... */ },
  update: (id: string, updates: any) => { /* ... */ },
  delete: (id: string) => { /* ... */ },
};

// 命理数据操作
export const fortuneOperations = {
  create: (fortune: any) => { /* ... */ },
  getById: (id: string) => { /* ... */ },
  getByUserId: (userId: string) => { /* ... */ },
  update: (id: string, updates: any) => { /* ... */ },
  delete: (id: string) => { /* ... */ },
};

// 事件操作
export const eventOperations = {
  create: (event: any) => { /* ... */ },
  getById: (id: string) => { /* ... */ },
  getByUserId: (userId: string) => { /* ... */ },
  getByDateRange: (userId: string, startDate: string, endDate: string) => { /* ... */ },
  update: (id: string, updates: any) => { /* ... */ },
  delete: (id: string) => { /* ... */ },
};
```

---

### 5. llm.ts - LLM 集成
**职责**：调用 OpenAI API 生成深度解析

#### 主要函数

```typescript
export async function generateFortuneInterpretation(baziData: any) {
  const apiKey = getApiKey();
  if (!apiKey) return null;

  const openai = new OpenAI({
    apiKey: apiKey,
    baseURL: getApiBaseUrl(),
  });

  const prompt = `
    你是一位精通传统子平八字、滴天髓等命理学的顶级AI命理大师。
    请根据以下用户的八字排盘数据，生成一份极具深度、专业的命理解析报告。

    【用户排盘数据】
    ${JSON.stringify(baziData, null, 2)}

    请严格以JSON格式输出...
  `;

  const completion = await openai.chat.completions.create({
    model: getDefaultModel(),
    messages: [
      { role: "system", content: "你是一个专业的命理学API，只输出合法的JSON。" },
      { role: "user", content: prompt }
    ],
    temperature: 0.7,
  });

  const responseText = completion.choices[0].message.content;
  return JSON.parse(responseText);
}
```

---

### 6. solar-time.ts - 真太阳时计算
**职责**：经纬度与均时差修正

#### 主要函数

```typescript
export function calculateTrueSolarTime(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  second: number,
  longitude: number,
  timezone: number
): SolarTimeResult {
  // 1. 计算经度时差（东经为正，西经为负）
  const longitudeCorrection = (longitude - timezone * 15) * 4; // 分钟

  // 2. 计算均时差（地球公转椭圆轨道导致的时间差）
  const equationOfTime = calculateEquationOfTime(year, month, day);

  // 3. 总修正量
  const totalCorrection = longitudeCorrection + equationOfTime;

  // 4. 应用修正
  const correctedTime = new Date(year, month - 1, day, hour, minute, second);
  correctedTime.setMinutes(correctedTime.getMinutes() + totalCorrection);

  return {
    year: correctedTime.getFullYear(),
    month: correctedTime.getMonth() + 1,
    day: correctedTime.getDate(),
    hour: correctedTime.getHours(),
    minute: correctedTime.getMinutes(),
    second: correctedTime.getSeconds(),
    correctionMinutes: totalCorrection,
    description: `修正${totalCorrection.toFixed(1)}分钟`
  };
}
```

---

### 7. cities.ts - 全球城市数据
**职责**：城市经纬度与时区数据

```typescript
export interface CityData {
  name: string;        // 中文名
  nameEn: string;      // 英文名
  pinyin: string;      // 拼音
  lat: number;         // 纬度
  lng: number;         // 经度
  tz: number;          // 时区
  country: string;     // 国家
}

export const CITIES: CityData[] = [
  { name: '北京', nameEn: 'Beijing', pinyin: 'beijing', lat: 39.9042, lng: 116.4074, tz: 8, country: 'CN' },
  { name: '上海', nameEn: 'Shanghai', pinyin: 'shanghai', lat: 31.2304, lng: 121.4737, tz: 8, country: 'CN' },
  // ... 更多城市
];
```

---

### 8. master-phrases.ts - 大师话术库
**职责**：600+ 条命理话术模板

```typescript
export const MasterPhrases = {
  opening: [
    '细观您的八字，命理之象，历历在目。',
    '从您的四柱来看，天地人三才俱全。',
    // ... 50+ 条
  ],

  fiveElements: {
    wood: {
      strong: '木旺则仁，性格温和，富有同情心。',
      weak: '木弱则缺乏决断，需火木生扶。'
    },
    // ... 其他五行
  },

  patterns: {
    zhenge: {
      masterLanguage: '正格之命，中正平和，贵在平衡。',
      description: '四柱平衡，五行流通，格局清奇。'
    },
    // ... 其他格局
  },

  career: {
    general: ['事业运势整体向好...', /* ... */],
    specific: ['适合从事文化教育行业', /* ... */],
    direction: ['宜向南方发展', /* ... */],
    avoid: ['忌与属相相冲之人合作', /* ... */]
  },

  // ... 财富、婚姻、健康等
};
```

---

### 9. user-types.ts - 类型定义
**职责**：全局 TypeScript 类型定义

```typescript
// 用户档案
export interface UserFortuneProfile { /* ... */ }

// 四柱
export interface Pillar { /* ... */ }

// 五行
export interface FiveElements { /* ... */ }

// 十神
export interface TenGods { /* ... */ }

// 格局
export interface Pattern { /* ... */ }

// 分析结果
export interface FortuneAnalysisResult { /* ... */ }

// 重要事件
export interface ImportantEvent { /* ... */ }

// 会话
export interface Session { /* ... */ }

// ... 更多类型
```

---

### 10. user-utils.ts - 用户工具函数
**职责**：用户 ID 管理、Cookie 操作

```typescript
export async function getOrCreateGuestUserId(): Promise<string> {
  // 从 Cookie 获取或创建新的用户 ID
  const cookies = await import('next/headers').then(m => m.cookies());
  let userId = cookies.get('user_id')?.value;

  if (!userId) {
    userId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    cookies.set('user_id', userId, { maxAge: 365 * 24 * 60 * 60 }); // 1年
  }

  return userId;
}
```

---

### 11. utils.ts - 通用工具函数
**职责**：CSS 类名合并、日期格式化等

```typescript
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

---

## 关键依赖与配置

### 核心依赖
```json
{
  "better-sqlite3": "^11.7.0",
  "lunar-javascript": "^1.7.7",
  "openai": "^6.23.0",
  "date-fns": "^4.1.0"
}
```

---

## 数据模型

### 数据库表结构

```sql
-- 用户表
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  gender TEXT NOT NULL,
  birth_date TEXT NOT NULL,
  birth_time TEXT NOT NULL,
  birth_place TEXT,
  timezone INTEGER DEFAULT 8,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- 命理数据表
CREATE TABLE fortunes (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  bazi JSON NOT NULL,
  five_elements JSON NOT NULL,
  ten_gods JSON NOT NULL,
  pattern JSON NOT NULL,
  fortune JSON NOT NULL,
  advice JSON NOT NULL,
  evidence JSON NOT NULL,
  analysis JSON,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 事件表
CREATE TABLE events (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  date TEXT NOT NULL,
  impact TEXT NOT NULL,
  fortune_analysis JSON,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

---

## 测试与质量

### 测试建议
1. **命理引擎测试**：验证排盘准确性
2. **用神判断测试**：验证用神算法
3. **真太阳时测试**：验证时间修正
4. **数据库操作测试**：验证 CRUD 正确性

---

## 常见问题 (FAQ)

### Q: 如何验证命理分析的准确性？
A: 对比传统命理软件的排盘结果，验证四柱、藏干、纳音是否一致。

### Q: 真太阳时修正的原理是什么？
A: 基于经度差异（东经/西经）和均时差（地球公转椭圆轨道）进行时间修正。

### Q: 如何扩展命理分析功能？
A: 在 `fortune-engine.ts` 中添加新的分析函数，更新 `FortuneAnalysisResult` 类型。

---

## 相关文件清单

```
lib/
├── fortune-engine.ts          # 命理分析引擎
├── bazi-analyzer.ts           # 权威八字分析器
├── bazi-constants.ts          # 命理常量库
├── database.ts                # 数据库操作
├── llm.ts                     # LLM 集成
├── solar-time.ts              # 真太阳时计算
├── cities.ts                  # 全球城市数据
├── master-phrases.ts          # 大师话术库
├── user-types.ts              # 类型定义
├── user-utils.ts              # 用户工具函数
└── utils.ts                   # 通用工具函数
```

---

**下一步建议**：
1. 实现核心引擎单元测试
2. 优化用神判断算法
3. 扩展大师话术库
4. 添加更多城市数据
