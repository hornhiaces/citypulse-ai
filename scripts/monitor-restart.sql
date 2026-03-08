-- Quick Monitoring Queries for Upload Restart
-- Copy and paste each query into Supabase SQL Editor
-- Run every 30 seconds during upload

-- ============================================
-- QUERY 1: Main Status Check (RUN THIS FIRST)
-- ============================================
SELECT
  name,
  status,
  record_count,
  TO_CHAR(last_ingested_at, 'HH:MM:SS') as last_ingested_time,
  TO_CHAR(updated_at, 'HH:MM:SS') as updated_time
FROM public.dataset_catalog
WHERE name IN ('311 Service Requests', '911 Emergency Calls', 'Business Licenses')
ORDER BY name;

-- Expected before restart:
-- 311: complete, 22
-- 911: complete, 85
-- Licenses: error, 0

-- Expected after restart:
-- 311: complete, 279,022
-- 911: complete, 85
-- Licenses: complete, 102,372

-- ============================================
-- QUERY 2: 311 Progress Detail
-- ============================================
SELECT
  COUNT(*) as total_rows,
  COUNT(DISTINCT case_id) as unique_cases,
  COUNT(CASE WHEN case_id IS NULL THEN 1 END) as null_ids,
  COUNT(CASE WHEN latitude IS NOT NULL THEN 1 END) as with_location,
  COUNT(DISTINCT status) as status_types
FROM public.service_requests_311;

-- ============================================
-- QUERY 3: 911 Progress Detail
-- ============================================
SELECT
  COUNT(*) as total_records,
  MIN(year) as earliest_year,
  MAX(year) as latest_year,
  COUNT(DISTINCT district) as districts,
  ROUND(AVG(call_count), 0)::INT as avg_calls
FROM public.calls_911_monthly;

-- ============================================
-- QUERY 4: Business Licenses Progress Detail
-- ============================================
SELECT
  COUNT(*) as total_rows,
  COUNT(DISTINCT license_number) as unique_licenses,
  COUNT(CASE WHEN license_number IS NULL THEN 1 END) as null_license_numbers,
  COUNT(CASE WHEN latitude IS NOT NULL THEN 1 END) as with_location,
  COUNT(CASE WHEN status = 'active' THEN 1 END) as active_count
FROM public.business_licenses;

-- ============================================
-- QUERY 5: Error Check (Run if something goes wrong)
-- ============================================
SELECT
  name,
  status,
  TO_CHAR(last_ingested_at, 'YYYY-MM-DD HH:MM:SS') as last_attempt,
  EXTRACT(EPOCH FROM (NOW() - last_ingested_at))::INT as seconds_ago
FROM public.dataset_catalog
WHERE status = 'error'
ORDER BY last_ingested_at DESC;

-- ============================================
-- QUERY 6: Grand Total (After all uploads done)
-- ============================================
SELECT
  'Datasets Loaded' as metric,
  (SELECT COUNT(*) FROM public.service_requests_311)::TEXT || ' / 279,022' as "311 Service Requests",
  (SELECT COUNT(*) FROM public.calls_911_monthly)::TEXT || ' / 85' as "911 Emergency Calls",
  (SELECT COUNT(*) FROM public.business_licenses)::TEXT || ' / 102,372' as "Business Licenses";
