// 一次性查询，不入库
import { forumQuestionOperations, forumAnswerOperations } from '@/lib/database';
console.log('questions visible:', forumQuestionOperations.countTotal());
console.log('today:', forumQuestionOperations.countToday());
const list = forumQuestionOperations.listVisible({ limit: 3 });
console.log('latest 3:');
list.forEach((q) => {
  console.log(`  ${q.title} [${q.category}/${q.industry}] tags=${q.tags.join(',')} pub=${q.publishedAt}`);
  const ans = forumAnswerOperations.listByQuestion(q.id);
  console.log(`    answers visible: ${ans.length}`);
});
