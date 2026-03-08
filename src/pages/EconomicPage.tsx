import { PageHeader } from '@/components/PageHeader';
import { KpiCard } from '@/components/KpiCard';
import { DistrictScoreCard } from '@/components/DistrictScoreCard';
import { LicenseTrendChart } from '@/components/LicenseTrendChart';
import { DistrictEconomicMatrix } from '@/components/DistrictEconomicMatrix';
import { EconomicInsightPanel } from '@/components/EconomicInsightPanel';
import { EconomicROIPanel } from '@/components/EconomicROIPanel';
import { useMode } from '@/lib/modeContext';
import {
  useDistrictScores,
  useBusinessLicenseStats,
  useBusinessLicenses,
  useBusinessTypeBreakdown,
  useLicenseIssuanceTrends,
} from '@/hooks/useDistrictData';
import type { KpiData } from '@/lib/mockData';
import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const PIE_COLORS = [
  'hsl(245 58% 60%)',
  'hsl(152 69% 45%)',
  'hsl(38 92% 50%)',
  'hsl(350 72% 55%)',
  'hsl(200 70% 50%)',
  'hsl(280 60% 55%)',
  'hsl(170 60% 45%)',
  'hsl(20 80% 55%)',
  'hsl(310 50% 50%)',
  'hsl(60 70% 45%)',
  'hsl(230 50% 55%)',
  'hsl(100 50% 45%)',
];

