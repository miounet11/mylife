// 输入验证工具函数

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

// 验证出生日期
export function validateBirthDate(dateStr: string): ValidationError | null {
  if (!dateStr || typeof dateStr !== 'string') {
    return { field: 'birthDate', message: '出生日期不能为空' };
  }
  const parts = dateStr.split('-').map(Number);
  if (parts.length !== 3) {
    return { field: 'birthDate', message: '日期格式应为 YYYY-MM-DD' };
  }
  const [year, month, day] = parts;
  if (isNaN(year) || isNaN(month) || isNaN(day)) {
    return { field: 'birthDate', message: '日期包含无效数字' };
  }
  if (year < 1800 || year > new Date().getFullYear()) {
    return { field: 'birthDate', message: `出生年份应在 1800 到 ${new Date().getFullYear()} 之间` };
  }
  if (month < 1 || month > 12) {
    return { field: 'birthDate', message: '月份应在 1-12 之间' };
  }
  if (day < 1 || day > 31) {
    return { field: 'birthDate', message: '日期应在 1-31 之间' };
  }
  const date = new Date(year, month - 1, day);
  if (date.getMonth() !== month - 1) {
    return { field: 'birthDate', message: '日期不存在（如2月30日）' };
  }
  return null;
}

// 验证出生时间
export function validateBirthTime(timeStr: string): ValidationError | null {
  if (!timeStr || typeof timeStr !== 'string') {
    return { field: 'birthTime', message: '出生时间不能为空' };
  }
  const parts = timeStr.split(':').map(Number);
  if (parts.length < 2) {
    return { field: 'birthTime', message: '时间格式应为 HH:mm' };
  }
  const [hour, minute] = parts;
  if (isNaN(hour) || hour < 0 || hour > 23) {
    return { field: 'birthTime', message: '小时应在 0-23 之间' };
  }
  if (isNaN(minute) || minute < 0 || minute > 59) {
    return { field: 'birthTime', message: '分钟应在 0-59 之间' };
  }
  return null;
}

// 验证姓名
export function validateName(name: string): ValidationError | null {
  if (!name || typeof name !== 'string') {
    return { field: 'name', message: '姓名不能为空' };
  }
  const trimmed = name.trim();
  if (trimmed.length === 0) {
    return { field: 'name', message: '姓名不能为空' };
  }
  if (trimmed.length > 50) {
    return { field: 'name', message: '姓名不能超过50个字符' };
  }
  return null;
}

// 验证性别
export function validateGender(gender: string): ValidationError | null {
  if (gender && gender !== 'male' && gender !== 'female') {
    return { field: 'gender', message: '性别只能是 male 或 female' };
  }
  return null;
}

// 验证时区
export function validateTimezone(timezone: number): ValidationError | null {
  if (timezone !== undefined && (isNaN(timezone) || timezone < -12 || timezone > 14)) {
    return { field: 'timezone', message: '时区应在 -12 到 14 之间' };
  }
  return null;
}

// 验证经度
export function validateLongitude(longitude: number): ValidationError | null {
  if (longitude !== undefined && (isNaN(longitude) || longitude < -180 || longitude > 180)) {
    return { field: 'longitude', message: '经度应在 -180 到 180 之间' };
  }
  return null;
}

// 验证问题内容
export function validateQuestion(question: string): ValidationError | null {
  if (!question || typeof question !== 'string') {
    return { field: 'question', message: '问题内容不能为空' };
  }
  const trimmed = question.trim();
  if (trimmed.length === 0) {
    return { field: 'question', message: '问题内容不能为空' };
  }
  if (trimmed.length > 2000) {
    return { field: 'question', message: '问题内容不能超过2000个字符' };
  }
  return null;
}

export function validateEmail(email: string): ValidationError | null {
  if (!email || typeof email !== 'string') {
    return { field: 'email', message: '邮箱不能为空' };
  }
  const normalized = email.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(normalized)) {
    return { field: 'email', message: '请输入有效的邮箱地址' };
  }
  if (normalized.length > 160) {
    return { field: 'email', message: '邮箱长度不能超过160个字符' };
  }
  return null;
}

// 验证事件类型
const VALID_EVENT_TYPES = ['career', 'wealth', 'marriage', 'health', 'family', 'other'] as const;
export type EventType = typeof VALID_EVENT_TYPES[number];

export function validateEventType(type: string): ValidationError | null {
  if (!type) {
    return { field: 'type', message: '事件类型不能为空' };
  }
  if (!VALID_EVENT_TYPES.includes(type as EventType)) {
    return { field: 'type', message: `事件类型只能是: ${VALID_EVENT_TYPES.join(', ')}` };
  }
  return null;
}

// 验证事件影响
const VALID_IMPACTS = ['positive', 'negative', 'neutral'] as const;
export type ImpactType = typeof VALID_IMPACTS[number];

export function validateImpact(impact: string): ValidationError | null {
  if (impact && !VALID_IMPACTS.includes(impact as ImpactType)) {
    return { field: 'impact', message: `影响类型只能是: ${VALID_IMPACTS.join(', ')}` };
  }
  return null;
}

// 组合验证：命理分析请求
export function validateAnalyzeRequest(data: Record<string, unknown>): ValidationResult {
  const errors: ValidationError[] = [];

  const nameErr = validateName(data.name as string);
  if (nameErr) errors.push(nameErr);

  const dateErr = validateBirthDate(data.birthDate as string);
  if (dateErr) errors.push(dateErr);

  const timeErr = validateBirthTime(data.birthTime as string);
  if (timeErr) errors.push(timeErr);

  const genderErr = validateGender(data.gender as string);
  if (genderErr) errors.push(genderErr);

  const tzErr = validateTimezone(data.timezone as number);
  if (tzErr) errors.push(tzErr);

  const lngErr = validateLongitude(data.longitude as number);
  if (lngErr) errors.push(lngErr);

  return { valid: errors.length === 0, errors };
}

// 组合验证：事件创建请求
export function validateEventRequest(data: Record<string, unknown>): ValidationResult {
  const errors: ValidationError[] = [];

  const typeErr = validateEventType(data.type as string);
  if (typeErr) errors.push(typeErr);

  if (!data.title || typeof data.title !== 'string' || (data.title as string).trim().length === 0) {
    errors.push({ field: 'title', message: '事件标题不能为空' });
  } else if ((data.title as string).length > 100) {
    errors.push({ field: 'title', message: '事件标题不能超过100个字符' });
  }

  if (!data.date || typeof data.date !== 'string') {
    errors.push({ field: 'date', message: '事件日期不能为空' });
  } else {
    const dateErr = validateBirthDate(data.date as string);
    if (dateErr) errors.push({ ...dateErr, field: 'date' });
  }

  const impactErr = validateImpact(data.impact as string);
  if (impactErr) errors.push(impactErr);

  return { valid: errors.length === 0, errors };
}
