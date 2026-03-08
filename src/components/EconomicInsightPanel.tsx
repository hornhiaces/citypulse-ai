import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, AlertTriangle, Target, ShieldCheck, Building2, Lightbulb } from 'lucide-react';
import type { DistrictScore } from '@/lib/mockData';

interface EconomicInsight {
  title: string;
  description: string;
  action: string;
  severity: 'critical' | 'warning' | 'opportunity';
  icon: React.ElementType;
  districts?: string[];
}

function deriveInsights(
  districts: DistrictScore[],
  stats: { total: number; active: number; expired: number; suspended: number; newLicenses: number; renewals: number } | undefined,
): EconomicInsight[] {
  const insights: EconomicInsight[] = [];

  // 1. Districts with strong economy but high infrastructure stress = investment priority
  const investmentTargets = districts.filter(d => d.economicActivity === 'STRONG' && d.infrastructureStress === 'HIGH');
  if (investmentTargets.length > 0) {
    insights.push({
      title: 'Infrastructure Investment Needed in Growth Zones',
      description: `${investmentTargets.length} district${investmentTargets.length > 1 ? 's' : ''} show${investmentTargets.length === 1 ? 's' : ''} strong economic activity but high infrastructure stress. Deteriorating infrastructure threatens to undermine business growth and tax revenue.`,
      action: 'Prioritize capital improvement budgets for these districts to protect economic momentum.',
      severity: 'critical',
      icon: AlertTriangle,
      districts: investmentTargets.map(d => `District ${d.district} (${d.name})`),
    });
  }

  // 2. Districts with weak economy AND high safety pressure = intervention zones
  const interventionZones = districts.filter(d => d.economicActivity !== 'STRONG' && d.publicSafetyPressure === 'HIGH');
  if (interventionZones.length > 0) {
    insights.push({
      title: 'Economic Intervention Zones Identified',
      description: `${interventionZones.length} district${interventionZones.length > 1 ? 's' : ''} have moderate-to-low economic activity combined with high public safety pressure — a pattern that discourages new business formation.`,
      action: 'Consider targeted incentive programs (tax abatements, safety patrols) to attract business investment.',
      severity: 'warning',
      icon: ShieldCheck,
      districts: interventionZones.map(d => `District ${d.district} (${d.name})`),
    });
  }

  // 3. New license velocity
  if (stats && stats.newLicenses > 0) {
    const renewalRatio = stats.renewals / (stats.newLicenses || 1);
    if (renewalRatio > 2.5) {
      insights.push({
        title: 'Low New Business Formation Rate',
        description: `The renewal-to-new license ratio is ${renewalRatio.toFixed(1)}:1 — existing businesses are renewing, but new business starts are lagging. This suggests barriers to entry for entrepreneurs.`,
        action: 'Review permitting timelines, licensing fees, and small business support programs to reduce friction.',
        severity: 'warning',
        icon: Lightbulb,
      });
    } else {
      insights.push({
        title: 'Healthy New Business Formation',
        description: `${stats.newLicenses.toLocaleString()} new licenses issued alongside ${stats.renewals.toLocaleString()} renewals — a healthy ratio indicating both stability and growth.`,
        action: 'Maintain current business-friendly policies and monitor for emerging sector opportunities.',
        severity: 'opportunity',
        icon: TrendingUp,
      });
    }
  }

  // 4. Districts with stable/low economy but good infrastructure = growth opportunity
  const growthOpportunities = districts.filter(d =>
    d.economicActivity !== 'STRONG' &&
    d.infrastructureStress === 'LOW' &&
    d.publicSafetyPressure !== 'HIGH'
  );
  if (growthOpportunities.length > 0) {
    insights.push({
      title: 'Untapped Growth Corridors',
      description: `${growthOpportunities.length} district${growthOpportunities.length > 1 ? 's' : ''} have good infrastructure and low safety concerns but moderate economic activity — ideal targets for business attraction campaigns.`,
      action: 'Launch targeted marketing and incentive programs to attract businesses to these well-positioned districts.',
      severity: 'opportunity',
      icon: Target,
      districts: growthOpportunities.map(d => `District ${d.district} (${d.name})`),
    });
  }

  return insights;
}

const severityStyles = {
  critical: {
    border: 'border-destructive/30',
    bg: 'bg-destructive/5',
    iconBg: 'bg-destructive/10',
    iconColor: 'text-destructive',
    badge: 'bg-destructive/10 text-destructive border-destructive/20',
    badgeLabel: 'Action Required',
  },
  warning: {
    border: 'border-amber-500/30',
    bg: 'bg-amber-500/5',
    iconBg: 'bg-amber-500/10',
    iconColor: 'text-amber-400',
    badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    badgeLabel: 'Monitor',
  },
  opportunity: {
    border: 'border-emerald-500/30',
    bg: 'bg-emerald-500/5',
    iconBg: 'bg-emerald-500/10',
    iconColor: 'text-emerald-400',
    badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    badgeLabel: 'Opportunity',
  },
};

export function EconomicInsightPanel({
  districts,
  stats,
}: {
  districts: DistrictScore[];
  stats: { total: number; active: number; expired: number; suspended: number; newLicenses: number; renewals: number } | undefined;
}) {
  const insights = deriveInsights(districts, stats);

  if (insights.length === 0) return null;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
        <Lightbulb className="h-5 w-5 text-primary" />
        Actionable Economic Intelligence
      </h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {insights.map((insight, i) => {
          const style = severityStyles[insight.severity];
          return (
            <motion.div
              key={insight.title}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className={`glass-card p-5 border ${style.border} ${style.bg}`}
            >
              <div className="flex items-start gap-3 mb-3">
                <div className={`p-2 rounded-lg ${style.iconBg} shrink-0`}>
                  <insight.icon className={`h-4 w-4 ${style.iconColor}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="text-sm font-semibold text-foreground">{insight.title}</h3>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border ${style.badge}`}>
                      {style.badgeLabel}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{insight.description}</p>
                </div>
              </div>

              <div className="bg-card/50 rounded-lg p-3 border border-border/50">
                <p className="text-xs font-medium text-foreground flex items-center gap-1.5">
                  <Target className="h-3 w-3 text-primary shrink-0" />
                  Recommended Action
                </p>
                <p className="text-xs text-muted-foreground mt-1">{insight.action}</p>
              </div>

              {insight.districts && insight.districts.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {insight.districts.map(d => (
                    <span key={d} className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground border border-border/50">
                      {d}
                    </span>
                  ))}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
