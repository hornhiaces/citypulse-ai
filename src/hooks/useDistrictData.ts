import { districtScores as fallbackDistricts } from '@/lib/mockData';
import { hardcodedServiceRequestStats, hardcodedServiceRequestTrends, hardcodedEmergencyCalls, hardcodedEmergencyCallsByDistrict, hardcodedBusinessLicenseStats } from '@/lib/hardcodedData';
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

// MVP Mode: Return hardcoded data directly - no React Query
export function useDistrictScores() {
  return {
    districts: fallbackDistricts,
    isLoading: false,
    error: null,
  };
}

export function useServiceRequestStats() {
  return {
    data: hardcodedServiceRequestStats,
    isLoading: false,
    error: null,
  };
}

export function useEmergencyCalls() {
  return {
    data: hardcodedEmergencyCalls,
    isLoading: false,
    error: null,
  };
}

export function useEmergencyCallsByDistrict() {
  return {
    data: hardcodedEmergencyCallsByDistrict,
    isLoading: false,
    error: null,
  };
}

export function useBusinessLicenseStats() {
  return {
    data: hardcodedBusinessLicenseStats,
    isLoading: false,
    error: null,
  };
}

export function useBusinessLicenses() {
  return {
    data: [],
    isLoading: false,
    error: null,
  };
}

export function useServiceRequestTrends() {
  return {
    data: hardcodedServiceRequestTrends,
    isLoading: false,
    error: null,
  };
}
