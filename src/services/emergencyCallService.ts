import { supabase } from '@/integrations/supabase/client';

export async function fetchEmergencyCalls(filters?: { district?: number; year?: number }) {
  let query = supabase.from('calls_911_monthly').select('*');
  if (filters?.district) query = query.eq('district', filters.district);
  if (filters?.year) query = query.eq('year', filters.year);
  const { data, error } = await query.order('year').order('month');
  if (error) throw error;
  return data;
}

export async function fetchEmergencyCallsByDistrict() {
  const { data, error } = await supabase
    .from('calls_911_monthly')
    .select('district, call_count, change_pct')
    .eq('month', 'Mar')
    .eq('year', 2025)
    .order('district');
  if (error) throw error;
  return data.map(d => ({
    district: `D${d.district}`,
    calls: d.call_count,
    change: d.change_pct ?? 0,
  }));
}
