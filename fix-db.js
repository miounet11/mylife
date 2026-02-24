const fs = require('fs');

const path = 'lib/database.ts';
let content = fs.readFileSync(path, 'utf8');

// 1. Add analysis to CREATE TABLE
content = content.replace(
  /evidence JSON NOT NULL,/,
  'evidence JSON NOT NULL,\n      analysis JSON,'
);

// 2. Add analysis to INSERT INTO
content = content.replace(
  /evidence\)\s+VALUES \(\?, \?, \?, \?, \?, \?, \?, \?, \?, \?, \?, \?, \?, \?, \?\)/,
  'evidence, analysis)\n      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
);

// 3. Add analysis to stmt.run
content = content.replace(
  /JSON\.stringify\(fortune\.evidence\)\n\s+\);/,
  'JSON.stringify(fortune.evidence),\n      JSON.stringify(fortune.analysis)\n    );'
);

// 4. Add analysis to SELECT parsing (getById, getByUserId, etc.)
// We need to parse analysis if it exists.
content = content.replace(
  /evidence: JSON\.parse\(row\.evidence\),/g,
  'evidence: JSON.parse(row.evidence),\n        analysis: row.analysis ? JSON.parse(row.analysis) : null,'
);

fs.writeFileSync(path, content);
console.log("Updated lib/database.ts");
