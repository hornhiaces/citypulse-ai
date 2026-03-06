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
  const { data, error } = await supabase
    .from('business_licenses')
    .select('status, district, category');
  if (error) throw error;

  const active = data.filter(l => l.status === 'active').length;
  const expired = data.filter(l => l.status === 'expired').length;
  const suspended = data.filter(l => l.status === 'suspended').length;

  return { total: data.length, active, expired, suspended };
}
