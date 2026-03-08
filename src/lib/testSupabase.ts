// Test Supabase connection
import { supabase } from '@/integrations/supabase/client';

export async function testSupabaseConnection() {
  console.log('🔍 Testing Supabase connection...');
  console.log('URL:', import.meta.env.VITE_SUPABASE_URL);
  console.log('Key exists:', !!import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY);

  try {
    // Test 1: Check if tables exist
    const { data: calls, error: callsError } = await supabase
      .from('calls_911_monthly')
      .select('count')
      .limit(1);

    console.log('✅ calls_911_monthly:', callsError ? `❌ ${callsError.message}` : `✅ Found data`);

    // Test 2: Check 311 requests
    const { data: requests, error: requestsError } = await supabase
      .from('service_requests_311')
      .select('count')
      .limit(1);

    console.log('✅ service_requests_311:', requestsError ? `❌ ${requestsError.message}` : `✅ Found data`);

    // Test 3: Check business licenses
    const { data: licenses, error: licensesError } = await supabase
      .from('business_licenses')
      .select('count')
      .limit(1);

    console.log('✅ business_licenses:', licensesError ? `❌ ${licensesError.message}` : `✅ Found data`);

    // Test 4: Get actual row counts
    const { count: callsCount } = await supabase
      .from('calls_911_monthly')
      .select('*', { count: 'exact', head: true });

    const { count: requestsCount } = await supabase
      .from('service_requests_311')
      .select('*', { count: 'exact', head: true });

    const { count: licensesCount } = await supabase
      .from('business_licenses')
      .select('*', { count: 'exact', head: true });

    console.log(`
📊 Row Counts:
- calls_911_monthly: ${callsCount || '?'} rows
- service_requests_311: ${requestsCount || '?'} rows
- business_licenses: ${licensesCount || '?'} rows
    `);

    return { success: true, callsCount, requestsCount, licensesCount };
  } catch (error) {
    console.error('❌ Supabase test failed:', error);
    return { success: false, error };
  }
}
