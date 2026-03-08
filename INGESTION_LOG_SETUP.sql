-- Add logging for partial file ingestion tracking
-- Run this migration in Supabase SQL Editor

-- 1. ALTER dataset_catalog to track completion rates
ALTER TABLE public.dataset_catalog
ADD COLUMN IF NOT EXISTS completion_rate DECIMAL(5, 2) DEFAULT 100.0,
ADD COLUMN IF NOT EXISTS missing_rows INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS ingestion_source TEXT DEFAULT 'csv_upload',
ADD COLUMN IF NOT EXISTS error_details TEXT;

-- 2. CREATE ingestion_audit_log table for detailed tracking
CREATE TABLE IF NOT EXISTS public.ingestion_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- File metadata
  filename TEXT NOT NULL,
  dataset_name TEXT NOT NULL,
  file_size_mb DECIMAL(10, 2),

  -- Ingestion results
  total_rows INT NOT NULL,
  inserted_rows INT NOT NULL,
  completion_rate DECIMAL(5, 2) GENERATED ALWAYS AS (
    ROUND(100.0 * inserted_rows / total_rows, 2)
  ) STORED,
  missing_rows INT GENERATED ALWAYS AS (total_rows - inserted_rows) STORED,

  -- Error tracking
  status TEXT NOT NULL DEFAULT 'success',
  errors TEXT,
  failed_chunks INT DEFAULT 0,

  -- Timing
  started_at TIMESTAMP NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMP,
  duration_seconds INT GENERATED ALWAYS AS (
    EXTRACT(EPOCH FROM (completed_at - started_at))::INT
  ) STORED,

  -- Additional context
  chunk_size INT DEFAULT 1000,
  total_chunks INT GENERATED ALWAYS AS (
    CEIL(total_rows::DECIMAL / chunk_size)
  ) STORED,
  ingestion_method TEXT DEFAULT 'frontend_csv_upload',

  -- Audit
  user_ip_hash TEXT,
  notes TEXT,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index for querying audit logs
CREATE INDEX IF NOT EXISTS idx_ingestion_audit_dataset ON public.ingestion_audit_log(dataset_name, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ingestion_audit_status ON public.ingestion_audit_log(status);
CREATE INDEX IF NOT EXISTS idx_ingestion_audit_completion ON public.ingestion_audit_log(completion_rate);

-- 3. UPDATE dataset_catalog records with known completion rates
UPDATE public.dataset_catalog
SET completion_rate = 99.89,
    missing_rows = 200,
    ingestion_source = 'csv_upload',
    updated_at = NOW()
WHERE name = '311 Service Requests' AND record_count = 177609;

UPDATE public.dataset_catalog
SET completion_rate = 100.00,
    missing_rows = 0,
    ingestion_source = 'csv_upload',
    updated_at = NOW()
WHERE name = '911 Emergency Calls';

UPDATE public.dataset_catalog
SET completion_rate = 100.00,
    missing_rows = 0,
    ingestion_source = 'csv_upload',
    updated_at = NOW()
WHERE name = 'Business Licenses';

-- 4. INSERT initial audit log entry for 311 file
INSERT INTO public.ingestion_audit_log (
  filename,
  dataset_name,
  file_size_mb,
  total_rows,
  inserted_rows,
  status,
  failed_chunks,
  chunk_size,
  ingestion_method,
  errors,
  notes,
  started_at,
  completed_at
) VALUES (
  'Received_311_Service_Request_clean.csv',
  '311 Service Requests',
  37.1,
  177809,
  177609,
  'success_partial',
  1,
  1000,
  'frontend_csv_upload',
  'Chunk 277: Connection reset (network timeout)',
  'Accepted with >98% completion threshold. Missing rows from tail end of file due to Supabase connection timeout.',
  '2026-03-08 14:00:00',
  '2026-03-08 14:05:00'
);

-- 5. VIEW for easy ingestion tracking
CREATE OR REPLACE VIEW public.vw_ingestion_summary AS
SELECT
  dataset_name,
  COUNT(*) as total_attempts,
  COUNT(CASE WHEN status LIKE '%success%' THEN 1 END) as successful_ingestions,
  COUNT(CASE WHEN status = 'error' THEN 1 END) as failed_ingestions,
  ROUND(AVG(completion_rate), 2) as avg_completion_rate,
  MAX(completed_at) as most_recent_ingest,
  SUM(CASE WHEN completion_rate < 100 THEN 1 ELSE 0 END) as partial_ingestions,
  SUM(missing_rows) as total_missing_rows
FROM public.ingestion_audit_log
GROUP BY dataset_name
ORDER BY most_recent_ingest DESC;

-- 6. VIEW for data quality metrics
CREATE OR REPLACE VIEW public.vw_data_quality AS
SELECT
  'service_requests_311' as dataset,
  (SELECT COUNT(*) FROM public.service_requests_311) as total_records,
  (SELECT COUNT(*) FROM public.service_requests_311 WHERE case_id IS NOT NULL) as records_with_key,
  (SELECT COUNT(*) FROM public.service_requests_311 WHERE latitude IS NOT NULL AND longitude IS NOT NULL) as records_with_location,
  (SELECT COUNT(DISTINCT case_id) FROM public.service_requests_311) as unique_keys,
  ROUND(100.0 * (SELECT COUNT(*) FROM public.service_requests_311 WHERE latitude IS NOT NULL) /
        NULLIF((SELECT COUNT(*) FROM public.service_requests_311), 0), 2) as location_coverage_pct
UNION ALL
SELECT
  'business_licenses' as dataset,
  (SELECT COUNT(*) FROM public.business_licenses) as total_records,
  (SELECT COUNT(*) FROM public.business_licenses WHERE license_number IS NOT NULL) as records_with_key,
  (SELECT COUNT(*) FROM public.business_licenses WHERE latitude IS NOT NULL AND longitude IS NOT NULL) as records_with_location,
  (SELECT COUNT(DISTINCT license_number) FROM public.business_licenses) as unique_keys,
  ROUND(100.0 * (SELECT COUNT(*) FROM public.business_licenses WHERE latitude IS NOT NULL) /
        NULLIF((SELECT COUNT(*) FROM public.business_licenses), 0), 2) as location_coverage_pct;

-- NOTES:
-- 1. Run this migration in Supabase SQL Editor (SQL → New Query)
-- 2. The ingestion_audit_log will auto-populate with frontend logging
-- 3. Query vw_ingestion_summary to see all ingestion history
-- 4. Query vw_data_quality to see data quality metrics
