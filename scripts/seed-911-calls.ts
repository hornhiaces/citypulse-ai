import { createClient } from '@supabase/supabase-js';

// Hard-coded 911 emergency calls data (aggregated from CSV)
const callsData = [
  // January
  { year: 2025, month: 'January', district: 1, call_type: 'Emergency', call_count: 22575 },
  { year: 2025, month: 'January', district: 1, call_type: 'Non-Emergency', call_count: 12213 },

  // February
  { year: 2025, month: 'February', district: 1, call_type: 'Emergency', call_count: 21847 },
  { year: 2025, month: 'February', district: 1, call_type: 'Non-Emergency', call_count: 10984 },

  // March
  { year: 2025, month: 'March', district: 1, call_type: 'Emergency', call_count: 24710 },
  { year: 2025, month: 'March', district: 1, call_type: 'Non-Emergency', call_count: 11628 },

  // April
  { year: 2025, month: 'April', district: 1, call_type: 'Emergency', call_count: 24299 },
  { year: 2025, month: 'April', district: 1, call_type: 'Non-Emergency', call_count: 11864 },

  // May
  { year: 2025, month: 'May', district: 1, call_type: 'Emergency', call_count: 25954 },
  { year: 2025, month: 'May', district: 1, call_type: 'Non-Emergency', call_count: 12945 },

  // June
  { year: 2025, month: 'June', district: 1, call_type: 'Emergency', call_count: 25088 },
  { year: 2025, month: 'June', district: 1, call_type: 'Non-Emergency', call_count: 11820 },

  // July
  { year: 2025, month: 'July', district: 1, call_type: 'Emergency', call_count: 28973 },
  { year: 2025, month: 'July', district: 1, call_type: 'Non-Emergency', call_count: 13906 },
];

async function seedCalls() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    console.log(`Seeding ${callsData.length} 911 call records...`);

    const { data, error } = await supabase
      .from('calls_911_monthly')
      .upsert(callsData, { onConflict: 'month,year,district,call_type' });

    if (error) {
      console.error('Error seeding calls:', error);
      throw error;
    }

    console.log(`✅ Successfully seeded ${callsData.length} 911 call records`);
    console.log(data);
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  }
}

seedCalls();
