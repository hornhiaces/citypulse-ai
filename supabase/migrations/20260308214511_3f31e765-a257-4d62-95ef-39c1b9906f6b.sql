-- Create a public storage bucket for dataset CSV files
INSERT INTO storage.buckets (id, name, public)
VALUES ('datasets', 'datasets', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to the datasets bucket
CREATE POLICY "Public read access for datasets"
ON storage.objects
FOR SELECT
USING (bucket_id = 'datasets');
