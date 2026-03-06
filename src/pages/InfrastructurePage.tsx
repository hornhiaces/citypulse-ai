import { PageHeader } from '@/components/PageHeader';
import { KpiCard } from '@/components/KpiCard';
import { CategoryBreakdown } from '@/components/CategoryBreakdown';
import { TrendChart } from '@/components/TrendChart';
import { DistrictScoreCard } from '@/components/DistrictScoreCard';
import { useMode } from '@/lib/modeContext';
import { districtScores } from '@/lib/mockData';
import type { KpiData } from '@/lib/mockData';

const infraKpis: KpiData[] = [
  { label: 'Active 311 Requests', value: '2,847', change: 12.3, trend: 'up', icon: 'clipboard' },
  { label: 'Resolution Rate', value: '73.4%', change: 5.6, trend: 'up', icon: 'check' },
  { label: 'Avg Resolution Time', value: '6.3 days', change: -12.1, trend: 'down', icon: 'clock' },
  { label: 'Critical Work Orders', value: '23', change: -15, trend: 'down', icon: 'alert' },
];

export default function InfrastructurePage() {
  const { isLeadership } = useMode();
  const stressedDistricts = districtScores.filter(d => d.infrastructureStress === 'HIGH');

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
        <TrendChart title="Service Request Volume" dataKey="requests311" color="hsl(245 58% 60%)" />
        <CategoryBreakdown />
      </div>

      <h2 className="text-lg font-semibold text-foreground mb-3">
        {isLeadership ? 'High-Stress Infrastructure Districts' : 'Areas with Infrastructure Concerns'}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {stressedDistricts.map((d, i) => <DistrictScoreCard key={d.district} data={d} index={i} />)}
      </div>
    </>
  );
}
