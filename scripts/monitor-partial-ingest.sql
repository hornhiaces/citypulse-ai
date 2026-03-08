-- Data Quality Monitoring for Partial Ingestion
-- Run this after accepting files with <100% completion rate
-- Identifies gaps and data integrity issues from incomplete uploads

-- 1. SUMMARY: Compare expected vs actual row counts
SELECT
  'Summary' as check_type,
  table_name,
  expected_rows,
  actual_rows,
  expected_rows - actual_rows as missing_rows,
  ROUND(100.0 * actual_rows / expected_rows, 2) as completion_pct
FROM (
  VALUES
    ('service_requests_311', 177809),
    ('calls_911_monthly', 85),
    ('business_licenses', 102372)
) as expected(table_name, expected_rows)
CROSS JOIN LATERAL (
  SELECT
    table_name,
    CASE
      WHEN table_name = 'service_requests_311' THEN (SELECT COUNT(*) FROM public.service_requests_311)
      WHEN table_name = 'calls_911_monthly' THEN (SELECT COUNT(*) FROM public.calls_911_monthly)
      WHEN table_name = 'business_licenses' THEN (SELECT COUNT(*) FROM public.business_licenses)
    END as actual_rows
) counts
ORDER BY completion_pct DESC;

-- 2. DATA FRESHNESS: Most recent records by dataset
SELECT
  'Data Freshness' as check_type,
  '311 Service Requests' as dataset,
  MAX(created_at) as most_recent,
  MIN(created_at) as oldest,
  COUNT(*) as total_records
FROM public.service_requests_311
UNION ALL
SELECT
  'Data Freshness' as check_type,
  '911 Emergency Calls' as dataset,
  MAX(created_at) as most_recent,
  MIN(created_at) as oldest,
  COUNT(*) as total_records
FROM public.calls_911_monthly
UNION ALL
SELECT
  'Data Freshness' as check_type,
  'Business Licenses' as dataset,
  MAX(created_at) as most_recent,
  MIN(created_at) as oldest,
  COUNT(*) as total_records
FROM public.business_licenses;

-- 3. MISSING DATA: Check for NULL values in critical fields
SELECT
  'Missing Data' as check_type,
  '311 Service Requests' as dataset,
  'case_id' as field,
  COUNT(*) as null_count,
  ROUND(100.0 * COUNT(*) / (SELECT COUNT(*) FROM public.service_requests_311), 2) as pct_missing
FROM public.service_requests_311
WHERE case_id IS NULL
UNION ALL
SELECT
  'Missing Data' as check_type,
  '311 Service Requests' as dataset,
  'location' as field,
  COUNT(*) as null_count,
  ROUND(100.0 * COUNT(*) / (SELECT COUNT(*) FROM public.service_requests_311), 2) as pct_missing
FROM public.service_requests_311
WHERE location IS NULL
UNION ALL
SELECT
  'Missing Data' as check_type,
  'Business Licenses' as dataset,
  'business_name' as field,
  COUNT(*) as null_count,
  ROUND(100.0 * COUNT(*) / (SELECT COUNT(*) FROM public.business_licenses), 2) as pct_missing
FROM public.business_licenses
WHERE business_name IS NULL
UNION ALL
SELECT
  'Missing Data' as check_type,
  'Business Licenses' as dataset,
  'license_number' as field,
  COUNT(*) as null_count,
  ROUND(100.0 * COUNT(*) / (SELECT COUNT(*) FROM public.business_licenses), 2) as pct_missing
FROM public.business_licenses
WHERE license_number IS NULL;

-- 4. DUPLICATES: Check for records that may have been partially lost
SELECT
  'Duplicates' as check_type,
  '311 Service Requests' as dataset,
  COUNT(*) as duplicate_count,
  COUNT(DISTINCT case_id) as unique_count,
  COUNT(*) - COUNT(DISTINCT case_id) as excess_records
FROM public.service_requests_311
UNION ALL
SELECT
  'Duplicates' as check_type,
  'Business Licenses' as dataset,
  COUNT(*) as duplicate_count,
  COUNT(DISTINCT license_number) as unique_count,
  COUNT(*) - COUNT(DISTINCT license_number) as excess_records
FROM public.business_licenses;

-- 5. GEOGRAPHIC COVERAGE: Check for location data completeness
SELECT
  'Geographic Coverage' as check_type,
  '311 Service Requests' as dataset,
  COUNT(CASE WHEN latitude IS NOT NULL AND longitude IS NOT NULL THEN 1 END) as gps_records,
  COUNT(*) as total_records,
  ROUND(100.0 * COUNT(CASE WHEN latitude IS NOT NULL AND longitude IS NOT NULL THEN 1 END) / COUNT(*), 2) as gps_coverage_pct
FROM public.service_requests_311
UNION ALL
SELECT
  'Geographic Coverage' as check_type,
  'Business Licenses' as dataset,
  COUNT(CASE WHEN latitude IS NOT NULL AND longitude IS NOT NULL THEN 1 END) as gps_records,
  COUNT(*) as total_records,
  ROUND(100.0 * COUNT(CASE WHEN latitude IS NOT NULL AND longitude IS NOT NULL THEN 1 END) / COUNT(*), 2) as gps_coverage_pct
FROM public.business_licenses;

-- 6. INGESTION AUDIT LOG: Check dataset_catalog for tracking
SELECT
  'Ingestion Audit' as check_type,
  name as dataset,
  status,
  record_count,
  last_ingested_at,
  updated_at,
  created_at
FROM public.dataset_catalog
ORDER BY updated_at DESC;
