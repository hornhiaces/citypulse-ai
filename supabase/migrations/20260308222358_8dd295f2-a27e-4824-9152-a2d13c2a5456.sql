-- Grant anonymous SELECT on the safe public view
GRANT SELECT ON public.vw_dataset_catalog_public TO anon, authenticated;