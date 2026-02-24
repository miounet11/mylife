const fs = require('fs');
const path = 'lib/database.ts';
let content = fs.readFileSync(path, 'utf8');

// The replacement was:
// JSON.stringify(fortune.evidence),
//       JSON.stringify(fortune.analysis)
//     );

// if not already replaced
if (!content.includes('JSON.stringify(fortune.analysis)')) {
    content = content.replace(
      /JSON\.stringify\(fortune\.evidence\)\n\s*\);/,
      `JSON.stringify(fortune.evidence),
      JSON.stringify(fortune.analysis)
    );`
    );
    fs.writeFileSync(path, content);
}
