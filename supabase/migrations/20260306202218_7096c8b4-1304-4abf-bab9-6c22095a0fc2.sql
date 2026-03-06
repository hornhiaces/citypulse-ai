
-- Enable pgvector extension for future RAG pipeline
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Dataset catalog
CREATE TABLE public.dataset_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  source_url TEXT,
  record_count INTEGER DEFAULT 0,
  last_ingested_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'ingesting', 'complete', 'error')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 311 Service Requests
CREATE TABLE public.service_requests_311 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id TEXT,
  category TEXT NOT NULL,
  subcategory TEXT,
  description TEXT,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  district INTEGER,
  address TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  created_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resolved_date TIMESTAMP WITH TIME ZONE,
  resolution_days INTEGER,
  source TEXT DEFAULT 'phone',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 911 Monthly Call Data
CREATE TABLE public.calls_911_monthly (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  month TEXT NOT NULL,
  year INTEGER NOT NULL,
  district INTEGER,
  call_type TEXT,
  call_count INTEGER NOT NULL DEFAULT 0,
  avg_response_minutes DOUBLE PRECISION,
  priority_1_count INTEGER DEFAULT 0,
  priority_2_count INTEGER DEFAULT 0,
  priority_3_count INTEGER DEFAULT 0,
  change_pct DOUBLE PRECISION DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Business Licenses
CREATE TABLE public.business_licenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  license_number TEXT,
  business_name TEXT NOT NULL,
  business_type TEXT,
  category TEXT,
  district INTEGER,
  address TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'suspended', 'pending')),
  issue_date DATE,
  expiry_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- District Signals (aggregated indicators)
CREATE TABLE public.district_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  district INTEGER NOT NULL,
  signal_type TEXT NOT NULL,
  signal_value DOUBLE PRECISION NOT NULL,
  signal_level TEXT CHECK (signal_level IN ('HIGH', 'MEDIUM', 'LOW', 'RISING', 'DECLINING', 'STRONG', 'STABLE')),
  period TEXT,
  computed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'
);

-- District Scores (composite intelligence scores)
CREATE TABLE public.district_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  district INTEGER NOT NULL UNIQUE,
  district_name TEXT NOT NULL,
  area TEXT,
  population INTEGER,
  public_safety_pressure TEXT CHECK (public_safety_pressure IN ('HIGH', 'MEDIUM', 'LOW')),
  infrastructure_stress TEXT CHECK (infrastructure_stress IN ('HIGH', 'MEDIUM', 'LOW')),
  emergency_demand TEXT CHECK (emergency_demand IN ('RISING', 'STABLE', 'LOW')),
  economic_activity TEXT CHECK (economic_activity IN ('STRONG', 'MEDIUM', 'LOW')),
  citizen_confidence TEXT CHECK (citizen_confidence IN ('STRONG', 'STABLE', 'DECLINING')),
  overall_risk_score DOUBLE PRECISION DEFAULT 0,
  computed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- AI Recommendations
CREATE TABLE public.ai_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  priority TEXT NOT NULL CHECK (priority IN ('critical', 'high', 'medium', 'low')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT,
  districts INTEGER[] DEFAULT '{}',
  signals TEXT[] DEFAULT '{}',
  confidence DOUBLE PRECISION DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'in_progress', 'resolved')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- AI Query Logs
CREATE TABLE public.ai_query_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query TEXT NOT NULL,
  mode TEXT DEFAULT 'leadership' CHECK (mode IN ('leadership', 'citizen')),
  response TEXT,
  sources JSONB DEFAULT '[]',
  confidence DOUBLE PRECISION,
  tokens_used INTEGER,
  latency_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Vector Documents (for RAG)
CREATE TABLE public.vector_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  embedding vector(1536),
  source_table TEXT,
  source_id TEXT,
  chunk_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_311_district ON public.service_requests_311(district);
CREATE INDEX idx_311_category ON public.service_requests_311(category);
CREATE INDEX idx_311_status ON public.service_requests_311(status);
CREATE INDEX idx_311_created ON public.service_requests_311(created_date);
CREATE INDEX idx_911_district ON public.calls_911_monthly(district);
CREATE INDEX idx_911_year_month ON public.calls_911_monthly(year, month);
CREATE INDEX idx_biz_district ON public.business_licenses(district);
CREATE INDEX idx_biz_status ON public.business_licenses(status);
CREATE INDEX idx_signals_district ON public.district_signals(district);
CREATE INDEX idx_signals_type ON public.district_signals(signal_type);
CREATE INDEX idx_scores_district ON public.district_scores(district);

-- Triggers for updated_at
CREATE TRIGGER update_dataset_catalog_updated_at BEFORE UPDATE ON public.dataset_catalog FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_district_scores_updated_at BEFORE UPDATE ON public.district_scores FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_ai_recommendations_updated_at BEFORE UPDATE ON public.ai_recommendations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS on all tables
ALTER TABLE public.dataset_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_requests_311 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calls_911_monthly ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.district_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.district_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_query_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vector_documents ENABLE ROW LEVEL SECURITY;

-- Public read policies (civic transparency - all data is public)
CREATE POLICY "Public read access" ON public.dataset_catalog FOR SELECT USING (true);
CREATE POLICY "Public read access" ON public.service_requests_311 FOR SELECT USING (true);
CREATE POLICY "Public read access" ON public.calls_911_monthly FOR SELECT USING (true);
CREATE POLICY "Public read access" ON public.business_licenses FOR SELECT USING (true);
CREATE POLICY "Public read access" ON public.district_signals FOR SELECT USING (true);
CREATE POLICY "Public read access" ON public.district_scores FOR SELECT USING (true);
CREATE POLICY "Public read access" ON public.ai_recommendations FOR SELECT USING (true);
CREATE POLICY "Public read access" ON public.ai_query_logs FOR SELECT USING (true);
CREATE POLICY "Public read access" ON public.vector_documents FOR SELECT USING (true);

-- Service role insert/update policies (for edge functions / ingestion)
CREATE POLICY "Service role can insert" ON public.service_requests_311 FOR INSERT WITH CHECK (true);
CREATE POLICY "Service role can insert" ON public.calls_911_monthly FOR INSERT WITH CHECK (true);
CREATE POLICY "Service role can insert" ON public.business_licenses FOR INSERT WITH CHECK (true);
CREATE POLICY "Service role can insert" ON public.district_signals FOR INSERT WITH CHECK (true);
CREATE POLICY "Service role can insert" ON public.district_scores FOR INSERT WITH CHECK (true);
CREATE POLICY "Service role can insert" ON public.ai_recommendations FOR INSERT WITH CHECK (true);
CREATE POLICY "Service role can insert" ON public.ai_query_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Service role can insert" ON public.vector_documents FOR INSERT WITH CHECK (true);
CREATE POLICY "Service role can insert" ON public.dataset_catalog FOR INSERT WITH CHECK (true);

CREATE POLICY "Service role can update" ON public.district_scores FOR UPDATE USING (true);
CREATE POLICY "Service role can update" ON public.ai_recommendations FOR UPDATE USING (true);
CREATE POLICY "Service role can update" ON public.dataset_catalog FOR UPDATE USING (true);
