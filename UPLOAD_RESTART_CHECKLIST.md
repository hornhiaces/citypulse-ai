# Upload Restart Monitoring Checklist

**Date:** March 8, 2026
**Status:** Ready for Business Licenses retry + 311 re-upload

---

## Pre-Upload Checks (Do These First)

- [ ] Edge function redeployed with NaN fix ✅
- [ ] All files ready (311, 911, Business Licenses CSVs)
- [ ] This monitoring guide open in browser

---

## RESTART PROCEDURE

### Step 1: Go to Data Upload Page
- Open Lovable app → Data Ingestion page
- You should see 3 CSVs ready (311, 911, Business Licenses)

### Step 2: Check Initial Status (Run this SQL first)
```sql
SELECT name, status, record_count, last_ingested_at
FROM public.dataset_catalog
WHERE name IN ('311 Service Requests', '911 Emergency Calls', 'Business Licenses')
ORDER BY name;
```

**Expected BEFORE upload:**
- 311: `complete`, 22 rows (from partial upload)
- 911: `complete`, 85 rows ✅
- Business Licenses: `error`, 0 rows ← Will be fixed

### Step 3: Start Upload
Click **"Ingest 3 Files"** button

---

## LIVE MONITORING (During Upload)

### Every 30 seconds, run this:
```sql
SELECT name, status, record_count, last_ingested_at,
       TO_CHAR(updated_at, 'HH:MM:SS') as updated
FROM public.dataset_catalog
ORDER BY updated_at DESC;
```

### Watch For:

✅ **GOOD Signs:**
- Status changing `error` → `complete`
- `record_count` increasing (0 → 102,372 for Business Licenses)
- `updated_at` timestamps updating
- Progress bar in UI moving

🔴 **RED Flags (Tell me immediately):**
- Any status = `error` again
- Record count stuck at 0
- UI shows red error boxes
- Updated timestamps stopped changing

---

## EXPECTED TIMELINE

| Dataset | Current | Expected Final | Time |
|---------|---------|---|------|
| 311 | 22 rows | 279,022 rows | 2-4 min |
| 911 | 85 rows | 85 rows ✅ | Already done |
| Licenses | 0 rows (error) | 102,372 rows | 2-3 min |
| **TOTAL** | **107 rows** | **381,479 rows** | 4-7 min |

---

## If Upload Gets Stuck

**Check for:**
1. Slow progress for 5+ minutes → Might be network
2. Error message in browser console (F12) → Report to me
3. Supabase logs show new 500 errors → Different bug

**What to do:**
- Don't panic, just wait a bit longer
- If truly stuck, stop the upload and tell me the error
- We can retry (upserts handle duplicates)

---

## Success Criteria

When upload finishes:
- [ ] 311 Service Requests: **279,022** rows, status: **complete**
- [ ] 911 Emergency Calls: **85** rows, status: **complete**
- [ ] Business Licenses: **102,372** rows, status: **complete**
- [ ] No error boxes in the UI
- [ ] No red errors in browser console

---

## After Upload Completes

1. Take a screenshot of the final status query
2. Tell me "Upload finished"
3. I'll run comprehensive data quality checks
4. We'll generate the final report with performance analysis

---

## Reference Queries

### Check for any new errors:
```sql
SELECT name, status, last_ingested_at,
       EXTRACT(EPOCH FROM (NOW() - last_ingested_at)) as seconds_ago
FROM public.dataset_catalog
WHERE status = 'error'
ORDER BY last_ingested_at DESC;
```

### Watch 311 progress:
```sql
SELECT COUNT(*) as total_rows,
       COUNT(DISTINCT case_id) as unique_ids,
       COUNT(CASE WHEN latitude IS NOT NULL THEN 1 END) as with_coords
FROM public.service_requests_311;
```

### Watch Business Licenses progress:
```sql
SELECT COUNT(*) as total_rows,
       COUNT(CASE WHEN latitude IS NOT NULL THEN 1 END) as with_coords,
       COUNT(CASE WHEN license_number IS NULL THEN 1 END) as missing_numbers
FROM public.business_licenses;
```

---

**🚀 Ready to go! Let me know when you start the upload.**
