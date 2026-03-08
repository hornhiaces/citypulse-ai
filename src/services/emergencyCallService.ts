import { supabase } from '@/integrations/supabase/client';

const MONTH_ABBR: Record<string, string> = {
  '1 - January': 'Jan', '2 - February': 'Feb', '3 - March': 'Mar',
  '4 - April': 'Apr', '5 - May': 'May', '6 - June': 'Jun',
  '7 - July': 'Jul', '8 - August': 'Aug', '9 - September': 'Sep',
  '10 - October': 'Oct', '11 - November': 'Nov', '12 - December': 'Dec',
  'Jan': 'Jan', 'Feb': 'Feb', 'Mar': 'Mar', 'Apr': 'Apr', 'May': 'May',
  'Jun': 'Jun', 'Jul': 'Jul', 'Aug': 'Aug', 'Sep': 'Sep', 'Oct': 'Oct',
  'Nov': 'Nov', 'Dec': 'Dec',
};

function normalizeMonth(raw: string): string {
  return MONTH_ABBR[raw] || raw.slice(0, 3);
}

export async function fetchEmergencyCalls(filters?: { district?: number; year?: number }) {
  let query = supabase.from('calls_911_monthly').select('*');
  if (filters?.district) query = query.eq('district', filters.district);
  if (filters?.year) query = query.eq('year', filters.year);
  const { data, error } = await query.order('year').order('month').limit(1000);
  if (error) throw error;
  return (data || []).map(d => ({ ...d, month: normalizeMonth(d.month) }));
}

export async function fetchEmergencyCallsByDistrict() {
  // Parallel fetch: signals + district names in one go
  const [signalsRes, scoresRes] = await Promise.all([
    supabase
      .from('district_signals')
      .select('district, signal_value')
      .eq('signal_type', 'emergency_demand')
      .order('district'),
    supabase
      .from('district_scores')
      .select('district, district_name')
      .order('district'),
  ]);

  if (signalsRes.error) throw signalsRes.error;
  const signals = signalsRes.data || [];
  if (!signals.length) return [];

  const nameMap: Record<number, string> = {};
  (scoresRes.data || []).forEach(s => { nameMap[s.district] = s.district_name; });

  // Use signal_value as weight to distribute proportionally
  const totalWeight = signals.reduce((sum, s) => sum + Math.max(1, Math.abs(s.signal_value) + 10), 0);
  // Estimate monthly total from latest 911 row (single lightweight query)
  const { data: latestCalls } = await supabase
    .from('calls_911_monthly')
    .select('call_count')
    .order('year', { ascending: false })
    .order('month', { ascending: false })
    .limit(1);

  const monthlyTotal = latestCalls?.[0]?.call_count || 10000;

  return signals.map(s => {
    const weight = Math.max(1, Math.abs(s.signal_value) + 10);
    const calls = Math.round((weight / totalWeight) * monthlyTotal);
    return {
      district: nameMap[s.district] || `D${s.district}`,
      calls,
      change: s.signal_value ?? 0,
    };
  });
}
