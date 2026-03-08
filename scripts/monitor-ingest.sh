#!/bin/bash

# Monitor data ingestion progress
# Usage: ./scripts/monitor-ingest.sh [interval_seconds]

INTERVAL=${1:-5}
SUPABASE_URL="${SUPABASE_URL:?Error: SUPABASE_URL not set}"
SUPABASE_ANON_KEY="${SUPABASE_ANON_KEY:?Error: SUPABASE_ANON_KEY not set}"

API_URL="${SUPABASE_URL}/rest/v1"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "Starting ingest monitor (refresh every ${INTERVAL}s)..."
echo "Press Ctrl+C to stop"
echo ""

while true; do
  clear
  echo "========== DATA INGEST PROGRESS ========== $(date '+%H:%M:%S')"
  echo ""

  # Fetch all datasets
  RESPONSE=$(curl -s "${API_URL}/dataset_catalog" \
    -H "apikey: ${SUPABASE_ANON_KEY}" \
    -H "Content-Type: application/json")

  echo "$RESPONSE" | jq -r '.[] |
    "Dataset: \(.name)
    Status: \(.status)
    Records: \(.record_count // 0)
    Last Ingested: \(.last_ingested_at // "Never")
    ---"' 2>/dev/null || {
    echo "Error fetching data. Check your credentials."
    echo "Response: $RESPONSE"
  }

  echo ""
  echo "Sleeping ${INTERVAL}s... (Ctrl+C to stop)"
  sleep "$INTERVAL"
done
