#!/bin/bash
# Single clean forum upgrader launcher — no nesting
export API_KEY="sk-81d0gUX6fsJWVaqm82VJM8qtzFlp0mrkreByEZIvs3OfpM3Q"
export API_BASE_URL="https://ttqq.inping.com/v1"
export NODE_OPTIONS="--max-old-space-size=512"

cd /home/life-kline-next
OFFSET=0
BATCH=100

# Determine starting offset from remaining template posts
REMAINING=$(sqlite3 data/lifekline.db "SELECT COUNT(*) FROM forum_questions WHERE status='visible' AND CAST(metadata AS TEXT) NOT LIKE '%llm%' AND length(body) < 200;")
echo "Remaining: $REMAINING template posts to upgrade"

for i in $(seq 1 200); do
  # Recalculate remaining to skip if done
  R=$(sqlite3 data/lifekline.db "SELECT COUNT(*) FROM forum_questions WHERE status='visible' AND CAST(metadata AS TEXT) NOT LIKE '%llm%' AND length(body) < 200;")
  if [ "$R" -eq 0 ]; then
    echo "[$(date +%H:%M:%S)] ALL DONE!"
    break
  fi
  echo "[$(date +%H:%M:%S)] Batch $i (remaining: $R)"
  node scripts/forum/llm-upgrade.mjs $BATCH $OFFSET 2>&1 | grep -E "Done|Remaining|✓|✗|~" | tail -5
  echo ""
  sleep 2
done

EC=$(sqlite3 data/lifekline.db "SELECT COUNT(*) FROM forum_questions WHERE status='visible' AND CAST(metadata AS TEXT) NOT LIKE '%llm%' AND length(body) < 200;")
UC=$(sqlite3 data/lifekline.db "SELECT COUNT(*) FROM forum_questions WHERE status='visible' AND CAST(metadata AS TEXT) LIKE '%llm%';")
echo "FINAL: $UC upgraded, $EC template remaining"
