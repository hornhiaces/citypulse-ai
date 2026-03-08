import { supabase } from '@/integrations/supabase/client';
import { hardcodedServiceRequestStats, hardcodedServiceRequestTrends } from '@/lib/hardcodedData';

export async function fetchServiceRequests(filters?: { district?: number; status?: string; category?: string }) {
  try {
    let query = supabase.from('service_requests_311').select('*');
    if (filters?.district) query = query.eq('district', filters.district);
    if (filters?.status) query = query.eq('status', filters.status);
    if (filters?.category) query = query.eq('category', filters.category);
    const { data, error } = await query.order('created_date', { ascending: false });
    if (error) throw error;
    if (data?.length) return data;
  } catch (e) {
    console.log('⚠️ Using hardcoded data for service requests');
  }
  return [];
}

export async function fetchServiceRequestStats() {
  try {
    const { data, error } = await supabase
      .from('service_requests_311')
      .select('category, status, district, priority');
    if (error) throw error;
    if (data?.length) {
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
  } catch (e) {
    console.log('⚠️ Using hardcoded data for service request stats');
  }
  return hardcodedServiceRequestStats;
}

export async function fetchServiceRequestTrends() {
  try {
    // Fetch all service requests with created_date to aggregate by month
    const { data, error } = await supabase
      .from('service_requests_311')
      .select('created_date');
    console.log('📋 fetchServiceRequestTrends:', { error: error?.message, rowCount: data?.length });
    if (error) throw error;
    if (!data?.length) return hardcodedServiceRequestTrends;

    // Group by month and count
    const monthMap: Record<string, number> = {};
    const monthOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    data.forEach(r => {
      if (!r.created_date) return;
      try {
        const date = new Date(r.created_date);
        const month = monthOrder[date.getMonth()];
        if (month) {
          monthMap[month] = (monthMap[month] || 0) + 1;
        }
      } catch (e) {
        // Skip invalid dates
      }
    });

    // Return as array sorted by month order
    const trends = monthOrder
      .filter(m => monthMap[m])
      .map(m => ({ month: m, requests311: monthMap[m] || 0 }));

    if (trends.length) return trends;
  } catch (e) {
    console.log('⚠️ Using hardcoded data for service request trends');
  }
  return hardcodedServiceRequestTrends;
}
