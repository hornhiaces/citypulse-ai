import { supabase } from '@/integrations/supabase/client';
import { hardcodedEmergencyCalls, hardcodedEmergencyCallsByDistrict } from '@/lib/hardcodedData';

const MONTH_ORDER = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function monthIndex(m: string): number {
  return MONTH_ORDER.indexOf(m);
}

export async function fetchEmergencyCalls(filters?: { district?: number; year?: number }) {
  try {
    let query = supabase.from('calls_911_monthly').select('*');
    if (filters?.district) query = query.eq('district', filters.district);
    if (filters?.year) query = query.eq('year', filters.year);
    const { data, error } = await query.order('year').order('month');
    console.log('📞 fetchEmergencyCalls:', { error: error?.message, rowCount: data?.length });
    if (data?.length) return data;
  } catch (e) {
    console.log('⚠️ Using hardcoded data for emergency calls');
  }
  return hardcodedEmergencyCalls;
}

export async function fetchEmergencyCallsByDistrict() {
  try {
    // Find the most recent year/month with data instead of hardcoding
    const { data: latest, error: latestErr } = await supabase
      .from('calls_911_monthly')
      .select('year, month')
      .order('year', { ascending: false })
      .limit(50);

    if (latestErr) throw latestErr;
    if (!latest?.length) return hardcodedEmergencyCallsByDistrict;

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
    if (data?.length) {
      return data.map(d => ({
        district: `D${d.district}`,
        calls: d.call_count,
        change: d.change_pct ?? 0,
      }));
    }
  } catch (e) {
    console.log('⚠️ Using hardcoded data for emergency calls by district');
  }
  return hardcodedEmergencyCallsByDistrict;
}
