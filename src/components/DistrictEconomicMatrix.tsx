import { motion } from 'framer-motion';
import type { DistrictScore } from '@/lib/mockData';

const levelColor: Record<string, string> = {
  STRONG: 'bg-emerald-500',
  HIGH: 'bg-destructive',
  MEDIUM: 'bg-amber-500',
  LOW: 'bg-emerald-500',
  RISING: 'bg-amber-500',
  DECLINING: 'bg-destructive',
  STABLE: 'bg-muted-foreground',
};

const levelBg: Record<string, string> = {
  STRONG: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  HIGH: 'bg-destructive/10 text-destructive border-destructive/20',
  MEDIUM: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  LOW: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  RISING: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  DECLINING: 'bg-destructive/10 text-destructive border-destructive/20',
  STABLE: 'bg-muted text-muted-foreground border-border',
};

export function DistrictEconomicMatrix({ districts }: { districts: DistrictScore[] }) {
  if (!districts.length) return null;

  return (
    <div className="glass-card p-5">
      <h3 className="text-sm font-semibold text-foreground mb-1">District Economic Health Matrix</h3>
      <p className="text-xs text-muted-foreground mb-4">Cross-referencing economic activity with infrastructure and safety signals</p>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border/50">
              <th className="text-left py-2 px-2 text-muted-foreground font-medium">District</th>
              <th className="text-center py-2 px-2 text-muted-foreground font-medium">Economy</th>
              <th className="text-center py-2 px-2 text-muted-foreground font-medium">Infrastructure</th>
              <th className="text-center py-2 px-2 text-muted-foreground font-medium">Safety</th>
              <th className="text-center py-2 px-2 text-muted-foreground font-medium">Confidence</th>
              <th className="text-left py-2 px-2 text-muted-foreground font-medium">Assessment</th>
            </tr>
          </thead>
          <tbody>
            {districts.map((d, i) => {
              const assessment = getAssessment(d);
              return (
                <motion.tr
                  key={d.district}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.04 }}
                  className="border-b border-border/30 hover:bg-secondary/30 transition-colors"
                >
                  <td className="py-2.5 px-2">
                    <span className="font-medium text-foreground">D{d.district}</span>
                    <span className="text-muted-foreground ml-1.5">{d.name}</span>
                  </td>
                  <td className="py-2.5 px-2 text-center">
                    <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full border ${levelBg[d.economicActivity]}`}>
                      {d.economicActivity}
                    </span>
                  </td>
                  <td className="py-2.5 px-2 text-center">
                    <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full border ${levelBg[d.infrastructureStress]}`}>
                      {d.infrastructureStress}
                    </span>
                  </td>
                  <td className="py-2.5 px-2 text-center">
                    <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full border ${levelBg[d.publicSafetyPressure]}`}>
                      {d.publicSafetyPressure}
                    </span>
                  </td>
                  <td className="py-2.5 px-2 text-center">
                    <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full border ${levelBg[d.citizenConfidence]}`}>
                      {d.citizenConfidence}
                    </span>
                  </td>
                  <td className="py-2.5 px-2">
                    <span className={`text-[10px] font-medium ${assessment.color}`}>{assessment.label}</span>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function getAssessment(d: DistrictScore): { label: string; color: string } {
  if (d.economicActivity === 'STRONG' && d.infrastructureStress === 'HIGH') {
    return { label: '⚠️ Protect Investment', color: 'text-amber-400' };
  }
  if (d.economicActivity === 'STRONG' && d.infrastructureStress !== 'HIGH') {
    return { label: '✅ Thriving', color: 'text-emerald-400' };
  }
  if (d.publicSafetyPressure === 'HIGH' && d.economicActivity !== 'STRONG') {
    return { label: '🔴 Intervention Needed', color: 'text-destructive' };
  }
  if (d.infrastructureStress === 'LOW' && d.publicSafetyPressure !== 'HIGH') {
    return { label: '🟢 Growth Ready', color: 'text-emerald-400' };
  }
  if (d.infrastructureStress === 'HIGH') {
    return { label: '🟠 At Risk', color: 'text-amber-400' };
  }
  return { label: '⚪ Stable', color: 'text-muted-foreground' };
}
