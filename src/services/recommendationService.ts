import { supabase } from '@/integrations/supabase/client';

export async function fetchRecommendations() {
  const { data, error } = await supabase
    .from('ai_recommendations')
    .select('*')
    .eq('status', 'active')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}
