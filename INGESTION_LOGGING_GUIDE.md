# Ingestion Logging Setup Guide

## Overview

The system now tracks all data ingestion events in the database for audit, quality control, and optimization. This guide walks through setting up the logging infrastructure.

## What Gets Logged

Every file ingestion attempt records:
- File metadata (name, size, dataset type)
- Results (total rows, inserted rows, completion rate)
- Errors (error messages, failed chunk count)
- Timing (start, end, duration)
- Status (success, success_partial, error)

## Setup Steps

### Step 1: Create Database Tables

1. Open **Supabase Dashboard** → **SQL Editor**
2. Click **New Query**
3. Copy-paste the entire contents of `/INGESTION_LOG_SETUP.sql`
4. Click **Run**

This creates:
- ✅ Extended `dataset_catalog` columns
- ✅ New `ingestion_audit_log` table
- ✅ Indexes for performance
- ✅ Audit views for analysis

### Step 2: Verify Installation

Run this query to check if tables exist:

```sql
-- Check tables
SELECT tablename FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('ingestion_audit_log', 'dataset_catalog')
ORDER BY tablename;

-- Should return: ingestion_audit_log, dataset_catalog
```

### Step 3: Test Logging

The frontend is already configured to log ingestion events. When you upload a file:
1. Upload happens as normal
2. After completion, an entry is inserted into `ingestion_audit_log`
3. You can query results immediately

To see logs:

```sql
SELECT * FROM public.ingestion_audit_log
ORDER BY created_at DESC
LIMIT 10;
```

## Query Ingestion History

### All Ingestion Attempts
```sql
SELECT
  filename,
  dataset_name,
  total_rows,
  inserted_rows,
  completion_rate,
  status,
  DATE(completed_at) as date,
  EXTRACT(EPOCH FROM (completed_at - started_at))::INT as duration_seconds
FROM public.ingestion_audit_log
ORDER BY completed_at DESC;
```

### Partial Ingestions Summary
```sql
SELECT
  dataset_name,
  COUNT(*) as attempts,
  COUNT(CASE WHEN completion_rate >= 98 THEN 1 END) as successful_partials,
  ROUND(AVG(completion_rate), 2) as avg_completion_rate,
  SUM(missing_rows) as total_rows_missing
FROM public.ingestion_audit_log
WHERE completion_rate < 100
GROUP BY dataset_name;
```

### Data Quality Over Time
```sql
SELECT
  dataset_name,
  DATE(completed_at) as ingest_date,
  MAX(completion_rate) as best_completion,
  MIN(completion_rate) as worst_completion,
  COUNT(*) as attempts
FROM public.ingestion_audit_log
GROUP BY dataset_name, DATE(completed_at)
ORDER BY ingest_date DESC, dataset_name;
```

### Error Analysis
```sql
SELECT
  dataset_name,
  errors,
  COUNT(*) as occurrences,
  MAX(completed_at) as last_occurred
FROM public.ingestion_audit_log
WHERE status = 'error' OR (status = 'success_partial' AND errors IS NOT NULL)
GROUP BY dataset_name, errors
ORDER BY occurrences DESC;
```

## RLS Policy (Enable Row-Level Security)

To restrict ingestion logs visibility (optional but recommended):

```sql
-- Enable RLS on ingestion_audit_log
ALTER TABLE public.ingestion_audit_log ENABLE ROW LEVEL SECURITY;

-- Allow reads to authenticated users (optional)
CREATE POLICY "Allow authenticated users to read logs"
  ON public.ingestion_audit_log
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow writes from your edge function (if you set it up to write directly)
CREATE POLICY "Allow edge function to write logs"
  ON public.ingestion_audit_log
  FOR INSERT
  TO service_role
  WITH CHECK (true);
```

## Console Logging Reference

In addition to database logging, the frontend also logs to browser console:

### Partial Completion Warning
```javascript
// Logged when file completes with <100% rows
console.warn('[Ingest] File accepted with partial completion: filename.csv', {
  completionRate: "99.89",
  insertedRows: 177609,
  totalRows: 177809,
  missingRows: 200,
  datasetType: "311"
})
```

### Success Toast
Shows user-friendly message:
```
✓ Finished processing 1 file(s) (1 with >98% completion) - Refreshing dashboard...
```

### UI Indicators
- Yellow warning box on completion card
- Status changed to "Complete (Partial)"
- Row count shows percentage: "177,609 / 177,809 rows (99.9%)"

## Dashboard Views

Three pre-built views available:

### 1. `vw_ingestion_summary`
Shows per-dataset statistics

```sql
SELECT * FROM public.vw_ingestion_summary;
```

**Output:**
| dataset_name | total_attempts | successful | failed | avg_completion | most_recent | partial_count |
|---|---|---|---|---|---|---|
| 311 Service Requests | 3 | 2 | 1 | 99.89 | 2026-03-08 | 1 |
| Business Licenses | 1 | 1 | 0 | 100.00 | 2026-03-08 | 0 |

### 2. `vw_data_quality`
Shows data integrity metrics

```sql
SELECT * FROM public.vw_data_quality;
```

**Output:**
| dataset | total_records | records_with_key | location_coverage | unique_keys |
|---|---|---|---|---|
| service_requests_311 | 177609 | 177609 | 98.5% | 177609 |
| business_licenses | 66139 | 66139 | 99.2% | 66139 |

## Monitoring Script

A SQL script is available for comprehensive data quality checks:

```bash
# Run all quality checks
psql -U postgres -d citypulse -f scripts/monitor-partial-ingest.sql
```

This covers:
1. Expected vs actual row counts
2. Data freshness (date ranges)
3. Missing values in critical fields
4. Duplicate detection
5. Geographic coverage (GPS coordinates)
6. Ingestion audit log status

## Troubleshooting

### Logs Not Appearing?
1. Check browser DevTools → Console for warnings
2. Verify `ingestion_audit_log` table exists
3. Check Supabase RLS policies allow inserts
4. Look for errors in Network tab of DevTools

### Slow Queries?
- Use the created indexes: `idx_ingestion_audit_dataset`, `idx_ingestion_audit_status`
- Indexes are automatically created by migration

### Want to Clear Logs?
```sql
-- ⚠️ WARNING: This deletes all history
DELETE FROM public.ingestion_audit_log
WHERE created_at < NOW() - INTERVAL '30 days';  -- Keep last 30 days
```

## API Reference

### Insert Ingestion Log (called by frontend)

```typescript
await supabase.from('ingestion_audit_log').insert({
  filename: string,           // "data.csv"
  dataset_name: string,       // "311 Service Requests"
  file_size_mb: number,       // 37.1
  total_rows: number,         // 177809
  inserted_rows: number,      // 177609
  status: string,             // "success" | "success_partial" | "error"
  errors?: string,            // error messages joined by ";"
  failed_chunks?: number,     // count of failed chunks
  chunk_size?: number,        // 1000
  ingestion_method?: string,  // "frontend_csv_upload"
  notes?: string,             // "Additional context"
  completed_at?: timestamp,   // timestamp of completion
})
```

## Next Steps

1. ✅ Run `INGESTION_LOG_SETUP.sql` migration
2. ✅ Upload a file to test logging
3. ✅ Query `ingestion_audit_log` to verify data
4. ✅ Set up RLS policies if needed
5. 📊 Monitor using provided views and scripts

## Related Files
- `/INGESTION_LOG_SETUP.sql` - Database migration
- `/scripts/monitor-partial-ingest.sql` - Quality checks
- `src/pages/DataUploadPage.tsx` - Frontend logging code
- `/DATABASE_SCHEMA.md` - Full schema reference
