
-- Fix security definer warnings: explicitly set security_invoker on views that read from public-read tables
-- vw_311_monthly_trends
DROP VIEW IF EXISTS public.vw_311_monthly_trends;
CREATE VIEW public.vw_311_monthly_trends WITH (security_invoker = on) AS
SELECT
  to_char(created_date, 'Mon') AS month,
  EXTRACT(YEAR FROM created_date)::int AS year,
  EXTRACT(MONTH FROM created_date)::int AS month_num,
  COUNT(*) AS requests_311,
  COUNT(*) FILTER (WHERE status = 'resolved') AS resolved,
  COUNT(*) FILTER (WHERE status != 'resolved') AS open
FROM public.service_requests_311
WHERE created_date >= '2024-01-01'
GROUP BY to_char(created_date, 'Mon'), EXTRACT(YEAR FROM created_date), EXTRACT(MONTH FROM created_date)
ORDER BY EXTRACT(YEAR FROM created_date), EXTRACT(MONTH FROM created_date);

-- vw_311_status_summary
DROP VIEW IF EXISTS public.vw_311_status_summary;
CREATE VIEW public.vw_311_status_summary WITH (security_invoker = on) AS
SELECT
  COUNT(*) AS total,
  COUNT(*) FILTER (WHERE status = 'open') AS open_count,
  COUNT(*) FILTER (WHERE status = 'resolved') AS resolved_count,
  COUNT(*) FILTER (WHERE status = 'in_progress') AS in_progress_count,
  COUNT(*) FILTER (WHERE priority = 'high') AS high_priority_count
FROM public.service_requests_311;

-- vw_311_category_breakdown
DROP VIEW IF EXISTS public.vw_311_category_breakdown;
CREATE VIEW public.vw_311_category_breakdown WITH (security_invoker = on) AS
SELECT
  category,
  COUNT(*) AS count,
  ROUND(COUNT(*) * 100.0 / NULLIF(SUM(COUNT(*)) OVER(), 0), 1) AS percentage
FROM public.service_requests_311
GROUP BY category
ORDER BY count DESC;

-- vw_business_license_stats
DROP VIEW IF EXISTS public.vw_business_license_stats;
CREATE VIEW public.vw_business_license_stats WITH (security_invoker = on) AS
SELECT
  COUNT(*) AS total,
  COUNT(*) FILTER (WHERE status = 'active') AS active_count,
  COUNT(*) FILTER (WHERE status = 'expired') AS expired_count,
  COUNT(*) FILTER (WHERE status = 'suspended') AS suspended_count,
  COUNT(*) FILTER (WHERE category = 'New') AS new_count,
  COUNT(*) FILTER (WHERE category = 'Renew') AS renew_count
FROM public.business_licenses;

-- vw_business_type_breakdown
DROP VIEW IF EXISTS public.vw_business_type_breakdown;
CREATE VIEW public.vw_business_type_breakdown WITH (security_invoker = on) AS
SELECT
  COALESCE(business_type, 'Other') AS business_type,
  COUNT(*) AS count
FROM public.business_licenses
WHERE status = 'active'
GROUP BY COALESCE(business_type, 'Other')
ORDER BY count DESC
LIMIT 12;

-- vw_license_issuance_trends
DROP VIEW IF EXISTS public.vw_license_issuance_trends;
CREATE VIEW public.vw_license_issuance_trends WITH (security_invoker = on) AS
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

-- Re-grant
GRANT SELECT ON public.vw_311_monthly_trends TO anon, authenticated;
GRANT SELECT ON public.vw_311_status_summary TO anon, authenticated;
GRANT SELECT ON public.vw_311_category_breakdown TO anon, authenticated;
GRANT SELECT ON public.vw_business_license_stats TO anon, authenticated;
GRANT SELECT ON public.vw_business_type_breakdown TO anon, authenticated;
GRANT SELECT ON public.vw_license_issuance_trends TO anon, authenticated;
