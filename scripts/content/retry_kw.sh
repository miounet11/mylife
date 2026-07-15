#!/bin/bash
export API_KEY="sk-81d0gUX6fsJWVaqm82VJM8qtzFlp0mrkreByEZIvs3OfpM3Q"
export API_BASE_URL="https://ttqq.inping.com/v1"
export FORUM_LLM_CONCURRENCY=5
cd /home/life-kline-next

for kw in "八字格局" "日主旺衰" "紫微夫妻宫" "六爻官鬼" "面相算命" "手相算命" "婚姻线" "改运方法"; do
  echo "[$(date +%H:%M:%S)] retry: $kw"
  npx tsx scripts/content/llm-keyword-knowledge.ts "$kw" 2>&1 | grep -E "ok=|fail="
done
echo "DONE"
