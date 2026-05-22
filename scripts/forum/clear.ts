import { db } from '@/lib/database';
const a = db.prepare(`DELETE FROM forum_answers`).run();
const q = db.prepare(`DELETE FROM forum_questions`).run();
console.log('cleared', { questions: q.changes, answers: a.changes });
