#!/bin/bash
# LLM forum upgrader — auto-selects next batch from DB, no offset needed
# Runs until all short template posts are upgraded or max batches reached.

export API_KEY="sk-81d0gUX6fsJWVaqm82VJM8qtzFlp0mrkreByEZIvs3OfpM3Q"
export API_BASE_URL="https://ttqq.inping.com/v1"
export NODE_OPTIONS="--max-old-space-size=512"
cd /home/life-kline-next

BATCH=100
MAX_BATCHES=200
CONCURRENCY=6

for i in $(seq 1 $MAX_BATCHES); do
  # Get remaining count
  R=$(sqlite3 data/lifekline.db "SELECT COUNT(*) FROM forum_questions WHERE status='visible' AND CAST(metadata AS TEXT) NOT LIKE '%llm%' AND length(body) < 200;")
  if [ "$R" -eq 0 ]; then
    echo "[$(date +%H:%M:%S)] ALL DONE! ($i batches)"
    break
  fi

  echo "[$(date +%H:%M:%S)] Batch $i/$MAX_BATCHES | remaining=$R | upgraded=$((9761-R))"

  # Run upgrade with offset=-1 to signal "auto-select"
  node scripts/forum/llm-upgrade.mjs $BATCH -1 2>&1 | \
    grep -E "Done:|Remaining:" | tail -2

  echo ""
  sleep 1
done

EC=$(sqlite3 data/lifekline.db "SELECT COUNT(*) FROM forum_questions WHERE status='visible' AND CAST(metadata AS TEXT) NOT LIKE '%llm%' AND length(body) < 200;")
UC=$(sqlite3 data/lifekline.db "SELECT COUNT(*) FROM forum_questions WHERE status='visible' AND CAST(metadata AS TEXT) LIKE '%llm%';")
echo "FINAL: $UC LLM posts, $EC short template remaining"
