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
  const { data: emergencyCalls, isLoading: callsLoading, isError: callsError } = useEmergencyCalls();
  const { data: districtCalls, isLoading: districtCallsLoading, isError: districtCallsError } = useEmergencyCallsByDistrict();

  // Compute KPIs from live data - use latest available month dynamically
  const safetyKpis: KpiData[] = (() => {
    if (!emergencyCalls?.length) {
      return [
        { label: '911 Calls (30d)', value: '—', change: 0, trend: 'stable' as const, icon: 'phone' },
        { label: 'Avg Response Time', value: '—', change: 0, trend: 'stable' as const, icon: 'clock' },
        { label: 'High-Risk Districts', value: '—', change: 0, trend: 'stable' as const, icon: 'alert' },
        { label: 'Active Incidents', value: '—', change: 0, trend: 'stable' as const, icon: 'alert' },
      ];
    }

    // Find latest month dynamically
    const monthOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const maxYear = Math.max(...emergencyCalls.map(c => c.year));
    const callsMaxYear = emergencyCalls.filter(c => c.year === maxYear);
    const monthsPresent = [...new Set(callsMaxYear.map(c => c.month))];
    const latestMonth = monthsPresent.sort((a, b) => monthOrder.indexOf(b) - monthOrder.indexOf(a))[0];
    const prevMonthIdx = monthOrder.indexOf(latestMonth) - 1;
    const prevMonth = prevMonthIdx >= 0 ? monthOrder[prevMonthIdx] : undefined;

    const latestCalls = emergencyCalls.filter(c => c.month === latestMonth && c.year === maxYear);
    const prevCalls = prevMonth ? emergencyCalls.filter(c => c.month === prevMonth && c.year === maxYear) : [];
    const totalCurrent = latestCalls.reduce((s, c) => s + (c.call_count || 0), 0);
    const totalPrev = prevCalls.reduce((s, c) => s + (c.call_count || 0), 0);
    const changePct = totalPrev ? Math.round(((totalCurrent - totalPrev) / totalPrev) * 100 * 10) / 10 : 0;

    // Emergency vs Non-Emergency breakdown
    const emergencyTotal = latestCalls
      .filter(c => c.call_type === 'Emergency')
      .reduce((s, c) => s + (c.call_count || 0), 0);
    const nonEmergencyTotal = latestCalls
      .filter(c => c.call_type === 'Non-Emergency')
      .reduce((s, c) => s + (c.call_count || 0), 0);
    const emergencyRate = totalCurrent > 0 ? Math.round((emergencyTotal / totalCurrent) * 1000) / 10 : 0;

    const highRiskCount = districts.filter(d => d.publicSafetyPressure === 'HIGH').length;

    return [
      { label: `911 Calls (${latestMonth})`, value: totalCurrent.toLocaleString(), change: changePct, trend: changePct > 0 ? 'up' as const : changePct < 0 ? 'down' as const : 'stable' as const, icon: 'phone' },
      { label: `Emergency Calls (${latestMonth})`, value: emergencyTotal.toLocaleString(), change: 0, trend: 'stable' as const, icon: 'phone' },
      { label: 'High-Risk Districts', value: String(highRiskCount), change: 0, trend: 'stable' as const, icon: 'alert' },
      { label: 'Emergency Rate', value: `${emergencyRate}%`, change: 0, trend: 'stable' as const, icon: 'alert' },
    ];
  })();

  // Build trend data from live calls (months already normalized by service)
  const trendData = (() => {
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
        <TrendChart title="Emergency Call Volume Trend" dataKey="calls911" color="hsl(350 72% 55%)" data={trendData} isLoading={callsLoading} isError={callsError} />
        <DistrictEmergencyChart data={districtCalls} isLoading={districtCallsLoading} isError={districtCallsError} />
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
