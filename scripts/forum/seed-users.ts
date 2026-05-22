// v5-D61 一次性把 500 虚拟用户灌入 forum_users
// 用法：npx tsx scripts/forum/seed-users.ts [total] [seed]

import { generateForumUserPool } from '@/lib/forum/seed-users';
import { forumUserOperations } from '@/lib/database';

const total = Number(process.argv[2] || 500);
const seed = Number(process.argv[3] || 42);

const pool = generateForumUserPool({ seed, total });
const inserted = forumUserOperations.upsertMany(pool);
const dbCount = forumUserOperations.count();

console.log(`[forum-seed-users] 生成 ${pool.length} 人，upsert ${inserted}，库总数 ${dbCount}`);
const dist = pool.reduce<Record<string, number>>((acc, u) => {
  acc[u.role] = (acc[u.role] || 0) + 1;
  return acc;
}, {});
console.log(`  分布：${Object.entries(dist).map(([k, v]) => `${k}=${v}`).join(' / ')}`);
