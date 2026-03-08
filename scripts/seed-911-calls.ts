import { createClient } from '@supabase/supabase-js';

// Hard-coded 911 emergency calls data (as CSV-like records)
const callsRecords = [
  { year: 2025, month: 'January', district: 1, call_type: 'Emergency', call_count: 22575 },
  { year: 2025, month: 'January', district: 1, call_type: 'Non-Emergency', call_count: 12213 },
  { year: 2025, month: 'February', district: 1, call_type: 'Emergency', call_count: 21847 },
  { year: 2025, month: 'February', district: 1, call_type: 'Non-Emergency', call_count: 10984 },
  { year: 2025, month: 'March', district: 1, call_type: 'Emergency', call_count: 24710 },
  { year: 2025, month: 'March', district: 1, call_type: 'Non-Emergency', call_count: 11628 },
  { year: 2025, month: 'April', district: 1, call_type: 'Emergency', call_count: 24299 },
  { year: 2025, month: 'April', district: 1, call_type: 'Non-Emergency', call_count: 11864 },
  { year: 2025, month: 'May', district: 1, call_type: 'Emergency', call_count: 25954 },
  { year: 2025, month: 'May', district: 1, call_type: 'Non-Emergency', call_count: 12945 },
  { year: 2025, month: 'June', district: 1, call_type: 'Emergency', call_count: 25088 },
  { year: 2025, month: 'June', district: 1, call_type: 'Non-Emergency', call_count: 11820 },
  { year: 2025, month: 'July', district: 1, call_type: 'Emergency', call_count: 28973 },
  { year: 2025, month: 'July', district: 1, call_type: 'Non-Emergency', call_count: 13906 },
];

async function seedCalls() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY in .env');
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    console.log(`Seeding ${callsRecords.length} 911 call records via edge function...`);

    // Call the same edge function that the UI uses for uploads
    const { data, error } = await supabase.functions.invoke('ingest-dataset', {
      body: {
        dataset: '911',
        columns: ['year', 'month', 'district', 'call_type', 'call_count'],
        records: callsRecords,
      },
    });

    if (error) {
      console.error('Error seeding calls:', error);
      throw error;
    }

    console.log(`✅ Successfully seeded 911 call records`);
    console.log('Response:', data);
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  }
}

seedCalls();
