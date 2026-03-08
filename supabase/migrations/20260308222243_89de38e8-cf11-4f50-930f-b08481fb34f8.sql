-- Recreate view WITHOUT security_invoker so it bypasses base table RLS 
-- (the view itself excludes sensitive columns)
DROP VIEW IF EXISTS public.vw_dataset_catalog_public;
CREATE VIEW public.vw_dataset_catalog_public AS
  SELECT id, name, description, status, record_count, completion_rate, missing_rows,
         ingestion_source, last_ingested_at, created_at, updated_at
  FROM public.dataset_catalog;