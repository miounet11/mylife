import { db } from '@/lib/database';

const totalQ = (db.prepare('SELECT COUNT(*) as n FROM forum_questions').get() as any).n;
const totalA = (db.prepare('SELECT COUNT(*) as n FROM forum_answers').get() as any).n;
const visibleQ = (db.prepare(`SELECT COUNT(*) as n FROM forum_questions WHERE status='visible'`).get() as any).n;
const visiblePub = (db.prepare(`SELECT COUNT(*) as n FROM forum_questions WHERE status='visible' AND published_at <= datetime('now')`).get() as any).n;
const nowISO = new Date().toISOString();
console.log({ totalQ, totalA, visibleQ, visiblePub, nowISO });
const sample = db.prepare(`SELECT slug, status, published_at, datetime('now') as now FROM forum_questions ORDER BY datetime(published_at) DESC LIMIT 5`).all();
console.log(sample);
