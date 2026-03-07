import { PageHeader } from '@/components/PageHeader';
import { KpiCard } from '@/components/KpiCard';
import { TrendChart } from '@/components/TrendChart';
import { DistrictEmergencyChart } from '@/components/DistrictEmergencyChart';
import { DistrictScoreCard } from '@/components/DistrictScoreCard';
import { useMode } from '@/lib/modeContext';
import { useDistrictScores, useEmergencyCalls, useEmergencyCallsByDistrict } from '@/hooks/useDistrictData';
import type { KpiData } from '@/lib/mockData';
import { Skeleton } from '@/components/ui/skeleton';

export default function SafetyPage() {
  const { isLeadership } = useMode();
  const { districts, isLoading: districtsLoading } = useDistrictScores();
  const { data: emergencyCalls, isLoading: callsLoading } = useEmergencyCalls();
  const { data: districtCalls, isLoading: districtCallsLoading } = useEmergencyCallsByDistrict();

  // Compute KPIs from live data
  const safetyKpis: KpiData[] = (() => {
    if (!emergencyCalls?.length) {
      return [
        { label: '911 Calls (30d)', value: '—', change: 0, trend: 'stable' as const, icon: 'phone' },
        { label: 'Avg Response Time', value: '—', change: 0, trend: 'stable' as const, icon: 'clock' },
        { label: 'High-Risk Districts', value: '—', change: 0, trend: 'stable' as const, icon: 'alert' },
        { label: 'Active Incidents', value: '—', change: 0, trend: 'stable' as const, icon: 'alert' },
      ];
    }

    const latestCalls = emergencyCalls.filter(c => c.month === 'Mar' && c.year === 2025);
    const prevCalls = emergencyCalls.filter(c => c.month === 'Feb' && c.year === 2025);
    const totalCurrent = latestCalls.reduce((s, c) => s + (c.call_count || 0), 0);
    const totalPrev = prevCalls.reduce((s, c) => s + (c.call_count || 0), 0);
    const changePct = totalPrev ? Math.round(((totalCurrent - totalPrev) / totalPrev) * 100 * 10) / 10 : 0;

    const avgResponse = latestCalls.filter(c => c.avg_response_minutes).reduce((s, c) => s + (c.avg_response_minutes || 0), 0) / (latestCalls.filter(c => c.avg_response_minutes).length || 1);

    const highRiskCount = districts.filter(d => d.publicSafetyPressure === 'HIGH').length;

    return [
      { label: '911 Calls (30d)', value: totalCurrent.toLocaleString(), change: changePct, trend: changePct > 0 ? 'up' as const : changePct < 0 ? 'down' as const : 'stable' as const, icon: 'phone' },
      { label: 'Avg Response Time', value: `${avgResponse.toFixed(1)} min`, change: 0, trend: 'stable' as const, icon: 'clock' },
      { label: 'High-Risk Districts', value: String(highRiskCount), change: 0, trend: 'stable' as const, icon: 'alert' },
      { label: 'P1 Incidents', value: latestCalls.reduce((s, c) => s + (c.priority_1_count || 0), 0).toLocaleString(), change: 0, trend: 'stable' as const, icon: 'alert' },
    ];
  })();

  // Build trend data from live calls
  const trendData = (() => {
    if (!emergencyCalls?.length) return undefined;
    const monthOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const grouped: Record<string, number> = {};
    emergencyCalls.forEach(c => {
      const key = `${c.month}`;
      grouped[key] = (grouped[key] || 0) + (c.call_count || 0);
    });
    return monthOrder.filter(m => grouped[m] !== undefined).map(m => ({ month: m, calls911: grouped[m] || 0 }));
  })();

  const highRiskDistricts = districts.filter(d => d.publicSafetyPressure === 'HIGH');

  return (
    <>
      <PageHeader
        title={isLeadership ? 'Public Safety Intelligence' : 'Public Safety Overview'}
        subtitle={isLeadership ? 'Emergency demand analysis and resource allocation intelligence' : 'Understand safety conditions across Montgomery'}
        badge="Public Safety"
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {safetyKpis.map((k, i) => <KpiCard key={k.label} data={k} index={i} />)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <TrendChart title="Emergency Call Volume Trend" dataKey="calls911" color="hsl(350 72% 55%)" data={trendData} />
        <DistrictEmergencyChart data={districtCalls} />
      </div>

      <h2 className="text-lg font-semibold text-foreground mb-3">
        {isLeadership ? 'High-Risk Districts' : 'Areas of Concern'}
      </h2>
      {districtsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3].map(i => <Skeleton key={i} className="h-48 rounded-xl" />)}
        </div>
      ) : highRiskDistricts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {highRiskDistricts.map((d, i) => <DistrictScoreCard key={d.district} data={d} index={i} />)}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No high-risk districts detected.</p>
      )}
    </>
  );
}
