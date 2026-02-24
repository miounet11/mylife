const fs = require('fs');
const path = 'app/api/analyze/route.ts';
let content = fs.readFileSync(path, 'utf8');

// Fix fortuneOperations.create in route.ts to pass analysis
content = content.replace(
  /evidence: finalResult\.evidence\n\s*\}\);/,
  `evidence: finalResult.evidence,
      analysis: finalResult.analysis
    });`
);

fs.writeFileSync(path, content);
console.log("Updated app/api/analyze/route.ts");
