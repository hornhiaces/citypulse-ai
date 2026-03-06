import { PageHeader } from '@/components/PageHeader';
import { KpiCard } from '@/components/KpiCard';
import { TrendChart } from '@/components/TrendChart';
import { DistrictEmergencyChart } from '@/components/DistrictEmergencyChart';
import { DistrictScoreCard } from '@/components/DistrictScoreCard';
import { useMode } from '@/lib/modeContext';
import { districtScores } from '@/lib/mockData';
import type { KpiData } from '@/lib/mockData';

const safetyKpis: KpiData[] = [
  { label: '911 Calls (30d)', value: '18,432', change: -3.2, trend: 'down', icon: 'phone' },
  { label: 'Avg Response Time', value: '4.2 min', change: -8.1, trend: 'down', icon: 'clock' },
  { label: 'High-Risk Districts', value: '3', change: 0, trend: 'stable', icon: 'alert' },
  { label: 'Active Incidents', value: '47', change: 12, trend: 'up', icon: 'alert' },
];

export default function SafetyPage() {
  const { isLeadership } = useMode();
  const highRiskDistricts = districtScores.filter(d => d.publicSafetyPressure === 'HIGH');

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
        <TrendChart title="Emergency Call Volume Trend" dataKey="calls911" color="hsl(350 72% 55%)" />
        <DistrictEmergencyChart />
      </div>

      <h2 className="text-lg font-semibold text-foreground mb-3">
        {isLeadership ? 'High-Risk Districts' : 'Areas of Concern'}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {highRiskDistricts.map((d, i) => <DistrictScoreCard key={d.district} data={d} index={i} />)}
      </div>
    </>
  );
}
