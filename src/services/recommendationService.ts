import { supabase } from '@/integrations/supabase/client';
import { recommendations as fallbackRecs } from '@/lib/mockData';

export async function fetchRecommendations() {
  try {
    const { data, error } = await supabase
      .from('ai_recommendations')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false });
    if (error) throw error;
    if (data?.length) return data;
  } catch (e) {
    console.log('⚠️ Using fallback recommendations');
  }
  return fallbackRecs;
}
