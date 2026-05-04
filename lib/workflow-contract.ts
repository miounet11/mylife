import fs from 'node:fs';
import path from 'node:path';

export type LifeKlineWorkflowContract = {
  id: string;
  name: string;
  description?: string;
  runtime: Record<string, unknown>;
  stages: string[];
  qualityPolicy: Record<string, unknown>;
  observability: Record<string, unknown>;
  memoryPolicy?: Record<string, unknown>;
};

function readString(value: unknown, fallback: string) {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function readStringArray(value: unknown) {
  return Array.isArray(value)
    ? value.map((item) => `${item || ''}`.trim()).filter(Boolean)
    : [];
}

function readObject(value: unknown) {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

export function parseWorkflowContract(input: unknown, fallbackId: string): LifeKlineWorkflowContract {
  const raw = readObject(input);
  return {
    id: readString(raw.id, fallbackId),
    name: readString(raw.name, fallbackId),
    description: readString(raw.description, ''),
    runtime: readObject(raw.runtime),
    stages: readStringArray(raw.stages),
    qualityPolicy: readObject(raw.qualityPolicy),
    observability: readObject(raw.observability),
    memoryPolicy: readObject(raw.memoryPolicy),
  };
}

export function loadWorkflowContract(filePath: string, fallbackId: string) {
  const absolutePath = path.resolve(process.cwd(), filePath);
  const raw = fs.readFileSync(absolutePath, 'utf8');
  return parseWorkflowContract(JSON.parse(raw), fallbackId);
}
