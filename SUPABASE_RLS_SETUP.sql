-- CityPulse AI - Row Level Security (RLS) Setup
-- This script implements Row Level Security policies for all tables
-- Run this in Supabase SQL Editor to apply the security policies

-- ============================================================================
-- 1. ENABLE RLS ON ALL TABLES
-- ============================================================================

ALTER TABLE public.district_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.district_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_requests_311 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calls_911_monthly ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_query_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vector_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dataset_catalog ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 2. ANONYMOUS/PUBLIC READ ACCESS
-- ============================================================================

-- Allow anyone (including anonymous) to read public data
CREATE POLICY "public_read_district_scores"
  ON public.district_scores
  FOR SELECT
  USING (true);

CREATE POLICY "public_read_district_signals"
  ON public.district_signals
  FOR SELECT
  USING (true);

CREATE POLICY "public_read_311_requests"
  ON public.service_requests_311
  FOR SELECT
  USING (true);

CREATE POLICY "public_read_911_calls"
  ON public.calls_911_monthly
  FOR SELECT
  USING (true);

CREATE POLICY "public_read_business_licenses"
  ON public.business_licenses
  FOR SELECT
  USING (true);

CREATE POLICY "public_read_recommendations"
  ON public.ai_recommendations
  FOR SELECT
  USING (true);

CREATE POLICY "public_read_dataset_catalog"
  ON public.dataset_catalog
  FOR SELECT
  USING (true);

-- ============================================================================
-- 3. VECTOR DOCUMENTS - Service Role Only
-- ============================================================================

-- Only service role can manage vector documents (for embedding operations)
CREATE POLICY "service_role_manage_vectors"
  ON public.vector_documents
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ============================================================================
-- 4. QUERY LOGS - Authenticated Users Can Log, Service Role Can Read
-- ============================================================================

-- Service role can insert logs (from edge functions)
CREATE POLICY "service_role_log_queries"
  ON public.ai_query_logs
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- Authenticated users can view their own logs
CREATE POLICY "user_view_own_logs"
  ON public.ai_query_logs
  FOR SELECT
  USING (auth.role() = 'authenticated' AND user_id::text = auth.uid()::text);

-- Service role can read all logs
CREATE POLICY "service_role_read_logs"
  ON public.ai_query_logs
  FOR SELECT
  USING (auth.role() = 'service_role');

-- ============================================================================
-- 5. WRITE OPERATIONS - Service Role Only (for ingestion)
-- ============================================================================

-- Service role can insert/update 311 data
CREATE POLICY "service_role_manage_311"
  ON public.service_requests_311
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Service role can insert/update 911 data
CREATE POLICY "service_role_manage_911"
  ON public.calls_911_monthly
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Service role can insert/update business licenses
CREATE POLICY "service_role_manage_licenses"
  ON public.business_licenses
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Service role can insert/update signals
CREATE POLICY "service_role_manage_signals"
  ON public.district_signals
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Service role can insert/update scores
CREATE POLICY "service_role_manage_scores"
  ON public.district_scores
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Service role can insert/update recommendations
CREATE POLICY "service_role_manage_recommendations"
  ON public.ai_recommendations
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Service role can insert/update dataset catalog
CREATE POLICY "service_role_manage_catalog"
  ON public.dataset_catalog
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ============================================================================
-- 6. VERIFICATION - Check that RLS is enabled
-- ============================================================================

-- Run this query to verify RLS is enabled on all tables:
-- SELECT schemaname, tablename, rowsecurity FROM pg_tables WHERE tablename IN (
--   'district_scores', 'district_signals', 'service_requests_311', 'calls_911_monthly',
--   'business_licenses', 'ai_recommendations', 'ai_query_logs', 'vector_documents', 'dataset_catalog'
-- );

-- Expected output: All tables should show rowsecurity = true

-- ============================================================================
-- 7. NOTES
-- ============================================================================

-- Public data (district_scores, signals, requests, calls, licenses, recommendations, catalog):
--   - Anyone can READ (no authentication needed)
--   - Only service role can INSERT/UPDATE/DELETE (edge functions)
--
-- Vector Documents:
--   - Only service role can READ/INSERT/UPDATE/DELETE (embedding operations)
--
-- Query Logs:
--   - Service role can INSERT (logging operations)
--   - Users can view their own logs
--   - Service role can READ all logs
--
-- This setup ensures:
-- ✓ Public read access for transparency
-- ✓ Service role exclusive write access for data integrity
-- ✓ User isolation for query logs
-- ✓ No unauthorized data modification
