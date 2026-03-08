import { supabase } from '@/integrations/supabase/client';

export async function fetchServiceRequests(filters?: { district?: number; status?: string; category?: string }) {
  let query = supabase.from('service_requests_311').select('*');
  if (filters?.district) query = query.eq('district', filters.district);
  if (filters?.status) query = query.eq('status', filters.status);
  if (filters?.category) query = query.eq('category', filters.category);
  const { data, error } = await query.order('created_date', { ascending: false }).limit(1000);
  if (error) throw error;
  return data;
}

export async function fetchServiceRequestStats() {
  // Single query to pre-aggregated view instead of 5+ round-trips
  const [statsRes, categoryRes] = await Promise.all([
    supabase.from('vw_311_status_summary' as any).select('*').limit(1),
    supabase.from('vw_311_category_breakdown' as any).select('category, count, percentage'),
  ]);

  if (statsRes.error) throw statsRes.error;
  if (categoryRes.error) throw categoryRes.error;

  const s = (statsRes.data as any[])?.[0] || {};
  const categoryBreakdown = ((categoryRes.data as any[]) || []).map((r: any) => ({
    category: r.category,
    count: Number(r.count),
    percentage: Number(r.percentage),
  }));

  return {
    total: Number(s.total) || 0,
    open: Number(s.open_count) || 0,
    resolved: Number(s.resolved_count) || 0,
    inProgress: Number(s.in_progress_count) || 0,
    highPriority: Number(s.high_priority_count) || 0,
    categoryBreakdown,
  };
}

export async function fetchServiceRequestTrends() {
  // Single query to pre-aggregated DB view
  const { data, error } = await supabase
    .from('vw_311_monthly_trends' as any)
    .select('month, year, month_num, requests_311, resolved, open')
    .order('year', { ascending: true })
    .order('month_num', { ascending: true });

  if (error) {
    console.error('Error fetching 311 trends:', error);
    throw error;
  }

  if (!data || data.length === 0) return [];

  const rows = (data as any[]).slice(-12);

  return rows.map((r: any) => {
    const resolutionRate = r.requests_311 > 0 ? Math.round((r.resolved / r.requests_311) * 100) : 0;
    return {
      month: r.month,
      year: r.year,
      requests311: r.requests_311,
      resolved: r.resolved,
      open: r.open,
      resolutionRate,
    };
  });
}
