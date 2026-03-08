import { motion } from 'framer-motion';
import { DollarSign, TrendingUp, Zap, Building2, ShieldCheck, Wrench } from 'lucide-react';
import type { DistrictScore } from '@/lib/mockData';

interface ROIEstimate {
  title: string;
  description: string;
  estimatedValue: string;
  timeframe: string;
  effort: 'Low' | 'Medium' | 'High';
  confidence: 'High' | 'Medium' | 'Low';
  icon: React.ElementType;
  basis: string;
}

function deriveROIEstimates(
  districts: DistrictScore[],
  stats: { total: number; active: number; expired: number; suspended: number; newLicenses?: number; renewals?: number } | undefined,
): ROIEstimate[] {
  const estimates: ROIEstimate[] = [];
  const avgLicenseFee = 150; // conservative municipal avg
  const avgAnnualTaxPerBusiness = 3200; // avg annual local tax contribution

  // 1. Growth-ready districts: low infra stress, low safety, not yet strong economy
  const growthReady = districts.filter(d =>
    d.economicActivity !== 'STRONG' &&
    d.infrastructureStress === 'LOW' &&
    d.publicSafetyPressure !== 'HIGH'
  );
  if (growthReady.length > 0) {
    // Conservative: attract 50 new businesses per growth-ready district over 12 months
    const newBizPerDistrict = 50;
    const totalNewBiz = growthReady.length * newBizPerDistrict;
    const licenseFeeRevenue = totalNewBiz * avgLicenseFee;
    const taxRevenue = totalNewBiz * avgAnnualTaxPerBusiness;
    const totalROI = licenseFeeRevenue + taxRevenue;

    estimates.push({
      title: 'Business Attraction in Growth Corridors',
      description: `${growthReady.length} district${growthReady.length > 1 ? 's' : ''} have good infrastructure and safety but untapped economic potential. Targeted incentive programs could attract ~${newBizPerDistrict} new businesses per district.`,
      estimatedValue: `$${(totalROI / 1000).toFixed(0)}K`,
      timeframe: '12 months',
      effort: 'Medium',
      confidence: 'Medium',
      icon: Building2,
      basis: `${totalNewBiz} new businesses × ($${avgLicenseFee} license fee + $${avgAnnualTaxPerBusiness.toLocaleString()} avg annual tax)`,
    });
  }

  // 2. Renewal rate optimization — if renewals exist and new licenses are low
  const newLic = stats?.newLicenses ?? 0;
  const renewals = stats?.renewals ?? 0;
  if (newLic > 0 && renewals > 0) {
    const renewalRate = renewals / (stats?.total || 1);
    // If we can increase new license conversion by 10%
    const additionalNew = Math.round(newLic * 0.10);
    const additionalRevenue = additionalNew * (avgLicenseFee + avgAnnualTaxPerBusiness);

    estimates.push({
      title: 'Streamline Business Licensing Process',
      description: `Reducing licensing friction (online applications, faster approvals) could increase new business registrations by ~10%, adding ${additionalNew.toLocaleString()} businesses.`,
      estimatedValue: `$${(additionalRevenue / 1000).toFixed(0)}K`,
      timeframe: '6–12 months',
      effort: 'Low',
      confidence: 'High',
      icon: Zap,
      basis: `10% uplift on ${newLic.toLocaleString()} new licenses × ($${avgLicenseFee} + $${avgAnnualTaxPerBusiness.toLocaleString()} annual tax)`,
    });
  }

  // 3. Protect high-value economic zones from infrastructure decay
  const atRiskEconZones = districts.filter(d => d.economicActivity === 'STRONG' && d.infrastructureStress === 'HIGH');
  if (atRiskEconZones.length > 0) {
    // Estimate businesses at risk based on active licenses proportional to district count
    const bizAtRisk = Math.round((stats?.active || 0) * (atRiskEconZones.length / districts.length));
    const churnRisk = Math.round(bizAtRisk * 0.05); // 5% churn if infrastructure degrades
    const revenueLoss = churnRisk * avgAnnualTaxPerBusiness;

    estimates.push({
      title: 'Prevent Business Flight from Stressed Districts',
      description: `${atRiskEconZones.length} economically strong district${atRiskEconZones.length > 1 ? 's' : ''} face high infrastructure stress. Without intervention, an estimated ${churnRisk.toLocaleString()} businesses could relocate or close.`,
      estimatedValue: `$${(revenueLoss / 1000).toFixed(0)}K saved`,
      timeframe: '6–18 months',
      effort: 'High',
      confidence: 'Medium',
      icon: ShieldCheck,
      basis: `5% churn risk on ~${bizAtRisk.toLocaleString()} businesses × $${avgAnnualTaxPerBusiness.toLocaleString()} avg annual tax`,
    });
  }

  // 4. Safety-driven economic uplift
  const safetyBarrier = districts.filter(d => d.publicSafetyPressure === 'HIGH' && d.economicActivity !== 'STRONG');
  if (safetyBarrier.length > 0) {
    const upliftPerDistrict = 25; // businesses that would open with improved safety
    const totalUplift = safetyBarrier.length * upliftPerDistrict;
    const revenue = totalUplift * (avgLicenseFee + avgAnnualTaxPerBusiness);

    estimates.push({
      title: 'Safety Investment → Economic Dividend',
      description: `Improving public safety in ${safetyBarrier.length} high-pressure district${safetyBarrier.length > 1 ? 's' : ''} would reduce barriers to business entry, potentially unlocking ~${upliftPerDistrict} new businesses per district.`,
      estimatedValue: `$${(revenue / 1000).toFixed(0)}K`,
      timeframe: '12–24 months',
      effort: 'High',
      confidence: 'Low',
      icon: TrendingUp,
      basis: `${totalUplift} new businesses × ($${avgLicenseFee} + $${avgAnnualTaxPerBusiness.toLocaleString()} annual tax)`,
    });
  }

  return estimates;
}

