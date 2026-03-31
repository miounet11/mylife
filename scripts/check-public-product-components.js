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
