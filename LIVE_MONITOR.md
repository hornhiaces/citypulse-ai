# Live Ingest Monitoring (Lovable Cloud + Supabase)

## Real-Time Status Check (Use This Now)

### Method 1: Supabase Dashboard (Easiest for Lovable)
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor** (left sidebar)
3. Paste this query and run:

```sql
-- Real-time ingest progress
SELECT
  name,
  status,
  record_count,
  last_ingested_at,
  updated_at
FROM public.dataset_catalog
ORDER BY updated_at DESC;
```

**Run this every 30 seconds to watch progress live.**

---

### Method 2: Direct API Check (Alternative)
In Supabase Dashboard → SQL Editor:

```sql
-- Quick status snapshot
SELECT
  'Service Requests (311)' as dataset,
  COUNT(*) as rows,
  COUNT(CASE WHEN case_id IS NULL THEN 1 END) as missing_ids,
  MAX(created_date) as most_recent
FROM public.service_requests_311

UNION ALL

SELECT
  'Emergency Calls (911)',
  COUNT(*),
  0,
  TO_DATE(CONCAT(MAX(year)::text, '-01-01'), 'YYYY-MM-DD')
FROM public.calls_911_monthly

UNION ALL

SELECT
  'Business Licenses',
  COUNT(*),
  COUNT(CASE WHEN license_number IS NULL THEN 1 END),
  MAX(issue_date)
FROM public.business_licenses;
```

---

## Monitor Errors in Real-Time

### Check Function Logs
1. Supabase Dashboard → **Edge Functions** (left sidebar)
2. Click on **ingest-dataset**
3. View the **Logs** tab (bottom right)
4. Look for red error messages

**Common errors to watch for:**
- `Rate limit exceeded` → Edge function needs redeployment
- `CORS error` → Origin not allowed
- `Cannot affect row a second time` → Dedup failed (shouldn't happen now)
- `Maximum 10000 records per request` → Chunk size issue

---

## Check Data Quality During Upload

Run these in SQL Editor to spot-check:

### 311 Data Quality (mid-upload)
```sql
SELECT
  COUNT(*) as total,
  COUNT(DISTINCT case_id) as unique_ids,
  COUNT(CASE WHEN latitude IS NOT NULL THEN 1 END) as with_location,
  COUNT(DISTINCT status) as status_types,
  MIN(created_date) as earliest,
  MAX(created_date) as latest
FROM public.service_requests_311;
```

### 911 Data Quality (mid-upload)
```sql
SELECT
  COUNT(*) as total_records,
  MIN(year) as earliest_year,
  MAX(year) as latest_year,
  COUNT(DISTINCT district) as districts,
  COUNT(DISTINCT call_type) as call_types,
  ROUND(AVG(call_count), 1) as avg_calls_per_record
FROM public.calls_911_monthly;
```

### Business Licenses Data Quality (mid-upload)
```sql
SELECT
  COUNT(*) as total,
  COUNT(DISTINCT license_number) as unique,
  COUNT(CASE WHEN latitude IS NOT NULL THEN 1 END) as with_location,
  COUNT(CASE WHEN status = 'active' THEN 1 END) as active,
  COUNT(DISTINCT business_type) as business_types
FROM public.business_licenses;
```

---

## If Something Goes Wrong

### Emergency Pause/Resume
1. **Stop the upload** in browser (close the page or click cancel)
2. **Check logs** in Edge Functions to see last error
3. **Report the error** to me with the error message
4. I'll fix the code and reupload

### Retry Failed Chunks
The frontend automatically retries failed chunks up to 3 times. If still failing:
1. Refresh the upload page
2. Re-select the same files
3. Click "Ingest" again (upserts handle duplicates)

### Expected Behavior (Normal)
- Status shows "uploading" while chunks process
- Progress bar fills to 100%
- Record count increases (0 → 279,022 for 311)
- Status changes to "complete" when done
- No error messages in red

---

## Success Criteria

### Expected Final Counts
- **311 Service Requests**: 279,022 rows
- **911 Emergency Calls**: 85 rows
- **Business Licenses**: 102,372 rows
- **Total**: 381,479 rows

### Data Freshness
- 311: Most recent records from ~2024-2025
- 911: Data from multiple years (2020+)
- Licenses: Active and expired licenses

### Data Integrity
- < 5% missing case_ids in 311
- < 10% missing license_numbers
- > 80% records with GPS coordinates

---

## Tell Me When

1. **Upload starts**: I'll begin monitoring
2. **Any errors appear**: I'll diagnose and fix
3. **Upload completes**: I'll run full QA and generate report

Ready to go! ✓
