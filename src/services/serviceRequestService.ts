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

/** Fetch all rows in batches to bypass the 1000-row default limit */
async function fetchAllRows<T>(
  tableName: string,
  selectCols: string,
  filters?: Record<string, string>,
  orderCol = 'created_date',
): Promise<T[]> {
  const PAGE_SIZE = 1000;
  let offset = 0;
  let allData: T[] = [];
  let hasMore = true;

  while (hasMore) {
    let query = supabase.from(tableName).select(selectCols);
    if (filters) {
      for (const [key, value] of Object.entries(filters)) {
        query = query.gte(key, value);
      }
    }
    const { data, error } = await query
      .order(orderCol, { ascending: true })
      .range(offset, offset + PAGE_SIZE - 1);
    if (error) throw error;
    if (!data || data.length === 0) {
      hasMore = false;
    } else {
      allData = allData.concat(data as T[]);
      offset += PAGE_SIZE;
      if (data.length < PAGE_SIZE) hasMore = false;
    }
  }
  return allData;
}

export async function fetchServiceRequestStats() {
  const data = await fetchAllRows<{
    category: string; status: string | null; district: number | null; priority: string | null;
  }>('service_requests_311', 'category, status, district, priority');

  const total = data.length;
  const open = data.filter(r => r.status === 'open').length;
  const resolved = data.filter(r => r.status === 'resolved').length;
  const inProgress = data.filter(r => r.status === 'in_progress').length;
  const highPriority = data.filter(r => r.priority === 'high').length;

  const categories: Record<string, number> = {};
  data.forEach(r => {
    categories[r.category] = (categories[r.category] || 0) + 1;
  });
  const categoryBreakdown = Object.entries(categories)
    .map(([category, count]) => ({ category, count, percentage: Math.round((count / total) * 1000) / 10 }))
    .sort((a, b) => b.count - a.count);

  return { total, open, resolved, inProgress, highPriority, categoryBreakdown };
}

/**
 * Fetch 311 service requests aggregated by month with breakdown for rich charting.
 * Returns last 12 months: { month, requests311, resolved, open, resolutionRate }
 */
export async function fetchServiceRequestTrends() {
  const data = await fetchAllRows<{ created_date: string; status: string | null }>(
    'service_requests_311',
    'created_date, status',
    { created_date: '2024-01-01' },
  );

  if (!data?.length) return [];

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const grouped: Record<string, { total: number; resolved: number; open: number }> = {};

  data.forEach(r => {
    const d = new Date(r.created_date);
    const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, '0')}`;
    if (!grouped[key]) grouped[key] = { total: 0, resolved: 0, open: 0 };
    grouped[key].total += 1;
    if (r.status === 'resolved') grouped[key].resolved += 1;
    else grouped[key].open += 1;
  });

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
