const Database = require('better-sqlite3');
const path = require('path');
const dbPath = path.join(process.cwd(), 'data', 'lifekline.db');

try {
  const db = new Database(dbPath);
  
  // Check if column exists
  const info = db.pragma('table_info(fortunes)');
  const hasAnalysis = info.some(col => col.name === 'analysis');
  
  if (!hasAnalysis) {
    db.exec('ALTER TABLE fortunes ADD COLUMN analysis JSON;');
    console.log('Added analysis column to fortunes table');
  } else {
    console.log('analysis column already exists');
  }
} catch (e) {
  console.error("Migration error:", e);
}