export default function EconomicPage() {
  const { isLeadership } = useMode();
  const { districts, isLoading: districtsLoading } = useDistrictScores();
  const { data: stats } = useBusinessLicenseStats();
  const { data: licenses } = useBusinessLicenses();
  const { data: typeBreakdown, isLoading: typesLoading } = useBusinessTypeBreakdown();
  const { data: issuanceTrends, isLoading: trendsLoading } = useLicenseIssuanceTrends();

  const econKpis: KpiData[] = (() => {
    if (!stats) {
      return [
        { label: 'Active Business Licenses', value: '—', change: 0, trend: 'stable' as const, icon: 'building' },
        { label: 'New Licenses Issued', value: '—', change: 0, trend: 'stable' as const, icon: 'thumbs-up' },
        { label: 'License Renewals', value: '—', change: 0, trend: 'stable' as const, icon: 'check' },
        { label: 'Renewal-to-New Ratio', value: '—', change: 0, trend: 'stable' as const, icon: 'clipboard' },
      ];
    }
    const ratio = (stats.newLicenses ?? 0) > 0 ? ((stats.renewals ?? 0) / stats.newLicenses!).toFixed(1) : '—';
    return [
      { label: 'Active Business Licenses', value: stats.active.toLocaleString(), change: 0, trend: 'stable' as const, icon: 'building' },
      { label: 'New Licenses Issued', value: (stats.newLicenses ?? 0).toLocaleString(), change: 0, trend: 'up' as const, icon: 'thumbs-up' },
      { label: 'License Renewals', value: (stats.renewals ?? 0).toLocaleString(), change: 0, trend: 'stable' as const, icon: 'check' },
      { label: 'Renewal-to-New Ratio', value: `${ratio}:1`, change: 0, trend: 'stable' as const, icon: 'clipboard' },
    ];
  })();

  // Build sector breakdown from live data
  const topSectors = (() => {
    if (!licenses?.length) return [];
    const catMap: Record<string, number> = {};
    licenses.filter(l => l.status === 'active').forEach(l => {
      const cat = l.category || l.business_type || 'Other';
      catMap[cat] = (catMap[cat] || 0) + 1;
    });
    return Object.entries(catMap)
      .map(([sector, count]) => ({ sector, licenses: count }))
      .sort((a, b) => b.licenses - a.licenses)
      .slice(0, 8);
  })();

  const maxLicenses = topSectors[0]?.licenses || 1;
  const strongDistricts = districts.filter(d => d.economicActivity === 'STRONG');

  // Prepare pie chart data from type breakdown
  const pieData = (typeBreakdown || []).slice(0, 8).map(t => ({
    name: t.type.length > 30 ? t.type.slice(0, 28) + '…' : t.type,
    fullName: t.type,
    value: t.count,
  }));

  return (
    <>
      <PageHeader
        title={isLeadership ? 'Economic Activity Signals' : 'Economic Activity'}
        subtitle={isLeadership ? 'Business license trends, sector analysis, and economic development indicators' : 'See how Montgomery\'s economy is growing'}
        badge="Economic"
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {econKpis.map((k, i) => <KpiCard key={k.label} data={k} index={i} />)}
      </div>

      {/* Leadership: Actionable Intelligence */}
      {isLeadership && (
        <div className="mb-6">
          <EconomicInsightPanel districts={districts} stats={stats} />
        </div>
      )}

      {/* Leadership: ROI Quick Wins */}
      {isLeadership && (
        <div className="mb-6">
          <EconomicROIPanel districts={districts} stats={stats} />
        </div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <LicenseTrendChart data={issuanceTrends} isLoading={trendsLoading} />

        {/* Business Type Donut */}
        <div className="glass-card p-5 flex flex-col">
          <h3 className="text-sm font-semibold text-foreground mb-1">Business Sector Distribution</h3>
          <p className="text-xs text-muted-foreground mb-3">Top sectors by active license count</p>
          {typesLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <Skeleton className="h-40 w-40 rounded-full" />
            </div>
          ) : pieData.length === 0 ? (
            <p className="text-sm text-muted-foreground flex-1 flex items-center justify-center">No data available</p>
          ) : (
            <div className="flex-1 min-h-0 flex items-center">
              <div className="w-1/2 h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      paddingAngle={2}
                    >
                      {pieData.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        fontSize: '11px',
                        color: 'hsl(var(--foreground))',
                      }}
                      formatter={(value: number, name: string, entry: any) => [
                        value.toLocaleString(),
                        entry.payload.fullName || name,
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-1/2 space-y-1.5 pl-2">
                {pieData.map((d, i) => (
                  <div key={d.name} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                    <span className="text-[10px] text-muted-foreground truncate flex-1">{d.name}</span>
                    <span className="text-[10px] font-mono text-foreground">{d.value.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Category Breakdown Bar */}
      <div className="glass-card p-5 mb-6">
        <h3 className="text-sm font-semibold text-foreground mb-4">Business Activity by Category</h3>
        {topSectors.length === 0 ? (
          <p className="text-sm text-muted-foreground">No business license data available.</p>
        ) : (
          <div className="space-y-3">
            {topSectors.map((s, i) => (
              <motion.div key={s.sector} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="flex items-center gap-2 sm:gap-4">
                <span className="text-xs text-muted-foreground w-24 sm:w-36 truncate shrink-0">{s.sector}</span>
                <div className="flex-1 h-2 rounded-full bg-secondary overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(s.licenses / maxLicenses) * 100}%` }}
                    transition={{ delay: i * 0.05 + 0.2, duration: 0.6 }}
                    className="h-full rounded-full bg-primary/60"
                  />
                </div>
                <span className="text-xs font-mono text-foreground w-12 text-right">{s.licenses.toLocaleString()}</span>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Leadership: District Economic Matrix */}
      {isLeadership && (
        <div className="mb-6">
          <DistrictEconomicMatrix districts={districts} />
        </div>
      )}

      <h2 className="text-lg font-semibold text-foreground mb-3">
        {isLeadership ? 'Economically Strong Districts' : 'Growing Neighborhoods'}
      </h2>
      {districtsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3].map(i => <Skeleton key={i} className="h-48 rounded-xl" />)}
        </div>
      ) : strongDistricts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {strongDistricts.map((d, i) => <DistrictScoreCard key={d.district} data={d} index={i} />)}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No economically strong districts detected.</p>
      )}
    </>
  );
}
