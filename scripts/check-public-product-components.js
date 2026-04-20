const { readFileSync } = require('node:fs');
const path = require('node:path');

const componentChecks = [
  {
    file: 'components/tool-history-panel.tsx',
    patterns: ['intro-copy', 'action-secondary'],
  },
  {
    file: 'components/newsletter-signup.tsx',
    patterns: ['intro-copy', 'action-primary', 'action-secondary'],
  },
  {
    file: 'components/content-quick-analyze-panel.tsx',
    patterns: ['intro-copy', 'intro-panel', 'action-primary'],
  },
  {
    file: 'components/surface-journey-panel.tsx',
    patterns: ['intro-copy'],
  },
  {
    file: 'components/personal-growth-panel.tsx',
    patterns: ['intro-copy', 'action-primary', 'action-secondary'],
  },
  {
    file: 'components/tool-premium-depth-panel.tsx',
    patterns: ['intro-copy', 'action-primary', 'action-secondary'],
  },
  {
    file: 'components/tool-conversion-panel.tsx',
    patterns: ['intro-copy'],
  },
  {
    file: 'components/content-conversion-panel.tsx',
    patterns: ['intro-copy', 'intro-panel', 'action-primary', 'action-secondary'],
  },
  {
    file: 'components/tool-premium-request-panel.tsx',
    patterns: ['intro-copy', 'intro-panel'],
  },
  {
    file: 'components/tool-journey-panel.tsx',
    patterns: ['intro-copy', 'action-secondary'],
  },
  {
    file: 'components/report-subscription-panel.tsx',
    patterns: ['intro-copy', 'action-primary', 'action-secondary'],
  },
  {
    file: 'components/report-event-capture.tsx',
    patterns: ['intro-copy', 'action-secondary'],
  },
  {
    file: 'components/result-public-controls.tsx',
    patterns: ['intro-copy', 'action-secondary'],
  },
  {
    file: 'components/report-engine-panel.tsx',
    patterns: ['intro-copy'],
  },
  {
    file: 'components/tool-memory-panel.tsx',
    patterns: ['intro-copy', 'action-secondary'],
  },
  {
    file: 'components/tool-recommendations.tsx',
    patterns: ['intro-copy'],
  },
  {
    file: 'components/tool-linked-content-panel.tsx',
    patterns: ['intro-copy'],
  },
  {
    file: 'components/tool-case-stories-panel.tsx',
    patterns: ['intro-copy'],
  },
  {
    file: 'components/updates-status-panel.tsx',
    patterns: ['intro-copy', 'action-primary', 'action-secondary'],
  },
  {
    file: 'components/related-content.tsx',
    patterns: ['intro-copy', 'action-secondary'],
  },
  {
    file: 'components/tool-bundle-panel.tsx',
    patterns: ['intro-copy', 'action-secondary'],
  },
  {
    file: 'components/tool-editorial-panel.tsx',
    patterns: ['intro-copy'],
  },
  {
    file: 'components/report-premium-services.tsx',
    patterns: ['intro-copy', 'action-secondary'],
  },
  {
    file: 'components/report/agentic-insight-panel.tsx',
    patterns: ['intro-copy', 'intro-panel'],
  },
  {
    file: 'components/result-deferred-section.tsx',
    patterns: ['intro-copy'],
  },
  {
    file: 'components/site-footer.tsx',
    patterns: ['intro-copy', 'action-secondary'],
  },
  {
    file: 'components/newsletter-manager.tsx',
    patterns: ['intro-copy', 'action-secondary'],
  },
  {
    file: 'components/login-flow.tsx',
    patterns: ['intro-copy', 'intro-panel', 'action-primary', 'action-secondary'],
  },
  {
    file: 'components/paipan-entry-shell.tsx',
    patterns: ['intro-copy'],
  },
  {
    file: 'components/birth-date-input.tsx',
    patterns: ['intro-copy'],
  },
  {
    file: 'components/birth-time-input.tsx',
    patterns: ['intro-copy'],
  },
  {
    file: 'components/analyze-workspace.tsx',
    patterns: ['intro-copy', 'action-secondary'],
  },
];

const issues = [];

for (const check of componentChecks) {
  const fullPath = path.join(process.cwd(), check.file);
  const source = readFileSync(fullPath, 'utf8');

  for (const pattern of check.patterns) {
    if (!source.includes(pattern)) {
      issues.push(`${check.file}: missing ${pattern}`);
    }
  }
}

if (issues.length > 0) {
  console.error('Public product component check failed:\n');
  for (const issue of issues) {
    console.error(`- ${issue}`);
  }
  process.exit(1);
}

console.log('Public product component check passed.');
