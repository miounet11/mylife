import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ReportSevenDayActions from '@/components/report/report-seven-day-actions';

describe('ReportSevenDayActions', () => {
  it('renders structured actions', () => {
    const html = renderToStaticMarkup(
      createElement(ReportSevenDayActions, {
        reportId: 'r1',
        actions: [
          '明确本周唯一事业主线，并完成一次可展示的小交付',
          '优先动作：复盘关键节点',
          '顺着用神方向推进一项低成本验证',
        ],
      })
    );
    assert.match(html, /近 7 天可执行/);
    assert.match(html, /事业主线/);
    assert.match(html, /seven-day-actions/);
  });

  it('parses legacy summary phrase when structured field empty', () => {
    const html = renderToStaticMarkup(
      createElement(ReportSevenDayActions, {
        reportId: 'r2',
        actions: [],
        summaryText:
          '结构判断摘要。近 7 天可执行：梳理一笔固定支出；只推进一项低风险动作；避免无上限投入。后续再看。',
      })
    );
    assert.match(html, /梳理一笔固定支出/);
    assert.match(html, /低风险动作/);
  });

  it('returns empty when no actions', () => {
    const html = renderToStaticMarkup(
      createElement(ReportSevenDayActions, {
        reportId: 'r3',
        actions: null,
        summaryText: '普通摘要，没有可执行清单。',
      })
    );
    assert.equal(html, '');
  });
});
