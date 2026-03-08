import { supabase } from '@/integrations/supabase/client';

const MONTH_ABBR: Record<string, string> = {
  '1 - January': 'Jan', '2 - February': 'Feb', '3 - March': 'Mar',
  '4 - April': 'Apr', '5 - May': 'May', '6 - June': 'Jun',
  '7 - July': 'Jul', '8 - August': 'Aug', '9 - September': 'Sep',
  '10 - October': 'Oct', '11 - November': 'Nov', '12 - December': 'Dec',
  // Also handle if already short
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
  const { data, error } = await query.order('year').order('month');
  if (error) throw error;
  // Normalize month format and return
  return (data || []).map(d => ({ ...d, month: normalizeMonth(d.month) }));
}

export async function fetchEmergencyCallsByDistrict() {
  // 911 data has null districts, so use district_signals for emergency demand
  const { data: signals, error: sigError } = await supabase
    .from('district_signals')
    .select('district, signal_value')
    .eq('signal_type', 'emergency_demand')
    .order('district');

  if (sigError) throw sigError;
  if (!signals?.length) return [];

  // Also get district scores for total call context
  const { data: scores } = await supabase
    .from('district_scores')
    .select('district, district_name, overall_risk_score')
    .order('district');

  const nameMap: Record<number, string> = {};
  (scores || []).forEach(s => { nameMap[s.district] = s.district_name; });

  // Get latest month total calls to compute proportional distribution
  const { data: latestCalls } = await supabase
    .from('calls_911_monthly')
    .select('call_count, month, year')
    .eq('call_type', 'Emergency')
    .order('year', { ascending: false })
    .order('month', { ascending: false })
    .limit(1);

  const monthlyTotal = latestCalls?.[0]?.call_count || 10000;

  // Distribute calls proportionally using signal_value as weight
  const totalWeight = signals.reduce((sum, s) => sum + Math.max(1, Math.abs(s.signal_value) + 10), 0);

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