const effortColor = {
  Low: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  Medium: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  High: 'bg-destructive/10 text-destructive border-destructive/20',
};

const confidenceColor = {
  High: 'text-emerald-400',
  Medium: 'text-amber-400',
  Low: 'text-muted-foreground',
};

export function EconomicROIPanel({
  districts,
  stats,
}: {
  districts: DistrictScore[];
  stats: { total: number; active: number; expired: number; suspended: number; newLicenses?: number; renewals?: number } | undefined;
}) {
  const estimates = deriveROIEstimates(districts, stats);

  if (estimates.length === 0) return null;

  const totalEstimatedValue = estimates.reduce((sum, e) => {
    const match = e.estimatedValue.match(/\$([\d,]+)K/);
    return sum + (match ? parseInt(match[1].replace(',', ''), 10) * 1000 : 0);
  }, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-primary" />
          Quick Win ROI Estimates
        </h2>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Combined potential:</span>
          <span className="text-sm font-bold text-primary font-mono">
            ${(totalEstimatedValue / 1000).toFixed(0)}K+
          </span>
        </div>
      </div>
      <p className="text-xs text-muted-foreground -mt-2">
        Conservative projections based on current municipal data · Avg license fee: $150 · Avg annual tax contribution per business: $3,200
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {estimates.map((est, i) => (
          <motion.div
            key={est.title}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="glass-card p-5 border border-border/50 hover:border-primary/30 transition-colors"
          >
            <div className="flex items-start gap-3 mb-3">
              <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                <est.icon className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-foreground">{est.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed mt-1">{est.description}</p>
              </div>
            </div>

            {/* Value + Metadata */}
            <div className="bg-card/50 rounded-lg p-3 border border-border/50 mb-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl font-bold text-primary font-mono">{est.estimatedValue}</span>
                <span className="text-xs text-muted-foreground">{est.timeframe}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-muted-foreground">Effort:</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${effortColor[est.effort]}`}>
                    {est.effort}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-muted-foreground">Confidence:</span>
                  <span className={`text-[10px] font-medium ${confidenceColor[est.confidence]}`}>
                    {est.confidence}
                  </span>
                </div>
              </div>
            </div>

            {/* Calculation basis */}
            <div className="flex items-start gap-1.5">
              <Wrench className="h-3 w-3 text-muted-foreground shrink-0 mt-0.5" />
              <p className="text-[10px] text-muted-foreground leading-relaxed italic">{est.basis}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <p className="text-[10px] text-muted-foreground/60 text-center pt-1">
        Estimates are projections based on available municipal data and industry averages. Actual results will vary based on implementation and market conditions.
      </p>
    </div>
  );
}
