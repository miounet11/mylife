#!/bin/bash
export API_KEY="sk-81d0gUX6fsJWVaqm82VJM8qtzFlp0mrkreByEZIvs3OfpM3Q"
export API_BASE_URL="https://ttqq.inping.com/v1"
export NODE_OPTIONS="--max-old-space-size=512"
cd /home/life-kline-next

for ((i=1; i<=200; i++)); do
  R=$(sqlite3 data/lifekline.db "SELECT COUNT(*) FROM forum_questions WHERE status='visible' AND CAST(metadata AS TEXT) NOT LIKE '%llm%' AND length(body) < 200;")
  if [ "$R" -eq 0 ]; then
    echo "[$(date +%H:%M:%S)] ALL DONE after $i batches"
    break
  fi
  echo -n "[$(date +%H:%M:%S)] batch $i remaining=$R "
  RESULT=$(node scripts/forum/llm-upgrade-fast.mjs 300 2>&1)
  echo "$RESULT"
  sleep 1
done

echo "=== FINAL ==="
sqlite3 data/lifekline.db "SELECT 'upgraded=' || COUNT(*) FROM forum_questions WHERE status='visible' AND CAST(metadata AS TEXT) LIKE '%llm%';"
sqlite3 data/lifekline.db "SELECT 'remaining=' || COUNT(*) FROM forum_questions WHERE status='visible' AND CAST(metadata AS TEXT) NOT LIKE '%llm%' AND length(body) < 200;"
