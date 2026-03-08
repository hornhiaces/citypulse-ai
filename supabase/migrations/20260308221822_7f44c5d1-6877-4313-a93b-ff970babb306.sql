-- Fix: Restrict ai_query_logs to deny public SELECT (internal audit log)
DROP POLICY IF EXISTS "Public read access" ON public.ai_query_logs;
CREATE POLICY "Deny public read on ai_query_logs"
  ON public.ai_query_logs FOR SELECT
  USING (false);

-- Fix: Add restrictive read policies for ingestion_audit_log
ALTER TABLE public.ingestion_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Deny public read on ingestion_audit_log"
  ON public.ingestion_audit_log FOR SELECT
  USING (false);

-- Fix: Add restrictive read policies for vector_documents
CREATE POLICY "Deny public read on vector_documents"
  ON public.vector_documents FOR SELECT
  USING (false);