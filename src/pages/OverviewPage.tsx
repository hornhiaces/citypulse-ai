import { PageHeader } from '@/components/PageHeader';
import { KpiCard } from '@/components/KpiCard';
import { DistrictScoreCard } from '@/components/DistrictScoreCard';
import { RecommendationCard } from '@/components/RecommendationCard';
import { TrendChart } from '@/components/TrendChart';
import { CategoryBreakdown } from '@/components/CategoryBreakdown';
import { DistrictEmergencyChart } from '@/components/DistrictEmergencyChart';
import { useMode } from '@/lib/modeContext';
import { executiveKpis, citizenKpis } from '@/lib/mockData';
import { useQuery } from '@tanstack/react-query';
import { fetchDistrictScores } from '@/services/districtService';
import { fetchRecommendations } from '@/services/recommendationService';
import { districtScores as fallbackDistricts, recommendations as fallbackRecs } from '@/lib/mockData';

export default function OverviewPage() {
  const { isLeadership } = useMode();
  const kpis = isLeadership ? executiveKpis : citizenKpis;

  const { data: dbDistricts } = useQuery({
    queryKey: ['district-scores'],
    queryFn: fetchDistrictScores,
  });

  const { data: dbRecs } = useQuery({
    queryKey: ['recommendations'],
    queryFn: fetchRecommendations,
  });

  // Map DB rows to component format, fallback to mock
  const districts = dbDistricts
    ? dbDistricts.map(d => ({
        district: d.district,
        name: d.district_name,
        publicSafetyPressure: (d.public_safety_pressure || 'MEDIUM') as any,
        infrastructureStress: (d.infrastructure_stress || 'MEDIUM') as any,
        emergencyDemand: (d.emergency_demand || 'STABLE') as any,
        economicActivity: (d.economic_activity || 'MEDIUM') as any,
        citizenConfidence: (d.citizen_confidence || 'STABLE') as any,
        population: d.population || 0,
        area: d.area || '',
      }))
    : fallbackDistricts;

  const recommendations = dbRecs
    ? dbRecs.map(r => ({
        id: r.id,
        priority: r.priority as 'critical' | 'high' | 'medium',
        title: r.title,
        description: r.description,
        districts: r.districts || [],
        signals: r.signals || [],
        confidence: r.confidence || 0,
        category: r.category || '',
      }))
    : fallbackRecs;

  const priorityDistricts = districts.filter(d => d.publicSafetyPressure === 'HIGH' || d.emergencyDemand === 'RISING');

  return (
    <>
      <PageHeader
        title={isLeadership ? 'Executive Operations Overview' : 'Montgomery City Dashboard'}
        subtitle={isLeadership ? 'Real-time municipal intelligence for Montgomery, AL' : 'Understand how your city is performing'}
        badge={isLeadership ? 'Command Center' : 'Live Data'}
      />

      {/* KPIs */}
      <div className={`grid gap-3 mb-6 ${isLeadership ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-6' : 'grid-cols-2 lg:grid-cols-4'}`}>
        {kpis.map((kpi, i) => (
          <KpiCard key={kpi.label} data={kpi} index={i} />
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <TrendChart title={isLeadership ? '911 Emergency Call Volume' : 'Emergency Call Trends'} dataKey="calls911" color="hsl(350 72% 55%)" description="Monthly emergency call volume across Montgomery" />
        <TrendChart title={isLeadership ? '311 Service Request Volume' : 'Community Issue Reports'} dataKey="requests311" color="hsl(245 58% 60%)" description="Monthly service request submissions" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <DistrictEmergencyChart />
        <CategoryBreakdown />
      </div>

      {/* Priority Districts */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-foreground mb-3">
          {isLeadership ? 'Priority Districts' : 'Districts Needing Attention'}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {priorityDistricts.map((d, i) => (
            <DistrictScoreCard key={d.district} data={d} index={i} />
          ))}
        </div>
      </div>

      {/* Recommendations */}
      {isLeadership && (
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-3">Active Recommendations</h2>
          <div className="space-y-3">
            {recommendations.slice(0, 2).map((r, i) => (
              <RecommendationCard key={r.id} data={r} index={i} />
            ))}
          </div>
        </div>
      )}
    </>
  );
}
