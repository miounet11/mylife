// v5-D61 论坛 tick：被 forum-daemon.js 拉起的单次执行
// 流程：
//   1. 算今日应到的题数（按当前小时进度 / 24h × DAILY_TARGET）
//   2. 比对 forum_questions today 已有数，如缺则补
//   3. 把到期 pending 答释放为 visible

import {
  forumUserOperations,
  forumQuestionOperations,
  forumAnswerOperations,
} from '@/lib/database';
import { planBatch } from '@/lib/forum/generator';

const DAILY_TARGET = Number(process.argv[2] || 300);

async function main() {
  const usersPool = forumUserOperations.listAll();
  if (usersPool.length < 50) {
    console.error('[forum-tick] forum_users 数量过少，先跑 scripts/forum/seed-users.ts');
    process.exit(2);
  }

  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const elapsedMs = now.getTime() - startOfDay.getTime();
  const dayMs = 24 * 60 * 60 * 1000;
  const progress = Math.min(elapsedMs / dayMs, 1);
  const targetByNow = Math.floor(DAILY_TARGET * progress);

  const existingToday = forumQuestionOperations.countToday();
  const missing = Math.max(0, targetByNow - existingToday);

  console.log(`[forum-tick] target=${DAILY_TARGET} progress=${(progress * 100).toFixed(1)}% targetByNow=${targetByNow} existingToday=${existingToday} missing=${missing}`);

  if (missing > 0) {
    // 控制单 tick 上限避免一次塞太多
    const toGen = Math.min(missing, 60);
    // 把这一批均匀散布到 [刚才, now] 时间区间，等价"过去 N 分钟陆续有人提问"
    const spanMs = Math.min(60 * 60 * 1000, Math.max(toGen * 60 * 1000, 5 * 60 * 1000));
    const startAt = new Date(now.getTime() - spanMs);
    const baseSeed = Math.floor(Date.now() / 1000);
    const stepMs = spanMs / toGen;
    const entries = planBatch({ pool: usersPool as never, startAt, count: toGen, baseSeed });
    // planBatch 内部按 24h/count 散布，这里我们覆写 publishedAt 让它落在 spanMs 内
    entries.forEach((e, idx) => {
      const ts = new Date(startAt.getTime() + idx * stepMs).toISOString();
      e.question.publishedAt = ts;
      e.question.createdAt = ts;
      // 答的 scheduledFor 由下方根据 question.publishedAt 计算，不在这里改
    });

    let qCount = 0;
    let aCount = 0;
    for (const entry of entries) {
      try {
        forumQuestionOperations.create({
          id: entry.question.id,
          slug: entry.question.slug + '-' + Date.now().toString(36),
          authorId: entry.question.authorId,
          title: entry.question.title,
          body: entry.question.body,
          category: entry.question.category,
          industry: entry.question.industry,
          tags: entry.question.tags,
          privacyMode: entry.question.privacyMode,
          metadata: entry.question.metadata as Record<string, unknown>,
          status: 'visible',
          publishedAt: entry.question.publishedAt,
          viewCount: entry.question.viewCount,
          answerCount: entry.answers.length,
        });
        qCount++;
        for (const ans of entry.answers) {
          const scheduledFor = new Date(new Date(entry.question.publishedAt!).getTime() + ans.responseDelayMinutes * 60 * 1000).toISOString();
          forumAnswerOperations.createScheduled({
            id: ans.id,
            questionId: ans.questionId,
            authorId: ans.authorId,
            body: ans.body,
            isOfficial: ans.isOfficial,
            upvoteCount: ans.upvoteCount,
            scheduledFor,
            responseDelayMinutes: ans.responseDelayMinutes,
          });
          aCount++;
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.warn(`[forum-tick] entry skip ${entry.question.slug}: ${msg}`);
      }
    }
    console.log(`[forum-tick] 入库 ${qCount} questions / ${aCount} answers`);
  }

  // 释放到期 pending 答
  const dueAnswers = forumAnswerOperations.listPendingDue(500);
  for (const ans of dueAnswers) {
    forumAnswerOperations.releasePending(ans.id);
  }
  if (dueAnswers.length) {
    console.log(`[forum-tick] 释放 ${dueAnswers.length} 条到期答为 visible`);
  }
}

main().catch((e) => {
  console.error('[forum-tick] failed', e);
  process.exit(1);
});
