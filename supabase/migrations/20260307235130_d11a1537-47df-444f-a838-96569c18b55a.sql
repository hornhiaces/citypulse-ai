CREATE UNIQUE INDEX IF NOT EXISTS service_requests_311_case_id_key ON public.service_requests_311 (case_id) WHERE case_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS business_licenses_license_number_key ON public.business_licenses (license_number) WHERE license_number IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS calls_911_monthly_composite_key ON public.calls_911_monthly (month, year, district, call_type) WHERE district IS NOT NULL AND call_type IS NOT NULL;