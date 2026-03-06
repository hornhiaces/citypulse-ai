import { PageHeader } from '@/components/PageHeader';
import { KpiCard } from '@/components/KpiCard';
import { DistrictScoreCard } from '@/components/DistrictScoreCard';
import { useMode } from '@/lib/modeContext';
import { districtScores } from '@/lib/mockData';
import type { KpiData } from '@/lib/mockData';
import { motion } from 'framer-motion';

const econKpis: KpiData[] = [
  { label: 'Active Business Licenses', value: '12,891', change: 2.1, trend: 'up', icon: 'building' },
  { label: 'New Applications (30d)', value: '234', change: 8.5, trend: 'up', icon: 'clipboard' },
  { label: 'Avg Processing Time', value: '12 days', change: -18, trend: 'down', icon: 'clock' },
  { label: 'Renewal Rate', value: '87.2%', change: 3.1, trend: 'up', icon: 'check' },
];

const topSectors = [
  { sector: 'Food & Beverage', licenses: 2340, growth: 5.2 },
  { sector: 'Professional Services', licenses: 1890, growth: 3.8 },
  { sector: 'Retail', licenses: 1650, growth: -2.1 },
  { sector: 'Healthcare', licenses: 1420, growth: 7.3 },
  { sector: 'Construction', licenses: 1180, growth: 12.5 },
  { sector: 'Technology', licenses: 890, growth: 18.2 },
];

export default function EconomicPage() {
  const { isLeadership } = useMode();
  const strongDistricts = districtScores.filter(d => d.economicActivity === 'STRONG');

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
        <div className="space-y-3">
          {topSectors.map((s, i) => (
            <motion.div key={s.sector} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="flex items-center gap-4">
              <span className="text-xs text-muted-foreground w-36">{s.sector}</span>
              <div className="flex-1 h-2 rounded-full bg-secondary overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(s.licenses / 2340) * 100}%` }}
                  transition={{ delay: i * 0.05 + 0.2, duration: 0.6 }}
                  className="h-full rounded-full bg-primary/60"
                />
              </div>
              <span className="text-xs font-mono text-foreground w-12 text-right">{s.licenses}</span>
              <span className={`text-xs font-mono w-14 text-right ${s.growth > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {s.growth > 0 ? '+' : ''}{s.growth}%
              </span>
            </motion.div>
          ))}
        </div>
      </div>

      <h2 className="text-lg font-semibold text-foreground mb-3">
        {isLeadership ? 'Economically Strong Districts' : 'Growing Neighborhoods'}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {strongDistricts.map((d, i) => <DistrictScoreCard key={d.district} data={d} index={i} />)}
      </div>
    </>
  );
}
