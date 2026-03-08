import { supabase } from '@/integrations/supabase/client';

export async function fetchServiceRequests(filters?: { district?: number; status?: string; category?: string }) {
  let query = supabase.from('service_requests_311').select('*');
  if (filters?.district) query = query.eq('district', filters.district);
  if (filters?.status) query = query.eq('status', filters.status);
  if (filters?.category) query = query.eq('category', filters.category);
  const { data, error } = await query.order('created_date', { ascending: false });
  if (error) throw error;
  return data;
}

export async function fetchServiceRequestStats() {
  const { data, error } = await supabase
    .from('service_requests_311')
    .select('category, status, district, priority');
  if (error) throw error;

  const total = data.length;
  const open = data.filter(r => r.status === 'open').length;
  const resolved = data.filter(r => r.status === 'resolved').length;
  const highPriority = data.filter(r => r.priority === 'high').length;

  // Category breakdown
  const categories: Record<string, number> = {};
  data.forEach(r => {
    categories[r.category] = (categories[r.category] || 0) + 1;
  });
  const categoryBreakdown = Object.entries(categories)
    .map(([category, count]) => ({ category, count, percentage: Math.round((count / total) * 1000) / 10 }))
    .sort((a, b) => b.count - a.count);

  return { total, open, resolved, highPriority, categoryBreakdown };
}

/**
 * Fetch 311 service requests aggregated by month for trend charts.
 * Returns the latest 12 months of data in { month: "Jan", requests311: N } format.
 */
export async function fetchServiceRequestTrends() {
  // Use raw SQL via RPC isn't available, so we fetch recent data and aggregate client-side
  const { data, error } = await supabase
    .from('service_requests_311')
    .select('created_date')
    .gte('created_date', '2024-01-01')
    .order('created_date', { ascending: true });

  if (error) throw error;
  if (!data?.length) return [];

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const grouped: Record<string, number> = {};

  data.forEach(r => {
    const d = new Date(r.created_date);
    const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, '0')}`;
    grouped[key] = (grouped[key] || 0) + 1;
  });

  // Sort by key (year-month) and take last 12
  const sorted = Object.entries(grouped)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12);

  return sorted.map(([key, count]) => {
    const [, monthIdx] = key.split('-');
    return { month: monthNames[parseInt(monthIdx, 10)], requests311: count };
  });
}
