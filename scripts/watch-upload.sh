#!/bin/bash
# Real-time upload progress monitor
# Usage: SUPABASE_URL=... SUPABASE_ANON_KEY=... ./scripts/watch-upload.sh

set -e

SUPABASE_URL="${SUPABASE_URL:?Error: SUPABASE_URL not set}"
SUPABASE_ANON_KEY="${SUPABASE_ANON_KEY:?Error: SUPABASE_ANON_KEY not set}"
API_URL="${SUPABASE_URL}/rest/v1/dataset_catalog"

INTERVAL=10
LAST_COUNTS="0:0:0"

echo "🎬 STARTING LIVE UPLOAD MONITOR"
echo "Refreshing every ${INTERVAL}s... Press Ctrl+C to stop"
echo ""

fetch_status() {
  curl -s "${API_URL}" \
    -H "apikey: ${SUPABASE_ANON_KEY}" \
    -H "Content-Type: application/json" 2>/dev/null || echo "[]"
}

format_number() {
  echo "$1" | sed ':a;s/\B[0-9]\{3\}\>/,&/g;ta'
}

while true; do
  clear
  TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
  echo "📡 LIVE INGEST MONITOR - $TIMESTAMP"
  echo "════════════════════════════════════════════════════════"
  echo ""

  DATA=$(fetch_status)

  # Parse each dataset
  C311=$(echo "$DATA" | jq -r '.[] | select(.name == "311 Service Requests") | .record_count // 0' 2>/dev/null || echo "0")
  C911=$(echo "$DATA" | jq -r '.[] | select(.name == "911 Emergency Calls") | .record_count // 0' 2>/dev/null || echo "0")
  BLIC=$(echo "$DATA" | jq -r '.[] | select(.name == "Business Licenses") | .record_count // 0' 2>/dev/null || echo "0")

  S311=$(echo "$DATA" | jq -r '.[] | select(.name == "311 Service Requests") | .status // "pending"' 2>/dev/null || echo "pending")
  S911=$(echo "$DATA" | jq -r '.[] | select(.name == "911 Emergency Calls") | .status // "pending"' 2>/dev/null || echo "pending")
  SBLIC=$(echo "$DATA" | jq -r '.[] | select(.name == "Business Licenses") | .status // "pending"' 2>/dev/null || echo "pending")

  # Status icons
  icon_311="⏳"
  [ "$S311" = "complete" ] && icon_311="✅"
  [ "$S311" = "error" ] && icon_311="❌"

  icon_911="⏳"
  [ "$S911" = "complete" ] && icon_911="✅"
  [ "$S911" = "error" ] && icon_911="❌"

  icon_blic="⏳"
  [ "$SBLIC" = "complete" ] && icon_blic="✅"
  [ "$SBLIC" = "error" ] && icon_blic="❌"

  # Display results
  echo "311 Service Requests"
  echo "  Status: $icon_311 $S311"
  echo "  Records: $(format_number $C311) / 279,022"
  PCT=$((C311 * 100 / 279022))
  printf "  Progress: ["
  for ((i=0; i<PCT; i+=5)); do printf "█"; done
  printf "%0.s " $(seq 1 $((20 - PCT/5)))
  echo "] $PCT%"
  echo ""

  echo "911 Emergency Calls"
  echo "  Status: $icon_911 $S911"
  echo "  Records: $(format_number $C911) / 85"
  PCT=$((C911 * 100 / 85))
  [ $PCT -gt 100 ] && PCT=100
  printf "  Progress: ["
  for ((i=0; i<PCT; i+=5)); do printf "█"; done
  printf "%0.s " $(seq 1 $((20 - PCT/5)))
  echo "] $PCT%"
  echo ""

  echo "Business Licenses"
  echo "  Status: $icon_blic $SBLIC"
  echo "  Records: $(format_number $BLIC) / 102,372"
  PCT=$((BLIC * 100 / 102372))
  printf "  Progress: ["
  for ((i=0; i<PCT; i+=5)); do printf "█"; done
  printf "%0.s " $(seq 1 $((20 - PCT/5)))
  echo "] $PCT%"
  echo ""

  TOTAL=$((C311 + C911 + BLIC))
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "📊 TOTAL: $(format_number $TOTAL) / 381,479 rows"
  echo "⏱️  Next refresh in ${INTERVAL}s..."

  sleep "$INTERVAL"
done
