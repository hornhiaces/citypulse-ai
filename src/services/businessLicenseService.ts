import { supabase } from '@/integrations/supabase/client';

export async function fetchBusinessLicenses(filters?: { district?: number; status?: string }) {
  let query = supabase.from('business_licenses').select('*');
  if (filters?.district) query = query.eq('district', filters.district);
  if (filters?.status) query = query.eq('status', filters.status);
  const { data, error } = await query.order('business_name').limit(1000);
  if (error) throw error;
  return data;
}

export async function fetchBusinessLicenseStats() {
  // Single query to pre-aggregated view instead of 6 round-trips
  const { data, error } = await supabase
    .from('vw_business_license_stats' as any)
    .select('*')
    .limit(1);

  if (error) throw error;
  const s = (data as any[])?.[0] || {};

  return {
    total: Number(s.total) || 0,
    active: Number(s.active_count) || 0,
    expired: Number(s.expired_count) || 0,
    suspended: Number(s.suspended_count) || 0,
    newLicenses: Number(s.new_count) || 0,
    renewals: Number(s.renew_count) || 0,
  };
}

export async function fetchBusinessTypeBreakdown() {
  // Single query to pre-aggregated view instead of sampling + extrapolating
  const { data, error } = await supabase
    .from('vw_business_type_breakdown' as any)
    .select('business_type, count');

  if (error) throw error;

  return ((data as any[]) || []).map((r: any) => ({
    type: r.business_type,
    count: Number(r.count),
  }));
}

export async function fetchLicenseIssuanceTrends() {
  // Single query to pre-aggregated view instead of fetching all rows
  const { data, error } = await supabase
    .from('vw_license_issuance_trends' as any)
    .select('month, year, month_num, new_licenses, renewals, total')
    .order('year', { ascending: true })
    .order('month_num', { ascending: true });

  if (error) throw error;
  if (!data || data.length === 0) return [];

  // Take last 18 months
  const rows = (data as any[]).slice(-18);

  return rows.map((r: any) => ({
    month: r.month,
    year: r.year,
    newLicenses: Number(r.new_licenses),
    renewals: Number(r.renewals),
    total: Number(r.total),
  }));
}
