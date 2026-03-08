
-- Restrict read access on internal-only tables
-- ingestion_audit_log: internal ops data, no frontend need
DROP POLICY IF EXISTS "Public read access" ON public.ingestion_audit_log;

-- vector_documents: AI infrastructure, only used by edge functions (service_role)
DROP POLICY IF EXISTS "Public read access" ON public.vector_documents;
