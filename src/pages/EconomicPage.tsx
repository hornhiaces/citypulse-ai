import { PageHeader } from '@/components/PageHeader';
import { KpiCard } from '@/components/KpiCard';
import { DistrictScoreCard } from '@/components/DistrictScoreCard';
import { useMode } from '@/lib/modeContext';
import { useDistrictScores, useBusinessLicenseStats, useBusinessLicenses } from '@/hooks/useDistrictData';
import type { KpiData } from '@/lib/mockData';
import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';

export default function EconomicPage() {
  const { isLeadership } = useMode();
  const { districts, isLoading: districtsLoading } = useDistrictScores();
  const { data: stats } = useBusinessLicenseStats();
  const { data: licenses } = useBusinessLicenses();

  const econKpis: KpiData[] = (() => {
    if (!stats) {
      return [
        { label: 'Active Business Licenses', value: '—', change: 0, trend: 'stable' as const, icon: 'building' },
        { label: 'Total Licenses', value: '—', change: 0, trend: 'stable' as const, icon: 'clipboard' },
        { label: 'Expired Licenses', value: '—', change: 0, trend: 'stable' as const, icon: 'clock' },
        { label: 'Suspended', value: '—', change: 0, trend: 'stable' as const, icon: 'alert' },
      ];
    }
    return [
      { label: 'Active Business Licenses', value: stats.active.toLocaleString(), change: 0, trend: 'stable' as const, icon: 'building' },
      { label: 'Total Licenses', value: stats.total.toLocaleString(), change: 0, trend: 'stable' as const, icon: 'clipboard' },
      { label: 'Expired Licenses', value: stats.expired.toLocaleString(), change: 0, trend: 'stable' as const, icon: 'clock' },
      { label: 'Suspended', value: stats.suspended.toLocaleString(), change: 0, trend: 'stable' as const, icon: 'alert' },
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
      .map(([sector, count]) => ({ sector, licenses: count, growth: 0 }))
      .sort((a, b) => b.licenses - a.licenses)
      .slice(0, 8);
  })();

  const maxLicenses = topSectors[0]?.licenses || 1;
  const strongDistricts = districts.filter(d => d.economicActivity === 'STRONG');

  return (
    <>
      <PageHeader
        title={isLeadership ? 'Economic Activity Signals' : 'Economic Activity'}
        subtitle={isLeadership ? 'Business license trends and economic development indicators' : 'See how Montgomery\'s economy is growing'}
        badge="Economic"
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {econKpis.map((k, i) => <KpiCard key={k.label} data={k} index={i} />)}
      </div>

      {/* Top Sectors */}
      <div className="glass-card p-5 mb-6">
        <h3 className="text-sm font-semibold text-foreground mb-4">Business Activity by Sector</h3>
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
                <span className="text-xs font-mono text-foreground w-12 text-right">{s.licenses}</span>
              </motion.div>
            ))}
          </div>
        )}
      </div>

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
