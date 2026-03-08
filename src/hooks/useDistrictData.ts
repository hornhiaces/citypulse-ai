import { useQuery } from '@tanstack/react-query';
import { fetchDistrictScores } from '@/services/districtService';
import { fetchServiceRequestStats, fetchServiceRequestTrends } from '@/services/serviceRequestService';
import { fetchEmergencyCalls, fetchEmergencyCallsByDistrict } from '@/services/emergencyCallService';
import { fetchBusinessLicenseStats, fetchBusinessLicenses } from '@/services/businessLicenseService';
import { districtScores as fallbackDistricts } from '@/lib/mockData';
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

export function useDistrictScores() {
  const { data: dbDistricts, isLoading, error } = useQuery({
    queryKey: ['district-scores'],
    queryFn: fetchDistrictScores,
  });

  const districts = dbDistricts?.length ? mapDbDistricts(dbDistricts) : fallbackDistricts;
  return { districts, isLoading, error };
}

export function useServiceRequestStats() {
  const query = useQuery({
    queryKey: ['service-request-stats'],
    queryFn: fetchServiceRequestStats,
  });
  return { ...query, data: query.data || null };
}

export function useEmergencyCalls() {
  const query = useQuery({
    queryKey: ['emergency-calls'],
    queryFn: () => fetchEmergencyCalls(),
  });
  return { ...query, data: query.data || null };
}

export function useEmergencyCallsByDistrict() {
  const query = useQuery({
    queryKey: ['emergency-calls-by-district'],
    queryFn: fetchEmergencyCallsByDistrict,
  });
  return { ...query, data: query.data || null };
}

export function useBusinessLicenseStats() {
  const query = useQuery({
    queryKey: ['business-license-stats'],
    queryFn: fetchBusinessLicenseStats,
  });
  return { ...query, data: query.data || null };
}

export function useBusinessLicenses() {
  const query = useQuery({
    queryKey: ['business-licenses'],
    queryFn: () => fetchBusinessLicenses(),
  });
  return { ...query, data: query.data || null };
}

export function useServiceRequestTrends() {
  const query = useQuery({
    queryKey: ['service-request-trends'],
    queryFn: fetchServiceRequestTrends,
  });
  return { ...query, data: query.data || null };
}
