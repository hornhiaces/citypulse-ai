-- Allow service role to update and delete service_requests_311
CREATE POLICY "Service role can update" ON public.service_requests_311
FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Service role can delete" ON public.service_requests_311
FOR DELETE TO authenticated USING (true);

-- Allow service role to update and delete calls_911_monthly
CREATE POLICY "Service role can update" ON public.calls_911_monthly
FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Service role can delete" ON public.calls_911_monthly
FOR DELETE TO authenticated USING (true);

-- Allow service role to update business_licenses
CREATE POLICY "Service role can update" ON public.business_licenses
FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Service role can delete" ON public.business_licenses
FOR DELETE TO authenticated USING (true);

-- Add unique constraints for upsert support
CREATE UNIQUE INDEX IF NOT EXISTS idx_service_requests_311_case_id ON public.service_requests_311 (case_id) WHERE case_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_business_licenses_license_number ON public.business_licenses (license_number) WHERE license_number IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_calls_911_monthly_composite ON public.calls_911_monthly (month, year, district, call_type) WHERE district IS NOT NULL AND call_type IS NOT NULL;