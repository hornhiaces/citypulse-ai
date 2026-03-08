import { supabase } from '@/integrations/supabase/client';

const MONTH_ORDER = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function monthIndex(m: string): number {
  return MONTH_ORDER.indexOf(m);
}

export async function fetchEmergencyCalls(filters?: { district?: number; year?: number }) {
  let query = supabase.from('calls_911_monthly').select('*');
  if (filters?.district) query = query.eq('district', filters.district);
  if (filters?.year) query = query.eq('year', filters.year);
  const { data, error } = await query.order('year').order('month');
  console.log('📞 fetchEmergencyCalls:', { error: error?.message, rowCount: data?.length });
  if (error) throw error;
  return data;
}

export async function fetchEmergencyCallsByDistrict() {
  // Find the most recent year/month with data instead of hardcoding
  const { data: latest, error: latestErr } = await supabase
    .from('calls_911_monthly')
    .select('year, month')
    .order('year', { ascending: false })
    .limit(50);

  if (latestErr) throw latestErr;
  if (!latest?.length) return [];

  // Sort by year desc then month desc to find the true latest period
  const sorted = latest.sort((a, b) => {
    if (b.year !== a.year) return b.year - a.year;
    return monthIndex(b.month) - monthIndex(a.month);
  });
  const latestMonth = sorted[0].month;
  const latestYear = sorted[0].year;

  const { data, error } = await supabase
    .from('calls_911_monthly')
    .select('district, call_count, change_pct')
    .eq('month', latestMonth)
    .eq('year', latestYear)
    .order('district');
  if (error) throw error;
  return data.map(d => ({
    district: `D${d.district}`,
    calls: d.call_count,
    change: d.change_pct ?? 0,
  }));
}
