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
  // Use multiple targeted queries instead of fetching all 177K rows
  const [totalRes, statusRes, priorityRes, categoryRes] = await Promise.all([
    supabase.from('service_requests_311').select('*', { count: 'exact', head: true }),
    supabase.from('service_requests_311').select('*', { count: 'exact', head: true }).eq('status', 'open'),
    supabase.from('service_requests_311').select('*', { count: 'exact', head: true }).eq('priority', 'high'),
    // Fetch categories – limited to 1000 but gives us top categories
    supabase.from('service_requests_311').select('category').limit(1000),
  ]);

  const total = totalRes.count ?? 0;
  const open = statusRes.count ?? 0;

  // Get resolved count
  const resolvedRes = await supabase.from('service_requests_311').select('*', { count: 'exact', head: true }).eq('status', 'resolved');
  const resolved = resolvedRes.count ?? 0;
  const inProgress = total - open - resolved;
  const highPriority = priorityRes.count ?? 0;

  // For category breakdown, use a broader sample
  const categories: Record<string, number> = {};
  if (categoryRes.data) {
    categoryRes.data.forEach((r: any) => {
      categories[r.category] = (categories[r.category] || 0) + 1;
    });
  }
  const sampleTotal = categoryRes.data?.length || 1;
  const categoryBreakdown = Object.entries(categories)
    .map(([category, count]) => ({
      category,
      count: Math.round((count / sampleTotal) * total), // extrapolate to full dataset
      percentage: Math.round((count / sampleTotal) * 1000) / 10,
    }))
    .sort((a, b) => b.count - a.count);

  return { total, open, resolved, inProgress, highPriority, categoryBreakdown };
}

export async function fetchServiceRequestTrends() {
  // Use pre-aggregated DB view instead of fetching 178K rows client-side
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

  // Take last 12 months
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
