#!/bin/bash
export API_KEY="sk-81d0gUX6fsJWVaqm82VJM8qtzFlp0mrkreByEZIvs3OfpM3Q"
export API_BASE_URL="https://ttqq.inping.com/v1"
export NODE_OPTIONS="--max-old-space-size=512"
cd /home/life-kline-next

for ((i=1; i<=200; i++)); do
  R=$(sqlite3 data/lifekline.db "SELECT COUNT(*) FROM forum_answers WHERE is_official=1 AND body LIKE '%初步判断%';")
  [ "$R" -eq 0 ] && echo "[$(date +%H:%M:%S)] ALL ANSWERS DONE" && break
  echo -n "[$(date +%H:%M:%S)] batch $i rem=$R "
  node scripts/forum/upgrade-answers-v2.mjs 300 2>&1
  sleep 1
done
echo "FINAL: $(sqlite3 data/lifekline.db "SELECT COUNT(*) FROM forum_answers WHERE is_official=1 AND body LIKE '%初步判断%';") fake remaining"
