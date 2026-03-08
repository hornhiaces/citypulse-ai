-- Fix vw_ingestion_summary to use security_invoker
DROP VIEW IF EXISTS public.vw_ingestion_summary;
CREATE VIEW public.vw_ingestion_summary
WITH (security_invoker = on) AS
  SELECT 
    dataset_name,
    COUNT(*) AS total_attempts,
    COUNT(*) FILTER (WHERE status = 'success') AS successful_ingestions,
    COUNT(*) FILTER (WHERE status = 'partial') AS partial_ingestions,
    COUNT(*) FILTER (WHERE status = 'failed') AS failed_ingestions,
    MAX(completed_at) AS most_recent_ingest,
    AVG(completion_rate) AS avg_completion_rate,
    SUM(missing_rows) AS total_missing_rows
  FROM public.ingestion_audit_log
  GROUP BY dataset_name;

-- Restrict dataset_catalog: replace permissive public read with deny on base table
DROP POLICY IF EXISTS "Public read access" ON public.dataset_catalog;
CREATE POLICY "Deny direct public read on dataset_catalog"
  ON public.dataset_catalog FOR SELECT
  USING (false);