// Hardcoded data for MVP - bypasses Supabase temporarily
// This will be replaced with real data once Supabase connection is fixed

export const hardcodedEmergencyCalls = [
  { month: 'Jan', year: 2024, call_count: 1289, district: 1, avg_response_minutes: 4.2, priority_1_count: 45, change_pct: 0 },
  { month: 'Feb', year: 2024, call_count: 1356, district: 1, avg_response_minutes: 4.1, priority_1_count: 52, change_pct: 5.2 },
  { month: 'Mar', year: 2024, call_count: 1423, district: 1, avg_response_minutes: 4.3, priority_1_count: 58, change_pct: 5.0 },
  { month: 'Apr', year: 2024, call_count: 1567, district: 1, avg_response_minutes: 4.5, priority_1_count: 68, change_pct: 10.1 },
  { month: 'May', year: 2024, call_count: 1634, district: 1, avg_response_minutes: 4.4, priority_1_count: 72, change_pct: 4.3 },
  { month: 'Jun', year: 2024, call_count: 1712, district: 1, avg_response_minutes: 4.6, priority_1_count: 81, change_pct: 4.8 },
  { month: 'Jul', year: 2024, call_count: 1823, district: 1, avg_response_minutes: 4.7, priority_1_count: 89, change_pct: 6.5 },
  { month: 'Aug', year: 2024, call_count: 1756, district: 1, avg_response_minutes: 4.5, priority_1_count: 85, change_pct: -3.7 },
  { month: 'Sep', year: 2024, call_count: 1891, district: 1, avg_response_minutes: 4.8, priority_1_count: 92, change_pct: 7.7 },
  { month: 'Oct', year: 2024, call_count: 1978, district: 1, avg_response_minutes: 4.9, priority_1_count: 98, change_pct: 4.6 },
  { month: 'Nov', year: 2024, call_count: 2134, district: 1, avg_response_minutes: 5.1, priority_1_count: 108, change_pct: 8.0 },
  { month: 'Dec', year: 2024, call_count: 2289, district: 1, avg_response_minutes: 5.2, priority_1_count: 118, change_pct: 7.2 },
];

export const hardcodedServiceRequestTrends = [
  { month: 'Jan', requests311: 8234 },
  { month: 'Feb', requests311: 8567 },
  { month: 'Mar', requests311: 9123 },
  { month: 'Apr', requests311: 10456 },
  { month: 'May', requests311: 11234 },
  { month: 'Jun', requests311: 12890 },
  { month: 'Jul', requests311: 14567 },
  { month: 'Aug', requests311: 13456 },
  { month: 'Sep', requests311: 15234 },
  { month: 'Oct', requests311: 16789 },
  { month: 'Nov', requests311: 18234 },
  { month: 'Dec', requests311: 19567 },
];

export const hardcodedEmergencyCallsByDistrict = [
  { district: 'D1', calls: 2289, change: 7.2 },
  { district: 'D2', calls: 1956, change: 4.8 },
  { district: 'D3', calls: 867, change: -2.3 },
  { district: 'D4', calls: 1432, change: 1.9 },
  { district: 'D5', calls: 2145, change: 9.6 },
  { district: 'D6', calls: 934, change: -1.2 },
  { district: 'D7', calls: 567, change: -3.8 },
  { district: 'D8', calls: 1823, change: 6.5 },
  { district: 'D9', calls: 678, change: -0.5 },
];

export const hardcodedServiceRequestStats = {
  total: 177830,
  open: 2847,
  resolved: 130456,
  highPriority: 892,
  categoryBreakdown: [
    { category: 'Nuisance', count: 45234, percentage: 25.4 },
    { category: 'Inquiries', count: 31290, percentage: 17.6 },
    { category: 'Ask 3-1-1', count: 28456, percentage: 16.0 },
    { category: 'Exchange Damage Container', count: 18934, percentage: 10.6 },
    { category: 'Parking On Front Lawn', count: 12567, percentage: 7.1 },
    { category: 'Street Cleaning', count: 9876, percentage: 5.5 },
    { category: 'Pothole', count: 8234, percentage: 4.6 },
    { category: 'Graffiti', count: 6789, percentage: 3.8 },
  ],
};

export const hardcodedBusinessLicenseStats = {
  total: 66278,
  active: 62134,
  expired: 3245,
  suspended: 899,
};
