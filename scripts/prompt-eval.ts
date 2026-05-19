/**
 * Prompt eval runner.
 *
 * 用法：
 *   tsx scripts/prompt-eval.ts                      # 跑所有 case，列表展示
 *   tsx scripts/prompt-eval.ts --id analyze.structure
 *   tsx scripts/prompt-eval.ts --baseline out.json  # 写 baseline
 *   tsx scripts/prompt-eval.ts --compare base.json  # 与 baseline 对比并打印 diff
 *
 * 实现层级：
 * - 不调用真实 LLM。本脚本接受一个 mock runner，或读取 fixtures 目录里的样例输出。
 * - 真实 LLM 联调放到 npm run prompt:eval:live （后续单独脚本），避免每次跑都烧钱。
 */
import { readFileSync, readdirSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import '../lib/prompts'; // 触发注册
import {
  aggregateScores,
  dumpPrompt,
  listPrompts,
  scoreOutput,
} from '../lib/prompts';
import type { EvalCase, EvalScore, PromptStage } from '../lib/prompts';

const CASES_DIR = join(process.cwd(), 'lib/prompts/eval/cases');
const FIXTURES_DIR = join(process.cwd(), 'lib/prompts/eval/fixtures');

interface Args {
  id?: PromptStage;
  baseline?: string;
  compare?: string;
}

function parseArgs(): Args {
  const argv = process.argv.slice(2);
  const out: Args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--id') out.id = argv[++i] as PromptStage;
    else if (a === '--baseline') out.baseline = argv[++i];
    else if (a === '--compare') out.compare = argv[++i];
  }
  return out;
}

function loadCases(): EvalCase[] {
  if (!existsSync(CASES_DIR)) return [];
  return readdirSync(CASES_DIR)
    .filter((f) => f.endsWith('.json'))
    .map((f) => JSON.parse(readFileSync(join(CASES_DIR, f), 'utf8')) as EvalCase);
}

function loadFixture(caseId: string): unknown | null {
  const path = join(FIXTURES_DIR, `${caseId}.output.json`);
  if (!existsSync(path)) return null;
  return JSON.parse(readFileSync(path, 'utf8'));
}

function main() {
  const args = parseArgs();
  const allCases = loadCases();
  const cases = args.id ? allCases.filter((c) => c.promptId === args.id) : allCases;

  if (!cases.length) {
    console.log('[prompt-eval] no cases found. drop EvalCase json files into lib/prompts/eval/cases/');
    console.log('[prompt-eval] registered prompts:', listPrompts().map((p) => `${p.id}@${p.version}`));
    return;
  }

  const all: EvalScore[] = [];
  for (const c of cases) {
    const out = loadFixture(c.id);
    if (out == null) {
      console.warn(`[prompt-eval] missing fixture for ${c.id} — skipped. expected file: lib/prompts/eval/fixtures/${c.id}.output.json`);
      continue;
    }
    const score = scoreOutput(out, c, {
      requiredFields: c.engineTruth ? Object.keys(c.engineTruth) : undefined,
    });
    const spec = dumpPrompt(c.promptId);
    score.promptVersion = (spec?.version as string) || 'unregistered';
    all.push(score);
    console.log(`- ${c.id} [${c.promptId}@${score.promptVersion}] total=${score.total}`);
    if (score.notes.length) score.notes.forEach((n) => console.log(`    · ${n}`));
  }

  const agg = aggregateScores(all);
  console.log('\n=== aggregate ===');
  console.log(JSON.stringify(agg, null, 2));

  if (args.baseline) {
    mkdirSync(dirname(args.baseline), { recursive: true });
    writeFileSync(args.baseline, JSON.stringify({ generatedAt: new Date().toISOString(), scores: all, aggregate: agg }, null, 2));
    console.log(`[prompt-eval] baseline written: ${args.baseline}`);
  }

  if (args.compare) {
    const base = JSON.parse(readFileSync(args.compare, 'utf8'));
    const diff = agg.total - (base.aggregate?.total ?? 0);
    const sign = diff > 0 ? '+' : '';
    console.log(`\n=== compare vs ${args.compare} ===`);
    console.log(`total: ${base.aggregate?.total ?? 'n/a'} → ${agg.total}  (${sign}${diff.toFixed(1)})`);
    if (agg.avg && base.aggregate?.avg) {
      for (const key of Object.keys(agg.avg) as Array<keyof typeof agg.avg>) {
        const before = base.aggregate.avg[key];
        const after = agg.avg[key];
        const d = (after as number) - (before as number);
        const s = d > 0 ? '+' : '';
        console.log(`  ${key}: ${before} → ${after}  (${s}${d.toFixed(1)})`);
      }
    }
  }
}

main();
