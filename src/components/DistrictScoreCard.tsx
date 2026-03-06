import { motion } from 'framer-motion';
import { MapPin } from 'lucide-react';
import type { DistrictScore } from '@/lib/mockData';
import { getScoreBadgeClass } from '@/lib/mockData';
import { useMode } from '@/lib/modeContext';

export function DistrictScoreCard({ data, index }: { data: DistrictScore; index: number }) {
  const { isLeadership } = useMode();

  const scores = [
    { label: isLeadership ? 'Public Safety Pressure' : 'Safety', value: data.publicSafetyPressure },
    { label: isLeadership ? 'Infrastructure Stress' : 'Infrastructure', value: data.infrastructureStress },
    { label: isLeadership ? 'Emergency Demand' : 'Emergencies', value: data.emergencyDemand },
    { label: isLeadership ? 'Economic Activity' : 'Economy', value: data.economicActivity },
    { label: isLeadership ? 'Citizen Confidence' : 'Community Confidence', value: data.citizenConfidence },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.4 }}
      className="glass-card p-5 hover:glow-border transition-all duration-300"
    >
      <div className="flex items-center gap-2 mb-4">
        <div className="p-1.5 rounded-md bg-primary/10">
          <MapPin className="h-4 w-4 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-sm text-foreground">District {data.district}</h3>
          <p className="text-xs text-muted-foreground">{data.name}</p>
        </div>
      </div>

      <div className="space-y-2">
        {scores.map((s) => (
          <div key={s.label} className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{s.label}</span>
            <span className={getScoreBadgeClass(s.value)}>{s.value}</span>
          </div>
        ))}
      </div>

      {isLeadership && (
        <div className="mt-3 pt-3 border-t border-border/50">
          <p className="text-xs text-muted-foreground">Pop. {data.population.toLocaleString()} · {data.area}</p>
        </div>
      )}
    </motion.div>
  );
}
