#!/bin/bash
export API_KEY="sk-81d0gUX6fsJWVaqm82VJM8qtzFlp0mrkreByEZIvs3OfpM3Q"
export API_BASE_URL="https://ttqq.inping.com/v1"
export NODE_OPTIONS="--max-old-space-size=512"
cd /home/life-kline-next

BATCH=100
TOTAL_BATCHES=150

for i in $(seq 1 $TOTAL_BATCHES); do
  R=$(sqlite3 data/lifekline.db "SELECT COUNT(*) FROM forum_questions WHERE status='visible' AND CAST(metadata AS TEXT) NOT LIKE '%llm%' AND length(body) < 200;")
  if [ "$R" -eq 0 ]; then
    echo "[$(date +%H:%M:%S)] ALL DONE!"
    break
  fi
  echo "[$(date +%H:%M:%S)] Batch $i/$TOTAL_BATCHES (remaining: $R)"
  node scripts/forum/llm-upgrade.mjs $BATCH 0 2>&1 | grep -E "Done:|Remaining:" | tail -2
  echo ""
  sleep 2
done

UC=$(sqlite3 data/lifekline.db "SELECT COUNT(*) FROM forum_questions WHERE status='visible' AND CAST(metadata AS TEXT) LIKE '%llm%';")
echo "FINAL: $UC LLM posts"
