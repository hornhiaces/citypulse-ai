import { PageHeader } from '@/components/PageHeader';
import { KpiCard } from '@/components/KpiCard';
import { CategoryBreakdown } from '@/components/CategoryBreakdown';
import { DistrictComparisonChart } from '@/components/DistrictComparisonChart';
import { TrendChart } from '@/components/TrendChart';
import { useMode } from '@/lib/modeContext';
import {
  useDistrictScores,
  useServiceRequestStats,
  useEmergencyCalls,
  useBusinessLicenseStats,
} from '@/hooks/useDistrictData';
import type { KpiData } from '@/lib/mockData';
import { MONTH_ORDER } from '@/lib/dateUtils';
import { motion } from 'framer-motion';
import { FileText, Database, Shield, Building2 } from 'lucide-react';

const datasetInfo = [
  { name: '311 Service Requests', icon: FileText, desc: 'Community-reported issues and city service requests' },
  { name: '911 Emergency Calls', icon: Shield, desc: 'Monthly emergency and non-emergency call volumes' },
  { name: 'Business Licenses', icon: Building2, desc: 'Active and historical business license records' },
  { name: 'District Intelligence', icon: Database, desc: 'Computed risk and performance scores per district' },
];

export default function TransparencyPage() {
  const { isLeadership } = useMode();
  const { districts } = useDistrictScores();
  const { data: stats311 } = useServiceRequestStats();
  const { data: emergencyCalls, isLoading: callsLoading, error: callsError } = useEmergencyCalls();
  const { data: bizStats } = useBusinessLicenseStats();

  const transparencyKpis: KpiData[] = [
    {
      label: 'Total Community Reports',
      value: stats311?.total?.toLocaleString() ?? '—',
      change: 0, trend: 'stable', icon: 'clipboard',
    },
    {
      label: 'Issues Resolved',
      value: stats311?.resolved?.toLocaleString() ?? '—',
      change: stats311 ? Math.round((stats311.resolved / (stats311.total || 1)) * 100) : 0,
      trend: 'up', icon: 'check',
    },
    {
      label: 'Active Businesses',
      value: bizStats?.active?.toLocaleString() ?? '—',
      change: 0, trend: 'stable', icon: 'building',
    },
    {
      label: 'Districts Monitored',
      value: String(districts.length),
      change: 0, trend: 'stable', icon: 'alert',
    },
  ];

  const trendData = (() => {
    if (!emergencyCalls?.length) return undefined;
    const grouped: Record<string, number> = {};
    emergencyCalls.forEach(c => {
      grouped[c.month] = (grouped[c.month] || 0) + (c.call_count || 0);
    });
    return MONTH_ORDER.filter(m => grouped[m] !== undefined).map(m => ({ month: m, calls911: grouped[m] || 0 }));
  })();

  return (
    <>
      <PageHeader
        title={isLeadership ? 'Civic Transparency & Open Data' : 'City Transparency Dashboard'}
        subtitle={isLeadership ? 'Public-facing data transparency and accountability metrics' : 'See exactly what data the city tracks and how it\'s being used'}
        badge="Open Data"
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {transparencyKpis.map((k, i) => <KpiCard key={k.label} data={k} index={i} />)}
      </div>

      {/* Open Datasets */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-foreground mb-3">Open Datasets</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {datasetInfo.map((ds, i) => (
            <motion.div
              key={ds.name}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="glass-card p-4 flex items-start gap-3"
            >
              <div className="p-2 rounded-lg bg-primary/10">
                <ds.icon className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">{ds.name}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{ds.desc}</p>
                <span className="inline-block mt-1.5 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Live · Updated continuously
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <TrendChart title="Emergency Call Volume" dataKey="calls911" color="hsl(350 72% 55%)" data={trendData} isLoading={callsLoading} error={callsError} />
        <CategoryBreakdown data={stats311?.categoryBreakdown} />
      </div>

      {/* District Comparison */}
      <div className="mb-6">
        <DistrictComparisonChart districts={districts} />
      </div>
    </>
  );
}
