#!/bin/bash
# LLM answer upgrader — no metadata tracking, just upgrade official answers with fake template format
export API_KEY="sk-81d0gUX6fsJWVaqm82VJM8qtzFlp0mrkreByEZIvs3OfpM3Q"
export API_BASE_URL="https://ttqq.inping.com/v1"
export NODE_OPTIONS="--max-old-space-size=512"
cd /home/life-kline-next

for ((i=1; i<=200; i++)); do
  R=$(sqlite3 data/lifekline.db "SELECT COUNT(*) FROM forum_answers WHERE is_official=1 AND body LIKE '%初步判断%';")
  if [ "$R" -eq 0 ]; then
    echo "[$(date +%H:%M:%S)] ALL DONE after $i batches"
    break
  fi
  echo -n "[$(date +%H:%M:%S)] batch $i remaining=$R "
  node -e "
const DB = require('better-sqlite3');
const db = new DB('data/lifekline.db');

const answers = db.prepare(
  'SELECT a.id, a.question_id, a.body, q.title as qtitle, q.body as qbody, q.category FROM forum_answers a JOIN forum_questions q ON a.question_id=q.id WHERE a.is_official=1 AND a.body LIKE \"%初步判断%\" ORDER BY a.published_at DESC LIMIT 300'
).all();

if (!answers.length) { console.log('DONE:0'); db.close(); process.exit(0); }

async function go() {
  let ok=0, fail=0;
  for (let i=0; i<answers.length; i+=30) {
    const batch = answers.slice(i, i+30);
    const results = await Promise.allSettled(batch.map(async (a) => {
      const r = await fetch(process.env.API_BASE_URL+'/chat/completions', {
        method:'POST',
        headers:{'Content-Type':'application/json','Authorization':'Bearer '+process.env.API_KEY},
        body: JSON.stringify({model:'auto',messages:[
          {role:'system',content:'Rewrite this fake AI answer to sound like a real person on a Chinese metaphysics forum. Rules: NO markdown headers (no **粗体标题**), NO 【组织标签】, NO \"点这里免费生成\" CTAs. Just natural paragraphs, 120-300 chars. Be specific and reference the question details. Output ONLY valid JSON: {\"body\":\"...\"}'},
          {role:'user',content:'Rewrite: Q:'+a.qtitle.slice(0,100)+' | Old:'+a.body.slice(0,200)}
        ],temperature:0.75,max_tokens:500,response_format:{type:'json_object'}}),
        signal:AbortSignal.timeout(12000)
      });
      if(!r.ok) throw new Error('http:'+r.status);
      const d=await r.json(); const c=d.choices?.[0]?.message?.content;
      if(!c) throw new Error('empty');
      let j; try{j=JSON.parse(c)}catch(e){const m=c.match(/\{[\s\S]*\}/);if(m)j=JSON.parse(m[0]);else throw new Error('json')}
      if(!j.body||j.body.length<80) throw new Error('short:'+(j.body?.length||0));
      db.prepare('UPDATE forum_answers SET body=? WHERE id=?').run(j.body,a.id);
      return j.body.length;
    }));
    for(const r of results){r.status==='fulfilled'?ok++:fail++}
  }
  const rem=db.prepare(\"SELECT COUNT(*) as n FROM forum_answers WHERE is_official=1 AND body LIKE '%初步判断%'\").get();
  console.log('DONE:'+ok+':'+fail+':'+(rem.n));
  db.close();
}
go().catch(e=>{console.log('FATAL:'+(e.message||''));process.exit(1)});
" 2>&1
  sleep 1
done

echo "=== FINAL ==="
sqlite3 data/lifekline.db "SELECT 'remaining_fake_official='||COUNT(*) FROM forum_answers WHERE is_official=1 AND body LIKE '%初步判断%';"
