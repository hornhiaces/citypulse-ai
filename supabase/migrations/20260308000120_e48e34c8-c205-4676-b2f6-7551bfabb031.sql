DROP INDEX IF EXISTS public.service_requests_311_case_id_key;
DROP INDEX IF EXISTS public.idx_service_requests_311_case_id;
ALTER TABLE public.service_requests_311 ADD CONSTRAINT service_requests_311_case_id_unique UNIQUE (case_id);

DROP INDEX IF EXISTS public.business_licenses_license_number_key;
ALTER TABLE public.business_licenses ADD CONSTRAINT business_licenses_license_number_unique UNIQUE (license_number);