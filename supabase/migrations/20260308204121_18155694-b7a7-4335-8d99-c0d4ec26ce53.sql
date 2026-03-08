
-- =====================================================
-- SECURITY HARDENING: Remove overly permissive write policies
-- Service role bypasses RLS, so edge functions still work fine.
-- Only public SELECT (read) policies remain for the civic transparency app.
-- =====================================================

-- 1. ingestion_audit_log: Enable RLS + add read-only policy
ALTER TABLE public.ingestion_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access" ON public.ingestion_audit_log FOR SELECT USING (true);

-- 2. vector_documents: Drop public INSERT/UPDATE/DELETE
DROP POLICY IF EXISTS "Service role can insert" ON public.vector_documents;
DROP POLICY IF EXISTS "Service role can update" ON public.vector_documents;
DROP POLICY IF EXISTS "Service role can delete" ON public.vector_documents;

-- 3. district_signals: Drop public INSERT/DELETE
DROP POLICY IF EXISTS "Service role can insert" ON public.district_signals;
DROP POLICY IF EXISTS "Service role can delete" ON public.district_signals;

-- 4. district_scores: Drop public INSERT/UPDATE
DROP POLICY IF EXISTS "Service role can insert" ON public.district_scores;
DROP POLICY IF EXISTS "Service role can update" ON public.district_scores;

-- 5. ai_recommendations: Drop public INSERT/UPDATE
DROP POLICY IF EXISTS "Service role can insert" ON public.ai_recommendations;
DROP POLICY IF EXISTS "Service role can update" ON public.ai_recommendations;

-- 6. ai_query_logs: Drop public INSERT
DROP POLICY IF EXISTS "Service role can insert" ON public.ai_query_logs;

-- 7. calls_911_monthly: Drop public INSERT/UPDATE/DELETE
DROP POLICY IF EXISTS "Service role can insert" ON public.calls_911_monthly;
DROP POLICY IF EXISTS "Service role can update" ON public.calls_911_monthly;
DROP POLICY IF EXISTS "Service role can delete" ON public.calls_911_monthly;

-- 8. business_licenses: Drop public INSERT/UPDATE/DELETE
DROP POLICY IF EXISTS "Service role can insert" ON public.business_licenses;
DROP POLICY IF EXISTS "Service role can update" ON public.business_licenses;
DROP POLICY IF EXISTS "Service role can delete" ON public.business_licenses;

-- 9. service_requests_311: Drop public INSERT/UPDATE/DELETE
DROP POLICY IF EXISTS "Service role can insert" ON public.service_requests_311;
DROP POLICY IF EXISTS "Service role can update" ON public.service_requests_311;
DROP POLICY IF EXISTS "Service role can delete" ON public.service_requests_311;

-- 10. dataset_catalog: Drop public INSERT/UPDATE
DROP POLICY IF EXISTS "Service role can insert" ON public.dataset_catalog;
DROP POLICY IF EXISTS "Service role can update" ON public.dataset_catalog;
