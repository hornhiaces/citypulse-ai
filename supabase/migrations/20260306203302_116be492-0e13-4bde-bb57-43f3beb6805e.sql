
-- Create vector similarity search function with correct schema
CREATE OR REPLACE FUNCTION public.match_documents(
  query_embedding extensions.vector(1536),
  match_threshold float DEFAULT 0.3,
  match_count int DEFAULT 6
)
RETURNS TABLE (
  id uuid,
  content text,
  metadata jsonb,
  similarity float
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, extensions
AS $$
  SELECT
    vector_documents.id,
    vector_documents.content,
    vector_documents.metadata,
    1 - (vector_documents.embedding <=> query_embedding) AS similarity
  FROM vector_documents
  WHERE vector_documents.embedding IS NOT NULL
    AND 1 - (vector_documents.embedding <=> query_embedding) > match_threshold
  ORDER BY vector_documents.embedding <=> query_embedding
  LIMIT match_count;
$$;

-- Allow delete on district_signals for recomputation
CREATE POLICY "Service role can delete" ON public.district_signals FOR DELETE USING (true);

-- Allow delete on vector_documents for recomputation  
CREATE POLICY "Service role can delete" ON public.vector_documents FOR DELETE USING (true);

-- Allow update on vector_documents
CREATE POLICY "Service role can update" ON public.vector_documents FOR UPDATE USING (true);
