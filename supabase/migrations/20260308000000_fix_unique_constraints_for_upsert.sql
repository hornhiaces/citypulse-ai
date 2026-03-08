-- Fix: Replace partial unique indexes with full unique constraints.
-- PostgREST .upsert({ onConflict: 'col' }) requires a full unique constraint
-- or full unique index. Partial indexes (WHERE ...) are not matched by
-- ON CONFLICT (col) and cause:
--   ERROR: there is no unique or exclusion constraint matching the ON CONFLICT specification

-- Drop the partial indexes created in the previous migration
DROP INDEX IF EXISTS idx_service_requests_311_case_id;
DROP INDEX IF EXISTS idx_business_licenses_license_number;
DROP INDEX IF EXISTS idx_calls_911_monthly_composite;

-- Add full unique constraints (NULLs are always distinct, so multiple NULLs are allowed)
ALTER TABLE public.service_requests_311
  ADD CONSTRAINT uq_service_requests_311_case_id UNIQUE (case_id);

ALTER TABLE public.business_licenses
  ADD CONSTRAINT uq_business_licenses_license_number UNIQUE (license_number);

ALTER TABLE public.calls_911_monthly
  ADD CONSTRAINT uq_calls_911_monthly UNIQUE (month, year, district, call_type);
