const { readFileSync } = require('node:fs');
const path = require('node:path');

const heroChecks = [
  {
    file: 'app/admin/analytics/page.tsx',
    required: ['action-strip', 'action-primary'],
    forbidden: ['section-label', 'intro-panel'],
  },
  {
    file: 'app/admin/content/page.tsx',
    required: ['action-strip', 'action-primary'],
    forbidden: ['section-label', 'intro-panel'],
  },
  {
    file: 'app/admin/premium-services/page.tsx',
    required: ['action-strip', 'action-primary'],
    forbidden: ['section-label', 'intro-panel'],
  },
];

const componentChecks = [
  {
    file: 'components/content-automation-panel.tsx',
    required: ['action-guide', 'action-strip'],
  },
  {
    file: 'components/content-radar-panel.tsx',
    required: ['action-guide', 'action-strip'],
  },
  {
    file: 'components/content-generation-panel.tsx',
    required: ['action-guide', 'action-primary'],
  },
  {
    file: 'components/content-admin-console.tsx',
    required: ['action-guide', 'action-primary', 'action-secondary'],
  },
  {
    file: 'components/admin-premium-service-console.tsx',
    required: ['action-guide', 'action-primary', 'action-secondary'],
  },
];

const issues = [];

function inspect(check, category) {
  const fullPath = path.join(process.cwd(), check.file);
  const source = readFileSync(fullPath, 'utf8');

  for (const pattern of check.required || []) {
    if (!source.includes(pattern)) {
      issues.push(`${check.file}: missing ${pattern} (${category})`);
    }
  }

  for (const pattern of check.forbidden || []) {
    if (source.includes(pattern)) {
      issues.push(`${check.file}: legacy ${pattern} still present (${category})`);
    }
  }
}

for (const check of heroChecks) {
  inspect(check, 'hero');
}

for (const check of componentChecks) {
  inspect(check, 'component');
}

if (issues.length > 0) {
  console.error('Admin product component check failed:\n');
  for (const issue of issues) {
    console.error(`- ${issue}`);
  }
  process.exit(1);
}

console.log('Admin product component check passed.');
