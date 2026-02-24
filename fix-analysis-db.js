const fs = require('fs');

const path = 'lib/database.ts';
let content = fs.readFileSync(path, 'utf8');

// The regex replace for INSERT INTO was a bit tricky. Let's do a more robust one.
content = content.replace(
  /INSERT INTO fortunes \([\s\S]*?\)[\s\S]*?VALUES \([\s\S]*?\)/g,
  `INSERT INTO fortunes (id, user_id, name, birth_date, birth_time, birth_place, timezone, gender, bazi, five_elements, ten_gods, pattern, fortune, advice, evidence, analysis)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
);

// update stmt.run arguments for fortuneOperations.create
content = content.replace(
  /JSON\.stringify\(fortune\.evidence\)\n\s*\);/g,
  `JSON.stringify(fortune.evidence),
      JSON.stringify(fortune.analysis)
    );`
);

// update update function
content = content.replace(
  /if \(\['bazi', 'fiveElements', 'tenGods', 'pattern', 'fortune', 'advice', 'evidence'\]\.includes\(key\)\)/g,
  `if (['bazi', 'fiveElements', 'tenGods', 'pattern', 'fortune', 'advice', 'evidence', 'analysis'].includes(key))`
);

fs.writeFileSync(path, content);
console.log("Fixed db insert query in lib/database.ts");
