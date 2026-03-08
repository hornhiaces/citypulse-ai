
-- Create a view that pre-aggregates 311 service requests by month/year
CREATE OR REPLACE VIEW public.vw_311_monthly_trends AS
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

GRANT SELECT ON public.vw_311_monthly_trends TO anon, authenticated;
