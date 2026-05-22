// v5-D61 forum dry-run：生成样本到 stdout，不入库
// 用法：npx tsx scripts/forum/dry-run.ts [count]

import { generateForumUserPool } from '@/lib/forum/seed-users';
import { planBatch } from '@/lib/forum/generator';

const count = Number(process.argv[2] || 5);

const pool = generateForumUserPool({ seed: 42, total: 500 });
console.log(`[forum] 池规模：${pool.length}`);
console.log(`  - asker: ${pool.filter((u) => u.role === 'asker').length}`);
console.log(`  - master: ${pool.filter((u) => u.role === 'master').length}`);
console.log(`  - official: ${pool.filter((u) => u.role === 'official').length}`);
console.log(`  - enthusiast: ${pool.filter((u) => u.role === 'enthusiast').length}`);
console.log('');
console.log('样本用户（前 6 个）：');
pool.slice(0, 6).forEach((u) => {
  console.log(`  [${u.role}] ${u.displayName} (@${u.handle}) · ${u.email} · ${u.province}${u.city} · ${u.occupation} · rep=${u.reputation}`);
  console.log(`    bio: ${u.bio}`);
});

console.log('');
console.log('━'.repeat(80));
console.log(`生成 ${count} 条 Q&A：`);
console.log('━'.repeat(80));

const entries = planBatch({ pool, startAt: new Date(), count, baseSeed: 1234 });

entries.forEach((entry, i) => {
  console.log('');
  console.log(`#${i + 1} [${entry.question.category}/${entry.question.industry}] ${entry.question.title}`);
  console.log(`  slug: ${entry.question.slug}`);
  console.log(`  tags: ${entry.question.tags.join(' / ')}`);
  console.log(`  privacy: ${entry.question.privacyMode} (隐藏: ${entry.question.metadata.visibilityMask.join(',')})`);
  const asker = pool.find((u) => u.id === entry.question.authorId)!;
  console.log(`  问者: ${asker.displayName} · ${asker.province}${asker.city} · ${asker.occupation}`);
  console.log(`  publishedAt: ${entry.question.publishedAt}`);
  console.log(`  views: ${entry.question.viewCount} · answers: ${entry.question.answerCount}`);
  console.log(`  ---- 问题正文 ----`);
  console.log(entry.question.body.split('\n').map((l) => '  ' + l).join('\n'));
  console.log('');
  entry.answers.forEach((a, k) => {
    const r = pool.find((u) => u.id === a.authorId)!;
    console.log(`  >>> 答 ${k + 1} [${a.isOfficial ? '★ 官方' : r.role}] by ${r.displayName} · 延迟 ${a.responseDelayMinutes} min · upvote ${a.upvoteCount}`);
    console.log(a.body.split('\n').map((l) => '      ' + l).join('\n'));
  });
});

console.log('');
console.log('━'.repeat(80));
console.log('dry-run 完毕。无入库。');
