
DROP VIEW IF EXISTS public.vw_data_quality;
CREATE VIEW public.vw_data_quality
WITH (security_invoker = true)
AS
SELECT 'service_requests_311'::text AS dataset,
    count(*) AS total_records,
    count(case_id) AS records_with_key,
    count(DISTINCT case_id) AS unique_keys,
    count(*) FILTER (WHERE latitude IS NOT NULL AND longitude IS NOT NULL) AS records_with_location,
    round(100.0 * count(*) FILTER (WHERE latitude IS NOT NULL AND longitude IS NOT NULL) / GREATEST(count(*), 1), 1) AS location_coverage_pct
FROM service_requests_311
UNION ALL
SELECT 'business_licenses'::text,
    count(*),
    count(license_number),
    count(DISTINCT license_number),
    count(*) FILTER (WHERE latitude IS NOT NULL AND longitude IS NOT NULL),
    round(100.0 * count(*) FILTER (WHERE latitude IS NOT NULL AND longitude IS NOT NULL) / GREATEST(count(*), 1), 1)
FROM business_licenses;

DROP VIEW IF EXISTS public.vw_ingestion_summary;
CREATE VIEW public.vw_ingestion_summary
WITH (security_invoker = true)
AS
SELECT dataset_name,
    count(*) AS total_attempts,
    count(*) FILTER (WHERE status = 'success') AS successful_ingestions,
    count(*) FILTER (WHERE status = 'partial') AS partial_ingestions,
    count(*) FILTER (WHERE status = 'failed') AS failed_ingestions,
    max(completed_at) AS most_recent_ingest,
    round(avg(completion_rate), 1) AS avg_completion_rate,
    sum(missing_rows) AS total_missing_rows
FROM ingestion_audit_log
GROUP BY dataset_name;
