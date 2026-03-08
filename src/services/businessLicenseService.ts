import { supabase } from '@/integrations/supabase/client';

export async function fetchBusinessLicenses(filters?: { district?: number; status?: string }) {
  let query = supabase.from('business_licenses').select('*');
  if (filters?.district) query = query.eq('district', filters.district);
  if (filters?.status) query = query.eq('status', filters.status);
  const { data, error } = await query.order('business_name');
  if (error) throw error;
  return data;
}

export async function fetchBusinessLicenseStats() {
  // Use head counts for efficiency
  const [totalRes, activeRes, expiredRes, suspendedRes] = await Promise.all([
    supabase.from('business_licenses').select('*', { count: 'exact', head: true }),
    supabase.from('business_licenses').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('business_licenses').select('*', { count: 'exact', head: true }).eq('status', 'expired'),
    supabase.from('business_licenses').select('*', { count: 'exact', head: true }).eq('status', 'suspended'),
  ]);

  // New vs Renewal counts
  const [newRes, renewRes] = await Promise.all([
    supabase.from('business_licenses').select('*', { count: 'exact', head: true }).eq('category', 'New'),
    supabase.from('business_licenses').select('*', { count: 'exact', head: true }).eq('category', 'Renew'),
  ]);

  return {
    total: totalRes.count || 0,
    active: activeRes.count || 0,
    expired: expiredRes.count || 0,
    suspended: suspendedRes.count || 0,
    newLicenses: newRes.count || 0,
    renewals: renewRes.count || 0,
  };
}

export async function fetchBusinessTypeBreakdown() {
  const { data, error } = await supabase
    .from('business_licenses')
    .select('business_type')
    .eq('status', 'active')
    .not('business_type', 'is', null)
    .limit(1000);
  if (error) throw error;

  const typeMap: Record<string, number> = {};
  (data || []).forEach(r => {
    const t = r.business_type || 'Other';
    typeMap[t] = (typeMap[t] || 0) + 1;
  });

  // Extrapolate to full active count
  const sampleSize = data?.length || 1;
  const totalActive = (await supabase.from('business_licenses').select('*', { count: 'exact', head: true }).eq('status', 'active')).count || sampleSize;
  const scale = totalActive / sampleSize;

  return Object.entries(typeMap)
    .map(([type, count]) => ({ type, count: Math.round(count * scale) }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 12);
}

export async function fetchLicenseIssuanceTrends() {
  const { data, error } = await supabase
    .from('business_licenses')
    .select('issue_date, category')
    .not('issue_date', 'is', null)
    .order('issue_date', { ascending: true });
  if (error) throw error;

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const grouped: Record<string, { newLic: number; renewals: number; year: number; month: string }> = {};

  (data || []).forEach(r => {
    const d = new Date(r.issue_date!);
    const y = d.getFullYear();
    const m = d.getMonth();
    const key = `${y}-${String(m).padStart(2, '0')}`;
    if (!grouped[key]) grouped[key] = { newLic: 0, renewals: 0, year: y, month: monthNames[m] };
    if (r.category === 'New') grouped[key].newLic += 1;
    else grouped[key].renewals += 1;
  });

  return Object.entries(grouped)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-18)
    .map(([, v]) => ({
      month: v.month,
      year: v.year,
      newLicenses: v.newLic,
      renewals: v.renewals,
      total: v.newLic + v.renewals,
    }));
}
