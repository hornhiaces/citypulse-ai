import { PageHeader } from '@/components/PageHeader';
import { KpiCard } from '@/components/KpiCard';
import { DistrictScoreCard } from '@/components/DistrictScoreCard';
import { RecommendationCard } from '@/components/RecommendationCard';
import { TrendChart } from '@/components/TrendChart';
import { CategoryBreakdown } from '@/components/CategoryBreakdown';
import { DistrictEmergencyChart } from '@/components/DistrictEmergencyChart';
import { useMode } from '@/lib/modeContext';
import { executiveKpis, citizenKpis, districtScores, recommendations } from '@/lib/mockData';

export default function OverviewPage() {
  const { isLeadership } = useMode();
  const kpis = isLeadership ? executiveKpis : citizenKpis;
  const priorityDistricts = districtScores.filter(d => d.publicSafetyPressure === 'HIGH' || d.emergencyDemand === 'RISING');

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
