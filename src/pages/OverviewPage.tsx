import { PageHeader } from '@/components/PageHeader';
import { KpiCard } from '@/components/KpiCard';
import { DistrictScoreCard } from '@/components/DistrictScoreCard';
import { RecommendationCard } from '@/components/RecommendationCard';
import { TrendChart } from '@/components/TrendChart';
import { ServiceRequestTrendChart } from '@/components/ServiceRequestTrendChart';
import { CategoryBreakdown } from '@/components/CategoryBreakdown';
import { DistrictEmergencyChart } from '@/components/DistrictEmergencyChart';
import { useMode } from '@/lib/modeContext';
import { executiveKpis, citizenKpis, recommendations as fallbackRecs } from '@/lib/mockData';
import { useQuery } from '@tanstack/react-query';
import { fetchRecommendations } from '@/services/recommendationService';
import { useDistrictScores, useEmergencyCalls, useEmergencyCallsByDistrict, useServiceRequestStats, useServiceRequestTrends } from '@/hooks/useDistrictData';
import { DemoScenarios } from '@/components/DemoScenarios';
import { AiInsightPanel } from '@/components/AiInsightPanel';
import { AskYourCity } from '@/components/AskYourCity';
import { ForecastSummarySection } from '@/components/ForecastSummarySection';
import { StrategicActionsSection } from '@/components/StrategicActionsSection';
import { DataSourcesPanel } from '@/components/DataSourcesPanel';

export default function OverviewPage() {
  const { isLeadership } = useMode();
  const kpis = isLeadership ? executiveKpis : citizenKpis;
  const { districts } = useDistrictScores();
  const { data: emergencyCalls, isLoading: ec911Loading, isError: ec911Error } = useEmergencyCalls();
  const { data: districtCalls, isLoading: districtLoading, isError: districtError } = useEmergencyCallsByDistrict();
  const { data: requestStats } = useServiceRequestStats();
  const { data: trendData311Raw, isLoading: trends311Loading, isError: trends311Error } = useServiceRequestTrends();

  const { data: dbRecs } = useQuery({
    queryKey: ['recommendations'],
    queryFn: fetchRecommendations,
  });

  const recommendations = dbRecs?.length
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

  // Build 911 trend data from emergency calls (already has normalized months)
  const trendData911 = (() => {
    if (!emergencyCalls?.length) return undefined;
    const grouped: Record<string, { total: number; year: number; month: string }> = {};
    emergencyCalls.forEach(c => {
      const key = `${c.year}-${c.month}`;
      if (!grouped[key]) grouped[key] = { total: 0, year: c.year, month: c.month };
      grouped[key].total += c.call_count || 0;
    });
    return Object.entries(grouped)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, v]) => ({ month: v.month, year: v.year, calls911: v.total }));
  })();



  return (
    <>
      <PageHeader
        title={isLeadership ? 'Executive Operations Overview' : 'Montgomery City Dashboard'}
        subtitle={isLeadership ? 'Real-time municipal intelligence for Montgomery, AL' : 'Understand how your city is performing'}
        badge={isLeadership ? 'Command Center' : 'Live Data'}
      />

      <div className={`grid gap-3 mb-6 ${isLeadership ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'}`}>
        {kpis.map((kpi, i) => (
          <KpiCard key={kpi.label} data={kpi} index={i} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <AiInsightPanel />
        <AskYourCity />
      </div>

       <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
         <div className="min-h-[280px]">
           <TrendChart title={isLeadership ? '911 Emergency Call Volume' : 'Emergency Call Trends'} dataKey="calls911" color="hsl(350 72% 55%)" description="Monthly emergency call volume across Montgomery" data={trendData911} showForecast={isLeadership} isLoading={ec911Loading} isError={ec911Error} />
         </div>
         <div className="min-h-[280px]">
           <ServiceRequestTrendChart data={trendData311Raw} isLoading={trends311Loading} isError={trends311Error} showForecast={isLeadership} />
         </div>
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
         <div className="min-h-[280px]">
           <DistrictEmergencyChart data={districtCalls} isLoading={districtLoading} isError={districtError} />
         </div>
         <div className="min-h-[280px]">
           <CategoryBreakdown data={requestStats?.categoryBreakdown} />
         </div>
       </div>

       <div className="mb-6">
         <h2 className="text-lg font-semibold text-foreground mb-3">
           {isLeadership ? 'Priority Districts' : 'Districts Needing Attention'}
         </h2>
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
           {priorityDistricts.length > 0 ? priorityDistricts.map((d, i) => (
             <DistrictScoreCard key={d.district} data={d} index={i} />
           )) : (
             <p className="text-sm text-muted-foreground col-span-full">No priority districts detected at this time.</p>
           )}
         </div>
       </div>

       {isLeadership && (
         <div className="mb-6 space-y-4">
           <ForecastSummarySection />
           <StrategicActionsSection />
         </div>
       )}

       {isLeadership && (
         <div className="space-y-6">
           <div>
             <h2 className="text-lg font-semibold text-foreground mb-3">Active Recommendations</h2>
             <div className="space-y-3">
               {recommendations.slice(0, 2).map((r, i) => (
                 <RecommendationCard key={r.id} data={r} index={i} />
               ))}
             </div>
           </div>
           <DemoScenarios />
         </div>
       )}
    </>
  );
}
