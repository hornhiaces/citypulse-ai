import { supabase } from '@/integrations/supabase/client';

export async function fetchDistrictScores() {
  const { data, error } = await supabase
    .from('district_scores')
    .select('*')
    .order('district');
  if (error) throw error;
  return data;
}

export async function fetchDistrictSignals(district?: number) {
  let query = supabase.from('district_signals').select('*');
  if (district) query = query.eq('district', district);
  const { data, error } = await query.order('district');
  if (error) throw error;
  return data;
}
