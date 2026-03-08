import { useQuery } from '@tanstack/react-query';
import { fetchDistrictScores } from '@/services/districtService';
import { fetchServiceRequestStats, fetchServiceRequestTrends } from '@/services/serviceRequestService';
import { fetchEmergencyCalls, fetchEmergencyCallsByDistrict } from '@/services/emergencyCallService';
import { fetchBusinessLicenseStats, fetchBusinessLicenses, fetchBusinessTypeBreakdown, fetchLicenseIssuanceTrends } from '@/services/businessLicenseService';
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
  const { data: dbDistricts, isLoading } = useQuery({
    queryKey: ['district-scores'],
    queryFn: fetchDistrictScores,
  });

  const districts = dbDistricts?.length ? mapDbDistricts(dbDistricts) : fallbackDistricts;
  return { districts, isLoading };
}

export function useServiceRequestStats() {
  return useQuery({
    queryKey: ['service-request-stats'],
    queryFn: fetchServiceRequestStats,
  });
}

export function useServiceRequestTrends() {
  return useQuery({
    queryKey: ['service-request-trends'],
    queryFn: fetchServiceRequestTrends,
  });
}

export function useEmergencyCalls() {
  return useQuery({
    queryKey: ['emergency-calls'],
    queryFn: () => fetchEmergencyCalls(),
  });
}

export function useEmergencyCallsByDistrict() {
  return useQuery({
    queryKey: ['emergency-calls-by-district'],
    queryFn: fetchEmergencyCallsByDistrict,
  });
}

export function useBusinessLicenseStats() {
  return useQuery({
    queryKey: ['business-license-stats'],
    queryFn: fetchBusinessLicenseStats,
  });
}

export function useBusinessLicenses() {
  return useQuery({
    queryKey: ['business-licenses'],
    queryFn: () => fetchBusinessLicenses(),
  });
}
