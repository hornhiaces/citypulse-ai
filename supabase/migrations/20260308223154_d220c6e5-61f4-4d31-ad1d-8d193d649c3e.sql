
-- 1. Pre-aggregated 311 stats by status
CREATE OR REPLACE VIEW public.vw_311_status_summary AS
SELECT
  COUNT(*) AS total,
  COUNT(*) FILTER (WHERE status = 'open') AS open_count,
  COUNT(*) FILTER (WHERE status = 'resolved') AS resolved_count,
  COUNT(*) FILTER (WHERE status = 'in_progress') AS in_progress_count,
  COUNT(*) FILTER (WHERE priority = 'high') AS high_priority_count
FROM public.service_requests_311;

-- 2. Pre-aggregated 311 category breakdown
CREATE OR REPLACE VIEW public.vw_311_category_breakdown AS
SELECT
  category,
  COUNT(*) AS count,
  ROUND(COUNT(*) * 100.0 / NULLIF(SUM(COUNT(*)) OVER(), 0), 1) AS percentage
FROM public.service_requests_311
GROUP BY category
ORDER BY count DESC;

-- 3. Pre-aggregated business license stats
CREATE OR REPLACE VIEW public.vw_business_license_stats AS
SELECT
  COUNT(*) AS total,
  COUNT(*) FILTER (WHERE status = 'active') AS active_count,
  COUNT(*) FILTER (WHERE status = 'expired') AS expired_count,
  COUNT(*) FILTER (WHERE status = 'suspended') AS suspended_count,
  COUNT(*) FILTER (WHERE category = 'New') AS new_count,
  COUNT(*) FILTER (WHERE category = 'Renew') AS renew_count
FROM public.business_licenses;

-- 4. Pre-aggregated business type breakdown (active licenses)
CREATE OR REPLACE VIEW public.vw_business_type_breakdown AS
SELECT
  COALESCE(business_type, 'Other') AS business_type,
  COUNT(*) AS count
FROM public.business_licenses
WHERE status = 'active'
GROUP BY COALESCE(business_type, 'Other')
ORDER BY count DESC
LIMIT 12;

-- 5. Pre-aggregated license issuance trends by month
CREATE OR REPLACE VIEW public.vw_license_issuance_trends AS
SELECT
  to_char(issue_date, 'Mon') AS month,
  EXTRACT(YEAR FROM issue_date)::int AS year,
  EXTRACT(MONTH FROM issue_date)::int AS month_num,
  COUNT(*) FILTER (WHERE category = 'New') AS new_licenses,
  COUNT(*) FILTER (WHERE category != 'New' OR category IS NULL) AS renewals,
  COUNT(*) AS total
FROM public.business_licenses
WHERE issue_date IS NOT NULL
GROUP BY to_char(issue_date, 'Mon'), EXTRACT(YEAR FROM issue_date), EXTRACT(MONTH FROM issue_date)
ORDER BY year, month_num;

-- Grant access
GRANT SELECT ON public.vw_311_status_summary TO anon, authenticated;
GRANT SELECT ON public.vw_311_category_breakdown TO anon, authenticated;
GRANT SELECT ON public.vw_business_license_stats TO anon, authenticated;
GRANT SELECT ON public.vw_business_type_breakdown TO anon, authenticated;
GRANT SELECT ON public.vw_license_issuance_trends TO anon, authenticated;
