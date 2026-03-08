-- Comprehensive Ingest Report Generator
-- Run this in Supabase SQL Editor after upload completes

\echo '========================================='
\echo 'DATA INGEST COMPLETION REPORT'
\echo '========================================='
\echo ''

-- Dataset Summary
\echo '--- DATASET CATALOG STATUS ---'
SELECT
  name,
  status,
  record_count,
  TO_CHAR(last_ingested_at, 'YYYY-MM-DD HH:MM:SS') as last_ingested,
  TO_CHAR(updated_at, 'YYYY-MM-DD HH:MM:SS') as catalog_updated
FROM public.dataset_catalog
WHERE name IN ('311 Service Requests', '911 Emergency Calls', 'Business Licenses')
ORDER BY name;

\echo ''
\echo '--- 311 SERVICE REQUESTS METRICS ---'
SELECT
  'Total Records' as metric,
  COUNT(*)::TEXT as value
FROM public.service_requests_311

UNION ALL

SELECT
  'Unique Case IDs',
  COUNT(DISTINCT case_id)::TEXT
FROM public.service_requests_311

UNION ALL

SELECT
  'Missing Case IDs',
  COUNT(CASE WHEN case_id IS NULL THEN 1 END)::TEXT
FROM public.service_requests_311

UNION ALL

SELECT
  'Missing Category',
  COUNT(CASE WHEN category IS NULL THEN 1 END)::TEXT
FROM public.service_requests_311

UNION ALL

SELECT
  'Records with Coordinates',
  ROUND(100.0 * COUNT(CASE WHEN latitude IS NOT NULL AND longitude IS NOT NULL THEN 1 END) /
    NULLIF(COUNT(*), 0), 2)::TEXT || '%'
FROM public.service_requests_311

UNION ALL

SELECT
  'Earliest Date',
  MIN(created_date)::TEXT
FROM public.service_requests_311

UNION ALL

SELECT
  'Latest Date',
  MAX(created_date)::TEXT
FROM public.service_requests_311

UNION ALL

SELECT
  'Years Covered',
  COUNT(DISTINCT EXTRACT(YEAR FROM created_date))::TEXT
FROM public.service_requests_311

UNION ALL

SELECT
  'Status Types',
  COUNT(DISTINCT status)::TEXT
FROM public.service_requests_311;

\echo ''
\echo '--- 911 EMERGENCY CALLS METRICS ---'
SELECT
  'Total Records' as metric,
  COUNT(*)::TEXT as value
FROM public.calls_911_monthly

UNION ALL

SELECT
  'Unique Year-Month Combos',
  COUNT(DISTINCT (month, year))::TEXT
FROM public.calls_911_monthly

UNION ALL

SELECT
  'Earliest Year',
  MIN(year)::TEXT
FROM public.calls_911_monthly

UNION ALL

SELECT
  'Latest Year',
  MAX(year)::TEXT
FROM public.calls_911_monthly

UNION ALL

SELECT
  'Districts Covered',
  COUNT(DISTINCT district)::TEXT
FROM public.calls_911_monthly

UNION ALL

SELECT
  'Call Types',
  COUNT(DISTINCT call_type)::TEXT
FROM public.calls_911_monthly

UNION ALL

SELECT
  'Average Calls/Record',
  ROUND(AVG(call_count), 2)::TEXT
FROM public.calls_911_monthly;

\echo ''
\echo '--- BUSINESS LICENSES METRICS ---'
SELECT
  'Total Records' as metric,
  COUNT(*)::TEXT as value
FROM public.business_licenses

UNION ALL

SELECT
  'Unique License Numbers',
  COUNT(DISTINCT license_number)::TEXT
FROM public.business_licenses

UNION ALL

SELECT
  'Missing License Numbers',
  COUNT(CASE WHEN license_number IS NULL THEN 1 END)::TEXT
FROM public.business_licenses

UNION ALL

SELECT
  'Active Licenses',
  COUNT(CASE WHEN status = 'active' THEN 1 END)::TEXT
FROM public.business_licenses

UNION ALL

SELECT
  'Records with Coordinates',
  ROUND(100.0 * COUNT(CASE WHEN latitude IS NOT NULL AND longitude IS NOT NULL THEN 1 END) /
    NULLIF(COUNT(*), 0), 2)::TEXT || '%'
FROM public.business_licenses

UNION ALL

SELECT
  'Business Types',
  COUNT(DISTINCT business_type)::TEXT
FROM public.business_licenses

UNION ALL

SELECT
  'Earliest Issue Date',
  MIN(issue_date)::TEXT
FROM public.business_licenses

UNION ALL

SELECT
  'Latest Issue Date',
  MAX(issue_date)::TEXT
FROM public.business_licenses;

\echo ''
\echo '--- GRAND TOTALS ---'
SELECT
  'Total Records (All Tables)' as metric,
  (
    (SELECT COUNT(*) FROM public.service_requests_311) +
    (SELECT COUNT(*) FROM public.calls_911_monthly) +
    (SELECT COUNT(*) FROM public.business_licenses)
  )::TEXT as value;

\echo ''
\echo '========================================='
\echo 'END OF REPORT'
\echo '========================================='
