#!/bin/bash
# Quick status check - run this during upload monitoring

SUPABASE_URL="${SUPABASE_URL:?Error: SUPABASE_URL not set}"
SUPABASE_ANON_KEY="${SUPABASE_ANON_KEY:?Error: SUPABASE_ANON_KEY not set}"

API_URL="${SUPABASE_URL}/rest/v1"

echo "📊 LIVE INGEST STATUS ($(date '+%H:%M:%S'))"
echo "═══════════════════════════════════════════"

curl -s "${API_URL}/dataset_catalog" \
  -H "apikey: ${SUPABASE_ANON_KEY}" \
  -H "Content-Type: application/json" | jq -r '.[] |
    select(.name | IN("311 Service Requests", "911 Emergency Calls", "Business Licenses")) |
    "\(.name)\n  Status: \(.status)\n  Records: \(.record_count)\n  Updated: \(.updated_at | split("T")[1] | split(".")[0])\n"' 2>/dev/null || echo "⚠️  Unable to fetch status"

echo "═══════════════════════════════════════════"
echo "Re-run this command to refresh"
