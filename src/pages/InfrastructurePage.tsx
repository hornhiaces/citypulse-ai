import { PageHeader } from '@/components/PageHeader';
import { KpiCard } from '@/components/KpiCard';
import { CategoryBreakdown } from '@/components/CategoryBreakdown';
import { ServiceRequestTrendChart } from '@/components/ServiceRequestTrendChart';
import { DistrictScoreCard } from '@/components/DistrictScoreCard';
import { useMode } from '@/lib/modeContext';
import { useDistrictScores, useServiceRequestStats, useServiceRequestTrends } from '@/hooks/useDistrictData';
import type { KpiData } from '@/lib/mockData';
import { Skeleton } from '@/components/ui/skeleton';

export default function InfrastructurePage() {
  const { isLeadership } = useMode();
  const { districts, isLoading: districtsLoading } = useDistrictScores();
  const { data: stats } = useServiceRequestStats();
  const { data: trendData311, isLoading: trendsLoading, isError: trendsError } = useServiceRequestTrends();

  const infraKpis: KpiData[] = (() => {
    if (!stats) {
      return [
        { label: 'Active 311 Requests', value: '—', change: 0, trend: 'stable' as const, icon: 'clipboard' },
        { label: 'Resolution Rate', value: '—', change: 0, trend: 'stable' as const, icon: 'check' },
        { label: 'High Priority', value: '—', change: 0, trend: 'stable' as const, icon: 'alert' },
        { label: 'Open Requests', value: '—', change: 0, trend: 'stable' as const, icon: 'clipboard' },
      ];
    }
    const resolutionRate = stats.total ? Math.round((stats.resolved / stats.total) * 1000) / 10 : 0;
    return [
      { label: 'Active 311 Requests', value: stats.total.toLocaleString(), change: 0, trend: 'stable' as const, icon: 'clipboard' },
      { label: 'Resolution Rate', value: `${resolutionRate}%`, change: 0, trend: 'stable' as const, icon: 'check' },
      { label: 'High Priority', value: stats.highPriority.toLocaleString(), change: 0, trend: 'stable' as const, icon: 'alert' },
      { label: 'Open Requests', value: stats.open.toLocaleString(), change: 0, trend: 'stable' as const, icon: 'clipboard' },
    ];
  })();

  
  const categoryData = stats?.categoryBreakdown;
  const stressedDistricts = districts.filter(d => d.infrastructureStress === 'HIGH');

  return (
    <>
      <PageHeader
        title={isLeadership ? 'Infrastructure Intelligence' : 'Infrastructure & Services'}
        subtitle={isLeadership ? 'Infrastructure stress analysis and maintenance prioritization' : 'Track infrastructure conditions and city services'}
        badge="Infrastructure"
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {infraKpis.map((k, i) => <KpiCard key={k.label} data={k} index={i} />)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <ServiceRequestTrendChart data={trendData311} isLoading={trendsLoading} isError={trendsError} />
        <CategoryBreakdown data={categoryData} />
      </div>

      <h2 className="text-lg font-semibold text-foreground mb-3">
        {isLeadership ? 'High-Stress Infrastructure Districts' : 'Areas with Infrastructure Concerns'}
      </h2>
      {districtsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3].map(i => <Skeleton key={i} className="h-48 rounded-xl" />)}
        </div>
      ) : stressedDistricts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {stressedDistricts.map((d, i) => <DistrictScoreCard key={d.district} data={d} index={i} />)}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No high-stress districts detected.</p>
      )}
    </>
  );
}
