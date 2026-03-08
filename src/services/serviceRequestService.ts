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
  // Fetch only the columns we need with a date filter, paginate to get enough data
  const PAGE_SIZE = 1000;
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const grouped: Record<string, { total: number; resolved: number; open: number }> = {};

  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await supabase
      .from('service_requests_311')
      .select('created_date, status')
      .gte('created_date', '2024-01-01')
      .order('created_date', { ascending: true })
      .range(offset, offset + PAGE_SIZE - 1);

    if (error) {
      console.error('Error fetching 311 trends:', error);
      throw error;
    }

    if (!data || data.length === 0) {
      hasMore = false;
    } else {
      data.forEach(r => {
        const d = new Date(r.created_date);
        const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, '0')}`;
        if (!grouped[key]) grouped[key] = { total: 0, resolved: 0, open: 0 };
        grouped[key].total += 1;
        if (r.status === 'resolved') grouped[key].resolved += 1;
        else grouped[key].open += 1;
      });
      offset += PAGE_SIZE;
      if (data.length < PAGE_SIZE) hasMore = false;
    }
  }

  if (Object.keys(grouped).length === 0) return [];

  const sorted = Object.entries(grouped)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12);

  return sorted.map(([key, counts]) => {
    const [, monthIdx] = key.split('-');
    const resolutionRate = counts.total > 0 ? Math.round((counts.resolved / counts.total) * 100) : 0;
    return {
      month: monthNames[parseInt(monthIdx, 10)],
      requests311: counts.total,
      resolved: counts.resolved,
      open: counts.open,
      resolutionRate,
    };
  });
}
