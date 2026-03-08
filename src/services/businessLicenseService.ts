import { supabase } from '@/integrations/supabase/client';
import { hardcodedBusinessLicenseStats } from '@/lib/hardcodedData';

export async function fetchBusinessLicenses(filters?: { district?: number; status?: string }) {
  try {
    let query = supabase.from('business_licenses').select('*');
    if (filters?.district) query = query.eq('district', filters.district);
    if (filters?.status) query = query.eq('status', filters.status);
    const { data, error } = await query.order('business_name');
    if (error) throw error;
    if (data?.length) return data;
  } catch (e) {
    console.log('⚠️ Using hardcoded data for business licenses');
  }
  return [];
}

export async function fetchBusinessLicenseStats() {
  try {
    const { data, error } = await supabase
      .from('business_licenses')
      .select('status, district, category');
    if (error) throw error;
    if (data?.length) {
      const active = data.filter(l => l.status === 'active').length;
      const expired = data.filter(l => l.status === 'expired').length;
      const suspended = data.filter(l => l.status === 'suspended').length;
      return { total: data.length, active, expired, suspended };
    }
  } catch (e) {
    console.log('⚠️ Using hardcoded data for business license stats');
  }
  return hardcodedBusinessLicenseStats;
}
