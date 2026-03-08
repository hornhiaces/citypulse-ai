-- Data Quality Check Report for Ingested Datasets
-- Run after ingestion to validate data integrity

\echo '========== DATA QUALITY REPORT =========='
\echo ''

-- Dataset Catalog Summary
\echo '--- Dataset Catalog Summary ---'
SELECT
  name,
  status,
  record_count,
  TO_CHAR(last_ingested_at, 'YYYY-MM-DD HH:MM:SS') as last_ingested,
  TO_CHAR(updated_at, 'YYYY-MM-DD HH:MM:SS') as updated
FROM public.dataset_catalog
ORDER BY updated_at DESC;

\echo ''
\echo '--- 311 Service Requests Quality Metrics ---'
SELECT
  COUNT(*) as total_records,
  COUNT(DISTINCT case_id) as unique_case_ids,
  COUNT(CASE WHEN case_id IS NULL THEN 1 END) as missing_case_ids,
  COUNT(CASE WHEN category IS NULL THEN 1 END) as missing_category,
  COUNT(CASE WHEN status IS NULL THEN 1 END) as missing_status,
  COUNT(CASE WHEN created_date IS NULL THEN 1 END) as missing_created_date,
  COUNT(DISTINCT EXTRACT(YEAR FROM created_date)) as years_covered,
  ROUND(100.0 * COUNT(CASE WHEN latitude IS NOT NULL THEN 1 END) / COUNT(*), 1) as pct_with_coords
FROM public.service_requests_311;

\echo ''
\echo '--- 911 Emergency Calls Quality Metrics ---'
SELECT
  COUNT(*) as total_records,
  COUNT(DISTINCT (month, year, district, call_type)) as unique_combinations,
  COUNT(CASE WHEN month IS NULL THEN 1 END) as missing_month,
  COUNT(CASE WHEN year IS NULL THEN 1 END) as missing_year,
  COUNT(CASE WHEN call_count IS NULL THEN 1 END) as missing_call_count,
  MIN(year) as earliest_year,
  MAX(year) as latest_year,
  COUNT(DISTINCT district) as districts_covered
FROM public.calls_911_monthly;

\echo ''
\echo '--- Business Licenses Quality Metrics ---'
SELECT
  COUNT(*) as total_records,
  COUNT(DISTINCT license_number) as unique_licenses,
  COUNT(CASE WHEN license_number IS NULL THEN 1 END) as missing_license_numbers,
  COUNT(CASE WHEN business_name IS NULL THEN 1 END) as missing_business_names,
  COUNT(CASE WHEN business_type IS NULL THEN 1 END) as missing_business_types,
  COUNT(CASE WHEN status = 'active' THEN 1 END) as active_licenses,
  COUNT(CASE WHEN status != 'active' THEN 1 END) as inactive_licenses,
  ROUND(100.0 * COUNT(CASE WHEN latitude IS NOT NULL THEN 1 END) / COUNT(*), 1) as pct_with_coords
FROM public.business_licenses;

\echo ''
\echo '--- Data Freshness (by source) ---'
SELECT
  'Service Requests (311)' as source,
  MAX(created_date)::date as most_recent_record,
  (CURRENT_DATE - MAX(created_date)::date) as days_old
FROM public.service_requests_311
UNION ALL
SELECT
  'Emergency Calls (911)',
  TO_DATE(CONCAT(MAX(year)::text, '-', LPAD(CONCAT(CASE
    WHEN month = 'Jan' THEN '01'
    WHEN month = 'Feb' THEN '02'
    WHEN month = 'Mar' THEN '03'
    WHEN month = 'Apr' THEN '04'
    WHEN month = 'May' THEN '05'
    WHEN month = 'Jun' THEN '06'
    WHEN month = 'Jul' THEN '07'
    WHEN month = 'Aug' THEN '08'
    WHEN month = 'Sep' THEN '09'
    WHEN month = 'Oct' THEN '10'
    WHEN month = 'Nov' THEN '11'
    WHEN month = 'Dec' THEN '12'
  END)::text, 2, '0'), '-01'), 'YYYY-MM-DD')::date,
  (CURRENT_DATE - TO_DATE(CONCAT(MAX(year)::text, '-', LPAD(CONCAT(CASE
    WHEN month = 'Jan' THEN '01'
    WHEN month = 'Feb' THEN '02'
    WHEN month = 'Mar' THEN '03'
    WHEN month = 'Apr' THEN '04'
    WHEN month = 'May' THEN '05'
    WHEN month = 'Jun' THEN '06'
    WHEN month = 'Jul' THEN '07'
    WHEN month = 'Aug' THEN '08'
    WHEN month = 'Sep' THEN '09'
    WHEN month = 'Oct' THEN '10'
    WHEN month = 'Nov' THEN '11'
    WHEN month = 'Dec' THEN '12'
  END)::text, 2, '0'), '-01'), 'YYYY-MM-DD')::date)
FROM public.calls_911_monthly
UNION ALL
SELECT
  'Business Licenses',
  MAX(issue_date)::date,
  (CURRENT_DATE - MAX(issue_date)::date)
FROM public.business_licenses;

\echo ''
\echo '========== END REPORT =========='
