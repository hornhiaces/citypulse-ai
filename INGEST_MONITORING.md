# Data Ingest Monitoring Guide

## Bugs Fixed (March 8, 2026)

### Critical Fixes
1. **Rate Limit Too Low** (100 → 1000 req/hr)
   - 311 file alone needs 559 requests at 500/chunk
   - Would have blocked ~18% through upload

2. **CORS Origin Mismatch**
   - Fixed: `https://lovable.dev` won't match `*.lovable.app` subdomains
   - Added: Regex patterns for `*.lovable.app` and `*.lovable.dev`

3. **Null-Key Deduplication**
   - Was collapsing records with NULL keys to 1 row (data loss)
   - Fixed: Skip nulls in dedup (PostgreSQL treats NULL != NULL)

4. **Missing Record Count Tracking**
   - `dataset_catalog.record_count` was never updated
   - Fixed: Now counts rows after each ingest batch

### Performance Improvements
- Chunk size: 500 → 1000 rows (halves request count)
- Expected requests:
  - 311: 279,022 rows → ~280 requests (was 559)
  - 911: 85 rows → 1 request
  - Business Licenses: 102,372 rows → ~103 requests (was 205)
  - **Total: ~384 requests (was 764)** ✓

## Monitor Upload Progress

### Real-time Monitoring (Bash)
```bash
export SUPABASE_URL="your_url"
export SUPABASE_ANON_KEY="your_key"

./scripts/monitor-ingest.sh 5  # Refresh every 5 seconds
```

### Manual Check (SQL)
```sql
SELECT name, status, record_count, last_ingested_at
FROM public.dataset_catalog
ORDER BY updated_at DESC;
```

### Watch Frontend Console
- Open Data Upload page in browser DevTools (Console tab)
- Monitor chunk progress: "Processing... [chunk X of Y]"
- Watch for error toasts in red

## After Upload Completes

### Run Data Quality Check
```bash
# Using psql
psql -U postgres -d citypulse \
  -f scripts/check-data-quality.sql

# Or through Supabase dashboard
# Copy-paste contents of scripts/check-data-quality.sql
```

### Key Metrics to Review
- **Total Records**: Expected counts
  - 311: 279,022 rows
  - 911: 85 rows
  - Business Licenses: 102,372 rows

- **Data Completeness**
  - Missing case_ids, business_names, etc.
  - % records with GPS coordinates

- **Uniqueness**
  - Duplicates after upsert (should be 0)
  - Composite key collisions

- **Data Freshness**
  - Most recent records
  - Year/month coverage

## If Upload Fails Mid-Way

### Expected Behavior
- Frontend shows error on failing chunk
- Error message displayed in red box
- Other chunks may have already inserted successfully
- No partial row inserts (atomic per chunk)

### Retry Steps
1. Check error message from frontend
2. Check Supabase function logs (Supabase dashboard → Functions)
3. Fix data or code if needed
4. Re-upload the affected file (upsert handles duplicates)

### Common Issues & Solutions

| Error | Cause | Fix |
|-------|-------|-----|
| "Rate limit exceeded" | Still hitting 100/hr limit | Verify edge function redeployed with new 1000/hr limit |
| "CORS error" | Origin not in allowlist | Check ALLOWED_ORIGINS and ALLOWED_ORIGIN_PATTERNS |
| "Cannot affect row a second time" | Duplicate key in chunk | Check dedup logic (should be fixed now) |
| "Cannot parse JSON" | Malformed CSV record | Check CSV format, try with simpler test file first |

## Expected Performance

### Upload Timeline (Rough Estimates)
- 311 (279K rows): 2-4 minutes at 1000/hr + DB writes
- 911 (85 rows): < 30 seconds
- Business Licenses (102K rows): 1-2 minutes
- **Total: 4-7 minutes** for all datasets

### Bottlenecks
1. **Network latency** (Supabase → Client)
2. **CSV parsing** (Papa Parse on frontend, CPU-bound)
3. **Database upserts** (Supabase PostgreSQL writes)

## Improvements for Next Iteration

See `DATA_INGEST_REPORT.md` for detailed suggestions once upload completes.
