import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('result page stage ladder surface', () => {
  const source = readFileSync(join(process.cwd(), 'app/result/[id]/page.tsx'), 'utf8');

  it('renders the user-facing stage ladder from the shared helper', () => {
    expect(source).toContain('buildReportStageLadder');
    expect(source).toContain('reportStageLadder.map');
    expect(source).toContain('报告阅读进度');
    expect(source).toContain('下一阶段');
    expect(source).toContain('当前阶段');
    expect(source).toContain('data-stage-key={item.key}');
  });

  it('marks each rendered ladder card with its stage key for regression safety', () => {
    expect(source).toContain('data-stage-key={item.key}');
    expect(source).toContain("item.status === 'current'");
    expect(source).toContain("item.status === 'completed'");
  });
});
