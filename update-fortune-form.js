const fs = require('fs');
const path = 'components/fortune-form.tsx';
let content = fs.readFileSync(path, 'utf8');

// Import the new FortuneProgress component
if (!content.includes('import FortuneProgress')) {
  content = content.replace(
    /import { useState } from 'react';/,
    `import { useState } from 'react';\nimport FortuneProgress from './fortune-progress';`
  );
}

// Replace the generic loading indicator with the new FortuneProgress
content = content.replace(
  /<div className="absolute inset-0 bg-white\/50 backdrop-blur-sm flex items-center justify-center rounded-2xl z-50">[\s\S]*?<\/div>/,
  `<div className="absolute inset-0 bg-white/80 backdrop-blur-md flex items-center justify-center rounded-2xl z-50">
          <FortuneProgress isComplete={false} />
        </div>`
);

fs.writeFileSync(path, content);
console.log("Updated components/fortune-form.tsx");
