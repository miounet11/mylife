#!/bin/bash
# Forum LLM batch upgrader - run via nohup for background execution
set -e

export API_KEY="sk-81d0gUX6fsJWVaqm82VJM8qtzFlp0mrkreByEZIvs3OfpM3Q"
export API_BASE_URL="https://ttqq.inping.com/v1"
export NODE_OPTIONS="--max-old-space-size=512"

cd /home/life-kline-next
OFFSET=300
BATCH=100
TOTAL_BATCHES=20

for i in $(seq 1 $TOTAL_BATCHES); do
  echo "=== [$(date +%H:%M:%S)] Batch $i/$TOTAL_BATCHES (offset $OFFSET) ==="
  node scripts/forum/llm-upgrade.mjs $BATCH $OFFSET 2>&1 | grep -E "Done|Remaining|✓|✗|~" | tail -5
  OFFSET=$((OFFSET + BATCH))
  echo ""
  sleep 3
done

echo "=== COMPLETE ==="
sqlite3 data/lifekline.db "SELECT COUNT(*) || ' total, ' || (SELECT COUNT(*) FROM forum_questions WHERE status='visible' AND CAST(metadata AS TEXT) LIKE '%llm%') || ' upgraded' FROM forum_questions WHERE status='visible';"
