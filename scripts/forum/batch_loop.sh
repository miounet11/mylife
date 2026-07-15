#!/bin/bash
# Clean batch upgrader - runs llm-upgrade-v2.mjs in 50-post chunks
# Each chunk: ~2 min. Total: ~8600 posts / 50 * 2min = ~5.7h

export API_KEY="sk-81d0gUX6fsJWVaqm82VJM8qtzFlp0mrkreByEZIvs3OfpM3Q"
export API_BASE_URL="https://ttqq.inping.com/v1"
export NODE_OPTIONS="--max-old-space-size=512"
cd /home/life-kline-next

for ((i=1; i<=200; i++)); do
  R=$(sqlite3 data/lifekline.db "SELECT COUNT(*) FROM forum_questions WHERE status='visible' AND CAST(metadata AS TEXT) NOT LIKE '%llm%' AND length(body) < 200;")
  [ "$R" -eq 0 ] && echo "[$(date +%H:%M:%S)] ALL DONE after $i batches" && break

  echo "[$(date +%H:%M:%S)] batch $i | remaining=$R"
  node scripts/forum/llm-upgrade-v2.mjs 50 2>&1 | grep -E "posts:|DONE:|FAIL" | tail -3
  sleep 2
done

echo "=== FINAL ==="
sqlite3 data/lifekline.db "SELECT 'upgraded=' || COUNT(*) FROM forum_questions WHERE status='visible' AND CAST(metadata AS TEXT) LIKE '%llm%';"
sqlite3 data/lifekline.db "SELECT 'remaining_short=' || COUNT(*) FROM forum_questions WHERE status='visible' AND CAST(metadata AS TEXT) NOT LIKE '%llm%' AND length(body) < 200;"
