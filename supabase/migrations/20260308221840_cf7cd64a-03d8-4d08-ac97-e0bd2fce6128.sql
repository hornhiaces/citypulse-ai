-- Create a public-safe view for dataset_catalog that hides source_url and error_details
CREATE OR REPLACE VIEW public.vw_dataset_catalog_public
WITH (security_invoker = on) AS
  SELECT id, name, description, status, record_count, completion_rate, missing_rows,
         ingestion_source, last_ingested_at, created_at, updated_at
  FROM public.dataset_catalog;

-- Create a public-safe view for 311 that generalizes location to district level
CREATE OR REPLACE VIEW public.vw_service_requests_311_public
WITH (security_invoker = on) AS
  SELECT id, case_id, category, subcategory, description, status, priority,
         district, source, created_date, resolved_date, resolution_days, created_at
  FROM public.service_requests_311;