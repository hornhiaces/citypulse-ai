import { useQuery } from '@tanstack/react-query';
import { districtScores as fallbackDistricts } from '@/lib/mockData';
import {
  fetchEmergencyCalls,
  fetchEmergencyCallsByDistrict,
} from '@/services/emergencyCallService';
import {
  fetchServiceRequests,
  fetchServiceRequestStats,
  fetchServiceRequestTrends,
} from '@/services/serviceRequestService';
import type { DistrictScore, ScoreLevel } from '@/lib/mockData';

export function mapDbDistricts(dbDistricts: any[]): DistrictScore[] {
  return dbDistricts.map(d => ({
    district: d.district,
    name: d.district_name,
    publicSafetyPressure: (d.public_safety_pressure || 'MEDIUM') as ScoreLevel,
    infrastructureStress: (d.infrastructure_stress || 'MEDIUM') as ScoreLevel,
    emergencyDemand: (d.emergency_demand || 'STABLE') as ScoreLevel,
    economicActivity: (d.economic_activity || 'MEDIUM') as ScoreLevel,
    citizenConfidence: (d.citizen_confidence || 'STABLE') as ScoreLevel,
    population: d.population || 0,
    area: d.area || '',
  }));
}

// MVP Mode: Return hardcoded districts - no Supabase wiring for districts yet
export function useDistrictScores() {
  return {
    districts: fallbackDistricts,
    isLoading: false,
    error: null,
  };
}

// Real React Query hook - calls fetchServiceRequestStats service
export function useServiceRequestStats() {
  const query = useQuery({
    queryKey: ['serviceRequestStats'],
    queryFn: fetchServiceRequestStats,
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    error: query.error,
  };
}

// Real React Query hook - calls fetchEmergencyCalls service
export function useEmergencyCalls() {
  const query = useQuery({
    queryKey: ['emergencyCalls'],
    queryFn: () => fetchEmergencyCalls(),
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    error: query.error,
  };
}

// Real React Query hook - calls fetchEmergencyCallsByDistrict service
export function useEmergencyCallsByDistrict() {
  const query = useQuery({
    queryKey: ['emergencyCallsByDistrict'],
    queryFn: fetchEmergencyCallsByDistrict,
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    error: query.error,
  };
}

// Real React Query hook - calls fetchServiceRequestTrends service
export function useServiceRequestTrends() {
  const query = useQuery({
    queryKey: ['serviceRequestTrends'],
    queryFn: fetchServiceRequestTrends,
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    error: query.error,
  };
}

// MVP Mode - not converted yet
export function useBusinessLicenseStats() {
  return {
    data: {
      total: 66278,
      active: 62134,
      expired: 3245,
      suspended: 899,
    },
    isLoading: false,
    error: null,
  };
}

// MVP Mode - not converted yet
export function useBusinessLicenses() {
  return {
    data: [],
    isLoading: false,
    error: null,
  };
}

// Helper function for service tests (not converted - uses fetchServiceRequests)
export async function fetchAllServiceRequests(filters?: { district?: number; status?: string; category?: string }) {
  return fetchServiceRequests(filters);
}

